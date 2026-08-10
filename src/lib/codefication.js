/**
 * Shared business-code generator.
 *
 * Default format:
 * PREFIX-YYYYMMDD-CATEGORY-SUFFIX
 * Example: PKG-20260810-7K3M-A91FQ
 *
 * Firestore document IDs remain the technical primary key. These generated
 * codes are human-facing/business identifiers and can safely be stored as
 * fields such as packageCode, bookingCode, invoiceCode, etc.
 */

export const CODE_PREFIXES = Object.freeze({
  package: "PKG",
  booking: "BKG",
  invoice: "INV",
  payment: "PAY",
  customer: "CUS",
});

function normalizeSegment(value, fallback = "GEN", maxLength = 12) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, maxLength);

  return normalized || fallback;
}

function formatDateSegment(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("generateCode(): date tidak valid.");
  }

  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

/**
 * Converts a long relation ID (for example a Firestore category document ID)
 * into a short, deterministic token. The same ID always produces the same
 * token, while the original Firestore ID does not need to appear in the code.
 */
export function stableCodeToken(value, length = 4) {
  const source = String(value ?? "").trim();
  if (!source) return "GEN".padEnd(length, "0").slice(0, length);

  // FNV-1a 32-bit hash. Small and deterministic in browser/server runtimes.
  let hash = 0x811c9dc5;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0)
    .toString(36)
    .toUpperCase()
    .padStart(length, "0")
    .slice(-length);
}

function randomToken(length = 5) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(
    bytes,
    (byte) => alphabet[byte % alphabet.length],
  ).join("");
}

/**
 * Creates a reusable business code.
 *
 * @param {object} options
 * @param {string} options.prefix Entity prefix, e.g. PKG, BKG, INV.
 * @param {Date|string|number} [options.date] Creation date. Defaults to now.
 * @param {string} [options.categoryId] Optional relation/category ID.
 * @param {string[]} [options.segments] Optional readable extra segments.
 * @param {number} [options.suffixLength] Random suffix length. Defaults to 5.
 */
export function generateCode({
  prefix = "GEN",
  date = new Date(),
  categoryId = "",
  segments = [],
  suffixLength = 5,
} = {}) {
  const parts = [normalizeSegment(prefix), formatDateSegment(date)];

  if (categoryId) {
    parts.push(stableCodeToken(categoryId, 4));
  }

  for (const segment of segments) {
    const normalized = normalizeSegment(segment, "", 8);
    if (normalized) parts.push(normalized);
  }

  parts.push(randomToken(Math.max(3, Math.min(Number(suffixLength) || 5, 10))));

  return parts.join("-");
}
