"use client";

import AppIcon from "@/components/global/AppIcon";

const EMPTY_VALUE = "Belum diisi";

function getDisplayValue(value) {
  const normalizedValue = String(value ?? "").trim();

  return normalizedValue || EMPTY_VALUE;
}

function formatEventDate(value) {
  if (!value) return EMPTY_VALUE;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value, currency = "IDR") {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return EMPTY_VALUE;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function getPackagePrice(packageItem) {
  if (packageItem?.priceLabel) {
    return packageItem.priceLabel;
  }

  return formatCurrency(
    packageItem?.price,
    packageItem?.currency || "IDR",
  );
}

function getPackageHighlights(packageItem) {
  if (Array.isArray(packageItem?.serviceHighlights)) {
    return packageItem.serviceHighlights
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (Array.isArray(packageItem?.features)) {
    return packageItem.features
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeInstagram(value) {
  const instagram = String(value ?? "").trim();

  if (!instagram) return EMPTY_VALUE;

  return instagram.startsWith("@")
    ? instagram
    : `@${instagram}`;
}

export default function BookConfirm({
  formData,
  selectedPackage,
  submitStatus,
}) {
  const personalData = formData?.personal ?? {};
  const eventData = formData?.event ?? {};

  const packageHighlights =
    getPackageHighlights(selectedPackage);

  const isSubmitting = submitStatus === "loading";
  const isSuccess = submitStatus === "success";

  return (
    <div>
      <header className="mb-stack-lg text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <AppIcon name="fact_check" size={30} />
        </div>

        <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-secondary">
          Konfirmasi Booking
        </p>

        <h2 className="font-headline-md text-headline-md text-on-surface">
          Periksa Kembali Data Anda
        </h2>

        <p className="mx-auto mt-3 max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Pastikan informasi pemesan, detail acara, dan
          paket yang dipilih sudah benar sebelum
          mengirim permintaan booking.
        </p>
      </header>

      <div className="space-y-5">
        {/* PERSONAL INFORMATION */}

        <ConfirmationSection
          icon="person"
          title="Data Pemesan"
          description="Informasi utama yang akan digunakan untuk proses booking."
        >
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            <ConfirmationRow
              label="Nama lengkap"
              value={getDisplayValue(
                personalData.fullName,
              )}
            />

            <ConfirmationRow
              label="Nama pasangan"
              value={getDisplayValue(
                personalData.partnerName,
              )}
              optional
            />

            <ConfirmationRow
              label="Email"
              value={getDisplayValue(
                personalData.email,
              )}
            />

            <ConfirmationRow
              label="Nomor telepon"
              value={getDisplayValue(
                personalData.phone,
              )}
            />

            <ConfirmationRow
              label="Instagram"
              value={normalizeInstagram(
                personalData.instagram,
              )}
              optional
              fullWidth
            />
          </div>
        </ConfirmationSection>

        {/* EVENT INFORMATION */}

        <ConfirmationSection
          icon="event"
          title="Detail Acara"
          description="Informasi ini digunakan untuk memeriksa jadwal dan kebutuhan acara."
        >
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            <ConfirmationRow
              label="Tanggal acara"
              value={formatEventDate(
                eventData.eventDate,
              )}
            />

            <ConfirmationRow
              label="Lokasi acara"
              value={getDisplayValue(
                eventData.location,
              )}
            />

            <ConfirmationRow
              label="Konsep atau kebutuhan acara"
              value={getDisplayValue(
                eventData.vision,
              )}
              optional
              fullWidth
              multiline
            />
          </div>
        </ConfirmationSection>

        {/* PACKAGE INFORMATION */}

        <ConfirmationSection
          icon="photo_camera"
          title="Paket Dokumentasi"
          description="Rincian paket yang akan diajukan bersama permintaan booking."
        >
          {selectedPackage ? (
            <div>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-headline-md text-headline-md text-on-surface">
                      {selectedPackage.name}
                    </h3>

                    {selectedPackage.featured && (
                      <span className="rounded-full bg-secondary-container px-3 py-1 font-label-sm text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                        Most Popular
                      </span>
                    )}
                  </div>

                  {selectedPackage.description && (
                    <p className="mt-3 max-w-3xl font-body-md text-body-md text-on-surface-variant">
                      {selectedPackage.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0 rounded-xl bg-surface-container px-5 py-4 lg:text-right">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Harga paket
                  </p>

                  <p className="mt-1 font-headline-sm text-headline-sm text-primary">
                    {getPackagePrice(selectedPackage)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Number(
                  selectedPackage.durationHours,
                ) > 0 && (
                  <PackageInformation
                    icon="schedule"
                    label="Durasi liputan"
                    value={`${selectedPackage.durationHours} jam`}
                  />
                )}

                <PackageInformation
                  icon="payments"
                  label="Mata uang"
                  value={
                    selectedPackage.currency || "IDR"
                  }
                />
              </div>

              {packageHighlights.length > 0 && (
                <div className="mt-6 border-t border-outline-variant/30 pt-5">
                  <p className="font-label-md text-label-md text-on-surface">
                    Layanan yang termasuk
                  </p>

                  <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {packageHighlights.map(
                      (highlight, index) => (
                        <li
                          key={`${highlight}-${index}`}
                          className="flex items-start gap-3 rounded-lg bg-surface-container-low px-4 py-3"
                        >
                          <AppIcon
                            name="check_circle"
                            size={19}
                            className="mt-0.5 shrink-0 text-secondary"
                          />

                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {highlight}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-error/25 bg-error-container/40 px-5 py-4">
              <AppIcon
                name="error"
                size={21}
                className="mt-0.5 shrink-0 text-error"
              />

              <div>
                <p className="font-label-md text-label-md text-on-surface">
                  Paket belum dipilih
                </p>

                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  Kembali ke tahap paket dan pilih salah
                  satu paket sebelum mengirim booking.
                </p>
              </div>
            </div>
          )}
        </ConfirmationSection>
      </div>

      {/* IMPORTANT INFORMATION */}

      <div className="mt-stack-md rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <AppIcon name="info" size={21} />
          </span>

          <div>
            <h3 className="font-label-md text-label-md text-on-surface">
              Informasi sebelum mengirim
            </h3>

            <ul className="mt-2 space-y-2 font-body-sm text-body-sm text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                <span>
                  Pengiriman formulir belum menjamin
                  ketersediaan tanggal acara.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                <span>
                  Tim akan meninjau jadwal, lokasi, dan
                  kebutuhan acara terlebih dahulu.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                <span>
                  Harga yang ditampilkan merupakan harga
                  paket dan dapat berubah jika terdapat
                  kebutuhan tambahan.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                <span>
                  Tim akan menghubungi Anda melalui email
                  atau nomor telepon yang dicantumkan.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div
          role="status"
          className="mt-5 flex items-center justify-center gap-3 rounded-xl bg-surface-container-low px-5 py-4"
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />

          <p className="font-label-md text-label-md text-on-surface-variant">
            Mengirim permintaan booking...
          </p>
        </div>
      )}

      {isSuccess && (
        <div
          role="status"
          className="mt-5 flex items-start gap-3 rounded-xl border border-secondary/25 bg-secondary-container/50 px-5 py-4"
        >
          <AppIcon
            name="check_circle"
            size={22}
            className="mt-0.5 shrink-0 text-secondary"
          />

          <div>
            <p className="font-label-md text-label-md text-on-surface">
              Permintaan booking berhasil dikirim
            </p>

            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Data Anda telah diterima dan akan ditinjau
              oleh tim.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmationSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface">
      <header className="flex items-start gap-4 border-b border-outline-variant/25 bg-surface-container-low/50 px-5 py-4 sm:px-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <AppIcon name={icon} size={20} />
        </span>

        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            {title}
          </h3>

          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            {description}
          </p>
        </div>
      </header>

      <div className="px-5 py-2 sm:px-6">
        {children}
      </div>
    </section>
  );
}

function ConfirmationRow({
  label,
  value,
  optional = false,
  fullWidth = false,
  multiline = false,
}) {
  const isEmpty = value === EMPTY_VALUE;

  return (
    <div
      className={`border-b border-outline-variant/20 py-4 ${
        fullWidth ? "sm:col-span-2" : ""
      }`}
    >
      <div
        className={
          multiline
            ? "flex flex-col gap-2"
            : "flex items-start justify-between gap-5"
        }
      >
        <div className="shrink-0">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            {label}
          </p>

          {optional && (
            <span className="mt-1 block font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant/60">
              Opsional
            </span>
          )}
        </div>

        <p
          className={`break-words font-label-md text-label-md ${
            multiline
              ? "max-w-3xl text-left"
              : "min-w-0 text-right"
          } ${
            isEmpty
              ? "italic text-on-surface-variant/60"
              : "text-on-surface"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function PackageInformation({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-container-low px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <AppIcon name={icon} size={18} />
      </span>

      <div>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {label}
        </p>

        <p className="mt-0.5 font-label-md text-label-md text-on-surface">
          {value}
        </p>
      </div>
    </div>
  );
}