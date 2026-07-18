# Rocket Agent Lab

**Category:** Education  
**Tagline:** Break a rocket on purpose, see exactly why it failed, and have a Realtime tutor coach the next engineering move.

## Why I built it

I have always wanted to understand rockets at the level where one number changes and the whole vehicle stops making sense.

People know the words Raptor, Max-Q, staging and thrust-to-weight. But most rocket education is still a diagram, a paragraph, or a video where the engineering decision has already been made for you. You cannot make the payload too heavy, lose an engine, watch the margins move and then ask why.

That is what I wanted to build: a rocket lab you can push until it fails, while a tutor is looking at the exact same vehicle and exact same numbers as you.

## What it does

Rocket Agent Lab is an interactive 3D engineering classroom with 57 rocket configurations, inspectable engines and structures, focused lessons, equations, launch tests and a scene-aware GPT Realtime tutor.

The clearest demo is the causal engine lab. It holds the rocket configuration constant, changes engine health from 100% to 67%, then generates a deterministic before/after receipt. On Saturn V, the current classroom model moves T/W from 1.23 to 0.82 and marks the result **NO LIFTOFF**. Max-Q risk actually falls because the rocket never gets fast enough. That is an important distinction: a lower stress number does not mean the mission works.

Only after that receipt exists does the app send the selected rocket, part, lesson, voice style and changed values to GPT Realtime. The model explains evidence the simulator produced; it does not invent the flight result.

## The part that was harder than it looked

The first voice implementation could sound convincing while being wrong. The data channel could become ready before the app had finished attaching the current state, and a later slider reply could carry an older snapshot.

I did not want a generic narrator placed on top of a rocket animation. Opening and subsequent turns now share one bounded causal-context contract. Every later turn takes a fresh snapshot. Failed and closed WebRTC sessions release the microphone and peer connection so the learner can retry without a ghost session.

The tests explicitly reject stale T/W, altitude and Max-Q values.

## How I used Codex and GPT-5.6

I used Codex throughout the build to inspect the actual browser wiring, pull the Realtime contract into testable modules, find the opening-turn race, build deterministic tests and turn the final teaching decision into a visible proof card.

The main build session is `019f5e81-8bde-79d1-b2d6-416776726a63`. GPT-5.6 helped reason about the boundary between simulation truth and tutor judgment. I kept the simulator responsible for numbers and pass/fail outcomes. GPT is responsible for explaining the consequence in the learner's current context and giving one next experiment.

## Who this is for

This is for curious learners who have outgrown rocket trivia but are not ready for a professional flight-dynamics tool. It gives them a place to form a prediction, break one constraint, see the evidence and try again.

It is educational software, not certified aerospace analysis.

## Built during Build Week

Every capability presented for judging was built after July 13, 2026. The July 19 causal-engine proof is anchored by its Git commit, targeted tests and browser screenshot. Unrelated experiments are not part of this submission.

## Judge test

1. Install Node.js 20+ on macOS, Windows or Linux.
2. Run `node server.mjs`.
3. Open `http://127.0.0.1:5186`.
4. In Flight, press **Run engine-out**.
5. Inspect the before/after receipt and press **Ask Realtime from this proof**.

Without an API key, the deterministic rocket lab, proof card and local fallback remain testable. Live voice requires a server-side `OPENAI_API_KEY`; it is never exposed to the browser.

## Current honest boundary

The deterministic causal loop and no-network Realtime payload tests pass. The remaining human gate is one authorized microphone session proving the spoken opening and changed-state replies. The final public demo video is not recorded yet.
