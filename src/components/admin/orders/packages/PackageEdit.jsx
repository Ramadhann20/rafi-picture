"use client";

import { useEffect, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";

const inputClassName =
  "w-full rounded-lg border border-outline-variant bg-transparent px-4 py-3 font-body-md text-body-md text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

function createInitialForm(packageItem, defaultCategoryId, categories) {
  const fallbackCategoryId =
    defaultCategoryId ||
    getCategoryId(categories.find((category) => category.isActive)) ||
    getCategoryId(categories[0]);

  return {
    packageCategoryId:
      packageItem?.packageCategoryId || fallbackCategoryId,
    name: packageItem?.name || "",
    description: packageItem?.description || "",
    serviceHighlights: Array.isArray(packageItem?.serviceHighlights)
      ? packageItem.serviceHighlights
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 6)
      : [],
    price:
      packageItem?.price === undefined || packageItem?.price === null
        ? ""
        : String(packageItem.price),
    durationHours:
      packageItem?.durationHours === undefined ||
      packageItem?.durationHours === null
        ? ""
        : String(packageItem.durationHours),
    bookingSubjectType:
      ["individual", "couple"].includes(packageItem?.bookingSubjectType)
        ? packageItem.bookingSubjectType
        : "",
    status: packageItem?.status || "active",
    featured: Boolean(packageItem?.featured),
    sortOrder:
      packageItem?.sortOrder === undefined || packageItem?.sortOrder === null
        ? "1"
        : String(packageItem.sortOrder),
    coverUrl: packageItem?.cover?.url || "",
    coverStoragePath: packageItem?.cover?.storagePath || "",
    coverAlt: packageItem?.cover?.alt || "",
  };
}

function getCategoryId(category) {
  return category?.docId || category?.id || "";
}

function isValidHttpUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateForm(form, categories) {
  const errors = {};
  const price = Number(form.price);
  const durationHours = Number(form.durationHours);
  const sortOrder = Number(form.sortOrder);
  const highlights = form.serviceHighlights;
  const selectedCategory = categories.find(
    (category) => getCategoryId(category) === form.packageCategoryId,
  );

  if (!selectedCategory) {
    errors.packageCategoryId = "Select a valid package category.";
  }

  if (!form.name.trim()) {
    errors.name = "Package name is required.";
  } else if (form.name.trim().length > 100) {
    errors.name = "Package name cannot exceed 100 characters.";
  }

  if (!form.description.trim()) {
    errors.description = "Package description is required.";
  } else if (form.description.trim().length > 1000) {
    errors.description = "Description cannot exceed 1,000 characters.";
  }

  if (!["individual", "couple"].includes(form.bookingSubjectType)) {
    errors.bookingSubjectType =
      "Select whether this package is for an individual or a couple.";
  }

  if (highlights.length === 0) {
    errors.serviceHighlights = "Add at least one service highlight.";
  } else if (highlights.length > 6) {
    errors.serviceHighlights = "Use a maximum of six service highlights.";
  } else if (highlights.some((item) => item.length > 120)) {
    errors.serviceHighlights =
      "Each service highlight must be 120 characters or fewer.";
  }

  if (
    form.price === "" ||
    !Number.isFinite(price) ||
    !Number.isInteger(price) ||
    price < 0
  ) {
    errors.price = "Enter a valid whole-number price.";
  }

  if (
    form.durationHours === "" ||
    !Number.isFinite(durationHours) ||
    !Number.isInteger(durationHours) ||
    durationHours <= 0
  ) {
    errors.durationHours = "Duration must be a whole number above zero.";
  }

  if (
    form.sortOrder === "" ||
    !Number.isFinite(sortOrder) ||
    !Number.isInteger(sortOrder) ||
    sortOrder < 1
  ) {
    errors.sortOrder = "Display order must be a whole number starting at 1.";
  }

  if (!isValidHttpUrl(form.coverUrl.trim())) {
    errors.coverUrl = "Cover URL must start with http:// or https://.";
  }

  return errors;
}

