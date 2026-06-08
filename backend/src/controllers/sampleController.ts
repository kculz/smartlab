import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Sample from '../models/Sample.js';
import SampleTest from '../models/SampleTest.js';
import Patient from '../models/Patient.js';
import Test from '../models/Test.js';
import Result from '../models/Result.js';
import {
  getSampleEmailContext,
  queueNotificationDelivery,
  sendInternalWorkflowNotificationEmails,
  sendSampleStatusUpdateEmail,
} from '../services/notification.service.js';
import { logError, logInfo, logWarn } from '../utils/logger.js';
import sequelize from '../config/database.js';

const getSampleInternalRoles = (stage?: string, status?: string): string[] => {
  const roles = new Set<string>();

  switch (stage) {
    case 'Reception':
      roles.add('receptionist');
      break;
    case 'Lab':
      roles.add('lab_technician');
      break;
    case 'Doctor Review':
      roles.add('receptionist');
      break;
    case 'Completed':
      roles.add('receptionist');
      break;
    default:
      break;
  }

  if (status === 'Released') {
    roles.add('receptionist');
  }

  return [...roles];
};

export const createSample = async (
  req: Request & { user?: any },
  res: Response
): Promise<void> => {
  try {
    logInfo('Create sample request started', { body: req.body, userId: req.user?.userId });
    const { patient_id, test_ids, notes, specimen_type, priority } = req.body;

    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      logWarn('Create sample failed: patient not found', { patient_id });
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    const tests = await Test.findAll({ where: { id: test_ids } });
    if (tests.length !== test_ids.length) {
      const foundIds = tests.map((test) => test.id);
      const missingIds = test_ids.filter((testId: number) => !foundIds.includes(testId));
      logWarn('Create sample failed: tests not found', { missingIds });
      res.status(404).json({
        success: false,
        message: `Some requested tests were not found: ${missingIds.join(', ')}`,
      });
      return;
    }

    const sample_id = `SM-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;

    const sample = await sequelize.transaction(async (transaction) => {
      const createdSample = await Sample.create(
        {
          sample_id,
          patient_id,
          registered_by: req.user.userId,
          specimen_type,
          priority,
          notes,
        },
        { transaction }
      );

      for (const test_id of test_ids) {
        await SampleTest.create(
          {
            sample_id: createdSample.id,
            test_id,
          },
          { transaction }
        );
      }

      return createdSample;
    });

    res.status(201).json({
      success: true,
      message: 'Sample created successfully',
      data: {
        ...sample.toJSON(),
        sample_id,
        specimen_type: specimen_type || sample.specimen_type,
        priority: priority || sample.priority,
        tests,
      },
    });
    logInfo('Create sample successful', { sampleId: sample.id, sampleCode: sample_id });

    const patientName = `${patient.first_name} ${patient.last_name}`.trim();
    const testNames = tests.map((test) => test.name).join(', ');

    queueNotificationDelivery(
      'Sample created patient email',
      sendSampleStatusUpdateEmail({
        patientName,
        email: patient.email,
        sampleId: sample.sample_id,
        testNames,
        status: sample.current_status,
        stage: sample.current_stage,
        subject: `Sample Registered - ${sample.sample_id}`,
      })
    );

    queueNotificationDelivery(
      'Sample created reception email',
      sendInternalWorkflowNotificationEmails(['receptionist'], `New sample registered - ${sample.sample_id}`, {
        title: 'New Sample Registered',
        summary: `A new sample for ${patientName} has been registered and is ready for reception follow-up.`,
        patientName,
        sampleId: sample.sample_id,
        testNames,
        status: sample.current_status,
        stage: sample.current_stage,
      })
    );

    queueNotificationDelivery(
      'Sample created lab email',
      sendInternalWorkflowNotificationEmails(['lab_technician'], `Sample ready for lab processing - ${sample.sample_id}`, {
        title: 'Sample Ready for Lab Processing',
        summary: `A new sample for ${patientName} has been registered and is ready for lab processing.`,
        patientName,
        sampleId: sample.sample_id,
        testNames,
        status: sample.current_status,
        stage: sample.current_stage,
      })
    );
  } catch (error) {
    logError('Create sample error', { error });
    res.status(500).json({ success: false, message: 'Failed to create sample due to an unexpected server error' });
  }
};

export const getSamples = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    logInfo('Get samples request started', { query: req.query, user: (req as any).user });
    const { status, patient_id, limit = 10, offset = 0 } = req.query;

    const where: any = {};
    if (status) where.current_status = status;

    // Security check: restrict patients to only fetch their own samples
    if ((req as any).user?.role === 'patient') {
      const patient = await Patient.findOne({ where: { user_id: (req as any).user.userId } });
      if (!patient) {
        logWarn('Get samples failed: patient profile not found for user', { userId: (req as any).user.userId });
        res.status(404).json({ success: false, message: 'Patient profile not found' });
        return;
      }
      where.patient_id = patient.id;
    } else if (patient_id) {
      where.patient_id = patient_id;
    }

    const { count, rows } = await Sample.findAndCountAll({
      where,
      include: [
        { model: Patient, attributes: ['id', 'first_name', 'last_name', 'email'] },
        {
          model: SampleTest,
          include: [
            { model: Test },
            { model: Result }
          ],
        },
      ],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
    logInfo('Get samples successful', { count, limit, offset });
  } catch (error) {
    logError('Get samples error', { error });
    res.status(500).json({ success: false, message: 'Failed to get samples due to an unexpected server error' });
  }
};

export const getSample = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Get sample request started', { id: req.params.id });
    const { id } = req.params;

    const sample = await Sample.findByPk(id, {
      include: [
        { model: Patient },
        {
          model: SampleTest,
          include: [
            { model: Test },
            { model: Result }
          ],
        },
      ],
    });

    if (!sample) {
      logWarn('Get sample failed: not found', { id });
      res.status(404).json({ success: false, message: 'Sample not found' });
      return;
    }

    res.json({ success: true, data: sample });
    logInfo('Get sample successful', { id });
  } catch (error) {
    logError('Get sample error', { error, id: req.params.id });
    res.status(500).json({ success: false, message: 'Failed to get sample due to an unexpected server error' });
  }
};

export const updateSampleStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    logInfo('Update sample status request started', { id: req.params.id, body: req.body, userId: (req as any).user?.userId });
    const { id } = req.params;
    const { current_status, current_stage, notes } = req.body;

    const sample = await Sample.findByPk(id, {
      include: [{ model: Patient }],
    });

    if (!sample) {
      logWarn('Update sample status failed: not found', { id });
      res.status(404).json({ success: false, message: 'Sample not found' });
      return;
    }

    await sample.update({
      current_status: current_status || sample.current_status,
      current_stage: current_stage || sample.current_stage,
      notes: notes || sample.notes,
    });

    const emailContext = await getSampleEmailContext(sample.id);
    if (emailContext) {
      const nextStage = current_stage || sample.current_stage;
      const nextStatus = current_status || sample.current_status;
      const internalRoles = getSampleInternalRoles(nextStage, nextStatus);

      queueNotificationDelivery(
        'Sample status patient email',
        sendSampleStatusUpdateEmail({
          patientName: emailContext.patientName,
          email: emailContext.patient.email,
          sampleId: emailContext.sample.sample_id,
          testNames: emailContext.testNames,
          status: nextStatus,
          stage: nextStage,
          subject: `Sample Status Updated - ${emailContext.sample.sample_id}`,
        })
      );

      if (internalRoles.length > 0) {
        const internalTitle =
          nextStage === 'Lab'
            ? 'Sample Ready for Lab Work'
            : nextStage === 'Doctor Review'
              ? 'Sample Pending Doctor Review'
              : nextStage === 'Completed'
                ? 'Sample Completed'
                : 'Sample Status Updated';

        const internalSummary =
          nextStage === 'Lab'
            ? `Sample ${emailContext.sample.sample_id} is now in the lab stage for processing.`
            : nextStage === 'Doctor Review'
              ? `Sample ${emailContext.sample.sample_id} is awaiting doctor review.`
              : nextStage === 'Completed'
                ? `Sample ${emailContext.sample.sample_id} has reached completion.`
                : `Sample ${emailContext.sample.sample_id} status changed to ${nextStatus}.`;

        queueNotificationDelivery(
          'Sample status internal email',
          sendInternalWorkflowNotificationEmails(
            internalRoles,
            `${internalTitle} - ${emailContext.sample.sample_id}`,
            {
              title: internalTitle,
              summary: internalSummary,
              patientName: emailContext.patientName,
              sampleId: emailContext.sample.sample_id,
              testNames: emailContext.testNames,
              status: nextStatus,
              stage: nextStage,
            }
          )
        );
      }
    }

    res.json({
      success: true,
      message: 'Sample updated successfully',
      data: sample,
    });
    logInfo('Update sample status successful', { id, sampleId: sample.sample_id });
  } catch (error) {
    logError('Update sample error', { error, id: req.params.id });
    res
      .status(500)
      .json({ success: false, message: 'Failed to update sample due to an unexpected server error' });
  }
};

export const trackSample = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    logInfo('Track sample request started', { sample_id: req.params.sample_id });
    const { sample_id } = req.params;

    const sample = await Sample.findOne({
      where: { sample_id },
      include: [
        {
          model: SampleTest,
          include: [
            { model: Test },
            { model: Result }
          ],
        },
      ],
    });

    if (!sample) {
      logWarn('Track sample failed: not found', { sample_id });
      res.status(404).json({ success: false, message: 'Sample not found' });
      return;
    }

    res.json({ success: true, data: sample });
    logInfo('Track sample successful', { sample_id });
  } catch (error) {
    logError('Track sample error', { error, sample_id: req.params.sample_id });
    res.status(500).json({ success: false, message: 'Failed to track sample due to an unexpected server error' });
  }
};
