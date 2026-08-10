import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email/sendEmail";
import {
  generateOtp,
  getOtpDocumentId,
  hashOtp,
  normalizeEmail,
  OTP_EXPIRES_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_MS,
} from "@/lib/auth/otp";

export const runtime = "nodejs";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body?.email);

    if (!email || !isValidEmail(email)) {
      return Response.json(
        { success: false, message: "Email tidak valid." },
        { status: 400 }
      );
    }

    try {
      await adminAuth.getUserByEmail(email);

      return Response.json(
        {
          success: false,
          code: "EMAIL_ALREADY_REGISTERED",
          message: "Email sudah terdaftar. Silakan login.",
        },
        { status: 409 }
      );
    } catch (error) {
      if (error?.code !== "auth/user-not-found") {
        throw error;
      }
    }

    const now = Date.now();
    const documentId = getOtpDocumentId(email);
    const ref = adminDb.collection("EmailVerificationOTP").doc(documentId);
    const existing = await ref.get();

    if (existing.exists) {
      const data = existing.data();

      if (Number(data?.resendAvailableAt || 0) > now) {
        const seconds = Math.ceil(
          (Number(data.resendAvailableAt) - now) / 1000
        );

        return Response.json(
          {
            success: false,
            code: "OTP_COOLDOWN",
            message: `Tunggu ${seconds} detik sebelum mengirim ulang OTP.`,
            retryAfter: seconds,
          },
          { status: 429 }
        );
      }
    }

    const otp = generateOtp();

    await ref.set({
      email,
      otpHash: hashOtp(email, otp),
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      createdAt: now,
      expiresAt: now + OTP_EXPIRES_MS,
      resendAvailableAt: now + OTP_RESEND_MS,
    });

    try {
      await sendEmail({
        to: email,
        subject: "Your Rafi Picture Verification Code",
        fromName: "Rafi Picture",
        text: [
          "Your Rafi Picture verification code is:",
          "",
          otp,
          "",
          "This code expires in 5 minutes.",
          "",
          "If you did not request this code, you can ignore this email.",
        ].join("\n"),
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#222;">
            <h2 style="margin:0 0 8px;">Rafi Picture</h2>
            <p style="margin:0 0 24px;line-height:1.6;">
              Verify your email address using the code below.
            </p>

            <div style="margin:28px 0;padding:20px;text-align:center;font-size:34px;font-weight:700;letter-spacing:10px;background:#f5f5f5;border-radius:12px;">
              ${otp}
            </div>

            <p style="line-height:1.6;">
              This code will expire in <strong>5 minutes</strong>.
            </p>

            <p style="color:#777;font-size:13px;line-height:1.6;margin-top:32px;">
              If you did not request this verification code,
              you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      await ref.delete().catch(() => {});
      throw emailError;
    }

    return Response.json({
      success: true,
      message: "OTP berhasil dikirim.",
      expiresIn: Math.floor(OTP_EXPIRES_MS / 1000),
      resendAfter: Math.floor(OTP_RESEND_MS / 1000),
    });
  } catch (error) {
    console.error("OTP request error:", error);

    return Response.json(
      { success: false, message: "Gagal mengirim OTP." },
      { status: 500 }
    );
  }
}
