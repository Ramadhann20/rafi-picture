// =========================
// USERS
// =========================
export const USERS = [
  {
    uid: "u1",
    username: "Admin Rafi",
    email: "admin@rafi.com",
    role: "admin", // admin | customer | crew
    photoUrl: "https://i.pravatar.cc/100"
  }
];


// =========================
// PACKAGES
// =========================

// =========================
// PACKAGES
// =========================

export const PACKAGES = [
  // =====================================================
  // WEDDING
  // packageCategoryId: HAxzPXQu9x60Q6G0vrnl
  // =====================================================

  {
    name: "Signature Wedding",
    packageCategoryId: "HAxzPXQu9x60Q6G0vrnl",

    description:
      "Paket dokumentasi pernikahan lengkap untuk menangkap seluruh rangkaian acara, mulai dari persiapan hingga resepsi.",

    serviceHighlights: [
      "Liputan 10 Jam",
      "2 Fotografer",
      "1 Videografer",
      "Album Premium",
    ],

    price: 45000000,
    durationHours: 10,

    status: "active",
    featured: false,
    sortOrder: 1,

    cover: {
      url: null,
      storagePath: null,
      alt: "Paket Signature Wedding",
    },

    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },

  {
    name: "Classic Union",
    packageCategoryId: "HAxzPXQu9x60Q6G0vrnl",

    description:
      "Paket wedding pilihan utama dengan dokumentasi foto dan video untuk prosesi inti serta momen keluarga.",

    serviceHighlights: [
      "Liputan 8 Jam",
      "2 Fotografer",
      "1 Videografer",
      "Album Mini",
    ],

    price: 28000000,
    durationHours: 8,

    status: "active",
    featured: true,
    sortOrder: 2,

    cover: {
      url: null,
      storagePath: null,
      alt: "Paket Classic Union",
    },

    createdAt: "2026-06-01T08:05:00.000Z",
    updatedAt: "2026-06-01T08:05:00.000Z",
  },

  {
    name: "Essential Wedding",
    packageCategoryId: "HAxzPXQu9x60Q6G0vrnl",

    description:
      "Paket dokumentasi ringkas untuk pernikahan sederhana dengan fokus pada prosesi utama dan sesi keluarga.",

    serviceHighlights: [
      "Liputan 5 Jam",
      "1 Fotografer",
      "1 Videografer",
      "Galeri Digital",
    ],

    price: 15000000,
    durationHours: 5,

    status: "active",
    featured: false,
    sortOrder: 3,

    cover: {
      url: null,
      storagePath: null,
      alt: "Paket Essential Wedding",
    },

    createdAt: "2026-06-01T08:10:00.000Z",
    updatedAt: "2026-06-01T08:10:00.000Z",
  },

  // =====================================================
  // PRE-WEDDING
  // packageCategoryId: MMqQ3Vb3zxa3cWDwndIw
  // =====================================================

  {
    name: "Editorial Journey",
    packageCategoryId: "MMqQ3Vb3zxa3cWDwndIw",

    description:
      "Sesi pre-wedding bergaya editorial dengan konsep visual yang dirancang sesuai karakter pasangan.",

    serviceHighlights: [
      "Sesi 8 Jam",
      "2 Lokasi",
      "2 Fotografer",
      "40 Foto Pilihan",
    ],

    price: 18000000,
    durationHours: 8,

    status: "active",
    featured: true,
    sortOrder: 1,

    cover: {
      url: null,
      storagePath: null,
      alt: "Paket Editorial Journey",
    },

    createdAt: "2026-06-01T08:15:00.000Z",
    updatedAt: "2026-06-01T08:15:00.000Z",
  },

  {
    name: "Natural Escape",
    packageCategoryId: "MMqQ3Vb3zxa3cWDwndIw",

    description:
      "Sesi pre-wedding outdoor dengan pendekatan natural dan pilihan lokasi yang menonjolkan suasana alam.",

    serviceHighlights: [
      "Sesi 6 Jam",
      "2 Lokasi",
      "1 Fotografer",
      "30 Foto Pilihan",
    ],

    price: 12000000,
    durationHours: 6,

    status: "active",
    featured: false,
    sortOrder: 2,

    cover: {
      url: null,
      storagePath: null,
      alt: "Paket Natural Escape",
    },

    createdAt: "2026-06-01T08:20:00.000Z",
    updatedAt: "2026-06-01T08:20:00.000Z",
  },

  {
    name: "Intimate Story",
    packageCategoryId: "MMqQ3Vb3zxa3cWDwndIw",

    description:
      "Paket pre-wedding sederhana untuk pasangan yang menginginkan sesi santai dengan hasil foto personal.",

    serviceHighlights: [
      "Sesi 3 Jam",
      "1 Lokasi",
      "1 Fotografer",
      "20 Foto Pilihan",
    ],

    price: 7500000,
    durationHours: 3,

    status: "active",
    featured: false,
    sortOrder: 3,

    cover: {
      url: null,
      storagePath: null,
      alt: "Paket Intimate Story",
    },

    createdAt: "2026-06-01T08:25:00.000Z",
    updatedAt: "2026-06-01T08:25:00.000Z",
  },

  // =====================================================
  // TUNANGAN
  // packageCategoryId: d1K5SCKplQQ7IcAkgNDF
  // =====================================================

  {
    name: "Engagement Luxe",
    packageCategoryId: "d1K5SCKplQQ7IcAkgNDF",

    description:
      "Dokumentasi acara pertunangan lengkap untuk mengabadikan prosesi, dekorasi, pasangan, dan keluarga.",

    serviceHighlights: [
      "Liputan 6 Jam",
      "2 Fotografer",
      "1 Videografer",
      "Video Highlight",
    ],

    price: 16000000,
    durationHours: 6,

    status: "active",
    featured: true,
    sortOrder: 1,

    cover: {
      url: null,
      storagePath: null,
      alt: "Paket Engagement Luxe",
    },

    createdAt: "2026-06-01T08:30:00.000Z",
    updatedAt: "2026-06-01T08:30:00.000Z",
  },

  {
    name: "Family Intimate",
    packageCategoryId: "d1K5SCKplQQ7IcAkgNDF",

    description:
      "Paket dokumentasi pertunangan untuk acara keluarga dengan suasana hangat dan jumlah tamu terbatas.",

    serviceHighlights: [
      "Liputan 4 Jam",
      "1 Fotografer",
      "1 Videografer",
      "Galeri Digital",
    ],

    price: 10000000,
    durationHours: 4,

    status: "active",
    featured: false,
    sortOrder: 2,

    cover: {
      url: null,
      storagePath: null,
      alt: "Paket Family Intimate",
    },

    createdAt: "2026-06-01T08:35:00.000Z",
    updatedAt: "2026-06-01T08:35:00.000Z",
  },

  {
    name: "Simple Promise",
    packageCategoryId: "d1K5SCKplQQ7IcAkgNDF",

    description:
      "Paket foto pertunangan sederhana yang berfokus pada prosesi utama, pasangan, dan keluarga inti.",

    serviceHighlights: [
      "Liputan 3 Jam",
      "1 Fotografer",
      "20 Foto Pilihan",
      "Galeri Online",
    ],

    price: 6500000,
    durationHours: 3,

    status: "active",
    featured: false,
    sortOrder: 3,

    cover: {
      url: null,
      storagePath: null,
      alt: "Paket Simple Promise",
    },

    createdAt: "2026-06-01T08:40:00.000Z",
    updatedAt: "2026-06-01T08:40:00.000Z",
  },

  // =====================================================
  // ACARA
  // packageCategoryId: 8kXZV0busmkITm7b6itD
  // =====================================================

  {
    name: "Corporate Documentation",
    packageCategoryId: "8kXZV0busmkITm7b6itD",

    description:
      "Dokumentasi profesional untuk seminar, peluncuran produk, gathering, dan kegiatan perusahaan.",

    serviceHighlights: [
      "Liputan 8 Jam",
      "2 Fotografer",
      "1 Videografer",
      "Video Highlight",
    ],

    price: 20000000,
    durationHours: 8,

    status: "active",
    featured: true,
    sortOrder: 1,

    cover: {
      url: null,
      storagePath: null,
      alt: "Paket Corporate Documentation",
    },

    createdAt: "2026-06-01T08:45:00.000Z",
    updatedAt: "2026-06-01T08:45:00.000Z",
  },

  {
    name: "Celebration Story",
    packageCategoryId: "8kXZV0busmkITm7b6itD",

    description:
      "Paket dokumentasi untuk ulang tahun, anniversary, bridal shower, dan perayaan keluarga lainnya.",

    serviceHighlights: [
      "Liputan 5 Jam",
      "1 Fotografer",
      "1 Videografer",
      "30 Foto Pilihan",
    ],

    price: 12000000,
    durationHours: 5,

    status: "active",
    featured: false,
    sortOrder: 2,

    cover: {
      url: null,
      storagePath: null,
      alt: "Paket Celebration Story",
    },

    createdAt: "2026-06-01T08:50:00.000Z",
    updatedAt: "2026-06-01T08:50:00.000Z",
  },

  {
    name: "Graduation Moments",
    packageCategoryId: "8kXZV0busmkITm7b6itD",

    description:
      "Paket dokumentasi wisuda untuk individu, pasangan, atau keluarga dengan sesi foto formal dan kasual.",

    serviceHighlights: [
      "Sesi 3 Jam",
      "1 Fotografer",
      "2 Lokasi",
      "20 Foto Pilihan",
    ],

    price: 7000000,
    durationHours: 3,

    status: "active",
    featured: false,
    sortOrder: 3,

    cover: {
      url: null,
      storagePath: null,
      alt: "Paket Graduation Moments",
    },

    createdAt: "2026-06-01T08:55:00.000Z",
    updatedAt: "2026-06-01T08:55:00.000Z",
  },
];

