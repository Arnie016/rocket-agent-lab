import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

assert.match(
  app,
  /voiceContext:\s*buildRealtimeOpeningTutorContext\(realtimeCausalSnapshot\("realtime"\)\)/,
  "the SDP session request must use the pure opening causal-context builder",
);
assert.match(
  app,
  /buildRealtimeTutorTurnEvents\(realtimeCausalSnapshot\(mode\),\s*\{/,
  "subsequent Realtime turns must use a fresh causal snapshot",
);
assert.match(
  app,
  /const requestOpeningTutorTurn = \(\) => \{[\s\S]*?state\.voiceRealtimeDc !== dc \|\| !state\.voiceRealtimeConnected[\s\S]*?openingTurnRequested = requestRealtimeResponse\(/,
  "the opening tutor turn must wait for both the data channel and state-backed live session",
);
assert.match(
  app,
  /dc\.onopen\s*=\s*requestOpeningTutorTurn;[\s\S]*?state\.voiceRealtimeConnected = true;[\s\S]*?requestOpeningTutorTurn\(\);/,
  "an early data-channel open must be retried after SDP setup without duplicating the opening turn",
);
assert.match(
  app,
  /if \(event\.type === "error"\) \{[\s\S]*?closeRealtimeCompanion\(\{ quiet: true \}\);/,
  "a Realtime error must release the live session instead of leaving the control stuck as connected",
);
assert.match(
  app,
  /dc\.onclose\s*=\s*\(\) => \{[\s\S]*?state\.voiceRealtimeDc !== dc \|\| !state\.voiceRealtimeConnected[\s\S]*?closeRealtimeCompanion\(\{ quiet: true \}\);/,
  "an unexpected data-channel close must release the live session instead of leaving a stale connected control",
);
assert.match(
  app,
  /function closeRealtimeCompanion\(\{ quiet = false \} = \{\}\) \{[\s\S]*?state\.voiceRealtimeDc\?\.close\?\.\(\);[\s\S]*?releaseRealtimeResources\(\{\s*peerConnection: state\.voiceRealtimePc,\s*stream: state\.voiceRealtimeStream,\s*\}\);/,
  "normal live-session closure must use the shared peer-and-microphone cleanup path",
);
assert.match(
  app,
  /\["failed", "disconnected"\]\.includes\(pc\.connectionState\) && \(state\.voiceRealtimeConnected \|\| state\.voiceRealtimeConnecting\)[\s\S]*?releaseRealtimeResources\(\{ peerConnection: pc, stream \}\);/,
  "a failed or dropped peer connection must release both live and still-connecting local resources",
);
assert.match(
  app,
  /els\.voiceStatus\.textContent = state\.voiceRealtimeConnected\s*\? "Realtime live"/,
  "the connected companion control must expose the exact human-test connection state",
);
assert.match(
  app,
  /function askEngineOutTutor\(\) \{[\s\S]*?const event = engineLessonTutorEvent\(state\.engineLessonProof\);[\s\S]*?requestRealtimeResponse\(event, "causal-engine-lesson"\)/,
  "the deterministic engine-out receipt must enter the same Realtime causal request path when connected",
);

console.log("Realtime client wiring: the SDP request uses the pure opening context, later data-channel turns take a fresh snapshot, early data-channel opens are retried once after the live state is ready, unexpected data-channel closure plus normal closure or peer-connection failures release local resources for a clean retry, the connected control exposes the exact human-test state, and an engine-out receipt enters the same causal Realtime path.");
