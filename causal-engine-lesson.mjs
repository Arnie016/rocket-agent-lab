function finite(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be finite`);
  return number;
}

export function evaluateEngineOutLesson({ rocket, before, after, engineHealthBefore, engineHealthAfter }) {
  const baseline = {
    twr: finite(before?.twr, "before.twr"),
    deltaV: finite(before?.deltaV, "before.deltaV"),
    q: finite(before?.q, "before.q"),
    risk: finite(before?.risk, "before.risk"),
  };
  const changed = {
    twr: finite(after?.twr, "after.twr"),
    deltaV: finite(after?.deltaV, "after.deltaV"),
    q: finite(after?.q, "after.q"),
    risk: finite(after?.risk, "after.risk"),
  };
  const healthBefore = finite(engineHealthBefore, "engineHealthBefore");
  const healthAfter = finite(engineHealthAfter, "engineHealthAfter");
  const delta = Object.fromEntries(Object.keys(baseline).map((key) => [key, changed[key] - baseline[key]]));
  const crossesLiftoffBoundary = baseline.twr >= 1 && changed.twr < 1;
  const verdict = crossesLiftoffBoundary
    ? "NO LIFTOFF"
    : changed.twr < 1.08
      ? "MARGIN CRITICAL"
      : delta.risk > 0.08
        ? "RISK RISING"
        : "FLYABLE WITH LOSS";
  const controllingReason = crossesLiftoffBoundary
    ? "Available thrust fell below vehicle weight. The rocket cannot accelerate upward. Max-Q risk falls only because the vehicle never becomes fast enough; that lower number does not make the mission viable."
    : "Reduced engine health lowered thrust-to-weight and changed the ascent envelope before launch.";

  return {
    schema: "rocket-agent-lab/causal-engine-proof@1",
    experiment: "engine-out",
    rocket: String(rocket || "Unknown rocket"),
    control: { name: "engine health", before: healthBefore, after: healthAfter, unit: "%" },
    before: baseline,
    after: changed,
    delta,
    verdict,
    crossesLiftoffBoundary,
    controllingReason,
    nextAction: changed.twr < 1 ? "Reduce payload or restore engine availability, then rerun the same experiment." : "Launch and compare the measured ascent with this prediction.",
  };
}

export function engineLessonTutorEvent(proof) {
  return [
    `Causal engine experiment on ${proof.rocket}.`,
    `Engine health changed from ${proof.control.before}% to ${proof.control.after}%.`,
    `T/W changed from ${proof.before.twr.toFixed(2)} to ${proof.after.twr.toFixed(2)}.`,
    `Delta-v changed by ${Math.round(proof.delta.deltaV)} m/s; predicted Max-Q changed by ${proof.delta.q.toFixed(1)} kPa; risk changed by ${Math.round(proof.delta.risk * 100)} points.`,
    `Deterministic verdict: ${proof.verdict}. ${proof.controllingReason}`,
    `Coach the learner using this evidence, then give only this next action: ${proof.nextAction}`,
  ].join(" ");
}
