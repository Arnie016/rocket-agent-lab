import assert from "node:assert/strict";
import {
  buildRealtimeOpeningTutorContext,
  buildRealtimeSubsequentTutorContext,
  buildRealtimeTutorTurnEvents,
} from "../realtime-context.mjs";

const causalState = {
  voiceStyle: "mission-control",
  rocket: "Saturn V",
  part: "F-1-class engine",
  lesson: "Max-Q and structural load",
  simulation: { phase: "ascent", "T/W": "1.42", altitude: "12.4 km", "Max-Q": "34 kPa" },
};
const requiredFacts = ["mission-control", "Saturn V", "F-1-class engine", "Max-Q and structural load", "phase ascent", "T/W 1.42", "altitude 12.4 km", "Max-Q 34 kPa"];
const opening = buildRealtimeOpeningTutorContext(causalState);
const afterPayloadChange = {
  ...causalState,
  simulation: { phase: "Max-Q", "T/W": "1.31", altitude: "16.8 km", "Max-Q": "41 kPa" },
};
const subsequent = buildRealtimeSubsequentTutorContext(afterPayloadChange, {
  mode: "slider-change",
  recentConversation: "Tutor asked about the throttle margin.",
  learnerEvent: "Learner increased payload mass.",
});
for (const fact of requiredFacts) {
  assert.ok(opening.includes(fact), `opening context missing ${fact}`);
}
for (const fact of ["mission-control", "Saturn V", "F-1-class engine", "Max-Q and structural load", "phase Max-Q", "T/W 1.31", "altitude 16.8 km", "Max-Q 41 kPa"]) {
  assert.ok(subsequent.includes(fact), `subsequent context missing updated ${fact}`);
}
assert.ok(!subsequent.includes("T/W 1.42"), "subsequent context retained stale thrust-to-weight");
assert.ok(!subsequent.includes("altitude 12.4 km"), "subsequent context retained stale altitude");
assert.ok(!subsequent.includes("Max-Q 34 kPa"), "subsequent context retained stale Max-Q");
assert.ok(opening.includes("Opening turn"));
assert.ok(subsequent.includes("Tutor mode: slider-change"));
assert.ok(subsequent.includes("Learner increased payload mass"));

const [messageEvent, responseEvent] = buildRealtimeTutorTurnEvents(afterPayloadChange, {
  mode: "slider-change",
  recentConversation: "Tutor asked about the throttle margin.",
  learnerEvent: "Learner increased payload mass.",
  liveAppContext: "Payload mass is now 46 t.",
});
const wireText = messageEvent.item.content[0].text;
assert.equal(messageEvent.type, "conversation.item.create");
assert.equal(responseEvent.type, "response.create");
for (const fact of ["mission-control", "Saturn V", "F-1-class engine", "Max-Q and structural load", "phase Max-Q", "T/W 1.31", "altitude 16.8 km", "Max-Q 41 kPa", "Payload mass is now 46 t."]) {
  assert.ok(wireText.includes(fact), `data-channel tutor event missing ${fact}`);
}
assert.ok(!wireText.includes("T/W 1.42"), "data-channel tutor event retained stale thrust-to-weight");
console.log("Realtime causal context: opening state and subsequent changed simulation state retain rocket, part, lesson, and voice style without stale live values; the data-channel event carries the updated state.");
