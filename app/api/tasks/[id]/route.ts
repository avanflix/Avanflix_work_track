import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { taskService } from "@/services/taskService";
import { notificationService } from "@/services/notificationService";
import { can } from "@/utils/permissions";

// GET /api/tasks/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await taskService.findById(id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = (session.user as any).role;
  const assignedId = (task as any).assignedTo?._id?.toString();
  if (role === "EMPLOYEE" && assignedId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(task);
}

// PUT /api/tasks/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const role = (session.user as any).role;

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json();

  const { id } = await params;

  const task = await taskService.update(id, {
    title: body.title,
    description: body.description,
    priority: body.priority,
    department: body.department,
    assignedTo: body.assignedTo,
    startDate: body.startDate,
    deadline: body.deadline,
    estimatedHours: body.estimatedHours,
    updatedBy: session.user.id!,
    updatedByName: session.user.name ?? "Admin",
  });

  return NextResponse.json(task);
}

// DELETE /api/tasks/:id - Super Admin only
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!can(role, "DELETE_TASK")) {
    return NextResponse.json({ error: "Only Super Admin can delete tasks" }, { status: 403 });
  }

  const { id } = await params;
  await taskService.delete(id);
  return NextResponse.json({ success: true });
}
