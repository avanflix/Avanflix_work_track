"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSubmitDelay } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function DelayForm({ taskId }: { taskId: string }) {
  const submitDelay = useSubmitDelay(taskId);
  const [reason, setReason] = useState("");
  const [expectedDate, setExpectedDate] = useState("");

  async function submit() {
    if (!reason || !expectedDate) {
      toast.error("Please provide a reason and expected completion date");
      return;
    }
    try {
      await submitDelay.mutateAsync({ reason, expectedCompletionDate: expectedDate });
      toast.success("Delay reason submitted for review");
      setReason("");
      setExpectedDate("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit delay reason");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
      <p className="text-sm font-medium text-warning">This task is past its deadline</p>
      <div className="space-y-2">
        <Label>Reason for delay</Label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain what caused the delay" />
      </div>
      <div className="space-y-2">
        <Label>New expected completion date</Label>
        <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
      </div>
      <Button onClick={submit} disabled={submitDelay.isPending} variant="outline" className="w-full">
        {submitDelay.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit delay reason
      </Button>
    </div>
  );
}
