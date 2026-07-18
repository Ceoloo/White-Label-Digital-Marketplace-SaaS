import type { Metadata } from "next";
import "./globals.css";
import marketplaceConfig from "@/config/marketplace.config";
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <BrandStyle />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
