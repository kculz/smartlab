import { Op, fn, col, literal } from 'sequelize';
import { Request, Response } from 'express';
import Patient from '../models/Patient.js';
import Invoice from '../models/Invoice.js';
import InvoicePayment from '../models/InvoicePayment.js';
import Sample from '../models/Sample.js';
import Result from '../models/Result.js';
import Test from '../models/Test.js';
import sequelize from '../config/database.js';
import { logError, logInfo } from '../utils/logger.js';

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getThisWeekRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const getSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Reports summary request started', { userId: (req as any).user?.userId });
    const { start: todayStart, end: todayEnd } = getTodayRange();
    const { start: weekStart } = getThisWeekRange();

    const [
      totalPatients,
      patientsToday,
      patientsThisWeek,
      totalSamples,
      samplesToday,
      samplesInProgress,
      samplesCompleted,
      pendingApprovals,
      criticalAlerts,
      resultsToday,
      totalInvoices,
      openInvoices,
      paidInvoices,
      todayPayments,
      weekPayments,
      outstandingBalance,
      activeTests,
    ] = await Promise.all([
      Patient.count(),
      Patient.count({ where: { created_at: { [Op.between]: [todayStart, todayEnd] } } }),
      Patient.count({ where: { created_at: { [Op.gte]: weekStart } } }),
      Sample.count(),
      Sample.count({ where: { created_at: { [Op.between]: [todayStart, todayEnd] } } }),
      Sample.count({
        where: { current_status: { [Op.in]: ['Pending', 'In Progress'] } },
      }),
      Sample.count({
        where: { current_status: { [Op.in]: ['Completed', 'Reported', 'Released'] } },
      }),
      Result.count({ where: { status: 'Pending Review' } }),
      Result.count({ where: { status: 'Abnormal' } }),
      Result.count({ where: { created_at: { [Op.between]: [todayStart, todayEnd] } } }),
      Invoice.count(),
      Invoice.count({ where: { status: { [Op.in]: ['Pending', 'Partially Paid'] } } }),
      Invoice.count({ where: { status: 'Paid' } }),
      // Revenue collected today
      InvoicePayment.sum('amount_applied', {
        where: { paid_at: { [Op.between]: [todayStart, todayEnd] } },
      }),
      // Revenue collected this week
      InvoicePayment.sum('amount_applied', {
        where: { paid_at: { [Op.gte]: weekStart } },
      }),
      // Total outstanding balance
      Invoice.sum('balance_due', {
        where: { status: { [Op.in]: ['Pending', 'Partially Paid'] } },
      }),
      Test.count({ where: { is_active: true } }),
    ]);

    // Average TAT: from sample created_at to first result created_at (rough estimate)
    const tatQuery = await sequelize.query(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, s.created_at, r.created_at)) AS avg_minutes
       FROM results r
       JOIN sample_tests st ON r.sample_test_id = st.id
       JOIN samples s ON st.sample_id = s.id
       WHERE r.created_at >= :weekStart`,
      {
        replacements: { weekStart },
        type: 'SELECT' as any,
      }
    ) as any[];

    const avgTatMinutes = tatQuery[0]?.[0]?.avg_minutes ?? null;
    const avgTatHours = avgTatMinutes ? (avgTatMinutes / 60).toFixed(1) : null;

    res.json({
      success: true,
      data: {
        patients: {
          total: totalPatients,
          today: patientsToday,
          this_week: patientsThisWeek,
        },
        samples: {
          total: totalSamples,
          today: samplesToday,
          in_progress: samplesInProgress,
          completed: samplesCompleted,
          pending_approvals: pendingApprovals,
          critical_alerts: criticalAlerts,
          results_today: resultsToday,
        },
        financial: {
          total_invoices: totalInvoices,
          open_invoices: openInvoices,
          paid_invoices: paidInvoices,
          revenue_today: Number(todayPayments ?? 0).toFixed(2),
          revenue_this_week: Number(weekPayments ?? 0).toFixed(2),
          outstanding_balance: Number(outstandingBalance ?? 0).toFixed(2),
        },
        lab: {
          active_tests: activeTests,
          avg_tat_hours: avgTatHours,
        },
      },
    });

    logInfo('Reports summary successful', { userId: (req as any).user?.userId });
  } catch (error) {
    logError('Reports summary error', { error, userId: (req as any).user?.userId });
    res.status(500).json({
      success: false,
      message: 'Failed to load reports summary due to an unexpected server error',
    });
  }
};
