const stats = [
  { value: "500+", label: "Weddings Captured" },
  { value: "10+", label: "Years Experience" },
  { value: "1000+", label: "Happy Couples" },
];

export default function TrustedStats() {
  return (
    <section className="bg-surface py-stack-lg border-b border-outline-variant/10">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-stack-md text-center">
        {stats.map((item) => (
          <div key={item.label}>
            <div className="font-headline-lg text-headline-lg text-primary">{item.value}</div>
            <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mt-2">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
