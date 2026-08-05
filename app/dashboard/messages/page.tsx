"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, capitalize } from "@/lib/utils";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMonitorConversations,
  useMonitorMessages,
} from "@/hooks/useChat";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { NewChatDialog } from "@/components/chat/NewChatDialog";

export default function MessagesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const userId = (session?.user as any)?.id as string | undefined;
  const canMonitor = role === "SUPER_ADMIN" || role === "ADMIN";

  const [view, setView] = useState<"chats" | "monitor">("chats");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeMonitorId, setActiveMonitorId] = useState<string | null>(null);

  const { data: convoData, isLoading: convosLoading } = useConversations();
  const { data: msgData, isLoading: msgsLoading } = useMessages(view === "chats" ? activeId : null);
  const sendMessage = useSendMessage(activeId);

  const { data: monitorData, isLoading: monitorLoading } = useMonitorConversations(canMonitor && view === "monitor");
  const { data: monitorMsgData, isLoading: monitorMsgsLoading } = useMonitorMessages(
    view === "monitor" ? activeMonitorId : null
  );

  const activeConvo = useMemo(
    () => convoData?.items.find((c) => c._id === activeId),
    [convoData, activeId]
  );
  const activeMonitorConvo = useMemo(
    () => monitorData?.items.find((c: any) => c._id === activeMonitorId),
    [monitorData, activeMonitorId]
  );

  const ownSenderNames = useMemo(() => {
    const map: Record<string, string> = {};
    if (userId && session?.user?.name) map[userId] = session.user.name;
    if (activeConvo?.otherParticipant) map[activeConvo.otherParticipant._id] = activeConvo.otherParticipant.name;
    return map;
  }, [activeConvo, userId, session]);

  const monitorSenderNames = useMemo(() => {
    const map: Record<string, string> = {};
    (activeMonitorConvo as any)?.participantDetails?.forEach((u: any) => {
      map[u._id] = u.name;
    });
    return map;
  }, [activeMonitorConvo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Chat with anyone on the team, or catch up in the company group.
          </p>
        </div>

        {canMonitor && (
          <div className="flex rounded-xl border border-border bg-secondary/40 p-1 text-sm">
            <button
              onClick={() => setView("chats")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
                view === "chats" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" /> My Chats
            </button>
            <button
              onClick={() => setView("monitor")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
                view === "monitor" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Team Chats
            </button>
          </div>
        )}
      </div>

      {view === "chats" && (
        <Card className="grid h-[calc(100vh-13rem)] grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr]">
          <div className="flex flex-col border-b border-border md:border-b-0 md:border-r">
            <div className="flex items-center justify-between border-b border-border p-3">
              <span className="text-sm font-semibold">Chats</span>
              <NewChatDialog onStarted={(id) => setActiveId(id)} />
            </div>
            <ConversationList
              conversations={convoData?.items}
              isLoading={convosLoading}
              activeId={activeId}
              onSelect={setActiveId}
            />
          </div>

          <div className="min-h-0">
            {activeConvo ? (
              <ChatWindow
                title={activeConvo.displayName}
                subtitle={
                  activeConvo.type === "GROUP"
                    ? "Everyone in the company"
                    : capitalize(activeConvo.otherParticipant?.role ?? "")
                }
                isGroup={activeConvo.type === "GROUP"}
                currentUserId={userId ?? ""}
                messages={msgData?.items}
                isLoading={msgsLoading}
                senderNames={ownSenderNames}
                onSend={(content) => sendMessage.mutate(content)}
                isSending={sendMessage.isPending}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <MessageSquare className="h-8 w-8 opacity-40" />
                Pick a conversation, or start a new one.
              </div>
            )}
          </div>
        </Card>
      )}

      {view === "monitor" && canMonitor && (
        <Card className="grid h-[calc(100vh-13rem)] grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr]">
          <div className="flex flex-col border-b border-border md:border-b-0 md:border-r">
            <div className="border-b border-border p-3">
              <span className="text-sm font-semibold">
                {role === "SUPER_ADMIN" ? "All Employee & Admin Chats" : "All Employee Chats"}
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {role === "SUPER_ADMIN"
                  ? "Every conversation in the workspace."
                  : "Any conversation that includes an employee."}
              </p>
            </div>
            <ConversationList
              conversations={monitorData?.items}
              isLoading={monitorLoading}
              activeId={activeMonitorId}
              onSelect={setActiveMonitorId}
              emptyLabel="No conversations to review yet."
            />
          </div>

          <div className="min-h-0">
            {activeMonitorConvo ? (
              <ChatWindow
                title={(activeMonitorConvo as any).displayName}
                subtitle={activeMonitorConvo.type === "GROUP" ? "Everyone in the company" : "Direct chat"}
                isGroup={activeMonitorConvo.type === "GROUP"}
                currentUserId={userId ?? ""}
                messages={monitorMsgData?.items}
                isLoading={monitorMsgsLoading}
                senderNames={monitorSenderNames}
                readOnly
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <ShieldCheck className="h-8 w-8 opacity-40" />
                Select a conversation to review.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
