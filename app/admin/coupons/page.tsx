import { formatDate } from "@/lib/utils";
import { getCoupons } from "@/lib/data/store";
import { Badge } from "@/components/ui/badge";

export default async function AdminCouponsPage() {
  const coupons = await getCoupons();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Coupons</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((c) => {
              const expired =
                c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
              return (
                <tr key={c.code} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-2 py-0.5 font-medium">
                      {c.code}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    {c.type === "percent" ? `${c.value}%` : `$${c.value}`} off
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.usedCount}
                    {typeof c.usageLimit === "number"
                      ? ` / ${c.usageLimit}`
                      : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.expiresAt ? formatDate(c.expiresAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {c.active && !expired ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="muted">
                        {expired ? "Expired" : "Inactive"}
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
