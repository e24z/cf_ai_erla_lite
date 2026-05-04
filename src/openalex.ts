import type { RawPaper } from "./types";

const BASE_URL = "https://api.openalex.org/works";

interface OpenAlexWork {
  id: string;
  title: string;
  abstract_inverted_index: Record<string, number[]> | null;
  publication_year: number | null;
  cited_by_count: number | null;
}

function reconstructAbstract(
  index: Record<string, number[]> | null,
): string | null {
  if (!index) return null;
  const pairs: [string, number][] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) pairs.push([word, pos]);
  }
  pairs.sort((a, b) => a[1] - b[1]);
  return pairs.map(([word]) => word).join(" ");
}

export async function searchPapers(
  _env: unknown,
  query: string,
  limit = 5,
): Promise<RawPaper[]> {
  const params = new URLSearchParams({
    search: query,
    "per-page": String(limit),
    select: "id,title,abstract_inverted_index,publication_year,cited_by_count",
    mailto: "research-demo@example.com",
  });

  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * attempt));
    res = await fetch(`${BASE_URL}?${params}`);
    if (res.status !== 429) break;
  }

  if (!res || !res.ok) {
    throw new Error(`OpenAlex search failed: ${res?.status ?? "no response"}`);
  }

  const data = (await res.json()) as { results: OpenAlexWork[] };

  return (data.results ?? [])
    .map((w) => ({
      paperId: w.id.replace("https://openalex.org/", ""),
      title: w.title ?? "Unknown",
      abstract: reconstructAbstract(w.abstract_inverted_index),
      year: w.publication_year,
      citationCount: w.cited_by_count,
    }))
    .filter((p) => p.abstract);
}
