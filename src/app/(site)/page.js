import Navbar from "@/components/global/Navbar";
import Footer from "@/components/global/Footer";
import HeroSection from "@/components/home/HeroSection";
import TrustedStats from "@/components/home/TrustedStats";
import FeaturedPortfolio from "@/components/home/FeaturedPortfolio";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import ServiceFlow from "@/components/home/ServiceFlow";
import Testimonials from "@/components/home/Testimonials";
import FAQSection from "@/components/home/FAQSection";

export default function HomePage() {
  return (
    <>
      <main>
        <HeroSection />
        <TrustedStats />
        <FeaturedPortfolio />
        <WhyChooseUs />
        <ServiceFlow />
        <Testimonials />
        <FAQSection />
      </main>
    </>
  );
}
