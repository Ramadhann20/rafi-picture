"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";

export const CREW_ROLE_OPTIONS = [
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "assistant_photographer", label: "Assistant Photographer" },
];

export const CREW_EMPLOYMENT_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
];

const inputClassName =
  "w-full rounded-lg border border-outline-variant bg-transparent px-4 py-3 font-body-md text-body-md text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

function getRoleValue(crew) {
  const role = crew?.baseRole ?? crew?.role ?? null;

  if (!crew) return "photographer";
  if (role === "lead_photographer") return "photographer";

  return CREW_ROLE_OPTIONS.some((option) => option.value === role)
    ? role
    : "";
}

function createInitialForm(crew, mode) {
  return {
    name: crew?.name ?? "",
    email: crew?.email ?? "",
    phone: crew?.phone ?? "",
    baseRole: getRoleValue(crew),
    employmentStatus:
      crew?.employmentStatus ?? (mode === "freelance" ? "active" : "active"),
    skills: Array.isArray(crew?.skills) ? crew.skills.join(", ") : "",
    notes: crew?.notes ?? "",
  };
}

function normalizeDateKey(value) {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  const key = normalizeDateKey(value);
  if (!key) return "-";

  const [year, month, day] = key.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function getLocationLabel(location) {
  if (typeof location === "string") return location.trim() || "-";

  return (
    String(location?.venueName ?? location?.addressLabel ?? "").trim() || "-"
  );
}

function getAssignmentDate(assignment) {
  return assignment?.eventDate ?? assignment?.date ?? assignment?.scheduleDate ?? null;
}

function getAssignmentTitle(assignment) {
  return (
    assignment?.title ||
    assignment?.task ||
    assignment?.packageName ||
    "Photography Assignment"
  );
}

function assignmentHasCrew(assignment, crewId) {
  if (!crewId) return false;

  const crewIds = Array.isArray(assignment?.crewIds)
    ? assignment.crewIds
    : Array.isArray(assignment?.assignedCrewIds)
      ? assignment.assignedCrewIds
      : [];

  return crewIds.includes(crewId);
}

export default function CrewDetails({
  crew = null,
  assignments = [],
  mode = "edit",
  booking = null,
  onClose,
  onSubmit,
}) {
  const isCreate = mode === "create" || mode === "freelance";
  const isFreelance = mode === "freelance";

  const [form, setForm] = useState(() => createInitialForm(crew, mode));
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const crewAssignments = useMemo(() => {
    if (!crew?.id) return [];

    return assignments
      .filter((assignment) => assignmentHasCrew(assignment, crew.id))
      .sort((a, b) =>
        String(normalizeDateKey(getAssignmentDate(b)) || "").localeCompare(
          String(normalizeDateKey(getAssignmentDate(a)) || ""),
        ),
      );
  }, [assignments, crew?.id]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError("");
  }

  function validate() {
    const errors = {};

    if (!form.name.trim()) errors.name = "Nama crew wajib diisi.";

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      errors.email = "Format email tidak valid.";
    }

    if (!CREW_ROLE_OPTIONS.some((option) => option.value === form.baseRole)) {
      errors.baseRole = "Pilih role crew yang valid.";
    }

    if (
      !CREW_EMPLOYMENT_OPTIONS.some(
        (option) => option.value === form.employmentStatus,
      )
    ) {
      errors.employmentStatus = "Pilih status crew yang valid.";
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validate();
    setFieldErrors(errors);
    setSubmitError("");

    if (Object.keys(errors).length > 0 || submitting) return;

    const skills = form.skills
      .split(",")
      .map((value) => value.trim().toLowerCase().replace(/\s+/g, "_"))
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase() || null,
      phone: form.phone.trim() || null,
      baseRole: form.baseRole,
      employmentStatus: form.employmentStatus,
      skills: [...new Set(skills)],
      notes: form.notes.trim() || null,
    };

    setSubmitting(true);

    try {
      await onSubmit?.(payload);
    } catch (error) {
      console.error("SAVE CREW ERROR:", error);
      setSubmitError(error?.message || "Data crew gagal disimpan.");
    } finally {
      setSubmitting(false);
    }
  }

  const title = isFreelance
    ? "Tambah Freelance"
    : isCreate
      ? "Tambah Crew Studio"
      : "Crew Details";

  return (
    <section className="flex max-h-[calc(100dvh-2rem)] w-[min(96vw,980px)] flex-col overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
      <header className="flex shrink-0 items-start justify-between gap-5 border-b border-outline-variant/20 bg-surface-container-low/70 px-5 py-5 sm:px-7">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <AppIcon name={isFreelance ? "person_add" : "person"} size={23} />
          </span>

          <div className="min-w-0">
            <p className="font-label-sm text-[10px] uppercase tracking-[0.2em] text-secondary">
              {isFreelance ? "Temporary Crew" : "Crew Management"}
            </p>

            <h2 className="mt-1 font-headline-md text-headline-md text-primary">
              {title}
            </h2>

            <p className="mt-1 max-w-2xl font-body-sm text-body-sm text-on-surface-variant">
              {isFreelance
                ? `Freelance hanya berlaku untuk ${booking?.bookingCode || booking?.package?.name || "booking ini"} dan akan dibersihkan saat acara berstatus selesai.`
                : isCreate
                  ? "Tambahkan anggota crew studio dan tentukan role serta status kerjanya."
                  : "Ubah informasi crew, role, status kerja, dan lihat riwayat assignment."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Tutup Crew Details"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary disabled:opacity-50"
        >
          <AppIcon name="close" size={21} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <section className="glass-panel rounded-xl p-5 sm:p-6">
              <div className="mb-5">
                <p className="font-label-sm text-[10px] uppercase tracking-[0.18em] text-secondary">
                  Crew Information
                </p>
                <h3 className="mt-1 font-headline-md text-headline-md text-on-surface">
                  Data Crew
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Nama Lengkap" error={fieldErrors.name} fullWidth>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    disabled={submitting}
                    className={inputClassName}
                    placeholder="Nama crew"
                  />
                </Field>

                <Field label="Email" error={fieldErrors.email}>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    disabled={submitting}
                    className={inputClassName}
                    placeholder="crew@email.com"
                  />
                </Field>

                <Field label="Nomor Telepon">
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    disabled={submitting}
                    className={inputClassName}
                    placeholder="08xxxxxxxxxx"
                  />
                </Field>

                <Field label="Role" error={fieldErrors.baseRole}>
                  <select
                    name="baseRole"
                    value={form.baseRole}
                    onChange={updateField}
                    disabled={submitting}
                    className={inputClassName}
                  >
                    <option value="">Pilih role crew</option>

                    {CREW_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Status" error={fieldErrors.employmentStatus}>
                  <select
                    name="employmentStatus"
                    value={form.employmentStatus}
                    onChange={updateField}
                    disabled={submitting}
                    className={inputClassName}
                  >
                    {CREW_EMPLOYMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Skills"
                  hint="Pisahkan dengan koma. Contoh: wedding, drone, lighting"
                  fullWidth
                >
                  <input
                    name="skills"
                    value={form.skills}
                    onChange={updateField}
                    disabled={submitting}
                    className={inputClassName}
                    placeholder="wedding, portrait, lighting"
                  />
                </Field>

                <Field label="Catatan" fullWidth>
                  <textarea
                    name="notes"
                    rows={4}
                    value={form.notes}
                    onChange={updateField}
                    disabled={submitting}
                    className={`${inputClassName} resize-y`}
                    placeholder="Catatan internal mengenai crew..."
                  />
                </Field>
              </div>
            </section>

            {isFreelance && booking && (
              <section className="rounded-xl border border-secondary/20 bg-secondary-container/25 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <AppIcon
                    name="calendar_month"
                    size={21}
                    className="mt-0.5 shrink-0 text-secondary"
                  />

                  <div>
                    <p className="font-label-md text-label-md text-on-surface">
                      Berlaku untuk satu acara
                    </p>
                    <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                      {booking.package?.name || "Booking"} · {formatDate(
                        booking.event?.preferredDate,
                      )} · {getLocationLabel(booking.event?.location)}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="lg:col-span-5">
            <section className="glass-panel h-full rounded-xl p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="font-label-sm text-[10px] uppercase tracking-[0.18em] text-secondary">
                    Assignment
                  </p>
                  <h3 className="mt-1 font-headline-md text-headline-md text-on-surface">
                    Riwayat Tugas
                  </h3>
                </div>

                {!isCreate && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-label-sm text-label-sm text-primary">
                    {crewAssignments.length}
                  </span>
                )}
              </div>

              {isCreate ? (
                <EmptyAssignment
                  text={
                    isFreelance
                      ? "Freelance akan langsung dikaitkan ke booking ini setelah disimpan."
                      : "Assignment akan muncul setelah crew ditambahkan ke suatu booking."
                  }
                />
              ) : crewAssignments.length === 0 ? (
                <EmptyAssignment text="Crew ini belum memiliki assignment." />
              ) : (
                <div className="space-y-3">
                  {crewAssignments.map((assignment) => (
                    <article
                      key={assignment.id}
                      className="rounded-xl border border-outline-variant/20 bg-surface-container-low/45 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-label-md text-label-md text-on-surface">
                            {getAssignmentTitle(assignment)}
                          </p>
                          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                            {getLocationLabel(assignment.location)}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-[10px] uppercase text-on-surface-variant">
                          {String(assignment.status || "draft").replaceAll("_", " ")}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-on-surface-variant">
                        <AppIcon name="calendar_month" size={16} />
                        <span className="font-label-sm text-label-sm">
                          {formatDate(getAssignmentDate(assignment))}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>

        {submitError && (
          <div className="mx-5 mb-4 rounded-lg border border-error/25 bg-error-container/40 px-4 py-3 font-body-sm text-body-sm text-error sm:mx-7">
            {submitError}
          </div>
        )}

        <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-outline-variant/20 bg-surface/95 px-5 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-outline-variant px-6 py-3 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <AppIcon name={isCreate ? "person_add" : "check"} size={18} />
            {submitting
              ? "Menyimpan..."
              : isFreelance
                ? "Tambah Freelance"
                : isCreate
                  ? "Tambah Crew"
                  : "Simpan Perubahan"}
          </button>
        </footer>
      </form>
    </section>
  );
}

function Field({ label, hint, error, fullWidth = false, children }) {
  return (
    <div className={`space-y-2 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <label className="block font-label-md text-label-md text-on-surface-variant">
        {label}
      </label>
      {children}
      {error ? (
        <p className="font-body-sm text-body-sm text-error">{error}</p>
      ) : hint ? (
        <p className="font-body-sm text-[11px] text-on-surface-variant/70">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function EmptyAssignment({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant/40 px-5 py-8 text-center">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
        <AppIcon name="calendar_month" size={19} />
      </span>
      <p className="mt-3 font-body-sm text-body-sm text-on-surface-variant">
        {text}
      </p>
    </div>
  );
}
