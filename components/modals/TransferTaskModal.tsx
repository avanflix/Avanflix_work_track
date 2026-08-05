"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TransferTaskForm } from "@/components/forms/TransferTaskForm";
import { ArrowRightLeft } from "lucide-react";

export function TransferTaskModal({
  taskId,
  taskTitle,
  excludeUserId,
}: {
  taskId: string;
  taskTitle: string;
  excludeUserId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <ArrowRightLeft className="h-3.5 w-3.5" /> Transfer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer task</DialogTitle>
          <DialogDescription>{taskTitle}</DialogDescription>
        </DialogHeader>
        <TransferTaskForm taskId={taskId} excludeUserId={excludeUserId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
