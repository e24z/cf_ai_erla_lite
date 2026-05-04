import type { RawPaper } from "./types";

const BASE_URL = "https://export.arxiv.org/api/query";

function extract(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match?.[1] ?? null;
}

function parseAtomFeed(xml: string): RawPaper[] {
  const entries = xml.split("<entry>").slice(1);

  return entries
    .map((entry) => {
      const rawId = extract(entry, "id") ?? "";
      const paperId = rawId.split("/abs/").pop() ?? rawId;
      const title = (extract(entry, "title") ?? "Unknown")
        .replace(/\s+/g, " ")
        .trim();
      const abstract = (extract(entry, "summary") ?? "")
        .replace(/\s+/g, " ")
        .trim() || null;

      return { paperId, title, abstract, year: null, citationCount: null };
    })
    .filter((p) => p.abstract);
}

export async function searchPapers(
  _env: unknown,
  query: string,
  limit = 5,
): Promise<RawPaper[]> {
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    start: "0",
    max_results: String(limit),
  });

  const res = await fetch(`${BASE_URL}?${params}`, {
    headers: { "User-Agent": "cf-ai-erla-lite/0.1 (research demo)" },
  });

  if (!res.ok) {
    throw new Error(`arXiv search failed: ${res.status}`);
  }

  const xml = await res.text();
  return parseAtomFeed(xml);
}
