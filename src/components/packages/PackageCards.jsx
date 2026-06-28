"use client";
import { RiCalendarScheduleLine } from "react-icons/ri";

import { useState } from "react";
import MaterialIcon from "@/components/global/MaterialIcon";

const packages = [
  {
    title: "The Eternal Wedding",
    subtitle: "Pengalaman Lengkap",
    price: "$4,500",
    badge: "Tersedia untuk 2024",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBgEQxhA_f2CB3PIRD9TT2vwkRzdkzdMiWJRRGb_KZmbLk9DAcRlxIo7ZwFkUX0Dc3xQiMBBp9usRp4l7Tz1_DcyK0rKGIzR2VsbvIQAZjYclRH1ydGl9AmIUP2k1RoL99FXQYjZF1d20UxSXtWFwJBL-7gkhjNM54xKskEyyqGsnqoZm4ZDi9SGFTVnZHuPyPJUDqczn2GRVVwd5zUx2uJVVt2-VF1b9NkwqQhAd5ouEmqWUkik_GZUxxXZoh3L2CdrJ-vZLg9G2_g",
    imageAlt:
      "Pasangan pengantin berpelukan di courtyard bergaya Eropa dengan pencahayaan golden hour.",
    description:
      "Informasi detail tentang pengalaman fotografi paling premium kami, dirancang bagi pasangan yang menghargai setiap detail momen pernikahan.",
    features: [
      { icon: RiCalendarScheduleLine, text: "Liputan 10 Jam" },
      { icon: "group", text: "2 Fotografer Utama" },
      { icon: "photo_library", text: "700+ Foto Resolusi Tinggi Editan" },
      { icon: "menu_book", text: "Album Kulit Premium" },
    ],
  },
  {
    title: "Classic Union",
    subtitle: "Pilihan Utama",
    price: "$3,200",
    badge: "Ketersediaan Terbatas",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDyI_o5SBMw5wnV98euleY-DRDfYj7X5OhOD_xgStzMvWFl_Oq5yPGL-QpGHwRKiwAxa4xt9ZA7Hi9S1Djm2KyO9-6_a2ndS95KvwdKuCAq4vh8YGKCJseyuCNGnWLz5xMmCsDv83HEjexHWRtDV-QHh3n3QDwS_y1f6tPIqJF_EGCMwdA4ROLbRQPWcKI8H8vWr6fhJ4znfWplD9d5wIfDwdCKhC6VhbKEFezAczum9_HZIL5vdX8AErHTlFx8wlrOpW8HXC-lyuWi",
    imageAlt:
      "Foto pernikahan hitam putih yang menampilkan detail veil dan aksesori pengantin.",
    description:
      "Paket pernikahan utama dengan pendekatan dokumenter dan editorial yang cocok untuk acara intim maupun perayaan berskala sedang.",
    features: [
      { icon: RiCalendarScheduleLine, text: "Liputan 8 Jam" },
      { icon: "person", text: "1 Fotografer Utama" },
      { icon: "photo_library", text: "400+ Foto Resolusi Tinggi Editan" },
      { icon: "cloud_done", text: "Galeri Pribadi Online" },
    ],
  },
  {
    title: "Prewedding Muse",
    subtitle: "Sesi Bercerita",
    price: "$1,800",
    badge: "Penawaran Baru",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAdGOk9bXX5IpBamn_92_KjmGMJw6TVYlK5KYZOvFct7UnPMichi3BbI6QOCfYGfbXaX5Aqvwg2mruKnkrf3AF9qLYG08GNdqbVrKu_vLSIYu2syCdCarZOci0lybDu6S77TeM8BRnei0Ngn4hQjIw7DD35JDdsBGQEmD6BlBKR9l3ddwJ65s8sTVMhMLvwT-xy7a3spbc4k0TU77C5b0NamYlLwc3vtAUZQsI6sFO0gM1j0mTLkP9cFOTjt5JEqKTVZ2BzYupBav24",
    imageAlt:
      "Sesi prewedding sinematik di lanskap pegunungan saat blue hour.",
    description:
      "Sesi prewedding dengan konsep visual yang lebih personal, cocok untuk pasangan yang ingin membangun cerita sebelum hari pernikahan.",
    features: [
      { icon: RiCalendarScheduleLine, text: "Sesi 4 Jam" },
      { icon: "location_on", text: "2 Lokasi Terpilih" },
      { icon: "photo_library", text: "50 Foto Retouch Artistik" },
      { icon: "palette", text: "Konsultasi Gaya Busana" },
    ],
  },
];

