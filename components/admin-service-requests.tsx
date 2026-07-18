"use client";

import * as React from "react";
import { Cpu, Eye, X } from "lucide-react";
import type { ServiceRequest, ServiceRequestStatus } from "@/config/types";
import type { AiStatus } from "@/lib/ai";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const statusVariant: Record<
  ServiceRequestStatus,
  "success" | "secondary" | "muted" | "sale"
> = {
  completed: "success",
  processing: "secondary",
  pending: "muted",
  failed: "sale",
};

export function AdminServiceRequests({
  requests,
  ai,
}: {
  requests: ServiceRequest[];
  ai: AiStatus;
}) {
  const [viewing, setViewing] = React.useState<ServiceRequest | null>(null);

  const counts = React.useMemo(() => {
    const c = { total: requests.length, pending: 0, processing: 0, completed: 0, failed: 0 };
    for (const r of requests) c[r.status]++;
    return c;
  }, [requests]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            AI service requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Every purchased AI service and its fulfillment status.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <Cpu className="size-4 text-primary" />
          <span className="text-muted-foreground">Provider:</span>
          <span className="font-medium">{ai.label}</span>
          {ai.privateLocal && <Badge variant="success">Private / local</Badge>}
        </div>
      </div>

      {/* Counters */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Total" value={counts.total} />
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Processing" value={counts.processing} />
        <Stat label="Completed" value={counts.completed} tone="success" />
        <Stat label="Failed" value={counts.failed} tone="destructive" />
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No service requests yet. They appear here once a customer buys an AI
          service.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Fulfilled by</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 text-right font-medium">Deliverable</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{r.serviceName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.customerEmail}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.orderId}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.fulfilledBy ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "completed" && r.deliverable ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewing(r)}
                      >
                        <Eye className="size-4" /> View
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-lg border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-lg font-semibold">{viewing.serviceName}</h2>
                <p className="text-xs text-muted-foreground">
                  {viewing.customerEmail} · {viewing.orderId}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={() => setViewing(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="p-6">
              {Object.keys(viewing.inputs).length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold">Customer inputs</h3>
                  <dl className="space-y-1 text-sm">
                    {Object.entries(viewing.inputs).map(([k, v]) => (
                      <div key={k} className="text-muted-foreground">
                        {v}
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              <h3 className="mb-2 text-sm font-semibold">Deliverable</h3>
              <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-4 text-sm leading-relaxed">
                {viewing.deliverable}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "destructive";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={
            "mt-1 text-2xl font-bold" +
            (tone === "success"
              ? " text-success"
              : tone === "destructive" && value > 0
                ? " text-destructive"
                : "")
          }
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
