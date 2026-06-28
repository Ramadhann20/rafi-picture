"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import SkeletonLoader from "@/components/global/SkeletonLoader";
import MaterialIcon from "./MaterialIcon";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { label: "Portofolio", href: "/portfolio" },
  { label: "Paket", href: "/packages" },
  { label: "Tentang", href: "/about" },
  { label: "Pemesanan", href: "/booking" },
];

export default function Navbar() {
  const { user, loading, logout, profileLoading, userDoc, error } = useAuth();

  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // =========================
  // ERROR STATE (OPTIONAL UI)
  // =========================
  if (error) {
    return (
      <nav className="bg-red-100 text-red-700 p-4 text-sm">
        Terjadi kesalahan saat memuat data user
      </nav>
    );
  }

  return (
    <nav
      className={`bg-surface/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/20 transition-shadow ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <div className="relative flex items-center justify-between w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        {/* BRAND */}
        <Link
          href="/"
          className="font-headline-md text-headline-md font-bold text-primary"
        >
          Rafi Picture
        </Link>

        {/* NAV LINKS */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`font-label-md transition-all duration-300 ${
                  isActive
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* ACTION AREA */}
        <div className="hidden md:flex items-center">

            {/* LOADING STATE */}
            {profileLoading ? (
              <SkeletonLoader className="w-[120px] h-[40px] rounded-lg" />
            ) : loading ? (
              <SkeletonLoader className="w-[120px] h-[40px] rounded-lg" />
            ) : user ? (
              // LOGGED IN STATE
              <button
              onClick={logout}
              className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-lg">

                <span className="font-label-md ml-2">{userDoc?.username}</span>
                
                <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden shrink-0">
                  <img
                    src="https://i.pravatar.cc/100"
                    className="w-full h-full object-cover"
                    alt="profile"
                  />
                </div>

                
              </button>
            ) : (
              // GUEST STATE
              <Link
                href="/authentication"
                className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all"
              >
                Login
              </Link>
            )}
            
        </div>

        {/* MOBILE BUTTON */}
        <button
          className="md:hidden text-primary"
          aria-label="Open navigation menu"
        >
          <MaterialIcon>menu</MaterialIcon>
        </button>
      </div>
    </nav>
  );
}