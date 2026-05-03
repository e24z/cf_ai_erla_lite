import type { Env, RawPaper } from "./types";

const BASE_URL = "https://api.semanticscholar.org/graph/v1";
const FIELDS = "paperId,title,abstract,year,citationCount";

export async function searchPapers(
  env: Env,
  query: string,
  limit = 5,
): Promise<RawPaper[]> {
  const params = new URLSearchParams({
    query,
    fields: FIELDS,
    limit: String(limit),
  });

  const res = await fetch(`${BASE_URL}/paper/search?${params}`, {
    headers: env.SEMANTIC_SCHOLAR_API_KEY
      ? { "x-api-key": env.SEMANTIC_SCHOLAR_API_KEY }
      : {},
  });

  if (!res.ok) {
    throw new Error(`Semantic Scholar search failed: ${res.status}`);
  }

  const data = (await res.json()) as { data: RawPaper[] };
  return (data.data ?? []).filter((p) => p.abstract);
}
