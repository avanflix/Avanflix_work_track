import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { taskService } from "@/services/taskService";
import { notificationService } from "@/services/notificationService";
import { userService } from "@/services/userService";
import { createTaskSchema } from "@/lib/validations";
import { can } from "@/utils/permissions";
import { rateLimit, getClientKey } from "@/lib/rateLimit";

// GET /api/tasks - list tasks, scoped by role
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const { searchParams } = new URL(req.url);

  // Employees may only ever see their own tasks, regardless of query params
  const assignedTo =
    role === "EMPLOYEE"
      ? session.user.id
      : searchParams.get("assignedTo") ??
      searchParams.get("employeeId") ??
      undefined;
  const result = await taskService.list({
    search: searchParams.get("search") ?? undefined,
    status: (searchParams.get("status") as any) ?? undefined,
    priority: (searchParams.get("priority") as any) ?? undefined,
    department: searchParams.get("department") ?? undefined,
    assignedTo,
    page: Number(searchParams.get("page") ?? 1),
    limit: Number(searchParams.get("limit") ?? 20),
  });

  return NextResponse.json(result);
}

// POST /api/tasks - create + assign task (Admin/Super Admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`create-task:${getClientKey(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 });
  }

  const role = (session.user as any).role;
  if (!can(role, "ASSIGN_TASK")) {
    return NextResponse.json({ error: "You do not have permission to assign tasks" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const assignee = await userService.findById(parsed.data.assignedTo);
  if (!assignee) {
    return NextResponse.json({ error: "Selected assignee was not found" }, { status: 400 });
  }
  const allowedAssigneeRoles =
    role === "SUPER_ADMIN" ? ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] : ["ADMIN", "EMPLOYEE"];
  if (!allowedAssigneeRoles.includes((assignee as any).role)) {
    return NextResponse.json(
      {
        error:
          role === "SUPER_ADMIN"
            ? "Tasks can only be assigned to admins or employees"
            : "Admins can assign tasks to fellow admins or employees",
      },
      { status: 403 }
    );
  }

  const task = await taskService.create({
    ...parsed.data,
    createdBy: session.user.id as string,
    createdByName: session.user.name ?? "Admin",
  });

  await notificationService.create({
    recipient: parsed.data.assignedTo,
    title: "New task assigned",
    message: `You have been assigned: "${parsed.data.title}"`,
    type: "TASK_ASSIGNED",
    relatedTask: (task as any)._id.toString(),
  });

  return NextResponse.json(task, { status: 201 });
}
