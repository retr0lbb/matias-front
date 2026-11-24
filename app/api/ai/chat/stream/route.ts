import { BACKEND_URL } from "@/lib/backend-url";

/**
 * Same-origin pass-through for `POST /ai/chat/stream`. The /api rewrite in
 * next.config.ts holds the whole SSE response until it ends; a route handler
 * forwards each event as soon as the backend sends it.
 */
export async function POST(request: Request) {
  const { search } = new URL(request.url);

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/ai/chat/stream${search}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: await request.text(),
      // Stopping in the browser cancels the generation on the backend too.
      signal: request.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error("chat stream: backend unreachable", error);
    return Response.json(
      { statusCode: 502, message: "Não foi possível falar com o servidor." },
      { status: 502 },
    );
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "text/event-stream",
    // Keep Next's compression (and any proxy) from buffering the stream.
    "Cache-Control": "no-cache, no-transform",
    "Content-Encoding": "none",
    "X-Accel-Buffering": "no",
  });
  for (const cookie of upstream.headers.getSetCookie()) {
    headers.append("set-cookie", cookie);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
