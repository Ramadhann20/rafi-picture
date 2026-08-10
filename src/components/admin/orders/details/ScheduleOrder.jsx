"use client";

import { useEffect, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { auth } from "@/lib/firebase-config";

import Review from "./sections/Review";
import CrewAssignment from "./sections/CrewAssignment";
import BillingPayment from "./sections/BillingPayment";

const REQUIRED_CREW_COUNT = 3;

const BOOKING_STATUS = {
  pending: {
    label: "Pending Preparation",
    badgeClass: "bg-secondary-container text-on-secondary-container",
  },

  approved: {
    label: "Approved · Awaiting Payment",
    badgeClass: "bg-primary-container text-on-primary-container",
  },

  confirmed: {
    label: "Payment Under Review",
    badgeClass: "bg-primary text-on-primary",
  },

  in_progress: {
    label: "In Progress",
    badgeClass: "bg-surface-container-highest text-on-surface",
  },

  completed: {
    label: "Completed",
    badgeClass: "bg-secondary-container text-on-secondary-container",
  },

  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-error-container text-error",
  },
};

function getClientDisplayName(client) {
  const fullName = client?.fullName?.trim();
  const partnerName = client?.partnerName?.trim();

  if (!fullName) return "Unnamed Client";
  if (!partnerName) return fullName;

  return `${fullName} & ${partnerName}`;
}

function getInitialPreparation(booking) {
  const completed = booking?.status !== "pending";

  return {
    reviewCompleted: completed,
    crewCompleted: completed,
    billingCompleted: completed,
  };
}

function createCrewDraft(booking, existingAssignment) {
  return {
    bookingId: booking.id,

    type: existingAssignment?.type ?? "photo",

    title:
      existingAssignment?.title ??
      `${booking.package?.name ?? "Booking"}: ${getClientDisplayName(
        booking.client,
      )}`,

    bookingCode:
      existingAssignment?.bookingCode ??
      booking.bookingCode ??
      null,

    packageName:
      existingAssignment?.packageName ??
      booking.package?.name ??
      null,

    eventDate:
      existingAssignment?.eventDate ??
      existingAssignment?.date ??
      booking.event?.preferredDate ??
      null,

    startTime:
      existingAssignment?.startTime ?? booking.event?.startTime ?? null,

    endTime:
      existingAssignment?.endTime ??
      booking.event?.endTime ??
      null,

    endTimeDayOffset:
      existingAssignment?.endTimeDayOffset ??
      booking.event?.endTimeDayOffset ??
      0,

    location:
      existingAssignment?.location ??
      booking.event?.location ??
      null,

    crewIds: Array.isArray(existingAssignment?.crewIds)
      ? existingAssignment.crewIds
      : [],

    status: "draft",
  };
}

