"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import AppIcon from "@/components/global/AppIcon";
import SkeletonLoader from "@/components/global/SkeletonLoader";
import ProfileMenu from "./ProfileMenu";

import { useAuth } from "@/context/AuthContext";

const navLinks = [
  {
    label: "Portofolio",
    href: "/portfolio",
  },
  {
    label: "Paket",
    href: "/packages",
  },
  {
    label: "Pemesanan",
    href: "/booking",
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

  const pathname = usePathname();

  const [isScrolled, setIsScrolled] =
    useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, []);

  if (error) {
    return (
      <nav className="bg-error-container p-4 text-sm text-error">
        Terjadi kesalahan saat memuat data user.
      </nav>
    );
  }

  return (
    <nav
      className={`sticky top-0 z-50 border-b border-white/20 bg-surface/80 backdrop-blur-md transition-shadow ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <div className="relative mx-auto flex w-full max-w-container-max items-center justify-between px-margin-mobile py-4 md:px-margin-desktop">
        {/* BRAND */}

        <Link
          href="/"
          className="font-headline-md text-headline-md font-bold text-primary"
        >
          Rafi Picture
        </Link>

        {/* NAVIGATION LINKS */}

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {navLinks.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(
                `${item.href}/`,
              );

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`font-label-md transition-all duration-300 ${
                  isActive
                    ? "border-b-2 border-primary pb-1 text-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* DESKTOP ACTION */}

        <div className="hidden items-center md:flex">
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
              Login
            </Link>
          )}
        </div>

        {/* MOBILE BUTTON */}

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-surface-container md:hidden"
          aria-label="Buka menu navigasi"
        >
          <AppIcon
            name="more_vert"
            size={25}
          />
        </button>
      </div>
    </nav>
  );
}