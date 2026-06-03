import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "B/.") {
  return `${currency} ${value.toLocaleString("es-PA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number, decimals = 0) {
  return value.toLocaleString("es-PA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-PA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateShort(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-PA", {
    year: "numeric",
    month: "short",
  });
}

export function pctChange(current: number, previous: number) {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function deprecatedValue(originalValue: number, purchaseYear: number, ratePerYear = 0.2) {
  const currentYear = new Date().getFullYear();
  const years = currentYear - purchaseYear;
  return originalValue * Math.pow(1 - ratePerYear, years);
}
