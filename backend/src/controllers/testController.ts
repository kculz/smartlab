import { Request, Response } from 'express';
import Test from '../models/Test.js';
import TestCategory from '../models/TestCategory.js';
import { logError, logInfo, logWarn } from '../utils/logger.js';

export const createTest = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Create test request started', { body: req.body });
    const { test_category_id, name, description, price, currency } = req.body;

    const test = await Test.create({
      test_category_id,
      name,
      description,
      price,
      currency,
    });

    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      data: test,
    });
    logInfo('Create test successful', { testId: test.id, name: test.name });
  } catch (error) {
    logError('Create test error', { error });
    res.status(500).json({ success: false, message: 'Failed to create test due to an unexpected server error' });
  }
};

export const getTests = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Get tests request started', { query: req.query });
    const { category_id, is_active = true, limit = 10, offset = 0 } = req.query;

    const where: any = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (category_id) where.test_category_id = category_id;

    const { count, rows } = await Test.findAndCountAll({
      where,
      include: [{ model: TestCategory }],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
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
    logInfo('Get tests successful', { count, limit, offset });
  } catch (error) {
    logError('Get tests error', { error });
    res.status(500).json({ success: false, message: 'Failed to get tests due to an unexpected server error' });
  }
};

export const getTest = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Get test request started', { id: req.params.id });
    const { id } = req.params;

    const test = await Test.findByPk(id, {
      include: [{ model: TestCategory }],
    });

    if (!test) {
      logWarn('Get test failed: not found', { id });
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    res.json({ success: true, data: test });
    logInfo('Get test successful', { id });
  } catch (error) {
    logError('Get test error', { error, id: req.params.id });
    res.status(500).json({ success: false, message: 'Failed to get test due to an unexpected server error' });
  }
};

export const updateTest = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Update test request started', { id: req.params.id, body: req.body });
    const { id } = req.params;

    const test = await Test.findByPk(id);

    if (!test) {
      logWarn('Update test failed: not found', { id });
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    await test.update(req.body);

    res.json({
      success: true,
      message: 'Test updated successfully',
      data: test,
    });
    logInfo('Update test successful', { id, testId: test.id });
  } catch (error) {
    logError('Update test error', { error, id: req.params.id });
    res.status(500).json({ success: false, message: 'Failed to update test due to an unexpected server error' });
  }
};

export const toggleTestStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    logInfo('Toggle test status request started', { id: req.params.id });
    const { id } = req.params;

    const test = await Test.findByPk(id);

    if (!test) {
      logWarn('Toggle test status failed: not found', { id });
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    await test.update({ is_active: !test.is_active });

    res.json({
      success: true,
      message: 'Test status updated successfully',
      data: test,
    });
    logInfo('Toggle test status successful', { id, testId: test.id, is_active: test.is_active });
  } catch (error) {
    logError('Toggle test status error', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Failed to toggle test status due to an unexpected server error',
    });
  }
};
