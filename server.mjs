import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { readFile } from "node:fs/promises";
import { buildRealtimeSessionConfig } from "./realtime-session.mjs";

const root = new URL(".", import.meta.url).pathname;
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 5186);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  res.end(body);
}

async function agentChat(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    send(res, 501, JSON.stringify({ error: "OPENAI_API_KEY is not configured." }), "application/json; charset=utf-8");
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  const safetyId = req.headers["x-rocket-user"] || "rocket-agent-local-demo";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Safety-Identifier": String(safetyId),
    },
    body: JSON.stringify({
      model: process.env.OPENAI_AGENT_MODEL || "gpt-4.1-mini",
      instructions: [
        payload.personality,
        "Answer as Vector, a witty, student-friendly rocket physics companion.",
        "Sound like a smart lab partner: concise, curious, lightly playful, and technically grounded.",
        "Use the provided app context as ground truth.",
        "Use this teaching rhythm: observe what is on screen, diagnose the controlling variable, then ask or assign one tiny lab action.",
        "If the user is replying to a previous question, grade or respond to that answer before teaching a new thing.",
        "If the learner is wrong, correct the misconception directly, point at the equation or slider that proves it, and stay kind.",
        "If the rocket is failing, name the first blocker before giving any secondary advice.",
        "Keep replies under 85 words unless the user asks for depth. Never dump an essay.",
        "Avoid essays. Prefer one equation, one number, or one control at a time.",
        "End most replies with either one question or one action, not both.",
      ].filter(Boolean).join("\n"),
      input: [
        `Recent conversation:\n${String(payload.history || "").slice(0, 2200) || "No prior turns."}`,
        `User: ${String(payload.message || "").slice(0, 1200)}`,
        `App context:\n${String(payload.context || "").slice(0, 6000)}`,
      ].join("\n\n"),
      max_output_tokens: 260,
    }),
  });

  const data = await response.json();
  const reply = data.output_text
    || data.output?.flatMap((item) => item.content || []).map((item) => item.text).filter(Boolean).join("\n")
    || data.error?.message
    || "I can see the rocket state, but I could not form a response.";
  send(res, response.status, JSON.stringify({ reply }), "application/json; charset=utf-8");
}

async function agentVoice(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    send(res, 501, JSON.stringify({ error: "OPENAI_API_KEY is not configured." }), "application/json; charset=utf-8");
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  const spoken = String(payload.text || "").slice(0, 1400);
  const voiceProfile = payload.voiceProfile?.instructions || payload.voiceProfile?.copy || "";
  if (!spoken.trim()) {
    send(res, 400, JSON.stringify({ error: "No text provided." }), "application/json; charset=utf-8");
    return;
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Safety-Identifier": String(req.headers["x-rocket-user"] || "rocket-agent-local-voice"),
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE || "marin",
      input: spoken,
      response_format: "mp3",
        instructions: [
          `Mode: ${String(payload.voiceMode || "tutor").slice(0, 60)}.`,
          String(voiceProfile).slice(0, 500),
        "You are a witty rocket physics companion speaking to a student in a live simulator.",
        "Sound smart, warm, quick, and conversational, like a brilliant lab partner with mission-control timing.",
        "Use a natural smile in the voice. Be lightly witty, never clownish, never robotic, never announcer-like.",
        "Use clear pauses after equations and numbers. Keep energy high but not salesy.",
        "For launch-event mode, use crisp mission-control timing and no long explanations.",
        "For brief mode, give a compact systems check and one next action.",
        "For tutor mode, sound curious: make the learner want to try one variable change.",
        "If the rocket is failing, sound focused and diagnostic, not alarmist.",
        "Speak in short beats. Most clips should feel like 8 to 18 seconds of useful coaching.",
        "End with a concrete control to touch or a single question to answer.",
          `Scene hint: ${String(payload.voiceContext || payload.context || "").slice(0, 900)}`,
        ].join(" "),
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    send(res, response.status, JSON.stringify({ error: data.error?.message || "OpenAI voice request failed" }), "application/json; charset=utf-8");
    return;
  }

  const audio = Buffer.from(await response.arrayBuffer());
  send(res, 200, audio, response.headers.get("content-type") || "audio/mpeg");
}

async function realtimeCall(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    send(res, 501, JSON.stringify({ error: "OPENAI_API_KEY is not configured." }), "application/json; charset=utf-8");
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  const sdp = String(payload.sdp || "");
  const personality = String(payload.personality || "");
  const voiceStyle = String(payload.voiceStyle || "lab-partner");
  const voiceContext = String(payload.voiceContext || payload.context || "");
  if (!sdp.trim()) {
    send(res, 400, JSON.stringify({ error: "No SDP offer provided." }), "application/json; charset=utf-8");
    return;
  }

  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", JSON.stringify(buildRealtimeSessionConfig({
    personality,
    voiceStyle,
    voiceContext,
    model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2",
    transcriptionModel: process.env.OPENAI_REALTIME_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
    voice: process.env.OPENAI_REALTIME_VOICE || process.env.OPENAI_TTS_VOICE || "marin",
  })));

  const response = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "OpenAI-Safety-Identifier": String(req.headers["x-rocket-user"] || "rocket-agent-local-realtime"),
    },
    body: form,
  });
  const answer = await response.text();
  if (!response.ok) {
    let message = answer;
    try {
      message = JSON.parse(answer).error?.message || message;
    } catch {
      // Keep raw response text.
    }
    send(res, response.status, JSON.stringify({ error: message || "OpenAI Realtime request failed" }), "application/json; charset=utf-8");
    return;
  }
  send(res, 200, answer, "application/sdp");
}

async function staticFile(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  if (url.pathname === "/api/agent-chat") {
    try {
      await agentChat(req, res);
    } catch (error) {
      send(res, 500, JSON.stringify({ error: error.message }), "application/json; charset=utf-8");
    }
    return;
  }
  if (url.pathname === "/api/agent-voice") {
    try {
      await agentVoice(req, res);
    } catch (error) {
      send(res, 500, JSON.stringify({ error: error.message }), "application/json; charset=utf-8");
    }
    return;
  }
  if (url.pathname === "/api/realtime-call") {
    try {
      await realtimeCall(req, res);
    } catch (error) {
      send(res, 500, JSON.stringify({ error: error.message }), "application/json; charset=utf-8");
    }
    return;
  }

  const cleanPath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, cleanPath === "/" ? "index.html" : cleanPath);
  if (!filePath.startsWith(root)) {
    send(res, 403, "Forbidden");
    return;
  }
  try {
    const data = await readFile(filePath);
    send(res, 200, data, types[extname(filePath)] || "application/octet-stream");
  } catch {
    send(res, 404, "Not found");
  }
}

createServer(staticFile).listen(port, host, () => {
  console.log(`Rocket Agent Lab running at http://${host}:${port}`);
});
