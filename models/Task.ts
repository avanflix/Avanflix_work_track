import { Schema, model, models, Model } from "mongoose";
import type { ITask } from "@/types";

const TimelineEntrySchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    action: { type: String, required: true },
    note: { type: String },
  },
  { _id: false }
);

const DelaySubmissionSchema = new Schema(
  {
    reason: { type: String, required: true },
    expectedCompletionDate: { type: Date, required: true },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { _id: false }
);

const TaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    department: { type: String, required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    deadline: { type: Date, required: true },
    estimatedHours: { type: Number },
    status: {
      type: String,
      enum: ["PENDING", "NOTICED", "IN_PROGRESS", "COMPLETED", "ISSUE", "DELAYED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
    remarks: { type: String },
    currentIssue: { type: String },
    timeSpentMinutes: { type: Number, default: 0 },
    delaySubmission: { type: DelaySubmissionSchema, default: undefined },
    timeline: { type: [TimelineEntrySchema], default: [] },
    estimatedCompletionDate: { type: Date },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

TaskSchema.index({ title: "text", description: "text" });

const Task: Model<ITask> = models.Task || model<ITask>("Task", TaskSchema);
export default Task;
