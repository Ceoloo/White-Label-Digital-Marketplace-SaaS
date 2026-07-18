import { formatDate, formatUsd } from "@/lib/utils";
import { getOrders } from "@/lib/data/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const paymentVariant: Record<string, "success" | "secondary" | "muted" | "sale"> = {
  paid: "success",
  verifying: "secondary",
  pending: "muted",
  failed: "sale",
};

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  const needsReview = orders.filter((o) => o.paymentStatus === "verifying");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Orders</h1>

      {needsReview.length > 0 && (
        <Card className="mb-6 border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 text-sm">
            <span className="font-medium">{needsReview.length}</span> order
            {needsReview.length === 1 ? "" : "s"} awaiting manual payment
            verification (crypto / Zelle).
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Delivery</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{o.id}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {o.customerEmail}
                </td>
                <td className="px-4 py-3 capitalize">{o.paymentMethod}</td>
                <td className="px-4 py-3">
                  <Badge variant={paymentVariant[o.paymentStatus] ?? "muted"}>
                    {o.paymentStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      o.deliveryStatus === "delivered" ? "success" : "muted"
                    }
                  >
                    {o.deliveryStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatUsd(o.total)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(o.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
