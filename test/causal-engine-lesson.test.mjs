import assert from "node:assert/strict";
import { evaluateEngineOutLesson, engineLessonTutorEvent } from "../causal-engine-lesson.mjs";

const proof = evaluateEngineOutLesson({
  rocket: "Saturn V",
  engineHealthBefore: 100,
  engineHealthAfter: 67,
  before: { twr: 1.18, deltaV: 9510, q: 39, risk: 0.12 },
  after: { twr: 0.79, deltaV: 9390, q: 31.5, risk: 0.32 },
});

assert.equal(proof.schema, "rocket-agent-lab/causal-engine-proof@1");
assert.equal(proof.verdict, "NO LIFTOFF");
assert.equal(proof.crossesLiftoffBoundary, true);
assert.equal(proof.delta.twr.toFixed(2), "-0.39");
assert.equal(proof.delta.deltaV, -120);
assert.match(proof.controllingReason, /thrust fell below vehicle weight/i);
const event = engineLessonTutorEvent(proof);
for (const fact of ["Saturn V", "100% to 67%", "1.18 to 0.79", "NO LIFTOFF", "Reduce payload or restore engine availability"]) {
  assert.ok(event.includes(fact), `tutor event missing ${fact}`);
}
assert.throws(() => evaluateEngineOutLesson({ before: {}, after: {} }), /must be finite/);
console.log("Causal engine lesson: deterministic before/after proof crosses the liftoff boundary and emits a grounded tutor event.");
