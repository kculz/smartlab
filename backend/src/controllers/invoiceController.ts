import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';
import Invoice from '../models/Invoice.js';
import InvoiceItem from '../models/InvoiceItem.js';
import InvoicePayment from '../models/InvoicePayment.js';
import Test from '../models/Test.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import {
  queueNotificationDelivery,
  sendInvoiceCreatedEmail,
} from '../services/notification.service.js';
import { INVOICE_STATUS } from '../constants/enums.js';
import { logError, logInfo, logWarn } from '../utils/logger.js';

const roundMoney = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const toMoney = (value: unknown): number => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? roundMoney(numericValue) : 0;
};

const generateInvoiceNumber = (): string => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = uuidv4().split('-')[0].toUpperCase();
  return `INV-${datePart}-${suffix}`;
};

const serializeInvoice = (invoice: any) => {
  const items = (invoice.InvoiceItems || []).map((item: any) => ({
    id: item.id,
    test_id: item.test_id,
    price: toMoney(item.price),
    currency: item.currency,
    test: item.Test
      ? {
          id: item.Test.id,
          name: item.Test.name,
          description: item.Test.description,
          price: toMoney(item.Test.price),
          currency: item.Test.currency,
        }
      : null,
  }));

  const payments = (invoice.InvoicePayments || []).map((payment: any) => ({
    id: payment.id,
    payer_name: payment.payer_name,
    payment_method: payment.payment_method,
    amount_tendered: toMoney(payment.amount_tendered),
    amount_applied: toMoney(payment.amount_applied),
    change_given: toMoney(payment.change_given),
    reference_number: payment.reference_number,
    notes: payment.notes,
    paid_at: payment.paid_at,
    received_by: payment.received_by,
    receivedBy: payment.User
      ? {
          id: payment.User.id,
          email: payment.User.email,
          full_name: payment.User.full_name,
        }
      : null,
  }));

  const totalAmount = toMoney(invoice.total_amount);
  const amountPaid = toMoney(invoice.amount_paid ?? payments.reduce((sum: number, payment: any) => sum + toMoney(payment.amount_applied), 0));
  const balanceDue = toMoney(invoice.balance_due ?? totalAmount - amountPaid);

  return {
    ...invoice.toJSON(),
    total_amount: totalAmount,
    amount_paid: amountPaid,
    balance_due: balanceDue,
    items,
    payments,
    payment_summary: {
      total_amount: totalAmount,
      amount_paid: amountPaid,
      balance_due: balanceDue,
    },
  };
};

const loadInvoiceDetails = async (id: number) => {
  const invoice = await Invoice.findByPk(id, {
    include: [
      { model: Patient },
      { model: InvoiceItem, include: [{ model: Test }] },
      { model: InvoicePayment, include: [{ model: User }] },
      { model: User, as: 'createdBy' },
    ],
  });

  if (!invoice) {
    return null;
  }

  return serializeInvoice(invoice);
};

const buildInvoiceItemsEmailSummary = (tests: Test[]) => {
  return tests.map((test) => ({
    name: test.name,
    price: toMoney(test.price).toFixed(2),
    currency: test.currency,
  }));
};

export const createInvoice = async (
  req: Request & { user?: any },
  res: Response
): Promise<void> => {
  try {
    logInfo('Create invoice request started', { body: req.body, userId: req.user?.userId });
    const { patient_id, test_ids, currency } = req.body;

    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      logWarn('Create invoice failed: patient not found', { patient_id });
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    const tests = await Test.findAll({
      where: { id: test_ids },
    });

    if (tests.length !== test_ids.length) {
      const foundIds = tests.map((test) => test.id);
      const missingIds = test_ids.filter((testId: number) => !foundIds.includes(testId));
      logWarn('Create invoice failed: tests not found', { missingIds });
      res.status(404).json({
        success: false,
        message: `Some requested tests were not found: ${missingIds.join(', ')}`,
      });
      return;
    }

    const invoiceNumber = generateInvoiceNumber();
    const totalAmount = roundMoney(
      tests.reduce((sum, test) => sum + toMoney(test.price), 0)
    );

    const invoice = await sequelize.transaction(async (transaction) => {
      const createdInvoice = await Invoice.create(
        {
          invoice_number: invoiceNumber,
          patient_id,
          total_amount: totalAmount,
          amount_paid: 0,
          balance_due: totalAmount,
          currency,
          status: INVOICE_STATUS.PENDING,
          created_by: req.user.userId,
        },
        { transaction }
      );

      for (const test of tests) {
        await InvoiceItem.create(
          {
            invoice_id: createdInvoice.id,
            test_id: test.id,
            price: test.price,
            currency,
          },
          { transaction }
        );
      }

      return createdInvoice;
    });

    const invoiceDetails = await loadInvoiceDetails(invoice.id);

    queueNotificationDelivery(
      'Invoice created email',
      sendInvoiceCreatedEmail({
        patientName: `${patient.first_name} ${patient.last_name}`.trim(),
        email: patient.email,
        invoiceNumber,
        totalAmount: totalAmount.toFixed(2),
        currency: currency || 'USD',
        items: buildInvoiceItemsEmailSummary(tests),
        balanceDue: totalAmount.toFixed(2),
      })
    );

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoiceDetails || invoice.toJSON(),
    });
    logInfo('Create invoice successful', { invoiceId: invoice.id, invoiceNumber });
  } catch (error) {
    logError('Create invoice error', { error });
    res
      .status(500)
      .json({ success: false, message: 'Failed to create invoice due to an unexpected server error' });
  }
};

