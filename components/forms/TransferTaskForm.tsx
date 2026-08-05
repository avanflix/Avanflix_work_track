"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRequestTransfer } from "@/hooks/useTransfers";
import { useEmployees } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function TransferTaskForm({
  taskId,
  excludeUserId,
  onSuccess,
}: {
  taskId: string;
  excludeUserId?: string;
  onSuccess?: () => void;
}) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const requestTransfer = useRequestTransfer(taskId);
  const [transferTo, setTransferTo] = useState("");
  const [reason, setReason] = useState("");

  // Employees can transfer to any active colleague; Admins can transfer to admins or employees.
  const { data: users, isLoading } = useEmployees(role === "EMPLOYEE" ? {} : { role: "ADMIN,EMPLOYEE" });
  const candidates = (users?.items ?? []).filter((u: any) => u._id !== excludeUserId);

  async function submit() {
    if (!transferTo) {
      toast.error("Select who to transfer this task to");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for the transfer");
      return;
    }
    try {
      await requestTransfer.mutateAsync({ transferTo, reason });
      toast.success("Transfer request submitted for approval");
      setTransferTo("");
      setReason("");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit transfer request");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Transfer to</Label>
        <Select value={transferTo} onValueChange={setTransferTo}>
          <SelectTrigger><SelectValue placeholder={isLoading ? "Loading..." : "Select a colleague"} /></SelectTrigger>
          <SelectContent>
            {candidates.map((u: any) => (
              <SelectItem key={u._id} value={u._id}>
                {u.name} {u.role !== "EMPLOYEE" ? `(${u.role.replace("_", " ")})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Reason <span className="text-destructive">*</span></Label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          placeholder="Why does this task need to be transferred?"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {role === "ADMIN"
          ? "This request needs Super Admin approval."
          : "This request needs Admin approval."}
      </p>

      <Button onClick={submit} disabled={requestTransfer.isPending} className="w-full">
        {requestTransfer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit transfer request
      </Button>
    </div>
  );
}
