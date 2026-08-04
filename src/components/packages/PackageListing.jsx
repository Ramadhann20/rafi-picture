"use client";

import { useEffect, useMemo, useState } from "react";
import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";

import { useRouter } from "next/navigation";

const COLLECTIONS = {
  packages: "Packages",
  categories: "PackageCategories",
};

const ALL_CATEGORIES = "__all__";

function formatCurrency(value) {
  const price = Number(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(price) ? price : 0);
}

function normalizeCategory(row) {
  const sortOrder = Number(row?.sortOrder);

  return {
    id: String(row?.id || ""),
    name: String(row?.name || "Kategori"),
    icon: String(row?.icon || "photo_camera"),
    isActive: row?.isActive !== false,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999,
  };
}

function normalizePackage(row) {
  const price = Number(row?.price);
  const durationHours = Number(row?.durationHours);
  const sortOrder = Number(row?.sortOrder);

  return {
    id: String(row?.id || ""),
    name: String(row?.name || "Paket Fotografi"),
    packageCategoryId: String(row?.packageCategoryId || ""),
    description: String(row?.description || ""),
    serviceHighlights: Array.isArray(row?.serviceHighlights)
      ? row.serviceHighlights
          .map((item) => String(item).trim())
          .filter(Boolean)
      : [],
    price: Number.isFinite(price) ? price : 0,
    durationHours: Number.isFinite(durationHours) ? durationHours : 0,
    status: String(row?.status || "inactive"),
    featured: Boolean(row?.featured),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999,
    cover: {
      url:
        typeof row?.cover?.url === "string" && row.cover.url.trim()
          ? row.cover.url.trim()
          : null,
      alt:
        typeof row?.cover?.alt === "string" && row.cover.alt.trim()
          ? row.cover.alt.trim()
          : String(row?.name || "Paket fotografi"),
    },
  };
}

function sortByOrderThenName(a, b) {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}