export const PACKAGE_CATEGORIES = [
  {
    id: "HAxzPXQu9x60Q6G0vrnl",
    name: "Wedding",
    slug: "wedding",
    icon: "favorite",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "MMqQ3Vb3zxa3cWDwndIw",
    name: "Pre-Wedding",
    slug: "pre-wedding",
    icon: "photo_camera",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "d1K5SCKplQQ7IcAkgNDF",
    name: "Tunangan",
    slug: "tunangan",
    icon: "person",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "8kXZVObusmkITm7b6itD",
    name: "Acara",
    slug: "acara",
    icon: "calendar_month",
    sortOrder: 4,
    isActive: true,
  },
];


// =========================
// BOOKINGS
// =========================
export const BOOKINGS = [
  {
    id: "b1",

    client: {
      name: "Alya",
      partnerName: "Bima",
      email: "",
      phone: "08123456789",
      instagram: "@alya_bima"
    },

    event: {
      preferredDate: "2026-06-10",
      location: "Bandung",
      vision: "Casual and fun wedding with natural poses"
    },

    userId: "u1",
    packageId: "p1",

    bookingStatus: "pending",
    // pending | confirmed | rejected | completed

    source: "website_booking_form",
    submittedAt: "2026-06-01T10:00:00Z",
  }
];


