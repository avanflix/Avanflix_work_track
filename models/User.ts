import { Schema, model, models, Model } from "mongoose";
import type { IUser } from "@/types";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    employeeId: { type: String, unique: true, sparse: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"],
      required: true,
      default: "EMPLOYEE",
    },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    joiningDate: { type: Date },
    isActive: { type: Boolean, default: true },
    availabilityStatus: {
      type: String,
      enum: ["ACTIVE", "ON_LEAVE", "INACTIVE"],
      default: "ACTIVE",
    },
    availability: {
      type: String,
      enum: [
        "AVAILABLE",
        "ON_LEAVE",
        "WFH",
        "HALF_DAY",
        "INACTIVE",
      ],
      default: "AVAILABLE",
    },

    leaveFrom: {
      type: Date,
      default: null,
    },

    leaveTo: {
      type: Date,
      default: null,
    },

    leaveReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

UserSchema.index({ name: "text", email: "text", department: "text" });

const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
export default User;
