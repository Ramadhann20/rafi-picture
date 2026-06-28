import AdminLoginForm from "@/components/admin/login/LoginForm";

export const metadata = {
  title: "Admin Login | Rafi Picture",
  description: "Secure admin access for Rafi Picture Studio.",
};

export default function AdminLoginPage() {
  return (
    <main className="relative h-screen overflow-hidden bg-surface font-body-md text-on-surface auth-gradient">
      <header className="absolute top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-6">
        <div className="flex items-center gap-2">
          <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
            Rafi Picture
          </span>

          <span className="h-4 w-[1px] bg-outline-variant mx-2" />

          <span className="font-label-md text-label-md text-on-surface-variant tracking-widest uppercase">
            Admin
          </span>
        </div>

        <a
          className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 font-label-md text-label-md"
          href="#"
        >
          <span className="material-symbols-outlined text-[20px]">
            help_outline
          </span>

          <span className="hidden md:inline">Support</span>
        </a>
      </header>

      <section className="h-screen flex items-center justify-center px-margin-mobile pt-24 pb-8">
        <AdminLoginForm />
      </section>

      <div className="hidden lg:block fixed left-margin-desktop bottom-margin-desktop max-w-[240px] pointer-events-none">
        <div className="relative overflow-hidden aspect-[3/4] rounded-lg grayscale opacity-20">
          <img
            className="object-cover w-full h-full"
            alt="Editorial studio portrait"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeuluBNHpfbIQyI8yMTsAQlyjbllOAoCORy5Sjzi5xEEDkQnXqHvg08RNrFGCTNvtgXzaZp6UTLLnHmhFUQQKjz9daReIoMq7lM_KynwLRXs1iTR_UWxYFkv2xDTTpbkrNYe5SlUM-7thbJIPIWvKHNoBU9_6RKpvKGC5KzgGSSq2kWvgKSNv59atDmczDJ9rnCgeWg4XoFQyTo1096PKJx_87LzQV7_BWD2L_76rKVr98O-gV23s_PMiA3R8oPjf2od8r13GLV_cN"
          />
        </div>
      </div>
    </main>
  );
}