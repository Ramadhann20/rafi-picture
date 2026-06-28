"use client";

import { useState } from "react";
import MaterialIcon from "@/components/global/MaterialIcon";

const faqItems = [
  {
    question: "How far in advance should we book?",
    answer:
      "We typically book out 12-18 months in advance for peak wedding season. We recommend reaching out as soon as you have your date and venue secured.",
  },
  {
    question: "Do you travel for destination weddings?",
    answer:
      "Yes, we love to travel! We have captured stories in over 15 countries. Travel fees are transparent and calculated based on location.",
  },
  {
    question: "How long until we receive our photos?",
    answer:
      "A sneak peek is delivered within 48 hours. Your full, hand-edited digital gallery is typically ready within 6 to 8 weeks after the wedding day.",
  },
  {
    question: "Do you offer wedding albums?",
    answer:
      "Absolutely. We specialize in luxury, fine-art heirloom albums printed on museum-grade paper with silk or leather covers.",
  },
];

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleItem = (index) => {
    setActiveIndex((current) => (current === index ? null : index));
  };

  return (
    <section className="py-[120px] bg-white" id="booking">
      <div className="max-w-3xl mx-auto px-margin-mobile">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-stack-lg text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <FAQItem
              key={item.question}
              item={item}
              isActive={activeIndex === index}
              onClick={() => toggleItem(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ item, isActive, onClick }) {
  return (
    <div className="border-b border-outline-variant/30 py-6 cursor-pointer group" onClick={onClick}>
      <div className="flex justify-between items-center gap-4">
        <h3 className="font-headline-md text-[20px] text-primary">{item.question}</h3>
        <MaterialIcon className={`transition-transform duration-300 ${isActive ? "rotate-180" : ""}`}>
          expand_more
        </MaterialIcon>
      </div>

      <div className={`overflow-hidden transition-[max-height] duration-300 ease-out ${isActive ? "max-h-[200px]" : "max-h-0"}`}>
        <p className="font-body-md text-body-md text-on-surface-variant pt-4">{item.answer}</p>
      </div>
    </div>
  );
}
