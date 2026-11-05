import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Trusted client metadata: only the Cloudflare edge (request.cf present) sets
// cf-connecting-ip and geo. Any client-sent x-dutti-* header is stripped and the
// values are re-emitted with a per-isolate nonce so app code can tell them apart
// from anything a visitor could inject. X-Forwarded-For is never trusted.
function withTrustedIngress(request: Request): Request {
  const h = new Headers(request.headers);
  for (const k of [...h.keys()]) if (k.startsWith("x-dutti-")) h.delete(k);
  const cf = (request as unknown as { cf?: Record<string, unknown> }).cf;
  if (cf && typeof cf === "object") {
    const g = globalThis as unknown as { __duttiIngressNonce?: string };
    g.__duttiIngressNonce ??= crypto.randomUUID();
    h.set("x-dutti-ingress", g.__duttiIngressNonce);
    const ip = request.headers.get("cf-connecting-ip");
    if (ip) h.set("x-dutti-client-ip", ip);
    for (const k of ["country", "region", "city"] as const) {
      const v = cf[k];
      if (typeof v === "string" && v) h.set(`x-dutti-geo-${k}`, encodeURIComponent(v.slice(0, 120)));
    }
  }
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  return new Request(request.url, {
    method: request.method,
    headers: h,
    body: hasBody ? request.body : null,
    redirect: request.redirect,
    signal: request.signal,
    ...(hasBody ? { duplex: "half" } : {}),
  } as RequestInit);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      request = withTrustedIngress(request);
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
