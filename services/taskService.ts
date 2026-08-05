import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import TaskUpdate from "@/models/TaskUpdate";
import type { TaskPriority, TaskStatus } from "@/types";

export interface TaskQueryOptions {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  department?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

export const taskService = {

  async markOverdueTasks() {
    await connectDB();

    // Start of today in UTC
    const now = new Date();

    const todayUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      )
    );

    await Task.updateMany(
      {
        deadline: {
          $lt: todayUTC,
        },
        status: {
          $nin: [
            "COMPLETED",
            "DELAYED",
            "CANCELLED",
          ],
        },
      },
      {
        $set: {
          status: "DELAYED",
        },
        $push: {
          timeline: {
            timestamp: new Date(),
            author: null,
            authorName: "System",
            action:
              "Task automatically marked as delayed because the deadline has passed.",
          },
        },
      }
    );
  },
  async list(options: TaskQueryOptions = {}) {

    await this.markOverdueTasks();

    await connectDB();
    const { search, status, priority, department, assignedTo, page = 1, limit = 20 } = options;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (department) filter.department = department;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Task.find(filter)
        .populate("assignedTo", "name email department")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  },

  async findById(id: string) {
    await connectDB();
    return Task.findById(id)
      .populate("assignedTo", "name email department")
      .populate("createdBy", "name email")
      .lean();
  },

  async create(input: {
    title: string;
    description: string;
    priority: TaskPriority;
    department: string;
    assignedTo: string;
    createdBy: string;
    createdByName: string;
    startDate: string;
    deadline: string;
    estimatedHours?: number;
  }) {
    await connectDB();
    const [sy, sm, sd] = input.startDate.split("-").map(Number);
    const startDate = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0));

    const [year, month, day] = input.deadline.split("-").map(Number);
    const deadline = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const task = await Task.create({
      title: input.title,
      description: input.description,
      priority: input.priority,
      department: input.department,
      assignedTo: input.assignedTo,
      createdBy: input.createdBy,
      startDate,
      deadline,
      estimatedHours: input.estimatedHours,
      status: "PENDING",
      completionPercent: 0,
      timeline: [
        {
          timestamp: new Date(),
          author: input.createdBy,
          authorName: input.createdByName,
          action: "Task assigned",
        },
      ],
    });
    return task.toObject();
  },

  /**
   * Employee-side progress update: appends a TaskUpdate record (for the
   * audit trail / reporting) and a human-readable timeline entry, then
   * syncs the task's own status/progress fields.
   */
  async recordProgressUpdate(
    taskId: string,
    input: {
      status?: TaskStatus;
      progressPercent?: number;
      workDone?: string;
      comment?: string;
      issueDescription?: string;
      timeSpentMinutes?: number;
      estimatedCompletionDate?: string;
    },
    actor: { id: string; name: string }
  ) {
    await connectDB();

    // Completed tasks are always 100% progress regardless of what was submitted.
    const effectiveProgress = input.status === "COMPLETED" ? 100 : input.progressPercent;

    // Every update is preserved as its own audit-trail entry (Feature 4: never overwrite previous updates).
    await TaskUpdate.create({
      task: taskId,
      updatedBy: actor.id,
      ...input,
      progressPercent: effectiveProgress,
    });

    const STATUS_LABEL: Record<string, string> = {
      PENDING: "Pending",
      NOTICED: "Noticed",
      IN_PROGRESS: "Working on it",
      COMPLETED: "Completed",
      ISSUE: "Issue reported",
      DELAYED: "Delayed",
      CANCELLED: "Cancelled",
    };

    const actions: string[] = [];
    if (input.status) actions.push(`Status changed to ${STATUS_LABEL[input.status] ?? input.status}`);
    if (typeof effectiveProgress === "number") actions.push(`Progress updated to ${effectiveProgress}%`);
    if (input.workDone) actions.push(`Work done: ${input.workDone}`);
    if (input.comment) actions.push(`Comment: ${input.comment}`);
    if (input.status === "ISSUE" && input.issueDescription) actions.push(`Issue: ${input.issueDescription}`);
    if (input.status === "IN_PROGRESS" && input.estimatedCompletionDate) {
      actions.push(`Estimated completion: ${new Date(input.estimatedCompletionDate).toLocaleString()}`);
    }

    const update: Record<string, unknown> = {
      lastUpdatedBy: actor.id,
      lastUpdatedAt: new Date(),
    };
    if (input.status) update.status = input.status;
    if (typeof effectiveProgress === "number") update.completionPercent = effectiveProgress;
    if (input.workDone || input.comment) update.remarks = input.comment ?? input.workDone;
    // Keep the task's current-issue explanation and ETA in sync: set them when
    // relevant, and clear them once the assignee moves the task past that state.
    const unset: Record<string, string> = {};
    if (input.status === "ISSUE") {
      update.currentIssue = input.issueDescription;
    } else if (input.status) {
      unset.currentIssue = "";
    }
    if (input.status === "IN_PROGRESS" && input.estimatedCompletionDate) {
      update.estimatedCompletionDate = new Date(input.estimatedCompletionDate);
    } else if (input.status === "COMPLETED" || input.status === "CANCELLED") {
      unset.estimatedCompletionDate = "";
    }
    if (typeof input.timeSpentMinutes === "number") {
      update.$inc = { timeSpentMinutes: input.timeSpentMinutes };
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        ...update,
        ...(Object.keys(unset).length ? { $unset: unset } : {}),
        $push: {
          timeline: {
            timestamp: new Date(),
            author: actor.id,
            authorName: actor.name,
            action: actions.join("; ") || "Task updated",
            note: input.status === "ISSUE" ? input.issueDescription : input.comment,
          },
        },
      },
      { new: true }
    ).lean();

    return task;
  },

  /**
   * All tasks with a deadline, unpaginated, for calendar rendering.
   * Scoped by the same visibility rules as the list endpoint (employees only see their own).
   */
  async listForCalendar(options: { assignedTo?: string } = {}) {
    await this.markOverdueTasks();

    await connectDB();
    const filter: Record<string, unknown> = {};
    if (options.assignedTo) filter.assignedTo = options.assignedTo;

    return Task.find(filter)
      .select("title status deadline completionPercent assignedTo")
      .populate("assignedTo", "name")
      .sort({ deadline: 1 })
      .lean();
  },

  async submitDelay(
    taskId: string,
    input: { reason: string; expectedCompletionDate: string },
    actor: { id: string; name: string }
  ) {
    await connectDB();
    return Task.findByIdAndUpdate(
      taskId,
      {
        status: "DELAYED",
        delaySubmission: {
          reason: input.reason,
          expectedCompletionDate: new Date(input.expectedCompletionDate),
          submittedAt: new Date(),
          status: "PENDING",
        },
        $push: {
          timeline: {
            timestamp: new Date(),
            author: actor.id,
            authorName: actor.name,
            action: "Delay reason submitted",
            note: input.reason,
          },
        },
      },
      { new: true }
    ).lean();
  },

  async reviewDelay(
    taskId: string,
    decision: "APPROVED" | "REJECTED",
    reviewer: { id: string; name: string }
  ) {
    await connectDB();
    return Task.findByIdAndUpdate(
      taskId,
      {
        "delaySubmission.status": decision,
        "delaySubmission.reviewedBy": reviewer.id,
        "delaySubmission.reviewedAt": new Date(),
        $push: {
          timeline: {
            timestamp: new Date(),
            author: reviewer.id,
            authorName: reviewer.name,
            action: `Delay ${decision.toLowerCase()}`,
          },
        },
      },
      { new: true }
    ).lean();
  },

  async update(
    id: string,
    input: {
      title: string;
      description: string;
      priority: TaskPriority;
      department: string;
      assignedTo: string;
      startDate: string;
      deadline: string;
      estimatedHours?: number;
      updatedBy: string;
      updatedByName: string;
    }
  ) {
    await connectDB();

    const [sy, sm, sd] = input.startDate.split("-").map(Number);
    const startDate = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0));

    const [dy, dm, dd] = input.deadline.split("-").map(Number);
    const deadline = new Date(Date.UTC(dy, dm - 1, dd, 23, 59, 59, 999));

    const task = await Task.findByIdAndUpdate(
      id,
      {
        title: input.title,
        description: input.description,
        priority: input.priority,
        department: input.department,
        assignedTo: input.assignedTo,
        startDate,
        deadline,
        estimatedHours: input.estimatedHours,
        lastUpdatedBy: input.updatedBy,
        lastUpdatedAt: new Date(),

        $push: {
          timeline: {
            timestamp: new Date(),
            author: input.updatedBy,
            authorName: input.updatedByName,
            action: "Task details updated",
          },
        },
      },
      { new: true }
    ).lean();

    return task;
  },

  async delete(id: string) {
    await connectDB();
    return Task.findByIdAndDelete(id).lean();
  },

  async statsForAdmin() {
    await this.markOverdueTasks();

    await connectDB();
    const [
      totalEmployees,
      activeEmployees,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      delayedTasks,
      issueTasks,
      upcomingDeadlines,
    ] = await Promise.all([
      (await import("@/models/User")).default.countDocuments({ role: { $ne: "SUPER_ADMIN" } }),
      (await import("@/models/User")).default.countDocuments({ role: { $ne: "SUPER_ADMIN" }, isActive: true }),
      Task.countDocuments({ status: "PENDING" }),
      Task.countDocuments({ status: { $in: ["IN_PROGRESS", "NOTICED"] } }),
      Task.countDocuments({ status: "COMPLETED" }),
      Task.countDocuments({ status: "DELAYED" }),
      Task.countDocuments({ status: "ISSUE" }),
      Task.countDocuments({
        deadline: { $gte: new Date(), $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        status: { $in: ["PENDING", "IN_PROGRESS", "NOTICED"] },
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      delayedTasks,
      issueTasks,
      upcomingDeadlines,
    };
  },

  async statsForEmployee(employeeId: string) {
    await this.markOverdueTasks();
    await connectDB();
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const [today, pending, completed, delayed] = await Promise.all([
      Task.countDocuments({ assignedTo: employeeId, deadline: { $gte: startOfDay, $lte: endOfDay } }),
      Task.countDocuments({ assignedTo: employeeId, status: { $in: ["PENDING", "NOTICED", "IN_PROGRESS", "ISSUE"] } }),
      Task.countDocuments({ assignedTo: employeeId, status: "COMPLETED" }),
      Task.countDocuments({ assignedTo: employeeId, status: "DELAYED" }),
    ]);

    return { today, pending, completed, delayed };
  },
};
