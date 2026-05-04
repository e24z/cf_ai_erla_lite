import type { Env, RawPaper } from "./types";

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
  synthesis: string,
  sourceText: string,
): Promise<number> {
  const THRESHOLD = 0.75;

  const synthesisSentences = splitSentences(synthesis);
  const sourceSentences = splitSentences(sourceText);

  if (synthesisSentences.length === 0 || sourceSentences.length === 0) return 0;

  const result = await env.AI.run("@cf/baai/bge-small-en-v1.5", {
    text: [...synthesisSentences, ...sourceSentences],
  });

  if (!("data" in result) || result.data == null) return 0;

  const embeddings = result.data;
  const synthesisEmbeddings = embeddings.slice(0, synthesisSentences.length);
  const sourceEmbeddings = embeddings.slice(synthesisSentences.length);

  let groundedCount = 0;
  for (const claimVec of synthesisEmbeddings) {
    const bestSim = Math.max(
      ...sourceEmbeddings.map((srcVec) => cosineSimilarity(claimVec, srcVec)),
    );
    if (bestSim >= THRESHOLD) groundedCount++;
  }

  return groundedCount / synthesisSentences.length;
}

export async function synthesise(
  env: Env,
  papers: RawPaper[],
  previousSyntheses: string[],
  query: string,
): Promise<{ synthesis: string; groundedness: number }> {
  const paperList = papers
    .map((p, i) => `[${i + 1}] ${p.title}\n${p.abstract}`)
    .join("\n\n");

  const historySection =
    previousSyntheses.length > 0
      ? `\n\nPrevious findings in this session:\n${previousSyntheses.map((s) => `- ${s}`).join("\n")}`
      : "";

  const prompt = `You are synthesising academic research. Based on the papers below, write a single coherent paragraph (4-6 sentences) capturing the key findings relevant to: "${query}".

Use inline citations like [1], [2]. Be precise and factual. Only cite claims supported by the abstracts provided.${historySection}

Papers:
${paperList}

Write the synthesis paragraph only, no preamble.`;

  const synthesis = await callClaude(env, prompt);

  const allAbstracts = papers.map((p) => p.abstract ?? "").join(" ");
  const groundedness = await validateGroundedness(env, synthesis, allAbstracts);

  return { synthesis, groundedness };
}
