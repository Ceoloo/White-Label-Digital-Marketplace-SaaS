"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { Product } from "@/config/types";
import { effectivePrice, formatUsd } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const TOKEN_KEY = "wl_admin_token";

const visibilityVariant: Record<string, "success" | "muted" | "secondary"> = {
  public: "success",
  hidden: "muted",
  draft: "secondary",
};

interface FormState {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  salePrice: string;
  inventory: string;
  visibility: Product["visibility"];
  downloadUrl: string;
  videoUrl: string;
  images: string;
  features: string;
  requirements: string;
  type: Product["type"];
  serviceInstructions: string;
  serviceInputs: string;
  serviceSystemPrompt: string;
  serviceDeliveryFormat: string;
}

function emptyForm(defaultCategory: string): FormState {
  return {
    name: "",
    slug: "",
    description: "",
    category: defaultCategory,
    price: "",
    salePrice: "",
    inventory: "-1",
    visibility: "draft",
    downloadUrl: "",
    videoUrl: "",
    images: "",
    features: "",
    requirements: "",
    type: "digital",
    serviceInstructions: "",
    serviceInputs: "",
    serviceSystemPrompt: "",
    serviceDeliveryFormat: "",
  };
}

function formFromProduct(p: Product): FormState {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category,
    price: String(p.price),
    salePrice: p.salePrice != null ? String(p.salePrice) : "",
    inventory: String(p.inventory),
    visibility: p.visibility,
    downloadUrl: p.downloadUrl ?? "",
    videoUrl: p.videoUrl ?? "",
    images: p.images.join("\n"),
    features: p.features.join("\n"),
    requirements: p.requirements.join("\n"),
    type: p.type,
    serviceInstructions: p.service?.instructions ?? "",
    serviceInputs: (p.service?.inputs ?? []).map((f) => f.label).join("\n"),
    serviceSystemPrompt: p.service?.systemPrompt ?? "",
    serviceDeliveryFormat: p.service?.deliveryFormat ?? "",
  };
}

