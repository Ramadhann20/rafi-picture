"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import AppIcon from "@/components/global/AppIcon";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
]);

function getInitials(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "RP";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfilePhotoEditor({
  user,
  currentPhotoURL = null,
  displayName = "Rafi Picture",
  onClose,
}) {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewURL("");
      return undefined;
    }

    const objectURL = URL.createObjectURL(file);
    setPreviewURL(objectURL);

    return () => {
      URL.revokeObjectURL(objectURL);
    };
  }, [file]);

  function handleFile(nextFile) {
    setError("");

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!ALLOWED_TYPES.has(nextFile.type)) {
      setError(
        "Foto harus berformat JPG, JPEG, atau PNG.",
      );
      return;
    }

    if (
      nextFile.size <= 0 ||
      nextFile.size > MAX_FILE_SIZE
    ) {
      setError("Ukuran foto maksimal 4 MB.");
      return;
    }

    setFile(nextFile);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user || !file || submitting) return;

    setError("");
    setSubmitting(true);

    try {
      const token = await user.getIdToken();

      const body = new FormData();
      body.append("file", file);

      const response = await fetch(
        "/api/profile/photo",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body,
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            "Foto profil gagal diunggah.",
        );
      }

      onClose?.();
    } catch (uploadError) {
      console.error(
        "PROFILE PHOTO CLIENT ERROR:",
        uploadError,
      );

      setError(
        uploadError?.message ||
          "Foto profil gagal diunggah.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const imageURL =
    previewURL || currentPhotoURL || null;

  return (
    <section className="w-[min(92vw,480px)] overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-outline-variant/20 bg-surface-container-low/70 px-5 py-5 sm:px-6">
        <div>
          <p className="font-label-sm text-[10px] uppercase tracking-[0.2em] text-secondary">
            Profil Akun
          </p>

          <h2 className="mt-1 font-headline-md text-headline-md text-primary">
            Ubah Foto Profil
          </h2>

          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            JPG, JPEG, atau PNG. Maksimal 4 MB.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Tutup upload foto profil"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary disabled:opacity-50"
        >
          <AppIcon name="close" size={21} />
        </button>
      </header>

      <form
        onSubmit={handleSubmit}
        className="p-5 sm:p-6"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-surface-container-high bg-surface-container-highest font-headline-md text-headline-md text-primary shadow-sm">
            {imageURL ? (
              <img
                src={imageURL}
                alt={`Foto profil ${displayName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(displayName)
            )}
          </div>

          <p className="mt-4 font-label-md text-label-md text-on-surface">
            {displayName}
          </p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={submitting}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-5 py-3 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low disabled:opacity-50"
          >
            <AppIcon name="photo_camera" size={19} />
            Pilih Foto
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(event) =>
              handleFile(event.target.files?.[0] ?? null)
            }
          />

          {file && (
            <div className="mt-3 rounded-lg bg-surface-container-low px-4 py-2 font-body-sm text-body-sm text-on-surface-variant">
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-error/25 bg-error-container/50 px-4 py-3 font-body-sm text-body-sm text-error"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-outline-variant px-5 py-3 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={!file || submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-label-md text-label-md text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <AppIcon name="check" size={18} />
            {submitting ? "Mengunggah..." : "Simpan Foto"}
          </button>
        </div>
      </form>
    </section>
  );
}
