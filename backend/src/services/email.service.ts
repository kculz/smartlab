import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

type EmailTemplateData = Record<string, unknown>;

type SendTemplatedEmailParams = {
  to: string;
  subject: string;
  template: string;
  data?: EmailTemplateData;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateCache = new Map<string, string>();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const escapeHtml = (value: unknown): string => {
  const stringValue = value === null || value === undefined ? '' : String(value);

  return stringValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const renderTemplate = (template: string, data: EmailTemplateData): string => {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) => {
    const value = key.split('.').reduce<unknown>((current, part) => {
      if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
        return (current as Record<string, unknown>)[part];
      }

      return undefined;
    }, data);

    return escapeHtml(value);
  });
};

const loadTemplate = async (templateName: string): Promise<string> => {
  const cachedTemplate = templateCache.get(templateName);
  if (cachedTemplate) {
    return cachedTemplate;
  }

  const templatePath = path.resolve(__dirname, '../templates/emails', `${templateName}.hbs`);
  const template = await fs.readFile(templatePath, 'utf8');
  templateCache.set(templateName, template);

  return template;
};

export const sendTemplatedEmail = async ({
  to,
  subject,
  template,
  data = {},
}: SendTemplatedEmailParams): Promise<boolean> => {
  try {
    const templateSource = await loadTemplate(template);
    const html = renderTemplate(templateSource, {
      appName: process.env.APP_NAME || 'SmartLab',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      ...data,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error(`Email sending failed for template "${template}":`, error);
    return false;
  }
};

export const sendRawEmail = async (
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

export const renderEmailTemplate = async (
  template: string,
  data: EmailTemplateData = {}
): Promise<string> => {
  const templateSource = await loadTemplate(template);
  return renderTemplate(templateSource, {
    appName: process.env.APP_NAME || 'SmartLab',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    ...data,
  });
};

export default transporter;
