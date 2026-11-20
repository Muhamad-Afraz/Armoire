import { OAuth2Client } from "google-auth-library";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fail = (reason: string) => NextResponse.redirect(`${origin}/?auth_error=${reason}`);

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const providerError = requestUrl.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("aw_oauth_state")?.value;
  const codeVerifier = cookieStore.get("aw_oauth_verifier")?.value;

  if (providerError || !code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    return fail("google_cancelled");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;
  if (!clientId || !clientSecret) return fail("google_not_configured");

  try {
    const client = new OAuth2Client(clientId, clientSecret, redirectUri);
    const { tokens } = await client.getToken({ code, codeVerifier, redirect_uri: redirectUri });

    if (!tokens.id_token) return fail("google_no_identity");

    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return fail("google_unverified");
    }

    const sessionToken = createSessionToken({
      email: payload.email,
      name: payload.name || payload.given_name || payload.email.split("@")[0],
      provider: "google",
    });

    const response = NextResponse.redirect(`${origin}/dashboard`);
    response.cookies.set("aw_session", sessionToken, sessionCookieOptions);
    response.cookies.delete("aw_oauth_state");
    response.cookies.delete("aw_oauth_verifier");
    return response;
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return fail("google_failed");
  }
}
