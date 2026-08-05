import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import TransferRequest from "@/models/TransferRequest";
import type { UserRole } from "@/types";

export const transferService = {
  async create(input: {
    taskId: string;
    transferTo: string;
    transferToName: string;
    reason: string;
    requester: { id: string; name: string; role: UserRole };
    previousAssignee: string;
  }) {
    await connectDB();

    const request = await TransferRequest.create({
      task: input.taskId,
      requestedBy: input.requester.id,
      requestedByName: input.requester.name,
      requestedByRole: input.requester.role,
      transferTo: input.transferTo,
      transferToName: input.transferToName,
      reason: input.reason,
      status: "PENDING",
      previousAssignee: input.previousAssignee,
    });

    await Task.findByIdAndUpdate(input.taskId, {
      $push: {
        timeline: {
          timestamp: new Date(),
          author: input.requester.id,
          authorName: input.requester.name,
          action: "Transfer requested",
          note: `To ${input.transferToName}: ${input.reason}`,
        },
      },
    });

    return request.toObject();
  },

  async findById(id: string) {
    await connectDB();
    return TransferRequest.findById(id).populate("task").lean();
  },

  async listForTask(taskId: string) {
    await connectDB();
    return TransferRequest.find({ task: taskId }).populate("task", "title").sort({ createdAt: -1 }).lean();
  },

  /**
   * Requests awaiting a decision from this approver. Admins see employee-initiated
   * requests; Super Admin sees admin-initiated requests (and can also see everything).
   */
  async listPendingForApprover(role: UserRole) {
    await connectDB();
    const roleFilter =
      role === "SUPER_ADMIN"
        ? { requestedByRole: "ADMIN" }
        : { requestedByRole: "EMPLOYEE" };

    return TransferRequest.find({ status: "PENDING", ...roleFilter })
      .populate("task", "title deadline status")
      .sort({ createdAt: -1 })
      .lean();
  },

  async listMine(userId: string) {
    await connectDB();
    return TransferRequest.find({ requestedBy: userId })
      .populate("task", "title deadline status")
      .sort({ createdAt: -1 })
      .lean();
  },

  async decide(
    id: string,
    decision: "APPROVED" | "REJECTED",
    approver: { id: string; name: string }
  ) {
    await connectDB();
    const request: any = await TransferRequest.findById(id);
    if (!request) return null;
    if (request.status !== "PENDING") return request.toObject();

    request.status = decision;
    request.approvedBy = approver.id;
    request.approvedByName = approver.name;
    request.approvedDate = new Date();
    await request.save();

    if (decision === "APPROVED") {
      await Task.findByIdAndUpdate(request.task, {
        assignedTo: request.transferTo,
        $push: {
          timeline: {
            timestamp: new Date(),
            author: approver.id,
            authorName: approver.name,
            action: `Transfer approved`,
            note: `Transferred to ${request.transferToName}`,
          },
        },
      });
    } else {
      await Task.findByIdAndUpdate(request.task, {
        $push: {
          timeline: {
            timestamp: new Date(),
            author: approver.id,
            authorName: approver.name,
            action: "Transfer rejected",
            note: `Requested transfer to ${request.transferToName} was rejected`,
          },
        },
      });
    }

    return request.toObject();
  },
};
