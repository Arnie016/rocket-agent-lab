# Authorized Realtime human-test protocol

Status: `HUMAN_TEST=BLOCKED` until a person runs this with an authorized Realtime key and browser microphone permission.

## Purpose

Confirm the real WebRTC tutor—not a mock or static UI button—uses the selected Rocket Agent Lab state in its opening and later responses.

## Run

1. Start the app with an authorized server-side key: `OPENAI_API_KEY=... node server.mjs`.
2. Open `http://127.0.0.1:5186` in a WebRTC-capable browser. Enable the voice companion, choose one rocket, one part, and one companion style, then select **Realtime** and grant microphone access.
3. Wait for the visible status **Realtime live**. Ask one short opening question about the selected part. Record whether the heard or visible transcript names the selected rocket, part, lesson, and companion style.
4. Change one simulation slider so its displayed value is visibly different (for example altitude, T/W, or Max-Q), then ask: “What changed in this lab?”
5. Record whether the next heard or visible transcript names the changed value and does not repeat only the opening value.
6. End the live session and stop the local server.

Record the result in [`realtime-human-test-evidence-template.md`](realtime-human-test-evidence-template.md). Leave the status as `BLOCKED` or mark it `FAIL` unless both pass-rule observations are actually captured.

## Evidence to capture

- Date/time, browser, selected rocket, selected part, selected lesson, and companion style.
- The exact changed simulation label and its before/after displayed values.
- Whether the UI reached **Realtime live**.
- A concise pass/fail note for the opening turn and subsequent changed-state turn. Screenshots may crop everything except the app UI; never capture or paste API keys, raw SDP, or browser credential dialogs.

## Pass rule

Pass only when the connected session produces both: (1) an opening response grounded in the selected scene, and (2) a later response grounded in the changed simulation state. Any connection failure, missing audio/transcript, or stale response is `HUMAN_TEST=FAIL` or `BLOCKED`, not a pass.
