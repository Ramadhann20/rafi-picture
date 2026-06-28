const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAOJnesKhXdguwagGD0nzS5D29PCVzWzsu3orERRow5F7lUFN41hBsjfX2-IH8nKBPG55UNM0fxhmeqUuNyhddFo9nZ8-eh3dD5D7KgDiX_tKUwzUKxZM4Xl8bLoHHiB6T2928LG1X0u6ntfFdzfZN4iIDHra8-Q6145SplHvFEfXeqljltCSy7QPRud07KLqOfZDqO-JdZV55PEuy4reM74cwtOsSaSvTPN3HypPlnwuRrfJbygx-mRE5WtWDwqkGENqbbvGK-IpU6";

export default function HeroSection() {
  return (
    <section className="relative h-[921px] min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover"
          src={heroImage}
          alt="A cinematic wide-angle wedding photograph capturing a couple in a sun-drenched meadow during golden hour."
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-margin-mobile text-center">
        <div className=" p-stack-lg md:p-16 rounded-xl animate-fade-in">
          <h1 className="font-display-lg text-display-lg text-on-primary mb-6 text-shadow-subtle leading-tight">
            Capturing the Soul <br className="hidden md:block" /> of Your Story
          </h1>
          <p className="font-body-lg text-body-lg text-white/90 mb-stack-md max-w-2xl mx-auto font-medium">
            High-end wedding and editorial photography for couples who value timeless elegance, authentic emotion, and artistic storytelling.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#packages" className="bg-white text-primary px-8 py-4 rounded-lg font-label-md hover:bg-secondary-container transition-all">
              View Packages
            </a>
            <a href="#booking" className="border border-white text-white px-8 py-4 rounded-lg font-label-md hover:bg-white/10 transition-all backdrop-blur-sm">
              Book Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
