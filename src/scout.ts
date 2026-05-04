import type { Env, PaperSummary } from "./types";
import { searchPapers } from "./openalex";
import { summariseAndValidate, suggestNextQueries } from "./claude";

const GROUNDEDNESS_THRESHOLD = 0.6;

export async function runScout(
  env: Env,
  query: string,
): Promise<{ summaries: PaperSummary[]; nextQueries: string[] }> {
  const papers = await searchPapers(env, query, 5);

  if (papers.length === 0) {
    return { summaries: [], nextQueries: [] };
  }

  const results = await Promise.allSettled(
    papers.map((p) => summariseAndValidate(env, p)),
  );

  const summaries = results
    .filter(
      (r): r is PromiseFulfilledResult<PaperSummary> =>
        r.status === "fulfilled" && r.value.groundedness >= GROUNDEDNESS_THRESHOLD,
    )
    .map((r) => r.value);

  const nextQueries =
    summaries.length > 0
      ? await suggestNextQueries(env, summaries, query)
      : [];

  return { summaries, nextQueries };
}
