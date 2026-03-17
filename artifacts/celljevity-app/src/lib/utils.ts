import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number, currency: string = "EUR") {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency,
  }).format(numericAmount);
}

export function formatDate(date: string | number) {
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
