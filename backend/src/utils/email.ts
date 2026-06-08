import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const isDev = process.env.NODE_ENV !== 'production';
const rejectUnauthorized =
  process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === undefined
    ? !isDev
    : process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === 'true';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  tls: {
    rejectUnauthorized,
  },
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

export const getPatientStatusEmail = (
  patientName: string,
  sampleId: string,
  status: string,
  testName: string
): string => {
  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Sample Status Update</h2>
        <p>Dear ${patientName},</p>
        <p>Your sample <strong>${sampleId}</strong> for test <strong>${testName}</strong> has been updated.</p>
        <p><strong>Current Status:</strong> ${status}</p>
        <p>You can check the full status at: <a href="${process.env.FRONTEND_URL}/track-results/${sampleId}">View Status</a></p>
        <br/>
        <p>Best regards,<br/>SmartLab Management System</p>
      </body>
    </html>
  `;
};

export default transporter;
