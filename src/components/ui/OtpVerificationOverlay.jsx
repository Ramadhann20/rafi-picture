"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { useOverlay } from "@/context/ui/OverlayContext";

const OTP_LENGTH = 6;

function normalizeDigits(value = "") {
  return String(value).replace(/\D/g, "").slice(0, OTP_LENGTH);
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function OtpVerificationOverlay({
  email,
  password,
  username,
  initialResendAfter = 60,
}) {
  const { closeOverlay } = useOverlay();
  const { completeOtpRegistration } = useAuth();

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(
    Math.max(Number(initialResendAfter) || 60, 0)
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    "We sent a 6-digit verification code to your email."
  );

  const inputsRef = useRef([]);

  const otp = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return undefined;

    const timer = window.setInterval(() => {
      setCountdown((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  const setOtpFromString = (value) => {
    const normalized = normalizeDigits(value);
    const nextDigits = Array(OTP_LENGTH).fill("");

    normalized.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });

    setDigits(nextDigits);

    const nextIndex = Math.min(normalized.length, OTP_LENGTH - 1);
    requestAnimationFrame(() => {
      inputsRef.current[nextIndex]?.focus();
    });
  };

  const handleDigitChange = (index, value) => {
    const normalized = normalizeDigits(value);

    if (normalized.length > 1) {
      setOtpFromString(normalized);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = normalized;
    setDigits(nextDigits);
    setError("");

    if (normalized && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const pasted = normalizeDigits(event.clipboardData.getData("text"));

    if (!pasted) return;

    event.preventDefault();
    setOtpFromString(pasted);
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    if (loading || otp.length !== OTP_LENGTH) return;

    setLoading(true);
    setError("");
    setInfo("");

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          password,
          username,
        }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        let message =
          data?.message || `Verification failed (${response.status}).`;

        if (typeof data?.remainingAttempts === "number") {
          message += ` ${data.remainingAttempts} attempt(s) remaining.`;
        }

        throw new Error(message);
      }

      if (!data?.customToken) {
        throw new Error("Registration token was not returned by the server.");
      }

      setInfo("Email verified. Signing you in...");

      await completeOtpRegistration(data.customToken);

      closeOverlay();
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err?.message || "Unable to verify the code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || loading || countdown > 0) return;

    setResending(true);
    setError("");
    setInfo("");

    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        if (data?.code === "OTP_COOLDOWN" && data?.retryAfter) {
          setCountdown(Number(data.retryAfter));
        }

        throw new Error(
          data?.message || `Unable to resend OTP (${response.status}).`
        );
      }

      setDigits(Array(OTP_LENGTH).fill(""));
      setCountdown(Number(data?.resendAfter || 60));
      setInfo("A new verification code has been sent.");

      requestAnimationFrame(() => {
        inputsRef.current[0]?.focus();
      });
    } catch (err) {
      console.error("OTP resend error:", err);
      setError(err?.message || "Unable to resend the verification code.");
    } finally {
      setResending(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    closeOverlay();
  };

  return (
    <section
      aria-labelledby="otp-title"
      className="relative w-full max-w-[460px] overflow-hidden rounded-[28px] border border-outline-variant/40 bg-surface shadow-2xl"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

      <button
        type="button"
        aria-label="Close verification window"
        onClick={handleClose}
        disabled={loading}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <div className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
        <div className="mb-6 pr-10">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6.5h16v11H4z" />
              <path d="m4 7 8 6 8-6" />
            </svg>
          </div>

          <p className="mb-1 font-label-sm text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">
            Rafi Picture
          </p>

          <h2
            id="otp-title"
            className="font-headline-lg text-2xl leading-tight text-primary"
          >
            Verify your email
          </h2>

          <p className="mt-2 font-body-md text-sm leading-6 text-on-surface-variant">
            Enter the 6-digit code we sent to{" "}
            <span className="font-semibold text-on-surface">{email}</span>.
            The code expires in 5 minutes.
          </p>
        </div>

        {info && (
          <div className="mb-4 rounded-xl border border-primary/15 bg-primary/5 px-3.5 py-3">
            <p className="font-body-md text-xs leading-5 text-primary">
              {info}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-error/20 bg-error/5 px-3.5 py-3">
            <p className="font-body-md text-xs leading-5 text-error">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div
            className="grid grid-cols-6 gap-2 sm:gap-2.5"
            onPaste={handlePaste}
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputsRef.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                disabled={loading}
                aria-label={`OTP digit ${index + 1}`}
                onChange={(event) =>
                  handleDigitChange(index, event.target.value)
                }
                onKeyDown={(event) => handleKeyDown(index, event)}
                onFocus={(event) => event.currentTarget.select()}
                className="h-14 min-w-0 rounded-xl border border-outline-variant/60 bg-surface-container/30 text-center font-headline-lg text-xl text-primary outline-none transition-all focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 sm:h-16 sm:text-2xl"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== OTP_LENGTH}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 font-label-md text-sm font-semibold tracking-wide text-on-primary transition-all duration-200 hover:bg-tertiary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verifying & creating account..." : "Verify & Continue"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="font-label-md text-xs text-on-surface-variant transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Change email
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending || loading}
            className="font-label-md text-xs font-semibold text-primary transition hover:opacity-70 disabled:cursor-not-allowed disabled:text-on-surface-variant/60"
          >
            {resending
              ? "Sending..."
              : countdown > 0
                ? `Resend in ${countdown}s`
                : "Resend code"}
          </button>
        </div>
      </div>
    </section>
  );
}
