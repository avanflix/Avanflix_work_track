import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { transferService } from "@/services/transferService";
import { notificationService } from "@/services/notificationService";
import { can } from "@/utils/permissions";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const { id } = await params;

  const request: any = await transferService.findById(id);
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "This transfer request has already been reviewed" }, { status: 400 });
  }

  const requiredPermission = request.requestedByRole === "ADMIN" ? "APPROVE_ADMIN_TRANSFER" : "APPROVE_EMPLOYEE_TRANSFER";
  if (!can(role, requiredPermission)) {
    return NextResponse.json({ error: "You do not have permission to reject this transfer" }, { status: 403 });
  }

  const approver = { id: session.user.id as string, name: session.user.name ?? "Admin" };
  const updated = await transferService.decide(id, "REJECTED", approver);

  await notificationService.create({
    recipient: request.requestedBy.toString(),
    title: "Transfer rejected",
    message: `${approver.name} rejected your transfer request for "${request.task?.title ?? "the task"}"`,
    type: "GENERAL",
    relatedTask: request.task?._id?.toString() ?? request.task?.toString(),
  });

  return NextResponse.json(updated);
}
