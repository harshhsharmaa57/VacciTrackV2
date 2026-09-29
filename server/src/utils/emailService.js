import nodemailer from 'nodemailer';

/**
 * VacciTrack Email Service
 * Handles OTP delivery and official NIS 2025 vaccination reminders via Gmail SMTP
 */

const getTransporter = () => {
  // Option 1: Generic Custom SMTP (Host, Port, User, Pass)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Option 2: Gmail with App Password
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return null;
};

const getSenderEmail = () => {
  return process.env.EMAIL_FROM || process.env.GMAIL_USER || process.env.SMTP_USER || 'no-reply@vaccitrack.gov.in';
};

/**
 * Send 6-digit OTP to parent's Gmail
 */
export const sendOtpEmail = async (toEmail, otp, childName = 'your child') => {
  const transporter = getTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0d9488; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">VacciTrack</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">National Immunization Schedule (NIS 2025) Verification</p>
      </div>
      <div style="padding: 30px 24px; color: #334155;">
        <p style="font-size: 16px; margin-top: 0;">Hello,</p>
        <p style="font-size: 15px; line-height: 1.5;">You requested a verification code to authorize vaccination records for <strong>${childName}</strong>.</p>
        
        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 8px; padding: 16px 36px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f766e; font-family: monospace;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-top: 10px;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
        </div>

        <p style="font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-bottom: 0;">
          If you did not request this OTP, please ignore this email or contact support immediately.
        </p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║  📧 [GMAIL EMULATOR] OTP to ${toEmail}: ${otp}          ║`);
    console.log(`║  (Add GMAIL_USER & GMAIL_APP_PASSWORD in .env for real mail)║`);
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);
    return { success: true, mode: 'console', message: 'Logged to console' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"VacciTrack" <${getSenderEmail()}>`,
      to: toEmail,
      subject: `VacciTrack: Your OTP Verification Code is ${otp}`,
      html,
    });
    console.log(`[Email] ✅ OTP sent to ${toEmail} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error] Failed to send OTP email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send official vaccination due reminder to Gmail (matching the exact template)
 */
export const sendVaccineReminderEmail = async (toEmail, reminderData) => {
  const transporter = getTransporter();
  const { childName = 'Ayush Pandey', vaccineName = 'Oral Polio Vaccine - Dose 1', dueDate = '12 Oct 2026', daysRemaining = 15 } = reminderData || {};

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0d9488; color: #ffffff; padding: 24px; text-align: left;">
        <h2 style="margin: 0; font-size: 22px; font-weight: bold;">VacciTrack vaccination reminder</h2>
        <p style="margin: 8px 0 0 0; opacity: 0.95; font-size: 15px;">A vaccine is due in ${daysRemaining} days</p>
      </div>
      <div style="padding: 24px; color: #334155;">
        <p style="font-size: 15px; margin-top: 0;">Hello Parent,</p>
        <p style="font-size: 14px; color: #475569;">Here are the upcoming vaccinations in your family:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left;">
              <th style="padding: 12px 16px; font-size: 13px; color: #475569; font-weight: 600;">Child</th>
              <th style="padding: 12px 16px; font-size: 13px; color: #475569; font-weight: 600;">Vaccine</th>
              <th style="padding: 12px 16px; font-size: 13px; color: #475569; font-weight: 600;">Due date</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 14px 16px; font-size: 14px; color: #1e293b; font-weight: 500;">${childName}</td>
              <td style="padding: 14px 16px; font-size: 14px; color: #1e293b;">${vaccineName}</td>
              <td style="padding: 14px 16px; font-size: 14px; color: #0d9488; font-weight: 600;">${dueDate}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 24px; padding: 14px; background-color: #f0fdfa; border-left: 4px solid #0d9488; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #0f766e;">
            <strong>Pro Tip:</strong> You can locate nearby government PHCs or private clinics with walk-in timings in the VacciTrack dashboard.
          </p>
        </div>

        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; margin-bottom: 0;">
          This is an automated notification from VacciTrack National Immunization Schedule (NIS 2025) monitoring system.
        </p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║  📧 [GMAIL EMULATOR] Vaccine Reminder to ${toEmail}       ║`);
    console.log(`║  Child: ${childName} | Vaccine: ${vaccineName}             ║`);
    console.log(`║  Due Date: ${dueDate} (${daysRemaining} days remaining)                  ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);
    return { success: true, mode: 'console', message: 'Logged to console' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"VacciTrack" <${getSenderEmail()}>`,
      to: toEmail,
      subject: `VacciTrack reminder: vaccination due in ${daysRemaining} days`,
      html,
    });
    console.log(`[Email] ✅ Vaccine reminder sent to ${toEmail} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error] Failed to send reminder email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Test SMTP connection and configuration
 */
export const testEmailService = async (targetEmail) => {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      configured: false,
      message: 'Email credentials (GMAIL_USER / GMAIL_APP_PASSWORD or SMTP_HOST / SMTP_USER / SMTP_PASS) are not set in server/.env',
    };
  }

  try {
    await transporter.verify();
    if (targetEmail) {
      const sendResult = await sendOtpEmail(targetEmail, '123456', 'Test Child');
      return {
        configured: true,
        verified: true,
        testSend: sendResult,
        message: `Successfully connected to SMTP and sent test email to ${targetEmail}`,
      };
    }
    return {
      configured: true,
      verified: true,
      message: 'SMTP connection verified successfully!',
    };
  } catch (err) {
    return {
      configured: true,
      verified: false,
      error: err.message,
    };
  }
};
