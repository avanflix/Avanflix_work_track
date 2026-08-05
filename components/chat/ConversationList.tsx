"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "@/types";

function formatWhen(date: string) {
  const d = new Date(date);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  return isToday
    ? new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(d)
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(d);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ConversationList({
  conversations,
  isLoading,
  activeId,
  onSelect,
  emptyLabel = "No conversations yet. Start one!",
}: {
  conversations: ConversationListItem[] | undefined;
  isLoading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  emptyLabel?: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!conversations?.length) {
    return <div className="p-6 text-center text-sm text-muted-foreground">{emptyLabel}</div>;
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto p-2">
      {conversations.map((c) => {
        const isGroup = c.type === "GROUP";
        const active = c._id === activeId;

        return (
          <button
            key={c._id}
            onClick={() => onSelect(c._id)}
            className={cn(
              "flex items-center gap-3 rounded-xl p-3 text-left transition-colors",
              active ? "bg-primary/15" : "hover:bg-secondary"
            )}
          >
            <Avatar>
              {isGroup ? (
                <AvatarFallback>
                  <Users className="h-4 w-4" />
                </AvatarFallback>
              ) : (
                <AvatarFallback>{initials(c.displayName)}</AvatarFallback>
              )}
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{c.displayName}</span>
                {c.lastMessageAt && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatWhen(c.lastMessageAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs text-muted-foreground">
                  {c.lastMessageText || (isGroup ? "Company-wide group chat" : "Say hello")}
                </p>
                {c.unreadCount > 0 && (
                  <Badge className="shrink-0">{c.unreadCount > 9 ? "9+" : c.unreadCount}</Badge>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
