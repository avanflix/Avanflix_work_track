"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { capitalize } from "@/lib/utils";
import { useChatContacts, useStartConversation } from "@/hooks/useChat";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function NewChatDialog({ onStarted }: { onStarted: (conversationId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useChatContacts();
  const start = useStartConversation();

  const filtered = (data?.items ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.department ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function handlePick(userId: string) {
    const convo = await start.mutateAsync(userId);
    setOpen(false);
    setSearch("");
    onStarted((convo as any)._id);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New chat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or department…"
            className="pl-9"
          />
        </div>

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}

          {!isLoading && !filtered.length && (
            <p className="p-4 text-center text-sm text-muted-foreground">No one matches that search.</p>
          )}

          {filtered.map((u) => (
            <button
              key={u._id}
              onClick={() => handlePick(u._id)}
              disabled={start.isPending}
              className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <Avatar>
                <AvatarFallback>{initials(u.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.department || "—"}</p>
              </div>
              <Badge variant="outline">{capitalize(u.role)}</Badge>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
