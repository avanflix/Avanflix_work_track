"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

import { useMonthlyWorkLogs, type CalendarDay } from "@/hooks/useWorkLogs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import WorkLogForm from "@/components/forms/WorkLogForm";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface WorkLogCalendarProps {
  /** Omit to show the signed-in user's own calendar. */
  employeeId?: string;
  employeeName?: string;
  /** True when viewing someone else's calendar (Admin/Super Admin) -> read-only. */
  readOnly?: boolean;
}

export default function WorkLogCalendar({
  employeeId,
  employeeName,
  readOnly = false,
}: WorkLogCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const { data, loading, error, mutate } = useMonthlyWorkLogs(year, month, employeeId);

  const leadingBlanks = useMemo(() => {
    return new Date(year, month - 1, 1).getDay(); // 0 = Sunday
  }, [year, month]);

  function goToPrevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function statusLabel(day: CalendarDay) {
    if (day.log) return "Logged";
    if (day.isFuture) return "";
    return "No entry";
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">
            {employeeName ? `${employeeName}'s Work Log` : "My Work Log"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {loading && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading calendar...
          </div>
        )}

        {error && (
          <div className="py-10 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="pb-1 text-center text-xs font-semibold text-muted-foreground">
                {wd}
              </div>
            ))}

            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}

            {data.days.map((day) => {
              const dayNumber = Number(day.date.slice(-2));
              const clickable =
                !day.isFuture &&
                !day.isSunday &&
                (readOnly || day.isEditable);

              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && setSelectedDay(day)}
                  className={[
                    "flex min-h-[86px] flex-col rounded-lg border p-2 text-left text-xs transition",

                    day.isSunday
                      ? "cursor-not-allowed bg-red-50 border-red-200 text-red-500"
                      : day.isFuture
                        ? "cursor-not-allowed border-dashed bg-muted/30 text-muted-foreground"
                        : day.log
                          ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                          : "border-border bg-background hover:bg-muted/50",

                    !clickable ? "opacity-60" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{dayNumber}</span>
                    {(!day.isEditable || day.isSunday) && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>

                  <span className="mt-1 line-clamp-3 whitespace-pre-wrap text-muted-foreground">
                    {day.log?.summary || statusLabel(day)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDay ? formatFullDate(selectedDay.date) : ""}
            </DialogTitle>
            <DialogDescription>
              {readOnly
                ? "Viewing this team member's work log for the day."
                : "Add or update the work log for this day."}
            </DialogDescription>
          </DialogHeader>

          {selectedDay && (
            <WorkLogForm
              date={selectedDay.date}
              initialWorkLog={selectedDay.log}
              readOnly={readOnly}
              onSaved={() => {
                setSelectedDay(null);
                mutate();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatFullDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
