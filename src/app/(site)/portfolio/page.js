import {
  getPortfolioImages,
} from "@/lib/portfolioImages";

import PortfolioGallery from "@/components/portfolio/PortfolioGallery";
import ScrollReveal from "@/components/ui/ScrollReveal";

import ActionButtonWrapper from "@/components/global/ActionButtonWrapper";

export const metadata = {
  title: "Portofolio | Rafi Picture",
  description:
    "Kumpulan karya fotografi pilihan Rafi Picture.",
};

export default function PortfolioPage() {
  const images = getPortfolioImages();

  return (
    <>
      <ActionButtonWrapper />
      <main className="min-h-screen bg-white pb-[120px] pt-[140px]">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          <ScrollReveal>
            <header className="mb-14 max-w-3xl">
              <span className="mb-4 block font-label-md text-label-md uppercase tracking-widest text-secondary">
                Portofolio
              </span>

              <h1 className="font-display-lg text-display-lg text-primary">
                Cerita yang Kami Abadikan
              </h1>

              <p className="mt-5 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
                Kumpulan momen pilihan dari Rafi Picture.
                Setiap kunjungan menampilkan susunan foto
                secara acak dari galeri portofolio.
              </p>
            </header>
          </ScrollReveal>

          <PortfolioGallery
            images={images}
          />
        </div>
      </main>
    </>
  );
}
