"use client";

import { useRouter } from "next/navigation";

import AppIcon from "@/components/global/AppIcon";

const PAYMENTS_ROUTE = "/admin/payments";

const INVOICE_STATUS = {
  draft: {
    label: "Draft",
    badgeClass: "bg-surface-container-high text-on-surface-variant",
  },

  issued: {
    label: "Issued",
    badgeClass: "bg-primary-container text-on-primary-container",
  },

  paid: {
    label: "Paid",
    badgeClass: "bg-primary text-on-primary",
  },

  overdue: {
    label: "Overdue",
    badgeClass: "bg-error-container text-error",
  },

  void: {
    label: "Void",
    badgeClass: "bg-error-container text-error",
  },
};

const PAYMENT_STATUS = {
  unpaid: {
    label: "Unpaid",
    badgeClass: "bg-surface-container-high text-on-surface-variant",
  },

  pending: {
    label: "Pending Verification",
    badgeClass: "bg-secondary-container text-on-secondary-container",
  },

  pending_verification: {
    label: "Pending Verification",
    badgeClass: "bg-secondary-container text-on-secondary-container",
  },

  paid: {
    label: "Paid",
    badgeClass: "bg-primary text-on-primary",
  },

  verified: {
    label: "Paid",
    badgeClass: "bg-primary text-on-primary",
  },

  rejected: {
    label: "Rejected",
    badgeClass: "bg-error-container text-error",
  },

  refunded: {
    label: "Refunded",
    badgeClass: "bg-surface-container-highest text-on-surface",
  },
};

