"use client";

import AppIcon from "@/components/global/AppIcon";
import { useLanguage } from "@/context/LanguageContext";

const reasons = [
  {
    number: "01",
    icon: "photo_camera",
    titleKey: "qualityPhotos",
    descriptionKey: "qualityPhotosDescription",
  },
  {
    number: "02",
    icon: "auto_awesome",
    titleKey: "professionalEditing",
    descriptionKey: "professionalEditingDescription",
  },
  {
    number: "03",
    icon: "verified_user",
    titleKey: "professionalService",
    descriptionKey: "professionalServiceDescription",
  },
];

export default function WhyChooseUs() {
  const { translate } = useLanguage();

  return (
    <section
      className="bg-surface py-[120px]"
      id="about"
    >
      <div className="mx-auto mb-[80px] max-w-container-max px-margin-mobile text-center md:px-margin-desktop">
        <span className="mb-4 block font-label-md text-label-md uppercase tracking-widest text-[#9ee8c2]">
          Rafi Picture
        </span>

        <h2 className="font-headline-lg text-headline-lg text-white">
          {translate("whyChooseUs")}
        </h2>
      </div>

      <div className="mx-auto grid max-w-container-max grid-cols-1 gap-12 px-margin-mobile md:grid-cols-3 md:px-margin-desktop">
        {reasons.map((item) => (
          <article
            key={item.number}
            className="group text-center"
          >
            <div className="ambient-shadow mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 transition-colors duration-300 group-hover:bg-[#58d7ff]">
              <AppIcon
                name={item.icon}
                size={28}
                className="text-white transition-colors duration-300 group-hover:text-[#061d2b]"
              />
            </div>

            <p className="mb-3 font-label-sm text-label-sm uppercase tracking-[0.18em] text-[#9ee8c2]">
              {item.number}
            </p>

            <h3 className="mb-4 font-headline-md text-headline-md text-white">
              {translate(item.titleKey)}
            </h3>

            <p className="font-body-md text-body-md text-slate-100/85">
              {translate(item.descriptionKey)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
