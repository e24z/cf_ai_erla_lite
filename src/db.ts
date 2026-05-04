import type { Env } from "./types";

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

export async function saveSynthesis(
  env: Env,
  sessionId: string,
  query: string,
  synthesis: string,
  groundedness: number,
): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO syntheses (id, session_id, query, synthesis, groundedness, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(crypto.randomUUID(), sessionId, query, synthesis, groundedness, Date.now())
    .run();
}

export async function getRecentSyntheses(
  env: Env,
  sessionId: string,
  limit = 2,
): Promise<string[]> {
  const rows = await env.DB.prepare(
    "SELECT synthesis FROM syntheses WHERE session_id = ? ORDER BY created_at DESC LIMIT ?",
  )
    .bind(sessionId, limit)
    .all<{ synthesis: string }>();
  return (rows.results ?? []).map((r) => r.synthesis).reverse();
}

export async function getSessionTotal(
  env: Env,
  sessionId: string,
): Promise<number> {
  const row = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM syntheses WHERE session_id = ?",
  )
    .bind(sessionId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}
