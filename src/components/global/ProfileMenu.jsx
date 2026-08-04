"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import AppIcon from "@/components/global/AppIcon";

export default function ProfileMenu({
  user,
  userDoc,
  logout,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const menuRef = useRef(null);

  const username = useMemo(() => {
    return (
      userDoc?.username ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "Pengguna"
    );
  }, [user, userDoc]);

  const email =
    userDoc?.email ||
    user?.email ||
    "Email tidak tersedia";

  const profileImage =
    userDoc?.photoURL ||
    userDoc?.photoUrl ||
    user?.photoURL ||
    "https://i.pravatar.cc/100";

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [isOpen]);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error(
        "PROFILE MENU LOGOUT ERROR:",
        error,
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      {/* PROFILE BUTTON */}

      <button
        type="button"
        onClick={() =>
          setIsOpen((previous) => !previous)
        }
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-all ${
          isOpen
            ? "border-primary/30 bg-surface-container-high"
            : "border-transparent bg-surface-container hover:bg-surface-container-high"
        }`}
      >
        <div className="min-w-0 text-right">
          <p className="max-w-32 truncate font-label-md text-label-md text-on-surface">
            {username}
          </p>
        </div>

        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-container">
          <img
            src={profileImage}
            alt={`Foto profil ${username}`}
            className="h-full w-full object-cover"
          />
        </div>

        <AppIcon
          name={
            isOpen
              ? "expand_less"
              : "expand_more"
          }
          size={22}
          className="shrink-0 text-on-surface-variant"
        />
      </button>

      {/* PROFILE MENU */}

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[70] mt-3 flex min-h-[320px] w-[320px] flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface p-3 shadow-2xl"
        >
          <div>
            {/* PROFILE INFORMATION */}

            <div className="rounded-lg bg-surface-container-low p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                  <img
                    src={profileImage}
                    alt={`Foto profil ${username}`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-label-md text-label-md text-on-surface">
                    {email}
                  </p>

                  <p className="mt-1 truncate font-label-sm text-label-sm text-on-surface-variant">
                    {username}
                  </p>
                </div>
              </div>
            </div>

            {/* MENU LIST */}

            <nav
              aria-label="Menu profil"
              className="mt-3"
            >
              <Link
                href="/booking"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                  <AppIcon
                    name="calendar_month"
                    size={19}
                  />
                </span>

                <span>Booking Saya</span>

                <AppIcon
                  name="chevron_right"
                  size={21}
                  className="ml-auto text-on-surface-variant"
                />
              </Link>
            </nav>
          </div>

          {/* LOGOUT */}

          <div className="mt-auto border-t border-outline-variant/30 pt-3">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 font-label-md text-label-md text-error transition-colors hover:bg-error-container/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
                {isLoggingOut ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-error/30 border-t-error" />
                ) : (
                  <AppIcon
                    name="logout"
                    size={19}
                  />
                )}
              </span>

              <span>
                {isLoggingOut
                  ? "Keluar..."
                  : "Logout"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}