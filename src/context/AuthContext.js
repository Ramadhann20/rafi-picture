"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { auth, db } from "@/lib/firebase-config";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

function mapAuthError(code) {
  switch (code) {
    case "auth/invalid-credential":
      return "Email atau password salah, atau akun belum terdaftar.";
    case "auth/email-already-in-use":
      return "Email sudah terdaftar. Silakan login.";
    case "auth/weak-password":
      return "Password terlalu lemah.";
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/missing-password":
      return "Password wajib diisi.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Coba lagi nanti.";
    case "auth/network-request-failed":
      return "Koneksi bermasalah. Cek internet kamu.";
    case "auth/popup-closed-by-user":
      return "Login Google dibatalkan.";
    case "auth/popup-blocked":
      return "Popup Google diblokir oleh browser.";
    case "auth/cancelled-popup-request":
      return "Proses login Google sebelumnya dibatalkan.";
    case "auth/unauthorized-domain":
      return "Domain aplikasi belum diizinkan di Firebase Authentication.";
    case "auth/account-exists-with-different-credential":
      return "Email ini sudah terdaftar dengan metode login lain. Silakan login menggunakan metode sebelumnya.";
    case "auth/invalid-custom-token":
    case "auth/custom-token-mismatch":
      return "Token registrasi tidak valid. Silakan ulangi verifikasi email.";
    default:
      return "Terjadi kesalahan. Coba lagi.";
  }
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [userDoc, setUserDoc] = useState(null);
  const [role, setRole] = useState(null);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUserDoc(null);
      setRole(null);
      setProfileLoading(Boolean(currentUser));
      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        setProfileLoading(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;

    setProfileLoading(true);

    const ref = doc(db, "Users", user.uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists()
          ? { id: snap.id, ...snap.data() }
          : null;

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
      const normalizedEmail = normalizeEmail(email);

      const cred = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      return cred.user;
    } catch (err) {
      console.error("LOGIN ERROR:", err?.code, err?.message);
      setError(mapAuthError(err?.code));
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const completeOtpRegistration = async (customToken) => {
    setAuthLoading(true);
    setError(null);

    try {
      const cred = await signInWithCustomToken(auth, customToken);
      return cred.user;
    } catch (err) {
      console.error(
        "OTP REGISTRATION SIGN-IN ERROR:",
        err?.code,
        err?.message
      );
      setError(mapAuthError(err?.code));
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const continueWithGoogle = async () => {
    setAuthLoading(true);
    setError(null);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const googleUser = cred.user;

      const userRef = doc(db, "Users", googleUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const normalizedEmail = normalizeEmail(googleUser.email);

        await setDoc(userRef, {
          uid: googleUser.uid,
          email: normalizedEmail,
          username:
            googleUser.displayName?.trim() ||
            normalizedEmail.split("@")[0] ||
            "User",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          role: "customer",
          photoURL: googleUser.photoURL || null,
          authProvider: "google",

          // Google user baru juga belum menyetujui Terms of Service.
          TermsAgreed: false,
        });
      }

      return googleUser;
    } catch (err) {
      console.error("GOOGLE AUTH ERROR:", err?.code, err?.message);
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
      completeOtpRegistration,
      continueWithGoogle,
      logout,
      clearError,

      isAuthenticated: Boolean(user),

      isAdmin:
        Boolean(user) && role?.toLowerCase() === "admin",

      accessLoading:
        loading || (Boolean(user) && profileLoading),
    }),
    [
      user,
      loading,
      authLoading,
      profileLoading,
      userDoc,
      role,
      error,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth() harus dipakai di dalam <AuthProvider>."
    );
  }

  return ctx;
}
