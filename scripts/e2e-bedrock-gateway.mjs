import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { streamSimple as completions } from "@earendil-works/pi-ai/api/openai-completions";
import { streamSimple as responses } from "@earendil-works/pi-ai/api/openai-responses";
import { withSessionAffinityOptions, sessionAffinityCompat } from "../packages/agent-runtime/dist/session-affinity.js";
import { withCompactionRequestHeaders } from "../packages/agent-runtime/dist/compaction-request.js";

const captured = [];
const server = createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  captured.push({ headers: request.headers, body: JSON.parse(Buffer.concat(chunks).toString()) });
  response.writeHead(400, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: { message: "Local capture endpoint: request recorded" } }));
});
const original = process.env.PI_DESKTOP_GATEWAY_PROMPT_CACHE_KEY;
server.listen(0, "127.0.0.1");
await once(server, "listening");
try {
  const baseUrl = `http://127.0.0.1:${server.address().port}/v1`;
  const provider = { id: "gateway", vendorKey: "custom", apiStyle: "chat_completions", baseUrl };
  const context = { messages: [{ role: "user", content: "hello", timestamp: 1 }] };
  for (const optIn of [false, true]) {
    if (optIn) process.env.PI_DESKTOP_GATEWAY_PROMPT_CACHE_KEY = "true";
    else delete process.env.PI_DESKTOP_GATEWAY_PROMPT_CACHE_KEY;
    for (const api of ["openai-completions", "openai-responses"]) {
      const model = { id: "bedrock-fixture", name: "Fixture", api, provider: "gateway", baseUrl,
        reasoning: false, input: ["text"], contextWindow: 128000, maxTokens: 8192,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        compat: sessionAffinityCompat(provider, api, baseUrl) };
      const stream = api === "openai-completions" ? completions : responses;
      for (const summary of [false, true]) {
        const options = { apiKey: "local-fixture", sessionId: "session-1",
          onPayload: payload => ({ ...payload, prompt_cache_key: "extension-key" }) };
        const before = captured.length;
        if (summary) {
          const models = { completeSimple: (m, ctx, opts) => stream(m, ctx, opts).result() };
          await withCompactionRequestHeaders(models, provider, "session-1").completeSimple(model, context, options);
        } else {
          await stream(model, context, withSessionAffinityOptions(options,
            { provider, api, baseUrl, sessionId: "session-1" })).result();
        }
        assert.equal(captured.length, before + 1);
        const request = captured.at(-1);
        assert.equal(request.headers["x-session-affinity"], "session-1");
        assert.equal(Object.hasOwn(request.body, "prompt_cache_key"), optIn);
        if (optIn) assert.equal(request.body.prompt_cache_key, "extension-key");
        console.log(`PASS ${api} ${summary ? "summary" : "turn"} cache-key opt-in=${optIn}`);
      }
    }
  }
} finally {
  if (original === undefined) delete process.env.PI_DESKTOP_GATEWAY_PROMPT_CACHE_KEY;
  else process.env.PI_DESKTOP_GATEWAY_PROMPT_CACHE_KEY = original;
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
