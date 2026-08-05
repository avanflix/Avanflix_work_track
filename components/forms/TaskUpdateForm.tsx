"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateTaskProgress } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Not Started" },
  { value: "IN_PROGRESS", label: "Working On It" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ISSUE", label: "Issue" },
];

export function TaskUpdateForm({
  taskId,
  currentStatus,
  currentProgress = 0,
  onSuccess,
}: {
  taskId: string;
  currentStatus: string;
  currentProgress?: number;
  onSuccess?: () => void;
}) {
  const updateProgress = useUpdateTaskProgress(taskId);
  const [status, setStatus] = useState(
    STATUS_OPTIONS.some((o) => o.value === currentStatus) ? currentStatus : "PENDING"
  );
  const [progress, setProgress] = useState(currentProgress);
  const [workDone, setWorkDone] = useState("");
  const [comment, setComment] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [timeSpent, setTimeSpent] = useState("");

  const isIssue = status === "ISSUE";
  const isWorkingOnIt = status === "IN_PROGRESS";
  const isCompleted = status === "COMPLETED";

  function onStatusChange(next: string) {
    setStatus(next);
    // Feature 3: Completed automatically sets progress to 100% and hides the ETA field.
    if (next === "COMPLETED") {
      setProgress(100);
      setEstimatedCompletionDate("");
    }
  }

  async function submit() {
    if (isIssue && !issueDescription.trim()) {
      toast.error("Please explain what the issue is");
      return;
    }
    if (isWorkingOnIt && !estimatedCompletionDate) {
      toast.error("Please provide an estimated completion date & time");
      return;
    }
    try {
      await updateProgress.mutateAsync({
        status: status as any,
        progressPercent: isCompleted ? 100 : progress,
        workDone: workDone || undefined,
        comment: comment || undefined,
        issueDescription: isIssue ? issueDescription : undefined,
        estimatedCompletionDate: isWorkingOnIt ? estimatedCompletionDate : undefined,
        timeSpentMinutes: timeSpent ? Number(timeSpent) : undefined,
      });
      toast.success("Task updated");
      setWorkDone("");
      setComment("");
      setIssueDescription("");
      setEstimatedCompletionDate("");
      setTimeSpent("");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update task");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Current status</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Work done</Label>
        <textarea
          value={workDone}
          onChange={(e) => setWorkDone(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          placeholder="What did you complete?"
        />
      </div>

      <div className="space-y-2">
        <Label>Comments</Label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          placeholder="Anything the assigner should know"
        />
      </div>

      <div className="space-y-2">
        <Label>Time spent (minutes)</Label>
        <Input type="number" min={0} value={timeSpent} onChange={(e) => setTimeSpent(e.target.value)} placeholder="90" />
      </div>

      {/* Feature 3: conditional fields */}
      {isIssue && (
        <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <Label>Issue reason <span className="text-destructive">*</span></Label>
          <textarea
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
            placeholder="Explain exactly what's blocking this task"
          />
          <p className="text-xs text-muted-foreground">This will be sent to whoever assigned the task.</p>
        </div>
      )}

      {isWorkingOnIt && (
        <div className="space-y-2 rounded-xl border border-border bg-secondary/40 p-3">
          <Label>Estimated completion date &amp; time <span className="text-destructive">*</span></Label>
          <Input
            type="datetime-local"
            value={estimatedCompletionDate}
            onChange={(e) => setEstimatedCompletionDate(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Progress</Label>
          <span className="text-sm font-medium text-primary">{isCompleted ? 100 : progress}%</span>
        </div>
        <Slider
          value={isCompleted ? 100 : progress}
          onValueChange={setProgress}
          disabled={isCompleted}
        />
      </div>

      <Button onClick={submit} disabled={updateProgress.isPending} className="w-full">
        {updateProgress.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Update Task
      </Button>
    </div>
  );
}
