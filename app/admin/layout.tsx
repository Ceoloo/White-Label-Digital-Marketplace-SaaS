import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import marketplaceConfig from "@/config/marketplace.config";
import { dataSource } from "@/lib/data/store";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminNav } from "@/components/admin-nav";
import { Badge } from "@/components/ui/badge";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { brand } = marketplaceConfig;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              {brand.logoMark}
            </span>
            <div>
              <div className="text-sm font-semibold leading-tight">
                {brand.name}
              </div>
              <div className="text-xs text-muted-foreground">Admin</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="muted">data: {dataSource()}</Badge>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Storefront
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container flex flex-1 gap-8 py-8">
        <aside className="hidden w-52 shrink-0 md:block">
          <div className="sticky top-8">
            <AdminNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
