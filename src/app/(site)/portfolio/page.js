import Link from "next/link";

export const metadata = {
  title: "Portofolio | Rafi Picture Studio",
  description:
    "Galeri portofolio fotografi Rafi Picture Studio untuk pernikahan, prewedding, pertunangan, dan berbagai acara spesial.",
};

const portfolioImages = [
  {
    id: 1,
    src: "https://picsum.photos/seed/rafi-picture-1/1400/900",
    alt: "Portofolio fotografi pasangan di luar ruangan",
    className: "md:col-span-8",
    aspectClass: "aspect-[4/5] md:aspect-[16/10]",
  },
  {
    id: 2,
    src: "https://picsum.photos/seed/rafi-picture-2/900/1200",
    alt: "Portofolio fotografi portrait bernuansa sinematik",
    className: "md:col-span-4",
    aspectClass: "aspect-[3/4]",
  },
  {
    id: 3,
    src: "https://picsum.photos/seed/rafi-picture-3/900/1200",
    alt: "Portofolio fotografi pasangan dengan suasana intim",
    className: "md:col-span-4",
    aspectClass: "aspect-[3/4]",
  },
  {
    id: 4,
    src: "https://picsum.photos/seed/rafi-picture-4/1400/900",
    alt: "Portofolio fotografi pasangan berlatar alam",
    className: "md:col-span-8",
    aspectClass: "aspect-[4/5] md:aspect-[16/10]",
  },
  {
    id: 5,
    src: "https://picsum.photos/seed/rafi-picture-5/1400/1000",
    alt: "Portofolio fotografi pernikahan bergaya editorial",
    className: "md:col-span-7",
    aspectClass: "aspect-[4/5] md:aspect-[7/5]",
  },
  {
    id: 6,
    src: "https://picsum.photos/seed/rafi-picture-6/1000/1300",
    alt: "Portofolio fotografi detail pernikahan",
    className: "md:col-span-5",
    aspectClass: "aspect-[3/4]",
  },
  {
    id: 7,
    src: "https://picsum.photos/seed/rafi-picture-7/1000/1300",
    alt: "Portofolio fotografi pasangan dengan nuansa hangat",
    className: "md:col-span-5",
    aspectClass: "aspect-[3/4]",
  },
  {
    id: 8,
    src: "https://picsum.photos/seed/rafi-picture-8/1400/1000",
    alt: "Portofolio fotografi acara spesial",
    className: "md:col-span-7",
    aspectClass: "aspect-[4/5] md:aspect-[7/5]",
  },
];

export default function PortofolioPage() {
  return (
    <main className="mx-auto max-w-container-max px-margin-mobile py-stack-lg md:px-margin-desktop">
      <section className="flex flex-col items-center py-stack-lg text-center md:py-24">
        <span className="mb-4 block font-label-md text-label-md uppercase tracking-[0.2em] text-secondary">
          Eksplorasi Visual
        </span>

        <h1 className="mb-6 max-w-4xl font-display-lg text-display-lg text-on-surface">
          Portofolio Kami
        </h1>

        <p className="mx-auto max-w-2xl font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
          Setiap bidikan adalah sebuah cerita. Kami mengabadikan emosi,
          keindahan, dan momen yang berarti melalui pendekatan fotografi yang
          natural, hangat, dan timeless.
        </p>

        <div className="mt-stack-md flex items-center gap-4">
          <div className="h-px w-12 bg-outline" />

          <span className="font-label-sm text-label-sm italic text-secondary">
            Capturing timeless moments
          </span>

          <div className="h-px w-12 bg-outline" />
        </div>
      </section>

      <section className="pb-24">
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-12 md:gap-8">
          {portfolioImages.map((image) => (
            <article
              key={image.id}
              className={`group relative overflow-hidden rounded-xl bg-surface-container shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${image.className} ${image.aspectClass}`}
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </article>
          ))}
        </div>

        <div className="mt-20 rounded-2xl border border-outline-variant/30 bg-white/10 p-8 text-center backdrop-blur-xl sm:p-10 md:mt-24 md:p-stack-lg">
          <h2 className="mb-4 font-headline-lg text-headline-lg text-on-surface">
            Ingin mengabadikan momen Anda?
          </h2>

          <p className="mx-auto mb-8 max-w-xl font-body-md text-body-md text-on-surface-variant">
            Kami siap membantu menceritakan kisah Anda melalui visual yang
            personal, indah, dan tidak lekang oleh waktu.
          </p>

          <Link
            href="/booking"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-10 py-4 font-label-md text-label-md text-on-primary transition-all duration-300 hover:opacity-90 active:scale-95"
          >
            Pesan Sekarang
          </Link>
        </div>
      </section>
    </main>
  );
}