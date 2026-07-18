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
    const { text = "", context = "", voiceMode = "tutor", voiceProfile = {}, voiceContext = "" } = req.body || {};
    const spoken = String(text).slice(0, 1400);
    if (!spoken.trim()) {
      res.status(400).json({ error: "No text provided." });
      return;
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": String(req.headers["x-rocket-user"] || "rocket-agent-lab-voice"),
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice: process.env.OPENAI_TTS_VOICE || "marin",
        input: spoken,
        response_format: "mp3",
        instructions: [
          `Mode: ${String(voiceMode).slice(0, 60)}.`,
          String(voiceProfile.instructions || voiceProfile.copy || "").slice(0, 500),
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
          `Scene hint: ${String(voiceContext || context).slice(0, 900)}`,
        ].join(" "),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      res.status(response.status).json({ error: data.error?.message || "OpenAI voice request failed" });
      return;
    }

    const audio = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", response.headers.get("content-type") || "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(audio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
