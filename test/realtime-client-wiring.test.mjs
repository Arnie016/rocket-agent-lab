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
  /\["failed", "disconnected"\]\.includes\(pc\.connectionState\) && \(state\.voiceRealtimeConnected \|\| state\.voiceRealtimeConnecting\)[\s\S]*?releaseRealtimeResources\(\{ peerConnection: pc, stream \}\);/,
  "a failed or dropped peer connection must release both live and still-connecting local resources",
);

console.log("Realtime client wiring: the SDP request uses the pure opening context, later data-channel turns take a fresh snapshot, early data-channel opens are retried once after the live state is ready, and data-channel or peer-connection failures release local resources for a clean retry.");