export default function ScheduleOrder({
  booking,
  crewMembers = [],
  assignments = [],
  existingAssignment = null,
  invoices = [],
  payments = [],
  onBack,
  onFinalizeBooking,
}) {
  const [hasEntered, setHasEntered] = useState(false);

  const [isLeaving, setIsLeaving] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [actionError, setActionError] = useState(null);

  /*
   * Semua preparation state berada di component ini.
   * Confirm per section tidak menyentuh Firestore.
   */
  const [preparation, setPreparation] = useState(() =>
    getInitialPreparation(booking),
  );

  const [crewDraft, setCrewDraft] = useState(() =>
    createCrewDraft(booking, existingAssignment),
  );

  const [depositDraft, setDepositDraft] = useState(null);

  const [
    depositPdfPreview,
    setDepositPdfPreview,
  ] = useState(null);

  const [
    depositPdfReviewed,
    setDepositPdfReviewed,
  ] = useState(false);

  const [
    depositPdfReviewOpen,
    setDepositPdfReviewOpen,
  ] = useState(false);

  const [
    generatingDepositPdf,
    setGeneratingDepositPdf,
  ] = useState(false);

  const [
    finalizationNotice,
    setFinalizationNotice,
  ] = useState(null);

  const isPreparationMode = booking.status === "pending";

  useEffect(() => {
    setPreparation(getInitialPreparation(booking));

    setCrewDraft(createCrewDraft(booking, existingAssignment));

    setDepositDraft(null);
    setDepositPdfPreview((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }

      return null;
    });
    setDepositPdfReviewed(false);
    setDepositPdfReviewOpen(false);
    setGeneratingDepositPdf(false);
    setFinalizationNotice(null);
    setActionError(null);
    setSubmitting(false);
  }, [booking.id, existingAssignment?.id]);

  useEffect(() => {
    return () => {
      if (depositPdfPreview?.url) {
        URL.revokeObjectURL(depositPdfPreview.url);
      }
    };
  }, [depositPdfPreview?.url]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setHasEntered(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const statusConfig = BOOKING_STATUS[booking.status] ?? BOOKING_STATUS.pending;

  const displayedCrewIds = isPreparationMode
    ? crewDraft.crewIds
    : Array.isArray(existingAssignment?.crewIds)
      ? existingAssignment.crewIds
      : [];

  const hasCrewAssignment = displayedCrewIds.length >= REQUIRED_CREW_COUNT;

  const hasDepositInvoice =
    Boolean(depositDraft) && Number(depositDraft.amount) > 0;

  const crewAssignmentEnabled =
    !isPreparationMode || preparation.reviewCompleted;

  const billingEnabled =
    !isPreparationMode ||
    (preparation.reviewCompleted && preparation.crewCompleted);

  const hasDepositPdf =
    Boolean(
      depositPdfPreview?.url,
    );

  const canFinalize =
    isPreparationMode &&
    preparation.reviewCompleted &&
    preparation.crewCompleted &&
    preparation.billingCompleted &&
    hasCrewAssignment &&
    hasDepositInvoice &&
    hasDepositPdf &&
    depositPdfReviewed;

  const handleBack = () => {
    if (isLeaving) return;

    setIsLeaving(true);

    window.setTimeout(() => {
      onBack?.();
    }, 300);
  };

  const handleToggleReview = () => {
    if (!isPreparationMode) return;

    setActionError(null);

    setPreparation((current) => {
      if (current.reviewCompleted) {
        return {
          reviewCompleted: false,
          crewCompleted: false,
          billingCompleted: false,
        };
      }

      return {
        ...current,
        reviewCompleted: true,
      };
    });
  };

  const handleCrewSelectionChange = (crewIds) => {
    if (!isPreparationMode) return;

    setCrewDraft((current) => ({
      ...current,
      crewIds,
    }));

    setPreparation((current) => ({
      ...current,
      crewCompleted: false,
      billingCompleted: false,
    }));

    setActionError(null);
  };

  const handleToggleCrew = () => {
    if (!isPreparationMode) return;
    if (!crewAssignmentEnabled) return;

    setActionError(null);

    if (!preparation.crewCompleted && !hasCrewAssignment) {
      setActionError(
        `Select ${REQUIRED_CREW_COUNT} crew members before confirming this step.`,
      );

      return;
    }

    setPreparation((current) => {
      if (current.crewCompleted) {
        return {
          ...current,
          crewCompleted: false,
          billingCompleted: false,
        };
      }

      return {
        ...current,
        crewCompleted: true,
      };
    });
  };

  const clearDepositPdfPreview = () => {
    setDepositPdfPreview((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }

      return null;
    });

    setDepositPdfReviewed(false);
    setDepositPdfReviewOpen(false);
  };

  const handleInvoiceDraftChange = (nextDraft) => {
    if (!isPreparationMode) return;

    setDepositDraft(nextDraft);
    clearDepositPdfPreview();

    setPreparation((current) => ({
      ...current,
      billingCompleted: false,
    }));

    setFinalizationNotice(null);
    setActionError(null);
  };

  const generateDepositPdfPreview = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error(
        "Sesi admin tidak tersedia.",
      );
    }

    const idToken =
      await currentUser.getIdToken(true);

    const response =
      await fetch(
        "/api/admin/invoices/deposit-preview",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            bookingId:
              booking.id,
            invoiceDraft:
              depositDraft,
          }),
        },
      );

    if (!response.ok) {
      const contentType =
        response.headers.get(
          "content-type",
        );

      if (
        contentType?.includes(
          "application/json",
        )
      ) {
        const result =
          await response.json();

        throw new Error(
          result?.message ||
            "PDF preview gagal dibuat.",
        );
      }

      throw new Error(
        "PDF preview gagal dibuat.",
      );
    }

    /*
     * Preview API sekarang mengirim JSON + base64, bukan binary body.
     * Ini sengaja untuk menghindari kasus Response binary terbaca kosong
     * pada Next.js/Turbopack dev mode.
     */
    const result =
      await response.json();

    const previewData =
      result?.data;

    const pdfBase64 =
      String(
        previewData?.pdfBase64 ||
          "",
      );

    if (!pdfBase64) {
      throw new Error(
        "Server tidak mengembalikan data PDF preview.",
      );
    }

    let binaryString;

    try {
      binaryString =
        window.atob(
          pdfBase64,
        );
    } catch {
      throw new Error(
        "Data PDF preview dari server tidak dapat dibaca.",
      );
    }

    if (
      binaryString.length <= 5
    ) {
      throw new Error(
        "PDF preview kosong.",
      );
    }

    const pdfBytes =
      new Uint8Array(
        binaryString.length,
      );

    for (
      let index = 0;
      index <
      binaryString.length;
      index += 1
    ) {
      pdfBytes[index] =
        binaryString.charCodeAt(
          index,
        );
    }

    const signature =
      String.fromCharCode(
        ...pdfBytes.slice(
          0,
          5,
        ),
      );

    if (
      signature !== "%PDF-"
    ) {
      throw new Error(
        "Data preview bukan file PDF yang valid.",
      );
    }

    const blob =
      new Blob(
        [pdfBytes],
        {
          type:
            previewData?.mimeType ||
            "application/pdf",
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const invoiceNumber =
      previewData?.invoiceNumber ||
      null;

    const fileName =
      previewData?.fileName ||
      "invoice-dp-preview.pdf";

    clearDepositPdfPreview();

    setDepositPdfPreview({
      url,
      fileName,
      invoiceNumber,
      size:
        blob.size,
      mimeType:
        blob.type,
      generatedAt:
        new Date(),
    });

    setDepositPdfReviewed(false);
    setDepositPdfReviewOpen(false);

    return {
      url,
      fileName,
      invoiceNumber,
      size:
        blob.size,
    };
  };

  const handleToggleBilling = async () => {
    if (!isPreparationMode) return;
    if (!billingEnabled) return;
    if (generatingDepositPdf) return;

    setActionError(null);
    setFinalizationNotice(null);

    /*
     * Edit Billing:
     * preview lama langsung dibuang supaya admin tidak mungkin
     * meng-approve PDF yang sudah stale.
     */
    if (preparation.billingCompleted) {
      clearDepositPdfPreview();

      setPreparation((current) => ({
        ...current,
        billingCompleted: false,
      }));

      return;
    }

    if (!hasDepositInvoice) {
      setActionError(
        "Create a valid deposit invoice draft before confirming billing.",
      );

      return;
    }

    setGeneratingDepositPdf(true);

    try {
      await generateDepositPdfPreview();

      /*
       * Billing baru dianggap confirmed SETELAH server berhasil
       * membuat PDF preview.
       */
      setPreparation((current) => ({
        ...current,
        billingCompleted: true,
      }));
    } catch (error) {
      console.error(
        "GENERATE DEPOSIT PDF PREVIEW ERROR:",
        error,
      );

      setActionError(
        error?.message ||
          "Deposit invoice PDF gagal dibuat.",
      );
    } finally {
      setGeneratingDepositPdf(false);
    }
  };

  const handleReviewDepositPdf = () => {
    if (!depositPdfPreview?.url) {
      return;
    }

    /*
     * Review sekarang dibuka inline di Billing section.
     * Ini menghindari inkonsistensi Chrome saat membuka Blob PDF
     * melalui tab baru pada mode development/Turbopack.
     */
    setDepositPdfReviewOpen(
      (current) => {
        const next =
          !current;

        if (next) {
          setDepositPdfReviewed(
            true,
          );
        }

        return next;
      },
    );
  };

  const handleFinalConfirmation = async () => {
    if (!canFinalize || submitting) {
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const result =
        await onFinalizeBooking?.({
          booking,

          crewAssignment: {
            ...crewDraft,
            crewIds: [...crewDraft.crewIds],
          },

          depositInvoice: {
            ...depositDraft,
          },

          preparation: {
            reviewCompleted: true,
            crewCompleted: true,
            billingCompleted: true,
          },

          pdfReviewed:
            depositPdfReviewed,
        });

      if (
        result?.email?.sent === false
      ) {
        setFinalizationNotice(
          "Booking berhasil di-approve dan invoice sudah tersimpan, tetapi email belum terkirim. Kamu masih bisa mengirim ulang email dari booking ini.",
        );
      } else if (result) {
        setFinalizationNotice(
          "Booking berhasil di-approve. Invoice PDF tersimpan dan email notifikasi telah dikirim ke client.",
        );
      }
    } catch (error) {
      console.error("FINAL CONFIRMATION ERROR:", error);

      setActionError(error?.message || "Final confirmation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const motionClass = isLeaving
    ? "-translate-x-12 opacity-0"
    : hasEntered
      ? "translate-x-0 opacity-100"
      : "translate-x-12 opacity-0";

  return (
    <section className={`transition-all duration-300 ease-out ${motionClass}`}>
      <button
        type="button"
        onClick={handleBack}
        className="mb-stack-md inline-flex items-center gap-2 rounded-lg px-3 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
      >
        <AppIcon name="arrow_back" size={20} />
        Back to Bookings
      </button>

      <header className="mb-stack-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-secondary">
              {isPreparationMode ? "Booking Preparation" : "Booking Detail"}
            </p>

            <h1 className="font-display-lg text-display-lg text-primary">
              {getClientDisplayName(booking.client)}
            </h1>

            <p className="mt-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              {booking.bookingCode ?? booking.id}
            </p>

            <p className="mt-3 max-w-2xl font-body-md text-body-md text-on-surface-variant">
              {isPreparationMode
                ? "Review the booking, confirm the production crew, then prepare billing. Firestore is updated only after Final Confirmation."
                : "View the booking snapshot, assigned crew, invoices, and payment activity."}
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 font-label-sm text-label-sm ${statusConfig.badgeClass}`}
          >
            {statusConfig.label}
          </span>
        </div>
      </header>

      {isPreparationMode && <PreparationProgress preparation={preparation} />}

      {actionError && (
        <div
          role="alert"
          className="mb-stack-md rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 font-body-md text-body-md text-error"
        >
          {actionError}
        </div>
      )}

      {finalizationNotice && (
        <div
          role="status"
          className="mb-stack-md rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 font-body-md text-body-md text-primary"
        >
          {finalizationNotice}
        </div>
      )}

      <div className="space-y-stack-lg">
        <div>
          <Review booking={booking} statusConfig={statusConfig} />

          {isPreparationMode && (
            <StepConfirmation
              confirmed={preparation.reviewCompleted}
              confirmLabel="Confirm Review"
              editLabel="Edit Review"
              description={
                preparation.reviewCompleted
                  ? "Review confirmed locally. Crew assignment is now unlocked."
                  : "Confirm that all booking information has been reviewed."
              }
              onClick={handleToggleReview}
            />
          )}
        </div>

        <SectionDivider />

        <StepContainer
          locked={isPreparationMode && !crewAssignmentEnabled}
          lockedTitle="Crew assignment is locked"
          lockedDescription="Confirm the booking review to unlock crew assignment."
        >
          <CrewAssignment
            crewMembers={crewMembers}
            assignments={assignments}
            eventDate={booking.event?.preferredDate}
            eventStartTime={booking.event?.startTime ?? null}
            eventEndTime={booking.event?.endTime ?? null}
            currentBookingId={booking.id}
            currentAssignmentId={existingAssignment?.id ?? null}
            selectedCrewIds={displayedCrewIds}
            enabled={crewAssignmentEnabled}
            readOnly={!isPreparationMode || preparation.crewCompleted}
            showOnlySelected={!isPreparationMode}
            requiredCrewCount={REQUIRED_CREW_COUNT}
            onSelectedCrewIdsChange={handleCrewSelectionChange}
          />

          {isPreparationMode && crewAssignmentEnabled && (
            <StepConfirmation
              confirmed={preparation.crewCompleted}
              confirmLabel="Confirm Crew"
              editLabel="Edit Crew"
              description={
                preparation.crewCompleted
                  ? "Crew confirmed locally. Billing preparation is now unlocked."
                  : hasCrewAssignment
                    ? "Confirm the selected production team."
                    : `Select ${REQUIRED_CREW_COUNT} crew members before confirming this step.`
              }
              disabled={!preparation.crewCompleted && !hasCrewAssignment}
              onClick={handleToggleCrew}
            />
          )}
        </StepContainer>

        <SectionDivider />

        <StepContainer
          locked={isPreparationMode && !billingEnabled}
          lockedTitle="Billing preparation is locked"
          lockedDescription="Confirm the crew assignment to unlock billing preparation."
        >
          <BillingPayment
            booking={booking}
            invoices={invoices}
            payments={payments}
            preparationMode={isPreparationMode}
            invoiceDraft={depositDraft}
            readOnly={isPreparationMode && preparation.billingCompleted}
            pdfPreview={depositPdfPreview}
            pdfReviewed={depositPdfReviewed}
            pdfReviewOpen={depositPdfReviewOpen}
            pdfGenerating={generatingDepositPdf}
            onReviewPdfPreview={handleReviewDepositPdf}
            onInvoiceDraftChange={handleInvoiceDraftChange}
          />

          {isPreparationMode && billingEnabled && (
            <StepConfirmation
              confirmed={preparation.billingCompleted}
              confirmLabel="Confirm Billing & Generate PDF"
              editLabel="Edit Billing"
              loading={generatingDepositPdf}
              loadingLabel="Generating PDF..."
              description={
                preparation.billingCompleted
                  ? depositPdfReviewed
                    ? "Billing confirmed and the generated DP invoice has been reviewed."
                    : "Billing confirmed. Review the generated PDF below before Finalize & Approve."
                  : hasDepositInvoice
                    ? "Confirm billing to generate the DP invoice PDF preview."
                    : "Create the deposit invoice draft before confirming billing."
              }
              disabled={
                generatingDepositPdf ||
                (!preparation.billingCompleted &&
                  !hasDepositInvoice)
              }
              onClick={handleToggleBilling}
            />
          )}
        </StepContainer>

        {isPreparationMode && (
          <SubmitBookingPanel
            preparation={preparation}
            hasCrewAssignment={hasCrewAssignment}
            hasDepositInvoice={hasDepositInvoice}
            hasDepositPdf={hasDepositPdf}
            pdfReviewed={depositPdfReviewed}
            canSubmit={canFinalize}
            submitting={submitting}
            onSubmit={handleFinalConfirmation}
          />
        )}
      </div>
    </section>
  );
}

function PreparationProgress({ preparation }) {
  const steps = [
    {
      id: "review",
      label: "Review",
      completed: preparation.reviewCompleted,
    },
    {
      id: "crew",
      label: "Crew",
      completed: preparation.crewCompleted,
    },
    {
      id: "billing",
      label: "Billing",
      completed: preparation.billingCompleted,
    },
  ];

  const completedCount = steps.filter((step) => step.completed).length;

  const progress = (completedCount / steps.length) * 100;

  return (
    <section className="glass-panel mb-stack-lg rounded-xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
            Preparation Progress
          </p>

          <p className="mt-1 font-headline-md text-headline-md text-primary">
            {completedCount} of {steps.length} steps completed
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {steps.map((step) => (
            <span
              key={step.id}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label-sm text-label-sm ${
                step.completed
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {step.completed && <AppIcon name="check" size={14} />}

              {step.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </section>
  );
}

function StepContainer({ locked, lockedTitle, lockedDescription, children }) {
  return (
    <div className="relative">
      {locked && (
        <div className="mb-stack-md rounded-xl border border-outline-variant bg-surface-container-low px-6 py-5">
          <div className="flex items-start gap-3">
            <AppIcon
              name="lock"
              size={22}
              className="mt-0.5 shrink-0 text-on-surface-variant"
            />

            <div>
              <p className="font-label-md text-label-md text-on-surface">
                {lockedTitle}
              </p>

              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                {lockedDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={locked ? "pointer-events-none select-none opacity-45" : ""}
      >
        {children}
      </div>
    </div>
  );
}

function StepConfirmation({
  confirmed,
  confirmLabel,
  editLabel,
  description,
  disabled = false,
  loading = false,
  loadingLabel = "Processing...",
  onClick,
}) {
  return (
    <div
      className={`mt-stack-md flex flex-col gap-4 rounded-xl border px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${
        confirmed
          ? "border-primary/20 bg-primary/5"
          : "border-outline-variant bg-surface-container-low"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            confirmed
              ? "bg-primary text-on-primary"
              : "bg-surface-container-highest text-on-surface-variant"
          }`}
        >
          <AppIcon name={confirmed ? "check" : "lock"} size={18} />
        </div>

        <div>
          <p className="font-label-md text-label-md text-on-surface">
            {confirmed ? "Step confirmed" : "Confirmation required"}
          </p>

          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={onClick}
        className={`shrink-0 rounded-lg px-6 py-3 font-label-md text-label-md transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
          confirmed
            ? "border border-outline-variant text-primary hover:bg-surface-container-low"
            : "bg-primary text-on-primary hover:opacity-90"
        }`}
      >
        {loading
          ? loadingLabel
          : confirmed
            ? editLabel
            : confirmLabel}
      </button>
    </div>
  );
}

function SubmitBookingPanel({
  preparation,
  hasCrewAssignment,
  hasDepositInvoice,
  hasDepositPdf,
  pdfReviewed,
  canSubmit,
  submitting,
  onSubmit,
}) {
  const requirements = [
    {
      id: "review",
      label: "Booking review confirmed",
      completed: preparation.reviewCompleted,
    },
    {
      id: "crew",
      label: "Crew assignment confirmed",
      completed: preparation.crewCompleted && hasCrewAssignment,
    },
    {
      id: "billing",
      label: "Deposit invoice draft confirmed",
      completed: preparation.billingCompleted && hasDepositInvoice,
    },
    {
      id: "pdf",
      label: "Deposit invoice PDF generated",
      completed: hasDepositPdf,
    },
    {
      id: "pdf-review",
      label: "Deposit invoice PDF reviewed",
      completed: pdfReviewed,
    },
  ];

  return (
    <section className="glass-panel rounded-xl p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            Final Step
          </p>

          <h2 className="mt-2 font-headline-md text-headline-md text-primary">
            Final Confirmation
          </h2>

          <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            This is the only action that persists the preparation result. It
            uploads the reviewed DP invoice PDF to Cloudinary, publishes the
            crew assignment, issues the invoice, changes the booking status to
            approved, and sends the approval email with the PDF attached.
          </p>

          <div className="mt-5 space-y-2">
            {requirements.map((requirement) => (
              <div key={requirement.id} className="flex items-center gap-2">
                <AppIcon
                  name={requirement.completed ? "check" : "close"}
                  size={17}
                  className={
                    requirement.completed ? "text-primary" : "text-error"
                  }
                />

                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {requirement.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={onSubmit}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 font-label-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Finalizing..." : "Finalize & Approve"}

          {!submitting && <AppIcon name="arrow_forward" size={18} />}
        </button>
      </div>
    </section>
  );
}

function SectionDivider() {
  return <div className="h-px w-full bg-outline-variant/40" />;
}
