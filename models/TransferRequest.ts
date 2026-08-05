import { Schema, model, models, Model, Document } from "mongoose";

export interface ITransferRequestDoc extends Document {
  task: Schema.Types.ObjectId;
  requestedBy: Schema.Types.ObjectId;
  requestedByName: string;
  requestedByRole: "EMPLOYEE" | "ADMIN" | "SUPER_ADMIN";
  transferTo: Schema.Types.ObjectId;
  transferToName: string;
  reason: string;
  requestedAt: Date;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: Schema.Types.ObjectId;
  approvedByName?: string;
  approvedDate?: Date;
  // The prior assignee, so we know who the task moves *from* once approved.
  previousAssignee: Schema.Types.ObjectId;
}

const TransferRequestSchema = new Schema<ITransferRequestDoc>(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedByName: { type: String, required: true },
    requestedByRole: { type: String, enum: ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"], required: true },
    transferTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    transferToName: { type: String, required: true },
    reason: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING", index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedByName: { type: String },
    approvedDate: { type: Date },
    previousAssignee: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const TransferRequest: Model<ITransferRequestDoc> =
  models.TransferRequest || model<ITransferRequestDoc>("TransferRequest", TransferRequestSchema);
export default TransferRequest;
