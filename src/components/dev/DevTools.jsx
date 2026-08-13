"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import AppIcon from "@/components/global/AppIcon";

import { useAuth } from "@/context/AuthContext";
import { useOverlay } from "@/context/ui/OverlayContext";

/* ==========================================================================
   RAFI PICTURE - DEVTOOLS CONFIG
   ==========================================================================

   Isi email dan password akun demo di sini.

   PENTING:
   File ini adalah Client Component.
   Jangan isi akun production / credential sensitif di sini.

   Untuk demo lokal / skripsi saja.
   ========================================================================== */

const DEVTOOLS_CONFIG = {
  enabled: true,

  admin: {
    email: "daffon.salman@gmail.com",
    password: "88888888",

    /*
     * Setelah login sebagai admin.
     */
    redirect: "/admin/dashboard",
  },

  client: {
    email: "daffon.salman@gmail.com",
    password: "",

    /*
     * Setelah login sebagai client.
     */
    redirect: "/",
  },
};

/* ==========================================================================
   FLOATING DEVTOOLS BUTTON
   ========================================================================== */

export default function DevTools() {
  const { openOverlay } = useOverlay();

  if (!DEVTOOLS_CONFIG.enabled) {
    return null;
  }

  function handleOpen() {
    openOverlay({
      closeOnBackdrop: true,
      closeOnEscape: true,
      className: "p-3 sm:p-6",

      content: <DevToolsPanel />,
    });
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      title="Developer Tools"
      aria-label="Buka Developer Tools"
      className="
        fixed bottom-5 left-5 z-[90]
        flex min-h-11 items-center gap-2
        rounded-xl
        border border-outline-variant/30
        bg-surface/95
        px-4 py-3
        font-label-sm text-[11px] font-semibold
        text-primary
        shadow-lg
        backdrop-blur-md
        transition-all duration-200
        hover:-translate-y-0.5
        hover:bg-surface-container
        hover:shadow-xl
        active:scale-[0.97]
      "
    >
      <AppIcon
        name="developer_mode"
        size={18}
      />

      <span>DEV</span>

      <span className="h-2 w-2 rounded-full bg-emerald-500" />
    </button>
  );
}

/* ==========================================================================
   DEVTOOLS PANEL
   ========================================================================== */

