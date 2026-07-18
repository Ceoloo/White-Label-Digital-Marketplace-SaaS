import Link from "next/link";
import marketplaceConfig from "@/config/marketplace.config";
import { dataSource } from "@/lib/data/store";

export function SiteFooter() {
  const { brand, nav, legal } = marketplaceConfig;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              {brand.logoMark}
            </span>
            {brand.name}
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            {brand.tagline}
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href={legal.termsUrl} className="hover:text-foreground">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href={legal.privacyUrl} className="hover:text-foreground">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href={legal.refundUrl} className="hover:text-foreground">
                Refund Policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a
                href={`mailto:${brand.supportEmail}`}
                className="hover:text-foreground"
              >
                {brand.supportEmail}
              </a>
            </li>
            <li>
              <Link href="/support" className="hover:text-foreground">
                Help Center
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-foreground">
                Admin Dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {year} {brand.name}. Built on the white-label marketplace engine.
          </p>
          <p>
            Data source:{" "}
            <span className="font-medium text-foreground">{dataSource()}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
