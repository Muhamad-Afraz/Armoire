import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OTP_COOKIE, otpCookieOptions, verifyOtpToken } from "@/lib/otp";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";

const messages = {
  not_found: "Please request a code first.",
  expired: "That code has expired. Request a new one.",
  too_many_attempts: "Too many attempts. Request a new code.",
  invalid: "That code isn't right. Please try again.",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; code?: string };
    const email = body.email?.trim().toLowerCase();
    const code = body.code?.trim();

    if (!email || !code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: "Enter the 6-digit code we sent you." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(OTP_COOKIE)?.value;
    const result = verifyOtpToken(token, email, code);
    if (!result.ok) {
      const response = NextResponse.json({ ok: false, error: messages[result.reason] }, { status: 400 });
      if (result.token) {
        response.cookies.set(OTP_COOKIE, result.token, otpCookieOptions());
      } else {
        response.cookies.set(OTP_COOKIE, "", { ...otpCookieOptions(0), maxAge: 0 });
      }
      return response;
    }

    const sessionToken = createSessionToken({
      email,
      name: email.split("@")[0],
      provider: "otp",
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set("aw_session", sessionToken, sessionCookieOptions);
    response.cookies.set(OTP_COOKIE, "", { ...otpCookieOptions(0), maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Could not verify the code. Please try again." }, { status: 500 });
  }
}
