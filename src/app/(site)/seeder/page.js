"use client";

import { useState } from "react";
import { useDb } from "@/context/DbContext";

import {
  PACKAGES,
  PACKAGE_CATEGORIES,
} from "@/lib/dummy/dataDummy";

const COLLECTIONS = {
  categories: "PackageCategories",
  packages: "Packages",
};

function withoutId(item) {
  const { id, ...payload } = item;
  return payload;
}

export default function SeederPage() {
  const {
    setDoc,
    deleteCollection,
  } = useDb();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const run = async (fn) => {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      await fn();
    } catch (error) {
      console.error("PACKAGE SEED ERROR:", error);
      setMessage(
        error?.message ||
          "Terjadi kesalahan saat memproses package seed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const seedRows = async (
    collectionName,
    rows,
  ) => {
    for (const row of rows) {
      if (!row?.id) {
        throw new Error(
          `Seed ${collectionName} memiliki item tanpa id.`,
        );
      }

      await setDoc(
        collectionName,
        row.id,
        withoutId(row),
      );
    }
  };

  const seedCategories = async ({
    clear = false,
  } = {}) => {
    if (clear) {
      await deleteCollection(
        COLLECTIONS.categories,
      );
    }

    await seedRows(
      COLLECTIONS.categories,
      PACKAGE_CATEGORIES,
    );
  };

  const seedPackages = async ({
    clear = false,
  } = {}) => {
    /*
     * Packages bergantung pada deterministic category ids.
     * Upsert kategori dulu agar packageCategoryId selalu valid.
     */
    await seedCategories();

    if (clear) {
      await deleteCollection(
        COLLECTIONS.packages,
      );
    }

    await seedRows(
      COLLECTIONS.packages,
      PACKAGES,
    );
  };

  const handleResetAndSeedAll = () =>
    run(async () => {
      /*
       * Hapus data lama/deprecated terlebih dahulu.
       * Packages dihapus sebelum categories.
       */
      await deleteCollection(
        COLLECTIONS.packages,
      );
      await deleteCollection(
        COLLECTIONS.categories,
      );

      await seedRows(
        COLLECTIONS.categories,
        PACKAGE_CATEGORIES,
      );

      await seedRows(
        COLLECTIONS.packages,
        PACKAGES,
      );

      setMessage(
        `${PACKAGE_CATEGORIES.length} kategori dan ${PACKAGES.length} paket berhasil di-seed.`,
      );
    });

  const handleSeedCategories = () =>
    run(async () => {
      await seedCategories({
        clear: true,
      });

      setMessage(
        `${PACKAGE_CATEGORIES.length} kategori berhasil di-reset dan di-seed.`,
      );
    });

  const handleSeedPackages = () =>
    run(async () => {
      await seedPackages({
        clear: true,
      });

      setMessage(
        `${PACKAGES.length} paket berhasil di-reset dan di-seed.`,
      );
    });

  const handleClearAll = () =>
    run(async () => {
      await deleteCollection(
        COLLECTIONS.packages,
      );
      await deleteCollection(
        COLLECTIONS.categories,
      );

      setMessage(
        "Packages dan PackageCategories sudah dikosongkan.",
      );
    });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header>
        <p className="text-sm uppercase tracking-[0.18em] text-gray-500">
          Development Utility
        </p>

        <h1 className="mt-1 text-2xl font-bold">
          Package Seeder 2026
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Seeder ini hanya mengelola PackageCategories dan Packages.
          Gunakan Reset & Seed All untuk menghapus data package lama
          lalu memasukkan data Pricelist 2026.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">
            Categories
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {PACKAGE_CATEGORIES.length}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">
            Packages
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {PACKAGES.length}
          </p>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleResetAndSeedAll}
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Processing..."
            : "Reset & Seed All"}
        </button>

        <button
          type="button"
          onClick={handleSeedCategories}
          disabled={loading}
          className="rounded-lg border px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset Categories
        </button>

        <button
          type="button"
          onClick={handleSeedPackages}
          disabled={loading}
          className="rounded-lg border px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset Packages
        </button>

        <button
          type="button"
          onClick={handleClearAll}
          disabled={loading}
          className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear Package Data
        </button>
      </section>

      {message ? (
        <div
          role="status"
          className="rounded-lg border bg-gray-50 px-4 py-3 text-sm"
        >
          {message}
        </div>
      ) : null}

      <section className="rounded-xl border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">
            Seed Content
          </h2>
        </div>

        <div className="divide-y">
          {PACKAGE_CATEGORIES.map(
            (category) => {
              const packageCount =
                PACKAGES.filter(
                  (item) =>
                    item.packageCategoryId ===
                    category.id,
                ).length;

              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {category.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {category.id}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                    {packageCount} package
                  </span>
                </div>
              );
            },
          )}
        </div>
      </section>
    </main>
  );
}
