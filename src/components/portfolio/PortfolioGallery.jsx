"use client";

import {
  useEffect,
  useState,
} from "react";

import ScrollReveal from "@/components/ui/ScrollReveal";

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

export default function PortfolioGallery({
  images = [],
}) {
  const [orderedImages, setOrderedImages] =
    useState(images);

  useEffect(() => {
    setOrderedImages(
      shuffle(images),
    );
  }, [images]);

  if (orderedImages.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container px-6 py-16 text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Belum ada foto di
          {" "}
          <code>
            public/images-porto
          </code>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
      {orderedImages.map(
        (image, index) => (
          <ScrollReveal
            key={image.id}
            className="mb-5 break-inside-avoid"
            delay={
              (index % 3) * 80
            }
            distance={22}
          >
            <figure className="ambient-shadow group overflow-hidden rounded-xl bg-surface-container">
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
              />
            </figure>
          </ScrollReveal>
        ),
      )}
    </div>
  );
}