function DevToolsPanel() {
  const router = useRouter();

  const {
    closeOverlay,
  } = useOverlay();

  const {
    user,
    role,
    authLoading,
    profileLoading,
    login,
    logout,
    clearError,
    error: authError,
  } = useAuth();

  const [
    activeAction,
    setActiveAction,
  ] = useState(null);

  const [
    localError,
    setLocalError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const busy =
    authLoading ||
    Boolean(activeAction);

  /* ==========================================================================
     FEEDBACK
     ========================================================================== */

  function resetFeedback() {
    setLocalError("");
    setMessage("");

    clearError?.();
  }

  /* ==========================================================================
     LOGIN
     ========================================================================== */

  async function handleLogin(
    accountType,
  ) {
    if (busy) return;

    const account =
      DEVTOOLS_CONFIG[
        accountType
      ];

    resetFeedback();

    if (!account) {
      setLocalError(
        "Konfigurasi akun tidak ditemukan.",
      );

      return;
    }

    if (!account.email?.trim()) {
      setLocalError(
        `Email ${getAccountLabel(
          accountType,
        )} belum diisi pada DEVTOOLS_CONFIG.`,
      );

      return;
    }

    if (!account.password) {
      setLocalError(
        `Password ${getAccountLabel(
          accountType,
        )} belum diisi pada DEVTOOLS_CONFIG.`,
      );

      return;
    }

    setActiveAction(
      accountType,
    );

    try {
      await login(
        account.email,
        account.password,
      );

      setMessage(
        `Login sebagai ${getAccountLabel(
          accountType,
        )} berhasil.`,
      );

      /*
       * Tutup overlay setelah login.
       */
      closeOverlay();

      /*
       * Redirect sesuai akun.
       */
      if (account.redirect) {
        router.replace(
          account.redirect,
        );

        return;
      }

      router.refresh();
    } catch (loginError) {
      console.error(
        `DEVTOOLS LOGIN ${accountType.toUpperCase()} ERROR:`,
        loginError,
      );

      setLocalError(
        `Login sebagai ${getAccountLabel(
          accountType,
        )} gagal.`,
      );
    } finally {
      setActiveAction(null);
    }
  }

  /* ==========================================================================
     LOGOUT
     ========================================================================== */

  async function handleLogout() {
    if (busy || !user) {
      return;
    }

    resetFeedback();

    setActiveAction(
      "logout",
    );

    try {
      await logout();

      closeOverlay();

      router.replace("/");
      router.refresh();
    } catch (logoutError) {
      console.error(
        "DEVTOOLS LOGOUT ERROR:",
        logoutError,
      );

      setLocalError(
        "Logout gagal.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  /* ==========================================================================
     UI
     ========================================================================== */

  return (
    <section
      className="
        flex
        max-h-[calc(100dvh-2rem)]
        w-[min(94vw,470px)]
        flex-col
        overflow-hidden
        rounded-3xl
        border border-outline-variant/20
        bg-surface
        shadow-2xl
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header
        className="
          flex shrink-0
          items-start justify-between gap-5
          border-b border-outline-variant/20
          bg-surface-container/70
          px-5 py-5
          sm:px-6
        "
      >
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="
              flex h-11 w-11 shrink-0
              items-center justify-center
              rounded-2xl
              bg-primary/10
              text-primary
            "
          >
            <AppIcon
              name="developer_mode"
              size={23}
            />
          </div>

          <div className="min-w-0">
            <p
              className="
                font-label-sm
                text-[10px] font-semibold
                uppercase tracking-[0.18em]
                text-secondary
              "
            >
              Development Utility
            </p>

            <h2
              className="
                mt-1
                font-headline-md
                text-headline-md
                font-semibold
                text-on-surface
              "
            >
              Rafi Picture DevTools
            </h2>

            <p
              className="
                mt-1
                font-body-sm
                text-body-sm
                leading-relaxed
                text-on-surface-variant
              "
            >
              Login cepat ke akun demo
              tanpa melalui halaman
              authentication.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            closeOverlay()
          }
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl
            text-on-surface-variant
            transition-colors
            hover:bg-surface-container-high
            hover:text-primary
          "
          aria-label="Tutup Developer Tools"
        >
          <AppIcon
            name="close"
            size={21}
          />
        </button>
      </header>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          overflow-y-auto
          p-5
          sm:p-6
        "
      >
        {/* ===================================================
            CURRENT SESSION
        ==================================================== */}

        <section
          className="
            rounded-2xl
            border border-outline-variant/20
            bg-surface-container/40
            p-4
          "
        >
          <div
            className="
              flex items-center
              justify-between gap-4
            "
          >
            <div className="min-w-0">
              <p
                className="
                  font-label-sm
                  text-[10px]
                  uppercase
                  tracking-[0.16em]
                  text-on-surface-variant/70
                "
              >
                Current Session
              </p>

              {user ? (
                <>
                  <p
                    className="
                      mt-2 truncate
                      font-label-md
                      text-label-md
                      font-semibold
                      text-on-surface
                    "
                  >
                    {user.email ||
                      "User aktif"}
                  </p>

                  <div
                    className="
                      mt-2
                      flex flex-wrap
                      items-center gap-2
                    "
                  >
                    <span
                      className="
                        rounded-full
                        bg-primary/10
                        px-2.5 py-1
                        font-label-sm
                        text-[10px]
                        font-semibold
                        uppercase
                        text-primary
                      "
                    >
                      {profileLoading
                        ? "Memuat role..."
                        : role ||
                          "Role belum tersedia"}
                    </span>

                    <span
                      className="
                        rounded-full
                        bg-emerald-100
                        px-2.5 py-1
                        font-label-sm
                        text-[10px]
                        font-semibold
                        text-emerald-700
                      "
                    >
                      Authenticated
                    </span>
                  </div>
                </>
              ) : (
                <p
                  className="
                    mt-2
                    font-body-sm
                    text-body-sm
                    text-on-surface-variant
                  "
                >
                  Belum ada akun yang
                  login.
                </p>
              )}
            </div>

            <div
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-xl
                bg-surface
                text-on-surface-variant
              "
            >
              <AppIcon
                name={
                  user
                    ? "verified_user"
                    : "person"
                }
                size={20}
              />
            </div>
          </div>
        </section>

        {/* ===================================================
            ERROR
        ==================================================== */}

        {(localError ||
          authError) && (
          <div
            role="alert"
            className="
              mt-4
              rounded-xl
              border border-error/15
              bg-error-container/40
              px-4 py-3
              font-body-sm
              text-body-sm
              text-error
            "
          >
            {localError ||
              authError}
          </div>
        )}

        {/* ===================================================
            SUCCESS
        ==================================================== */}

        {message &&
          !localError &&
          !authError && (
            <div
              className="
                mt-4
                rounded-xl
                border border-emerald-200
                bg-emerald-50
                px-4 py-3
                font-body-sm
                text-body-sm
                text-emerald-700
              "
            >
              {message}
            </div>
          )}

        {/* ===================================================
            LOGIN ACTIONS
        ==================================================== */}

        <div className="mt-5">
          <p
            className="
              mb-3
              font-label-sm
              text-[10px]
              uppercase
              tracking-[0.18em]
              text-on-surface-variant/70
            "
          >
            Quick Login
          </p>

          <div className="space-y-3">
            {/* ADMIN */}

            <DevActionButton
              icon="admin_panel_settings"
              title="Login sebagai Admin"
              description={
                DEVTOOLS_CONFIG.admin
                  .email ||
                "Email Admin belum diisi"
              }
              loading={
                activeAction ===
                "admin"
              }
              disabled={busy}
              onClick={() =>
                handleLogin(
                  "admin",
                )
              }
              primary
            />

            {/* CLIENT */}

            <DevActionButton
              icon="person"
              title="Login sebagai Client"
              description={
                DEVTOOLS_CONFIG.client
                  .email ||
                "Email Client belum diisi"
              }
              loading={
                activeAction ===
                "client"
              }
              disabled={busy}
              onClick={() =>
                handleLogin(
                  "client",
                )
              }
            />
          </div>
        </div>

        {/* ===================================================
            LOGOUT
        ==================================================== */}

        <div className="mt-5">
          <button
            type="button"
            disabled={
              !user ||
              busy
            }
            onClick={
              handleLogout
            }
            className="
              group
              flex min-h-14 w-full
              items-center gap-4
              rounded-2xl
              border border-error/20
              bg-error-container/25
              px-4 py-3
              text-left
              transition-colors
              hover:bg-error-container/45
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <div
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-xl
                bg-surface
                text-error
              "
            >
              <AppIcon
                name="logout"
                size={20}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="
                  font-label-md
                  text-label-md
                  font-semibold
                  text-error
                "
              >
                {activeAction ===
                "logout"
                  ? "Sedang logout..."
                  : "Logout"}
              </p>

              <p
                className="
                  mt-0.5
                  font-body-sm
                  text-[11px]
                  text-error/75
                "
              >
                Keluar dari akun yang
                sedang aktif.
              </p>
            </div>

            <AppIcon
              name="chevron_right"
              size={20}
              className="
                text-error/70
                transition-transform
                group-hover:translate-x-0.5
              "
            />
          </button>
        </div>

        {/* ===================================================
            NOTE
        ==================================================== */}

        <div
          className="
            mt-5
            flex items-start gap-2
            rounded-xl
            bg-surface-container/50
            px-3 py-3
          "
        >
          <AppIcon
            name="info"
            size={16}
            className="mt-0.5 shrink-0 text-secondary"
          />

          <p
            className="
              font-body-sm
              text-[10px]
              leading-relaxed
              text-on-surface-variant
            "
          >
            Utility ini hanya untuk
            development dan demo Rafi
            Picture. Jangan simpan
            credential akun production
            di Client Component.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   DEV ACTION BUTTON
   ========================================================================== */

function DevActionButton({
  icon,
  title,
  description,
  loading,
  disabled,
  onClick,
  primary = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        group
        flex min-h-14 w-full
        items-center gap-4
        rounded-2xl
        border
        px-4 py-3
        text-left
        transition-all duration-200
        disabled:cursor-not-allowed
        disabled:opacity-50

        ${
          primary
            ? `
              border-primary
              bg-primary
              text-on-primary
              hover:opacity-90
            `
            : `
              border-outline-variant/20
              bg-surface
              text-on-surface
              hover:border-primary/30
              hover:bg-surface-container/60
            `
        }
      `}
    >
      <div
        className={`
          flex h-10 w-10 shrink-0
          items-center justify-center
          rounded-xl

          ${
            primary
              ? `
                bg-white/15
                text-on-primary
              `
              : `
                bg-primary/10
                text-primary
              `
          }
        `}
      >
        <AppIcon
          name={icon}
          size={20}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="
            font-label-md
            text-label-md
            font-semibold
          "
        >
          {loading
            ? "Sedang login..."
            : title}
        </p>

        <p
          className={`
            mt-0.5 truncate
            font-body-sm
            text-[11px]

            ${
              primary
                ? "text-on-primary/75"
                : "text-on-surface-variant"
            }
          `}
        >
          {description}
        </p>
      </div>

      <AppIcon
        name="chevron_right"
        size={20}
        className="
          transition-transform
          group-hover:translate-x-0.5
        "
      />
    </button>
  );
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

function getAccountLabel(
  accountType,
) {
  switch (accountType) {
    case "admin":
      return "Admin";

    case "client":
      return "Client";

    default:
      return "Akun";
  }
}