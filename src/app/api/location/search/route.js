const NOMINATIM_SEARCH_URL =
  process.env.NOMINATIM_SEARCH_URL?.trim() ||
  "https://nominatim.openstreetmap.org/search";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_REQUEST_INTERVAL_MS = 1100;
const MAX_CACHE_ENTRIES = 100;

const searchCache = new Map();

let requestQueue = Promise.resolve();
let lastExternalRequestAt = 0;

function normalizeQuery(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function getCacheKey(query) {
  return query.toLocaleLowerCase("id-ID");
}

function getCachedResult(query) {
  const key = getCacheKey(query);
  const cached = searchCache.get(key);

  if (!cached) return null;

  if (
    Date.now() - cached.createdAt >
    CACHE_TTL_MS
  ) {
    searchCache.delete(key);
    return null;
  }

  return cached.result;
}

function setCachedResult(query, result) {
  const key = getCacheKey(query);

  if (
    searchCache.size >= MAX_CACHE_ENTRIES &&
    !searchCache.has(key)
  ) {
    const oldestKey =
      searchCache.keys().next().value;

    if (oldestKey) {
      searchCache.delete(oldestKey);
    }
  }

  searchCache.set(key, {
    createdAt: Date.now(),
    result,
  });
}

function createUserAgent() {
  const configured =
    process.env.NOMINATIM_USER_AGENT?.trim();

  if (configured) return configured;

  const contact =
    process.env.NOMINATIM_CONTACT_EMAIL?.trim();

  return contact
    ? `RafiPicture/1.0 (contact: ${contact})`
    : "RafiPicture/1.0";
}

async function withNominatimRateLimit(callback) {
  const currentJob = requestQueue.then(
    async () => {
      const elapsed =
        Date.now() - lastExternalRequestAt;

      const waitTime =
        Math.max(
          MIN_REQUEST_INTERVAL_MS - elapsed,
          0,
        );

      if (waitTime > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, waitTime),
        );
      }

      try {
        return await callback();
      } finally {
        lastExternalRequestAt = Date.now();
      }
    },
  );

  /*
   * Queue harus tetap hidup walaupun satu request gagal.
   */
  requestQueue = currentJob.catch(() => {});

  return currentJob;
}

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const query =
      normalizeQuery(
        searchParams.get("q"),
      );

    if (query.length < 3) {
      return Response.json(
        {
          success: false,
          message:
            "Lokasi minimal 3 karakter.",
        },
        {
          status: 400,
        },
      );
    }

    if (query.length > 180) {
      return Response.json(
        {
          success: false,
          message:
            "Alamat terlalu panjang.",
        },
        {
          status: 400,
        },
      );
    }

    const cached =
      getCachedResult(query);

    if (cached) {
      return Response.json({
        success: true,
        result: cached,
        cached: true,
      });
    }

    const result =
      await withNominatimRateLimit(
        async () => {
          const url =
            new URL(
              NOMINATIM_SEARCH_URL,
            );

          url.searchParams.set(
            "q",
            query,
          );
          url.searchParams.set(
            "format",
            "jsonv2",
          );
          url.searchParams.set(
            "limit",
            "1",
          );
          url.searchParams.set(
            "countrycodes",
            "id",
          );
          url.searchParams.set(
            "addressdetails",
            "1",
          );
          url.searchParams.set(
            "accept-language",
            "id",
          );

          const response =
            await fetch(
              url.toString(),
              {
                method: "GET",
                headers: {
                  Accept:
                    "application/json",
                  "User-Agent":
                    createUserAgent(),
                },
              },
            );

          if (!response.ok) {
            throw new Error(
              `Geocoding service returned ${response.status}.`,
            );
          }

          const rows =
            await response.json();

          const first =
            Array.isArray(rows)
              ? rows[0]
              : null;

          if (!first) {
            return null;
          }

          const lat =
            Number(first.lat);
          const lng =
            Number(first.lon);

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
          ) {
            return null;
          }

          return {
            lat,
            lng,
            displayName:
              String(
                first.display_name ||
                  query,
              ).trim(),
            category:
              first.category ?? null,
            type:
              first.type ?? null,
          };
        },
      );

    if (!result) {
      return Response.json(
        {
          success: false,
          message:
            "Lokasi tidak ditemukan. Coba masukkan nama venue atau alamat yang lebih lengkap.",
        },
        {
          status: 404,
        },
      );
    }

    setCachedResult(
      query,
      result,
    );

    return Response.json({
      success: true,
      result,
      cached: false,
    });
  } catch (error) {
    console.error(
      "LOCATION SEARCH API ERROR:",
      error,
    );

    return Response.json(
      {
        success: false,
        message:
          "Pencarian lokasi sedang tidak tersedia. Silakan coba lagi atau pilih titik langsung pada peta.",
      },
      {
        status: 500,
      },
    );
  }
}
