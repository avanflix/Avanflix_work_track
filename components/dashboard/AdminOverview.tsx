"use client";

import { Users, UserCheck, UserX, Clock, CheckCircle2, AlertTriangle, AlertOctagon, CalendarClock, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { TasksByStatusChart } from "@/components/charts/TasksByStatusChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTasks } from "@/hooks/useTasks";
import { TaskTable } from "@/components/tables/TaskTable";

export function AdminOverview() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: recentTasks, isLoading: tasksLoading } = useTasks({ limit: "6" });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const chartData = [
    { name: "Pending", value: stats.pendingTasks },
    { name: "In Progress", value: stats.inProgressTasks },
    { name: "Completed", value: stats.completedTasks },
    { name: "Issues", value: stats.issueTasks ?? 0 },
    { name: "Delayed", value: stats.delayedTasks },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Admin overview</h1>
        <p className="text-sm text-muted-foreground">Company-wide snapshot of people and work.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total employees" value={stats.totalEmployees} icon={Users} />
        <StatCard label="Active employees" value={stats.activeEmployees} icon={UserCheck} tone="success" />
        <StatCard label="Inactive employees" value={stats.inactiveEmployees} icon={UserX} tone="destructive" />
        <StatCard label="Upcoming deadlines" value={stats.upcomingDeadlines} icon={CalendarClock} tone="warning" />
        <StatCard label="Pending tasks" value={stats.pendingTasks} icon={Clock} />
        <StatCard label="In progress" value={stats.inProgressTasks} icon={Loader2} />
        <StatCard label="Completed" value={stats.completedTasks} icon={CheckCircle2} tone="success" />
        <StatCard label="Issues raised" value={stats.issueTasks ?? 0} icon={AlertOctagon} tone="destructive" />
        <StatCard label="Delayed" value={stats.delayedTasks} icon={AlertTriangle} tone="destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Tasks by status</CardTitle>
          </CardHeader>
          <CardContent>
            <TasksByStatusChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskTable tasks={recentTasks?.items ?? []} loading={tasksLoading} showEmployee compact />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
