import "./globals.css";

// -- Context Providers
import AuthProvider from "@/context/AuthContext";
import DbProvider from "@/context/DbContext";
import LanguageProvider from "@/context/LanguageContext";

import { OverlayProvider } from "@/context/ui/OverlayContext";



export const metadata = {
  title: "Rafi Picture Studio",
  description: "Photography studio website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-surface font-body-md text-on-surface">
        <AuthProvider>
          <DbProvider>
            <LanguageProvider>
              <OverlayProvider>{children}</OverlayProvider>
            </LanguageProvider>
          </DbProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
     
