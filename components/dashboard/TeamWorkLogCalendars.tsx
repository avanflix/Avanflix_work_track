"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Users } from "lucide-react";

import { useEmployees } from "@/hooks/useEmployees";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import WorkLogCalendar from "@/components/dashboard/WorkLogCalendar";

/**
 * Admin/Super Admin panel: pick a team member and view their monthly work
 * log calendar (read-only). The role filter passed to /api/users mirrors
 * the same Admin-can't-see-Admin scoping enforced server-side for work
 * logs, so the dropdown never even lists people the viewer isn't allowed
 * to open.
 */
export default function TeamWorkLogCalendars() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const roleFilter = role === "SUPER_ADMIN" ? "ADMIN,EMPLOYEE" : "EMPLOYEE";

  const { data, isLoading } = useEmployees({ role: roleFilter, limit: "200" });
  const [selectedId, setSelectedId] = useState<string>("");

  const members = data?.items ?? [];
  const selected = members.find((m: any) => m._id === selectedId);

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Team Work Logs</h3>
          <p className="text-sm text-muted-foreground">
            View a team member's daily log history for any month.
          </p>
        </div>
      </div>

      <div className="mt-4 max-w-xs">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger>
            <SelectValue
              placeholder={isLoading ? "Loading team..." : "Select a team member"}
            />
          </SelectTrigger>
          <SelectContent>
            {members.map((m: any) => (
              <SelectItem key={m._id} value={m._id}>
                {m.name} {m.role === "ADMIN" ? "(Admin)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <div className="mt-6">
          <WorkLogCalendar
            employeeId={selected._id}
            employeeName={selected.name}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
