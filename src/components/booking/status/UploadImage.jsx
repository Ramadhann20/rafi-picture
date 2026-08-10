"use client";

import { useEffect, useState } from "react";

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_TYPES =
  new Set([
    "image/png",
    "image/jpeg",
  ]);

export default function UploadImage({ onSubmit, onCancel }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileError, setFileError] = useState("");

  const isImageFile =
    selectedFile &&
    ALLOWED_TYPES.has(
      selectedFile.type,
    );

  useEffect(() => {
    if (!selectedFile || !isImageFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile, isImageFile]);

  const handleFileChange = (event) => {
    const file =
      event.target.files?.[0] ||
      null;

    setFileError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (
      !ALLOWED_TYPES.has(
        file.type,
      )
    ) {
      setSelectedFile(null);
      setFileError(
        "Bukti pembayaran harus berupa PNG, JPG, atau JPEG.",
      );
      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setSelectedFile(null);
      setFileError(
        "Ukuran file maksimal 5 MB.",
      );
      return;
    }

    setSelectedFile(file);
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-outline-variant/20 overflow-hidden fade-in-up">
      <div className="p-gutter">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline-md text-headline-md text-primary">
            Upload Proof of Transfer
          </h2>

          <button
            type="button"
            onClick={onCancel}
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            close
          </button>
        </div>

        <label className="border-2 border-dashed border-outline-variant/50 rounded-xl overflow-hidden text-center flex flex-col items-center justify-center bg-surface-container-low/50 hover:bg-surface-container-low transition-colors cursor-pointer min-h-[280px]">
          <input
            className="hidden"
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileChange}
          />

          {selectedFile ? (
            <div className="w-full">
              {isImageFile &&
                previewUrl && (
                <div className="w-full h-[260px] bg-white">
                  <img
                    src={previewUrl}
                    alt="Selected payment proof preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="border-t border-outline-variant/30 px-4 py-3 bg-white">
                <p className="font-label-sm text-label-sm text-on-surface-variant break-all">
                  {selectedFile.name}
                </p>

                <p className="font-label-sm text-label-sm text-primary mt-1">
                  Click the box to change file
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[32px]">
                  cloud_upload
                </span>
              </div>

              <div>
                <p className="font-body-md text-on-surface font-medium">
                  Click to upload or drag and drop
                </p>

                <p className="font-label-sm text-on-surface-variant mt-1">
                  Supported formats: JPG, JPEG, PNG (Max 5MB)
                </p>
              </div>

              <span className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2 rounded-lg">
                Select File
              </span>
            </div>
          )}
        </label>

        {fileError && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-error"
          >
            {fileError}
          </p>
        )}

        <div className="mt-8 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors px-4 py-2"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onSubmit(selectedFile)}
            disabled={!selectedFile}
            className={`font-label-md text-label-md px-8 py-3 rounded-lg transition-all ${
              selectedFile
                ? "bg-primary text-on-primary hover:bg-opacity-90"
                : "bg-surface-container-highest text-on-surface-variant cursor-not-allowed"
            }`}
          >
            Submit Proof
          </button>
        </div>
      </div>
    </div>
  );
}