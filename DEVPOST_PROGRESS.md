# Devpost Progress

## 2026-07-21 — Realtime proof refresh for gate tracking

- Change: re-ran the no-network causal wiring checks and refreshed the closest submission-gate proof artifact with the same ledger-only scope.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` and `node --check app.js server.mjs` passed.
- Proof: `outputs/submission-proof-freshness-2026-07-21T2001Z.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session has been run this cycle.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` in one connected session; capture opening grounded and changed-state grounded responses.
- Next move: run that one authorized microphone/WebRTC session, then refresh this checklist row and progress entry.

## 2026-07-21 — Realtime proof refresh for gate tracking

- Change: reran the no-network/CLI gate checks and refreshed the closest submission-gate proof artifact without app changes.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` and `node --check app.js server.mjs` passed.
- Proof: `outputs/submission-proof-freshness-2026-07-21T1801Z.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session has been run this cycle.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` in one connected session; capture opening grounded and changed-state grounded responses.
- Next move: perform one authorized microphone/WebRTC session and then refresh this top checklist row + progress entry.

## 2026-07-22 — Realtime proof refresh for gate tracking

- Change: refreshed the closest submission-gate proof artifacts without code changes; this keeps the review ledger aligned to the current run.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` passed (3/3).
- Proof: `outputs/submission-proof-freshness-2026-07-22T2200Z.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session has been run this cycle.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` in one connected session; capture opening grounded and changed-state grounded responses.
- Next move: perform one authorized microphone/WebRTC session then re-run only this checklist row and progress entry.

## 2026-07-22 — Submission readiness proof refresh

- Change: refreshed the closest submission-gate proof artifact without changing app behavior, to keep the checklist grounded in the current run.
- Checks: `node --check app.js`, `node --check server.mjs`, and `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` passed (3/3).
- Proof: `outputs/submission-proof-freshness-2026-07-22T2000Z.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session has been run this cycle.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one connected session; capture both the opening selected-state response and the changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-18 — Realtime peer-failure retry cleanup

- Change: a failed or disconnected WebRTC peer connection now releases the captured peer connection and microphone stream whether the Realtime companion had finished connecting or was still negotiating; intentional local close remains quiet. Added a no-network wiring assertion for this path.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` passed (3/3); `node --check app.js`, `node --check realtime-context.mjs`, `node --check realtime-session.mjs`, and `node --check server.mjs` passed; local HTTP GET `/` returned 200 and contained `Rocket Agent Lab`.
- Proof: `outputs/realtime-peer-failure-retry-test-2026-07-18.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session was run, and local cleanup proof does not establish a connected tutor response.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one connected session; capture both the opening selected-state response and the changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-18 — Realtime live-close cleanup parity

- Change: normal Realtime closure now uses `releaseRealtimeResources()` for the active peer connection and microphone stream, matching failed-setup cleanup while preserving direct data-channel closure.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` passed (3/3); `node --check app.js` and `node --check server.mjs` passed; local HTTP GET `/` returned 200 and contained `Rocket Agent Lab`.
- Proof: `outputs/realtime-live-close-cleanup-test-2026-07-18.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session or Realtime request was run. Local cleanup wiring cannot establish a live tutor response.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one connected session; record the selected-state opening response and the changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-18 — Realtime error retry recovery

- Change: the Realtime data-channel error path now closes the local session before reporting the failure, so microphone/WebRTC resources are released and the visible control cannot remain falsely live; added a no-network client-wiring assertion for that recovery behavior.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` passed (3/3); `node --check app.js`, `node --check realtime-context.mjs`, `node --check realtime-session.mjs`, and `node --check server.mjs` passed; local HTTP GET `/` returned 200 and contained `Rocket Agent Lab`.
- Proof: `outputs/realtime-error-retry-test-2026-07-18.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session was run, and this local retry proof does not establish a live tutor response.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one connected session; capture both the opening selected-state response and the changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-18 — Realtime opening-turn race recovery

- Change: guarded the opening tutor request so a data channel that opens during SDP setup is retried once after the state-backed sender is live, while a per-session flag prevents duplicate opening turns; added a no-network wiring regression assertion.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` passed (3/3); `node --check app.js`, `node --check realtime-context.mjs`, `node --check realtime-session.mjs`, and `node --check server.mjs` passed; local HTTP GET `/` returned 200 and contained `Rocket Agent Lab`.
- Proof: `outputs/realtime-opening-turn-race-test-2026-07-18.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; this protects local event ordering only and does not establish a connected microphone/WebRTC tutor response.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one connected session; capture both the opening selected-state response and the changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-18 — founder voice-notes capture gate

