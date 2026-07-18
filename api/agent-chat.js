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
    const { message = "", context = "", personality = "", history = "" } = req.body || {};
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": String(req.headers["x-rocket-user"] || "rocket-agent-lab"),
      },
      body: JSON.stringify({
        model: process.env.OPENAI_AGENT_MODEL || "gpt-4.1-mini",
        instructions: [
          personality,
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
          `Recent conversation:\n${String(history).slice(0, 2200) || "No prior turns."}`,
          `User: ${String(message).slice(0, 1200)}`,
          `App context:\n${String(context).slice(0, 6000)}`,
        ].join("\n\n"),
        max_output_tokens: 260,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: data.error?.message || "OpenAI request failed" });
      return;
    }
    const reply = data.output_text
      || data.output?.flatMap((item) => item.content || []).map((item) => item.text).filter(Boolean).join("\n")
      || "I can see the rocket state, but I could not form a response.";
    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
