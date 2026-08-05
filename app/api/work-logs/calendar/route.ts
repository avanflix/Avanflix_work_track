import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { workLogService } from "@/services/workLogServices";
import { workLogCalendarQuerySchema } from "@/lib/validations";

/**
 * GET /api/work-logs/calendar?year=2026&month=7&employeeId=<optional>
 *
 * Returns a full month grid ({ year, month, days: [{ date, log, ... }] })
 * for a single employee, matching the "monthly calendar" layout from the
 * Excel tracker.
 *
 *  - EMPLOYEE      -> employeeId is ignored, always their own calendar.
 *  - ADMIN         -> may view their own calendar, or any EMPLOYEE's
 *                     calendar (not another Admin's).
 *  - SUPER_ADMIN   -> may view their own, any ADMIN's, or any EMPLOYEE's
 *                     calendar.
 */
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const parsed = workLogCalendarQuerySchema.safeParse({
    year: searchParams.get("year") ?? new Date().getFullYear(),
    month: searchParams.get("month") ?? new Date().getMonth() + 1,
    employeeId: searchParams.get("employeeId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { year, month, employeeId } = parsed.data;

  const targetEmployeeId =
    session.user.role === "EMPLOYEE" ? session.user.id : employeeId ?? session.user.id;

  const allowed = await workLogService.assertCanAccessEmployee(
    { id: session.user.id, role: session.user.role },
    targetEmployeeId
  );

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const calendar = await workLogService.monthly(targetEmployeeId, year, month);

    return NextResponse.json({ employeeId: targetEmployeeId, ...calendar });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Unable to load calendar." }, { status: 500 });
  }
}
