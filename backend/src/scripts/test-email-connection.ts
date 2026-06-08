import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

type TestEmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  rejectUnauthorized: boolean;
  user: string;
  pass: string;
  from: string;
  recipient?: string;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
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
};

const parseArgValue = (name: string): string | undefined => {
  const exactPrefix = `${name}=`;
  const exactMatch = process.argv.find((argument) => argument.startsWith(exactPrefix));
  if (exactMatch) {
    return exactMatch.slice(exactPrefix.length).trim();
  }

  const flagIndex = process.argv.indexOf(name);
  if (flagIndex >= 0) {
    const nextValue = process.argv[flagIndex + 1];
    if (nextValue && !nextValue.startsWith('--')) {
      return nextValue.trim();
    }
  }

  return undefined;
};

const buildConfig = (): TestEmailConfig => {
  const host = (process.env.EMAIL_HOST || '').trim();
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASSWORD || '').trim();
  const from = (process.env.EMAIL_FROM || '').trim();
  const portInput = parseArgValue('--port') || process.env.EMAIL_PORT || '587';
  const port = Number.parseInt(portInput, 10);
  const secureInput = parseArgValue('--secure') ?? process.env.EMAIL_SECURE;
  const secure = parseBoolean(secureInput, port === 465);
  const rejectUnauthorizedInput =
    parseArgValue('--reject-unauthorized') ?? process.env.EMAIL_TLS_REJECT_UNAUTHORIZED;
  const rejectUnauthorized = parseBoolean(rejectUnauthorizedInput, true);
  const recipient = parseArgValue('--to') || process.env.EMAIL_TEST_RECIPIENT?.trim();

  return {
    host,
    port,
    secure,
    rejectUnauthorized,
    user,
    pass,
    from,
    recipient,
  };
};

const formatMaskedValue = (value: string): string => {
  if (!value) {
    return '[missing]';
  }

  if (value.length <= 4) {
    return '****';
  }

  return `${value.slice(0, 2)}***${value.slice(-2)}`;
};

const main = async (): Promise<void> => {
  const config = buildConfig();

  if (!config.host || !config.user || !config.pass || !config.from) {
    console.error('Missing email configuration. Please check EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD, and EMAIL_FROM.');
    process.exitCode = 1;
    return;
  }

  console.log('Testing SMTP connection with:');
  console.log({
    host: config.host,
    port: config.port,
    secure: config.secure,
    rejectUnauthorized: config.rejectUnauthorized,
    user: formatMaskedValue(config.user),
    from: config.from,
    recipient: config.recipient || '[not set]',
  });

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    tls: {
      rejectUnauthorized: config.rejectUnauthorized,
    },
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully.');

    if (config.recipient) {
      const sendResult = await transporter.sendMail({
        from: config.from,
        to: config.recipient,
        subject: 'SmartLab SMTP connection test',
        text: [
          'This is a test email from SmartLab.',
          '',
          `Host: ${config.host}`,
          `Port: ${config.port}`,
          `Secure: ${config.secure}`,
        ].join('\n'),
      });

      console.log(`Test email sent successfully to ${config.recipient}.`);
      console.log({ messageId: sendResult.messageId });
    } else {
      console.log('No recipient provided, so only the SMTP connection was verified.');
      console.log('Set EMAIL_TEST_RECIPIENT or pass --to someone@example.com to send a real test message.');
    }
  } catch (error) {
    console.error('SMTP connection test failed:');
    console.error(error);

    const mailError = error as {
      code?: string;
      responseCode?: number;
      message?: string;
    };

    if (mailError?.code === 'EAUTH' || mailError?.responseCode === 535) {
      console.error(
        'Hint: the server is rejecting the login, so this is usually an EMAIL_USER / EMAIL_PASSWORD problem rather than a port problem.'
      );
      console.error('Try the secure SSL port with: npm run test:email -- --port 465 --secure true --to your-email@example.com');
    } else if (
      mailError?.code === 'ESOCKET' &&
      /self-signed certificate|unable to verify/i.test(mailError?.message || '')
    ) {
      console.error(
        'Hint: the SMTP server is presenting an untrusted certificate. If this is your own mail server, set EMAIL_TLS_REJECT_UNAUTHORIZED=false for local testing or install a trusted certificate chain on the server.'
      );
    }

    process.exitCode = 1;
  }
};

void main();
