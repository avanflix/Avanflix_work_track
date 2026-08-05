import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import PasswordResetOTP from "@/models/PasswordResetOTP";
import { resetPasswordSchema } from "@/lib/validations";
import { rateLimit, getClientKey } from "@/lib/rateLimit";

// POST /api/auth/reset-password - final step: consumes the reset token issued by
// /api/auth/verify-otp and sets the new password.
export async function POST(req: NextRequest) {
  if (!rateLimit(`reset-password:${getClientKey(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests, please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const { resetToken, password } = parsed.data;

  await connectDB();
  const record = await PasswordResetOTP.findOne({ email }).sort({ createdAt: -1 });

  const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  if (
    !record ||
    !record.verified ||
    record.resetTokenHash !== tokenHash ||
    record.expiresAt.getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "This reset link has expired. Please request a new code." },
      { status: 400 }
    );
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Account not found." }, { status: 400 });
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();

  // Consume the OTP/reset token so it can't be reused.
  await PasswordResetOTP.deleteOne({ _id: record._id });

  return NextResponse.json({ message: "Password updated. You can now sign in." });
}
