# Rocket Agent Lab — Build Week submission gate

Deadline: **July 21, 2026, 5:00 PM PT**. This is a live status ledger, not a claim that a submission is ready.

| Gate | Status | Evidence / next action |
| --- | --- | --- |
| Build and run proof | Local proof present | `node server.mjs` serves the app at `http://127.0.0.1:5186`; latest local proof: `outputs/submission-proof-freshness-2026-07-22T2101Z.txt`. Re-run before handoff. |
| Primary / feedback Session ID | Recorded; final `/feedback` retrieval still required | Primary build task: `019f5e81-8bde-79d1-b2d6-416776726a63`. Retrieve it through `/feedback` immediately before final submission. |
| GPT-5.6 contribution | Documented | `README.md`, `DEVPOST_DRAFT.md`, and `DEVPOST_VOICE_NOTES.md` record the causal-context/evaluator contribution and the human decisions that constrained it. |
| Demo video | Draft asset exists; final URL still required | Existing local trailer: `trailer/out/rocket-agent-lab-trailer.mp4`. Before final submission, upload a <3 minute YouTube video (public or unlisted) and set this URL: `https://www.youtube.com/watch?v=YOUR_VIDEO_ID`. The required narration should explicitly mention what changed after July 13 and how Codex + GPT-5.6 shaped the architecture and tutoring path. |
| Repository URL and visibility | PASS — public | `https://github.com/Arnie016/rocket-agent-lab`. Public access removes the private-repository email invitation requirement. Secret scan passed before push; commit email uses GitHub noreply. |
| README setup and collaboration disclosure | PASS | README includes setup, platforms, judge smoke, post-July-13 scope, proof links, exact build task, and human/Codex/GPT-5.6 decisions. |
| Devpost draft | PASS — project created | `https://devpost.com/software/rocket-agent-lab` (project `1350724`) has founder-language description, technologies, public repo, and proof thumbnail. `DEVPOST_SUBMISSION_ANSWERS.md` records every custom answer. Do not final-submit before video and human voice gate. |
| Human test | BLOCKED — required | Run one authorized microphone/WebRTC session: change rocket/part/style and a simulation slider; verify the opening and subsequent spoken replies name the current state. Capture only approved evidence in `outputs/realtime-human-test-evidence-template.md`. |
| Team members | N/A | No collaborators recorded. |
| Final-submit gate | BLOCKED | Do not submit until every row above is evidenced and Arnav explicitly approves final submission. |

## Closest missing gate

**Authorized microphone/WebRTC human test.** The no-network builder and actual data-channel event tests already show causal context, but they cannot establish that a real Realtime response is heard and grounded in the changed scene.
