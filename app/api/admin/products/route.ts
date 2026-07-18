import { NextResponse } from "next/server";
import { createProduct, getProductBySlugExcluding, getProducts } from "@/lib/data/store";
import { buildNewProduct, validateProductInput, type ProductInput } from "@/lib/products";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** List every product (all visibilities) for the admin catalog manager. */
export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const products = await getProducts();
  return NextResponse.json({ products });
}

/** Create a product. */
export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let input: ProductInput;
  try {
    input = (await req.json()) as ProductInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { valid, errors } = validateProductInput(input);
  if (!valid) {
    return NextResponse.json({ error: errors.join(" "), errors }, { status: 400 });
  }

  const product = buildNewProduct(input);

  // Enforce slug uniqueness so storefront URLs don't collide.
  const clash = await getProductBySlugExcluding(product.slug);
  if (clash) {
    return NextResponse.json(
      { error: `Slug "${product.slug}" is already in use.` },
      { status: 409 },
    );
  }

  const created = await createProduct(product);
  return NextResponse.json({ product: created }, { status: 201 });
}