export default function PackageCards() {
  const [selectedPackage, setSelectedPackage] = useState(null);

  const closeModal = () => {
    setSelectedPackage(null);
  };

  return (
    <>
      {/* Package Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {packages.map((item) => (
          <article
            key={item.title}
            onClick={() => setSelectedPackage(item)}
            className="package-card group bg-white overflow-hidden rounded-xl ambient-shadow cursor-pointer transition-all duration-500 hover:-translate-y-2 h-[760px] flex flex-col"
          >
            {/* Image Area */}
            <div className="h-[300px] shrink-0 overflow-hidden relative">
              <img
                className="w-full h-full object-cover transition-transform duration-[800ms] group-hover:scale-105"
                src={item.image}
                alt={item.imageAlt}
              />

              <div className="absolute top-4 left-4">
                <span className="bg-secondary-container/90 text-on-secondary-container text-label-sm px-3 py-1 rounded-full backdrop-blur-sm">
                  {item.badge}
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8 flex flex-col flex-1 min-h-0">
              {/* Title and Price */}
              <div className="min-h-[120px] flex justify-between items-start gap-6">
                <div className="min-w-0">
                  <h3 className="font-headline-md text-headline-md text-primary mb-2 leading-tight">
                    {item.title}
                  </h3>

                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                    {item.subtitle}
                  </p>
                </div>

                <div className="text-right shrink-0 pt-1">
                  <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                    Mulai dari
                  </span>

                  <span className="font-headline-md text-headline-md font-bold text-primary leading-none">
                    {item.price}
                  </span>
                </div>
              </div>

              {/* Scrollable Feature List */}
              <ul className="space-y-4 flex-1 min-h-0 overflow-y-auto hide-scrollbar pr-2">
                {item.features.map((feature) => (
                  <li
                    key={feature.text}
                    className="grid grid-cols-[24px_1fr] gap-x-3 items-start text-on-surface-variant"
                  >
                    {/* <MaterialIcon className="text-[20px] leading-none mt-[3px]">
                      {feature.icon}
                    </MaterialIcon> */}
                    <feature.icon className="text-[20px] leading-none mt-[3px]" />

                    <span className="font-body-md text-body-md leading-relaxed">
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <button
                type="button"
                onClick={(event) => event.stopPropagation()}
                className="mt-8 shrink-0 w-full bg-primary text-on-primary py-4 rounded-lg font-label-md hover:bg-primary/90 transition-all active:scale-95"
              >
                Pesan Paket
              </button>
            </div>
          </article>
        ))}
      </section>

      {/* Package Detail Modal */}
      {selectedPackage && (
        <div
          className="fixed inset-0 bg-primary/20 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8"
          onClick={closeModal}
        >
          <div
            className="glass-panel w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Image */}
            <div className="w-full md:w-1/2 h-[320px] md:h-auto relative">
              <img
                className="w-full h-full object-cover"
                src={selectedPackage.image}
                alt={selectedPackage.imageAlt}
              />

              <button
                type="button"
                onClick={closeModal}
                className="absolute top-6 left-6 w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/40 transition-all"
                aria-label="Close package detail"
              >
                <MaterialIcon>close</MaterialIcon>
              </button>
            </div>

            {/* Modal Content */}
            <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-between overflow-y-auto hide-scrollbar">
              <div>
                <h2 className="font-display-lg text-headline-lg mb-4">
                  {selectedPackage.title}
                </h2>

                <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
                  {selectedPackage.description}
                </p>

                <div className="space-y-4 mb-8">
                  <h4 className="font-label-md text-label-md uppercase tracking-widest text-primary border-b border-outline-variant pb-2">
                    Termasuk dalam Paket
                  </h4>

                  <div className="grid grid-cols-1 gap-4">
                    {selectedPackage.features.map((feature) => (
                      <div
                        key={feature.text}
                        className="grid grid-cols-[24px_1fr] gap-x-4 items-start text-on-surface-variant"
                      >
                        <MaterialIcon className="text-[20px] leading-none mt-[3px]">
                          {feature.icon}
                        </MaterialIcon>

                        <span className="font-body-md text-body-md leading-relaxed">
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-8 border-t border-outline-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">
                    Investasi Mulai Dari
                  </span>

                  <span className="font-display-lg text-headline-lg font-bold">
                    {selectedPackage.price}
                  </span>
                </div>

                <button className="bg-primary text-on-primary px-10 py-4 rounded-lg font-label-md">
                  Reservasi Tanggal Anda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}