- Change: added `DEVPOST_VOICE_NOTES.md`, an explicitly `HUMAN_EDIT_REQUIRED` founder-owned capture sheet for project origin, frustration, stakes, taste, rejected directions, failed attempts, corrections, and the exact future GPT-5.6 contribution record. It deliberately contains prompts rather than fabricated first-person copy.
- Checks: verified all required capture sections and the human-approval boundary; `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs` passed (2/2); local HTTP GET `/` returned 200 and contained `Rocket Agent Lab`.
- Proof: `outputs/devpost-voice-notes-template-check-2026-07-18.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session was run, and the founder must supply/rewrite the notes before any Devpost prose can be treated as final.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one connected session; capture both the opening selected-state response and the changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-18 — Realtime route causal-config parity proof

- Change: extended the no-network Realtime session test to lock both the local and Vercel SDP routes to the shared causal session builder and to selected `voiceStyle` plus opening `voiceContext`; a route can no longer silently drift to an ungrounded opening payload without failing the test.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs` passed (2/2); `node --check app.js`, `node --check server.mjs`, `node --check realtime-session.mjs`, and `node --check api/realtime-call.js` passed; local HTTP GET `/` returned 200 and contained `Rocket Agent Lab`.
- Proof: `outputs/realtime-route-parity-test-2026-07-18.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; this protects local route construction only and does not prove an authorized microphone/WebRTC response.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one connected session; capture both the opening selected-state response and the changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-18 — Realtime opening session-config causal proof

- Change: extracted `buildRealtimeSessionConfig()` so local `server.mjs` and Vercel `api/realtime-call.js` use the same pure opening Realtime session payload; the no-network test now proves the session instructions retain selected voice style, rocket, part, lesson, and simulation values.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs` passed (2/2); `node --check app.js`, `node --check server.mjs`, `node --check realtime-session.mjs`, and `node --check api/realtime-call.js` passed; bounded-retry local HTTP GET `/` returned 200 and contained `Rocket Agent Lab`.
- Proof: `outputs/realtime-opening-session-config-test-2026-07-18.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session was run, so this only verifies the outgoing session instructions, not a live tutor response.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one connected session; record the opening selected-state response and the later changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-18 — Realtime human-test evidence record

- Change: added `outputs/realtime-human-test-evidence-template.md`, linked from the authorized protocol and submission checklist, so the closest required human session has a bounded, secret-safe record for the selected scene, changed slider, connection state, and both observations.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs` passed (2/2); `node --check app.js` and `node --check server.mjs` passed; bounded-retry local HTTP GET `/` returned 200 and contained `Rocket Agent Lab`.
- Proof: `outputs/realtime-human-test-evidence-template-smoke-2026-07-18.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session was run.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one authorized connected session; record the opening selected-state response and the later changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-18 — authorized Realtime human-test protocol

- Change: added a bounded, secret-safe protocol for the closest submission gate and linked it from the README; it requires a real connected WebRTC session plus opening and changed-state causal evidence.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs`; `node --check app.js`; `node --check server.mjs`; bounded-retry local HTTP GET `/`.
- Proof: `outputs/realtime-human-test-protocol-2026-07-18.md` and the current command output captured in `outputs/realtime-human-test-protocol-smoke-2026-07-18.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; an authorized microphone/WebRTC session has not been run.
- Human test: follow `outputs/realtime-human-test-protocol-2026-07-18.md`; capture only selected scene, changed value, connection state, and the two pass/fail observations.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-18 — submission-gate ledger

- Change: added `SUBMISSION_CHECKLIST.md`, a current Build Week gate ledger that records required evidence without representing blocked work as complete.
- Checks: verified all required ledger headings; `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs` passed (2/2); `node --check app.js` and `node --check server.mjs` passed; bounded-retry local HTTP GET `/` returned 200 and contained `Rocket Agent Lab`.
- Proof: `outputs/submission-checklist-smoke-2026-07-18.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session was run, and the repository/privacy audit plus GPT-5.6 session documentation remain unrecorded.
- Human test: start `node server.mjs`, open `http://127.0.0.1:5186`, select a rocket, part, and companion style, authorize Realtime, then change a simulation slider; confirm both opening and subsequent spoken replies name the current scene.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-18 — Realtime data-channel causal-event proof

