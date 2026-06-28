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
export const PACKAGES = [
  {
    id: "p1",
    name: "Wedding Premium",
    price: 5000000,
    duration: 8,
    includes: [
      "2 Photographer",
      "1 Videographer",
      "1 Assistant"
    ]
  }
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

