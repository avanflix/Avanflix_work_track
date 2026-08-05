"use client";

import { CalendarDays, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTasks } from "@/hooks/useTasks";
import { TaskTable } from "@/components/tables/TaskTable";

export function EmployeeOverview() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: myTasks, isLoading: tasksLoading } = useTasks({ limit: "8" });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">My dashboard</h1>
        <p className="text-sm text-muted-foreground">Here's what's on your plate today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Today's tasks" value={stats.today} icon={CalendarDays} />
        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="warning" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="success" />
        <StatCard label="Delayed" value={stats.delayed} icon={AlertTriangle} tone="destructive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskTable tasks={myTasks?.items ?? []} loading={tasksLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
