import PackageCards from "@/components/packages/PackageCards";

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

      {/* Filter Bar */}
      <div className="flex justify-center mb-stack-lg overflow-x-auto">
        <div className="flex p-1 bg-surface-container-low rounded-full">
          {filterItems.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`px-8 py-2 rounded-full font-label-md whitespace-nowrap transition-all ${
                index === 0
                  ? "text-on-primary bg-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Package Cards Section */}
      <PackageCards />
    </main>
  );
}