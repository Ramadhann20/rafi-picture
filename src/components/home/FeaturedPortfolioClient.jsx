"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

const CARD_LAYOUTS = [
  "md:col-span-8",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-8",
];

function shuffle(items) {
  const next = [...items];

  for (
    let index = next.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1),
    );

    [
      next[index],
      next[randomIndex],
    ] = [
      next[randomIndex],
      next[index],
    ];
  }

  return next;
}

export default function FeaturedPortfolioClient({
  images = [],
}) {
  const [selectedImages, setSelectedImages] =
    useState(() => images.slice(0, 4));

  useEffect(() => {
    setSelectedImages(
      shuffle(images).slice(0, 4),
    );
  }, [images]);

  return (
    <section
      className="bg-white py-[120px]"
      id="portfolio"
    >
      <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
        <div className="mb-stack-lg flex flex-col items-end justify-between gap-6 md:flex-row">
          <div>
            <span className="mb-4 block font-label-md text-label-md uppercase tracking-widest text-secondary">
              Portofolio Pilihan
            </span>

            <h2 className="font-headline-lg text-headline-lg text-primary">
              Cerita dalam Setiap Frame
            </h2>
          </div>

          <Link
            href="/portfolio"
            className="border-b border-primary pb-1 font-label-md text-label-md text-primary transition-all hover:opacity-70"
          >
            Lihat Galeri Lengkap
          </Link>
        </div>

        {selectedImages.length > 0 ? (
          <div className="grid h-auto grid-cols-1 gap-6 md:h-[1000px] md:grid-cols-12">
            {selectedImages.map(
              (item, index) => (
                <PortfolioCard
                  key={item.id}
                  item={item}
                  className={
                    CARD_LAYOUTS[
                      index %
                        CARD_LAYOUTS.length
                    ]
                  }
                />
              ),
            )}
          </div>
        ) : (
          <div className="flex min-h-[360px] items-center justify-center rounded-xl bg-surface-container text-center">
            <p className="max-w-md px-6 font-body-md text-body-md text-on-surface-variant">
              Tambahkan foto ke folder
              {" "}
              <code>
                public/images-porto
              </code>
              {" "}
              untuk menampilkan portofolio.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function PortfolioCard({
  item,
  className,
}) {
  return (
    <Link
      href="/portfolio"
      aria-label="Buka halaman portofolio"
      className={`${className} ambient-shadow group relative min-h-[360px] overflow-hidden rounded-lg md:min-h-0`}
    >
      <img
        src={item.src}
        alt={item.alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 via-black/5 to-transparent p-stack-md opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="font-label-md text-label-md text-white">
          Lihat Portofolio
        </span>
      </div>
    </Link>
  );
}
