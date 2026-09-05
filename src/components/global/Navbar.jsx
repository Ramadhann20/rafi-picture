"use client";

import {
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import AppIcon from "@/components/global/AppIcon";
import SkeletonLoader from "@/components/global/SkeletonLoader";
import ProfilePhotoEditor from "@/components/profile/ProfilePhotoEditor";
import ProfileMenu from "./ProfileMenu";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useOverlay } from "@/context/ui/OverlayContext";

const navLinks = [
  {
    key: "home",
    href: "/",
    icon: "dashboard",
  },
  {
    key: "portfolio",
    href: "/portfolio",
    icon: "photo_camera",
  },
  {
    key: "packages",
    href: "/packages",
    icon: "shopping_bag",
  },
  {
    key: "booking",
    href: "/booking",
    icon: "calendar_month",
  },
];

export default function Navbar() {
  const {
    user,
    loading,
    logout,
    profileLoading,
    userDoc,
    error,
  } = useAuth();

  const {
    openOverlay,
    closeOverlay,
  } = useOverlay();

  const pathname = usePathname();
  const {
    language,
    setLanguage,
    translate,
  } = useLanguage();

  const [isScrolled, setIsScrolled] =
    useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  async function handleLogout() {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (logoutError) {
      console.error("LOGOUT ERROR:", logoutError);
    }
  }

  const displayName =
    userDoc?.username ||
    userDoc?.fullName ||
    user?.displayName ||
    "Akun Saya";

  const photoURL =
    userDoc?.photoURL ||
    user?.photoURL ||
    null;

  function handleEditProfilePhoto() {
    if (!user) return;

    setIsMobileMenuOpen(false);

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

  if (error) {
    return (
      <nav className="bg-error-container p-4 text-sm text-error">
        Terjadi kesalahan saat memuat data user.
      </nav>
    );
  }

  return (
    <>
      <nav
        className={`sticky top-0 z-50 border-b border-white/20 bg-surface/80 backdrop-blur-md transition-shadow ${
          isScrolled ? "shadow-md" : ""
        }`}
      >
        <div className="relative mx-auto flex w-full max-w-container-max items-center justify-between px-margin-mobile py-4 md:px-margin-desktop">
          <Link
            href="/"
            className="font-headline-md text-headline-md font-bold text-primary"
          >
            Rafi Picture
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
            {navLinks
              .filter((item) => item.href !== "/")
              .map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`font-label-md transition-all duration-300 ${
                      isActive
                        ? "border-b-2 border-primary pb-1 text-primary"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {translate(item.key)}
                  </Link>
                );
              })}
          </div>

          <div className="hidden items-center md:flex">
            <label className="mr-4 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
              <span className="sr-only">{translate("language")}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="rounded-md border border-outline-variant bg-transparent px-2 py-1.5 text-on-surface outline-none focus:border-primary"
                aria-label={translate("language")}
              >
                <option value="en">{translate("english")}</option>
                <option value="id">{translate("indonesian")}</option>
              </select>
            </label>
            {loading || profileLoading ? (
              <SkeletonLoader className="h-12 w-[160px] rounded-lg" />
            ) : user ? (
              <ProfileMenu
                user={user}
                userDoc={userDoc}
                logout={logout}
              />
            ) : (
              <Link
                href="/authentication"
                className="rounded-lg bg-primary px-6 py-2.5 font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95"
              >
                {translate("login")}
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary transition-all hover:bg-surface-container active:scale-95 md:hidden"
            aria-label="Buka menu navigasi"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-sidebar"
          >
            <AppIcon name="more_vert" size={25} />
          </button>
        </div>
      </nav>

      <div
        aria-hidden="true"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/35 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="mobile-sidebar"
        aria-label="Menu navigasi"
        className={`fixed right-0 top-0 z-[70] flex h-[100dvh] w-[86%] max-w-[360px] flex-col border-l border-outline-variant/20 bg-surface shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
          <Link
            href="/"
            className="font-headline-md text-headline-md font-bold text-primary"
          >
            Rafi Picture
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            aria-label="Tutup menu navigasi"
          >
            <AppIcon name="close" size={24} />
          </button>
        </div>

        <div className="border-b border-outline-variant/20 p-5">
          {loading || profileLoading ? (
            <div className="flex items-center gap-3">
              <SkeletonLoader className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonLoader className="h-4 w-28 rounded" />
                <SkeletonLoader className="h-3 w-40 rounded" />
              </div>
            </div>
          ) : user ? (
            <button
              type="button"
              onClick={handleEditProfilePhoto}
              className="flex w-full items-center gap-3 rounded-xl text-left transition-opacity hover:opacity-80"
              title="Ubah foto profil"
            >
              <MobileProfile
                user={user}
                userDoc={userDoc}
              />
            </button>
          ) : (
            <GuestProfile />
          )}
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 py-5"
          aria-label="Navigasi mobile"
        >
          <p className="mb-2 px-3 font-label-sm text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60">
            Navigasi
          </p>

          <div className="space-y-1">
            {navLinks.map((item) => (
              <MobileNavLink
                key={item.href}
                item={item}
                pathname={pathname}
              />
            ))}
          </div>
        </nav>

        <div className="border-t border-outline-variant/20 p-4">
          {loading || profileLoading ? (
            <SkeletonLoader className="h-12 w-full rounded-xl" />
          ) : user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="group flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-error-container/40"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-error-container text-error">
                  <AppIcon name="logout" size={19} />
                </span>
                <div>
                  <p className="font-label-md text-label-md text-error">
                    Keluar
                  </p>
                  <p className="mt-0.5 font-body-sm text-[11px] text-on-surface-variant">
                    Keluar dari akun
                  </p>
                </div>
              </div>
              <AppIcon
                name="chevron_right"
                size={20}
                className="text-on-surface-variant/50 transition-transform group-hover:translate-x-0.5"
              />
            </button>
          ) : (
            <Link
              href="/authentication"
              className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3.5 font-label-md text-on-primary transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Login
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

function MobileProfile({ user, userDoc }) {
  const displayName =
    userDoc?.username ||
    userDoc?.fullName ||
    user?.displayName ||
    "Akun Saya";

  const email = user?.email || "";
  const photoURL = userDoc?.photoURL || user?.photoURL || null;
  const initials = getInitials(displayName);

  return (
    <>
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold uppercase text-on-primary">
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-label-md text-label-md font-semibold text-primary">
          {displayName}
        </p>
        {email && (
          <p className="mt-1 truncate font-body-sm text-body-sm text-on-surface-variant">
            {email}
          </p>
        )}
        <p className="mt-1 font-body-sm text-[10px] text-secondary">
          Ketuk untuk ubah foto profil
        </p>
      </div>
    </>
  );
}

function GuestProfile() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-primary">
        <AppIcon name="person" size={24} />
      </div>
      <div>
        <p className="font-label-md text-label-md font-semibold text-primary">
          Selamat Datang
        </p>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Login untuk mengakses akun Anda.
        </p>
      </div>
    </div>
  );
}

function MobileNavLink({ item, pathname }) {
  const { translate } = useLanguage();

  const isActive =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href ||
        pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-3.5 transition-all ${
        isActive
          ? "bg-primary text-on-primary"
          : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          isActive
            ? "bg-white/10"
            : "bg-surface-container group-hover:bg-surface-container-high"
        }`}
      >
        <AppIcon name={item.icon} size={19} />
      </span>

      <span className="flex-1 font-label-md text-label-md">
        {translate(item.key)}
      </span>

      {isActive && (
        <span className="h-1.5 w-1.5 rounded-full bg-on-primary" />
      )}
    </Link>
  );
}

function getInitials(value) {
  const normalized = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!normalized.length) return "RP";
  if (normalized.length === 1) {
    return normalized[0].slice(0, 2).toUpperCase();
  }

  return `${normalized[0][0]}${normalized[normalized.length - 1][0]}`.toUpperCase();
}