- Change: extracted `buildRealtimeTutorTurnEvents()` and routed `requestRealtimeResponse()` through it, making the actual subsequent `conversation.item.create` payload a pure, no-network test surface.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs`, `node --check app.js`, `node --check realtime-context.mjs`, and `node --check server.mjs` passed; a temporary local server returned HTTP 200 for `/`.
- Proof: `outputs/realtime-data-channel-causal-event-test-2026-07-18.txt` asserts the outgoing data-channel event contains the selected voice style, rocket, part, lesson, changed phase/T-W/altitude/Max-Q, and live app context, while rejecting stale T/W.
- Blocker: no authorized microphone/WebRTC session was run; local event-payload proof does not prove a live Realtime response.
- Human test: start `node server.mjs`, open `http://127.0.0.1:5186`, select a rocket part and companion style, authorize Realtime, then change a slider; confirm the opening and later spoken replies name the selected and changed lab state.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-17 — Realtime setup retry cleanup

- Change: failed local microphone/WebRTC setup now closes the temporary peer connection and stops every just-acquired track before reporting an error, so a learner can retry without a stale mic/connection resource.
- Checks: `node --test test/realtime-session.test.mjs test/realtime-context.test.mjs`, `node --check app.js`, and `node --check realtime-session.mjs` passed; temporary local server returned HTTP 200 for `/`.
- Proof: `outputs/realtime-setup-cleanup-2026-07-17.txt`.
- Blocker: no authorized microphone/WebRTC session was run; retry cleanup is local evidence, not live Realtime proof.
- Human test: start `node server.mjs`, open `http://127.0.0.1:5186`, select a rocket part and companion style, then use Realtime with an authorized key; verify the opening tutor turn and a later slider-change reply name the live scene.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-17 — Realtime causal state-change regression proof

- Change: extended the no-network Realtime context test so a subsequent slider-change turn uses a changed simulation snapshot and asserts that updated Max-Q, T/W, and altitude appear while opening values do not persist.
- Checks: `node --test test/realtime-context.test.mjs`, `node --check app.js`, and `node --check server.mjs` passed; a temporary local server returned HTTP 200 for `/`.
- Proof: `outputs/realtime-causal-state-change-test-2026-07-17.txt`.
- Blocker: no authorized microphone/WebRTC session was run; this proves client-side context construction, not model behavior.
- Human test: start `node server.mjs`, open `http://127.0.0.1:5186`, select a rocket part and companion style, use Realtime with an authorized key, change a slider, and confirm the later tutor reply names the changed scene values rather than the opening state.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-17 — Realtime causal-context unit proof

- Change: extracted `realtime-context.mjs`, a pure builder shared by the browser opening WebRTC context and subsequent data-channel tutor prompts; both now carry the selected voice-style ID, rocket, part, lesson, and live simulation snapshot.
- Checks: `node --test test/realtime-context.test.mjs`, `node --check app.js`, and `node --check server.mjs` passed; temporary local server returned HTTP 200 for `/`.
- Proof: `outputs/realtime-causal-context-test-2026-07-17.txt`.
- Blocker: no authorized microphone/WebRTC session was run; this is local causal-context evidence only.
- Human test: start `node server.mjs`, open `http://127.0.0.1:5186`, select a rocket part and companion style, then use Realtime with an authorized key; confirm the opening greeting and a later slider-change reply name the current scene rather than stale/default facts.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-17 — Realtime opening-turn grounding

- Concept: ensure the live tutor receives the current companion style and scene hint when the WebRTC session is created, before any later data-channel event.
- Change: local `server.mjs` now forwards bounded `voiceStyle` and `voiceContext` into Realtime session instructions; README now documents the actual `/api/realtime-call` SDP contract for local and Vercel use.
- Files: `server.mjs`, `README.md`, `outputs/realtime-grounding-smoke-2026-07-17.txt`.
- Checks: `node --check server.mjs`, `node --check app.js`, and `node --check rocket-three-scene.js` passed; temporary local server returned HTTP 200 for `/`.
- Proof: `outputs/realtime-grounding-smoke-2026-07-17.txt`.
- Blocker: no authorized microphone/WebRTC session was run. A malformed synthetic SDP returned HTTP 400 and is not Realtime-session proof.
- Human test: start `node server.mjs`, open `http://127.0.0.1:5186`, select a rocket part, choose a companion style, and use Realtime with an authorized key; verify the opening tutor turn names the selected scene.
- Next move: add a no-network unit harness for Realtime session payload construction before any future endpoint smoke test.

