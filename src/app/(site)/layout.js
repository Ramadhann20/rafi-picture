import Navbar from "@/components/global/Navbar";
import Footer from "@/components/global/Footer";

export default function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}