"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";

import AppIcon from "@/components/global/AppIcon";
import ProfilePhotoEditor from "@/components/profile/ProfilePhotoEditor";
import { useOverlay } from "@/context/ui/OverlayContext";

function getInitials(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "RP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfileMenu({
  user,
  userDoc,
  logout,
}) {
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const {
    openOverlay,
    closeOverlay,
  } = useOverlay();

  const displayName =
    userDoc?.username ||
    userDoc?.fullName ||
    user?.displayName ||
    "Akun Saya";

  const photoURL =
    userDoc?.photoURL ||
    user?.photoURL ||
    null;

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );
    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open]);

  function handleEditPhoto() {
    setOpen(false);

    openOverlay({
      closeOnBackdrop: true,
      closeOnEscape: true,
      className: "p-3 sm:p-6",
      content: (
        <ProfilePhotoEditor
          user={user}
          currentPhotoURL={photoURL}
          displayName={displayName}
          onClose={closeOverlay}
        />
      ),
    });
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout?.();
      setOpen(false);
    } catch (error) {
      console.error(
        "PROFILE MENU LOGOUT ERROR:",
        error,
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
        className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface px-3 py-2 transition-colors hover:bg-surface-container-low"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold uppercase text-on-primary">
          {photoURL ? (
            <img
              src={photoURL}
              alt={`Foto profil ${displayName}`}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(displayName)
          )}
        </span>

        <span className="max-w-36 truncate font-label-md text-label-md text-primary">
          {displayName}
        </span>

        <AppIcon
          name={open ? "expand_less" : "expand_more"}
          size={18}
          className="text-on-surface-variant"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-[80] w-64 overflow-hidden rounded-xl border border-outline-variant/25 bg-surface shadow-xl"
        >
          <div className="border-b border-outline-variant/20 px-4 py-4">
            <p className="truncate font-label-md text-label-md text-on-surface">
              {displayName}
            </p>
            <p className="mt-1 truncate font-body-sm text-body-sm text-on-surface-variant">
              {user?.email || ""}
            </p>
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={handleEditPhoto}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            >
              <AppIcon
                name="photo_camera"
                size={19}
              />
              Ubah Foto Profil
            </button>

            <Link
              href="/booking"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            >
              <AppIcon
                name="calendar_month"
                size={19}
              />
              Pemesanan Saya
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left font-label-md text-label-md text-error transition-colors hover:bg-error-container/40 disabled:opacity-50"
            >
              <AppIcon
                name="logout"
                size={19}
              />
              {loggingOut ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
