"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";

/* =========================================================
   PACKAGE CATEGORY DEFINITIONS

   Seluruh label kategori dipusatkan agar nilai internal dan
   label yang ditampilkan tidak tercampur.
========================================================= */

const PACKAGE_CATEGORIES = [
  {
    id: "wedding",
    label: "Wedding",
  },
  {
    id: "pre_wedding",
    label: "Pre-Wedding",
  },
  {
    id: "engagement",
    label: "Engagement",
  },
  {
    id: "event",
    label: "Event",
  },
];

/* =========================================================
   PACKAGE STATUS DEFINITIONS
========================================================= */

const PACKAGE_STATUS = {
  active: {
    label: "Active",
    badgeClass:
      "bg-secondary-container text-on-secondary-container",
  },
  inactive: {
    label: "Inactive",
    badgeClass:
      "bg-surface-container-high text-on-surface-variant",
  },
};

/* =========================================================
   DUMMY PACKAGE DATA

   Field awal:
   - id
   - name
   - price
   - duration
   - includes

   Field tambahan untuk kebutuhan UI:
   - category
   - description
   - status
   - featured
   - imageUrl
   - updatedAt
========================================================= */

export const PACKAGES = [
  {
    id: "p1",
    name: "Wedding Premium",
    category: "wedding",
    price: 5000000,
    duration: 8,

    description:
      "Complete wedding documentation for intimate and medium-scale celebrations.",

    includes: [
      "2 Photographers",
      "1 Videographer",
      "1 Assistant",
      "Online gallery",
      "Edited highlight video",
    ],

    status: "active",
    featured: true,

    imageUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",

    updatedAt: "2026-06-20T09:00:00Z",
  },
  {
    id: "p2",
    name: "Wedding Essential",
    category: "wedding",
    price: 3500000,
    duration: 6,

    description:
      "Essential wedding coverage focused on the ceremony and key family moments.",

    includes: [
      "1 Photographer",
      "1 Videographer",
      "Online gallery",
      "Edited documentation",
    ],

    status: "active",
    featured: false,

    imageUrl:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",

    updatedAt: "2026-06-18T07:30:00Z",
  },
  {
    id: "p3",
    name: "Urban Romance",
    category: "pre_wedding",
    price: 2750000,
    duration: 4,

    description:
      "Editorial pre-wedding session with a modern city atmosphere.",

    includes: [
      "1 Photographer",
      "1 Assistant",
      "2 Locations",
      "30 Edited Photos",
    ],

    status: "active",
    featured: true,

    imageUrl:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80",

    updatedAt: "2026-06-16T11:15:00Z",
  },
  {
    id: "p4",
    name: "Natural Story",
    category: "pre_wedding",
    price: 2250000,
    duration: 3,

    description:
      "Relaxed outdoor pre-wedding photography with natural poses and warm colors.",

    includes: [
      "1 Photographer",
      "1 Location",
      "20 Edited Photos",
      "Online gallery",
    ],

    status: "inactive",
    featured: false,

    imageUrl:
      "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=80",

    updatedAt: "2026-06-12T10:00:00Z",
  },
  {
    id: "p5",
    name: "Engagement Story",
    category: "engagement",
    price: 2000000,
    duration: 3,

    description:
      "Engagement documentation designed for intimate family celebrations.",

    includes: [
      "1 Photographer",
      "1 Assistant",
      "20 Edited Photos",
      "Online gallery",
    ],

    status: "active",
    featured: false,

    imageUrl:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",

    updatedAt: "2026-06-10T08:45:00Z",
  },
  {
    id: "p6",
    name: "Corporate Event",
    category: "event",
    price: 4000000,
    duration: 6,

    description:
      "Professional photo and video documentation for corporate and public events.",

    includes: [
      "2 Photographers",
      "1 Videographer",
      "Event highlight video",
      "Online gallery",
    ],

    status: "active",
    featured: false,

    imageUrl:
      "https://images.unsplash.com/photo-1507501336603-6e31db2be093?auto=format&fit=crop&w=1200&q=80",

    updatedAt: "2026-06-08T13:20:00Z",
  },
];

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

/**
 * Mengubah harga numerik menjadi format rupiah.
 */
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Mengubah category ID menjadi label yang dapat ditampilkan.
 */
function getCategoryLabel(categoryId) {
  return (
    PACKAGE_CATEGORIES.find(
      (category) => category.id === categoryId,
    )?.label || "Uncategorized"
  );
}

/**
 * Mengubah timestamp menjadi format tanggal singkat.
 */
function formatUpdatedDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Mengambil tanggal update terakhir dari seluruh package.
 */
function getLatestUpdatedAt(packages) {
  const validDates = packages
    .map((item) => new Date(item.updatedAt))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (validDates.length === 0) {
    return null;
  }

  return new Date(
    Math.max(...validDates.map((date) => date.getTime())),
  );
}

