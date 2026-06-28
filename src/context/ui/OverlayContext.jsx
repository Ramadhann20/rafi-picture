"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const OverlayContext = createContext(null);

export function OverlayProvider({ children }) {
  const [overlay, setOverlay] = useState(null);

  const isOpen = Boolean(overlay);

  const openOverlay = ({
    content,
    closeOnBackdrop = true,
    className = "",
  }) => {
    setOverlay({
      content,
      closeOnBackdrop,
      className,
    });
  };

  const closeOverlay = () => {
    setOverlay(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeOverlay();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const value = useMemo(
    () => ({
      isOpen,
      openOverlay,
      closeOverlay,
    }),
    [isOpen]
  );

  return (
    <OverlayContext.Provider value={value}>
      {children}

      {isOpen && (
        <div
          className={`fixed inset-0 z-100 flex items-center justify-center p-margin-mobile ${overlay.className}`}
        >
          <button
            type="button"
            aria-label="Close overlay"
            onClick={overlay.closeOnBackdrop ? closeOverlay : undefined}
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
          />

          <div
            className="relative z-10"
            onClick={(event) => event.stopPropagation()}
          >
            {overlay.content}
          </div>
        </div>
      )}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const context = useContext(OverlayContext);

  if (!context) {
    throw new Error("useOverlay must be used inside OverlayProvider.");
  }

  return context;
}