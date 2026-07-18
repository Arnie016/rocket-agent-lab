# Realtime human-test evidence record

Status: `HUMAN_TEST=BLOCKED`

Use this only during one authorized local microphone/WebRTC session. Do not include API keys, raw SDP, credentials, or browser permission dialogs.

## Session

- Date/time:
- Tester:
- Browser/version:
- Local URL:
- Realtime connection state observed: `Realtime live` / other:

## Selected lab state

- Rocket:
- Part:
- Lesson:
- Companion style:
- Opening question:
- Opening response: heard / visible transcript / neither:
- Opening grounding result: `PASS` / `FAIL` — name the specific rocket, part, lesson, and style evidence:

## Changed-state turn

- Changed simulation label:
- Before displayed value:
- After displayed value:
- Question: `What changed in this lab?`
- Subsequent response: heard / visible transcript / neither:
- Changed-state grounding result: `PASS` / `FAIL` — name the updated value evidence and any stale value repeated:

## Result

- Final status: `HUMAN_TEST=PASS` / `HUMAN_TEST=FAIL` / `HUMAN_TEST=BLOCKED`
- Pass rule check: opening grounded + changed-state grounded:
- Approved screenshot/proof path (optional):
- Failure/blocker and exact visible error, if any:
- Tester notes:

Only set `HUMAN_TEST=PASS` when both grounded responses were observed in a connected real session. A static control, malformed SDP, or no-network test is not a pass.
