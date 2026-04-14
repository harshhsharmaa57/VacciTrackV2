import crypto from 'crypto';

/**
 * Generate a cryptographically secure 6-digit OTP.
 * @returns {string} 6-digit OTP string (zero-padded)
 */
export const generateOtp = () => {
  const otp = crypto.randomInt(0, 1000000);
  return otp.toString().padStart(6, '0');
};

/**
 * Normalize an Indian phone number to +91XXXXXXXXXX format.
 * Accepts: 9876543210, +919876543210, 919876543210, +91 98765 43210
 * @param {string} phone - Raw phone input
 * @returns {string|null} Normalized phone or null if invalid
 */
export const normalizePhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const match = cleaned.match(/^(?:\+?91)?(\d{10})$/);
  if (!match) return null;
  return `+91${match[1]}`;
};

/**
 * Validate that a phone number is a valid Indian mobile number.
 * @param {string} phone - Phone number (raw or normalized)
 * @returns {boolean}
 */
export const isValidIndianPhone = (phone) => {
  return normalizePhone(phone) !== null;
};

/**
 * Mask phone number for display. Shows only last 4 digits.
 * e.g. +919876543210 → "******3210"
 * @param {string} phone - Normalized phone number
 * @returns {string} Masked phone
 */
export const maskPhone = (phone) => {
  if (!phone || phone.length < 4) return '****';
  return '******' + phone.slice(-4);
};

// ──────────────────────────────────────────────
// SMS Provider: Twilio (Global — Free trial $15 credit)
// Sign up: https://www.twilio.com/try-twilio (no card needed)
// ──────────────────────────────────────────────
const sendViaTwilio = async (phone, otp) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are not configured');
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authString = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const body = new URLSearchParams({
    To: phone,
    From: fromNumber,
    Body: `Your VacciTrack verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[SMS:Twilio] Error:', data);
    throw new Error(data.message || 'Twilio SMS delivery failed');
  }

  console.log(`[SMS:Twilio] ✅ OTP sent to ${maskPhone(phone)} | sid=${data.sid}`);
  return { success: true, message: 'OTP sent via Twilio', sid: data.sid };
};

// ──────────────────────────────────────────────
// SMS Provider: Fast2SMS (India — ₹100 minimum)
// Sign up: https://www.fast2sms.com
// ──────────────────────────────────────────────
const sendViaFast2SMS = async (phone, otp) => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    throw new Error('FAST2SMS_API_KEY is not configured');
  }

  const mobileNumber = phone.replace('+91', '');

  const body = new URLSearchParams({
    route: 'q',
    message: `Your VacciTrack verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    flash: '0',
    numbers: mobileNumber,
  });

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'authorization': apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok || data.return === false) {
    console.error('[SMS:Fast2SMS] Error:', data);
    const errMsg = Array.isArray(data.message) ? data.message[0] : (data.message || 'Fast2SMS delivery failed');
    throw new Error(errMsg);
  }

  console.log(`[SMS:Fast2SMS] ✅ OTP sent to ${maskPhone(phone)} | request_id=${data.request_id}`);
  return { success: true, message: 'OTP sent via Fast2SMS', requestId: data.request_id };
};

// ──────────────────────────────────────────────
// Main send function — dispatches to configured provider
// ──────────────────────────────────────────────
/**
 * Send OTP via SMS using the configured provider.
 *
 * Set SMS_PROVIDER env var:
 *   'console'  — Development (logs OTP, no real SMS)
 *   'fast2sms' — India (paid, ₹100 min)
 *   'twilio'   — Global (free $15 trial credit)
 *
 * @param {string} phone - Normalized +91XXXXXXXXXX phone number
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const sendOtp = async (phone, otp) => {
  const provider = process.env.SMS_PROVIDER || 'console';

  try {
    switch (provider) {
      case 'fast2sms':
        return await sendViaFast2SMS(phone, otp);

      case 'twilio':
        return await sendViaTwilio(phone, otp);

      case 'console':
      default:
        // Development mode — log to console, OTP is passed back to frontend
        console.log('╔═══════════════════════════════════════════╗');
        console.log(`║  📱 OTP for ${maskPhone(phone)}: ${otp}        ║`);
        console.log('╚═══════════════════════════════════════════╝');
        return {
          success: true,
          message: 'OTP logged to console (dev mode)',
        };
    }
  } catch (error) {
    console.error(`[SMS:${provider}] Failed:`, error.message);
    return {
      success: false,
      message: `SMS delivery failed: ${error.message}`,
    };
  }
};
