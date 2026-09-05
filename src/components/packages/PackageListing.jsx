"use client";

import { useEffect, useMemo, useState } from "react";
import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useLanguage } from "@/context/LanguageContext";
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
    slug: String(row?.slug || row?.name || "").toLowerCase(),
    icon: String(row?.icon || "photo_camera"),
    isActive: row?.isActive !== false,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999,
  };
}

function getCategoryTranslationKey(category) {
  const value = `${category?.slug || ""} ${category?.name || ""}`
    .toLowerCase()
    .replaceAll("_", " ");

  if (
    value.includes("pre-wed") ||
    value.includes("prewed") ||
    value.includes("pra-pernikahan")
  ) {
    return "categoryPreWedding";
  }

  if (value.includes("wedding") || value.includes("pernikahan")) {
    return "categoryWedding";
  }

  if (value.includes("engagement") || value.includes("pertunangan")) {
    return "categoryEngagement";
  }

  if (value.includes("bundle") || value.includes("bundel")) {
    return "categoryBundle";
  }

  if (value.includes("event") || value.includes("acara")) {
    return "categoryEvent";
  }

  return null;
}

export const englishPackageTranslations = {
  "classic-a-wedding-package": {
    description:
      "A wedding photography package for essential coverage with a photographer and assistant photographer.",
    features: [
      "1 Photographer",
      "1 Assistant Photographer",
      "100 Edited Photos",
      "All Data (Digital Files)",
      "Google Drive & Flash Drive",
      "Wedding Documentation",
    ],
  },
  "classic-b-wedding-package": {
    description:
      "A wedding photography package with an album and frame for event documentation and selected printed outputs.",
    features: [
      "1 Photographer",
      "1 Assistant Photographer",
      "100 Edited Photos",
      "10-Sheet Magazine Album",
      "16RP + 1 Large Frame",
      "Google Drive & Flash Drive",
    ],
  },
  "bronze-wedding-package": {
    description:
      "A wedding photography and video package with a cinematic highlight, album, and frame for event documentation.",
    features: [
      "1 Photographer + 1 Assistant",
      "1 Videographer",
      "100 Edited Photos",
      "2-3 Minute Wedding Cinematic Video",
      "10-Sheet Magazine Album + Standard Box",
      "16RP + 1 Large Frame",
    ],
  },
  "silver-wedding-package": {
    description:
      "A wedding photography and video package with two photographers, cinematic video, teaser, an exclusive album, and frames.",
    features: [
      "2 Photographers + 1 Assistant",
      "1 Videographer",
      "100 Edited Photos",
      "Wedding Cinematic + 1-Minute Teaser",
      "10-Sheet Magazine Album + Exclusive Box",
      "16RP + 2 Large Frames",
    ],
  },
  "gold-wedding-package": {
    description:
      "A complete wedding package with a photo and video team, cinematic video, Instagram teaser, an exclusive single album, and frames.",
    features: [
      "2 Photographers + 1 Assistant",
      "1 Videographer",
      "Wedding Cinematic Video",
      "1-Minute Instagram Teaser",
      "10-Sheet Single Magazine Album + Exclusive Box",
      "Large & Small Frames",
    ],
  },
  "platinum-wedding-package": {
    description:
      "A premium wedding package with a photo and video team, cinematic video, Instagram teaser, an exclusive double album, and frames.",
    features: [
      "2 Photographers + 1 Assistant",
      "1 Videographer",
      "Wedding Cinematic Video",
      "1-Minute Instagram Teaser",
      "20-Sheet Double Magazine Album + Exclusive Box",
      "Large & Small Frames",
    ],
  },
  "prewedding-bronze": {
    description:
      "A pre-wedding photography-only package for one location with edited selections, frames, and all photo files via Google Drive.",
    features: [
      "Photos Only",
      "1 Location",
      "50 Edited Photos",
      "2 16RP Large Frames",
      "10 4R Frames",
      "All Photo Files via Google Drive",
    ],
  },
  "prewedding-silver": {
    description:
      "A pre-wedding photo and video package for one location with cinematic video, selected photos, frames, and files via Google Drive.",
    features: [
      "Photos & Video",
      "1 Location",
      "Cinematic Video",
      "Up to 100 Selected Edited Photos",
      "16RP + 4R Frames",
      "All Photo Files via Google Drive",
    ],
  },
  "engagement-bronze": {
    description:
      "A photo-based engagement documentation package with unlimited shooting during the session, selected photos, and all data via Google Drive.",
    features: [
      "Photography",
      "Unlimited Shooting",
      "Full Session",
      "Selected Edited Photos",
      "All Data via Google Drive",
      "Engagement Documentation",
    ],
  },
  "engagement-silver": {
    description:
      "An engagement photography and cinematic video package with unlimited shooting, selected photos, and all digital data.",
    features: [
      "Photography",
      "Cinematic Video",
      "Unlimited Shooting",
      "Full Session",
      "Selected Edited Photos",
      "Google Drive & Flash Drive",
    ],
  },
  "bronze-pengajian-siraman": {
    description:
      "A photography package for the Pengajian and Siraman ceremonies with edited results and all data via Google Drive.",
    features: [
      "1 Photographer",
      "50 Edited Files",
      "50 Edited Photos",
      "All Data (Digital Files)",
      "Google Drive",
      "Pengajian & Siraman Documentation",
    ],
  },
  "silver-pengajian-siraman": {
    description:
      "A photo and video package for the Pengajian and Siraman ceremonies with cinematic video and edited results.",
    features: [
      "1 Photographer",
      "1 Videographer",
      "Cinematic Video",
      "100 Edited Files",
      "50 Edited Photos",
      "All Data via Google Drive",
    ],
  },
  "prewedding-wedding-bundle": {
    description:
      "A Pre-Wedding and Wedding documentation bundle combining photography, cinematic video, an album, frames, and digital files.",
    features: [
      "PREWEDDING: Duration max 4 hours for outdoor (conditional)",
      "Prewedding edited selected photos, 16RP + big frame 2 pcs, 4R + frame 10 pcs",
      "Prewedding cinematic video and all photo files via Google Drive",
      "WEDDING: Photo, cinematic video + 1-minute teaser cinematic video",
      "Single magazine album + exclusive box, all data via Google Drive & Flashdisk",
      "16RP + 2 large frames, 4R + 5 small frames, duration up to 6 hours",
    ],
  },
};

