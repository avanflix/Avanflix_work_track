import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(new Date(date));
}

export function formatDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    ...options,
  }).format(new Date(date));
}

export function isOverdue(
  dueDate: Date | string,
  status?: string
) {
  if (status === "COMPLETED") return false;

  return new Date(dueDate).getTime() < Date.now();
}

export function truncate(text: string, length = 60) {
  if (!text) return "";
  return text.length <= length
    ? text
    : `${text.slice(0, length)}...`;
}

export function capitalize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}