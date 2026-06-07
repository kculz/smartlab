import { Op } from 'sequelize';
import { Request, Response } from 'express';
import Patient from '../models/Patient.js';
import Invoice from '../models/Invoice.js';
import InvoiceItem from '../models/InvoiceItem.js';
import InvoicePayment from '../models/InvoicePayment.js';
import Sample from '../models/Sample.js';
import Test from '../models/Test.js';
import { logError, logInfo } from '../utils/logger.js';

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const getDashboardSummary = async (
  req: Request & { user?: { userId: number; email: string; role: string } },
  res: Response
): Promise<void> => {
  try {
    logInfo('Reception dashboard summary request started', { userId: req.user?.userId });
    const { start, end } = getTodayRange();

    const [
      totalPatients,
      patientsToday,
      openInvoices,
      paidInvoices,
      samplesToday,
      pendingApprovals,
      recentPatients,
      recentInvoices,
      recentSamples,
      availableTests,
    ] = await Promise.all([
      Patient.count(),
      Patient.count({ where: { created_at: { [Op.between]: [start, end] } } }),
      Invoice.count({ where: { status: { [Op.in]: ['Pending', 'Partially Paid'] } } }),
      Invoice.count({ where: { status: 'Paid' } }),
      Sample.count({ where: { created_at: { [Op.between]: [start, end] } } }),
      Sample.count({ where: { current_stage: 'Doctor Review' } }),
      Patient.findAll({
        order: [['created_at', 'DESC']],
        limit: 5,
      }),
      Invoice.findAll({
        include: [
          { model: Patient, attributes: ['id', 'first_name', 'last_name', 'email'] },
          { model: InvoiceItem, include: [{ model: Test }] },
          { model: InvoicePayment },
        ],
        order: [['created_at', 'DESC']],
        limit: 5,
      }),
      Sample.findAll({
        include: [{ model: Patient, attributes: ['id', 'first_name', 'last_name', 'email'] }],
        order: [['created_at', 'DESC']],
        limit: 5,
      }),
      Test.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']],
        limit: 20,
      }),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalPatients,
          patientsToday,
          openInvoices,
          paidInvoices,
          samplesToday,
          pendingApprovals,
        },
        recentPatients,
        recentInvoices,
        recentSamples,
        availableTests,
      },
    });
    logInfo('Reception dashboard summary successful', {
      userId: req.user?.userId,
      totalPatients,
      patientsToday,
      openInvoices,
    });
  } catch (error) {
    logError('Reception dashboard summary error', {
      userId: req.user?.userId,
      error,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to load reception dashboard summary due to an unexpected server error',
    });
  }
};
