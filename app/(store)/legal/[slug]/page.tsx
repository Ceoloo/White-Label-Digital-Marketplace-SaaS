import type { Metadata } from "next";
import { notFound } from "next/navigation";
import marketplaceConfig from "@/config/marketplace.config";

const pages: Record<string, { title: string; body: string[] }> = {
  terms: {
    title: "Terms of Service",
    body: [
      "These placeholder Terms of Service describe the agreement between the store and its customers. Replace this content with your own legal terms before going live.",
      "By purchasing digital products you agree to use them in accordance with their individual licenses. Digital goods are delivered electronically and access is granted once payment is confirmed.",
      "The store reserves the right to update these terms. Continued use of the marketplace constitutes acceptance of the current terms.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "This placeholder Privacy Policy explains what data the store collects and how it is used. Replace this content with your own policy before going live.",
      "We collect only the information needed to process orders and deliver products, such as your name and email. Payment details are handled by the respective payment provider.",
      "You may request access to, or deletion of, your personal data at any time by contacting support.",
    ],
  },
  refunds: {
    title: "Refund Policy",
    body: [
      "This placeholder Refund Policy outlines when refunds are available. Replace this content with your own policy before going live.",
      "Because digital products are delivered instantly, refund eligibility may be limited. Contact support with your order ID and we'll review your request.",
      "Approved refunds are issued to the original payment method where possible.",
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug];
  return { title: page?.title ?? "Legal" };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
      </p>
      <div className="mt-8 space-y-4 leading-relaxed text-muted-foreground">
        {page.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Questions? Contact{" "}
        <a
          href={`mailto:${marketplaceConfig.brand.supportEmail}`}
          className="text-primary underline"
        >
          {marketplaceConfig.brand.supportEmail}
        </a>
        .
      </p>
    </div>
  );
}
