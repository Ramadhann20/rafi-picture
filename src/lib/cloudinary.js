import { v2 as cloudinary } from "cloudinary";

const DEFAULT_INVOICE_FOLDER =
  process.env.CLOUDINARY_INVOICE_FOLDER?.trim() ||
  "rafi-picture/invoices";

const DEFAULT_PAYMENT_PROOF_FOLDER =
  process.env.CLOUDINARY_PAYMENT_PROOF_FOLDER?.trim() ||
  "rafi-picture/payment-proofs";

function requireCloudinaryUrl() {
  const value = process.env.CLOUDINARY_URL?.trim();

  if (!value) {
    throw new Error(
      "[Cloudinary] CLOUDINARY_URL belum dikonfigurasi."
    );
  }

  return value;
}

function normalizeBuffer(value) {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }

  throw new Error(
    "[Cloudinary] File harus berupa Buffer atau Uint8Array."
  );
}

function sanitizeSegment(value, fallback = "file") {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\.[^.]+$/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || fallback;
}

function sanitizeFolder(value) {
  return String(value ?? "")
    .split("/")
    .map((segment) => sanitizeSegment(segment, "folder"))
    .join("/");
}

function normalizePdfFileName(fileName) {
  const baseName = sanitizeSegment(fileName, "invoice");

  return `${baseName}.pdf`;
}

function uploadStream(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(
            new Error(
              "[Cloudinary] Upload selesai tanpa response."
            )
          );
          return;
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

/**
 * Upload PDF invoice ke Cloudinary.
 *
 * IMPORTANT:
 * PDF di Cloudinary sebaiknya memakai resource_type "image".
 * Cloudinary memang memperlakukan PDF sebagai image asset type agar
 * Media Library dapat mengenali/preview PDF dan kita tetap bisa
 * melakukan delivery PDF secara normal.
 *
 * `publicId` disimpan TANPA ekstensi .pdf.
 * Ekstensi tetap ada pada secure_url dan `fileName`.
 *
 * `publicId` sebaiknya stabil per invoice, contoh:
 * `INV-DP-2026-0001`
 */
export async function uploadPdfBuffer({
  buffer,
  fileName,
  publicId,
  folder = DEFAULT_INVOICE_FOLDER,
  overwrite = true,
  tags = [],
  context = {},
}) {
  requireCloudinaryUrl();

  const pdfBuffer = normalizeBuffer(buffer);
  const safeFolder = sanitizeFolder(folder);

  const resolvedFileName =
    normalizePdfFileName(
      fileName || publicId || "invoice"
    );

  const resolvedPublicId =
    sanitizeSegment(
      publicId || resolvedFileName,
      "invoice"
    );

  const result = await uploadStream(
    pdfBuffer,
    {
      resource_type: "image",
      type: "upload",
      folder: safeFolder,
      public_id: resolvedPublicId,
      overwrite,
      invalidate: overwrite,
      tags: [
        "rafi-picture",
        "invoice",
        ...tags,
      ],
      context: {
        original_file_name: resolvedFileName,
        ...context,
      },
    }
  );

  return {
    publicId: result.public_id,
    assetId: result.asset_id ?? null,
    secureUrl: result.secure_url,
    url: result.url,
    resourceType: result.resource_type,
    type: result.type,
    bytes: result.bytes ?? pdfBuffer.length,
    version: result.version ?? null,
    createdAt: result.created_at ?? null,
    fileName: resolvedFileName,
  };
}

function getImageExtension(contentType) {
  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/jpeg") {
    return "jpg";
  }

  throw new Error(
    "[Cloudinary] Bukti pembayaran harus PNG, JPG, atau JPEG."
  );
}

function normalizeImageFileName(fileName, contentType) {
  const extension =
    getImageExtension(contentType);

  const baseName =
    sanitizeSegment(
      fileName || "payment-proof",
      "payment-proof"
    );

  return `${baseName}.${extension}`;
}

/**
 * Upload bukti pembayaran sebagai IMAGE asset.
 *
 * Tidak memakai unsigned upload preset karena upload dilakukan
 * dari route server yang sudah terautentikasi.
 */
export async function uploadImageBuffer({
  buffer,
  fileName,
  contentType,
  publicId,
  folder = DEFAULT_PAYMENT_PROOF_FOLDER,
  overwrite = false,
  tags = [],
  context = {},
}) {
  requireCloudinaryUrl();

  const imageBuffer =
    normalizeBuffer(buffer);

  const normalizedContentType =
    String(contentType || "")
      .trim()
      .toLowerCase();

  const extension =
    getImageExtension(
      normalizedContentType
    );

  const safeFolder =
    sanitizeFolder(folder);

  const resolvedFileName =
    normalizeImageFileName(
      fileName || publicId || "payment-proof",
      normalizedContentType
    );

  const resolvedPublicId =
    sanitizeSegment(
      publicId || resolvedFileName,
      "payment-proof"
    );

  const result =
    await uploadStream(
      imageBuffer,
      {
        resource_type: "image",
        type: "upload",
        folder: safeFolder,
        public_id:
          resolvedPublicId,
        format: extension,
        overwrite,
        invalidate: overwrite,
        tags: [
          "rafi-picture",
          "payment-proof",
          ...tags,
        ],
        context: {
          original_file_name:
            resolvedFileName,
          original_content_type:
            normalizedContentType,
          ...context,
        },
      }
    );

  return {
    publicId:
      result.public_id,
    assetId:
      result.asset_id ?? null,
    secureUrl:
      result.secure_url,
    url:
      result.url,
    resourceType:
      result.resource_type,
    type:
      result.type,
    format:
      result.format ??
      extension,
    width:
      result.width ?? null,
    height:
      result.height ?? null,
    bytes:
      result.bytes ??
      imageBuffer.length,
    version:
      result.version ?? null,
    createdAt:
      result.created_at ?? null,
    fileName:
      resolvedFileName,
    contentType:
      normalizedContentType,
  };
}

export async function deleteImageAsset(publicId) {
  requireCloudinaryUrl();

  if (!publicId) {
    throw new Error(
      "[Cloudinary] publicId image wajib diisi."
    );
  }

  return cloudinary.uploader.destroy(
    publicId,
    {
      resource_type: "image",
      type: "upload",
      invalidate: true,
    }
  );
}

/**
 * Hapus PDF yang sudah disimpan.
 * Gunakan hanya jika memang ada aksi void/delete permanen.
 */
export async function deletePdfAsset(publicId) {
  requireCloudinaryUrl();

  if (!publicId) {
    throw new Error(
      "[Cloudinary] publicId wajib diisi."
    );
  }

  const result = await cloudinary.uploader.destroy(
    publicId,
    {
      resource_type: "image",
      type: "upload",
      invalidate: true,
    }
  );

  return result;
}

/**
 * Helper kecil untuk memastikan server berhasil membaca
 * CLOUDINARY_URL tanpa mengekspose API secret ke client.
 */
export function getCloudinaryServerStatus() {
  const configured = Boolean(
    process.env.CLOUDINARY_URL?.trim()
  );

  return {
    configured,
    invoiceFolder:
      DEFAULT_INVOICE_FOLDER,
    paymentProofFolder:
      DEFAULT_PAYMENT_PROOF_FOLDER,
  };
}
