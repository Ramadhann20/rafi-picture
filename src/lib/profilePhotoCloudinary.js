import { v2 as cloudinary } from "cloudinary";

const PROFILE_FOLDER =
  process.env.CLOUDINARY_PROFILE_FOLDER?.trim() ||
  "rafi-picture/profiles";

function requireCloudinaryConfig() {
  if (!process.env.CLOUDINARY_URL?.trim()) {
    throw new Error(
      "[Cloudinary] CLOUDINARY_URL belum dikonfigurasi.",
    );
  }
}

function sanitizeId(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "user";
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
              "[Cloudinary] Upload foto selesai tanpa response.",
            ),
          );
          return;
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });
}

export async function uploadProfileImageBuffer({
  buffer,
  uid,
}) {
  requireCloudinaryConfig();

  if (!Buffer.isBuffer(buffer)) {
    throw new Error(
      "[Cloudinary] Foto profil harus berupa Buffer.",
    );
  }

  const safeUid = sanitizeId(uid);

  const result = await uploadStream(buffer, {
    resource_type: "image",
    type: "upload",
    folder: PROFILE_FOLDER,
    public_id: `user-${safeUid}`,
    overwrite: true,
    invalidate: true,
    tags: ["rafi-picture", "profile-photo"],
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width ?? null,
    height: result.height ?? null,
    bytes: result.bytes ?? buffer.length,
    version: result.version ?? null,
  };
}
