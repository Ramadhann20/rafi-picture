function hashToPositiveInteger(value) {
  let hash = 2166136261;

  const input =
    String(value ?? "");

  for (
    let index = 0;
    index < input.length;
    index += 1
  ) {
    hash ^= input.charCodeAt(index);

    hash = Math.imul(
      hash,
      16777619,
    );
  }

  return hash >>> 0;
}

function toDate(value) {
  if (!value) return null;

  if (
    typeof value?.toDate ===
    "function"
  ) {
    return value.toDate();
  }

  if (
    typeof value === "object" &&
    Number.isFinite(
      Number(value?._seconds),
    )
  ) {
    return new Date(
      Number(value._seconds) *
        1000,
    );
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date;
}

export function getInvoiceYear(
  booking,
) {
  const submittedAt =
    toDate(
      booking?.submittedAt,
    );

  return (
    submittedAt ??
    new Date()
  ).getFullYear();
}

export function buildInvoiceSequence(
  booking,
) {
  const source =
    booking?.bookingCode ||
    booking?.id ||
    "rafi-picture";

  const sequence =
    (hashToPositiveInteger(
      source,
    ) %
      999_999) +
    1;

  return String(
    sequence,
  ).padStart(
    6,
    "0",
  );
}

function buildPdfFileName(
  documentNumber,
  fallback,
) {
  const safe =
    String(
      documentNumber ||
        fallback,
    )
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        "-",
      )
      .replace(
        /-+/g,
        "-",
      )
      .replace(
        /^-|-$/g,
        "",
      );

  return `${safe || fallback}.pdf`;
}

export function buildDepositInvoiceNumber(
  booking,
) {
  const year =
    getInvoiceYear(booking);

  const sequence =
    buildInvoiceSequence(
      booking,
    );

  return `INV-DP/${year}/${sequence}`;
}

export function buildDepositInvoiceFileName(
  invoiceNumber,
) {
  return buildPdfFileName(
    invoiceNumber,
    "INV-DP",
  );
}

/**
 * Main invoice / invoice pelunasan.
 * Dibuat setelah DP sudah verified.
 */
export function buildMainInvoiceNumber(
  booking,
) {
  const year =
    getInvoiceYear(booking);

  const sequence =
    buildInvoiceSequence(
      booking,
    );

  return `INV/${year}/${sequence}`;
}

export function buildMainInvoiceFileName(
  invoiceNumber,
) {
  return buildPdfFileName(
    invoiceNumber,
    "INV",
  );
}

/**
 * Kuitansi full payment.
 * Nomor mengikuti family booking yang sama agar mudah ditelusuri.
 */
export function buildPaymentReceiptNumber(
  booking,
) {
  const year =
    getInvoiceYear(booking);

  const sequence =
    buildInvoiceSequence(
      booking,
    );

  return `PYI/${year}/${sequence}`;
}

export function buildPaymentReceiptFileName(
  receiptNumber,
) {
  return buildPdfFileName(
    receiptNumber,
    "PYI",
  );
}
