import PackageListing from "@/components/packages/PackageListing";

export const metadata = {
  title: "Paket Fotografi | Rafi Picture Studio",
  description:
    "Pilihan paket fotografi pernikahan, pertunangan, prewedding, dan acara dari Rafi Picture Studio.",
};

import ActionButtonWrapper from "@/components/global/ActionButtonWrapper";
import LocalizedPageHeader from "@/components/global/LocalizedPageHeader";

const filterItems = ["Pernikahan", "Pertunangan", "Prewedding", "Acara"];

export default function PackagesPage() {
  return (
    <>
    <ActionButtonWrapper />
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      {/* Page Header */}
      <LocalizedPageHeader
        titleKey="packagesPageTitle"
        descriptionKey="packagesPageDescription"
      />


      {/* Interactive Package Cards Section */}
      <PackageListing />
    </main>
    </>
  );
}