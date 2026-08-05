import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { taskService } from "@/services/taskService";

// GET /api/tasks/calendar - all tasks with deadlines, scoped like the task list
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const assignedTo = role === "EMPLOYEE" ? (session.user.id as string) : undefined;

  const items = await taskService.listForCalendar({ assignedTo });
  return NextResponse.json({ items });
}
