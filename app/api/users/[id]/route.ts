import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userService } from "@/services/userService";
import { updateUserStatusSchema } from "@/lib/validations";
import { can } from "@/utils/permissions";

// GET /api/users/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as any).role;

  // Employees may only fetch their own profile
  if (role === "EMPLOYEE" && session.user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await userService.findById(id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...user, passwordHash: undefined });
}

// PATCH /api/users/:id - activate/deactivate (Super Admin only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const body = await req.json();
  // Update availability

  const permission = body.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER";
  if (!can(role, permission as any)) {
    return NextResponse.json({ error: "Only Super Admin can change account status" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = updateUserStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.isActive === undefined) {
    return NextResponse.json(
      { error: "isActive is required" },
      { status: 400 }
    );
  }

  const updated = await userService.setActive(
    id,
    parsed.data.isActive
  );
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...updated, passwordHash: undefined });
}

// DELETE /api/users/:id - Super Admin only
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const { id } = await params;
  const target = await userService.findById(id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permission = target.role === "ADMIN" ? "DELETE_ADMIN" : "DELETE_EMPLOYEE";
  if (!can(role, permission as any)) {
    return NextResponse.json({ error: "Only Super Admin can delete users" }, { status: 403 });
  }

  await userService.delete(id);
  return NextResponse.json({ success: true });
}
