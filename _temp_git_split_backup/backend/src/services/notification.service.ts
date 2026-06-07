import Patient from '../models/Patient.js';
import Result from '../models/Result.js';
import Sample from '../models/Sample.js';
import SampleTest from '../models/SampleTest.js';
import Test from '../models/Test.js';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import { sendTemplatedEmail } from './email.service.js';

type SampleNotificationPayload = {
  patientName: string;
  email: string;
  sampleId: string;
  testNames: string;
  status: string;
  stage: string;
};

type ResultNotificationPayload = {
  patientName: string;
  email: string;
  sampleId: string;
  testName: string;
  resultValue: string;
  resultStatus: string;
};

type InvoiceNotificationPayload = {
  patientName: string;
  email: string;
  invoiceNumber: string;
  totalAmount: string;
  currency: string;
  balanceDue?: string;
  items?: Array<{
    name: string;
    price: string;
    currency: string;
  }>;
  itemSummary?: string;
};

const getPortalUrl = (): string => {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};

const getPatientFullName = (patient: Patient): string => {
  return `${patient.first_name} ${patient.last_name}`.trim();
};

export const sendWelcomePatientEmail = async (patient: Patient): Promise<boolean> => {
  return sendTemplatedEmail({
    to: patient.email,
    subject: 'Welcome to SmartLab',
    template: 'welcome-patient',
    data: {
      patientName: getPatientFullName(patient),
      portalUrl: `${getPortalUrl()}/login`,
    },
  });
};

export const sendSampleStatusUpdateEmail = async ({
  patientName,
  email,
  sampleId,
  testNames,
  status,
  stage,
}: SampleNotificationPayload): Promise<boolean> => {
  return sendTemplatedEmail({
    to: email,
    subject: `Sample Update - ${sampleId}`,
    template: 'sample-status-update',
    data: {
      patientName,
      sampleId,
      testNames,
      status,
      stage,
      trackingUrl: `${getPortalUrl()}/track-results/${sampleId}`,
    },
  });
};

export const sendDoctorApprovalRequestEmails = async (
  payload: Omit<SampleNotificationPayload, 'email'>
): Promise<number> => {
  const doctors = await User.findAll({
    where: { role: 'doctor', is_active: true },
    attributes: ['email', 'full_name'],
  });

  const sends = await Promise.allSettled(
    doctors.map((doctor) =>
      sendTemplatedEmail({
        to: doctor.email,
        subject: `Result review required - ${payload.sampleId}`,
        template: 'doctor-approval-request',
        data: {
          doctorName: doctor.full_name,
          patientName: payload.patientName,
          sampleId: payload.sampleId,
          testNames: payload.testNames,
          reviewUrl: `${getPortalUrl()}/results/${payload.sampleId}`,
        },
      })
    )
  );

  return sends.filter((result) => result.status === 'fulfilled').length;
};

export const sendDoctorApprovalConfirmationEmail = async (
  doctorEmail: string,
  payload: Omit<SampleNotificationPayload, 'email' | 'status' | 'stage'> & {
    approverName: string;
  }
): Promise<boolean> => {
  return sendTemplatedEmail({
    to: doctorEmail,
    subject: `Result approval recorded - ${payload.sampleId}`,
    template: 'doctor-approval-confirmed',
    data: {
      doctorName: payload.approverName,
      patientName: payload.patientName,
      sampleId: payload.sampleId,
      testNames: payload.testNames,
      reviewUrl: `${getPortalUrl()}/results/${payload.sampleId}`,
    },
  });
};

export const sendLabResultsReadyEmail = async ({
  patientName,
  email,
  sampleId,
  testName,
  resultValue,
  resultStatus,
}: ResultNotificationPayload): Promise<boolean> => {
  return sendTemplatedEmail({
    to: email,
    subject: `Your lab result is ready - ${sampleId}`,
    template: 'lab-result-ready',
    data: {
      patientName,
      sampleId,
      testName,
      resultValue,
      resultStatus,
      resultsUrl: `${getPortalUrl()}/results/${sampleId}`,
    },
  });
};

export const sendInvoiceCreatedEmail = async ({
  patientName,
  email,
  invoiceNumber,
  totalAmount,
  currency,
  balanceDue,
  items = [],
}: InvoiceNotificationPayload): Promise<boolean> => {
  return sendTemplatedEmail({
    to: email,
    subject: `Invoice created - ${invoiceNumber}`,
    template: 'invoice-created',
    data: {
      patientName,
      invoiceNumber,
      totalAmount,
      currency,
      balanceDue: balanceDue || totalAmount,
      itemSummary:
        items.length > 0
          ? items.map((item) => `${item.name} (${item.currency} ${item.price})`).join(', ')
          : 'No line items',
      invoicesUrl: `${getPortalUrl()}/invoices/${invoiceNumber}`,
    },
  });
};

export const sendPaymentReminderEmail = async (
  patient: Patient,
  invoiceNumber: string,
  totalAmount: string,
  currency: string
): Promise<boolean> => {
  return sendTemplatedEmail({
    to: patient.email,
    subject: `Payment reminder - ${invoiceNumber}`,
    template: 'payment-reminder',
    data: {
      patientName: getPatientFullName(patient),
      invoiceNumber,
      totalAmount,
      balanceDue: totalAmount,
      currency,
      invoicesUrl: `${getPortalUrl()}/invoices/${invoiceNumber}`,
    },
  });
};

export const getSampleEmailContext = async (sampleId: number) => {
  const sample = await Sample.findByPk(sampleId, {
    include: [{ model: Patient }],
  });

  const patient = (sample as unknown as { Patient?: Patient } | null)?.Patient;

  if (!sample || !patient) {
    return null;
  }

  const sampleTests = await SampleTest.findAll({
    where: { sample_id: sample.id },
    include: [{ model: Test }],
  });

  const testNames = sampleTests
    .map((sampleTest) => {
      const test = sampleTest as unknown as { Test?: Test };
      return test.Test?.name;
    })
    .filter(Boolean)
    .join(', ');

  return {
    sample,
    patient,
    patientName: getPatientFullName(patient),
    testNames: testNames || 'N/A',
  };
};

export const getResultEmailContext = async (sampleTestId: number) => {
  const sampleTest = await SampleTest.findByPk(sampleTestId, {
    include: [
      { model: Test },
      {
        model: Sample,
        include: [{ model: Patient }],
      },
    ],
  });

  const sample = (sampleTest as unknown as { Sample?: Sample } | null)?.Sample;
  const patient = (sample as unknown as { Patient?: Patient } | null)?.Patient;
  const test = (sampleTest as unknown as { Test?: Test } | null)?.Test;

  if (!sampleTest || !sample || !patient || !test) {
    return null;
  }

  const result = await Result.findOne({
    where: { sample_test_id: sampleTest.id },
  });

  return {
    sampleTest,
    sample,
    patient,
    test,
    result,
    patientName: getPatientFullName(patient),
  };
};
