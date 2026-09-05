"use client";

import { useState } from "react";

import { useOverlay } from "@/context/ui/OverlayContext";
import { useLanguage } from "@/context/LanguageContext";

const TERMS_COPY = {
  id: {
    intro: "Harap baca ketentuan layanan berikut sebelum menggunakan layanan dan melakukan pemesanan di Rafi Picture.",
    bookingTitle: "1. Booking dan Reservasi Tanggal",
    bookingBody: "Klien wajib mengisi form booking untuk melakukan reservasi atau mengamankan tanggal acara.",
    accommodationTitle: "2. Biaya Akomodasi",
    accommodationBody: "Biaya akomodasi tidak termasuk dalam harga layanan untuk lokasi di luar area Bandung Kota. Besaran biaya akomodasi akan disesuaikan dengan lokasi acara atau wedding.",
    durationTitle: "3. Durasi Layanan dan Overtime",
    durationBefore: "Durasi kerja untuk seluruh paket wedding adalah",
    durationAfter: "Apabila durasi peliputan melebihi waktu tersebut, akan dikenakan biaya tambahan sebesar",
    perHour: "Rp199.000 per jam",
    paymentTitle: "4. Down Payment dan Pelunasan",
    paymentBody: "Untuk mengamankan tanggal acara, klien wajib melakukan pembayaran down payment (DP) minimal 30%. Pelunasan dapat dilakukan sebelum acara atau setelah acara dan tidak diperkenankan untuk ditunda-tunda di kemudian hari.",
    deliveryTitle: "5. Pengiriman Album dan Frame",
    deliveryBody: "Harga layanan tidak termasuk ongkos kirim untuk output fisik seperti album maupun frame. Biaya pengiriman akan diperhitungkan secara terpisah.",
    coverageTitle: "6. Ketentuan Peliputan",
    coverageBody: "Tim Rafi Picture tidak akan melakukan peliputan acara apabila pembayaran DP belum diterima.",
    agreement: "Dengan memberikan persetujuan, Anda menyatakan telah membaca dan memahami ketentuan layanan yang tercantum di atas. Ketentuan dapat diperbarui apabila terdapat perubahan kebijakan layanan.",
    checkbox: "Saya telah membaca, memahami, dan menyetujui",
    saving: "Menyimpan Persetujuan...",
    accept: "Saya Setuju & Lanjutkan",
    error: "Persetujuan belum dapat disimpan. Silakan coba lagi.",
    close: "Tutup terms of agreement",
    effective: "Berlaku",
    termsTitle: "Ketentuan Layanan",
    termsVersion: "Versi Ketentuan",
    termsName: "Ketentuan Layanan Rafi Picture",
  },
  en: {
    intro: "Please read the following service terms before using our services and making a booking with Rafi Picture.",
    bookingTitle: "1. Booking and Date Reservation",
    bookingBody: "Clients must complete the booking form to reserve or secure an event date.",
    accommodationTitle: "2. Accommodation Costs",
    accommodationBody: "Accommodation costs are not included in the service price for locations outside Bandung City. The accommodation cost will be adjusted according to the event or wedding location.",
    durationTitle: "3. Service Duration and Overtime",
    durationBefore: "The working duration for all wedding packages is",
    durationAfter: "If coverage exceeds that duration, an additional charge of",
    perHour: "IDR 199,000 per hour",
    paymentTitle: "4. Down Payment and Final Payment",
    paymentBody: "To secure the event date, clients must make a minimum down payment (DP) of 30%. The remaining payment may be made before or after the event and must not be unnecessarily delayed.",
    deliveryTitle: "5. Album and Frame Delivery",
    deliveryBody: "The service price does not include shipping costs for physical outputs such as albums or frames. Shipping costs will be calculated separately.",
    coverageTitle: "6. Coverage Terms",
    coverageBody: "The Rafi Picture team will not cover an event if the down payment has not been received.",
    agreement: "By giving your consent, you confirm that you have read and understood the service terms above. These terms may be updated when service policies change.",
    checkbox: "I have read, understood, and agree to",
    saving: "Saving Agreement...",
    accept: "I Agree & Continue",
    error: "The agreement could not be saved. Please try again.",
    close: "Close terms of agreement",
    effective: "Effective",
    termsTitle: "Terms of Agreement",
    termsVersion: "Terms Version",
    termsName: "Terms of Agreement Rafi Picture",
  },
};

