const EARTH_RADIUS_KM = 6371.0088;

const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const DEFAULT_MAP_CENTER = {
  lat: -2.548926,
  lng: 118.0148634,
};

export const AGENCY_LOCATION = {
  name:
    process.env.NEXT_PUBLIC_AGENCY_NAME?.trim() ||
    "Agency",
  coordinates: {
    lat: toFiniteNumber(
      process.env.NEXT_PUBLIC_AGENCY_LAT,
    ),
    lng: toFiniteNumber(
      process.env.NEXT_PUBLIC_AGENCY_LNG,
    ),
  },
};

/*
 * Distance charge policy
 *
 * <= 15 km          : Rp0
 * >15 km - 20 km    : Rp50.000
 * >20 km - 25 km    : Rp100.000
 * >25 km - 30 km    : Rp150.000
 * dst.
 *
 * Perhitungan memakai jarak garis lurus (Haversine).
 */
export const DISTANCE_CHARGE_POLICY = Object.freeze({
  version: "distance-v1",
  freeDistanceKm: 15,
  stepKm: 5,
  chargePerStep: 50_000,
  currency: "IDR",
});

export function isValidCoordinates(value) {
  const lat = toFiniteNumber(value?.lat);
  const lng = toFiniteNumber(value?.lng);

  return (
    lat !== null &&
    lng !== null &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function normalizeCoordinates(value) {
  if (!isValidCoordinates(value)) return null;

  return {
    lat: Number(value.lat),
    lng: Number(value.lng),
  };
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function calculateHaversineDistanceKm(
  origin,
  destination,
) {
  const first = normalizeCoordinates(origin);
  const second = normalizeCoordinates(destination);

  if (!first || !second) return null;

  const latitudeDifference = toRadians(
    second.lat - first.lat,
  );
  const longitudeDifference = toRadians(
    second.lng - first.lng,
  );

  const firstLatitude = toRadians(first.lat);
  const secondLatitude = toRadians(second.lat);

  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const angularDistance =
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine),
    );

  return EARTH_RADIUS_KM * angularDistance;
}

export function roundDistanceKm(value, precision = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;

  const factor = 10 ** precision;
  return Math.round(number * factor) / factor;
}

/*
 * Menghitung charge berdasarkan jarak yang SUDAH dibulatkan
 * agar angka yang user lihat sama dengan angka yang dipakai
 * dalam perhitungan charge.
 *
 * Formula:
 *   distance <= 15 => 0
 *   distance > 15  =>
 *     ceil((distance - 15) / 5) * 50.000
 *
 * Contoh:
 *   15.00 km => Rp0
 *   15.01 km => Rp50.000
 *   20.00 km => Rp50.000
 *   20.01 km => Rp100.000
 */
export function calculateDistanceCharge(
  distanceKm,
  policy = DISTANCE_CHARGE_POLICY,
) {
  const distance = toFiniteNumber(distanceKm);

  const freeDistanceKm =
    toFiniteNumber(policy?.freeDistanceKm) ?? 15;
  const stepKm =
    Math.max(
      toFiniteNumber(policy?.stepKm) ?? 5,
      0.01,
    );
  const chargePerStep =
    Math.max(
      toFiniteNumber(policy?.chargePerStep) ?? 50_000,
      0,
    );

  const base = {
    policyVersion:
      String(policy?.version || "distance-v1"),
    currency:
      String(policy?.currency || "IDR"),
    freeDistanceKm,
    stepKm,
    chargePerStep,
  };

  if (distance === null) {
    return {
      ...base,
      applicable: false,
      chargeSteps: 0,
      excessDistanceKm: null,
      amount: 0,
    };
  }

  if (distance <= freeDistanceKm) {
    return {
      ...base,
      applicable: false,
      chargeSteps: 0,
      excessDistanceKm: 0,
      amount: 0,
    };
  }

  const excessDistanceKm =
    roundDistanceKm(
      distance - freeDistanceKm,
      2,
    );

  const chargeSteps =
    Math.ceil(excessDistanceKm / stepKm);

  return {
    ...base,
    applicable: true,
    chargeSteps,
    excessDistanceKm,
    amount:
      chargeSteps * chargePerStep,
  };
}

export function createEventLocation({
  venueName = "",
  coordinates = null,
  agencyLocation = AGENCY_LOCATION,
} = {}) {
  const normalizedEventCoordinates =
    normalizeCoordinates(coordinates);
  const normalizedAgencyCoordinates =
    normalizeCoordinates(agencyLocation?.coordinates);

  const rawDistance =
    normalizedEventCoordinates &&
    normalizedAgencyCoordinates
      ? calculateHaversineDistanceKm(
          normalizedAgencyCoordinates,
          normalizedEventCoordinates,
        )
      : null;

  const straightLineKm =
    roundDistanceKm(rawDistance);

  return {
    venueName: String(venueName ?? "").trimStart(),
    coordinates: normalizedEventCoordinates,

    distance: {
      straightLineKm,
      method: "haversine",
      origin: normalizedAgencyCoordinates
        ? {
            name:
              String(
                agencyLocation?.name || "Agency",
              ).trim() || "Agency",
            coordinates: normalizedAgencyCoordinates,
          }
        : null,
    },

    /*
     * Snapshot charge ikut berada di event.location.
     * BookingClient yang sudah memanggil normalizeEventLocation()
     * otomatis akan membawa field ini ke dokumen booking.
     */
    distanceCharge:
      calculateDistanceCharge(
        straightLineKm,
      ),
  };
}

function normalizeStoredDistanceCharge(
  value,
  straightLineKm,
) {
  const storedAmount =
    toFiniteNumber(value?.amount);

  const storedPolicyVersion =
    String(
      value?.policyVersion || "",
    ).trim();

  /*
   * Kalau booking lama sudah punya snapshot policy,
   * pertahankan nominal historisnya.
   */
  if (
    storedAmount !== null &&
    storedPolicyVersion
  ) {
    return {
      policyVersion: storedPolicyVersion,
      currency:
        String(
          value?.currency ||
            DISTANCE_CHARGE_POLICY.currency,
        ),
      freeDistanceKm:
        toFiniteNumber(
          value?.freeDistanceKm,
        ) ??
        DISTANCE_CHARGE_POLICY.freeDistanceKm,
      stepKm:
        toFiniteNumber(
          value?.stepKm,
        ) ??
        DISTANCE_CHARGE_POLICY.stepKm,
      chargePerStep:
        toFiniteNumber(
          value?.chargePerStep,
        ) ??
        DISTANCE_CHARGE_POLICY.chargePerStep,
      applicable:
        value?.applicable === true ||
        storedAmount > 0,
      chargeSteps:
        Math.max(
          Number(value?.chargeSteps) || 0,
          0,
        ),
      excessDistanceKm:
        toFiniteNumber(
          value?.excessDistanceKm,
        ),
      amount:
        Math.max(storedAmount, 0),
    };
  }

  return calculateDistanceCharge(
    straightLineKm,
  );
}

export function normalizeEventLocation(value) {
  if (typeof value === "string") {
    return createEventLocation({ venueName: value });
  }

  const normalized = createEventLocation({
    venueName: value?.venueName ?? "",
    coordinates: value?.coordinates ?? null,
  });

  const storedDistance = Number(
    value?.distance?.straightLineKm,
  );
  const storedOriginCoordinates = normalizeCoordinates(
    value?.distance?.origin?.coordinates,
  );

  if (
    Number.isFinite(storedDistance) &&
    storedOriginCoordinates
  ) {
    const straightLineKm =
      roundDistanceKm(storedDistance);

    return {
      ...normalized,

      distance: {
        straightLineKm,
        method:
          value?.distance?.method || "haversine",
        origin: {
          name:
            String(
              value?.distance?.origin?.name ||
                "Agency",
            ).trim() || "Agency",
          coordinates: storedOriginCoordinates,
        },
      },

      distanceCharge:
        normalizeStoredDistanceCharge(
          value?.distanceCharge,
          straightLineKm,
        ),
    };
  }

  return {
    ...normalized,

    distanceCharge:
      normalizeStoredDistanceCharge(
        value?.distanceCharge,
        normalized.distance?.straightLineKm,
      ),
  };
}

export function formatDistanceKm(value) {
  const distance = Number(value);

  if (!Number.isFinite(distance)) {
    return null;
  }

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(distance);
}
