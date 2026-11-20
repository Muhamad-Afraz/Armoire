import { Resend } from "resend";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  OTP_COOKIE,
  canResend,
  createOtpToken,
  isEmailConfigured,
  otpCookieOptions,
  otpEmailTemplate,
  readOtpToken,
  secondsUntilResend,
} from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const existing = readOtpToken(cookieStore.get(OTP_COOKIE)?.value);
    if (!canResend(existing, email)) {
      return NextResponse.json(
        { ok: false, error: "Please wait before requesting another code.", retryAfter: secondsUntilResend(existing, email) },
        { status: 429 },
      );
    }

    const { code, token } = createOtpToken(email);
    let delivered = false;

    if (isEmailConfigured()) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromName = process.env.OTP_FROM_NAME || "Armoire";
        const fromEmail = process.env.OTP_FROM_EMAIL as string;

        const { error } = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: email,
          subject: `${code} is your Armoire sign-in code`,
          text: `Your Armoire sign-in code is ${code}. It expires in 5 minutes.`,
          html: otpEmailTemplate(code, fromName),
        });

        if (error) throw error;
        delivered = true;
      } catch (error) {
        console.error("OTP email delivery failed:", error);
      }
    }

    if (!delivered && process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, error: "Email delivery is not configured yet." }, { status: 503 });
    }

    const response = NextResponse.json({
      ok: true,
      delivered,
      cooldown: 60,
      // Development-only fallback so the flow can be tested before email delivery is configured.
      ...(!delivered && process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    });
    response.cookies.set(OTP_COOKIE, token, otpCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Could not send a code. Please try again." }, { status: 500 });
  }
}
