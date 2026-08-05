import { Schema, model, models, Model, Document } from "mongoose";

export interface ITaskUpdateDoc extends Document {
  task: Schema.Types.ObjectId;
  updatedBy: Schema.Types.ObjectId;
  status?: string;
  progressPercent?: number;
  workDone?: string;
  comment?: string;
  issueDescription?: string;
  timeSpentMinutes?: number;
  estimatedCompletionDate?: Date;
  createdAt: Date;
}

const TaskUpdateSchema = new Schema<ITaskUpdateDoc>(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String },
    progressPercent: { type: Number },
    workDone: { type: String },
    comment: { type: String },
    issueDescription: { type: String },
    timeSpentMinutes: { type: Number },
    estimatedCompletionDate: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const TaskUpdate: Model<ITaskUpdateDoc> =
  models.TaskUpdate || model<ITaskUpdateDoc>("TaskUpdate", TaskUpdateSchema);
export default TaskUpdate;
