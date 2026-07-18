"use client";

import * as React from "react";
import { Check, Download, Loader2, Sparkles } from "lucide-react";
import type { ServiceInput, ServiceRequest } from "@/config/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface ServiceEntry {
  request: ServiceRequest;
  inputs: ServiceInput[];
  deliveryFormat?: string;
}

const statusVariant: Record<
  string,
  "success" | "secondary" | "muted" | "sale"
> = {
  completed: "success",
  processing: "secondary",
  pending: "muted",
  failed: "sale",
};

export function MyServices({
  entries,
  aiConfigured,
}: {
  entries: ServiceEntry[];
  aiConfigured: boolean;
}) {
  return (
    <div className="space-y-6">
      {!aiConfigured && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Demo mode:</span> no{" "}
          <code>ANTHROPIC_API_KEY</code> is set, so deliverables are simulated.
          Add a key to fulfill these with Claude for real.
        </div>
      )}
      {entries.map((entry) => (
        <ServiceCard key={entry.request.id} entry={entry} />
      ))}
    </div>
  );
}

function ServiceCard({ entry }: { entry: ServiceEntry }) {
  const [request, setRequest] = React.useState<ServiceRequest>(entry.request);
  const [values, setValues] = React.useState<Record<string, string>>(
    entry.request.inputs ?? {},
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function generate() {
    setError(null);
    setBusy(true);
    setRequest((r) => ({ ...r, status: "processing" }));
    try {
      const res = await fetch(`/api/services/${request.id}/fulfill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: values }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Fulfillment failed.");
        setRequest((r) => ({ ...r, status: "pending" }));
        return;
      }
      setRequest(data.request);
    } catch {
      setError("Something went wrong. Please try again.");
      setRequest((r) => ({ ...r, status: "pending" }));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!request.deliverable) return;
    const blob = new Blob([request.deliverable], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${request.serviceName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const done = request.status === "completed";
  const processing = request.status === "processing";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="font-semibold">{request.serviceName}</div>
              <div className="text-xs text-muted-foreground">
                Order {request.orderId} · {formatDate(request.createdAt)}
              </div>
            </div>
          </div>
          <Badge variant={statusVariant[request.status] ?? "muted"}>
            {request.status}
          </Badge>
        </div>

        {done ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                <Check className="size-4" /> Deliverable ready
                {request.fulfilledBy && (
                  <span className="text-muted-foreground">
                    · {request.fulfilledBy}
                  </span>
                )}
              </span>
              <Button variant="outline" size="sm" onClick={download}>
                <Download className="size-4" /> Download
              </Button>
            </div>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-4 text-sm leading-relaxed">
              {request.deliverable}
            </pre>
          </div>
        ) : (
          <div className="space-y-4">
            {entry.inputs.map((f) => (
              <label key={f.id} className="block text-sm">
                <span className="mb-1.5 block font-medium">
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </span>
                {f.multiline ? (
                  <textarea
                    rows={3}
                    disabled={processing}
                    placeholder={f.placeholder}
                    value={values[f.id] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.id]: e.target.value }))
                    }
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                  />
                ) : (
                  <Input
                    disabled={processing}
                    placeholder={f.placeholder}
                    value={values[f.id] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.id]: e.target.value }))
                    }
                  />
                )}
              </label>
            ))}

            {entry.deliveryFormat && (
              <p className="text-xs text-muted-foreground">
                Output: {entry.deliveryFormat}
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={generate} disabled={busy || processing}>
              {processing ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Generate deliverable
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
