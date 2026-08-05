import nodemailer from "nodemailer";

/**
 * SMTP transporter for transactional email (currently: password-reset OTPs).
 * Configure via env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE ("true"/"false"), SMTP_USER, SMTP_PASSWORD, SMTP_FROM
 */
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (and optionally SMTP_SECURE, SMTP_FROM) in .env.local."
    );
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587/25 (STARTTLS)
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });

  return transporter;
}

export async function sendOtpEmail(to: string, otp: string) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await getTransporter().sendMail({
    from: `"Avan Flix" <${from}>`,
    to,
    subject: "Your password reset code",
    text: `Your password reset code is ${otp}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 4px;">Reset your password</h2>
        <p style="color: #555;">Use the code below to reset your Avan Flix account password. It expires in 10 minutes.</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; background: #f4f4f5; padding: 16px 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
