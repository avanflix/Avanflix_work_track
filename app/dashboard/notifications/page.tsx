"use client";

import { useNotifications, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllNotificationsRead();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay on top of task activity.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {isLoading && (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          )}
          {!isLoading && !data?.items?.length && (
            <div className="p-8 text-center text-sm text-muted-foreground">You're all caught up.</div>
          )}
          {data?.items?.map((n: any) => (
            <div key={n._id} className={cn("flex items-start gap-3 p-4", !n.isRead && "bg-primary/5")}>
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
