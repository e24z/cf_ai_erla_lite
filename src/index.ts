import type { Env, ResearchRequest, ResearchResponse } from "./types";
import { runScout } from "./scout";
import { getOrCreateSession, saveSummaries, getSessionTotal } from "./db";

function randomId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const url = new URL(request.url);

    if (request.method !== "POST" || url.pathname !== "/research") {
      return new Response("Not found", { status: 404 });
    }

    let body: ResearchRequest;
    try {
      body = (await request.json()) as ResearchRequest;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (!body.query?.trim()) {
      return new Response("query is required", { status: 400 });
    }

    const sessionId = body.session_id ?? randomId();

    try {
      await getOrCreateSession(env, sessionId, body.query);

      const { summaries, nextQueries } = await runScout(env, body.query);

      await saveSummaries(env, sessionId, summaries, body.query);

      const total = await getSessionTotal(env, sessionId);

      const response: ResearchResponse = {
        session_id: sessionId,
        summaries,
        next_queries: nextQueries,
        papers_processed: summaries.length,
        total_this_session: total,
      };

      return Response.json(response, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal error";
      return new Response(message, { status: 500 });
    }
  },
};
