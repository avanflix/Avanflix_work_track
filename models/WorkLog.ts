import mongoose, { Schema, Document, Model } from "mongoose";

export type WorkLogStatus =
  | "WORKING"
  | "COMPLETED"
  | "DELAYED"
  | "ON_HOLD";

export interface IWorkLog extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;

  tasks: mongoose.Types.ObjectId[];

  summary: string;

  progress: number;

  status: WorkLogStatus;

  blockers?: string;

  notes?: string;

  expectedCompletionDate?: Date;

  submittedAt: Date;
}

const WorkLogSchema = new Schema<IWorkLog>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],

    summary: {
      type: String,
      required: true,
      trim: true,
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "WORKING",
        "COMPLETED",
        "DELAYED",
        "ON_HOLD",
      ],
      default: "WORKING",
    },

    blockers: String,

    notes: String,

    expectedCompletionDate: Date,

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * One work log per employee per day
 */
WorkLogSchema.index(
  {
    employee: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

export const WorkLog: Model<IWorkLog> =
  mongoose.models.WorkLog ||
  mongoose.model<IWorkLog>("WorkLog", WorkLogSchema);