function toDate(value) {
  if (!value) return null;

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  if (!value) return "-";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  }

  const date = toDate(value);

  if (!date) return String(value);

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

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createDepositDraft(booking) {
  const packageTotal = Number(booking?.package?.price) || 0;

  return {
    id: `local_${booking.id}_deposit`,
    bookingId: booking.id,
    clientId: booking.client?.uid ?? null,
    type: "deposit",
    revision: 1,
    invoiceNumber: null,
    packageTotal,
    amount: packageTotal * 0.3,
    currency: booking.package?.currency ?? "IDR",
    dueAt: getDefaultDueDate(),
    status: "draft",
    note: "30% booking deposit",
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

  onInvoiceDraftChange,
}) {
  const router = useRouter();

  const currency = booking?.package?.currency ?? "IDR";

  const packageTotal = Number(booking?.package?.price) || 0;

  if (preparationMode) {
    return (
      <BillingPreparation
        booking={booking}
        currency={currency}
        packageTotal={packageTotal}
        invoiceDraft={invoiceDraft}
        readOnly={readOnly}
        onInvoiceDraftChange={onInvoiceDraftChange}
      />
    );
  }

  const activeInvoices = invoices.filter(
    (invoice) => invoice.status !== "void",
  );

  const totalInvoiced = activeInvoices.reduce(
    (total, invoice) => total + (Number(invoice.amount) || 0),
    0,
  );

  const totalPaid = payments
    .filter((payment) => ["paid", "verified"].includes(payment.status))
    .reduce((total, payment) => total + (Number(payment.amount) || 0), 0);

  const remainingBalance = Math.max(0, packageTotal - totalPaid);

  const handleOpenPayment = (payment) => {
    if (!payment?.id) return;

    router.push(
      `${PAYMENTS_ROUTE}?paymentId=${encodeURIComponent(payment.id)}`,
    );
  };

  return (
    <section aria-labelledby="billing-payment-title">
      <SectionHeader
        title="Billing & Payment"
        description="View invoices and client payment activity for this booking."
      />

      <div className="mb-gutter grid grid-cols-1 gap-stack-sm sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Package Total"
          value={formatCurrency(packageTotal, currency)}
        />

        <SummaryCard
          label="Total Invoiced"
          value={formatCurrency(totalInvoiced, currency)}
        />

        <SummaryCard
          label="Total Paid"
          value={formatCurrency(totalPaid, currency)}
        />

        <SummaryCard
          label="Remaining Balance"
          value={formatCurrency(remainingBalance, currency)}
        />
      </div>

      <div className="grid grid-cols-1 gap-gutter xl:grid-cols-2">
        {invoices.length > 0 ? (
          invoices.map((invoice) => (
            <InvoiceReadOnlyCard
              key={invoice.id}
              invoice={invoice}
              currency={invoice.currency ?? currency}
            />
          ))
        ) : (
          <EmptyCard
            icon="receipt"
            title="No invoices"
            description="No invoice has been saved for this booking."
          />
        )}
      </div>

      <div className="glass-panel mt-gutter rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
            <AppIcon name="payments" size={20} className="text-primary" />
          </div>

          <div>
            <h3 className="font-headline-md text-headline-md text-primary">
              Payment Activity
            </h3>

            <p className="font-body-md text-body-md text-on-surface-variant">
              Client payment submissions for this booking.
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
                defaultCurrency={currency}
                onOpenPayment={handleOpenPayment}
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
              No payment activity
            </p>

            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              Client payment submissions will appear here.
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
  packageTotal,
  invoiceDraft,
  readOnly,
  onInvoiceDraftChange,
}) {
  const suggestedDeposit = packageTotal * 0.3;

  const updateDraft = (changes) => {
    if (readOnly || !invoiceDraft) return;

    onInvoiceDraftChange?.({
      ...invoiceDraft,
      ...changes,
    });
  };

  const handleCreateDraft = () => {
    if (readOnly) return;

    onInvoiceDraftChange?.(createDepositDraft(booking));
  };

  const handleRemoveDraft = () => {
    if (readOnly) return;

    onInvoiceDraftChange?.(null);
  };

  return (
    <section aria-labelledby="billing-payment-title">
      <SectionHeader
        title="Billing Preparation"
        description="Prepare the deposit invoice locally. It will only be saved and issued after Final Confirmation."
      />

      <div className="mb-gutter grid grid-cols-1 gap-stack-sm sm:grid-cols-3">
        <SummaryCard
          label="Package Total"
          value={formatCurrency(packageTotal, currency)}
        />

        <SummaryCard
          label="Suggested Deposit"
          value={formatCurrency(suggestedDeposit, currency)}
        />

        <SummaryCard label="Deposit Rate" value="30%" />
      </div>

      {!invoiceDraft ? (
        <article className="glass-panel flex min-h-80 flex-col items-center justify-center rounded-xl p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/5">
            <AppIcon name="receipt" size={27} className="text-primary" />
          </div>

          <h3 className="mt-5 font-headline-md text-headline-md text-primary">
            No deposit invoice draft
          </h3>

          <p className="mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
            Create a local draft to confirm the billing step. This action does
            not write anything to Firestore.
          </p>

          <button
            type="button"
            disabled={readOnly}
            onClick={handleCreateDraft}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <AppIcon name="add" size={19} />
            Create Deposit Draft
          </button>
        </article>
      ) : (
        <article className="glass-panel rounded-xl p-6">
          <div className="flex flex-col gap-4 border-b border-outline-variant/30 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                Local Draft
              </p>

              <h3 className="mt-2 font-headline-md text-headline-md text-primary">
                Deposit Invoice
              </h3>

              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                This draft has not been saved to the database.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-surface-container-high px-3 py-1.5 font-label-sm text-label-sm text-on-surface-variant">
              Draft
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="deposit-amount"
                className="font-label-sm text-label-sm text-on-surface-variant"
              >
                Deposit Amount
              </label>

              <input
                id="deposit-amount"
                type="number"
                min="0"
                value={invoiceDraft.amount ?? ""}
                disabled={readOnly}
                onChange={(event) =>
                  updateDraft({
                    amount: Number(event.target.value) || 0,
                  })
                }
                className="mt-2 w-full rounded-lg border border-outline-variant bg-transparent px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                {formatCurrency(
                  invoiceDraft.amount,
                  invoiceDraft.currency ?? currency,
                )}
              </p>
            </div>

            <div>
              <label
                htmlFor="deposit-due-date"
                className="font-label-sm text-label-sm text-on-surface-variant"
              >
                Due Date
              </label>

              <input
                id="deposit-due-date"
                type="date"
                value={invoiceDraft.dueAt ?? ""}
                disabled={readOnly}
                onChange={(event) =>
                  updateDraft({
                    dueAt: event.target.value,
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
                Invoice Note
              </label>

              <textarea
                id="deposit-note"
                rows={3}
                value={invoiceDraft.note ?? ""}
                disabled={readOnly}
                onChange={(event) =>
                  updateDraft({
                    note: event.target.value,
                  })
                }
                className="mt-2 w-full resize-none rounded-lg border border-outline-variant bg-transparent px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-outline-variant/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {readOnly
                ? "Billing draft confirmed locally."
                : "Changes remain local until Final Confirmation."}
            </p>

            {!readOnly && (
              <button
                type="button"
                onClick={handleRemoveDraft}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-error/30 px-4 py-2.5 font-label-sm text-label-sm text-error transition-colors hover:bg-error-container/40"
              >
                <AppIcon name="delete" size={17} />
                Remove Draft
              </button>
            )}
          </div>
        </article>
      )}
    </section>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-stack-md">
      <p className="font-label-md text-label-md uppercase tracking-widest text-secondary">
        Step 03
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

function SummaryCard({ label, value }) {
  return (
    <article className="glass-panel rounded-xl p-6">
      <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>

      <p className="mt-2 font-headline-md text-headline-md text-primary">
        {value}
      </p>
    </article>
  );
}

function InvoiceReadOnlyCard({ invoice, currency }) {
  const statusConfig = INVOICE_STATUS[invoice.status] ?? INVOICE_STATUS.draft;

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
            {getInvoiceLabel(invoice.type)}
          </h3>

          <p className="mt-1 break-all font-label-sm text-label-sm text-on-surface-variant">
            {invoice.invoiceNumber ?? invoice.id}
          </p>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1.5 font-label-sm text-label-sm ${statusConfig.badgeClass}`}
        >
          {statusConfig.label}
        </span>
      </div>

      <div className="my-6 h-px bg-outline-variant/30" />

      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <InfoItem
          label="Amount"
          value={formatCurrency(invoice.amount, currency)}
        />

        <InfoItem label="Due Date" value={formatDate(invoice.dueAt)} />

        <InfoItem label="Issued At" value={formatDateTime(invoice.issuedAt)} />

        <InfoItem
          label="Revision"
          value={`v${Number(invoice.revision) || 1}`}
        />

        <InfoItem label="Note" value={invoice.note} fullWidth />
      </dl>

      {invoice.pdfUrl && (
        <a
          href={invoice.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 font-label-sm text-label-sm text-primary transition-colors hover:bg-surface-container-low"
        >
          <AppIcon name="download" size={17} />
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
  const statusConfig =
    PAYMENT_STATUS[payment.status] ??
    PAYMENT_STATUS.unpaid;

  const relatedInvoice =
    invoices.find(
      (invoice) =>
        invoice.id === payment.invoiceId,
    ) ?? null;

  return (
    <button
      type="button"
      onClick={() =>
        onOpenPayment?.(payment)
      }
      className="group flex w-full flex-col gap-4 py-5 text-left transition-colors first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high transition-colors group-hover:bg-secondary-container">
          <AppIcon
            name={
              ["paid", "verified"].includes(
                payment.status,
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
              {statusConfig.label}
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
            Submitted{" "}
            {formatDateTime(
              payment.submittedAt ??
                payment.createdAt,
            )}
          </p>
        </div>
      </div>

      <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 font-label-sm text-label-sm text-primary transition-colors group-hover:bg-surface-container-low">
        Review Payment

        <AppIcon
          name="arrow_forward"
          size={17}
        />
      </span>
    </button>
  );
}

function InfoItem({ label, value, fullWidth = false }) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <dt className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </dt>

      <dd className="mt-1 break-words font-body-md text-body-md text-on-surface">
        {value || "-"}
      </dd>
    </div>
  );
}

function EmptyCard({ icon, title, description }) {
  return (
    <article className="glass-panel flex min-h-64 flex-col items-center justify-center rounded-xl p-8 text-center xl:col-span-2">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high">
        <AppIcon name={icon} size={26} className="text-on-surface-variant" />
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
