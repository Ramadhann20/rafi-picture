
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppIcon from "@/components/global/AppIcon";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const router = useRouter();

  const {
    user,
    role,
    loading,
    authLoading,
    profileLoading,
    error,
    login,
    logout,
    clearError,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [waitingForRole, setWaitingForRole] =
    useState(false);

  const [roleError, setRoleError] = useState("");

  const isCheckingAccess =
    waitingForRole &&
    Boolean(user) &&
    profileLoading;

  const isSubmitting =
    authLoading ||
    waitingForRole ||
    loading;

  /* =========================================================
     ADMIN ROLE CHECK

     Setelah Firebase Authentication berhasil, AuthContext
     akan membaca dokumen Users/{uid} melalui onSnapshot.

     Redirect hanya dilakukan setelah profile selesai dimuat.
  ========================================================= */

  useEffect(() => {
    if (loading || profileLoading) {
      return;
    }

    // Admin yang sudah login langsung masuk dashboard.
    if (user && role === "admin") {
      setWaitingForRole(false);

      router.replace("/admin/dashboard");
      router.refresh();

      return;
    }

    /*
     * Hanya tolak user non-admin apabila pengecekan ini berasal
     * dari percobaan login melalui form admin.
     */
    if (
      waitingForRole &&
      user &&
      role !== "admin"
    ) {
      let cancelled = false;

      async function rejectNonAdminUser() {
        setWaitingForRole(false);

        if (!cancelled) {
          setRoleError(
            "Akun ini tidak memiliki akses administrator.",
          );
        }

        try {
          await logout();
        } catch (logoutError) {
          console.error(
            "FAILED TO LOGOUT NON-ADMIN USER:",
            logoutError,
          );
        }
      }

      rejectNonAdminUser();

      return () => {
        cancelled = true;
      };
    }
  }, [
    user,
    role,
    loading,
    profileLoading,
    waitingForRole,
    logout,
    router,
  ]);

  /* =========================================================
     FORM HANDLERS
  ========================================================= */

  function handleEmailChange(event) {
    setEmail(event.target.value);

    if (error) {
      clearError();
    }

    if (roleError) {
      setRoleError("");
    }
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);

    if (error) {
      clearError();
    }

    if (roleError) {
      setRoleError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearError();
    setRoleError("");
    setWaitingForRole(true);

    try {
      await login(email, password);

      /*
       * Jangan redirect di sini.
       * Tunggu AuthContext selesai membaca role Firestore.
       * useEffect di atas yang menangani hasilnya.
       */
    } catch (loginError) {
      console.error(
        "ADMIN LOGIN FAILED:",
        loginError,
      );

      setWaitingForRole(false);
      
    }
  }

  function handleForgotPassword() {
    console.log("OPEN_ADMIN_PASSWORD_RESET");
  }

  const displayedError = roleError || error;

  return (
    <div className="w-full max-w-[440px] fade-in-up">
      {/* =====================================================
          FORM HEADER
      ===================================================== */}

      <div className="mb-stack-md text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-on-primary shadow-xl">
          <AppIcon
            name="lock_person"
            size={32}
          />
        </div>

        <h1 className="mb-2 font-headline-lg text-headline-lg text-primary">
          Secure Access
        </h1>

        <p className="font-body-md text-body-md text-on-surface-variant">
          Sign in using an authorized studio administrator
          account.
        </p>
      </div>

      {/* =====================================================
          LOGIN CARD
      ===================================================== */}

      <div className="glass-card rounded-xl p-stack-md md:p-stack-lg">
        <form
          className="space-y-6"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Error message */}
          {displayedError && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-error/20 bg-error-container/60 px-4 py-3"
            >
              <p className="font-label-sm text-label-sm text-error">
                {displayedError}
              </p>
            </div>
          )}

          {/* Email */}
          <div className="group relative">
            <label
              className="mb-1 block font-label-sm text-label-sm text-on-surface-variant transition-colors group-focus-within:text-primary"
              htmlFor="admin-email"
            >
              Studio Email
            </label>

            <div className="relative">
              <AppIcon
                name="mail"
                size={20}
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />

              <input
                id="admin-email"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="name@rafipicture.com"
                autoComplete="email"
                required
                disabled={isSubmitting}
                className="w-full border-0 border-b border-outline-variant bg-transparent py-3 pl-8 pr-2 font-body-md text-body-md text-on-surface transition-all placeholder:text-outline focus:border-primary focus:ring-0 disabled:cursor-wait disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div className="group relative">
            <div className="mb-1 flex items-center justify-between">
              <label
                className="font-label-sm text-label-sm text-on-surface-variant transition-colors group-focus-within:text-primary"
                htmlFor="admin-password"
              >
                Password
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-label-sm text-label-sm text-on-surface-variant underline decoration-[1px] underline-offset-4 transition-colors hover:text-primary"
              >
                Forgot?
              </button>
            </div>

            <div className="relative">
              <AppIcon
                name="lock"
                size={20}
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />

              <input
                id="admin-password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                className="w-full border-0 border-b border-outline-variant bg-transparent py-3 pl-8 pr-10 font-body-md text-body-md text-on-surface transition-all placeholder:text-outline focus:border-primary focus:ring-0 disabled:cursor-wait disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (currentValue) =>
                      !currentValue,
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                aria-pressed={showPassword}
                disabled={isSubmitting}
                className="absolute right-0 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary disabled:cursor-wait disabled:opacity-50"
              >
                <AppIcon
                  name={
                    showPassword
                      ? "visibility_off"
                      : "visibility"
                  }
                  size={20}
                />
              </button>
            </div>
          </div>

          {/* Security information */}
          <div className="flex items-start gap-3 rounded-lg bg-surface-container-low p-4">
            <AppIcon
              name="verified_user"
              size={21}
              className="mt-0.5 shrink-0 text-secondary"
            />

            <p className="font-label-sm text-label-sm text-on-secondary-container">
              Access is restricted to accounts with the
              administrator role.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 font-label-md text-label-md text-on-primary transition-all duration-300 hover:opacity-90 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {authLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />

                <span>Authenticating...</span>
              </>
            ) : isCheckingAccess ||
              waitingForRole ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />

                <span>Verifying Access...</span>
              </>
            ) : (
              <>
                <span>Enter Dashboard</span>

                <AppIcon
                  name="arrow_forward"
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        </form>
      </div>

      {/* =====================================================
          FOOTER NOTE
      ===================================================== */}

      <div className="mt-8 text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Internal Access Only. No registration available.

          <span className="mt-2 block opacity-60">
            System Version 4.2.0-RAFI
          </span>
        </p>
      </div>
    </div>
  );
}

