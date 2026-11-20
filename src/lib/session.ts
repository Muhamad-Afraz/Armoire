import { createHmac, timingSafeEqual } from "crypto";

export type SessionUser = {
  email: string;
  name: string;
  provider: "google" | "otp" | "demo";
  exp: number;
};

export const SESSION_COOKIE = "aw_session";
const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
const secret = process.env.SESSION_SECRET || "armoire-local-development-secret";

function sign(payload: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(
  user: Omit<SessionUser, "exp">,
  opts?: { remember?: boolean },
) {
  const maxAgeSeconds =
    opts?.remember === false ? SESSION_MAX_AGE_SECONDS : REMEMBER_MAX_AGE_SECONDS;
  const data: SessionUser = { ...user, exp: Date.now() + maxAgeSeconds * 1000 };
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token?: string | null): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function getSessionCookieOptions(opts?: { remember?: boolean }) {
  if (opts?.remember === false) return baseCookieOptions;
  return { ...baseCookieOptions, maxAge: REMEMBER_MAX_AGE_SECONDS };
}

export const sessionCookieOptions = getSessionCookieOptions();
