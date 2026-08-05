"use client";

import { use } from "react";
import { useSession } from "next-auth/react";
import { useTask, useReviewDelay } from "@/hooks/useTasks";
import { useTaskTransferHistory } from "@/hooks/useTransfers";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskTimeline } from "@/components/dashboard/TaskTimeline";
import { TaskUpdateForm } from "@/components/forms/TaskUpdateForm";
import { DelayForm } from "@/components/forms/DelayForm";
import { TransferTaskModal } from "@/components/modals/TransferTaskModal";
import { TransferRequestsTable } from "@/components/tables/TransferRequestsTable";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { can } from "@/utils/permissions";
import { toast } from "sonner";

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userId = session?.user?.id;
  const { data: task, isLoading } = useTask(id);
  const reviewDelay = useReviewDelay(id);
  const { data: transferHistory } = useTaskTransferHistory(id);

  if (isLoading || !task) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const isAssignee = task.assignedTo?._id === userId;
  const isOwningAdmin = role === "ADMIN" && task.createdBy?._id === userId;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const canUpdate = isAssignee || isOwningAdmin || isSuperAdmin;
  const overdue = isOverdue(task.deadline) && !["COMPLETED", "CANCELLED"].includes(task.status);
  const pendingDelay = task.delaySubmission?.status === "PENDING";
  const isClosed = task.status === "COMPLETED" || task.status === "CANCELLED";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription>{task.department} · Assigned to {task.assignedTo?.name}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={task.priority === "HIGH" ? "destructive" : task.priority === "MEDIUM" ? "warning" : "success"}>
              {task.priority}
            </Badge>
            <Badge
              variant={
                task.status === "COMPLETED"
                  ? "success"
                  : ["DELAYED", "ISSUE"].includes(task.status)
                    ? "destructive"
                    : "default"
              }
            >
              {task.status === "IN_PROGRESS" ? "WORKING ON IT" : task.status.replace("_", " ")}
            </Badge>
            {isAssignee && !isClosed && (
              <TransferTaskModal taskId={id} taskTitle={task.title} excludeUserId={userId} />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{task.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Start date</p>
              <p className="font-medium">{formatDate(task.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className={`font-medium ${overdue ? "text-destructive" : ""}`}>{formatDate(task.deadline)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estimated hours</p>
              <p className="font-medium">{task.estimatedHours ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time spent</p>
              <p className="font-medium">{Math.round((task.timeSpentMinutes ?? 0) / 60 * 10) / 10}h</p>
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Completion</span>
              <span>{task.completionPercent}%</span>
            </div>
            <Progress value={task.completionPercent} />
          </div>

          {task.status === "IN_PROGRESS" && task.estimatedCompletionDate && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
              <p className="font-medium text-warning">Estimated completion</p>
              <p className="text-muted-foreground">{formatDateTime(task.estimatedCompletionDate)}</p>
            </div>
          )}

          {task.status === "ISSUE" && task.currentIssue && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-medium text-destructive">Issue reported</p>
              <p className="text-muted-foreground">{task.currentIssue}</p>
            </div>
          )}

          {task.delaySubmission && (
            <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
              <p className="font-medium">Delay submission — {task.delaySubmission.status}</p>
              <p className="text-muted-foreground">{task.delaySubmission.reason}</p>
              <p className="text-xs text-muted-foreground">
                Expected completion: {formatDate(task.delaySubmission.expectedCompletionDate)}
              </p>
              {pendingDelay && can(role, "REVIEW_DELAY") && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      toast.promise(reviewDelay.mutateAsync("APPROVED"), {
                        loading: "Approving...",
                        success: "Delay approved",
                        error: "Failed to approve",
                      })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toast.promise(reviewDelay.mutateAsync("REJECTED"), {
                        loading: "Rejecting...",
                        success: "Delay rejected",
                        error: "Failed to reject",
                      })
                    }
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {canUpdate && !isClosed && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Update Task</CardTitle></CardHeader>
              <CardContent>
                <TaskUpdateForm taskId={id} currentStatus={task.status} currentProgress={task.completionPercent} />
              </CardContent>
            </Card>
            {overdue && isAssignee && !pendingDelay && <DelayForm taskId={id} />}
          </div>
        )}

        <Card className={canUpdate && !isClosed ? "" : "lg:col-span-2"}>
          <CardHeader><CardTitle>Activity timeline</CardTitle></CardHeader>
          <CardContent><TaskTimeline entries={task.timeline ?? []} /></CardContent>
        </Card>
      </div>

      {!!transferHistory?.items?.length && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer history</CardTitle>
            <CardDescription>Every transfer request made for this task.</CardDescription>
          </CardHeader>
          <CardContent>
            <TransferRequestsTable requests={transferHistory.items} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
