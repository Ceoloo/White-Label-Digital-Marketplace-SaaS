import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bot, CheckCircle2, ShieldCheck } from "lucide-react";
import marketplaceConfig from "@/config/marketplace.config";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "AI Services",
  description: "Optional, consent-based AI workflows configured by the store.",
};

export default function AiServicesPage() {
  const { aiServices, features } = marketplaceConfig;
  if (!features.aiServices) notFound();

  return (
    <div className="container py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">AI Services</h1>
        <p className="mt-2 text-muted-foreground">
          Optional AI-assisted workflows a store can enable. These are strictly
          consent-based: they run only with the customer&apos;s explicit
          authorization and comply with applicable authentication and privacy
          policies.
        </p>
      </header>

      <div className="mb-8 flex items-start gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Consent first.</span>{" "}
          Every AI workflow requires the user to authenticate themselves and
          authorize the action. Nothing runs on a customer&apos;s behalf without
          their explicit, revocable consent, and sensitive steps can be escalated
          to a human.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {aiServices.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Bot className="size-5" />
                </div>
                <Badge variant={s.enabled ? "success" : "muted"}>
                  {s.enabled ? "Available" : "Disabled"}
                </Badge>
              </div>
              <h2 className="text-lg font-semibold">{s.label}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {s.description}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  "Explicit user authorization required",
                  "Email & phone verification with consent",
                  "Full audit trail and human escalation",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-success" /> {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
