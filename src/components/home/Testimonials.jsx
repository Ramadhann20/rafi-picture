"use client";

import { useEffect, useState } from "react";
import MaterialIcon from "@/components/global/MaterialIcon";

const testimonials = [
  {
    quote:
      "Rafi didn't just take photos; he captured the feeling of our wedding day. Every time I look at our gallery, I am transported back to those exact emotions. Simply incredible work.",
    name: "Sarah & James",
    date: "September 2023",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAiW3FAXK1hLRN-AiDowkBF5aVucPlT-uIPvU-kHMvagA6WfUFA7eeQxX39KGnR1JWtj0mZjz2CrNFj2zLYKX64a-SN9N6pzNwJxCq7qaGD7BbI-ouL9n9A69vyJcSKVGhv-wDpdB7EaNMcsZD1z3iRLjj58BXEESZx144ewC1RKJ-C9-cmx0Tnro19_y9qDiQEq5qF1jv5N_crguGz1K2N72IRkhrUUMxhluUtcTaVwmoaH1jaWncxgeNUwJI4Hs1o21pY6bQIohDV",
    alt: "A warm headshot of a happy woman with a gentle smile.",
  },
  {
    quote:
      "The level of professionalism and artistic vision is unmatched. Rafi made us feel so comfortable, and the final results exceeded all our expectations. Timeless and elegant.",
    name: "Elena & Marc",
    date: "June 2023",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBYvwfSynEj4DcTdTibK7dQxeYUNUIdDVjgx66qip89YqCyLsIP4NWJvdHLY09ecUPXRmK39kuEY_4VSUivHFyQiIwTxNhHS5qomCEPyq4F7RwLciDCmXPdKF124Gvmdkm6aDYHug7Oaw_2PpZZ91QxnyEBtfecIhn537-AMgahIvEWqALISGQqv74a4wq2kxoZosxoMALxXeAQZuBIOZIuCsYgPW41k1e0pa6xNEErna5NnO09uMojQ9Hg_9UGOuorBQQXOgXZK8uP",
    alt: "A professional headshot of a man with a friendly expression.",
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const step = isMobile ? 100 : 50;

  const handleNext = () => setCurrentIndex((value) => (value < testimonials.length - 1 ? value + 1 : 0));
  const handlePrev = () => setCurrentIndex((value) => (value > 0 ? value - 1 : testimonials.length - 1));

  return (
    <section className="py-[120px] bg-secondary-container/20">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-[80px]">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-4 block">
            Kind Words
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary">From Our Couples</h2>
        </div>

        <div className="relative overflow-hidden group">
          <div
            className="flex gap-8 transition-transform duration-500 ease-in-out cursor-grab active:cursor-grabbing"
            style={{ transform: `translateX(-${currentIndex * step}%)` }}
          >
            {testimonials.map((item) => (
              <TestimonialCard key={item.name} item={item} />
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-stack-md">
            <button
              className="w-12 h-12 rounded-full border border-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
              onClick={handlePrev}
              aria-label="Previous testimonial"
            >
              <MaterialIcon>chevron_left</MaterialIcon>
            </button>
            <button
              className="w-12 h-12 rounded-full border border-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
              onClick={handleNext}
              aria-label="Next testimonial"
            >
              <MaterialIcon>chevron_right</MaterialIcon>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ item }) {
  return (
    <div className="min-w-full md:min-w-[calc(50%-16px)] glass-panel p-stack-lg rounded-xl flex flex-col md:flex-row gap-8 items-center bg-white/50">
      <div className="w-24 h-24 rounded-full overflow-hidden shrink-0">
        <img className="w-full h-full object-cover" src={item.image} alt={item.alt} />
      </div>
      <div>
        <p className="font-body-lg text-body-lg text-primary italic mb-6">&quot;{item.quote}&quot;</p>
        <h4 className="font-label-md text-label-md text-primary uppercase">{item.name}</h4>
        <p className="font-label-sm text-label-sm text-on-surface-variant">{item.date}</p>
      </div>
    </div>
  );
}
