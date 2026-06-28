import "./globals.css";

// -- Context Providers
import AuthProvider from "@/context/AuthContext";
import DbProvider from "@/context/DbContext";

import { OverlayProvider } from "@/context/ui/OverlayContext";



export const metadata = {
  title: "Rafi Picture Studio",
  description: "Photography studio website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <AuthProvider>
        <DbProvider>
          
          <body className="bg-surface font-body-md text-on-surface">
            <OverlayProvider>{children}</OverlayProvider>
          </body>
        </DbProvider>
      </AuthProvider>
    </html>
  );
}
     
