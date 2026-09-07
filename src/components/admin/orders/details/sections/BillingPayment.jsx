"use client";

import { useRouter } from "next/navigation";

import AppIcon from "@/components/global/AppIcon";
import { useLanguage } from "@/context/LanguageContext";

const PAYMENTS_ROUTE = "/admin/payments";

const INVOICE_STATUS = {
  draft: {
    labelKey: "draft",
    badgeClass:
      "bg-surface-container-high text-on-surface-variant",
  },

  issued: {
    labelKey: "issued",
    badgeClass:
      "bg-primary-container text-on-primary-container",
  },

  paid: {
    labelKey: "paid",
    badgeClass:
      "bg-primary text-on-primary",
  },

  overdue: {
    labelKey: "overdue",
    badgeClass:
      "bg-error-container text-error",
  },

  void: {
    labelKey: "voidStatus",
    badgeClass:
      "bg-error-container text-error",
  },
};

const PAYMENT_STATUS = {
  unpaid: {
    labelKey: "unpaid",
    badgeClass:
      "bg-surface-container-high text-on-surface-variant",
  },

  pending: {
    labelKey: "pendingVerification",
    badgeClass:
      "bg-secondary-container text-on-secondary-container",
  },

  pending_verification: {
    labelKey: "pendingVerification",
    badgeClass:
      "bg-secondary-container text-on-secondary-container",
  },

  paid: {
    labelKey: "paid",
    badgeClass:
      "bg-primary text-on-primary",
  },

  verified: {
    labelKey: "paid",
    badgeClass:
      "bg-primary text-on-primary",
  },

  rejected: {
    labelKey: "rejected",
    badgeClass:
      "bg-error-container text-error",
  },

  refunded: {
    labelKey: "refunded",
    badgeClass:
      "bg-surface-container-highest text-on-surface",
  },
};