function PackageImage({ packageItem, className }) {
  if (!packageItem.cover.url) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-surface-container-high text-on-surface-variant/50`}
      >
        <AppIcon name="photo_camera" size={48} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={packageItem.cover.url}
      alt={packageItem.cover.alt}
      className={className}
    />
  );
}

function LoadingCards() {
  return (
    <section className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-[720px] animate-pulse overflow-hidden rounded-xl bg-surface-container-low"
        >
          <div className="h-[300px] bg-surface-container-high" />
          <div className="space-y-5 p-8">
            <div className="h-8 w-2/3 rounded bg-surface-container-high" />
            <div className="h-5 w-1/3 rounded bg-surface-container-high" />
            <div className="h-24 rounded bg-surface-container-high" />
            <div className="h-12 rounded bg-surface-container-high" />
          </div>
        </div>
      ))}
    </section>
  );
}

export default function PackageListing() {
  const { colRef } = useDb();
  const [activeCategoryId, setActiveCategoryId] = useState(ALL_CATEGORIES);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const router = useRouter();

  const {
    rows: categoryRows,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCollection(() => colRef(COLLECTIONS.categories), []);

  const {
    rows: packageRows,
    loading: packagesLoading,
    error: packagesError,
  } = useCollection(() => colRef(COLLECTIONS.packages), []);

  const categories = useMemo(
    () =>
      categoryRows
        .map(normalizeCategory)
        .filter((category) => category.id && category.isActive)
        .sort(sortByOrderThenName),
    [categoryRows],
  );

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const packages = useMemo(
    () =>
      packageRows
        .map(normalizePackage)
        .filter(
          (packageItem) =>
            packageItem.id &&
            packageItem.status === "active" &&
            categoryById.has(packageItem.packageCategoryId),
        )
        .sort(sortByOrderThenName),
    [packageRows, categoryById],
  );

  const visiblePackages = useMemo(
    () =>
      activeCategoryId === ALL_CATEGORIES
        ? packages
        : packages.filter(
            (packageItem) =>
              packageItem.packageCategoryId === activeCategoryId,
          ),
    [packages, activeCategoryId],
  );

  useEffect(() => {
    if (
      activeCategoryId !== ALL_CATEGORIES &&
      !categories.some((category) => category.id === activeCategoryId)
    ) {
      setActiveCategoryId(ALL_CATEGORIES);
    }
  }, [categories, activeCategoryId]);

  useEffect(() => {
    if (!selectedPackage) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedPackage(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPackage]);

  const loading = categoriesLoading || packagesLoading;
  const error = categoriesError || packagesError;

  if (loading) {
    return <LoadingCards />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error/30 bg-error-container px-6 py-5 text-on-surface">
        Paket tidak dapat dimuat. {error.message || "Silakan coba kembali."}
      </div>
    );
  }

  return (
    <>
      {categories.length > 0 && (
        <nav
          aria-label="Kategori paket"
          className="mb-stack-lg flex justify-center overflow-x-auto"
        >
          <div className="flex rounded-full bg-surface-container-low p-1">
            <button
              type="button"
              onClick={() => setActiveCategoryId(ALL_CATEGORIES)}
              className={`whitespace-nowrap rounded-full px-8 py-2 font-label-md transition-all ${
                activeCategoryId === ALL_CATEGORIES
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Semua
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={`whitespace-nowrap rounded-full px-8 py-2 font-label-md transition-all ${
                  activeCategoryId === category.id
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {visiblePackages.length > 0 ? (
        <section className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {visiblePackages.map((packageItem) => {
            const category = categoryById.get(packageItem.packageCategoryId);

            return (
              <article
                key={packageItem.id}
                onClick={() => setSelectedPackage(packageItem)}
                className="package-card group flex h-[760px] cursor-pointer flex-col overflow-hidden rounded-xl bg-white ambient-shadow transition-all duration-500 hover:-translate-y-2"
              >
                <div className="relative h-[300px] shrink-0 overflow-hidden">
                  <PackageImage
                    packageItem={packageItem}
                    className="h-full w-full object-cover transition-transform duration-[800ms] group-hover:scale-105"
                  />

                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-secondary-container/90 px-3 py-1 text-label-sm text-on-secondary-container backdrop-blur-sm">
                      {packageItem.featured
                        ? "Paling Populer"
                        : category?.name || "Paket"}
                    </span>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col p-8">
                  <div className="flex min-h-[120px] items-start justify-between gap-6">
                    <div className="min-w-0">
                      <h2 className="mb-2 font-headline-md text-headline-md leading-tight text-primary">
                        {packageItem.name}
                      </h2>

                      <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                        {category?.name || "Paket Fotografi"}
                      </p>
                    </div>

                    <div className="shrink-0 pt-1 text-right">
                      <span className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">
                        Mulai dari
                      </span>

                      <span className="font-headline-md text-headline-md font-bold leading-none text-primary">
                        {formatCurrency(packageItem.price)}
                      </span>
                    </div>
                  </div>

                  <p className="mb-5 line-clamp-3 font-body-md text-body-md leading-relaxed text-on-surface-variant">
                    {packageItem.description ||
                      "Paket fotografi yang dapat disesuaikan dengan kebutuhan acara Anda."}
                  </p>

                  <ul className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2 hide-scrollbar">
                    {packageItem.durationHours > 0 && (
                      <li className="grid grid-cols-[24px_1fr] items-start gap-x-3 text-on-surface-variant">
                        <AppIcon name="calendar_month" size={20} className="mt-[3px]" />
                        <span className="font-body-md text-body-md leading-relaxed">
                          Liputan {packageItem.durationHours} Jam
                        </span>
                      </li>
                    )}

                    {packageItem.serviceHighlights.map((highlight, index) => (
                      <li
                        key={`${packageItem.id}-${index}`}
                        className="grid grid-cols-[24px_1fr] items-start gap-x-3 text-on-surface-variant"
                      >
                        <AppIcon
                          name="check_circle"
                          size={20}
                          className="mt-[3px]"
                        />
                        <span className="font-body-md text-body-md leading-relaxed">
                          {highlight}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedPackage(packageItem);
                    }}
                    className="mt-8 w-full shrink-0 rounded-lg bg-primary py-4 font-label-md text-on-primary transition-all hover:bg-primary/90 active:scale-95"
                  >
                    Lihat Detail
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-6 py-10 text-center">
          <AppIcon
            name="inventory_2"
            size={40}
            className="mb-3 text-on-surface-variant/60"
          />
          <p className="font-headline-md text-headline-md text-on-surface">
            Belum ada paket tersedia
          </p>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            Paket aktif pada kategori ini akan muncul secara otomatis.
          </p>
        </div>
      )}

      {selectedPackage && (
        <div
          role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/20 p-4 backdrop-blur-xl md:p-8"
          onClick={() => setSelectedPackage(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="package-dialog-title"
            className="glass-panel flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl shadow-2xl md:flex-row"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-[320px] w-full md:h-auto md:w-1/2">
              <PackageImage
                packageItem={selectedPackage}
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                className="glass-panel absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-full transition-all hover:bg-white/40"
                aria-label="Tutup detail paket"
              >
                <AppIcon name="close" size={24} />
              </button>
            </div>

            <div className="flex w-full flex-col justify-between overflow-y-auto bg-white p-8 hide-scrollbar md:w-1/2 md:p-12">
              <div>
                <p className="mb-2 font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                  {categoryById.get(selectedPackage.packageCategoryId)?.name ||
                    "Paket Fotografi"}
                </p>

                <h2
                  id="package-dialog-title"
                  className="mb-4 font-display-lg text-headline-lg"
                >
                  {selectedPackage.name}
                </h2>

                <p className="mb-8 font-body-lg text-body-lg text-on-surface-variant">
                  {selectedPackage.description ||
                    "Paket fotografi yang dapat disesuaikan dengan kebutuhan acara Anda."}
                </p>

                <div className="mb-8 space-y-4">
                  <h3 className="border-b border-outline-variant pb-2 font-label-md text-label-md uppercase tracking-widest text-primary">
                    Termasuk dalam Paket
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {selectedPackage.durationHours > 0 && (
                      <div className="grid grid-cols-[24px_1fr] items-start gap-x-4 text-on-surface-variant">
                        <AppIcon name="calendar_month" size={20} className="mt-[3px]" />
                        <span className="font-body-md text-body-md leading-relaxed">
                          Liputan {selectedPackage.durationHours} Jam
                        </span>
                      </div>
                    )}

                    {selectedPackage.serviceHighlights.map(
                      (highlight, index) => (
                        <div
                          key={`${selectedPackage.id}-modal-${index}`}
                          className="grid grid-cols-[24px_1fr] items-start gap-x-4 text-on-surface-variant"
                        >
                          <AppIcon
                            name="check_circle"
                            size={20}
                            className="mt-[3px]"
                          />
                          <span className="font-body-md text-body-md leading-relaxed">
                            {highlight}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6 border-t border-outline-variant pt-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">
                    Investasi Mulai Dari
                  </span>
                  <span className="font-display-lg text-headline-lg font-bold">
                    {formatCurrency(selectedPackage.price)}
                  </span>
                </div>

                <button
                  type="button"
                  className="rounded-lg bg-primary px-10 py-4 font-label-md text-on-primary"
                  onClick={() => {
                    // Handle reservation action here
                    router.push(`/booking?packageId=${selectedPackage.id}`);
                  }}
                >
                  Reservasi Tanggal Anda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}