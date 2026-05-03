import type { Env, PaperSummary } from "./types";

export async function getOrCreateSession(
  env: Env,
  sessionId: string,
  query: string,
): Promise<void> {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO sessions (id, initial_query, created_at) VALUES (?, ?, ?)",
  )
    .bind(sessionId, query, Date.now())
    .run();
}

export async function saveSummaries(
  env: Env,
  sessionId: string,
  summaries: PaperSummary[],
  query: string,
): Promise<void> {
  for (const s of summaries) {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO summaries (id, session_id, paper_id, paper_title, summary, groundedness, query, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        `${sessionId}-${s.paper_id}`,
        sessionId,
        s.paper_id,
        s.title,
        s.summary,
        s.groundedness,
        query,
        Date.now(),
      )
      .run();
  }
}

export async function getSessionTotal(
  env: Env,
  sessionId: string,
): Promise<number> {
  const row = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM summaries WHERE session_id = ?",
  )
    .bind(sessionId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}
