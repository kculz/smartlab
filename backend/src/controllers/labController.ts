import { Op } from 'sequelize';
import { Request, Response } from 'express';
import Patient from '../models/Patient.js';
import Result from '../models/Result.js';
import Sample from '../models/Sample.js';
import SampleTest from '../models/SampleTest.js';
import Test from '../models/Test.js';
import { logError, logInfo } from '../utils/logger.js';

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Lab dashboard summary request started', { userId: (req as any).user?.userId });
    const { start, end } = getTodayRange();

    const [
      samplesInProgress,
      samplesAwaitingReview,
      samplesCompletedToday,
      resultsPendingReview,
      resultsCompletedToday,
      activeTests,
      recentSamples,
      recentResults,
    ] = await Promise.all([
      Sample.count({
        where: {
          current_stage: 'Lab',
          current_status: { [Op.in]: ['Pending', 'In Progress'] },
        },
      }),
      Sample.count({
        where: { current_stage: 'Doctor Review' },
      }),
      Sample.count({
        where: {
          current_status: { [Op.in]: ['Completed', 'Reported', 'Released'] },
          updated_at: { [Op.between]: [start, end] },
        },
      }),
      Result.count({ where: { status: 'Pending Review' } }),
      Result.count({
        where: {
          updated_at: { [Op.between]: [start, end] },
        },
      }),
      Test.count({ where: { is_active: true } }),
      Sample.findAll({
        include: [
          { model: Patient, attributes: ['id', 'first_name', 'last_name', 'email'] },
          { model: SampleTest, include: [{ model: Test }] },
        ],
        order: [['created_at', 'DESC']],
        limit: 8,
      }),
      Result.findAll({
        include: [
          {
            model: SampleTest,
            include: [
              { model: Test },
              {
                model: Sample,
                include: [{ model: Patient, attributes: ['id', 'first_name', 'last_name'] }],
              },
            ],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 8,
      }),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          samplesInProgress,
          samplesAwaitingReview,
          samplesCompletedToday,
          resultsPendingReview,
          resultsCompletedToday,
          activeTests,
        },
        recentSamples,
        recentResults,
      },
    });
    logInfo('Lab dashboard summary successful', {
      userId: (req as any).user?.userId,
      samplesInProgress,
      resultsPendingReview,
      activeTests,
    });
  } catch (error) {
    logError('Lab dashboard summary error', { userId: (req as any).user?.userId, error });
    res.status(500).json({
      success: false,
      message: 'Failed to load lab dashboard summary due to an unexpected server error',
    });
  }
};
