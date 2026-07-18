module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    res.status(501).json({ error: "OPENAI_API_KEY is not configured." });
    return;
  }

  try {
    const { buildRealtimeSessionConfig } = await import("../realtime-session.mjs");
    const { sdp = "", personality = "", voiceStyle = "lab-partner", voiceContext = "" } = req.body || {};
    if (!String(sdp).trim()) {
      res.status(400).json({ error: "No SDP offer provided." });
      return;
    }

    const form = new FormData();
    form.set("sdp", String(sdp));
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
        "OpenAI-Safety-Identifier": String(req.headers["x-rocket-user"] || "rocket-agent-lab-realtime"),
      },
      body: form,
    });

    const answer = await response.text();
    if (!response.ok) {
      let message = answer;
      try {
        message = JSON.parse(answer).error?.message || message;
      } catch {
        // Keep the raw response text.
      }
      res.status(response.status).json({ error: message || "OpenAI Realtime request failed" });
      return;
    }

    res.setHeader("Content-Type", "application/sdp");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(answer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
