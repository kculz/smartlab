import { Request, Response } from 'express';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import sequelize from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { DEFAULT_PATIENT_PASSWORD } from '../constants/enums.js';
import { sendWelcomePatientEmail } from '../services/notification.service.js';
import { Op } from 'sequelize';
import { logError, logInfo, logWarn } from '../utils/logger.js';

export const createPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Create patient request started', { body: req.body });
    const {
      first_name,
      last_name,
      phone,
      email,
      date_of_birth,
      gender,
      address,
      city,
    } = req.body;

    const [existingUser, existingPatient] = await Promise.all([
      User.findOne({ where: { email } }),
      Patient.findOne({ where: { email } }),
    ]);

    if (existingUser || existingPatient) {
      logWarn('Create patient failed: account already exists', { email });
      res.status(409).json({
        success: false,
        message: 'A patient account with this email already exists',
      });
      return;
    }

    const patient = await sequelize.transaction(async (transaction) => {
      const user = await User.create(
        {
          email,
          password: await hashPassword(DEFAULT_PATIENT_PASSWORD),
          full_name: `${first_name} ${last_name}`.trim(),
          phone,
          role: 'patient',
        },
        { transaction }
      );

      return Patient.create(
        {
          user_id: user.id,
          first_name,
          last_name,
          phone,
          email,
          date_of_birth,
          gender,
          address,
          city,
        },
        { transaction }
      );
    });

    const patientAccount = await User.findOne({ where: { email } });

    void sendWelcomePatientEmail(patient).catch((emailError) => {
      logWarn('Welcome patient email failed', { email, error: emailError });
    });

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: {
        patient,
        credentials: {
          email,
          temporary_password: DEFAULT_PATIENT_PASSWORD,
        },
        account: patientAccount
          ? {
              id: patientAccount.id,
              email: patientAccount.email,
              full_name: patientAccount.full_name,
              role: patientAccount.role,
            }
          : null,
      },
    });
    logInfo('Create patient successful', { patientId: patient.id, email: patient.email });
  } catch (error) {
    logError('Create patient error', { error });
    res
      .status(500)
      .json({ success: false, message: 'Failed to create patient due to an unexpected server error' });
  }
};

export const getPatients = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    logInfo('Get patients request started', { query: req.query });
    const { search = '', limit = 10, offset = 0 } = req.query;

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Patient.findAndCountAll({
      where,
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
    logInfo('Get patients successful', { count, limit, offset });
  } catch (error) {
    logError('Get patients error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to get patients due to an unexpected server error',
    });
  }
};

export const getPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Get patient request started', { id: req.params.id });
    const { id } = req.params;

    const patient = await Patient.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'email', 'phone', 'full_name'],
        },
      ],
    });

    if (!patient) {
      logWarn('Get patient failed: not found', { id });
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    res.json({ success: true, data: patient });
    logInfo('Get patient successful', { id });
  } catch (error) {
    logError('Get patient error', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Failed to get patient due to an unexpected server error',
    });
  }
};

export const updatePatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    logInfo('Update patient request started', { id: req.params.id, body: req.body });
    const { id } = req.params;

    const patient = await Patient.findByPk(id);

    if (!patient) {
      logWarn('Update patient failed: not found', { id });
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    await patient.update(req.body);

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient,
    });
    logInfo('Update patient successful', { id, patientId: patient.id });
  } catch (error) {
    logError('Update patient error', { error, id: req.params.id });
    res
      .status(500)
      .json({ success: false, message: 'Failed to update patient due to an unexpected server error' });
  }
};
