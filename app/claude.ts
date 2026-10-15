import Anthropic from "@anthropic-ai/sdk";
import { ModelInfo } from "./types";

/**
 * Közös Claude (Anthropic Messages API) segédfüggvények.
 *
 * Az alkalmazás teljesen kliensoldali, a felhasználó saját API kulcsával dolgozik,
 * ezért a böngészőből hívjuk az API-t (`dangerouslyAllowBrowser`). A kulcs csak a
 * felhasználó böngészőjében (localStorage / NEXT_PUBLIC_ env) él.
 */

export interface ClaudeChatTurn {
  role: "user" | "assistant";
  text: string;
}

const MAX_TOKENS = 16000;

function createClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

/** Egy hívás szöveges eredménye: a válasz text blokkjainak összefűzése. */
function extractText(response: Anthropic.Message): string {
  if (response.stop_reason === "refusal") {
    throw new Error("A modell biztonsági okokból elutasította a kérést.");
  }
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  if (!text.trim()) {
    throw new Error("A modell üres választ adott.");
  }
  if (response.stop_reason === "max_tokens") {
    console.warn("A válasz a max_tokens korlát miatt csonkolódhatott.");
  }
  return text;
}

/** Felhasználóbarát (magyar) hibaüzenet az SDK típusos hibáiból. */
export function describeClaudeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return "Érvénytelen Anthropic API kulcs.";
  if (error instanceof Anthropic.PermissionDeniedError) return "Az API kulcs nem jogosult erre a műveletre vagy modellre.";
  if (error instanceof Anthropic.NotFoundError) return "A kiválasztott modell nem érhető el a fiókodban.";
  if (error instanceof Anthropic.RateLimitError) return "Túl sok kérés (rate limit), próbáld újra kicsit később.";
  if (error instanceof Anthropic.APIConnectionError) return "Hálózati hiba: nem érhető el az Anthropic API.";
  if (error instanceof Anthropic.APIError) return `API hiba (${error.status ?? "?"}): ${error.message}`;
  if (error instanceof Error) return error.message;
  return "Ismeretlen hiba";
}

/** Egyszeri generálás rendszerprompttal. */
export async function generateClaudeText(params: {
  apiKey: string;
  model: string;
  system?: string;
  prompt: string;
}): Promise<string> {
  const client = createClient(params.apiKey);
  const response = await client.messages.create({
    model: params.model,
    max_tokens: MAX_TOKENS,
    ...(params.system?.trim() ? { system: params.system } : {}),
    messages: [{ role: "user", content: params.prompt }],
  });
  return extractText(response);
}

/** Többfordulós csevegés: a history + az új felhasználói üzenet alapján válaszol. */
export async function sendClaudeChat(params: {
  apiKey: string;
  model: string;
  system?: string;
  history: ClaudeChatTurn[];
  userText: string;
}): Promise<string> {
  const client = createClient(params.apiKey);
  const messages: Anthropic.MessageParam[] = [
    ...params.history.map((m) => ({ role: m.role, content: m.text })),
    { role: "user", content: params.userText },
  ];
  const response = await client.messages.create({
    model: params.model,
    max_tokens: MAX_TOKENS,
    ...(params.system?.trim() ? { system: params.system } : {}),
    messages,
  });
  return extractText(response);
}

/** A fiókban elérhető Claude modellek lekérése (Models API), ajánlott sorrendben. */
export async function listClaudeModels(apiKey: string): Promise<ModelInfo[]> {
  const client = createClient(apiKey);
  const models: ModelInfo[] = [];
  for await (const m of client.models.list({ limit: 100 })) {
    if (!m.id.startsWith("claude")) continue;
    const displayName = m.display_name || m.id;
    models.push({
      id: m.id,
      name: displayName !== m.id ? `${displayName} (${m.id})` : m.id,
    });
  }

  const score = (id: string) => {
    if (id.startsWith("claude-opus-5-5")) return 100;
    if (id.startsWith("claude-sonnet-5-5")) return 95;
    if (id.startsWith("claude-fable")) return 90;
    if (id.startsWith("claude-haiku-5-5")) return 85;
    if (id.includes("opus")) return 70;
    if (id.includes("sonnet")) return 60;
    if (id.includes("haiku")) return 50;
    return 10;
  };
  return models.sort((a, b) => score(b.id) - score(a.id));
}
