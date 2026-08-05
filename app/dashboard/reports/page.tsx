"use client";

import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { TasksByStatusChart } from "@/components/charts/TasksByStatusChart";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: tasks } = useTasks({ limit: "100" });

  const byEmployee: Record<string, number> = {};
  tasks?.items?.forEach((t: any) => {
    const name = t.assignedTo?.name ?? "Unassigned";
    byEmployee[name] = (byEmployee[name] ?? 0) + 1;
  });
  const employeeData = Object.entries(byEmployee).map(([name, value]) => ({ name, value }));

  if (isLoading || !stats) return <Skeleton className="h-96" />;

  const statusData = [
    { name: "Pending", value: stats.pendingTasks },
    { name: "In Progress", value: stats.inProgressTasks },
    { name: "Completed", value: stats.completedTasks },
    { name: "Delayed", value: stats.delayedTasks },
  ];

  const completionRate = stats.completedTasks + stats.pendingTasks + stats.inProgressTasks + stats.delayedTasks
    ? Math.round((stats.completedTasks / (stats.completedTasks + stats.pendingTasks + stats.inProgressTasks + stats.delayedTasks)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Completion rate: {completionRate}%</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Completion %</CardTitle></CardHeader>
          <CardContent><TasksByStatusChart data={statusData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tasks per employee</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={employeeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 20% 22%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(230 30% 14%)", border: "1px solid hsl(230 20% 24%)", borderRadius: 12 }} />
                <Bar dataKey="value" fill="#8b8ff5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
