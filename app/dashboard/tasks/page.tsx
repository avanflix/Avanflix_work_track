"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTasks, useCalendarTasks } from "@/hooks/useTasks";
import { TaskTable } from "@/components/tables/TaskTable";
import { TaskCalendar } from "@/components/dashboard/TaskCalendar";
import { TaskForm } from "@/components/forms/TaskForm";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useEmployees } from "@/hooks/useEmployees";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, List, CalendarDays } from "lucide-react";
import { can } from "@/utils/permissions";

export default function TasksPage() {
  const { data: session } = useSession();
  const { data: employeeData } = useEmployees();
  const employees = employeeData?.items ?? [];
  const role = (session?.user as any)?.role;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [priority, setPriority] = useState<string | undefined>();
  const [employeeId, setEmployeeId] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");

  const { data, isLoading } = useTasks({
    search,
    status,
    priority,
    employeeId,
  });
  const { data: calendarData, isLoading: calendarLoading } = useCalendarTasks();
  const canAssign = can(role, "ASSIGN_TASK");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{role === "EMPLOYEE" ? "My tasks" : "All tasks"}</h1>
          <p className="text-sm text-muted-foreground">
            {role === "EMPLOYEE"
              ? "Track and update your assigned work."
              : "View all assigned tasks along with employee names, assign new work, and monitor progress."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-border p-1">
            <Button size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}>
              <List className="h-4 w-4" /> List
            </Button>
            <Button size="sm" variant={view === "calendar" ? "default" : "ghost"} onClick={() => setView("calendar")}>
              <CalendarDays className="h-4 w-4" /> Calendar
            </Button>
          </div>
          {canAssign && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4" /> Assign task</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign a new task</DialogTitle>
                  <DialogDescription>The assignee will be notified immediately.</DialogDescription>
                </DialogHeader>
                <TaskForm onDone={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {view === "list" ? (
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {role !== "EMPLOYEE" && (
                <Select
                  value={employeeId}
                  onValueChange={(value) =>
                    setEmployeeId(value === "ALL" ? undefined : value)
                  }
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ALL">All Employees</SelectItem>

                    {(employees ?? []).map((employee) => (
                      <SelectItem key={employee._id} value={employee._id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="NOTICED">Noticed</SelectItem>
                  <SelectItem value="IN_PROGRESS">Working on it</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ISSUE">Issue</SelectItem>
                  <SelectItem value="DELAYED">Delayed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <TaskTable
              tasks={data?.items ?? []}
              loading={isLoading}
              showEmployee={role !== "EMPLOYEE"}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="text-sm font-medium">Deliverables calendar</div>
            <p className="text-sm text-muted-foreground">Tasks plotted by deadline. Click a task to open its details.</p>
          </CardHeader>
          <CardContent>
            <TaskCalendar tasks={calendarData?.items ?? []} loading={calendarLoading} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
