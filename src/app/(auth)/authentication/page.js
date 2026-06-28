import AuthContainer from "@/components/authentication/AuthContainer";

export const metadata = {
  title: "Client Login & Signup | Rafi Picture",
  description:
    "Login or create an account to access your private Rafi Picture client dashboard.",
};

export default function AuthPage() {
  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-surface text-on-surface overflow-x-hidden">
      <section className="hidden md:flex md:w-1/2 lg:w-3/5 h-screen sticky top-0 bg-secondary overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Editorial wedding portrait in a serene garden setting"
            className="w-full h-full object-cover grayscale-20 brightness-[0.85] contrast-[1.05]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5EgWQes-rI7QtfGVG2KkZShcoLJqjXW2GjLIdzQxWaz5DiY7dj5yK3ZuLT5avCx4I1sUkDqc4L1vFEMaF0Vms-kGKyNj22KwkzcX0XzSBFRiUAO3lKftgPdqsvtkZyKKNN2zjREjuzCpfoR7oEwVdL3JYMdozsJ3t2V6D9Wkg04FjNM0yImpCev-7RiuLxxjkc-MXj4xOEH2DjH4lDqq17ukTynuqXkNptMjyshqVGMZpU5yX5wGBIJ3UgKM5wpPvtzR8LVgEOQ1Y"
          />
        </div>

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-margin-desktop text-white">
          <div>
            <h1 className="font-headline-md text-headline-md font-bold tracking-tight text-white mb-2">
              Rafi Picture
            </h1>
            <div className="h-px w-12 bg-white/40" />
          </div>

          <div className="max-w-md">
            <h2 className="font-display-lg text-display-lg italic leading-tight mb-4">
              Capturing life's most poetic instances.
            </h2>

            <p className="font-body-lg text-body-lg text-white/80">
              Access your private gallery, download high-resolution moments,
              and manage your upcoming bookings with ease.
            </p>
          </div>

          <div className="flex items-center space-x-6 text-white/60">
            <span className="font-label-sm text-label-sm tracking-widest uppercase">
              London
            </span>
            <span className="font-label-sm text-label-sm tracking-widest uppercase">
              Paris
            </span>
            <span className="font-label-sm text-label-sm tracking-widest uppercase">
              New York
            </span>
          </div>
        </div>
      </section>

      <section className="w-full md:w-1/2 lg:w-2/5 min-h-screen flex items-center justify-center bg-surface p-margin-mobile md:p-margin-desktop">
        <AuthContainer />
      </section>
    </main>
  );
}