export const getInvoices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    logInfo('Get invoices request started', { query: req.query });
    const { patient_id, status, limit = 10, offset = 0 } = req.query;

    const where: any = {};
    if (patient_id) where.patient_id = patient_id;
    if (status) where.status = status;

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: Patient },
        { model: InvoiceItem, include: [{ model: Test }] },
        { model: InvoicePayment, include: [{ model: User }] },
      ],
      distinct: true,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: rows.map((invoice) => serializeInvoice(invoice)),
      pagination: {
        total: count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
    logInfo('Get invoices successful', { count, limit, offset });
  } catch (error) {
    logError('Get invoices error', { error });
    res
      .status(500)
      .json({ success: false, message: 'Failed to get invoices due to an unexpected server error' });
  }
};

export const getInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    logInfo('Get invoice request started', { id: req.params.id });
    const { id } = req.params;

    const invoice = await loadInvoiceDetails(Number(id));

    if (!invoice) {
      logWarn('Get invoice failed: not found', { id });
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    res.json({ success: true, data: invoice });
    logInfo('Get invoice successful', { id });
  } catch (error) {
    logError('Get invoice error', { error, id: req.params.id });
    res.status(500).json({ success: false, message: 'Failed to get invoice due to an unexpected server error' });
  }
};

export const recordInvoicePayment = async (
  req: Request & { user?: any },
  res: Response
): Promise<void> => {
  try {
    logInfo('Record invoice payment request started', {
      id: req.params.id,
      body: req.body,
      userId: req.user?.userId,
    });

    const { id } = req.params;
    const { payer_name, amount_tendered, payment_method, reference_number, notes } = req.body;

    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      logWarn('Record invoice payment failed: invoice not found', { id });
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    if (invoice.status === INVOICE_STATUS.CANCELLED) {
      res.status(400).json({
        success: false,
        message: 'Cancelled invoices cannot receive payments',
      });
      return;
    }

    const amountDue = toMoney(invoice.balance_due ?? invoice.total_amount - invoice.amount_paid);
    if (amountDue <= 0) {
      res.status(400).json({
        success: false,
        message: 'This invoice has already been paid in full',
      });
      return;
    }

    const tenderedAmount = toMoney(amount_tendered);
    const amountApplied = roundMoney(Math.min(tenderedAmount, amountDue));
    const changeGiven = roundMoney(Math.max(tenderedAmount - amountApplied, 0));
    const newAmountPaid = roundMoney(toMoney(invoice.amount_paid) + amountApplied);
    const newBalanceDue = roundMoney(Math.max(toMoney(invoice.total_amount) - newAmountPaid, 0));
    const newStatus =
      newBalanceDue <= 0
        ? INVOICE_STATUS.PAID
        : newAmountPaid > 0
          ? INVOICE_STATUS.PARTIALLY_PAID
          : INVOICE_STATUS.PENDING;

    const payment = await sequelize.transaction(async (transaction) => {
      const createdPayment = await InvoicePayment.create(
        {
          invoice_id: invoice.id,
          payer_name,
          payment_method,
          amount_tendered: tenderedAmount,
          amount_applied: amountApplied,
          change_given: changeGiven,
          reference_number,
          notes,
          received_by: req.user?.userId ?? null,
        },
        { transaction }
      );

      await invoice.update(
        {
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          status: newStatus,
        },
        { transaction }
      );

      return createdPayment;
    });

    const invoiceDetails = await loadInvoiceDetails(invoice.id);

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment: {
          ...payment.toJSON(),
          amount_tendered: tenderedAmount,
          amount_applied: amountApplied,
          change_given: changeGiven,
          payment_status:
            changeGiven > 0
              ? 'Change given'
              : newStatus === INVOICE_STATUS.PAID
                ? 'Paid in full'
                : 'Partially paid',
        },
        invoice: invoiceDetails,
      },
    });
    logInfo('Record invoice payment successful', {
      id,
      invoiceId: invoice.id,
      paymentId: payment.id,
      status: newStatus,
    });
  } catch (error) {
    logError('Record invoice payment error', { error, id: req.params.id });
    res
      .status(500)
      .json({ success: false, message: 'Failed to record payment due to an unexpected server error' });
  }
};

export const updateInvoiceStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    logInfo('Update invoice status request started', { id: req.params.id, body: req.body });
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      logWarn('Update invoice failed: not found', { id });
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    await invoice.update({ status });

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice,
    });
    logInfo('Update invoice status successful', { id, invoiceId: invoice.id, status });
  } catch (error) {
    logError('Update invoice error', { error, id: req.params.id });
    res
      .status(500)
      .json({ success: false, message: 'Failed to update invoice due to an unexpected server error' });
  }
};
