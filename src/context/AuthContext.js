"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase-config";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { db } from "@/lib/firebase-config";
import { doc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

const AuthContext = createContext(null);

function mapAuthError(code) {
  switch (code) {
    case "auth/invalid-credential":
      return "Email atau password salah, atau akun belum terdaftar.";
    case "auth/email-already-in-use":
      return "Email sudah terdaftar. Silakan login.";
    case "auth/weak-password":
      return "Password terlalu lemah. Minimal 6 karakter.";
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/missing-password":
      return "Password wajib diisi.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Coba lagi nanti.";
    case "auth/network-request-failed":
      return "Koneksi bermasalah. Cek internet kamu.";
    default:
      return "Terjadi kesalahan. Coba lagi.";
  }
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // loading: status auth sedang ditentukan (awal app)
  const [loading, setLoading] = useState(true);

  // authLoading: sedang proses login/register/logout
  const [authLoading, setAuthLoading] = useState(false);

  // profileLoading: sedang ambil Users/{uid}
  const [profileLoading, setProfileLoading] = useState(false);

  // userDoc + role dari Firestore Users/{uid}
  const [userDoc, setUserDoc] = useState(null);
  const [role, setRole] = useState(null);

  const [error, setError] = useState(null);
  const clearError = () => setError(null);

  // Optional session cookie (kalau kamu pakai /api/session)
  const createSession = async (idToken) => {
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        // ignore
      }
    } catch {
      // ignore
    }
  };

  const destroySession = async () => {
    try {
      await fetch("/api/session", { method: "DELETE" });
    } catch {
      // ignore
    }
  };

  // 1) Auth listener (realtime dari Firebase Auth)
  useEffect(() => { const unsub = onAuthStateChanged(auth, (currentUser) => {
     /* * Reset profile setiap akun berubah agar role akun lama * tidak terbawa saat login menggunakan akun lain. */
      setUserDoc(null); setRole(null); 
      /* * Jika ada user, profile dianggap sedang dimuat sejak * render pertama.
       Ini mencegah AdminAuthCheck melakukan * redirect sebelum role Firestore selesai dibaca. */ 
      setProfileLoading(Boolean(currentUser));
       setUser(currentUser); 
       setLoading(false); 
       if (!currentUser) {
         setProfileLoading(false); 
        } 
      }
    ); return () => unsub(); }, []);

  // 2) User profile listener (realtime dari Firestore Users/{uid})
  useEffect(() => {
    if (!user?.uid) return;

    setProfileLoading(true);

    const ref = doc(db, "Users", user.uid);

    // realtime update: role langsung berubah tanpa refresh
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        setUserDoc(data);
        setRole(data?.role ?? null);
        setProfileLoading(false);
      },
      (err) => {
        console.error("USER DOC SNAPSHOT ERROR:", err);
        setUserDoc(null);
        setRole(null);
        setProfileLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  const login = async (email, password) => {
    setAuthLoading(true);
    setError(null);
    try {
      const e = normalizeEmail(email);
      const cred = await signInWithEmailAndPassword(auth, e, password);
      const token = await cred.user.getIdToken();
      await createSession(token);
    } catch (err) {
      console.error("LOGIN ERROR:", err?.code, err?.message);
      setError(mapAuthError(err?.code));
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async ({ email, password, username }) => {
    setAuthLoading(true);
    setError(null);
    try {
      const e = normalizeEmail(email);

      const cred = await createUserWithEmailAndPassword(auth, e, password);
      const uid = cred.user.uid;

      await setDoc(doc(db, "Users", uid), {
        uid,
        email: e,
        username: (username || "").trim() || e.split("@")[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: "customer",
        photoURL: cred.user.photoURL || null,
      });

      const token = await cred.user.getIdToken();
      await createSession(token);
    } catch (err) {
      console.error("REGISTER ERROR:", err?.code, err?.message);
      setError(mapAuthError(err?.code));
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    setError(null);
    try {
      await signOut(auth);
      await destroySession();
    } catch (err) {
      console.error("LOGOUT ERROR:", err?.code, err?.message);
      setError("Gagal logout. Coba lagi.");
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      authLoading,
      profileLoading,
      userDoc,
      role,
      error,
      login,
      register,
      logout,
      clearError,

      isAuthenticated: Boolean(user), 

      isAdmin: Boolean(user) && role?.toLowerCase() === "admin",

      accessLoading: loading || (Boolean(user) && profileLoading),
    }),
    [user, loading, authLoading, profileLoading, userDoc, role, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() harus dipakai di dalam <AuthProvider>.");
  return ctx;
}
