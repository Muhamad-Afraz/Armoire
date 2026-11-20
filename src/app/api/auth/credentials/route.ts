import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      mode?: "signin" | "signup";
      remember?: boolean;
    };

    const email = body.email?.trim().toLowerCase();
    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (body.mode === "signup") {
      const name = body.name?.trim();
      if (!name || name.length < 2) {
        return NextResponse.json(
          { ok: false, error: "Please enter your name." },
          { status: 400 },
        );
      }
    }

    const remember = body.remember !== false;
    const name =
      body.name?.trim() ||
      email.split("@")[0] ||
      "Member";

    const sessionToken = createSessionToken(
      {
        email,
        name,
        provider: "demo",
      },
      { remember },
    );

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, sessionToken, getSessionCookieOptions({ remember }));
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not sign in. Please try again." },
      { status: 500 },
    );
  }
}
