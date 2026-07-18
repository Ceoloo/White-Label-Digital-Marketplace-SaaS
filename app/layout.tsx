import type { Metadata } from "next";
import "./globals.css";
import marketplaceConfig from "@/config/marketplace.config";
import { getOnionUrl } from "@/lib/privacy";
import { Providers } from "./providers";

const { brand } = marketplaceConfig;

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
};

/**
 * Brand colors + radius are injected as CSS variables from the white-label
 * config, so re-skinning the entire app is a config change — not a code change.
 */
function BrandStyle() {
  const css = `
    :root {
      --primary: ${brand.primaryHsl};
      --ring: ${brand.primaryHsl};
      --accent: ${brand.accentHsl};
      --radius: ${brand.radius};
    }
    .dark {
      --primary: ${brand.primaryHsl};
      --ring: ${brand.primaryHsl};
      --accent: ${brand.accentHsl};
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const onionUrl = getOnionUrl();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <BrandStyle />
        {/* Fallback to the Onion-Location header: lets Tor Browser discover the
            hidden service even when the header is stripped by a proxy. */}
        {onionUrl && <meta httpEquiv="onion-location" content={onionUrl} />}
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
