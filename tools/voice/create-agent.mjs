#!/usr/bin/env node
// Creates (or updates) the Relay MKE phone agent on ElevenLabs Agents:
//   1. a webhook tool `create_request` -> POST {PUBLIC_BASE_URL}/api/voice/tool
//   2. the agent "Jordan · Relay MKE" using tools/voice/prompt.md
// Usage:  ELEVENLABS_API_KEY=... PUBLIC_BASE_URL=https://xxx.trycloudflare.com node tools/voice/create-agent.mjs
// Re-running updates the existing tool/agent (ids cached in tools/voice/.agent.json, git-ignored).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const envFile = join(here, "../../src/.env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE = (process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
const SECRET = process.env.VOICE_TOOL_SECRET ?? "";
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "cjVigY5qzO86Huf0OWal";
const API = process.env.ELEVENLABS_API_BASE ?? "https://api.elevenlabs.io";

if (!API_KEY) die("ELEVENLABS_API_KEY is required");
if (!/^https:\/\//.test(BASE)) die("PUBLIC_BASE_URL must be an https URL (e.g. your cloudflared tunnel)");

const cachePath = join(here, ".agent.json");
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};
const prompt = readFileSync(join(here, "prompt.md"), "utf8");

const toolConfig = {
  type: "webhook",
  name: "create_request",
  description:
    "Log the caller's request on the Relay Board. Call exactly once, as soon as you know what they need and roughly where they are. Returns a tracking code to read back letter by letter.",
  execution_mode: "immediate",
  pre_tool_speech: "force",
  response_timeout_secs: 20,
  api_schema: {
    url: `${BASE}/api/voice/tool`,
    method: "POST",
    request_headers: SECRET ? { "x-relay-secret": SECRET } : {},
    request_body_schema: {
      type: "object",
      required: ["what_they_need", "area"],
      properties: {
        what_they_need: { type: "string", description: "What the caller needs, in their own words, one or two sentences. Do not include their name or phone number." },
        area: { type: "string", description: "Milwaukee neighborhood or nearest cross streets, e.g. '35th and Burleigh' or 'Harambee'." },
        household_size: { type: "integer", description: "Number of people in the home, if mentioned." },
        urgency: { type: "string", enum: ["critical", "high", "normal", "low"], description: "critical = tonight / safety, high = within a day or two, normal = this week, low = whenever." },
        language: { type: "string", enum: ["en", "es"], description: "Language the caller is speaking." },
        callback_ok: { type: "boolean", description: "True if the caller said it's okay to text or call them back on this number." },
        conversation_id: { type: "string", dynamic_variable: "system__conversation_id" },
        caller_id: { type: "string", dynamic_variable: "system__caller_id" },
      },
    },
  },
};

const agentConfig = {
  name: "Jordan · Relay MKE",
  conversation_config: {
    agent: {
      first_message: "Hey, this is Jordan with ComForce. What's going on today?",
      language: "en",
      prompt: { prompt, llm: process.env.ELEVENLABS_LLM ?? "gpt-4.1", temperature: 0.4, tool_ids: [] },
    },
    tts: { voice_id: VOICE_ID, model_id: "eleven_v4_turbo", stability: 0.45, speed: 1.0 },
    turn: { turn_eagerness: "normal" },
    language_presets: {
      es: { overrides: { agent: { first_message: "Hola, habla Jordan de ComForce. Cuénteme, ¿qué está pasando?" } } },
    },
  },
};

const tool = cache.toolId
  ? await api("PATCH", `/v1/convai/tools/${cache.toolId}`, { tool_config: toolConfig })
  : await api("POST", "/v1/convai/tools", { tool_config: toolConfig });
cache.toolId = tool.id;
agentConfig.conversation_config.agent.prompt.tool_ids = [tool.id];

const agent = cache.agentId
  ? await api("PATCH", `/v1/convai/agents/${cache.agentId}`, agentConfig)
  : await api("POST", "/v1/convai/agents/create", agentConfig);
cache.agentId = agent.agent_id ?? cache.agentId;
writeFileSync(cachePath, JSON.stringify(cache, null, 2));

console.log(`\n✔ tool  ${cache.toolId}\n✔ agent ${cache.agentId}\n`);
console.log(`Add to src/.env.local:\n  NEXT_PUBLIC_ELEVENLABS_AGENT_ID=${cache.agentId}\n`);
console.log(`Then in https://elevenlabs.io/app/agents/settings → Post-call webhooks, add:\n  ${BASE}/api/voice/elevenlabs   (copy its signing secret to ELEVENLABS_WEBHOOK_SECRET)\n`);
console.log(`Test in the browser: https://elevenlabs.io/app/agents/${cache.agentId}  or the widget on ${BASE}/r`);

async function api(method, path, body) {
  const r = await fetch(API + path, { method, headers: { "xi-api-key": API_KEY, "content-type": "application/json" }, body: JSON.stringify(body) });
  const text = await r.text();
  if (!r.ok) die(`${method} ${path} → ${r.status}\n${text}`);
  return text ? JSON.parse(text) : {};
}

function die(msg) {
  console.error("✖ " + msg);
  process.exit(1);
}
