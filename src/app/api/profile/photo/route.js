import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebase-admin";
import {
  uploadProfileImageBuffer,
} from "@/lib/profilePhotoCloudinary";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
]);

function getBearerToken(request) {
  const authorization =
    request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

function isJpeg(buffer) {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  );
}

function isPng(buffer) {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

function matchesFileSignature(buffer, mimeType) {
  if (mimeType === "image/jpeg") {
    return isJpeg(buffer);
  }

  if (mimeType === "image/png") {
    return isPng(buffer);
  }

  return false;
}

export async function POST(request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { message: "Sesi login tidak tersedia." },
        { status: 401 },
      );
    }

    const decodedToken =
      await adminAuth.verifyIdToken(token);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Pilih foto profil terlebih dahulu." },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          message:
            "Foto profil harus berformat JPG, JPEG, atau PNG.",
        },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message:
            "Ukuran foto profil maksimal 4 MB.",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(
      await file.arrayBuffer(),
    );

    if (!matchesFileSignature(buffer, file.type)) {
      return NextResponse.json(
        {
          message:
            "Isi file tidak sesuai dengan format gambar yang dipilih.",
        },
        { status: 400 },
      );
    }

    const uploaded =
      await uploadProfileImageBuffer({
        buffer,
        uid: decodedToken.uid,
      });

    await adminDb
      .collection("Users")
      .doc(decodedToken.uid)
      .set(
        {
          photoURL: uploaded.secureUrl,
          profilePhotoPublicId:
            uploaded.publicId,
          profilePhotoUpdatedAt:
            FieldValue.serverTimestamp(),
          updatedAt:
            FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return NextResponse.json({
      ok: true,
      photoURL: uploaded.secureUrl,
    });
  } catch (error) {
    console.error(
      "PROFILE PHOTO UPLOAD ERROR:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Foto profil gagal diunggah. Coba lagi.",
      },
      { status: 500 },
    );
  }
}
