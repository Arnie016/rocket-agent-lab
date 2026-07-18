import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = new URL("../captures/", import.meta.url);
const url = "http://127.0.0.1:5186/";
const port = 9339;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestJson(endpoint) {
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`${endpoint} returned ${response.status}`);
  return response.json();
}

function cdpSocket(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (!data.id) return;
    const entry = pending.get(data.id);
    if (!entry) return;
    pending.delete(data.id);
    if (data.error) entry.reject(new Error(data.error.message));
    else entry.resolve(data.result);
  };
  return new Promise((resolve, reject) => {
    ws.onerror = reject;
    ws.onopen = () => {
      resolve({
        send(method, params = {}) {
          const callId = ++id;
          ws.send(JSON.stringify({ id: callId, method, params }));
          return new Promise((resolveCall, rejectCall) => {
            pending.set(callId, { resolve: resolveCall, reject: rejectCall });
          });
        },
        close() {
          ws.close();
        },
      });
    };
  });
}

async function waitForChrome() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const targets = await requestJson(`http://127.0.0.1:${port}/json`);
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      await sleep(100);
    }
  }
  throw new Error("Chrome did not expose a page target");
}

async function capture(page, name, expression = "") {
  if (expression) {
    await page.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      userGesture: true,
    });
    await sleep(900);
  }
  const shot = await page.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    fromSurface: true,
  });
  await writeFile(new URL(`${name}.png`, outDir), Buffer.from(shot.data, "base64"));
}

await mkdir(outDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  "--user-data-dir=/tmp/rocket-agent-trailer-chrome",
  "--disable-gpu",
  "--use-gl=swiftshader",
  "--enable-unsafe-swiftshader",
  "--no-first-run",
  "--no-default-browser-check",
  "--window-size=1600,1000",
  url,
], { stdio: "ignore" });

try {
  const wsUrl = await waitForChrome();
  const page = await cdpSocket(wsUrl);
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Page.navigate", { url });
  await sleep(2200);

  await capture(page, "01-hero");
  await capture(page, "02-cutaway-labels", `
    document.querySelector("#cutawayToggle")?.click();
    document.querySelector("#labelToggle")?.click();
    document.querySelector("#labelDensityToggle")?.click();
    document.querySelector("[data-panel-jump='learn']")?.click();
    true;
  `);
  await capture(page, "03-maxq-lab", `
    document.querySelector("[data-mission='maxq']")?.click();
    document.querySelector("#dragSlider").value = 1.55;
    document.querySelector("#dragSlider").dispatchEvent(new Event("input", {bubbles:true}));
    document.querySelector("#windSlider").value = 0.72;
    document.querySelector("#windSlider").dispatchEvent(new Event("input", {bubbles:true}));
    document.querySelector("#guidanceSlider").value = 0.24;
    document.querySelector("#guidanceSlider").dispatchEvent(new Event("input", {bubbles:true}));
    true;
  `);
  await capture(page, "04-trajectory", `
    document.querySelector("[data-panel-jump='trajectoryPlanner']")?.click();
    document.querySelector("[data-destination='mars']")?.click();
    true;
  `);
  await capture(page, "05-astra", `
    document.querySelector("[data-panel-jump='agentRuntime']")?.click();
    document.querySelector("[data-agent-preset='scene']")?.click();
    true;
  `);
  await capture(page, "06-launch", `
    document.querySelector("[data-panel-jump='flightLab']")?.click();
    document.querySelector("#launchTest")?.click();
    true;
  `);

  await page.close();
} finally {
  chrome.kill("SIGTERM");
}

console.log("Captured trailer states.");
