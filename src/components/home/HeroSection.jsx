"use client"

import Image from "next/image"
import  {useRouter } from "next/navigation"
import { useLanguage } from "@/context/LanguageContext";

export default function HeroSection() {
  const router = useRouter();
  const { translate } = useLanguage();

  return (
    <section className="relative h-[921px] min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          className="w-full h-full object-cover"
          src={"/RafiPicture.jpeg"}
          alt="A cinematic wide-angle wedding photograph capturing a couple in a sun-drenched meadow during golden hour."
          width={800}
          height={700}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-margin-mobile text-center">
        <div className=" p-stack-lg md:p-16 rounded-xl animate-fade-in">
          <h1 className="hero-copy-title font-display-lg text-display-lg text-white mb-6 text-shadow-subtle leading-tight">
            {translate("heroTitle")}
          </h1>
          <p className="hero-copy-description font-body-lg text-body-lg text-white/90 mb-stack-md max-w-2xl mx-auto font-medium">
            {translate("heroDescription")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push("/packages")} className="hero-cta-button bg-white text-[#061d2b] px-8 py-4 rounded-lg font-label-md hover:bg-[#dfeeff] transition-all shadow-lg shadow-black/20">
              {translate("viewPackages")}
            </button>
            <button onClick={() => router.push("/booking")} className="hero-cta-button bg-white text-[#061d2b] px-8 py-4 rounded-lg font-label-md hover:bg-[#dfeeff] transition-all shadow-lg shadow-black/20">
              {translate("bookNow")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
