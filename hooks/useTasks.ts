"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { CreateTaskInput, TaskProgressUpdateInput, DelaySubmissionInput } from "@/lib/validations";

export function useTasks(query: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v) as [string, string][]
  ).toString();

  return useQuery({
    queryKey: ["tasks", query],
    queryFn: () => apiClient.get<{ items: any[]; total: number }>(`/api/tasks?${params}`),
  });
}

export function useCalendarTasks() {
  return useQuery({
    queryKey: ["tasks", "calendar"],
    queryFn: () => apiClient.get<{ items: any[] }>("/api/tasks/calendar"),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => apiClient.get<any>(`/api/tasks/${id}`),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => apiClient.post("/api/tasks", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTaskProgress(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskProgressUpdateInput) =>
      apiClient.post(`/api/tasks/${taskId}/updates`, { kind: "progress", ...input }),
    onSuccess: () => {
      // Realtime reflection: refresh everything derived from tasks without a page reload.
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useSubmitDelay(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DelaySubmissionInput) =>
      apiClient.post(`/api/tasks/${taskId}/updates`, { kind: "delay", ...input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReviewDelay(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: "APPROVED" | "REJECTED") =>
      apiClient.post(`/api/tasks/${taskId}/updates`, { kind: "delay-review", status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update task");
      }

      return result;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });

      queryClient.invalidateQueries({
        queryKey: ["task", taskId],
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete task");
      }

      return result;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
    },
  });
}