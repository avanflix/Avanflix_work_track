"use client";

import { formatDateTime } from "@/lib/utils";
import { Clock } from "lucide-react";

export function TaskTimeline({ entries }: { entries: any[] }) {
  if (!entries?.length) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <ol className="relative space-y-5 border-l border-border pl-5">
      {sorted.map((entry, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[26px] flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Clock className="h-2.5 w-2.5" />
          </span>
          <p className="text-sm font-medium">{entry.action}</p>
          {entry.note && <p className="text-sm text-muted-foreground">{entry.note}</p>}
          <p className="text-xs text-muted-foreground">
            {entry.authorName} · {formatDateTime(entry.timestamp)}
          </p>
        </li>
      ))}
    </ol>
  );
}
