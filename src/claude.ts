import type { Env, PaperSummary, RawPaper } from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

async function callClaude(env: Env, prompt: string): Promise<string> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    content: { type: string; text: string }[];
  };
  return data.content[0]?.text ?? "";
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

async function validateGroundedness(
  env: Env,
  summary: string,
  abstract: string,
): Promise<number> {
  const THRESHOLD = 0.75;

  const summarySentences = splitSentences(summary);
  const abstractSentences = splitSentences(abstract);

  if (summarySentences.length === 0 || abstractSentences.length === 0) return 0;

  const result = await env.AI.run("@cf/baai/bge-small-en-v1.5", {
    text: [...summarySentences, ...abstractSentences],
  });

  if (!("data" in result) || result.data == null) return 0;

  const embeddings = result.data;
  const summaryEmbeddings = embeddings.slice(0, summarySentences.length);
  const abstractEmbeddings = embeddings.slice(summarySentences.length);

  let groundedCount = 0;
  for (const claimVec of summaryEmbeddings) {
    const bestSim = Math.max(
      ...abstractEmbeddings.map((absVec) => cosineSimilarity(claimVec, absVec)),
    );
    if (bestSim >= THRESHOLD) groundedCount++;
  }

  return groundedCount / summarySentences.length;
}

export async function summariseAndValidate(
  env: Env,
  paper: RawPaper,
): Promise<PaperSummary> {
  const abstract = paper.abstract ?? "No abstract available.";

  const prompt = `Here is an academic paper abstract:

<abstract>
${abstract}
</abstract>

Write a 3-sentence summary of this paper. Be precise and factual. Respond with the summary text only.`;

  const summary = await callClaude(env, prompt);
  const groundedness = await validateGroundedness(env, summary, abstract);

  return {
    paper_id: paper.paperId,
    title: paper.title,
    summary,
    groundedness,
  };
}

export async function suggestNextQueries(
  env: Env,
  summaries: PaperSummary[],
  originalQuery: string,
): Promise<string[]> {
  const summaryText = summaries
    .map((s) => `- ${s.title}: ${s.summary}`)
    .join("\n");

  const prompt = `I'm researching: "${originalQuery}"

I've found these papers so far:
${summaryText}

Suggest 2 follow-up search queries that would deepen this research into unexplored areas.
Respond with valid JSON only: {"queries": ["query 1", "query 2"]}`;

  const raw = await callClaude(env, prompt);

  try {
    const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as { queries: string[] };
    return parsed.queries.slice(0, 2);
  } catch {
    return [];
  }
}
