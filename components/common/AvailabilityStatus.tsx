"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const options = [
  { value: "ACTIVE", label: "🟢 Active" },
  { value: "ON_LEAVE", label: "🟡 On Leave" },
  { value: "INACTIVE", label: "🔴 Inactive" },
];

const STORAGE_KEY = "availabilityStatus";

export default function AvailabilityStatus() {
  const { data: session, status: sessionStatus } = useSession();

  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load from localStorage first
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setStatus(saved);
    } else if ((session?.user as any)?.availabilityStatus) {
      setStatus((session?.user as any).availabilityStatus);
    }
  }, [session]);

  async function handleChange(value: string) {
    if (value === status) return;

    const userId = (session?.user as any)?.id;

    // Update UI immediately
    setStatus(value);
    localStorage.setItem(STORAGE_KEY, value);

    if (!userId) {
      toast.success("Availability updated locally");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          availabilityStatus: value,
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success("Availability updated");
    } catch {
      toast.error("Database update failed");
    } finally {
      setLoading(false);
    }
  }

  if (sessionStatus === "loading") return null;

  return (
    <Select
      value={status}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className="w-[160px]">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}