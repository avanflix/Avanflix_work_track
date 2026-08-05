import { Schema, model, models, Model } from "mongoose";
import type { IDepartment } from "@/types";

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Department: Model<IDepartment> =
  models.Department || model<IDepartment>("Department", DepartmentSchema);
export default Department;
