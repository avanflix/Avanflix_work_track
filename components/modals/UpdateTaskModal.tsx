"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TaskUpdateForm } from "@/components/forms/TaskUpdateForm";
import { Pencil } from "lucide-react";

export function UpdateTaskModal({
  taskId,
  taskTitle,
  currentStatus,
  currentProgress,
}: {
  taskId: string;
  taskTitle: string;
  currentStatus: string;
  currentProgress: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="h-3.5 w-3.5" /> Update Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update task</DialogTitle>
          <DialogDescription>{taskTitle}</DialogDescription>
        </DialogHeader>
        <TaskUpdateForm
          taskId={taskId}
          currentStatus={currentStatus}
          currentProgress={currentProgress}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
