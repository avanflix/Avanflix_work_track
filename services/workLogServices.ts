import { connectDB } from "@/lib/db";
import { WorkLog } from "@/models/WorkLog";
import User from "@/models/User";
import type { UserRole } from "@/types";
import { getWorkLogVisibleRoles } from "@/utils/permissions";

/** How far back a work log can still be created/edited. Matches the
 * "store previous days up to one month" requirement. */
export const WORK_LOG_EDIT_WINDOW_DAYS = 3;

export interface WorkLogQueryOptions {
  employee?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface RequestingUser {
  id: string;
  role: UserRole;
}

function startOfDay(input: Date | string) {
  const d = new Date(input);

  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate()
    )
  );
}

function endOfDayExclusive(input: Date | string) {
  const d = startOfDay(input);
  d.setDate(d.getDate() + 1);
  return d;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export const workLogService = {
  /**
   * Resolves the list of employee _ids that `requester` is allowed to view
   * work logs for. Always includes the requester's own id.
   *   EMPLOYEE    -> [self]
   *   ADMIN       -> [self, ...every EMPLOYEE]
   *   SUPER_ADMIN -> [self, ...every ADMIN, ...every EMPLOYEE]
   */
  async getVisibleEmployeeIds(requester: RequestingUser): Promise<string[]> {
    await connectDB();

    const visibleRoles = getWorkLogVisibleRoles(requester.role);

    if (visibleRoles.length === 0) {
      return [requester.id];
    }

    const others = await User.find({ role: { $in: visibleRoles } })
      .select("_id")
      .lean();

    const ids = new Set<string>([requester.id, ...others.map((u: any) => String(u._id))]);
    return Array.from(ids);
  },

  /**
   * Confirms `requester` is allowed to view/edit the work logs belonging to
   * `targetEmployeeId`. Looks up the target's role to enforce the
   * Admin-can't-see-Admin rule.
   */
  async assertCanAccessEmployee(requester: RequestingUser, targetEmployeeId: string) {
    if (requester.id === targetEmployeeId) return true;

    await connectDB();

    const target = await User.findById(targetEmployeeId).select("role").lean();
    if (!target) return false;

    const visibleRoles = getWorkLogVisibleRoles(requester.role);
    return visibleRoles.includes((target as any).role);
  },

  async list(options: WorkLogQueryOptions = {}, requester: RequestingUser) {
    await connectDB();

    const { employee, date, startDate, endDate, page = 1, limit = 20 } = options;

    const visibleIds = await this.getVisibleEmployeeIds(requester);

    const filter: Record<string, unknown> = {};

    if (employee) {
      // Requester explicitly asked for one person's logs - make sure that
      // person is inside their visibility scope.
      if (!visibleIds.includes(employee)) {
        return { items: [], total: 0, page, limit };
      }
      filter.employee = employee;
    } else {
      // No specific employee requested -> constrain to everything the
      // requester is allowed to see (self, or self+team depending on role).
      filter.employee = { $in: visibleIds };
    }

    if (date) {
      filter.date = { $gte: startOfDay(date), $lt: endOfDayExclusive(date) };
    } else if (startDate || endDate) {
      const range: Record<string, Date> = {};
      if (startDate) range.$gte = startOfDay(startDate);
      if (endDate) range.$lt = endOfDayExclusive(endDate);
      filter.date = range;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      WorkLog.find(filter)
        .populate("employee", "name email department role")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WorkLog.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  },

  async findById(id: string) {
    await connectDB();

    return WorkLog.findById(id).populate("employee", "name email department role").lean();
  },

  async findToday(employeeId: string) {
    await connectDB();

    const start = startOfDay(new Date());
    const end = endOfDayExclusive(start);

    return WorkLog.findOne({ employee: employeeId, date: { $gte: start, $lt: end } })
      .populate("employee", "name email department role")
      .lean();
  },

  async findByDate(employeeId: string, date: string) {
    await connectDB();

    const start = startOfDay(date);
    const end = endOfDayExclusive(start);

    return WorkLog.findOne({ employee: employeeId, date: { $gte: start, $lt: end } })
      .populate("employee", "name email department role")
      .lean();
  },

  /**
   * Returns a full calendar grid for the given month for one employee:
   * every day of the month, paired with that day's work log (or null).
   * Only looks back/forward within the WORK_LOG_EDIT_WINDOW_DAYS-aware
   * editable flag so the UI can grey out days that can no longer be edited.
   */
  async monthly(employeeId: string, year: number, month: number /* 1-12 */) {
    await connectDB();

    const monthStart = new Date(year, month - 1, 1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(year, month, 1);
    monthEnd.setHours(0, 0, 0, 0);

    const logs = await WorkLog.find({
      employee: employeeId,
      date: { $gte: monthStart, $lt: monthEnd },
    })
      .populate("employee", "name email department role")
      .lean();

    const byDate = new Map<string, any>();
    for (const log of logs) {
      byDate.set(toDateKey(new Date((log as any).date)), log);
    }

    const today = startOfDay(new Date());

    const earliestEditable = new Date(today);
    earliestEditable.setDate(today.getDate() - WORK_LOG_EDIT_WINDOW_DAYS);

    const daysInMonth = new Date(year, month, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month - 1, i + 1);
      const key = toDateKey(date);

      const isSunday = date.getDay() === 0;

      const isFuture = date.getTime() > today.getTime();

      const isEditable =
        !isFuture &&
        !isSunday &&
        date.getTime() >= earliestEditable.getTime();

      return {
        date: key,
        log: byDate.get(key) ?? null,
        isFuture,
        isEditable,
        isSunday,
      };
    });

    return { year, month, days };
  },

  /**
   * Creates or updates the work log for `employee` on `date` (defaults to
   * today). One log per employee per day - resubmitting the same date
   * edits the existing entry instead of erroring, which is what lets
   * employees/admins keep their daily log up to date throughout the day
   * and still go back and fix an earlier day within the edit window.
   */
  async upsert(input: {
    employee: string;
    date?: string;
    summary: string;
    blockers?: string;
    notes?: string;
  }) {
    await connectDB();

    const targetDate = startOfDay(input.date ?? new Date());

    const workLog = await WorkLog.findOne({
      employee: input.employee,
      date: targetDate,
    });

    if (workLog) {
      workLog.summary = input.summary;
      workLog.blockers = input.blockers ?? "";
      workLog.notes = input.notes ?? "";
      workLog.submittedAt = new Date();

      await workLog.save();

      return WorkLog.findById(workLog._id)
        .populate("employee", "name email department role")
        .lean();
    }

    const created = await WorkLog.create({
      employee: input.employee,
      date: targetDate,
      summary: input.summary,
      blockers: input.blockers ?? "",
      notes: input.notes ?? "",
      submittedAt: new Date(),
    });

    return WorkLog.findById(created._id)
      .populate("employee", "name email department role")
      .lean();
  },

  async update(
    id: string,
    input: {
      summary: string;
      blockers?: string;
      notes?: string;
    }
  ) {
    await connectDB();

    const updated = await WorkLog.findByIdAndUpdate(
      id,
      {
        $set: {
          summary: input.summary,
          blockers: input.blockers ?? "",
          notes: input.notes ?? "",
          submittedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("employee", "name email department role");

    if (!updated) {
      throw new Error("Work log not found");
    }

    return updated.toObject();
  },

  async delete(id: string) {
    await connectDB();

    return WorkLog.findByIdAndDelete(id).lean();
  },

  async employeeHistory(employeeId: string) {
    await connectDB();

    return WorkLog.find({ employee: employeeId })
      .populate("employee", "name email department role")
      .sort({ date: -1 })
      .lean();
  },

  async todaysSubmissions(requester: RequestingUser) {
    await connectDB();

    const visibleIds = await this.getVisibleEmployeeIds(requester);

    const start = startOfDay(new Date());
    const end = endOfDayExclusive(start);

    return WorkLog.find({
      employee: { $in: visibleIds },
      date: { $gte: start, $lt: end },
    })
      .populate("employee", "name email department role")
      .sort({ createdAt: -1 })
      .lean();
  },
};
