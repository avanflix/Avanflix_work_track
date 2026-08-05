import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import PasswordResetOTP from "@/models/PasswordResetOTP";
import { forgotPasswordSchema } from "@/lib/validations";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { sendOtpEmail } from "@/lib/mailer";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// POST /api/auth/forgot-password - request an OTP to be emailed to the account's address.
// Always responds with a generic success message so this endpoint can't be used to
// enumerate which emails have accounts.
export async function POST(req: NextRequest) {
  // Per-IP limit to slow down abuse/enumeration attempts.
  if (!rateLimit(`forgot-password:${getClientKey(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests, please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  // Also throttle per-email, independent of IP.
  if (!rateLimit(`forgot-password-email:${email}`, 3, 5 * 60_000)) {
    return NextResponse.json({ error: "Too many requests, please try again shortly." }, { status: 429 });
  }

  const genericResponse = NextResponse.json({
    message: "If an account exists for that email, we've sent a verification code to it.",
  });

  await connectDB();
  const user = await User.findOne({ email });

  // Don't reveal account existence or active/disabled state here.
  if (!user || !user.isActive) {
    return genericResponse;
  }

  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const otpHash = await bcrypt.hash(otp, 10);

  // Invalidate any previous outstanding OTPs for this email before issuing a new one.
  await PasswordResetOTP.deleteMany({ email });
  await PasswordResetOTP.create({
    email,
    otpHash,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return NextResponse.json({ error: "Could not send verification email. Please try again later." }, { status: 502 });
  }

  return genericResponse;
}
