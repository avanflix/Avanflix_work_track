"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, MessageSquare, Send, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { IMessage } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

export function ChatWindow({
  title,
  subtitle,
  isGroup,
  currentUserId,
  messages,
  isLoading,
  senderNames,
  readOnly = false,
  onSend,
  isSending,
}: {
  title: string;
  subtitle?: string;
  isGroup?: boolean;
  currentUserId: string;
  messages: IMessage[] | undefined;
  isLoading: boolean;
  senderNames: Record<string, string>;
  readOnly?: boolean;
  onSend?: (content: string) => void;
  isSending?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  function handleSend() {
    const content = draft.trim();
    if (!content || !onSend) return;
    onSend(content);
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Avatar>
          <AvatarFallback>{isGroup ? <Users className="h-4 w-4" /> : initials(title)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title}</p>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {readOnly && (
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> Monitoring
          </span>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className={cn("h-10 w-2/3 rounded-2xl", i % 2 ? "ml-auto" : "")} />
            ))}
          </div>
        )}

        {!isLoading && !messages?.length && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8 opacity-40" />
            No messages yet.
          </div>
        )}

        {messages?.map((m) => {
          const mine = m.sender === currentUserId;
          const senderName = senderNames[m.sender] ?? "Unknown";

          return (
            <div key={m._id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              {(isGroup || readOnly) && !mine && (
                <span className="mb-0.5 px-1 text-[11px] font-medium text-muted-foreground">{senderName}</span>
              )}
              <div
                className={cn(
                  "max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                  mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                )}
              >
                {m.content}
              </div>
              <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">{formatTime(m.createdAt)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!readOnly && (
        <div className="flex items-end gap-2 border-t border-border p-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message…"
            className="min-h-10 flex-1 resize-none"
            rows={1}
          />
          <Button size="icon" onClick={handleSend} disabled={!draft.trim() || isSending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
