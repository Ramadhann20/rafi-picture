import {
  getPortfolioImages,
} from "@/lib/portfolioImages";

import PortfolioGallery from "@/components/portfolio/PortfolioGallery";
import PortfolioPageHeader from "@/components/portfolio/PortfolioPageHeader";
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
            <PortfolioPageHeader />
          </ScrollReveal>

          <PortfolioGallery
            images={images}
          />
        </div>
      </main>
    </>
  );
}
