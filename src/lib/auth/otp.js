import crypto from "crypto";

const OTP_SECRET = process.env.OTP_SECRET;

if (!OTP_SECRET) {
  throw new Error("OTP_SECRET is missing.");
}

export const OTP_EXPIRES_MS = 5 * 60 * 1000;
export const OTP_RESEND_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function getOtpDocumentId(email) {
  return crypto
    .createHash("sha256")
    .update(normalizeEmail(email))
    .digest("hex");
}

export function hashOtp(email, otp) {
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${normalizeEmail(email)}:${otp}`)
    .digest("hex");
}

export function isOtpValid(email, otp, storedHash) {
  if (!storedHash) return false;

  const incoming = Buffer.from(hashOtp(email, otp), "hex");
  const stored = Buffer.from(storedHash, "hex");

  if (incoming.length !== stored.length) {
    return false;
  }

  return crypto.timingSafeEqual(incoming, stored);
}
