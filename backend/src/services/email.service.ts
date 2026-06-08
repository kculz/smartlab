import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { logWarn } from '../utils/logger.js';

type EmailTemplateData = Record<string, unknown>;

type MailPayload = {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
};

type SendTemplatedEmailParams = {
  to: string;
  subject: string;
  template: string;
  data?: EmailTemplateData;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateCache = new Map<string, string>();

type DeliveryMode = 'smtp' | 'console';

type DeliveryState = {
  mode: DeliveryMode;
  reason: string;
};

let consoleNoticeLogged = false;
let smtpFallbackLogged = false;
let deliveryState: DeliveryState = resolveInitialDeliveryState();
let smtpTransport: ReturnType<typeof nodemailer.createTransport> | null =
  deliveryState.mode === 'smtp' ? createSmtpTransport() : null;

const escapeHtml = (value: unknown): string => {
  const stringValue = value === null || value === undefined ? '' : String(value);

  return stringValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

function getEmailSetting(key: string): string {
  return (process.env[key] || '').trim();
}

function parseBooleanSetting(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function hasSmtpConfig(): boolean {
  return Boolean(
    getEmailSetting('EMAIL_HOST') &&
      getEmailSetting('EMAIL_USER') &&
      getEmailSetting('EMAIL_PASSWORD') &&
      getEmailSetting('EMAIL_FROM')
  );
}

function resolveInitialDeliveryState(): DeliveryState {
  if (getEmailSetting('EMAIL_ENABLED').toLowerCase() === 'false') {
    return { mode: 'console', reason: 'EMAIL_ENABLED=false' };
  }

  if (getEmailSetting('EMAIL_TRANSPORT').toLowerCase() === 'console') {
    return { mode: 'console', reason: 'EMAIL_TRANSPORT=console' };
  }

  if (!hasSmtpConfig()) {
    return { mode: 'console', reason: 'missing SMTP configuration' };
  }

  return { mode: 'smtp', reason: 'SMTP configured' };
}

function createSmtpTransport() {
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const rejectUnauthorized = parseBooleanSetting(process.env.EMAIL_TLS_REJECT_UNAUTHORIZED, true);

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: parseBooleanSetting(process.env.EMAIL_SECURE, port === 465),
    tls: {
      rejectUnauthorized,
    },
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

const isAuthenticationFailure = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const mailError = error as {
    code?: string;
    message?: string;
    response?: string;
    responseCode?: number;
  };

  return (
    mailError.code === 'EAUTH' ||
    mailError.responseCode === 535 ||
    /535/i.test(mailError.response || '') ||
    /invalid login/i.test(mailError.message || '')
  );
};

const getDeliveryModeNotice = (): string => {
  return deliveryState.mode === 'smtp'
    ? 'SMTP delivery is active'
    : `Email delivery is running in console mode (${deliveryState.reason})`;
};

const logConsoleModeNotice = (): void => {
  if (consoleNoticeLogged) {
    return;
  }

  consoleNoticeLogged = true;
  logWarn(getDeliveryModeNotice());
};

const enableConsoleFallback = (reason: string): void => {
  deliveryState = { mode: 'console', reason };
  smtpTransport = null;
};

const sendMailSafely = async (mailOptions: MailPayload, templateLabel: string): Promise<boolean> => {
  if (deliveryState.mode === 'console') {
    logConsoleModeNotice();
    return true;
  }

  if (!smtpTransport) {
    enableConsoleFallback('SMTP transport unavailable');
    logConsoleModeNotice();
    return true;
  }

  try {
    await smtpTransport.sendMail(mailOptions);
    return true;
  } catch (error) {
    if (isAuthenticationFailure(error)) {
      enableConsoleFallback('SMTP authentication failed');

      if (!smtpFallbackLogged) {
        smtpFallbackLogged = true;
        logWarn(`SMTP authentication failed for template "${templateLabel}". Email delivery will continue in console mode until the process restarts.`, {
          error,
        });
      }

      return false;
    }

    throw error;
  }
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

    return sendMailSafely(
      {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      },
      template
    );
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
    return sendMailSafely({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    }, 'raw-email');
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

export { smtpTransport as default };
