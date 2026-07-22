import PackageListing from "@/components/packages/PackageListing";

export const metadata = {
  title: "Paket Fotografi | Rafi Picture Studio",
  description:
    "Pilihan paket fotografi pernikahan, pertunangan, prewedding, dan acara dari Rafi Picture Studio.",
};

const filterItems = ["Pernikahan", "Pertunangan", "Prewedding", "Acara"];

export default function PackagesPage() {
  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      {/* Page Header */}
      <header className="mb-stack-lg text-center">
        <h1 className="font-display-lg text-display-lg mb-stack-sm">
          Paket Fotografi Kami
        </h1>

        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Mengabadikan momen abadi dalam hidup Anda melalui lensa editorial.
          Pilih paket yang sesuai dengan visi Anda.
        </p>
      </header>


      {/* Interactive Package Cards Section */}
      <PackageListing />
    </main>
  );
}