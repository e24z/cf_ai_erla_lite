import type { Env, PaperSummary, RawPaper } from "./types";

const ANTHROPIC_API_URL =
  "https://api.anthropic.com/v1/messages";

async function callClaude(
  env: Env,
  prompt: string,
): Promise<string> {
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

export async function summariseAndValidate(
  env: Env,
  paper: RawPaper,
): Promise<PaperSummary> {
  const abstract = paper.abstract ?? "No abstract available.";

  const prompt = `Here is an academic paper abstract:

<abstract>
${abstract}
</abstract>

1) Write a 3-sentence summary of this paper. Be precise and factual.
2) List any claims in your summary that are NOT supported by the abstract above.

Respond with valid JSON only, no other text:
{"summary": "...", "unsupported": ["claim 1", "claim 2"]}
If all claims are supported, use an empty array for unsupported.`;

  const raw = await callClaude(env, prompt);

  let parsed: { summary: string; unsupported: string[] };
  try {
    const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = { summary: raw, unsupported: [] };
  }

  const sentenceCount = (parsed.summary.match(/[.!?]+/g) ?? []).length || 1;
  const groundedness = Math.max(
    0,
    1 - parsed.unsupported.length / sentenceCount,
  );

  return {
    paper_id: paper.paperId,
    title: paper.title,
    summary: parsed.summary,
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