function ServiceHighlightPill({ text, onRemove, disabled }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-black px-3 py-1.5 font-label-sm text-label-sm text-white">
      <span className="truncate">{text}</span>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${text}`}
        className="inline-flex shrink-0 items-center justify-center rounded-full text-white/70 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <AppIcon name="close" size={14} />
      </button>
    </span>
  );
}

export default function PackageEdit({
  packageItem = null,
  categories = [],
  defaultCategoryId = "",
  submitting = false,
  submitError = "",
  onCancel,
  onSubmit,
}) {
  const isEditing = Boolean(packageItem?.id);

  const selectableCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.isActive ||
          getCategoryId(category) === packageItem?.packageCategoryId,
      ),
    [categories, packageItem?.packageCategoryId],
  );

  const initialForm = useMemo(
    () =>
      createInitialForm(
        packageItem,
        defaultCategoryId,
        selectableCategories,
      ),
    [packageItem, defaultCategoryId, selectableCategories],
  );

  const [form, setForm] = useState(initialForm);
  const [serviceHighlightInput, setServiceHighlightInput] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setForm(initialForm);
    setServiceHighlightInput("");
    setFieldErrors({});
  }, [initialForm]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function updateServiceHighlightInput(event) {
    setServiceHighlightInput(event.target.value);
    setFieldErrors((current) => ({
      ...current,
      serviceHighlights: undefined,
    }));
  }

  function addServiceHighlight() {
    const highlight = serviceHighlightInput.trim();

    if (!highlight) return;

    if (form.serviceHighlights.length >= 6) {
      setFieldErrors((current) => ({
        ...current,
        serviceHighlights: "Use a maximum of six service highlights.",
      }));
      return;
    }

    if (highlight.length > 120) {
      setFieldErrors((current) => ({
        ...current,
        serviceHighlights:
          "Each service highlight must be 120 characters or fewer.",
      }));
      return;
    }

    const alreadyExists = form.serviceHighlights.some(
      (item) => item.toLowerCase() === highlight.toLowerCase(),
    );

    if (alreadyExists) {
      setFieldErrors((current) => ({
        ...current,
        serviceHighlights: "This service highlight has already been added.",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      serviceHighlights: [...current.serviceHighlights, highlight],
    }));
    setServiceHighlightInput("");
    setFieldErrors((current) => ({
      ...current,
      serviceHighlights: undefined,
    }));
  }

  function handleServiceHighlightKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addServiceHighlight();
      return;
    }

    if (
      event.key === "Backspace" &&
      !serviceHighlightInput &&
      form.serviceHighlights.length > 0
    ) {
      setForm((current) => ({
        ...current,
        serviceHighlights: current.serviceHighlights.slice(0, -1),
      }));
    }
  }

  function removeServiceHighlight(indexToRemove) {
    setForm((current) => ({
      ...current,
      serviceHighlights: current.serviceHighlights.filter(
        (_, index) => index !== indexToRemove,
      ),
    }));
    setFieldErrors((current) => ({
      ...current,
      serviceHighlights: undefined,
    }));
  }

  function selectCategory(packageCategoryId) {
    setForm((current) => ({ ...current, packageCategoryId }));
    setFieldErrors((current) => ({
      ...current,
      packageCategoryId: undefined,
    }));
  }

  function clearCover() {
    setForm((current) => ({
      ...current,
      coverUrl: "",
      coverStoragePath: "",
    }));
    setFieldErrors((current) => ({ ...current, coverUrl: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validateForm(form, selectableCategories);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0 || submitting) return;

    const name = form.name.trim();
    const coverUrl = form.coverUrl.trim() || null;
    const previousCoverUrl = packageItem?.cover?.url || null;
    const coverUrlChanged = coverUrl !== previousCoverUrl;

    const payload = {
      name,
      packageCategoryId: form.packageCategoryId,
      description: form.description.trim(),
      bookingSubjectType: form.bookingSubjectType,
      serviceHighlights: form.serviceHighlights,
      price: Number(form.price),
      durationHours: Number(form.durationHours),
      status: ["active", "inactive", "archived"].includes(form.status)
        ? form.status
        : "inactive",
      featured: Boolean(form.featured),
      sortOrder: Number(form.sortOrder),
      cover: {
        url: coverUrl,
        storagePath:
          coverUrl && !coverUrlChanged
            ? form.coverStoragePath.trim() || null
            : null,
        alt: form.coverAlt.trim() || `Paket ${name}`,
      },
    };

    await onSubmit?.(payload);
  }

  const coverPreview = form.coverUrl.trim();

  return (
    <section className="content-slide-enter-right">
      <header className="mb-stack-lg">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 font-label-md text-label-md text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <AppIcon name="arrow_back" size={20} />
          Back to Packages
        </button>

        <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-secondary">
          Packages
        </p>
        <h1 className="font-display-lg text-display-lg text-primary">
          {isEditing ? "Edit Package" : "Create Package"}
        </h1>
        <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
          {isEditing
            ? "Update the client-facing information and availability of this package."
            : "Create a package that can be displayed on the client booking page."}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="glass-panel mx-auto max-w-5xl space-y-stack-md rounded-xl p-5 sm:p-8 lg:p-stack-lg"
      >
        {selectableCategories.length === 0 && (
          <div
            role="alert"
            className="rounded-lg border border-error/25 bg-error-container px-4 py-3 font-body-md text-body-md text-on-surface"
          >
            No package category is available. Seed the PackageCategories
            collection first.
          </div>
        )}

        <fieldset className="space-y-4" disabled={submitting}>
          <legend className="font-label-md text-label-md text-on-surface-variant">
            Package Category
          </legend>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {selectableCategories.map((category) => {
              const categoryId = getCategoryId(category);
              const selected = form.packageCategoryId === categoryId;

              return (
                <button
                  key={categoryId}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectCategory(categoryId)}
                  className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border p-4 text-center transition-all ${
                    selected
                      ? "border-primary bg-secondary-container/30 ring-1 ring-primary"
                      : "border-outline-variant bg-surface hover:border-primary/50 hover:bg-surface-container-low"
                  }`}
                >
                  <AppIcon
                    name={category.icon || "photo_camera"}
                    size={24}
                    className="text-primary"
                  />
                  <span className="font-label-md text-label-md text-on-surface">
                    {category.name}
                  </span>
                  {!category.isActive && (
                    <span className="font-label-sm text-[10px] uppercase tracking-wider text-error">
                      Inactive category
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {fieldErrors.packageCategoryId && (
            <p className="text-sm text-error">
              {fieldErrors.packageCategoryId}
            </p>
          )}
        </fieldset>

        <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="package-name"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Package Name
            </label>
            <input
              id="package-name"
              name="name"
              type="text"
              maxLength={100}
              value={form.name}
              onChange={updateField}
              disabled={submitting}
              className={inputClassName}
              placeholder="Example: Classic Union"
            />
            {fieldErrors.name && (
              <p className="text-sm text-error">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="package-description"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Description
            </label>
            <textarea
              id="package-description"
              name="description"
              rows={4}
              maxLength={1000}
              value={form.description}
              onChange={updateField}
              disabled={submitting}
              className={`${inputClassName} resize-y`}
              placeholder="Briefly explain the package and who it is suitable for."
            />
            <div className="flex items-center justify-between gap-3">
              {fieldErrors.description ? (
                <p className="text-sm text-error">
                  {fieldErrors.description}
                </p>
              ) : (
                <span />
              )}
              <span className="font-label-sm text-label-sm text-on-surface-variant/60">
                {form.description.length}/1000
              </span>
            </div>
          </div>

          <fieldset className="space-y-3 md:col-span-2">
            <legend className="block font-label-md text-label-md text-on-surface-variant">
              Booking Subject
            </legend>

            <p className="font-label-sm text-label-sm text-on-surface-variant/70">
              Controls whether the client booking form should ask for a partner name.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  value: "individual",
                  title: "Individual / Single",
                  description:
                    "For birthday, circumcision, personal events, and packages that do not require a partner.",
                },
                {
                  value: "couple",
                  title: "Couple / Partnered",
                  description:
                    "For prewedding, wedding, engagement, and other paired packages.",
                },
              ].map((option) => {
                const selected = form.bookingSubjectType === option.value;

                return (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      selected
                        ? "border-primary bg-secondary-container/25 ring-1 ring-primary"
                        : "border-outline-variant bg-surface hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="bookingSubjectType"
                        value={option.value}
                        checked={selected}
                        onChange={updateField}
                        disabled={submitting}
                        className="mt-1 h-4 w-4 border-outline text-primary focus:ring-primary/20"
                      />
                      <span>
                        <span className="block font-label-md text-label-md text-on-surface">
                          {option.title}
                        </span>
                        <span className="mt-1 block font-label-sm text-label-sm text-on-surface-variant">
                          {option.description}
                        </span>
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            {fieldErrors.bookingSubjectType && (
              <p className="text-sm text-error">
                {fieldErrors.bookingSubjectType}
              </p>
            )}
          </fieldset>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="package-highlights"
                className="block font-label-md text-label-md text-on-surface-variant"
              >
                Service Highlights
              </label>
              <span className="font-label-sm text-label-sm text-on-surface-variant/60">
                {form.serviceHighlights.length}/6
              </span>
            </div>

            {form.serviceHighlights.length > 0 && (
              <div className="flex flex-wrap gap-2" aria-live="polite">
                {form.serviceHighlights.map((highlight, index) => (
                  <ServiceHighlightPill
                    key={`${highlight}-${index}`}
                    text={highlight}
                    disabled={submitting}
                    onRemove={() => removeServiceHighlight(index)}
                  />
                ))}
              </div>
            )}

            <input
              id="package-highlights"
              type="text"
              maxLength={120}
              value={serviceHighlightInput}
              onChange={updateServiceHighlightInput}
              onKeyDown={handleServiceHighlightKeyDown}
              disabled={submitting || form.serviceHighlights.length >= 6}
              className={inputClassName}
              placeholder={
                form.serviceHighlights.length >= 6
                  ? "Maximum of six highlights reached"
                  : "Type a highlight and press Enter"
              }
              aria-invalid={Boolean(fieldErrors.serviceHighlights)}
              aria-describedby="package-highlights-help"
            />
            <p
              id="package-highlights-help"
              className="font-label-sm text-label-sm text-on-surface-variant/70"
            >
              Press Enter to create a badge. Press Backspace on an empty input
              to remove the last badge.
            </p>
            {fieldErrors.serviceHighlights && (
              <p className="text-sm text-error">
                {fieldErrors.serviceHighlights}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="package-price"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Base Price
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-body-md text-body-md text-on-surface-variant">
                Rp
              </span>
              <input
                id="package-price"
                name="price"
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                value={form.price}
                onChange={updateField}
                disabled={submitting}
                className={`${inputClassName} pl-12`}
                placeholder="0"
              />
            </div>
            {fieldErrors.price && (
              <p className="text-sm text-error">{fieldErrors.price}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="package-duration"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Coverage Duration
            </label>
            <div className="relative">
              <input
                id="package-duration"
                name="durationHours"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.durationHours}
                onChange={updateField}
                disabled={submitting}
                className={`${inputClassName} pr-20`}
                placeholder="8"
              />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-label-md text-label-md text-on-surface-variant">
                hours
              </span>
            </div>
            {fieldErrors.durationHours && (
              <p className="text-sm text-error">
                {fieldErrors.durationHours}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="package-sort-order"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Display Order
            </label>
            <input
              id="package-sort-order"
              name="sortOrder"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={form.sortOrder}
              onChange={updateField}
              disabled={submitting}
              className={inputClassName}
              placeholder="1"
            />
            {fieldErrors.sortOrder && (
              <p className="text-sm text-error">{fieldErrors.sortOrder}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="package-status"
              className="block font-label-md text-label-md text-on-surface-variant"
            >
              Availability
            </label>
            <select
              id="package-status"
              name="status"
              value={form.status}
              onChange={updateField}
              disabled={submitting}
              className={inputClassName}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              {isEditing && <option value="archived">Archived</option>}
            </select>
          </div>

          <label className="flex min-h-[50px] cursor-pointer items-center gap-3 self-end rounded-lg border border-outline-variant px-4 py-3 transition hover:bg-surface-container-low">
            <input
              name="featured"
              type="checkbox"
              checked={form.featured}
              onChange={updateField}
              disabled={submitting}
              className="h-4 w-4 rounded border-outline text-primary focus:ring-primary/20"
            />
            <span>
              <span className="block font-label-md text-label-md text-on-surface">
                Most Popular
              </span>
              <span className="block font-label-sm text-label-sm text-on-surface-variant">
                Show the popular label on the client package card.
              </span>
            </span>
          </label>
        </div>

        <section className="space-y-4">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">
              Package Cover
            </p>
            <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant/70">
              Use a public image URL until Firebase Storage is implemented.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="package-cover-url"
                className="block font-label-md text-label-md text-on-surface-variant"
              >
                Cover URL
              </label>
              <input
                id="package-cover-url"
                name="coverUrl"
                type="url"
                value={form.coverUrl}
                onChange={updateField}
                disabled={submitting}
                className={inputClassName}
                placeholder="https://example.com/package-cover.jpg"
              />
              {fieldErrors.coverUrl && (
                <p className="text-sm text-error">{fieldErrors.coverUrl}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="package-cover-alt"
                className="block font-label-md text-label-md text-on-surface-variant"
              >
                Alternative Text
              </label>
              <input
                id="package-cover-alt"
                name="coverAlt"
                type="text"
                maxLength={150}
                value={form.coverAlt}
                onChange={updateField}
                disabled={submitting}
                className={inputClassName}
                placeholder="Classic Union package cover"
              />
            </div>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-xl border border-dashed border-outline bg-surface-container">
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview}
                alt={form.coverAlt.trim() || form.name || "Package cover preview"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-surface-container to-surface-container-highest text-on-surface-variant/60">
                <AppIcon name="photo_camera" size={42} />
                <span className="font-label-md text-label-md">
                  No cover image
                </span>
              </div>
            )}

            {coverPreview && (
              <button
                type="button"
                onClick={clearCover}
                disabled={submitting}
                aria-label="Remove cover URL"
                title="Remove cover"
                className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <AppIcon name="close" size={18} />
              </button>
            )}
          </div>
        </section>

        {submitError && (
          <div
            role="alert"
            className="rounded-lg border border-error/25 bg-error-container px-4 py-3 font-body-md text-body-md text-on-surface"
          >
            {submitError}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/50 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg px-8 py-3 font-label-md text-label-md text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || selectableCategories.length === 0}
            className="inline-flex min-w-44 items-center justify-center gap-2 rounded-lg bg-primary px-10 py-3 font-label-md text-label-md text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
            ) : (
              <AppIcon name={isEditing ? "check" : "add"} size={18} />
            )}
            {submitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Package"}
          </button>
        </div>
      </form>
    </section>
  );
}