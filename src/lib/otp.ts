import { createHmac, randomInt, timingSafeEqual } from "crypto";

export type OtpPayload = {
  e: string; // email
  h: string; // code hash
  x: number; // expires
  a: number; // attempts
  s: number; // last sent
};

export const OTP_COOKIE = "aw_otp";
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const secret = process.env.SESSION_SECRET || "armoire-local-development-secret";

function key(email: string) {
  return email.trim().toLowerCase();
}

function sign(value: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function hashCode(email: string, code: string, expires: number) {
  return createHmac("sha256", secret)
    .update(`${key(email)}:${code}:${expires}`)
    .digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.OTP_FROM_EMAIL);
}

export function otpCookieOptions(maxAge = Math.ceil(OTP_TTL_MS / 1000)) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function createOtpToken(email: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = Date.now();
  const payload: OtpPayload = {
    e: key(email),
    h: hashCode(key(email), code, now + OTP_TTL_MS),
    x: now + OTP_TTL_MS,
    a: 0,
    s: now,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${encoded}.${sign(encoded)}`;
  return { code, token, payload };
}

export function readOtpToken(token?: string | null): OtpPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  if (!safeEqual(sign(encoded), signature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OtpPayload;
    if (!payload?.e || !payload?.h || !payload?.x || typeof payload?.a !== "number" || !payload?.s) return null;
    return payload;
  } catch {
    return null;
  }
}

function writeOtpToken(payload: OtpPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function canResend(payload: OtpPayload | null, email: string) {
  if (!payload || payload.e !== key(email)) return true;
  return Date.now() - payload.s >= RESEND_COOLDOWN_MS;
}

export function secondsUntilResend(payload: OtpPayload | null, email: string) {
  if (!payload || payload.e !== key(email)) return 0;
  return Math.max(0, Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - payload.s)) / 1000));
}

export type OtpResult =
  | { ok: true; token: null }
  | { ok: false; reason: "not_found" | "expired" | "too_many_attempts" | "invalid"; token: string | null };

export function verifyOtpToken(token: string | null | undefined, email: string, submitted: string): OtpResult {
  const payload = readOtpToken(token);
  const normalizedEmail = key(email);
  if (!payload || payload.e !== normalizedEmail) {
    return { ok: false, reason: "not_found", token: null };
  }
  if (payload.x < Date.now()) {
    return { ok: false, reason: "expired", token: null };
  }
  if (payload.a >= MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts", token: null };
  }

  const expected = hashCode(normalizedEmail, submitted.trim(), payload.x);
  if (!safeEqual(payload.h, expected)) {
    const next: OtpPayload = { ...payload, a: payload.a + 1 };
    const nextToken = next.a >= MAX_ATTEMPTS ? null : writeOtpToken(next);
    return { ok: false, reason: "invalid", token: nextToken };
  }

  return { ok: true, token: null };
}

export function otpEmailTemplate(code: string, fromName: string) {
  const digits = code
    .split("")
    .map((d) => `<span style="display:inline-block;width:46px;height:56px;line-height:56px;text-align:center;border:1px solid #D9B061;color:#3F0D0C;font-family:Georgia,serif;font-size:30px;margin:0 4px;">${d}</span>`)
    .join("");

  return `
  <div style="background:#F4EEE5;padding:40px 16px;font-family:Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#FFFDFA;border:1px solid #D8D0C5;">
      <div style="background:#3F0D0C;padding:30px 40px;color:#D9C4A9;">
        <div style="font-family:Georgia,serif;font-size:19px;letter-spacing:4px;text-transform:uppercase;">${fromName}</div>
        <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#D9B061;margin-top:8px;">Private member access</div>
      </div>
      <div style="padding:40px;color:#2B1710;">
        <div style="font-family:Georgia,serif;font-size:34px;line-height:1.1;">Your one-time code</div>
        <p style="font-size:14px;line-height:1.7;color:#8D6F57;margin:16px 0 30px;">
          Use the code below to sign in to Armoire. It expires in 5 minutes.
        </p>
        <div style="text-align:center;padding:10px 0 24px;">${digits}</div>
        <div style="border-top:1px solid #D8D0C5;padding-top:22px;font-size:12px;color:#8D6F57;line-height:1.6;">
          If you didn&apos;t request this code, you can safely ignore this email.
        </div>
      </div>
    </div>
  </div>`;
}
