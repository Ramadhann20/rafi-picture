"use client";

import { useMemo, useRef, useState } from "react";

import AppIcon from "@/components/global/AppIcon";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
  "image/png",
  "image/jpeg",
]);

const BOOKING_PAYMENT_STATUS = {
  approved: {
    label: "Menunggu Pembayaran",
    badgeClass:
      "bg-secondary-container text-on-secondary-container",
  },

  confirmed: {
    label: "Menunggu Verifikasi",
    badgeClass:
      "bg-primary-container text-on-primary-container",
  },

  in_progress: {
    label: "Pembayaran Terverifikasi",
    badgeClass:
      "bg-primary text-on-primary",
  },

  completed: {
    label: "Selesai",
    badgeClass:
      "bg-primary text-on-primary",
  },

  cancelled: {
    label: "Dibatalkan",
    badgeClass:
      "bg-error-container text-error",
  },
};

const PAYMENT_STATUS = {
  pending: {
    label: "MENUNGGU VERIFIKASI",
    badgeClass:
      "bg-secondary-container text-on-secondary-container",
  },

  pending_verification: {
    label: "MENUNGGU VERIFIKASI",
    badgeClass:
      "bg-secondary-container text-on-secondary-container",
  },

  verified: {
    label: "TERVERIFIKASI",
    badgeClass:
      "bg-primary text-on-primary",
  },

  paid: {
    label: "TERVERIFIKASI",
    badgeClass:
      "bg-primary text-on-primary",
  },

  rejected: {
    label: "DITOLAK",
    badgeClass:
      "bg-error-container text-error",
  },
};

function normalizeBookingStatus(status) {
  if (status === "awaiting_payment") {
    return "approved";
  }

  return String(status ?? "approved").toLowerCase();
}

function normalizePaymentStatus(status) {
  return String(status ?? "pending_verification").toLowerCase();
}

