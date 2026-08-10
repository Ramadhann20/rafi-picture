"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/context/AuthContext";
import { useOverlay } from "@/context/ui/OverlayContext";
import TermsOfAgreementOverlay from "@/components/ui/TermsOfAgreementOverlay";

import { CURRENT_TERMS_VERSION } from "@/lib/terms";
import {
  clearTermsSession,
  hasAcceptedTermsThisSession,
  markTermsAcceptedThisSession,
} from "@/lib/termsSession";

export default function TermsSessionGate() {
  const {
    user,
    role,
    accessLoading,
  } = useAuth();

  const {
    isOpen,
    openOverlay,
  } = useOverlay();

  const openedForUserRef = useRef(null);
  const previousUidRef = useRef(null);

  /*
   * Kalau user logout, hapus acknowledgement session
   * milik user sebelumnya.
   *
   * Hasil:
   * login -> popup terms
   * agree -> refresh tidak muncul lagi
   * logout -> session terms dihapus
   * login lagi -> popup muncul lagi
   */
  useEffect(() => {
    const currentUid = user?.uid || null;
    const previousUid = previousUidRef.current;

    if (!currentUid && previousUid) {
      clearTermsSession(previousUid);
      openedForUserRef.current = null;
    }

    previousUidRef.current = currentUid;
  }, [user?.uid]);

  useEffect(() => {
    if (accessLoading) return;
    if (!user?.uid) return;

    // Admin tidak perlu menerima Terms popup.
    if (role?.toLowerCase() === "admin") {
      return;
    }

    if (hasAcceptedTermsThisSession(user.uid)) {
      return;
    }

    // Jangan menimpa overlay lain yang sedang terbuka.
    if (isOpen) {
      return;
    }

    // Mencegah duplicate open pada React Strict Mode.
    if (openedForUserRef.current === user.uid) {
      return;
    }

    openedForUserRef.current = user.uid;

    openOverlay({
      closeOnBackdrop: false,
      closeOnEscape: false,
      className: "px-3 sm:px-6",
      content: (
        <TermsOfAgreementOverlay
          version={CURRENT_TERMS_VERSION}
          allowClose={false}
          onAccept={async () => {
            markTermsAcceptedThisSession(user.uid);
          }}
        />
      ),
    });
  }, [
    accessLoading,
    user?.uid,
    role,
    isOpen,
    openOverlay,
  ]);

  return null;
}
