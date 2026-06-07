import { Request, Response } from 'express';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateTokens } from '../utils/jwt.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import {
  queueNotificationDelivery,
  sendWelcomePatientEmail,
} from '../services/notification.service.js';
import { logError, logInfo, logWarn } from '../utils/logger.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, phone, role = 'patient' } = req.body;
    logInfo('Register request started', { email, role });

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logWarn('Registration blocked: email already exists', { email });
      res.status(400).json({ success: false, message: 'Email already exists' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      email,
      password: hashedPassword,
      full_name,
      phone,
      role,
    });

    // If patient role, create patient record
    if (role === 'patient') {
      const [firstName, ...lastNameParts] = full_name.split(' ');
      const lastName = lastNameParts.join(' ') || 'User';

      const patient = await Patient.create({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
      });

      queueNotificationDelivery('Welcome patient email', sendWelcomePatientEmail(patient));
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        ...tokens,
      },
    });
    logInfo('Registration successful', { email, userId: user.id, role: user.role });
  } catch (error) {
    logError('Registration error', { email: req.body?.email, error });
    res.status(500).json({
      success: false,
      message: 'Registration failed due to an unexpected server error',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    logInfo('Login request started', { email });

    const user = await User.findOne({ where: { email } });

    if (!user || !(await comparePassword(password, user.password))) {
      logWarn('Login rejected: invalid credentials', {
        email,
        userFound: Boolean(user),
      });
      res
        .status(401)
        .json({
          success: false,
          message: 'Invalid email or password',
        });
      return;
    }

    if (!user.is_active) {
      logWarn('Login blocked: account disabled', { email, userId: user.id });
      res.status(403).json({ success: false, message: 'Account disabled' });
      return;
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        ...tokens,
      },
    });
    logInfo('Login successful', { email, userId: user.id, role: user.role });
  } catch (error) {
    logError('Login error', {
      email: req.body?.email,
      error,
    });
    res.status(500).json({
      success: false,
      message: 'Login failed due to an unexpected server error',
    });
  }
};

export const getProfile = async (
  req: Request & { user?: any },
  res: Response
): Promise<void> => {
  try {
    logInfo('Get profile request started', { userId: req.user?.userId });
    const user = await User.findByPk(req.user?.userId);

    if (!user) {
      logWarn('Get profile failed: user not found', { userId: req.user?.userId });
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const patientProfile = user.role === 'patient'
      ? await Patient.findOne({ where: { user_id: user.id } })
      : null;

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        patient: patientProfile
          ? {
              id: patientProfile.id,
              first_name: patientProfile.first_name,
              last_name: patientProfile.last_name,
              email: patientProfile.email,
              phone: patientProfile.phone,
              city: patientProfile.city,
            }
          : null,
      },
    });
    logInfo('Get profile successful', { userId: user.id, email: user.email });
  } catch (error) {
    logError('Get profile error', { userId: req.user?.userId, error });
    res.status(500).json({
      success: false,
      message: 'Failed to get profile due to an unexpected server error',
    });
  }
};

export const changePassword = async (
  req: Request & { user?: any },
  res: Response
): Promise<void> => {
  try {
    const { current_password, new_password } = req.body;
    logInfo('Change password request started', { userId: req.user?.userId });

    const user = await User.findByPk(req.user?.userId);
    if (!user) {
      logWarn('Change password failed: user not found', { userId: req.user?.userId });
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (!(await comparePassword(current_password, user.password))) {
      logWarn('Change password rejected: invalid current password', {
        userId: user.id,
        email: user.email,
      });
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    user.password = await hashPassword(new_password);
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
    logInfo('Change password successful', { userId: user.id, email: user.email });
  } catch (error) {
    logError('Change password error', { userId: req.user?.userId, error });
    res.status(500).json({
      success: false,
      message: 'Failed to change password due to an unexpected server error',
    });
  }
};
