"use client"

import Image from "next/image"
import  {useRouter } from "next/navigation"

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative h-[921px] min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          className="w-full h-full object-cover"
          src={"/RP.png"}
          alt="A cinematic wide-angle wedding photograph capturing a couple in a sun-drenched meadow during golden hour."
          width={800}
          height={700}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-margin-mobile text-center">
        <div className=" p-stack-lg md:p-16 rounded-xl animate-fade-in">
          <h1 className="font-display-lg text-display-lg text-on-primary mb-6 text-shadow-subtle leading-tight">
            Capture The Soul <br className="hidden md:block" /> of Your Story
          </h1>
          <p className="font-body-lg text-body-lg text-white/90 mb-stack-md max-w-2xl mx-auto font-medium">
            High-end wedding and editorial photography for couples who value timeless elegance, authentic emotion, and artistic storytelling.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push("/packages")} className="bg-white text-primary px-8 py-4 rounded-lg font-label-md hover:bg-secondary-container transition-all">
              View Packages
            </button>
            <button onClick={() => router.push("/booking")} className="border border-white text-white px-8 py-4 rounded-lg font-label-md hover:bg-white/10 transition-all backdrop-blur-sm">
              Book Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