export function AdminProductsManager({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: string[];
}) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [token, setToken] = React.useState("");

  React.useEffect(() => {
    try {
      setToken(localStorage.getItem(TOKEN_KEY) ?? "");
    } catch {
      /* storage unavailable */
    }
  }, []);

  function headers(): HeadersInit {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["x-admin-token"] = token;
    return h;
  }

  async function refresh() {
    const res = await fetch("/api/admin/products", { headers: headers() });
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
    }
  }

  function openNew() {
    setError(null);
    setForm(emptyForm(categories[0] ?? "Uncategorized"));
  }

  function openEdit(p: Product) {
    setError(null);
    setForm(formFromProduct(p));
  }

  function persistToken(value: string) {
    setToken(value);
    try {
      if (value) localStorage.setItem(TOKEN_KEY, value);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        salePrice: form.salePrice.trim() === "" ? null : Number(form.salePrice),
        inventory: form.inventory.trim() === "" ? -1 : parseInt(form.inventory, 10),
        visibility: form.visibility,
        downloadUrl: form.downloadUrl,
        videoUrl: form.videoUrl,
        images: form.images,
        features: form.features,
        requirements: form.requirements,
        type: form.type,
        serviceInstructions: form.serviceInstructions,
        serviceInputs: form.serviceInputs,
        serviceSystemPrompt: form.serviceSystemPrompt,
        serviceDeliveryFormat: form.serviceDeliveryFormat,
      };
      const res = await fetch(
        form.id ? `/api/admin/products/${form.id}` : "/api/admin/products",
        {
          method: form.id ? "PATCH" : "POST",
          headers: headers(),
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Save failed.");
        return;
      }
      await refresh();
      setForm(null);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Delete failed.");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} total · create, edit, and remove catalog items.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" /> New product
        </Button>
      </div>

      {error && !form && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Visibility</th>
              <th className="px-4 py-3 font-medium">Inventory</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => {
              const price = effectivePrice(p.price, p.salePrice);
              const onSale = price < p.price;
              return (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/product/${p.slug}`}
                      className="font-medium hover:text-primary"
                    >
                      {p.name}
                    </Link>
                    {p.type === "service" && (
                      <Badge variant="secondary" className="ml-2">
                        AI service
                      </Badge>
                    )}
                    <div className="text-xs text-muted-foreground">/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium">{formatUsd(price)}</span>
                    {onSale && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        {formatUsd(p.price)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={visibilityVariant[p.visibility] ?? "muted"}>
                      {p.visibility}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.inventory < 0 ? (
                      "Unlimited"
                    ) : p.inventory === 0 ? (
                      <span className="text-destructive">Sold out</span>
                    ) : (
                      p.inventory
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Edit ${p.name}`}
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${p.name}`}
                        disabled={busy}
                        onClick={() => remove(p)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No products yet. Create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Admin token (only needed when ADMIN_API_TOKEN is configured) */}
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted-foreground">
          Admin API token
        </summary>
        <div className="mt-2 max-w-sm">
          <Input
            type="password"
            placeholder="Only required if ADMIN_API_TOKEN is set"
            value={token}
            onChange={(e) => persistToken(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Stored locally in your browser and sent as the{" "}
            <code>x-admin-token</code> header. Leave blank in demo mode.
          </p>
        </div>
      </details>

      {form && (
        <ProductFormModal
          form={form}
          categories={categories}
          busy={busy}
          error={error}
          onChange={setForm}
          onClose={() => setForm(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

function ProductFormModal({
  form,
  categories,
  busy,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  form: FormState;
  categories: string[];
  busy: boolean;
  error: string | null;
  onChange: (f: FormState) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const set = (patch: Partial<FormState>) => onChange({ ...form, ...patch });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-2xl rounded-lg border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">
            {form.id ? "Edit product" : "New product"}
          </h2>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <Input
                required
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            </Field>
            <Field label="Slug (optional)">
              <Input
                value={form.slug}
                placeholder="auto-generated from name"
                onChange={(e) => set({ slug: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </Field>

          <Field label="Product type">
            <Select
              value={form.type}
              onChange={(e) =>
                set({ type: e.target.value as Product["type"] })
              }
            >
              <option value="digital">Digital download</option>
              <option value="service">AI-fulfilled service</option>
            </Select>
          </Field>

          {form.type === "service" && (
            <div className="space-y-4 rounded-md border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium">AI service configuration</p>
              <Field label="AI instructions (what to produce)" required>
                <Textarea
                  rows={4}
                  value={form.serviceInstructions}
                  placeholder="e.g. Write conversion-focused landing page copy for the product described below…"
                  onChange={(e) =>
                    set({ serviceInstructions: e.target.value })
                  }
                />
              </Field>
              <Field label="Customer input fields (one label per line)">
                <Textarea
                  rows={3}
                  value={form.serviceInputs}
                  placeholder={"What is your product?\nWho is your audience?"}
                  onChange={(e) => set({ serviceInputs: e.target.value })}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Delivery format (optional)">
                  <Input
                    value={form.serviceDeliveryFormat}
                    placeholder="e.g. Markdown copy block"
                    onChange={(e) =>
                      set({ serviceDeliveryFormat: e.target.value })
                    }
                  />
                </Field>
                <Field label="System prompt (optional)">
                  <Input
                    value={form.serviceSystemPrompt}
                    placeholder="Overrides the default AI persona"
                    onChange={(e) =>
                      set({ serviceSystemPrompt: e.target.value })
                    }
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category">
              <Select
                value={form.category}
                onChange={(e) => set({ category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Price (USD)" required>
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => set({ price: e.target.value })}
              />
            </Field>
            <Field label="Sale price (optional)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                onChange={(e) => set({ salePrice: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Inventory (-1 = unlimited)">
              <Input
                type="number"
                step="1"
                min="-1"
                value={form.inventory}
                onChange={(e) => set({ inventory: e.target.value })}
              />
            </Field>
            <Field label="Visibility">
              <Select
                value={form.visibility}
                onChange={(e) =>
                  set({ visibility: e.target.value as Product["visibility"] })
                }
              >
                <option value="public">public</option>
                <option value="hidden">hidden</option>
                <option value="draft">draft</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Download URL">
              <Input
                value={form.downloadUrl}
                onChange={(e) => set({ downloadUrl: e.target.value })}
              />
            </Field>
            <Field label="Video URL">
              <Input
                value={form.videoUrl}
                onChange={(e) => set({ videoUrl: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Image URLs (one per line)">
            <Textarea
              rows={2}
              value={form.images}
              onChange={(e) => set({ images: e.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Features (one per line)">
              <Textarea
                rows={4}
                value={form.features}
                onChange={(e) => set({ features: e.target.value })}
              />
            </Field>
            <Field label="Requirements (one per line)">
              <Textarea
                rows={4}
                value={form.requirements}
                onChange={(e) => set({ requirements: e.target.value })}
              />
            </Field>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : form.id ? "Save changes" : "Create product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    />
  );
}
