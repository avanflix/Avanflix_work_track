"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { TransferRequestInput } from "@/lib/validations";

export function useTransferRequests(scope: "pending" | "mine" = "pending") {
  return useQuery({
    queryKey: ["transfers", scope],
    queryFn: () => apiClient.get<{ items: any[] }>(`/api/transfer?scope=${scope}`),
  });
}

export function useTaskTransferHistory(taskId: string) {
  return useQuery({
    queryKey: ["task-transfers", taskId],
    queryFn: () => apiClient.get<{ items: any[] }>(`/api/tasks/${taskId}/transfer`),
    enabled: !!taskId,
  });
}

export function useRequestTransfer(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransferRequestInput) => apiClient.post(`/api/tasks/${taskId}/transfer`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["task-transfers", taskId] });
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDecideTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "reject" }) =>
      apiClient.patch(`/api/transfer/${id}/${decision}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task"] });
      qc.invalidateQueries({ queryKey: ["task-transfers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
