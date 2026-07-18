import {
  BarChart3,
  DollarSign,
  Package,
  Percent,
  ShoppingCart,
  Users,
} from "lucide-react";
import { formatDate, formatUsd } from "@/lib/utils";
import {
  getCoupons,
  getOrders,
  getProducts,
  getUsers,
} from "@/lib/data/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  const [orders, products, users, coupons] = await Promise.all([
    getOrders(),
    getProducts(),
    getUsers(),
    getCoupons(),
  ]);

  const paidOrders = orders.filter(
    (o) => o.paymentStatus === "paid" || o.deliveryStatus === "delivered",
  );
  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const aov = paidOrders.length ? revenue / paidOrders.length : 0;

  // Top products by units sold.
  const unitsByProduct = new Map<string, { name: string; units: number; revenue: number }>();
  for (const o of orders) {
    for (const item of o.items) {
      const entry = unitsByProduct.get(item.productId) ?? {
        name: item.name,
        units: 0,
        revenue: 0,
      };
      entry.units += item.quantity;
      entry.revenue += item.price * item.quantity;
      unitsByProduct.set(item.productId, entry);
    }
  }
  const topProducts = [...unitsByProduct.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  const couponUses = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  const pendingReview = orders.filter(
    (o) => o.paymentStatus === "verifying",
  ).length;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<DollarSign />} label="Revenue" value={formatUsd(revenue)} />
        <Stat
          icon={<ShoppingCart />}
          label="Orders"
          value={String(orders.length)}
        />
        <Stat
          icon={<BarChart3 />}
          label="Avg. order value"
          value={formatUsd(aov)}
        />
        <Stat icon={<Users />} label="Customers" value={String(users.length)} />
        <Stat
          icon={<Package />}
          label="Products"
          value={String(products.length)}
        />
        <Stat
          icon={<Percent />}
          label="Coupon redemptions"
          value={String(couponUses)}
        />
        <Stat
          icon={<ShoppingCart />}
          label="Awaiting verification"
          value={String(pendingReview)}
        />
        <Stat
          icon={<Users />}
          label="Active coupons"
          value={String(coupons.filter((c) => c.active).length)}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Top products */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold">Top products</h2>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {p.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.units} sold
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatUsd(p.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold">Recent orders</h2>
            <div className="space-y-3">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{o.id}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.customerEmail} · {formatDate(o.createdAt)}
                    </div>
                  </div>
                  <Badge
                    variant={
                      o.paymentStatus === "paid" ? "success" : "muted"
                    }
                  >
                    {o.paymentStatus}
                  </Badge>
                  <div className="text-sm font-medium">{formatUsd(o.total)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground [&_svg]:size-4">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <div className="mt-2 text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
