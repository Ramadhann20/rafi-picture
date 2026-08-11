"use client";

import { useEffect, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { auth } from "@/lib/firebase-config";
import {
  buildPaymentTimer,
  getDurationParts,
  getEventStartDate,
  LATE_PAYMENT_CONFIG,
  normalizeStatus,
} from "@/lib/bookingCountdown";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function pad(value) {
  return String(Math.max(0, Number(value) || 0)).padStart(2, "0");
}

function toTimestamp(value) {
  if (!value) return 0;

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getLatestInvoice(invoices, type) {
  return (
    [...invoices]
      .filter(
        (invoice) =>
          invoice?.type === type &&
          !["void", "superseded"].includes(normalizeStatus(invoice?.status)),
      )
      .sort((first, second) => {
        const revisionDiff =
          (Number(second?.revision) || 1) -
          (Number(first?.revision) || 1);

        if (revisionDiff !== 0) return revisionDiff;

        return (
          toTimestamp(second?.issuedAt ?? second?.createdAt) -
          toTimestamp(first?.issuedAt ?? first?.createdAt)
        );
      })[0] ?? null
  );
}

function getPayableInvoice(invoices) {
  const finalInvoice = getLatestInvoice(invoices, "final");
  const depositInvoice = getLatestInvoice(invoices, "deposit");

  const isPayable = (invoice) =>
    Boolean(
      invoice?.id &&
        ["issued", "overdue"].includes(normalizeStatus(invoice?.status)) &&
        Number(invoice?.amountDue ?? invoice?.amount) > 0,
    );

  if (isPayable(finalInvoice)) return finalInvoice;
  if (isPayable(depositInvoice)) return depositInvoice;

  return null;
}

function formatDeadline(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function CountdownDigits({ duration, danger = false }) {
  const items = [
    ["Hari", duration.days],
    ["Jam", duration.hours],
    ["Menit", duration.minutes],
    ["Detik", duration.seconds],
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map(([label, value]) => (
        <div
          key={label}
          className={`rounded-lg border px-2 py-3 text-center ${
            danger
              ? "border-error/25 bg-error-container/25"
              : "border-outline-variant/30 bg-surface-container-lowest/70"
          }`}
        >
          <p
            className={`font-headline-md text-[22px] leading-none ${
              danger ? "text-error" : "text-on-surface"
            }`}
          >
            {pad(value)}
          </p>

          <p
            className={`mt-2 font-label-sm text-[10px] uppercase tracking-wider ${
              danger ? "text-error/80" : "text-on-surface-variant"
            }`}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

function EventTimerCard({ booking, nowMs }) {
  const eventStart = getEventStartDate(booking?.event);

  if (
    !eventStart ||
    ["cancelled", "completed"].includes(normalizeStatus(booking?.status))
  ) {
    return null;
  }

  const delta = eventStart.getTime() - nowMs;
  const arrived = delta <= 0;
  const duration = getDurationParts(Math.max(delta, 0));

  return (
    <article className="glass-panel rounded-xl border border-outline-variant/30 p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
          <AppIcon name="event" size={20} />
        </div>

        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-[0.16em] text-secondary">
            Event Countdown
          </p>
          <h3 className="mt-1 font-headline-sm text-headline-sm text-on-surface">
            {arrived ? "Hari acara telah tiba" : "Menuju hari acara"}
          </h3>
        </div>
      </div>

      <CountdownDigits duration={duration} />
    </article>
  );
}

function PaymentTimerCard({ invoice, payments, nowMs }) {
  const timer = useMemo(
    () => buildPaymentTimer({ invoice, payments, nowMs }),
    [invoice, payments, nowMs],
  );

  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setError("");
    setNotice("");
  }, [invoice?.id]);

  if (!timer) return null;

  const {
    duration,
    overdue,
    frozen,
    paymentLabel,
    deadline,
    penaltyDays,
    suggestedPenaltyAmount,
    appliedPenaltyAmount,
    additionalPenaltyAmount,
  } = timer;

  const canApplyPenalty =
    overdue &&
    !frozen &&
    penaltyDays > 0 &&
    additionalPenaltyAmount > 0;

  const handleApplyPenalty = async () => {
    if (!canApplyPenalty || applying) return;

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError("Sesi admin tidak tersedia.");
      return;
    }

    setApplying(true);
    setError("");
    setNotice("");

    try {
      const idToken = await currentUser.getIdToken(true);

      const response = await fetch("/api/admin/invoices/apply-penalty", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          bookingId: invoice?.bookingId,
          invoiceId: invoice?.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Denda gagal diterapkan.");
      }

      setNotice(
        result?.data?.email?.sent === false
          ? "Denda diterapkan dan invoice revisi dibuat, tetapi email belum terkirim."
          : "Denda diterapkan. Invoice revisi sudah dibuat dan dikirim ke client.",
      );
    } catch (caughtError) {
      console.error("APPLY PENALTY ERROR:", caughtError);
      setError(caughtError?.message || "Denda gagal diterapkan.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <article
      className={`glass-panel rounded-xl border p-5 ${
        overdue
          ? "border-error/35 bg-error-container/10"
          : "border-outline-variant/30"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              overdue
                ? "bg-error-container text-error"
                : "bg-secondary-container text-secondary"
            }`}
          >
            <AppIcon name={overdue ? "hourglass_top" : "payments"} size={20} />
          </div>

          <div>
            <p
              className={`font-label-sm text-label-sm uppercase tracking-[0.16em] ${
                overdue ? "text-error" : "text-secondary"
              }`}
            >
              {frozen ? "Timer Freeze" : overdue ? "Overdue" : "Payment Deadline"}
            </p>

            <h3
              className={`mt-1 font-headline-sm text-headline-sm ${
                overdue ? "text-error" : "text-on-surface"
              }`}
            >
              {frozen
                ? `Bukti ${paymentLabel} menunggu verifikasi`
                : overdue
                  ? `${paymentLabel} terlambat`
                  : `Tenggat ${paymentLabel}`}
            </h3>
          </div>
        </div>
      </div>

      <CountdownDigits duration={duration} danger={overdue} />

      <div className="mt-4 border-t border-outline-variant/25 pt-4">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Tenggat admin: {formatDeadline(deadline)}
        </p>

        {overdue && (
          <div className="mt-3 rounded-lg border border-error/20 bg-error-container/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-error">
                  Suggested Penalty
                </p>

                <p className="mt-1 font-headline-md text-headline-md text-error">
                  {idr.format(suggestedPenaltyAmount)}
                </p>

                <p className="mt-1 font-body-sm text-body-sm text-error/80">
                  {penaltyDays} hari penuh × {idr.format(LATE_PAYMENT_CONFIG.AMOUNT_PER_DAY)} / hari
                </p>

                {appliedPenaltyAmount > 0 && (
                  <p className="mt-1 font-body-sm text-body-sm text-error/80">
                    Sudah diterapkan: {idr.format(appliedPenaltyAmount)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleApplyPenalty}
                disabled={!canApplyPenalty || applying}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-error px-5 py-3 font-label-md text-label-md text-on-error transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <AppIcon name="receipt" size={17} />
                {applying
                  ? "Applying..."
                  : additionalPenaltyAmount > 0
                    ? appliedPenaltyAmount > 0
                      ? `Update +${idr.format(additionalPenaltyAmount)}`
                      : `Apply ${idr.format(additionalPenaltyAmount)}`
                    : "Penalty Up to Date"}
              </button>
            </div>

            {frozen && (
              <p className="mt-3 font-body-sm text-body-sm text-error/80">
                Denda tidak dapat diterapkan saat bukti pembayaran sedang menunggu verifikasi.
              </p>
            )}

            {!frozen && penaltyDays === 0 && (
              <p className="mt-3 font-body-sm text-body-sm text-error/80">
                Belum mencapai 24 jam penuh keterlambatan, jadi denda masih Rp0.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-error/25 bg-error-container px-3 py-2 font-body-sm text-body-sm text-error">
            {error}
          </p>
        )}

        {notice && (
          <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 font-body-sm text-body-sm text-primary">
            {notice}
          </p>
        )}
      </div>
    </article>
  );
}

export default function AdminBookingCountdowns({
  booking,
  invoices = [],
  payments = [],
}) {
  const [nowMs, setNowMs] = useState(null);

  useEffect(() => {
    const update = () => setNowMs(Date.now());
    update();

    const intervalId = window.setInterval(update, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const invoice = useMemo(() => getPayableInvoice(invoices), [invoices]);

  if (!booking || !nowMs) return null;

  const eventStart = getEventStartDate(booking?.event);
  const paymentTimer = buildPaymentTimer({ invoice, payments, nowMs });

  const showEvent =
    Boolean(eventStart) &&
    !["cancelled", "completed"].includes(normalizeStatus(booking?.status));

  const showPayment = Boolean(paymentTimer);

  if (!showEvent && !showPayment) return null;

  return (
    <section className="mb-stack-lg">
      <div
        className={`grid grid-cols-1 gap-4 ${
          showEvent && showPayment ? "xl:grid-cols-2" : ""
        }`}
      >
        {showEvent && <EventTimerCard booking={booking} nowMs={nowMs} />}

        {showPayment && (
          <PaymentTimerCard
            invoice={invoice}
            payments={payments}
            nowMs={nowMs}
          />
        )}
      </div>
    </section>
  );
}