// =========================
// SCHEDULES
// =========================
export const SCHEDULES = [
  {
    id: "s1",

    bookingId: "b1",

    date: "2026-06-10",
    startTime: "08:00",
    endTime: "16:00",

    scheduleStatus: "booked"
    // available | booked | conflict
  }
];


// =========================
// PAYMENTS
// =========================
export const PAYMENTS = [
  {
    id: "pay1",
    bookingId: "b1",

    type: "DP", // DP | FULL

    amount: 1500000,
    percent: 30,

    paymentStatus: "verified",
    // unpaid | half_paid | paid | rejected

    proofImage: "/proof/pay1.jpg"
  }
];



// =========================
// CREWS
// =========================

export const CREWS = [
  {
    id: "c1",
    name: "Rizky Pratama",
    email: "rizky@rafipicture.com",
    phone: "081234567890",

    baseRole: "lead_photographer",

    skills: [
      "wedding",
      "prewedding",
      "outdoor",
    ],

    employmentStatus: "active",

    avatarUrl: null,
    userId: null,

    notes:
      "Berpengalaman menangani wedding outdoor dan menjadi lead photographer.",

    createdAt: "2026-01-10T08:00:00.000Z",
    updatedAt: "2026-06-20T09:30:00.000Z",
  },

  {
    id: "c2",
    name: "Dimas Saputra",
    email: "dimas@rafipicture.com",
    phone: "081298765432",

    baseRole: "videographer",

    skills: [
      "wedding",
      "cinematic_video",
      "drone",
    ],

    employmentStatus: "active",

    avatarUrl: null,
    userId: null,

    notes:
      "Fokus pada video cinematic dan pengambilan gambar menggunakan drone.",

    createdAt: "2026-01-12T08:00:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
  },

  {
    id: "c3",
    name: "Aldi Kurniawan",
    email: "aldi@rafipicture.com",
    phone: "081377788899",

    baseRole: "assistant_photographer",

    skills: [
      "lighting",
      "equipment",
      "documentation",
    ],

    employmentStatus: "active",

    avatarUrl: null,
    userId: null,

    notes:
      "Membantu pengaturan lighting, perlengkapan, dan dokumentasi acara.",

    createdAt: "2026-02-01T08:00:00.000Z",
    updatedAt: "2026-06-15T08:45:00.000Z",
  },

  {
    id: "c4",
    name: "Nabila Putri",
    email: "nabila@rafipicture.com",
    phone: "081355566677",

    baseRole: "photographer",

    skills: [
      "prewedding",
      "portrait",
      "indoor",
    ],

    employmentStatus: "active",

    avatarUrl: null,
    userId: null,

    notes:
      "Berpengalaman dalam portrait, prewedding, dan sesi foto indoor.",

    createdAt: "2026-02-15T08:00:00.000Z",
    updatedAt: "2026-06-22T11:15:00.000Z",
  },

  {
    id: "c5",
    name: "Fajar Ramadhan",
    email: "fajar@rafipicture.com",
    phone: "081322233344",

    baseRole: "editor",

    skills: [
      "photo_editing",
      "color_grading",
      "album_design",
    ],

    employmentStatus: "active",

    avatarUrl: null,
    userId: null,

    notes:
      "Bertanggung jawab atas editing foto, color grading, dan desain album.",

    createdAt: "2026-03-01T08:00:00.000Z",
    updatedAt: "2026-06-19T07:30:00.000Z",
  },

  {
    id: "c6",
    name: "Siti Maharani",
    email: "siti@rafipicture.com",
    phone: "081344455566",

    baseRole: "videographer",

    skills: [
      "traditional_wedding",
      "documentary",
      "short_video",
    ],

    employmentStatus: "on_leave",

    avatarUrl: null,
    userId: null,

    notes:
      "Sedang mengambil cuti dan belum dapat menerima assignment baru.",

    createdAt: "2026-03-10T08:00:00.000Z",
    updatedAt: "2026-06-24T13:00:00.000Z",
  },
];

