"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export default function AdminAuthCheck({
  children,
}) {
  const router = useRouter();

  const {
    user,
    role,
    isAdmin,
    accessLoading,
  } = useAuth();

  useEffect(() => {
    if (accessLoading) {
      return;
    }

    // Belum login.
    if (!user) {
      router.replace("/admin/login");
      return;
    }

    // Sudah login, tetapi role bukan admin.
    if (!isAdmin) {
      router.replace("/");
    }
  }, [
    user,
    role,
    isAdmin,
    accessLoading,
    router,
  ]);

  if (accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="glass-panel rounded-xl px-6 py-5">
          <p className="font-label-md text-label-md text-on-surface-variant">
            Verifying administrator access...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Jangan render dashboard selama redirect berlangsung.
   * Ini mencegah isi admin berkedip sesaat.
   */
  if (!user || !isAdmin) {
    return null;
  }

  return children;
}

