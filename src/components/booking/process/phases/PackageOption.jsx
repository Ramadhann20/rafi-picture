"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { englishPackageTranslations } from "@/components/packages/PackageListing";
import SkeletonLoader from "@/components/global/SkeletonLoader";
import { useOverlay } from "@/context/ui/OverlayContext";
import { useLanguage } from "@/context/LanguageContext";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";

const COLLECTIONS = {
  categories: "PackageCategories",
};

const ALL_CATEGORY_ID = "all";

function getLocalizedPackage(packageItem, language) {
  const translation = englishPackageTranslations[packageItem?.id];

  if (language !== "en" || !translation) return packageItem;

  return {
    ...packageItem,
    description: translation.description,
    serviceHighlights: translation.features,
    features: translation.features,
  };
}

function formatCurrency(value) {
  const price = Number(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(price) ? price : 0);
}

function getPackageFeatures(packageItem) {
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

function getPackagePrice(packageItem) {
  if (packageItem?.priceLabel) {
    return packageItem.priceLabel;
  }

  return formatCurrency(packageItem?.price);
}

function normalizeCategory(row) {
  const sortOrder = Number(row?.sortOrder);

  return {
    id: String(row?.id || ""),
    name: String(row?.name || "Kategori"),
    icon: String(row?.icon || "photo_camera"),
    isActive: row?.isActive !== false,
    sortOrder: Number.isFinite(sortOrder)
      ? sortOrder
      : 999,
  };
}

function sortCategories(first, second) {
  if (first.sortOrder !== second.sortOrder) {
    return first.sortOrder - second.sortOrder;
  }

  return first.name.localeCompare(second.name);
}

export default function PackageOption({
  selectedPackageId,
  selectedPackageIds = [],
  packageOptions = [],
  loading = false,
  error = null,
  errors = {},
  onChange,
}) {
  const { openOverlay, closeOverlay } = useOverlay();
  const { language, translate } = useLanguage();
  const activePackageIds = selectedPackageIds.length
    ? selectedPackageIds
    : selectedPackageId
      ? [selectedPackageId]
      : [];

  const selectedPackage = useMemo(() => {
    return (
      packageOptions.find(
        (packageItem) =>
          packageItem.id === selectedPackageId,
      ) ?? null
    );
  }, [packageOptions, selectedPackageId]);

  const localizedSelectedPackage = selectedPackage
    ? getLocalizedPackage(selectedPackage, language)
    : null;

  function handleSelectPackage(packageId) {
    if (activePackageIds.includes(packageId)) {
      closeOverlay();
      return;
    }

    if (typeof onChange === "function") {
      onChange([...activePackageIds, packageId]);
    }

    closeOverlay();
  }

  function openPackagePicker() {
    openOverlay({
      closeOnBackdrop: true,
      className: "p-3 md:p-6",
      content: (
        <PackagePickerOverlay
          packageOptions={packageOptions}
          selectedPackageId={selectedPackageId}
          selectedPackageIds={activePackageIds}
          onSelect={handleSelectPackage}
          onClose={closeOverlay}
        />
      ),
    });
  }

  const selectedPackageUnavailable =
    activePackageIds.length > 0 &&
    !selectedPackage &&
    !loading;

  return (
    <div>
      <header className="mb-stack-md">
        <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-secondary">
          {translate("packages")}
        </p>

        <h2 className="font-headline-md text-headline-md text-on-surface">
          {translate("yourPackagePlan")}
        </h2>

        <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
          {translate("choosePackageDescription")}
        </p>
      </header>

      {loading ? (
        <SelectedPackageSkeleton />
      ) : error ? (
        <PackageMessage error>
          {translate("packageLoadError")}
        </PackageMessage>
      ) : localizedSelectedPackage ? (
        <>
          <SelectedPackageCard
            packageItem={localizedSelectedPackage}
            onChangePackage={openPackagePicker}
          />

          <div className="mt-5 space-y-3">
            <p className="font-label-md text-label-md uppercase tracking-wider text-secondary">
              {translate("selectedPackages")}
            </p>

            {activePackageIds.map((packageId, index) => {
              const packageItem = packageOptions.find(
                (item) => item.id === packageId,
              );

              if (!packageItem) return null;

              return (
                <div
                  key={packageId}
                  className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-3"
                >
                  <span className="font-body-md text-body-md text-on-surface">
                    {index + 1}. {packageItem.name}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      onChange?.(
                        activePackageIds.filter((id) => id !== packageId),
                      )
                    }
                    className="font-label-sm text-label-sm text-error hover:underline"
                  >
                    {translate("removePackage")}
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={openPackagePicker}
              className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2.5 font-label-md text-label-md text-primary hover:bg-surface-container-low"
            >
              + {translate("addAnotherPackage")}
            </button>
          </div>
        </>
      ) : (
        <EmptyPackageCard
          unavailable={selectedPackageUnavailable}
          disabled={packageOptions.length === 0}
          onOpen={openPackagePicker}
        />
      )}

      {errors.packageId && (
        <p
          role="alert"
          className="mt-4 font-label-sm text-label-sm text-error"
        >
          {errors.packageId}
        </p>
      )}
    </div>
  );
}

function SelectedPackageCard({
  packageItem,
  onChangePackage,
}) {
  const { translate } = useLanguage();
  const highlights = getPackageFeatures(packageItem);
  const visibleHighlights = highlights.slice(0, 5);
  const coverUrl = packageItem?.cover?.url;

  return (
    <article className="glass-card group overflow-hidden rounded-xl border-2 border-primary/50">
      <div className="grid md:grid-cols-[280px_1fr]">
        <div className="relative min-h-56 overflow-hidden bg-surface-container-high md:min-h-full">
          {coverUrl ? (
            <div
              role="img"
              aria-label={
                packageItem?.cover?.alt ||
                packageItem.name
              }
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url("${coverUrl}")`,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-container to-surface-container-highest text-on-surface-variant/40">
              <AppIcon
                name="photo_camera"
                size={52}
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-primary/45 via-transparent to-transparent" />

          <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 font-label-sm text-[10px] font-bold uppercase tracking-widest text-on-primary shadow-sm">
            {translate("selected")}
          </span>

          {packageItem.featured && (
            <span className="absolute bottom-4 left-4 rounded-full bg-surface-bright/90 px-3 py-1 font-label-sm text-[10px] font-bold uppercase tracking-widest text-primary backdrop-blur-md">
              {translate("mostPopular")}
            </span>
          )}
        </div>

        <div className="flex flex-col p-6 md:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                {translate("selectedPackage")}
              </p>

              <h3 className="font-headline-md text-headline-md leading-tight text-on-surface">
                {packageItem.name}
              </h3>
            </div>

            <div className="shrink-0 sm:text-right">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {translate("startingFrom")}
              </p>

              <p className="font-headline-sm text-headline-sm text-primary">
                {getPackagePrice(packageItem)}
              </p>
            </div>
          </div>

          {packageItem.description && (
            <p className="mt-4 line-clamp-3 font-body-md text-body-md text-on-surface-variant">
              {packageItem.description}
            </p>
          )}

          {packageItem.durationHours > 0 && (
            <div className="mt-5 flex items-center gap-2 font-label-md text-label-md text-on-surface">
              <AppIcon
                name="calendar_month"
                size={18}
                className="text-secondary"
              />

              <span>
                {packageItem.durationHours} {translate("hoursCoverage")}
              </span>
            </div>
          )}

          {visibleHighlights.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {visibleHighlights.map(
                (highlight, index) => (
                  <li
                    key={`${highlight}-${index}`}
                    className="flex items-start gap-2 font-label-sm text-label-sm text-on-surface-variant"
                  >
                    <AppIcon
                      name="check"
                      size={17}
                      className="mt-0.5 shrink-0 text-secondary"
                    />

                    <span>{highlight}</span>
                  </li>
                ),
              )}
            </ul>
          )}

          <div className="mt-6 border-t border-outline-variant/20 pt-5">
            <button
              type="button"
              onClick={onChangePackage}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline px-5 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:border-primary hover:bg-surface-container-low hover:text-primary"
            >
              <AppIcon name="swap_horiz" size={19} />
              {translate("changePackage")}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyPackageCard({
  unavailable,
  disabled,
  onOpen,
}) {
  const { translate } = useLanguage();
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/60 bg-surface-container-low/30 p-8 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <AppIcon name="add" size={32} />
      </span>

      <h3 className="font-headline-md text-headline-md text-on-surface">
        {translate("noPackageSelected")}
      </h3>

      <p className="mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
        {unavailable
          ? translate("packageUnavailable")
          : translate("choosePackageDescriptionShort")}
      </p>

      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <AppIcon name="photo_camera" size={19} />
        {translate("choosePackage")}
      </button>
    </div>
  );
}

function PackagePickerOverlay({
  packageOptions,
  selectedPackageId,
  selectedPackageIds = [],
  onSelect,
  onClose,
}) {
  const { colRef } = useDb();

  const {
    rows: categoryRows,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCollection(
    () => colRef(COLLECTIONS.categories),
    [],
  );

  const categories = useMemo(() => {
    return categoryRows
      .map(normalizeCategory)
      .filter(
        (category) =>
          category.id && category.isActive,
      )
      .sort(sortCategories);
  }, [categoryRows]);

  return (
    <PackagePickerContent
      packageOptions={packageOptions}
      categories={categories}
      categoriesLoading={categoriesLoading}
      categoriesError={categoriesError}
      selectedPackageId={selectedPackageId}
      selectedPackageIds={selectedPackageIds}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
}

function PackagePickerContent({
  packageOptions,
  categories,
  categoriesLoading,
  categoriesError,
  selectedPackageId,
  selectedPackageIds = [],
  onSelect,
  onClose,
}) {
  const { language, translate } = useLanguage();
  
  const [activeCategoryId, setActiveCategoryId] =
    useState(ALL_CATEGORY_ID);

  const categoryById = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          category,
        ]),
      ),
    [categories],
  );

  const packageCounts = useMemo(() => {
    const counts = new Map();

    packageOptions.forEach((packageItem) => {
      const categoryId =
        packageItem.packageCategoryId;

      counts.set(
        categoryId,
        (counts.get(categoryId) || 0) + 1,
      );
    });

    return counts;
  }, [packageOptions]);

  const filteredPackages = useMemo(() => {
    const filtered =
      activeCategoryId === ALL_CATEGORY_ID
        ? packageOptions
        : packageOptions.filter(
            (packageItem) =>
              packageItem.packageCategoryId ===
              activeCategoryId,
          );

    return [...filtered].sort((first, second) => {
      const firstOrder =
        Number(first.sortOrder) || 999;

      const secondOrder =
        Number(second.sortOrder) || 999;

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }

      return String(first.name).localeCompare(
        String(second.name),
      );
    });
  }, [activeCategoryId, packageOptions]);

  function getCategoryName(categoryId) {
    return (
      categoryById.get(categoryId)?.name ||
      "Uncategorized"
    );
  }

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="package-picker-title"
      className="flex max-h-[92vh] w-[min(1280px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
    >
      {/* FIXED HEADER AND CATEGORY TABS */}

      <div className="relative z-20 shrink-0 border-b border-outline-variant/30 bg-surface">
        <header className="flex items-start justify-between gap-5 px-5 pb-3 pt-5 md:px-8 md:pt-7">
          <div>
            <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-secondary">
              {translate("packages")}
            </p>

            <h2
              id="package-picker-title"
              className="font-headline-md text-headline-md text-primary"
            >
              {translate("choosePackage")}
            </h2>

            <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
              {translate("choosePackageDescriptionShort")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={translate("close")}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <AppIcon name="close" size={24} />
          </button>
        </header>

        <nav
          aria-label="Kategori paket"
          className="hide-scrollbar flex overflow-x-auto px-2 md:px-5"
        >
          <CategoryTab
            label={translate("all")}
            count={packageOptions.length}
            active={
              activeCategoryId === ALL_CATEGORY_ID
            }
            onClick={() =>
              setActiveCategoryId(ALL_CATEGORY_ID)
            }
          />

          {categoriesLoading
            ? Array.from(
                { length: 4 },
                (_, index) => (
                  <div
                    key={index}
                    className="shrink-0 px-4 py-3"
                  >
                    <SkeletonLoader className="h-8 w-28" />
                  </div>
                ),
              )
            : categories.map((category) => (
                <CategoryTab
                  key={category.id}
                  label={category.name}
                  count={
                    packageCounts.get(category.id) ||
                    0
                  }
                  active={
                    activeCategoryId === category.id
                  }
                  onClick={() =>
                    setActiveCategoryId(category.id)
                  }
                />
              ))}
        </nav>
      </div>

      {/* SCROLLABLE PACKAGE AREA */}

      <div className="min-h-0 flex-1 overflow-y-auto bg-surface-container-lowest p-5 md:p-8">
        {categoriesError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-error/25 bg-error-container px-5 py-4 font-body-md text-body-md text-on-surface"
          >
            {translate("categoryLoadError")}
          </div>
        )}

        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="font-body-md text-body-md text-on-surface-variant">
            {translate("showing")}{" "}
            <strong className="font-label-md text-on-surface">
              {filteredPackages.length}
            </strong>{" "}
            {translate("packages").toLowerCase()}
          </p>
        </div>

        {filteredPackages.length > 0 ? (
          <div
            role="radiogroup"
            aria-label="Daftar paket dokumentasi"
            className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredPackages.map(
              (packageItem) => (
                <PackageSelectionCard
                  key={packageItem.id}
                  packageItem={getLocalizedPackage(packageItem, language)}
                  categoryName={getCategoryName(
                    packageItem.packageCategoryId,
                  )}
                  selected={selectedPackageIds.includes(packageItem.id)}
                  onSelect={() =>
                    onSelect(packageItem.id)
                  }
                />
              ),
            )}
          </div>
        ) : (
          <PackageMessage>
            {translate("noPackages")}
          </PackageMessage>
        )}
      </div>
    </section>
  );
}

function CategoryTab({
  label,
  count,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative flex shrink-0 items-center gap-2 px-5 py-4 font-label-md text-label-md transition-colors duration-200 sm:px-7 ${
        active
          ? "text-primary"
          : "text-on-surface-variant hover:text-primary"
      }`}
    >
      <span>{label}</span>

      <span
        className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm ${
          active
            ? "bg-secondary-container text-on-secondary-container"
            : "bg-surface-container text-on-surface-variant"
        }`}
      >
        {count}
      </span>

      {active && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
      )}
    </button>
  );
}

function PackageSelectionCard({
  packageItem,
  categoryName,
  selected,
  onSelect,
}) {
  const highlights = getPackageFeatures(packageItem);
  const visibleHighlights = highlights.slice(0, 5);
  const coverUrl = packageItem?.cover?.url;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`glass-card group flex overflow-hidden rounded-xl text-left transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        selected
          ? "border-2 border-primary shadow-xl"
          : "border border-transparent hover:-translate-y-1 hover:shadow-2xl"
      }`}
    >
      <article className="flex w-full flex-col">
        <div className="relative h-56 overflow-hidden bg-surface-container-high">
          {coverUrl ? (
            <div
              role="img"
              aria-label={
                packageItem?.cover?.alt ||
                packageItem.name
              }
              className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url("${coverUrl}")`,
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-container to-surface-container-highest text-on-surface-variant/50">
              <AppIcon
                name="photo_camera"
                size={48}
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />

          {packageItem.featured && (
            <span className="absolute left-4 top-4 rounded-full bg-surface-bright/90 px-3 py-1 font-label-sm text-[10px] font-bold uppercase tracking-widest text-primary backdrop-blur-md">
              Most Popular
            </span>
          )}

          <span
            className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md ${
              selected
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant bg-surface-bright/80 text-transparent"
            }`}
          >
            <AppIcon name="check" size={18} />
          </span>
        </div>

        <div className="flex min-h-[390px] flex-1 flex-col p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                {categoryName}
              </p>

              <h3 className="font-headline-md text-headline-md leading-tight text-on-surface">
                {packageItem.name}
              </h3>
            </div>

            <div className="shrink-0 sm:text-right">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Mulai dari
              </p>

              <p className="font-label-md text-label-md text-primary">
                {getPackagePrice(packageItem)}
              </p>
            </div>
          </div>

          <p className="mt-4 line-clamp-3 font-body-md text-body-md text-on-surface-variant">
            {packageItem.description ||
              "Deskripsi paket belum tersedia."}
          </p>

          {packageItem.durationHours > 0 && (
            <div className="mt-5 flex items-center gap-2 font-label-md text-label-md text-on-surface">
              <AppIcon
                name="calendar_month"
                size={18}
                className="text-secondary"
              />

              <span>
                {packageItem.durationHours} jam liputan
              </span>
            </div>
          )}

          {visibleHighlights.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {visibleHighlights.map(
                (highlight, index) => (
                  <li
                    key={`${highlight}-${index}`}
                    className="flex items-start gap-2 font-label-sm text-label-sm text-on-surface-variant"
                  >
                    <AppIcon
                      name="check"
                      size={17}
                      className="mt-0.5 shrink-0 text-secondary"
                    />

                    <span>{highlight}</span>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="mt-4 font-label-sm text-label-sm text-on-surface-variant/70">
              Belum ada detail layanan.
            </p>
          )}

          <div
            className={`mt-auto border-t border-outline-variant/20 pt-5 text-center font-label-md text-label-md ${
              selected
                ? "text-primary"
                : "text-on-surface-variant transition-colors group-hover:text-primary"
            }`}
          >
            {selected
              ? "Paket sedang dipilih"
              : "Pilih paket ini"}
          </div>
        </div>
      </article>
    </button>
  );
}

function SelectedPackageSkeleton() {
  return (
    <article className="glass-card overflow-hidden rounded-xl">
      <div className="grid md:grid-cols-[280px_1fr]">
        <SkeletonLoader className="h-56 rounded-none md:h-full" />

        <div className="space-y-4 p-6">
          <SkeletonLoader className="h-4 w-28" />
          <SkeletonLoader className="h-8 w-2/3" />
          <SkeletonLoader className="h-6 w-40" />
          <SkeletonLoader className="h-20" />
          <SkeletonLoader className="h-11 w-36" />
        </div>
      </div>
    </article>
  );
}

function PackageMessage({
  children,
  error = false,
}) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-low/40 px-6 py-8 text-center">
      <p
        className={
          error
            ? "font-body-md text-body-md text-error"
            : "font-body-md text-body-md text-on-surface-variant"
        }
      >
        {children}
      </p>
    </div>
  );
}