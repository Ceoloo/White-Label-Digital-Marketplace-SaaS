import type {
  Product,
  ProductType,
  ProductVisibility,
  ServiceConfig,
  ServiceInput,
} from "@/config/types";
import { slugify } from "@/lib/utils";

/**
 * Product create/update input + validation.
 *
 * Kept as pure functions so the same rules run in the API route (authoritative)
 * and can be reused by the admin UI if desired. The admin never sets computed
 * fields (id, createdAt, rating, reviewCount) — those are managed here.
 */

export interface ProductInput {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  price: number;
  salePrice?: number | null;
  inventory?: number;
  visibility?: ProductVisibility;
  downloadUrl?: string;
  videoUrl?: string;
  images?: string[];
  features?: string[];
  requirements?: string[];
  // AI-service fields (used when type === "service").
  type?: ProductType;
  /** What the AI should produce. */
  serviceInstructions?: string;
  /** Customer input field labels, one per line (or an array of labels). */
  serviceInputs?: string[] | string;
  serviceSystemPrompt?: string;
  serviceDeliveryFormat?: string;
}

const VISIBILITIES: ProductVisibility[] = ["public", "hidden", "draft"];
const TYPES: ProductType[] = ["digital", "service"];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate an input. `partial` allows omitted fields (for PATCH updates); the
 * fields that ARE present are still checked.
 */
export function validateProductInput(
  input: Partial<ProductInput>,
  { partial = false }: { partial?: boolean } = {},
): ValidationResult {
  const errors: string[] = [];

  if (!partial || input.name !== undefined) {
    if (!input.name || !input.name.trim()) errors.push("Name is required.");
  }
  if (!partial || input.price !== undefined) {
    if (typeof input.price !== "number" || Number.isNaN(input.price)) {
      errors.push("Price must be a number.");
    } else if (input.price < 0) {
      errors.push("Price cannot be negative.");
    }
  }
  if (input.salePrice != null) {
    if (typeof input.salePrice !== "number" || input.salePrice < 0) {
      errors.push("Sale price must be a non-negative number.");
    } else if (typeof input.price === "number" && input.salePrice >= input.price) {
      errors.push("Sale price must be lower than the price.");
    }
  }
  if (input.inventory != null) {
    if (!Number.isInteger(input.inventory) || input.inventory < -1) {
      errors.push("Inventory must be an integer (-1 for unlimited).");
    }
  }
  if (input.visibility != null && !VISIBILITIES.includes(input.visibility)) {
    errors.push(`Visibility must be one of: ${VISIBILITIES.join(", ")}.`);
  }
  if (input.type != null && !TYPES.includes(input.type)) {
    errors.push(`Type must be one of: ${TYPES.join(", ")}.`);
  }
  if (input.type === "service") {
    if (!input.serviceInstructions || !input.serviceInstructions.trim()) {
      errors.push("AI service instructions are required for a service.");
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Build a ServiceConfig from the flat admin input fields. */
function buildServiceConfig(input: Partial<ProductInput>): ServiceConfig {
  const inputs: ServiceInput[] = toList(input.serviceInputs).map((label, i) => ({
    id: `f${i + 1}_${slugify(label).slice(0, 20) || "field"}`,
    label,
    multiline: true,
    required: true,
  }));
  return {
    inputs,
    instructions: (input.serviceInstructions ?? "").trim(),
    systemPrompt: input.serviceSystemPrompt?.trim() || undefined,
    deliveryFormat: input.serviceDeliveryFormat?.trim() || undefined,
  };
}

/** Normalize free-form list input (array or newline string) to a clean array. */
export function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function genId(): string {
  return `prod_${Math.random().toString(36).slice(2, 10)}`;
}

/** Build a brand-new Product from validated input. */
export function buildNewProduct(input: ProductInput): Product {
  const name = input.name.trim();
  return {
    id: genId(),
    slug: input.slug?.trim() ? slugify(input.slug) : slugify(name),
    name,
    description: input.description?.trim() ?? "",
    features: toList(input.features),
    requirements: toList(input.requirements),
    price: Number(input.price),
    salePrice:
      input.salePrice != null && input.salePrice > 0
        ? Number(input.salePrice)
        : undefined,
    images: toList(input.images),
    videoUrl: input.videoUrl?.trim() || undefined,
    category: input.category?.trim() || "Uncategorized",
    downloadUrl: input.downloadUrl?.trim() || undefined,
    visibility: input.visibility ?? "draft",
    inventory: input.inventory ?? -1,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
    type: input.type ?? "digital",
    service: input.type === "service" ? buildServiceConfig(input) : undefined,
  };
}

/** Merge a partial input onto an existing product (for updates). */
export function mergeProduct(existing: Product, patch: Partial<ProductInput>): Product {
  return {
    ...existing,
    name: patch.name?.trim() ?? existing.name,
    slug: patch.slug?.trim()
      ? slugify(patch.slug)
      : patch.name?.trim()
        ? existing.slug // keep slug stable on rename unless explicitly set
        : existing.slug,
    description: patch.description ?? existing.description,
    features: patch.features !== undefined ? toList(patch.features) : existing.features,
    requirements:
      patch.requirements !== undefined ? toList(patch.requirements) : existing.requirements,
    price: patch.price != null ? Number(patch.price) : existing.price,
    salePrice:
      patch.salePrice === null
        ? undefined
        : patch.salePrice != null
          ? Number(patch.salePrice)
          : existing.salePrice,
    images: patch.images !== undefined ? toList(patch.images) : existing.images,
    videoUrl: patch.videoUrl !== undefined ? patch.videoUrl.trim() || undefined : existing.videoUrl,
    category: patch.category?.trim() ?? existing.category,
    downloadUrl:
      patch.downloadUrl !== undefined ? patch.downloadUrl.trim() || undefined : existing.downloadUrl,
    visibility: patch.visibility ?? existing.visibility,
    inventory: patch.inventory != null ? patch.inventory : existing.inventory,
    type: patch.type ?? existing.type,
    service:
      (patch.type ?? existing.type) === "service"
        ? mergeServiceConfig(existing.service, patch)
        : undefined,
  };
}

/** Merge service-config fields from a patch onto an existing config. */
function mergeServiceConfig(
  existing: ServiceConfig | undefined,
  patch: Partial<ProductInput>,
): ServiceConfig {
  const base: ServiceConfig = existing ?? { inputs: [], instructions: "" };
  return {
    inputs:
      patch.serviceInputs !== undefined
        ? buildServiceConfig(patch).inputs
        : base.inputs,
    instructions:
      patch.serviceInstructions !== undefined
        ? patch.serviceInstructions.trim()
        : base.instructions,
    systemPrompt:
      patch.serviceSystemPrompt !== undefined
        ? patch.serviceSystemPrompt.trim() || undefined
        : base.systemPrompt,
    deliveryFormat:
      patch.serviceDeliveryFormat !== undefined
        ? patch.serviceDeliveryFormat.trim() || undefined
        : base.deliveryFormat,
    model: base.model,
  };
}
