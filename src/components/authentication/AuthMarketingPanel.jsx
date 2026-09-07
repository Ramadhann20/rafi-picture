"use client";

import { useLanguage } from "@/context/LanguageContext";

const AUTH_IMAGE_URL = "/images-auth/PhotoLog.jpg";

export default function AuthMarketingPanel() {
  const { translate } = useLanguage();

  return (
    <section className="relative hidden h-full min-h-0 overflow-hidden bg-secondary md:flex md:w-1/2 lg:w-3/5">
      <div className="absolute inset-0 z-0">
        <img
          alt={translate("authImageAlt")}
          className="h-full w-full object-cover grayscale-20 brightness-[0.85] contrast-[1.05]"
          src={AUTH_IMAGE_URL}
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col justify-between p-6 text-white lg:p-10 xl:p-12">
        <div>
          <h1 className="mb-2 font-headline-md text-headline-md font-bold tracking-tight text-white">
            Rafi Picture
          </h1>
          <div className="h-px w-12 bg-white/40" />
        </div>

        <div className="max-w-md">
          <h2 className="mb-3 font-display-lg text-display-lg italic leading-tight">
            {translate("authMarketingTitle")}
          </h2>

          <p className="font-body-lg text-body-lg text-white/80">
            {translate("authMarketingDescription")}
          </p>
        </div>

        <div className="flex items-center space-x-6 text-white/60">
          <span className="font-label-sm text-label-sm uppercase tracking-widest">
            {translate("authMarketingLocation")}
          </span>
        </div>
      </div>
    </section>
  );
}