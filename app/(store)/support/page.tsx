import type { Metadata } from "next";
import { LifeBuoy, Mail, MessageSquare } from "lucide-react";
import marketplaceConfig from "@/config/marketplace.config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with your orders, downloads, and account.",
};

export default function SupportPage() {
  const { brand } = marketplaceConfig;

  return (
    <div className="container py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        <p className="mt-2 text-muted-foreground">
          We&apos;re here to help. Reach out and we&apos;ll get back to you as
          soon as possible.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Mail className="size-5" />
              </div>
              <div>
                <div className="font-semibold">Email</div>
                <a
                  href={`mailto:${brand.supportEmail}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {brand.supportEmail}
                </a>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                <LifeBuoy className="size-5" />
              </div>
              <div>
                <div className="font-semibold">Help Center</div>
                <div className="text-sm text-muted-foreground">
                  Guides for orders, downloads &amp; payments.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Open a ticket</h2>
            </div>
            <form className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1.5 block font-medium">Name</span>
                  <Input placeholder="Your name" />
                </label>
                <label className="text-sm">
                  <span className="mb-1.5 block font-medium">Email</span>
                  <Input type="email" placeholder="you@example.com" />
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Subject</span>
                <Input placeholder="How can we help?" />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Message</span>
                <textarea
                  rows={5}
                  placeholder="Describe your issue…"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </label>
              <Button type="button">Submit ticket</Button>
              <p className="text-xs text-muted-foreground">
                This is a demo form. Wire it to your ticketing system or inbox in
                production.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