/* =========================================================
   PACKAGES COMPONENT
========================================================= */

export default function Packages() {
  /* ---------------------------------------------------------
     LOCAL UI STATE

     Tab digunakan untuk memfilter package berdasarkan category.
  --------------------------------------------------------- */

  const [activeCategory, setActiveCategory] =
    useState("wedding");

  /* ---------------------------------------------------------
     FILTERED PACKAGES
  --------------------------------------------------------- */

  const filteredPackages = useMemo(() => {
    return PACKAGES.filter(
      (item) => item.category === activeCategory,
    );
  }, [activeCategory]);

  /* ---------------------------------------------------------
     LAST UPDATED INFORMATION
  --------------------------------------------------------- */

  const latestUpdatedAt = useMemo(() => {
    return getLatestUpdatedAt(PACKAGES);
  }, []);

  /* ---------------------------------------------------------
     PLACEHOLDER HANDLERS

     Belum mengubah data karena masih berupa UI dummy.
  --------------------------------------------------------- */

  const handleCreatePackage = () => {
    console.log("OPEN_CREATE_PACKAGE");
  };

  const handleEditPackage = (packageItem) => {
    console.log("EDIT_PACKAGE", packageItem);
  };

  const handleDeletePackage = (packageItem) => {
    console.log("DELETE_PACKAGE", packageItem);
  };

  return (
    <section>
      {/* =====================================================
          PAGE HEADER

          Struktur disamakan dengan Schedule.jsx dan Orders.jsx:
          eyebrow → display title → description → primary action.
      ===================================================== */}

      <header className="mb-stack-lg">
        <div className="flex flex-col gap-stack-md lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-secondary">
              Packages
            </p>

            <h1 className="font-display-lg text-display-lg text-primary">
              Package Management
            </h1>

            <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
              Manage photography and videography packages,
              pricing, duration, availability, and included
              services.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreatePackage}
            className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            <AppIcon name="add" size={20} />

            New Package
          </button>
        </div>
      </header>

      {/* =====================================================
          CATEGORY TABS
      ===================================================== */}

      <nav
        aria-label="Package categories"
        className="hide-scrollbar mb-stack-md flex overflow-x-auto border-b border-outline-variant/30"
      >
        {PACKAGE_CATEGORIES.map((category) => {
          const isActive =
            category.id === activeCategory;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                setActiveCategory(category.id)
              }
              className={`relative shrink-0 px-6 py-4 font-label-md text-label-md transition-colors duration-200 sm:px-8 ${
                isActive
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {category.label}

              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* =====================================================
          PACKAGE CARDS
      ===================================================== */}

      <section
        aria-label={`${getCategoryLabel(
          activeCategory,
        )} packages`}
        className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3"
      >
        {filteredPackages.map((packageItem) => {
          const statusConfig =
            PACKAGE_STATUS[packageItem.status] ||
            PACKAGE_STATUS.inactive;

          return (
            <article
              key={packageItem.id}
              className="glass-card group overflow-hidden rounded-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Package cover */}
              <div className="relative h-64 overflow-hidden bg-surface-container-high">
                {packageItem.imageUrl ? (
                  <div
                    role="img"
                    aria-label={`${packageItem.name} package cover`}
                    className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{
                      backgroundImage: `url("${packageItem.imageUrl}")`,
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-surface-container to-surface-container-highest" />
                )}

                {/* Image overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent" />

                {packageItem.featured && (
                  <span className="absolute left-4 top-4 rounded-full bg-surface-bright/90 px-3 py-1 font-label-sm text-[10px] font-bold uppercase tracking-widest text-primary backdrop-blur-md">
                    Featured
                  </span>
                )}

                <span
                  className={`absolute right-4 top-4 rounded-full px-3 py-1 font-label-sm text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${statusConfig.badgeClass}`}
                >
                  {statusConfig.label}
                </span>
              </div>

              {/* Package information */}
              <div className="flex h-[calc(100%-16rem)] flex-col p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                      {getCategoryLabel(
                        packageItem.category,
                      )}
                    </p>

                    <h2 className="font-headline-md text-headline-md leading-tight text-on-surface">
                      {packageItem.name}
                    </h2>
                  </div>

                  <div className="shrink-0 sm:text-right">
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Starting from
                    </p>

                    <p className="font-label-md text-label-md text-primary">
                      {formatCurrency(
                        packageItem.price,
                      )}
                    </p>
                  </div>
                </div>

                <p className="mt-4 font-body-md text-body-md text-on-surface-variant">
                  {packageItem.description}
                </p>

                {/* Package duration */}
                <div className="mt-5 flex items-center gap-2 font-label-md text-label-md text-on-surface">
                  <AppIcon
                    name="calendar_month"
                    size={18}
                    className="text-secondary"
                  />

                  <span>
                    {packageItem.duration} hours coverage
                  </span>
                </div>

                {/* Included services */}
                <ul className="mt-4 space-y-2">
                  {packageItem.includes.map(
                    (includedItem) => (
                      <li
                        key={includedItem}
                        className="flex items-start gap-2 font-label-sm text-label-sm text-on-surface-variant"
                      >
                        <AppIcon
                          name="verified"
                          size={17}
                          className="mt-0.5 shrink-0 text-secondary"
                        />

                        <span>{includedItem}</span>
                      </li>
                    ),
                  )}
                </ul>

                {/* Package actions */}
                <div className="mt-auto flex gap-3 border-t border-outline-variant/20 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      handleEditPackage(packageItem)
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-variant"
                  >
                    <AppIcon name="edit" size={18} />

                    Edit Package
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeletePackage(packageItem)
                    }
                    aria-label={`Delete ${packageItem.name}`}
                    title="Delete package"
                    className="inline-flex w-12 shrink-0 items-center justify-center rounded-lg border border-error/30 text-error transition-colors hover:bg-error-container/50"
                  >
                    <AppIcon name="delete" size={20} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {/* ===================================================
            CREATE PACKAGE PLACEHOLDER
        =================================================== */}

        <button
          type="button"
          onClick={handleCreatePackage}
          className="group flex min-h-[520px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/60 bg-surface-container-low/30 p-10 text-center transition-all hover:border-primary/50 hover:bg-surface-container-low"
        >
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container transition-all duration-300 group-hover:bg-primary group-hover:text-on-primary">
            <AppIcon name="add" size={32} />
          </span>

          <span className="font-headline-md text-headline-md text-on-surface">
            Create New Package
          </span>

          <span className="mt-2 max-w-xs font-body-md text-body-md text-on-surface-variant">
            Add another{" "}
            {getCategoryLabel(activeCategory)} package
            to provide more options for your clients.
          </span>
        </button>
      </section>

      {/* =====================================================
          EMPTY CATEGORY STATE

          Secara normal kartu create package tetap muncul.
          Pesan ini muncul apabila kategori belum memiliki data.
      ===================================================== */}

      {filteredPackages.length === 0 && (
        <div className="mt-stack-sm rounded-xl border border-outline-variant/30 bg-surface-container-low/40 px-6 py-5">
          <p className="font-label-md text-label-md text-on-surface">
            No packages are available in this category.
          </p>

          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Create the first{" "}
            {getCategoryLabel(activeCategory)} package
            using the card above.
          </p>
        </div>
      )}

      {/* =====================================================
          QUICK PRICE SUMMARY
      ===================================================== */}

      <section className="mt-stack-lg">
        <header className="mb-stack-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Quick Price Summary
            </h2>

            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              Review package pricing and availability in one
              place.
            </p>
          </div>

          {latestUpdatedAt && (
            <time
              dateTime={latestUpdatedAt.toISOString()}
              className="w-fit rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm text-on-surface-variant"
            >
              Last updated:{" "}
              {formatUpdatedDate(latestUpdatedAt)}
            </time>
          )}
        </header>

        <div className="glass-card overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-high/50">
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                    Package Name
                  </th>

                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                    Category
                  </th>

                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                    Duration
                  </th>

                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                    Base Price
                  </th>

                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right font-label-md text-label-md text-on-surface-variant">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/20">
                {PACKAGES.map((packageItem) => {
                  const statusConfig =
                    PACKAGE_STATUS[
                      packageItem.status
                    ] || PACKAGE_STATUS.inactive;

                  return (
                    <tr
                      key={packageItem.id}
                      className="transition-colors hover:bg-surface-container-low/50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-label-md text-label-md text-on-surface">
                          {packageItem.name}
                        </p>

                        {packageItem.featured && (
                          <p className="mt-0.5 font-label-sm text-label-sm text-secondary">
                            Featured package
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                        {getCategoryLabel(
                          packageItem.category,
                        )}
                      </td>

                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                        {packageItem.duration} hours
                      </td>

                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface">
                        {formatCurrency(
                          packageItem.price,
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 font-label-sm text-label-sm ${statusConfig.badgeClass}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEditPackage(
                                packageItem,
                              )
                            }
                            aria-label={`Edit ${packageItem.name}`}
                            title="Edit package"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-primary"
                          >
                            <AppIcon
                              name="edit"
                              size={19}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeletePackage(
                                packageItem,
                              )
                            }
                            aria-label={`Delete ${packageItem.name}`}
                            title="Delete package"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container/60 hover:text-error"
                          >
                            <AppIcon
                              name="delete"
                              size={19}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </section>
  );
}

