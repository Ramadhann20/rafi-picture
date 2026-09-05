// ============================================================
// RAFI PICTURE - PACKAGE & CATEGORY SEED DATA
// Pricelist 2026
//
// File ini sengaja hanya berisi data yang dibutuhkan untuk
// inject PackageCategories dan Packages.
// ============================================================

const PACKAGE_IMAGE_BY_SLUG = {
  "classic-a-wedding-package": "/images-package/ClassicA.jpg",
  "classic-b-wedding-package": "/images-package/ClassicB.jpg",
  "bronze-wedding-package": "/images-package/WBronze.jpg",
  "silver-wedding-package": "/images-package/WSilver.jpeg",
  "gold-wedding-package": "/images-package/WGold.jpg",
  "platinum-wedding-package": "/images-package/WPlatinum.jpg",

  "prewedding-bronze": "/images-package/PWBronze.jpg",
  "prewedding-silver": "/images-package/PWSilver.jpg",

  "engagement-bronze": "/images-package/EBronze.jpg",
  "engagement-silver": "/images-package/ESilver.jpg",

  "bronze-pengajian-siraman": "/images-package/Siraman.jpg",
  "silver-pengajian-siraman": "/images-package/Siraman2.jpg",

  "prewedding-wedding-bundle": "/images-package/Wfull.jpg",
};

function makeCover(slug, packageName) {
  return {
    url: PACKAGE_IMAGE_BY_SLUG[slug] || null,
    storagePath: null,
    alt: `${packageName} - Rafi Picture`,
  };
}

export const PACKAGE_CATEGORIES = [
  {
    id: "wedding",
    name: "Wedding",
    slug: "wedding",
    icon: "event",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "prewedding",
    name: "Prewedding",
    slug: "prewedding",
    icon: "photo_camera",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "engagement",
    name: "Engagement",
    slug: "engagement",
    icon: "person",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "acara",
    name: "Acara",
    slug: "acara",
    icon: "calendar_month",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "bundle",
    name: "Bundle",
    slug: "bundle",
    icon: "shopping_bag",
    sortOrder: 5,
    isActive: true,
  },
];

