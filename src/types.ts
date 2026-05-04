export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
}

export interface ResearchRequest {
  query: string;
  session_id?: string;
}

export interface PaperSummary {
  paper_id: string;
  title: string;
  summary: string;
  groundedness: number;
}

export interface ResearchResponse {
  session_id: string;
  summaries: PaperSummary[];
  next_queries: string[];
  papers_processed: number;
  total_this_session: number;
}

export interface RawPaper {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  citationCount: number | null;
}
