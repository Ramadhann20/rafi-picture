"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useOverlay } from "@/context/ui/OverlayContext";

import OtpVerificationOverlay from "@/components/ui/OtpVerificationOverlay";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px] shrink-0"
      viewBox="0 0 24 24"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-1.99 3.02v2.55h3.23c1.89-1.74 2.98-4.3 2.98-7.42Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.23-2.55c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.05v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.05A10 10 0 0 0 2 12c0 1.61.38 3.13 1.05 4.48l3.34-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.95 5.52l3.34 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
      />
    </svg>
  );
}

const MODE_COPY = {
  login: {
    title: "Welcome Back",
    description:
      "Sign in to access your private gallery and manage your bookings.",
  },
  register: {
    title: "Join the Studio",
    description:
      "Create your account and keep every Rafi Picture moment in one place.",
  },
};

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function AuthContainer() {
  const router = useRouter();
  const { openOverlay } = useOverlay();

  const {
    user,
    login,
    continueWithGoogle,
    loading,
    authLoading,
    error,
    clearError,
  } = useAuth();

  const [authMode, setAuthMode] = useState("login");
  const [displayMode, setDisplayMode] = useState("login");
  const [isSwitching, setIsSwitching] = useState(false);
  const [registerFlowLoading, setRegisterFlowLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const switchTimerRef = useRef(null);

  const isLogin = authMode === "login";
  const displayedIsLogin = displayMode === "login";
  const copy = MODE_COPY[authMode];
  const busy = authLoading || registerFlowLoading;

  useEffect(() => {
    if (loading || !user) return;
    router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    return () => {
      if (switchTimerRef.current) {
        clearTimeout(switchTimerRef.current);
      }
    };
  }, []);

  const handleModeChange = (nextMode) => {
    if (busy || isSwitching || nextMode === authMode) {
      return;
    }

    clearError();
    setRegisterError("");
    setAuthMode(nextMode);
    setIsSwitching(true);

    if (switchTimerRef.current) {
      clearTimeout(switchTimerRef.current);
    }

    switchTimerRef.current = setTimeout(() => {
      setDisplayMode(nextMode);

      requestAnimationFrame(() => {
        setIsSwitching(false);
      });
    }, 180);
  };

  const handleLogin = async (email, password) => {
    setRegisterError("");

    try {
      await login(email, password);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleRegister = async (
    email,
    password,
    confirmPassword,
    firstName,
    lastName
  ) => {
    if (registerFlowLoading) return;

    clearError();
    setRegisterError("");

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const username = `${firstName || ""} ${lastName || ""}`.trim();

    if (!firstName?.trim() || !lastName?.trim()) {
      setRegisterError("First name and last name are required.");
      return;
    }

    if (!normalizedEmail) {
      setRegisterError("Email address is required.");
      return;
    }

    if (password.length < 8) {
      setRegisterError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setRegisterError("Passwords do not match.");
      return;
    }

    setRegisterFlowLoading(true);

    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message || `Unable to send OTP (${response.status}).`
        );
      }

      openOverlay({
        closeOnBackdrop: false,
        className: "px-4 sm:px-6",
        content: (
          <OtpVerificationOverlay
            email={normalizedEmail}
            password={password}
            username={username}
            initialResendAfter={data?.resendAfter || 60}
          />
        ),
      });
    } catch (err) {
      console.error("OTP request failed:", err);
      setRegisterError(err?.message || "Unable to send verification code.");
    } finally {
      setRegisterFlowLoading(false);
    }
  };

  const handleGoogle = async () => {
    setRegisterError("");

    try {
      await continueWithGoogle();
    } catch (err) {
      console.error("Google authentication failed:", err);
    }
  };

  return (
    <div
      className="
        w-full max-w-[410px]
        max-h-full
        transition-transform duration-300
        [@media(max-height:720px)]:scale-[0.93]
        [@media(max-height:640px)]:scale-[0.86]
      "
    >
      <div className="mb-4 h-[82px]">
        <div className="mb-1 flex h-4 items-center gap-2 md:hidden">
          <span className="h-px w-6 bg-primary/50" />
          <span className="font-label-sm text-[11px] uppercase tracking-[0.22em] text-primary/70">
            Rafi Picture
          </span>
        </div>

        <div
          className={`
            transition-all duration-300 ease-out
            ${
              isSwitching
                ? "translate-y-1 opacity-60"
                : "translate-y-0 opacity-100"
            }
          `}
        >
          <h3 className="font-headline-lg text-headline-lg leading-tight text-primary">
            {copy.title}
          </h3>

          <p className="mt-1.5 max-w-sm font-body-md text-sm leading-5 text-on-surface-variant">
            {copy.description}
          </p>
        </div>
      </div>

      <div
        className={`
          origin-top transition-all duration-[180ms] ease-out
          ${
            isSwitching
              ? "translate-y-2 scale-[0.992] opacity-0"
              : "translate-y-0 scale-100 opacity-100"
          }
        `}
      >
        <div className="relative mb-4 grid grid-cols-2 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container/40 p-1">
          <span
            aria-hidden="true"
            className={`
              absolute bottom-1 left-1 top-1
              w-[calc(50%-4px)]
              rounded-lg bg-surface shadow-sm
              ring-1 ring-outline-variant/20
              transition-transform duration-300
              ease-[cubic-bezier(0.22,1,0.36,1)]
              ${
                isLogin
                  ? "translate-x-0"
                  : "translate-x-[calc(100%+4px)]"
              }
            `}
          />

          <button
            type="button"
            onClick={() => handleModeChange("login")}
            disabled={busy || isSwitching}
            className={`
              relative z-10 h-9 rounded-lg
              font-label-md text-sm
              transition-colors duration-300
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                isLogin
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-primary"
              }
            `}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("register")}
            disabled={busy || isSwitching}
            className={`
              relative z-10 h-9 rounded-lg
              font-label-md text-sm
              transition-colors duration-300
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                !isLogin
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-primary"
              }
            `}
          >
            Create Account
          </button>
        </div>

        <div>
          {displayedIsLogin ? (
            <LoginForm
              handleLogin={handleLogin}
              loading={authLoading}
            />
          ) : (
            <RegisterForm
              handleRegister={handleRegister}
              loading={busy}
            />
          )}
        </div>

        {(error || registerError) && (
          <div className="mt-2.5 rounded-lg border border-error/20 bg-error/5 px-3 py-2">
            <p className="font-label-sm text-xs leading-4 text-error">
              {registerError || error}
            </p>
          </div>
        )}

        <div className="my-3.5 flex items-center gap-3">
          <div className="h-px grow bg-outline-variant/30" />

          <span className="font-label-sm text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/80">
            Or continue with
          </span>

          <div className="h-px grow bg-outline-variant/30" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy || isSwitching}
          className="
            group flex h-11 w-full items-center
            justify-center gap-3 rounded-xl
            border border-outline-variant/60
            bg-surface px-4 text-on-surface
            shadow-sm transition-all duration-200
            hover:-translate-y-px
            hover:border-primary/35
            hover:bg-secondary-container/15
            hover:shadow-md
            active:translate-y-0
            active:scale-[0.99]
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          <span
            className="
              flex h-7 w-7 items-center justify-center
              rounded-full bg-white shadow-sm ring-1 ring-black/5
              transition-transform duration-200
              group-hover:scale-105
            "
          >
            <GoogleIcon />
          </span>

          <span className="font-label-md text-sm font-medium">
            {authLoading ? "Connecting..." : "Continue with Google"}
          </span>
        </button>

        <p className="mt-3 text-center font-label-sm text-[10px] leading-4 text-on-surface-variant/80">
          By continuing, you agree to our{" "}
          <a
            className="text-primary underline underline-offset-2"
            href="#"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            className="text-primary underline underline-offset-2"
            href="#"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
