"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { CreateEmployeeInput } from "@/lib/validations";

export function useEmployees(query: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v) as [string, string][]
  ).toString();

  return useQuery({
    queryKey: ["users", query],
    queryFn: () =>
      apiClient.get<{ items: any[]; total: number }>(
        `/api/users?${params}`
      ),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEmployeeInput) =>
      apiClient.post("/api/users", input),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["users"],
      }),
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) =>
      apiClient.patch(`/api/users/${id}`, {
        isActive,
      }),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["users"],
      }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/users/${id}`),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["users"],
      }),
  });
}

/* -------------------------------------------------------------------------- */
/*                            UPDATE AVAILABILITY                             */
/* -------------------------------------------------------------------------- */

export interface UpdateAvailabilityInput {
  userId: string;

  availabilityStatus:
  | "ACTIVE"
  | "ON_LEAVE"
  | "WFH"
  | "HALF_DAY"
  | "INACTIVE";

  leaveFrom?: string;

  leaveTo?: string;

  leaveReason?: string;
}

export function useUpdateAvailability() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAvailabilityInput) => {
      console.log("PATCH INPUT", input);

      return apiClient.patch("/api/users/availability", input);
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });
}