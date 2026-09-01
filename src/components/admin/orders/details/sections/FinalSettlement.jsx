"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AppIcon from "@/components/global/AppIcon";
import { auth } from "@/lib/firebase-config";

function toDate(value) {
  if (!value) {
    return null;
  }

  const date =
    typeof value?.toDate ===
    "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date;
}

function formatCurrency(
  value,
  currency = "IDR",
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  ).format(
    Number(value) || 0,
  );
}

function formatDate(
  value,
) {
  const date =
    toDate(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function formatFileSize(
  value,
) {
  const bytes =
    Number(value) || 0;

  if (
    bytes < 1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getDefaultDueDate() {
  const date =
    new Date();

  date.setDate(
    date.getDate() + 3,
  );

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function toTimestamp(
  value,
) {
  const date =
    toDate(value);

  return date
    ? date.getTime()
    : 0;
}

function getLatestInvoice(
  invoices,
  type,
) {
  return (
    [...invoices]
      .filter(
        (invoice) =>
          invoice.type ===
            type &&
          invoice.status !==
            "void",
      )
      .sort(
        (
          first,
          second,
        ) =>
          toTimestamp(
            second.issuedAt ??
              second.createdAt,
          ) -
          toTimestamp(
            first.issuedAt ??
              first.createdAt,
          ),
      )[0] ??
    null
  );
}

function getBookingAmounts(
  booking,
) {
  const packageAmount =
    Math.max(
      Number(
        booking?.package?.price,
      ) || 0,
      0,
    );

  const travelCharge =
    Math.max(
      Number(
        booking?.event
          ?.location
          ?.distanceCharge
          ?.amount,
      ) || 0,
      0,
    );

  return {
    packageAmount,
    travelCharge,
    bookingTotal:
      packageAmount +
      travelCharge,
  };
}

function getInvoicePrincipalAmount(
  invoice,
) {
  const penaltyAmount =
    Math.max(
      Number(
        invoice?.penalty
          ?.appliedAmount ??
          invoice?.penaltyAmount,
      ) || 0,
      0,
    );

  const explicitPrincipal =
    Number(
      invoice?.principalAmount ??
        invoice?.baseAmount,
    );

  if (
    Number.isFinite(
      explicitPrincipal,
    ) &&
    explicitPrincipal >= 0
  ) {
    return explicitPrincipal;
  }

  return Math.max(
    0,
    (Number(
      invoice?.amount,
    ) || 0) -
      penaltyAmount,
  );
}

function getVerifiedPaymentTotal(
  payments,
  invoices = [],
) {
  const invoiceById =
    new Map(
      invoices.map(
        (invoice) => [
          invoice.id,
          invoice,
        ],
      ),
    );

  return payments
    .filter(
      (payment) =>
        [
          "verified",
          "paid",
        ].includes(
          String(
            payment.status ||
              "",
          ).toLowerCase(),
        ),
    )
    .reduce(
      (
        total,
        payment,
      ) => {
        const paymentAmount =
          Math.max(
            Number(
              payment.amount,
            ) || 0,
            0,
          );

        const invoice =
          invoiceById.get(
            payment.invoiceId,
          );

        if (!invoice) {
          return (
            total +
            paymentAmount
          );
        }

        return (
          total +
          Math.min(
            paymentAmount,
            getInvoicePrincipalAmount(
              invoice,
            ),
          )
        );
      },
      0,
    );
}

function createDraft({
  booking,
  payments,
  invoices,
}) {
  const {
    bookingTotal,
  } = getBookingAmounts(
    booking,
  );

  const totalPaid =
    getVerifiedPaymentTotal(
      payments,
      invoices,
    );

  return {
    type:
      "final",
    dueAt:
      getDefaultDueDate(),
    amount:
      Math.max(
        0,
        bookingTotal -
          totalPaid,
      ),
    note:
      "Final payment / pelunasan",
  };
}

function decodePdfPreview(
  previewData,
) {
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

  const binary =
    window.atob(
      pdfBase64,
    );

  if (
    binary.length <= 5
  ) {
    throw new Error(
      "PDF preview kosong.",
    );
  }

  const bytes =
    new Uint8Array(
      binary.length,
    );

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(
        index,
      );
  }

  const signature =
    String.fromCharCode(
      ...bytes.slice(
        0,
        5,
      ),
    );

  if (
    signature !== "%PDF-"
  ) {
    throw new Error(
      "Data preview bukan file PDF valid.",
    );
  }

  const blob =
    new Blob(
      [bytes],
      {
        type:
          "application/pdf",
      },
    );

  return {
    url:
      URL.createObjectURL(
        blob,
      ),
    size:
      blob.size,
  };
}

export default function FinalSettlement({
  booking,
  invoices = [],
  payments = [],
}) {
  const depositInvoice =
    useMemo(
      () =>
        getLatestInvoice(
          invoices,
          "deposit",
        ),
      [invoices],
    );

  const finalInvoice =
    useMemo(
      () =>
        getLatestInvoice(
          invoices,
          "final",
        ),
      [invoices],
    );

  const receiptPayment =
    useMemo(
      () =>
        [...payments]
          .filter(
            (payment) =>
              payment?.receiptUrl ||
              payment?.receipt?.url,
          )
          .sort(
            (
              first,
              second,
            ) =>
              toTimestamp(
                second.verifiedAt ??
                  second.updatedAt,
              ) -
              toTimestamp(
                first.verifiedAt ??
                  first.updatedAt,
              ),
          )[0] ??
        null,
      [payments],
    );

  const {
    packageAmount,
    travelCharge,
    bookingTotal,
  } = useMemo(
    () =>
      getBookingAmounts(
        booking,
      ),
    [booking],
  );

  const totalPaid =
    useMemo(
      () =>
        getVerifiedPaymentTotal(
          payments,
          invoices,
        ),
      [payments, invoices],
    );

  const remaining =
    Math.max(
      0,
      bookingTotal -
        totalPaid,
    );

  const eligible =
    booking?.status ===
      "in_progress" &&
    depositInvoice?.status ===
      "paid" &&
    remaining > 0;

  const [
    draft,
    setDraft,
  ] = useState(null);

  const [
    confirmed,
    setConfirmed,
  ] = useState(false);

  const [
    preview,
    setPreview,
  ] = useState(null);

  const [
    previewOpen,
    setPreviewOpen,
  ] = useState(false);

  const [
    reviewed,
    setReviewed,
  ] = useState(false);

  const [
    generating,
    setGenerating,
  ] = useState(false);

  const [
    issuing,
    setIssuing,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  const clearPreview = () => {
    setPreview(
      (current) => {
        if (
          current?.url
        ) {
          URL.revokeObjectURL(
            current.url,
          );
        }

        return null;
      },
    );

    setPreviewOpen(false);
    setReviewed(false);
    setConfirmed(false);
  };

  useEffect(() => {
    setDraft(null);
    setNotice("");
    setActionError("");
    clearPreview();

    return () => {
      setPreview(
        (current) => {
          if (
            current?.url
          ) {
            URL.revokeObjectURL(
              current.url,
            );
          }

          return null;
        },
      );
    };
  }, [
    booking?.id,
    finalInvoice?.id,
  ]);

  if (
    finalInvoice
  ) {
    const penaltyAmount =
      Math.max(
        Number(
          finalInvoice?.penalty
            ?.appliedAmount ??
            finalInvoice?.penaltyAmount,
        ) || 0,
        0,
      );

    const principalAmount =
      Math.max(
        Number(
          finalInvoice?.principalAmount,
        ) ||
          Number(
            finalInvoice?.amount,
          ) -
            penaltyAmount,
        0,
      );

    const pdfUrl =
      finalInvoice?.pdf?.url ??
      finalInvoice?.pdfUrl ??
      null;

    const receiptUrl =
      receiptPayment?.receipt?.url ??
      receiptPayment?.receiptUrl ??
      null;

    const receiptFileName =
      receiptPayment?.receipt?.fileName ??
      `${
        receiptPayment?.receiptNumber ??
        "receipt"
      }.pdf`;

    return (
      <section className="rounded-xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
              Invoice Pelunasan
            </p>

            <h2 className="mt-2 font-headline-md text-headline-md text-on-surface">
              {finalInvoice.invoiceNumber ??
                "Final Invoice"}
            </h2>

            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              Invoice pelunasan sudah diterbitkan untuk sisa pembayaran booking.
            </p>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-label-sm text-label-sm text-on-surface-variant">
              <span>
                Pokok Pelunasan:{" "}
                <strong className="text-on-surface">
                  {formatCurrency(
                    principalAmount,
                    finalInvoice.currency,
                  )}
                </strong>
              </span>

              {penaltyAmount > 0 && (
                <span className="text-error">
                  Denda:{" "}
                  <strong>
                    {formatCurrency(
                      penaltyAmount,
                      finalInvoice.currency,
                    )}
                  </strong>
                </span>
              )}

              <span>
                Total Invoice:{" "}
                <strong className="text-on-surface">
                  {formatCurrency(
                    finalInvoice.amount,
                    finalInvoice.currency,
                  )}
                </strong>
              </span>

              <span>
                Jatuh tempo:{" "}
                <strong className="text-on-surface">
                  {formatDate(
                    finalInvoice.dueAt,
                  )}
                </strong>
              </span>

              <span>
                Status:{" "}
                <strong className="text-on-surface">
                  {String(
                    finalInvoice.status ||
                      "issued",
                  ).toUpperCase()}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 px-5 py-3 font-label-md text-label-md text-primary transition-colors hover:bg-primary/5"
              >
                <AppIcon
                  name="visibility"
                  size={18}
                />
                Open Final Invoice
              </a>
            )}

            {receiptUrl && (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-label-md text-label-md text-on-primary transition-opacity hover:opacity-90"
                title={receiptFileName}
              >
                <AppIcon
                  name="verified"
                  size={18}
                />
                Open Receipt
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (!eligible) {
    return null;
  }

  const handleCreateDraft = () => {
    setDraft(
      createDraft({
        booking,
        payments,
        invoices,
      }),
    );

    setActionError("");
    setNotice("");
  };

  const updateDraft = (
    patch,
  ) => {
    setDraft(
      (current) => ({
        ...current,
        ...patch,
        amount:
          remaining,
      }),
    );

    clearPreview();
    setActionError("");
    setNotice("");
  };

  const generatePreview =
    async () => {
      if (!draft) {
        throw new Error(
          "Buat draft invoice pelunasan terlebih dahulu.",
        );
      }

      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        throw new Error(
          "Sesi admin tidak tersedia.",
        );
      }

      const idToken =
        await currentUser.getIdToken(
          true,
        );

      const response =
        await fetch(
          "/api/admin/invoices/final-preview",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${idToken}`,
            },
            body:
              JSON.stringify({
                bookingId:
                  booking.id,
                invoiceDraft:
                  draft,
              }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Preview invoice pelunasan gagal dibuat.",
        );
      }

      const decoded =
        decodePdfPreview(
          result?.data,
        );

      setPreview(
        (current) => {
          if (
            current?.url
          ) {
            URL.revokeObjectURL(
              current.url,
            );
          }

          return {
            ...decoded,
            fileName:
              result?.data
                ?.fileName ||
              "invoice-pelunasan-preview.pdf",
            invoiceNumber:
              result?.data
                ?.invoiceNumber ||
              null,
          };
        },
      );

      setPreviewOpen(false);
      setReviewed(false);
      setConfirmed(true);
    };

  const handleConfirm =
    async () => {
      if (
        generating
      ) {
        return;
      }

      if (confirmed) {
        clearPreview();
        return;
      }

      setGenerating(true);
      setActionError("");
      setNotice("");

      try {
        await generatePreview();
      } catch (error) {
        console.error(
          "FINAL INVOICE PREVIEW ERROR:",
          error,
        );

        setActionError(
          error?.message ||
            "Preview invoice pelunasan gagal dibuat.",
        );
      } finally {
        setGenerating(false);
      }
    };

  const handleReview = () => {
    if (!preview?.url) {
      return;
    }

    setPreviewOpen(
      (current) => {
        const next =
          !current;

        if (next) {
          setReviewed(true);
        }

        return next;
      },
    );
  };

  const handleIssue =
    async () => {
      if (
        !draft ||
        !confirmed ||
        !reviewed ||
        issuing
      ) {
        return;
      }

      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        setActionError(
          "Sesi admin tidak tersedia.",
        );
        return;
      }

      setIssuing(true);
      setActionError("");
      setNotice("");

      try {
        const idToken =
          await currentUser.getIdToken(
            true,
          );

        const response =
          await fetch(
            "/api/admin/invoices/final-issue",
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${idToken}`,
              },
              body:
                JSON.stringify({
                  bookingId:
                    booking.id,
                  invoiceDraft:
                    draft,
                  pdfReviewed:
                    true,
                }),
            },
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Invoice pelunasan gagal diterbitkan.",
          );
        }

        setNotice(
          result?.data?.email
            ?.sent === false
            ? "Invoice pelunasan sudah diterbitkan dan tersimpan di Cloudinary, tetapi email belum terkirim."
            : "Invoice pelunasan berhasil diterbitkan dan dikirim ke client.",
        );
      } catch (error) {
        console.error(
          "ISSUE FINAL INVOICE ERROR:",
          error,
        );

        setActionError(
          error?.message ||
            "Invoice pelunasan gagal diterbitkan.",
        );
      } finally {
        setIssuing(false);
      }
    };

  return (
    <section className="space-y-5">
      <div>
        <p className="font-label-md text-label-md uppercase tracking-widest text-secondary">
          Step 04
        </p>

        <h2 className="mt-2 font-headline-lg text-headline-lg text-on-surface">
          Invoice Pelunasan
        </h2>

        <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
          DP sudah terverifikasi. Siapkan invoice kedua untuk sisa pembayaran, review PDF, lalu kirim ke client.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Package"
          value={formatCurrency(
            packageAmount,
            booking?.package?.currency,
          )}
        />

        <SummaryCard
          label="Travel"
          value={formatCurrency(
            travelCharge,
            booking?.package?.currency,
          )}
        />

        <SummaryCard
          label="Paid"
          value={formatCurrency(
            totalPaid,
            booking?.package?.currency,
          )}
        />

        <SummaryCard
          label="Pelunasan"
          value={formatCurrency(
            remaining,
            booking?.package?.currency,
          )}
          accent
        />
      </div>

      {!draft ? (
        <button
          type="button"
          onClick={
            handleCreateDraft
          }
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <AppIcon
            name="receipt"
            size={18}
          />
          Create Final Invoice Draft
        </button>
      ) : (
        <article className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Amount
              </p>

              <p className="mt-2 font-headline-md text-headline-md text-primary">
                {formatCurrency(
                  remaining,
                  booking?.package?.currency,
                )}
              </p>

              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                Nominal dikunci dari Booking Total - pembayaran verified.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="final-note"
                className="font-label-sm text-label-sm text-on-surface-variant"
              >
                Invoice Note
              </label>

              <textarea
                id="final-note"
                rows={3}
                value={
                  draft.note ||
                  ""
                }
                disabled={
                  confirmed
                }
                onChange={
                  (event) =>
                    updateDraft({
                      note:
                        event.target
                          .value,
                    })
                }
                className="mt-2 w-full resize-none rounded-lg border border-outline-variant bg-transparent px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-outline-variant/30 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {confirmed
                ? "PDF sudah dibuat. Review sebelum invoice diterbitkan."
                : "Draft masih lokal dan belum mengubah Firestore."}
            </p>

            <button
              type="button"
              onClick={
                handleConfirm
              }
              disabled={
                generating ||
                issuing
              }
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-label-md text-label-md transition-all disabled:opacity-50 ${
                confirmed
                  ? "border border-outline-variant text-primary"
                  : "bg-primary text-on-primary"
              }`}
            >
              <AppIcon
                name={
                  confirmed
                    ? "edit"
                    : "receipt"
                }
                size={18}
              />
              {generating
                ? "Generating..."
                : confirmed
                  ? "Edit Billing"
                  : "Confirm & Generate PDF"}
            </button>
          </div>
        </article>
      )}

      {preview && (
        <article className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                Generated Document
              </p>

              <h3 className="mt-1 font-headline-md text-headline-md text-on-surface">
                {preview.invoiceNumber ||
                  "Invoice Pelunasan"}
              </h3>

              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                {preview.fileName}
                {" · "}
                {formatFileSize(
                  preview.size,
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleReview
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-label-md text-label-md text-on-primary"
            >
              <AppIcon
                name="visibility"
                size={18}
              />
              {previewOpen
                ? "Hide Preview"
                : reviewed
                  ? "Review Again"
                  : "Review PDF"}
            </button>
          </div>

          {previewOpen && (
            <div className="border-t border-outline-variant/30 p-4 md:p-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Review total, DP terbayar, sisa pelunasan, dan data client.
                </p>

                <a
                  href={
                    preview.url
                  }
                  download={
                    preview.fileName
                  }
                  className="inline-flex shrink-0 items-center gap-2 font-label-sm text-label-sm text-secondary"
                >
                  <AppIcon
                    name="download"
                    size={17}
                  />
                  Download
                </a>
              </div>

              <div className="overflow-hidden rounded-lg border border-outline-variant/40 bg-white">
                <object
                  data={
                    preview.url
                  }
                  type="application/pdf"
                  className="h-[72vh] min-h-[620px] w-full"
                  aria-label="Final invoice PDF preview"
                >
                  <p className="p-8 text-center font-body-md text-body-md text-on-surface-variant">
                    Browser tidak dapat menampilkan PDF inline. Gunakan tombol Download.
                  </p>
                </object>
              </div>
            </div>
          )}
        </article>
      )}

      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 font-body-md text-body-md text-error"
        >
          {actionError}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 font-body-md text-body-md text-primary"
        >
          {notice}
        </div>
      )}

      {preview && (
        <section className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                Final Step
              </p>

              <h3 className="mt-1 font-headline-md text-headline-md text-on-surface">
                Issue & Send Final Invoice
              </h3>

              <div className="mt-3 space-y-1.5">
                <Requirement
                  label="Invoice draft confirmed"
                  complete={
                    confirmed
                  }
                />

                <Requirement
                  label="PDF generated"
                  complete={
                    Boolean(
                      preview?.url,
                    )
                  }
                />

                <Requirement
                  label="PDF reviewed"
                  complete={
                    reviewed
                  }
                />
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleIssue
              }
              disabled={
                !confirmed ||
                !reviewed ||
                issuing
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3 font-label-md text-label-md text-on-primary transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {issuing
                ? "Issuing..."
                : "Issue & Send Invoice"}

              {!issuing && (
                <AppIcon
                  name="send"
                  size={18}
                />
              )}
            </button>
          </div>
        </section>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  accent = false,
}) {
  return (
    <div className={`rounded-xl border p-4 ${
      accent
        ? "border-primary/25 bg-primary/5"
        : "border-outline-variant/30 bg-surface-container-lowest"
    }`}>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </p>

      <p className={`mt-2 font-label-md text-label-md ${
        accent
          ? "text-primary"
          : "text-on-surface"
      }`}>
        {value}
      </p>
    </div>
  );
}

function Requirement({
  label,
  complete,
}) {
  return (
    <div className="flex items-center gap-2">
      <AppIcon
        name={
          complete
            ? "check"
            : "close"
        }
        size={16}
        className={
          complete
            ? "text-primary"
            : "text-error"
        }
      />

      <span className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </span>
    </div>
  );
}
