import { NextResponse } from "next/server";
import {
  getProductById,
  getServiceRequestById,
  updateServiceRequest,
} from "@/lib/data/store";
import { fulfillService } from "@/lib/ai";

export const dynamic = "force-dynamic";
// AI generation can take a while; give the route generous headroom.
export const maxDuration = 60;

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Fulfill a purchased AI service: validate the request, capture the customer's
 * inputs, run the AI (or the simulation in demo mode), and store the deliverable.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  const request = await getServiceRequestById(id);
  if (!request) {
    return NextResponse.json(
      { error: "Service request not found." },
      { status: 404 },
    );
  }
  if (request.status === "processing") {
    return NextResponse.json(
      { error: "This request is already being fulfilled." },
      { status: 409 },
    );
  }

  const product = await getProductById(request.serviceId);
  if (!product || product.type !== "service" || !product.service) {
    return NextResponse.json(
      { error: "This service is no longer available." },
      { status: 400 },
    );
  }

  let body: { inputs?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const inputs = body.inputs ?? {};

  // Require the service's required fields.
  const missing = product.service.inputs
    .filter((f) => f.required && !(inputs[f.id] ?? "").trim())
    .map((f) => f.label);
  if (missing.length) {
    return NextResponse.json(
      { error: `Please complete: ${missing.join(", ")}.` },
      { status: 400 },
    );
  }

  await updateServiceRequest(id, { status: "processing", inputs });

  try {
    const result = await fulfillService(product.service, inputs);
    const updated = await updateServiceRequest(id, {
      status: "completed",
      deliverable: result.deliverable,
      fulfilledBy: result.fulfilledBy,
      completedAt: new Date().toISOString(),
    });
    return NextResponse.json({ request: updated, simulated: result.simulated });
  } catch (err) {
    await updateServiceRequest(id, {
      status: "failed",
      error: err instanceof Error ? err.message : "Fulfillment failed.",
    });
    return NextResponse.json(
      { error: "Fulfillment failed. Please try again." },
      { status: 500 },
    );
  }
}
