import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
  getOtpDocumentId,
  isOtpValid,
  normalizeEmail,
  OTP_MAX_ATTEMPTS,
} from "@/lib/auth/otp";

export const runtime = "nodejs";

function normalizeUsername(username, email) {
  const value = String(username || "").trim().replace(/\s+/g, " ");

  if (value) {
    return value.slice(0, 80);
  }

  return email.split("@")[0] || "User";
}

export async function POST(request) {
  try {
    const body = await request.json();

    const email = normalizeEmail(body?.email);
    const otp = String(body?.otp || "").trim();
    const password = String(body?.password || "");
    const username = normalizeUsername(body?.username, email);

    if (!email || !/^\d{6}$/.test(otp)) {
      return Response.json(
        {
          success: false,
          message: "Email atau kode OTP tidak valid.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        {
          success: false,
          code: "WEAK_PASSWORD",
          message: "Password minimal 8 karakter.",
        },
        { status: 400 }
      );
    }

    const documentId = getOtpDocumentId(email);
    const otpRef = adminDb
      .collection("EmailVerificationOTP")
      .doc(documentId);

    const snapshot = await otpRef.get();

    if (!snapshot.exists) {
      return Response.json(
        {
          success: false,
          code: "OTP_NOT_FOUND",
          message: "Kode OTP tidak ditemukan. Silakan kirim ulang.",
        },
        { status: 400 }
      );
    }

    const data = snapshot.data();
    const now = Date.now();

    if (data?.email !== email) {
      return Response.json(
        {
          success: false,
          code: "OTP_INVALID",
          message: "Kode OTP tidak valid.",
        },
        { status: 400 }
      );
    }

    if (now > Number(data?.expiresAt || 0)) {
      await otpRef.delete();

      return Response.json(
        {
          success: false,
          code: "OTP_EXPIRED",
          message: "Kode OTP sudah kedaluwarsa. Silakan minta kode baru.",
        },
        { status: 410 }
      );
    }

    const currentAttempts = Number(data?.attempts || 0);
    const maxAttempts = Number(
      data?.maxAttempts || OTP_MAX_ATTEMPTS
    );

    if (currentAttempts >= maxAttempts) {
      await otpRef.delete();

      return Response.json(
        {
          success: false,
          code: "OTP_TOO_MANY_ATTEMPTS",
          message:
            "Terlalu banyak percobaan. Silakan minta OTP baru.",
        },
        { status: 429 }
      );
    }

    const valid = isOtpValid(email, otp, data?.otpHash);

    if (!valid) {
      const attempts = currentAttempts + 1;
      const remaining = Math.max(maxAttempts - attempts, 0);

      if (remaining <= 0) {
        await otpRef.delete();

        return Response.json(
          {
            success: false,
            code: "OTP_TOO_MANY_ATTEMPTS",
            message:
              "Kode OTP salah dan batas percobaan telah habis. Silakan minta OTP baru.",
            remainingAttempts: 0,
          },
          { status: 429 }
        );
      }

      await otpRef.update({
        attempts,
      });

      return Response.json(
        {
          success: false,
          code: "OTP_INVALID",
          message: "Kode OTP salah.",
          remainingAttempts: remaining,
        },
        { status: 400 }
      );
    }

    try {
      await adminAuth.getUserByEmail(email);

      await otpRef.delete();

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

    let createdUser = null;

    try {
      createdUser = await adminAuth.createUser({
        email,
        password,
        displayName: username,
        emailVerified: true,
      });

      const userRef = adminDb
        .collection("Users")
        .doc(createdUser.uid);

      await userRef.set({
        uid: createdUser.uid,
        email,
        username,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        role: "customer",
        photoURL: null,
        emailVerified: true,
        authProvider: "password",

        // User baru belum menyetujui Terms of Service.
        TermsAgreed: false,
      });

      const customToken = await adminAuth.createCustomToken(
        createdUser.uid
      );

      await otpRef.delete();

      return Response.json({
        success: true,
        verified: true,
        accountCreated: true,
        customToken,
        message: "Email berhasil diverifikasi dan akun berhasil dibuat.",
      });
    } catch (registrationError) {
      if (createdUser?.uid) {
        await Promise.allSettled([
          adminDb.collection("Users").doc(createdUser.uid).delete(),
          adminAuth.deleteUser(createdUser.uid),
        ]);
      }

      if (
        registrationError?.code === "auth/email-already-exists"
      ) {
        await otpRef.delete().catch(() => {});

        return Response.json(
          {
            success: false,
            code: "EMAIL_ALREADY_REGISTERED",
            message: "Email sudah terdaftar. Silakan login.",
          },
          { status: 409 }
        );
      }

      throw registrationError;
    }
  } catch (error) {
    console.error("OTP verify/register error:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal memverifikasi OTP atau membuat akun.",
      },
      { status: 500 }
    );
  }
}
