"use client";

import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TransferRequestsTable } from "@/components/tables/TransferRequestsTable";
import { useTransferRequests } from "@/hooks/useTransfers";
import { isAdminLike } from "@/utils/permissions";

export default function TransfersPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const admin = isAdminLike(role);

  const pending = useTransferRequests("pending");
  const mine = useTransferRequests("mine");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Transfers</h1>
        <p className="text-sm text-muted-foreground">
          {admin ? "Review and approve task transfer requests." : "Track the status of your transfer requests."}
        </p>
      </div>

      {admin && (
        <Card>
          <CardHeader>
            <CardTitle>Pending your approval</CardTitle>
            <CardDescription>
              {role === "SUPER_ADMIN" ? "Admin-requested transfers need your sign-off." : "Employee-requested transfers need your sign-off."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransferRequestsTable requests={pending.data?.items ?? []} loading={pending.isLoading} showActions />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My requests</CardTitle>
          <CardDescription>Transfers you've requested and their current status.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransferRequestsTable requests={mine.data?.items ?? []} loading={mine.isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