function toDate(value) {
  if (!value) return null;

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    const [year, month, day] =
      value.split("-").map(Number);

    return new Date(
      year,
      month - 1,
      day,
    );
  }

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toDate(value);

  if (!date) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  const date = toDate(value);

  if (!date) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(value, currency = "IDR") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatFileSize(value) {
  const bytes = Number(value) || 0;

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isBundlePackageItem(packageItem) {
  const packageName = String(
    packageItem?.name ?? packageItem?.packageName ?? packageItem?.title ?? "",
  ).toLowerCase();
  const normalizedPackageName = packageName
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return Boolean(
    packageItem?.packageCategoryId === "bundle" ||
      (
        normalizedPackageName.includes("prewedding") &&
        normalizedPackageName.includes("wedding") &&
        (
          normalizedPackageName.includes("bundle") ||
          normalizedPackageName.includes("plus") ||
          normalizedPackageName.includes("+")
        )
      ),
  );
}

function getBillingPackageItems(booking) {
  const packageItems = Array.isArray(booking?.packages) && booking.packages.length
    ? booking.packages
    : booking?.package
      ? [booking.package]
      : [];

  const bundlePackage = packageItems.find((packageItem) => isBundlePackageItem(packageItem));

  if (bundlePackage) {
    return [bundlePackage];
  }

  return Array.from(
    new Map(
      packageItems.map((packageItem, index) => [
        String(packageItem?.id ?? index),
        packageItem,
      ]),
    ).values(),
  );
}

function getBookingAmounts(booking) {
  const packageItems = getBillingPackageItems(booking);
  const eventItems = Array.isArray(booking?.events) && booking.events.length
    ? booking.events
    : booking?.event
      ? [booking.event]
      : [];
  const packageAmount = packageItems.reduce(
    (total, packageItem) => total + Math.max(Number(packageItem?.price) || 0, 0),
    0,
  );
  const travelCharge = eventItems.reduce(
    (total, eventItem) =>
      total + Math.max(
        Number(eventItem?.location?.accommodationRequest) ||
          Number(eventItem?.location?.distanceCharge?.amount) ||
          0,
        0,
      ),
    0,
  );

  return {
    packageAmount,
    travelCharge,
    bookingTotal:
      packageAmount + travelCharge,
  };
}

function createInvoiceItems(booking) {
  const {
    packageAmount,
    travelCharge,
  } = getBookingAmounts(booking);

  const packageItems = getBillingPackageItems(booking);
  const eventItems = Array.isArray(booking?.events) && booking.events.length
    ? booking.events
    : booking?.event
      ? [booking.event]
      : [];
  const items = packageItems.map((packageItem, index) => ({
    id: `package-service-${packageItem.id ?? index}`,
    label: packageItem.name ?? "Package Service",
    amount: Math.max(Number(packageItem.price) || 0, 0),
  }));

  eventItems.forEach((eventItem, index) => {
    const amount = Math.max(
      Number(eventItem?.location?.accommodationRequest) ||
        Number(eventItem?.location?.distanceCharge?.amount) ||
        0,
      0,
    );
    if (amount > 0) {
      items.push({
        id: `travel-charge-${index}`,
        label: `Travel Charge ${index + 1}`,
        amount,
      });
    }
  });

  return items;
}

function createDepositDraft(booking) {
  const {
    packageAmount,
    travelCharge,
    bookingTotal,
  } = getBookingAmounts(booking);

  return {
    id:
      `local_${booking.id}_deposit`,
    bookingId: booking.id,
    clientId:
      booking.client?.uid ?? null,

    type: "deposit",
    revision: 1,
    invoiceNumber: null,

    /*
     * packageTotal tetap diisi bookingTotal untuk compatibility
     * dengan client payment page yang lama.
     * Field eksplisit di bawah adalah source of truth baru.
     */
    packageTotal: bookingTotal,
    packageAmount,
    travelCharge,
    bookingTotal,

    items:
      createInvoiceItems(booking),

    amount:
      Math.round(bookingTotal * 0.3),

    currency:
      booking.package?.currency ??
      "IDR",

    dueAt:
      getDefaultDueDate(),

    status: "draft",
    note:
      "30% booking deposit",
    pdfUrl: null,
    issuedAt: null,
    isLocalDraft: true,
  };
}

function getInvoiceLabel(type) {
  if (type === "deposit") {
    return "Deposit Invoice";
  }

  if (type === "final") {
    return "Final Invoice";
  }

  return "Invoice";
}

export default function BillingPayment({
  booking,
  invoices = [],
  payments = [],

  preparationMode = false,
  invoiceDraft = null,
  readOnly = false,

  pdfPreview = null,
  pdfReviewed = false,
  pdfReviewOpen = false,
  pdfGenerating = false,

  onReviewPdfPreview,
  onInvoiceDraftChange,
}) {
  const { translate } = useLanguage();
  const router = useRouter();

  const currency =
    booking?.package?.currency ??
    "IDR";

  const {
    packageAmount,
    travelCharge,
    bookingTotal,
  } = getBookingAmounts(booking);

  if (preparationMode) {
    return (
      <BillingPreparation
        booking={booking}
        currency={currency}
        packageAmount={packageAmount}
        travelCharge={travelCharge}
        bookingTotal={bookingTotal}
        invoiceDraft={invoiceDraft}
        readOnly={readOnly}
        pdfPreview={pdfPreview}
        pdfReviewed={pdfReviewed}
        pdfReviewOpen={pdfReviewOpen}
        pdfGenerating={pdfGenerating}
        onReviewPdfPreview={onReviewPdfPreview}
        onInvoiceDraftChange={
          onInvoiceDraftChange
        }
      />
    );
  }

  const activeInvoices =
    invoices.filter(
      (invoice) =>
        invoice.status !== "void",
    );

  const totalInvoiced =
    activeInvoices.reduce(
      (total, invoice) =>
        total +
        (Number(invoice.amount) || 0),
      0,
    );

  const totalPaid =
    payments
      .filter((payment) =>
        [
          "paid",
          "verified",
        ].includes(
          String(
            payment.status ?? "",
          ).toLowerCase(),
        ),
      )
      .reduce(
        (total, payment) =>
          total +
          (Number(payment.amount) || 0),
        0,
      );

  const remainingBalance =
    Math.max(
      0,
      bookingTotal -
        totalPaid,
    );

  const handleOpenPayment =
    (payment) => {
      if (!payment?.id) return;

      router.push(
        `${PAYMENTS_ROUTE}?paymentId=${encodeURIComponent(
          payment.id,
        )}`,
      );
    };

  return (
    <section aria-labelledby="billing-payment-title">
      <SectionHeader
        title={translate("billingPayment")}
        description={translate("billingPaymentDescription")}
      />

      <div className="mb-gutter grid grid-cols-1 gap-stack-sm sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label={translate("package")}
          value={formatCurrency(
            packageAmount,
            currency,
          )}
        />

        <SummaryCard
          label={translate("travelCharge")}
          value={formatCurrency(
            travelCharge,
            currency,
          )}
        />

        <SummaryCard
          label={translate("bookingTotal")}
          value={formatCurrency(
            bookingTotal,
            currency,
          )}
          accent
        />

        <SummaryCard
          label="Total Paid"
          value={formatCurrency(
            totalPaid,
            currency,
          )}
        />

        <SummaryCard
          label="Remaining"
          value={formatCurrency(
            remainingBalance,
            currency,
          )}
        />
      </div>

      <p className="-mt-2 mb-gutter font-label-sm text-label-sm text-on-surface-variant/70">
        Total invoiced:{" "}
        {formatCurrency(
          totalInvoiced,
          currency,
        )}
      </p>

      <div className="grid grid-cols-1 gap-gutter xl:grid-cols-2">
        {invoices.length > 0 ? (
          invoices.map((invoice) => (
            <InvoiceReadOnlyCard
              key={invoice.id}
              invoice={invoice}
              currency={
                invoice.currency ??
                currency
              }
            />
          ))
        ) : (
          <EmptyCard
            icon="receipt"
            title={translate("noInvoices")}
            description={translate("noInvoiceDescription")}
          />
        )}
      </div>

      <div className="glass-panel mt-gutter rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
            <AppIcon
              name="payments"
              size={20}
              className="text-primary"
            />
          </div>

          <div>
            <h3 className="font-headline-md text-headline-md text-primary">
              {translate("paymentActivity")}
            </h3>

            <p className="font-body-md text-body-md text-on-surface-variant">
              {translate("paymentActivityDescription")}
            </p>
          </div>
        </div>

        <div className="my-6 h-px bg-outline-variant/30" />

        {payments.length > 0 ? (
          <div className="divide-y divide-outline-variant/30">
            {payments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                invoices={invoices}
                defaultCurrency={
                  currency
                }
                onOpenPayment={
                  handleOpenPayment
                }
              />
            ))}
          </div>
        ) : (
          <div className="py-stack-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high">
              <AppIcon
                name="payments"
                size={26}
                className="text-on-surface-variant"
              />
            </div>

            <p className="mt-4 font-label-md text-label-md text-on-surface">
              {translate("noPaymentActivity")}
            </p>

            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              {translate("noPaymentActivityDescription")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function BillingPreparation({
  booking,
  currency,
  packageAmount,
  travelCharge,
  bookingTotal,
  invoiceDraft,
  readOnly,
  pdfPreview,
  pdfReviewed,
  pdfReviewOpen,
  pdfGenerating,
  onReviewPdfPreview,
  onInvoiceDraftChange,
}) {
  const { translate } = useLanguage();
  const suggestedDeposit =
    Math.round(bookingTotal * 0.3);

  const updateDraft =
    (changes) => {
      if (
        readOnly ||
        !invoiceDraft
      ) {
        return;
      }

      onInvoiceDraftChange?.({
        ...invoiceDraft,
        ...changes,

        // Keep the latest booking snapshot attached to the draft.
        packageTotal:
          bookingTotal,
        packageAmount,
        travelCharge,
        bookingTotal,
        items:
          createInvoiceItems(
            booking,
          ),
      });
    };

  const handleCreateDraft =
    () => {
      if (readOnly) return;

      onInvoiceDraftChange?.(
        createDepositDraft(
          booking,
        ),
      );
    };

  const handleRemoveDraft =
    () => {
      if (readOnly) return;

      onInvoiceDraftChange?.(
        null,
      );
    };

  const billingStatusMessage = readOnly
    ? pdfPreview
      ? translate("billingConfirmedReviewPdf")
      : translate("billingBeingPrepared")
    : translate("localChangesInvalidatePdf");

  return (
    <section aria-labelledby="billing-payment-title">
      <SectionHeader
        title={translate("billingPreparation")}
        description={translate("billingPreparationDescription")}
      />

      <div className="mb-gutter grid grid-cols-1 gap-stack-sm sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={translate("package")}
          value={formatCurrency(
            packageAmount,
            currency,
          )}
        />

        <SummaryCard
          label={translate("travelCharge")}
          value={formatCurrency(
            travelCharge,
            currency,
          )}
        />

        <SummaryCard
          label={translate("bookingTotal")}
          value={formatCurrency(
            bookingTotal,
            currency,
          )}
          accent
        />

        <SummaryCard
          label={translate("suggestedDeposit")}
          value={formatCurrency(
            suggestedDeposit,
            currency,
          )}
        />
      </div>

      {!invoiceDraft ? (
        <article className="glass-panel flex min-h-80 flex-col items-center justify-center rounded-xl p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/5">
            <AppIcon
              name="receipt"
              size={27}
              className="text-primary"
            />
          </div>

          <h3 className="mt-5 font-headline-md text-headline-md text-primary">
            {translate("noDepositInvoiceDraft")}
          </h3>

          <p className="mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
            {translate("createDepositDraftDescription")}
          </p>

          <button
            type="button"
            disabled={readOnly}
            onClick={
              handleCreateDraft
            }
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <AppIcon
              name="add"
              size={19}
            />
            {translate("createDepositDraft")}
          </button>
        </article>
      ) : (
        <article className="glass-panel rounded-xl p-6">
          <div className="flex flex-col gap-4 border-b border-outline-variant/30 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                {translate("localDraft")}
              </p>

              <h3 className="mt-2 font-headline-md text-headline-md text-primary">
                {translate("depositInvoice")}
              </h3>

              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                {translate("depositDraftDescription")}
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-surface-container-high px-3 py-1.5 font-label-sm text-label-sm text-on-surface-variant">
              {translate("draft")}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="deposit-amount"
                className="font-label-sm text-label-sm text-on-surface-variant"
              >
                {translate("depositAmount")}
              </label>

              <input
                id="deposit-amount"
                type="number"
                min="0"
                max={bookingTotal}
                value={
                  invoiceDraft.amount ??
                  ""
                }
                disabled={readOnly}
                onChange={(event) =>
                  updateDraft({
                    amount:
                      Number(
                        event.target.value,
                      ) || 0,
                  })
                }
                className="mt-2 w-full rounded-lg border border-outline-variant bg-transparent px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                {formatCurrency(
                  invoiceDraft.amount,
                  invoiceDraft.currency ??
                    currency,
                )}
              </p>
            </div>

            <div>
              <label
                htmlFor="deposit-due-date"
                className="font-label-sm text-label-sm text-on-surface-variant"
              >
                {translate("dueDate")}
              </label>

              <input
                id="deposit-due-date"
                type="date"
                value={
                  invoiceDraft.dueAt ??
                  ""
                }
                disabled={readOnly}
                onChange={(event) =>
                  updateDraft({
                    dueAt:
                      event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-outline-variant bg-transparent px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="deposit-note"
                className="font-label-sm text-label-sm text-on-surface-variant"
              >
                {translate("invoiceNote")}
              </label>

              <textarea
                id="deposit-note"
                rows={3}
                value={
                  invoiceDraft.note ??
                  ""
                }
                disabled={readOnly}
                onChange={(event) =>
                  updateDraft({
                    note:
                      event.target.value,
                  })
                }
                className="mt-2 w-full resize-none rounded-lg border border-outline-variant bg-transparent px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-outline-variant/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {billingStatusMessage}
            </p>

            {!readOnly && (
              <button
                type="button"
                onClick={
                  handleRemoveDraft
                }
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-error/30 px-4 py-2.5 font-label-sm text-label-sm text-error transition-colors hover:bg-error-container/40"
              >
                <AppIcon
                  name="delete"
                  size={17}
                />
                {translate("removeDraft")}
              </button>
            )}
          </div>
        </article>
      )}

      {(pdfGenerating || pdfPreview) && (
        <article className="mt-gutter overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                <AppIcon
                  name="receipt"
                  size={24}
                />
              </div>

              <div className="min-w-0">
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                  {translate("generatedDocument")}
                </p>

                <h3 className="mt-1 font-headline-md text-headline-md text-primary">
                  {translate("depositInvoicePreview")}
                </h3>

                {pdfGenerating ? (
                  <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                    {translate("generatingPdfFromDraft")}
                  </p>
                ) : (
                  <>
                    <p className="mt-1 break-all font-label-md text-label-md text-on-surface">
                      {pdfPreview?.invoiceNumber ?? translate("depositInvoice")}
                    </p>

                    <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                      {pdfPreview?.fileName ?? "invoice-dp-preview.pdf"}
                      {pdfPreview?.size
                        ? ` · ${formatFileSize(pdfPreview.size)}`
                        : ""}
                    </p>
                  </>
                )}
              </div>
            </div>

            {!pdfGenerating && pdfPreview?.url && (
              <button
                type="button"
                onClick={onReviewPdfPreview}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <AppIcon
                  name="visibility"
                  size={18}
                />
                {pdfReviewOpen
                  ? translate("hidePreview")
                  : pdfReviewed
                    ? translate("reviewAgain")
                    : translate("reviewPdf")}
              </button>
            )}
          </div>

          {!pdfGenerating &&
            pdfPreview?.url &&
            pdfReviewOpen && (
              <div className="border-t border-outline-variant/30 bg-surface-container-lowest p-4 md:p-6">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                      {translate("pdfReview")}
                    </p>

                    <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                      {translate("reviewPdfDescription")}
                    </p>
                  </div>

                  <a
                    href={pdfPreview.url}
                    download={pdfPreview.fileName || "invoice-dp-preview.pdf"}
                    className="inline-flex items-center gap-2 font-label-sm text-label-sm text-secondary transition-colors hover:text-primary"
                  >
                    <AppIcon
                      name="download"
                      size={17}
                    />
                    {translate("downloadPdf")}
                  </a>
                </div>

                <div className="overflow-hidden rounded-lg border border-outline-variant/40 bg-surface-container-lowest">
                  <object
                    data={pdfPreview.url}
                    type="application/pdf"
                    className="h-[70vh] min-h-[620px] w-full"
                    aria-label={translate("depositInvoicePdfPreview")}
                  >
                    <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                      <AppIcon
                        name="receipt"
                        size={28}
                        className="text-primary"
                      />

                      <p className="mt-4 font-label-md text-label-md text-on-surface">
                        {translate("browserPdfUnavailable")}
                      </p>

                      <p className="mt-1 max-w-md font-body-sm text-body-sm text-on-surface-variant">
                        {translate("downloadPdfToOpen")}
                      </p>
                    </div>
                  </object>
                </div>
              </div>
            )}

          {!pdfGenerating && pdfPreview?.url && (
            <div className="border-t border-outline-variant/30 bg-surface-container-low px-6 py-4">
              <div className="flex items-center gap-2">
                <AppIcon
                  name={pdfReviewed ? "check" : "info_outline"}
                  size={17}
                  className={
                    pdfReviewed
                      ? "text-primary"
                      : "text-on-surface-variant"
                  }
                />

                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {pdfReviewed
                    ? translate("pdfReviewComplete")
                    : translate("openPdfBeforeApproval")}
                </p>
              </div>
            </div>
          )}
        </article>
      )}
    </section>
  );
}

function SectionHeader({
  title,
  description,
}) {
  const { translate } = useLanguage();

  return (
    <div className="mb-stack-md">
      <p className="font-label-md text-label-md uppercase tracking-widest text-secondary">
        {translate("stepBilling")}
      </p>

      <h2
        id="billing-payment-title"
        className="mt-2 font-headline-lg text-headline-lg text-on-surface"
      >
        {title}
      </h2>

      <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent = false,
}) {
  return (
    <article className="glass-panel rounded-xl p-6">
      <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>

      <p
        className={`mt-2 font-headline-md text-headline-md ${
          accent
            ? "text-secondary"
            : "text-primary"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function InvoiceReadOnlyCard({
  invoice,
  currency,
}) {
  const { translate } = useLanguage();
  const statusConfig =
    INVOICE_STATUS[
      invoice.status
    ] ?? INVOICE_STATUS.draft;

  return (
    <article className="glass-panel rounded-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            {invoice.type === "deposit"
              ? "Deposit"
              : invoice.type === "final"
                ? "Final Payment"
                : "Invoice"}
          </p>

          <h3 className="mt-2 font-headline-md text-headline-md text-primary">
            {getInvoiceLabel(
              invoice.type,
            )}
          </h3>

          <p className="mt-1 break-all font-label-sm text-label-sm text-on-surface-variant">
            {invoice.invoiceNumber ??
              invoice.id}
          </p>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1.5 font-label-sm text-label-sm ${statusConfig.badgeClass}`}
        >
          {translate(statusConfig.labelKey)}
        </span>
      </div>

      <div className="my-6 h-px bg-outline-variant/30" />

      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <InfoItem
          label="Amount"
          value={formatCurrency(
            invoice.amount,
            currency,
          )}
        />

        <InfoItem
          label={translate("bookingTotal")}
          value={formatCurrency(
            invoice.bookingTotal ??
              invoice.packageTotal,
            currency,
          )}
        />

        <InfoItem
          label="Due Date"
          value={formatDate(
            invoice.dueAt,
          )}
        />

        <InfoItem
          label="Issued At"
          value={formatDateTime(
            invoice.issuedAt,
          )}
        />

        <InfoItem
          label="Revision"
          value={`v${
            Number(
              invoice.revision,
            ) || 1
          }`}
        />

        <InfoItem
          label="Note"
          value={invoice.note}
          fullWidth
        />
      </dl>

      {invoice.pdfUrl && (
        <a
          href={invoice.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 font-label-sm text-label-sm text-primary transition-colors hover:bg-surface-container-low"
        >
          <AppIcon
            name="download"
            size={17}
          />
          Open Invoice
        </a>
      )}
    </article>
  );
}

function PaymentRow({
  payment,
  invoices,
  defaultCurrency,
  onOpenPayment,
}) {
  const { translate } = useLanguage();
  const normalizedStatus =
    String(
      payment.status ??
        "unpaid",
    ).toLowerCase();

  const statusConfig =
    PAYMENT_STATUS[
      normalizedStatus
    ] ??
    PAYMENT_STATUS.unpaid;

  const relatedInvoice =
    invoices.find(
      (invoice) =>
        invoice.id ===
        payment.invoiceId,
    ) ?? null;

  return (
    <button
      type="button"
      onClick={() =>
        onOpenPayment?.(
          payment,
        )
      }
      className="group flex w-full flex-col gap-4 py-5 text-left transition-colors first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high transition-colors group-hover:bg-secondary-container">
          <AppIcon
            name={
              [
                "paid",
                "verified",
              ].includes(
                normalizedStatus,
              )
                ? "verified"
                : "payments"
            }
            size={19}
            className="text-primary"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-label-md text-label-md text-on-surface">
              {relatedInvoice?.invoiceNumber ??
                payment.referenceNumber ??
                "Payment submission"}
            </p>

            <span
              className={`rounded-full px-2.5 py-1 font-label-sm text-label-sm ${statusConfig.badgeClass}`}
            >
              {translate(statusConfig.labelKey)}
            </span>
          </div>

          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            {formatCurrency(
              payment.amount,
              payment.currency ??
                defaultCurrency,
            )}
            {" • "}
            {payment.proofFileName ??
              payment.referenceNumber ??
              "Payment proof uploaded"}
          </p>

          <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
            {translate("submitted")} {" "}
            {formatDateTime(
              payment.submittedAt ??
                payment.createdAt,
            )}
          </p>
        </div>
      </div>

      <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 font-label-sm text-label-sm text-primary transition-colors group-hover:bg-surface-container-low">
        {translate("reviewPayment")}

        <AppIcon
          name="arrow_forward"
          size={17}
        />
      </span>
    </button>
  );
}

function InfoItem({
  label,
  value,
  fullWidth = false,
}) {
  return (
    <div
      className={
        fullWidth
          ? "sm:col-span-2"
          : ""
      }
    >
      <dt className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </dt>

      <dd className="mt-1 break-words font-body-md text-body-md text-on-surface">
        {value || "-"}
      </dd>
    </div>
  );
}

function EmptyCard({
  icon,
  title,
  description,
}) {
  return (
    <article className="glass-panel flex min-h-64 flex-col items-center justify-center rounded-xl p-8 text-center xl:col-span-2">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high">
        <AppIcon
          name={icon}
          size={26}
          className="text-on-surface-variant"
        />
      </div>

      <p className="mt-4 font-label-md text-label-md text-on-surface">
        {title}
      </p>

      <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
        {description}
      </p>
    </article>
  );
}
