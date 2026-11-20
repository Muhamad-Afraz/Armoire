"use client";

import { useRouter } from "next/navigation";
import { ClipboardEvent, FormEvent, useEffect, useRef, useState } from "react";
import Marquee from "./Marquee";

type Mode = "signin" | "signup" | "forgot" | "otp";

const MailIcon = () => (
  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 7 9 6 9-6" />
  </svg>
);

const LockIcon = () => (
  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4.5" y="10" width="15" height="10" rx="1" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

const UserIcon = () => (
  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6.5 3h3l1.5 5-2.2 1.6a13 13 0 0 0 5.6 5.6L16 13l5 1.5v3a2.5 2.5 0 0 1-2.7 2.5A17 17 0 0 1 4 5.7 2.5 2.5 0 0 1 6.5 3Z" />
  </svg>
);

const EyeIcon = ({ hidden }: { hidden: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.6" />{hidden && <path d="M3 21 21 3" />}
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 7.3 5.4 10.6 12 3.4" />
  </svg>
);

const ArrowIcon = () => (
  <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12h15" /><path d="m13 6 6 6-6 6" />
  </svg>
);

const GoogleMark = () => (
  <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
  </svg>
);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,20}$/;

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("auth_error");
    if (!code) return;
    const messages: Record<string, string> = {
      google_not_configured: "Google sign-in isn't configured yet. Add your credentials to .env.local.",
      google_cancelled: "Google sign-in was cancelled. Try again when ready.",
      google_failed: "Google sign-in failed. Please try again.",
      google_unverified: "Your Google email could not be verified.",
      google_no_identity: "Google did not return an identity. Please try again.",
    };
    setNotice(messages[code] || "Sign-in failed. Please try again.");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const timerActive = resendIn > 0;
  useEffect(() => {
    if (!timerActive) return;
    const id = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [timerActive]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
    setLoading(false);
    if (next === "otp") {
      setOtpStep("request");
      setOtpDigits(Array(6).fill(""));
      setResendIn(0);
    }
  };

  const requestOtp = async () => {
    setError("");
    setNotice("");
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Could not send a code. Try again.");
        return;
      }
      setOtpStep("verify");
      setResendIn(data.cooldown || 60);
      if (data.devCode) setNotice(`Demo mode — your code is ${data.devCode}. Add your email key to receive real codes.`);
      window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpCode = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits of your code.");
      return;
    }
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Could not verify the code.");
        setOtpDigits(Array(6).fill(""));
        otpRefs.current[0]?.focus();
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((previous) => {
      const next = [...previous];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    const next = Array(6).fill("");
    digits.split("").forEach((digit, index) => (next[index] = digit));
    setOtpDigits(next);
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (mode === "otp") {
      if (otpStep === "request") await requestOtp();
      else await verifyOtpCode();
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (mode === "forgot") {
      setNotice(`If an account exists for ${email.trim()}, a reset link is on its way.`);
      return;
    }
    if (mode === "signup") {
      if (name.trim().length < 2) {
        setError("Please enter your name.");
        return;
      }
      if (!PHONE_PATTERN.test(phone.trim()) || phone.replace(/\D/g, "").length < 7) {
        setError("Please enter a valid phone number.");
        return;
      }
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: mode === "signup" ? name.trim() : undefined,
          mode,
          remember: mode === "signin" ? remember : true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Could not sign in. Please try again.");
        return;
      }
      try {
        sessionStorage.removeItem("aw_auth");
        sessionStorage.removeItem("aw_remember");
      } catch {
        // Storage may be unavailable.
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "signin" ? "Welcome back." :
    mode === "signup" ? "Create account." :
    mode === "forgot" ? "Reset access." :
    otpStep === "request" ? "One-time code." : "Check inbox.";

  const subtitle =
    mode === "signin" ? "Sign in to step into your Armoire studio." :
    mode === "signup" ? "Set up your account and start building your closet." :
    mode === "forgot" ? "Enter your email and we'll send a reset link." :
    otpStep === "request" ? "We'll email you a 6-digit code — no password needed." :
    `Enter the code sent to ${email.trim()}. Expires in 5 minutes.`;

  const buttonLabel =
    mode === "signin" ? "Sign in" :
    mode === "signup" ? "Create account" :
    mode === "forgot" ? "Send reset link" :
    otpStep === "request" ? "Send code" : "Verify & continue";

  return (
    <main className="login-page">
      <Marquee />

      <div className="login-content">
        <div className="brand-line">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span><b>Armoire</b></span>
        </div>

        <div className="auth-card">
          <div className="card-kicker">
            <span>Member access</span>
            <span className="kicker-dot" />
          </div>

          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>

          {notice && (
            <div className="notice" role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="m8 12 2.6 2.6L16 9" />
              </svg>
              <span>{notice}</span>
            </div>
          )}

          {mode === "signin" && (
            <>
              <a className="google-btn" href="/api/auth/google">
                <GoogleMark />
                <span>Continue with Google</span>
              </a>
              <div className="or-line"><span>or sign in with email</span></div>
            </>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {mode === "signup" && (
              <div className="field">
                <label className="field-label" htmlFor="name">Full name</label>
                <div className="input-wrap">
                  <UserIcon />
                  <input id="name" name="name" type="text" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div className="field">
                <label className="field-label" htmlFor="phone">Phone number</label>
                <div className="input-wrap">
                  <PhoneIcon />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 555 000 1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="field">
              <label className="field-label" htmlFor="email">Email address</label>
              <div className="input-wrap">
                <MailIcon />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={mode === "otp" && otpStep === "verify"}
                />
              </div>
            </div>

            {mode === "otp" && otpStep === "verify" && (
              <div className="field">
                <span className="field-label">Verification code</span>
                <div className="otp-digits" onPaste={handlePaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => { otpRefs.current[index] = element; }}
                      className="otp-digit"
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={digit}
                      aria-label={`Digit ${index + 1}`}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(index, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {mode !== "forgot" && mode !== "otp" && (
              <div className="field">
                <label className="field-label" htmlFor="password">Password</label>
                <div className="input-wrap">
                  <LockIcon />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    <EyeIcon hidden={showPassword} />
                  </button>
                </div>
              </div>
            )}

            {error && <p className="field-error" role="alert">{error}</p>}

            {mode === "signin" && (
              <div className="options-row">
                <label className="checkbox">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span className="checkbox-box"><CheckIcon /></span>
                  Keep me signed in
                </label>
                <button type="button" className="text-link" onClick={() => switchMode("forgot")}>Forgot password?</button>
              </div>
            )}

            {mode === "otp" && otpStep === "verify" && (
              <div className="options-row">
                <button type="button" className="text-link" onClick={async () => { if (resendIn > 0) return; setOtpDigits(Array(6).fill("")); await requestOtp(); }} disabled={resendIn > 0}>
                  {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                </button>
                <button type="button" className="text-link" onClick={() => { setOtpStep("request"); setOtpDigits(Array(6).fill("")); setResendIn(0); setError(""); setNotice(""); }}>Different email</button>
              </div>
            )}

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? <span className="spinner" aria-hidden="true" /> : <>{buttonLabel}<ArrowIcon /></>}
            </button>
          </form>

          {mode === "signin" && (
            <button type="button" className="code-link" onClick={() => switchMode("otp")}>
              <MailIcon /> Sign in with a one-time code instead
            </button>
          )}

          <div className="auth-footer">
            {mode === "signin" ? (
              <p>
                New here?
                <button type="button" className="text-link" onClick={() => switchMode("signup")}>Create an account</button>
              </p>
            ) : (
              <p>
                {mode === "forgot" ? "Remembered your password?" : "Prefer another way?"}
                <button type="button" className="text-link" onClick={() => switchMode("signin")}>Sign in</button>
              </p>
            )}
            <p className="fine-print">By continuing, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</p>
          </div>
        </div>

        <p className="login-foot">Your closet, styled by intelligence.</p>
      </div>
    </main>
  );
}
