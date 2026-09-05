"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "rafi-picture-language";
const DEFAULT_LANGUAGE = "id";

const translations = {
  id: {
    home: "Beranda",
    portfolio: "Portofolio",
    packages: "Paket",
    booking: "Pemesanan",
    login: "Masuk",
    myAccount: "Akun Saya",
    language: "Bahasa",
    english: "English",
    indonesian: "Bahasa Indonesia",
    nextStep: "Langkah Berikutnya",
    previous: "Sebelumnya",
    heroTitle: "Mengabadikan Momen, Menciptakan Kenangan",
    heroDescription:
      "Setiap momen memiliki cerita, kami mengabadikannya dengan sentuhan profesional dan penuh keindahan.",
    viewPackages: "Lihat Paket",
    bookNow: "Pesan Sekarang",
    whyChooseUs: "Mengapa Memilih Rafi Picture?",
    qualityPhotos: "HASIL FOTO BERKUALITAS",
    qualityPhotosDescription:
      "Menghasilkan foto dengan detail yang tajam, komposisi yang tepat, dan warna yang natural.",
    professionalEditing: "EDITING PROFESIONAL",
    professionalEditingDescription:
      "Setiap foto melalui proses editing untuk menghasilkan tampilan yang clean, estetik, dan konsisten.",
    professionalService: "PELAYANAN PROFESIONAL",
    professionalServiceDescription:
      "Didukung fotografer berpengalaman dengan proses kerja yang terencana dan sesuai kebutuhan setiap klien.",
    footerDescription:
      "Dokumentasi fotografi untuk wedding, prewedding, engagement, dan berbagai momen spesial dengan hasil yang natural, estetik, dan berkarakter.",
    contactMessage:
      "Halo Rafi Picture, saya ingin bertanya mengenai layanan Rafi Picture.",
    navigation: "Navigasi",
    contactUs: "Hubungi Kami",
    connect: "Terhubung",
    information: "Informasi",
    terms: "Syarat & Ketentuan",
    termsDescription:
      "Ketentuan booking, pembayaran, durasi layanan, dan kebijakan layanan Rafi Picture.",
    copyright: "Hak cipta dilindungi.",
    welcomeBack: "Selamat Datang Kembali",
    authLoginDescription:
      "Masuk untuk mengakses galeri pribadi dan mengelola pemesanan Anda.",
    joinStudio: "Bergabung dengan Studio",
    authRegisterDescription:
      "Buat akun dan simpan setiap momen Rafi Picture di satu tempat.",
    signIn: "Masuk",
    createAccount: "Buat Akun",
    emailAddress: "Alamat Email",
    password: "Kata Sandi",
    forgotPassword: "Lupa Kata Sandi?",
    keepSignedIn: "Tetap masuk",
    signingIn: "Sedang Masuk...",
    firstName: "Nama Depan",
    lastName: "Nama Belakang",
    createPassword: "Buat Kata Sandi",
    confirmPassword: "Konfirmasi Kata Sandi",
    sendingVerification: "Mengirim Kode Verifikasi...",
    firstNameLastNameRequired: "Nama depan dan nama belakang wajib diisi.",
    emailRequired: "Alamat email wajib diisi.",
    passwordMinLength: "Kata sandi harus memiliki minimal 8 karakter.",
    passwordMismatch: "Kata sandi tidak cocok.",
    verificationFailed: "Gagal mengirim kode verifikasi.",
    orContinueWith: "Atau lanjutkan dengan",
    firstNamePlaceholder: "Budi",
    lastNamePlaceholder: "Santoso",
    passwordPlaceholder: "Min. 8 karakter",
    repeatPasswordPlaceholder: "Ulangi kata sandi",
    emailPlaceholder: "nama@email.com",
    packageFallbackDescription:
      "Paket fotografi yang dapat disesuaikan dengan kebutuhan acara Anda.",
    viewDetail: "Lihat Detail",
    noPackages: "Belum ada paket tersedia",
    popular: "Paling Populer",
    packageLabel: "Paket",
    startingFrom: "Mulai dari",
    investmentStartingFrom: "Investasi Mulai Dari",
    includedInPackage: "Termasuk dalam Paket",
    reserveDate: "Reservasi Tanggal Anda",
    coverage: "Liputan",
    close: "Tutup",
    termsTitle: "Ketentuan Layanan",
    termsVersion: "Versi Ketentuan",
    termsName: "Ketentuan Layanan Rafi Picture",
    noPackagesDescription: "Paket aktif pada kategori ini akan muncul secara otomatis.",
    stepPackages: "Paket",
    stepEventInfo: "Info Acara",
    stepPersonalDetails: "Data Pribadi",
    stepConfirm: "Konfirmasi",
    yourPackagePlan: "Rencana Paket Anda",
    choosePackageDescription: "Pilih paket dokumentasi yang sesuai dengan jenis acara dan kebutuhan Anda.",
    selected: "Dipilih",
    mostPopular: "Paling Populer",
    selectedPackage: "Paket pilihan Anda",
    changePackage: "Ganti Paket",
    choosePackage: "Pilih Paket",
    noPackageSelected: "Belum ada paket yang dipilih",
    choosePackageDescriptionShort: "Lihat daftar paket berdasarkan kategori, harga, durasi, dan layanan yang tersedia.",
    packageUnavailable: "Paket dari URL tidak ditemukan atau sudah tidak aktif. Silakan pilih paket lainnya.",
    personalInformation: "Informasi Pribadi",
    customerData: "Data Pemesan",
    personalDescription: "Isi data yang dapat dihubungi oleh tim Rafi Picture terkait booking dan kebutuhan acara.",
    fullName: "Nama Lengkap",
    fullNamePlaceholder: "Nama lengkap",
    partnerName: "Nama Pasangan",
    partnerNamePlaceholder: "Nama pasangan",
    phoneNumber: "Nomor Telepon",
    phonePlaceholder: "08xxxxxxxxxx",
    optional: "Opsional",
    additionalNotes: "Catatan Tambahan",
    tellVision: "Ceritakan Visi Anda",
    visionDescription: "Ceritakan konsep, suasana, atau kebutuhan khusus yang kamu inginkan. Bagian ini opsional.",
    visionPlaceholder: "Contoh: konsep intimate, tone hangat, fokus candid keluarga...",
    useMyData: "Pakai Data Saya",
    next: "Berikutnya",
    previousStep: "Sebelumnya",
    fullNameRequired: "Nama lengkap wajib diisi.",
    fullNameMinLength: "Nama lengkap harus memiliki minimal 2 karakter.",
    validEmail: "Masukkan alamat email yang valid.",
    phoneRequired: "Nomor telepon wajib diisi.",
    validPhone: "Masukkan nomor telepon yang valid.",
    eventDateRequired: "Tanggal acara wajib diisi.",
    eventDatePast: "Tanggal acara tidak boleh di masa lalu.",
    startTimeRequired: "Jam mulai acara wajib dipilih.",
    venueRequired: "Venue atau lokasi acara wajib diisi.",
    mapLocationRequired: "Pilih titik lokasi acara pada peta.",
    packageRequired: "Silakan pilih paket.",
    packageUnavailableError: "Paket yang dipilih sudah tidak tersedia.",
    packageLoadError: "Paket tidak dapat dimuat. Silakan coba kembali.",
    hoursCoverage: "jam liputan",
    selectedPackages: "Paket Terpilih",
    addAnotherPackage: "Tambah Paket",
    removePackage: "Hapus Paket",
    categoryLoadError: "Kategori tidak dapat dimuat. Semua paket masih dapat dipilih.",
    showing: "Menampilkan",
    eventInformation: "Informasi Acara",
    schedule: "Jadwal",
    dateTime: "Tanggal & Waktu",
    chooseDateDescription: "Pilih tanggal acara terlebih dahulu. Setelah tanggal dipilih, tentukan jam mulai acara.",
    eventDate: "Tanggal Acara",
    notSelected: "Belum dipilih",
    changeDate: "Ubah Tanggal",
    chooseDate: "Pilih Tanggal",
    dateAvailable: "Tanggal tersedia dan sudah dipilih.",
    scheduleLoadError: "Data jadwal gagal dimuat. Silakan coba kembali.",
    startTime: "Jam Mulai",
    endTime: "Selesai",
    nextDay: "hari berikutnya",
    chooseStartTime: "Pilih jam mulai",
    packageDurationUnavailable: "Durasi paket belum tersedia",
    packageDuration: "Durasi paket",
    endTimeDescription: "Jam selesai akan dihitung setelah durasi paket tersedia.",
    venue: "Venue",
    eventLocation: "Lokasi Acara",
    locationDescription: "Isi nama venue atau alamat. Tombol Cari Lokasi bersifat opsional, kamu juga bisa memilih titik langsung pada peta.",
    venueAddress: "Nama Venue / Alamat",
    venuePlaceholder: "Contoh: Hotel Savoy Homann Bandung",
    searching: "Mencari...",
    searchLocation: "Cari Lokasi",
    locationHelp: "Nama venue boleh berupa nama bebas. Yang wajib adalah nama lokasi terisi dan titik pada peta sudah dipilih.",
    locationFound: "Lokasi ditemukan. Titik peta sudah disesuaikan.",
    mapPoint: "Titik Peta",
    useMyLocation: "Gunakan lokasi saya",
    removePoint: "Hapus titik",
    waitingLocation: "Menunggu lokasi",
    agencyNotConfigured: "Agency belum dikonfigurasi",
    distanceFrom: "Jarak dari",
    accommodationCost: "Biaya Akomodasi",
    accommodationRequest: "Request Akomodasi",
    accommodationPolicyShort: "Untuk seluruh area kota Bandung Free Akomodasi, diluar itu akan dikenakan biaya.",
    bandungAccommodation: "Seluruh area Kota Bandung bebas biaya akomodasi. Untuk lokasi di luar Kota Bandung dikenakan biaya akomodasi.",
    freeDistance: "Jarak gratis berlaku hingga",
    afterDistance: "; setelah itu dikenakan",
    andIncreases: "dan bertambah",
    eachDistance: "untuk setiap kelipatan",
    distanceStraightLine: "berikutnya. Jarak dihitung secara garis lurus.",
    confirmation: "Konfirmasi",
    reviewBooking: "Periksa Kembali Booking Anda",
    reviewBookingDescription: "Pastikan detail paket, jadwal, lokasi, dan informasi kontak sudah sesuai sebelum permintaan booking dikirim.",
    packageDetails: "Paket Dokumentasi",
    selectedPackageDescription: "Paket dan layanan yang dipilih untuk acara ini.",
    includedServices: "Layanan Termasuk",
    packagePrice: "Harga Paket",
    subjectCouple: "Couple / berpasangan",
    subjectIndividual: "Individual",
    subjectUnknown: "Jenis subjek belum dikategorikan",
    eventDetails: "Detail Acara",
    eventDetailsDescription: "Jadwal, lokasi, dan biaya akomodasi untuk booking ini.",
    eventTime: "Jam Acara",
    personalDetails: "Data Pemesan",
    personalDetailsDescription: "Informasi yang digunakan tim untuk menghubungi Anda.",
    visionNotes: "Visi & Catatan",
    visionNotesDescription: "Konsep atau kebutuhan tambahan yang ingin disampaikan kepada tim.",
    eventNotes: "Catatan Acara",
    accommodationPolicy: "Seluruh area Kota Bandung bebas biaya akomodasi. Untuk lokasi di luar Kota Bandung dikenakan biaya akomodasi. Jarak gratis berlaku hingga",
    all: "Semua",
    categoryWedding: "Pernikahan",
    categoryPreWedding: "Pra-Pernikahan",
    categoryEngagement: "Pertunangan",
    categoryEvent: "Acara",
    categoryBundle: "Bundel",
  },
  en: {
    home: "Home",
    portfolio: "Portfolio",
    packages: "Packages",
    booking: "Booking",
    login: "Login",
    myAccount: "My Account",
    language: "Language",
    english: "English",
    indonesian: "Bahasa Indonesia",
    nextStep: "Next Step",
    previous: "Previous",
    heroTitle: "Capturing Moments, Creating Memories",
    heroDescription:
      "Every moment has a story, and we capture it with a professional touch and timeless beauty.",
    viewPackages: "View Packages",
    bookNow: "Book Now",
    whyChooseUs: "Why Choose Rafi Picture?",
    qualityPhotos: "QUALITY PHOTOGRAPHY",
    qualityPhotosDescription:
      "Sharp details, thoughtful composition, and natural colors in every photograph.",
    professionalEditing: "PROFESSIONAL EDITING",
    professionalEditingDescription:
      "Every photograph is edited to create a clean, aesthetic, and consistent look.",
    professionalService: "PROFESSIONAL SERVICE",
    professionalServiceDescription:
      "Experienced photographers and a thoughtful process tailored to every client's needs.",
    footerDescription:
      "Photography documentation for weddings, pre-weddings, engagements, and special moments with natural, aesthetic, and distinctive results.",
    contactMessage:
      "Hello Rafi Picture, I would like to ask about your photography services.",
    navigation: "Navigation",
    contactUs: "Contact Us",
    connect: "Connect",
    information: "Information",
    terms: "Terms & Conditions",
    termsDescription:
      "Booking, payment, service duration, and Rafi Picture service policies.",
    copyright: "All rights reserved.",
    welcomeBack: "Welcome Back",
    authLoginDescription:
      "Sign in to access your private gallery and manage your bookings.",
    joinStudio: "Join the Studio",
    authRegisterDescription:
      "Create your account and keep every Rafi Picture moment in one place.",
    signIn: "Sign In",
    createAccount: "Create Account",
    emailAddress: "Email Address",
    password: "Password",
    forgotPassword: "Forgot Password?",
    keepSignedIn: "Keep me signed in",
    signingIn: "Signing In...",
    firstName: "First Name",
    lastName: "Last Name",
    createPassword: "Create Password",
    confirmPassword: "Confirm Password",
    sendingVerification: "Sending Verification Code...",
    firstNameLastNameRequired: "First name and last name are required.",
    emailRequired: "Email address is required.",
    passwordMinLength: "Password must contain at least 8 characters.",
    passwordMismatch: "Passwords do not match.",
    verificationFailed: "Unable to send verification code.",
    orContinueWith: "Or continue with",
    firstNamePlaceholder: "Alex",
    lastNamePlaceholder: "Sterling",
    passwordPlaceholder: "Min. 8 characters",
    repeatPasswordPlaceholder: "Repeat password",
    emailPlaceholder: "name@example.com",
    packageFallbackDescription:
      "A photography package that can be tailored to your event and needs.",
    viewDetail: "View Details",
    noPackages: "No packages available",
    popular: "Most Popular",
    packageLabel: "Package",
    startingFrom: "Starting from",
    investmentStartingFrom: "Investment Starting From",
    includedInPackage: "Included in the Package",
    reserveDate: "Reserve Your Date",
    coverage: "Coverage",
    close: "Close",
    termsTitle: "Terms of Agreement",
    termsVersion: "Terms Version",
    termsName: "Terms of Agreement Rafi Picture",
    noPackagesDescription: "Active packages in this category will appear automatically.",
    stepPackages: "Packages",
    stepEventInfo: "Event Info",
    stepPersonalDetails: "Personal Details",
    stepConfirm: "Confirm",
    yourPackagePlan: "Your Package Plan",
    choosePackageDescription: "Choose a documentation package that fits your event and needs.",
    selected: "Selected",
    mostPopular: "Most Popular",
    selectedPackage: "Your selected package",
    changePackage: "Change Package",
    choosePackage: "Choose Package",
    noPackageSelected: "No package selected",
    choosePackageDescriptionShort: "Browse packages by category, price, duration, and available services.",
    packageUnavailable: "The package from the URL was not found or is no longer active. Please choose another package.",
    personalInformation: "Personal Information",
    customerData: "Booking Details",
    personalDescription: "Enter the contact details the Rafi Picture team can use for your booking and event needs.",
    fullName: "Full Name",
    fullNamePlaceholder: "Full name",
    partnerName: "Partner Name",
    partnerNamePlaceholder: "Partner name",
    phoneNumber: "Phone Number",
    phonePlaceholder: "08xxxxxxxxxx",
    optional: "Optional",
    additionalNotes: "Additional Notes",
    tellVision: "Tell Us About Your Vision",
    visionDescription: "Tell us about the concept, atmosphere, or special needs you have in mind. This section is optional.",
    visionPlaceholder: "Example: intimate concept, warm tone, focus on candid family moments...",
    useMyData: "Use My Data",
    next: "Next",
    previousStep: "Previous",
    fullNameRequired: "Full name is required.",
    fullNameMinLength: "Full name must contain at least 2 characters.",
    validEmail: "Please enter a valid email address.",
    phoneRequired: "Phone number is required.",
    validPhone: "Please enter a valid phone number.",
    eventDateRequired: "Event date is required.",
    eventDatePast: "Event date cannot be in the past.",
    startTimeRequired: "Start time is required.",
    venueRequired: "Venue or event location is required.",
    mapLocationRequired: "Choose the event location on the map.",
    packageRequired: "Please select a package.",
    packageUnavailableError: "The selected package is no longer available.",
    packageLoadError: "Packages could not be loaded. Please try again.",
    hoursCoverage: "hours coverage",
    selectedPackages: "Selected Packages",
    addAnotherPackage: "Add Another Package",
    removePackage: "Remove Package",
    categoryLoadError: "Categories could not be loaded. All packages remain available.",
    showing: "Showing",
    eventInformation: "Event Information",
    schedule: "Schedule",
    dateTime: "Date & Time",
    chooseDateDescription: "Choose the event date first. Once selected, choose the event start time.",
    eventDate: "Event Date",
    notSelected: "Not selected",
    changeDate: "Change Date",
    chooseDate: "Choose Date",
    dateAvailable: "The date is available and selected.",
    scheduleLoadError: "Schedule data could not be loaded. Please try again.",
    startTime: "Start Time",
    endTime: "End Time",
    nextDay: "next day",
    chooseStartTime: "Choose a start time",
    packageDurationUnavailable: "Package duration is unavailable",
    packageDuration: "Package duration",
    endTimeDescription: "The end time will be calculated when package duration is available.",
    venue: "Venue",
    eventLocation: "Event Location",
    locationDescription: "Enter a venue name or address. Location search is optional; you can also choose a point directly on the map.",
    venueAddress: "Venue Name / Address",
    venuePlaceholder: "Example: Hotel Savoy Homann Bandung",
    searching: "Searching...",
    searchLocation: "Search Location",
    locationHelp: "The venue name may be any text. The location name and a map point are required.",
    locationFound: "Location found. The map point has been adjusted.",
    mapPoint: "Map Point",
    useMyLocation: "Use my location",
    removePoint: "Remove point",
    waitingLocation: "Waiting for location",
    agencyNotConfigured: "Agency is not configured",
    distanceFrom: "Distance from",
    accommodationCost: "Accommodation Cost",
    accommodationRequest: "Accommodation Request",
    accommodationPolicyShort: "All areas within Bandung City are free of accommodation costs; locations outside the city will incur a charge.",
    bandungAccommodation: "All areas within Bandung City are free of accommodation costs. Locations outside Bandung City incur an accommodation cost.",
    freeDistance: "Free distance applies up to",
    afterDistance: "; after that, a charge of",
    andIncreases: "and increases by",
    eachDistance: "for every",
    distanceStraightLine: "following interval. Distance is calculated as a straight line.",
    confirmation: "Confirmation",
    reviewBooking: "Review Your Booking",
    reviewBookingDescription: "Make sure the package, schedule, location, and contact information are correct before submitting your booking request.",
    packageDetails: "Documentation Package",
    selectedPackageDescription: "The package and services selected for this event.",
    includedServices: "Included Services",
    packagePrice: "Package Price",
    subjectCouple: "Couple / partnered",
    subjectIndividual: "Individual",
    subjectUnknown: "Subject type not categorized",
    eventDetails: "Event Details",
    eventDetailsDescription: "Schedule, location, and accommodation cost for this booking.",
    eventTime: "Event Time",
    personalDetails: "Booking Details",
    personalDetailsDescription: "Information the team will use to contact you.",
    visionNotes: "Vision & Notes",
    visionNotesDescription: "Concepts or additional needs you would like to share with the team.",
    eventNotes: "Event Notes",
    accommodationPolicy: "All areas within Bandung City are free of accommodation costs. Locations outside Bandung City incur an accommodation cost. Free distance applies up to",
    all: "All",
    categoryWedding: "Wedding",
    categoryPreWedding: "Pre-Wedding",
    categoryEngagement: "Engagement",
    categoryEvent: "Event",
    categoryBundle: "Bundle",
  },
};

const LanguageContext = createContext(null);

const languageListeners = new Set();

function normalizeLanguage(value) {
  return value === "en" ? "en" : DEFAULT_LANGUAGE;
}

function subscribeToLanguage(callback) {
  languageListeners.add(callback);

  if (typeof window === "undefined") {
    return () => languageListeners.delete(callback);
  }

  const handleStorageChange = (event) => {
    if (event.key === STORAGE_KEY) callback();
  };

  window.addEventListener("storage", handleStorageChange);

  return () => {
    languageListeners.delete(callback);
    window.removeEventListener("storage", handleStorageChange);
  };
}

function getStoredLanguage() {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  return normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
}

function getServerLanguage() {
  return DEFAULT_LANGUAGE;
}

export default function LanguageProvider({ children }) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getStoredLanguage,
    getServerLanguage,
  );

  function setLanguage(nextLanguage) {
    const normalizedLanguage = normalizeLanguage(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, normalizedLanguage);
    languageListeners.forEach((listener) => listener());
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      translate: (key) => translations[language][key] ?? key,
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
