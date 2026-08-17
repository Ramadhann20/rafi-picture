const JAKARTA_TIME_ZONE = "Asia/Jakarta";

function normalizeDate(value) {
  if (value instanceof Date) {
    return value;
  }

  const date = value ? new Date(value) : new Date();

  return Number.isNaN(date.getTime())
    ? new Date()
    : date;
}

export function getJakartaDateKey(value = new Date()) {
  const date = normalizeDate(value);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Gagal menentukan tanggal Asia/Jakarta.");
  }

  return `${year}-${month}-${day}`;
}

export function addDaysToDateKey(dateKey, amount) {
  const normalized = String(dateKey || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error("Format tanggal harus YYYY-MM-DD.");
  }

  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() + Number(amount || 0));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function getDefaultJakartaDueDate(days = 3) {
  return addDaysToDateKey(getJakartaDateKey(), days);
}

export { JAKARTA_TIME_ZONE };
