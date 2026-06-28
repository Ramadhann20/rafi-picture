export default function PackageOption({
  selectedPackageId,
  packageOptions,
  errors = {},
  onChange,
}) {
  return (
    <div>
      <h2 className="font-headline-md text-headline-md mb-stack-md">
        Select Your Package
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
        {packageOptions.map((item) => {
          const isSelected = selectedPackageId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`relative text-left flex flex-col rounded-xl p-6 cursor-pointer transition-all ${
                isSelected
                  ? "border-2 border-primary bg-secondary-container/20"
                  : "border border-outline-variant hover:border-primary"
              }`}
            >
              {item.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full">
                  {item.badge}
                </div>
              )}

              <input
                readOnly
                checked={isSelected}
                className="absolute top-4 right-4 text-primary focus:ring-primary h-4 w-4"
                name="package"
                type="radio"
                value={item.id}
              />

              <span
                className={`font-label-sm text-label-sm uppercase tracking-widest mb-2 ${
                  isSelected ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {item.name}
              </span>

              <div className="font-headline-md text-headline-md mb-4">
                {item.priceLabel}
              </div>

              <ul className="space-y-2 text-on-surface-variant text-label-sm font-label-sm flex-grow">
                {item.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-secondary">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {errors.packageId && (
        <p className="mt-4 font-label-sm text-label-sm text-error">
          {errors.packageId}
        </p>
      )}
    </div>
  );
}