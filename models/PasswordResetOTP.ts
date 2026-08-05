import { Schema, model, models, Model, Document } from "mongoose";

export interface IPasswordResetOTP extends Document {
  email: string;
  otpHash: string;
  attempts: number;
  verified: boolean;
  resetTokenHash?: string;
  expiresAt: Date;
  createdAt: Date;
}

const PasswordResetOTPSchema = new Schema<IPasswordResetOTP>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    resetTokenHash: { type: String },
    // TTL index: MongoDB deletes the document automatically once expiresAt passes,
    // so unverified/expired/used OTPs never linger.
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const PasswordResetOTP: Model<IPasswordResetOTP> =
  models.PasswordResetOTP || model<IPasswordResetOTP>("PasswordResetOTP", PasswordResetOTPSchema);
export default PasswordResetOTP;
