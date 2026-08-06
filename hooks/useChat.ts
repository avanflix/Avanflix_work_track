"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { ChatContact, ConversationListItem, IConversation, IMessage } from "@/types";

const CONVERSATIONS_POLL_MS = 15_000;
const MESSAGES_POLL_MS = 5_000;

/** The signed-in user's own chats (direct chats + the company group). */
export function useConversations() {
  return useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: () => apiClient.get<{ items: ConversationListItem[] }>("/api/chat/conversations"),
    refetchInterval: CONVERSATIONS_POLL_MS,
  });
}

/** Everyone you're allowed to start a new chat with. */
export function useChatContacts() {
  return useQuery({
    queryKey: ["chat", "contacts"],
    queryFn: () => apiClient.get<{ items: ChatContact[] }>("/api/chat/contacts"),
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiClient.post<IConversation>("/api/chat/conversations", { userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "conversations"] }),
  });
}

/** Messages for a conversation you're a participant of. Also marks it read. */
export function useMessages(conversationId: string | null) {
  const qc = useQueryClient();

  return useQuery({
    queryKey: ["chat", "messages", conversationId],
    queryFn: async () => {
      const res = await apiClient.get<{ items: IMessage[] }>(
        `/api/chat/conversations/${conversationId}/messages`
      );

      // Opening the conversation marks messages as read.
      // Refresh the conversation list so unreadCount updates.
      qc.invalidateQueries({
        queryKey: ["chat", "conversations"],
      });

      return res;
    },
    enabled: !!conversationId,
    refetchInterval: MESSAGES_POLL_MS,
  });
}

export function useSendMessage(conversationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiClient.post<IMessage>(`/api/chat/conversations/${conversationId}/messages`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", "messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}

/** Oversight: every conversation an Admin/Super Admin is allowed to view. */
export function useMonitorConversations(enabled: boolean) {
  return useQuery({
    queryKey: ["chat", "monitor", "conversations"],
    queryFn: () => apiClient.get<{ items: ConversationListItem[] }>("/api/chat/monitor"),
    refetchInterval: CONVERSATIONS_POLL_MS,
    enabled,
  });
}

/** Oversight: read-only messages inside a monitored conversation. */
export function useMonitorMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["chat", "monitor", "messages", conversationId],
    queryFn: () => apiClient.get<{ items: IMessage[] }>(`/api/chat/monitor/${conversationId}/messages`),
    enabled: !!conversationId,
    refetchInterval: MESSAGES_POLL_MS,
  });
}
