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
    logInfo('Doctor dashboard summary request started', { userId: (req as any).user?.userId });
    const { start, end } = getTodayRange();

    const [
      pendingApprovals,
      reviewedToday,
      criticalAlerts,
      releasedToday,
      recentResults,
      recentPatients,
    ] = await Promise.all([
      Result.count({ where: { status: 'Pending Review' } }),
      Result.count({ where: { updated_at: { [Op.between]: [start, end] } } }),
      Result.count({ where: { status: 'Abnormal' } }),
      Sample.count({
        where: {
          current_status: 'Released',
          updated_at: { [Op.between]: [start, end] },
        },
      }),
      Result.findAll({
        include: [
          {
            model: SampleTest,
            include: [
              { model: Test },
              {
                model: Sample,
                include: [{ model: Patient, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] }],
              },
            ],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 10,
      }),
      Patient.findAll({
        order: [['created_at', 'DESC']],
        limit: 10,
      }),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          pendingApprovals,
          reviewedToday,
          criticalAlerts,
          releasedToday,
        },
        recentResults,
        recentPatients,
      },
    });

    logInfo('Doctor dashboard summary successful', {
      userId: (req as any).user?.userId,
      pendingApprovals,
      criticalAlerts,
      releasedToday,
    });
  } catch (error) {
    logError('Doctor dashboard summary error', { userId: (req as any).user?.userId, error });
    res.status(500).json({
      success: false,
      message: 'Failed to load doctor dashboard summary due to an unexpected server error',
    });
  }
};
