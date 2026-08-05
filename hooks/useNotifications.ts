"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<{ items: any[] }>("/api/notifications"),
    refetchInterval: 30_000,
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch("/api/notifications", { markAll: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
