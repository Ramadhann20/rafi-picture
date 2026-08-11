import {
  getPortfolioImages,
} from "@/lib/portfolioImages";

import FeaturedPortfolioClient from "./FeaturedPortfolioClient";

export default function FeaturedPortfolio() {
  const images = getPortfolioImages();

  return (
    <FeaturedPortfolioClient
      images={images}
    />
  );
}
