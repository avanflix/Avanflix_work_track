import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { taskService } from "@/services/taskService";
import { notificationService } from "@/services/notificationService";
import { taskProgressUpdateSchema, delaySubmissionSchema, delayReviewSchema } from "@/lib/validations";
import { can } from "@/utils/permissions";

/**
 * POST /api/tasks/:id/updates
 * Body must include `kind`: "progress" | "delay" | "delay-review"
 * so a single endpoint can serve the employee update flow, the delay
 * submission flow, and the admin delay review flow, each fully validated.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as any).role;
  const actor = { id: session.user.id as string, name: session.user.name ?? "User" };
  const body = await req.json();

  const task = await taskService.findById(id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const assignedId = (task as any).assignedTo?._id?.toString();
  const createdById = (task as any).createdBy?._id?.toString();
  // Update Task is available to: the assignee, the admin who owns (created) the task, or Super Admin.
  const canUpdateTask =
    assignedId === actor.id || (role === "ADMIN" && createdById === actor.id) || role === "SUPER_ADMIN";

  if (body.kind === "progress") {
    if (!canUpdateTask) {
      return NextResponse.json({ error: "You do not have permission to update this task" }, { status: 403 });
    }
    const parsed = taskProgressUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const updated = await taskService.recordProgressUpdate(id, parsed.data, actor);

    if (parsed.data.status === "COMPLETED") {
      await notificationService.create({
        recipient: (task as any).createdBy?._id?.toString(),
        title: "Task completed",
        message: `${actor.name} completed "${(task as any).title}"`,
        type: "TASK_COMPLETED",
        relatedTask: id,
      });
    }

    if (parsed.data.status === "ISSUE") {
      await notificationService.create({
        recipient: (task as any).createdBy?._id?.toString(),
        title: "Issue reported on task",
        message: `${actor.name} reported an issue on "${(task as any).title}": ${parsed.data.issueDescription}`,
        type: "TASK_ISSUE",
        relatedTask: id,
      });
    }

    return NextResponse.json(updated);
  }

  if (body.kind === "delay") {
    if (assignedId !== actor.id) {
      return NextResponse.json({ error: "Only the assignee can submit a delay" }, { status: 403 });
    }
    const parsed = delaySubmissionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const updated = await taskService.submitDelay(id, parsed.data, actor);
    await notificationService.create({
      recipient: (task as any).createdBy?._id?.toString(),
      title: "Delay reason submitted",
      message: `${actor.name} submitted a delay reason for "${(task as any).title}"`,
      type: "DELAY_SUBMITTED",
      relatedTask: id,
    });
    return NextResponse.json(updated);
  }

  if (body.kind === "delay-review") {
    if (!can(role, "REVIEW_DELAY")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const parsed = delayReviewSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const updated = await taskService.reviewDelay(id, parsed.data.status, actor);
    await notificationService.create({
      recipient: assignedId,
      title: `Delay ${parsed.data.status.toLowerCase()}`,
      message: `Your delay request for "${(task as any).title}" was ${parsed.data.status.toLowerCase()}`,
      type: "DELAY_REVIEWED",
      relatedTask: id,
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown update kind" }, { status: 400 });
}
