import AppIcon from "@/components/global/AppIcon";

const reasons = [
  {
    number: "01",
    icon: "photo_camera",
    title: "HASIL FOTO BERKUALITAS",
    description:
      "Menghasilkan foto dengan detail yang tajam, komposisi yang tepat, dan warna yang natural.",
  },
  {
    number: "02",
    icon: "auto_awesome",
    title: "EDITING PROFESIONAL",
    description:
      "Setiap foto melalui proses editing untuk menghasilkan tampilan yang clean, estetik, dan konsisten.",
  },
  {
    number: "03",
    icon: "verified_user",
    title: "PELAYANAN PROFESIONAL",
    description:
      "Didukung fotografer berpengalaman dengan proses kerja yang terencana dan sesuai kebutuhan setiap klien.",
  },
];

export default function WhyChooseUs() {
  return (
    <section
      className="bg-surface py-[120px]"
      id="about"
    >
      <div className="mx-auto mb-[80px] max-w-container-max px-margin-mobile text-center md:px-margin-desktop">
        <span className="mb-4 block font-label-md text-label-md uppercase tracking-widest text-secondary">
          Rafi Picture
        </span>

        <h2 className="font-headline-lg text-headline-lg text-primary">
          Mengapa Memilih Rafi Picture?
        </h2>
      </div>

      <div className="mx-auto grid max-w-container-max grid-cols-1 gap-12 px-margin-mobile md:grid-cols-3 md:px-margin-desktop">
        {reasons.map((item) => (
          <article
            key={item.number}
            className="group text-center"
          >
            <div className="ambient-shadow mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white transition-colors duration-300 group-hover:bg-primary">
              <AppIcon
                name={item.icon}
                size={28}
                className="text-primary transition-colors duration-300 group-hover:text-white"
              />
            </div>

            <p className="mb-3 font-label-sm text-label-sm uppercase tracking-[0.18em] text-secondary">
              {item.number}
            </p>

            <h3 className="mb-4 font-headline-md text-headline-md text-primary">
              {item.title}
            </h3>

            <p className="font-body-md text-body-md text-on-surface-variant">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
