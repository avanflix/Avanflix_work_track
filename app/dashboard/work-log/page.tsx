"use client";

import { useSession } from "next-auth/react";
import WorkLogForm from "@/components/forms/WorkLogForm";
import WorkLogCalendar from "@/components/dashboard/WorkLogCalendar";
import TeamWorkLogCalendars from "@/components/dashboard/TeamWorkLogCalendars";
import { ClipboardList } from "lucide-react";

export default function WorkLogPage() {
  const { data: session } = useSession();

  const name = session?.user?.name;
  const role = session?.user?.role;

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <ClipboardList className="h-7 w-7 text-primary" />
          </div>

          <div>
            <h1 className="font-bold">
              {isSuperAdmin ? "Employee Work Logs" : "Daily Work Log"}
            </h1>

            <p className="mt-1 text-muted-foreground">
              {isSuperAdmin
                ? "View and monitor work logs submitted by employees."
                : "Record today's completed work, blockers, and additional notes."}
            </p>
          </div>
        </div>
      </div>

      {/* Employee & Admin Only */}
      {!isSuperAdmin && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border bg-card shadow-sm">
                <div className="border-b px-6 py-5">
                  <h2 className="text-lg font-semibold">
                    Submit Today's Work
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Fill in your daily work summary before ending your workday.
                  </p>
                </div>

                <div className="p-6">
                  <WorkLogForm />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="font-semibold">Submission Guidelines</h3>

                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li>• Summarize the work completed today.</li>
                  <li>• Mention any blockers if applicable.</li>
                  <li>• Add additional notes if required.</li>
                  <li>• Submit one work log per day.</li>
                  <li>
                    • You can go back and edit an earlier day's log for up to
                    5 days.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="font-semibold">Privacy</h3>

                <p className="mt-3 text-sm text-muted-foreground">
                  Only you and your reporting Admin/Super Admin can see your
                  work log. Other employees never see your entries.
                </p>
              </div>
            </div>
          </div>

          {/* My Work Log Calendar */}
          <WorkLogCalendar employeeName={name ?? "My"} />
        </>
      )}

      {/* Admin & Super Admin can browse employee calendars */}
      {(isAdmin || isSuperAdmin) && <TeamWorkLogCalendars />}
    </div>
  );
}