"use client";

import Link from "next/link";

import TermsOfAgreementOverlay from "@/components/ui/TermsOfAgreementOverlay";
import { useOverlay } from "@/context/ui/OverlayContext";
import { CURRENT_TERMS_VERSION } from "@/lib/terms";
import {
  openInstagram,
  openWhatsAppAdmin,
} from "@/lib/mediasocial";

const linkClassName =
  "font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-primary";

export default function Footer() {
  const { openOverlay } = useOverlay();

  const handleOpenTerms = () => {
    openOverlay({
      closeOnBackdrop: true,
      closeOnEscape: true,
      className: "px-3 sm:px-6",
      content: (
        <TermsOfAgreementOverlay
          version={CURRENT_TERMS_VERSION}
          allowClose
        />
      ),
    });
  };

  const handleWhatsApp = () => {
    openWhatsAppAdmin(
      "Halo Rafi Picture, saya ingin bertanya mengenai layanan Rafi Picture.",
    );
  };

  return (
    <footer className="mt-stack-lg w-full border-t border-outline-variant/20 bg-surface-container-highest">
      <div className="mx-auto grid max-w-container-max grid-cols-1 gap-10 px-margin-mobile py-stack-lg sm:grid-cols-2 md:px-margin-desktop lg:grid-cols-4 lg:gap-gutter">
        {/* BRAND */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link
            href="/"
            className="inline-block font-headline-md text-headline-md text-primary transition-opacity hover:opacity-75"
          >
            Rafi Picture
          </Link>

          <p className="mt-4 max-w-sm font-body-md text-body-md leading-relaxed text-on-surface-variant">
            Dokumentasi fotografi untuk wedding, prewedding,
            engagement, dan berbagai momen spesial dengan hasil
            yang natural, estetik, dan berkarakter.
          </p>
        </div>

        {/* NAVIGATION */}
        <nav aria-label="Navigasi footer">
          <h4 className="mb-4 font-label-md text-label-md uppercase tracking-wider text-primary">
            Navigasi
          </h4>

          <ul className="space-y-3">
            <li>
              <Link className={linkClassName} href="/">
                Beranda
              </Link>
            </li>

            <li>
              <Link className={linkClassName} href="/portfolio">
                Portofolio
              </Link>
            </li>

            <li>
              <Link className={linkClassName} href="/packages">
                Paket
              </Link>
            </li>

            <li>
              <Link className={linkClassName} href="/booking">
                Booking
              </Link>
            </li>
          </ul>
        </nav>

        {/* CONTACT */}
        <div>
          <h4 className="mb-4 font-label-md text-label-md uppercase tracking-wider text-primary">
            Terhubung
          </h4>

          <ul className="space-y-3">
            <li>
              <button
                type="button"
                onClick={handleWhatsApp}
                className={`${linkClassName} text-left`}
              >
                Hubungi Kami
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={openInstagram}
                className={`${linkClassName} text-left`}
              >
                Instagram
              </button>
            </li>
          </ul>
        </div>

        {/* INFORMATION */}
        <div>
          <h4 className="mb-4 font-label-md text-label-md uppercase tracking-wider text-primary">
            Informasi
          </h4>

          <button
            type="button"
            onClick={handleOpenTerms}
            className={`${linkClassName} text-left`}
          >
            Syarat & Ketentuan
          </button>

          <p className="mt-4 max-w-[260px] font-body-sm text-body-sm leading-relaxed text-on-surface-variant/70">
            Ketentuan booking, pembayaran, durasi layanan, dan
            kebijakan layanan Rafi Picture.
          </p>
        </div>
      </div>

      <div className="border-t border-outline-variant/10 px-margin-mobile py-7 md:px-margin-desktop">
        <div className="mx-auto flex max-w-container-max flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            © 2026 Rafi Picture Studio. Hak cipta dilindungi.
          </p>

          <p className="font-label-sm text-label-sm text-on-surface-variant/70">
            Bandung, Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
