import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildRealtimeSessionConfig, releaseRealtimeResources } from "../realtime-session.mjs";

const stopped = [];
let peerClosed = 0;
releaseRealtimeResources({
  peerConnection: { close: () => { peerClosed += 1; } },
  stream: { getTracks: () => [{ stop: () => stopped.push("mic") }, { stop: () => stopped.push("system-audio") }] },
});
assert.equal(peerClosed, 1);
assert.deepEqual(stopped, ["mic", "system-audio"]);
assert.doesNotThrow(() => releaseRealtimeResources());
assert.doesNotThrow(() => releaseRealtimeResources({
  peerConnection: { close: () => { throw new Error("already closed"); } },
  stream: { getTracks: () => { throw new Error("already released"); } },
}));

const openingContext = "Rocket: Saturn V. Selected part: F-1-class engine. Lesson: Max-Q and structural load. Simulation: T/W 1.42, altitude 12.4 km, Max-Q 34 kPa.";
const session = buildRealtimeSessionConfig({
  personality: "Teach from the selected lab state.",
  voiceStyle: "mission-control",
  voiceContext: openingContext,
  model: "test-realtime-model",
  transcriptionModel: "test-transcribe-model",
  voice: "test-voice",
});
assert.equal(session.type, "realtime");
assert.equal(session.model, "test-realtime-model");
assert.equal(session.audio.input.transcription.model, "test-transcribe-model");
assert.equal(session.audio.output.voice, "test-voice");
for (const fact of ["mission-control", "Saturn V", "F-1-class engine", "Max-Q and structural load", "T/W 1.42", "altitude 12.4 km", "Max-Q 34 kPa"]) {
  assert.ok(session.instructions.includes(fact), `opening session instructions missing ${fact}`);
}
assert.ok(session.instructions.includes("backbone companion"));

const [localRoute, vercelRoute] = await Promise.all([
  readFile(new URL("../server.mjs", import.meta.url), "utf8"),
  readFile(new URL("../api/realtime-call.js", import.meta.url), "utf8"),
]);
for (const [name, source] of [["local route", localRoute], ["Vercel route", vercelRoute]]) {
  assert.match(source, /buildRealtimeSessionConfig/, `${name} no longer uses the shared session builder`);
  assert.match(source, /voiceStyle/, `${name} no longer forwards selected voice style`);
  assert.match(source, /voiceContext/, `${name} no longer forwards causal opening context`);
}
console.log("Realtime cleanup and opening session config: failed setup releases local resources, session instructions retain selected voice style plus rocket, part, lesson, and simulation values, and both routes retain the shared causal session builder.");
