"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function PortfolioPageHeader() {
  const { translate } = useLanguage();

  return (
    <header className="mb-14 max-w-3xl">
      <span className="mb-4 block font-label-md text-label-md uppercase tracking-widest text-secondary">
        {translate("portfolioPageLabel")}
      </span>

      <h1 className="font-display-lg text-display-lg text-primary">
        {translate("portfolioPageTitle")}
      </h1>

      <p className="mt-5 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
        {translate("portfolioPageDescription")}
      </p>
    </header>
  );
}