import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { taskService } from "@/services/taskService";
import { transferService } from "@/services/transferService";
import { notificationService } from "@/services/notificationService";
import { userService } from "@/services/userService";
import { transferRequestSchema } from "@/lib/validations";
import { can } from "@/utils/permissions";

// POST /api/tasks/:id/transfer - Employee or Admin requests to transfer their task
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const actor = { id: session.user.id as string, name: session.user.name ?? "User", role };

  if (!can(role, "REQUEST_TRANSFER")) {
    return NextResponse.json({ error: "You do not have permission to request a transfer" }, { status: 403 });
  }

  const { id } = await params;
  const task = await taskService.findById(id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assignedId = (task as any).assignedTo?._id?.toString();
  if (assignedId !== actor.id) {
    return NextResponse.json({ error: "Only the current assignee can request a transfer" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = transferRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const transferTo = await userService.findById(parsed.data.transferTo);
  if (!transferTo) return NextResponse.json({ error: "Selected user was not found" }, { status: 400 });

  const request = await transferService.create({
    taskId: id,
    transferTo: parsed.data.transferTo,
    transferToName: (transferTo as any).name,
    reason: parsed.data.reason,
    requester: actor,
    previousAssignee: assignedId,
  });

  // Notify whoever must approve: Admin approves employee transfers, Super Admin approves admin transfers.
  const approvers = await userService.list({
    role: role === "ADMIN" ? "SUPER_ADMIN" : (["SUPER_ADMIN", "ADMIN"] as any),
    isActive: true,
    limit: 50,
  });
  await Promise.all(
    approvers.items.map((approver: any) =>
      notificationService.create({
        recipient: approver._id.toString(),
        title: "Transfer request pending approval",
        message: `${actor.name} requested to transfer "${(task as any).title}" to ${(transferTo as any).name}`,
        type: "GENERAL",
        relatedTask: id,
      })
    )
  );

  return NextResponse.json(request, { status: 201 });
}

// GET /api/tasks/:id/transfer - transfer history for this task
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const items = await transferService.listForTask(id);
  return NextResponse.json({ items });
}
