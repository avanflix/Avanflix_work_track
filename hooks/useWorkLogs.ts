"use client";

import { useCallback, useEffect, useState } from "react";

export interface WorkLogEmployee {
  _id: string;
  name: string;
  email: string;
  department?: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
}

export interface WorkLog {
  _id: string;
  employee: WorkLogEmployee | string;
  date: string;
  summary: string;
  blockers?: string;
  notes?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarDay {
  date: string;
  log: WorkLog | null;
  isFuture: boolean;
  isEditable: boolean;
  isSunday: boolean;
}

export interface CalendarResponse {
  employeeId: string;
  year: number;
  month: number;
  days: CalendarDay[];
}

/** Fetches the current user's own log for today. Used by the quick-submit form. */
export function useTodayWorkLog() {
  const [workLog, setWorkLog] = useState<WorkLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkLog = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/work-logs");

      if (!res.ok) {
        throw new Error("Failed to fetch work log.");
      }

      const data = await res.json();

      setWorkLog(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch work log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkLog();
  }, [fetchWorkLog]);

  return { workLog, loading, error, mutate: fetchWorkLog };
}

/**
 * Fetches a full month calendar grid.
 *   - employeeId omitted -> "my own" calendar (works for any role).
 *   - employeeId supplied -> requires Admin/Super Admin visibility scope;
 *     the API enforces this and returns 403 if out of scope.
 */
export function useMonthlyWorkLogs(year: number, month: number, employeeId?: string) {
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
      });

      if (employeeId) {
        params.set("employeeId", employeeId);
      }

      const res = await fetch(`/api/work-logs/calendar?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch calendar.");
      }

      setData(json);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch calendar.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [year, month, employeeId]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  return { data, loading, error, mutate: fetchCalendar };
}

export async function createWorkLog(data: {
  summary: string;
  blockers?: string;
  notes?: string;
  /** ISO date (YYYY-MM-DD). Defaults to today server-side when omitted. */
  date?: string;
}) {
  const res = await fetch("/api/work-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || "Unable to save work log.");
  }

  return json;
}

export async function updateWorkLog(
  id: string,
  data: {
    summary: string;
    blockers?: string;
    notes?: string;
    date?: string;
  }
) {
  const res = await fetch(`/api/work-logs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || "Unable to update work log.");
  }

  return json;
}

export async function deleteWorkLog(id: string) {
  const res = await fetch(`/api/work-logs/${id}`, {
    method: "DELETE",
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || "Unable to delete work log.");
  }

  return json;
}
