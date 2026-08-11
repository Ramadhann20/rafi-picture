import fs from "node:fs";
import path from "node:path";

const PORTFOLIO_DIRECTORY = path.join(
  process.cwd(),
  "public",
  "images-porto",
);

const SUPPORTED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
]);

function toPublicUrl(relativePath) {
  const normalized = relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `/images-porto/${normalized}`;
}

function toAltText(relativePath) {
  const filename = path.basename(
    relativePath,
    path.extname(relativePath),
  );

  const readable = filename
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return readable
    ? `${readable} - Portofolio Rafi Picture`
    : "Portofolio Rafi Picture";
}

function walkDirectory(directory, baseDirectory) {
  const entries = fs.readdirSync(
    directory,
    { withFileTypes: true },
  );

  return entries.flatMap((entry) => {
    const absolutePath = path.join(
      directory,
      entry.name,
    );

    if (entry.isDirectory()) {
      return walkDirectory(
        absolutePath,
        baseDirectory,
      );
    }

    if (!entry.isFile()) {
      return [];
    }

    const extension = path
      .extname(entry.name)
      .toLowerCase();

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      return [];
    }

    const relativePath = path.relative(
      baseDirectory,
      absolutePath,
    );

    return [
      {
        id: relativePath,
        src: toPublicUrl(relativePath),
        alt: toAltText(relativePath),
      },
    ];
  });
}

/**
 * Server-only helper.
 *
 * Membaca semua image yang ada di:
 * public/images-porto
 *
 * Folder di dalam images-porto juga didukung secara recursive.
 */
export function getPortfolioImages() {
  if (!fs.existsSync(PORTFOLIO_DIRECTORY)) {
    return [];
  }

  try {
    return walkDirectory(
      PORTFOLIO_DIRECTORY,
      PORTFOLIO_DIRECTORY,
    ).sort((a, b) =>
      a.id.localeCompare(b.id),
    );
  } catch (error) {
    console.error(
      "[portfolioImages] Gagal membaca public/images-porto:",
      error,
    );

    return [];
  }
}
