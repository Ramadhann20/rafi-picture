function hashToPositiveInteger(value) {
  let hash = 2166136261;

  const input = String(value ?? "");

  for (let index = 0; index < input.length; index += 1) {
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
  const safe =
    String(
      invoiceNumber ||
        "INV-DP",
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

  return `${safe || "INV-DP"}.pdf`;
}
