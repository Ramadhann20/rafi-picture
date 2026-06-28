const journeySteps = [
  {
    number: "1",
    title: "Consultation",
    description: "A deep dive into your vision, preferences, and wedding details over coffee or video call.",
  },
  {
    number: "2",
    title: "Booking",
    description: "Secure your date with a simple digital contract and a deposit. We then begin detailed planning.",
  },
  {
    number: "3",
    title: "The Shoot",
    description: "Relax and enjoy your day while we discreetly capture every significant moment and artistic detail.",
  },
  {
    number: "4",
    title: "Delivery",
    description: "Receive your hand-edited, high-resolution gallery and luxury custom-designed album.",
  },
];

export default function ServiceFlow() {
  return (
    <section className="py-[120px] bg-white overflow-hidden">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-[80px] text-center">
          Your Journey With Us
        </h2>

        <div className="relative">
          <div className="absolute top-8 left-0 w-full h-[1px] bg-outline-variant/30 hidden md:block" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter relative z-10">
            {journeySteps.map((step, index) => (
              <div
                key={step.number}
                className={`flex flex-col items-center md:items-start text-center md:text-left ${index > 0 ? "mt-12 md:mt-0" : ""}`}
              >
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mb-6 font-bold text-xl relative">
                  {step.number}
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-secondary-container rounded-full border-2 border-white" />
                </div>
                <h3 className="font-label-md text-label-md text-primary uppercase mb-3">{step.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
