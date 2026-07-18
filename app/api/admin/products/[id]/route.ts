import { NextResponse } from "next/server";
import {
  deleteProduct,
  getProductById,
  getProductBySlugExcluding,
  updateProduct,
} from "@/lib/data/store";
import { mergeProduct, validateProductInput, type ProductInput } from "@/lib/products";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

/** Update a product (partial). */
export async function PATCH(req: Request, { params }: Params) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await params;

  const existing = await getProductById(id);
  if (!existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  let patch: Partial<ProductInput>;
  try {
    patch = (await req.json()) as Partial<ProductInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { valid, errors } = validateProductInput(patch, { partial: true });
  if (!valid) {
    return NextResponse.json({ error: errors.join(" "), errors }, { status: 400 });
  }

  const merged = mergeProduct(existing, patch);

  if (merged.slug !== existing.slug) {
    const clash = await getProductBySlugExcluding(merged.slug, id);
    if (clash) {
      return NextResponse.json(
        { error: `Slug "${merged.slug}" is already in use.` },
        { status: 409 },
      );
    }
  }

  const updated = await updateProduct(merged);
  return NextResponse.json({ product: updated });
}

/** Delete a product. */
export async function DELETE(req: Request, { params }: Params) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await params;

  const existing = await getProductById(id);
  if (!existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const ok = await deleteProduct(id);
  if (!ok) {
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
