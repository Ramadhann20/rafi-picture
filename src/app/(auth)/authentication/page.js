import AuthContainer from "@/components/authentication/AuthContainer";
import AuthMarketingPanel from "@/components/authentication/AuthMarketingPanel";

export const metadata = {
  title: "Client Login & Signup | Rafi Picture",
  description:
    "Login or create an account to access your private Rafi Picture client dashboard.",
};

export default function AuthPage() {
  return (
    <main className="flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden bg-surface text-on-surface">
      <AuthMarketingPanel />

      <section className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-surface px-5 py-4 sm:px-8 md:w-1/2 md:px-6 md:py-5 lg:w-2/5 lg:px-10">
        <AuthContainer />
      </section>
    </main>
  );
}