function getLocalizedPackage(packageItem, language) {
  const translation = englishPackageTranslations[packageItem.id];

  if (language !== "en" || !translation) {
    return packageItem;
  }

  return {
    ...packageItem,
    description: translation.description,
    serviceHighlights: translation.features,
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
  const { language, translate } = useLanguage();
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

  const effectiveCategoryId =
    activeCategoryId === ALL_CATEGORIES ||
    categories.some((category) => category.id === activeCategoryId)
      ? activeCategoryId
      : ALL_CATEGORIES;

  const visiblePackages = useMemo(
    () =>
      effectiveCategoryId === ALL_CATEGORIES
        ? packages
        : packages.filter(
            (packageItem) =>
              packageItem.packageCategoryId === effectiveCategoryId,
          ),
    [packages, effectiveCategoryId],
  );

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
              {translate("all")}
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
                {getCategoryTranslationKey(category)
                  ? translate(getCategoryTranslationKey(category))
                  : category.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {visiblePackages.length > 0 ? (
        <section className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {visiblePackages.map((packageItem) => {
            const localizedPackage = getLocalizedPackage(packageItem, language);
            const category = categoryById.get(packageItem.packageCategoryId);
            const cardDetails = [
              ...(localizedPackage.durationHours > 0
                ? [
                    {
                      icon: "calendar_month",
                      text: `${translate("coverage")} ${localizedPackage.durationHours} ${language === "en" ? "Hours" : "Jam"}`,
                    },
                  ]
                : []),
              ...localizedPackage.serviceHighlights.map((highlight) => ({
                icon: "check_circle",
                text: highlight,
              })),
            ].slice(0, 3);

            return (
              <article
                key={packageItem.id}
                onClick={() => setSelectedPackage(packageItem)}
                className="package-card group flex min-h-[760px] cursor-pointer flex-col overflow-hidden rounded-xl bg-white ambient-shadow transition-all duration-500 hover:-translate-y-2"
              >
                <div className="relative h-[300px] shrink-0 overflow-hidden">
                  <PackageImage
                    packageItem={packageItem}
                    className="h-full w-full object-cover transition-transform duration-[800ms] group-hover:scale-105"
                  />

                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-secondary-container/90 px-3 py-1 text-label-sm text-on-secondary-container backdrop-blur-sm">
                      {packageItem.featured
                        ? translate("popular")
                        : category
                          ? getCategoryTranslationKey(category)
                            ? translate(getCategoryTranslationKey(category))
                            : category.name
                          : translate("packageLabel")}
                    </span>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col p-8">
                  <div className="flex min-h-[120px] items-start justify-between gap-6">
                    <div className="min-w-0">
                      <h2 className="mb-2 font-headline-sm text-headline-sm leading-tight text-primary">
                        {packageItem.name}
                      </h2>

                      <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                        {category
                          ? getCategoryTranslationKey(category)
                            ? translate(getCategoryTranslationKey(category))
                            : category.name
                          : translate("packages")}
                      </p>
                    </div>

                    <div className="shrink-0 pt-1 text-right">
                      <span className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">
                        {translate("startingFrom")}
                      </span>

                      <span className="font-headline-md text-headline-md font-bold leading-none text-primary">
                        {formatCurrency(packageItem.price)}
                      </span>
                    </div>
                  </div>

                  <p className="mb-5 line-clamp-3 font-body-md text-body-md leading-relaxed text-on-surface-variant">
                    {localizedPackage.description ||
                      translate("packageFallbackDescription")}
                  </p>

                  <ul className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2 hide-scrollbar">
                    {cardDetails.map((detail, index) => (
                      <li
                        key={`${packageItem.id}-${index}`}
                        className="grid grid-cols-[24px_1fr] items-start gap-x-3 text-on-surface-variant"
                      >
                        <AppIcon
                          name={detail.icon}
                          size={20}
                          className="mt-[3px]"
                        />
                        <span className="font-body-md text-body-md leading-relaxed">
                          {detail.text}
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
                    {translate("viewDetail")}
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
            {translate("noPackages")}
          </p>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            {translate("noPackagesDescription")}
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
                  {(() => {
                    const category = categoryById.get(
                      selectedPackage.packageCategoryId,
                    );
                    return category
                      ? getCategoryTranslationKey(category)
                        ? translate(getCategoryTranslationKey(category))
                        : category.name
                      : translate("packages");
                  })()}
                </p>

                <h2
                  id="package-dialog-title"
                  className="mb-4 font-display-lg text-headline-lg"
                >
                  {selectedPackage.name}
                </h2>

                <p className="mb-8 font-body-lg text-body-lg text-on-surface-variant">
                  {getLocalizedPackage(selectedPackage, language).description ||
                    translate("packageFallbackDescription")}
                </p>

                <div className="mb-8 space-y-4">
                  <h3 className="border-b border-outline-variant pb-2 font-label-md text-label-md uppercase tracking-widest text-primary">
                    {translate("includedInPackage")}
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {selectedPackage.durationHours > 0 && (
                      <div className="grid grid-cols-[24px_1fr] items-start gap-x-4 text-on-surface-variant">
                        <AppIcon name="calendar_month" size={20} className="mt-[3px]" />
                        <span className="font-body-md text-body-md leading-relaxed">
                          {translate("coverage")} {selectedPackage.durationHours} {language === "en" ? "Hours" : "Jam"}
                        </span>
                      </div>
                    )}

                    {getLocalizedPackage(selectedPackage, language).serviceHighlights.map(
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
                    {translate("investmentStartingFrom")}
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
                  {translate("reserveDate")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}