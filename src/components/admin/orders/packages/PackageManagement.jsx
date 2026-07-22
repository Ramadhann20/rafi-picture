"use client";

import { useEffect, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import SkeletonLoader from "@/components/global/SkeletonLoader";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";

import PackageEdit from "./PackageEdit";

const COLLECTIONS = {
  packages: "Packages",
  categories: "PackageCategories",
};

const PACKAGE_STATUS = {
  active: {
    label: "Active",
    badgeClass: "bg-secondary-container text-on-secondary-container",
  },
  inactive: {
    label: "Inactive",
    badgeClass: "bg-surface-container-high text-on-surface-variant",
  },
  archived: {
    label: "Archived",
    badgeClass: "bg-error-container/70 text-error",
  },
};

function toDate(value) {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value?.seconds === "number") {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatCurrency(value) {
  const price = Number(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(price) ? price : 0);
}

function formatUpdatedDate(value) {
  const date = toDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeCategory(row) {
  const sortOrder = Number(row?.sortOrder);

  // useCollection exposes the Firestore document ID as row.id.
  return {
    id: String(row?.id || ""),
    name: String(row?.name || "Unnamed Category"),
    slug: String(row?.slug || ""),
    icon: String(row?.icon || "photo_camera"),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999,
    isActive: row?.isActive !== false,
  };
}

function normalizePackage(row) {
  // Package documents do not keep a separate business ID. row.id is the
  // Firestore document ID and packageCategoryId/packageId are relation fields.
  const price = Number(row?.price);
  const durationHours = Number(row?.durationHours);
  const sortOrder = Number(row?.sortOrder);
  const status = ["active", "inactive", "archived"].includes(row?.status)
    ? row.status
    : "inactive";

  const serviceHighlights = Array.isArray(row?.serviceHighlights)
    ? row.serviceHighlights
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];

  return {
    id: String(row?.id || ""),
    name: String(row?.name || "Untitled Package"),
    packageCategoryId: String(row?.packageCategoryId || ""),
    description: String(row?.description || ""),
    serviceHighlights,
    price: Number.isFinite(price) ? price : 0,
    durationHours: Number.isFinite(durationHours) ? durationHours : 0,
    status,
    featured: Boolean(row?.featured),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999,
    cover: {
      url:
        typeof row?.cover?.url === "string" && row.cover.url.trim()
          ? row.cover.url.trim()
          : null,
      storagePath:
        typeof row?.cover?.storagePath === "string" &&
        row.cover.storagePath.trim()
          ? row.cover.storagePath.trim()
          : null,
      alt:
        typeof row?.cover?.alt === "string" && row.cover.alt.trim()
          ? row.cover.alt.trim()
          : `Paket ${String(row?.name || "fotografi")}`,
    },
    createdAt: row?.createdAt || null,
    updatedAt: row?.updatedAt || null,
  };
}

function sortCategories(a, b) {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}

function sortPackages(a, b) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;

  const aTime = toDate(a.updatedAt || a.createdAt)?.getTime() || 0;
  const bTime = toDate(b.updatedAt || b.createdAt)?.getTime() || 0;

  if (aTime !== bTime) return bTime - aTime;
  return a.name.localeCompare(b.name);
}

function getLatestUpdatedAt(packages) {
  const dates = packages
    .map((item) => toDate(item.updatedAt || item.createdAt))
    .filter(Boolean);

  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function PackageCardSkeleton() {
  return (
    <article className="glass-card overflow-hidden rounded-xl">
      <SkeletonLoader className="h-64 rounded-none" />
      <div className="space-y-4 p-6">
        <SkeletonLoader className="h-4 w-24" />
        <SkeletonLoader className="h-8 w-3/4" />
        <SkeletonLoader className="h-20" />
        <SkeletonLoader className="h-11" />
      </div>
    </article>
  );
}

export default function PackageManagement() {
  const {
    addDoc,
    colRef,
    deleteDoc,
    serverTimestamp,
    updateDoc,
  } = useDb();

  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [editor, setEditor] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savingPackage, setSavingPackage] = useState(false);

  const {
    rows: packageRows,
    loading: packagesLoading,
    error: packagesError,
  } = useCollection(() => colRef(COLLECTIONS.packages), []);

  const {
    rows: categoryRows,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCollection(() => colRef(COLLECTIONS.categories), []);

  const categories = useMemo(
    () =>
      categoryRows
        .map(normalizeCategory)
        .filter((category) => category.id)
        .sort(sortCategories),
    [categoryRows],
  );

  const packages = useMemo(
    () =>
      packageRows
        .map(normalizePackage)
        .filter((packageItem) => packageItem.id)
        .sort(sortPackages),
    [packageRows],
  );

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );


  useEffect(() => {
    if (categories.length === 0) {
      setActiveCategoryId("");
      return;
    }

    const stillAvailable = categories.some(
      (category) => category.id === activeCategoryId,
    );

    if (!stillAvailable) {
      const firstActiveCategory =
        categories.find((category) => category.isActive) || categories[0];
      setActiveCategoryId(firstActiveCategory.id);
    }
  }, [categories, activeCategoryId]);

  const filteredPackages = useMemo(
    () =>
      packages
        .filter(
          (packageItem) =>
            packageItem.packageCategoryId === activeCategoryId,
        )
        .sort(sortPackages),
    [packages, activeCategoryId],
  );

  const latestUpdatedAt = useMemo(
    () => getLatestUpdatedAt(packages),
    [packages],
  );

  const loading = packagesLoading || categoriesLoading;
  const dataError = packagesError || categoriesError;

  function getCategoryName(categoryId) {
    return categoryById.get(categoryId)?.name || "Uncategorized";
  }

  function openCreatePackage() {
    if (categories.length === 0) {
      setActionError(
        `Collection ${COLLECTIONS.categories} belum memiliki kategori.`,
      );
      return;
    }

    setActionError("");
    setSaveError("");
    setEditor({ mode: "create", packageItem: null });
  }

  function openEditPackage(packageItem) {
    setActionError("");
    setSaveError("");
    setEditor({ mode: "edit", packageItem });
  }

  function closeEditor() {
    if (savingPackage) return;
    setSaveError("");
    setEditor(null);
  }

  async function handleSavePackage(payload) {
    if (!editor) return;

    setSavingPackage(true);
    setSaveError("");

    try {
      if (editor.mode === "edit" && editor.packageItem?.id) {
        await updateDoc(COLLECTIONS.packages, editor.packageItem.id, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(COLLECTIONS.packages, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      if (payload.packageCategoryId) {
        setActiveCategoryId(payload.packageCategoryId);
      }

      setEditor(null);
    } catch (error) {
      console.error("save package error:", error);
      setSaveError(error?.message || "Failed to save package to Firebase.");
    } finally {
      setSavingPackage(false);
    }
  }

  async function handleDeletePackage(packageItem) {
    const confirmed = window.confirm(`Delete “${packageItem.name}”?`);
    if (!confirmed) return;

    setDeletingId(packageItem.id);
    setActionError("");

    try {
      await deleteDoc(COLLECTIONS.packages, packageItem.id);
    } catch (error) {
      console.error("delete package error:", error);
      setActionError(error?.message || "Failed to delete package.");
    } finally {
      setDeletingId(null);
    }
  }

  if (editor) {
    return (
      <PackageEdit
        packageItem={editor.packageItem}
        categories={categories}
        defaultCategoryId={activeCategoryId}
        submitting={savingPackage}
        submitError={saveError}
        onCancel={closeEditor}
        onSubmit={handleSavePackage}
      />
    );
  }

  return (
    <section className="content-slide-enter-left">
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
              Manage package categories, pricing, coverage duration, service
              highlights, visibility, and client-facing information.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreatePackage}
            disabled={categoriesLoading || categories.length === 0}
            className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <AppIcon name="add" size={20} />
            New Package
          </button>
        </div>
      </header>

      <nav
        aria-label="Package categories"
        className="hide-scrollbar mb-stack-md flex overflow-x-auto border-b border-outline-variant/30"
      >
        {categoriesLoading ? (
          <div className="flex w-full gap-3 py-3">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonLoader key={index} className="h-10 w-32 shrink-0" />
            ))}
          </div>
        ) : (
          categories.map((category) => {
            const active = category.id === activeCategoryId;
            const count = packages.filter(
              (packageItem) =>
                packageItem.packageCategoryId === category.id,
            ).length;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={`relative flex shrink-0 items-center gap-2 px-6 py-4 font-label-md text-label-md transition-colors duration-200 sm:px-8 ${
                  active
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                <span>{category.name}</span>
                {!category.isActive && (
                  <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-[10px] uppercase">
                    Inactive
                  </span>
                )}
                <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm">
                  {count}
                </span>
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })
        )}
      </nav>

      {(dataError || actionError) && (
        <div
          role="alert"
          className="mb-stack-md rounded-xl border border-error/25 bg-error-container px-5 py-4 font-body-md text-body-md text-on-surface"
        >
          {actionError ||
            dataError?.message ||
            "Package data could not be loaded."}
        </div>
      )}

      {!categoriesLoading && categories.length === 0 && (
        <div className="mb-stack-md rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-6 py-5">
          <p className="font-label-md text-label-md text-on-surface">
            No package categories are available.
          </p>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Seed collection <code>{COLLECTIONS.categories}</code> before
            creating packages.
          </p>
        </div>
      )}

      <section
        aria-label={`${getCategoryName(activeCategoryId)} packages`}
        className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3"
      >
        {loading ? (
          Array.from({ length: 3 }, (_, index) => (
            <PackageCardSkeleton key={index} />
          ))
        ) : (
          <>
            {filteredPackages.map((packageItem) => {
              const statusConfig =
                PACKAGE_STATUS[packageItem.status] || PACKAGE_STATUS.inactive;
              const visibleHighlights =
                packageItem.serviceHighlights.slice(0, 5);
              const deleting = deletingId === packageItem.id;

              return (
                <article
                  key={packageItem.id}
                  className="glass-card group overflow-hidden rounded-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="relative h-64 overflow-hidden bg-surface-container-high">
                    {packageItem.cover.url ? (
                      <div
                        role="img"
                        aria-label={packageItem.cover.alt}
                        className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{
                          backgroundImage: `url("${packageItem.cover.url}")`,
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-container to-surface-container-highest text-on-surface-variant/50">
                        <AppIcon name="photo_camera" size={48} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent" />

                    {packageItem.featured && (
                      <span className="absolute left-4 top-4 rounded-full bg-surface-bright/90 px-3 py-1 font-label-sm text-[10px] font-bold uppercase tracking-widest text-primary backdrop-blur-md">
                        Most Popular
                      </span>
                    )}

                    <span
                      className={`absolute right-4 top-4 rounded-full px-3 py-1 font-label-sm text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${statusConfig.badgeClass}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="flex min-h-[390px] flex-col p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                          {getCategoryName(packageItem.packageCategoryId)}
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
                          {formatCurrency(packageItem.price)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-3 font-body-md text-body-md text-on-surface-variant">
                      {packageItem.description || "No package description yet."}
                    </p>

                    <div className="mt-5 flex items-center gap-2 font-label-md text-label-md text-on-surface">
                      <AppIcon
                        name="calendar_month"
                        size={18}
                        className="text-secondary"
                      />
                      <span>{packageItem.durationHours} hours coverage</span>
                    </div>

                    {visibleHighlights.length > 0 ? (
                      <ul className="mt-4 space-y-2">
                        {visibleHighlights.map((highlight, index) => (
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
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 font-label-sm text-label-sm text-on-surface-variant/70">
                        No service highlights have been added.
                      </p>
                    )}

                    <div className="mt-auto flex gap-3 border-t border-outline-variant/20 pt-5">
                      <button
                        type="button"
                        onClick={() => openEditPackage(packageItem)}
                        disabled={deleting}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <AppIcon name="edit" size={18} />
                        Edit Package
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePackage(packageItem)}
                        disabled={deleting}
                        aria-label={`Remove ${packageItem.name}`}
                        title="Remove package"
                        className="inline-flex w-12 shrink-0 items-center justify-center rounded-lg border border-error/30 text-error transition-colors hover:bg-error-container/50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deleting ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-error/30 border-t-error" />
                        ) : (
                          <AppIcon name="delete" size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {categories.length > 0 && (
              <button
                type="button"
                onClick={openCreatePackage}
                className="group flex min-h-[520px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/60 bg-surface-container-low/30 p-10 text-center transition-all hover:border-primary/50 hover:bg-surface-container-low"
              >
                <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container transition-all duration-300 group-hover:bg-primary group-hover:text-on-primary">
                  <AppIcon name="add" size={32} />
                </span>
                <span className="font-headline-md text-headline-md text-on-surface">
                  Create New Package
                </span>
                <span className="mt-2 max-w-xs font-body-md text-body-md text-on-surface-variant">
                  Add another {getCategoryName(activeCategoryId)} package for
                  your clients.
                </span>
              </button>
            )}
          </>
        )}
      </section>

      {!loading && filteredPackages.length === 0 && categories.length > 0 && (
        <div className="mt-stack-sm rounded-xl border border-outline-variant/30 bg-surface-container-low/40 px-6 py-5">
          <p className="font-label-md text-label-md text-on-surface">
            No packages are available in this category.
          </p>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Use the create card above to add the first{" "}
            {getCategoryName(activeCategoryId)} package.
          </p>
        </div>
      )}

      <section className="mt-stack-lg">
        <header className="mb-stack-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Quick Price Summary
            </h2>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              Review package pricing and availability in one place.
            </p>
          </div>

          {latestUpdatedAt && (
            <time
              dateTime={latestUpdatedAt.toISOString()}
              className="w-fit rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm text-on-surface-variant"
            >
              Last updated: {formatUpdatedDate(latestUpdatedAt)}
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
                {packagesLoading ? (
                  Array.from({ length: 3 }, (_, index) => (
                    <tr key={index}>
                      <td colSpan={6} className="px-6 py-4">
                        <SkeletonLoader className="h-10" />
                      </td>
                    </tr>
                  ))
                ) : packages.length > 0 ? (
                  packages.map((packageItem) => {
                    const statusConfig =
                      PACKAGE_STATUS[packageItem.status] ||
                      PACKAGE_STATUS.inactive;
                    const deleting = deletingId === packageItem.id;

                    return (
                      <tr
                        key={packageItem.id}
                        className="transition-colors hover:bg-surface-container-low/50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-label-md text-label-md text-on-surface">
                            {packageItem.name}
                          </p>
                          <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant/60">
                            Firestore ID: {packageItem.id}
                          </p>
                          {packageItem.featured && (
                            <p className="mt-0.5 font-label-sm text-label-sm text-secondary">
                              Most popular package
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                          {getCategoryName(packageItem.packageCategoryId)}
                        </td>
                        <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                          {packageItem.durationHours} hours
                        </td>
                        <td className="px-6 py-4 font-body-md text-body-md text-on-surface">
                          {formatCurrency(packageItem.price)}
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
                              onClick={() => openEditPackage(packageItem)}
                              disabled={deleting}
                              aria-label={`Edit ${packageItem.name}`}
                              title="Edit package"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <AppIcon name="edit" size={19} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePackage(packageItem)}
                              disabled={deleting}
                              aria-label={`Remove ${packageItem.name}`}
                              title="Remove package"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container/60 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deleting ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-error/30 border-t-error" />
                              ) : (
                                <AppIcon name="delete" size={19} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center font-body-md text-body-md text-on-surface-variant"
                    >
                      No package data is available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </section>
  );
}