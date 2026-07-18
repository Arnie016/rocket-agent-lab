# Rocket Agent Lab — founder voice notes

**Status: FOUNDER DRAFT CAPTURED — final read-aloud approval still required.**

## Where this came from

- **Project origin:** I love astrophysics and rocket engineering, especially the parts people recognize but do not really understand: Raptor engines, Max-Q, staging, thrust-to-weight, why a rocket that looks powerful can still fail.
- **The frustration:** Most rocket learning is a diagram plus a paragraph or a video you cannot touch. You see the conclusion after the interesting engineering decision has already been made.
- **Personal stakes:** I want people to feel the consequence of one decision, not memorize rocket trivia. If engine health or payload changes, the model and the tutor must both react to that exact change.

## Deliberate taste and decisions

- **What the product must feel like:** A real lab you can push until it fails, but still understandable without being a rocket scientist.
- **Why causal voice, not generic narration:** A voice saying “great job” over a simulation is not teaching. It should see the same T/W, Max-Q, altitude, selected engine, lesson, and control change that I see.
- **Why state must stay connected:** Otherwise it becomes the exact fake AI layer I dislike: fluent, impressive, and detached from what actually happened.
- **What I deliberately rejected:** More decorative rocket pieces without a teaching loop; long narration; pretending a local payload test proves a live Realtime response; merging this with Light Years From Home just because both involve space.

## Corrections and failed attempts

- **Failed attempt:** The first Realtime path could open before the state-backed data channel was ready, and later replies could be grounded in an older slider snapshot.
- **Why it failed:** The tutor sounded plausible but could teach from the wrong rocket state.
- **Correction:** Opening and subsequent turns now share a causal context builder; later turns take a fresh snapshot. The engine-out lesson computes a deterministic before/after receipt before GPT is asked to explain it.
- **What still needs a human test:** A connected microphone/WebRTC session must prove opening and changed-state replies are grounded before this can be called complete.

## Collaboration record for an eventual draft

- **Human decisions to preserve:** Keep the product separate from Light Years; isolate one variable; make the proof visible; do not hide a blocked live-voice test; do not add controls unless they produce a visible consequence.
- **Codex/GPT-5.6 contribution:** Session `019f5e81-8bde-79d1-b2d6-416776726a63` helped convert the idea into the causal engine proof contract, tests, UI, and submission evidence. Arnav chose the one-variable engine lesson and rejected a broader space-app merge.
- **Words or claims to avoid:** “revolutionary,” “seamless,” “cutting-edge,” “AI-powered platform,” or any claim that the educational model is flight-certified engineering software.

## Drafting boundary

Any future Devpost prose must remain `HUMAN_EDIT_REQUIRED` until Arnav rewrites or approves it. It should use this record to connect the personal reason for the project, the causal implementation evidence, and the learner outcome without turning this into generic space content.
