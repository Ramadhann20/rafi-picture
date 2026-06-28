import Link from "next/link";
import MaterialIcon from "./MaterialIcon";

export default function Footer() {
  return (
    <footer className="bg-surface-container-highest w-full mt-stack-lg border-t border-outline-variant/20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto">
        {/* Brand */}
        <div>
          <div className="font-headline-md text-headline-md text-primary mb-4">
            Rafi Picture
          </div>

          <p className="font-body-md text-body-md text-on-surface-variant">
            Fotografi pernikahan dan potret editorial untuk kaum romantis
            modern.
          </p>
        </div>

        {/* Studio Links */}
        <div>
          <h4 className="font-label-md text-label-md text-primary mb-4 uppercase">
            Studio
          </h4>

          <ul className="space-y-2">
            <li>
              <Link
                className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-all"
                href="/portfolio"
              >
                Portofolio
              </Link>
            </li>

            <li>
              <Link
                className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-all"
                href="/packages"
              >
                Paket
              </Link>
            </li>

            <li>
              <Link
                className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-all"
                href="/about"
              >
                Tentang
              </Link>
            </li>

            <li>
              <Link
                className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-all"
                href="/journal"
              >
                Jurnal
              </Link>
            </li>
          </ul>
        </div>

        {/* Help Links */}
        <div>
          <h4 className="font-label-md text-label-md text-primary mb-4 uppercase">
            Bantuan
          </h4>

          <ul className="space-y-2">
            <li>
              <Link
                className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-all"
                href="/privacy-policy"
              >
                Kebijakan Privasi
              </Link>
            </li>

            <li>
              <Link
                className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-all"
                href="/terms"
              >
                Syarat dan Ketentuan
              </Link>
            </li>

            <li>
              <Link
                className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-all"
                href="/contact"
              >
                Hubungi Kami
              </Link>
            </li>

            <li>
              <Link
                className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-all"
                href="/faq"
              >
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-label-md text-label-md text-primary mb-4 uppercase">
            Buletin
          </h4>

          <p className="font-label-sm text-label-sm text-on-surface-variant mb-4">
            Terima inspirasi dan update studio.
          </p>

          <form className="flex border-b border-primary pb-2">
            <input
              className="bg-transparent border-none focus:ring-0 w-full text-label-md outline-none"
              placeholder="Email Anda"
              type="email"
            />

            <button type="submit" aria-label="Subscribe newsletter">
              <MaterialIcon>arrow_forward</MaterialIcon>
            </button>
          </form>
        </div>
      </div>

      <div className="px-margin-mobile md:px-margin-desktop py-8 border-t border-outline-variant/10 text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          © 2024 Rafi Picture Studio. Hak cipta dilindungi undang-undang.
        </p>
      </div>
    </footer>
  );
}