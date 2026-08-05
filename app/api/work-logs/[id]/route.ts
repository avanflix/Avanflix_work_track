import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { workLogService } from "@/services/workLogServices";
import { createWorkLogSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const workLog = await workLogService.findById(id);

  if (!workLog) {
    return NextResponse.json({ error: "Work log not found." }, { status: 404 });
  }

  const targetId = String((workLog as any).employee._id);

  const allowed = await workLogService.assertCanAccessEmployee(
    { id: session.user.id, role: session.user.role },
    targetId
  );

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(workLog);
}

export async function PATCH(
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

  const { id } = await params;

  const existing = await workLogService.findById(id);

  if (!existing) {
    return NextResponse.json(
      { error: "Work log not found." },
      { status: 404 }
    );
  }

  if (String((existing as any).employee._id) !== session.user.id) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    const input = createWorkLogSchema.parse(body);

    const updated = await workLogService.update(id, {
      summary: input.summary,
      blockers: input.blockers,
      notes: input.notes,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message || "Unable to update work log.",
      },
      {
        status: 400,
      }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await workLogService.findById(id);

  if (!existing) {
    return NextResponse.json({ error: "Work log not found." }, { status: 404 });
  }

  const targetId = String((existing as any).employee._id);

  // Only Admin/Super Admin can delete, and only within their visibility
  // scope (Admin cannot delete another Admin's log; Super Admin can delete
  // anyone's).
  if (session.user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowed = await workLogService.assertCanAccessEmployee(
    { id: session.user.id, role: session.user.role },
    targetId
  );

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await workLogService.delete(id);

  return NextResponse.json({ success: true });
}
