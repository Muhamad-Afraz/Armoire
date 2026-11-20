import type { PlanId } from "./types";

export function getAtelierEmails(): string[] {
  const raw = process.env.ATELIER_EMAILS || "";
  return raw
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAtelierEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAtelierEmails().includes(email.trim().toLowerCase());
}

export function effectivePlanForEmail(email?: string | null): PlanId | null {
  return isAtelierEmail(email) ? "atelier" : null;
}