## 2026-07-18 — Realtime client causal-wiring proof

- Change: added `test/realtime-client-wiring.test.mjs`, a no-network regression test that locks the browser client to the pure opening-context builder for the SDP request, a fresh causal snapshot for subsequent data-channel events, and data-channel readiness before requesting the opening tutor turn.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` passed (3/3); `node --check app.js`, `node --check realtime-context.mjs`, `node --check realtime-session.mjs`, and `node --check server.mjs` passed; local HTTP GET `/` returned `HTTP/1.1 200 OK`.
- Proof: `outputs/realtime-client-wiring-test-2026-07-18.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session was run, and source-level wiring cannot prove a live tutor response.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one connected session; capture both the opening selected-state response and the changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-18 — Realtime human-gate status regression

- Change: added one no-network assertion that the connected Voice companion control exposes `Realtime live`, the exact status named by the authorized human-test protocol and evidence template.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` passed (3/3); `node --check app.js` and `node --check server.mjs` passed; local HTTP GET `/` returned 200 and contained `Rocket Agent Lab`.
- Proof: `outputs/realtime-human-gate-state-test-2026-07-18.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session was run. This label regression does not establish a live tutor response.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one connected session; record the selected-state opening response and the changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.

## 2026-07-19 — Realtime human-response instruction proof

- Change: tightened the pure opening and subsequent Realtime contexts so the opening reply is explicitly instructed to name the selected rocket, part, lesson, and voice-style ID, while later turns are explicitly instructed to ground in the current selected state and relevant changed simulation value. This aligns the outgoing instruction contract with the authorized human-test pass rule.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` passed (3/3); `node --check realtime-context.mjs`, `node --check app.js`, and `node --check server.mjs` passed; local HTTP GET `/` returned `HTTP/1.1 200 OK` and contained `Rocket Agent Lab`.
- Proof: `outputs/realtime-human-response-instruction-test-2026-07-19.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; an authorized microphone/WebRTC session is still required to prove the live tutor actually follows these causal instructions.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one connected session, recording the opening selected-state response and the changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.
## 2026-07-19 — Realtime data-channel-close retry cleanup

- Change: an unexpected live Realtime `oai-events` data-channel close now releases the companion and provides a reconnectable status, while stale/non-live channel closes are ignored.
- Checks: `node --test test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` passed (3/3); `node --check app.js` and `node --check server.mjs` passed; bounded-retry local HTTP GET `/` returned 200 and contained `Rocket Agent Lab`.
- Proof: `outputs/realtime-data-channel-close-cleanup-test-2026-07-19.txt`.
- Blocker: `HUMAN_TEST=BLOCKED`; no authorized microphone/WebRTC session was run, so this no-network cleanup proof does not establish a live grounded tutor reply.
- Human test: complete `outputs/realtime-human-test-evidence-template.md` during one connected session; record the selected-state opening response and the changed-slider response.
- Next move: run that one authorized microphone/WebRTC session; do not add visual polish before it passes.
## 2026-07-19 — causal engine-out proof vertical slice

- Change: added a deterministic engine-out evaluator and a compact in-product before/after proof card. The learner can hold the configuration constant, reduce engine health from 100% to 67%, see the exact T/W, delta-v, Max-Q, and modeled-risk consequences, then ask GPT Realtime to coach from that receipt.
- Checks: `node --test test/causal-engine-lesson.test.mjs test/realtime-context.test.mjs test/realtime-session.test.mjs test/realtime-client-wiring.test.mjs` passed (4/4); `node --check app.js` passed; the real browser produced `NO LIFTOFF`, `1.23 → 0.82` T/W, an enabled proof-grounded Realtime action, and zero console errors.
- Proof: `outputs/rocket-agent-lab-engine-out-proof-card-2026-07-19.png` and `test/causal-engine-lesson.test.mjs`.
- Devpost: founder-voice draft written in `DEVPOST_DRAFT.md`; README now includes supported platforms, judge smoke, exact Build Week session, and provenance.
- Blocker: the deterministic loop is verified, but a live authorized microphone/WebRTC response and final public demo video remain human gates.
- Stop: do not add more rocket catalog breadth. Next work is repository/judge access, Devpost metadata, the one live voice check, and video.
