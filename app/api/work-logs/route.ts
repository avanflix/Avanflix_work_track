import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { workLogService } from "@/services/workLogServices";
import { createWorkLogSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  const requester = { id: session.user.id, role };

  const { searchParams } = new URL(req.url);

  try {
    // No params at all -> classic "give me today's own log" behaviour used
    // by the quick-submit form.
    if (!searchParams.toString()) {
      const log = await workLogService.findToday(session.user.id);
      return NextResponse.json(log);
    }

    const employee = searchParams.get("employee") ?? undefined;
    const date = searchParams.get("date") ?? undefined;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);

    // Employees can only ever query their own logs, regardless of what
    // `employee` they pass in.
    const scopedEmployee = role === "EMPLOYEE" ? session.user.id : employee;

    const logs = await workLogService.list(
      { employee: scopedEmployee, date, startDate, endDate, page, limit },
      requester
    );

    return NextResponse.json(logs);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Unable to fetch work logs." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const input = createWorkLogSchema.parse(body);

    // Every user (Employee or Admin) submits/edits their OWN daily log.
    // Passing `date` lets the same endpoint be used from the calendar to
    // back-fill / correct a previous day (within the 30-day edit window).
    const workLog = await workLogService.upsert({
      employee: session.user.id,
      date: input.date,
      summary: input.summary,
      blockers: input.blockers,
      notes: input.notes,
    });

    return NextResponse.json(workLog, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unable to save work log." },
      { status: 400 }
    );
  }
}
