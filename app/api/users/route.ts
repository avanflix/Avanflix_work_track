import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userService } from "@/services/userService";
import { createEmployeeSchema } from "@/lib/validations";
import { can } from "@/utils/permissions";
import { rateLimit, getClientKey } from "@/lib/rateLimit";

// GET /api/users - list users. Full directory is Admin/Super Admin only; Employees get a
// minimal, active-only slice (name/role/department) so features like Transfer Task can
// populate a "who to transfer to" dropdown without exposing the full directory.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const isFullDirectory = can(role, "VIEW_ALL_EMPLOYEES");

  const { searchParams } = new URL(req.url);
  const roleParam = searchParams.get("role");
  const availabilityStatus = searchParams.get("availabilityStatus");

  const result = await userService.list({
    search: searchParams.get("search") ?? undefined,
    department: searchParams.get("department") ?? undefined,
    role: roleParam
      ? ((roleParam.includes(",") ? roleParam.split(",") : roleParam) as any)
      : undefined,
    isActive: isFullDirectory
      ? searchParams.has("isActive")
        ? searchParams.get("isActive") === "true"
        : undefined
      : true,
    availabilityStatus: availabilityStatus
      ? (availabilityStatus as "ACTIVE" | "ON_LEAVE" | "INACTIVE")
      : undefined,
    page: Number(searchParams.get("page") ?? 1),
    limit: Number(searchParams.get("limit") ?? (isFullDirectory ? 20 : 100)),
  });

  const sanitized = result.items.map((u: any) =>
    isFullDirectory
      ? { ...u, passwordHash: undefined }
      : { _id: u._id, name: u.name, role: u.role, department: u.department }
  );
  return NextResponse.json({ ...result, items: sanitized });
}

// POST /api/users - create Admin or Employee (Super Admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`create-user:${getClientKey(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 });
  }

  const role = (session.user as any).role;
  const body = await req.json();
  const permission = body.role === "ADMIN" ? "ADD_ADMIN" : "ADD_EMPLOYEE";
  if (!can(role, permission)) {
    return NextResponse.json({ error: "Only Super Admin can create users" }, { status: 403 });
  }

  const parsed = createEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await userService.create(parsed.data);
    return NextResponse.json({ ...user, passwordHash: undefined }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to create user" }, { status: 400 });
  }
}
