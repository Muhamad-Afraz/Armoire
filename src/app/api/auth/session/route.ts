import { NextResponse } from "next/server";
import { effectivePlanForEmail } from "@/lib/plans";
import { readSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.match(/aw_session=([^;]+)/)?.[1];
  const user = readSessionToken(token ? decodeURIComponent(token) : null);
  const effectivePlan = user ? effectivePlanForEmail(user.email) : null;
  return NextResponse.json({ authenticated: Boolean(user), user, effectivePlan });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
