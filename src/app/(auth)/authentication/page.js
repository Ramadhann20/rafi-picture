import AuthContainer from "@/components/authentication/AuthContainer";

export const metadata = {
  title: "Client Login & Signup | Rafi Picture",
  description:
    "Login or create an account to access your private Rafi Picture client dashboard.",
};

export default function AuthPage() {
  return (
    <main className="flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden bg-surface text-on-surface">
      <section className="relative hidden h-full min-h-0 overflow-hidden bg-secondary md:flex md:w-1/2 lg:w-3/5">
        <div className="absolute inset-0 z-0">
          <img
            alt="Editorial wedding portrait in a serene garden setting"
            className="h-full w-full object-cover grayscale-20 brightness-[0.85] contrast-[1.05]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5EgWQes-rI7QtfGVG2KkZShcoLJqjXW2GjLIdzQxWaz5DiY7dj5yK3ZuLT5avCx4I1sUkDqc4L1vFEMaF0Vms-kGKyNj22KwkzcX0XzSBFRiUAO3lKftgPdqsvtkZyKKNN2zjREjuzCpfoR7oEwVdL3JYMdozsJ3t2V6D9Wkg04FjNM0yImpCev-7RiuLxxjkc-MXj4xOEH2DjH4lDqq17ukTynuqXkNptMjyshqVGMZpU5yX5wGBIJ3UgKM5wpPvtzR8LVgEOQ1Y"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="relative z-10 flex h-full w-full flex-col justify-between p-6 text-white lg:p-10 xl:p-12">
          <div>
            <h1 className="mb-2 font-headline-md text-headline-md font-bold tracking-tight text-white">
              Rafi Picture
            </h1>
            <div className="h-px w-12 bg-white/40" />
          </div>

          <div className="max-w-md">
            <h2 className="mb-3 font-display-lg text-display-lg italic leading-tight">
              Capturing life's most poetic instances.
            </h2>

            <p className="font-body-lg text-body-lg text-white/80">
              Access your private gallery, download high-resolution moments,
              and manage your upcoming bookings with ease.
            </p>
          </div>

          <div className="flex items-center space-x-6 text-white/60">
            <span className="font-label-sm text-label-sm uppercase tracking-widest">
              London
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest">
              Paris
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest">
              New York
            </span>
          </div>
        </div>
      </section>

      <section className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-surface px-5 py-4 sm:px-8 md:w-1/2 md:px-6 md:py-5 lg:w-2/5 lg:px-10">
        <AuthContainer />
      </section>
    </main>
  );
}
