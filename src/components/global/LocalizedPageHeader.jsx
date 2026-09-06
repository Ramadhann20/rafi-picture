"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LocalizedPageHeader({
  titleKey,
  descriptionKey,
}) {
  const { translate } = useLanguage();

  return (
    <header className="mb-stack-lg text-center">
      <h1 className="font-display-lg text-display-lg mb-stack-sm">
        {translate(titleKey)}
      </h1>

      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
        {translate(descriptionKey)}
      </p>
    </header>
  );
}