export const PACKAGES = [
  // ==========================================================
  // WEDDING
  // ==========================================================
  {
    id: "classic-a-wedding-package",
    name: "Classic A Wedding Package",
    packageCategoryId: "wedding",
    description:
      "Paket dokumentasi wedding foto untuk kebutuhan dokumentasi inti dengan fotografer dan asisten fotografer.",
    bookingSubjectType: "couple",
    serviceHighlights: [
      "1 Photographer",
      "1 Assistant Photographer",
      "Edited 100 Photos",
      "All Data (Soft File)",
      "Google Drive & Flashdisk",
      "Wedding Documentation",
    ],
    price: 1999000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 1,
    cover: makeCover(
      "classic-a-wedding-package",
      "Classic A Wedding Package",
    ),
  },

  {
    id: "classic-b-wedding-package",
    name: "Classic B Wedding Package",
    packageCategoryId: "wedding",
    description:
      "Paket wedding foto dengan album dan frame untuk dokumentasi acara serta hasil cetak pilihan.",
    bookingSubjectType: "couple",
    serviceHighlights: [
      "1 Photographer",
      "1 Assistant Photographer",
      "Edited 100 Photos",
      "Magazine Album 10 Sheets",
      "16RP + Big Frame 1 Pc",
      "Google Drive & Flashdisk",
    ],
    price: 2599000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 2,
    cover: makeCover(
      "classic-b-wedding-package",
      "Classic B Wedding Package",
    ),
  },
  
  {
    id: "bronze-wedding-package",
    name: "Bronze Wedding Package",
    packageCategoryId: "wedding",
    description:
      "Paket wedding foto dan video dengan cinematic highlight, album, serta frame untuk dokumentasi acara.",
    bookingSubjectType: "couple",
    serviceHighlights: [
      "1 Photographer + 1 Assistant",
      "1 Videographer",
      "Edited 100 Photos",
      "Wedding Cinematic Video 2-3 Minutes",
      "Magazine Album 10 Sheets + Standard Box",
      "16RP + Big Frame 1 Pc",
    ],
    price: 3799000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 3,
    cover: makeCover(
      "bronze-wedding-package",
      "Bronze Wedding Package",
    ),
  },
  {
    id: "silver-wedding-package",
    name: "Silver Wedding Package",
    packageCategoryId: "wedding",
    description:
      "Paket wedding foto dan video dengan dua fotografer, cinematic video, teaser, album eksklusif, serta frame.",
    bookingSubjectType: "couple",
    serviceHighlights: [
      "2 Photographers + 1 Assistant",
      "1 Videographer",
      "Edited 100 Photos",
      "Wedding Cinematic + 1 Minute Teaser",
      "Magazine Album 10 Sheets + Exclusive Box",
      "16RP + Big Frame 2 Pcs",
    ],
    price: 4599000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 4,
    cover: makeCover(
      "silver-wedding-package",
      "Silver Wedding Package",
    ),
  },
  {
    id: "gold-wedding-package",
    name: "Gold Wedding Package",
    packageCategoryId: "wedding",
    description:
      "Paket wedding lengkap dengan tim foto dan video, cinematic serta teaser Instagram, album single eksklusif, dan frame.",
    bookingSubjectType: "couple",
    serviceHighlights: [
      "2 Photographers + 1 Assistant",
      "1 Videographer",
      "Wedding Cinematic Video",
      "1 Minute Teaser for Instagram",
      "Magazine Album Single 10 Sheets + Exclusive Box",
      "Large & Small Frames",
    ],
    price: 4699000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 5,
    cover: makeCover(
      "gold-wedding-package",
      "Gold Wedding Package",
    ),
  },
  {
    id: "platinum-wedding-package",
    name: "Platinum Wedding Package",
    packageCategoryId: "wedding",
    description:
      "Paket wedding premium dengan tim foto dan video, cinematic serta teaser Instagram, album double eksklusif, dan frame.",
    bookingSubjectType: "couple",
    serviceHighlights: [
      "2 Photographers + 1 Assistant",
      "1 Videographer",
      "Wedding Cinematic Video",
      "1 Minute Teaser for Instagram",
      "Magazine Album Double 20 Sheets + Exclusive Box",
      "Large & Small Frames",
    ],
    price: 5799000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 6,
    cover: makeCover(
      "platinum-wedding-package",
      "Platinum Wedding Package",
    ),
  },

  // ==========================================================
  // PREWEDDING
  // ==========================================================
  {
    id: "prewedding-bronze",
    name: "Prewedding Bronze",
    packageCategoryId: "prewedding",
    description:
      "Paket prewedding photos only untuk satu lokasi dengan hasil edit pilihan, frame, dan seluruh file foto melalui Google Drive.",
    bookingSubjectType: "couple",
    serviceHighlights: [
      "Photos Only",
      "1 Location",
      "Edit 50 Photos",
      "16RP Big Frame 2 Pcs",
      "4R + Frame 10 Pcs",
      "All Photo Files via Google Drive",
    ],
    price: 1499000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 1,
    cover: makeCover(
      "prewedding-bronze",
      "Prewedding Bronze",
    ),
  },
  {
    id: "prewedding-silver",
    name: "Prewedding Silver",
    packageCategoryId: "prewedding",
    description:
      "Paket prewedding foto dan video untuk satu lokasi dengan cinematic video, foto pilihan, frame, dan file melalui Google Drive.",
    bookingSubjectType: "couple",
    serviceHighlights: [
      "Photos & Video",
      "1 Location",
      "Cinematic Video",
      "Edit Selected Photos Max 100",
      "16RP + 4R Frames",
      "All Photo Files via Google Drive",
    ],
    price: 2299000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 2,
    cover: makeCover(
      "prewedding-silver",
      "Prewedding Silver",
    ),
  },

  {
    id: "classic-a-wedding-package",
    name: "Classic A Wedding Package",
    packageCategoryId: "wedding",
    description:
      "Paket dokumentasi wedding foto untuk kebutuhan dokumentasi inti dengan fotografer dan asisten fotografer.",
    bookingSubjectType: "couple",
    serviceHighlights: [
      "1 Photographer",
      "1 Assistant Photographer",
      "Edited 100 Photos",
      "All Data (Soft File)",
      "Google Drive & Flashdisk",
      "Wedding Documentation",
    ],
    price: 1999000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 1,
    cover: makeCover(
      "classic-a-wedding-package",
      "Classic A Wedding Package",
    ),
  },

  // ==========================================================
  // ENGAGEMENT
  // ==========================================================
  {
    id: "engagement-bronze",
    name: "Engagement Bronze",
    packageCategoryId: "engagement",
    description:
      "Paket dokumentasi engagement berbasis foto dengan unlimited shoot selama sesi, foto pilihan, dan seluruh data melalui Google Drive.",
    bookingSubjectType: "couple",
    serviceHighlights: [
      "Photo",
      "Unlimited Shoot",
      "Full Session",
      "Edit Selected Photos",
      "All Data via Google Drive",
      "Engagement Documentation",
    ],
    price: 1099000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 1,
    cover: makeCover(
      "engagement-bronze",
      "Engagement Bronze",
    ),
  },
  {
    id: "engagement-silver",
    name: "Engagement Silver",
    packageCategoryId: "engagement",
    description:
      "Paket dokumentasi engagement foto dan cinematic video dengan unlimited shoot, foto pilihan, serta seluruh data digital.",
    bookingSubjectType: "couple",
    serviceHighlights: [
      "Photo",
      "Cinematic Video",
      "Unlimited Shoot",
      "Full Session",
      "Edit Selected Photos",
      "Google Drive & Flashdisk",
    ],
    price: 1899000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 2,
    cover: makeCover(
      "engagement-silver",
      "Engagement Silver",
    ),
  },

  // ==========================================================
  // PENGAJIAN & SIRAMAN
  // ==========================================================
  {
    id: "bronze-pengajian-siraman",
    name: "Bronze Pengajian & Siraman",
    packageCategoryId: "acara",
    description:
      "Paket dokumentasi foto untuk rangkaian pengajian dan siraman dengan hasil edit dan seluruh data melalui Google Drive.",
    bookingSubjectType: "individual",
    serviceHighlights: [
      "1 Photographer",
      "Edited 50 Files",
      "Edited 50 Photos",
      "All Data (Soft File)",
      "Google Drive",
      "Pengajian & Siraman Documentation",
    ],
    price: 999000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 1,
    cover: makeCover(
      "bronze-pengajian-siraman",
      "Bronze Pengajian & Siraman",
    ),
  },
  {
    id: "silver-pengajian-siraman",
    name: "Silver Pengajian & Siraman",
    packageCategoryId: "acara",
    description:
      "Paket dokumentasi foto dan video untuk rangkaian pengajian dan siraman dengan cinematic video dan hasil edit.",
    bookingSubjectType: "individual",
    serviceHighlights: [
      "1 Photographer",
      "1 Videographer",
      "Cinematic Video",
      "Edited 100 Files",
      "Edited 50 Photos",
      "All Data via Google Drive",
    ],
    price: 1599000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 2,
    cover: makeCover(
      "silver-pengajian-siraman",
      "Silver Pengajian & Siraman",
    ),
  },

  // ==========================================================
  // BUNDLE
  // ==========================================================
  {
    id: "prewedding-wedding-bundle",
    name: "Prewedding + Wedding Bundle",
    packageCategoryId: "bundle",
    description:
      "Bundle dokumentasi Prewedding dan Wedding yang menggabungkan layanan foto, cinematic video, album, frame, dan file digital.",
    bookingSubjectType: "couple",
    serviceHighlights: [
      "Prewedding Photo Session",
      "Wedding Photo",
      "Cinematic + 1 Minute Teaser",
      "Magazine Album Single + Exclusive Box",
      "Large & Small Frames",
      "Google Drive & Flashdisk",
    ],
    sessions: [
      {
        id: "pre-wedding",
        name: "Pre-Wedding",
        durationHours: 8,
      },
      {
        id: "wedding",
        name: "Wedding",
        durationHours: 8,
      },
    ],
    price: 6299000,
    durationHours: 8,
    status: "active",
    featured: false,
    sortOrder: 1,
    cover: makeCover(
      "prewedding-wedding-bundle",
      "Prewedding + Wedding Bundle",
    ),
  },
];
