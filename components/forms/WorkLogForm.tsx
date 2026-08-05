"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createWorkLog, updateWorkLog, useTodayWorkLog, type WorkLog } from "@/hooks/useWorkLogs";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface WorkLogFormProps {
  /** ISO date (YYYY-MM-DD) this form edits. Defaults to "today". */
  date?: string;
  /** Pre-loaded log for `date` (used by the calendar, which already has it). */
  initialWorkLog?: WorkLog | null;
  /** True when the viewer isn't the owner (Admin/Super Admin browsing a
   * team member's calendar) - renders read-only, no submit button. */
  readOnly?: boolean;
  /** Called after a successful save, e.g. to close a modal / refresh a calendar. */
  onSaved?: (log: WorkLog) => void;
}

export default function WorkLogForm({
  date,
  initialWorkLog,
  readOnly = false,
  onSaved,
}: WorkLogFormProps) {
  const isToday = !date;

  // The quick "today" form keeps its own live-fetch behaviour; when a
  // specific `date`/`initialWorkLog` is passed in (calendar day editor) we
  // just use what was handed to us instead of re-fetching "today".
  const {
    workLog: todayWorkLog,
    loading: pageLoading,
    mutate,
  } = useTodayWorkLog();

  const workLog = isToday ? todayWorkLog : initialWorkLog ?? null;

  const [summary, setSummary] = useState("");
  const [blockers, setBlockers] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSummary(workLog?.summary ?? "");
    setBlockers(workLog?.blockers ?? "");
    setNotes(workLog?.notes ?? "");
  }, [workLog]);

  async function handleSubmit() {
    setLoading(true);

    try {
      let saved: WorkLog;

      if (workLog?._id) {
        saved = await updateWorkLog(workLog._id, { summary, blockers, notes, date });
        toast.success("Work log updated");
      } else {
        saved = await createWorkLog({ summary, blockers, notes, date });
        toast.success("Work log saved");
      }

      if (isToday) mutate();
      onSaved?.(saved);
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    }

    setLoading(false);
  }

  if (isToday && pageLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading work log...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="font-medium">Work Summary</label>

        <Textarea
          rows={8}
          value={summary}
          disabled={readOnly}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Describe the day's work..."
        />
      </div>

      <div>
        <label className="font-medium">Blockers</label>

        <Textarea
          rows={4}
          value={blockers}
          disabled={readOnly}
          onChange={(e) => setBlockers(e.target.value)}
          placeholder="Any blockers?"
        />
      </div>

      <div>
        <label className="font-medium">Additional Notes</label>

        <Textarea
          rows={4}
          value={notes}
          disabled={readOnly}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
        />
      </div>

      {!readOnly && (
        <Button onClick={handleSubmit} disabled={loading}>
          {workLog ? "Update Work Log" : "Submit Work Log"}
        </Button>
      )}
    </div>
  );
}
