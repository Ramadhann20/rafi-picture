import HeroSection from "@/components/home/HeroSection";
import FeaturedPortfolio from "@/components/home/FeaturedPortfolio";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import ActionButtonWrapper from "@/components/global/ActionButtonWrapper";
import ScrollReveal from "@/components/ui/ScrollReveal";

// Belum digunakan:
// import TrustedStats from "@/components/home/TrustedStats";
// import ServiceFlow from "@/components/home/ServiceFlow";
// import Testimonials from "@/components/home/Testimonials";
// import FAQSection from "@/components/home/FAQSection";

export default function HomePage() {
  return (
    <main>
      <ActionButtonWrapper />

      <HeroSection />

      {/* <TrustedStats /> */}

      <ScrollReveal>
        <FeaturedPortfolio />
      </ScrollReveal>

      <ScrollReveal>
        <WhyChooseUs />
      </ScrollReveal>

      {/* <ServiceFlow /> */}
      {/* <Testimonials /> */}
      {/* <FAQSection /> */}
    </main>
  );
}
