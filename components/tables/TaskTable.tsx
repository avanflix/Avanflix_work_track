"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UpdateTaskModal } from "@/components/modals/UpdateTaskModal";
import { EditTaskModal } from "../modals/EditTaskModal";
import { TransferTaskModal } from "@/components/modals/TransferTaskModal";
import { formatDate, isOverdue } from "@/lib/utils";

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "secondary",
  NOTICED: "default",
  IN_PROGRESS: "default",
  COMPLETED: "success",
  ISSUE: "destructive",
  DELAYED: "destructive",
  CANCELLED: "secondary",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "PENDING",
  NOTICED: "NOTICED",
  IN_PROGRESS: "WORKING ON IT",
  COMPLETED: "COMPLETED",
  ISSUE: "ISSUE",
  DELAYED: "DELAYED",
  CANCELLED: "CANCELLED",
};

const PRIORITY_TONE: Record<string, "default" | "success" | "warning" | "destructive"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "destructive",
};

export function TaskTable({
  tasks,
  loading,
  showEmployee = false,
  compact = false,
}: {
  tasks: any[];
  loading?: boolean;
  showEmployee?: boolean;
  compact?: boolean;
}) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userId = session?.user?.id;

  const router = useRouter();

  const deleteTask = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete task");
      }

      alert("Task deleted successfully");

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No tasks to show yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          {showEmployee && <TableHead>Employee</TableHead>}
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Deadline</TableHead>
          {<TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const assignedId = task.assignedTo?._id ?? task.assignedTo;

          const isAssignee = assignedId === userId;

          // Only employees can update their own assigned tasks.
          // Admins and Super Admins have view-only access.
          const canUpdate =
            (
              (role === "EMPLOYEE" && isAssignee) ||
              (role === "ADMIN") ||
              (role === "SUPER_ADMIN")
            ) &&
            task.status !== "COMPLETED" &&
            task.status !== "CANCELLED";
          // Employees can request transfer of their own active tasks.
          const canTransfer =
            role === "EMPLOYEE" &&
            isAssignee &&
            task.status !== "COMPLETED" &&
            task.status !== "CANCELLED";
          const isClosed = task.status === "COMPLETED" || task.status === "CANCELLED";

          return (
            <TableRow key={task._id}>
              <TableCell className="font-medium">
                <Link href={`/dashboard/tasks/${task._id}`} className="hover:text-primary hover:underline">
                  {task.title}
                </Link>
                {!compact && <div className="text-xs text-muted-foreground">{task.department}</div>}
              </TableCell>
              {showEmployee && (
                <TableCell>
                  <div className="font-medium">
                    {task.assignedTo?.name ?? "Unassigned"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {task.assignedTo?.designation ?? task.assignedTo?.email ?? ""}
                  </div>
                </TableCell>
              )}
              <TableCell>
                <Badge variant={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_TONE[task.status]}>{STATUS_LABEL[task.status] ?? task.status.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell className="w-32">{task.completionPercent}%</TableCell>
              <TableCell className={isOverdue(task.deadline) && task.status !== "COMPLETED" ? "text-destructive" : ""}>
                {formatDate(task.deadline)}
              </TableCell>
              {(
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">

                    {canUpdate && !isClosed && (
                      <UpdateTaskModal
                        taskId={task._id}
                        taskTitle={task.title}
                        currentStatus={task.status}
                        currentProgress={task.completionPercent}
                      />
                    )}

                    {canTransfer && !isClosed && (
                      <TransferTaskModal
                        taskId={task._id}
                        taskTitle={task.title}
                        excludeUserId={userId}
                      />
                    )}

                    {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                      <div className="flex items-center justify-end gap-2">
                        <EditTaskModal
                          task={task}
                          trigger={
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />

                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() => deleteTask(task._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
