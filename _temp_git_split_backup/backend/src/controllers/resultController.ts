import { Request, Response } from 'express';
import Result from '../models/Result.js';
import SampleTest from '../models/SampleTest.js';
import Test from '../models/Test.js';
import {
  getResultEmailContext,
  sendDoctorApprovalConfirmationEmail,
  sendDoctorApprovalRequestEmails,
  sendLabResultsReadyEmail,
} from '../services/notification.service.js';
import { logError, logInfo, logWarn } from '../utils/logger.js';

export const createResult = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Create result request started', { body: req.body });
    const { sample_test_id, value, unit, reference_range, interpretation, status } = req.body;

    const sampleTest = await SampleTest.findByPk(sample_test_id, {
      include: [{ model: Test }],
    });
    if (!sampleTest) {
      logWarn('Create result failed: sample test not found', { sample_test_id });
      res
        .status(404)
        .json({ success: false, message: 'Sample test not found' });
      return;
    }

    // Check if result already exists for this sample test
    const existing = await Result.findOne({ where: { sample_test_id } });
    if (existing) {
      logWarn('Create result failed: result already exists', { sample_test_id });
      res.status(409).json({
        success: false,
        message: 'A result already exists for this sample test. Use update instead.',
      });
      return;
    }

    // Auto-populate unit/range from test definition if not provided
    const linkedTest = (sampleTest as any).Test as Test | undefined;
    const resolvedUnit = unit ?? linkedTest?.unit ?? null;
    const resolvedRange = reference_range ?? linkedTest?.reference_range ?? null;

    const result = await Result.create({
      sample_test_id,
      value,
      unit: resolvedUnit,
      reference_range: resolvedRange,
      interpretation: interpretation || null,
      status: status || 'Pending Review',
    });

    // Update sample test status
    await sampleTest.update({ status: 'Completed' });

    const emailContext = await getResultEmailContext(sample_test_id);
    if (emailContext && result.status === 'Pending Review') {
      await sendDoctorApprovalRequestEmails({
        patientName: emailContext.patientName,
        sampleId: emailContext.sample.sample_id,
        testNames: emailContext.test.name,
        status: emailContext.sample.current_status,
        stage: emailContext.sample.current_stage,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Result created successfully',
      data: result,
    });
    logInfo('Create result successful', { resultId: result.id, sampleTestId: sample_test_id });
  } catch (error) {
    logError('Create result error', { error });
    res.status(500).json({ success: false, message: 'Failed to create result due to an unexpected server error' });
  }
};

export const getResults = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Get results request started', { query: req.query });
    const { sample_test_id, status, limit = 10, offset = 0 } = req.query;

    const where: any = {};
    if (sample_test_id) where.sample_test_id = sample_test_id;
    if (status) where.status = status;

    const { count, rows } = await Result.findAndCountAll({
      where,
      include: [
        {
          model: SampleTest,
          include: [{ model: Test }],
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
    logInfo('Get results successful', { count, limit, offset });
  } catch (error) {
    logError('Get results error', { error });
    res.status(500).json({ success: false, message: 'Failed to get results due to an unexpected server error' });
  }
};

export const getResult = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Get result request started', { id: req.params.id });
    const { id } = req.params;

    const result = await Result.findByPk(id, {
      include: [
        {
          model: SampleTest,
          include: [{ model: Test }],
        },
      ],
    });

    if (!result) {
      logWarn('Get result failed: not found', { id });
      res.status(404).json({ success: false, message: 'Result not found' });
      return;
    }

    res.json({ success: true, data: result });
    logInfo('Get result successful', { id });
  } catch (error) {
    logError('Get result error', { error, id: req.params.id });
    res.status(500).json({ success: false, message: 'Failed to get result due to an unexpected server error' });
  }
};

export const updateResult = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Update result request started', { id: req.params.id, body: req.body });
    const { id } = req.params;
    const { value, unit, reference_range, interpretation, status } = req.body;

    const result = await Result.findByPk(id);

    if (!result) {
      logWarn('Update result failed: not found', { id });
      res.status(404).json({ success: false, message: 'Result not found' });
      return;
    }

    // Prevent editing already-approved results
    if (result.approved_at && status !== 'Rejected') {
      res.status(409).json({
        success: false,
        message: 'Approved results cannot be edited. Contact the doctor to reject first.',
      });
      return;
    }

    await result.update({
      value: value ?? result.value,
      unit: unit !== undefined ? unit : result.unit,
      reference_range: reference_range !== undefined ? reference_range : result.reference_range,
      interpretation: interpretation !== undefined ? interpretation : result.interpretation,
      status: status ?? result.status,
    });

    res.json({
      success: true,
      message: 'Result updated successfully',
      data: result,
    });
    logInfo('Update result successful', { id, resultId: result.id });
  } catch (error) {
    logError('Update result error', { error, id: req.params.id });
    res.status(500).json({ success: false, message: 'Failed to update result due to an unexpected server error' });
  }
};

