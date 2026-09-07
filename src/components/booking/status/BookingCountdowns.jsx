"use client";

import { useEffect, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useLanguage } from "@/context/LanguageContext";
import {
  buildPaymentTimer,
  getDurationParts,
  getEventStartDate,
  normalizeStatus,
  SECOND,
} from "@/lib/bookingCountdown";

function pad(value) {
  return String(Math.max(0, Number(value) || 0)).padStart(2, "0");
}

function formatEventDateTime(value, language = "id") {
  if (!value) return "-";

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function formatDeadline(value, language = "id") {
  if (!value) return "-";

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function formatCurrency(value, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.max(Number(value) || 0, 0));
}

function CountdownDigits({ duration, danger = false }) {
  const { translate } = useLanguage();
  const items = [
    { key: "days", value: duration.days, label: translate("days") },
    { key: "hours", value: duration.hours, label: translate("hours") },
    { key: "minutes", value: duration.minutes, label: translate("minutes") },
    { key: "seconds", value: duration.seconds, label: translate("seconds") },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {items.map((item) => (
        <div
          key={item.key}
          className={`rounded-lg border px-2 py-3 text-center sm:px-3 ${
            danger
              ? "border-error/25 bg-error-container/25"
              : "border-outline-variant/30 bg-surface-container-lowest/70"
          }`}
        >
          <p
            className={`font-headline-md text-[22px] leading-none sm:text-[26px] ${
              danger ? "text-error" : "text-on-surface"
            }`}
          >
            {pad(item.value)}
          </p>

          <p
            className={`mt-2 font-label-sm text-[10px] uppercase tracking-wider sm:text-label-sm ${
              danger ? "text-error/80" : "text-on-surface-variant"
            }`}
          >
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function EventCountdownCard({ booking, packageName, sessionName, packageIndex, nowMs }) {
  const { translate, language } = useLanguage();
  const normalizedBookingStatus = normalizeStatus(booking?.status);

  if (["cancelled", "completed"].includes(normalizedBookingStatus)) {
    return null;
  }

  const eventStart = getEventStartDate(booking?.event);

  if (!eventStart || !nowMs) {
    return null;
  }

  const difference = eventStart.getTime() - nowMs;
  const hasArrived = difference <= 0;
  const duration = getDurationParts(Math.max(difference, 0));

  return (
    <article className="glass-panel rounded-xl border border-outline-variant/30 p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
            <AppIcon name="event" size={21} />
          </div>

          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-[0.16em] text-secondary">
              {translate("towardEventDay")}
            </p>

            <h2 className="mt-1 font-headline-sm text-headline-sm text-on-surface">
              {sessionName
                ? `${translate("towardEventDay")} ${sessionName} ${packageIndex != null ? packageIndex + 1 : ""}`
                : packageName
                  ? `${packageName} ${packageIndex != null ? `(${packageIndex + 1})` : ""}`
                : hasArrived
                  ? translate("eventDayArrived")
                  : translate("eventCountdown")}
            </h2>
          </div>
        </div>

        {!hasArrived && (
          <span className="hidden rounded-full bg-primary/5 px-3 py-1 font-label-sm text-label-sm text-primary sm:inline-flex">
            {translate("live")}
          </span>
        )}
      </div>

      <CountdownDigits duration={duration} />

      <div className="mt-4 flex items-start gap-2 border-t border-outline-variant/25 pt-4">
        <AppIcon
          name="schedule"
          size={17}
          className="mt-0.5 shrink-0 text-secondary"
        />

        <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          {hasArrived
            ? translate("eventStartReached")
            : `${translate("eventStarts")} ${formatEventDateTime(eventStart, language)}.`}
        </p>
      </div>
    </article>
  );
}

function PaymentCountdownCard({ invoice, payments, nowMs }) {
  const { translate, language } = useLanguage();
  const timer = useMemo(
    () => buildPaymentTimer({ invoice, payments, nowMs }),
    [invoice, payments, nowMs],
  );

  if (!timer) {
    return null;
  }

  const {
    duration,
    overdue,
    frozen,
    paymentLabel,
    rejectedCount,
    deadline,
    penaltyDays,
    suggestedPenaltyAmount,
    appliedPenaltyAmount,
  } = timer;

  const currency = invoice?.currency ?? "IDR";

  const title = frozen
    ? `${paymentLabel} ${translate("awaitingVerification")}`
    : overdue
      ? `${paymentLabel} ${translate("overdue")}`
      : `${translate("paymentDeadline")} ${paymentLabel}`;

  const description = frozen
    ? overdue
      ? translate("frozenOverdueDescription")
      : translate("frozenDescription")
    : overdue
      ? translate("overdueDescription")
      : translate("paymentDeadlineDescription");

  return (
    <article
      className={`glass-panel rounded-xl border p-5 sm:p-6 ${
        overdue
          ? "border-error/35 bg-error-container/10"
          : "border-outline-variant/30"
      }`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              overdue
                ? "bg-error-container text-error"
                : "bg-secondary-container text-secondary"
            }`}
          >
            <AppIcon
              name={overdue ? "hourglass_top" : "payments"}
              size={21}
            />
          </div>

          <div>
            <p
              className={`font-label-sm text-label-sm uppercase tracking-[0.16em] ${
                overdue ? "text-error" : "text-secondary"
              }`}
            >
              {frozen
                ? translate("timerFrozen")
                : overdue
                  ? translate("overdue")
                  : translate("paymentDeadline")}
            </p>

            <h2
              className={`mt-1 font-headline-sm text-headline-sm ${
                overdue ? "text-error" : "text-on-surface"
              }`}
            >
              {title}
            </h2>
          </div>
        </div>

        {rejectedCount > 0 && !frozen && (
          <span className="hidden rounded-full bg-error-container px-3 py-1 font-label-sm text-label-sm text-error sm:inline-flex">
            {translate("previousProofRejected")}
          </span>
        )}
      </div>

      <CountdownDigits duration={duration} danger={overdue} />

      <div
        className={`mt-4 space-y-2 border-t pt-4 ${
          overdue ? "border-error/20" : "border-outline-variant/25"
        }`}
      >
        <div className="flex items-start gap-2">
          <AppIcon
            name="schedule"
            size={17}
            className={`mt-0.5 shrink-0 ${overdue ? "text-error" : "text-secondary"}`}
          />

          <p
            className={`font-body-sm text-body-sm leading-relaxed ${
              overdue ? "text-error" : "text-on-surface-variant"
            }`}
          >
            {description}
          </p>
        </div>

        <p
          className={`pl-6 font-label-sm text-label-sm ${
            overdue ? "text-error/80" : "text-on-surface-variant"
          }`}
        >
          {translate("adminDeadline")}: {formatDeadline(deadline, language)}
        </p>

        {rejectedCount > 0 && !frozen && (
          <p className="pl-6 font-label-sm text-label-sm text-error/80">
            Timer sudah melanjutkan perhitungan dari posisi saat bukti terakhir
            dikirim. Waktu verifikasi admin yang berakhir dengan penolakan tidak
            dibebankan ke client.
          </p>
        )}

        {overdue && penaltyDays > 0 && (
          <div className="ml-6 rounded-lg border border-error/20 bg-error-container/20 px-3 py-2">
            <p className="font-label-sm text-label-sm text-error">
              Estimasi denda saat ini: {formatCurrency(suggestedPenaltyAmount, currency)}
              {` (${penaltyDays} hari penuh)`}
            </p>
            <p className="mt-1 font-body-sm text-body-sm text-error/80">
              Nominal baru menjadi tagihan resmi setelah admin menerapkan denda dan mengirim invoice revisi.
            </p>
          </div>
        )}

        {appliedPenaltyAmount > 0 && (
          <div
            className={`ml-6 rounded-lg border px-3 py-2 ${
              overdue
                ? "border-error/20 bg-error-container/20"
                : "border-outline-variant/30 bg-surface-container-low"
            }`}
          >
            <p
              className={`font-label-sm text-label-sm ${
                overdue ? "text-error" : "text-on-surface-variant"
              }`}
            >
              Denda yang telah diterapkan admin: {formatCurrency(appliedPenaltyAmount, currency)}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

export default function BookingCountdowns({
  booking,
  invoice = null,
  payments = [],
}) {
  const [nowMs, setNowMs] = useState(null);

  useEffect(() => {
    const updateNow = () => setNowMs(Date.now());
    updateNow();

    const intervalId = window.setInterval(updateNow, SECOND);
    return () => window.clearInterval(intervalId);
  }, []);

  if (!booking || !nowMs) {
    return null;
  }

  const packageEntries = Array.isArray(booking?.packages) && booking.packages.length
    ? booking.packages.flatMap((packageItem, index) => {
        const events = booking.events?.filter(
          (eventItem) => eventItem.packageId === packageItem.id,
        ) ?? [];

        return (events.length ? events : index === 0 ? [booking.event] : [])
          .filter(Boolean)
          .map((event) => ({ packageItem, event }));
      })
    : [{ packageItem: booking?.package ?? null, event: booking?.event }];
  const eventCountdowns = packageEntries.filter(({ event }) => Boolean(event));
  const paymentTimer = buildPaymentTimer({ invoice, payments, nowMs });
  const normalizedBookingStatus = normalizeStatus(booking?.status);

  const showEvent =
    eventCountdowns.some(({ event }) => Boolean(getEventStartDate(event))) &&
    !["cancelled", "completed"].includes(normalizedBookingStatus);

  const showPayment = Boolean(paymentTimer);

  if (!showEvent && !showPayment) {
    return null;
  }

  return (
    <section className="mb-8">
      <div
        className={`grid grid-cols-1 gap-4 ${
          showEvent && showPayment ? "lg:grid-cols-2" : ""
        }`}
      >
        {showEvent && eventCountdowns.map(({ packageItem, event }, index) => (
          <EventCountdownCard
            key={`${packageItem?.id ?? "event"}-${index}`}
            booking={{ ...booking, event }}
            packageName={packageItem?.name}
            sessionName={event?.sessionName}
            packageIndex={packageItem ? index : null}
            nowMs={nowMs}
          />
        ))}

        {showPayment && (
          <PaymentCountdownCard
            invoice={invoice}
            payments={payments}
            nowMs={nowMs}
          />
        )}
      </div>
    </section>
  );
}
