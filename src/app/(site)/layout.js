
import Navbar from "@/components/global/Navbar";
import Footer from "@/components/global/Footer";

import TermsSessionGate from "@/components/ui/TermsSessionGate";


export default function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      <TermsSessionGate />
      {children}
      <Footer />
    </>
  );
}