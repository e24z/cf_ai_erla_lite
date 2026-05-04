export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  AI: Ai;
}

export interface ResearchRequest {
  query: string;
  session_id?: string;
}

export interface PaperSource {
  index: number;
  title: string;
  arxiv_id: string;
}

export interface ResearchResponse {
  session_id: string;
  synthesis: string;
  groundedness: number;
  papers_used: number;
  total_this_session: number;
  sources: PaperSource[];
}

export interface RawPaper {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  citationCount: number | null;
}