export const approveResult = async (
  req: Request & { user?: { userId: number; email: string; role: string } },
  res: Response
): Promise<void> => {
  try {
    logInfo('Approve result request started', { id: req.params.id, userId: req.user?.userId });
    const { id } = req.params;
    const { doctor_note, final_status } = req.body;

    const result = await Result.findByPk(id, {
      include: [{ model: SampleTest }],
    });

    if (!result) {
      logWarn('Approve result failed: not found', { id });
      res.status(404).json({ success: false, message: 'Result not found' });
      return;
    }

    if (result.status !== 'Pending Review') {
      res.status(409).json({
        success: false,
        message: `Result is already in "${result.status}" state and cannot be approved again.`,
      });
      return;
    }

    // Use doctor-provided final_status, fall back to interpretation from lab tech, 
    // or default 'Normal'. Never blindly set 'Normal'.
    const approvedStatus: string =
      final_status && ['Normal', 'Abnormal'].includes(final_status)
        ? final_status
        : result.interpretation && ['Normal', 'Abnormal', 'Borderline', 'Critical'].includes(result.interpretation)
          ? (result.interpretation === 'Borderline' || result.interpretation === 'Critical' ? 'Abnormal' : 'Normal')
          : 'Normal';

    const resultWithSampleTest = result as Result & { SampleTest?: SampleTest };

    await result.update({
      status: approvedStatus,
      doctor_note: doctor_note || null,
      approved_by: req.user?.userId ?? null,
      approved_at: new Date(),
    });

    // Update sample test status to approved
    if (resultWithSampleTest.SampleTest) {
      await resultWithSampleTest.SampleTest.update({ status: 'Approved' });
    }

    const emailContext = await getResultEmailContext(result.sample_test_id);
    if (emailContext) {
      await sendLabResultsReadyEmail({
        patientName: emailContext.patientName,
        email: emailContext.patient.email,
        sampleId: emailContext.sample.sample_id,
        testName: emailContext.test.name,
        resultValue: result.value,
        resultStatus: approvedStatus,
      });

      if (req.user?.email) {
        await sendDoctorApprovalConfirmationEmail(req.user.email, {
          approverName: req.user.email,
          patientName: emailContext.patientName,
          sampleId: emailContext.sample.sample_id,
          testNames: emailContext.test.name,
        });
      }
    }

    res.json({
      success: true,
      message: 'Result approved successfully',
      data: result,
    });
    logInfo('Approve result successful', { id, resultId: result.id, approverId: req.user?.userId, status: approvedStatus });
  } catch (error) {
    logError('Approve result error', { error, id: req.params.id });
    res.status(500).json({ success: false, message: 'Failed to approve result due to an unexpected server error' });
  }
};

export const rejectResult = async (
  req: Request & { user?: { userId: number; email: string; role: string } },
  res: Response
): Promise<void> => {
  try {
    logInfo('Reject result request started', { id: req.params.id, userId: req.user?.userId });
    const { id } = req.params;
    const { doctor_note } = req.body;

    const result = await Result.findByPk(id, {
      include: [{ model: SampleTest }],
    });

    if (!result) {
      logWarn('Reject result failed: not found', { id });
      res.status(404).json({ success: false, message: 'Result not found' });
      return;
    }

    if (result.status !== 'Pending Review') {
      res.status(409).json({
        success: false,
        message: `Only results in "Pending Review" can be rejected. Current status: "${result.status}".`,
      });
      return;
    }

    const resultWithSampleTest = result as Result & { SampleTest?: SampleTest };

    await result.update({
      status: 'Rejected',
      doctor_note: doctor_note || 'Rejected — please re-analyse',
    });

    // Send sample test back to Pending so lab can re-enter
    if (resultWithSampleTest.SampleTest) {
      await resultWithSampleTest.SampleTest.update({ status: 'Pending' });
    }

    res.json({
      success: true,
      message: 'Result rejected and sent back to lab for re-analysis.',
      data: result,
    });
    logInfo('Reject result successful', { id, resultId: result.id, rejectorId: req.user?.userId });
  } catch (error) {
    logError('Reject result error', { error, id: req.params.id });
    res.status(500).json({ success: false, message: 'Failed to reject result due to an unexpected server error' });
  }
};
