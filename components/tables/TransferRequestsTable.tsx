"use client";

import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDecideTransfer } from "@/hooks/useTransfers";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { Check, X } from "lucide-react";

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export function TransferRequestsTable({
  requests,
  loading,
  showActions = false,
}: {
  requests: any[];
  loading?: boolean;
  showActions?: boolean;
}) {
  const decide = useDecideTransfer();

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
      </div>
    );
  }

  if (!requests.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No transfer requests to show.
      </div>
    );
  }

  function act(id: string, decision: "approve" | "reject") {
    toast.promise(decide.mutateAsync({ id, decision }), {
      loading: decision === "approve" ? "Approving..." : "Rejecting...",
      success: decision === "approve" ? "Transfer approved" : "Transfer rejected",
      error: (err) => err?.message ?? "Failed to update transfer request",
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Requested by</TableHead>
          <TableHead>Transfer to</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Requested</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((r: any) => (
          <TableRow key={r._id}>
            <TableCell className="font-medium">
              <Link href={`/dashboard/tasks/${r.task?._id ?? r.task}`} className="hover:text-primary hover:underline">
                {r.task?.title ?? "Task"}
              </Link>
            </TableCell>
            <TableCell>{r.requestedByName} <span className="text-xs text-muted-foreground">({r.requestedByRole.replace("_", " ")})</span></TableCell>
            <TableCell>{r.transferToName}</TableCell>
            <TableCell className="max-w-64 truncate" title={r.reason}>{r.reason}</TableCell>
            <TableCell><Badge variant={STATUS_TONE[r.status]}>{r.status}</Badge></TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.requestedAt ?? r.createdAt)}</TableCell>
            {showActions && (
              <TableCell className="text-right">
                {r.status === "PENDING" ? (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => act(r._id, "approve")} disabled={decide.isPending}>
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => act(r._id, "reject")} disabled={decide.isPending}>
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {r.approvedByName ? `${r.status === "APPROVED" ? "Approved" : "Rejected"} by ${r.approvedByName}` : "—"}
                  </span>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
