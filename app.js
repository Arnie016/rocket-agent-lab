import { createRocketScene } from "./rocket-three-scene.js";
import {
  buildRealtimeCausalContext,
  buildRealtimeOpeningTutorContext,
  buildRealtimeTutorTurnEvents,
} from "./realtime-context.mjs";
import { releaseRealtimeResources } from "./realtime-session.mjs";

const builderConfig = {
  stages: 2,
  boosterPairs: 0,
  engineCount: 12,
  diameterM: 4.2,
  engineModel: "merlin",
  skinMaterial: "aluminum-lithium",
  tankMaterial: "aluminum-lithium",
  heatShieldMaterial: "ablative",
  upperStage: "kerolox",
  reuse: "expendable",
};

const builderPresets = {
  tiny: { stages: 2, boosterPairs: 0, engineCount: 1, diameterM: 1.6, engineModel: "rutherford", skinMaterial: "carbon-composite", tankMaterial: "aluminum-lithium", heatShieldMaterial: "ablative", upperStage: "kerolox", reuse: "expendable" },
  heavy: { stages: 2, boosterPairs: 2, engineCount: 27, diameterM: 5.2, engineModel: "merlin", skinMaterial: "aluminum-lithium", tankMaterial: "aluminum-lithium", heatShieldMaterial: "ceramic", upperStage: "kerolox", reuse: "reusable" },
  moon: { stages: 3, boosterPairs: 1, engineCount: 11, diameterM: 5.8, engineModel: "rs25", skinMaterial: "aluminum-lithium", tankMaterial: "aluminum-lithium", heatShieldMaterial: "ceramic", upperStage: "cryo", reuse: "expendable" },
  chaos: { stages: 1, boosterPairs: 2, engineCount: 3, diameterM: 8.8, engineModel: "raptor", skinMaterial: "stainless-steel", tankMaterial: "stainless-steel", heatShieldMaterial: "thin-silica", upperStage: "methalox", reuse: "reusable" },
};

const engineCatalog = {
  merlin: { name: "Merlin-class", propellant: "kerolox", thrustMN: 0.86, ispS: 314, massT: 0.78, reliability: 0.9, copy: "High thrust density and proven clustering. Good first-stage classroom baseline." },
  raptor: { name: "Raptor-class", propellant: "methalox", thrustMN: 2.05, ispS: 335, massT: 1.6, reliability: 0.78, copy: "Very high chamber pressure and reusable intent. Powerful, but complexity risk rises." },
  rs25: { name: "Hydrolox sustainer", propellant: "cryo", thrustMN: 1.25, ispS: 372, massT: 3.2, reliability: 0.86, copy: "Excellent efficiency from hydrogen. Great upper energy, heavier and more delicate." },
  f1: { name: "F-1-class", propellant: "kerolox", thrustMN: 6.77, ispS: 263, massT: 8.4, reliability: 0.7, copy: "Huge single-engine thrust. Low part count, but brutal combustion stability lesson." },
  rutherford: { name: "Electric-pump small engine", propellant: "kerolox", thrustMN: 0.025, ispS: 311, massT: 0.04, reliability: 0.82, copy: "Small launch vehicle scale. Excellent for seeing why engine scale changes everything." },
  be4: { name: "BE-4-class", propellant: "methalox", thrustMN: 2.45, ispS: 332, massT: 2.4, reliability: 0.8, copy: "Methane booster engine scale used by New Glenn and Vulcan. Big thrust with reusable and supply-chain tradeoffs." },
  be3: { name: "BE-3 hydrolox", propellant: "cryo", thrustMN: 0.49, ispS: 365, massT: 1.2, reliability: 0.84, copy: "Hydrogen engine class for suborbital and upper-stage teaching. Efficient, throttleable, and tank-volume hungry." },
  rd180: { name: "RD-180-class", propellant: "kerolox", thrustMN: 3.83, ispS: 338, massT: 5.5, reliability: 0.88, copy: "High-performance dual-chamber kerolox booster engine. Great for reliability and geopolitical supply-chain lessons." },
  vinci: { name: "Vinci-class upper", propellant: "cryo", thrustMN: 0.18, ispS: 455, massT: 0.55, reliability: 0.84, copy: "Restartable hydrogen upper-stage engine. Low thrust, high efficiency, excellent for trajectory and circularization lessons." },
  archimedes: { name: "Archimedes-class", propellant: "methalox", thrustMN: 0.73, ispS: 329, massT: 0.75, reliability: 0.74, copy: "Reusable medium-launch methane engine class. Useful for Neutron-style clustering and recovery penalties." },
  aeonr: { name: "Aeon R-class", propellant: "methalox", thrustMN: 1.1, ispS: 335, massT: 1.1, reliability: 0.72, copy: "Methalox reusable medium-heavy engine class. Good for manufacturing-scale and dry-mass tradeoffs." },
};

const materialCatalog = {
  "aluminum-lithium": { name: "Al-Li alloy", density: 0.92, youngGpa: 78, strengthMpa: 520, heat: 0.72, cost: 0.62, copy: "Light aerospace tank material. Good default for mass ratio and manufacturability." },
  "stainless-steel": { name: "Stainless steel", density: 1.38, youngGpa: 193, strengthMpa: 860, heat: 1.15, cost: 0.46, copy: "Heavier, tougher, heat tolerant, and easier to iterate at large scale." },
  "carbon-composite": { name: "Carbon composite", density: 0.7, youngGpa: 135, strengthMpa: 900, heat: 0.58, cost: 0.92, copy: "Very light and stiff, but thermal, inspection, and manufacturing risk are higher." },
  titanium: { name: "Titanium alloy", density: 1.12, youngGpa: 116, strengthMpa: 950, heat: 0.95, cost: 0.98, copy: "Strong and heat tolerant. Usually reserved for hard local problems, not whole tanks." },
};

const heatShieldCatalog = {
  ablative: { name: "Ablative", mass: 1.0, protection: 1.0, reuse: 0.35, copy: "Burns away to protect the vehicle. Simple and robust, but not reuse-friendly." },
  ceramic: { name: "Ceramic tiles", mass: 1.18, protection: 1.24, reuse: 0.74, copy: "Reusable thermal protection with inspection burden and tile-loss risk." },
  "thin-silica": { name: "Thin silica blanket", mass: 0.74, protection: 0.72, reuse: 0.62, copy: "Light protection for mild heating. Breaks quickly if Max-Q and speed stack up." },
  metallic: { name: "Metallic TPS", mass: 1.34, protection: 1.08, reuse: 0.86, copy: "Durable reusable shell, heavier and sensitive to joints and expansion." },
};

const propellantCatalog = {
  kerolox: { name: "RP-1 / LOX", density: 1.0, isp: 1.0, thrust: 1.0, copy: "Dense and strong for first stages. Good thrust, modest efficiency." },
  methalox: { name: "CH4 / LOX", density: 0.91, isp: 1.07, thrust: 1.08, copy: "Reusable-friendly middle ground. Better efficiency, lower density than kerosene." },
  cryo: { name: "LH2 / LOX", density: 0.63, isp: 1.18, thrust: 0.82, copy: "Best efficiency, large tanks, hard insulation. Usually an upper-stage move." },
};

function createBuilderRocket(config = builderConfig) {
  const diameter = Number(config.diameterM);
  const boosterPairs = Number(config.boosterPairs);
  const stages = Number(config.stages);
  const engineCount = Number(config.engineCount);
  const engine = engineCatalog[config.engineModel] || engineCatalog.merlin;
  const skin = materialCatalog[config.skinMaterial] || materialCatalog["aluminum-lithium"];
  const tank = materialCatalog[config.tankMaterial] || materialCatalog["aluminum-lithium"];
  const shield = heatShieldCatalog[config.heatShieldMaterial] || heatShieldCatalog.ablative;
  const propellant = propellantCatalog[config.upperStage] || propellantCatalog.kerolox;
  const cryogenic = config.upperStage === "cryo";
  const methalox = config.upperStage === "methalox";
  const reusable = config.reuse === "reusable";
  const boosterCount = boosterPairs * 2;
  const heightM = 22 + stages * 18 + boosterPairs * 3 + diameter * 3.6;
  const baseThrust = engineCount * engine.thrustMN * propellant.thrust;
  const boosterThrust = boosterCount * diameter * 1.05;
  const thrustMN = Math.max(0.55, baseThrust + boosterThrust);
  const dryMassT = Math.round((heightM * diameter * 0.22 * skin.density) + engineCount * engine.massT + boosterCount * 6 + (reusable ? 18 : 0) + diameter * shield.mass * 3.8);
  const propellantT = Math.round(heightM * diameter * diameter * (methalox ? 0.62 : cryogenic ? 0.5 : 0.68) * tank.density * propellant.density + boosterCount * 42);
  const ispS = Math.round(engine.ispS * propellant.isp);
  const stageGain = 1.06 + stages * 0.14 + (cryogenic ? 0.09 : 0) - (reusable ? 0.08 : 0) + (engine.reliability - 0.8) * 0.04;
  const maxPayloadT = Math.max(0.4, Math.round((thrustMN * 2.2 + propellantT * 0.012 - dryMassT * 0.035) * 10) / 10);
  const defaultPayloadT = Math.max(0.2, Math.round(maxPayloadT * 0.58 * 10) / 10);
  const fairingRadius = diameter * 0.44;
  const coreRadius = diameter * 0.5;
  const parts = [
    {
      id: "builder-engines",
      name: `${engineCount} ${engine.name} engines`,
      type: "Custom propulsion",
      height: 4.5,
      r0: coreRadius,
      r1: coreRadius * 0.9,
      color: "#c96f38",
      accent: "#ffd08a",
      description: `${engine.copy} Your engine cluster sets liftoff thrust and engine-out complexity.`,
      stats: { Engines: String(engineCount), Thrust: `${thrustMN.toFixed(1)} MN`, Propellant: propellant.name },
      equation: ["Thrust-to-weight", "T / W > 1", "The first test is brutal: if thrust does not beat weight, nothing else matters."],
      engineCount,
    },
    {
      id: "builder-first-stage",
      name: reusable ? "Reusable booster core" : "Expendable booster core",
      type: "Custom booster",
      height: 26 + diameter * 2,
      r0: coreRadius,
      r1: coreRadius,
      color: reusable ? "#b7c2cc" : "#eff4f8",
      accent: reusable ? "#5df2c1" : "#1a1f27",
      description: reusable
        ? "Reusable structure adds dry mass and recovery margin. It can be economically powerful, but it makes the physics harder."
        : "An expendable booster spends the whole vehicle on ascent, improving payload margin but losing the hardware.",
      stats: { Mode: reusable ? "Reusable" : "Expendable", Structure: `${dryMassT} t dry`, Role: "Boost phase" },
      equation: ["Stress", "σ = F / A", `${skin.name} changes dry mass, stiffness, and stress margin.`],
    },
  ];
  if (boosterCount > 0) {
    parts.push({
      id: "builder-side-boosters",
      name: `${boosterCount} strap-on boosters`,
      type: "Custom side boosters",
      height: 22 + diameter * 1.2,
      r0: coreRadius,
      r1: coreRadius * 0.86,
      color: "#dce7ef",
      accent: "#f6b14a",
      description: "Strap-on boosters help liftoff but add staging events, aero load, and separation failure modes.",
      stats: { Count: String(boosterCount), Risk: "Separation", Role: "Early thrust" },
      equation: ["Staging risk", "more events = more failure points", "Boosters are useful when the early thrust gain outweighs mass, drag, and separation risk."],
      boosterCount,
    });
  }
  if (stages >= 2) {
    parts.push({
      id: "builder-upper-stage",
      name: cryogenic ? "Cryogenic upper stage" : methalox ? "Methalox upper stage" : "Kerolox upper stage",
      type: "Custom upper stage",
      height: 13 + diameter,
      r0: coreRadius * 0.86,
      r1: coreRadius * 0.78,
      color: cryogenic ? "#eef6ff" : methalox ? "#c9d3dc" : "#f5f7fa",
      accent: cryogenic ? "#8fddff" : "#5df2c1",
      description: "The upper stage decides whether your custom rocket actually reaches orbit after the booster is gone.",
      stats: { Isp: `${ispS} s`, Stages: String(stages), Role: "Orbit insertion" },
      equation: ["Rocket equation", "Δv = Isp · g0 · ln(m0 / mf)", "Efficient upper stages rescue many designs, but only if mass ratio is still healthy."],
    });
  }
  if (stages >= 3) {
    parts.push({
      id: "builder-kick-stage",
      name: "Kick stage",
      type: "Mission trim stage",
      height: 5.8,
      r0: coreRadius * 0.58,
      r1: coreRadius * 0.44,
      color: "#dce7ef",
      accent: "#f6b14a",
      description: "A small third stage gives precise final energy, but adds another engine start and another empty structure to carry.",
      stats: { Job: "Final burn", Risk: "Restart", Role: "Mission shaping" },
      equation: ["Restart margin", "burn when needed", "A restartable stage is powerful when it works and mission-ending when it does not."],
    });
  }
  parts.push({
    id: "builder-fairing",
    name: "Payload fairing",
    type: "Custom payload",
    height: 7 + diameter * 0.55,
    r0: fairingRadius,
    r1: 0.18,
    color: "#e8edf4",
    accent: "#ffb454",
    description: "This is the useful mass. Make it too heavy and the rocket can still lift off while failing to reach orbit.",
    stats: { Payload: `${defaultPayloadT.toFixed(1)} t nominal`, Limit: `${maxPayloadT.toFixed(1)} t`, Role: "Mission value" },
    equation: ["Payload penalty", "m0 = dry + prop + payload", "Payload sits at the top of every equation. It is valuable, but it directly consumes margin."],
  });
  return {
    id: "builder",
    name: "Build-a-Rocket",
    mission: `${stages}-stage ${config.upperStage} ${reusable ? "reusable" : "test"} stack`,
    family: "Custom failure lab",
    heightM,
    diameterM: diameter,
    thrustMN,
    payload: `${defaultPayloadT.toFixed(1)} t custom`,
    defaultPayloadT,
    maxPayloadT,
    dryMassT,
    propellantT,
    ispS,
    dragAreaM2: Math.PI * (diameter / 2) ** 2 * (1.02 + boosterPairs * 0.38),
    targetDeltaVMps: 9400,
    stageGain,
    materialProfile: { skin, tank, shield, propellant, engine },
    era: "Designed now",
    summary: "A live generated rocket. Change the architecture, run a launch, and study the exact way it fails.",
    parts,
    custom: true,
  };
}

function createReferenceRocket(def) {
  const radius = (def.diameterM || 4) / 2;
  const stageCount = def.stages || 2;
  const lowerHeight = Math.max(13, def.heightM * 0.42);
  const upperHeight = Math.max(7, def.heightM * 0.18);
  const boosterHeight = Math.max(16, def.heightM * 0.34);
  const fairingHeight = Math.max(5, def.heightM * 0.12);
  const parts = [
    {
      id: `${def.id}-engines`,
      name: def.engineName || "Engine section",
      type: "Propulsion",
      height: Math.max(3.8, def.heightM * 0.06),
      r0: radius,
      r1: radius * 0.86,
      color: def.engineColor || "#c96f38",
      accent: "#ffd08a",
      description: def.engineDescription || `${def.name}'s engine system sets thrust, throttling, restart behavior, and early failure modes.`,
      stats: { Thrust: `${def.thrustMN.toFixed(def.thrustMN < 1 ? 2 : 1)} MN`, Engines: def.engineStat || "cluster", Role: "Propulsion" },
      equation: ["Thrust", "T = ṁ · ve", "Engines turn propellant mass flow into exhaust momentum and vehicle acceleration."],
    },
    {
      id: `${def.id}-first-stage`,
      name: def.firstStageName || "First stage",
      type: def.reusable ? "Reusable booster" : "Booster",
      height: lowerHeight,
      r0: radius,
      r1: radius,
      color: def.coreColor || "#dce7ef",
      accent: def.accent || "#5df2c1",
      description: def.firstStageDescription || "The first stage fights gravity and thick air while the vehicle is heaviest.",
      stats: { Structure: def.structure || "core tank", Reuse: def.reusable ? "Reusable" : "Expendable", Role: "Boost phase" },
      equation: ["T/W", "T / W > 1", "A rocket must first beat its own weight before the rest of the mission matters."],
    },
  ];
  if (def.boosters) {
    parts.push({
      id: `${def.id}-boosters`,
      name: def.boosterName || `${def.boosters} strap-on boosters`,
      type: "Side boosters",
      height: boosterHeight,
      r0: radius * 0.38,
      r1: radius * 0.34,
      color: "#eef4f8",
      accent: "#f6b14a",
      description: "Boosters add liftoff impulse, but they also add drag, bending loads, and separation risk.",
      stats: { Count: String(def.boosters), Risk: "Separation", Role: "Early thrust" },
      equation: ["Impulse", "J = F · Δt", "Boosters are a short, violent way to add momentum early in the flight."],
      boosterCount: def.boosters,
    });
  }
  parts.push({
    id: `${def.id}-upper-stage`,
    name: def.upperStageName || (stageCount > 2 ? "Upper stages" : "Upper stage"),
    type: "Orbit insertion",
    height: upperHeight,
    r0: radius * 0.82,
    r1: radius * 0.72,
    color: def.upperColor || "#f2f5f7",
    accent: "#8fddff",
    description: def.upperDescription || "The upper stage finishes the velocity budget after the lower atmosphere is mostly gone.",
    stats: { Stages: String(stageCount), Propellant: def.propellant || "mixed", Role: "Final energy" },
    equation: ["Rocket equation", "Δv = Isp · g0 · ln(m0/mf)", "Upper stages care less about brute thrust and more about efficiency and mass ratio."],
  });
  parts.push({
    id: `${def.id}-fairing`,
    name: def.fairingName || "Payload fairing",
    type: "Payload protection",
    height: fairingHeight,
    r0: radius * 0.78,
    r1: 0.22,
    color: "#e8edf4",
    accent: "#ffb454",
    description: def.fairingDescription || "The payload section protects mission hardware until the atmosphere is thin enough to open.",
    stats: { Payload: def.payload, Class: def.family, Role: "Mission value" },
    equation: ["Payload penalty", "m0 = dry + prop + payload", "Payload is useful mass, but it directly consumes delta-v margin."],
  });
  return {
    id: def.id,
    name: def.name,
    mission: def.mission,
    family: def.family,
    heightM: def.heightM,
    diameterM: def.diameterM,
    thrustMN: def.thrustMN,
    payload: def.payload,
    defaultPayloadT: def.defaultPayloadT,
    maxPayloadT: def.maxPayloadT,
    dryMassT: def.dryMassT,
    propellantT: def.propellantT,
    ispS: def.ispS,
    dragAreaM2: Math.PI * radius * radius * (def.dragFactor || 1.08),
    targetDeltaVMps: def.targetDeltaVMps || 9300,
    stageGain: def.stageGain || 1.32,
    era: def.era,
    operator: def.operator || def.family,
    country: def.country || "Reference",
    status: def.status || def.era || "Reference",
    lessonFocus: def.lessonFocus || def.summary,
    sourceUrl: def.sourceUrl || "",
    summary: def.summary,
    parts,
  };
}

const rockets = [
  {
    id: "saturn-v",
    name: "Saturn V",
    mission: "Apollo lunar stack",
    family: "Moon launcher",
    heightM: 110.6,
    diameterM: 10.1,
    thrustMN: 34.5,
    payload: "48.6 t to TLI",
    defaultPayloadT: 48.6,
    maxPayloadT: 140,
    dryMassT: 190,
    propellantT: 2630,
    ispS: 263,
    dragAreaM2: 82,
    targetDeltaVMps: 10800,
    stageGain: 1.72,
    era: "1967-1973",
    summary:
      "A three-stage launch vehicle that converted chemical energy into enough impulse to send Apollo crews toward the Moon.",
    operator: "NASA",
    country: "United States",
    status: "Retired",
    lessonFocus: "Moon-shot architecture lesson: staging, high thrust, restartable upper stages, and crew abort all had to work together.",
    sourceUrl: "https://www.nasa.gov/history/alsj/SaturnV.html",
    parts: [
      {
        id: "f1-engines",
        name: "Five F-1 engines",
        type: "Propulsion",
        height: 9,
        r0: 4.7,
        r1: 4.35,
        color: "#d96f36",
        accent: "#ffd08a",
        description:
          "The engine cluster produced the huge liftoff thrust. Each F-1 burned RP-1 and liquid oxygen, and the five-engine layout let Saturn V clear the tower with margin.",
        stats: { Thrust: "34.5 MN", Propellant: "RP-1 / LOX", Role: "Liftoff" },
        equation: ["Newton's second law", "F = m · a", "More thrust than weight gives upward acceleration. Saturn V needed an enormous net force because liftoff mass was about 2,900 tonnes."],
      },
      {
        id: "s-ic",
        name: "S-IC first stage",
        type: "Booster",
        height: 42,
        r0: 5.05,
        r1: 5.05,
        color: "#f2f5f7",
        accent: "#1a1f27",
        description:
          "The first stage handled dense-atmosphere ascent. It burned for roughly 150 seconds, then separated after giving the stack most of its early velocity.",
        stats: { Burn: "≈150 s", Engines: "5 × F-1", Job: "Punch through atmosphere" },
        equation: ["Thrust-to-weight", "T / W > 1", "At liftoff the rocket moves only if thrust exceeds weight. The extra margin becomes acceleration."],
      },
      {
        id: "s-ii",
        name: "S-II second stage",
        type: "Upper stage",
        height: 24.9,
        r0: 5.05,
        r1: 5.05,
        color: "#d9e1ea",
        accent: "#55c8ff",
        description:
          "The second stage switched to hydrogen and oxygen for high efficiency after the lower atmosphere. It continued accelerating the stack toward orbital speed.",
        stats: { Engines: "5 × J-2", Propellant: "LH2 / LOX", Job: "High-altitude acceleration" },
        equation: ["Specific impulse", "Isp = thrust / weight-flow", "Hydrogen engines trade density for efficiency, which matters once the rocket is above the thick atmosphere."],
      },
      {
        id: "s-ivb",
        name: "S-IVB third stage",
        type: "Orbital injection",
        height: 17.8,
        r0: 3.3,
        r1: 3.3,
        color: "#ffffff",
        accent: "#94a8bf",
        description:
          "The third stage first completed Earth orbit, then restarted for translunar injection. It is the part that turned orbit into a Moon-bound trajectory.",
        stats: { Restart: "Yes", Engine: "1 × J-2", Role: "Earth orbit + TLI" },
        equation: ["Rocket equation", "Δv = Isp · g0 · ln(m0 / mf)", "Restartable, efficient upper stages matter because every kilogram saved late in flight improves final velocity."],
      },
      {
        id: "service-module",
        name: "Service module",
        type: "Spacecraft systems",
        height: 7.6,
        r0: 1.95,
        r1: 1.95,
        color: "#bfc7d2",
        accent: "#ffb454",
        description:
          "The service module carried power, oxygen, propulsion, and thermal control for Apollo after launch vehicle separation.",
        stats: { Systems: "Power + propulsion", Crew: "Supports command module", Role: "Mission operations" },
        equation: ["Impulse", "J = F · Δt", "Small spacecraft engines rely on controlled impulse instead of raw thrust to shape the mission trajectory."],
      },
      {
        id: "command-module",
        name: "Command module",
        type: "Crew vehicle",
        height: 3.5,
        r0: 1.95,
        r1: 0.9,
        color: "#c9d1d9",
        accent: "#f6b14a",
        description:
          "The command module protected the crew during launch, coast, re-entry, and splashdown. Its blunt shape managed re-entry heating.",
        stats: { Crew: "3", Reentry: "Blunt heat shield", Role: "Return capsule" },
        equation: ["Drag heating", "q ∝ ρ · v³", "Re-entry heating climbs quickly with velocity, so shape and heat shield material become life-critical."],
      },
      {
        id: "launch-escape",
        name: "Launch escape tower",
        type: "Abort safety",
        height: 6.8,
        r0: 0.9,
        r1: 0.2,
        color: "#ff6b6b",
        accent: "#ffcf99",
        description:
          "A solid-rocket escape system could pull the crew capsule away from a failing booster during the most dangerous phase.",
        stats: { Mode: "Abort", Propellant: "Solid", Role: "Crew safety" },
        equation: ["Acceleration", "a = F / m", "A lightweight escape stack can accelerate quickly because its mass is far smaller than the full launch vehicle."],
      },
    ],
  },
  {
    id: "falcon-9",
    name: "Falcon 9",
    mission: "Reusable orbital booster",
    family: "Commercial launcher",
    heightM: 70,
    diameterM: 3.7,
    thrustMN: 7.6,
    payload: "22.8 t to LEO",
    defaultPayloadT: 22.8,
    maxPayloadT: 22.8,
    dryMassT: 31,
    propellantT: 505,
    ispS: 311,
    dragAreaM2: 10.8,
    targetDeltaVMps: 9400,
    stageGain: 1.38,
    era: "2010-present",
    summary:
      "A two-stage rocket optimized around partial reusability, engine-out margin, and frequent launch operations.",
    operator: "SpaceX",
    country: "United States",
    status: "Operational",
    lessonFocus: "Reusable operations lesson: payload margin, landing reserve, engine clustering, and inspection cadence all trade against each other.",
    sourceUrl: "https://www.spacex.com/vehicles/falcon-9/",
    recoveryProfile: {
      label: "Falcon 9 booster",
      averageDropS: 355,
      liftoffToLandingS: 510,
      basis: "Typical webcast timeline: stage separation around T+2:35 and booster landing around T+8:30.",
    },
    parts: [
      {
        id: "merlins",
        name: "Nine Merlin engines",
        type: "Propulsion",
        height: 5.6,
        r0: 1.8,
        r1: 1.55,
        color: "#d56b35",
        accent: "#ffd08a",
        description:
          "The nine-engine cluster gives Falcon 9 high liftoff thrust and redundancy. The center engine also supports landing burns.",
        stats: { Engines: "9 × Merlin", Thrust: "≈7.6 MN", Reuse: "Landing burn" },
        equation: ["Control authority", "τ = r × F", "Throttling and steering engines create torque that guides the booster."],
      },
      {
        id: "first-stage",
        name: "Reusable first stage",
        type: "Booster",
        height: 41.2,
        r0: 1.85,
        r1: 1.85,
        color: "#eff4f8",
        accent: "#171c23",
        description:
          "The first stage provides most ascent energy, separates, flips, and returns for landing when mission margins allow.",
        stats: { Landing: "Boostback + entry + landing", Fuel: "RP-1 / LOX", Role: "Reusable booster" },
        equation: ["Energy trade", "E = 1/2 · m · v²", "Recovery needs propellant reserve, so reusable missions trade payload capacity for booster return energy."],
      },
      {
        id: "grid-fins",
        name: "Grid fins",
        type: "Aerodynamic control",
        height: 3.2,
        r0: 2.2,
        r1: 2.1,
        color: "#9da8b6",
        accent: "#8fddff",
        description:
          "Deployable fins steer the falling booster through the atmosphere before engine relight and landing.",
        stats: { Medium: "Atmosphere", Phase: "Descent", Role: "Steering" },
        equation: ["Drag force", "D = 1/2 · ρ · v² · Cd · A", "Grid fins use airflow to create control forces while the booster descends."],
      },
      {
        id: "interstage",
        name: "Interstage",
        type: "Separation",
        height: 5.5,
        r0: 1.86,
        r1: 1.86,
        color: "#1b222d",
        accent: "#f6b14a",
        description:
          "The interstage connects stages structurally and separates cleanly when the upper stage ignites.",
        stats: { Job: "Connect + separate", Material: "Carbon composite", Timing: "Staging" },
        equation: ["Load path", "σ = F / A", "The interstage must transmit compressive loads without buckling during ascent."],
      },
      {
        id: "second-stage",
        name: "Second stage",
        type: "Upper stage",
        height: 12.6,
        r0: 1.78,
        r1: 1.78,
        color: "#f5f7fa",
        accent: "#8fddff",
        description:
          "A single vacuum Merlin engine circularizes orbit and injects payloads into their target trajectories.",
        stats: { Engine: "1 × MVac", Vacuum: "Expanded nozzle", Role: "Orbit insertion" },
        equation: ["Δv budget", "mission Δv = stage Δv sum", "Upper-stage performance dominates final orbit because it burns after the heavy booster is gone."],
      },
      {
        id: "payload-fairing",
        name: "Payload fairing",
        type: "Payload protection",
        height: 7.9,
        r0: 1.78,
        r1: 0.45,
        color: "#dce7f2",
        accent: "#94a8bf",
        description:
          "The fairing shields satellites from acoustic loads and atmospheric heating, then separates once air is thin.",
        stats: { Opens: "Two halves", Phase: "Upper atmosphere", Role: "Protect payload" },
        equation: ["Dynamic pressure", "q = 1/2 · ρ · v²", "Fairings are kept until dynamic pressure and heating are low enough for the payload."],
      },
    ],
  },
  {
    id: "falcon-heavy",
    name: "Falcon Heavy",
    mission: "Triple-core reusable heavy lift",
    family: "SpaceX heavy launcher",
    heightM: 70,
    diameterM: 12.2,
    thrustMN: 22.8,
    payload: "63.8 t to LEO",
    defaultPayloadT: 26.7,
    maxPayloadT: 63.8,
    dryMassT: 86,
    propellantT: 1410,
    ispS: 311,
    dragAreaM2: 36,
    targetDeltaVMps: 9500,
    stageGain: 1.34,
    era: "2018-present",
    summary:
      "A Falcon 9-derived heavy launcher with three booster cores, 27 Merlin engines, and a difficult center-core recovery trade.",
    operator: "SpaceX",
    country: "United States",
    status: "Operational",
    lessonFocus: "Heavy-reuse lesson: side boosters add huge liftoff thrust, but coupled-core staging and center-core recovery become the hard part.",
    sourceUrl: "https://www.spacex.com/vehicles/falcon-heavy/",
    recoveryProfile: {
      label: "Falcon Heavy cores",
      averageDropS: 353,
      liftoffToLandingS: 508,
      basis: "Average of two side-booster returns and the center-core return in a typical Falcon Heavy recovery timeline.",
    },
    parts: [
      {
        id: "heavy-merlins",
        name: "Twenty-seven Merlin engines",
        type: "Propulsion cluster",
        height: 5.8,
        r0: 5.2,
        r1: 4.8,
        color: "#d56b35",
        accent: "#ffd08a",
        description:
          "Three Falcon-class cores ignite together. The huge thrust solves liftoff, but synchronization, vibration, and engine-out logic become system-level problems.",
        stats: { Engines: "27 x Merlin", Thrust: "≈22.8 MN", Risk: "Coupled cores" },
        equation: ["Engine count", "Ttotal = Σ Ti", "Adding engines raises thrust, but it also multiplies plumbing, sensing, and failure paths."],
      },
      {
        id: "heavy-side-boosters",
        name: "Reusable side boosters",
        type: "Side boosters",
        height: 41.2,
        r0: 4.0,
        r1: 3.7,
        color: "#eff4f8",
        accent: "#171c23",
        description:
          "The side boosters separate earlier and can return to land. Their recovery is easier than the center core because they stage with less downrange energy.",
        stats: { Count: "2", Recovery: "RTLS/ship", Role: "Early thrust" },
        equation: ["Recovery trade", "payload ↔ landing propellant", "Reusable boosters save hardware only if the mission leaves enough propellant for return burns."],
      },
      {
        id: "heavy-center-core",
        name: "Center core",
        type: "High-energy booster",
        height: 41.2,
        r0: 1.85,
        r1: 1.85,
        color: "#f5f7fa",
        accent: "#5df2c1",
        description:
          "The center core burns longer and faster after side separation, making recovery harder because it is farther downrange and hotter.",
        stats: { Burn: "Longer than sides", Recovery: "Hardest core", Role: "Main ascent" },
        equation: ["Kinetic energy", "E = 1/2 · m · v²", "A little extra speed creates a lot more recovery energy to remove."],
      },
      {
        id: "heavy-interstage",
        name: "Interstage and separation system",
        type: "Staging",
        height: 5.5,
        r0: 1.86,
        r1: 1.86,
        color: "#1b222d",
        accent: "#f6b14a",
        description:
          "The stack has more staging and separation events than Falcon 9. Clean timing matters because side boosters sit close to the center core.",
        stats: { Events: "Side sep + stage sep", Load: "Coupled", Role: "Release hardware" },
        equation: ["Separation margin", "clearance > motion error", "A booster that separates with the wrong rate can threaten the core."],
      },
      {
        id: "heavy-upper-stage",
        name: "Falcon upper stage",
        type: "Upper stage",
        height: 12.6,
        r0: 1.78,
        r1: 1.78,
        color: "#f5f7fa",
        accent: "#8fddff",
        description:
          "The upper stage is similar to Falcon 9's and performs orbital insertion or high-energy transfer after the triple-core stack is gone.",
        stats: { Engine: "1 x MVac", Role: "Orbit/transfer", Constraint: "Payload mass" },
        equation: ["Delta-v budget", "Δvfinal depends on upper stage", "The heavy first stage helps, but final orbit still depends on upper-stage mass ratio."],
      },
      {
        id: "heavy-fairing",
        name: "Large payload fairing",
        type: "Payload protection",
        height: 7.9,
        r0: 1.78,
        r1: 0.45,
        color: "#dce7f2",
        accent: "#94a8bf",
        description:
          "Falcon Heavy's value is high-energy payload. The fairing protects large spacecraft until the atmosphere is no longer the design driver.",
        stats: { Payload: "Heavy class", Opens: "Upper atmosphere", Role: "Protect payload" },
        equation: ["Dynamic pressure", "q = 1/2 · ρ · v²", "Fairing separation waits until air load is low enough for exposed spacecraft."],
      },
    ],
  },
  {
    id: "falcon-1",
    name: "Falcon 1",
    mission: "Early SpaceX small orbital launcher",
    family: "SpaceX first launcher",
    heightM: 21.3,
    diameterM: 1.7,
    thrustMN: 0.34,
    payload: "0.67 t to LEO",
    defaultPayloadT: 0.42,
    maxPayloadT: 0.67,
    dryMassT: 2.3,
    propellantT: 25.6,
    ispS: 304,
    dragAreaM2: 2.4,
    targetDeltaVMps: 9300,
    stageGain: 1.18,
    era: "2006-2009",
    summary:
      "A small two-stage launcher whose early failures make it a perfect lesson in staging, slosh, vibration, and basic orbital margins.",
    operator: "SpaceX",
    country: "United States",
    status: "Retired",
    lessonFocus: "Iteration lesson: Falcon 1 makes early propulsion, staging, and flight-test learning visible at small scale.",
    sourceUrl: "https://www.spacex.com/vehicles/falcon-1/",
    parts: [
      {
        id: "falcon1-merlin",
        name: "Single Merlin engine",
        type: "Propulsion",
        height: 2.4,
        r0: 0.8,
        r1: 0.68,
        color: "#d56b35",
        accent: "#ffd08a",
        description:
          "One engine means simple thrust architecture but little redundancy. Any propulsion issue can end the flight.",
        stats: { Engine: "1 x Merlin", Propellant: "RP-1 / LOX", Role: "Liftoff" },
        equation: ["Single point failure", "N = 1", "A single engine is easier to integrate but gives no engine-out path."],
      },
      {
        id: "falcon1-first-stage",
        name: "First stage tank",
        type: "Booster",
        height: 13.8,
        r0: 0.85,
        r1: 0.85,
        color: "#f2f5f7",
        accent: "#1a1f27",
        description:
          "The first stage has little margin. Small launchers punish dry mass, drag, and guidance errors much more harshly than giant rockets.",
        stats: { Diameter: "1.7 m", Margin: "Thin", Role: "Boost phase" },
        equation: ["Mass fraction", "payload / m0", "Small rockets can lose a mission to surprisingly small mass growth."],
      },
      {
        id: "falcon1-interstage",
        name: "Interstage",
        type: "Separation",
        height: 1.8,
        r0: 0.85,
        r1: 0.74,
        color: "#1b222d",
        accent: "#f6b14a",
        description:
          "Stage separation and upper-stage ignition are delicate. Falcon 1's history is a useful reminder that transitions are where rockets often fail.",
        stats: { Event: "Stage sep", Risk: "Contact/recontact", Role: "Transition" },
        equation: ["Relative motion", "clearance = rate · time", "The stages must move apart fast enough before the next engine dominates the motion."],
      },
      {
        id: "falcon1-upper-stage",
        name: "Kestrel upper stage",
        type: "Upper stage",
        height: 3.5,
        r0: 0.72,
        r1: 0.58,
        color: "#e8edf4",
        accent: "#8fddff",
        description:
          "The pressure-fed upper stage finishes orbital insertion with very little mass to spare.",
        stats: { Engine: "Kestrel", Feed: "Pressure-fed", Role: "Orbit insertion" },
        equation: ["Upper-stage leverage", "late mass matters most", "When the vehicle is small, upper-stage dry mass is brutally important."],
      },
      {
        id: "falcon1-fairing",
        name: "Small payload fairing",
        type: "Payload",
        height: 2.7,
        r0: 0.72,
        r1: 0.18,
        color: "#dce7f2",
        accent: "#94a8bf",
        description:
          "The payload bay is tiny, which makes Falcon 1 a good teaching model for how payload volume and mass constrain the whole architecture.",
        stats: { Payload: "Small satellite", Role: "Mission value", Constraint: "Volume" },
        equation: ["Drag area", "D ∝ A", "A narrow fairing helps drag but limits what you can carry."],
      },
    ],
  },
  {
    id: "starship",
    name: "Starship",
    mission: "Fully reusable heavy transport",
    family: "Super heavy lift",
    heightM: 121,
    diameterM: 9,
    thrustMN: 74,
    payload: "100+ t class",
    defaultPayloadT: 100,
    maxPayloadT: 150,
    dryMassT: 285,
    propellantT: 4600,
    ispS: 330,
    dragAreaM2: 64,
    targetDeltaVMps: 10200,
    stageGain: 1.32,
    era: "2020s",
    summary:
      "A stainless-steel two-stage system designed for full reusability, high launch cadence, and orbital refueling.",
    operator: "SpaceX",
    country: "United States",
    status: "In flight test",
    lessonFocus: "Full-reuse lesson: stainless steel, many engines, hot staging, flaps, TPS, and orbital refueling all interact.",
    sourceUrl: "https://www.spacex.com/vehicles/starship/",
    parts: [
      {
        id: "raptors",
        name: "Raptor engine cluster",
        type: "Methalox propulsion",
        height: 8,
        r0: 4.5,
        r1: 4.05,
        color: "#bf6a42",
        accent: "#ffd08a",
        description:
          "The Super Heavy booster uses many methane-oxygen engines for very high thrust and deep throttling/control authority.",
        stats: { Propellant: "CH4 / LOX", Thrust: "Super-heavy class", Role: "Liftoff" },
        equation: ["Mass flow", "T ≈ ṁ · ve", "High thrust comes from pushing a lot of mass flow through engines at high exhaust velocity."],
      },
      {
        id: "super-heavy",
        name: "Super Heavy booster",
        type: "Reusable booster",
        height: 62,
        r0: 4.5,
        r1: 4.5,
        color: "#aeb8c4",
        accent: "#202732",
        description:
          "The booster accelerates the vehicle, separates, and is designed to return for capture instead of landing legs.",
        stats: { Diameter: "9 m", Recovery: "Tower catch concept", Role: "Reusable first stage" },
        equation: ["Momentum", "p = m · v", "The booster changes the stack momentum rapidly, then manages its own momentum on return."],
      },
      {
        id: "hot-stage",
        name: "Hot-stage ring",
        type: "Staging",
        height: 3,
        r0: 4.5,
        r1: 4.5,
        color: "#161b22",
        accent: "#f6b14a",
        description:
          "The stage interface lets the ship ignite while separating, reducing gravity losses during the transition.",
        stats: { Function: "Stage transition", Load: "Structural ring", Role: "Separation" },
        equation: ["Gravity loss", "loss ≈ ∫ g · dt", "Keeping thrust continuous through staging reduces time spent fighting gravity without accelerating."],
      },
      {
        id: "ship-tanks",
        name: "Starship tanks",
        type: "Propellant storage",
        height: 31,
        r0: 4.5,
        r1: 4.5,
        color: "#cad2dc",
        accent: "#8fddff",
        description:
          "Large methane and oxygen tanks feed sea-level and vacuum Raptors. Tank structure is also the vehicle body.",
        stats: { Structure: "Stainless steel", Propellant: "Methane + oxygen", Role: "Orbital burn" },
        equation: ["Pressure vessel", "hoop stress ≈ p · r / t", "Large tanks must resist internal pressure while staying light enough for flight."],
      },
      {
        id: "flaps",
        name: "Control flaps",
        type: "Atmospheric control",
        height: 12,
        r0: 4.7,
        r1: 4.4,
        color: "#8793a3",
        accent: "#f6b14a",
        description:
          "Moveable flaps control attitude during belly-flop re-entry, trading lift and drag to manage descent.",
        stats: { Phase: "Re-entry", Medium: "Atmosphere", Role: "Attitude control" },
        equation: ["Moment", "M = F · d", "Aero forces acting far from the center of mass create moments that rotate the vehicle."],
      },
      {
        id: "payload-bay",
        name: "Payload bay and nose",
        type: "Cargo / crew volume",
        height: 22,
        r0: 4.35,
        r1: 0.4,
        color: "#e8edf4",
        accent: "#ffb454",
        description:
          "The upper section can contain payloads, crew systems, or tanker hardware depending on mission configuration.",
        stats: { Volume: "Large fairing class", Shape: "Tapered nose", Role: "Mission payload" },
        equation: ["Center of mass", "xcm = Σ mi xi / Σ mi", "Payload placement changes balance, control needs, and re-entry behavior."],
      },
    ],
  },
  {
    id: "soyuz",
    name: "Soyuz",
    mission: "Crew ferry with R-7 strap-on boosters",
    family: "Crew launcher",
    heightM: 46.3,
    diameterM: 10.3,
    thrustMN: 4.1,
    payload: "7.1 t to LEO",
    defaultPayloadT: 7.1,
    maxPayloadT: 8.2,
    dryMassT: 27,
    propellantT: 280,
    ispS: 305,
    dragAreaM2: 34,
    targetDeltaVMps: 9300,
    stageGain: 1.26,
    era: "1960s-present",
    summary:
      "A compact, rugged orbital system built around four tapered side boosters, a central core, and a crew spacecraft with abort tower.",
    operator: "Roscosmos / R-7 family operators",
    country: "Russia",
    status: "Operational family",
    lessonFocus: "Reliability lesson: strap-on boosters, sustainer core, vernier control, and abort architecture create a durable crew-launch pattern.",
    sourceUrl: "https://www.roscosmos.ru/",
    parts: [
      {
        id: "rd-107",
        name: "RD-107/108 engines",
        type: "Propulsion",
        height: 4.4,
        r0: 2.3,
        r1: 1.9,
        color: "#ba6a35",
        accent: "#ffd08a",
        description:
          "Multiple kerosene engines and vernier thrusters give the R-7 family thrust plus fine steering during the first phase of ascent.",
        stats: { Engines: "Core + booster chambers", Propellant: "RP-1 / LOX", Role: "Liftoff control" },
        equation: ["Vector control", "M = F · d", "Vernier thrust produces small moments that keep the slender stack pointed correctly."],
      },
      {
        id: "soyuz-boosters",
        name: "Four strap-on boosters",
        type: "Booster cluster",
        height: 19.6,
        r0: 2.35,
        r1: 1.35,
        color: "#d8e1e8",
        accent: "#f6b14a",
        description:
          "The iconic tapered boosters burn beside the core and peel away after liftoff, leaving the core to continue the climb.",
        stats: { Count: "4", Separation: "Cross pattern", Role: "Early thrust" },
        equation: ["Staging", "m0 / mf increases", "Dropping empty boosters improves mass ratio without changing the upper stack."],
      },
      {
        id: "soyuz-core",
        name: "Central core stage",
        type: "Sustainer",
        height: 27.8,
        r0: 1.45,
        r1: 1.45,
        color: "#cfd8df",
        accent: "#8fddff",
        description:
          "The core stage lights on the pad and keeps burning after the strap-on boosters separate, acting like a sustainer.",
        stats: { Burn: "Continuous", Propellant: "RP-1 / LOX", Role: "Sustained ascent" },
        equation: ["Gravity loss", "loss ~= integral g dt", "Continuous thrust reduces time spent fighting gravity without gaining speed."],
      },
      {
        id: "soyuz-third-stage",
        name: "Blok-I upper stage",
        type: "Upper stage",
        height: 6.7,
        r0: 1.35,
        r1: 1.1,
        color: "#eef4f8",
        accent: "#94a8bf",
        description:
          "The upper stage finishes orbital insertion after the dense lower atmosphere and heavy booster hardware are gone.",
        stats: { Job: "Orbit insertion", Engine: "RD-0110 class", Role: "Final velocity" },
        equation: ["Delta-v", "dv = Isp g0 ln(m0 / mf)", "Late burns are valuable because the upper stage carries less dead mass."],
      },
      {
        id: "soyuz-spacecraft",
        name: "Soyuz spacecraft",
        type: "Crew vehicle",
        height: 7.5,
        r0: 1.35,
        r1: 0.45,
        color: "#e7edf3",
        accent: "#5df2c1",
        description:
          "The crew spacecraft combines orbital module, descent module, service systems, and a launch escape system on top.",
        stats: { Crew: "3", Mode: "Orbital ferry", Role: "Crew transport" },
        equation: ["Abort acceleration", "a = F / m", "A smaller crew stack can be pulled away quickly if the booster fails."],
      },
    ],
  },
  {
    id: "space-shuttle",
    name: "Space Shuttle",
    mission: "Winged orbiter with tank and twin SRBs",
    family: "Reusable orbiter",
    heightM: 56.1,
    diameterM: 8.4,
    thrustMN: 30.1,
    payload: "24.4 t to LEO",
    defaultPayloadT: 24.4,
    maxPayloadT: 27.5,
    dryMassT: 176,
    propellantT: 1860,
    ispS: 269,
    dragAreaM2: 126,
    targetDeltaVMps: 9300,
    stageGain: 1.16,
    era: "1981-2011",
    summary:
      "A side-mounted winged spacecraft launched with a giant external tank and two solid rocket boosters.",
    operator: "NASA",
    country: "United States",
    status: "Retired",
    lessonFocus: "Reusable orbiter lesson: wings, tiles, side-mount loads, solids, and inspection burden made Shuttle a deep systems trade.",
    sourceUrl: "https://www.nasa.gov/reference/the-space-shuttle/",
    parts: [
      {
        id: "srb-nozzles",
        name: "SRB nozzles",
        type: "Solid propulsion",
        height: 4.8,
        r0: 3.2,
        r1: 2.7,
        color: "#2d333d",
        accent: "#ff9c3d",
        description:
          "The solid boosters provide most liftoff thrust. Their nozzles steer by gimbaling under enormous chamber pressure.",
        stats: { Count: "2 boosters", Thrust: "Liftoff majority", Role: "Pad escape" },
        equation: ["Impulse", "J = integral F dt", "Solid boosters deliver a large fixed impulse profile that cannot simply be throttled off."],
      },
      {
        id: "shuttle-boosters",
        name: "Twin solid rocket boosters",
        type: "Side boosters",
        height: 45.5,
        r0: 1.85,
        r1: 1.85,
        color: "#f1f4f6",
        accent: "#1a1f27",
        description:
          "Two recoverable solid boosters are strapped beside the tank and separate after the high-thrust first phase.",
        stats: { Propellant: "Solid", Recovery: "Parachute", Role: "High thrust" },
        equation: ["Dynamic pressure", "q = 1/2 rho v^2", "The stack must throttle main engines around Max-Q while SRBs keep burning."],
      },
      {
        id: "shuttle-external-tank",
        name: "External tank",
        type: "Propellant tank",
        height: 46.9,
        r0: 4.2,
        r1: 3.7,
        color: "#c77531",
        accent: "#f8c579",
        description:
          "The orange tank feeds liquid hydrogen and oxygen to the orbiter engines and acts as the central load path.",
        stats: { Propellant: "LH2 / LOX", Foam: "Insulation", Role: "Main propellant" },
        equation: ["Hoop stress", "sigma ~= p r / t", "Large cryogenic tanks must hold pressure while staying light."],
      },
      {
        id: "shuttle-orbiter",
        name: "Winged orbiter",
        type: "Reusable spacecraft",
        height: 23.8,
        r0: 2.2,
        r1: 1.1,
        color: "#e6edf4",
        accent: "#11151c",
        description:
          "The orbiter rides side-mounted, carries crew and payload, then re-enters as a hypersonic glider.",
        stats: { Landing: "Runway", Payload: "Bay cargo", Role: "Crew + cargo return" },
        equation: ["Lift-to-drag", "glide angle depends on L / D", "A winged spacecraft trades payload mass for runway recovery and cross-range."],
      },
      {
        id: "ssme-cluster",
        name: "Three RS-25 engines",
        type: "Hydrogen propulsion",
        height: 5.6,
        r0: 2,
        r1: 1.5,
        color: "#596574",
        accent: "#8fddff",
        description:
          "The orbiter engines burn propellant from the external tank and throttle through launch loads.",
        stats: { Engines: "3 x RS-25", Propellant: "LH2 / LOX", Role: "Sustained thrust" },
        equation: ["Specific impulse", "Isp = T / weight-flow", "Hydrogen engines give high efficiency when the tank volume penalty is acceptable."],
      },
    ],
  },
  {
    id: "electron",
    name: "Electron",
    mission: "Small-satellite precision launcher",
    family: "Small lift",
    heightM: 18,
    diameterM: 1.2,
    thrustMN: 0.19,
    payload: "0.3 t to LEO",
    defaultPayloadT: 0.2,
    maxPayloadT: 0.32,
    dryMassT: 1.35,
    propellantT: 12.3,
    ispS: 311,
    dragAreaM2: 1.4,
    targetDeltaVMps: 9300,
    stageGain: 1.22,
    era: "2017-present",
    summary:
      "A small carbon-composite launch vehicle using electric-pump-fed engines and a kick stage for precise satellite delivery.",
    operator: "Rocket Lab",
    country: "United States / New Zealand",
    status: "Operational",
    lessonFocus: "Small-launch lesson: electric pumps, carbon tanks, battery staging, and kick-stage precision show how small rockets survive thin margins.",
    sourceUrl: "https://www.rocketlabusa.com/launch/electron/",
    parts: [
      {
        id: "rutherford-engines",
        name: "Rutherford engine pack",
        type: "Electric-pump propulsion",
        height: 1.8,
        r0: 0.56,
        r1: 0.48,
        color: "#b8663e",
        accent: "#ffd08a",
        description:
          "Battery-powered pumps simplify turbomachinery and help the small booster pack many engines into a compact base.",
        stats: { Engines: "9 first-stage", Pumps: "Electric", Role: "Small launch thrust" },
        equation: ["Power", "P = F v", "Pump power becomes a hard design trade when the vehicle is small."],
      },
      {
        id: "electron-first-stage",
        name: "Carbon first stage",
        type: "Booster",
        height: 10.7,
        r0: 0.6,
        r1: 0.6,
        color: "#202832",
        accent: "#5df2c1",
        description:
          "A lightweight carbon-composite tank structure keeps dry mass down so a small rocket can still reach orbit.",
        stats: { Material: "Carbon composite", Diameter: "1.2 m", Role: "Booster" },
        equation: ["Mass ratio", "m0 / mf", "Small launchers are unforgiving: every kilogram of dry mass takes a bite out of payload."],
      },
      {
        id: "electron-battery",
        name: "Battery hot-swap bay",
        type: "Power system",
        height: 1.4,
        r0: 0.6,
        r1: 0.6,
        color: "#2f4054",
        accent: "#f6b14a",
        description:
          "Batteries drive the pumps; shedding depleted packs later improves performance.",
        stats: { System: "Pump power", Action: "Mass drop", Role: "Efficiency" },
        equation: ["Staging logic", "drop dead mass", "Even batteries can become staged mass once they have done their work."],
      },
      {
        id: "electron-kick-stage",
        name: "Curie kick stage",
        type: "Precision upper stage",
        height: 2.3,
        r0: 0.52,
        r1: 0.35,
        color: "#dce7ef",
        accent: "#8fddff",
        description:
          "The kick stage performs fine orbit shaping, letting small payloads reach tailored inclinations and altitudes.",
        stats: { Job: "Orbit trimming", Payloads: "Small satellites", Role: "Precision delivery" },
        equation: ["Orbital energy", "epsilon = v^2/2 - mu/r", "Small burns can make large differences in final orbital geometry."],
      },
      {
        id: "electron-fairing",
        name: "Tiny payload fairing",
        type: "Payload protection",
        height: 3.8,
        r0: 0.58,
        r1: 0.16,
        color: "#eef5ff",
        accent: "#94a8bf",
        description:
          "The fairing protects small satellites from acoustic load and heating, then opens once the air thins.",
        stats: { Payload: "Smallsat", Shape: "Low area", Role: "Protection" },
        equation: ["Drag area", "D proportional to A", "A tiny diameter keeps drag area low but limits payload volume."],
      },
    ],
  },
  {
    id: "sls",
    name: "SLS Block 1",
    mission: "Artemis crew and deep-space cargo",
    family: "Government super heavy",
    heightM: 98,
    diameterM: 8.4,
    thrustMN: 39.1,
    payload: "27 t to TLI",
    defaultPayloadT: 27,
    maxPayloadT: 95,
    dryMassT: 188,
    propellantT: 2600,
    ispS: 366,
    dragAreaM2: 70,
    targetDeltaVMps: 10600,
    stageGain: 1.43,
    era: "2020s",
    summary:
      "A heavy-lift Artemis launcher combining Shuttle-derived engines, large solid boosters, and Orion crew systems.",
    operator: "NASA",
    country: "United States",
    status: "Operational",
    lessonFocus: "Deep-space crew lesson: Shuttle-derived engines, giant solids, cryogenic stages, and Orion safety systems close a lunar mission.",
    sourceUrl: "https://www.nasa.gov/reference/space-launch-system",
    parts: [
      {
        id: "rs-25-engines",
        name: "Four RS-25 engines",
        type: "Hydrogen propulsion",
        height: 6.2,
        r0: 4.1,
        r1: 3.8,
        color: "#596574",
        accent: "#8fddff",
        description:
          "High-performance hydrogen engines start on the ground and burn with the core through the first long ascent phase.",
        stats: { Engines: "4 x RS-25", Propellant: "LH2 / LOX", Role: "Core thrust" },
        equation: ["Efficiency", "dv = Isp g0 ln(m0/mf)", "Higher Isp helps when the mission needs deep-space injection."],
      },
      {
        id: "sls-boosters",
        name: "Five-segment solid boosters",
        type: "Side boosters",
        height: 54,
        r0: 2.1,
        r1: 2.1,
        color: "#f2f5f7",
        accent: "#1a1f27",
        description:
          "Large solid boosters give the stack the thrust spike needed to leave the pad with a lunar mission mass.",
        stats: { Count: "2", Segments: "5 each", Role: "Liftoff thrust" },
        equation: ["Thrust margin", "T/W > 1", "A heavy lunar stack needs large initial thrust even with efficient core engines."],
      },
      {
        id: "sls-core",
        name: "Core stage",
        type: "Cryogenic booster",
        height: 64.6,
        r0: 4.2,
        r1: 4.2,
        color: "#d97934",
        accent: "#f8c579",
        description:
          "The orange core contains hydrogen and oxygen tanks and carries the structural loads between engines, boosters, and Orion.",
        stats: { Tanks: "LH2 + LOX", Diameter: "8.4 m", Role: "Main stage" },
        equation: ["Load path", "sigma = F/A", "The core is both a tank and the central structural spine."],
      },
      {
        id: "icps",
        name: "Interim cryogenic stage",
        type: "Upper stage",
        height: 13.7,
        r0: 2.55,
        r1: 2.25,
        color: "#e8edf4",
        accent: "#5df2c1",
        description:
          "The upper stage performs the translunar injection burn after the core and boosters are gone.",
        stats: { Engine: "RL10 class", Job: "TLI", Role: "Deep-space push" },
        equation: ["Oberth effect", "burn when fast", "Energy gained from a burn depends strongly on where and how fast the vehicle is moving."],
      },
      {
        id: "orion-crew-module",
        name: "Orion and abort tower",
        type: "Crew vehicle",
        height: 9.5,
        r0: 2.4,
        r1: 0.25,
        color: "#cfd8df",
        accent: "#ff6b6b",
        description:
          "The Orion stack carries crew beyond low Earth orbit and includes launch abort hardware for early-flight safety.",
        stats: { Crew: "Deep-space", Safety: "Abort tower", Role: "Artemis mission" },
        equation: ["Entry heating", "heat rate rises with v", "Returning from lunar speed is a harder thermal problem than low Earth orbit return."],
      },
    ],
  },
  {
    id: "ariane-5",
    name: "Ariane 5",
    mission: "Dual-satellite heavy lift",
    family: "European heavy launcher",
    heightM: 53,
    diameterM: 5.4,
    thrustMN: 13.1,
    payload: "20 t to LEO",
    defaultPayloadT: 10.5,
    maxPayloadT: 21,
    dryMassT: 45,
    propellantT: 730,
    ispS: 320,
    dragAreaM2: 24,
    targetDeltaVMps: 9400,
    stageGain: 1.35,
    era: "1996-2023",
    summary:
      "A reliable heavy-lift launcher optimized for large fairings, dual payload adapters, and geostationary transfer missions.",
    operator: "ESA / Arianespace",
    country: "Europe",
    status: "Retired",
    lessonFocus: "Commercial GTO lesson: large fairings, dual payloads, solid boosters, and hydrogen stages made Ariane 5 a market workhorse.",
    sourceUrl: "https://www.esa.int/Enabling_Support/Space_Transportation/Launch_vehicles/Ariane_5",
    parts: [
      {
        id: "vulcain-engine",
        name: "Vulcain engine",
        type: "Hydrogen propulsion",
        height: 4.3,
        r0: 2.4,
        r1: 2.1,
        color: "#596574",
        accent: "#8fddff",
        description:
          "The core engine burns hydrogen and oxygen while the solid boosters provide most early thrust.",
        stats: { Engine: "Vulcain", Propellant: "LH2 / LOX", Role: "Core burn" },
        equation: ["Isp", "efficiency matters late", "The hydrogen core keeps accelerating after the solid boosters separate."],
      },
      {
        id: "ariane-boosters",
        name: "Twin solid boosters",
        type: "Side boosters",
        height: 31.6,
        r0: 1.55,
        r1: 1.35,
        color: "#eef4f8",
        accent: "#1a1f27",
        description:
          "Two large solids provide the high liftoff thrust needed for big commercial payloads.",
        stats: { Count: "2", Propellant: "Solid", Role: "Boost phase" },
        equation: ["Impulse", "J = F dt", "Boosters front-load impulse so the core can be efficient rather than gigantic."],
      },
      {
        id: "ariane-core",
        name: "Cryogenic core",
        type: "Core stage",
        height: 30.5,
        r0: 2.7,
        r1: 2.7,
        color: "#f2f5f7",
        accent: "#5df2c1",
        description:
          "The core holds cryogenic propellant and carries the launcher through booster separation.",
        stats: { Diameter: "5.4 m", Tanks: "LH2 + LOX", Role: "Sustainer" },
        equation: ["Mass fraction", "payload depends on dry mass", "A clean core design keeps the payload fraction useful."],
      },
      {
        id: "ariane-upper-stage",
        name: "ESC-A upper stage",
        type: "Upper stage",
        height: 9.7,
        r0: 2.5,
        r1: 2.0,
        color: "#dce7ef",
        accent: "#f6b14a",
        description:
          "The upper stage places heavy satellites into transfer orbits after the lower stack has done the atmosphere work.",
        stats: { Mission: "GTO", Engine: "HM7B class", Role: "Orbit transfer" },
        equation: ["Energy budget", "higher orbit needs more energy", "Geostationary transfer favors upper-stage efficiency and payload volume."],
      },
      {
        id: "ariane-fairing",
        name: "Large payload fairing",
        type: "Payload protection",
        height: 12.7,
        r0: 2.7,
        r1: 0.45,
        color: "#e8edf4",
        accent: "#94a8bf",
        description:
          "The fairing encloses one or two satellites and separates after the atmosphere no longer threatens them.",
        stats: { Volume: "Dual payload", Opens: "Two halves", Role: "Commercial payload" },
        equation: ["Acoustic load", "pressure waves stress payloads", "Fairings protect delicate spacecraft from launch acoustics and airflow."],
      },
    ],
  },
  {
    id: "lvm3",
    name: "LVM3",
    mission: "Indian heavy-lift launcher",
    family: "ISRO heavy lift",
    heightM: 43.5,
    diameterM: 4,
    thrustMN: 10.4,
    payload: "8 t to LEO",
    defaultPayloadT: 4,
    maxPayloadT: 8,
    dryMassT: 39,
    propellantT: 600,
    ispS: 285,
    dragAreaM2: 18,
    targetDeltaVMps: 9300,
    stageGain: 1.3,
    era: "2014-present",
    summary:
      "India's three-stage heavy launcher uses two large solid boosters, a liquid core, and a cryogenic upper stage for crew and satellite missions.",
    operator: "ISRO",
    country: "India",
    status: "Operational",
    lessonFocus: "Propellant sequencing lesson: solid boosters, liquid core steering, and cryogenic upper-stage efficiency divide the mission by phase.",
    sourceUrl: "https://www.isro.gov.in/Launchers.html",
    parts: [
      {
        id: "lvm3-s200-nozzles",
        name: "S200 booster nozzles",
        type: "Solid propulsion",
        height: 4.2,
        r0: 2.2,
        r1: 1.8,
        color: "#2d333d",
        accent: "#ff9c3d",
        description:
          "Two massive solid boosters provide the liftoff impulse that gets the vehicle moving before the liquid core takes over.",
        stats: { Boosters: "2 x S200", Propellant: "Solid", Role: "Pad thrust" },
        equation: ["Impulse", "J = integral F dt", "Large solid boosters deliver a strong early impulse when gravity losses are most punishing."],
      },
      {
        id: "lvm3-boosters",
        name: "Twin S200 boosters",
        type: "Side boosters",
        height: 25,
        r0: 1.6,
        r1: 1.45,
        color: "#eef4f8",
        accent: "#f6b14a",
        description:
          "The side boosters burn first and carry most of the initial acceleration load, then separate once their propellant is spent.",
        stats: { Count: "2", Separation: "Boost phase", Role: "Early acceleration" },
        equation: ["Thrust-to-weight", "T/W > 1", "Heavy payloads need enough starting thrust to beat weight before speed has built up."],
      },
      {
        id: "lvm3-core",
        name: "L110 liquid core",
        type: "Core stage",
        height: 21.4,
        r0: 2,
        r1: 2,
        color: "#dce7ef",
        accent: "#5df2c1",
        description:
          "The liquid core continues the ascent after booster separation and shapes the trajectory with throttleable engines.",
        stats: { Engines: "Vikas class", Propellant: "UH25 / N2O4", Role: "Sustainer" },
        equation: ["Control", "tau = r x F", "Throttleable liquid engines give the guidance system finer control than solids."],
      },
      {
        id: "lvm3-cryogenic",
        name: "C25 cryogenic stage",
        type: "Upper stage",
        height: 13.5,
        r0: 2,
        r1: 1.72,
        color: "#f2f5f7",
        accent: "#8fddff",
        description:
          "The hydrogen-oxygen upper stage finishes orbital insertion with higher efficiency after the dense atmosphere is gone.",
        stats: { Propellant: "LH2 / LOX", Job: "Orbit insertion", Role: "Efficient upper burn" },
        equation: ["Specific impulse", "Isp high = more dv", "Cryogenic upper stages are efficient, which matters most late in flight."],
      },
      {
        id: "lvm3-fairing",
        name: "Payload fairing",
        type: "Payload protection",
        height: 7.5,
        r0: 2,
        r1: 0.36,
        color: "#e8edf4",
        accent: "#94a8bf",
        description:
          "The fairing covers satellites or crew hardware until air pressure and heating fall enough for separation.",
        stats: { Payload: "Crew/satellite", Opens: "Upper atmosphere", Role: "Protect payload" },
        equation: ["Payload mass", "m0 = dry + prop + payload", "Payload mass sits at the top and directly reduces the delta-v margin."],
      },
    ],
  },
  createReferenceRocket({
    id: "new-glenn",
    name: "New Glenn",
    mission: "Blue Origin reusable heavy lift",
    family: "Heavy reusable launcher",
    heightM: 98,
    diameterM: 7,
    thrustMN: 17.1,
    payload: "45 t to LEO",
    defaultPayloadT: 28,
    maxPayloadT: 45,
    dryMassT: 150,
    propellantT: 1150,
    ispS: 340,
    stageGain: 1.42,
    era: "2025-present",
    reusable: true,
    boosters: 0,
    propellant: "methalox + hydrolox",
    engineName: "Seven BE-4 engines",
    engineStat: "7 x BE-4",
    firstStageName: "Reusable 7 m booster",
    upperStageName: "Hydrogen upper stage",
    summary: "Blue Origin's large reusable booster pairs a high-volume fairing with heavy LEO and GTO capability.",
    engineDescription: "BE-4 engines burn methane and oxygen, trading high thrust with reusable booster operations.",
    firstStageDescription: "The large first stage is designed to return and land while still carrying heavy payloads to orbit.",
    upperDescription: "A hydrogen upper stage gives efficient high-energy insertion after the reusable booster separates.",
    operator: "Blue Origin",
    country: "United States",
    status: "Operational debut",
    lessonFocus: "A reusable heavy-lift case: huge diameter reduces packaging pain, but return reserve and dry mass reshape the mission.",
    sourceUrl: "https://www.blueorigin.com/new-glenn",
  }),
  createReferenceRocket({
    id: "neutron",
    name: "Neutron",
    mission: "Rocket Lab medium reusable launcher",
    family: "Reusable medium lift",
    heightM: 43,
    diameterM: 7,
    thrustMN: 7.5,
    payload: "13 t to LEO",
    defaultPayloadT: 8,
    maxPayloadT: 13,
    dryMassT: 54,
    propellantT: 430,
    ispS: 330,
    stageGain: 1.35,
    era: "In development",
    reusable: true,
    propellant: "methalox",
    engineName: "Archimedes engines",
    engineStat: "9 sea-level",
    firstStageName: "Reusable carbon-composite first stage",
    upperStageName: "Light upper stage",
    fairingName: "Hungry Hippo fairing",
    summary: "Rocket Lab's Neutron is a reusable medium launcher built around an integrated fairing and carbon-composite structure.",
    firstStageDescription: "The first stage keeps the fairing attached and returns, making fairing recovery part of the vehicle architecture.",
    operator: "Rocket Lab",
    country: "United States / New Zealand",
    status: "In development",
    lessonFocus: "Reusable fairing architecture teaches that recovery can be designed into the body, not bolted on after.",
    sourceUrl: "https://www.rocketlabusa.com/launch/neutron/",
  }),
  createReferenceRocket({
    id: "vulcan-centaur",
    name: "Vulcan Centaur",
    mission: "ULA high-energy mission workhorse",
    family: "Heavy expendable launcher",
    heightM: 61.6,
    diameterM: 5.4,
    thrustMN: 10.4,
    payload: "27.2 t to LEO",
    defaultPayloadT: 16,
    maxPayloadT: 27.2,
    dryMassT: 82,
    propellantT: 610,
    ispS: 345,
    stageGain: 1.46,
    era: "2024-present",
    boosters: 6,
    propellant: "methalox + hydrolox",
    engineName: "Two BE-4 engines",
    engineStat: "2 x BE-4",
    boosterName: "GEM 63XL solids",
    firstStageName: "Vulcan booster",
    upperStageName: "Centaur V upper stage",
    summary: "ULA's Vulcan Centaur combines a BE-4 first stage, optional solids, and a long-duration Centaur V upper stage for complex orbits.",
    operator: "ULA",
    country: "United States",
    status: "Operational",
    lessonFocus: "Configuration lesson: solids change the same core into a different lift class, while Centaur handles high-energy precision.",
    sourceUrl: "https://www.ulalaunch.com/rockets/vulcan-centaur",
  }),
  createReferenceRocket({
    id: "ariane-6",
    name: "Ariane 6",
    mission: "European modular launcher",
    family: "Modular heavy launcher",
    heightM: 63,
    diameterM: 5.4,
    thrustMN: 13.6,
    payload: "21.6 t to LEO",
    defaultPayloadT: 11.5,
    maxPayloadT: 21.6,
    dryMassT: 90,
    propellantT: 820,
    ispS: 320,
    stageGain: 1.36,
    era: "2024-present",
    boosters: 4,
    propellant: "hydrolox + solids",
    engineName: "Vulcain 2.1 engine",
    engineStat: "1 core + boosters",
    boosterName: "P120/P160 solids",
    firstStageName: "Cryogenic core stage",
    upperStageName: "Restartable Vinci upper stage",
    summary: "Ariane 6 is Europe's modular launcher, using two or four solid boosters and a restartable upper stage for flexible missions.",
    operator: "ESA / Arianespace",
    country: "Europe",
    status: "Operational",
    lessonFocus: "Modularity lesson: two or four boosters let the same vehicle target different payload classes.",
    sourceUrl: "https://www.esa.int/Enabling_Support/Space_Transportation/Launch_vehicles/Ariane_6",
  }),
  createReferenceRocket({
    id: "h3",
    name: "H3",
    mission: "JAXA/MHI flexible flagship launcher",
    family: "Japanese heavy launcher",
    heightM: 63,
    diameterM: 5.2,
    thrustMN: 10.5,
    payload: "16 t class to LEO",
    defaultPayloadT: 8,
    maxPayloadT: 16,
    dryMassT: 70,
    propellantT: 574,
    ispS: 350,
    stageGain: 1.34,
    era: "2024-present",
    boosters: 4,
    propellant: "hydrolox + solids",
    engineName: "LE-9 engines",
    engineStat: "2 or 3 x LE-9",
    boosterName: "SRB-3 solids",
    firstStageName: "LE-9 core stage",
    upperStageName: "LE-5B-3 upper stage",
    summary: "Japan's H3 emphasizes flexible configurations, lower cost, and reliable access to GTO and other missions.",
    operator: "JAXA / MHI",
    country: "Japan",
    status: "Operational",
    lessonFocus: "Reliability and cost lesson: engine count and booster options change risk, lift, and manufacturing pressure together.",
    sourceUrl: "https://global.jaxa.jp/projects/rockets/h3/",
  }),
  createReferenceRocket({
    id: "long-march-5",
    name: "Long March 5",
    mission: "China heavy exploration launcher",
    family: "Heavy expendable launcher",
    heightM: 57,
    diameterM: 5,
    thrustMN: 10.6,
    payload: "25 t to LEO",
    defaultPayloadT: 14,
    maxPayloadT: 25,
    dryMassT: 92,
    propellantT: 775,
    ispS: 335,
    stageGain: 1.38,
    era: "2016-present",
    boosters: 4,
    propellant: "kerolox + hydrolox",
    engineName: "YF engine cluster",
    engineStat: "core + boosters",
    firstStageName: "Cryogenic core",
    upperStageName: "Hydrogen upper stage",
    summary: "Long March 5 is China's heavy-lift platform for space station modules, lunar sample return, and planetary missions.",
    operator: "CASC",
    country: "China",
    status: "Operational",
    lessonFocus: "Exploration-lift lesson: heavy modules and lunar missions force upper-stage energy and fairing-volume decisions.",
    sourceUrl: "https://www.cnsa.gov.cn/",
  }),
  createReferenceRocket({
    id: "delta-iv-heavy",
    name: "Delta IV Heavy",
    mission: "Retired ULA high-energy heavy lift",
    family: "Retired heavy launcher",
    heightM: 72,
    diameterM: 5,
    thrustMN: 9.4,
    payload: "28.8 t to LEO",
    defaultPayloadT: 14,
    maxPayloadT: 28.8,
    dryMassT: 110,
    propellantT: 680,
    ispS: 365,
    stageGain: 1.44,
    era: "2004-2024",
    boosters: 2,
    propellant: "hydrolox",
    engineName: "Three RS-68A engines",
    engineStat: "3 x RS-68A",
    boosterName: "Common booster cores",
    firstStageName: "Triple common booster core",
    upperStageName: "Delta cryogenic second stage",
    summary: "Delta IV Heavy used three hydrogen common booster cores for demanding national security and deep-space missions.",
    operator: "ULA",
    country: "United States",
    status: "Retired",
    lessonFocus: "Hydrogen brute-force lesson: high Isp helps, but large low-density tanks make the structure huge.",
    sourceUrl: "https://www.ulalaunch.com/rockets/delta-iv",
  }),
  createReferenceRocket({
    id: "atlas-v",
    name: "Atlas V",
    mission: "ULA reliable mission workhorse",
    family: "Retiring medium-heavy launcher",
    heightM: 58.3,
    diameterM: 3.81,
    thrustMN: 8.9,
    payload: "18.8 t to LEO",
    defaultPayloadT: 9,
    maxPayloadT: 18.8,
    dryMassT: 55,
    propellantT: 430,
    ispS: 340,
    stageGain: 1.37,
    era: "2002-present",
    boosters: 5,
    propellant: "kerolox + hydrolox",
    engineName: "RD-180 engine",
    engineStat: "1 dual-chamber",
    boosterName: "AJ-60/GEM solids",
    firstStageName: "Common core booster",
    upperStageName: "Centaur upper stage",
    summary: "Atlas V is a highly reliable configurable launcher with optional solids and the hydrogen Centaur upper stage.",
    operator: "ULA",
    country: "United States",
    status: "Retiring",
    lessonFocus: "A good reliability case study: one strong core, optional solids, and a high-energy hydrogen upper stage.",
    sourceUrl: "https://www.ulalaunch.com/rockets/atlas-v",
  }),
  createReferenceRocket({
    id: "new-shepard",
    name: "New Shepard",
    mission: "Blue Origin suborbital crew/cargo vehicle",
    family: "Reusable suborbital vehicle",
    heightM: 18,
    diameterM: 3.7,
    thrustMN: 0.49,
    payload: "Suborbital crew/cargo",
    defaultPayloadT: 0.35,
    maxPayloadT: 0.8,
    dryMassT: 18,
    propellantT: 38,
    ispS: 305,
    stageGain: 0.72,
    era: "2015-present",
    reusable: true,
    propellant: "hydrolox",
    engineName: "BE-3PM engine",
    engineStat: "1 x BE-3PM",
    firstStageName: "Reusable booster",
    upperStageName: "Crew capsule",
    fairingName: "Escape-capable capsule",
    summary: "New Shepard is a reusable suborbital system, useful for teaching the difference between crossing space and reaching orbit.",
    operator: "Blue Origin",
    country: "United States",
    status: "Operational",
    lessonFocus: "Perfect contrast vehicle: it reaches space, but it does not build the sideways velocity required for orbit.",
    sourceUrl: "https://www.blueorigin.com/new-shepard",
  }),
  createReferenceRocket({
    id: "firefly-alpha",
    name: "Firefly Alpha",
    mission: "Small-sat launcher",
    family: "Commercial small lift",
    heightM: 29.5,
    diameterM: 1.82,
    thrustMN: 0.736,
    payload: "1.03 t to LEO",
    defaultPayloadT: 0.75,
    maxPayloadT: 1.03,
    dryMassT: 9.5,
    propellantT: 45,
    ispS: 300,
    stageGain: 1.18,
    era: "2021-present",
    propellant: "kerolox",
    engineName: "Reaver engine cluster",
    engineStat: "4 x Reaver",
    firstStageName: "Carbon-composite first stage",
    upperStageName: "Lightning upper stage",
    summary: "Firefly Alpha sits between tiny launchers and Falcon-class vehicles, showing why small payload class still demands real orbital velocity.",
    operator: "Firefly Aerospace",
    country: "United States",
    status: "Operational",
    lessonFocus: "Small rockets still need nearly the same orbital speed; payload class changes mass, not the target velocity.",
    sourceUrl: "https://fireflyspace.com/alpha/",
  }),
  createReferenceRocket({
    id: "terran-r",
    name: "Terran R",
    mission: "Reusable medium-heavy launcher",
    family: "Reusable commercial launcher",
    heightM: 82,
    diameterM: 5.5,
    thrustMN: 14,
    payload: "23.5 t to LEO",
    defaultPayloadT: 14,
    maxPayloadT: 23.5,
    dryMassT: 82,
    propellantT: 860,
    ispS: 340,
    stageGain: 1.38,
    era: "In development",
    reusable: true,
    propellant: "methalox",
    engineName: "Aeon R engines",
    engineStat: "13 x Aeon R",
    firstStageName: "Reusable first stage",
    upperStageName: "Methalox upper stage",
    summary: "Terran R is a planned reusable methalox vehicle, useful for reuse tradeoffs and manufacturing architecture lessons.",
    operator: "Relativity Space",
    country: "United States",
    status: "In development",
    lessonFocus: "Reuse and manufacturability compete with dry mass; the lab can show why a clean architecture still needs mass ratio.",
    sourceUrl: "https://www.relativityspace.com/terran-r",
  }),
  createReferenceRocket({
    id: "antares-330",
    name: "Antares 330",
    mission: "Cargo launcher for Cygnus-class missions",
    family: "Medium expendable launcher",
    heightM: 42.5,
    diameterM: 3.9,
    thrustMN: 3.8,
    payload: "8 t class to LEO",
    defaultPayloadT: 5.5,
    maxPayloadT: 8,
    dryMassT: 42,
    propellantT: 270,
    ispS: 315,
    stageGain: 1.24,
    era: "In development",
    propellant: "kerolox + solids",
    engineName: "Miranda-class first stage engines",
    engineStat: "7 x Miranda",
    firstStageName: "New first stage",
    upperStageName: "Castor solid upper stage",
    summary: "Antares 330 represents supply-chain redesign: same mission niche, new first stage, different engine ecosystem.",
    operator: "Northrop Grumman / Firefly",
    country: "United States",
    status: "In development",
    lessonFocus: "Shows why launch vehicles are systems of vendors, engines, stages, and mission contracts, not just equations.",
    sourceUrl: "https://www.northropgrumman.com/space/antares-rocket",
  }),
  createReferenceRocket({
    id: "vega-c",
    name: "Vega-C",
    mission: "European light launcher",
    family: "Light expendable launcher",
    heightM: 34.8,
    diameterM: 3.3,
    thrustMN: 4.5,
    payload: "2.3 t to LEO",
    defaultPayloadT: 1.5,
    maxPayloadT: 2.3,
    dryMassT: 20,
    propellantT: 190,
    ispS: 285,
    stageGain: 1.2,
    era: "2022-present",
    boosters: 0,
    propellant: "solid + liquid upper",
    engineName: "P120C solid first stage",
    engineStat: "solid stack",
    firstStageName: "P120C first stage",
    upperStageName: "AVUM+ upper module",
    summary: "Vega-C is a compact European launcher that emphasizes solid-stage sequencing and small payload insertion.",
    operator: "ESA / Avio",
    country: "Europe",
    status: "Operational return",
    lessonFocus: "Great for staging lessons: solid stages are simple and powerful, but control and recovery options are limited.",
    sourceUrl: "https://www.esa.int/Enabling_Support/Space_Transportation/Launch_vehicles/Vega-C",
  }),
  createReferenceRocket({
    id: "pslv",
    name: "PSLV",
    mission: "ISRO polar orbit workhorse",
    family: "Reliable medium launcher",
    heightM: 44,
    diameterM: 2.8,
    thrustMN: 4.8,
    payload: "3.8 t to LEO",
    defaultPayloadT: 1.8,
    maxPayloadT: 3.8,
    dryMassT: 35,
    propellantT: 295,
    ispS: 290,
    stageGain: 1.32,
    era: "1993-present",
    boosters: 6,
    propellant: "solid + liquid",
    engineName: "Solid core + liquid stages",
    engineStat: "4-stage stack",
    boosterName: "Strap-on solids",
    firstStageName: "Solid first stage",
    upperStageName: "Fourth stage",
    summary: "PSLV is India's orbit-workhorse, using alternating solid and liquid stages for many Earth-observation and lunar missions.",
    operator: "ISRO",
    country: "India",
    status: "Operational",
    lessonFocus: "A clear architecture lesson: different propellant types can be sequenced to match different flight phases.",
    sourceUrl: "https://www.isro.gov.in/PSLV.html",
  }),
  createReferenceRocket({
    id: "proton-m",
    name: "Proton-M",
    mission: "Russian heavy expendable launcher",
    family: "Heavy expendable launcher",
    heightM: 58.2,
    diameterM: 7.4,
    thrustMN: 10.0,
    payload: "23 t to LEO",
    defaultPayloadT: 12,
    maxPayloadT: 23,
    dryMassT: 90,
    propellantT: 620,
    ispS: 315,
    stageGain: 1.34,
    era: "2001-present",
    propellant: "hypergolic",
    engineName: "RD-275 first-stage engines",
    engineStat: "6 x RD-275",
    firstStageName: "Six-engine first stage",
    upperStageName: "Briz-M upper stage",
    summary: "Proton-M is a long-running heavy launcher built around dense hypergolic propellants and high-energy upper-stage missions.",
    operator: "Khrunichev / Roscosmos",
    country: "Russia",
    status: "Retiring",
    lessonFocus: "Dense propellants shrink tanks and simplify storage, but toxicity and operations become part of the engineering trade.",
    sourceUrl: "https://www.ilslaunch.com/launch-services/proton-m/",
  }),
  createReferenceRocket({
    id: "energia",
    name: "Energia",
    mission: "Soviet super-heavy launcher",
    family: "Historic super heavy",
    heightM: 58.8,
    diameterM: 7.75,
    thrustMN: 35.1,
    payload: "100 t class to LEO",
    defaultPayloadT: 80,
    maxPayloadT: 100,
    dryMassT: 210,
    propellantT: 2140,
    ispS: 330,
    stageGain: 1.52,
    era: "1987-1988",
    boosters: 4,
    propellant: "kerolox + hydrolox",
    engineName: "RD-170 boosters + core engines",
    engineStat: "4 boosters + core",
    boosterName: "Zenit-derived boosters",
    firstStageName: "Hydrogen core",
    upperStageName: "Payload/orbiter interface",
    summary: "Energia was a short-lived Soviet super-heavy launcher designed for Buran and large payloads.",
    operator: "Soviet space program",
    country: "USSR",
    status: "Retired",
    lessonFocus: "Super-heavy architecture lesson: side boosters can carry huge liftoff loads, but integration cost dominates.",
    sourceUrl: "https://www.energia.ru/en/history/systems/vehicles/vehicle_energia.html",
  }),
  createReferenceRocket({
    id: "n1",
    name: "N1",
    mission: "Soviet lunar super-heavy attempt",
    family: "Historic moon rocket",
    heightM: 105,
    diameterM: 17,
    thrustMN: 45.4,
    payload: "95 t class to LEO",
    defaultPayloadT: 70,
    maxPayloadT: 95,
    dryMassT: 275,
    propellantT: 2470,
    ispS: 297,
    stageGain: 1.45,
    era: "1969-1972",
    propellant: "kerolox",
    engineName: "NK-15 engine cluster",
    engineStat: "30 first-stage engines",
    firstStageName: "N-1 Block A",
    upperStageName: "Lunar upper stack",
    summary: "N1 is the cautionary super-heavy case: enormous clustering, limited integrated test history, and cascading failure risk.",
    operator: "Soviet lunar program",
    country: "USSR",
    status: "Retired",
    lessonFocus: "Failure analysis goldmine: many engines can add thrust, but control, plumbing, and test coverage become the real system.",
    sourceUrl: "https://www.nasa.gov/history/the-soviet-manned-lunar-program/",
  }),
  createReferenceRocket({
    id: "long-march-2f",
    name: "Long March 2F",
    mission: "Shenzhou crew launcher",
    family: "Crew launcher",
    heightM: 58.3,
    diameterM: 3.35,
    thrustMN: 5.9,
    payload: "8.4 t to LEO",
    defaultPayloadT: 8,
    maxPayloadT: 8.4,
    dryMassT: 55,
    propellantT: 420,
    ispS: 300,
    stageGain: 1.28,
    era: "1999-present",
    boosters: 4,
    propellant: "hypergolic",
    engineName: "YF engine cluster",
    engineStat: "core + boosters",
    firstStageName: "Core stage",
    upperStageName: "Crew spacecraft interface",
    fairingName: "Launch escape tower",
    summary: "Long March 2F is China's human-spaceflight launcher, making abort, reliability, and crew safety visible design constraints.",
    operator: "CASC",
    country: "China",
    status: "Operational",
    lessonFocus: "Crew rockets add safety systems and abort geometry; payload is not just mass, it is survival architecture.",
    sourceUrl: "https://www.cnsa.gov.cn/",
  }),
  createReferenceRocket({
    id: "gslv-mk2",
    name: "GSLV Mk II",
    mission: "ISRO geosynchronous launcher",
    family: "Medium launcher",
    heightM: 49.1,
    diameterM: 2.8,
    thrustMN: 4.8,
    payload: "5 t to LEO",
    defaultPayloadT: 2.5,
    maxPayloadT: 5,
    dryMassT: 40,
    propellantT: 375,
    ispS: 316,
    stageGain: 1.31,
    era: "2001-present",
    boosters: 4,
    propellant: "solid + hypergolic + cryogenic",
    engineName: "Solid core + Vikas boosters",
    engineStat: "3-stage stack",
    firstStageName: "Solid core with liquid strap-ons",
    upperStageName: "Cryogenic upper stage",
    summary: "GSLV Mk II shows why cryogenic upper stages matter for high-energy missions beyond simple LEO insertion.",
    operator: "ISRO",
    country: "India",
    status: "Operational",
    lessonFocus: "A compact lesson in propellant evolution: solids lift, liquid stages steer, cryogenic upper stages finish energy-demanding missions.",
    sourceUrl: "https://www.isro.gov.in/GSLVmk2.html",
  }),
  createReferenceRocket({
    id: "ariane-4",
    name: "Ariane 4",
    mission: "Retired European commercial workhorse",
    family: "Historic commercial launcher",
    heightM: 58.7,
    diameterM: 3.8,
    thrustMN: 7.2,
    payload: "7.6 t class to LEO",
    defaultPayloadT: 4,
    maxPayloadT: 7.6,
    dryMassT: 52,
    propellantT: 410,
    ispS: 305,
    stageGain: 1.28,
    era: "1988-2003",
    boosters: 4,
    propellant: "hypergolic + solids",
    engineName: "Viking engine family",
    engineStat: "Core + boosters",
    firstStageName: "Configurable lower stack",
    upperStageName: "HM7B upper stage",
    summary: "Ariane 4 was a modular commercial-launch workhorse, useful for learning why configuration flexibility became a business asset.",
    operator: "Arianespace",
    country: "Europe",
    status: "Retired",
    lessonFocus: "Commercial launch lesson: matching booster configuration to payload class can be as important as maximum lift.",
    sourceUrl: "https://www.esa.int/Enabling_Support/Space_Transportation/Launch_vehicles/Ariane_4",
  }),
  createReferenceRocket({
    id: "h-iia",
    name: "H-IIA",
    mission: "Japanese high-reliability launcher",
    family: "Retired Japanese launcher",
    heightM: 53,
    diameterM: 4,
    thrustMN: 5.1,
    payload: "10 t class to LEO",
    defaultPayloadT: 5,
    maxPayloadT: 10,
    dryMassT: 42,
    propellantT: 285,
    ispS: 338,
    stageGain: 1.3,
    era: "2001-2024",
    boosters: 4,
    propellant: "hydrolox + solids",
    engineName: "LE-7A core engine",
    engineStat: "LE-7A + SRBs",
    boosterName: "SRB-A solids",
    firstStageName: "Hydrogen core stage",
    upperStageName: "LE-5B upper stage",
    summary: "H-IIA was Japan's dependable workhorse before H3, combining a hydrolox core with optional solids.",
    operator: "JAXA / MHI",
    country: "Japan",
    status: "Retired",
    lessonFocus: "Reliability transition lesson: H-IIA shows how proven hydrolox architecture gave way to H3's cost and flexibility goals.",
    sourceUrl: "https://global.jaxa.jp/projects/rockets/h2a/",
  }),
  createReferenceRocket({
    id: "h-iib",
    name: "H-IIB",
    mission: "HTV cargo launcher",
    family: "Retired cargo launcher",
    heightM: 56.6,
    diameterM: 5.2,
    thrustMN: 10.2,
    payload: "16.5 t to LEO",
    defaultPayloadT: 8,
    maxPayloadT: 16.5,
    dryMassT: 60,
    propellantT: 465,
    ispS: 338,
    stageGain: 1.31,
    era: "2009-2020",
    boosters: 4,
    propellant: "hydrolox + solids",
    engineName: "Twin LE-7A engines",
    engineStat: "2 x LE-7A",
    boosterName: "SRB-A solids",
    firstStageName: "Wide hydrolox core",
    upperStageName: "LE-5B upper stage",
    summary: "H-IIB scaled Japan's launch architecture for HTV cargo missions to the International Space Station.",
    operator: "JAXA / MHI",
    country: "Japan",
    status: "Retired",
    lessonFocus: "Scaling lesson: widening the core and adding engine thrust helps cargo lift, but structural mass and integration grow too.",
    sourceUrl: "https://global.jaxa.jp/projects/rockets/h2b/",
  }),
  createReferenceRocket({
    id: "epsilon-s",
    name: "Epsilon S",
    mission: "Japanese solid small launcher",
    family: "Solid small launcher",
    heightM: 27.2,
    diameterM: 2.6,
    thrustMN: 2.3,
    payload: "0.6 t class to LEO",
    defaultPayloadT: 0.45,
    maxPayloadT: 0.6,
    dryMassT: 12,
    propellantT: 95,
    ispS: 285,
    stageGain: 1.18,
    era: "In development",
    propellant: "solid + liquid kick",
    engineName: "Solid motor stack",
    engineStat: "3 solid stages",
    firstStageName: "Solid first stage",
    upperStageName: "Kick stage",
    summary: "Epsilon S is Japan's small-launch path, emphasizing solid-stage operations and responsive payload delivery.",
    operator: "JAXA / IHI Aerospace",
    country: "Japan",
    status: "In development",
    lessonFocus: "Solid launcher lesson: fast operations and simpler motors help responsiveness, but throttling and abort flexibility shrink.",
    sourceUrl: "https://global.jaxa.jp/projects/rockets/epsilon/",
  }),
  createReferenceRocket({
    id: "nuri",
    name: "Nuri KSLV-II",
    mission: "Korean orbital launcher",
    family: "National medium launcher",
    heightM: 47.2,
    diameterM: 3.5,
    thrustMN: 3.0,
    payload: "2.6 t to LEO",
    defaultPayloadT: 1.5,
    maxPayloadT: 2.6,
    dryMassT: 36,
    propellantT: 170,
    ispS: 300,
    stageGain: 1.24,
    era: "2021-present",
    propellant: "kerolox",
    engineName: "KRE-075 engine cluster",
    engineStat: "4 + 1 engines",
    firstStageName: "Four-engine first stage",
    upperStageName: "Third-stage insertion",
    summary: "Nuri is South Korea's domestically developed orbital launcher, useful for national capability and engine-clustering lessons.",
    operator: "KARI",
    country: "South Korea",
    status: "Operational",
    lessonFocus: "Capability-building lesson: an orbital rocket is also an engine, test, guidance, and manufacturing ecosystem.",
    sourceUrl: "https://www.kari.re.kr/eng/76/img/R/KSLV2?pageIndex=22",
  }),
  createReferenceRocket({
    id: "sslv",
    name: "SSLV",
    mission: "ISRO small-satellite launcher",
    family: "Responsive small launcher",
    heightM: 34,
    diameterM: 2,
    thrustMN: 2.4,
    payload: "0.5 t to LEO",
    defaultPayloadT: 0.35,
    maxPayloadT: 0.5,
    dryMassT: 13,
    propellantT: 105,
    ispS: 285,
    stageGain: 1.16,
    era: "2022-present",
    propellant: "solid + liquid trim",
    engineName: "Three solid stages",
    engineStat: "solid stack",
    firstStageName: "Solid booster stack",
    upperStageName: "Velocity trimming module",
    summary: "SSLV targets low-cost small-satellite launch with solid stages and a velocity-trimming module.",
    operator: "ISRO",
    country: "India",
    status: "Operational",
    lessonFocus: "Responsive launch lesson: solid stages simplify readiness, while the final trim stage fixes orbital precision.",
    sourceUrl: "https://www.isro.gov.in/SSLV.html",
  }),
  createReferenceRocket({
    id: "angara-a5",
    name: "Angara A5",
    mission: "Russian modular heavy launcher",
    family: "Modular heavy launcher",
    heightM: 55.4,
    diameterM: 8.9,
    thrustMN: 9.6,
    payload: "24.5 t to LEO",
    defaultPayloadT: 13,
    maxPayloadT: 24.5,
    dryMassT: 88,
    propellantT: 680,
    ispS: 311,
    stageGain: 1.34,
    era: "2014-present",
    boosters: 4,
    propellant: "kerolox + hydrolox upper",
    engineName: "RD-191 module engines",
    engineStat: "5 universal modules",
    boosterName: "Universal rocket modules",
    firstStageName: "URM cluster",
    upperStageName: "High-energy upper stage",
    summary: "Angara A5 uses clustered universal rocket modules to scale a common kerolox architecture into heavy lift.",
    operator: "Khrunichev / Roscosmos",
    country: "Russia",
    status: "Operational",
    lessonFocus: "Modularity lesson: repeated booster modules can reduce design variety while making coupled-core loads harder.",
    sourceUrl: "https://www.roscosmos.ru/473/",
  }),
  createReferenceRocket({
    id: "firefly-mlv",
    name: "Firefly MLV",
    mission: "Medium launch vehicle",
    family: "Commercial medium lift",
    heightM: 55,
    diameterM: 4.3,
    thrustMN: 7.2,
    payload: "16 t class to LEO",
    defaultPayloadT: 9,
    maxPayloadT: 16,
    dryMassT: 62,
    propellantT: 520,
    ispS: 315,
    stageGain: 1.34,
    era: "In development",
    propellant: "kerolox",
    engineName: "Miranda engines",
    engineStat: "7 first-stage engines",
    firstStageName: "Miranda-powered booster",
    upperStageName: "Restartable upper stage",
    summary: "Firefly MLV is a medium-lift architecture intended to bridge Alpha-class small launch and larger commercial payloads.",
    operator: "Firefly Aerospace / Northrop Grumman",
    country: "United States",
    status: "In development",
    lessonFocus: "Market-fit lesson: medium lift is about payload mass, cadence, cost, and existing mission demand, not just maximum thrust.",
    sourceUrl: "https://fireflyspace.com/mlv/",
  }),
  createReferenceRocket({
    id: "nova",
    name: "Nova",
    mission: "Stoke fully reusable launcher",
    family: "Reusable medium launcher",
    heightM: 38,
    diameterM: 4.5,
    thrustMN: 5.6,
    payload: "5 t class to LEO",
    defaultPayloadT: 3,
    maxPayloadT: 5,
    dryMassT: 48,
    propellantT: 310,
    ispS: 340,
    stageGain: 1.26,
    era: "In development",
    reusable: true,
    propellant: "methalox + hydrolox",
    engineName: "Reusable booster engines",
    engineStat: "clustered first stage",
    firstStageName: "Reusable booster",
    upperStageName: "Reusable actively cooled upper stage",
    summary: "Stoke's Nova concept focuses on full reusability, including a reusable second stage with a heat-shield/engine architecture.",
    operator: "Stoke Space",
    country: "United States",
    status: "In development",
    lessonFocus: "Full-reuse lesson: recovering the upper stage is much harder because it reaches orbital energy and re-entry heating.",
    sourceUrl: "https://www.stokespace.com/nova",
  }),
  createReferenceRocket({
    id: "rfa-one",
    name: "RFA One",
    mission: "European commercial small launcher",
    family: "Commercial small lift",
    heightM: 30,
    diameterM: 2,
    thrustMN: 1.0,
    payload: "1.3 t to LEO",
    defaultPayloadT: 0.8,
    maxPayloadT: 1.3,
    dryMassT: 18,
    propellantT: 120,
    ispS: 310,
    stageGain: 1.2,
    era: "In development",
    propellant: "kerolox",
    engineName: "Helix engine cluster",
    engineStat: "9 first-stage engines",
    firstStageName: "Clustered first stage",
    upperStageName: "Orbital stage",
    summary: "RFA One is a European commercial small launcher built around clustered staged-combustion kerolox engines.",
    operator: "Rocket Factory Augsburg",
    country: "Germany / Europe",
    status: "In development",
    lessonFocus: "Small-launch business lesson: a narrow vehicle still needs orbital speed, so cost and operations matter as much as physics.",
    sourceUrl: "https://www.rfa.space/rfa-one",
  }),
  createReferenceRocket({
    id: "skyrora-xl",
    name: "Skyrora XL",
    mission: "UK small orbital launcher",
    family: "Commercial small lift",
    heightM: 23,
    diameterM: 2.2,
    thrustMN: 0.7,
    payload: "0.315 t to LEO",
    defaultPayloadT: 0.2,
    maxPayloadT: 0.315,
    dryMassT: 14,
    propellantT: 56,
    ispS: 300,
    stageGain: 1.17,
    era: "In development",
    propellant: "HTP / kerosene",
    engineName: "Ecosene engines",
    engineStat: "multi-stage",
    firstStageName: "HTP/kerosene first stage",
    upperStageName: "Small upper stages",
    summary: "Skyrora XL is a UK small-launch vehicle concept using high-test peroxide and kerosene propulsion.",
    operator: "Skyrora",
    country: "United Kingdom",
    status: "In development",
    lessonFocus: "Propellant lesson: unusual oxidizers can simplify operations but change performance, handling, and safety tradeoffs.",
    sourceUrl: "https://www.skyrora.com/skyrora-xl",
  }),
  createReferenceRocket({
    id: "miura-5",
    name: "Miura 5",
    mission: "Spanish small orbital launcher",
    family: "Commercial small lift",
    heightM: 34,
    diameterM: 2,
    thrustMN: 1.0,
    payload: "0.54 t to LEO",
    defaultPayloadT: 0.35,
    maxPayloadT: 0.54,
    dryMassT: 18,
    propellantT: 130,
    ispS: 310,
    stageGain: 1.2,
    era: "In development",
    propellant: "kerolox",
    engineName: "TEPREL-C engines",
    engineStat: "5 first-stage engines",
    firstStageName: "Reusable-aimed first stage",
    upperStageName: "Second stage",
    summary: "Miura 5 is PLD Space's small orbital launcher, extending its suborbital test experience into orbital delivery.",
    operator: "PLD Space",
    country: "Spain / Europe",
    status: "In development",
    lessonFocus: "Iteration lesson: suborbital demonstrators reduce engine and operations risk before an orbital vehicle attempt.",
    sourceUrl: "https://www.pldspace.com/en/miura-5",
  }),
  createReferenceRocket({
    id: "haste",
    name: "HASTE",
    mission: "Hypersonic test vehicle",
    family: "Suborbital test launcher",
    heightM: 18,
    diameterM: 1.2,
    thrustMN: 0.22,
    payload: "Hypersonic test payload",
    defaultPayloadT: 0.15,
    maxPayloadT: 0.7,
    dryMassT: 9,
    propellantT: 34,
    ispS: 300,
    stageGain: 0.82,
    era: "2023-present",
    propellant: "kerolox",
    engineName: "Rutherford engine cluster",
    engineStat: "Electron-derived",
    firstStageName: "Electron-derived booster",
    upperStageName: "Test payload stage",
    summary: "HASTE adapts Rocket Lab's Electron heritage for suborbital hypersonic test missions instead of orbital satellite delivery.",
    operator: "Rocket Lab",
    country: "United States / New Zealand",
    status: "Operational",
    lessonFocus: "Mission-definition lesson: the same propulsion family can serve a totally different target when orbit is not the goal.",
    sourceUrl: "https://www.rocketlabusa.com/launch/haste/",
  }),
  createReferenceRocket({
    id: "launcherone",
    name: "LauncherOne",
    mission: "Air-launched small-sat rocket",
    family: "Retired air launch",
    heightM: 21.3,
    diameterM: 1.6,
    thrustMN: 0.33,
    payload: "0.5 t to LEO",
    defaultPayloadT: 0.3,
    maxPayloadT: 0.5,
    dryMassT: 8,
    propellantT: 25,
    ispS: 320,
    stageGain: 1.12,
    era: "2020-2023",
    propellant: "kerolox",
    engineName: "Newton engines",
    engineStat: "air-launched",
    firstStageName: "Dropped first stage",
    upperStageName: "NewtonFour upper stage",
    summary: "LauncherOne used an aircraft as the first part of the launch architecture, trading pad infrastructure for air-launch constraints.",
    operator: "Virgin Orbit",
    country: "United States / United Kingdom",
    status: "Retired",
    lessonFocus: "Air-launch lesson: starting from altitude helps a little, but orbital velocity still dominates the mission budget.",
    sourceUrl: "https://virginorbit.com/",
  }),
  createReferenceRocket({
    id: "pegasus-xl",
    name: "Pegasus XL",
    mission: "Air-launched solid orbital rocket",
    family: "Air-launched small lift",
    heightM: 17.6,
    diameterM: 1.27,
    thrustMN: 0.73,
    payload: "0.44 t to LEO",
    defaultPayloadT: 0.25,
    maxPayloadT: 0.44,
    dryMassT: 5,
    propellantT: 18,
    ispS: 285,
    stageGain: 1.08,
    era: "1990-present",
    propellant: "solid",
    engineName: "Three solid stages",
    engineStat: "winged first stage",
    firstStageName: "Winged solid first stage",
    upperStageName: "Solid upper stages",
    summary: "Pegasus XL is a long-running air-launched solid rocket, useful for comparing aircraft assist with conventional pad launch.",
    operator: "Northrop Grumman",
    country: "United States",
    status: "Operational niche",
    lessonFocus: "Air-launch contrast: wings and carrier aircraft change operations, but staging and orbital velocity are still unforgiving.",
    sourceUrl: "https://www.northropgrumman.com/space/pegasus-rocket",
  }),
  createReferenceRocket({
    id: "minotaur-iv",
    name: "Minotaur IV",
    mission: "Converted solid-stage orbital launcher",
    family: "Solid medium-small lift",
    heightM: 23.9,
    diameterM: 2.34,
    thrustMN: 1.6,
    payload: "1.7 t to LEO",
    defaultPayloadT: 1,
    maxPayloadT: 1.7,
    dryMassT: 16,
    propellantT: 70,
    ispS: 286,
    stageGain: 1.16,
    era: "2010-present",
    propellant: "solid",
    engineName: "Peacekeeper-derived solids",
    engineStat: "4-stage solid",
    firstStageName: "Solid booster stack",
    upperStageName: "Orbital insertion stage",
    summary: "Minotaur IV repurposes solid rocket motor heritage for orbital missions, showing how legacy hardware shapes architecture.",
    operator: "Northrop Grumman",
    country: "United States",
    status: "Operational niche",
    lessonFocus: "Solid conversion lesson: stored-energy motors simplify readiness, but mission flexibility and throttling are limited.",
    sourceUrl: "https://www.northropgrumman.com/space/minotaur-rocket",
  }),
  createReferenceRocket({
    id: "long-march-7",
    name: "Long March 7",
    mission: "Chinese cargo and medium-lift launcher",
    family: "Medium-heavy launcher",
    heightM: 53.1,
    diameterM: 3.35,
    thrustMN: 7.2,
    payload: "13.5 t to LEO",
    defaultPayloadT: 7,
    maxPayloadT: 13.5,
    dryMassT: 64,
    propellantT: 530,
    ispS: 315,
    stageGain: 1.31,
    era: "2016-present",
    boosters: 4,
    propellant: "kerolox",
    engineName: "YF-100 engine cluster",
    engineStat: "core + 4 boosters",
    firstStageName: "Kerolox core and boosters",
    upperStageName: "Orbital upper stage",
    summary: "Long March 7 supports cargo and medium-lift missions, modernizing Chinese launch with kerolox propulsion.",
    operator: "CASC",
    country: "China",
    status: "Operational",
    lessonFocus: "Cargo launcher lesson: repeated kerolox engines and boosters make a scalable stack for station logistics.",
    sourceUrl: "https://www.cnsa.gov.cn/",
  }),
  createReferenceRocket({
    id: "long-march-8",
    name: "Long March 8",
    mission: "Chinese modular commercial launcher",
    family: "Medium launcher",
    heightM: 50.3,
    diameterM: 3.35,
    thrustMN: 4.8,
    payload: "8.4 t to LEO",
    defaultPayloadT: 4.5,
    maxPayloadT: 8.4,
    dryMassT: 52,
    propellantT: 390,
    ispS: 318,
    stageGain: 1.29,
    era: "2020-present",
    boosters: 2,
    propellant: "kerolox + hydrolox",
    engineName: "YF-100 / YF-75 stack",
    engineStat: "modular stack",
    firstStageName: "Kerolox lower stage",
    upperStageName: "Hydrogen upper stage",
    summary: "Long March 8 is a modular medium launcher aimed at flexible commercial and sun-synchronous missions.",
    operator: "CASC",
    country: "China",
    status: "Operational",
    lessonFocus: "Modularity lesson: commercial cadence often rewards a clean repeatable stack more than maximum lift.",
    sourceUrl: "https://www.cnsa.gov.cn/",
  }),
  createReferenceRocket({
    id: "zhuque-2",
    name: "Zhuque-2",
    mission: "Commercial methalox orbital launcher",
    family: "Methalox medium launcher",
    heightM: 49.5,
    diameterM: 3.35,
    thrustMN: 2.7,
    payload: "4 t class to LEO",
    defaultPayloadT: 2,
    maxPayloadT: 4,
    dryMassT: 42,
    propellantT: 220,
    ispS: 330,
    stageGain: 1.24,
    era: "2022-present",
    propellant: "methalox",
    engineName: "TQ-12 methane engines",
    engineStat: "methalox stack",
    firstStageName: "Methalox first stage",
    upperStageName: "Methalox second stage",
    summary: "Zhuque-2 is an early commercial methane-oxygen orbital vehicle, useful for comparing methalox promises across markets.",
    operator: "LandSpace",
    country: "China",
    status: "Operational",
    lessonFocus: "Methalox adoption lesson: clean reusable-friendly propellant does not remove staging, guidance, or production risk.",
    sourceUrl: "https://www.landspace.com/",
  }),
  createReferenceRocket({
    id: "astra-rocket-3",
    name: "Astra Rocket 3",
    mission: "Ultra-small launch attempt",
    family: "Retired micro launcher",
    heightM: 11.6,
    diameterM: 1.32,
    thrustMN: 0.14,
    payload: "0.05 t to LEO",
    defaultPayloadT: 0.03,
    maxPayloadT: 0.05,
    dryMassT: 3.2,
    propellantT: 10,
    ispS: 285,
    stageGain: 1.02,
    era: "2020-2022",
    propellant: "kerolox",
    engineName: "Delphin engine cluster",
    engineStat: "5 small engines",
    firstStageName: "Tiny first stage",
    upperStageName: "Small upper stage",
    summary: "Astra Rocket 3 is a useful failure-and-iteration study for the harsh economics and physics of ultra-small orbital launch.",
    operator: "Astra",
    country: "United States",
    status: "Retired",
    lessonFocus: "Failure classroom: shrinking a rocket makes operations cheaper, but margins, payload, and guidance tolerance collapse fast.",
    sourceUrl: "https://astra.com/",
  }),
  createReferenceRocket({
    id: "mercury-redstone",
    name: "Mercury-Redstone",
    mission: "First U.S. crewed suborbital launcher",
    family: "Suborbital crew test",
    heightM: 25.3,
    diameterM: 1.78,
    thrustMN: 0.35,
    payload: "1.8 t suborbital",
    defaultPayloadT: 1.35,
    maxPayloadT: 1.8,
    dryMassT: 3.7,
    propellantT: 26.2,
    ispS: 235,
    stageGain: 0.72,
    targetDeltaVMps: 2600,
    era: "1960-1961",
    propellant: "RP-1 / LOX",
    engineName: "Rocketdyne A-7 engine",
    engineStat: "1 liquid engine",
    firstStageName: "Redstone booster",
    upperStageName: "Mercury capsule stack",
    fairingName: "Launch escape tower",
    summary: "NASA's first crewed launch vehicle was intentionally suborbital, teaching human spaceflight operations before orbital velocity.",
    engineDescription: "A single upgraded Redstone engine gave enough impulse for a ballistic spaceflight, but not orbit.",
    firstStageDescription: "The booster was derived from an Army missile and human-rated for short suborbital Mercury flights.",
    upperDescription: "The capsule and escape system were the real lesson: prove launch, microgravity, re-entry, and recovery before orbit.",
    operator: "NASA / Army Ballistic Missile Agency",
    country: "United States",
    status: "Retired",
    lessonFocus: "Suborbital contrast lesson: reaching space is not the same as building sideways orbital velocity.",
    sourceUrl: "https://www.nasa.gov/?p=97068",
  }),
  createReferenceRocket({
    id: "mercury-atlas",
    name: "Mercury-Atlas",
    mission: "First U.S. crewed orbital launcher",
    family: "Early orbital crew launcher",
    heightM: 29,
    diameterM: 3.05,
    thrustMN: 1.6,
    payload: "1.36 t crew capsule",
    defaultPayloadT: 1.36,
    maxPayloadT: 1.5,
    dryMassT: 6.1,
    propellantT: 112,
    ispS: 280,
    stageGain: 1.05,
    era: "1960-1963",
    propellant: "RP-1 / LOX",
    engineName: "Atlas booster/sustainer engines",
    engineStat: "stage-and-a-half",
    firstStageName: "Balloon-tank Atlas body",
    upperStageName: "Sustainer phase",
    fairingName: "Mercury spacecraft",
    summary: "Mercury-Atlas turned the Mercury capsule from a suborbital test article into an orbital spacecraft.",
    engineDescription: "Atlas used booster engines that dropped away while a sustainer continued burning, a stage-and-a-half approach.",
    firstStageDescription: "Thin pressure-stabilized tanks made Atlas light but operationally delicate, an excellent structural lesson.",
    upperDescription: "The sustainer phase kept accelerating after the booster package separated, pushing Mercury to orbital speed.",
    operator: "NASA",
    country: "United States",
    status: "Retired",
    lessonFocus: "Orbital leap lesson: the key difference from Redstone is not altitude, it is sideways velocity.",
    sourceUrl: "https://www.nasa.gov/mission_pages/mercury/missions/spacecraft.html",
  }),
  createReferenceRocket({
    id: "gemini-titan-ii",
    name: "Gemini-Titan II",
    mission: "Two-crew orbital operations trainer",
    family: "Crew launcher",
    heightM: 33.2,
    diameterM: 3.05,
    thrustMN: 1.9,
    payload: "3.8 t Gemini spacecraft",
    defaultPayloadT: 3.8,
    maxPayloadT: 3.8,
    dryMassT: 8.8,
    propellantT: 146,
    ispS: 300,
    stageGain: 1.14,
    era: "1964-1966",
    propellant: "hypergolic",
    engineName: "Titan II first-stage engines",
    engineStat: "2 main chambers",
    firstStageName: "Modified Titan II first stage",
    upperStageName: "Titan II second stage",
    fairingName: "Gemini spacecraft adapter",
    summary: "Gemini-Titan II bridged Mercury and Apollo by teaching rendezvous, EVA, long-duration flight, and orbital operations.",
    engineDescription: "Hypergolic engines simplified ignition but introduced toxicity and crew-rating constraints.",
    firstStageDescription: "The missile-derived first stage had to be modified to reduce vibration and meet human spaceflight requirements.",
    upperDescription: "The second stage completed orbital insertion for a larger two-person spacecraft.",
    operator: "NASA / Martin",
    country: "United States",
    status: "Retired",
    lessonFocus: "Human-rating lesson: enough thrust is not enough; vibration, abort logic, and reliability become part of the rocket.",
    sourceUrl: "https://www.nasa.gov/gemini/",
  }),
  createReferenceRocket({
    id: "delta-ii",
    name: "Delta II",
    mission: "NASA science and GPS workhorse",
    family: "Medium expendable launcher",
    heightM: 39,
    diameterM: 2.44,
    thrustMN: 2.9,
    payload: "2.7-6.0 t to LEO",
    defaultPayloadT: 3.2,
    maxPayloadT: 6,
    dryMassT: 18,
    propellantT: 215,
    ispS: 302,
    stageGain: 1.23,
    era: "1989-2018",
    boosters: 9,
    propellant: "kerolox + solids",
    engineName: "RS-27A main engine",
    engineStat: "1 core + GEMs",
    firstStageName: "Thor-derived first stage",
    boosterName: "Graphite-epoxy solid motors",
    upperStageName: "Delta-K upper stage",
    fairingName: "Mission-specific fairing",
    summary: "Delta II became a reliability icon for GPS, Mars probes, Earth science, and many medium-class missions.",
    engineDescription: "A kerosene core plus strap-on solids let one vehicle cover many payload classes.",
    firstStageDescription: "The core did not do everything alone; booster count configured the vehicle for each mission.",
    upperDescription: "The upper stage and optional solid third stage shaped final orbit energy for science missions.",
    operator: "McDonnell Douglas / Boeing / ULA",
    country: "United States",
    status: "Retired",
    lessonFocus: "Configuration lesson: medium launch is often about booster count, reliability, and mission fit rather than maximum lift.",
    sourceUrl: "https://science.nasa.gov/learn/basics-of-space-flight/chapter14-1/",
  }),
  createReferenceRocket({
    id: "titan-iv-centaur",
    name: "Titan IV Centaur",
    mission: "Heavy national-security and planetary launcher",
    family: "Heavy expendable launcher",
    heightM: 62,
    diameterM: 3.05,
    thrustMN: 14.2,
    payload: "21 t class to LEO",
    defaultPayloadT: 5.6,
    maxPayloadT: 21,
    dryMassT: 62,
    propellantT: 860,
    ispS: 315,
    stageGain: 1.38,
    era: "1989-2005",
    boosters: 2,
    propellant: "hypergolic + solids + hydrolox",
    engineName: "Titan core engines",
    engineStat: "core + 2 SRMUs",
    firstStageName: "Two-stage Titan core",
    boosterName: "Upgraded solid rocket motors",
    upperStageName: "Centaur high-energy upper stage",
    fairingName: "Large payload fairing",
    summary: "Titan IV Centaur launched demanding payloads including Cassini, showing why upper-stage energy can dominate planetary missions.",
    engineDescription: "Large solids and a hypergolic core provided brute ascent energy for heavy spacecraft.",
    firstStageDescription: "The Titan core carried high structural and operations complexity compared with later EELV vehicles.",
    upperDescription: "Centaur added high-energy hydrogen performance for deep-space payloads.",
    operator: "U.S. Air Force / Lockheed Martin",
    country: "United States",
    status: "Retired",
    lessonFocus: "Planetary payload lesson: a strong booster matters, but high-energy upper stages decide where the spacecraft can go.",
    sourceUrl: "https://science.nasa.gov/wp-content/uploads/2023/09/cassini.pdf",
  }),
  createReferenceRocket({
    id: "zenit-3sl",
    name: "Zenit-3SL",
    mission: "Equatorial Sea Launch GTO vehicle",
    family: "Sea-launched medium-heavy",
    heightM: 59.6,
    diameterM: 3.9,
    thrustMN: 7.9,
    payload: "6.1 t to GTO",
    defaultPayloadT: 5.2,
    maxPayloadT: 13.7,
    dryMassT: 38,
    propellantT: 430,
    ispS: 337,
    stageGain: 1.28,
    era: "1999-2014",
    propellant: "kerolox",
    engineName: "RD-171 first-stage engine",
    engineStat: "4 chambers",
    firstStageName: "Zenit first stage",
    upperStageName: "Block DM-SL upper stage",
    fairingName: "Commercial satellite fairing",
    summary: "Zenit-3SL launched from an ocean platform near the equator, trading maritime operations for orbital-energy advantage.",
    engineDescription: "A powerful four-chamber kerosene engine made Zenit compact for its lift class.",
    firstStageDescription: "The sea-launch architecture moved the pad to favorable latitude instead of moving the payload penalty into the rocket.",
    upperDescription: "The Block DM-SL upper stage delivered commercial satellites toward geostationary transfer orbit.",
    operator: "Sea Launch",
    country: "Ukraine / Russia / International",
    status: "Retired",
    lessonFocus: "Launch-site lesson: Earth rotation, latitude, logistics, and platform risk are part of rocket performance.",
    sourceUrl: "https://www.sea-launch.com/news/launch",
  }),
  createBuilderRocket(builderConfig),
];

const lessonTrack = [
  {
    id: "anatomy",
    title: "Rocket anatomy",
    time: "8 min",
    partHint: "s-ic",
    body: "Find the job of each section before touching the controls.",
    why: "A rocket is mostly propellant. The vehicle works by throwing mass downward fast, then dropping hardware when it becomes dead weight.",
    action: "Click parts",
  },
  {
    id: "forces",
    title: "Forces at liftoff",
    time: "7 min",
    partHint: "f1-engines",
    body: "Use T/W to decide whether the vehicle can even leave the pad.",
    why: "At liftoff, gravity is the main opponent. Once moving, drag grows with velocity squared, so the rocket throttles and steers through the air.",
    action: "Tune engines",
  },
  {
    id: "staging",
    title: "Why staging works",
    time: "9 min",
    partHint: "s-ivb",
    body: "Compare full mass to final mass and watch delta-v change.",
    why: "The rocket equation rewards mass ratio. Staging is not a trick; it is how you stop carrying empty tanks uphill.",
    action: "Move fuel",
  },
  {
    id: "guidance",
    title: "Guidance and control",
    time: "6 min",
    partHint: "grid-fins",
    body: "Make the rocket point wrong, then recover by reducing wind and error.",
    why: "Forces away from the center of mass rotate the rocket. Different phases use different control surfaces because air disappears with altitude.",
    action: "Add wind",
  },
  {
    id: "max-q",
    title: "Max-Q and structure",
    time: "6 min",
    partHint: "payload-fairing",
    body: "Follow the air-load curve and keep it below the structure limit.",
    why: "Dynamic pressure follows q = 1/2 rho v^2. Early air is dense; later speed is high. The peak occurs between those extremes.",
    action: "Break Max-Q",
  },
  {
    id: "mission",
    title: "Mission design",
    time: "10 min",
    partHint: "command-module",
    body: "Switch destination and see why the same rocket stops working.",
    why: "A launcher is an energy budget. Change the destination and you change staging, propellant margin, fairing, guidance, and abort design.",
    action: "Plan route",
  },
  {
    id: "momentum",
    title: "Momentum in space",
    time: "8 min",
    partHint: "s-ivb",
    body: "Learn why rockets keep moving in vacuum and why thrust is really momentum exchange.",
    why: "In space there is almost no air drag. A spacecraft changes motion by throwing mass one way so the vehicle gains momentum the other way.",
    action: "Impulse",
  },
  {
    id: "orbit",
    title: "Orbit is falling",
    time: "9 min",
    partHint: "payload-fairing",
    body: "Connect sideways velocity, gravity, and the shape of an orbit.",
    why: "Low Earth orbit is not escaping gravity. It is moving sideways fast enough that the fall keeps missing Earth.",
    action: "Shape path",
  },
  {
    id: "spacetime",
    title: "Space-time basics",
    time: "7 min",
    partHint: "command-module",
    body: "See gravity as curved paths and learn why clocks disagree slightly in orbit.",
    why: "Relativity is tiny for this launch, but GPS, deep-space navigation, and precise clocks must account for speed and gravity.",
    action: "Clocks",
  },
];

const lessonFallbackParts = {
  anatomy: ["s-ic", "first-stage", "super-heavy", "heavy-center-core", "falcon1-first-stage", "soyuz-core", "shuttle-external-tank", "electron-first-stage", "sls-core", "ariane-core", "lvm3-core", "builder-first-stage"],
  forces: ["f1-engines", "merlins", "heavy-merlins", "falcon1-merlin", "raptors", "rd-107", "srb-nozzles", "rutherford-engines", "rs-25-engines", "vulcain-engine", "lvm3-s200-nozzles", "builder-engines"],
  staging: ["s-ivb", "second-stage", "heavy-interstage", "falcon1-interstage", "hot-stage", "soyuz-third-stage", "electron-kick-stage", "icps", "ariane-upper-stage", "lvm3-cryogenic", "builder-upper-stage", "builder-kick-stage"],
  guidance: ["command-module", "grid-fins", "flaps", "heavy-center-core", "soyuz-spacecraft", "shuttle-orbiter", "electron-battery", "orion-crew-module", "ariane-fairing", "lvm3-fairing", "builder-fairing"],
  "max-q": ["launch-escape", "payload-fairing", "heavy-fairing", "falcon1-fairing", "ship-tanks", "soyuz-boosters", "shuttle-boosters", "electron-fairing", "sls-boosters", "ariane-boosters", "lvm3-boosters", "builder-side-boosters"],
  mission: ["command-module", "payload-fairing", "heavy-fairing", "falcon1-fairing", "payload-bay", "soyuz-spacecraft", "shuttle-orbiter", "electron-kick-stage", "orion-crew-module", "ariane-fairing", "lvm3-fairing", "builder-fairing"],
  momentum: ["s-ivb", "second-stage", "heavy-upper-stage", "falcon1-second-stage", "ship-tanks", "soyuz-third-stage", "electron-kick-stage", "icps", "ariane-upper-stage", "lvm3-cryogenic", "builder-upper-stage"],
  orbit: ["command-module", "payload-fairing", "heavy-fairing", "falcon1-fairing", "payload-bay", "soyuz-spacecraft", "shuttle-orbiter", "electron-kick-stage", "orion-crew-module", "builder-fairing"],
  spacetime: ["command-module", "payload-fairing", "heavy-fairing", "soyuz-spacecraft", "shuttle-orbiter", "orion-crew-module", "builder-fairing"],
};

const lessonDeepDive = {
  anatomy: {
    anchor: "Follow the stack from engines to payload.",
    anchorCopy: "Every tall section has a job: make thrust, store propellant, shed mass, protect the payload, or keep people alive.",
    equation: "m0 = mdry + mprop + mpayload",
    equationCopy: "The launch mass is not one thing. It is dry hardware, propellant, and payload fighting for the same budget.",
    tryTitle: "Overload the payload, then watch margin vanish.",
    tryCopy: "A small payload change high in the stack can erase a large amount of useful velocity.",
    misconception: "A rocket is not mostly engines.",
    misconceptionCopy: "Most of the vehicle is propellant and tank volume. Engines are crucial, but mass fraction decides whether the mission closes.",
    question: "If payload mass rises and fuel stays fixed, what usually drops first?",
    choices: ["Delta-v margin", "Engine thrust", "Rocket height"],
    answer: 0,
    feedback: "Correct. The engine thrust did not change; the mass ratio got worse, so useful delta-v margin drops.",
  },
  forces: {
    anchor: "Watch the engine base and the T/W number.",
    anchorCopy: "At liftoff, the rocket has to create more upward thrust than downward weight before acceleration begins.",
    equation: "Fnet = T - mg - D",
    equationCopy: "Acceleration is not thrust alone. Gravity and drag subtract from the force that actually speeds the rocket up.",
    tryTitle: "Lower fuel and payload until T/W improves.",
    tryCopy: "Less mass makes the same thrust accelerate the stack harder, but too little fuel steals delta-v later.",
    misconception: "T/W above 1 does not mean orbit is easy.",
    misconceptionCopy: "It only means the rocket can lift off. Orbit still needs a large sideways velocity budget.",
    question: "If thrust stays fixed and mass goes down, what increases immediately?",
    choices: ["Acceleration", "Atmospheric density", "Payload class"],
    answer: 0,
    feedback: "Correct. a = F / m, so lower mass gives more acceleration from the same net force.",
  },
  staging: {
    anchor: "Look for empty lower stages becoming dead weight.",
    anchorCopy: "The lower stage is valuable while full. Once empty, carrying it further punishes every later burn.",
    equation: "Δv = Isp · g0 · ln(m0 / mf)",
    equationCopy: "The logarithm rewards a better mass ratio. Staging improves that ratio by dropping hardware that has stopped helping.",
    tryTitle: "Cut fuel to make staging margin fragile.",
    tryCopy: "When propellant is low, dropping dry mass still helps, but there may not be enough energy left for insertion.",
    misconception: "Staging is not only about making the rocket shorter.",
    misconceptionCopy: "The real win is mass ratio. Empty tanks are liabilities unless they are part of a reusable recovery plan.",
    question: "Why does dropping an empty booster help the upper stage?",
    choices: ["It improves mass ratio", "It increases air density", "It lowers exhaust velocity"],
    answer: 0,
    feedback: "Correct. The remaining vehicle has less dead mass, so the same propellant produces more velocity.",
  },
  guidance: {
    anchor: "Inspect fins, flaps, gimbals, or crew/payload balance.",
    anchorCopy: "Control is about rotating the vehicle at the right time without creating too much drag or structural load.",
    equation: "τ = r × F",
    equationCopy: "A force away from the center of mass creates torque. That is how engines, fins, and flaps steer.",
    tryTitle: "Add wind and guidance error, then watch risk.",
    tryCopy: "A rocket can have enough delta-v and still fail if it points the wrong way under aerodynamic load.",
    misconception: "Guidance is not just software.",
    misconceptionCopy: "Software commands physical actuators. If fins, gimbals, or structure saturate, the vehicle can tumble.",
    question: "What does wind plus guidance error mainly increase?",
    choices: ["Tumble/abort risk", "Specific impulse", "Dry mass automatically"],
    answer: 0,
    feedback: "Correct. Off-axis airflow and delayed correction raise angle-of-attack and structural risk.",
  },
  "max-q": {
    anchor: "Watch Max-Q while velocity rises in dense air.",
    anchorCopy: "Max-Q is the moment aerodynamic pressure is worst, usually before space but after the rocket is moving fast.",
    equation: "q = 1/2 · ρ · v²",
    equationCopy: "Air load depends on density and velocity squared. Early air is dense; later speed is high; the peak is between them.",
    tryTitle: "Make drag and wind ugly, then recover it.",
    tryCopy: "Reduce drag shape or guidance error until the peak air load falls back under the structural limit.",
    misconception: "Going slower is not the whole fix.",
    misconceptionCopy: "Too slow adds gravity losses. Rockets manage Max-Q with shape, throttle, guidance, and structure.",
    question: "Why can Max-Q happen before top speed?",
    choices: ["Air density is still high", "Fuel mass is zero", "The payload has separated"],
    answer: 0,
    feedback: "Correct. Dynamic pressure peaks when the mix of density and speed is worst, not necessarily at max velocity.",
  },
  mission: {
    anchor: "Compare Orbit, Escape, Heavy, and Max-Q modes.",
    anchorCopy: "The mission changes the definition of success. A rocket that works for LEO may fail escape or heavy-payload goals.",
    equation: "mission success = margin - risk",
    equationCopy: "Real mission design balances velocity margin, payload value, structural risk, safety systems, and operational cost.",
    tryTitle: "Switch to Escape, then find the missing margin.",
    tryCopy: "Escape asks for more speed than orbit, so payload and fuel choices become much less forgiving.",
    misconception: "There is no universal best rocket.",
    misconceptionCopy: "A launcher is optimized for a mission family: crew safety, payload mass, reuse, cadence, cost, or deep-space energy.",
    question: "What changes when the destination changes from orbit to escape?",
    choices: ["Required delta-v", "The value of gravity", "Paint color"],
    answer: 0,
    feedback: "Correct. Escape needs more velocity energy, so the same vehicle may need less payload or more propellant margin.",
  },
  momentum: {
    anchor: "Watch exhaust direction and velocity.",
    anchorCopy: "The rocket gains upward/sideways momentum because exhaust gains downward/backward momentum.",
    equation: "J = F · Δt = Δp",
    equationCopy: "Impulse is force applied over time. In vacuum, that impulse changes momentum without needing air to push on.",
    tryTitle: "Change engine count and countdown duration.",
    tryCopy: "More thrust changes impulse faster, but dry mass and reliability also move.",
    misconception: "Rockets do not push against air.",
    misconceptionCopy: "They push propellant out. Conservation of momentum does the rest.",
    question: "In empty space, what lets a rocket speed up?",
    choices: ["Throwing mass backward", "Pushing on air", "Turning off gravity"],
    answer: 0,
    feedback: "Correct. Exhaust carries momentum backward, so the rocket gains momentum forward.",
  },
  orbit: {
    anchor: "Look at velocity, not just altitude.",
    anchorCopy: "Altitude gives room. Sideways velocity is what makes an orbit.",
    equation: "v_orbit ≈ sqrt(GM / r)",
    equationCopy: "Closer orbits need high sideways speed. Too little speed falls back; too much changes the orbit or escapes.",
    tryTitle: "Switch Orbit to Escape and compare goal speed.",
    tryCopy: "The destination changes the required velocity budget more than the rocket's appearance suggests.",
    misconception: "Orbit is not floating because gravity is gone.",
    misconceptionCopy: "Gravity is still strong in LEO. The vehicle is continuously falling around Earth.",
    question: "What makes low Earth orbit different from going straight up?",
    choices: ["Sideways velocity", "No gravity", "No mass"],
    answer: 0,
    feedback: "Correct. Sideways speed turns falling into an orbit.",
  },
  spacetime: {
    anchor: "Compare fast clocks and high-altitude clocks.",
    anchorCopy: "Speed slows clocks slightly; weaker gravity higher up makes clocks tick slightly faster.",
    equation: "Δt' ≈ Δt · sqrt(1 - v²/c²)",
    equationCopy: "At rocket speeds this is tiny, but navigation systems must model it carefully.",
    tryTitle: "Launch, then ask Agent about time dilation.",
    tryCopy: "Use the current velocity and altitude as the context for a beginner-level relativity explanation.",
    misconception: "Relativity is not only black holes.",
    misconceptionCopy: "GPS and deep-space navigation need relativity because tiny clock errors become large position errors.",
    question: "Which effect does high speed have on a clock?",
    choices: ["It ticks slightly slower", "It stops mass ratio", "It removes gravity"],
    answer: 0,
    feedback: "Correct. Special relativity makes a fast-moving clock tick slightly slower relative to a stationary observer.",
  },
};

const missionProfiles = {
  orbit: {
    label: "Low Earth orbit",
    icon: "O",
    shortLabel: "Orbit",
    targetDeltaVMps: 7800,
    targetAltitudeKm: 180,
    beginner: "Build mostly sideways speed so the rocket keeps falling around Earth instead of back to the pad.",
    copy: "Reach orbital speed without breaking the rocket through Max-Q.",
  },
  escape: {
    label: "Escape Earth",
    icon: "↗",
    shortLabel: "Escape",
    targetDeltaVMps: 11200,
    targetAltitudeKm: 320,
    beginner: "Go faster than a closed Earth orbit so the trajectory can leave Earth's gravity well.",
    copy: "Push beyond Earth escape velocity. Low payload and full fuel usually matter.",
  },
  heavy: {
    label: "Heavy payload",
    icon: "▣",
    shortLabel: "Payload",
    targetDeltaVMps: 7800,
    targetAltitudeKm: 160,
    payloadBoost: 1.12,
    fuelPercent: 96,
    dragFactor: 1.08,
    beginner: "Put more mass in the top payload bay and watch the delta-v margin shrink.",
    copy: "Stress the mass budget with a heavy payload and see the margin disappear.",
  },
  maxq: {
    label: "Max-Q air load",
    icon: "Q",
    shortLabel: "Airload",
    targetDeltaVMps: 7800,
    targetAltitudeKm: 140,
    windFactor: 0.78,
    guidanceError: 0.28,
    dragFactor: 1.42,
    beginner: "Make air pressure dangerous. Max-Q is the moment airflow pushes hardest on the rocket.",
    copy: "Make the atmosphere dangerous. High drag, wind, and guidance error can break the stack.",
  },
};

const trajectoryTargets = {
  moon: {
    label: "Moon transfer",
    transit: "3 days",
    deltaV: "3.2 km/s",
    window: "Daily-ish",
    windowDays: 1,
    commDelay: "1.3 s",
    landing: "Powered descent after lunar orbit insertion",
    slingshot: "Optional free-return geometry can bring the crew home if the main engine fails.",
    payloadScale: 0.34,
    copy: "Trans-lunar injection raises apogee until the spacecraft intersects the Moon's orbit. Burn too little and you stay near Earth; burn too much and arrival cleanup gets expensive.",
    prompt: "Plan a Moon transfer from low Earth orbit. Explain TLI, coast, lunar arrival, and why payload has to shrink.",
    quiz: {
      question: "Why does the Moon transfer need a correctly timed burn?",
      choices: ["The Moon must be where the spacecraft arrives", "The rocket needs air to steer", "The payload gets lighter at night"],
      answer: 0,
      feedback: "Correct. The burn aims at a future intercept point, not where the Moon is right now.",
    },
  },
  mars: {
    label: "Mars transfer",
    transit: "6-9 mo",
    deltaV: "3.6 km/s",
    window: "26 mo",
    windowDays: 780,
    commDelay: "4-22 min",
    landing: "Atmospheric entry, heat shield, parachute or lift, then powered terminal descent",
    slingshot: "Earth and Venus assists can reshape solar orbit, but they add years and navigation constraints.",
    payloadScale: 0.22,
    copy: "A Mars trajectory is a heliocentric transfer. You leave Earth with the right excess velocity, coast around the Sun, then meet Mars months later.",
    prompt: "Plan a Mars transfer. Explain launch windows, Hohmann transfer intuition, correction burns, and why life-support margin matters.",
    quiz: {
      question: "Why do Mars launch windows come roughly every 26 months?",
      choices: ["Earth and Mars need the right phase angle", "Mars disappears behind the Sun forever", "Rockets cannot launch in winter"],
      answer: 0,
      feedback: "Correct. The planets must line up so the transfer orbit meets Mars months later.",
    },
  },
  jupiter: {
    label: "Jupiter gravity-assist tour",
    transit: "2.7-6 yr",
    deltaV: "6+ km/s",
    window: "13 mo",
    windowDays: 399,
    commDelay: "33-53 min",
    landing: "No solid surface: probes survive minutes to hours under extreme pressure and heating",
    slingshot: "Gravity assists trade timing for energy, bending velocity around planets instead of spending propellant.",
    payloadScale: 0.12,
    copy: "Jupiter is a deep-space energy problem. Direct launches are punishing, so missions often combine high-energy escape with gravity assists.",
    prompt: "Plan a Jupiter trajectory. Explain C3 energy, gravity assists, long coast phases, and why the payload must be tiny.",
    quiz: {
      question: "What does a gravity assist mainly trade for extra spacecraft energy?",
      choices: ["Precise timing and geometry", "More atmospheric oxygen", "A stronger heat shield only"],
      answer: 0,
      feedback: "Correct. You borrow orbital energy through a precisely timed flyby geometry.",
    },
  },
};

const programLenses = {
  "falcon-9": {
    title: "SpaceX reuse lens",
    badge: "Falcon 9",
    cards: [
      ["Reuse trade", "Landing propellant lowers payload margin, but recovering the booster can lower marginal launch cost."],
      ["Engine cluster", "Nine Merlins add plumbing and control complexity, but give production repetition and engine-out options."],
      ["Failure watch", "Watch turbopumps, stage separation, grid-fin entry loads, landing burns, fairing separation, and soot/heat inspection."],
      ["Cost lever", "The booster, engines, fairings, and refurbishment flow dominate the learning loop more than raw propellant cost."],
    ],
  },
  "falcon-heavy": {
    title: "SpaceX heavy-reuse lens",
    badge: "Falcon Heavy",
    cards: [
      ["Coupled cores", "Three boosters solve liftoff thrust but create separation, vibration, and synchronization risk."],
      ["Center-core lesson", "The center core is hardest to recover because it flies longer, faster, and farther downrange."],
      ["Failure watch", "Watch side-booster separation, interstage timing, engine-out logic, and Max-Q loads on the wider stack."],
      ["Cost lever", "Heavy payload value comes from reusing side boosters while accepting that some missions spend more hardware."],
    ],
  },
  "falcon-1": {
    title: "SpaceX early-failure lens",
    badge: "Falcon 1",
    cards: [
      ["Small margins", "Small rockets make every kilogram, vibration mode, and staging transient matter more."],
      ["Single engine", "Simple architecture reduces part count but removes engine-out forgiveness."],
      ["Failure watch", "Look at first-stage propulsion, stage recontact, slosh, upper-stage restart, and guidance margins."],
      ["Learning lever", "Falcon 1 is the cleanest model for seeing why iteration, post-flight inspection, and failure chains matter."],
    ],
  },
  starship: {
    title: "SpaceX full-reuse lens",
    badge: "Starship",
    cards: [
      ["Materials bet", "Stainless steel accepts mass penalty for manufacturability, temperature margin, and fast iteration."],
      ["Engine risk", "Many Raptors create huge thrust and redundancy, but plumbing, ignition timing, and vibration become system-level risks."],
      ["TPS watch", "Heat-shield tile retention, flap hinges, hot-staging loads, and cryogenic prop transfer are the hard integration problems."],
      ["Cost lever", "The target is aircraft-like reuse: quick inspection, fast propellant loading, and less custom labor per flight."],
    ],
  },
  builder: {
    title: "Custom failure lab",
    badge: "Build mode",
    cards: [
      ["Architecture", "Change engines, stages, boosters, width, propellant, and reuse mode. The rocket data and 3D stack rebuild live."],
      ["Failure first", "Bad designs are useful: no liftoff, Max-Q breakup, tumble, or delta-v shortfall each teaches a different equation."],
      ["Tradeoff", "More engines help T/W, more stages help mass ratio, boosters help liftoff, and reuse adds dry mass penalty."],
      ["Learning loop", "Design, predict, launch, inspect the failure chain, then change one variable and rerun."],
    ],
  },
};

const canvas = document.querySelector("#rocketCanvas");
const graphCanvas = document.querySelector("#graphCanvas");
const graphCtx = graphCanvas.getContext("2d");
const qaMode = new URLSearchParams(window.location.search).has("qa");
let rocketScene = null;

const AGENT_PERSONALITY = `
You are the Rocket Agent Lab voice-and-chat companion.
Persona: witty, warm, technically sharp, and slightly mission-control cool. You are not a lecturer; you are the clever lab partner who notices what the student just changed.
Rocket expertise: orbital mechanics, propulsion, staging, materials, thermal protection, guidance, launch operations, and failure analysis.
Teaching style: explain what is visible on screen first, connect it to one equation or design tradeoff, then ask one useful question.
Voice style: short spoken beats, expressive but not theatrical, with clean pauses. Use playful lines sparingly, e.g. "gravity is being rude again", but never sacrifice correctness.
Companion loop: Observe -> Diagnose -> Challenge -> Wait. Do not keep talking after the learner needs to act.
Wit rule: one sharp line is allowed only when it makes the physics easier to remember. No mascot energy. No filler hype.
Correction rule: if the learner is wrong, be direct and kind: name the misconception, show the controlling variable, then give a tiny experiment.
Timing rule: never narrate a future launch event as if it already happened. Use the provided simulation time and phase.
Interaction rule: ask one useful question at a time, then wait. If the user types or speaks, answer that before continuing the lesson.
Conversation rule: remember the last few turns. If the learner answers a question, grade or respond to that answer before starting a new topic.
Scope rule: use app-provided context for exact numbers. If a number is not in context, say it is a simplified classroom estimate.
`.trim();

const voiceStyleProfiles = {
  "lab-partner": {
    label: "Witty lab partner",
    copy: "Witty expert. One observation, one reason, one next move.",
    instructions: "Voice style: quick, warm, lightly witty, and curious. Use one memorable line, then immediately return to the variable the learner can change.",
  },
  "mission-control": {
    label: "Mission control",
    copy: "Crisp launch calls with exact phase awareness.",
    instructions: "Voice style: crisp mission-control timing. Short phrases, clean pauses, no jokes during failures or launch events.",
  },
  socratic: {
    label: "Socratic coach",
    copy: "Asks one useful question before explaining too much.",
    instructions: "Voice style: Socratic tutor. Ask one targeted question, wait for the learner, and grade their answer before moving on.",
  },
  "failure-analyst": {
    label: "Failure analyst",
    copy: "Calm post-flight diagnosis and one repair move.",
    instructions: "Voice style: calm failure analyst. Name the first failed constraint, the equation behind it, and the smallest repair.",
  },
};

function currentVoiceProfile() {
  return voiceStyleProfiles[state.voiceStyle] || voiceStyleProfiles["lab-partner"];
}

let state = {
  rocketIndex: 0,
  selectedPartId: "s-ic",
  hoveredPartId: null,
  lessonIndex: 0,
  angle: -0.42,
  targetAngle: -0.42,
  pitch: 0.05,
  targetPitch: 0.05,
  focusY: 0.5,
  targetFocusY: 0.5,
  zoom: 0.92,
  dragging: false,
  dragMoved: false,
  controlDrag: null,
  lastX: 0,
  lastY: 0,
  launchClock: 0,
  lastFrameMs: 0,
  narratedEvents: new Set(),
  spin: !qaMode,
  simRunning: !qaMode,
  simTime: 0,
  missionMode: "orbit",
  launchStatus: "idle",
  flightWorkspace: "flight",
  workspaceMode: "launch",
  cameraMode: "visible",
  tutorialTimer: null,
  failure: null,
  payloadT: 48.6,
  fuelPercent: 100,
  dragFactor: 1,
  windFactor: 0.2,
  guidanceError: 0.08,
  engineHealth: 100,
  structurePercent: 100,
  heatShieldPercent: 100,
  stagingTiming: 0,
  catalogMode: "rockets",
  catalogFilter: "all",
  blueprintLayer: "structure",
  blueprintView: "front",
  draftTool: "draw",
  sketching: false,
  sketchLast: null,
  lastSketchSound: 0,
  placedBlueprintParts: [],
  failureLog: [],
  destination: "moon",
  windowOffsetDays: 0,
  correctionPercent: 50,
  landingSite: "safe",
  trajectoryQuizAnswer: null,
  rehearsalAnswer: null,
  rehearsalSeed: 0,
  lastCoachFocus: "",
  lastCopilotFocus: "",
  lastCopilotAt: 0,
  copilotLine: "",
  copilotDetail: "",
  copilotState: "nominal",
  controlFocus: null,
  controlPulse: 0,
  particles: [],
  blastParticles: [],
  cuePulse: 0,
  explode: false,
  cutaway: false,
  showLabels: false,
  labelDensity: "focus",
  scale: true,
  baseline: null,
  engineeringSignature: "",
  workspaceInfoDetail: "",
  agentBusy: false,
  voiceEnabled: false,
  voiceAutoNarrate: false,
  voiceListening: false,
  voicePlaying: false,
  voiceRealtimeConnecting: false,
  voiceRealtimeConnected: false,
  voiceRealtimePc: null,
  voiceRealtimeDc: null,
  voiceRealtimeStream: null,
  voiceRealtimeAudio: null,
  voiceRealtimeLastText: "",
  voiceController: null,
  voiceLastLine: "",
  voiceStyle: "lab-partner",
  agentThread: [],
  agentLastQuestion: "",
  activeBlueprintFault: "launch",
  mastery: {},
  hitAreas: [],
  controlAreas: [],
};

let blueprintAudioContext = null;

const els = {
  rocketList: document.querySelector("#rocketList"),
  catalogCount: document.querySelector("#catalogCount"),
  catalogFilters: document.querySelector("#catalogFilters"),
  catalogPanel: document.querySelector("#catalogPanel"),
  menuToggle: document.querySelector("#menuToggle"),
  shareWhatsApp: document.querySelector("#shareWhatsApp"),
  blueprintWorkspace: document.querySelector("#blueprintWorkspace"),
  missionLabel: document.querySelector("#missionLabel"),
  partLabel: document.querySelector("#partLabel"),
  lessonLabel: document.querySelector("#lessonLabel"),
  lessonTitle: document.querySelector("#lessonTitle"),
  lessonTime: document.querySelector("#lessonTime"),
  lessonBody: document.querySelector("#lessonBody"),
  lessonSteps: document.querySelector("#lessonSteps"),
  conceptMastery: document.querySelector("#conceptMastery"),
  conceptAnchor: document.querySelector("#conceptAnchor"),
  conceptAnchorCopy: document.querySelector("#conceptAnchorCopy"),
  conceptEquation: document.querySelector("#conceptEquation"),
  conceptEquationCopy: document.querySelector("#conceptEquationCopy"),
  conceptTry: document.querySelector("#conceptTry"),
  conceptTryCopy: document.querySelector("#conceptTryCopy"),
  conceptMisconception: document.querySelector("#conceptMisconception"),
  conceptMisconceptionCopy: document.querySelector("#conceptMisconceptionCopy"),
  applyConceptExperiment: document.querySelector("#applyConceptExperiment"),
  masteryQuestion: document.querySelector("#masteryQuestion"),
  masteryChoices: document.querySelector("#masteryChoices"),
  masteryFeedback: document.querySelector("#masteryFeedback"),
  selectedPartName: document.querySelector("#selectedPartName"),
  selectedPartType: document.querySelector("#selectedPartType"),
  selectedPartDescription: document.querySelector("#selectedPartDescription"),
  statGrid: document.querySelector("#statGrid"),
  recoveryCard: document.querySelector("#recoveryCard"),
  recoveryDropTime: document.querySelector("#recoveryDropTime"),
  recoveryCopy: document.querySelector("#recoveryCopy"),
  missionCopilotHud: document.querySelector("#missionCopilotHud"),
  locatorMarker: document.querySelector("#locatorMarker"),
  locatorFuel: document.querySelector("#locatorFuel"),
  locatorPayload: document.querySelector("#locatorPayload"),
  locatorPosition: document.querySelector("#locatorPosition"),
  locatorCopy: document.querySelector("#locatorCopy"),
  hardwareGrid: document.querySelector("#hardwareGrid"),
  failureMap: document.querySelector("#failureMap"),
  equationLabel: document.querySelector("#equationLabel"),
  equationText: document.querySelector("#equationText"),
  equationExplanation: document.querySelector("#equationExplanation"),
  graphCanvas,
  equationGrid: document.querySelector("#equationGrid"),
  latexDisplay: document.querySelector("#latexDisplay"),
  whyText: document.querySelector("#whyText"),
  phaseLabel: document.querySelector("#phaseLabel"),
  primerTitle: document.querySelector("#primerTitle"),
  primerCopy: document.querySelector("#primerCopy"),
  graphCaption: document.querySelector("#graphCaption"),
  payloadSlider: document.querySelector("#payloadSlider"),
  payloadValue: document.querySelector("#payloadValue"),
  fuelSlider: document.querySelector("#fuelSlider"),
  fuelValue: document.querySelector("#fuelValue"),
  dragSlider: document.querySelector("#dragSlider"),
  dragValue: document.querySelector("#dragValue"),
  windSlider: document.querySelector("#windSlider"),
  windValue: document.querySelector("#windValue"),
  guidanceSlider: document.querySelector("#guidanceSlider"),
  guidanceValue: document.querySelector("#guidanceValue"),
  engineHealthSlider: document.querySelector("#engineHealthSlider"),
  engineHealthValue: document.querySelector("#engineHealthValue"),
  structureSlider: document.querySelector("#structureSlider"),
  structureValue: document.querySelector("#structureValue"),
  heatShieldSlider: document.querySelector("#heatShieldSlider"),
  heatShieldValue: document.querySelector("#heatShieldValue"),
  stagingSlider: document.querySelector("#stagingSlider"),
  stagingValue: document.querySelector("#stagingValue"),
  graphInsightKicker: document.querySelector("#graphInsightKicker"),
  graphInsightTitle: document.querySelector("#graphInsightTitle"),
  graphInsightCopy: document.querySelector("#graphInsightCopy"),
  graphInsightEquation: document.querySelector("#graphInsightEquation"),
  failureCount: document.querySelector("#failureCount"),
  coachMove: document.querySelector("#coachMove"),
  coachWhy: document.querySelector("#coachWhy"),
  loadBuilder: document.querySelector("#loadBuilder"),
  builderStages: document.querySelector("#builderStages"),
  builderBoosters: document.querySelector("#builderBoosters"),
  builderEngines: document.querySelector("#builderEngines"),
  builderEngineValue: document.querySelector("#builderEngineValue"),
  builderEngineModel: document.querySelector("#builderEngineModel"),
  builderDiameter: document.querySelector("#builderDiameter"),
  builderDiameterValue: document.querySelector("#builderDiameterValue"),
  builderUpper: document.querySelector("#builderUpper"),
  builderSkinMaterial: document.querySelector("#builderSkinMaterial"),
  builderTankMaterial: document.querySelector("#builderTankMaterial"),
  builderHeatShieldMaterial: document.querySelector("#builderHeatShieldMaterial"),
  builderReuse: document.querySelector("#builderReuse"),
  blueprintStatus: document.querySelector("#blueprintStatus"),
  blueprintCanvas: document.querySelector("#blueprintCanvas"),
  blueprintRocket: document.querySelector("#blueprintRocket"),
  blueprintHeight: document.querySelector("#blueprintHeight"),
  blueprintWidth: document.querySelector("#blueprintWidth"),
  blueprintMetrics: document.querySelector("#blueprintMetrics"),
  blueprintChecklist: document.querySelector("#blueprintChecklist"),
  blueprintDidYouKnow: document.querySelector("#blueprintDidYouKnow"),
  blueprintStages: document.querySelector("#blueprintStages"),
  blueprintBoosters: document.querySelector("#blueprintBoosters"),
  blueprintEngines: document.querySelector("#blueprintEngines"),
  blueprintEnginesValue: document.querySelector("#blueprintEnginesValue"),
  blueprintDiameter: document.querySelector("#blueprintDiameter"),
  blueprintDiameterValue: document.querySelector("#blueprintDiameterValue"),
  blueprintEngineModel: document.querySelector("#blueprintEngineModel"),
  blueprintUpper: document.querySelector("#blueprintUpper"),
  blueprintSkin: document.querySelector("#blueprintSkin"),
  blueprintShield: document.querySelector("#blueprintShield"),
  viewportBlueprintTitle: document.querySelector("#viewportBlueprintTitle"),
  viewportBlueprintCanvas: document.querySelector("#viewportBlueprintCanvas"),
  viewportBlueprintRocket: document.querySelector("#viewportBlueprintRocket"),
  viewportBlueprintHeight: document.querySelector("#viewportBlueprintHeight"),
  viewportBlueprintWidth: document.querySelector("#viewportBlueprintWidth"),
  viewportBlueprintMetrics: document.querySelector("#viewportBlueprintMetrics"),
  viewportBlueprintChecklist: document.querySelector("#viewportBlueprintChecklist"),
  viewportBlueprintReadiness: document.querySelector("#viewportBlueprintReadiness"),
  viewportBlueprintBrief: document.querySelector("#viewportBlueprintBrief"),
  viewportBlueprintManifest: document.querySelector("#viewportBlueprintManifest"),
  viewportBlueprintFaultTree: document.querySelector("#viewportBlueprintFaultTree"),
  viewportBlueprintLabels: document.querySelector("#viewportBlueprintLabels"),
  viewportBlueprintDiagnosis: document.querySelector("#viewportBlueprintDiagnosis"),
  viewportBlueprintStress: document.querySelector("#viewportBlueprintStress"),
  blueprintInventoryStatus: document.querySelector("#blueprintInventoryStatus"),
  blueprintSketchCanvas: document.querySelector("#blueprintSketchCanvas"),
  blueprintPartLayer: document.querySelector("#blueprintPartLayer"),
  blueprintLayerKicker: document.querySelector("#blueprintLayerKicker"),
  blueprintLayerTitle: document.querySelector("#blueprintLayerTitle"),
  blueprintLayerEquation: document.querySelector("#blueprintLayerEquation"),
  builderReadout: document.querySelector("#builderReadout"),
  builderDiagnosis: document.querySelector("#builderDiagnosis"),
  builderDiagnosisTitle: document.querySelector("#builderDiagnosisTitle"),
  builderDiagnosisCopy: document.querySelector("#builderDiagnosisCopy"),
  builderRepairList: document.querySelector("#builderRepairList"),
  workspaceGuide: document.querySelector("#workspaceGuide"),
  workspaceKicker: document.querySelector("#workspaceKicker"),
  workspaceTitle: document.querySelector("#workspaceTitle"),
  workspaceCopy: document.querySelector("#workspaceCopy"),
  workspaceEquation: document.querySelector("#workspaceEquation"),
  workspaceAction: document.querySelector("#workspaceAction"),
  workspaceDetail: document.querySelector("#workspaceDetail"),
  trajectoryStatus: document.querySelector("#trajectoryStatus"),
  trajectoryTransit: document.querySelector("#trajectoryTransit"),
  trajectoryDv: document.querySelector("#trajectoryDv"),
  trajectoryWindow: document.querySelector("#trajectoryWindow"),
  trajectoryCopy: document.querySelector("#trajectoryCopy"),
  solarMap: document.querySelector("#solarMap"),
  spacecraftMarker: document.querySelector("#spacecraftMarker"),
  windowSlider: document.querySelector("#windowSlider"),
  windowValue: document.querySelector("#windowValue"),
  correctionSlider: document.querySelector("#correctionSlider"),
  correctionValue: document.querySelector("#correctionValue"),
  landingSite: document.querySelector("#landingSite"),
  trajectoryPhaseRail: document.querySelector("#trajectoryPhaseRail"),
  trajectoryDeepGrid: document.querySelector("#trajectoryDeepGrid"),
  trajectoryProblemGrid: document.querySelector("#trajectoryProblemGrid"),
  trajectoryQuizKicker: document.querySelector("#trajectoryQuizKicker"),
  trajectoryQuizQuestion: document.querySelector("#trajectoryQuizQuestion"),
  trajectoryQuizChoices: document.querySelector("#trajectoryQuizChoices"),
  trajectoryQuizFeedback: document.querySelector("#trajectoryQuizFeedback"),
  trajectoryRibbon: document.querySelector("#trajectoryRibbon"),
  trajectoryRibbonTitle: document.querySelector("#trajectoryRibbonTitle"),
  trajectoryRibbonCopy: document.querySelector("#trajectoryRibbonCopy"),
  trajectoryRibbonDot: document.querySelector("#trajectoryRibbonDot"),
  payloadStatus: document.querySelector("#payloadStatus"),
  missionTip: document.querySelector("#missionTip"),
  challengeTitle: document.querySelector("#challengeTitle"),
  challengeScore: document.querySelector("#challengeScore"),
  challengeList: document.querySelector("#challengeList"),
  deltaDv: document.querySelector("#deltaDv"),
  deltaTwr: document.querySelector("#deltaTwr"),
  deltaQ: document.querySelector("#deltaQ"),
  deltaRisk: document.querySelector("#deltaRisk"),
  controlCues: document.querySelector("#controlCues"),
  warningStack: document.querySelector("#warningStack"),
  payloadBar: document.querySelector("#payloadBar"),
  goalVelocity: document.querySelector("#goalVelocity"),
  flightStatus: document.querySelector("#flightStatus"),
  goalBar: document.querySelector("#goalBar"),
  failureReason: document.querySelector("#failureReason"),
  engineLabTitle: document.querySelector("#engineLabTitle"),
  engineGrid: document.querySelector("#engineGrid"),
  engineLabCopy: document.querySelector("#engineLabCopy"),
  engineModelLab: document.querySelector("#engineModelLab"),
  engineCountLab: document.querySelector("#engineCountLab"),
  engineCountLabValue: document.querySelector("#engineCountLabValue"),
  upperFuelLab: document.querySelector("#upperFuelLab"),
  materialsLabTitle: document.querySelector("#materialsLabTitle"),
  materialsGrid: document.querySelector("#materialsGrid"),
  stressPanel: document.querySelector("#stressPanel"),
  materialsDidYouKnow: document.querySelector("#materialsDidYouKnow"),
  skinMaterialLab: document.querySelector("#skinMaterialLab"),
  tankMaterialLab: document.querySelector("#tankMaterialLab"),
  heatShieldLab: document.querySelector("#heatShieldLab"),
  fuelLabTitle: document.querySelector("#fuelLabTitle"),
  fuelGrid: document.querySelector("#fuelGrid"),
  fuelLabCopy: document.querySelector("#fuelLabCopy"),
  compareGrid: document.querySelector("#compareGrid"),
  scaleStrip: document.querySelector("#scaleStrip"),
  scaleReadout: document.querySelector("#scaleReadout"),
  simTime: document.querySelector("#simTime"),
  simVelocity: document.querySelector("#simVelocity"),
  simAltitude: document.querySelector("#simAltitude"),
  simEnergy: document.querySelector("#simEnergy"),
  simMass: document.querySelector("#simMass"),
  partLabels: document.querySelector("#partLabels"),
  viewHint: document.querySelector("#viewHint"),
  caseTitle: document.querySelector("#caseTitle"),
  caseBadge: document.querySelector("#caseBadge"),
  caseGrid: document.querySelector("#caseGrid"),
  effectIgnition: document.querySelector("#effectIgnition"),
  effectMaxQ: document.querySelector("#effectMaxQ"),
  effectStaging: document.querySelector("#effectStaging"),
  effectHeating: document.querySelector("#effectHeating"),
  agentLog: document.querySelector("#agentLog"),
  agentStressCard: document.querySelector("#agentStressCard"),
  agentStatus: document.querySelector("#agentStatus"),
  agentOrb: document.querySelector("#agentOrb"),
  agentMode: document.querySelector("#agentMode"),
  agentContext: document.querySelector("#agentContext"),
  agentSync: document.querySelector("#agentSync"),
  agentContextPacket: document.querySelector("#agentContextPacket"),
  agentPromptForm: document.querySelector("#agentPromptForm"),
  agentPrompt: document.querySelector("#agentPrompt"),
  agentSend: document.querySelector("#agentSend"),
  companionLoop: document.querySelector("#companionLoop"),
  companionReadout: document.querySelector("#companionReadout"),
  companionLoopRun: document.querySelector("#companionLoopRun"),
  vectorPlan: document.querySelector("#vectorPlan"),
  vectorPlanTitle: document.querySelector("#vectorPlanTitle"),
  vectorPlanEquation: document.querySelector("#vectorPlanEquation"),
  vectorPlanTrap: document.querySelector("#vectorPlanTrap"),
  vectorPlanMove: document.querySelector("#vectorPlanMove"),
  vectorPlanApply: document.querySelector("#vectorPlanApply"),
  vectorPlanVoice: document.querySelector("#vectorPlanVoice"),
  rehearsalCard: document.querySelector("#rehearsalCard"),
  rehearsalTitle: document.querySelector("#rehearsalTitle"),
  rehearsalQuestion: document.querySelector("#rehearsalQuestion"),
  rehearsalChoices: document.querySelector("#rehearsalChoices"),
  rehearsalFeedback: document.querySelector("#rehearsalFeedback"),
  rehearsalNext: document.querySelector("#rehearsalNext"),
  rehearsalAsk: document.querySelector("#rehearsalAsk"),
  voiceCompanion: document.querySelector("#voiceCompanion"),
  voiceStatus: document.querySelector("#voiceStatus"),
  voicePersonaCopy: document.querySelector("#voicePersonaCopy"),
  voiceToggle: document.querySelector("#voiceToggle"),
  voiceTalk: document.querySelector("#voiceTalk"),
  voiceAuto: document.querySelector("#voiceAuto"),
  voiceBrief: document.querySelector("#voiceBrief"),
  voiceRealtime: document.querySelector("#voiceRealtime"),
};

function currentRocket() {
  return rockets[state.rocketIndex];
}

function builderIndex() {
  return rockets.findIndex((rocket) => rocket.id === "builder");
}

function updateBuilderRocket({ select = false } = {}) {
  const index = builderIndex();
  if (index < 0) return;
  rockets[index] = createBuilderRocket(builderConfig);
  if (select || state.rocketIndex === index) {
    state.rocketIndex = index;
    const rocket = currentRocket();
    state.selectedPartId = lessonPartFor(rocket, lessonTrack[state.lessonIndex]);
    state.targetFocusY = partFocusRatio(rocket, state.selectedPartId);
    applyMission(state.missionMode);
  }
}

function currentPart() {
  const rocket = currentRocket();
  return rocket.parts.find((part) => part.id === state.selectedPartId) || rocket.parts[0];
}

function currentMission() {
  return missionProfiles[state.missionMode] || missionProfiles.orbit;
}

function currentTrajectory() {
  return trajectoryTargets[state.destination] || trajectoryTargets.moon;
}

function normalizeParts(rocket) {
  const total = rocket.parts.reduce((sum, part) => sum + part.height, 0);
  let y = -total / 2;
  return rocket.parts.map((part, index) => {
    const bottom = y;
    const top = y + part.height;
    y = top;
    return { ...part, index, bottom, top, mid: (bottom + top) / 2 };
  });
}

function compact(text, max = 92) {
  const first = text.split(".")[0].trim();
  const chosen = first.length > 18 ? first : text.trim();
  return chosen.length > max ? `${chosen.slice(0, max - 1).trim()}...` : chosen;
}

function lessonPartFor(rocket, lesson) {
  const candidates = lessonFallbackParts[lesson.id] || [lesson.partHint];
  return candidates.find((id) => rocket.parts.some((part) => part.id === id)) || rocket.parts[Math.floor(rocket.parts.length / 2)].id;
}

function partFocusRatio(rocket, id) {
  const parts = normalizeParts(rocket);
  const total = Math.max(1, parts.at(-1).top - parts[0].bottom);
  const part = parts.find((item) => item.id === id) || parts[Math.floor(parts.length / 2)];
  return Math.max(0.06, Math.min(0.94, (part.mid - parts[0].bottom) / total));
}

function visualRadii(part) {
  const tapered = /nose|fairing|escape|command|engine|raptor|merlin|f-1/i.test(`${part.id} ${part.name}`);
  if (tapered) return { r0: part.r0, r1: part.r1 };
  const radius = Math.max(part.r0, part.r1);
  return { r0: radius, r1: radius };
}

function physicsMetrics() {
  const rocket = currentRocket();
  const profile = rocket.materialProfile || {};
  const shieldFactor = profile.shield?.protection || 1;
  const fuelMass = rocket.propellantT * (state.fuelPercent / 100);
  const wetMass = rocket.dryMassT + fuelMass + state.payloadT;
  const dryPlusPayload = rocket.dryMassT + state.payloadT;
  const massRatio = Math.max(1.01, wetMass / Math.max(1, dryPlusPayload));
  const deltaV = rocket.ispS * 9.80665 * Math.log(massRatio);
  const engineFactor = state.engineHealth / 100;
  const stagingLoss = Math.abs(state.stagingTiming) * 18;
  const effectiveDeltaV = Math.max(0, deltaV * (rocket.stageGain || 1) * Math.min(1.06, Math.max(0.45, engineFactor)) - stagingLoss);
  const weightMN = wetMass * 9.80665 / 1000;
  const thrustMN = rocket.thrustMN * engineFactor;
  const twr = thrustMN / Math.max(0.1, weightMN);
  const payloadFraction = state.payloadT / rocket.maxPayloadT;
  const threshold = Math.max(0, Math.min(1.35, payloadFraction));
  const deltaVMargin = effectiveDeltaV - currentMission().targetDeltaVMps;
  const payloadMarginT = rocket.maxPayloadT - state.payloadT;
  return {
    rocket,
    fuelMass,
    wetMass,
    dryPlusPayload,
    massRatio,
    deltaV,
    effectiveDeltaV,
    deltaVMargin,
    payloadMarginT,
    twr,
    payloadFraction,
    threshold,
    thrustAvailableMN: thrustMN,
    engineFactor,
    stagingLoss,
    shieldFactor,
    youngGpa: profile.skin?.youngGpa || 72,
    materialStrengthMpa: profile.skin?.strengthMpa || 520,
  };
}

function simSnapshot() {
  const rocket = currentRocket();
  const metrics = physicsMetrics();
  const rawTime = state.failure ? state.failure.t : state.simTime;
  const t = state.launchStatus === "countdown" ? 0 : state.launchStatus === "idle" ? rawTime % 180 : Math.min(rawTime, 180);
  const stage = t < 64 ? 0 : t < 124 ? 1 : 2;
  const thrustCurve = stage === 0 ? 1 : stage === 1 ? 0.62 : 0.38;
  const burnProgress = t / 180;
  const stageDropFraction = stage === 0 ? 0 : stage === 1 ? 0.46 : 0.7;
  const propRemaining = metrics.fuelMass * Math.max(0.08, 1 - burnProgress * 0.92);
  const dryRemaining = rocket.dryMassT * (1 - stageDropFraction);
  const currentMassT = Math.max(state.payloadT + rocket.dryMassT * 0.16, dryRemaining + state.payloadT + propRemaining);
  const mass = Math.max(8, (currentMassT / metrics.wetMass) * 100);
  const thrustMN = rocket.thrustMN * thrustCurve * metrics.engineFactor;
  const weightMN = currentMassT * 9.80665 / 1000;
  const twrNow = thrustMN / Math.max(0.08, weightMN);
  const weatherPenalty = 1 + state.windFactor * 0.14 + state.guidanceError * 0.16;
  const dragPenalty = state.dragFactor * (1 + metrics.threshold * 0.22) * weatherPenalty;
  const deltaVFactor = Math.max(0.46, Math.min(1.25, metrics.effectiveDeltaV / currentMission().targetDeltaVMps));
  const altitude = (0.0065 * t * t + stage * 8) * Math.max(0.52, metrics.twr / 1.24) * deltaVFactor / (1 + state.guidanceError * 0.22);
  const ascentProgress = Math.min(1, Math.pow(t / 180, 1.75));
  const velocity = Math.max(0, metrics.effectiveDeltaV * ascentProgress * Math.max(0.55, Math.min(1.08, metrics.twr / 1.25)) / dragPenalty);
  const density = Math.exp(-altitude / 8.5);
  const atmosphericVelocity = Math.min(velocity, 920 + altitude * 9);
  const q = 0.5 * 1.225 * density * atmosphericVelocity * atmosphericVelocity * dragPenalty / 1000;
  const dragMN = (q * 1000 * rocket.dragAreaM2 * (0.34 + state.dragFactor * 0.18)) / 1_000_000;
  const acceleration = ((thrustMN - weightMN - dragMN) * 1000) / Math.max(1, currentMassT);
  return {
    t,
    stage,
    thrustCurve,
    mass,
    currentMassT,
    propRemaining,
    thrustMN,
    weightMN,
    twrNow,
    altitude,
    velocity,
    density,
    q,
    dragMN,
    acceleration,
    ...metrics,
  };
}

function flightRisk(sim = simSnapshot()) {
  const maxQStress = Math.max(0, (sim.q - 58) / 54);
  const attitudeRisk = state.windFactor * 0.42 + state.guidanceError * 0.54;
  const massRisk = Math.max(0, sim.threshold - 0.9) * 0.5;
  const deltaVRisk = sim.deltaVMargin < 0 ? Math.min(0.65, Math.abs(sim.deltaVMargin) / 3600) : 0;
  const structureRisk = Math.max(0, (76 - state.structurePercent) / 85);
  const thermalRisk = Math.max(0, thermalLoadIndex(sim) - 0.72) * 0.38;
  const stagingRisk = Math.max(0, Math.abs(state.stagingTiming) - 3) / 18;
  const engineRisk = Math.max(0, (78 - state.engineHealth) / 100);
  return Math.max(0, Math.min(1, maxQStress + attitudeRisk + massRisk + deltaVRisk + structureRisk + thermalRisk + stagingRisk + engineRisk));
}

function structuralLimitKpa() {
  const profile = currentRocket().materialProfile || {};
  const strengthFactor = Math.max(0.62, Math.min(1.5, (profile.skin?.strengthMpa || 520) / 520));
  const stiffnessFactor = Math.max(0.72, Math.min(1.42, (profile.skin?.youngGpa || 78) / 78));
  return Math.max(32, 98 * strengthFactor * (0.82 + stiffnessFactor * 0.18) * (state.structurePercent / 100) - state.guidanceError * 18 - state.windFactor * 10);
}

function thermalLoadIndex(sim = simSnapshot()) {
  const profile = currentRocket().materialProfile || {};
  const heatShieldFactor = Math.max(0.35, state.heatShieldPercent / 100);
  const materialHeat = profile.skin?.heat || 0.72;
  const shieldProtection = profile.shield?.protection || 1;
  const speedHeat = Math.min(1.55, sim.velocity / 3100);
  return (sim.q / 92) * speedHeat / (heatShieldFactor * shieldProtection * Math.max(0.58, materialHeat));
}

function stagingTimingRisk(sim = simSnapshot()) {
  const timingError = Math.abs(state.stagingTiming);
  if (timingError < 5) return 0;
  const nearestStage = Math.min(Math.abs(sim.t - 64), Math.abs(sim.t - 124), Math.abs(sim.t - 138));
  const eventPulse = Math.max(0, 1 - nearestStage / 13);
  return eventPulse * timingError / 12;
}

function estimateMaxQ(metrics = physicsMetrics()) {
  const rocket = currentRocket();
  const mission = currentMission();
  const weatherPenalty = 1 + state.windFactor * 0.14 + state.guidanceError * 0.16;
  const dragPenalty = state.dragFactor * (1 + metrics.threshold * 0.22) * weatherPenalty;
  const deltaVFactor = Math.max(0.46, Math.min(1.25, metrics.effectiveDeltaV / mission.targetDeltaVMps));
  let peak = { q: 0, t: 0, altitude: 0, velocity: 0 };
  for (let t = 2; t <= 112; t += 2) {
    const stage = t < 64 ? 0 : t < 124 ? 1 : 2;
    const altitude = (0.0065 * t * t + stage * 8) * Math.max(0.52, metrics.twr / 1.24) * deltaVFactor / (1 + state.guidanceError * 0.22);
    const ascentProgress = Math.min(1, Math.pow(t / 180, 1.75));
    const velocity = Math.max(0, metrics.effectiveDeltaV * ascentProgress * Math.max(0.55, Math.min(1.08, metrics.twr / 1.25)) / dragPenalty);
    const density = Math.exp(-altitude / 8.5);
    const atmosphericVelocity = Math.min(velocity, 920 + altitude * 9);
    const q = 0.5 * 1.225 * density * atmosphericVelocity * atmosphericVelocity * dragPenalty / 1000;
    const dragMN = (q * 1000 * rocket.dragAreaM2 * (0.34 + state.dragFactor * 0.18)) / 1_000_000;
    if (q > peak.q) peak = { q, t, altitude, velocity, dragMN };
  }
  return peak;
}

function metricsSnapshot() {
  const metrics = physicsMetrics();
  const peak = estimateMaxQ(metrics);
  const peakSim = { ...simSnapshot(), ...metrics, q: peak.q };
  return {
    deltaV: metrics.effectiveDeltaV,
    twr: metrics.twr,
    q: peak.q,
    risk: flightRisk(peakSim),
  };
}

function currentChallenge(metrics = physicsMetrics()) {
  const mission = currentMission();
  const peak = estimateMaxQ(metrics);
  const peakSim = { ...simSnapshot(), ...metrics, q: peak.q };
  const risk = flightRisk(peakSim);
  const limit = structuralLimitKpa();
  const checks = [
    { label: `Liftoff T/W ${metrics.twr.toFixed(2)} > 1.00`, pass: metrics.twr > 1 },
    { label: `Delta-v margin ${metrics.deltaVMargin >= 0 ? "+" : ""}${formatDeltaV(metrics.deltaVMargin)}`, pass: metrics.deltaVMargin >= 0 },
    { label: `Peak Max-Q ${peak.q.toFixed(1)} kPa < ${limit.toFixed(0)} kPa`, pass: peak.q < limit },
    { label: `Payload class ${Math.round(metrics.payloadFraction * 100)}% <= 100%`, pass: metrics.payloadFraction <= 1 },
  ];

  if (state.missionMode === "escape") {
    checks[1] = { label: `Escape delta-v ${formatDeltaV(metrics.effectiveDeltaV)} >= ${formatVelocity(mission.targetDeltaVMps)}`, pass: metrics.effectiveDeltaV >= mission.targetDeltaVMps };
    checks[3] = { label: `Fuel reserve ${Math.round(state.fuelPercent)}% >= 88%`, pass: state.fuelPercent >= 88 };
  } else if (state.missionMode === "heavy") {
    checks[1] = { label: `Heavy payload ${Math.round(metrics.payloadFraction * 100)}% of class`, pass: metrics.payloadFraction >= 0.72 && metrics.payloadFraction <= 1 };
    checks[3] = { label: `Still has orbit margin ${metrics.deltaVMargin >= 0 ? "+" : ""}${formatDeltaV(metrics.deltaVMargin)}`, pass: metrics.deltaVMargin >= 0 };
  } else if (state.missionMode === "maxq") {
    checks[1] = { label: `Air load stays below structure limit`, pass: peak.q < limit };
    checks[2] = { label: `Guidance + wind risk ${Math.round(risk * 100)}% < 45%`, pass: risk < 0.45 };
    checks[3] = { label: `Drag shape ${state.dragFactor.toFixed(2)}x is recoverable`, pass: state.dragFactor < 1.55 };
  }

  return { title: `${mission.shortLabel} challenge`, checks, peak, risk };
}

function failureChain(reason, sim = simSnapshot()) {
  if (/Thrust-to-weight|lift off/i.test(reason)) {
    return ["T/W fell below 1", "net force stayed downward", "the stack could not clear the pad"];
  }
  if (/Max-Q|aerodynamic load|structure/i.test(reason)) {
    return [`dynamic pressure peaked at ${sim.q.toFixed(1)} kPa`, "skin and joints saw too much bending load", "the vehicle broke before staging"];
  }
  if (/Wind shear|guidance/i.test(reason)) {
    return ["wind pushed the rocket off-axis", "guidance correction lagged", "angle of attack grew into a tumble"];
  }
  if (/delta-v|velocity|orbit/i.test(reason)) {
    return ["mass ratio or drag consumed margin", "upper stage ran out of useful velocity", "orbit insertion failed"];
  }
  if (/heat|shield|thermal/i.test(reason)) {
    return ["thermal load climbed faster than protection margin", "skin temperature exceeded the classroom limit", "the vehicle entered abort review"];
  }
  if (/stage|separation|timing/i.test(reason)) {
    return ["stage timing moved away from the designed event", "separation impulse and guidance disagreed", "the upper stage inherited a bad attitude"];
  }
  if (/engine|thrust chamber/i.test(reason)) {
    return ["engine health reduced thrust", "gravity losses ate the velocity budget", "the rocket fell behind the planned ascent curve"];
  }
  return ["a subsystem fault propagated", "control authority was not enough", "the mission entered abort review"];
}

function logFailure(reason, sim = simSnapshot()) {
  const metrics = physicsMetrics();
  const peak = estimateMaxQ(metrics);
  const entry = {
    time: new Date().toLocaleString(),
    rocket: currentRocket().name,
    mission: currentMission().label,
    reason,
    chain: failureChain(reason, sim),
    metrics: {
      t: Math.round(sim.t),
      twr: metrics.twr,
      deltaV: metrics.effectiveDeltaV,
      margin: metrics.deltaVMargin,
      maxQ: peak.q,
      structuralLimit: structuralLimitKpa(),
      thermal: thermalLoadIndex({ ...sim, q: peak.q }),
      risk: flightRisk({ ...sim, ...metrics, q: peak.q }),
    },
    controls: {
      payloadT: state.payloadT,
      fuelPercent: state.fuelPercent,
      dragFactor: state.dragFactor,
      windFactor: state.windFactor,
      guidanceError: state.guidanceError,
      engineHealth: state.engineHealth,
      structurePercent: state.structurePercent,
      heatShieldPercent: state.heatShieldPercent,
      stagingTiming: state.stagingTiming,
    },
  };
  state.failureLog.unshift(entry);
  state.failureLog = state.failureLog.slice(0, 24);
}

function failureTeachingReply(reason, sim = simSnapshot()) {
  const metrics = physicsMetrics();
  const peak = estimateMaxQ(metrics);
  const lower = reason.toLowerCase();
  if (lower.includes("thrust-to-weight") || lower.includes("lift off") || lower.includes("engine")) {
    return `Failure cause: lower stack. T/W is ${metrics.twr.toFixed(2)}, so thrust is not beating weight. Try less payload, more engine health, or a simpler booster setup before changing trajectory.`;
  }
  if (lower.includes("max-q") || lower.includes("aerodynamic") || lower.includes("wind") || lower.includes("guidance")) {
    return `Failure cause: air load. Peak Max-Q is ${peak.q.toFixed(1)} kPa. Lower drag, wind, or guidance error; stronger structure helps but adds mass.`;
  }
  if (lower.includes("heat")) {
    return `Failure cause: thermal protection. Speed and dense air are arriving together, so the heat shield has too little margin. Improve heat shield or reduce Max-Q.`;
  }
  if (lower.includes("stage")) {
    return `Failure cause: staging. The upper half starts from a bad separation event. Move Staging closer to 0s and inspect the interstage labels.`;
  }
  if (lower.includes("delta-v") || lower.includes("velocity") || lower.includes("orbit")) {
    return `Failure cause: upper-stage energy. Delta-v margin is ${formatDeltaV(metrics.deltaVMargin)}. Reduce payload, restore fuel, or improve mass ratio.`;
  }
  return `Failure cause: coupled system risk. Check the warning cards first, then change one control and launch again.`;
}

function triggerFailure(reason) {
  if (state.launchStatus === "failed") return;
  state.launchStatus = "failed";
  state.flightWorkspace = "failure";
  document.querySelector("#flightLab")?.setAttribute("data-workspace", "failure");
  document.querySelectorAll("[data-flight-workspace]").forEach((button) => {
    button.classList.toggle("active", button.dataset.flightWorkspace === "failure");
  });
  const sim = simSnapshot();
  state.failure = { reason, chain: failureChain(reason, sim), t: Math.min(state.simTime, 180), pulse: state.cuePulse, spawned: false };
  logFailure(reason, sim);
  state.explode = true;
  state.blastParticles = [];
  playBlueprintCue("break");
  document.querySelector("#explodeToggle").classList.add("active");
  guide(`Launch failed: ${reason}`, "Flight");
  guide(failureTeachingReply(reason, sim), "Agent");
}

function completeFlight() {
  const sim = simSnapshot();
  const mission = currentMission();
  if (sim.effectiveDeltaV >= mission.targetDeltaVMps && sim.altitude >= mission.targetAltitudeKm * 0.55) {
    state.launchStatus = "success";
    guide(`${mission.label} test succeeded. Delta-v margin: ${formatDeltaV(sim.deltaVMargin)}.`, "Flight");
  } else {
    triggerFailure("The rocket ran out of useful velocity before the mission target.");
  }
}

function evaluateFlight() {
  if (state.launchStatus !== "running") return;
  const sim = simSnapshot();
  const structuralLimit = structuralLimitKpa();
  if (sim.t > 2 && sim.twr < 1) {
    triggerFailure("Thrust-to-weight stayed below 1, so the stack could not lift off.");
  } else if (sim.t > 8 && state.engineHealth < 62 && sim.acceleration < 2.1) {
    triggerFailure("Engine health was too low; thrust chamber performance could not beat gravity losses.");
  } else if (sim.t > 20 && sim.t < 95 && sim.q > structuralLimit) {
    triggerFailure("Max-Q exceeded the structure limit. The vehicle broke under aerodynamic load.");
  } else if (sim.t > 42 && sim.t < 125 && thermalLoadIndex(sim) > 1.08) {
    triggerFailure("Heat shield margin collapsed while dynamic pressure and speed were both high.");
  } else if (stagingTimingRisk(sim) > 0.78) {
    triggerFailure("Stage separation timing was off, so the next stage inherited an unstable attitude.");
  } else if (sim.t > 34 && sim.t < 110 && state.windFactor + state.guidanceError > 1.18 && sim.q > 34) {
    triggerFailure("Wind shear and guidance error caused a tumble during ascent.");
  } else if (sim.t > 150 && sim.deltaVMargin < -850) {
    triggerFailure("The mission was short on delta-v before orbital insertion.");
  } else if (sim.t >= 180) {
    completeFlight();
  }
}

function resizeCanvas() {
  rocketScene?.resize();
}

function project(point, rocketHeight) {
  const rect = canvas.getBoundingClientRect();
  const scaleBase = Math.min(rect.height / (rocketHeight * 1.22), rect.width / 18) * state.zoom;
  const cos = Math.cos(state.angle);
  const sin = Math.sin(state.angle);
  const xr = point.x * cos - point.z * sin;
  const zr = point.x * sin + point.z * cos;
  const perspective = 840 / (840 + zr * scaleBase * 0.9);
  return {
    x: rect.width / 2 + xr * scaleBase * perspective,
    y: rect.height / 2 - point.y * scaleBase * perspective,
    s: scaleBase * perspective,
    z: zr,
  };
}

function partOffset(part) {
  if (state.failure) {
    const elapsed = Math.max(0, state.cuePulse - state.failure.pulse);
    const direction = part.index % 2 === 0 ? -1 : 1;
    return direction * Math.min(4.5, 0.22 * part.index + elapsed * 0.055);
  }
  if (!state.explode) return 0;
  const selected = part.id === state.selectedPartId;
  const direction = part.index % 2 === 0 ? -1 : 1;
  return direction * (selected ? 1.45 : 0.38);
}

function shade(hex, amount) {
  const value = hex.replace("#", "");
  const num = parseInt(value, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function drawTaperedPart(part, rocket, alpha = 1) {
  const selected = part.id === state.selectedPartId;
  const hovered = part.id === state.hoveredPartId;
  const offset = partOffset(part);
  const { r0, r1 } = visualRadii(part);
  const bottomLeft = project({ x: offset - r0, y: part.bottom, z: 0 }, rocket.heightM);
  const bottomRight = project({ x: offset + r0, y: part.bottom, z: 0 }, rocket.heightM);
  const topLeft = project({ x: offset - r1, y: part.top, z: 0 }, rocket.heightM);
  const topRight = project({ x: offset + r1, y: part.top, z: 0 }, rocket.heightM);
  const topCenter = project({ x: offset, y: part.top, z: 0 }, rocket.heightM);
  const bottomCenter = project({ x: offset, y: part.bottom, z: 0 }, rocket.heightM);
  const path = new Path2D();

  path.moveTo(topLeft.x, topLeft.y);
  path.lineTo(topRight.x, topRight.y);
  path.lineTo(bottomRight.x, bottomRight.y);
  path.lineTo(bottomLeft.x, bottomLeft.y);
  path.closePath();

  const gradient = ctx.createLinearGradient(topLeft.x, 0, topRight.x, 0);
  gradient.addColorStop(0, shade(part.color, -34));
  gradient.addColorStop(0.45, shade(part.color, 24));
  gradient.addColorStop(0.68, part.color);
  gradient.addColorStop(1, shade(part.color, -42));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.strokeStyle = selected ? "rgba(93, 242, 193, 0.95)" : hovered ? "rgba(143, 221, 255, 0.72)" : "rgba(255,255,255,0.22)";
  ctx.lineWidth = selected ? 2.2 : 1;
  ctx.fill(path);
  ctx.stroke(path);

  const capHeightTop = Math.max(3, r1 * topCenter.s * 0.22);
  const capHeightBottom = Math.max(3, r0 * bottomCenter.s * 0.22);
  ctx.beginPath();
  ctx.ellipse(topCenter.x, topCenter.y, Math.max(4, r1 * topCenter.s), capHeightTop, 0, 0, Math.PI * 2);
  ctx.fillStyle = shade(part.color, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(bottomCenter.x, bottomCenter.y, Math.max(4, r0 * bottomCenter.s), capHeightBottom, 0, 0, Math.PI);
  ctx.strokeStyle = "rgba(0,0,0,0.34)";
  ctx.stroke();

  drawPartDetails(part, rocket, offset);
  if (state.cutaway && ["s-ic", "s-ii", "s-ivb", "first-stage", "second-stage", "super-heavy", "ship-tanks"].includes(part.id)) {
    drawCutaway(part, rocket, offset);
  }

  if (selected) {
    ctx.shadowColor = "rgba(93, 242, 193, 0.65)";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = "rgba(93, 242, 193, 0.65)";
    ctx.lineWidth = 1.3;
    ctx.stroke(path);
  }

  ctx.restore();
  state.hitAreas.push({ id: part.id, path });
}

function drawPartDetails(part, rocket, offset) {
  const bands = part.id.includes("stage") || ["s-ic", "s-ii", "s-ivb", "super-heavy"].includes(part.id) ? 3 : 1;
  const { r0, r1 } = visualRadii(part);
  ctx.save();
  ctx.strokeStyle = part.accent;
  ctx.globalAlpha = 0.42;
  ctx.lineWidth = 1;
  for (let i = 1; i <= bands; i += 1) {
    const y = part.bottom + (part.height * i) / (bands + 1);
    const left = project({ x: offset - (r0 + r1) / 2, y, z: 0 }, rocket.heightM);
    const right = project({ x: offset + (r0 + r1) / 2, y, z: 0 }, rocket.heightM);
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();
  }

  if (part.id === "grid-fins" || part.id === "flaps") {
    for (const side of [-1, 1]) {
      const root = project({ x: offset + side * r0, y: part.mid, z: 0 }, rocket.heightM);
      const tip = project({ x: offset + side * (r0 + 1.55), y: part.mid + part.height * 0.18, z: 0.2 }, rocket.heightM);
      const tip2 = project({ x: offset + side * (r0 + 1.35), y: part.mid - part.height * 0.16, z: -0.2 }, rocket.heightM);
      ctx.beginPath();
      ctx.moveTo(root.x, root.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.lineTo(tip2.x, tip2.y);
      ctx.closePath();
      ctx.fillStyle = "rgba(143, 221, 255, 0.52)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.stroke();
    }
  }

  if (part.id.includes("engine") || part.id === "merlins" || part.id === "raptors") {
    const count = part.id === "merlins" ? 9 : part.id === "raptors" ? 13 : 5;
    for (let i = 0; i < count; i += 1) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const spread = count > 5 ? 0.82 : 0.9;
      const x = offset + (col - Math.min(4, count - 1) / 2) * spread;
      const y = part.bottom + 1.1 + row * 1.3;
      const p = project({ x, y, z: 1.2 + row * 0.15 }, rocket.heightM);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 3.2 * p.s * 0.08, 2.3 * p.s * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 208, 138, 0.75)";
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCutaway(part, rocket, offset) {
  const { r0, r1 } = visualRadii(part);
  const middle = project({ x: offset + r0 * 0.18, y: part.mid, z: 0.02 }, rocket.heightM);
  const top = project({ x: offset + r1 * 0.18, y: part.top - part.height * 0.12, z: 0.02 }, rocket.heightM);
  const bottom = project({ x: offset + r0 * 0.18, y: part.bottom + part.height * 0.12, z: 0.02 }, rocket.heightM);
  ctx.save();
  ctx.strokeStyle = "rgba(5, 8, 12, 0.45)";
  ctx.fillStyle = "rgba(5, 8, 12, 0.3)";
  ctx.lineWidth = Math.max(8, middle.s * 0.28);
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(93, 242, 193, 0.56)";
  ctx.setLineDash([6, 7]);
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(143, 221, 255, 0.28)";
  ctx.beginPath();
  ctx.arc(middle.x, middle.y, Math.max(8, middle.s * 0.22), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCallout(part, rocket) {
  const offset = partOffset(part);
  const { r0, r1 } = visualRadii(part);
  const anchor = project({ x: offset + Math.max(r0, r1) * 1.05, y: part.mid, z: 0 }, rocket.heightM);
  const rect = canvas.getBoundingClientRect();
  const visibleWidth = Math.min(rect.width, window.innerWidth || rect.width);
  const boxW = visibleWidth < 640 ? 148 : 176;
  const labelY = anchor.y - 18;
  const preferredRight = visibleWidth >= 640 && anchor.x < visibleWidth * 0.54;
  let x = preferredRight ? anchor.x + 42 : anchor.x - boxW - 42;
  if (visibleWidth < 640) x = anchor.x - boxW - 34;
  x = Math.max(10, Math.min(visibleWidth - boxW - 10, x));
  const stemX = preferredRight ? x : x + boxW;
  ctx.save();
  ctx.strokeStyle = "rgba(93, 242, 193, 0.78)";
  ctx.fillStyle = "rgba(93, 242, 193, 0.92)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(anchor.x, anchor.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(anchor.x, anchor.y);
  ctx.lineTo(stemX, labelY);
  ctx.stroke();

  const boxH = 48;
  ctx.fillStyle = "rgba(7, 10, 16, 0.82)";
  ctx.strokeStyle = "rgba(93, 242, 193, 0.42)";
  roundRect(ctx, x, labelY - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#eef5ff";
  ctx.font = "700 12px Inter, sans-serif";
  ctx.fillText(part.name, x + 11, labelY - 4);
  ctx.fillStyle = "#94a8bf";
  ctx.font = "700 10px Inter, sans-serif";
  ctx.fillText(part.type, x + 11, labelY + 13);
  ctx.restore();
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function drawScale(rocket) {
  if (!state.scale) return;
  const rect = canvas.getBoundingClientRect();
  const height = rect.height * 0.7;
  const bottom = rect.height * 0.86;
  const x = rect.width * 0.16;
  ctx.save();
  ctx.strokeStyle = "rgba(143, 221, 255, 0.34)";
  ctx.fillStyle = "rgba(143, 221, 255, 0.72)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, bottom);
  ctx.lineTo(x, bottom - height);
  ctx.stroke();
  ctx.fillRect(x - 7, bottom - height, 14, 1);
  ctx.fillRect(x - 7, bottom, 14, 1);
  ctx.font = "700 11px Inter, sans-serif";
  ctx.fillText(`${rocket.heightM} m`, x + 12, bottom - height + 12);
  ctx.fillStyle = "rgba(93, 242, 193, 0.72)";
  const humanH = Math.max(8, height * (1.8 / rocket.heightM));
  ctx.fillRect(x + 20, bottom - humanH, 4, humanH);
  ctx.fillText("1.8 m", x + 31, bottom - humanH + 3);
  ctx.restore();
}

function drawArrow(x1, y1, x2, y2, color, label, controlType = null) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(angle - 0.55), y2 - 9 * Math.sin(angle - 0.55));
  ctx.lineTo(x2 - 9 * Math.cos(angle + 0.55), y2 - 9 * Math.sin(angle + 0.55));
  ctx.closePath();
  ctx.fill();
  ctx.font = "800 10px Inter, sans-serif";
  ctx.fillText(label, x2 + 8, y2 + 3);
  if (controlType) {
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(x2, y2, 11, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(7, 10, 16, 0.72)";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x2, y2, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    state.controlAreas.push({ type: controlType, x: x2, y: y2, r: 18 });
  }
  ctx.restore();
}

function drawVisualCues(rocket, parts) {
  const selected = parts.find((part) => part.id === state.selectedPartId) || parts[0];
  const sim = simSnapshot();
  const rect = canvas.getBoundingClientRect();
  const bottom = project({ x: 0, y: parts[0].bottom, z: 0 }, rocket.heightM);
  const mid = project({ x: partOffset(selected), y: selected.mid, z: 0 }, rocket.heightM);
  const pulse = 0.5 + Math.sin(state.cuePulse * 0.08) * 0.5;

  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = `rgba(93, 242, 193, ${0.24 + pulse * 0.3})`;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.arc(mid.x, mid.y, 42 + pulse * 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  drawArrow(bottom.x, bottom.y + 28, bottom.x, bottom.y - 64 - sim.thrustCurve * 24, "rgba(246, 177, 74, 0.9)", "T", "fuel");
  drawArrow(bottom.x + 46, bottom.y - 45, bottom.x + 46, bottom.y + 26, "rgba(255, 107, 107, 0.82)", "W", "payload");
  drawArrow(bottom.x + 82, bottom.y - 78, bottom.x + 82, bottom.y - 25, "rgba(159, 199, 232, 0.76)", "D", "drag");

  const pathX = rect.width * 0.78;
  ctx.save();
  ctx.strokeStyle = "rgba(143, 221, 255, 0.22)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i <= 18; i += 1) {
    const p = i / 18;
    const x = pathX + Math.sin(p * Math.PI * 1.6) * 18;
    const y = rect.height * 0.84 - p * rect.height * 0.62;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = "rgba(246, 177, 74, 0.92)";
  const progress = Math.min(1, sim.t / 180);
  ctx.beginPath();
  ctx.arc(pathX + Math.sin(progress * Math.PI * 1.6) * 18, rect.height * 0.84 - progress * rect.height * 0.62, 4, 0, Math.PI * 2);
  ctx.fill();

  const mission = currentMission();
  const targetY = rect.height * 0.84 - Math.min(1, mission.targetAltitudeKm / 320) * rect.height * 0.62;
  ctx.strokeStyle = "rgba(246, 177, 74, 0.34)";
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.moveTo(pathX - 54, targetY);
  ctx.lineTo(pathX + 54, targetY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(246, 177, 74, 0.78)";
  ctx.font = "800 10px Inter, sans-serif";
  ctx.fillText(`${mission.label} target`, pathX - 50, targetY - 7);

  if (state.windFactor > 0.34) {
    ctx.strokeStyle = `rgba(159, 199, 232, ${0.28 + state.windFactor * 0.36})`;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i += 1) {
      const y = rect.height * (0.28 + i * 0.09);
      ctx.beginPath();
      ctx.moveTo(rect.width * 0.08, y);
      ctx.bezierCurveTo(rect.width * 0.22, y - 14, rect.width * 0.32, y + 16, rect.width * 0.46, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function spawnParticles(rocket, parts) {
  if (!state.simRunning || qaMode) return;
  const bottom = project({ x: 0, y: parts[0].bottom, z: 0 }, rocket.heightM);
  for (let i = 0; i < 2; i += 1) {
    state.particles.push({
      x: bottom.x + (Math.random() - 0.5) * 26,
      y: bottom.y + 8 + Math.random() * 12,
      vx: (Math.random() - 0.5) * 0.7,
      vy: 1.5 + Math.random() * 2.6,
      life: 30 + Math.random() * 22,
      size: 5 + Math.random() * 9,
    });
  }
}

function drawParticles() {
  ctx.save();
  state.particles = state.particles.filter((particle) => particle.life > 0).slice(-180);
  for (const particle of state.particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 1;
    const alpha = Math.max(0, particle.life / 52);
    const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size);
    gradient.addColorStop(0, `rgba(255, 214, 128, ${alpha})`);
    gradient.addColorStop(0.48, `rgba(255, 112, 55, ${alpha * 0.52})`);
    gradient.addColorStop(1, `rgba(93, 242, 193, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function seedBlastParticles(origin) {
  for (let i = 0; i < 86; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.6 + Math.random() * 6.8;
    const hot = Math.random() > 0.42;
    state.blastParticles.push({
      x: origin.x + (Math.random() - 0.5) * 20,
      y: origin.y + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      life: 42 + Math.random() * 46,
      size: 2 + Math.random() * 8,
      hot,
      shard: !hot && Math.random() > 0.32,
      spin: (Math.random() - 0.5) * 0.24,
      angle: Math.random() * Math.PI * 2,
    });
  }
}

function drawExplosion(rocket, parts) {
  if (!state.failure) return;
  const failedPart = parts.find((part) => part.id === state.selectedPartId) || parts[Math.floor(parts.length * 0.35)];
  const origin = project({ x: 0, y: failedPart.mid, z: 0 }, rocket.heightM);
  if (!state.failure.spawned) {
    seedBlastParticles(origin);
    state.failure.spawned = true;
  }

  const elapsed = Math.max(0, state.cuePulse - state.failure.pulse);
  ctx.save();
  const blastRadius = Math.min(150, 22 + elapsed * 2.4);
  const blast = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, blastRadius);
  blast.addColorStop(0, "rgba(255, 245, 180, 0.86)");
  blast.addColorStop(0.24, "rgba(255, 120, 71, 0.58)");
  blast.addColorStop(0.56, "rgba(110, 120, 130, 0.22)");
  blast.addColorStop(1, "rgba(110, 120, 130, 0)");
  ctx.fillStyle = blast;
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, blastRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  state.blastParticles = state.blastParticles.filter((particle) => particle.life > 0).slice(-140);
  for (const particle of state.blastParticles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.055;
    particle.angle += particle.spin || 0;
    particle.life -= 1;
    const alpha = Math.max(0, particle.life / 88);
    ctx.fillStyle = particle.hot ? `rgba(255, 166, 70, ${alpha})` : `rgba(175, 190, 205, ${alpha * 0.72})`;
    if (particle.shard) {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.angle);
      ctx.fillRect(-particle.size * 1.8, -particle.size * 0.45, particle.size * 3.6, particle.size * 0.9);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawEnvironment() {
  const rect = canvas.getBoundingClientRect();
  const sim = simSnapshot();
  const spaceMix = Math.min(1, sim.altitude / 80);
  const sky = ctx.createLinearGradient(0, 0, 0, rect.height);
  sky.addColorStop(0, spaceMix > 0.55 ? "#02050b" : "#07111e");
  sky.addColorStop(0.42, spaceMix > 0.55 ? "#071221" : "#10243a");
  sky.addColorStop(0.76, "#182d38");
  sky.addColorStop(1, "#14120f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, rect.width, rect.height);

  ctx.save();
  ctx.globalAlpha = 0.22 * (1 - spaceMix * 0.72);
  for (let i = 0; i < 3; i += 1) {
    const y = rect.height * (0.2 + i * 0.17);
    const grad = ctx.createLinearGradient(0, y - 20, 0, y + 45);
    grad.addColorStop(0, "rgba(159,199,232,0)");
    grad.addColorStop(0.5, "rgba(159,199,232,0.18)");
    grad.addColorStop(1, "rgba(159,199,232,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - 20, rect.width, 65);
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${0.2 + spaceMix * 0.22})`;
  for (let i = 0; i < 70; i += 1) {
    const x = (i * 127 + 17) % Math.max(1, rect.width);
    const y = (i * 67 + 23) % Math.max(1, rect.height * 0.55);
    ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = Math.max(0.16, 0.42 - spaceMix * 0.28);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  for (let i = 0; i < 5; i += 1) {
    const x = rect.width * (0.12 + i * 0.19) + Math.sin(state.cuePulse * 0.008 + i) * 18;
    const y = rect.height * (0.24 + (i % 2) * 0.12);
    ctx.beginPath();
    ctx.ellipse(x, y, 72, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 48, y + 2, 52, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const horizonY = rect.height * 0.78;
  ctx.save();
  ctx.fillStyle = "rgba(8, 12, 12, 0.84)";
  ctx.beginPath();
  ctx.ellipse(rect.width * 0.56, rect.height * 1.03, rect.width * 0.7, rect.height * 0.25, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(159,199,232,0.22)";
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.bezierCurveTo(rect.width * 0.28, horizonY - 24, rect.width * 0.62, horizonY + 18, rect.width, horizonY - 12);
  ctx.stroke();
  ctx.restore();
}

function drawLaunchPad(rocket, parts) {
  const rect = canvas.getBoundingClientRect();
  const base = project({ x: 0, y: parts[0].bottom, z: 0 }, rocket.heightM);
  ctx.save();
  ctx.strokeStyle = "rgba(159,199,232,0.28)";
  ctx.fillStyle = "rgba(20, 27, 34, 0.82)";
  roundRect(ctx, base.x - 96, base.y + 18, 192, 18, 4);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(159,199,232,0.22)";
  ctx.lineWidth = 2;
  const towerX = base.x - 122;
  ctx.beginPath();
  ctx.moveTo(towerX, base.y + 18);
  ctx.lineTo(towerX, Math.max(92, base.y - 285));
  ctx.moveTo(towerX + 28, base.y + 18);
  ctx.lineTo(towerX + 28, Math.max(116, base.y - 260));
  ctx.stroke();
  ctx.lineWidth = 1;
  for (let y = base.y - 250; y < base.y + 12; y += 32) {
    ctx.beginPath();
    ctx.moveTo(towerX, y);
    ctx.lineTo(towerX + 28, y + 16);
    ctx.moveTo(towerX + 28, y);
    ctx.lineTo(towerX, y + 16);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(246,177,74,0.38)";
  ctx.beginPath();
  ctx.moveTo(towerX + 28, base.y - 96);
  ctx.lineTo(base.x - 36, base.y - 92);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(rect.width * (0.1 + i * 0.13), base.y + 34 + (i % 2) * 9, 46, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawScene() {
  rocketScene?.render();
}

const launchEvents = [
  { key: "systems", status: "countdown", clock: 1.0, text: "Guidance, tanks, and weather check." },
  { key: "three", status: "countdown", clock: 3.2, text: "T minus 3." },
  { key: "two", status: "countdown", clock: 4.2, text: "T minus 2." },
  { key: "ignition", status: "countdown", clock: 5.6, text: "Ignition sequence." },
  { key: "release", status: "countdown", clock: 7.2, text: "Hold-down release." },
  { key: "liftoff", status: "running", t: 1, text: "Liftoff." },
  { key: "pitch", status: "running", t: 15, text: "Pitch program." },
  { key: "maxq", status: "running", t: 42, text: "Max-Q." },
  { key: "staging", status: "running", t: 70, text: "Staging: empty mass away." },
  { key: "upper", status: "running", t: 118, text: "Upper-stage burn." },
  { key: "insertion", status: "running", t: 168, text: "Insertion check." },
];

const COUNTDOWN_SECONDS = 8.2;

function rememberAgentTurn(role, text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return;
  state.agentThread.push({
    role,
    text: clean.slice(0, 520),
    t: Math.round(performance.now()),
  });
  if (/\?/.test(clean) && role === "companion") state.agentLastQuestion = clean.slice(0, 260);
  while (state.agentThread.length > 8) state.agentThread.shift();
  renderSessionLoop();
}

function agentConversationText() {
  if (!state.agentThread.length) return "";
  return state.agentThread
    .slice(-8)
    .map((turn) => `${turn.role === "learner" ? "Learner" : "Companion"}: ${turn.text}`)
    .join("\n");
}

async function sendAgentPrompt(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return { ok: false, status: "empty", fallback: false };
  guide(trimmed, "You");
  rememberAgentTurn("learner", trimmed);
  if (state.voiceRealtimeConnected && requestRealtimeResponse(trimmed, "learner-question")) {
    els.agentStatus.textContent = "Realtime companion thinking...";
    return { ok: true, status: "realtime", fallback: false };
  }
  els.agentStatus.textContent = "Thinking with scene context...";
  state.agentBusy = true;
  updateAgentAwareness();
  try {
    const response = await fetch("/api/agent-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: trimmed,
        context: agentContextText(),
        personality: `${AGENT_PERSONALITY}\n${currentVoiceProfile().instructions}\n${voiceContextLine("chat")}`,
        history: agentConversationText(),
      }),
    });
    if (!response.ok) throw new Error(`Agent endpoint returned ${response.status}`);
    const data = await response.json();
    const reply = data.reply || fallbackAgentReply(trimmed);
    guide(reply, "Agent");
    rememberAgentTurn("companion", reply);
    speakAgentReply(reply);
    els.agentStatus.textContent = "Chat session ready";
    return { ok: true, status: response.status, fallback: !data.reply };
  } catch (error) {
    const reply = fallbackAgentReply(trimmed);
    guide(reply, "Agent");
    rememberAgentTurn("companion", reply);
    els.agentStatus.textContent = "Local explanation shown";
    return { ok: false, status: error.message || "error", fallback: true };
  } finally {
    state.agentBusy = false;
    updateAgentAwareness();
  }
}

function updateVoiceUi() {
  if (!els.voiceCompanion) return;
  const stateName = state.voiceRealtimeConnected
    ? "realtime"
    : state.voiceRealtimeConnecting
      ? "connecting"
      : state.voicePlaying
        ? "speaking"
        : state.voiceListening
          ? "listening"
          : state.voiceAutoNarrate
            ? "auto"
            : state.voiceEnabled
              ? "ready"
              : "off";
  els.voiceCompanion.dataset.state = stateName;
  const profile = currentVoiceProfile();
  els.voiceStatus.textContent = state.voiceRealtimeConnected
    ? "Realtime live"
    : state.voiceRealtimeConnecting
      ? "Connecting..."
      : state.voicePlaying
    ? "Speaking"
    : state.voiceListening
      ? "Listening"
      : state.voiceAutoNarrate
        ? "Auto launch"
      : state.voiceEnabled
        ? profile.label
        : "Off";
  if (els.voicePersonaCopy) {
    els.voicePersonaCopy.textContent = state.voiceEnabled
      ? profile.copy
      : "AI-generated voice. No local system voice.";
  }
  document.querySelectorAll("[data-voice-style]").forEach((button) => {
    button.classList.toggle("active", button.dataset.voiceStyle === state.voiceStyle);
  });
  if (els.voiceToggle) els.voiceToggle.textContent = state.voiceEnabled ? "Voice off" : "Voice on";
  if (els.voiceTalk) {
    els.voiceTalk.disabled = !state.voiceEnabled || state.voicePlaying;
    els.voiceTalk.textContent = state.voiceListening ? "Listening..." : "Talk";
  }
  if (els.voiceAuto) {
    els.voiceAuto.disabled = !state.voiceEnabled;
    els.voiceAuto.classList.toggle("active", state.voiceAutoNarrate);
    els.voiceAuto.textContent = state.voiceAutoNarrate ? "Auto on" : "Auto launch";
  }
  if (els.voiceBrief) {
    els.voiceBrief.disabled = !state.voiceEnabled || state.voicePlaying;
  }
  if (els.voiceRealtime) {
    els.voiceRealtime.disabled = !state.voiceEnabled || state.voiceRealtimeConnecting;
    els.voiceRealtime.classList.toggle("active", state.voiceRealtimeConnected);
    els.voiceRealtime.textContent = state.voiceRealtimeConnected ? "End live" : state.voiceRealtimeConnecting ? "Dialing..." : "Realtime";
  }
}

function closeRealtimeCompanion({ quiet = false } = {}) {
  state.voiceRealtimeDc?.close?.();
  state.voiceRealtimePc?.close?.();
  state.voiceRealtimeStream?.getTracks?.().forEach((track) => track.stop());
  if (state.voiceRealtimeAudio) {
    state.voiceRealtimeAudio.pause();
    state.voiceRealtimeAudio.srcObject = null;
  }
  state.voiceRealtimeDc = null;
  state.voiceRealtimePc = null;
  state.voiceRealtimeStream = null;
  state.voiceRealtimeAudio = null;
  state.voiceRealtimeLastText = "";
  state.voiceRealtimeConnecting = false;
  state.voiceRealtimeConnected = false;
  if (!quiet) guide("Realtime voice session ended. Text chat and generated voice still work.", "Agent");
  updateVoiceUi();
  updateAgentAwareness();
}

function sendRealtimeEvent(event) {
  if (!state.voiceRealtimeDc || state.voiceRealtimeDc.readyState !== "open") return false;
  state.voiceRealtimeDc.send(JSON.stringify(event));
  return true;
}

function realtimeCausalSnapshot(mode = "chat") {
  const sim = simSnapshot();
  const metrics = physicsMetrics();
  const peak = estimateMaxQ(metrics);
  const profile = currentVoiceProfile();
  return {
    voiceStyle: state.voiceStyle,
    rocket: currentRocket().name,
    part: currentPart().name,
    lesson: lessonTrack[state.lessonIndex]?.title,
    simulation: {
      mode,
      phase: launchSyncLabel(sim),
      "T/W": metrics.twr.toFixed(2),
      "delta-v margin": formatDeltaV(metrics.deltaVMargin),
      "Max-Q": `${peak.q.toFixed(0)} kPa`,
      velocity: formatVelocity(sim.velocity),
      altitude: `${sim.altitude.toFixed(1)} km`,
      control: state.controlFocus || "none",
      failure: state.failure?.reason || "none",
      profile: profile.label,
    },
  };
}

function voiceContextLine(mode = "chat") {
  return buildRealtimeCausalContext(realtimeCausalSnapshot(mode));
}

function realtimeTutorInstructions() {
  const profile = currentVoiceProfile();
  return [
    AGENT_PERSONALITY,
    profile.instructions,
    "You are live in the Rocket Agent Lab. Speak like a witty expert lab partner, not a formal narrator.",
    "Use short spoken turns: observe one visible thing, diagnose the controlling variable, then issue one tiny challenge.",
    "If the learner changes sliders or launches, reason from the live context; do not invent exact values.",
    "Interrupt cleanly when the learner speaks. Grade their last answer before introducing a new concept.",
    "If the learner asks a deep question, answer clearly, then offer a tiny experiment they can run in the app.",
    "Never monologue. Most turns should be 8 to 18 spoken seconds.",
  ].join("\n");
}

function requestRealtimeResponse(text, mode = "scene") {
  const [messageEvent, responseEvent] = buildRealtimeTutorTurnEvents(realtimeCausalSnapshot(mode), {
    mode,
    recentConversation: agentConversationText(),
    learnerEvent: text,
    liveAppContext: agentContextText(),
  });
  const sent = sendRealtimeEvent(messageEvent);
  if (sent) {
    sendRealtimeEvent(responseEvent);
  }
  return sent;
}

function handleRealtimeMessage(raw) {
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return;
  }
  const showRealtimeText = (text) => {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean || clean === state.voiceRealtimeLastText) return;
    state.voiceRealtimeLastText = clean;
    guide(clean, "Agent");
    rememberAgentTurn("companion", clean);
  };
  const transcript = event.transcript || event.text || event.delta?.transcript || event.delta?.text;
  if (/done$/.test(event.type || "") && transcript) showRealtimeText(transcript);
  if (event.type === "response.done") {
    const outputText = event.response?.output
      ?.flatMap((item) => item.content || [])
      ?.map((content) => content.transcript || content.text)
      ?.filter(Boolean)
      ?.join(" ");
    if (outputText) showRealtimeText(outputText);
    els.agentStatus.textContent = "Realtime companion live";
  }
  if (event.type === "error") {
    const message = event.error?.message || "Realtime session reported an error.";
    closeRealtimeCompanion({ quiet: true });
    guide(message, "Agent");
    els.agentStatus.textContent = "Realtime needs attention";
  }
}

async function startRealtimeCompanion() {
  if (!state.voiceEnabled) return;
  if (state.voiceRealtimeConnected || state.voiceRealtimeConnecting) {
    closeRealtimeCompanion();
    return;
  }
  if (!window.RTCPeerConnection || !navigator.mediaDevices?.getUserMedia) {
    els.agentStatus.textContent = "Realtime voice unsupported in this browser";
    guide("Realtime voice needs browser microphone and WebRTC support. Text chat still has full scene context.", "Agent");
    return;
  }
  state.voiceRealtimeConnecting = true;
  state.voiceRealtimeLastText = "";
  updateVoiceUi();
  els.agentStatus.textContent = "Opening Realtime voice session...";
  let setupStream = null;
  let setupPeerConnection = null;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setupStream = stream;
    const pc = new RTCPeerConnection();
    setupPeerConnection = pc;
    const audio = new Audio();
    audio.autoplay = true;
    pc.ontrack = (event) => {
      audio.srcObject = event.streams[0];
    };
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    const dc = pc.createDataChannel("oai-events");
    let openingTurnRequested = false;
    const requestOpeningTutorTurn = () => {
      if (openingTurnRequested || state.voiceRealtimeDc !== dc || !state.voiceRealtimeConnected) return false;
      openingTurnRequested = requestRealtimeResponse(
        "Greet the learner in one sentence. Then ask what they want to test: liftoff, Max-Q, staging, Blueprint, or trajectory.",
        "session-start",
      );
      return openingTurnRequested;
    };
    dc.onmessage = (event) => handleRealtimeMessage(event.data);
    dc.onopen = requestOpeningTutorTurn;
    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected"].includes(pc.connectionState) && (state.voiceRealtimeConnected || state.voiceRealtimeConnecting)) {
        closeRealtimeCompanion({ quiet: true });
        releaseRealtimeResources({ peerConnection: pc, stream });
        guide("Realtime voice disconnected. You can reconnect from the Voice companion row.", "Agent");
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const response = await fetch("/api/realtime-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sdp: offer.sdp,
        context: agentContextText(),
        voiceStyle: state.voiceStyle,
        voiceContext: buildRealtimeOpeningTutorContext(realtimeCausalSnapshot("realtime")),
        personality: realtimeTutorInstructions(),
      }),
    });
    const text = await response.text();
    if (!response.ok) {
      let message = text;
      try {
        message = JSON.parse(text).error || message;
      } catch {
        // Keep text body.
      }
      throw new Error(message || `Realtime endpoint returned ${response.status}`);
    }
    await pc.setRemoteDescription({ type: "answer", sdp: text });
    state.voiceRealtimePc = pc;
    state.voiceRealtimeDc = dc;
    state.voiceRealtimeStream = stream;
    state.voiceRealtimeAudio = audio;
    state.voiceRealtimeConnecting = false;
    state.voiceRealtimeConnected = true;
    // A data channel may have opened while setRemoteDescription was resolving.
    // Retry exactly once after the state-backed sender is ready.
    requestOpeningTutorTurn();
    state.voiceController?.abort?.();
    state.voicePlaying = false;
    setupStream = null;
    setupPeerConnection = null;
    els.agentStatus.textContent = "Realtime companion live";
    guide("Realtime voice is live. Ask normally, or launch and I will reason from the current scene.", "Agent");
  } catch (error) {
    state.voiceRealtimeConnecting = false;
    state.voiceRealtimeConnected = false;
    releaseRealtimeResources({ peerConnection: setupPeerConnection, stream: setupStream });
    state.voiceRealtimeStream?.getTracks?.().forEach((track) => track.stop());
    state.voiceRealtimeStream = null;
    els.agentStatus.textContent = "Realtime unavailable";
    guide(`Realtime could not connect: ${error.message || "unknown error"}. Generated voice and text chat remain available.`, "Agent");
  } finally {
    updateVoiceUi();
    updateAgentAwareness();
  }
}

async function speakAgentReply(text, options = {}) {
  if (!state.voiceEnabled || !text) return;
  const spoken = String(text).replace(/\s+/g, " ").trim();
  if (!spoken || spoken === state.voiceLastLine) return;
  state.voiceLastLine = spoken;
  if (options.interrupt !== false) state.voiceController?.abort?.();
  state.voiceController = new AbortController();
  state.voicePlaying = true;
  updateVoiceUi();
  try {
    const response = await fetch("/api/agent-voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: state.voiceController.signal,
      body: JSON.stringify({
        text: spoken.slice(0, 1200),
        context: agentContextText(),
        voiceMode: options.mode || state.voiceStyle || (state.launchStatus === "running" || state.launchStatus === "countdown" ? "mission-control" : "tutor"),
        voiceProfile: currentVoiceProfile(),
        voiceContext: voiceContextLine(options.mode || "tts"),
      }),
    });
    if (!response.ok) throw new Error(`Voice endpoint returned ${response.status}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await new Promise((resolve, reject) => {
      audio.onended = resolve;
      audio.onerror = reject;
      audio.play().catch(reject);
    });
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error.name !== "AbortError") {
      els.agentStatus.textContent = "OpenAI voice unavailable";
      if (els.voiceStatus) els.voiceStatus.textContent = "Needs API key";
    }
  } finally {
    state.voicePlaying = false;
    updateVoiceUi();
  }
}

function voiceLaunchLine(event) {
  const sim = simSnapshot();
  const metrics = physicsMetrics();
  const line = {
    systems: `Systems check. T over W is ${metrics.twr.toFixed(2)}. If that number is under one, gravity wins the argument.`,
    three: "T minus three. Watch the lower stack; this is where thrust has to stop being theoretical.",
    two: "T minus two. Tanks are doing the unglamorous work: carrying almost the whole rocket.",
    ignition: "Ignition. Hot gas down, momentum up. Newton is about to invoice us.",
    release: "Hold-down release. If T over W is healthy, the pad stops being a parking lot.",
    liftoff: `Liftoff. Velocity is ${formatVelocity(sim.velocity)}; now the question is whether it can become sideways speed.`,
    pitch: "Pitch program. The rocket is not just going up; it is starting to build an orbit.",
    maxq: `Max-Q. Air load is ${sim.q.toFixed(0)} kilopascals. This is where shape, structure, and guidance get judged.`,
    staging: "Staging. Empty hardware is now dead weight, so the stack throws it away.",
    upper: `Upper-stage burn. Mass is down to ${Math.round(sim.currentMassT)} tonnes; efficiency matters more than brute force.`,
    insertion: `Insertion check. Delta-v margin is ${formatDeltaV(metrics.deltaVMargin)}; that is the mission's report card.`,
  }[event.key];
  return line || event.text;
}

function speakCurrentBrief() {
  const sim = simSnapshot();
  const metrics = physicsMetrics();
  const coach = coachRecommendation();
  const part = currentPart();
  const line = [
    `${currentRocket().name} ${currentMission().label}: T over W ${metrics.twr.toFixed(2)}, delta-v margin ${formatDeltaV(metrics.deltaVMargin)}, Max-Q estimate ${estimateMaxQ(metrics).q.toFixed(0)} kilopascals.`,
    `${coach.move}`,
    `Selected part: ${part.name}.`,
  ].join(" ");
  guide(line, "Agent");
  rememberAgentTurn("companion", line);
  if (state.voiceRealtimeConnected) {
    requestRealtimeResponse(line, "brief");
  } else {
    speakAgentReply(line, { mode: "brief" });
  }
}

function startVoiceInput() {
  if (!state.voiceEnabled || state.voiceListening) return;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    els.agentStatus.textContent = "Browser speech input unavailable";
    return;
  }
  const recognition = new Recognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  state.voiceListening = true;
  updateVoiceUi();
  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    if (transcript) sendAgentPrompt(transcript);
  };
  recognition.onerror = () => {
    els.agentStatus.textContent = "Could not hear that clearly";
  };
  recognition.onend = () => {
    state.voiceListening = false;
    updateVoiceUi();
  };
  recognition.start();
}

async function runAgentStressTest() {
  setPanelMode("agent");
  if (els.agentStressCard) {
    els.agentStressCard.dataset.state = "running";
    els.agentStressCard.innerHTML = `
      <span>Stress test</span>
      <strong>Running live context loop...</strong>
      <p>Sending three prompts: blocker, causal chain, and quiz.</p>
    `;
  }
  const prompts = [
    "Use the current blueprint context. What is the first blocker, and what single control should I move first?",
    "Now assume I fixed pad acceleration but kept the same mass ratio. Explain the next likely failure chain from the live blueprint data.",
    "Give me one multiple-choice question about this exact rocket design. Keep the answer hidden until I reply.",
  ];
  const results = [];
  guide("Starting recursive agent stress test: context check -> causal chain -> student quiz.", "Test");
  for (const prompt of prompts) {
    results.push(await sendAgentPrompt(prompt));
    await new Promise((resolve) => setTimeout(resolve, 450));
  }
  const liveCount = results.filter((result) => result?.ok).length;
  const fallbackCount = results.filter((result) => result?.fallback).length;
  const stateName = liveCount === prompts.length ? "success" : liveCount > 0 ? "mixed" : "fallback";
  if (els.agentStressCard) {
    els.agentStressCard.dataset.state = stateName;
    els.agentStressCard.innerHTML = `
      <span>Stress test</span>
      <strong>${liveCount}/${prompts.length} live replies</strong>
      <p>${fallbackCount ? `${fallbackCount} fallback replies. ` : ""}Checked blocker, causal chain, and quiz behavior against the current blueprint.</p>
    `;
  }
  guide(`Stress test complete: ${liveCount}/${prompts.length} live replies. Check whether the agent used T/W, mass ratio, heat margin, and a concrete next action.`, "Test");
}

function fallbackAgentReply(prompt) {
  const metrics = physicsMetrics();
  const peak = estimateMaxQ(metrics);
  const part = currentPart();
  if (/engine|booster|thrust|lift/i.test(prompt) || metrics.twr < 1) {
    const status = metrics.twr < 1 ? "cannot lift yet" : "can lift right now";
    return `Start with T/W. This rocket is at ${metrics.twr.toFixed(2)}, so it ${status}. If it fails liftoff, move Engines right, choose 2 or 4 Boosters, or lower Payload.`;
  }
  if (/payload|mass/i.test(prompt)) {
    return `Payload makes final mass heavier. Here, ${state.payloadT.toFixed(1)} t gives delta-v margin ${formatDeltaV(metrics.deltaVMargin)}. Lower payload and watch m0/mf improve.`;
  }
  if (/momentum|impulse|vacuum|space\b|newton/i.test(prompt)) {
    return `In space, a rocket turns propellant momentum into vehicle momentum. The useful idea is J = F x dt = delta-p: longer burn or higher thrust gives more impulse, but dry mass still decides how much speed you keep.`;
  }
  if (/time dilation|relativity|space.?time|spacetime|clock|einstein/i.test(prompt)) {
    return `At these launch speeds, time dilation is tiny but real. Fast motion makes the onboard clock run slightly slower, while higher altitude weakens gravity and makes clocks run slightly faster. Navigation systems care because tiny clock errors become position errors.`;
  }
  if (/window|trajectory|mars|moon|jupiter|slingshot|gravity assist|landing|signal|communication|comms/i.test(prompt)) {
    const target = currentTrajectory();
    return `${target.label}: timing sets the intercept geometry, not just the launch date. Current window offset is ${state.windowOffsetDays} days, correction burn is ${state.correctionPercent}%, comm delay is ${target.commDelay}, and landing mode is ${landingSiteLabel()}. ${target.slingshot}`;
  }
  if (/max|drag|air|heat|thermal/i.test(prompt)) {
    return `Watch the orange air-load curve. Peak q is ${peak.q.toFixed(1)} kPa. Lower Drag, Wind, or Guidance to protect the structure.`;
  }
  return `${part.name}: ${compact(part.description, 82)} The useful equation is ${part.equation[1]}. Try changing one slider, then run Launch test.`;
}

function narrateLaunchEvent(event) {
  if (state.narratedEvents.has(event.key)) return;
  state.narratedEvents.add(event.key);
  guide(event.text, "Launch");
  if (state.voiceEnabled && state.voiceAutoNarrate) {
    if (state.voiceRealtimeConnected) {
      requestRealtimeResponse(voiceLaunchLine(event), "launch-event");
    } else {
      speakAgentReply(voiceLaunchLine(event), { mode: "launch-event" });
    }
  }
}

function updateLaunchNarration() {
  if (state.launchStatus === "countdown") {
    launchEvents
      .filter((event) => event.status === "countdown" && state.launchClock >= event.clock)
      .forEach(narrateLaunchEvent);
    return;
  }
  if (state.launchStatus === "running") {
    const sim = simSnapshot();
    launchEvents
      .filter((event) => event.status === "running" && sim.t >= event.t)
      .forEach(narrateLaunchEvent);
  }
}

function animate(now = performance.now(), fromFallback = false) {
  const rawDt = state.lastFrameMs ? (now - state.lastFrameMs) / 1000 : 1 / 60;
  const dt = clamp(rawDt, 0, 0.25);
  state.lastFrameMs = now;
  if (state.spin && !state.dragging) state.targetAngle += 0.0028;
  if (state.launchStatus === "countdown") {
    state.launchClock += dt;
    if (state.launchClock >= COUNTDOWN_SECONDS) {
      state.launchStatus = "running";
      state.simTime = 0;
      state.lastFrameMs = now;
    }
  } else if (state.simRunning && state.launchStatus !== "failed" && state.launchStatus !== "success") {
    state.simTime += state.launchStatus === "running" ? dt * 16 : dt * 8;
  }
  updateLaunchNarration();
  evaluateFlight();
  state.cuePulse += 1;
  if (state.controlPulse > 0) {
    state.controlPulse -= 1;
  } else {
    state.controlFocus = null;
  }
  state.angle += (state.targetAngle - state.angle) * 0.16;
  state.pitch += (state.targetPitch - state.pitch) * 0.16;
  state.focusY += (state.targetFocusY - state.focusY) * 0.16;
  drawScene();
  updateSimReadout();
  drawGraph();
  if (!qaMode && !fromFallback) requestAnimationFrame(animate);
}

function phaseName(stage) {
  if (state.launchStatus === "countdown") return "Countdown";
  if (state.launchStatus === "failed") return "Failure";
  if (state.launchStatus === "success") return "Mission";
  return stage === 0 ? "Boost" : stage === 1 ? "Stage 2" : "Orbit burn";
}

function updateSimReadout() {
  const sim = simSnapshot();
  els.simTime.textContent = state.launchStatus === "countdown"
    ? `T-${Math.max(0, Math.ceil(COUNTDOWN_SECONDS - state.launchClock))}`
    : `${Math.floor(sim.t)} s`;
  els.simVelocity.textContent = formatVelocity(sim.velocity);
  els.simAltitude.textContent = `${sim.altitude.toFixed(1)} km`;
  els.simEnergy.textContent = formatEnergy(kineticEnergyJ(sim));
  els.simMass.textContent = `${Math.round(sim.currentMassT)} t`;
  els.phaseLabel.textContent = phaseName(sim.stage);
  updateEffectReel();
  updateTrajectoryLive();
  updateExperimentReadout();
  renderEquationGrid();
}

function updateTrajectoryLive() {
  if (!els.trajectoryRibbon || !els.solarMap) return;
  const sim = simSnapshot();
  const progress = state.launchStatus === "running"
    ? clamp(sim.t / 180, 0.04, 0.94)
    : state.launchStatus === "success"
      ? 1
      : clamp(0.12 + state.correctionPercent / 100 * 0.18 - Math.abs(state.windowOffsetDays) / Math.max(1, currentTrajectory().windowDays || 1) * 0.08, 0.04, 0.42);
  const point = trajectoryCraftPosition(progress);
  els.solarMap.style.setProperty("--craft-x", `${point.x}px`);
  els.solarMap.style.setProperty("--craft-y", `${point.y}px`);
  renderTrajectoryRibbon(progress, 0);
}

function formatDeltaV(value) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return abs >= 1000 ? `${sign}${(abs / 1000).toFixed(2)} km/s` : `${sign}${Math.round(abs)} m/s`;
}

function formatVelocity(value) {
  return value >= 1000 ? `${(value / 1000).toFixed(2)} km/s` : `${Math.round(value)} m/s`;
}

function kineticEnergyJ(sim = simSnapshot()) {
  return 0.5 * sim.currentMassT * 1000 * sim.velocity ** 2;
}

function formatEnergy(joules) {
  if (joules >= 1e12) return `${(joules / 1e12).toFixed(2)} TJ`;
  if (joules >= 1e9) return `${(joules / 1e9).toFixed(2)} GJ`;
  if (joules >= 1e6) return `${(joules / 1e6).toFixed(1)} MJ`;
  return `${Math.round(joules / 1000)} kJ`;
}

function formatMissionTime(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function renderLatexLike(tex) {
  return tex
    .replace(/\\Delta/g, "Δ")
    .replace(/\\rho/g, "ρ")
    .replace(/\\ln/g, "ln")
    .replace(/\\approx/g, "≈")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "<span class=\"frac\"><span>$1</span><span>$2</span></span>")
    .replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>")
    .replace(/_\{([^}]+)\}/g, "<sub>$1</sub>")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\cdot/g, "·")
    .replace(/\\left|\\right/g, "");
}

function syncExperimentControls() {
  const rocket = currentRocket();
  els.payloadSlider.max = String(Math.max(rocket.maxPayloadT * 1.25, rocket.defaultPayloadT * 1.5));
  els.payloadSlider.value = String(state.payloadT);
  els.fuelSlider.value = String(state.fuelPercent);
  els.dragSlider.value = String(state.dragFactor);
  els.windSlider.value = String(state.windFactor);
  els.guidanceSlider.value = String(state.guidanceError);
  els.engineHealthSlider.value = String(state.engineHealth);
  els.structureSlider.value = String(state.structurePercent);
  els.heatShieldSlider.value = String(state.heatShieldPercent);
  els.stagingSlider.value = String(state.stagingTiming);
  updateExperimentReadout();
}

function renderBuilderControls() {
  const rocket = rockets[builderIndex()] || createBuilderRocket(builderConfig);
  els.builderStages.value = String(builderConfig.stages);
  els.builderBoosters.value = String(builderConfig.boosterPairs);
  els.builderEngines.value = String(builderConfig.engineCount);
  els.builderEngineModel.value = builderConfig.engineModel;
  els.builderDiameter.value = String(builderConfig.diameterM);
  els.builderUpper.value = builderConfig.upperStage;
  els.builderSkinMaterial.value = builderConfig.skinMaterial;
  els.builderTankMaterial.value = builderConfig.tankMaterial;
  els.builderHeatShieldMaterial.value = builderConfig.heatShieldMaterial;
  els.builderReuse.value = builderConfig.reuse;
  els.builderEngineValue.textContent = String(builderConfig.engineCount);
  els.builderDiameterValue.textContent = `${Number(builderConfig.diameterM).toFixed(1)} m`;
  const weightMN = (rocket.dryMassT + rocket.propellantT + rocket.defaultPayloadT) * 9.80665 / 1000;
  const twr = rocket.thrustMN / Math.max(0.1, weightMN);
  const dryFraction = rocket.dryMassT / Math.max(1, rocket.dryMassT + rocket.propellantT);
  const diagnosis = diagnoseBuilderRocket(rocket);
  const riskWords = [
    twr < 1 ? "will not lift" : "lifts off",
    dryFraction > 0.16 ? "too much dry mass" : "mass ratio ok",
    builderConfig.boosterPairs > 0 ? "booster timing matters" : "simple stack",
    builderConfig.reuse === "reusable" ? "reuse costs mass" : "more payload margin",
  ];
  els.builderReadout.innerHTML = `
    <div data-stat-action="height"><span>Height</span><strong>${rocket.heightM.toFixed(0)} m</strong></div>
    <div data-stat-action="thrust"><span>Thrust</span><strong>${rocket.thrustMN.toFixed(1)} MN</strong></div>
    <div data-stat-action="payload"><span>Payload class</span><strong>${rocket.maxPayloadT.toFixed(1)} t</strong></div>
    <div data-flight-workspace="engines"><span>Engine</span><strong>${engineCatalog[builderConfig.engineModel].name}</strong></div>
    <div data-flight-workspace="materials"><span>Skin</span><strong>${materialCatalog[builderConfig.skinMaterial].name}</strong></div>
    <div><span>Likely lesson</span><strong>${riskWords.join(" · ")}</strong></div>
  `;
  els.builderReadout.querySelectorAll("[data-stat-action]").forEach((item) => {
    item.addEventListener("click", () => explainStat(item.dataset.statAction));
  });
  els.builderReadout.querySelectorAll("[data-flight-workspace]").forEach((item) => {
    item.addEventListener("click", () => {
      setFlightWorkspace(item.dataset.flightWorkspace);
      renderUI();
    });
  });
  els.loadBuilder.textContent = state.rocketIndex === builderIndex() ? "Rebuild selected" : "Use custom rocket";
  els.builderDiagnosis.dataset.state = diagnosis.state;
  els.builderDiagnosisTitle.textContent = diagnosis.title;
  els.builderDiagnosisCopy.textContent = diagnosis.copy;
  els.builderRepairList.innerHTML = diagnosis.repairs.map((item) => `<li>${item}</li>`).join("");
}

function blueprintPhysics() {
  const rocket = createBuilderRocket(builderConfig);
  const wetMass = rocket.dryMassT + rocket.propellantT + rocket.defaultPayloadT;
  const dryPlusPayload = rocket.dryMassT + rocket.defaultPayloadT;
  const twr = rocket.thrustMN / Math.max(0.1, wetMass * 9.80665 / 1000);
  const massRatio = wetMass / Math.max(1, dryPlusPayload);
  const deltaV = rocket.ispS * 9.80665 * Math.log(Math.max(1.01, massRatio)) * rocket.stageGain;
  const heat = heatShieldCatalog[builderConfig.heatShieldMaterial] || heatShieldCatalog.ablative;
  const skin = materialCatalog[builderConfig.skinMaterial] || materialCatalog["aluminum-lithium"];
  const slenderness = rocket.heightM / Math.max(1, rocket.diameterM);
  const aeroRisk = clamp((slenderness - 10) / 18 + builderConfig.boosterPairs * 0.16 + (builderConfig.reuse === "reusable" ? 0.06 : 0), 0, 1.4);
  const heatMargin = heat.protection * skin.heat / Math.max(0.72, 0.82 + aeroRisk * 0.42);
  const centerOfMass = clamp(42 + builderConfig.stages * 8 + builderConfig.boosterPairs * 4 - rocket.defaultPayloadT / Math.max(1, rocket.maxPayloadT) * 8, 24, 76);
  const diagnosis = diagnoseBuilderRocket(rocket);
  const axialLoad = wetMass * 9.80665 / Math.max(1, rocket.diameterM ** 2 * 0.8);
  const hoopStress = rocket.diameterM * rocket.propellantT / Math.max(1, rocket.heightM * 4.8);
  const bendRisk = aeroRisk * (1 + builderConfig.boosterPairs * 0.18) * (builderConfig.reuse === "reusable" ? 1.1 : 1);
  const stationCount = Math.max(4, Number(builderConfig.stages) * 2 + Number(builderConfig.boosterPairs) + 2);
  return { rocket, wetMass, twr, massRatio, deltaV, heatMargin, centerOfMass, aeroRisk, diagnosis, axialLoad, hoopStress, bendRisk, stationCount };
}

function metricState(value, warningAt, dangerAt, lowBad = true) {
  if (lowBad) {
    if (value < dangerAt) return "danger";
    if (value < warningAt) return "warning";
    return "success";
  }
  if (value > dangerAt) return "danger";
  if (value > warningAt) return "warning";
  return "success";
}

function blueprintRocketMarkup() {
  const stages = Number(builderConfig.stages);
  const boosters = Number(builderConfig.boosterPairs);
  const engineDots = Math.min(12, Number(builderConfig.engineCount));
  const stageHtml = Array.from({ length: stages }, (_, index) => {
    const first = index === 0;
    const height = first ? 76 : 54;
    const fuel = Math.max(38, 96 - index * 17);
    const label = index === 0 ? "booster tank" : index === stages - 1 ? "upper stage" : "interstage";
    return `<div class="bp-stage" data-stage="${label}" style="--stage-h:${height}px;--fuel:${fuel}%"><i></i><b>${label}</b></div>`;
  }).join("");
  const engines = Array.from({ length: engineDots }, (_, index) => `<span style="--i:${index};--n:${engineDots}"></span>`).join("");
  const boosterHtml = [
    boosters >= 1 ? '<div class="bp-booster left"></div><div class="bp-booster right"></div>' : "",
    boosters >= 2 ? '<div class="bp-booster left outer"></div><div class="bp-booster right outer"></div>' : "",
  ].join("");
  return `
    <div class="bp-engine">${engines}</div>
    ${stageHtml}
    <div class="bp-nose"></div>
    ${boosterHtml}
  `;
}

function renderBlueprintRocket(bp) {
  const widthPx = clamp(42 + Number(builderConfig.diameterM) * 10, 48, 118);
  const markup = blueprintRocketMarkup();
  [els.blueprintCanvas, els.viewportBlueprintCanvas].filter(Boolean).forEach((canvas) => {
    canvas.style.setProperty("--bp-width", `${widthPx}px`);
    canvas.style.setProperty("--bp-com", `${bp.centerOfMass}%`);
    canvas.style.setProperty("--bp-risk", `${clamp(bp.aeroRisk, 0, 1)}`);
    canvas.style.setProperty("--bp-heat", `${clamp(1 / Math.max(0.35, bp.heatMargin), 0.2, 1.35)}`);
    canvas.style.setProperty("--bp-stations", `${bp.stationCount}`);
    canvas.dataset.layer = state.blueprintLayer;
    canvas.dataset.view = state.blueprintView;
  });
  if (els.blueprintHeight) els.blueprintHeight.textContent = `${bp.rocket.heightM.toFixed(0)} m`;
  if (els.blueprintWidth) els.blueprintWidth.textContent = `${Number(builderConfig.diameterM).toFixed(1)} m`;
  if (els.viewportBlueprintHeight) els.viewportBlueprintHeight.textContent = `${bp.rocket.heightM.toFixed(0)} m`;
  if (els.viewportBlueprintWidth) els.viewportBlueprintWidth.textContent = `${Number(builderConfig.diameterM).toFixed(1)} m`;
  if (els.blueprintRocket) els.blueprintRocket.innerHTML = markup;
  if (els.viewportBlueprintRocket) els.viewportBlueprintRocket.innerHTML = markup;
  if (els.viewportBlueprintLabels) {
    els.viewportBlueprintLabels.innerHTML = [
      ["Payload bay", `${bp.rocket.defaultPayloadT.toFixed(1)} t cargo`, "payload"],
      ["COM", `${Math.round(bp.centerOfMass)}% height`, "com"],
      ["Tank barrel", `${materialCatalog[builderConfig.tankMaterial]?.name}`, "tank"],
      ["Engine deck", `${builderConfig.engineCount} ${engineCatalog[builderConfig.engineModel]?.name}`, "engine"],
    ].map(([title, value, kind]) => `<button data-blueprint-label="${kind}" data-info="${title}" type="button"><span>${title}</span><strong>${value}</strong></button>`).join("");
  }
}

const blueprintSnapSlots = {
  stage: [
    { x: 50, y: 55, label: "center barrel" },
    { x: 50, y: 69, label: "lower barrel" },
  ],
  nose: [
    { x: 50, y: 33, label: "nose cone" },
  ],
  fin: [
    { x: 41, y: 72, label: "left fin" },
    { x: 59, y: 72, label: "right fin" },
  ],
};

function blueprintDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function snapBlueprintPart(kind, x, y) {
  const slots = blueprintSnapSlots[kind] || [];
  const nearest = slots
    .map((slot) => ({ ...slot, distance: blueprintDistance({ x, y }, slot) }))
    .sort((a, b) => a.distance - b.distance)[0];
  if (!nearest || nearest.distance > 10) {
    return { x, y, snapped: false, slot: "free placement" };
  }
  return { x: nearest.x, y: nearest.y, snapped: true, slot: nearest.label };
}

function playBlueprintCue(kind = "tap") {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return false;
  try {
    blueprintAudioContext ||= new AudioCtor();
    blueprintAudioContext.resume?.();
    const now = blueprintAudioContext.currentTime;
    const osc = blueprintAudioContext.createOscillator();
    const gain = blueprintAudioContext.createGain();
    const filter = blueprintAudioContext.createBiquadFilter();
    const cue = {
      sketch: { type: "triangle", f0: 360, f1: 520, volume: 0.018, duration: 0.055 },
      erase: { type: "sawtooth", f0: 180, f1: 90, volume: 0.018, duration: 0.075 },
      snap: { type: "sine", f0: 520, f1: 820, volume: 0.045, duration: 0.11 },
      loose: { type: "triangle", f0: 240, f1: 180, volume: 0.025, duration: 0.09 },
      clear: { type: "sawtooth", f0: 220, f1: 70, volume: 0.03, duration: 0.16 },
      break: { type: "sawtooth", f0: 110, f1: 42, volume: 0.07, duration: 0.42 },
    }[kind] || { type: "sine", f0: 300, f1: 300, volume: 0.02, duration: 0.08 };
    osc.type = cue.type;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(kind === "break" ? 900 : 1600, now);
    osc.frequency.setValueAtTime(cue.f0, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(24, cue.f1), now + cue.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(cue.volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(blueprintAudioContext.destination);
    osc.start(now);
    osc.stop(now + cue.duration + 0.02);
    return true;
  } catch {
    return false;
  }
}

function renderBlueprintParts() {
  if (!els.blueprintPartLayer) return;
  els.blueprintPartLayer.innerHTML = state.placedBlueprintParts.map((part) => `
    <button class="placed-blueprint-part placed-${part.kind} ${part.snapped ? "is-snapped" : "is-loose"}" data-placed-part="${part.id}" style="left:${part.x}%;top:${part.y}%;" type="button" title="${part.snapped ? `Snapped to ${part.slot}` : "Loose part, drag closer to the centerline slot"}">
      <i></i><span>${part.label}</span><em>${part.snapped ? part.slot : "loose"}</em>
    </button>
  `).join("");
}

function addBlueprintEvidencePart(partId) {
  const evidence = {
    engine: { kind: "engine", label: "Engines", x: 50, y: 78, slot: "engine deck" },
    raptor: { kind: "engine", label: "Raptor", x: 50, y: 78, slot: "engine deck" },
    fuel: { kind: "fuel", label: "Fuel", x: 50, y: 55, slot: "main tank" },
    cryo: { kind: "fuel", label: "Cryo", x: 50, y: 48, slot: "upper tank" },
    skin: { kind: "material", label: "Steel", x: 63, y: 55, slot: "outer skin" },
    shield: { kind: "material", label: "TPS", x: 50, y: 28, slot: "thermal shield" },
    booster: { kind: "fin", label: "Boosters", x: 40, y: 73, slot: "side attach" },
    slim: { kind: "stage", label: "Slim core", x: 50, y: 58, slot: "center barrel" },
  }[partId];
  if (!evidence) return false;
  const existing = state.placedBlueprintParts.find((part) => part.kind === evidence.kind && part.slot === evidence.slot);
  const item = {
    id: existing?.id || `${partId}-${Date.now()}`,
    snapped: true,
    ...evidence,
  };
  if (existing) Object.assign(existing, item);
  else state.placedBlueprintParts.push(item);
  return true;
}

function blueprintAssemblyReview(bp = blueprintPhysics()) {
  const parts = state.placedBlueprintParts;
  const kinds = new Set(parts.map((part) => part.kind));
  const snappedCount = parts.filter((part) => part.snapped).length;
  const configured = {
    body: Number(builderConfig.stages) >= 1,
    nose: bp.rocket.defaultPayloadT > 0,
    engine: Number(builderConfig.engineCount) > 0,
    fuel: bp.rocket.propellantT > 0,
    stability: Number(builderConfig.boosterPairs) > 0 || bp.centerOfMass > 34,
    material: Boolean(builderConfig.skinMaterial && builderConfig.heatShieldMaterial),
  };
  const checks = [
    {
      key: "body",
      label: "Body tube",
      placed: kinds.has("stage"),
      configured: configured.body,
      next: "Drag Tube or Stage onto the centerline.",
      copy: "The stack needs a visible load path from engines to payload.",
    },
    {
      key: "nose",
      label: "Nose / fairing",
      placed: kinds.has("nose"),
      configured: configured.nose,
      next: "Add Nose, then label payload volume.",
      copy: "The top shape protects payload and controls early drag.",
    },
    {
      key: "engine",
      label: "Engine deck",
      placed: kinds.has("engine"),
      configured: configured.engine,
      next: "Add Engines or Raptor, then check T/W.",
      copy: "Engines decide liftoff; placement shows the thrust path.",
    },
    {
      key: "fuel",
      label: "Fuel system",
      placed: kinds.has("fuel"),
      configured: configured.fuel,
      next: "Add Fuel or Cryo and compare tank volume.",
      copy: "Propellant mass is the mission budget, but tanks become dry mass.",
    },
    {
      key: "stability",
      label: "Stability",
      placed: kinds.has("fin"),
      configured: configured.stability,
      next: "Add Fins or simplify boosters.",
      copy: "Control surfaces, gimbals, and clean staging keep the nose pointed correctly.",
    },
    {
      key: "material",
      label: "Materials",
      placed: kinds.has("material"),
      configured: configured.material,
      next: "Add Steel or Shield and inspect stress margins.",
      copy: "Skin, tanks, and heat shield set the structural and thermal limits.",
    },
  ];
  const draftScore = checks.filter((check) => check.placed).length;
  const configScore = checks.filter((check) => check.configured).length;
  const firstMissing = checks.find((check) => !check.placed) || checks.find((check) => !check.configured);
  const launchReady = configScore === checks.length && bp.diagnosis.state !== "danger";
  const status = bp.diagnosis.state === "danger" ? "danger" : draftScore < 3 ? "warning" : draftScore === checks.length && launchReady ? "success" : "warning";
  const headline = draftScore === checks.length && launchReady
    ? "Blueprint is ready to launch."
    : launchReady
      ? `${firstMissing?.next || "Add the missing drawing evidence."} The config can fly, but the drawing is not fully explained yet.`
      : firstMissing?.next || "Launch, inspect, and refine one variable.";
  return { checks, draftScore, configScore, snappedCount, status, headline };
}

function renderBlueprintAssemblyReview(bp = blueprintPhysics()) {
  if (!els.viewportBlueprintReadiness) return;
  const review = blueprintAssemblyReview(bp);
  els.viewportBlueprintReadiness.dataset.state = review.status;
  els.viewportBlueprintReadiness.innerHTML = `
    <div class="readiness-head">
      <span>Assembly readiness</span>
      <strong>${review.configScore} / ${review.checks.length} configured · ${review.draftScore} / ${review.checks.length} drawn</strong>
      <em>${review.snappedCount} snapped parts</em>
    </div>
    <div class="readiness-grid">
      ${review.checks.map((check) => {
        const stateName = check.placed ? "drawn" : check.configured ? "configured" : "missing";
        return `
          <button data-readiness-check="${check.key}" data-state="${stateName}" title="${check.copy}" type="button">
            <i>${check.placed ? "✓" : check.configured ? "·" : "!"}</i>
            <span>${check.label}</span>
          </button>
        `;
      }).join("")}
    </div>
    <p>${review.headline}</p>
  `;
  els.viewportBlueprintReadiness.querySelectorAll("[data-readiness-check]").forEach((button) => {
    button.addEventListener("click", () => {
      const check = review.checks.find((item) => item.key === button.dataset.readinessCheck);
      if (!check) return;
      guide(`${check.label}: ${check.copy} ${check.next}`, "Blueprint");
      if (els.blueprintInventoryStatus) els.blueprintInventoryStatus.textContent = `${check.label}: ${check.next}`;
    });
  });
}

function blueprintManifestRows(bp = blueprintPhysics(), review = blueprintAssemblyReview(bp)) {
  const stress = blueprintStressModel(bp);
  const parts = state.placedBlueprintParts;
  const looseCount = parts.filter((part) => !part.snapped).length;
  return [
    {
      key: "structure",
      layer: "structure",
      title: "1. Structure",
      value: `${builderConfig.stages} stage${Number(builderConfig.stages) === 1 ? "" : "s"} · ${Number(builderConfig.diameterM).toFixed(1)} m`,
      state: review.checks.find((check) => check.key === "body")?.placed ? "success" : "warning",
      note: looseCount ? `${looseCount} loose sketch part${looseCount === 1 ? "" : "s"} to snap before handoff.` : "Load path is visually fitted to the centerline.",
    },
    {
      key: "engines",
      layer: "forces",
      title: "2. Engines",
      value: `${builderConfig.engineCount} ${engineCatalog[builderConfig.engineModel]?.name}`,
      state: bp.twr < 1 ? "danger" : bp.twr < 1.18 ? "warning" : "success",
      note: `T/W ${bp.twr.toFixed(2)}. ${bp.twr < 1 ? "Pad failure until thrust beats weight." : "Clears liftoff in this model."}`,
    },
    {
      key: "fuel",
      layer: "fuel",
      title: "3. Fuel",
      value: `${propellantCatalog[builderConfig.upperStage]?.name} · MR ${bp.massRatio.toFixed(1)}`,
      state: bp.deltaV < currentMission().targetDeltaVMps ? "danger" : bp.massRatio < 4 ? "warning" : "success",
      note: `Estimated Δv ${formatDeltaV(bp.deltaV)} against ${formatVelocity(currentMission().targetDeltaVMps)} target.`,
    },
    {
      key: "materials",
      layer: "thermal",
      title: "4. Materials",
      value: `${materialCatalog[builderConfig.skinMaterial]?.name} · ${heatShieldCatalog[builderConfig.heatShieldMaterial]?.name}`,
      state: stress.status,
      note: `Stress margin ${stress.margin.toFixed(2)}x, heat margin ${bp.heatMargin.toFixed(2)}x.`,
    },
    {
      key: "launch",
      layer: "orbit",
      title: "5. Launch handoff",
      value: bp.diagnosis.title,
      state: bp.diagnosis.state,
      note: review.headline,
    },
  ];
}

function renderBlueprintManifest(bp = blueprintPhysics()) {
  if (!els.viewportBlueprintManifest) return;
  const review = blueprintAssemblyReview(bp);
  const rows = blueprintManifestRows(bp, review);
  const worst = rows.some((row) => row.state === "danger") ? "danger" : rows.some((row) => row.state === "warning") ? "warning" : "success";
  els.viewportBlueprintManifest.dataset.state = worst;
  els.viewportBlueprintManifest.innerHTML = `
    <div class="manifest-head">
      <span>Launch manifest</span>
      <strong>${worst === "success" ? "Ready to simulate" : worst === "danger" ? "Fix before launch" : "Review before launch"}</strong>
    </div>
    <div class="manifest-rows">
      ${rows.map((row) => `
        <button data-manifest-key="${row.key}" data-manifest-layer="${row.layer}" data-state="${row.state}" type="button">
          <span>${row.title}</span>
          <strong>${row.value}</strong>
          <em>${row.note}</em>
        </button>
      `).join("")}
    </div>
  `;
  els.viewportBlueprintManifest.querySelectorAll("[data-manifest-layer]").forEach((button) => {
    button.addEventListener("click", () => {
      state.blueprintLayer = button.dataset.manifestLayer;
      state.activeBlueprintFault = button.dataset.manifestKey || rows.find((item) => item.layer === button.dataset.manifestLayer)?.key || "launch";
      renderBlueprintLab();
      guide(`Blueprint manifest opened the ${state.blueprintLayer} overlay. Use it to inspect the next launch decision.`, "Blueprint");
    });
  });
}

function blueprintFaultTree(bp = blueprintPhysics()) {
  const stress = blueprintStressModel(bp);
  const targetDv = currentMission().targetDeltaVMps;
  const heatGap = bp.heatMargin - 1;
  const checks = {
    structure: {
      label: "Structure chain",
      state: stress.status,
      cause: stress.firstMode[0],
      equation: "σ = F / A",
      bars: [
        ["Axial", stress.axialMpa, stress.allowableMpa],
        ["Hoop", stress.hoopMpa, stress.tank.strengthMpa],
        ["Bend", stress.bendingMpa, stress.allowableMpa],
      ],
      control: "Width",
      move: stress.status === "danger" ? "Increase structure health or reduce wet mass." : "Keep the load path centered before adding payload.",
      action: () => changeBuilderConfig("diameterM", Math.min(9, Number(builderConfig.diameterM) + 0.4)),
    },
    engines: {
      label: "Liftoff chain",
      state: bp.twr < 1 ? "danger" : bp.twr < 1.18 ? "warning" : "success",
      cause: bp.twr < 1 ? "thrust loses to weight" : "thrust margin is usable",
      equation: "T / W > 1",
      bars: [
        ["T/W", bp.twr, 1.25],
        ["Thrust", bp.rocket.thrustMN, Math.max(1, (bp.wetMass * 9.80665 / 1000) * 1.4)],
        ["Weight", bp.wetMass * 9.80665 / 1000, Math.max(1, bp.rocket.thrustMN * 1.15)],
      ],
      control: "Engines",
      move: bp.twr < 1 ? "Add engines or reduce payload until T/W clears 1." : "Use the smallest engine count that still clears liftoff.",
      action: () => changeBuilderConfig("engineCount", Math.min(33, Number(builderConfig.engineCount) + 2)),
    },
    fuel: {
      label: "Velocity chain",
      state: bp.deltaV < targetDv ? "danger" : bp.massRatio < 4 ? "warning" : "success",
      cause: bp.deltaV < targetDv ? "not enough usable velocity" : "mass ratio closes the mission",
      equation: "Δv = Isp g0 ln(m0/mf)",
      bars: [
        ["Δv", bp.deltaV, Math.max(targetDv * 1.2, 1)],
        ["Goal", targetDv, Math.max(targetDv * 1.2, 1)],
        ["MR", bp.massRatio, 12],
      ],
      control: "Fuel",
      move: bp.deltaV < targetDv ? "Switch upper fuel or reduce payload before adding more dry hardware." : "Do not chase fuel if mass ratio is already healthy.",
      action: () => changeBuilderConfig("upperStage", builderConfig.upperStage === "cryo" ? "methalox" : "cryo"),
    },
    materials: {
      label: "Thermal chain",
      state: stress.status === "danger" || heatGap < -0.18 ? "danger" : heatGap < 0 ? "warning" : "success",
      cause: heatGap < 0 ? "heat shield margin is thin" : stress.firstMode[0],
      equation: "q = 1/2 ρv²",
      bars: [
        ["Heat", bp.heatMargin, 1.25],
        ["Stress", stress.margin, 1.4],
        ["Risk", bp.aeroRisk, 1],
      ],
      control: "Material",
      move: heatGap < 0 ? "Upgrade the heat shield or lower aero risk before the next launch." : "Material margins are currently not the first blocker.",
      action: () => changeBuilderConfig("heatShieldMaterial", builderConfig.heatShieldMaterial === "ceramic" ? "metallic" : "ceramic"),
    },
    launch: {
      label: "Launch handoff",
      state: bp.diagnosis.state,
      cause: bp.diagnosis.title,
      equation: "Close one blocker",
      bars: [
        ["T/W", bp.twr, 1.25],
        ["Δv", bp.deltaV, Math.max(targetDv * 1.2, 1)],
        ["Heat", bp.heatMargin, 1.25],
      ],
      control: "Next test",
      move: bp.diagnosis.copy,
      action: () => sendBlueprintToLaunch(),
    },
  };
  const layerFault = {
    structure: "structure",
    forces: "engines",
    fuel: "fuel",
    thermal: "materials",
    orbit: "launch",
  }[state.blueprintLayer];
  return checks[layerFault || state.activeBlueprintFault] || checks.launch;
}

function renderBlueprintFaultTree(bp = blueprintPhysics()) {
  if (!els.viewportBlueprintFaultTree) return;
  const tree = blueprintFaultTree(bp);
  els.viewportBlueprintFaultTree.dataset.state = tree.state;
  const barHtml = tree.bars.map(([label, value, max]) => {
    const fill = clamp(value / Math.max(1, max), 0, 1);
    const shown = value > 100 ? Math.round(value).toLocaleString() : value.toFixed(value < 10 ? 2 : 1);
    return `
      <div>
        <span>${label}</span>
        <i style="--fill:${fill.toFixed(3)}"></i>
        <strong>${shown}</strong>
      </div>
    `;
  }).join("");
  els.viewportBlueprintFaultTree.innerHTML = `
    <div class="fault-head">
      <span>Fault tree</span>
      <strong>${tree.label}</strong>
      <em>${tree.cause}</em>
    </div>
    <div class="fault-equation">${tree.equation}</div>
    <div class="fault-bars">${barHtml}</div>
    <div class="fault-next">
      <span>${tree.control}</span>
      <p>${compact(tree.move, 130)}</p>
    </div>
    <div class="fault-actions">
      <button data-fault-action="try" type="button">Try fix</button>
      <button data-fault-action="ask" type="button">Ask Vector</button>
    </div>
  `;
  els.viewportBlueprintFaultTree.querySelector("[data-fault-action='try']")?.addEventListener("click", () => {
    tree.action?.();
    guide(`Fault tree applied one ${tree.control} move. Recheck the bars before launching.`, "Blueprint");
  });
  els.viewportBlueprintFaultTree.querySelector("[data-fault-action='ask']")?.addEventListener("click", () => {
    setPanelMode("agent");
    sendAgentPrompt([
      `Explain this Blueprint fault tree like a concise lab partner.`,
      `Active chain: ${tree.label}; cause: ${tree.cause}; equation: ${tree.equation}; suggested move: ${tree.move}`,
      blueprintContextText(),
      "Ask one short check question at the end.",
    ].join("\n"));
  });
}

function blueprintDesignBrief(bp = blueprintPhysics()) {
  const mission = currentMission();
  const tree = blueprintFaultTree(bp);
  const stress = blueprintStressModel(bp);
  const targetDv = mission.targetDeltaVMps;
  const proof = tree.equation;
  const status = tree.state === "danger" ? "danger" : tree.state === "warning" ? "warning" : "success";
  const target = `${mission.label} · ${formatVelocity(targetDv)}`;
  const blocker = tree.state === "success" ? "Ready for launch test" : tree.cause;
  const next = tree.state === "success"
    ? "Launch it, then change one variable and compare the failure graph."
    : tree.move;
  const watch = tree.label.includes("Velocity")
    ? "Watch delta-v margin and mass ratio after the burn."
    : tree.label.includes("Thermal")
      ? `Watch heat margin ${bp.heatMargin.toFixed(2)}x and stress ${stress.margin.toFixed(2)}x.`
      : tree.label.includes("Liftoff")
        ? `Watch T/W ${bp.twr.toFixed(2)}. The pad only releases a rocket that beats weight.`
        : tree.label.includes("Structure")
          ? `Watch stress margin ${stress.margin.toFixed(2)}x. Loads must close through the frame.`
          : `Watch ${bp.diagnosis.title.toLowerCase()} before handoff.`;
  return { mission, tree, status, target, blocker, next, proof, watch };
}

function renderBlueprintDesignBrief(bp = blueprintPhysics()) {
  if (!els.viewportBlueprintBrief) return;
  const brief = blueprintDesignBrief(bp);
  els.viewportBlueprintBrief.dataset.state = brief.status;
  els.viewportBlueprintBrief.innerHTML = `
    <div class="brief-head">
      <span>Design brief</span>
      <strong>${brief.status === "success" ? "Launch-ready. Now test one change." : "Fix this before the next launch."}</strong>
    </div>
    <div class="brief-proof">
      <button data-brief-action="mission" type="button">
        <span>Goal</span>
        <strong>${brief.target}</strong>
      </button>
      <button data-brief-action="blocker" type="button">
        <span>Blocker</span>
        <strong>${compact(brief.blocker, 44)}</strong>
      </button>
      <button data-brief-action="proof" type="button">
        <span>Proof</span>
        <strong>${brief.proof}</strong>
      </button>
    </div>
    <p>${compact(brief.next, 150)}</p>
    <em>${compact(brief.watch, 150)}</em>
    <div class="brief-actions">
      <button data-brief-action="apply" type="button">${brief.status === "success" ? "Launch test" : "Apply next move"}</button>
      <button data-brief-action="ask" type="button">Ask why</button>
      <button data-brief-action="launch" type="button">Launch</button>
    </div>
  `;
  els.viewportBlueprintBrief.querySelectorAll("[data-brief-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.briefAction;
      if (action === "apply") {
        if (brief.status === "success") {
          sendBlueprintToLaunch();
          return;
        }
        brief.tree.action?.();
        guide(`Blueprint brief applied the next ${brief.tree.control} move. Check whether ${brief.proof} improved.`, "Blueprint");
        return;
      }
      if (action === "ask") {
        setPanelMode("agent");
        sendAgentPrompt([
          "Explain the current Blueprint design brief in one concise coaching turn.",
          `Goal: ${brief.target}`,
          `Blocker: ${brief.blocker}`,
          `Proof equation: ${brief.proof}`,
          `Next move: ${brief.next}`,
          blueprintContextText(),
          "End with one prediction question for the student.",
        ].join("\n"));
        return;
      }
      if (action === "launch") {
        sendBlueprintToLaunch();
        return;
      }
      guide(`${button.innerText.replace(/\s+/g, " ")}. ${brief.watch}`, "Blueprint");
    });
  });
}

function resizeSketchCanvas() {
  const canvas = els.blueprintSketchCanvas;
  const host = els.viewportBlueprintCanvas;
  if (!canvas || !host) return;
  const rect = host.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const old = document.createElement("canvas");
  old.width = canvas.width;
  old.height = canvas.height;
  old.getContext("2d")?.drawImage(canvas, 0, 0);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (old.width && old.height) ctx.drawImage(old, 0, 0, canvas.width, canvas.height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function sketchPoint(event) {
  const canvas = els.blueprintSketchCanvas;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  return {
    x: (event.clientX - rect.left) * dpr,
    y: (event.clientY - rect.top) * dpr,
  };
}

function drawSketchLine(from, to) {
  const canvas = els.blueprintSketchCanvas;
  const ctx = canvas?.getContext("2d");
  if (!ctx || !from || !to) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.globalCompositeOperation = state.draftTool === "erase" ? "destination-out" : "source-over";
  ctx.strokeStyle = state.draftTool === "erase" ? "rgba(0,0,0,1)" : "rgba(159, 222, 255, 0.92)";
  ctx.lineWidth = (state.draftTool === "erase" ? 18 : 3) * dpr;
  ctx.shadowColor = state.draftTool === "erase" ? "transparent" : "rgba(93, 242, 193, 0.34)";
  ctx.shadowBlur = state.draftTool === "erase" ? 0 : 8 * dpr;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
  const now = performance.now();
  if (now - state.lastSketchSound > 72) {
    playBlueprintCue(state.draftTool === "erase" ? "erase" : "sketch");
    state.lastSketchSound = now;
  }
}

function clearBlueprintSketch() {
  const canvas = els.blueprintSketchCanvas;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  state.placedBlueprintParts = [];
  renderBlueprintParts();
  renderBlueprintAssemblyReview();
  playBlueprintCue("clear");
  if (els.blueprintInventoryStatus) els.blueprintInventoryStatus.textContent = "Cleared sketch marks and loose blueprint parts.";
}

function addBlueprintSketchPart(partId, event) {
  const host = els.viewportBlueprintCanvas;
  if (!host) return false;
  const rect = host.getBoundingClientRect();
  const x = event ? clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 88) : 50;
  const y = event ? clamp(((event.clientY - rect.top) / rect.height) * 100, 12, 88) : 52;
  const partMap = {
    "sketch-stage": ["stage", "Tube"],
    "sketch-nose": ["nose", "Nose"],
    "sketch-fin": ["fin", "Fin"],
  };
  const [kind, label] = partMap[partId] || [];
  if (!kind) return false;
  const fitted = snapBlueprintPart(kind, x, y);
  state.placedBlueprintParts.push({
    id: `${partId}-${Date.now()}`,
    kind,
    label,
    x: Math.round(fitted.x * 10) / 10,
    y: Math.round(fitted.y * 10) / 10,
    snapped: fitted.snapped,
    slot: fitted.slot,
  });
  renderBlueprintParts();
  renderBlueprintAssemblyReview();
  playBlueprintCue(fitted.snapped ? "snap" : "loose");
  if (els.blueprintInventoryStatus) {
    els.blueprintInventoryStatus.textContent = fitted.snapped
      ? `${label} snapped into the ${fitted.slot}. It is fitted to the assembly axis.`
      : `${label} placed loose. Move closer to a ghost slot to fit it like a brick.`;
  }
  return true;
}

function blueprintLayerInfo(bp) {
  const propellant = propellantCatalog[builderConfig.upperStage]?.name || "propellant";
  const material = materialCatalog[builderConfig.skinMaterial]?.name || "skin";
  const layer = {
    structure: ["Frame overlay", "Stations, joints, and dry mass", "m0 = mdry + mprop + mpayload", `${material} skin. Dry mass is ${bp.rocket.dryMassT} t before payload.`],
    forces: ["Force overlay", "Thrust, weight, and bending", "ΣF = T - W - D", `T/W is ${bp.twr.toFixed(2)}. Green arrow must beat red before anything flies.`],
    fuel: ["Fuel overlay", "Propellant volume and mass ratio", "Δv = Isp · g0 · ln(m0/mf)", `${propellant}. Mass ratio is ${bp.massRatio.toFixed(1)}; density changes tank size.`],
    thermal: ["Thermal overlay", "Max-Q heat and TPS margin", "q = 1/2 · ρ · v²", `TPS margin is ${bp.heatMargin.toFixed(2)}x. Red zones are nose, leading edges, and engine base.`],
    orbit: ["Trajectory overlay", "Velocity direction, not altitude", "v_orbit ≈ 7.8 km/s", `The design must become sideways speed. Delta-v estimate is ${formatDeltaV(bp.deltaV)}.`],
  }[state.blueprintLayer];
  return layer || ["Frame overlay", "Structure + dimensions", "m0 = dry + propellant + payload", "Change one design variable at a time."];
}

function blueprintStressModel(bp) {
  const skin = materialCatalog[builderConfig.skinMaterial] || materialCatalog["aluminum-lithium"];
  const tank = materialCatalog[builderConfig.tankMaterial] || skin;
  const shield = heatShieldCatalog[builderConfig.heatShieldMaterial] || heatShieldCatalog.ablative;
  const axialMpa = clamp(bp.axialLoad * 0.105, 8, 980);
  const hoopMpa = clamp(bp.hoopStress * 0.62, 6, 760);
  const bendingMpa = clamp(bp.bendRisk * 185, 4, 520);
  const shearMpa = clamp((bp.aeroRisk * 44) + (Number(builderConfig.boosterPairs) * 18), 2, 180);
  const combinedMpa = axialMpa + hoopMpa * 0.42 + bendingMpa * 0.7 + shearMpa * 0.35;
  const allowableMpa = Math.max(80, Math.min(skin.strengthMpa, tank.strengthMpa) * Math.max(0.68, shield.protection * 0.76));
  const margin = allowableMpa / Math.max(1, combinedMpa);
  const strainMicro = (combinedMpa / Math.max(1, skin.youngGpa * 1000)) * 1_000_000;
  const firstMode = [
    ["axial compression", axialMpa / Math.max(1, allowableMpa), "Lower wet mass or raise thrust-to-weight before liftoff."],
    ["tank hoop stress", hoopMpa / Math.max(1, tank.strengthMpa), "Wider or denser tanks change wall stress; cryogenic volume is the usual culprit."],
    ["bending / separation", bendingMpa / Math.max(1, allowableMpa), "Reduce boosters, wind, guidance error, or side-load complexity."],
    ["shear", shearMpa / Math.max(1, allowableMpa), "Keep thrust path, fins, and side boosters aligned with the centerline."],
  ].sort((a, b) => b[1] - a[1])[0];
  const status = margin < 0.85 ? "danger" : margin < 1.25 ? "warning" : "success";
  return { skin, tank, shield, axialMpa, hoopMpa, bendingMpa, shearMpa, combinedMpa, allowableMpa, margin, strainMicro, firstMode, status };
}

function renderBlueprintStressLab(bp) {
  if (!els.viewportBlueprintStress) return;
  const stress = blueprintStressModel(bp);
  const bar = (label, value, max, copy) => {
    const pct = clamp(value / Math.max(1, max), 0, 1.25);
    const stateName = pct > 0.9 ? "danger" : pct > 0.68 ? "warning" : "success";
    return `
      <button data-stress-topic="${label.toLowerCase()}" data-state="${stateName}" title="${copy}">
        <span>${label}</span>
        <strong>${Math.round(value)} MPa</strong>
        <i style="--fill:${Math.min(1, pct).toFixed(3)}"></i>
      </button>
    `;
  };
  els.viewportBlueprintStress.dataset.state = stress.status;
  els.viewportBlueprintStress.innerHTML = `
    <div class="stress-lab-head">
      <span>Materials stress lab</span>
      <strong>${stress.firstMode[0]} is the active risk</strong>
      <em>${stress.skin.name} skin · ${stress.tank.name} tank · margin ${stress.margin.toFixed(2)}x</em>
    </div>
    <div class="stress-bars">
      ${bar("Axial", stress.axialMpa, stress.allowableMpa, "Compression down the stack from wet mass and thrust path.")}
      ${bar("Hoop", stress.hoopMpa, stress.tank.strengthMpa, "Tank wall stress from propellant volume and diameter.")}
      ${bar("Bending", stress.bendingMpa, stress.allowableMpa, "Side loads from wind, boosters, and guidance error.")}
      ${bar("Shear", stress.shearMpa, stress.allowableMpa, "Off-axis loads through joints, fins, and booster attach points.")}
    </div>
    <div class="stress-tensor">
      <span>σ tensor sketch</span>
      <code>[ ${Math.round(stress.axialMpa)}  ${Math.round(stress.shearMpa)} ; ${Math.round(stress.shearMpa)}  ${Math.round(stress.hoopMpa)} ] MPa</code>
      <p>${stress.firstMode[2]}</p>
    </div>
  `;
}

function renderBlueprintLab() {
  if (!els.blueprintCanvas) return;
  const bp = blueprintPhysics();
  const checks = [
    ["Liftoff", bp.twr >= 1, `T/W ${bp.twr.toFixed(2)} ${bp.twr >= 1 ? "clears gravity" : "cannot leave pad"}`],
    ["Mass ratio", bp.massRatio >= 4.2, `m0/mf ${bp.massRatio.toFixed(1)} ${bp.massRatio >= 4.2 ? "has room" : "too much dead mass"}`],
    ["Heat", bp.heatMargin >= 1, `TPS margin ${bp.heatMargin.toFixed(2)}x`],
    ["Complexity", bp.aeroRisk < 0.78, bp.aeroRisk < 0.78 ? "clean enough" : "separation and aero risk high"],
  ];
  const passed = checks.filter(([, pass]) => pass).length;
  els.blueprintStatus.textContent = passed === checks.length ? "Launch-ready" : `${passed}/${checks.length} checks`;
  document.querySelectorAll("[data-blueprint-layer]").forEach((button) => {
    button.classList.toggle("active", button.dataset.blueprintLayer === state.blueprintLayer);
  });
  document.querySelectorAll("[data-blueprint-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.blueprintView === state.blueprintView);
  });
  document.querySelectorAll("[data-draft-tool]").forEach((button) => {
    button.classList.toggle("active", button.dataset.draftTool === state.draftTool);
  });
  els.blueprintStages.value = String(builderConfig.stages);
  els.blueprintBoosters.value = String(builderConfig.boosterPairs);
  els.blueprintEngines.value = String(builderConfig.engineCount);
  els.blueprintEngineModel.value = builderConfig.engineModel;
  els.blueprintDiameter.value = String(builderConfig.diameterM);
  els.blueprintUpper.value = builderConfig.upperStage;
  els.blueprintSkin.value = builderConfig.skinMaterial;
  els.blueprintShield.value = builderConfig.heatShieldMaterial;
  els.blueprintEnginesValue.textContent = String(builderConfig.engineCount);
  els.blueprintDiameterValue.textContent = `${Number(builderConfig.diameterM).toFixed(1)} m`;
  if (els.viewportBlueprintTitle) {
    els.viewportBlueprintTitle.textContent = `${bp.rocket.name} · ${builderConfig.stages}-stage ${propellantCatalog[builderConfig.upperStage]?.name}`;
  }
  const [kicker, title, equation, diagnosisCopy] = blueprintLayerInfo(bp);
  if (els.blueprintLayerKicker) els.blueprintLayerKicker.textContent = kicker;
  if (els.blueprintLayerTitle) els.blueprintLayerTitle.textContent = title;
  if (els.blueprintLayerEquation) els.blueprintLayerEquation.textContent = equation;
  document.querySelectorAll("[data-blueprint-control]").forEach((control) => {
    const key = control.dataset.blueprintControl;
    if (key && key in builderConfig) control.value = String(builderConfig[key]);
  });
  renderBlueprintRocket(bp);
  renderBlueprintParts();
  const metricsHtml = [
    ["T/W", bp.twr.toFixed(2), "Engines vs gravity", metricState(bp.twr, 1.15, 1, true), "Thrust-to-weight decides if the pad releases into flight or failure."],
    ["m0/mf", bp.massRatio.toFixed(1), "Mass ratio", metricState(bp.massRatio, 5, 3.6, true), "More propellant helps only when tanks and payload do not become dead mass."],
    ["Δv", formatDeltaV(bp.deltaV), "Speed budget", metricState(bp.deltaV, 8200, 7600, true), "The mission closes when usable velocity beats the target plus losses."],
    ["COM", `${Math.round(bp.centerOfMass)}%`, "Balance", metricState(Math.abs(bp.centerOfMass - 54), 18, 27, false), "Center of mass too high or low makes guidance work harder."],
  ].map(([label, value, hint, status, copy]) => `
    <button data-info="${label}" data-state="${status}" title="${copy}">
      <span>${hint}</span><strong>${label} ${value}</strong>
    </button>
  `).join("");
  els.blueprintMetrics.innerHTML = metricsHtml;
  if (els.viewportBlueprintMetrics) els.viewportBlueprintMetrics.innerHTML = metricsHtml;
  const checklistHtml = checks.map(([label, pass, copy]) => `
    <div data-state="${pass ? "success" : "danger"}">
      <span>${pass ? "✓" : "!"} ${label}</span><strong>${copy}</strong>
    </div>
  `).join("");
  els.blueprintChecklist.innerHTML = checklistHtml;
  if (els.viewportBlueprintChecklist) els.viewportBlueprintChecklist.innerHTML = checklistHtml;
  renderBlueprintAssemblyReview(bp);
  renderBlueprintDesignBrief(bp);
  renderBlueprintManifest(bp);
  renderBlueprintFaultTree(bp);
  if (els.viewportBlueprintDiagnosis) {
    els.viewportBlueprintDiagnosis.dataset.state = bp.diagnosis.state;
    els.viewportBlueprintDiagnosis.innerHTML = `
      <span>First blocker</span>
      <strong>${bp.diagnosis.title}</strong>
      <p>${compact(bp.diagnosis.copy, 110)}</p>
      <code>${diagnosisCopy}</code>
    `;
  }
  renderBlueprintStressLab(bp);
  const layerCopy = {
    structure: "Frame view: change width, stages, skin, and boosters. Watch mass ratio before adding more hardware.",
    forces: "Forces view: thrust must beat weight first. More engines help, but they also add dry mass.",
    fuel: "Fuel view: tanks are the rocket. Upper-stage fuel changes density, Isp, and final velocity.",
    thermal: "Heat view: fast air and weak TPS turn Max-Q into a material problem.",
    orbit: "Orbit view: the stack must become sideways velocity, not just altitude.",
  };
  els.blueprintDidYouKnow.textContent = layerCopy[state.blueprintLayer] || layerCopy.structure;
}

function blueprintContextText() {
  const bp = blueprintPhysics();
  const stress = blueprintStressModel(bp);
  const review = blueprintAssemblyReview(bp);
  const brief = blueprintDesignBrief(bp);
  return [
    `Blueprint layer: ${state.blueprintLayer}`,
    `Architecture: ${builderConfig.stages} stages, ${builderConfig.boosterPairs * 2} boosters, ${builderConfig.engineCount} ${engineCatalog[builderConfig.engineModel]?.name} engines, ${Number(builderConfig.diameterM).toFixed(1)} m width`,
    `Materials/fuel: skin ${materialCatalog[builderConfig.skinMaterial]?.name}, heat shield ${heatShieldCatalog[builderConfig.heatShieldMaterial]?.name}, upper fuel ${propellantCatalog[builderConfig.upperStage]?.name}`,
    `Blueprint metrics: T/W ${bp.twr.toFixed(2)}, mass ratio ${bp.massRatio.toFixed(2)}, delta-v ${formatDeltaV(bp.deltaV)}, heat margin ${bp.heatMargin.toFixed(2)}x, COM ${Math.round(bp.centerOfMass)}%`,
    `Assembly readiness: ${review.configScore}/${review.checks.length} configured, ${review.draftScore}/${review.checks.length} drawn, ${review.snappedCount} snapped; next action ${review.headline}`,
    `Assembly checks: ${review.checks.map((check) => `${check.label}=${check.placed ? "drawn" : check.configured ? "configured" : "missing"}`).join(", ")}`,
    `Launch manifest: ${blueprintManifestRows(bp, review).map((row) => `${row.title} ${row.state} ${row.value}`).join(" | ")}`,
    `Active fault tree: ${blueprintFaultTree(bp).label}, ${blueprintFaultTree(bp).state}, ${blueprintFaultTree(bp).cause}, equation ${blueprintFaultTree(bp).equation}`,
    `Design brief: goal ${brief.target}; blocker ${brief.blocker}; proof ${brief.proof}; next move ${brief.next}; watch ${brief.watch}`,
    `Blueprint stress: active mode ${stress.firstMode[0]}, margin ${stress.margin.toFixed(2)}x, axial ${Math.round(stress.axialMpa)} MPa, hoop ${Math.round(stress.hoopMpa)} MPa, bending ${Math.round(stress.bendingMpa)} MPa, shear ${Math.round(stress.shearMpa)} MPa, microstrain ${Math.round(stress.strainMicro)}`,
    `First diagnosis: ${bp.diagnosis.title}; ${bp.diagnosis.copy}`,
  ].join("\n");
}

function askBlueprintTutor() {
  setPanelMode("agent");
  sendAgentPrompt([
    "Act like a concise engineering tutor for the Blueprint Lab.",
    "Explain the first design issue, point to one blueprint control to change, and ask one multiple-choice check.",
    blueprintContextText(),
  ].join("\n"));
}

function sendBlueprintToLaunch() {
  state.workspaceMode = "launch";
  selectBuilderRocket();
  state.flightWorkspace = "build";
  state.showLabels = true;
  state.cutaway = true;
  setPanelMode("flight");
  renderUI();
  guide("Blueprint sent to launch. The 3D stack now uses the same stages, engines, fuel, and materials.", "Blueprint");
}

function toggleBlueprintWorkspace(forceMode) {
  const next = forceMode || (state.workspaceMode === "blueprint" ? "launch" : "blueprint");
  state.workspaceMode = next;
  if (next === "blueprint") {
    updateBuilderRocket({ select: true });
    renderRocketList();
    setPanelMode("agent");
    renderUI();
    requestAnimationFrame(resizeSketchCanvas);
    if (window.matchMedia("(max-width: 820px)").matches) window.scrollTo({ top: 0, left: 0 });
    guide("Blueprint workspace opened. Change the drawing, then launch the exact same configuration.", "Blueprint");
    return;
  }
  setPanelMode("flight");
  renderUI();
}

function explainStat(action) {
  const rocket = currentRocket();
  if (/height/.test(action)) {
    state.scale = true;
    state.showLabels = true;
    state.zoom = 0.82;
    state.targetFocusY = 0.5;
    document.querySelector("#scaleToggle").checked = true;
    document.querySelector("#labelToggle")?.classList.add("active");
    guide(`${rocket.name} is ${rocket.heightM.toFixed(0)} m tall, about ${Math.round(rocket.heightM / 1.8)} people stacked. The ruler is shown on the rocket view.`, "Ruler");
  } else if (/thrust|engine/.test(action)) {
    inspectPart("engines");
    guide(`Thrust is the upward push. If T/W is below 1, add main engines, add side boosters, or reduce payload.`, "Builder");
  } else if (/payload/.test(action)) {
    inspectPart("payload");
    guide(`Payload is the useful cargo. More payload lowers delta-v margin because final mass is heavier.`, "Builder");
  } else {
    guide(`${action}: this value changes the rocket's mass, force, or mission margin.`, "Tutor");
  }
  renderUI();
}

function diagnoseBuilderRocket(rocket = rockets[builderIndex()] || createBuilderRocket(builderConfig)) {
  const payload = state.rocketIndex === builderIndex() ? state.payloadT : rocket.defaultPayloadT;
  const fuelPercent = state.rocketIndex === builderIndex() ? state.fuelPercent : 100;
  const fuelMass = rocket.propellantT * (fuelPercent / 100);
  const wetMass = rocket.dryMassT + fuelMass + payload;
  const burnoutMass = rocket.dryMassT + payload;
  const twr = rocket.thrustMN / Math.max(0.1, wetMass * 9.80665 / 1000);
  const deltaV = rocket.ispS * 9.80665 * Math.log(Math.max(1.01, wetMass / Math.max(1, burnoutMass))) * rocket.stageGain;
  const dryFraction = rocket.dryMassT / Math.max(1, rocket.dryMassT + rocket.propellantT);
  const complexity = builderConfig.boosterPairs * 0.18 + Math.max(0, builderConfig.engineCount - 9) * 0.012 + (builderConfig.stages - 1) * 0.06 + (builderConfig.reuse === "reusable" ? 0.14 : 0);
  const dragStress = rocket.dragAreaM2 / Math.max(1, rocket.diameterM * rocket.diameterM);
  if (twr < 1) {
    return {
      state: "danger",
      title: "Pad failure: thrust-to-weight below 1",
      copy: `T/W is ${twr.toFixed(2)}. It needs to be above 1.00 before the rocket can rise.`,
      repairs: ["Move Engines right", "Set Boosters to 2 or 4", "Lower Payload in Flight controls"],
    };
  }
  if (deltaV < currentMission().targetDeltaVMps) {
    return {
      state: "warning",
      title: "Orbit shortfall: mass ratio is not good enough",
      copy: `${formatDeltaV(deltaV)} is below the ${formatVelocity(currentMission().targetDeltaVMps)} target.`,
      repairs: ["Change Stages to 2 or 3", "Set Upper to LH2", "Switch Recovery to Spend it"],
    };
  }
  if (dryFraction > 0.18) {
    return {
      state: "warning",
      title: "Dry-mass trap",
      copy: `Dry fraction is ${Math.round(dryFraction * 100)}%. Too much empty structure stays with the rocket.`,
      repairs: ["Move Width left", "Switch Recovery to Spend it", "Add one stage instead of one huge tank"],
    };
  }
  if (complexity > 0.42) {
    return {
      state: "warning",
      title: "Complexity trap: too many coupled events",
      copy: "It may work on paper, but too many events can fail at once.",
      repairs: ["Reduce Boosters by one step", "Move Engines left a little", "Test Spend it before Reuse it"],
    };
  }
  if (dragStress > 1.4 || builderConfig.boosterPairs > 1) {
    return {
      state: "warning",
      title: "Max-Q and side-load watch",
      copy: "Wide boosters raise air load while the rocket is still in thick air.",
      repairs: ["Lower Drag in Flight controls", "Lower Wind and Guidance", "Use fewer Boosters"],
    };
  }
  return {
    state: "success",
    title: "Credible first-pass architecture",
    copy: `T/W ${twr.toFixed(2)} and delta-v ${formatDeltaV(deltaV)} are in range. Now test one change.`,
    repairs: ["Run Launch test", "Raise Payload until it fails", "Try Escape mission"],
  };
}

function setSliderState(slider, stateKey, hint) {
  const row = slider?.closest(".slider-row");
  if (!row) return;
  row.dataset.state = stateKey;
  row.title = hint;
}

function renderControlCues(metrics = physicsMetrics()) {
  const peak = estimateMaxQ(metrics);
  const risk = flightRisk({ ...simSnapshot(), ...metrics, q: peak.q });
  const limit = structuralLimitKpa();
  const blockers = [
    { key: "payload", label: "Payload", active: metrics.threshold > 0.88, danger: metrics.threshold > 1, copy: metrics.threshold > 1 ? "Over class. Lower payload." : "Thin payload margin." },
    { key: "fuel", label: "Fuel", active: state.fuelPercent < 72 || metrics.deltaVMargin < 0, danger: state.fuelPercent < 48 || metrics.deltaVMargin < -850, copy: metrics.deltaVMargin < 0 ? "Delta-v short. Add fuel or lower mass." : "Fuel reserve is getting low." },
    { key: "air", label: "Air load", active: peak.q > limit * 0.72, danger: peak.q > limit, copy: peak.q > limit ? "Max-Q breaks structure." : "Max-Q near structural limit." },
    { key: "guidance", label: "Guidance", active: risk > 0.36, danger: risk > 0.55, copy: risk > 0.55 ? "High tumble/abort risk." : "Guidance and wind are the risk driver." },
  ];
  const active = blockers.filter((item) => item.active).sort((a, b) => Number(b.danger) - Number(a.danger))[0];
  const margin = metrics.deltaVMargin >= 0 ? `+${formatDeltaV(metrics.deltaVMargin)}` : formatDeltaV(metrics.deltaVMargin);
  const cards = [
    [active?.danger ? "Limiter" : "Watch", active ? active.label : "Balanced", active ? active.copy : "All controls are inside the lesson envelope.", active?.danger ? "danger" : active ? "warning" : "success"],
    ["Mass ratio", metrics.massRatio.toFixed(2), `m0 / mf. Higher is better for delta-v.`, metrics.massRatio < 2.2 ? "warning" : "success"],
    ["Peak Max-Q", `${peak.q.toFixed(0)} kPa`, `Limit ${limit.toFixed(0)} kPa. Lower drag, wind, or guidance error.`, peak.q > limit ? "danger" : peak.q > limit * 0.72 ? "warning" : "success"],
    ["Δv margin", margin, metrics.deltaVMargin < 0 ? "Needs more useful velocity." : "Enough velocity for this target.", metrics.deltaVMargin < 0 ? "danger" : "success"],
  ];
  els.controlCues.innerHTML = cards.map(([label, value, copy, stateKey]) => `
    <div data-info="${label}" data-state="${stateKey}" role="button" tabindex="0">
      <span>${label}</span>
      <strong>${value}</strong>
      <em>${copy}</em>
    </div>
  `).join("");
}

function workspaceGuideData(metrics = physicsMetrics()) {
  const peak = estimateMaxQ(metrics);
  const stress = materialStressSummary(metrics);
  const diagnosis = diagnoseBuilderRocket();
  const insight = graphInsight(metrics);
  const workspace = state.flightWorkspace;
  if (workspace === "build") {
    return {
      state: diagnosis.state,
      kicker: "Architecture bench",
      title: diagnosis.title,
      copy: "Pick stages, engines, tanks, material, and reuse. The diagnosis tells you the first likely failure before you launch.",
      equation: "T/W first, then m0 / mf, then failure events",
      action: "Stress test",
      detail: "Use Break it or Stress test when you want an intentional failure. Use Repair next issue to learn the next design move.",
    };
  }
  if (workspace === "engines") {
    return {
      state: metrics.twr < 1 ? "danger" : metrics.twr < 1.18 ? "warning" : "nominal",
      kicker: "Propulsion bench",
      title: `T/W ${metrics.twr.toFixed(2)} with ${builderConfig.engineCount} engines`,
      copy: "Engines help liftoff, but every engine also adds dry mass, plumbing, and failure paths.",
      equation: "T_total = engine thrust x engine count",
      action: "Ask why",
      detail: "Click thrust, Isp, mass, or complexity below to see which part of the launch they change.",
    };
  }
  if (workspace === "materials") {
    return {
      state: stress.margin < 1 ? "danger" : stress.margin < 1.35 ? "warning" : "nominal",
      kicker: "Materials bench",
      title: `Stress margin ${stress.margin.toFixed(2)}x`,
      copy: "Material choice is not just strength. Stiffness, heat protection, dry mass, and inspection risk all trade against delta-v.",
      equation: "strain = stress / Young's modulus",
      action: "IR view",
      detail: "Click Young's modulus, strength, stress margin, or TPS to connect material science to the flight graph.",
    };
  }
  if (workspace === "failure") {
    return {
      state: state.failure ? "danger" : warningStack(metrics)[0]?.[0] || "nominal",
      kicker: "Review bench",
      title: state.failure ? "Read the failure chain" : "No failure logged yet",
      copy: state.failure ? state.failure.chain.join(" -> ") : "Push one variable into warning, launch, then review the failure cause and download the report.",
      equation: "failure = first violated constraint + coupled risks",
      action: state.failureLog.length ? "Export PDF" : "Demo mode",
      detail: "Review is for learning from bad configurations. Change one variable after each failure so the cause stays visible.",
    };
  }
  return {
    state: insight.state === "success" ? "nominal" : insight.state,
    kicker: "Test bench",
    title: insight.title,
    copy: insight.copy,
    equation: insight.equation,
    action: "Launch test",
    detail: "The default setup should pass. Break it by changing one slider, then use Show graph to see why.",
  };
}

function renderWorkspaceGuide(metrics = physicsMetrics()) {
  if (!els.workspaceGuide) return;
  const guideData = workspaceGuideData(metrics);
  els.workspaceGuide.dataset.state = guideData.state === "success" ? "nominal" : guideData.state;
  els.workspaceKicker.textContent = guideData.kicker;
  els.workspaceTitle.textContent = guideData.title;
  els.workspaceCopy.textContent = guideData.copy;
  els.workspaceEquation.textContent = guideData.equation;
  els.workspaceAction.textContent = guideData.action;
  els.workspaceDetail.textContent = state.workspaceInfoDetail || guideData.detail;
}

function materialStressSummary(metrics = physicsMetrics()) {
  const peak = estimateMaxQ(metrics);
  const rocket = currentRocket();
  const skin = rocket.materialProfile?.skin || materialCatalog["aluminum-lithium"];
  const area = Math.max(0.8, rocket.diameterM * 0.018);
  const axialStressMpa = Math.max(1, (metrics.wetMass * 9.80665 * Math.max(1, metrics.twr)) / (area * 1000));
  const bendingStressMpa = peak.q * rocket.diameterM * (1 + state.windFactor + state.guidanceError) * 0.42;
  const structureHealth = Math.max(0.52, Math.min(1.35, state.structurePercent / 100));
  const combinedStressMpa = (axialStressMpa + bendingStressMpa) / structureHealth;
  const strainMicro = (combinedStressMpa / Math.max(1, skin.youngGpa * 1000)) * 1_000_000;
  const margin = skin.strengthMpa / Math.max(1, combinedStressMpa);
  return { skin, peak, axialStressMpa, bendingStressMpa, combinedStressMpa, strainMicro, margin };
}

function renderEngineeringLabs(metrics = physicsMetrics()) {
  const rocket = currentRocket();
  const engine = rocket.materialProfile?.engine || engineCatalog[builderConfig.engineModel];
  const skin = rocket.materialProfile?.skin || materialCatalog[builderConfig.skinMaterial];
  const tank = rocket.materialProfile?.tank || materialCatalog[builderConfig.tankMaterial];
  const shield = rocket.materialProfile?.shield || heatShieldCatalog[builderConfig.heatShieldMaterial];
  const propellant = rocket.materialProfile?.propellant || propellantCatalog[builderConfig.upperStage];
  const stress = materialStressSummary(metrics);
  const signature = [
    rocket.id,
    state.flightWorkspace,
    builderConfig.engineModel,
    builderConfig.engineCount,
    builderConfig.upperStage,
    builderConfig.skinMaterial,
    builderConfig.tankMaterial,
    builderConfig.heatShieldMaterial,
    Math.round(metrics.wetMass),
    Math.round(metrics.deltaVMargin / 25),
    Math.round(stress.margin * 20),
    Math.round(stress.peak.q),
  ].join("|");
  if (state.engineeringSignature === signature) return;
  state.engineeringSignature = signature;
  els.engineModelLab.value = builderConfig.engineModel;
  els.engineCountLab.value = String(builderConfig.engineCount);
  els.engineCountLabValue.textContent = String(builderConfig.engineCount);
  els.upperFuelLab.value = builderConfig.upperStage;
  els.skinMaterialLab.value = builderConfig.skinMaterial;
  els.tankMaterialLab.value = builderConfig.tankMaterial;
  els.heatShieldLab.value = builderConfig.heatShieldMaterial;
  els.engineLabTitle.textContent = `${engine.name} · ${builderConfig.engineCount} engines`;
  els.engineGrid.innerHTML = [
    ["Thrust / engine", `${engine.thrustMN.toFixed(engine.thrustMN < 0.1 ? 3 : 2)} MN`, "Sets liftoff T/W."],
    ["Isp", `${Math.round(engine.ispS * propellant.isp)} s`, "Higher means more delta-v per kg propellant."],
    ["Engine mass", `${(engine.massT * builderConfig.engineCount).toFixed(1)} t`, "Dry mass stays after propellant burns."],
    ["Complexity", `${Math.round((1 - engine.reliability) * 100)}% risk`, "More complexity means more failure paths."],
  ].map(([label, value, copy]) => `<button data-info="${label}"><span>${label}</span><strong>${value}</strong><em>${copy}</em></button>`).join("");
  els.engineLabCopy.textContent = engine.copy;

  els.materialsLabTitle.textContent = `${skin.name} skin · ${tank.name} tanks`;
  els.materialsGrid.innerHTML = [
    ["Young's modulus", `${skin.youngGpa} GPa`, "Stiffness: how much it strains under load."],
    ["Strength", `${skin.strengthMpa} MPa`, "Approximate stress before failure in this classroom model."],
    ["Stress margin", `${stress.margin.toFixed(1)}x`, stress.margin < 1 ? "Breaks under the current profile." : "Above estimated combined stress."],
    ["TPS", shield.name, `${Math.round(shield.protection * 100)}% heat protection.`],
  ].map(([label, value, copy]) => `<button data-info="${label}" data-state="${/Breaks|margin/i.test(copy) && stress.margin < 1 ? "danger" : stress.margin < 1.35 ? "warning" : "success"}"><span>${label}</span><strong>${value}</strong><em>${copy}</em></button>`).join("");
  els.stressPanel.innerHTML = `
    <strong>Stress tensor snapshot</strong>
    <code>σ ≈ [ ${stress.axialStressMpa.toFixed(1)}  ${stress.bendingStressMpa.toFixed(1)}  0 ] MPa</code>
    <code>ε = σ / E ≈ ${Math.round(stress.strainMicro)} microstrain</code>
    <span>Max-Q ${stress.peak.q.toFixed(1)} kPa · material limit ${skin.strengthMpa} MPa · margin ${stress.margin.toFixed(2)}x</span>
  `;
  els.materialsDidYouKnow.textContent = stress.margin < 1.25
    ? "A material can fail from bending even when axial thrust loads look fine. Wind and Max-Q turn vertical flight into a side-load problem."
    : "Young's modulus is stiffness, not strength. A stiff material can still crack if stress rises above its failure limit.";

  els.fuelLabTitle.textContent = propellant.name;
  els.fuelGrid.innerHTML = [
    ["Density", `${Math.round(propellant.density * 100)}%`, "Higher density means smaller tanks."],
    ["Efficiency", `${Math.round(propellant.isp * 100)}%`, "Higher Isp improves delta-v."],
    ["Mass ratio", metrics.massRatio.toFixed(2), "Propellant and tank mass fight each other."],
    ["Δv margin", `${metrics.deltaVMargin >= 0 ? "+" : ""}${formatDeltaV(metrics.deltaVMargin)}`, "Final mission energy."],
  ].map(([label, value, copy]) => `<button data-info="${label}"><span>${label}</span><strong>${value}</strong><em>${copy}</em></button>`).join("");
  els.fuelLabCopy.textContent = propellant.copy;
}

function labInfoExplanation(label) {
  const metrics = physicsMetrics();
  const peak = estimateMaxQ(metrics);
  const stress = materialStressSummary(metrics);
  const engine = engineCatalog[builderConfig.engineModel];
  const propellant = propellantCatalog[builderConfig.upperStage];
  const key = String(label || "").toLowerCase();
  if (key.includes("thrust") || key.includes("engine")) {
    return `Thrust is the upward push. With ${builderConfig.engineCount} ${engine.name} engines, liftoff T/W is ${metrics.twr.toFixed(2)}. Below 1 means no liftoff; too many engines add dry mass and complexity.`;
  }
  if (key.includes("isp") || key.includes("efficiency")) {
    return `Isp is fuel efficiency. ${propellant.name} gives about ${Math.round(engine.ispS * propellant.isp)} s here. Higher Isp helps upper stages because the rocket has less atmosphere and less dead mass later.`;
  }
  if (key.includes("mass ratio")) {
    return `Mass ratio is m0 / mf. Current value is ${metrics.massRatio.toFixed(2)}. Bigger is usually better, but only if thrust, structure, and heating still survive the flight.`;
  }
  if (key.includes("young")) {
    return `Young's modulus is stiffness. ${stress.skin.name} is ${stress.skin.youngGpa} GPa here, so strain is about ${Math.round(stress.strainMicro)} microstrain under the current load. Stiff does not always mean hard to break.`;
  }
  if (key.includes("strength") || key.includes("stress margin") || key.includes("material")) {
    return `Stress margin is ${stress.margin.toFixed(2)}x. Axial stress comes from thrust and weight; bending stress comes from wind and Max-Q. If margin drops below 1, the material fails in this model.`;
  }
  if (key.includes("tps") || key.includes("thermal") || key.includes("heat")) {
    return `Thermal protection fights speed plus air load. Current thermal index is ${thermalLoadIndex({ ...simSnapshot(), ...metrics, q: peak.q }).toFixed(2)}. Use IR view to see hot regions and lower Max-Q if it climbs.`;
  }
  if (key.includes("air") || key.includes("max-q") || key.includes("drag")) {
    return `Max-Q is peak air load. Current peak is ${peak.q.toFixed(1)} kPa against a ${structuralLimitKpa().toFixed(0)} kPa limit. Drag, wind, and guidance all push this number up.`;
  }
  if (key.includes("payload")) {
    return `Payload is useful mass, but it rides to the end. Current payload is ${state.payloadT.toFixed(1)} t, so delta-v margin is ${metrics.deltaVMargin >= 0 ? "+" : ""}${formatDeltaV(metrics.deltaVMargin)}.`;
  }
  if (key.includes("fuel")) {
    return `Fuel raises m0 and can raise delta-v, but full tanks also make liftoff harder. Current fuel is ${Math.round(state.fuelPercent)}% and T/W is ${metrics.twr.toFixed(2)}.`;
  }
  if (key.includes("guidance") || key.includes("wind")) {
    return `Wind and guidance error turn clean vertical flight into side load and wasted velocity. Current risk is ${Math.round(flightRisk({ ...simSnapshot(), ...metrics, q: peak.q }) * 100)}%.`;
  }
  if (key.includes("delta") || key.includes("δv") || key.includes("Δv")) {
    return `Delta-v is the mission speed budget. Current staged delta-v is ${formatDeltaV(metrics.effectiveDeltaV)} with ${metrics.deltaVMargin >= 0 ? "+" : ""}${formatDeltaV(metrics.deltaVMargin)} margin.`;
  }
  return `${label}: click a related slider or launch the test to see this value move in the graph.`;
}

function explainLabInfo(label) {
  const copy = labInfoExplanation(label);
  state.workspaceInfoDetail = copy;
  if (els.workspaceDetail) els.workspaceDetail.textContent = copy;
  guide(copy, "Lab");
}

function warningStack(metrics = physicsMetrics()) {
  const peak = estimateMaxQ(metrics);
  const limit = structuralLimitKpa();
  const sim = { ...simSnapshot(), ...metrics, q: peak.q };
  const warnings = [];
  if (metrics.twr < 1) {
    warnings.push(["danger", "No liftoff", `T/W ${metrics.twr.toFixed(2)}. Lower payload or add engine thrust before orbit math matters.`]);
  } else if (metrics.twr < 1.18) {
    warnings.push(["warning", "Weak liftoff", `T/W ${metrics.twr.toFixed(2)} leaves little room for gravity and wind losses.`]);
  }
  if (metrics.payloadFraction > 1) {
    warnings.push(["danger", "Payload too heavy", `Payload is ${Math.round(metrics.payloadFraction * 100)}% of class. The upper stack is overweight.`]);
  } else if (metrics.payloadFraction > 0.82) {
    warnings.push(["warning", "Payload margin thin", "Small payload changes high in the stack can erase delta-v margin."]);
  }
  if (state.fuelPercent > 94 && metrics.twr < 1.12) {
    warnings.push(["warning", "Full tanks are heavy", "More fuel helps delta-v, but it can hurt pad liftoff if thrust is low."]);
  } else if (state.fuelPercent < 62) {
    warnings.push(["warning", "Low propellant", "Mass is lower, but the rocket may run out of useful velocity."]);
  }
  if (peak.q > limit) {
    warnings.push(["danger", "Structure overload", `Peak Max-Q ${peak.q.toFixed(0)} kPa is above the ${limit.toFixed(0)} kPa limit.`]);
  } else if (peak.q > limit * 0.78) {
    warnings.push(["warning", "Near Max-Q limit", "Air load is close to the classroom structural limit."]);
  }
  if (thermalLoadIndex(sim) > 1 || state.heatShieldPercent < 58) {
    warnings.push(["danger", "Thermal margin low", "IR camera will show hot regions; improve TPS or reduce Max-Q."]);
  }
  const stress = materialStressSummary(metrics);
  if (stress.margin < 1) {
    warnings.push(["danger", "Material failure", `Combined stress ${stress.combinedStressMpa.toFixed(0)} MPa exceeds ${stress.skin.name} margin.`]);
  } else if (stress.margin < 1.35) {
    warnings.push(["warning", "Stress margin thin", `${stress.skin.name} margin is ${stress.margin.toFixed(1)}x under wind and Max-Q.`]);
  }
  if (Math.abs(state.stagingTiming) > 7) {
    warnings.push(["danger", "Bad staging timing", "Separation is far from the planned event; the upper stage may tumble."]);
  } else if (Math.abs(state.stagingTiming) > 3) {
    warnings.push(["warning", "Staging watch", "A few seconds can change attitude and upper-stage starting conditions."]);
  }
  if (state.windFactor > 0.62 || state.guidanceError > 0.32) {
    warnings.push(["warning", "Weather and pointing", "Wind and guidance error can waste a good mass-ratio design."]);
  }
  if (!warnings.length) {
    warnings.push(["success", "Ready to test", "Default-style settings are inside the lesson envelope. Change one variable and predict the graph."]);
  }
  return warnings.slice(0, 3);
}

function renderWarningStack(metrics = physicsMetrics()) {
  if (!els.warningStack) return;
  els.warningStack.innerHTML = warningStack(metrics).map(([stateKey, title, copy]) => `
    <div data-info="${title}" data-state="${stateKey}" role="button" tabindex="0">
      <strong>${title}</strong>
      <span>${copy}</span>
    </div>
  `).join("");
}

function graphInsight(metrics = physicsMetrics()) {
  const peak = estimateMaxQ(metrics);
  const limit = structuralLimitKpa();
  const sim = { ...simSnapshot(), ...metrics, q: peak.q };
  if (metrics.twr < 1 || state.engineHealth < 72) {
    return {
      kicker: "Engines vs gravity",
      title: "The rocket is losing before it clears the pad",
      copy: `T/W is ${metrics.twr.toFixed(2)}. Raise engine health, lower payload, or add boosters until thrust is greater than weight.`,
      equation: "T / W > 1",
      state: "danger",
    };
  }
  if (metrics.deltaVMargin < 0 || state.fuelPercent < 62) {
    return {
      kicker: "Mass ratio",
      title: "The graph bends short because final mass is too high",
      copy: `Delta-v margin is ${formatDeltaV(metrics.deltaVMargin)}. Fuel, dry mass, payload, and staging timing all change ln(m0 / mf).`,
      equation: "Δv = Isp · g0 · ln(m0 / mf)",
      state: metrics.deltaVMargin < -850 ? "danger" : "warning",
    };
  }
  if (peak.q > limit * 0.78 || state.structurePercent < 76) {
    return {
      kicker: "Max-Q load",
      title: "Air load is the structural trap",
      copy: `Peak Max-Q is ${peak.q.toFixed(1)} kPa against a ${limit.toFixed(0)} kPa limit. Lower drag, wind, or guidance error; stronger structure raises the limit.`,
      equation: "q = 1/2 · ρ · v²",
      state: peak.q > limit ? "danger" : "warning",
    };
  }
  if (thermalLoadIndex(sim) > 0.64 || state.heatShieldPercent < 72) {
    return {
      kicker: "Thermal margin",
      title: "Heat shield margin depends on speed and air load together",
      copy: `Thermal index is ${thermalLoadIndex(sim).toFixed(2)}. A weak shield can survive low air load, but not high speed plus dense air.`,
      equation: "heat risk ∝ q · v / TPS",
      state: thermalLoadIndex(sim) > 1 ? "danger" : "warning",
    };
  }
  if (Math.abs(state.stagingTiming) > 4) {
    return {
      kicker: "Staging timing",
      title: "A good upper stage can still inherit a bad attitude",
      copy: `Staging is offset by ${state.stagingTiming}s. Keep separation near the designed event so guidance, thrust, and mass drop agree.`,
      equation: "J = F · Δt",
      state: Math.abs(state.stagingTiming) > 8 ? "danger" : "warning",
    };
  }
  return {
    kicker: "Balanced ascent",
    title: "This setup has enough margin to teach from",
    copy: `T/W ${metrics.twr.toFixed(2)}, delta-v margin ${formatDeltaV(metrics.deltaVMargin)}, and Max-Q ${peak.q.toFixed(1)} kPa are inside the lesson envelope.`,
    equation: "net margin = thrust + Δv - drag - risk",
    state: flightRisk(sim) > 0.45 ? "warning" : "success",
  };
}

function renderGraphInsight(metrics = physicsMetrics()) {
  const insight = graphInsight(metrics);
  els.graphInsightKicker.textContent = insight.kicker;
  els.graphInsightTitle.textContent = insight.title;
  els.graphInsightCopy.textContent = insight.copy;
  els.graphInsightEquation.textContent = insight.equation;
  document.querySelector("#graphInsight")?.setAttribute("data-state", insight.state);
}

function renderFlightStatus(metrics = physicsMetrics(), mission = currentMission()) {
  const sim = simSnapshot();
  const risk = flightRisk(sim);
  if (state.launchStatus === "failed") {
    els.flightStatus.textContent = "Exploded";
    const chain = state.failure?.chain?.length ? ` Chain: ${state.failure.chain.join(" -> ")}.` : "";
    els.failureReason.textContent = `${state.failure?.reason || "The rocket failed during ascent."}${chain}`;
    return;
  }
  if (state.launchStatus === "countdown") {
    els.flightStatus.textContent = `T-${Math.max(0, Math.ceil(COUNTDOWN_SECONDS - state.launchClock))}`;
    els.failureReason.textContent = "Countdown running. Engines ignite before hold-down clamps release.";
    return;
  }
  if (state.launchStatus === "success") {
    els.flightStatus.textContent = "Target reached";
    els.failureReason.textContent = `${mission.label} succeeded with ${formatDeltaV(metrics.deltaVMargin)} delta-v margin.`;
    return;
  }
  if (state.launchStatus === "running") {
    els.flightStatus.textContent = `t+${Math.floor(sim.t)}s`;
    els.failureReason.textContent = `Risk ${Math.round(risk * 100)}%. Watch Max-Q, T/W, and delta-v margin.`;
    return;
  }
  if (metrics.twr < 1) {
    els.flightStatus.textContent = "No liftoff";
    els.failureReason.textContent = `First blocker: thrust-to-weight is ${metrics.twr.toFixed(2)}, so the rocket cannot lift off even if the delta-v math looks promising.`;
  } else if (metrics.payloadFraction > 1) {
    els.flightStatus.textContent = "Payload over";
    els.failureReason.textContent = `First blocker: payload is ${Math.round(metrics.payloadFraction * 100)}% of this rocket's class. Lower payload or redesign the stack.`;
  } else {
    els.flightStatus.textContent = metrics.deltaVMargin >= 0 ? "Ready" : "Short";
    els.failureReason.textContent = `${mission.copy} Current margin: ${metrics.deltaVMargin >= 0 ? "+" : ""}${formatDeltaV(metrics.deltaVMargin)}.`;
  }
}

function updateExperimentReadout() {
  const metrics = physicsMetrics();
  const mission = currentMission();
  const goalProgress = Math.min(1, Math.max(0.02, metrics.effectiveDeltaV / mission.targetDeltaVMps));
  els.payloadValue.textContent = `${state.payloadT.toFixed(state.payloadT < 10 ? 1 : 0)} t`;
  els.fuelValue.textContent = `${Math.round(state.fuelPercent)}%`;
  els.dragValue.textContent = `${state.dragFactor.toFixed(2)}x`;
  els.windValue.textContent = `${Math.round(state.windFactor * 100)}%`;
  els.guidanceValue.textContent = `${Math.round(state.guidanceError * 100)}%`;
  els.engineHealthValue.textContent = `${Math.round(state.engineHealth)}%`;
  els.structureValue.textContent = `${Math.round(state.structurePercent)}%`;
  els.heatShieldValue.textContent = `${Math.round(state.heatShieldPercent)}%`;
  els.stagingValue.textContent = `${state.stagingTiming > 0 ? "+" : ""}${state.stagingTiming}s`;
  els.failureCount.textContent = String(state.failureLog.length);
  els.goalVelocity.textContent = formatVelocity(mission.targetDeltaVMps);
  els.goalBar.style.transform = `scaleX(${goalProgress})`;
  els.goalBar.dataset.state = goalProgress >= 1 ? "success" : metrics.deltaVMargin < -850 ? "danger" : "nominal";
  els.payloadBar.style.transform = `scaleX(${Math.min(1, Math.max(0.02, metrics.payloadFraction))})`;
  const peak = estimateMaxQ(metrics);
  const risk = flightRisk({ ...simSnapshot(), ...metrics, q: peak.q });
  const limit = structuralLimitKpa();
  setSliderState(
    els.payloadSlider,
    metrics.threshold > 1 ? "danger" : metrics.payloadFraction > 0.88 ? "warning" : "nominal",
    `Payload is ${Math.round(metrics.payloadFraction * 100)}% of this rocket's class.`,
  );
  setSliderState(
    els.fuelSlider,
    state.fuelPercent < 48 || metrics.deltaVMargin < -850 ? "danger" : state.fuelPercent < 72 || metrics.deltaVMargin < 0 ? "warning" : "nominal",
    `Fuel controls mass ratio (${metrics.massRatio.toFixed(2)}) and delta-v margin (${metrics.deltaVMargin >= 0 ? "+" : ""}${formatDeltaV(metrics.deltaVMargin)}).`,
  );
  setSliderState(
    els.dragSlider,
    peak.q > limit ? "danger" : peak.q > limit * 0.72 ? "warning" : "nominal",
    `Drag mainly changes peak Max-Q (${peak.q.toFixed(1)} kPa).`,
  );
  setSliderState(
    els.windSlider,
    risk > 0.55 ? "danger" : risk > 0.36 ? "warning" : "nominal",
    `Wind shear raises attitude risk (${Math.round(risk * 100)}%).`,
  );
  setSliderState(
    els.guidanceSlider,
    risk > 0.55 ? "danger" : risk > 0.36 ? "warning" : "nominal",
    `Guidance error raises attitude and Max-Q risk (${Math.round(risk * 100)}%).`,
  );
  setSliderState(
    els.engineHealthSlider,
    metrics.twr < 1 || state.engineHealth < 64 ? "danger" : state.engineHealth < 82 ? "warning" : "nominal",
    `Engine health scales thrust. Current liftoff T/W is ${metrics.twr.toFixed(2)}.`,
  );
  setSliderState(
    els.structureSlider,
    peak.q > limit ? "danger" : state.structurePercent < 76 || peak.q > limit * 0.72 ? "warning" : "nominal",
    `Structure sets the Max-Q limit (${limit.toFixed(0)} kPa).`,
  );
  setSliderState(
    els.heatShieldSlider,
    thermalLoadIndex({ ...simSnapshot(), ...metrics, q: peak.q }) > 1 ? "danger" : state.heatShieldPercent < 76 ? "warning" : "nominal",
    `Heat shield protects against combined speed and air load.`,
  );
  setSliderState(
    els.stagingSlider,
    Math.abs(state.stagingTiming) > 8 ? "danger" : Math.abs(state.stagingTiming) > 4 ? "warning" : "nominal",
    `Staging timing changes separation impulse and delta-v losses.`,
  );
  let status = "Nominal";
  let statusKey = "nominal";
  if (metrics.twr < 1) {
    status = "No liftoff";
    statusKey = "danger";
  } else if (metrics.threshold > 1) {
    status = "Payload over";
    statusKey = "danger";
  } else if (metrics.deltaVMargin < 0) {
    status = "Δv short";
    statusKey = "warning";
  } else if (metrics.payloadFraction > 0.88) {
    status = "Thin margin";
    statusKey = "warning";
  }
  if (state.launchStatus === "running") {
    status = "Testing";
    statusKey = "warning";
  } else if (state.launchStatus === "success") {
    status = "Mission pass";
    statusKey = "nominal";
  } else if (state.launchStatus === "failed") {
    status = "Failed";
    statusKey = "danger";
  }
  els.payloadStatus.textContent = status;
  els.payloadStatus.dataset.state = statusKey;
  els.payloadBar.dataset.state = statusKey;
  renderControlCues(metrics);
  renderWarningStack(metrics);
  renderEngineeringLabs(metrics);
  renderGraphInsight(metrics);
  renderWorkspaceGuide(metrics);
  renderFlightStatus(metrics, mission);
  updateAgentAwareness();
}

function launchSyncLabel(sim = simSnapshot()) {
  if (state.launchStatus === "countdown") return `T-${Math.max(0, Math.ceil(COUNTDOWN_SECONDS - state.launchClock))}`;
  if (state.launchStatus === "running") return `t+${Math.floor(sim.t)}s / ${phaseName(sim.stage)}`;
  if (state.launchStatus === "success") return "Post-flight";
  if (state.launchStatus === "failed") return "Abort review";
  return "Idle";
}

function updateAgentAwareness() {
  const rocket = currentRocket();
  const part = currentPart();
  const sim = simSnapshot();
  els.agentMode.textContent = state.agentBusy ? "Thinking" : "Chat";
  els.agentContext.textContent = `${rocket.name} / ${currentMission().label}`;
  els.agentContext.title = `${part.name}: ${compact(part.description, 120)}`;
  els.agentSync.textContent = launchSyncLabel(sim);
  els.agentSync.dataset.state = state.launchStatus;
  renderAgentContextPacket();
  updateVoiceUi();
}

function agentContextPacketData() {
  const rocket = currentRocket();
  const part = currentPart();
  const metrics = physicsMetrics();
  const peak = estimateMaxQ(metrics);
  const warning = warningStack(metrics)[0];
  const plan = currentVectorPlan();
  const brief = state.workspaceMode === "blueprint" ? blueprintDesignBrief() : null;
  const equation = state.workspaceMode === "blueprint"
    ? brief.proof
    : metrics.twr < 1
      ? "T / W > 1"
      : metrics.deltaVMargin < 0
        ? "Δv = Isp g0 ln(m0/mf)"
        : peak.q > structuralLimitKpa() * 0.78
          ? "q = 1/2 ρv²"
          : plan.equation;
  const blocker = state.workspaceMode === "blueprint"
    ? brief.blocker
    : warning?.[1] || plan.title;
  const next = state.workspaceMode === "blueprint"
    ? brief.next
    : plan.move;
  const quality = [
    ["Scene", 1, `${rocket.name}, ${part.name}, ${currentMission().label}`],
    ["Numbers", 1, `T/W ${metrics.twr.toFixed(2)}, Δv ${formatDeltaV(metrics.deltaVMargin)}, Max-Q ${peak.q.toFixed(0)} kPa`],
    ["Memory", clamp(state.agentThread.length / 6, 0.18, 1), `${state.agentThread.length} recent turn${state.agentThread.length === 1 ? "" : "s"}`],
    ["Action", next ? 1 : 0.25, next || "Ask a question first"],
  ];
  return {
    rocket,
    part,
    metrics,
    peak,
    equation,
    blocker,
    next,
    quality,
    state: warning?.[0] || plan.state || "success",
  };
}

function renderAgentContextPacket() {
  if (!els.agentContextPacket) return;
  const packet = agentContextPacketData();
  els.agentContextPacket.dataset.state = packet.state === "danger" ? "danger" : packet.state === "warning" ? "warning" : "success";
  els.agentContextPacket.innerHTML = `
    <div class="packet-head">
      <span>Context packet</span>
      <strong>${packet.rocket.name} · ${packet.part.name}</strong>
    </div>
    <div class="packet-grid">
      <button data-packet-topic="scene" type="button"><span>Scene</span><strong>${compact(`${packet.rocket.name} / ${currentMission().label}`, 34)}</strong></button>
      <button data-packet-topic="blocker" type="button"><span>Blocker</span><strong>${compact(packet.blocker, 34)}</strong></button>
      <button data-packet-topic="equation" type="button"><span>Equation</span><strong>${packet.equation}</strong></button>
      <button data-packet-topic="next" type="button"><span>Next</span><strong>${compact(packet.next, 38)}</strong></button>
    </div>
    <div class="packet-quality" aria-label="Agent session quality">
      ${packet.quality.map(([label, value, title]) => `<span title="${title}" style="--fill:${value.toFixed(2)}"><i></i>${label}</span>`).join("")}
    </div>
    <div class="packet-actions">
      <button data-agent-context-action="blocker" type="button">Ask blocker</button>
      <button data-agent-context-action="quiz" type="button">Quiz this</button>
      <button data-agent-context-action="compare" type="button">Compare</button>
    </div>
  `;
  els.agentContextPacket.querySelectorAll("[data-agent-context-action], [data-packet-topic]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.agentContextAction || button.dataset.packetTopic;
      const prompts = {
        blocker: `Use the current context packet. Explain the first blocker "${packet.blocker}", prove it with ${packet.equation}, and give one slider or blueprint move.`,
        quiz: `Quiz me on this exact scene. Use ${packet.rocket.name}, ${packet.part.name}, and equation ${packet.equation}. Give three choices and hide the answer until I reply.`,
        compare: `Compare ${packet.rocket.name} to one similar rocket in the catalog. Focus on payload class, engine architecture, and one failure mode to test.`,
        scene: `Explain this scene: ${packet.rocket.name}, selected part ${packet.part.name}, mission ${currentMission().label}. Use the live numbers.`,
        equation: `Teach ${packet.equation} using the current rocket numbers. Keep it under 80 words and end with one prediction question.`,
        next: `Walk me through the next move: ${packet.next}. Tell me what graph should move after I do it.`,
      };
      sendAgentPrompt(prompts[action] || prompts.scene);
    });
  });
}

function drawGraph() {
  const width = graphCanvas.width;
  const height = graphCanvas.height;
  const metrics = physicsMetrics();
  const mission = currentMission();
  const dragPenalty = state.dragFactor * (1 + metrics.threshold * 0.22) * (1 + state.windFactor * 0.14 + state.guidanceError * 0.16);
  graphCtx.clearRect(0, 0, width, height);
  graphCtx.save();
  graphCtx.fillStyle = "rgba(8, 12, 19, 0.55)";
  graphCtx.fillRect(0, 0, width, height);
  graphCtx.strokeStyle = "rgba(143, 221, 255, 0.14)";
  graphCtx.lineWidth = 1;
  for (let x = 28; x < width; x += 52) {
    graphCtx.beginPath();
    graphCtx.moveTo(x, 12);
    graphCtx.lineTo(x, height - 24);
    graphCtx.stroke();
  }
  for (let y = 20; y < height - 20; y += 32) {
    graphCtx.beginPath();
    graphCtx.moveTo(24, y);
    graphCtx.lineTo(width - 12, y);
    graphCtx.stroke();
  }

  const curves = [
    { color: "#f6b14a", label: "v", fn: (t) => Math.min(1, metrics.effectiveDeltaV * Math.pow(t / 180, 1.75) * Math.max(0.55, Math.min(1.08, metrics.twr / 1.25)) / dragPenalty / Math.max(1, mission.targetDeltaVMps)) },
    { color: "#9fc7e8", label: "h", fn: (t) => Math.min(1, (0.0065 * t * t) * Math.max(0.52, metrics.twr / 1.24) / Math.max(80, mission.targetAltitudeKm)) },
    { color: "#ffb454", label: "q", fn: (t) => {
      const alt = 0.0065 * t * t;
      const vel = Math.min(metrics.effectiveDeltaV * Math.pow(t / 180, 1.75), 920 + alt * 9);
      return Math.min(1, (0.5 * 1.225 * Math.exp(-alt / 8.5) * vel * vel * dragPenalty / 1000) / 90);
    } },
  ];

  for (const curve of curves) {
    graphCtx.strokeStyle = curve.color;
    graphCtx.lineWidth = 2;
    graphCtx.beginPath();
    for (let i = 0; i <= 90; i += 1) {
      const t = i * 2;
      const x = 28 + (i / 90) * (width - 46);
      const y = height - 25 - curve.fn(t) * (height - 48);
      if (i === 0) graphCtx.moveTo(x, y);
      else graphCtx.lineTo(x, y);
    }
    graphCtx.stroke();
  }

  const qLimitY = height - 25 - Math.min(1, structuralLimitKpa() / 90) * (height - 48);
  graphCtx.strokeStyle = "rgba(255, 107, 107, 0.62)";
  graphCtx.setLineDash([6, 5]);
  graphCtx.beginPath();
  graphCtx.moveTo(28, qLimitY);
  graphCtx.lineTo(width - 18, qLimitY);
  graphCtx.stroke();
  graphCtx.fillStyle = "rgba(255, 184, 174, 0.78)";
  graphCtx.fillText("q limit", width - 66, qLimitY - 5);
  const goalY = height - 25 - Math.min(1, metrics.effectiveDeltaV / Math.max(1, mission.targetDeltaVMps)) * (height - 48);
  graphCtx.strokeStyle = metrics.deltaVMargin >= 0 ? "rgba(93, 242, 193, 0.44)" : "rgba(255, 107, 107, 0.46)";
  graphCtx.beginPath();
  graphCtx.moveTo(28, goalY);
  graphCtx.lineTo(width - 18, goalY);
  graphCtx.stroke();
  graphCtx.setLineDash([]);

  const sim = simSnapshot();
  const x = 28 + (sim.t / 180) * (width - 46);
  graphCtx.strokeStyle = "rgba(255,255,255,0.62)";
  graphCtx.setLineDash([4, 5]);
  graphCtx.beginPath();
  graphCtx.moveTo(x, 12);
  graphCtx.lineTo(x, height - 20);
  graphCtx.stroke();
  graphCtx.setLineDash([]);

  graphCtx.font = "800 10px Inter, sans-serif";
  curves.forEach((curve, index) => {
    graphCtx.fillStyle = curve.color;
    graphCtx.fillText(curve.label, 28 + index * 36, 15);
  });
  graphCtx.fillStyle = "rgba(238,245,255,0.72)";
  graphCtx.fillText("time →", width - 62, height - 8);
  graphCtx.restore();
}

function selectRocket(index) {
  state.rocketIndex = index;
  const rocket = currentRocket();
  state.selectedPartId = lessonPartFor(rocket, lessonTrack[state.lessonIndex]);
  state.zoom = 0.92;
  state.focusY = 0.5;
  state.targetFocusY = 0.5;
  state.targetPitch = 0.05;
  renderRocketList();
  applyMission(state.missionMode);
  guide(`${rocket.name} loaded. Click a part; drag T, W, or D to change the flight test.`);
}

function selectPart(id, userDriven = true) {
  const rocket = currentRocket();
  if (!rocket.parts.some((part) => part.id === id)) return;
  state.selectedPartId = id;
  state.targetFocusY = partFocusRatio(rocket, id);
  renderUI();
  if (userDriven) {
    guide(`${currentPart().name}: ${compact(currentPart().description, 86)}`);
  }
}

function setLesson(index) {
  state.lessonIndex = (index + lessonTrack.length) % lessonTrack.length;
  const rocket = currentRocket();
  state.selectedPartId = lessonPartFor(rocket, lessonTrack[state.lessonIndex]);
  state.targetFocusY = partFocusRatio(rocket, state.selectedPartId);
  state.showLabels = true;
  document.querySelector("#labelToggle")?.classList.add("active");
  renderUI();
}

function resetFlightState() {
  state.launchStatus = "idle";
  state.failure = null;
  state.blastParticles = [];
  state.particles = [];
  state.simTime = 0;
  state.launchClock = 0;
  state.narratedEvents = new Set();
  state.explode = false;
  document.querySelector("#explodeToggle")?.classList.remove("active");
}

function cameraModeLabel() {
  if (state.cameraMode === "ir") return "IR";
  if (state.cameraMode === "weather") return "Weather";
  return "Visible";
}

function cycleCameraMode() {
  state.cameraMode = state.cameraMode === "visible" ? "ir" : state.cameraMode === "ir" ? "weather" : "visible";
  const button = document.querySelector("#cameraModeToggle");
  if (button) {
    button.textContent = cameraModeLabel();
    button.classList.toggle("active", state.cameraMode !== "visible");
  }
  const copy = state.cameraMode === "ir"
    ? "IR camera highlights thermal stress and hot exhaust."
    : state.cameraMode === "weather"
      ? "Weather camera makes wind, rain, and air load easier to see."
      : "Visible camera restored.";
  guide(copy, "Camera");
}

function previewControl(type) {
  state.controlFocus = type;
  state.controlPulse = 100;
  state.showLabels = true;
  document.querySelector("#labelToggle")?.classList.add("active");
  if (type === "fuel" || type === "payload") {
    state.cutaway = true;
    document.querySelector("#cutawayToggle")?.classList.add("active");
  }
  if (type === "drag" || type === "wind" || type === "guidance" || type === "structure" || type === "heat" || type === "staging") {
    state.simRunning = true;
    state.simTime = 42;
    document.querySelector("#simToggle")?.classList.add("active");
  }
  if (type === "engine") {
    state.simRunning = true;
    state.simTime = 8;
    document.querySelector("#simToggle")?.classList.add("active");
  }
  proactiveCoach(type);
  updateMissionCopilot(type, { speak: true });
}

function proactiveCoach(type) {
  const metrics = physicsMetrics();
  const peak = estimateMaxQ(metrics);
  const limit = structuralLimitKpa();
  const focusKey = `${type}:${Math.round(metrics.twr * 10)}:${Math.round(metrics.deltaVMargin / 500)}:${Math.round(peak.q / 10)}`;
  if (state.lastCoachFocus === focusKey) return;
  state.lastCoachFocus = focusKey;
  if (metrics.twr < 1 && (type === "payload" || type === "fuel" || type === "engine")) {
    guide(`Prediction check: T/W is ${metrics.twr.toFixed(2)}. Before orbit matters, ask: can thrust beat weight?`, "Coach");
  } else if (metrics.deltaVMargin < 0 && (type === "payload" || type === "fuel" || type === "staging")) {
    guide(`Prediction check: delta-v margin is ${formatDeltaV(metrics.deltaVMargin)}. Which term changed in ln(m0 / mf)?`, "Coach");
  } else if (peak.q > limit * 0.82 && (type === "drag" || type === "wind" || type === "guidance" || type === "structure")) {
    guide(`Prediction check: Max-Q is ${peak.q.toFixed(0)} kPa near the ${limit.toFixed(0)} kPa limit. What variable in q = 1/2 rho v^2 did you push?`, "Coach");
  }
}

function copilotDiagnosis(type, metrics = physicsMetrics()) {
  const peak = estimateMaxQ(metrics);
  const limit = structuralLimitKpa();
  const risk = flightRisk({ ...simSnapshot(), ...metrics, q: peak.q });
  const control = controlLabel(type);
  if (type === "payload") {
    const stateKey = metrics.payloadFraction > 1 || metrics.deltaVMargin < -900 ? "danger" : metrics.payloadFraction > 0.82 ? "warning" : "nominal";
    return {
      state: stateKey,
      line: `Payload changed: margin is ${metrics.deltaVMargin >= 0 ? "+" : ""}${formatDeltaV(metrics.deltaVMargin)}.`,
      detail: metrics.payloadFraction > 0.82
        ? "Payload rides all the way to orbit, so it shrinks m0/mf quickly."
        : "Watch the delta-v arc. More useful mass costs final velocity.",
    };
  }
  if (type === "fuel") {
    const stateKey = metrics.twr < 1 ? "danger" : metrics.deltaVMargin < 0 ? "warning" : "nominal";
    return {
      state: stateKey,
      line: `Fuel changed: T/W ${metrics.twr.toFixed(2)}, mass ratio ${metrics.massRatio.toFixed(2)}.`,
      detail: metrics.twr < 1
        ? "More fuel can help delta-v and still lose on the pad if wet mass gets too high."
        : "Fuel is useful only when thrust and dry mass still close the mission.",
    };
  }
  if (type === "engine") {
    return {
      state: metrics.twr < 1 ? "danger" : metrics.twr < 1.18 ? "warning" : "nominal",
      line: `Engine authority changed: liftoff T/W is ${metrics.twr.toFixed(2)}.`,
      detail: metrics.twr < 1 ? "Gravity is still winning. Add thrust or reduce wet mass." : "You cleared the pad; now test whether delta-v and Max-Q still survive.",
    };
  }
  if (["drag", "wind", "guidance", "structure"].includes(type)) {
    const stateKey = peak.q > limit ? "danger" : peak.q > limit * 0.78 || risk > 0.45 ? "warning" : "nominal";
    return {
      state: stateKey,
      line: `${control} changed: peak Max-Q is ${peak.q.toFixed(0)} kPa.`,
      detail: peak.q > limit
        ? `That crosses the ${limit.toFixed(0)} kPa structure limit. Air is the active enemy.`
        : "The orange air-load curve should move before orbit speed changes much.",
    };
  }
  if (type === "heat") {
    const thermal = thermalLoadIndex({ ...simSnapshot(), ...metrics, q: peak.q });
    return {
      state: thermal > 1 ? "danger" : thermal > 0.72 ? "warning" : "nominal",
      line: `Heat shield changed: thermal index is ${thermal.toFixed(2)}.`,
      detail: "Heating is speed plus air load. IR view makes the hot zones obvious.",
    };
  }
  if (type === "staging") {
    return {
      state: Math.abs(state.stagingTiming) > 8 ? "danger" : Math.abs(state.stagingTiming) > 4 ? "warning" : "nominal",
      line: `Staging shifted ${state.stagingTiming > 0 ? "+" : ""}${state.stagingTiming}s.`,
      detail: "A good upper stage can still inherit bad timing, tumble, or wasted impulse.",
    };
  }
  return {
    state: "nominal",
    line: `${control} changed.`,
    detail: "Predict one graph, then launch to test the claim.",
  };
}

function updateMissionCopilot(type = state.controlFocus, { speak = false } = {}) {
  if (!type) return;
  const diagnosis = copilotDiagnosis(type);
  state.copilotLine = diagnosis.line;
  state.copilotDetail = diagnosis.detail;
  state.copilotState = diagnosis.state;
  const metrics = physicsMetrics();
  const peak = estimateMaxQ(metrics);
  const focusKey = `${type}:${diagnosis.state}:${Math.round(metrics.twr * 20)}:${Math.round(metrics.deltaVMargin / 250)}:${Math.round(peak.q / 5)}`;
  if (speak && state.voiceEnabled && state.voiceAutoNarrate && focusKey !== state.lastCopilotFocus && performance.now() - state.lastCopilotAt > 2600) {
    state.lastCopilotFocus = focusKey;
    state.lastCopilotAt = performance.now();
    const spoken = `${diagnosis.line} ${diagnosis.detail}`;
    if (state.voiceRealtimeConnected) requestRealtimeResponse(spoken, "control-change");
    else speakAgentReply(spoken, { mode: "control-change", interrupt: false });
  }
}

function renderMissionCopilot() {
  if (!els.missionCopilotHud) return;
  const metrics = physicsMetrics();
  const peak = estimateMaxQ(metrics);
  if (!state.copilotLine) {
    const plan = currentVectorPlan();
    state.copilotLine = plan.title;
    state.copilotDetail = `T/W ${metrics.twr.toFixed(2)} · Δv ${metrics.deltaVMargin >= 0 ? "+" : ""}${formatDeltaV(metrics.deltaVMargin)} · Max-Q ${peak.q.toFixed(0)} kPa`;
    state.copilotState = plan.state === "danger" ? "danger" : plan.state === "warning" ? "warning" : "nominal";
  }
  els.missionCopilotHud.dataset.state = state.copilotState;
  els.missionCopilotHud.dataset.focus = state.controlFocus || "scene";
  els.missionCopilotHud.innerHTML = `
    <span>Mission copilot${state.voiceAutoNarrate ? " · voice auto" : ""}</span>
    <strong>${compact(state.copilotLine, 92)}</strong>
    <em>${compact(state.copilotDetail, 128)}</em>
  `;
}

function inspectPart(kind) {
  const rocket = currentRocket();
  const pickers = {
    engines: { label: "engine thrust path", focus: "engines", zoom: 2.25, pitch: -0.12, match: propulsionPart },
    tanks: { label: "propellant tanks and mass ratio", focus: "fuel", zoom: 1.95, pitch: 0.02, match: tankPart },
    payload: { label: "payload mass and balance", focus: "payload", zoom: 2.25, pitch: 0.22, match: payloadPart },
    thermal: { label: "thermal and Max-Q load", focus: "drag", zoom: 1.8, pitch: 0.12, match: thermalPart },
  };
  const config = pickers[kind] || pickers.engines;
  const part = rocket.parts.find(config.match) || currentPart();
  state.selectedPartId = part.id;
  state.targetFocusY = partFocusRatio(rocket, part.id);
  state.showLabels = true;
  state.labelDensity = "focus";
  state.zoom = Math.max(state.zoom, config.zoom);
  state.targetPitch = config.pitch;
  if (kind === "tanks" || kind === "payload") {
    state.cutaway = true;
    document.querySelector("#cutawayToggle")?.classList.add("active");
  }
  previewControl(config.focus);
  renderUI();
  guide(`Inspecting ${part.name}: ${config.label}. ${compact(part.equation[2], 88)}`, "Tutor");
}

function applyMission(mode) {
  const profile = missionProfiles[mode] || missionProfiles.orbit;
  const rocket = currentRocket();
  state.missionMode = mode;
  resetFlightState();
  const maxPayload = Math.max(rocket.maxPayloadT * 1.25, rocket.defaultPayloadT * 1.5);
  state.payloadT = Math.min(maxPayload, rocket.defaultPayloadT * (profile.payloadBoost || 1));
  state.fuelPercent = profile.fuelPercent || 100;
  state.dragFactor = profile.dragFactor || 1;
  state.windFactor = profile.windFactor ?? 0.2;
  state.guidanceError = profile.guidanceError ?? 0.08;
  state.engineHealth = 100;
  state.structurePercent = 100;
  state.heatShieldPercent = 100;
  state.stagingTiming = 0;
  state.baseline = metricsSnapshot();
  document.querySelectorAll(".scenario-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.mission === state.missionMode);
  });
  syncExperimentControls();
  renderUI();
  guide(`${profile.label} experiment loaded. ${profile.copy}`, "Flight");
}

function launchTest() {
  resetFlightState();
  state.flightWorkspace = "flight";
  state.launchStatus = "countdown";
  state.launchClock = 0;
  state.lastFrameMs = 0;
  state.simRunning = true;
  document.querySelector("#simToggle").classList.add("active");
  renderUI();
  guide(`Countdown started: ${currentMission().label}. Watch T/W, Max-Q, and delta-v margin.`, "Flight");
}

function resetFlight() {
  resetFlightState();
  renderUI();
  guide("Flight reset. Change one flight or realism control, predict the graph change, then test again.", "Flight");
}

function restoreSafeDefault() {
  const rocket = currentRocket();
  resetFlightState();
  state.missionMode = "orbit";
  state.payloadT = Math.min(Math.max(rocket.defaultPayloadT, 0.2), Math.max(rocket.maxPayloadT * 0.55, rocket.defaultPayloadT));
  state.fuelPercent = 100;
  state.dragFactor = 1;
  state.windFactor = 0.16;
  state.guidanceError = 0.06;
  state.engineHealth = 100;
  state.structurePercent = 100;
  state.heatShieldPercent = 100;
  state.stagingTiming = 0;
  state.baseline = metricsSnapshot();
  document.querySelectorAll(".scenario-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.mission === state.missionMode);
  });
  syncExperimentControls();
  renderUI();
  guide("Safe default restored: nominal orbit, full fuel, healthy engines, healthy structure, and clean staging.", "Flight");
}

function startTutorialDemo() {
  if (state.tutorialTimer) {
    clearTimeout(state.tutorialTimer);
    state.tutorialTimer = null;
  }
  setPanelMode("flight");
  state.flightWorkspace = "flight";
  restoreSafeDefault();
  state.showLabels = true;
  document.querySelector("#labelToggle")?.classList.add("active");
  const steps = [
    [0, () => {
      guide("Demo 1/4: this is the safe baseline. T/W clears 1, Max-Q is under the limit, and delta-v margin is positive.", "Tutor");
    }],
    [1600, () => {
      state.payloadT = Math.min(Number(els.payloadSlider.max), currentRocket().maxPayloadT * 1.12);
      state.controlFocus = "payload";
      state.controlPulse = 100;
      syncExperimentControls();
      renderUI();
      guide("Demo 2/4: payload rises high in the stack. Watch delta-v margin and T/W move before launch.", "Tutor");
    }],
    [3400, () => {
      state.windFactor = 0.72;
      state.guidanceError = 0.32;
      state.dragFactor = 1.35;
      state.controlFocus = "wind";
      syncExperimentControls();
      renderUI();
      guide("Demo 3/4: now weather and pointing errors raise Max-Q. The warning stack should explain the risk.", "Tutor");
    }],
    [5200, () => {
      launchTest();
      guide("Demo 4/4: launch test runs the current design. If it fails, switch to Review and repair one cause.", "Tutor");
    }],
  ];
  steps.forEach(([delay, fn], index) => {
    state.tutorialTimer = setTimeout(() => {
      fn();
      if (index === steps.length - 1) state.tutorialTimer = null;
    }, delay);
  });
}

function selectBuilderRocket() {
  updateBuilderRocket({ select: true });
  state.flightWorkspace = "build";
  renderRocketList();
  renderUI();
  guide("Custom rocket loaded. Push the architecture until it fails, then use the failure chain as the lesson.", "Builder");
}

function changeBuilderConfig(key, value) {
  builderConfig[key] = key === "stages" || key === "boosterPairs" || key === "engineCount"
    ? Number(value)
    : key === "diameterM"
      ? Number(value)
      : value;
  if (["engineModel", "engineCount"].includes(key)) state.flightWorkspace = "engines";
  if (["skinMaterial", "tankMaterial", "heatShieldMaterial"].includes(key)) state.flightWorkspace = "materials";
  updateBuilderRocket({ select: true });
  renderRocketList();
  renderUI();
}

const blueprintPartActions = {
  stage: {
    label: "Stage added",
    apply: () => {
      builderConfig.stages = clamp(Number(builderConfig.stages) + 1, 1, 3);
    },
    copy: "A new stage can improve mass ratio, but separation timing becomes another failure point.",
  },
  booster: {
    label: "Boosters mounted",
    apply: () => {
      builderConfig.boosterPairs = clamp(Number(builderConfig.boosterPairs) + 1, 0, 2);
    },
    copy: "Boosters add liftoff thrust. They also add side loads and staging risk.",
  },
  engine: {
    label: "Engine cluster expanded",
    apply: () => {
      builderConfig.engineCount = clamp(Number(builderConfig.engineCount) + 3, 1, 33);
    },
    copy: "More engines help T/W first. Past a point, plumbing and dry mass become the lesson.",
  },
  raptor: {
    label: "Raptor-class engines installed",
    apply: () => {
      builderConfig.engineModel = "raptor";
      builderConfig.upperStage = "methalox";
      builderConfig.engineCount = clamp(Math.max(6, Number(builderConfig.engineCount) + 2), 1, 33);
    },
    copy: "Methalox raises power and reuse realism, but complexity risk climbs.",
  },
  fuel: {
    label: "Methalox tanks loaded",
    apply: () => {
      builderConfig.upperStage = "methalox";
      builderConfig.diameterM = clamp(Number(builderConfig.diameterM) + 0.2, 1.2, 9);
    },
    copy: "Methane is less dense than RP-1, so tanks tend to grow for the same mission.",
  },
  cryo: {
    label: "Cryogenic upper stage added",
    apply: () => {
      builderConfig.stages = Math.max(2, Number(builderConfig.stages));
      builderConfig.upperStage = "cryo";
    },
    copy: "Hydrogen boosts Isp, but the tank gets large and delicate.",
  },
  skin: {
    label: "Steel skin selected",
    apply: () => {
      builderConfig.skinMaterial = "stainless-steel";
      builderConfig.tankMaterial = "stainless-steel";
    },
    copy: "Steel is heavier, tougher, and better for heat. Watch mass ratio after the swap.",
  },
  shield: {
    label: "Thermal shield upgraded",
    apply: () => {
      builderConfig.heatShieldMaterial = "ceramic";
    },
    copy: "Better TPS improves heat margin, but mass and inspection burden rise.",
  },
  slim: {
    label: "Core narrowed",
    apply: () => {
      builderConfig.diameterM = clamp(Number(builderConfig.diameterM) - 0.4, 1.2, 9);
    },
    copy: "A slimmer core cuts drag and dry mass, but tank volume and stability may suffer.",
  },
};

function applyBlueprintPart(partId, source = "Inventory") {
  if (addBlueprintSketchPart(partId)) {
    guide("Placed a loose 2D blueprint part. Use Draw to annotate it or launch the assembled config from the main stack.", source);
    return;
  }
  const action = blueprintPartActions[partId];
  if (!action) return;
  action.apply();
  addBlueprintEvidencePart(partId);
  updateBuilderRocket({ select: true });
  renderRocketList();
  renderUI();
  if (els.blueprintInventoryStatus) {
    els.blueprintInventoryStatus.textContent = `${action.label}. ${action.copy}`;
  }
  guide(`${action.label}: ${action.copy}`, source);
}

function applyBuilderPreset(name) {
  const preset = builderPresets[name];
  if (!preset) return;
  Object.assign(builderConfig, preset);
  updateBuilderRocket({ select: true });
  renderRocketList();
  renderUI();
  guide(`${name === "chaos" ? "Failure" : "Architecture"} preset loaded. Predict the first failure before pressing Launch test.`, "Builder");
}

function stressBuilder() {
  selectBuilderRocket();
  const rocket = currentRocket();
  state.payloadT = Math.min(Number(els.payloadSlider.max), rocket.maxPayloadT * 1.18);
  state.fuelPercent = builderConfig.reuse === "reusable" ? 74 : 82;
  state.dragFactor = builderConfig.boosterPairs > 0 ? 1.42 : 1.18;
  state.windFactor = 0.58;
  state.guidanceError = 0.22;
  state.engineHealth = 82;
  state.structurePercent = 74;
  state.heatShieldPercent = 78;
  state.stagingTiming = builderConfig.stages > 1 ? 7 : 0;
  state.controlFocus = "payload";
  state.controlPulse = 90;
  syncExperimentControls();
  renderUI();
  guide("Stress test loaded. This deliberately pushes payload, fuel reserve, air load, and guidance so the failure chain becomes visible.", "Builder");
}

function repairBuilder() {
  const diagnosis = diagnoseBuilderRocket();
  if (/thrust-to-weight|Pad failure/i.test(diagnosis.title)) {
    builderConfig.engineCount = Math.min(33, builderConfig.engineCount + 4);
    if (builderConfig.boosterPairs < 1 && builderConfig.engineCount > 17) builderConfig.boosterPairs = 1;
  } else if (/Orbit shortfall|mass ratio/i.test(diagnosis.title)) {
    builderConfig.stages = Math.min(3, builderConfig.stages + 1);
    if (builderConfig.upperStage === "kerolox") builderConfig.upperStage = "cryo";
    state.payloadT = Math.max(0.2, state.payloadT * 0.72);
    state.fuelPercent = 100;
  } else if (/Dry-mass/i.test(diagnosis.title)) {
    builderConfig.diameterM = Math.max(1.2, Number((builderConfig.diameterM - 0.8).toFixed(1)));
    builderConfig.reuse = "expendable";
  } else if (/Complexity/i.test(diagnosis.title)) {
    builderConfig.boosterPairs = Math.max(0, builderConfig.boosterPairs - 1);
    builderConfig.engineCount = Math.max(5, builderConfig.engineCount - 6);
    builderConfig.reuse = "expendable";
  } else if (/Max-Q|side-load/i.test(diagnosis.title)) {
    builderConfig.boosterPairs = Math.max(0, builderConfig.boosterPairs - 1);
    state.dragFactor = Math.max(0.8, state.dragFactor - 0.22);
    state.windFactor = Math.max(0, state.windFactor - 0.22);
    state.guidanceError = Math.max(0, state.guidanceError - 0.12);
    state.structurePercent = Math.min(100, state.structurePercent + 16);
  } else {
    state.payloadT = Math.min(Number(els.payloadSlider.max), state.payloadT * 1.12);
  }
  updateBuilderRocket({ select: true });
  state.flightWorkspace = "build";
  syncExperimentControls();
  renderRocketList();
  renderUI();
  guide(`Repair applied: ${diagnosis.repairs[0]}. Run the test again and compare the failure mode.`, "Builder");
}

function renderMissionTabs() {
  document.querySelectorAll(".scenario-tab").forEach((button) => {
    const profile = missionProfiles[button.dataset.mission] || missionProfiles.orbit;
    button.classList.toggle("active", button.dataset.mission === state.missionMode);
    button.title = `${profile.label}: ${profile.copy}`;
    button.setAttribute("aria-label", `${profile.label} flight experiment`);
    button.innerHTML = `<span class="mission-icon" aria-hidden="true">${profile.icon}</span><span class="mission-name">${profile.shortLabel}</span>`;
  });
}

function failureReportLines() {
  const metrics = physicsMetrics();
  const peak = estimateMaxQ(metrics);
  const lines = [
    "Rocket Agent Lab - Failure Report",
    `Generated: ${new Date().toLocaleString()}`,
    `Current rocket: ${currentRocket().name}`,
    `Mission: ${currentMission().label}`,
    "",
    "Current safe/unsafe snapshot",
    `T/W ${metrics.twr.toFixed(2)} | delta-v ${formatDeltaV(metrics.effectiveDeltaV)} | margin ${formatDeltaV(metrics.deltaVMargin)}`,
    `Peak Max-Q ${peak.q.toFixed(1)} kPa | structure limit ${structuralLimitKpa().toFixed(1)} kPa | thermal index ${thermalLoadIndex({ ...simSnapshot(), q: peak.q }).toFixed(2)}`,
    `Payload ${state.payloadT.toFixed(1)} t | fuel ${Math.round(state.fuelPercent)}% | engines ${Math.round(state.engineHealth)}% | structure ${Math.round(state.structurePercent)}% | heat shield ${Math.round(state.heatShieldPercent)}% | staging ${state.stagingTiming}s`,
    "",
  ];
  if (!state.failureLog.length) {
    lines.push("No failures logged yet. Run Launch test after pushing a slider into warning/danger.");
    return lines;
  }
  state.failureLog.forEach((entry, index) => {
    lines.push(`Failure ${index + 1}: ${entry.rocket} / ${entry.mission}`);
    lines.push(`At: ${entry.time}`);
    lines.push(`Reason: ${entry.reason}`);
    lines.push(`Chain: ${entry.chain.join(" -> ")}`);
    lines.push(`Metrics: T/W ${entry.metrics.twr.toFixed(2)}, margin ${formatDeltaV(entry.metrics.margin)}, Max-Q ${entry.metrics.maxQ.toFixed(1)} kPa, thermal ${entry.metrics.thermal.toFixed(2)}, risk ${Math.round(entry.metrics.risk * 100)}%`);
    lines.push(`Controls: payload ${entry.controls.payloadT.toFixed(1)} t, fuel ${Math.round(entry.controls.fuelPercent)}%, drag ${entry.controls.dragFactor.toFixed(2)}x, wind ${Math.round(entry.controls.windFactor * 100)}%, guidance ${Math.round(entry.controls.guidanceError * 100)}%, engines ${Math.round(entry.controls.engineHealth)}%, structure ${Math.round(entry.controls.structurePercent)}%, heat shield ${Math.round(entry.controls.heatShieldPercent)}%, staging ${entry.controls.stagingTiming}s`);
    lines.push("");
  });
  return lines;
}

function pdfEscape(text) {
  return String(text).replace(/[\\()]/g, "\\$&");
}

function makeFailurePdfBlob() {
  const lines = failureReportLines();
  const chunks = [];
  for (let i = 0; i < lines.length; i += 42) chunks.push(lines.slice(i, i + 42));
  const objects = [null];
  const addObject = (body) => {
    objects.push(body);
    return objects.length - 1;
  };
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = chunks.map((chunk, pageIndex) => {
    const textOps = chunk.map((line, index) => `${index === 0 ? "" : "T*"}(${pdfEscape(line.slice(0, 108))}) Tj`).join("\n");
    const stream = `BT\n/F1 ${pageIndex === 0 ? 12 : 10} Tf\n50 792 Td\n15 TL\n${textOps}\nET`;
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    return addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
  });
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function downloadFailurePdf() {
  const blob = makeFailurePdfBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rocket-failure-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  guide(`Failure report ready with ${state.failureLog.length} logged run${state.failureLog.length === 1 ? "" : "s"}.`, "Flight");
}

function renderRocketList() {
  document.querySelectorAll("[data-catalog-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.catalogMode === state.catalogMode);
  });
  document.querySelectorAll("[data-catalog-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.catalogFilter === state.catalogFilter);
    button.hidden = state.catalogMode !== "rockets";
  });
  const filteredRockets = rockets.filter((rocket) => catalogFilterMatches(rocket, state.catalogFilter));
  els.catalogCount.textContent = state.catalogMode === "rockets"
    ? `${filteredRockets.length} / ${rockets.length} models`
    : state.catalogMode === "engines"
      ? `${Object.keys(engineCatalog).length} engines`
      : `${Object.keys(materialCatalog).length} materials`;
  els.rocketList.innerHTML = "";
  if (state.catalogMode === "engines") {
    Object.entries(engineCatalog).forEach(([key, engine]) => {
      const button = document.createElement("button");
      button.className = `rocket-item ${builderConfig.engineModel === key ? "active" : ""}`;
      button.dataset.rocket = "engine";
      button.innerHTML = `<i class="rocket-glyph"></i><span><strong>${engine.name}</strong><span>${engine.propellant.toUpperCase()} · ${engine.thrustMN.toFixed(engine.thrustMN < 0.1 ? 3 : 2)} MN each</span></span>`;
      button.addEventListener("click", () => {
        changeBuilderConfig("engineModel", key);
        setFlightWorkspace("engines");
      });
      els.rocketList.appendChild(button);
    });
    return;
  }
  if (state.catalogMode === "materials") {
    Object.entries(materialCatalog).forEach(([key, material]) => {
      const button = document.createElement("button");
      button.className = `rocket-item ${builderConfig.skinMaterial === key ? "active" : ""}`;
      button.dataset.rocket = "material";
      button.innerHTML = `<i class="rocket-glyph"></i><span><strong>${material.name}</strong><span>E ${material.youngGpa} GPa · ${material.strengthMpa} MPa</span></span>`;
      button.addEventListener("click", () => {
        changeBuilderConfig("skinMaterial", key);
        setFlightWorkspace("materials");
      });
      els.rocketList.appendChild(button);
    });
    return;
  }
  filteredRockets.forEach((rocket) => {
    const index = rockets.findIndex((item) => item.id === rocket.id);
    const button = document.createElement("button");
    button.className = `rocket-item ${index === state.rocketIndex ? "active" : ""}`;
    button.dataset.rocket = rocket.id;
    const meta = [rocket.country, rocket.status].filter(Boolean).join(" · ");
    button.innerHTML = `
      <i class="rocket-glyph"></i>
      <span>
        <strong>${rocket.name}</strong>
        <span>${rocket.family} · ${rocket.maxPayloadT} t threshold</span>
        <em>${meta || rocket.era || "Reference vehicle"}</em>
      </span>
    `;
    button.addEventListener("click", () => {
      selectRocket(index);
      els.catalogPanel.classList.remove("open");
    });
    els.rocketList.appendChild(button);
  });
}

function catalogFilterMatches(rocket, filter = "all") {
  if (filter === "all") return true;
  const haystack = [
    rocket.name,
    rocket.mission,
    rocket.family,
    rocket.summary,
    rocket.operator,
    rocket.country,
    rocket.status,
    rocket.era,
    rocket.lessonFocus,
  ].join(" ").toLowerCase();
  if (filter === "reusable") return rocket.id === "builder" || /reusable|reuse|return|landing/.test(haystack);
  if (filter === "crew") return /crew|crewed|human|apollo|mercury|gemini|shenzhou|orion|capsule|space shuttle/.test(haystack);
  if (filter === "heavy") return rocket.maxPayloadT >= 20 || /heavy|super-heavy|super heavy|moon|lunar/.test(haystack);
  if (filter === "small") return rocket.maxPayloadT <= 3 || /small|micro|light|responsive|air-launched|suborbital/.test(haystack);
  if (filter === "historic") return /retired|historic|196|197|198|199|2003|2005|2009|2018|2020|2023|2024/.test(haystack);
  if (filter === "development") return /development|planned|concept|debut|operational return/.test(haystack);
  return true;
}

function tankPart(part) {
  return /tank|core|stage|booster|s-ic|s-ii|s-ivb|first-stage|second-stage|super-heavy|ship-tanks|boosters/i.test(`${part.id} ${part.name} ${part.type}`);
}

function payloadPart(part) {
  return /payload|fairing|bay|spacecraft|orion|command module|orbiter|crew/i.test(`${part.id} ${part.name} ${part.type}`);
}

function propulsionPart(part) {
  return /engine|propulsion|nozzle|merlin|raptor|be-4|be-3|rd-180|rd-107|rs-25|rs-68|f-1|rutherford|vulcain|vinci|archimedes|aeon|tq-12|yf-100/i.test(`${part.id} ${part.name} ${part.type}`);
}

function thermalPart(part) {
  return /heat|shield|tile|fairing|flap|orbiter|command|crew|orion|payload/i.test(`${part.id} ${part.name} ${part.type}`);
}

function stagingPart(part) {
  return /stage|staging|interstage|separation|hot-stage|battery/i.test(`${part.id} ${part.name} ${part.type}`);
}

function partMassScore(part) {
  let score = Math.max(0.25, part.height * Math.max(part.r0 || 0.5, part.r1 || 0.5));
  if (propulsionPart(part)) score *= 1.45;
  if (payloadPart(part)) score *= 0.62;
  if (/fairing|escape|grid|flap|battery/i.test(`${part.id} ${part.name} ${part.type}`)) score *= 0.42;
  if (/solid|srb|booster/i.test(`${part.id} ${part.name} ${part.type}`)) score *= 1.2;
  return score;
}

function partCostScore(part) {
  let score = Math.max(0.4, part.height * 0.28);
  if (propulsionPart(part)) score *= 3.4;
  if (thermalPart(part)) score *= 1.65;
  if (stagingPart(part)) score *= 1.28;
  if (/avionics|battery|guidance|control|grid|flap/i.test(`${part.id} ${part.name} ${part.type}`)) score *= 1.55;
  if (tankPart(part)) score *= 0.9;
  return score;
}

function partMaterial(part, rocket = currentRocket()) {
  const text = `${rocket.id} ${part.id} ${part.name} ${part.type}`;
  if (/raptor|merlin|engine|nozzle|vulcain|rd-107|rs-25|rutherford|f-1/i.test(text)) {
    return "High-temperature alloys, copper liners, turbopumps, valves";
  }
  if (/starship|super-heavy|ship-tanks|flaps|payload-bay/i.test(text)) {
    return "Stainless steel skin, welded tank structure, TPS where exposed";
  }
  if (/heat|orion|command|orbiter|crew/i.test(text)) {
    return "Pressure vessel plus ablative or tiled thermal protection";
  }
  if (/fairing|payload/i.test(text)) {
    return "Composite shell, acoustic lining, separation hardware";
  }
  if (/solid|srb|s200/i.test(text)) {
    return "Motor case, insulation, solid propellant grain, nozzle throat";
  }
  if (/tank|core|stage|booster|s-ic|s-ii|s-ivb|first-stage|second-stage/i.test(text)) {
    return "Thin-wall tank barrel, domes, stringers, welds, insulation";
  }
  return "Flight structure, fasteners, wiring, sensors, local shielding";
}

function partFailureModes(part) {
  const text = `${part.id} ${part.name} ${part.type}`;
  if (propulsionPart(part)) return ["Ignition transient", "Turbopump or valve fault", "Nozzle/throat heating", "Gimbal actuator limit"];
  if (stagingPart(part)) return ["Late or early separation", "Recontact risk", "Hot-gas impingement", "Avionics timing fault"];
  if (payloadPart(part)) return ["Acoustic vibration", "Fairing latch fault", "Center-of-mass shift", "Thermal soak"];
  if (/flap|grid|control/i.test(text)) return ["Actuator jam", "Aero overload", "Hinge heating", "Guidance instability"];
  if (tankPart(part)) return ["Buckling under compression", "Slosh coupling", "Pressure leak", "Insulation or weld damage"];
  return ["Sensor fault", "Structural fatigue", "Thermal cycling", "Vibration loosening"];
}

function partOptimizationLever(part) {
  const text = `${part.id} ${part.name} ${part.type}`;
  if (propulsionPart(part)) return "Raise reliability per engine start, improve throttle curve, and reduce inspection time.";
  if (stagingPart(part)) return "Make separation timing deterministic and remove dead mass as soon as it stops helping.";
  if (payloadPart(part)) return "Keep the payload protected, centered, and released only after acoustic/heating loads fall.";
  if (/flap|grid|control/i.test(text)) return "Use just enough control authority without adding drag, hinge mass, or thermal risk.";
  if (tankPart(part)) return "Maximize propellant fraction while keeping pressure, buckling, slosh, and weld margins safe.";
  return "Reduce part count, simplify inspection, and keep sensors close to likely failure points.";
}

function estimatePartBreakdown(part = currentPart(), rocket = currentRocket()) {
  const parts = normalizeParts(rocket);
  const located = parts.find((item) => item.id === part.id) || parts[0];
  const totalHeight = Math.max(1, parts.at(-1).top - parts[0].bottom);
  const heightShare = located.height / totalHeight;
  const dryTotal = parts.reduce((sum, item) => sum + partMassScore(item), 0);
  const costTotal = parts.reduce((sum, item) => sum + partCostScore(item), 0);
  const tankHeight = parts.filter(tankPart).reduce((sum, item) => sum + item.height, 0) || totalHeight;
  const dryMassT = rocket.dryMassT * partMassScore(part) / Math.max(1, dryTotal);
  const propellantMassT = tankPart(part) ? rocket.propellantT * (state.fuelPercent / 100) * located.height / tankHeight : 0;
  const payloadMassT = payloadPart(part) ? state.payloadT : 0;
  const wetMassT = dryMassT + propellantMassT + payloadMassT;
  const costShare = partCostScore(part) / Math.max(1, costTotal);
  const verticalPct = Math.max(4, Math.min(96, 100 - ((located.mid - parts[0].bottom) / totalHeight) * 100));
  const startPct = Math.max(0, 100 - ((located.top - parts[0].bottom) / totalHeight) * 100);
  const endPct = Math.max(0, 100 - ((located.bottom - parts[0].bottom) / totalHeight) * 100);
  return {
    dryMassT,
    propellantMassT,
    payloadMassT,
    wetMassT,
    costShare,
    heightShare,
    verticalPct,
    startPct,
    endPct,
    material: partMaterial(part, rocket),
    failures: partFailureModes(part),
    lever: partOptimizationLever(part),
  };
}

function formatMassT(value) {
  if (value >= 100) return `${Math.round(value)} t`;
  if (value >= 10) return `${value.toFixed(1)} t`;
  if (value >= 1) return `${value.toFixed(2)} t`;
  return `${Math.round(value * 1000)} kg`;
}

function partLabelDetail(part) {
  const breakdown = estimatePartBreakdown(part);
  if (payloadPart(part)) return `Payload mass: ${state.payloadT.toFixed(state.payloadT < 10 ? 1 : 0)} t in this upper volume`;
  if (tankPart(part)) return `Propellant level: ${Math.round(state.fuelPercent)}% · oxidizer + fuel tanks`;
  if (propulsionPart(part)) return "Chemical energy -> hot gas -> thrust";
  return `${formatMassT(breakdown.wetMassT)} here · ${compact(part.equation[2], 42)}`;
}

function renderMissionTip() {
  const mission = currentMission();
  els.missionTip.innerHTML = `
    <strong>${mission.label}</strong>
    <span>${mission.beginner}</span>
  `;
}

function renderChallenge() {
  const challenge = currentChallenge();
  const passed = challenge.checks.filter((check) => check.pass).length;
  els.challengeTitle.textContent = challenge.title;
  els.challengeScore.textContent = `${passed} / ${challenge.checks.length} checks`;
  els.challengeScore.dataset.state = passed === challenge.checks.length ? "success" : passed <= 1 ? "danger" : "warning";
  els.challengeList.innerHTML = "";
  challenge.checks.forEach((check) => {
    const div = document.createElement("div");
    div.className = `challenge-check ${check.pass ? "pass" : "fail"}`;
    div.innerHTML = `<span>${check.pass ? "✓" : "!"}</span><strong>${check.label}</strong>`;
    els.challengeList.appendChild(div);
  });
}

function coachRecommendation() {
  const challenge = currentChallenge();
  const failed = challenge.checks.find((check) => !check.pass);
  const mission = currentMission();
  if (!failed) {
    return {
      move: "Run the launch, then explain the strongest margin.",
      why: `${mission.shortLabel} is currently passing. The next learning step is to connect the green checks to mass ratio, Max-Q, and thrust-to-weight.`,
      focus: "explain",
    };
  }
  if (/T\/W|Liftoff/i.test(failed.label)) {
    return {
      move: "Reduce payload or increase fuel discipline until T/W clears 1.00.",
      why: "If thrust-to-weight is below one, the rocket cannot accelerate upward. This is Newton's second law before anything orbital matters.",
      focus: "payload",
    };
  }
  if (/delta-v|Escape|orbit margin|Still has/i.test(failed.label)) {
    return {
      move: "Trade payload down or fuel up to recover delta-v margin.",
      why: "The rocket equation is logarithmic: extra payload hurts twice because it must be lifted by every stage below it.",
      focus: "fuel",
    };
  }
  if (/Max-Q|Air load|Guidance|wind|Drag/i.test(failed.label)) {
    return {
      move: "Lower drag, wind, or guidance error until Max-Q drops under the structure limit.",
      why: "Dynamic pressure scales with velocity squared, so a small guidance or shape mistake can become a big air-load problem.",
      focus: "drag",
    };
  }
  if (/Payload|reserve|Fuel/i.test(failed.label)) {
    return {
      move: "Move the payload or fuel slider until the mission class is credible.",
      why: "Payload class tells you whether this rocket is being used inside its design envelope or being asked to do another vehicle's job.",
      focus: "payload",
    };
  }
  return {
    move: "Change one control, predict the metric, then test.",
    why: "The lab works best when you isolate one cause and watch how the flight result changes.",
    focus: null,
  };
}

function renderLabCoach() {
  const coach = coachRecommendation();
  els.coachMove.textContent = coach.move;
  els.coachWhy.textContent = coach.why;
}

function signedNumber(value, digits = 0, suffix = "") {
  const formatted = digits > 0 ? Math.abs(value).toFixed(digits) : Math.round(Math.abs(value)).toString();
  return `${value >= 0 ? "+" : "-"}${formatted}${suffix}`;
}

function renderDeltaStrip() {
  if (!state.baseline) state.baseline = metricsSnapshot();
  const current = metricsSnapshot();
  const deltaV = current.deltaV - state.baseline.deltaV;
  const twr = current.twr - state.baseline.twr;
  const q = current.q - state.baseline.q;
  const risk = current.risk - state.baseline.risk;
  const values = [
    [els.deltaDv, signedNumber(deltaV, 0, " m/s"), deltaV, true],
    [els.deltaTwr, signedNumber(twr, 2), twr, true],
    [els.deltaQ, signedNumber(q, 1, " kPa"), q, false],
    [els.deltaRisk, signedNumber(risk * 100, 0, "%"), risk, false],
  ];
  values.forEach(([el, label, value, higherIsBetter]) => {
    el.textContent = label;
    el.dataset.state = Math.abs(value) < 0.01 ? "flat" : value > 0 === higherIsBetter ? "up" : "down";
  });
}

function shouldShowPartLabel(part, index, parts) {
  if (state.labelDensity === "all") return true;
  const selectedIndex = Math.max(0, parts.findIndex((item) => item.id === state.selectedPartId));
  if (part.id === state.selectedPartId) return true;
  const focus = state.controlFocus;
  const text = `${part.id} ${part.name} ${part.type}`;
  if (focus === "fuel" && tankPart(part) && Math.abs(index - selectedIndex) <= 1) return true;
  if (focus === "payload" && payloadPart(part) && Math.abs(index - selectedIndex) <= 1) return true;
  if ((focus === "drag" || focus === "wind" || focus === "guidance") && (thermalPart(part) || /fairing|fin|flap|booster|escape/i.test(text)) && Math.abs(index - selectedIndex) <= 1) return true;
  return false;
}

function renderPartLabels() {
  els.partLabels.classList.toggle("active", state.showLabels);
  els.viewHint.classList.toggle("active", state.showLabels);
  els.partLabels.innerHTML = "";
  if (!state.showLabels) return;

  const rocket = currentRocket();
  const parts = normalizeParts(rocket);
  const totalHeight = parts.at(-1).top - parts[0].bottom;
  parts.forEach((part, index) => {
    if (!shouldShowPartLabel(part, index, parts)) return;
    const side = index % 2 === 0 ? "right" : "left";
    const top = Math.max(8, Math.min(84, 50 - (part.mid / totalHeight) * 74));
    const label = document.createElement("button");
    label.className = `part-callout ${side} ${part.id === state.selectedPartId ? "active" : ""}`;
    label.style.top = `${top}%`;
    label.dataset.part = part.id;
    label.innerHTML = `
      <strong>${part.name}</strong>
      <span>${partLabelDetail(part)}</span>
      <em>${part.equation[1]}</em>
    `;
    label.addEventListener("click", () => {
      state.zoom = Math.max(state.zoom, 2.2);
      state.targetPitch = Math.max(-0.22, Math.min(0.38, state.targetPitch));
      selectPart(part.id);
    });
    els.partLabels.appendChild(label);
  });
}

function renderHardwareBreakdown() {
  const rocket = currentRocket();
  const part = currentPart();
  const breakdown = estimatePartBreakdown(part, rocket);
  els.locatorMarker.style.top = `${breakdown.verticalPct}%`;
  els.locatorFuel.style.top = `${Math.min(breakdown.startPct, breakdown.endPct)}%`;
  els.locatorFuel.style.height = `${Math.max(4, Math.abs(breakdown.endPct - breakdown.startPct))}%`;
  els.locatorFuel.classList.toggle("active", tankPart(part));
  els.locatorPayload.style.top = `${breakdown.verticalPct}%`;
  els.locatorPayload.classList.toggle("active", payloadPart(part));
  els.locatorPosition.textContent = `${part.name} location`;
  els.locatorCopy.textContent = tankPart(part)
    ? `This section carries about ${formatMassT(breakdown.propellantMassT)} of visible propellant at the current fuel load.`
    : payloadPart(part)
      ? `Payload/crew mass sits high in the stack, so it changes balance and the delta-v budget.`
      : `This hardware occupies about ${Math.round(breakdown.heightShare * 100)}% of the visible stack height.`;

  const costPercent = Math.max(1, Math.round(breakdown.costShare * 100));
  const propNote = breakdown.propellantMassT > 0 ? ` + ${formatMassT(breakdown.propellantMassT)} propellant` : "";
  const payloadNote = breakdown.payloadMassT > 0 ? ` + ${formatMassT(breakdown.payloadMassT)} payload` : "";
  const cards = [
    ["Mass here", formatMassT(breakdown.wetMassT), `Estimated dry ${formatMassT(breakdown.dryMassT)}${propNote}${payloadNote}`],
    ["Cost driver", `~${costPercent}%`, "Relative build/inspection complexity, not procurement data."],
    ["Material", compact(breakdown.material, 36), breakdown.material],
    ["Optimization", propulsionPart(part) ? "Reliability" : tankPart(part) ? "Mass ratio" : payloadPart(part) ? "Protection" : "Simplicity", breakdown.lever],
  ];
  els.hardwareGrid.innerHTML = "";
  cards.forEach(([label, value, note]) => {
    const div = document.createElement("div");
    div.className = "hardware-chip";
    div.innerHTML = `<span>${label}</span><strong>${value}</strong><em>${note}</em>`;
    els.hardwareGrid.appendChild(div);
  });

  els.failureMap.innerHTML = `
    <strong>Failure watchpoints</strong>
    <ul>${breakdown.failures.map((item) => `<li>${item}</li>`).join("")}</ul>
    <p>${breakdown.lever}</p>
  `;
}

function renderCaseStudy() {
  const rocket = currentRocket();
  const part = currentPart();
  const breakdown = estimatePartBreakdown(part, rocket);
  const fallback = {
    title: `${rocket.name} systems lens`,
    badge: rocket.family,
    cards: [
      ["Mass flow", `Current selected hardware is about ${formatMassT(breakdown.wetMassT)} in this simplified model.`],
      ["Cost pressure", "Engines, thermal protection, separation systems, and inspection labor are usually the expensive learning loops."],
      ["Failure chain", `${part.name} can fail through ${breakdown.failures.slice(0, 2).join(" or ").toLowerCase()}.`],
      ["Optimization", breakdown.lever],
    ],
  };
  const lens = programLenses[rocket.id] || fallback;
  els.caseTitle.textContent = lens.title;
  els.caseBadge.textContent = lens.badge;
  els.caseGrid.innerHTML = "";
  lens.cards.forEach(([label, copy]) => {
    const div = document.createElement("div");
    div.className = "case-chip";
    div.innerHTML = `<strong>${label}</strong><span>${copy}</span>`;
    els.caseGrid.appendChild(div);
  });
  if (rocket.sourceUrl) {
    const source = document.createElement("a");
    source.className = "case-chip source-chip";
    source.href = rocket.sourceUrl;
    source.target = "_blank";
    source.rel = "noreferrer";
    source.innerHTML = `<strong>Research source</strong><span>${rocket.operator || rocket.country || "Reference"} · ${rocket.status || rocket.era || "vehicle dossier"}</span>`;
    els.caseGrid.appendChild(source);
  }
}

function renderRecoveryCard() {
  if (!els.recoveryCard || !els.recoveryDropTime || !els.recoveryCopy) return;
  const profile = currentRocket().recoveryProfile;
  els.recoveryCard.hidden = !profile;
  if (!profile) return;
  els.recoveryDropTime.textContent = `${formatMissionTime(profile.averageDropS)} avg`;
  els.recoveryCopy.textContent = `${profile.label}: stage-sep to landing. Liftoff-to-landing averages ${formatMissionTime(profile.liftoffToLandingS)}. ${profile.basis}`;
}

function effectIntensities(sim = simSnapshot()) {
  const ignition = state.launchStatus === "countdown"
    ? clamp((state.launchClock - 2.15) / 1.55, 0, 1)
    : state.launchStatus === "running"
      ? clamp(1 - sim.t / 12, 0, 1)
      : 0;
  const maxQ = clamp(sim.q / 82, 0, 1);
  const staging = Math.max(
    0,
    1 - Math.min(Math.abs(sim.t - 70), Math.abs(sim.t - 118), Math.abs(sim.t - 138)) / 10,
  );
  const heating = clamp((sim.q / 92) * Math.min(1.2, sim.velocity / 2500), 0, 1);
  return { ignition, maxQ, staging, heating };
}

function updateEffectCell(el, intensity, copy) {
  el.style.setProperty("--intensity", intensity.toFixed(2));
  el.classList.toggle("active", intensity > 0.18);
  el.querySelector("span").textContent = copy;
}

function updateEffectReel() {
  const sim = simSnapshot();
  const fx = effectIntensities(sim);
  updateEffectCell(els.effectIgnition, fx.ignition, state.launchStatus === "countdown" ? "Chambers ramp" : `${Math.round(fx.ignition * 100)}% plume`);
  updateEffectCell(els.effectMaxQ, fx.maxQ, `${sim.q.toFixed(1)} kPa air load`);
  updateEffectCell(els.effectStaging, fx.staging, fx.staging > 0.18 ? "Separation impulse" : "Await stage event");
  updateEffectCell(els.effectHeating, fx.heating, thermalPart(currentPart()) ? "TPS stress visible" : "Surface heating");
}

function renderLessons() {
  els.lessonSteps.innerHTML = "";
  lessonTrack.forEach((lesson, index) => {
    const button = document.createElement("button");
    const mastered = state.mastery[lesson.id] === true;
    button.className = `lesson-step ${index === state.lessonIndex ? "active" : ""} ${mastered ? "mastered" : ""}`;
    button.innerHTML = `<span>${mastered ? "✓" : index + 1}</span><strong>${lesson.title}</strong><em>${lesson.action}</em>`;
    button.addEventListener("click", () => setLesson(index));
    els.lessonSteps.appendChild(button);
  });
}

function renderPrimer(metrics = physicsMetrics()) {
  const lesson = lessonTrack[state.lessonIndex];
  const peak = estimateMaxQ(metrics);
  const limit = structuralLimitKpa();
  const primerByLesson = {
    anatomy: ["Start with mass", `Launch mass is dry hardware + propellant + payload. Current m0 is ${Math.round(metrics.wetMass)} t.`],
    forces: ["First question: can it lift?", `T/W is ${metrics.twr.toFixed(2)}. Above 1 clears the pad; higher gives more early acceleration.`],
    staging: ["Delta-v comes from mass ratio", `m0 / mf is ${metrics.massRatio.toFixed(2)}. Better staging improves this ratio without magically adding thrust.`],
    guidance: ["Pointing is part of physics", `Wind plus guidance error is ${Math.round((state.windFactor + state.guidanceError) * 100)}%. Enough error can waste a good rocket.`],
    "max-q": ["Air load has a peak", `Peak q is ${peak.q.toFixed(1)} kPa against a ${limit.toFixed(0)} kPa structure limit.`],
    mission: ["Mission sets the target", `${currentMission().label} needs ${formatVelocity(currentMission().targetDeltaVMps)}. Current margin is ${formatDeltaV(metrics.deltaVMargin)}.`],
    momentum: ["Impulse changes momentum", `Thrust over time gives impulse. Current kinetic energy is ${formatEnergy(kineticEnergyJ(simSnapshot()))}.`],
    orbit: ["Orbit is sideways falling", `The target is ${formatVelocity(currentMission().targetDeltaVMps)} mostly sideways speed, not just height.`],
    spacetime: ["Relativity is small but real", `At launch speeds the clock effect is tiny, but navigation still depends on precise timing.`],
  };
  const [title, copy] = primerByLesson[lesson.id] || primerByLesson.anatomy;
  els.primerTitle.textContent = title;
  els.primerCopy.textContent = copy;
}

function renderGraphCaption(metrics = physicsMetrics()) {
  const peak = estimateMaxQ(metrics);
  const insight = graphInsight(metrics);
  const phase = launchSyncLabel();
  els.graphCaption.textContent = `${phase}: ${insight.kicker}. Peak air load is ${peak.q.toFixed(1)} kPa; delta-v margin is ${metrics.deltaVMargin >= 0 ? "+" : ""}${formatDeltaV(metrics.deltaVMargin)}.`;
}

function currentDeepDive() {
  const lesson = lessonTrack[state.lessonIndex];
  return lessonDeepDive[lesson.id] || lessonDeepDive.anatomy;
}

function masteryCount() {
  return lessonTrack.filter((lesson) => state.mastery[lesson.id]).length;
}

function renderConceptLab() {
  const lesson = lessonTrack[state.lessonIndex];
  const deep = currentDeepDive();
  const mastered = state.mastery[lesson.id] === true;
  els.conceptMastery.textContent = `${masteryCount()} / ${lessonTrack.length} mastered`;
  els.conceptAnchor.textContent = deep.anchor;
  els.conceptAnchorCopy.textContent = deep.anchorCopy;
  els.conceptEquation.textContent = deep.equation;
  els.conceptEquationCopy.textContent = deep.equationCopy;
  els.conceptTry.textContent = deep.tryTitle;
  els.conceptTryCopy.textContent = deep.tryCopy;
  els.conceptMisconception.textContent = deep.misconception;
  els.conceptMisconceptionCopy.textContent = deep.misconceptionCopy;
  els.masteryQuestion.textContent = deep.question;
  els.masteryFeedback.textContent = mastered ? deep.feedback : "Pick an answer to make the lesson stick.";
  els.masteryFeedback.dataset.state = mastered ? "success" : "idle";
  els.masteryChoices.innerHTML = "";
  deep.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    const answered = state.mastery[lesson.id] !== undefined;
    const correct = index === deep.answer;
    button.className = `mastery-choice ${answered && correct ? "correct" : ""} ${answered && !correct && state.mastery[lesson.id] === index ? "wrong" : ""}`;
    button.type = "button";
    button.textContent = choice;
    button.addEventListener("click", () => answerMastery(index));
    els.masteryChoices.appendChild(button);
  });
}

function renderCompareLab() {
  if (!els.compareGrid) return;
  const current = currentRocket();
  const sameFamily = rockets
    .filter((rocket) => rocket.id !== current.id)
    .filter((rocket) => {
      const a = `${current.family} ${current.mission}`.toLowerCase();
      const b = `${rocket.family} ${rocket.mission}`.toLowerCase();
      return ["heavy", "crew", "small", "reusable", "moon", "medium", "commercial", "historic"].some((term) => a.includes(term) && b.includes(term));
    });
  const picks = [current, ...sameFamily, rockets.find((rocket) => rocket.id === "falcon-9"), rockets.find((rocket) => rocket.id === "starship"), rockets.find((rocket) => rocket.id === "saturn-v")]
    .filter(Boolean)
    .filter((rocket, index, list) => list.findIndex((item) => item.id === rocket.id) === index)
    .slice(0, 4);
  els.compareGrid.innerHTML = picks.map((rocket) => {
    const wet = rocket.dryMassT + rocket.propellantT + rocket.defaultPayloadT;
    const ratio = wet / Math.max(1, rocket.dryMassT + rocket.defaultPayloadT);
    const dv = rocket.ispS * 9.80665 * Math.log(Math.max(1.01, ratio)) * (rocket.stageGain || 1);
    const twr = rocket.thrustMN / Math.max(0.1, wet * 9.80665 / 1000);
    return `
      <button data-compare-rocket="${rocket.id}">
        <strong>${rocket.name}</strong>
        <span>${rocket.operator || rocket.country || rocket.family} · ${rocket.status || rocket.era || "reference"}</span>
        <span>Δv ${formatDeltaV(dv)} · m0 ${Math.round(wet)} t · payload ${rocket.maxPayloadT} t</span>
        <em>${compact(rocket.lessonFocus || rocket.summary || `T/W ${twr.toFixed(2)}`, 120)}</em>
      </button>
    `;
  }).join("");
  els.compareGrid.querySelectorAll("[data-compare-rocket]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = rockets.findIndex((rocket) => rocket.id === button.dataset.compareRocket);
      if (index >= 0) selectRocket(index);
    });
  });
}

function answerMastery(index) {
  const lesson = lessonTrack[state.lessonIndex];
  const deep = currentDeepDive();
  const correct = index === deep.answer;
  state.mastery[lesson.id] = correct ? true : index;
  els.masteryFeedback.textContent = correct
    ? deep.feedback
    : `Not quite. Look at "${deep.equation}" and try again: ${deep.equationCopy}`;
  els.masteryFeedback.dataset.state = correct ? "success" : "danger";
  if (correct) {
    guide(`Mastered ${lesson.title}: ${deep.feedback}`, "Tutor");
  } else {
    guide(`Try again: ${deep.equationCopy}`, "Tutor");
  }
  renderConceptLab();
  renderLessons();
}

function applyConceptExperiment() {
  const lesson = lessonTrack[state.lessonIndex];
  const rocket = currentRocket();
  resetFlightState();
  if (lesson.id === "anatomy") {
    state.payloadT = Math.min(Number(els.payloadSlider.max), rocket.maxPayloadT * 1.08);
    state.fuelPercent = 88;
    state.controlFocus = "payload";
  } else if (lesson.id === "forces") {
    state.payloadT = Math.max(0, rocket.defaultPayloadT * 0.45);
    state.fuelPercent = 62;
    state.controlFocus = "fuel";
  } else if (lesson.id === "staging") {
    state.fuelPercent = 58;
    state.payloadT = rocket.defaultPayloadT;
    state.controlFocus = "fuel";
  } else if (lesson.id === "guidance") {
    state.windFactor = 0.82;
    state.guidanceError = 0.36;
    state.controlFocus = "guidance";
  } else if (lesson.id === "max-q") {
    state.missionMode = "maxq";
    state.dragFactor = 1.55;
    state.windFactor = 0.72;
    state.guidanceError = 0.24;
    state.controlFocus = "drag";
  } else if (lesson.id === "mission") {
    state.missionMode = "escape";
    state.payloadT = Math.max(0, rocket.defaultPayloadT * 0.52);
    state.fuelPercent = 100;
    state.controlFocus = "payload";
  } else if (lesson.id === "momentum") {
    state.missionMode = "orbit";
    state.engineHealth = 72;
    state.fuelPercent = 86;
    state.payloadT = rocket.defaultPayloadT;
    state.controlFocus = "engine";
  } else if (lesson.id === "orbit") {
    state.missionMode = "orbit";
    state.fuelPercent = 100;
    state.payloadT = Math.max(0, rocket.defaultPayloadT * 0.72);
    state.dragFactor = 0.9;
    state.windFactor = 0.12;
    state.guidanceError = 0.05;
    state.controlFocus = "fuel";
  } else if (lesson.id === "spacetime") {
    state.missionMode = "escape";
    state.payloadT = Math.max(0, rocket.defaultPayloadT * 0.35);
    state.fuelPercent = 100;
    state.engineHealth = 106;
    state.controlFocus = "payload";
  }
  state.controlPulse = 1;
  state.showLabels = true;
  document.querySelector("#labelToggle").classList.add("active");
  syncExperimentControls();
  renderUI();
  const deep = currentDeepDive();
  guide(`Mini experiment loaded: ${deep.tryTitle}`, "Tutor");
}

function renderUI() {
  const rocket = currentRocket();
  const part = currentPart();
  const lesson = lessonTrack[state.lessonIndex];
  document.body.dataset.workspace = state.workspaceMode;
  document.body.dataset.controlFocus = state.controlFocus || "none";
  if (els.blueprintWorkspace) {
    els.blueprintWorkspace.textContent = state.workspaceMode === "blueprint" ? "Launch view" : "Blueprint";
    els.blueprintWorkspace.classList.toggle("active", state.workspaceMode === "blueprint");
  }
  els.missionLabel.textContent = `${rocket.name} · ${rocket.mission}`;
  els.partLabel.textContent = part.name;
  els.lessonLabel.textContent = `${state.lessonIndex + 1} / ${lessonTrack.length} · ${lesson.title}`;
  els.lessonTitle.textContent = lesson.title;
  els.lessonTime.textContent = lesson.time;
  els.lessonBody.textContent = lesson.body;
  document.querySelector("#flightLab")?.setAttribute("data-workspace", state.flightWorkspace);
  document.querySelectorAll("[data-flight-workspace]").forEach((button) => {
    button.classList.toggle("active", button.dataset.flightWorkspace === state.flightWorkspace);
  });
  els.selectedPartName.textContent = part.name;
  els.selectedPartType.textContent = part.type;
  els.selectedPartDescription.textContent = compact(part.description, 106);
  els.equationLabel.textContent = part.equation[0];
  els.equationText.textContent = part.equation[1];
  els.equationExplanation.textContent = compact(part.equation[2], 104);
  els.whyText.textContent = lesson.why;
  els.scaleReadout.textContent = `${rocket.name}: ${Math.round(rocket.heightM / 1.8)} people tall · ${rocket.thrustMN.toFixed(rocket.thrustMN < 1 ? 2 : 1)} MN thrust`;
  els.scaleStrip.style.display = state.scale ? "" : "none";
  els.statGrid.innerHTML = "";
  const stats = { Height: `${rocket.heightM} m`, Payload: rocket.payload, ...part.stats };
  Object.entries(stats).slice(0, 6).forEach(([label, value]) => {
    const div = document.createElement("div");
    div.className = "stat";
    div.dataset.statAction = label.toLowerCase();
    div.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    div.addEventListener("click", () => explainStat(label.toLowerCase()));
    els.statGrid.appendChild(div);
  });
  renderRecoveryCard();
  renderLessons();
  renderConceptLab();
  renderCompareLab();
  renderMissionTabs();
  renderMissionTip();
  renderBuilderControls();
  renderBlueprintLab();
  renderChallenge();
  renderLabCoach();
  renderDeltaStrip();
  renderTrajectoryPlanner();
  renderSessionLoop();
  renderVectorPlan();
  renderRehearsalDrill();
  renderMissionCopilot();
  renderPrimer();
  renderGraphCaption();
  renderPartLabels();
  const labelDensityToggle = document.querySelector("#labelDensityToggle");
  if (labelDensityToggle) {
    labelDensityToggle.textContent = state.labelDensity === "all" ? "All" : "Focus";
    labelDensityToggle.classList.toggle("active", state.labelDensity === "all");
  }
  const cameraModeToggle = document.querySelector("#cameraModeToggle");
  if (cameraModeToggle) {
    cameraModeToggle.textContent = cameraModeLabel();
    cameraModeToggle.classList.toggle("active", state.cameraMode !== "visible");
  }
  renderHardwareBreakdown();
  renderCaseStudy();
  updateEffectReel();
  renderEquationGrid();
  updateSimReadout();
  drawGraph();
}

function renderEquationGrid() {
  const metrics = physicsMetrics();
  const sim = simSnapshot();
  const mission = currentMission();
  const rows = [
    ["T / W now", sim.twrNow.toFixed(2)],
    ["m0", `${Math.round(metrics.wetMass)} t`],
    ["mf", `${Math.round(metrics.dryPlusPayload)} t`],
    ["m0 / mf", metrics.massRatio.toFixed(2)],
    ["Δv staged", formatDeltaV(metrics.effectiveDeltaV)],
    ["Goal", formatVelocity(mission.targetDeltaVMps)],
    ["Δv margin", `${metrics.deltaVMargin >= 0 ? "+" : ""}${formatDeltaV(metrics.deltaVMargin)}`],
    ["KE motion", formatEnergy(kineticEnergyJ(sim))],
    ["q air load", `${sim.q.toFixed(1)} kPa`],
    ["Risk", `${Math.round(flightRisk(sim) * 100)}%`],
  ];
  els.equationGrid.innerHTML = "";
  rows.forEach(([label, value]) => {
    const div = document.createElement("div");
    div.className = "equation-chip";
    div.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    els.equationGrid.appendChild(div);
  });
  const tex = [
    "F_{net}=T-mg-\\frac{1}{2}\\rho v^{2}C_DA",
    "\\Delta v=I_{sp}g_0\\ln\\left(\\frac{m_0}{m_f}\\right)",
    "KE=\\frac{1}{2}mv^{2}",
    "m_0=m_{dry}+m_{prop}+m_{payload}",
  ];
  els.latexDisplay.innerHTML = tex.map((line) => `<span>${renderLatexLike(line)}</span>`).join("");
}

function renderTrajectoryPlanner() {
  const target = currentTrajectory();
  const sim = simSnapshot();
  const windowPenalty = Math.abs(state.windowOffsetDays) / Math.max(1, target.windowDays || 1);
  const correctionQuality = state.correctionPercent / 100;
  const landingRisk = state.landingSite === "safe" ? 0.18 : state.landingSite === "science" ? 0.42 : 0.68;
  const commDelay = target.commDelay;
  const transferRisk = clamp(windowPenalty * 0.55 + Math.abs(correctionQuality - 0.62) * 0.5 + landingRisk * 0.35, 0, 1);
  const progress = state.launchStatus === "running"
    ? clamp(sim.t / 180, 0.04, 0.94)
    : state.launchStatus === "success"
      ? 1
      : clamp(0.12 + correctionQuality * 0.18 - windowPenalty * 0.08, 0.04, 0.42);
  const correctionError = Math.abs(correctionQuality - 0.62);
  const windowDvCost = Math.round(windowPenalty * Number.parseFloat(target.deltaV) * 1000 * 0.42);
  const correctionDvCost = Math.round(correctionError * 700);
  const landingRiskPct = Math.round(landingRisk * 100);
  const commAutonomy = state.destination === "moon" ? "pilot can talk in near-real-time" : state.destination === "mars" ? "agent must handle minutes of silence" : "spacecraft needs long-delay autonomy";
  els.trajectoryStatus.textContent = target.label;
  els.trajectoryTransit.textContent = target.transit;
  els.trajectoryDv.textContent = target.deltaV;
  els.trajectoryWindow.textContent = target.window;
  els.trajectoryCopy.textContent = `Tune the transfer, answer the check, then plan the burn. ${target.label}: window ${state.windowOffsetDays > 0 ? "+" : ""}${state.windowOffsetDays} d · correction ${state.correctionPercent}% · ${landingSiteLabel()}.`;
  els.solarMap.dataset.destination = state.destination;
  els.solarMap.style.setProperty("--craft-x", `${trajectoryCraftPosition(progress).x}px`);
  els.solarMap.style.setProperty("--craft-y", `${trajectoryCraftPosition(progress).y}px`);
  els.solarMap.style.setProperty("--signal-length", `${Math.round(42 + progress * 110)}px`);
  els.solarMap.style.setProperty("--signal-angle", `${state.destination === "mars" ? -34 : state.destination === "jupiter" ? 24 : -18}deg`);
  els.windowSlider.value = String(state.windowOffsetDays);
  els.windowValue.textContent = `${state.windowOffsetDays > 0 ? "+" : ""}${state.windowOffsetDays} d`;
  els.correctionSlider.value = String(state.correctionPercent);
  els.correctionValue.textContent = `${state.correctionPercent}%`;
  els.landingSite.value = state.landingSite;
  els.trajectoryDeepGrid.innerHTML = [
    ["W", "Window", windowPenalty < 0.18 ? "Aligned" : `+${windowDvCost} m/s`, `Timing controls where the target will be when you arrive. A bad window burns fuel later.`, windowPenalty > 0.35 ? "warning" : "nominal"],
    ["G", "Gravity", state.destination === "jupiter" ? "Assist" : "Curve", target.slingshot, state.destination === "jupiter" ? "warning" : "nominal"],
    ["S", "Signal", commDelay, `Commands are not instant; ${commAutonomy}.`, "nominal"],
    ["L", "Landing", `${landingRiskPct}% risk`, target.landing, landingRisk > 0.5 ? "warning" : "nominal"],
  ].map(([icon, label, value, copy, stateKey]) => `
    <div data-state="${stateKey}">
      <b>${icon}</b>
      <span>${label}</span>
      <strong>${value}</strong>
      <em>${copy}</em>
    </div>
  `).join("");
  renderTrajectoryPhaseRail(progress);
  renderTrajectoryProblemGrid({ windowPenalty, windowDvCost, correctionQuality, correctionDvCost, landingRisk, transferRisk });
  renderTrajectoryQuiz();
  renderTrajectoryRibbon(progress, transferRisk);
  document.querySelectorAll("[data-destination]").forEach((button) => {
    button.classList.toggle("active", button.dataset.destination === state.destination);
  });
}

function landingSiteLabel() {
  if (state.landingSite === "science") return "Science target";
  if (state.landingSite === "steep") return "Steep entry";
  return "Safe ellipse";
}

function trajectoryCraftPosition(progress) {
  if (state.destination === "mars") {
    return { x: 54 - 158 * progress, y: -8 - 54 * Math.sin(progress * Math.PI) - 48 * progress };
  }
  if (state.destination === "jupiter") {
    return { x: 54 + 86 * progress, y: -8 + 88 * progress - 44 * Math.sin(progress * Math.PI) };
  }
  return { x: 52 + 24 * progress, y: -8 - 24 * Math.sin(progress * Math.PI) - 16 * progress };
}

function trajectoryPhaseData() {
  const target = currentTrajectory();
  return [
    ["window", "1", "Window", "Aim at the future position."],
    ["parking", "2", "Orbit", "Clean starting orbit."],
    ["injection", "3", "Burn", `${target.deltaV} transfer.`],
    ["coast", "4", "Coast", `${target.commDelay} signal.`],
    ["arrival", "5", "Arrive", `${landingSiteLabel()}.`],
  ];
}

function renderTrajectoryPhaseRail(progress) {
  if (!els.trajectoryPhaseRail) return;
  const activeIndex = Math.min(4, Math.max(0, Math.floor(progress * 5)));
  els.trajectoryPhaseRail.innerHTML = trajectoryPhaseData().map(([id, step, title, copy], index) => `
    <button class="${index === activeIndex ? "active" : ""}" data-trajectory-topic="${id}" type="button">
      <span>${step}</span>
      <strong>${title}</strong>
      <em>${copy}</em>
    </button>
  `).join("");
}

function renderTrajectoryProblemGrid(plan) {
  if (!els.trajectoryProblemGrid) return;
  const target = currentTrajectory();
  const moonMarsJupiter = state.destination === "moon" ? "free-return" : state.destination === "mars" ? "Hohmann phase angle" : "gravity assist timing";
  const cards = [
    ["window", "Window", plan.windowPenalty > 0.35 ? "danger" : plan.windowPenalty > 0.12 ? "warning" : "nominal", `${plan.windowDvCost} m/s`, "Timing error spends correction fuel."],
    ["correction", "Trim", plan.correctionDvCost > 180 ? "warning" : "nominal", `${plan.correctionDvCost} m/s`, "Small early fixes beat late rescue burns."],
    ["slingshot", "Gravity", state.destination === "jupiter" ? "warning" : "nominal", moonMarsJupiter, target.slingshot],
    ["landing", "Landing", plan.landingRisk > 0.5 ? "danger" : "nominal", landingSiteLabel(), "Arrival is braking plus heat plus targeting."],
  ];
  els.trajectoryProblemGrid.innerHTML = cards.map(([topic, title, stateKey, value, copy]) => `
    <button data-state="${stateKey}" data-trajectory-topic="${topic}" type="button">
      <span>${title}</span>
      <strong>${value}</strong>
      <em>${copy}</em>
    </button>
  `).join("");
}

function renderTrajectoryRibbon(progress = 0.02, risk = 0) {
  const sim = simSnapshot();
  const target = currentTrajectory();
  const phase = state.launchStatus === "countdown"
    ? "Ignition and hold-down"
    : state.launchStatus === "running"
      ? sim.t < 48 ? "Pitch program" : sim.t < 105 ? "Gravity turn" : "Insertion targeting"
      : state.launchStatus === "success"
        ? `${target.label} setup`
        : "Pad to orbit";
  els.trajectoryRibbonTitle.textContent = phase;
  els.trajectoryRibbonCopy.textContent = state.launchStatus === "running"
    ? `Tracking path: h ${sim.altitude.toFixed(0)} km, v ${formatVelocity(sim.velocity)}, destination ${target.label}.`
    : `Window ${state.windowOffsetDays > 0 ? "+" : ""}${state.windowOffsetDays} d · correction ${state.correctionPercent}% · risk ${Math.round(risk * 100)}%.`;
  els.trajectoryRibbon.style.setProperty("--progress", clamp(progress, 0.02, 0.98).toFixed(3));
}

function renderTrajectoryQuiz() {
  const target = currentTrajectory();
  const quiz = target.quiz;
  els.trajectoryQuizQuestion.textContent = quiz.question;
  els.trajectoryQuizKicker.textContent = `${target.label} check`;
  els.trajectoryQuizFeedback.textContent = state.trajectoryQuizAnswer === null
    ? "Pick an answer before planning the burn."
    : state.trajectoryQuizAnswer === quiz.answer
      ? quiz.feedback
      : "Not quite. Think about where the target will be when the spacecraft arrives, not where it is now.";
  els.trajectoryQuizFeedback.dataset.state = state.trajectoryQuizAnswer === quiz.answer ? "success" : state.trajectoryQuizAnswer === null ? "idle" : "danger";
  els.trajectoryQuizChoices.innerHTML = quiz.choices.map((choice, index) => {
    const answered = state.trajectoryQuizAnswer !== null;
    const klass = answered && index === quiz.answer ? "correct" : answered && index === state.trajectoryQuizAnswer ? "wrong" : "";
    return `<button class="${klass}" data-trajectory-answer="${index}" type="button">${choice}</button>`;
  }).join("");
}

function controlLabel(key) {
  return ({
    payload: "Payload",
    fuel: "Fuel load",
    drag: "Drag shape",
    wind: "Wind shear",
    guidance: "Guidance error",
    engine: "Engine health",
    structure: "Structure",
    heat: "Heat shield",
    staging: "Staging timing",
  })[key] || "Selected control";
}

function renderSessionLoop() {
  const metrics = physicsMetrics();
  const sim = simSnapshot();
  const peak = estimateMaxQ(metrics);
  let active = "observe";
  if (state.launchStatus === "running" || state.launchStatus === "countdown") active = "test";
  else if (state.controlFocus) active = "predict";
  else if (state.agentBusy) active = "explain";
  if (els.companionLoop) els.companionLoop.dataset.state = active;
  document.querySelectorAll("[data-session-step]").forEach((step) => {
    step.classList.toggle("active", step.dataset.sessionStep === active);
  });
  if (!els.companionReadout) return;
  const readouts = {
    observe: `${currentRocket().name}: T/W ${metrics.twr.toFixed(2)}, Δv margin ${formatDeltaV(metrics.deltaVMargin)}, Max-Q ${peak.q.toFixed(0)} kPa. I am watching the live state.`,
    predict: `Prediction mode: ${controlLabel(state.controlFocus || "payload")} changed. Guess which graph moves first, then press Launch test.`,
    test: `Test mode: ${launchSyncLabel(sim)} at ${state.launchStatus === "countdown" ? `T-${Math.max(0, Math.ceil(COUNTDOWN_SECONDS - state.launchClock))}` : `t+${sim.t.toFixed(0)}s`}, v ${formatVelocity(sim.velocity)}, h ${sim.altitude.toFixed(1)} km.`,
    explain: state.agentLastQuestion
      ? `Explain mode: last question was "${compact(state.agentLastQuestion, 96)}"`
      : `Explain mode: I will connect one visible number to one equation and ask one check question.`,
  };
  els.companionReadout.textContent = readouts[active];
}

function currentVectorPlan() {
  const metrics = physicsMetrics();
  const peak = estimateMaxQ(metrics);
  const limit = structuralLimitKpa();
  const stress = materialStressSummary(metrics);
  const mission = currentMission();
  if (metrics.twr < 1) {
    return {
      state: "danger",
      title: `Gravity is winning: T/W ${metrics.twr.toFixed(2)}`,
      equation: "T / W > 1",
      trap: "A beautiful rocket still fails if thrust cannot lift wet mass.",
      move: "Cut payload 10% and raise engine health to 100%.",
      voice: `First bottleneck: thrust-to-weight is ${metrics.twr.toFixed(2)}. Gravity is winning. Reduce payload or add engine thrust before touching trajectory.`,
      apply: () => {
        resetFlightState();
        state.payloadT = Math.max(0.2, state.payloadT * 0.9);
        state.engineHealth = 100;
        state.controlFocus = "engine";
      },
    };
  }
  if (metrics.deltaVMargin < 0) {
    return {
      state: "danger",
      title: `Orbit budget short: ${formatDeltaV(metrics.deltaVMargin)}`,
      equation: "Δv = Isp g0 ln(m0 / mf)",
      trap: "Extra payload shrinks the logarithm even when the rocket lifts off.",
      move: "Set fuel to 100%, trim payload 12%, and inspect mass ratio.",
      voice: `Delta-v is short by ${formatDeltaV(metrics.deltaVMargin)}. The next lesson is mass ratio: fuel up, reduce payload, or choose a better upper stage.`,
      apply: () => {
        resetFlightState();
        state.fuelPercent = 100;
        state.payloadT = Math.max(0.2, state.payloadT * 0.88);
        state.controlFocus = "payload";
      },
    };
  }
  if (peak.q > limit * 0.86 || flightRisk({ ...simSnapshot(), ...metrics, q: peak.q }) > 0.5) {
    return {
      state: peak.q > limit ? "danger" : "warning",
      title: `Air load is loud: ${peak.q.toFixed(0)} / ${limit.toFixed(0)} kPa`,
      equation: "q = 1/2 ρv²",
      trap: "More speed is not free while the rocket is still in dense air.",
      move: "Lower drag, wind, and guidance one notch, then rerun Max-Q.",
      voice: `Max-Q is the active lesson. Air load is ${peak.q.toFixed(0)} kilopascals against a ${limit.toFixed(0)} limit. Clean up drag, wind, or guidance.`,
      apply: () => {
        resetFlightState();
        state.dragFactor = Math.max(0.65, state.dragFactor - 0.15);
        state.windFactor = Math.max(0, state.windFactor - 0.12);
        state.guidanceError = Math.max(0, state.guidanceError - 0.08);
        state.controlFocus = "drag";
      },
    };
  }
  if (stress.margin < 1.25) {
    return {
      state: "warning",
      title: `Structure margin thin: ${stress.margin.toFixed(2)}x`,
      equation: "σ = F / A",
      trap: "Stiffness and strength are not decoration; they decide whether control errors bend the stack.",
      move: "Raise structure 10% and compare stress margin.",
      voice: `Structural margin is only ${stress.margin.toFixed(2)} times. Upgrade structure or reduce side loads before you trust the launch.`,
      apply: () => {
        resetFlightState();
        state.structurePercent = Math.min(120, state.structurePercent + 10);
        state.controlFocus = "structure";
      },
    };
  }
  return {
    state: "success",
    title: `${mission.shortLabel} is stable enough to stress-test`,
    equation: "one variable",
    trap: "Passing once does not prove understanding.",
    move: "Change one slider, predict the graph, then launch.",
    voice: `This setup is healthy. Nice. Now do science: change one variable, predict the graph, and let the rocket prove you right or wrong.`,
    apply: () => {
      resetFlightState();
      state.windFactor = clamp(state.windFactor + 0.12, 0, 1);
      state.controlFocus = "wind";
    },
  };
}

function renderVectorPlan() {
  if (!els.vectorPlan) return;
  const plan = currentVectorPlan();
  els.vectorPlan.dataset.state = plan.state;
  els.vectorPlanTitle.textContent = plan.title;
  els.vectorPlanEquation.textContent = plan.equation;
  els.vectorPlanTrap.textContent = plan.trap;
  els.vectorPlanMove.textContent = plan.move;
}

function applyVectorPlan() {
  const plan = currentVectorPlan();
  plan.apply?.();
  syncExperimentControls();
  renderUI();
  guide(`Applied Vector move: ${plan.move}`, "Vector");
}

function speakVectorPlan() {
  const plan = currentVectorPlan();
  state.voiceEnabled = true;
  updateVoiceUi();
  guide(`Voice brief queued: ${plan.title}`, "Vector");
  speakAgentReply(`${plan.voice} Next move: ${plan.move}`, { mode: "brief" });
}

function currentRehearsalDrill() {
  const metrics = physicsMetrics();
  const sim = simSnapshot();
  const peak = estimateMaxQ(metrics);
  const limit = structuralLimitKpa();
  const stress = materialStressSummary(metrics);
  const challenge = currentChallenge(metrics);
  const seed = state.rehearsalSeed % 4;
  const pick = (options) => options[Math.abs(state.rehearsalSeed) % options.length];

  if (metrics.twr < 1) {
    return pick([
      {
        id: "pad-check",
        state: "danger",
        title: "Pad check",
        question: `T/W is ${metrics.twr.toFixed(2)}. What fixes liftoff first?`,
        choices: ["Increase thrust or reduce wet mass", "Add more drag area", "Delay staging longer"],
        answer: 0,
        feedback: "Thrust must beat weight before any orbit math matters: T / W > 1.",
        hint: "Start with Newton's second law. If net force is not upward, the rocket stays on the pad.",
      },
      {
        id: "pad-force",
        state: "danger",
        title: "Net force",
        question: "Which equation decides whether the clamps can release?",
        choices: ["Fnet = T - mg", "KE = 1/2 mv2", "q = 1/2 rho v2"],
        answer: 0,
        feedback: "Before velocity or air load matters, the upward force must exceed weight.",
        hint: "Pick the equation with thrust and gravity in the same line.",
      },
      {
        id: "pad-mass",
        state: "danger",
        title: "Wet mass",
        question: "If engines stay fixed, what is the fastest way to raise T/W?",
        choices: ["Reduce payload or wet mass", "Increase wind", "Make staging later"],
        answer: 0,
        feedback: "Same thrust over less mass gives more acceleration and a higher T/W.",
        hint: "T/W has weight in the denominator. Less mass means less weight.",
      },
    ]);
  }

  if (metrics.deltaVMargin < 0) {
    return pick([
      {
        id: "orbit-budget",
        state: "danger",
        title: "Orbit budget",
        question: `Delta-v is short by ${formatDeltaV(metrics.deltaVMargin)}. Which move helps most?`,
        choices: ["Improve mass ratio or upper-stage efficiency", "Add wind shear", "Make the payload fairing wider"],
        answer: 0,
        feedback: "Delta-v follows Isp g0 ln(m0 / mf). Better mass ratio or Isp moves the whole mission.",
        hint: "Look for the logarithm: useful velocity comes from propellant fraction and exhaust speed.",
      },
      {
        id: "orbit-payload",
        state: "danger",
        title: "Payload tax",
        question: "Why does extra payload hurt orbit closure so much?",
        choices: ["It raises final mass", "It lowers Earth's gravity", "It reduces air density"],
        answer: 0,
        feedback: "Final mass sits inside the rocket equation, so payload directly shrinks the mass ratio.",
        hint: "Payload is still attached at orbit insertion.",
      },
    ]);
  }

  if (peak.q > limit * 0.86 || challenge.risk > 0.5) {
    return pick([
      {
        id: "max-q",
        state: peak.q > limit ? "danger" : "warning",
        title: "Max-Q callout",
        question: `Peak air load is ${peak.q.toFixed(0)} kPa vs ${limit.toFixed(0)} kPa limit. What should move down?`,
        choices: ["Drag, wind, or guidance error", "Payload only", "Upper-stage Isp only"],
        answer: 0,
        feedback: "Air load is q = 1/2 rho v^2. Shape and control errors decide whether the structure survives.",
        hint: "This is an atmosphere problem. Watch the q curve before changing orbital fuel.",
      },
      {
        id: "max-q-curve",
        state: peak.q > limit ? "danger" : "warning",
        title: "Airload curve",
        question: "Why does Max-Q peak instead of only increasing?",
        choices: ["Velocity rises while density falls", "Mass becomes infinite", "Gravity disappears"],
        answer: 0,
        feedback: "The peak appears where rising speed and falling air density cross over.",
        hint: "Read q = 1/2 rho v2: one term goes down while the other goes up.",
      },
    ]);
  }

  if (stress.margin < 1.25) {
    return pick([
      {
        id: "materials",
        state: "warning",
        title: "Material margin",
        question: `Stress margin is ${stress.margin.toFixed(2)}x. What is the cleanest repair?`,
        choices: ["Upgrade structure or reduce side loads", "Add payload mass", "Keep wind high"],
        answer: 0,
        feedback: "The skin needs enough strength and stiffness for axial load plus bending from wind.",
        hint: "Treat the rocket like a loaded beam. Bending grows fast with wind and guidance error.",
      },
      {
        id: "youngs-modulus",
        state: "warning",
        title: "Stiffness check",
        question: `Young's modulus is ${stress.skin.youngGpa} GPa. What does stiffness mainly resist?`,
        choices: ["Strain and bending", "Orbital timing", "Vacuum pressure only"],
        answer: 0,
        feedback: "Higher stiffness means less strain for the same stress, which helps guidance and structure.",
        hint: "Young's modulus links stress to strain.",
      },
    ]);
  }

  const stableDrills = [
    {
      id: "healthy-next",
      state: "ready",
      title: "Clean run",
      question: `This design is passing. What is the best next learning move?`,
      choices: ["Stress one variable and predict the graph", "Change five sliders at once", "Ignore the failure report"],
      answer: 0,
      feedback: "One-variable tests reveal cause and effect. That is how the lab becomes physics, not button pushing.",
      hint: "A good experiment changes one thing, predicts one graph, then checks the result.",
    },
    {
      id: "staging",
      state: "ready",
      title: "Staging intuition",
      question: `At ${launchSyncLabel(sim)}, why do stages separate?`,
      choices: ["Drop dead mass after propellant is spent", "Make the rocket heavier", "Increase atmospheric drag"],
      answer: 0,
      feedback: "Spent tanks become dead mass. Staging improves m0 / mf for the remaining burn.",
      hint: "The rocket equation rewards dropping hardware that no longer helps.",
    },
    {
      id: "trajectory",
      state: "ready",
      title: "Trajectory timing",
      question: `For ${currentTrajectory().label}, what makes the burn window matter?`,
      choices: ["The destination moves during transit", "The rocket can teleport later", "Air drag is higher in deep space"],
      answer: 0,
      feedback: "Transfers aim at where the target will be, not where it is at launch.",
      hint: "Spaceflight is geometry plus timing. The target is moving while you coast.",
    },
    {
      id: "payload",
      state: "ready",
      title: "Payload tradeoff",
      question: `Payload is ${state.payloadT.toFixed(1)} t. What usually drops first when payload rises?`,
      choices: ["Delta-v margin", "Gravity", "Earth's radius"],
      answer: 0,
      feedback: "Payload raises final mass, so the logarithm in the rocket equation shrinks.",
      hint: "The payload rides all the way, so it is expensive mass.",
    },
  ];

  return stableDrills[seed] || stableDrills[0];
}

function renderRehearsalDrill() {
  if (!els.rehearsalCard || !els.rehearsalChoices) return;
  const drill = currentRehearsalDrill();
  const answered = state.rehearsalAnswer !== null;
  const correct = answered && state.rehearsalAnswer === drill.answer;
  els.rehearsalCard.dataset.state = correct ? "success" : answered ? "danger" : drill.state;
  els.rehearsalTitle.textContent = drill.title;
  els.rehearsalQuestion.textContent = drill.question;
  els.rehearsalFeedback.textContent = !answered
    ? "Pick a move, then ask Vector to explain the physics."
    : correct
      ? `Correct. ${drill.feedback}`
      : `Not yet. ${drill.hint}`;
  els.rehearsalFeedback.dataset.state = correct ? "success" : answered ? "danger" : "idle";
  els.rehearsalChoices.innerHTML = drill.choices.map((choice, index) => {
    const klass = answered && index === drill.answer
      ? "correct"
      : answered && index === state.rehearsalAnswer
        ? "wrong"
        : "";
    return `<button class="${klass}" data-rehearsal-answer="${index}" type="button">${choice}</button>`;
  }).join("");
  els.rehearsalChoices.querySelectorAll("[data-rehearsal-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      state.rehearsalAnswer = Number(button.dataset.rehearsalAnswer);
      const selected = drill.choices[state.rehearsalAnswer];
      const isCorrect = state.rehearsalAnswer === drill.answer;
      renderRehearsalDrill();
      guide(isCorrect ? `Correct: ${selected}. ${drill.feedback}` : `Try again: ${selected}. ${drill.hint}`, "Vector");
    });
  });
}

function askRehearsalCoach() {
  const drill = currentRehearsalDrill();
  const answerText = state.rehearsalAnswer === null ? "not answered yet" : drill.choices[state.rehearsalAnswer];
  sendAgentPrompt([
    "Coach my answer to this Vector rehearsal drill.",
    `Question: ${drill.question}`,
    `Choices: ${drill.choices.join(" | ")}`,
    `My answer: ${answerText}`,
    `Correct answer: ${drill.choices[drill.answer]}`,
    `Live context: ${voiceContextLine("rehearsal")}`,
    "Keep it under 80 words. If I am wrong, teach one equation and one control to try. If I am right, give the next harder check.",
  ].join("\n"));
}

function runCompanionLoop() {
  const metrics = physicsMetrics();
  const sim = simSnapshot();
  const peak = estimateMaxQ(metrics);
  setPanelMode("agent");
  sendAgentPrompt([
    "Run the Rocket Agent Lab tutoring loop for the exact current screen.",
    `Observe: ${currentRocket().name}, ${currentPart().name}, mission ${currentMission().label}, ${launchSyncLabel(sim)}.`,
    `Predict from numbers: T/W ${metrics.twr.toFixed(2)}, delta-v margin ${formatDeltaV(metrics.deltaVMargin)}, Max-Q ${peak.q.toFixed(0)} kPa, payload ${state.payloadT.toFixed(1)} t.`,
    "Test: tell me the next smallest control change to try.",
    "Explain: ask one multiple-choice question with three short options, but do not reveal the answer until I reply.",
  ].join("\n"));
}

function setFlightWorkspace(workspace) {
  const next = ["build", "engines", "materials", "flight", "failure"].includes(workspace) ? workspace : "flight";
  if (state.flightWorkspace !== next) state.workspaceInfoDetail = "";
  state.flightWorkspace = next;
  document.querySelector("#flightLab")?.setAttribute("data-workspace", next);
  document.querySelectorAll("[data-flight-workspace]").forEach((button) => {
    button.classList.toggle("active", button.dataset.flightWorkspace === next);
  });
  if (next === "build") {
    guide("Build view: change stages, boosters, engines, tank width, upper fuel, and reuse. The diagnosis shows the first likely failure.", "Builder");
  } else if (next === "engines") {
    guide("Engine lab: choose an engine family and count, then watch T/W, dry mass, and delta-v move.", "Engine lab");
  } else if (next === "materials") {
    guide("Materials lab: compare stiffness, stress margin, heat shield, and tank mass before launch.", "Materials");
  } else if (next === "failure") {
    guide("Review view: inspect warnings, graph cause, and failure report. Change one control, then rerun.", "Flight");
  }
  renderWorkspaceGuide();
}

function setPanelMode(mode) {
  const nextMode = ["flight", "blueprint", "learn", "trajectory", "agent"].includes(mode) ? mode : "flight";
  if (nextMode !== "blueprint" && state.workspaceMode !== "blueprint") state.workspaceMode = "launch";
  const panel = document.querySelector(".lesson-panel");
  panel?.setAttribute("data-mode", nextMode);
  if (panel) panel.scrollTop = 0;
  if (nextMode !== "blueprint" && panel && window.matchMedia("(max-width: 760px)").matches) {
    requestAnimationFrame(() => {
      panel.scrollIntoView({ block: "start" });
      window.scrollBy({ top: -78, left: 0 });
    });
  }
  document.querySelectorAll("[data-panel-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.panelMode === nextMode);
  });
}

function selectDestination(destination) {
  if (!trajectoryTargets[destination]) return;
  state.destination = destination;
  state.trajectoryQuizAnswer = null;
  renderTrajectoryPlanner();
  guide(`${trajectoryTargets[destination].label} selected. Press Plan burn to load the transfer setup.`, "Trajectory");
}

function planTrajectory() {
  const target = currentTrajectory();
  const rocket = currentRocket();
  resetFlightState();
  state.missionMode = "escape";
  state.fuelPercent = 100;
  state.payloadT = Math.max(0.5, rocket.defaultPayloadT * target.payloadScale);
  state.dragFactor = Math.min(state.dragFactor, 0.9);
  state.windFactor = Math.min(state.windFactor, 0.16);
  state.guidanceError = Math.min(state.guidanceError, 0.08);
  state.stagingTiming = Math.round(state.windowOffsetDays / Math.max(1, target.windowDays || 1) * 4);
  state.controlFocus = "payload";
  state.controlPulse = 1;
  state.showLabels = true;
  document.querySelector("#labelToggle")?.classList.add("active");
  syncExperimentControls();
  renderUI();
  guide(`Planned ${target.label}: window ${state.windowOffsetDays > 0 ? "+" : ""}${state.windowOffsetDays} d, correction ${state.correctionPercent}%, ${landingSiteLabel().toLowerCase()}, and escape-energy target loaded.`, "Trajectory");
}

function guide(text, role = "Tutor") {
  const message = document.createElement("div");
  message.className = `message role-${role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const limit = /agent/i.test(role) ? 420 : /you/i.test(role) ? 180 : 150;
  message.innerHTML = `<strong>${role}</strong> ${compact(text, limit)}`;
  els.agentLog.prepend(message);
  while (els.agentLog.children.length > 12) {
    els.agentLog.removeChild(els.agentLog.lastChild);
  }
  renderSessionLoop();
}

function agentContextText() {
  const rocket = currentRocket();
  const part = currentPart();
  const lesson = lessonTrack[state.lessonIndex];
  const mission = currentMission();
  const trajectory = currentTrajectory();
  const sim = simSnapshot();
  const breakdown = estimatePartBreakdown(part, rocket);
  const challenge = currentChallenge();
  const passed = challenge.checks.filter((check) => check.pass).length;
  const deep = currentDeepDive();
  const rehearsal = currentRehearsalDrill();
  return [
    `Rocket: ${rocket.name} (${rocket.family}, ${rocket.heightM} m, ${rocket.thrustMN.toFixed(rocket.thrustMN < 1 ? 2 : 1)} MN thrust, ${rocket.payload})`,
    `Vehicle dossier: operator ${rocket.operator || "unknown"}; country/region ${rocket.country || "unknown"}; status ${rocket.status || rocket.era || "unknown"}; source ${rocket.sourceUrl || "local classroom estimate"}; lesson focus ${rocket.lessonFocus || rocket.summary || "compare the architecture"}`,
    `Mission profile: ${mission.label} aiming for ${formatVelocity(mission.targetDeltaVMps)} and ${mission.targetAltitudeKm} km target altitude`,
    `Trajectory planner: ${trajectory.label}; transit ${trajectory.transit}; transfer delta-v ${trajectory.deltaV}; window ${trajectory.window}; destination key ${state.destination}`,
    `Trajectory controls: launch window offset ${state.windowOffsetDays} days; mid-course correction ${state.correctionPercent}%; landing site ${landingSiteLabel()}; communications delay ${trajectory.commDelay}; landing note ${trajectory.landing}; gravity/slingshot note ${trajectory.slingshot}`,
    `Launch state: ${launchSyncLabel(sim)}; exact sim time ${state.launchStatus === "countdown" ? `T-${Math.max(0, Math.ceil(COUNTDOWN_SECONDS - state.launchClock))}` : `t+${sim.t.toFixed(1)}s`}; velocity ${formatVelocity(sim.velocity)}; altitude ${sim.altitude.toFixed(1)} km; max-q now ${sim.q.toFixed(1)} kPa`,
    `Experiment controls: payload ${state.payloadT.toFixed(1)} t; fuel ${Math.round(state.fuelPercent)}%; drag ${state.dragFactor.toFixed(2)}x; wind ${Math.round(state.windFactor * 100)}%; guidance error ${Math.round(state.guidanceError * 100)}%; engines ${Math.round(state.engineHealth)}%; structure ${Math.round(state.structurePercent)}%; heat shield ${Math.round(state.heatShieldPercent)}%; staging ${state.stagingTiming > 0 ? "+" : ""}${state.stagingTiming}s`,
    `Live warnings: ${warningStack().map(([, title, copy]) => `${title}: ${copy}`).join(" | ")}`,
    `Materials: skin ${materialCatalog[builderConfig.skinMaterial]?.name}; tanks ${materialCatalog[builderConfig.tankMaterial]?.name}; TPS ${heatShieldCatalog[builderConfig.heatShieldMaterial]?.name}; stress margin ${materialStressSummary().margin.toFixed(2)}x; Young modulus ${materialStressSummary().skin.youngGpa} GPa`,
    `Engine lab: ${engineCatalog[builderConfig.engineModel]?.name}; count ${builderConfig.engineCount}; upper propellant ${propellantCatalog[builderConfig.upperStage]?.name}`,
    blueprintContextText(),
    state.failure ? `Latest failure: ${state.failure.reason}; chain ${state.failure.chain.join(" -> ")}; coach ${failureTeachingReply(state.failure.reason, sim)}` : "Latest failure: none in current run",
    `Current challenge: ${challenge.title}; ${passed}/${challenge.checks.length} checks pass; checks: ${challenge.checks.map((check) => `${check.pass ? "pass" : "fail"} ${check.label}`).join("; ")}`,
    `Agent session: last tutor question ${state.agentLastQuestion || "none yet"}; recent turns ${agentConversationText() || "none yet"}`,
    `Selected hardware estimate: ${part.name}; mass here ${formatMassT(breakdown.wetMassT)}; cost driver about ${Math.round(breakdown.costShare * 100)}%; material: ${breakdown.material}; failure watchpoints: ${breakdown.failures.join(", ")}`,
    `Lesson: ${lesson.title}; selected part: ${part.name}; part physics: ${part.equation.join(" | ")}`,
    `Concept lab: anchor "${deep.anchor}"; equation "${deep.equation}"; misconception "${deep.misconception}"; mastery ${state.mastery[lesson.id] === true ? "passed" : "not passed"}`,
    `Vector rehearsal: ${rehearsal.title}; question "${rehearsal.question}"; learner answer ${state.rehearsalAnswer === null ? "none yet" : rehearsal.choices[state.rehearsalAnswer]}; correct move ${rehearsal.choices[rehearsal.answer]}`,
  ].join("\n");
}

function currentPrompt() {
  const part = currentPart();
  return `${AGENT_PERSONALITY}\n\nLive app state:\n${agentContextText()}\n\nExplain the selected part clearly: ${part.description}`;
}

function launchEventContext(event) {
  const sim = simSnapshot();
  const actualTime = event.status === "countdown"
    ? `T-${Math.max(0, Math.ceil(COUNTDOWN_SECONDS - state.launchClock))}`
    : `t+${sim.t.toFixed(1)}s`;
  const scheduled = event.status === "countdown" ? `count clock ${event.clock.toFixed(1)}s` : `scheduled near t+${event.t}s`;
  return [
    `Timeline event just reached: ${event.text}`,
    `Actual app time: ${actualTime}; ${scheduled}.`,
    `Current flight data: velocity ${formatVelocity(sim.velocity)}, altitude ${sim.altitude.toFixed(1)} km, Max-Q ${sim.q.toFixed(1)} kPa, stage ${phaseName(sim.stage)}.`,
    "Narrate only this current event in one short mission-control beat, then ask at most one learner question if useful.",
    agentContextText(),
  ].join("\n");
}

function shareWhatsApp() {
  const url = window.location.href.split("#")[0];
  const rocket = currentRocket();
  const message = `Rocket Agent Lab: ${rocket.name} ${currentMission().label} simulation\n${url}`;
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
  if (/localhost|127\.0\.0\.1/.test(window.location.hostname)) {
    guide("WhatsApp share opened with the local URL. Use the Vercel URL after deployment for phone testing.", "Share");
  } else {
    guide("WhatsApp share opened with this public lab URL.", "Share");
  }
}

function askQuiz() {
  const part = currentPart();
  const question = `Quiz: if ${part.name} gets heavier and thrust stays fixed, what changes first: acceleration or drag?`;
  guide(`${question} Type your answer in Agent chat.`, "Quiz");
}

function runAgentPreset(kind) {
  const rocket = currentRocket();
  const part = currentPart();
  const sim = simSnapshot();
  const trajectory = currentTrajectory();
  const prompts = {
    scene: [
      "Explain the current scene like a Brilliant-style interactive tutor.",
      `Start with what is visible: ${currentRocket().name}, ${part.name}, ${state.showLabels ? "labels on" : "labels off"}, ${state.cutaway ? "cutaway on" : "external view"}.`,
      "Then connect it to one equation and ask one short follow-up question.",
    ].join("\n"),
    question: [
      "Ask me one Socratic rocket physics question grounded in the current screen.",
      `Use ${part.name}, ${currentMission().label}, and t+${sim.t.toFixed(1)}s if relevant.`,
      "Wait for my answer in the prompt bar before revealing the solution.",
    ].join("\n"),
    burn: [
      trajectory.prompt,
      "Treat this as a planning session. Explain destination, burn objective, payload tradeoff, and the next user action in the lab.",
    ].join("\n"),
    trajectory: [
      trajectory.prompt,
      `Use these live controls: launch window offset ${state.windowOffsetDays} days, correction burn ${state.correctionPercent}%, landing ${landingSiteLabel()}, comm delay ${trajectory.commDelay}.`,
      "Give one concrete mission design decision and one multiple-choice question.",
    ].join("\n"),
    formula: [
      "Show the most relevant formula for this exact scene.",
      `Current part: ${part.name}. Mission: ${currentMission().label}.`,
      "Define every symbol in student language, then tell me one control to change next.",
    ].join("\n"),
    dossier: [
      "Give me an industry-style rocket dossier for the selected vehicle.",
      `Vehicle: ${rocket.name}. Operator: ${rocket.operator || "unknown"}. Region: ${rocket.country || "unknown"}. Status: ${rocket.status || rocket.era || "unknown"}.`,
      `Known classroom facts: ${rocket.heightM} m tall, ${rocket.thrustMN.toFixed(rocket.thrustMN < 1 ? 2 : 1)} MN thrust, ${rocket.payload}, source/reference ${rocket.sourceUrl || "local model"}.`,
      "Keep it student-friendly: one architecture insight, one failure mode to test, one comparison vehicle, and one question for me.",
    ].join("\n"),
  };
  sendAgentPrompt(prompts[kind] || prompts.scene);
}

function attachSceneToAgent() {
  const sim = simSnapshot();
  const part = currentPart();
  guide(`Scene attached: ${currentRocket().name}, ${part.name}, ${launchSyncLabel(sim)}, v ${formatVelocity(sim.velocity)}, h ${sim.altitude.toFixed(1)} km, q ${sim.q.toFixed(1)} kPa.`, "You");
  guide("Ask about this screenshot-like scene, a formula, failure, material, engine, or trajectory. I will answer from the live state.", "Agent");
  setPanelMode("agent");
  els.agentPrompt.focus();
}

function runWorkspaceAction() {
  if (state.flightWorkspace === "build") {
    stressBuilder();
    return;
  }
  if (state.flightWorkspace === "engines") {
    askCoachWhy();
    return;
  }
  if (state.flightWorkspace === "materials") {
    if (state.cameraMode !== "ir") {
      state.cameraMode = "visible";
      cycleCameraMode();
    }
    explainLabInfo("Thermal");
    return;
  }
  if (state.flightWorkspace === "failure") {
    if (state.failureLog.length) downloadFailurePdf();
    else startTutorialDemo();
    return;
  }
  launchTest();
}

function askCoachWhy() {
  const coach = coachRecommendation();
  state.controlFocus = coach.focus || state.controlFocus;
  state.controlPulse = 1;
  renderUI();
  sendAgentPrompt([
    "Coach me through the next lab move.",
    `Recommended move: ${coach.move}`,
    `Reason: ${coach.why}`,
    "Use one equation, tell me exactly which control to touch, and ask me to predict the result before I run the launch.",
  ].join("\n"));
}

function answerTrajectoryQuiz(index) {
  const target = currentTrajectory();
  state.trajectoryQuizAnswer = index;
  renderTrajectoryPlanner();
  if (index === target.quiz.answer) {
    guide(target.quiz.feedback, "Mission check");
  } else {
    guide("Try again: mission timing is about future intercept geometry and correction fuel.", "Mission check");
  }
}

function askTrajectoryTopic(topic) {
  const target = currentTrajectory();
  const prompts = {
    window: "Explain launch windows with the current destination. Make it intuitive: future intercept point, phase angle, and correction fuel.",
    parking: "Explain why missions often start from a parking orbit before a transfer burn.",
    injection: "Explain the injection burn. Connect delta-v, solar energy, payload mass, and why a small burn error matters later.",
    coast: "Explain the coast phase. Include mid-course correction, signal delay, bits/telemetry, and spacecraft autonomy.",
    arrival: "Explain arrival and landing. Include braking energy, heat shield, atmosphere/no atmosphere, and landing-site risk.",
    correction: "Explain why mid-course correction burns are cheap when done early and expensive when the launch window is wrong.",
    slingshot: "Explain gravity assist as a trade between timing, geometry, and planetary orbital energy.",
    landing: "Explain the selected landing mode and what can fail during entry, descent, and landing.",
  };
  setPanelMode("agent");
  sendAgentPrompt([
    prompts[topic] || "Explain this trajectory concept from the current screen.",
    `Destination: ${target.label}; launch window offset ${state.windowOffsetDays} days; correction burn ${state.correctionPercent}%; landing mode ${landingSiteLabel()}; comm delay ${target.commDelay}.`,
    "Give one concrete variable to change in the lab and one multiple-choice check with the correct answer hidden until I reply.",
  ].join("\n"));
}

function askTrajectoryAgent() {
  const target = currentTrajectory();
  sendAgentPrompt([
    target.prompt,
    `Current plan: launch window offset ${state.windowOffsetDays} days; mid-course correction ${state.correctionPercent}%; landing mode ${landingSiteLabel()}; communications delay ${target.commDelay}.`,
    "Act like a mission design tutor. Explain the weakest part of this plan, then give one MCQ with three options.",
  ].join("\n"));
}


function pointerPos(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function controlAt(pos) {
  return state.controlAreas.find((area) => Math.hypot(pos.x - area.x, pos.y - area.y) <= area.r) || null;
}

function adjustForceControl(type, dx, dy) {
  const rocket = currentRocket();
  if (state.launchStatus !== "running") {
    resetFlightState();
  }
  if (type === "payload") {
    state.payloadT = clamp(state.payloadT + dy * 0.18, 0, Number(els.payloadSlider.max));
    state.simTime = 0;
  }
  if (type === "fuel") {
    state.fuelPercent = clamp(state.fuelPercent - dy * 0.22, 35, 100);
    state.simTime = 0;
  }
  if (type === "drag") {
    state.dragFactor = clamp(state.dragFactor + dx * 0.006, 0.65, 1.8);
  }
  previewControl(type);
  syncExperimentControls();
  renderUI();
  const unit = type === "payload" ? `${state.payloadT.toFixed(1)} t payload` : type === "fuel" ? `${Math.round(state.fuelPercent)}% fuel` : `${state.dragFactor.toFixed(2)}x drag`;
  els.partLabel.textContent = `${rocket.name} · ${unit}`;
}

function bindEvents() {
  window.addEventListener("resize", resizeCanvas);
  canvas.addEventListener("pointerdown", (event) => {
    state.dragging = true;
    state.dragMoved = false;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (state.dragging) {
      const dx = event.clientX - state.lastX;
      const dy = event.clientY - state.lastY;
      state.targetAngle += dx * 0.006;
      if (event.shiftKey) {
        state.targetFocusY = clamp(state.targetFocusY - dy * 0.0036, 0.06, 0.94);
      } else {
        state.targetPitch = clamp(state.targetPitch + dy * 0.004, -0.58, 0.86);
      }
      state.dragMoved ||= Math.abs(dx) > 2 || Math.abs(dy) > 2;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      return;
    }
    const hitId = rocketScene?.pickPart(event.clientX, event.clientY) || null;
    state.hoveredPartId = hitId;
    rocketScene?.setHover(hitId);
    canvas.style.cursor = hitId ? "pointer" : "grab";
  });
  canvas.addEventListener("pointerup", (event) => {
    state.dragging = false;
    canvas.style.cursor = "grab";
    if (state.dragMoved) return;
    const hitId = rocketScene?.pickPart(event.clientX, event.clientY) || null;
    if (hitId) selectPart(hitId);
  });
  canvas.addEventListener("pointerleave", () => {
    state.hoveredPartId = null;
    rocketScene?.setHover(null);
    canvas.style.cursor = "grab";
  });
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (event.shiftKey) {
      state.targetFocusY = clamp(state.targetFocusY + (event.deltaY > 0 ? -0.045 : 0.045), 0.06, 0.94);
      return;
    }
    state.zoom = Math.max(0.58, Math.min(3.2, state.zoom + (event.deltaY > 0 ? -0.08 : 0.08)));
  }, { passive: false });

  document.querySelector("#resetView").addEventListener("click", () => {
    state.targetAngle = -0.42;
    state.targetPitch = 0.05;
    state.targetFocusY = 0.5;
    state.zoom = 0.92;
  });
  els.shareWhatsApp?.addEventListener("click", shareWhatsApp);
  els.blueprintWorkspace?.addEventListener("click", () => toggleBlueprintWorkspace());
  document.querySelector("#explodeToggle").addEventListener("click", (event) => {
    state.explode = !state.explode;
    event.currentTarget.classList.toggle("active", state.explode);
  });
  document.querySelector("#cutawayToggle").addEventListener("click", (event) => {
    state.cutaway = !state.cutaway;
    event.currentTarget.classList.toggle("active", state.cutaway);
  });
  document.querySelector("#labelToggle").addEventListener("click", (event) => {
    state.showLabels = !state.showLabels;
    event.currentTarget.classList.toggle("active", state.showLabels);
    renderPartLabels();
  });
  document.querySelector("#labelDensityToggle").addEventListener("click", () => {
    state.labelDensity = state.labelDensity === "all" ? "focus" : "all";
    state.showLabels = true;
    document.querySelector("#labelToggle")?.classList.add("active");
    renderUI();
    guide(state.labelDensity === "all" ? "All part labels are visible." : "Focused labels show the selected system and nearby hardware.", "Tutor");
  });
  document.querySelector("#simToggle").addEventListener("click", (event) => {
    state.simRunning = !state.simRunning;
    event.currentTarget.classList.toggle("active", state.simRunning);
  });
  document.querySelector("#cameraModeToggle").addEventListener("click", cycleCameraMode);
  document.querySelectorAll("[data-inspect]").forEach((button) => {
    button.addEventListener("click", () => inspectPart(button.dataset.inspect));
  });
  document.querySelector("#scaleToggle").addEventListener("change", (event) => {
    state.scale = event.target.checked;
    renderUI();
  });
  document.querySelector("#quizButton").addEventListener("click", askQuiz);
  document.querySelectorAll(".scenario-tab").forEach((button) => {
    button.addEventListener("click", () => applyMission(button.dataset.mission));
  });
  document.querySelectorAll("[data-panel-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      setPanelMode(button.dataset.panelMode);
    });
  });
  document.querySelectorAll("[data-blueprint-layer]").forEach((button) => {
    button.addEventListener("click", () => {
      state.blueprintLayer = button.dataset.blueprintLayer;
      renderBlueprintLab();
    });
  });
  document.querySelectorAll("[data-blueprint-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.blueprintView = button.dataset.blueprintView;
      renderBlueprintLab();
      guide(`Blueprint view changed to ${state.blueprintView}. Use it like a drafting elevation, not a full Blender scene.`, "Blueprint");
    });
  });
  document.querySelectorAll("[data-draft-tool]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.draftTool === "clear") {
        clearBlueprintSketch();
        return;
      }
      state.draftTool = button.dataset.draftTool;
      renderBlueprintLab();
      if (els.blueprintInventoryStatus) els.blueprintInventoryStatus.textContent = state.draftTool === "erase" ? "Eraser active. Drag over sketch marks to remove them." : "Draw active. Sketch annotations directly on the blueprint.";
    });
  });
  document.querySelectorAll("[data-blueprint-control]").forEach((control) => {
    control.addEventListener("input", (event) => changeBuilderConfig(event.currentTarget.dataset.blueprintControl, event.currentTarget.value));
    control.addEventListener("change", (event) => changeBuilderConfig(event.currentTarget.dataset.blueprintControl, event.currentTarget.value));
  });
  document.querySelectorAll("[data-blueprint-part]").forEach((button) => {
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", button.dataset.blueprintPart);
      event.dataTransfer?.setData("application/x-blueprint-part", button.dataset.blueprintPart);
      els.viewportBlueprintCanvas?.classList.add("is-armed");
    });
    button.addEventListener("dragend", () => {
      els.viewportBlueprintCanvas?.classList.remove("is-armed", "is-drop-ready");
    });
    button.addEventListener("click", () => applyBlueprintPart(button.dataset.blueprintPart));
  });
  els.viewportBlueprintCanvas?.addEventListener("dragover", (event) => {
    event.preventDefault();
    els.viewportBlueprintCanvas.classList.add("is-drop-ready");
  });
  els.viewportBlueprintCanvas?.addEventListener("dragleave", () => {
    els.viewportBlueprintCanvas.classList.remove("is-drop-ready");
  });
  els.viewportBlueprintCanvas?.addEventListener("drop", (event) => {
    event.preventDefault();
    const partId = event.dataTransfer?.getData("application/x-blueprint-part") || event.dataTransfer?.getData("text/plain");
    els.viewportBlueprintCanvas.classList.remove("is-armed", "is-drop-ready");
    if (addBlueprintSketchPart(partId, event)) return;
    applyBlueprintPart(partId, "Assembly");
  });
  els.blueprintSketchCanvas?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    resizeSketchCanvas();
    state.sketching = true;
    state.sketchLast = sketchPoint(event);
    els.blueprintSketchCanvas.setPointerCapture(event.pointerId);
  });
  els.blueprintSketchCanvas?.addEventListener("pointermove", (event) => {
    if (!state.sketching) return;
    const next = sketchPoint(event);
    drawSketchLine(state.sketchLast, next);
    state.sketchLast = next;
  });
  els.blueprintSketchCanvas?.addEventListener("pointerup", () => {
    state.sketching = false;
    state.sketchLast = null;
  });
  els.blueprintSketchCanvas?.addEventListener("pointercancel", () => {
    state.sketching = false;
    state.sketchLast = null;
  });
  window.addEventListener("resize", () => {
    if (state.workspaceMode === "blueprint") requestAnimationFrame(resizeSketchCanvas);
  });
  els.blueprintStages.addEventListener("change", (event) => changeBuilderConfig("stages", event.target.value));
  els.blueprintBoosters.addEventListener("change", (event) => changeBuilderConfig("boosterPairs", event.target.value));
  els.blueprintEngines.addEventListener("input", (event) => changeBuilderConfig("engineCount", event.target.value));
  els.blueprintEngineModel.addEventListener("change", (event) => changeBuilderConfig("engineModel", event.target.value));
  els.blueprintDiameter.addEventListener("input", (event) => changeBuilderConfig("diameterM", event.target.value));
  els.blueprintUpper.addEventListener("change", (event) => changeBuilderConfig("upperStage", event.target.value));
  els.blueprintSkin.addEventListener("change", (event) => {
    changeBuilderConfig("skinMaterial", event.target.value);
    changeBuilderConfig("tankMaterial", event.target.value);
  });
  els.blueprintShield.addEventListener("change", (event) => changeBuilderConfig("heatShieldMaterial", event.target.value));
  document.querySelector("#blueprintLab").addEventListener("click", (event) => {
    const infoTarget = event.target.closest("[data-info]");
    if (!infoTarget) return;
    explainLabInfo(infoTarget.dataset.info);
  });
  document.querySelector("#blueprintAsk").addEventListener("click", askBlueprintTutor);
  document.querySelector("#blueprintSend").addEventListener("click", sendBlueprintToLaunch);
  document.querySelector("#viewportBlueprintAsk").addEventListener("click", askBlueprintTutor);
  document.querySelector("#viewportBlueprintLaunch").addEventListener("click", sendBlueprintToLaunch);
  document.querySelectorAll("[data-flight-workspace]").forEach((button) => {
    button.addEventListener("click", () => {
      setFlightWorkspace(button.dataset.flightWorkspace);
      renderUI();
    });
  });
  document.querySelectorAll("[data-destination]").forEach((button) => {
    button.addEventListener("click", () => selectDestination(button.dataset.destination));
  });
  els.windowSlider.addEventListener("input", (event) => {
    state.windowOffsetDays = Number(event.target.value);
    renderTrajectoryPlanner();
  });
  els.correctionSlider.addEventListener("input", (event) => {
    state.correctionPercent = Number(event.target.value);
    renderTrajectoryPlanner();
  });
  els.landingSite.addEventListener("change", (event) => {
    state.landingSite = event.target.value;
    renderTrajectoryPlanner();
  });
  els.trajectoryQuizChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-trajectory-answer]");
    if (!button) return;
    answerTrajectoryQuiz(Number(button.dataset.trajectoryAnswer));
  });
  document.querySelector("#trajectoryPlanner").addEventListener("click", (event) => {
    const button = event.target.closest("[data-trajectory-topic]");
    if (!button) return;
    askTrajectoryTopic(button.dataset.trajectoryTopic);
  });
  document.querySelector("#planTrajectory").addEventListener("click", planTrajectory);
  document.querySelector("#askTrajectoryAgent").addEventListener("click", askTrajectoryAgent);
  els.workspaceAction.addEventListener("click", runWorkspaceAction);
  document.querySelector("#flightLab").addEventListener("click", (event) => {
    const infoTarget = event.target.closest("[data-info]");
    if (!infoTarget) return;
    explainLabInfo(infoTarget.dataset.info);
  });
  document.querySelector("#flightLab").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const infoTarget = event.target.closest("[data-info]");
    if (!infoTarget) return;
    event.preventDefault();
    explainLabInfo(infoTarget.dataset.info);
  });
  document.querySelector("#launchTest").addEventListener("click", launchTest);
  document.querySelector("#coachAsk").addEventListener("click", askCoachWhy);
  document.querySelector("#resetFlight").addEventListener("click", resetFlight);
  document.querySelector("#restoreDefaults").addEventListener("click", restoreSafeDefault);
  document.querySelector("#tutorialDemo").addEventListener("click", startTutorialDemo);
  document.querySelector("#downloadFailures").addEventListener("click", downloadFailurePdf);
  document.querySelector("#focusGraph").addEventListener("click", () => {
    setPanelMode("learn");
    guide("The graph shows velocity, altitude, and Max-Q together. The explanation card tells you which curve caused the failure.", "Tutor");
  });
  els.loadBuilder.addEventListener("click", selectBuilderRocket);
  document.querySelectorAll("[data-builder-preset]").forEach((button) => {
    button.addEventListener("click", () => applyBuilderPreset(button.dataset.builderPreset));
  });
  document.querySelector("#stressBuilder").addEventListener("click", stressBuilder);
  document.querySelector("#repairBuilder").addEventListener("click", repairBuilder);
  els.builderStages.addEventListener("change", (event) => changeBuilderConfig("stages", event.target.value));
  els.builderBoosters.addEventListener("change", (event) => changeBuilderConfig("boosterPairs", event.target.value));
  els.builderEngines.addEventListener("input", (event) => changeBuilderConfig("engineCount", event.target.value));
  els.builderEngineModel.addEventListener("change", (event) => changeBuilderConfig("engineModel", event.target.value));
  els.builderDiameter.addEventListener("input", (event) => changeBuilderConfig("diameterM", event.target.value));
  els.builderUpper.addEventListener("change", (event) => changeBuilderConfig("upperStage", event.target.value));
  els.builderSkinMaterial.addEventListener("change", (event) => changeBuilderConfig("skinMaterial", event.target.value));
  els.builderTankMaterial.addEventListener("change", (event) => changeBuilderConfig("tankMaterial", event.target.value));
  els.builderHeatShieldMaterial.addEventListener("change", (event) => changeBuilderConfig("heatShieldMaterial", event.target.value));
  els.builderReuse.addEventListener("change", (event) => changeBuilderConfig("reuse", event.target.value));
  els.engineModelLab.addEventListener("change", (event) => changeBuilderConfig("engineModel", event.target.value));
  els.engineCountLab.addEventListener("input", (event) => changeBuilderConfig("engineCount", event.target.value));
  els.upperFuelLab.addEventListener("change", (event) => changeBuilderConfig("upperStage", event.target.value));
  els.skinMaterialLab.addEventListener("change", (event) => changeBuilderConfig("skinMaterial", event.target.value));
  els.tankMaterialLab.addEventListener("change", (event) => changeBuilderConfig("tankMaterial", event.target.value));
  els.heatShieldLab.addEventListener("change", (event) => changeBuilderConfig("heatShieldMaterial", event.target.value));
  document.querySelectorAll("[data-catalog-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.catalogMode = button.dataset.catalogMode;
      renderRocketList();
    });
  });
  document.querySelectorAll("[data-catalog-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.catalogFilter = button.dataset.catalogFilter || "all";
      renderRocketList();
      guide(`Catalog filtered to ${button.textContent.trim()} vehicles. Pick one to compare its source-backed architecture.`, "Hangar");
    });
  });
  els.viewportBlueprintManifest?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-manifest-layer]");
    if (!button) return;
    state.blueprintLayer = button.dataset.manifestLayer;
    state.activeBlueprintFault = button.dataset.manifestKey || "launch";
    renderBlueprintLab();
    guide(`Fault tree focused ${button.innerText.split("\n")[0].toLowerCase()}.`, "Blueprint");
  });
  document.querySelector("#prevLesson").addEventListener("click", () => setLesson(state.lessonIndex - 1));
  document.querySelector("#nextLesson").addEventListener("click", () => setLesson(state.lessonIndex + 1));
  els.applyConceptExperiment.addEventListener("click", applyConceptExperiment);
  document.querySelectorAll("[data-agent-preset]").forEach((button) => {
    button.addEventListener("click", () => runAgentPreset(button.dataset.agentPreset));
  });
  document.querySelector("#agentStressTest").addEventListener("click", runAgentStressTest);
  document.querySelector("#attachScene").addEventListener("click", attachSceneToAgent);
  els.agentPromptForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = els.agentPrompt.value;
    els.agentPrompt.value = "";
    sendAgentPrompt(text);
  });
  els.voiceToggle?.addEventListener("click", () => {
    state.voiceEnabled = !state.voiceEnabled;
    if (!state.voiceEnabled) {
      state.voiceController?.abort?.();
      closeRealtimeCompanion({ quiet: true });
      state.voiceListening = false;
      state.voicePlaying = false;
      state.voiceAutoNarrate = false;
    }
    updateVoiceUi();
    guide(state.voiceEnabled
      ? "Voice companion on. Ask a question or press Talk; replies use OpenAI generated speech only."
      : "Voice companion off. Text chat remains active.",
    "Agent");
  });
  document.querySelectorAll("[data-voice-style]").forEach((button) => {
    button.addEventListener("click", () => {
      state.voiceStyle = voiceStyleProfiles[button.dataset.voiceStyle] ? button.dataset.voiceStyle : "lab-partner";
      updateVoiceUi();
      const profile = currentVoiceProfile();
      guide(`${profile.label} selected. ${profile.copy}`, "Agent");
      if (state.voiceRealtimeConnected) {
        requestRealtimeResponse(`Switch to this companion style now: ${profile.label}. ${profile.instructions}`, "style-change");
      }
    });
  });
  els.voiceTalk?.addEventListener("click", startVoiceInput);
  els.voiceRealtime?.addEventListener("click", startRealtimeCompanion);
  els.companionLoopRun?.addEventListener("click", runCompanionLoop);
  els.voiceAuto?.addEventListener("click", () => {
    if (!state.voiceEnabled) return;
    state.voiceAutoNarrate = !state.voiceAutoNarrate;
    updateVoiceUi();
    guide(state.voiceAutoNarrate
      ? "Auto launch narration on. I will call out countdown, Max-Q, staging, and insertion as they happen."
      : "Auto launch narration off.",
    "Agent");
  });
  els.voiceBrief?.addEventListener("click", speakCurrentBrief);
  els.vectorPlanApply?.addEventListener("click", applyVectorPlan);
  els.vectorPlanVoice?.addEventListener("click", speakVectorPlan);
  els.rehearsalNext?.addEventListener("click", () => {
    state.rehearsalSeed += 1;
    state.rehearsalAnswer = null;
    renderRehearsalDrill();
    guide("New Vector drill loaded. Predict first, then ask the agent to coach it.", "Vector");
  });
  els.rehearsalAsk?.addEventListener("click", askRehearsalCoach);
  document.querySelector("#agentPulse").addEventListener("click", () => {
    const part = currentPart();
    const sim = simSnapshot();
    const text = [
      `Explain the current scene like a live tutor.`,
      `Selected part: ${part.name}. ${compact(part.description, 120)} Equation: ${part.equation[1]}.`,
      `Current time: ${state.launchStatus === "countdown" ? `T-${Math.max(0, Math.ceil(COUNTDOWN_SECONDS - state.launchClock))}` : `t+${sim.t.toFixed(1)}s`}.`,
      `Ask one short follow-up question the learner can answer in the prompt bar.`,
    ].join("\n");
    sendAgentPrompt(text);
  });
  els.menuToggle.addEventListener("click", () => els.catalogPanel.classList.toggle("open"));
  els.payloadSlider.addEventListener("input", (event) => {
    resetFlightState();
    state.payloadT = Number(event.target.value);
    previewControl("payload");
    renderUI();
  });
  els.fuelSlider.addEventListener("input", (event) => {
    resetFlightState();
    state.fuelPercent = Number(event.target.value);
    previewControl("fuel");
    renderUI();
  });
  els.dragSlider.addEventListener("input", (event) => {
    resetFlightState();
    state.dragFactor = Number(event.target.value);
    previewControl("drag");
    renderUI();
  });
  els.windSlider.addEventListener("input", (event) => {
    resetFlightState();
    state.windFactor = Number(event.target.value);
    previewControl("wind");
    renderUI();
  });
  els.guidanceSlider.addEventListener("input", (event) => {
    resetFlightState();
    state.guidanceError = Number(event.target.value);
    previewControl("guidance");
    renderUI();
  });
  els.engineHealthSlider.addEventListener("input", (event) => {
    resetFlightState();
    state.engineHealth = Number(event.target.value);
    previewControl("engine");
    renderUI();
  });
  els.structureSlider.addEventListener("input", (event) => {
    resetFlightState();
    state.structurePercent = Number(event.target.value);
    previewControl("structure");
    renderUI();
  });
  els.heatShieldSlider.addEventListener("input", (event) => {
    resetFlightState();
    state.heatShieldPercent = Number(event.target.value);
    previewControl("heat");
    renderUI();
  });
  els.stagingSlider.addEventListener("input", (event) => {
    resetFlightState();
    state.stagingTiming = Number(event.target.value);
    previewControl("staging");
    renderUI();
  });
}

function routeCommand(text) {
  const lower = text.toLowerCase();
  const rocketIndex = rockets.findIndex((rocket) => lower.includes(rocket.name.toLowerCase()));
  if (rocketIndex >= 0) {
    selectRocket(rocketIndex);
    return;
  }
  const rocket = currentRocket();
  const part = rocket.parts.find((item) => lower.includes(item.name.toLowerCase().split(" ")[0]) || lower.includes(item.type.toLowerCase()));
  if (part) {
    selectPart(part.id);
    return;
  }
  if (lower.includes("quiz")) {
    askQuiz();
    return;
  }
  if (lower.includes("launch") || lower.includes("test flight")) {
    launchTest();
    return;
  }
  if (lower.includes("build") || lower.includes("custom rocket") || lower.includes("make a rocket")) {
    selectBuilderRocket();
    return;
  }
  const destinationKey = Object.keys(trajectoryTargets).find((key) => lower.includes(key));
  if (destinationKey) {
    selectDestination(destinationKey);
    if (lower.includes("plan") || lower.includes("trajectory") || lower.includes("burn")) {
      planTrajectory();
    }
    return;
  }
  if (lower.includes("label") || lower.includes("show parts")) {
    state.showLabels = true;
    document.querySelector("#labelToggle")?.classList.add("active");
    renderPartLabels();
    guide("Labels are on. Click any label to zoom toward that part.", "Tutor");
    return;
  }
  if (lower.includes("cutaway") || lower.includes("inside")) {
    state.cutaway = true;
    document.querySelector("#cutawayToggle")?.classList.add("active");
    renderUI();
    guide("Cutaway is on. Fuel and oxidizer tanks are visible inside the rocket.", "Tutor");
    return;
  }
  if (lower.includes("engine")) {
    inspectPart("engines");
    return;
  }
  if (lower.includes("tank") || lower.includes("fuel")) {
    inspectPart("tanks");
    return;
  }
  if (lower.includes("payload") || lower.includes("fairing")) {
    inspectPart("payload");
    return;
  }
  if (lower.includes("thermal") || lower.includes("heat") || lower.includes("max q") || lower.includes("max-q")) {
    inspectPart("thermal");
    return;
  }
  if (lower.includes("reset")) {
    resetFlight();
    return;
  }
  const missionKey = Object.keys(missionProfiles).find((key) => {
    const profile = missionProfiles[key];
    return lower.includes(key)
      || lower.includes(profile.shortLabel.toLowerCase())
      || lower.includes(profile.label.toLowerCase())
      || lower.includes(profile.label.split(" ")[0].toLowerCase());
  });
  if (missionKey) {
    applyMission(missionKey);
    return;
  }
  const response = `For ${rocket.name}, focus on ${currentPart().name}: ${currentPart().equation[2]}`;
  guide(response);
}

rocketScene = createRocketScene({
  canvas,
  getState: () => state,
  getRocket: currentRocket,
  normalizeParts,
  simSnapshot,
});
resizeCanvas();
renderRocketList();
syncExperimentControls();
renderUI();
bindEvents();
document.querySelector("#explodeToggle").classList.toggle("active", state.explode);
document.querySelector("#simToggle").classList.toggle("active", state.simRunning);
document.querySelector("#labelToggle").classList.toggle("active", state.showLabels);
guide("Click a part. Watch thrust, weight, drag, and the graph move together.", "Tutor");
if (qaMode) {
  let qaFrames = 0;
  const renderQaFrame = () => {
    resizeCanvas();
    drawScene();
    qaFrames += 1;
    if (qaFrames < 8) requestAnimationFrame(renderQaFrame);
  };
  requestAnimationFrame(renderQaFrame);
} else {
  requestAnimationFrame(animate);
  setInterval(() => {
    if (!state.lastFrameMs || performance.now() - state.lastFrameMs > 220) {
      animate(performance.now(), true);
    }
  }, 120);
}
