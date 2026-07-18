import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ServiceInput } from "@/config/types";
import {
  getCurrentUser,
  getProductById,
  getServiceRequestsForEmail,
} from "@/lib/data/store";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { MyServices, type ServiceEntry } from "@/components/my-services";

export const metadata: Metadata = {
  title: "My AI Services",
  description: "Complete and download your purchased AI-fulfilled services.",
};

// Reflects live service-request state (mutated on fulfillment).
export const dynamic = "force-dynamic";

export default async function MyServicesPage() {
  const user = await getCurrentUser();
  const requests = user ? await getServiceRequestsForEmail(user.email) : [];

  const entries: ServiceEntry[] = [];
  for (const request of requests) {
    const product = await getProductById(request.serviceId);
    const inputs: ServiceInput[] = product?.service?.inputs ?? [];
    entries.push({
      request,
      inputs,
      deliveryFormat: product?.service?.deliveryFormat,
    });
  }

  return (
    <div className="container py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">My AI services</h1>
        <p className="mt-2 text-muted-foreground">
          Services you&apos;ve purchased are fulfilled by AI. Provide the details
          for each and generate your deliverable.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <p className="font-medium">No AI services yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Purchase an AI-fulfilled service from the marketplace and it will
            appear here for you to complete.
          </p>
          <Link
            href="/marketplace"
            className={cn(buttonVariants(), "mt-6")}
          >
            Browse services
          </Link>
        </div>
      ) : (
        <MyServices
          entries={entries}
          aiConfigured={Boolean(process.env.ANTHROPIC_API_KEY)}
        />
      )}
    </div>
  );
}
