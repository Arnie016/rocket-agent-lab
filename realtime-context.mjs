function text(value, fallback = "unknown") {
  const result = String(value ?? "").trim();
  return result || fallback;
}

export function buildRealtimeCausalContext({ voiceStyle, rocket, part, lesson, simulation = {} }) {
  const numbers = Object.entries(simulation)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => `${label} ${value}`)
    .join(", ");

  return [
    `Voice style ID: ${text(voiceStyle, "lab-partner")}.`,
    `Rocket: ${text(rocket)}. Selected part: ${text(part)}. Lesson: ${text(lesson)}.`,
    `Simulation: ${numbers || "no live values yet"}.`,
    "Teaching contract: one visible observation, one physics reason, one next action or one question.",
    "Realtime behavior: answer interruptions first, stop after the next action, and wait for the learner.",
  ].join(" ");
}

export function buildRealtimeOpeningTutorContext(context) {
  return `${buildRealtimeCausalContext(context)} Opening turn: greet from this exact lab state by naming the selected rocket, part, lesson, and voice style ID, then ask one question about the selected rocket, part, or lesson.`;
}

export function buildRealtimeSubsequentTutorContext(context, { mode = "scene", recentConversation = "No prior turns in this session.", learnerEvent = "" } = {}) {
  return [
    buildRealtimeCausalContext(context),
    `Tutor mode: ${text(mode, "scene")}.`,
    "Ground the response in the current rocket, selected part, lesson, voice style ID, and any learner-changed simulation value relevant to the event.",
    `Recent conversation: ${text(recentConversation, "No prior turns in this session.")}.`,
    `Learner event: ${text(learnerEvent, "Continue from the live lab state.")}.`,
  ].join("\n\n");
}

export function buildRealtimeTutorTurnEvents(context, {
  mode = "scene",
  recentConversation = "No prior turns in this session.",
  learnerEvent = "",
  liveAppContext = "",
} = {}) {
  const prompt = [
    buildRealtimeSubsequentTutorContext(context, { mode, recentConversation, learnerEvent }),
    `Live app context:\n${text(liveAppContext, "No additional app context.")}`,
  ].join("\n\n");

  return [
    {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: prompt.slice(0, 7000) }],
      },
    },
    { type: "response.create" },
  ];
}
