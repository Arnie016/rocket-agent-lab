export function releaseRealtimeResources({ peerConnection, stream } = {}) {
  try {
    peerConnection?.close?.();
  } catch {
    // Best-effort cleanup after a failed setup.
  }
  try {
    stream?.getTracks?.().forEach((track) => track.stop?.());
  } catch {
    // A partial or already-released stream should not block a retry.
  }
}

function clipped(value, limit, fallback = "") {
  return String(value ?? fallback).slice(0, limit);
}

export function buildRealtimeSessionConfig({
  personality = "",
  voiceStyle = "lab-partner",
  voiceContext = "",
  model = "gpt-realtime-2",
  transcriptionModel = "gpt-4o-mini-transcribe",
  voice = "marin",
} = {}) {
  return {
    type: "realtime",
    model,
    instructions: [
      clipped(personality, 3600),
      `Selected companion style: ${clipped(voiceStyle, 80, "lab-partner")}.`,
      `Live voice context: ${clipped(voiceContext, 700)}`,
      "Runtime rule: behave as the backbone companion, not an optional narrator. Track the exact scene, answer interruptions first, and stop after one useful next move.",
      "Turn shape: observe, diagnose, challenge, wait. Keep most spoken turns under 18 seconds.",
      "If the learner asks about a specific rocket part, slider, graph, or failure, ground the answer in the provided app context before adding general rocket physics.",
    ].join("\n"),
    audio: {
      input: {
        transcription: { model: transcriptionModel },
        turn_detection: {
          type: "semantic_vad",
          eagerness: "medium",
          create_response: true,
          interrupt_response: true,
        },
      },
      output: { voice },
    },
  };
}