export default function TermsOfAgreementOverlay({
  onAccept,
  accepting = false,
  version = "1.0",
  effectiveDate = null,
  allowClose = true,
}) {
  const { closeOverlay } = useOverlay();
  const { language } = useLanguage();
  const copy = TERMS_COPY[language] ?? TERMS_COPY.id;

  const [agreed, setAgreed] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState("");

  const isLoading = accepting || localLoading;

  const handleClose = () => {
    if (isLoading) return;
    closeOverlay();
  };

  const handleAccept = async () => {
    if (!agreed || isLoading) return;

    setError("");
    setLocalLoading(true);

    try {
      if (onAccept) {
        await onAccept({ version });
      }

      closeOverlay();
    } catch (err) {
      console.error("TERMS ACCEPT ERROR:", err);
      setError(
        err?.message ||
          copy.error,
      );
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="terms-title"
      className="
        relative flex
        max-h-[min(88dvh,760px)]
        w-[min(94vw,640px)]
        flex-col overflow-hidden
        rounded-[28px]
        border border-outline-variant/40
        bg-surface text-on-surface
        shadow-2xl
      "
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

      <header className="shrink-0 border-b border-outline-variant/30 px-5 pb-4 pt-7 sm:px-7 sm:pb-5 sm:pt-8">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 3.75h7.5L19 8.25V20.25H7z" />
                <path d="M14.5 3.75v4.5H19" />
                <path d="M10 12h6M10 15.5h6" />
              </svg>
            </div>

            <p className="font-label-sm text-[10px] uppercase tracking-[0.24em] text-on-surface-variant">
              Rafi Picture
            </p>

            <h2
              id="terms-title"
              className="mt-1 font-headline-lg text-2xl leading-tight text-primary sm:text-[28px]"
            >
              {copy.termsTitle}
            </h2>

            <p className="mt-2 max-w-xl font-body-md text-sm leading-5 text-on-surface-variant">
                {copy.intro}
            </p>
          </div>

          {allowClose && (
            <button
              type="button"
              aria-label={copy.close}
              onClick={handleClose}
              disabled={isLoading}
              className="
                -mr-1 -mt-1 flex h-9 w-9 shrink-0
                items-center justify-center rounded-full
                text-on-surface-variant
                transition
                hover:bg-surface-container hover:text-primary
                disabled:cursor-not-allowed disabled:opacity-40
              "
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-on-surface-variant/75">
          <span>{copy.termsVersion} {version}</span>

          {effectiveDate && (
            <>
              <span aria-hidden="true">•</span>
              <span>{copy.effective} {effectiveDate}</span>
            </>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
        <div className="space-y-5">
          <section>
            <h3 className="font-label-md text-sm font-semibold text-primary">
              {copy.bookingTitle}
            </h3>

            <p className="mt-2 font-body-md text-sm leading-6 text-on-surface-variant">
              {copy.bookingBody}
            </p>
          </section>

          <section className="border-t border-outline-variant/25 pt-5">
            <h3 className="font-label-md text-sm font-semibold text-primary">
              {copy.accommodationTitle}
            </h3>

            <p className="mt-2 font-body-md text-sm leading-6 text-on-surface-variant">
              {copy.accommodationBody}
            </p>
          </section>

          <section className="border-t border-outline-variant/25 pt-5">
            <h3 className="font-label-md text-sm font-semibold text-primary">
              {copy.durationTitle}
            </h3>

            <p className="mt-2 font-body-md text-sm leading-6 text-on-surface-variant">
              {copy.durationBefore}{" "}
              <span className="font-semibold text-on-surface">
                {language === "en" ? " 8 hours" : " 8 jam"}
              </span>.
              {copy.durationAfter}{" "}
              <span className="font-semibold text-on-surface">
                {" "}
                {copy.perHour}
              </span>.
            </p>
          </section>

          <section className="border-t border-outline-variant/25 pt-5">
            <h3 className="font-label-md text-sm font-semibold text-primary">
              {copy.paymentTitle}
            </h3>

            <p className="mt-2 font-body-md text-sm leading-6 text-on-surface-variant">
              {copy.paymentBody}
            </p>
          </section>

          <section className="border-t border-outline-variant/25 pt-5">
            <h3 className="font-label-md text-sm font-semibold text-primary">
              {copy.deliveryTitle}
            </h3>

            <p className="mt-2 font-body-md text-sm leading-6 text-on-surface-variant">
              {copy.deliveryBody}
            </p>
          </section>

          <section className="border-t border-outline-variant/25 pt-5">
            <h3 className="font-label-md text-sm font-semibold text-primary">
              {copy.coverageTitle}
            </h3>

            <p className="mt-2 font-body-md text-sm leading-6 text-on-surface-variant">
              {copy.coverageBody}
            </p>
          </section>

          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container/35 px-4 py-4">
            <p className="font-body-md text-xs leading-5 text-on-surface-variant">
              {copy.agreement}
            </p>
          </div>
        </div>
      </div>

      <footer className="shrink-0 border-t border-outline-variant/30 bg-surface px-5 py-5 sm:px-7">
        {error && (
          <div className="mb-4 rounded-xl border border-error/20 bg-error/5 px-3.5 py-3">
            <p className="font-body-md text-xs leading-5 text-error">
              {error}
            </p>
          </div>
        )}

        <label
          className="
            flex cursor-pointer items-start gap-3
            rounded-xl border border-outline-variant/40
            bg-surface-container/25
            px-3.5 py-3.5
            transition
            hover:border-primary/30 hover:bg-primary/[0.03]
          "
        >
          <input
            type="checkbox"
            checked={agreed}
            disabled={isLoading}
            onChange={(event) => setAgreed(event.target.checked)}
            className="
              mt-0.5 h-4 w-4 shrink-0
              accent-primary
              disabled:cursor-not-allowed
            "
          />

          <span className="font-body-md text-xs leading-5 text-on-surface-variant sm:text-[13px]">
            {copy.checkbox}{" "}
            <span className="font-semibold text-on-surface">
              {" "}
              {copy.termsName}
            </span>
            .
          </span>
        </label>

        <button
          type="button"
          onClick={handleAccept}
          disabled={!agreed || isLoading}
          className="
            mt-4 flex h-12 w-full
            items-center justify-center rounded-xl
            bg-primary px-4
            font-label-md text-sm font-semibold
            tracking-wide text-on-primary
            transition-all duration-200
            hover:bg-tertiary
            active:scale-[0.99]
            disabled:cursor-not-allowed
            disabled:opacity-45
          "
        >
          {isLoading ? copy.saving : copy.accept}
        </button>
      </footer>
    </section>
  );
}
