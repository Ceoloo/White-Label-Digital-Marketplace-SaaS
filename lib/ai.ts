import type { ServiceConfig } from "@/config/types";

/**
 * AI fulfillment for sellable services — with a pluggable provider so the whole
 * app can run on a PRIVATE LOCAL MODEL, Anthropic, or a no-model simulation.
 *
 * Provider selection (via env, resolved by `aiProvider()`):
 *   - `local`     — an OpenAI-compatible endpoint you run yourself (Ollama,
 *                   LM Studio, vLLM, LocalAI, …). Data never leaves your infra.
 *                   Configured with LOCAL_AI_BASE_URL (+ LOCAL_AI_MODEL, and
 *                   optionally LOCAL_AI_API_KEY).
 *   - `anthropic` — Claude via the official SDK (ANTHROPIC_API_KEY).
 *   - `none`      — deterministic simulated deliverable (zero setup).
 *
 * `AI_PROVIDER` forces a choice; otherwise a configured local model is preferred
 * (privacy-first), then Anthropic, then the simulation. All secrets/endpoints
 * are read from the environment and never hardcoded.
 */

/** Default Anthropic model. Overridable per service. */
const DEFAULT_ANTHROPIC_MODEL = "claude-opus-4-8";

export type AiProvider = "local" | "anthropic" | "none";

export interface FulfillmentResult {
  deliverable: string;
  /** What produced it: "local:<model>", the Anthropic model id, or "simulated". */
  fulfilledBy: string;
  simulated: boolean;
}

export interface AiStatus {
  provider: AiProvider;
  /** Model name/id when a provider is active. */
  model: string | null;
  /** Human label for dashboards. */
  label: string;
  /** True when running fully on the operator's own infrastructure. */
  privateLocal: boolean;
}

function hasLocal(): boolean {
  return Boolean(process.env.LOCAL_AI_BASE_URL);
}
function hasAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Resolve the active provider from the environment. */
export function aiProvider(): AiProvider {
  const pref = (process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (pref === "local") return hasLocal() ? "local" : "none";
  if (pref === "anthropic") return hasAnthropic() ? "anthropic" : "none";
  if (pref === "none") return "none";
  // Auto: prefer a private local model, then Anthropic, then simulate.
  if (hasLocal()) return "local";
  if (hasAnthropic()) return "anthropic";
  return "none";
}

export function isAiConfigured(): boolean {
  return aiProvider() !== "none";
}

/** Status summary for admin/customer surfaces. */
export function aiStatus(): AiStatus {
  const provider = aiProvider();
  if (provider === "local") {
    const model = process.env.LOCAL_AI_MODEL || "local model";
    return {
      provider,
      model,
      label: `Private local model (${model})`,
      privateLocal: true,
    };
  }
  if (provider === "anthropic") {
    return {
      provider,
      model: DEFAULT_ANTHROPIC_MODEL,
      label: "Claude (Anthropic)",
      privateLocal: false,
    };
  }
  return {
    provider: "none",
    model: null,
    label: "Simulated (no model configured)",
    privateLocal: false,
  };
}

/** Render the service instructions + customer inputs into a single prompt. */
function buildPrompt(
  service: ServiceConfig,
  inputs: Record<string, string>,
): string {
  const lines: string[] = [service.instructions.trim(), ""];
  const entries = service.inputs
    .map((f) => {
      const value = (inputs[f.id] ?? "").trim();
      return value ? `- ${f.label}: ${value}` : null;
    })
    .filter(Boolean) as string[];
  if (entries.length) {
    lines.push("Customer-provided details:", ...entries);
  }
  return lines.join("\n");
}

function defaultSystemPrompt(service: ServiceConfig): string {
  return (
    service.systemPrompt?.trim() ||
    "You are an expert service provider fulfilling a paid customer request. Produce a complete, polished, ready-to-use deliverable. Do not ask follow-up questions; work with the details provided."
  );
}

/**
 * Produce the deliverable for a service request. Best-effort: on any error it
 * falls back to the simulated deliverable rather than throwing, so a purchased
 * service always returns something the customer can see.
 */
export async function fulfillService(
  service: ServiceConfig,
  inputs: Record<string, string>,
): Promise<FulfillmentResult> {
  const provider = aiProvider();
  const system = defaultSystemPrompt(service);
  const prompt = buildPrompt(service, inputs);

  try {
    if (provider === "local") {
      const deliverable = await callLocalModel(service, system, prompt);
      if (!deliverable) return simulate(service, inputs);
      const model = service.model || process.env.LOCAL_AI_MODEL || "local-model";
      return { deliverable, fulfilledBy: `local:${model}`, simulated: false };
    }
    if (provider === "anthropic") {
      const model = service.model || DEFAULT_ANTHROPIC_MODEL;
      const deliverable = await callAnthropic(model, system, prompt);
      if (!deliverable) return simulate(service, inputs);
      return { deliverable, fulfilledBy: model, simulated: false };
    }
  } catch {
    // Network/SDK/credential failure — degrade to the simulation below.
  }
  return simulate(service, inputs);
}

/**
 * Call a private, self-hosted OpenAI-compatible endpoint (Ollama, LM Studio,
 * vLLM, LocalAI, …). Uses the Chat Completions shape so it works with any of
 * them; no SDK dependency and no data leaves the operator's infrastructure.
 * `LOCAL_AI_BASE_URL` should be the OpenAI-compatible base, e.g.
 * `http://localhost:11434/v1` for Ollama.
 */
async function callLocalModel(
  service: ServiceConfig,
  system: string,
  prompt: string,
): Promise<string> {
  const base = (process.env.LOCAL_AI_BASE_URL || "").replace(/\/+$/, "");
  const model = service.model || process.env.LOCAL_AI_MODEL || "local-model";
  const key = process.env.LOCAL_AI_API_KEY;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      stream: false,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Local model request failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

/** Call Claude via the official SDK (lazily imported so builds don't require it). */
async function callAnthropic(
  model: string,
  system: string,
  prompt: string,
): Promise<string> {
  const specifier: string = "@anthropic-ai/sdk";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import(/* turbopackIgnore: true */ specifier);
  const Anthropic = mod.default ?? mod.Anthropic;
  const client = new Anthropic();
  const message = await client.messages.create({
    model,
    max_tokens: 8000,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  return (message.content ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((b: any) => b.type === "text")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b: any) => b.text)
    .join("\n")
    .trim();
}

/** Deterministic stand-in used in demo mode or when a live call fails. */
function simulate(
  service: ServiceConfig,
  inputs: Record<string, string>,
): FulfillmentResult {
  const provided = service.inputs
    .map((f) => {
      const v = (inputs[f.id] ?? "").trim();
      return v ? `- **${f.label}:** ${v}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const deliverable = [
    "## Your deliverable (demo preview)",
    "",
    "This is a simulated deliverable generated without a live AI model. Configure",
    "a private local model (`LOCAL_AI_BASE_URL`) or `ANTHROPIC_API_KEY` to have",
    "this service fulfilled for real.",
    "",
    "**Task**",
    "",
    service.instructions.trim(),
    "",
    provided ? "**Details you provided**\n\n" + provided : "",
    "",
    "**Simulated result**",
    "",
    "A complete, polished result would appear here — tailored to the task and the",
    "details above — ready to download and use.",
  ]
    .filter((s) => s !== undefined)
    .join("\n");

  return { deliverable, fulfilledBy: "simulated", simulated: true };
}