// =========================
// CREW ASSIGNMENTS
// =========================

export const ASSIGNMENTS = [
  {
    id: "a1",

    bookingId: "b1",

    crewIds: [
      "c1",
      "c2",
      "c3",
    ],

    task: "Wedding Documentation",

    eventDate: "2026-07-12",
    startTime: "08:00",
    endTime: "18:00",

    location: "The Westin Surabaya",

    status: "published",

    notes:
      "Tim hadir satu jam sebelum acara dimulai.",

    createdAt: "2026-06-20T08:00:00.000Z",
    updatedAt: "2026-06-20T08:00:00.000Z",
  },

  {
    id: "a2",

    bookingId: "b2",

    crewIds: [
      "c2",
      "c3",
      "c4",
    ],

    task: "Prewedding Photoshoot",

    eventDate: "2026-07-18",
    startTime: "06:00",
    endTime: "12:00",

    location: "Bromo, Jawa Timur",

    status: "published",

    notes:
      "Membawa perlengkapan outdoor dan lighting portable.",

    createdAt: "2026-06-21T09:00:00.000Z",
    updatedAt: "2026-06-22T10:00:00.000Z",
  },

  {
    id: "a3",

    bookingId: "b3",

    crewIds: [
      "c1",
      "c3",
      "c4",
    ],

    task: "Engagement Documentation",

    eventDate: "2026-07-25",
    startTime: "09:00",
    endTime: "15:00",

    location: "Grand Mercure Malang",

    status: "published",

    notes:
      "Fokus pada dokumentasi keluarga dan sesi portrait pasangan.",

    createdAt: "2026-06-23T08:30:00.000Z",
    updatedAt: "2026-06-23T08:30:00.000Z",
  },

  {
    id: "a4",

    bookingId: "b4",

    crewIds: [
      "c2",
      "c4",
    ],

    task: "Company Profile Production",

    eventDate: "2026-08-02",
    startTime: "08:00",
    endTime: "16:00",

    location: "Surabaya Industrial Estate",

    status: "completed",

    notes:
      "Dokumentasi foto dan video untuk kebutuhan company profile.",

    createdAt: "2026-06-24T08:00:00.000Z",
    updatedAt: "2026-08-03T09:00:00.000Z",
  },

  {
    id: "a5",

    bookingId: "b5",

    crewIds: [
      "c1",
      "c2",
      "c3",
    ],

    task: "Wedding Reception",

    eventDate: "2026-08-10",
    startTime: "10:00",
    endTime: "21:00",

    location: "Hotel Majapahit Surabaya",

    status: "cancelled",

    notes:
      "Assignment dibatalkan karena perubahan jadwal dari client.",

    createdAt: "2026-06-25T09:00:00.000Z",
    updatedAt: "2026-06-26T07:00:00.000Z",
  },
];

// =========================
// HELPER EXAMPLES
// =========================

// Mencari assignment berdasarkan booking.
export function getAssignmentByBookingId(
  bookingId,
) {
  return (
    ASSIGNMENTS.find(
      (assignment) =>
        assignment.bookingId === bookingId,
    ) ?? null
  );
}

// Mengambil data lengkap kru dari suatu assignment.
export function getAssignedCrews(
  assignment,
) {
  if (!assignment) return [];

  return CREWS.filter((crew) =>
    assignment.crewIds.includes(crew.id),
  );
}

// Contoh:
// const assignment = getAssignmentByBookingId("b1");
// const assignedCrews = getAssignedCrews(assignment);

