import type { Env, ResearchRequest, ResearchResponse } from "./types";
import { runScout } from "./scout";
import { getOrCreateSession, saveSynthesis, getRecentSyntheses, getSessionTotal } from "./db";
import { renderUI } from "./ui";

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

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(renderUI(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

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

    if (body.query.length > 500) {
      return new Response("query must be 500 characters or fewer", { status: 400 });
    }

    const sessionId = body.session_id ?? randomId();

    try {
      await getOrCreateSession(env, sessionId, body.query);

      const previousSyntheses = await getRecentSyntheses(env, sessionId);

      const { synthesis, groundedness, papersUsed, papers } = await runScout(
        env,
        body.query,
        previousSyntheses,
      );

      await saveSynthesis(env, sessionId, body.query, synthesis, groundedness);

      const total = await getSessionTotal(env, sessionId);

      const response: ResearchResponse = {
        session_id: sessionId,
        synthesis,
        groundedness,
        papers_used: papersUsed,
        total_this_session: total,
        sources: papers.map((p, i) => ({
          index: i + 1,
          title: p.title,
          arxiv_id: p.paperId,
        })),
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
