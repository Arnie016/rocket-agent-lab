# Rocket Agent Lab

Interactive 3D rocket education prototype with nine Three.js rocket models, structured lessons, part picking, focused/all label modes, live challenge checklists, before/after slider impact readouts, physics equations, hardware/cost/failure breakdowns, WhatsApp sharing, and Astra, an OpenAI Realtime voice tutor with a prompt bar for scene-aware questions and replies.

The viewport uses orbit-camera inspection with horizontal rotation, vertical pitch, shift-drag stack panning, ray-picked rocket parts, inspection shortcuts for engines/tanks/payload/thermal loads, split/cutaway modes, fuel and payload callouts, launch-pad environment detail, ignition plumes, shock diamonds, Max-Q pressure waves, staging flashes, heat glow, smoke, and ascent camera following. The Flight Lab adds beginner-readable orbit, escape, heavy-payload, and Max-Q stress tests with wind shear, guidance error, launch/fail/pass states, animated breakup, staged delta-v, mass ratio, live mass, peak Max-Q, risk, slider threshold cues, and mission margin from the same classroom model.

The selected-part panel includes educational estimates for mass, relative cost driver, materials, failure watchpoints, and optimization levers. Failure states now show a causal chain such as mass ratio loss, Max-Q overload, or wind/guidance coupling. These are learning approximations, not procurement-grade cost or mass data.

The 3D renderer is local/offline: `rocket-three-scene.js` imports vendored Three.js files from `vendor/`.

## Run

```bash
cd /Users/arnav/Desktop/testing/rocket-agent-lab
node server.mjs
```

Open:

```text
http://127.0.0.1:5186
```

## OpenAI Realtime Voice

Set the API key only on the server:

```bash
OPENAI_API_KEY=... node server.mjs
```

The browser posts a WebRTC SDP offer to `/api/realtime-call`; the server forwards it to OpenAI and returns the SDP answer without exposing the standard API key to the browser. The app intentionally does not use Web Speech or a Mac voice fallback. Realtime is treated as the tutor backbone: voice, the prompt bar, launch-event narration, and quiz turns all route through GPT Realtime 2 with live scene context.

The prototype follows OpenAI's WebRTC Realtime pattern: the browser creates an SDP offer, the server creates the Realtime session, then the browser completes the WebRTC connection with the returned SDP answer.

For Vercel, set `OPENAI_API_KEY` as a project environment variable. The matching serverless endpoint is `api/realtime-call.js`. The default public model id is `gpt-realtime-2` with the `marin` voice; set `OPENAI_REALTIME_MODEL` to override it.

### Authorized human Realtime check

The local causal-context and data-channel tests are not a substitute for a live voice result. Before a demo or submission claim, run exactly one authorized microphone/WebRTC session using [`outputs/realtime-human-test-protocol-2026-07-18.md`](outputs/realtime-human-test-protocol-2026-07-18.md). It records only the selected scene, changed value, visible connection state, and pass/fail outcome—never an API key or raw SDP.

## Physics Sheet

The equation source is in `assets/rocket-equations.tex`, compiled to `assets/rocket-equations.pdf` with the bundled LaTeX Tectonic runtime.
