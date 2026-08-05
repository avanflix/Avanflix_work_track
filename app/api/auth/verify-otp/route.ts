import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import PasswordResetOTP from "@/models/PasswordResetOTP";
import { verifyOtpApiSchema } from "@/lib/validations";
import { rateLimit, getClientKey } from "@/lib/rateLimit";

const MAX_ATTEMPTS = 5;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes to complete the reset after verifying

// POST /api/auth/verify-otp - verify the 6-digit code and, if valid, issue a one-time
// reset token the client must present to /api/auth/reset-password.
export async function POST(req: NextRequest) {
  if (!rateLimit(`verify-otp:${getClientKey(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests, please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = verifyOtpApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const { otp } = parsed.data;

  await connectDB();
  const record = await PasswordResetOTP.findOne({ email }).sort({ createdAt: -1 });

  if (!record || record.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Code expired or invalid. Please request a new one." }, { status: 400 });
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await PasswordResetOTP.deleteOne({ _id: record._id });
    return NextResponse.json(
      { error: "Too many incorrect attempts. Please request a new code." },
      { status: 400 }
    );
  }

  const valid = await bcrypt.compare(otp, record.otpHash);
  if (!valid) {
    record.attempts += 1;
    await record.save();
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  // OTP is correct: mint a one-time reset token, store only its hash, and extend the
  // expiry window slightly so the user has time to set a new password.
  const resetToken = crypto.randomBytes(32).toString("hex");
  record.resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  record.verified = true;
  record.expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await record.save();

  return NextResponse.json({ resetToken });
}
