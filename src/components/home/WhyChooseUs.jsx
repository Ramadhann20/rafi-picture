import MaterialIcon from "@/components/global/MaterialIcon";

const reasons = [
  {
    icon: "history_edu",
    title: "Timeless Style",
    description:
      "We avoid passing trends, focusing on a clean, classic aesthetic that will look as beautiful in 50 years as it does today.",
  },
  {
    icon: "camera",
    title: "Professional Gear",
    description:
      "Utilizing industry-leading medium format cameras and prime lenses to deliver unmatched detail and dynamic range.",
  },
  {
    icon: "favorite",
    title: "Emotional Storytelling",
    description:
      "Beyond poses, we capture the silent glances and spontaneous joy that define the true soul of your celebration.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-[120px] bg-surface" id="about">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center mb-[80px]">
        <span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-4 block">
          The Experience
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary">Why Choose Rafi Picture</h2>
      </div>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-12">
        {reasons.map((item) => (
          <div key={item.title} className="text-center group">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 ambient-shadow group-hover:bg-primary transition-colors duration-300">
              <MaterialIcon className="text-3xl group-hover:text-white transition-colors">{item.icon}</MaterialIcon>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary mb-4">{item.title}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
