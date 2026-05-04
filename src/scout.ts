import type { Env, RawPaper } from "./types";
import { searchPapers } from "./openalex";
import { synthesise } from "./claude";

export async function runScout(
  env: Env,
  query: string,
  previousSyntheses: string[] = [],
): Promise<{ synthesis: string; groundedness: number; papersUsed: number; papers: RawPaper[] }> {
  const papers = await searchPapers(env, query, 5);

  if (papers.length === 0) {
    return { synthesis: "No papers found for this query.", groundedness: 0, papersUsed: 0, papers: [] };
  }

  const { synthesis, groundedness } = await synthesise(env, papers, previousSyntheses, query);

  return { synthesis, groundedness, papersUsed: papers.length, papers };
}