function toDate(value) {
  if (!value) return null;

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day);
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

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value, currency = "IDR") {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getClientDisplayName(client) {
  const fullName = client?.fullName?.trim();
  const partnerName = client?.partnerName?.trim();

  if (!fullName) return "Klien";
  if (!partnerName) return fullName;

  return `${fullName} & ${partnerName}`;
}

function getInvoiceItems(invoice, booking) {
  if (Array.isArray(invoice?.items) && invoice.items.length > 0) {
    return invoice.items.map((item, index) => ({
      id: item.id ?? `${item.label ?? "item"}-${index}`,
      label: item.label ?? item.name ?? "Layanan",
      amount: Number(item.amount ?? item.price) || 0,
    }));
  }

  const packageAmount =
    Number(invoice?.packageTotal ?? booking?.package?.price) || 0;

  return [
    {
      id: "package-service",
      label: booking?.package?.name ?? "Biaya Layanan",
      amount: packageAmount,
    },
  ];
}

function getPaymentAmount(payment) {
  return Number(
    payment?.amount ??
      payment?.nominal ??
      payment?.total ??
      payment?.paymentAmount,
  ) || 0;
}

function getPaymentReference(payment) {
  return (
    payment?.referenceNumber ??
    payment?.paymentReference ??
    payment?.id ??
    "-"
  );
}

function getPaymentMethod(payment) {
  return payment?.method ?? payment?.paymentMethod ?? "Transfer Bank";
}

function getPaymentDate(payment) {
  return (
    payment?.paidAt ??
    payment?.transferredAt ??
    payment?.submittedAt ??
    payment?.createdAt ??
    null
  );
}

export default function BookingPaymentPage({
  booking,
  invoice = null,
  payments = [],
  bankAccounts = [
    {
      id: "primary-bank",
      bankName: "BCA",
      accountNumber: "1234567890",
      accountName: "Rafi Picture Studio",
    },
  ],
  onSubmitPayment,
}) {
  const inputRef = useRef(null);

  const [proofFile, setProofFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [copiedValue, setCopiedValue] = useState(null);

  const bookingStatus = normalizeBookingStatus(booking?.status);
  const statusConfig =
    BOOKING_PAYMENT_STATUS[bookingStatus] ??
    BOOKING_PAYMENT_STATUS.approved;

  const canUpload = bookingStatus === "approved";
  const underReview = bookingStatus === "confirmed";

  const currency =
    invoice?.currency ??
    booking?.package?.currency ??
    "IDR";

  const invoiceItems = useMemo(
    () => getInvoiceItems(invoice, booking),
    [invoice, booking],
  );

  const packageTotal =
    Number(
      invoice?.packageTotal ??
        booking?.package?.price ??
        invoiceItems.reduce((sum, item) => sum + item.amount, 0),
    ) || 0;

  const depositAmount =
    Number(invoice?.amount) || packageTotal * 0.3;

  const verifiedPayments = useMemo(
    () =>
      payments.filter((payment) =>
        ["verified", "paid"].includes(
          normalizePaymentStatus(payment.status),
        ),
      ),
    [payments],
  );

  const totalVerified = useMemo(
    () =>
      verifiedPayments.reduce(
        (sum, payment) => sum + getPaymentAmount(payment),
        0,
      ),
    [verifiedPayments],
  );

  const remainingBalance = Math.max(0, packageTotal - totalVerified);

  const handleFile = (file) => {
    setFormError(null);

    if (!file) {
      setProofFile(null);
      return;
    }

    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      setFormError("Foto harus berformat PNG, JPG, atau JPEG.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFormError("Ukuran file maksimal 5 MB.");
      return;
    }

    setProofFile(file);
  };

  const handleInputChange = (event) => {
    handleFile(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (!canUpload) return;

    handleFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (canUpload) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);

      window.setTimeout(() => {
        setCopiedValue(null);
      }, 1800);
    } catch {
      setFormError("Nomor rekening gagal disalin.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canUpload || submitting) return;

    setFormError(null);

    if (!invoice?.id) {
      setFormError("Invoice deposit belum tersedia.");
      return;
    }

    if (!proofFile) {
      setFormError("Pilih bukti pembayaran terlebih dahulu.");
      return;
    }

    if (typeof onSubmitPayment !== "function") {
      setFormError("Handler pengiriman pembayaran belum tersedia.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmitPayment({
        bookingId: booking.id,
        invoiceId: invoice.id,
        amount: depositAmount,
        currency,
        proofFile,
      });

    } catch (error) {
      console.error("PAYMENT SUBMISSION ERROR:", error);

      setFormError(
        error?.message ??
          "Bukti pembayaran gagal dikirim. Silakan coba kembali.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) {
    return (
      <section className="flex min-h-100 items-center justify-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Data booking tidak tersedia.
        </p>
      </section>
    );
  }

  return (
    <section className="relative">
      <header className="mb-stack-lg flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-label-md text-label-md uppercase tracking-widest text-secondary">
            Penagihan & Pembayaran
          </p>

          <h1 className="mt-2 font-headline-lg text-headline-lg text-on-surface">
            Kelola Pembayaran Anda
          </h1>

          <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            {getClientDisplayName(booking.client)}, selesaikan pembayaran
            deposit dan unggah bukti transfer untuk melanjutkan booking.
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2 ${statusConfig.badgeClass}`}
        >
          <AppIcon
            name={underReview ? "verified" : "payments"}
            size={18}
          />

          <span className="font-label-md text-label-md">
            Status: {statusConfig.label}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
        <div className="space-y-stack-md lg:col-span-7">
          <InvoiceCard
            booking={booking}
            invoice={invoice}
            invoiceItems={invoiceItems}
            packageTotal={packageTotal}
            depositAmount={depositAmount}
            currency={currency}
          />

          <PaymentHistory
            payments={payments}
            currency={currency}
            remainingBalance={remainingBalance}
          />
        </div>

        <div className="space-y-stack-md lg:col-span-5">
          <BankTransferCard
            accounts={bankAccounts}
            copiedValue={copiedValue}
            onCopy={handleCopy}
          />

          <PaymentUploadCard
            canUpload={canUpload}
            underReview={underReview}
            proofFile={proofFile}
            dragActive={dragActive}
            formError={formError}
            submitting={submitting}
            inputRef={inputRef}
            onFileChange={handleInputChange}
            onChooseFile={() => inputRef.current?.click()}
            onRemoveFile={() => setProofFile(null)}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

    </section>
  );
}

function InvoiceCard({
  booking,
  invoice,
  invoiceItems,
  packageTotal,
  depositAmount,
  currency,
}) {
  return (
    <article className="glass-panel relative overflow-hidden rounded-xl border border-outline-variant/30 p-stack-md">
      <div className="pointer-events-none absolute right-7 top-7 opacity-5">
        <AppIcon name="payments" size={112} />
      </div>

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {booking.package?.name ?? "Paket Layanan"}
          </h2>

          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Faktur {invoice?.invoiceNumber ?? invoice?.id ?? "-"}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="font-label-sm text-label-sm text-secondary">
            Tanggal Terbit
          </p>

          <p className="mt-1 font-body-md text-body-md text-on-surface">
            {formatDate(invoice?.issuedAt ?? invoice?.createdAt)}
          </p>
        </div>
      </div>

      <div className="my-stack-sm space-y-4 border-y border-outline-variant/20 py-stack-sm">
        {invoiceItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-6"
          >
            <span className="font-body-md text-body-md text-on-surface-variant">
              {item.label}
            </span>

            <span className="shrink-0 font-label-md text-label-md text-on-surface">
              {formatCurrency(item.amount, currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-stack-md space-y-3">
        <div className="flex items-center justify-between gap-5">
          <span className="font-headline-md text-headline-md text-on-surface">
            Total Biaya
          </span>

          <span className="font-headline-md text-headline-md text-on-surface">
            {formatCurrency(packageTotal, currency)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-5 text-error">
          <span className="font-label-md text-label-md">
            DP yang Harus Dibayar
          </span>

          <span className="font-label-md text-label-md">
            {formatCurrency(depositAmount, currency)}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-surface-container-low p-4">
        <AppIcon
          name="receipt"
          size={20}
          className="mt-0.5 shrink-0 text-secondary"
        />

        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Booking akan diamankan setelah pembayaran deposit diverifikasi
          oleh admin. Simpan bukti transfer sampai proses verifikasi selesai.
        </p>
      </div>
    </article>
  );
}

function PaymentHistory({
  payments,
  currency,
  remainingBalance,
}) {
  return (
    <section className="space-y-stack-sm">
      <h2 className="font-label-md text-label-md uppercase tracking-wider text-secondary">
        Riwayat Transaksi
      </h2>

      <div className="glass-panel overflow-hidden rounded-xl">
        {payments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high">
              <AppIcon
                name="payments"
                size={23}
                className="text-on-surface-variant"
              />
            </div>

            <p className="mt-4 font-label-md text-label-md text-on-surface">
              Belum ada transaksi
            </p>

            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              Riwayat pembayaran akan muncul setelah bukti transfer dikirim.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high/50">
                <tr>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                    Referensi
                  </th>

                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                    Metode
                  </th>

                  <th className="px-6 py-4 text-right font-label-md text-label-md text-on-surface-variant">
                    Jumlah
                  </th>

                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/20">
                {payments.map((payment) => {
                  const normalizedStatus =
                    normalizePaymentStatus(payment.status);

                  const statusConfig =
                    PAYMENT_STATUS[normalizedStatus] ??
                    PAYMENT_STATUS.pending_verification;

                  return (
                    <tr
                      key={payment.id}
                      className="transition-colors hover:bg-surface-container-low"
                    >
                      <td className="px-6 py-4">
                        <p className="font-label-md text-label-md text-on-surface">
                          {getPaymentReference(payment)}
                        </p>

                        <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                          {formatDate(getPaymentDate(payment))}
                        </p>
                      </td>

                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                        {getPaymentMethod(payment)}
                      </td>

                      <td className="px-6 py-4 text-right font-label-md text-label-md text-on-surface">
                        {formatCurrency(
                          getPaymentAmount(payment),
                          payment.currency ?? currency,
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded px-2 py-1 font-label-sm text-[11px] ${statusConfig.badgeClass}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                <tr className="bg-surface-container-low/70">
                  <td
                    colSpan={2}
                    className="px-6 py-4 text-right font-label-md text-label-md text-on-surface"
                  >
                    Sisa Saldo
                  </td>

                  <td className="px-6 py-4 text-right font-label-md text-label-md text-error">
                    {formatCurrency(remainingBalance, currency)}
                  </td>

                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center gap-2 font-label-md text-label-md text-on-surface-variant opacity-50"
        >
          <AppIcon name="download" size={18} />
          Unduh Kuitansi
        </button>
      </div>
    </section>
  );
}

function BankTransferCard({
  accounts,
  copiedValue,
  onCopy,
}) {
  return (
    <article className="glass-panel rounded-xl border border-outline-variant/30 p-stack-md">
      <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-surface">
        Transfer Bank
      </h2>

      <div className="space-y-4">
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => onCopy(account.accountNumber)}
            className="group relative w-full overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 text-left transition-colors hover:border-primary"
          >
            <p className="mb-1 font-label-sm text-label-sm text-on-surface-variant">
              {account.bankName}
            </p>

            <p className="pr-20 font-headline-md text-[20px] font-bold text-on-surface">
              {account.accountNumber}
            </p>

            <p className="mt-1 font-label-md text-label-md text-on-surface">
              {account.accountName}
            </p>

            <span className="absolute right-4 top-4 rounded-md bg-surface-container-high px-2 py-1 font-label-sm text-label-sm text-on-surface-variant group-hover:text-primary">
              {copiedValue === account.accountNumber ? "Tersalin" : "Salin"}
            </span>
          </button>
        ))}
      </div>
    </article>
  );
}

function PaymentUploadCard({
  canUpload,
  underReview,
  proofFile,
  dragActive,
  formError,
  submitting,
  inputRef,
  onFileChange,
  onChooseFile,
  onRemoveFile,
  onDrop,
  onDragOver,
  onDragLeave,
  onSubmit,
}) {
  if (underReview) {
    return (
      <article className="glass-panel rounded-xl border border-outline-variant/30 p-stack-md">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <AppIcon name="verified" size={24} />
          </div>

          <div>
            <p className="font-headline-md text-headline-md text-on-surface">
              Bukti Pembayaran Terkirim
            </p>

            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              Admin sedang meninjau bukti transfer Anda. Form upload akan
              tersedia kembali apabila pembayaran ditolak.
            </p>
          </div>
        </div>
      </article>
    );
  }

  if (!canUpload) {
    return (
      <article className="glass-panel rounded-xl border border-outline-variant/30 p-stack-md">
        <div className="flex items-start gap-4">
          <AppIcon
            name="lock"
            size={24}
            className="mt-1 shrink-0 text-on-surface-variant"
          />

          <div>
            <p className="font-headline-md text-headline-md text-on-surface">
              Upload Tidak Tersedia
            </p>

            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              Bukti transfer hanya dapat dikirim ketika status booking
              sudah disetujui.
            </p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="glass-panel rounded-xl border border-outline-variant/30 p-stack-md">
      <h2 className="mb-stack-sm font-label-md text-label-md uppercase tracking-wider text-secondary">
        Unggah Bukti Pembayaran
      </h2>

      <div
        role="button"
        tabIndex={0}
        onClick={onChooseFile}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            onChooseFile();
          }
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-stack-md text-center transition-all ${
          dragActive
            ? "border-primary bg-surface-container-low"
            : "border-outline-variant hover:border-primary hover:bg-surface-container-low/70"
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-highest">
          <AppIcon
            name={proofFile ? "check" : "photo_camera"}
            size={30}
            className="text-primary"
          />
        </div>

        {proofFile ? (
          <div>
            <p className="font-label-md text-label-md font-bold text-on-surface">
              {proofFile.name}
            </p>

            <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
              {(proofFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="font-label-md text-label-md font-bold text-on-surface">
              Klik untuk unggah atau seret dan lepas
            </p>

            <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
              PNG, JPG, atau JPEG — maksimal 5 MB
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {proofFile && (
        <button
          type="button"
          onClick={onRemoveFile}
          className="mt-3 inline-flex items-center gap-2 font-label-sm text-label-sm text-error"
        >
          <AppIcon name="delete" size={16} />
          Hapus file
        </button>
      )}

      <form
        onSubmit={onSubmit}
        className="mt-stack-sm space-y-4"
      >
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-error/30 bg-error-container px-4 py-3 font-body-md text-body-md text-error"
          >
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !proofFile}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 font-label-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            "Mengirim Bukti Pembayaran..."
          ) : (
            <>
              <AppIcon name="check" size={19} />
              Konfirmasi Bukti Pembayaran
            </>
          )}
        </button>

        {!proofFile && (
          <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
            Tombol konfirmasi aktif setelah foto bukti pembayaran dipilih.
          </p>
        )}
      </form>
    </article>
  );
}
