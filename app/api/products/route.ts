import { NextResponse } from "next/server";
import { getPublicProducts } from "@/lib/data/store";

export const dynamic = "force-dynamic";

/** Public product catalog. */
export async function GET() {
  const products = await getPublicProducts();
  return NextResponse.json({ products });
}
