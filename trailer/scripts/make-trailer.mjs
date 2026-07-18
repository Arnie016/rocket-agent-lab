import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = new URL("../../", import.meta.url);
const captures = new URL("../captures/", import.meta.url);
const audioDir = new URL("../audio/", import.meta.url);
const outDir = new URL("../out/", import.meta.url);
const tmpDir = new URL("../out/tmp/", import.meta.url);
const slideDir = new URL("../out/slides/", import.meta.url);

const ffmpeg = "/opt/homebrew/bin/ffmpeg";
const ffprobe = "/opt/homebrew/bin/ffprobe";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const voiceScript = [
  "Most rocket lessons stop at equations.",
  "Rocket Agent Lab turns the equation into a launch you can touch.",
  "Pick a real vehicle. Open the stack. See fuel, payload, thrust, drag, Max Q, and delta V move together.",
  "Make the mission fail on purpose.",
  "Then let the lab coach you back to a working design.",
  "Plan orbit. Escape. Heavy lift. Air-load recovery. Moon, Mars, Jupiter.",
  "And when the physics gets messy, ask Astra what is happening on screen.",
  "Observe. Predict. Test. Explain.",
  "Rocket science, finally playable.",
].join(" ");

const scenes = [
  {
    img: "01-hero.png",
    dur: 6.2,
    title: "ROCKET AGENT LAB",
    tag: "HOOK",
    sub: "Rocket science, finally playable",
    x: "(iw-iw/zoom)/2",
    y: "(ih-ih/zoom)/2",
  },
  {
    img: "02-cutaway-labels.png",
    dur: 7.2,
    title: "CUT INSIDE THE STACK",
    tag: "ANATOMY",
    sub: "See tanks, payload, thrust paths, and equations on the model",
    x: "(iw-iw/zoom)*0.46",
    y: "(ih-ih/zoom)*0.34",
  },
  {
    img: "03-maxq-lab.png",
    dur: 7.4,
    title: "MAKE PHYSICS FAIL",
    tag: "LAB MODE",
    sub: "Stress Max-Q, drag, wind, guidance, payload, and fuel",
    x: "(iw-iw/zoom)*0.72",
    y: "(ih-ih/zoom)*0.18",
  },
  {
    img: "04-trajectory.png",
    dur: 7.5,
    title: "PLAN BEYOND ORBIT",
    tag: "TRAJECTORY",
    sub: "Moon, Mars, and Jupiter transfers with live tradeoffs",
    x: "(iw-iw/zoom)*0.70",
    y: "(ih-ih/zoom)*0.14",
  },
  {
    img: "05-astra.png",
    dur: 7.2,
    title: "ASK ASTRA WHY",
    tag: "AGENTIC TUTOR",
    sub: "The tutor knows the scene, sliders, mission, and selected hardware",
    x: "(iw-iw/zoom)*0.76",
    y: "(ih-ih/zoom)*0.2",
  },
  {
    img: "06-launch.png",
    dur: 8.0,
    title: "LAUNCH SMARTER",
    tag: "CALL TO ACTION",
    sub: "Observe. Predict. Test. Explain.",
    x: "(iw-iw/zoom)/2",
    y: "(ih-ih/zoom)*0.35",
  },
];

await mkdir(audioDir, { recursive: true });
await mkdir(outDir, { recursive: true });
await mkdir(tmpDir, { recursive: true });
await mkdir(slideDir, { recursive: true });
await writeFile(new URL("voiceover.txt", audioDir), voiceScript);

async function generateOpenAiVoice(outputPath) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for trailer voiceover. No local macOS voice fallback is allowed.");
  }
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "cedar",
      input: voiceScript,
      response_format: "mp3",
      speed: 0.96,
      instructions: [
        "Voice direction: premium cinematic product trailer narrator.",
        "Confident, warm, modern, and human.",
        "Do not sound like an accessibility screen reader.",
        "Use controlled pacing, clear pauses, and subtle excitement.",
        "Avoid overacting, radio-announcer exaggeration, and robotic monotone.",
      ].join(" "),
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI TTS failed: ${response.status} ${body}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await writeFile(outputPath, Buffer.from(arrayBuffer));
}

const voiceMp3 = new URL("voiceover-openai.mp3", audioDir);
const voiceWav = new URL("voiceover.wav", audioDir);
await generateOpenAiVoice(voiceMp3);
await exec(ffmpeg, ["-y", "-i", voiceMp3.pathname, "-ar", "48000", "-ac", "2", voiceWav.pathname]);

const segmentPaths = [];
for (const [index, scene] of scenes.entries()) {
  const slideHtml = new URL(`tmp/slide-${index + 1}.html`, outDir);
  const slidePng = new URL(`slides/slide-${index + 1}.png`, outDir);
  const source = new URL(scene.img, captures).pathname;
  await writeFile(slideHtml, `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; margin: 0; overflow: hidden; background: #050810; }
      body { font-family: Arial, Helvetica, sans-serif; color: white; }
      .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(1.015); filter: saturate(1.05) contrast(1.04); }
      .shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,.40), rgba(0,0,0,.08) 48%, rgba(0,0,0,.22)), radial-gradient(circle at 68% 42%, rgba(93,242,193,.12), transparent 34%); }
      .hud { position: absolute; left: 92px; top: 732px; width: 1050px; min-height: 204px; border: 1px solid rgba(159,199,232,.22); border-radius: 24px; padding: 32px 42px; background: linear-gradient(115deg, rgba(5, 9, 15, .76), rgba(5, 9, 15, .48)); box-shadow: 0 28px 90px rgba(0,0,0,.52); backdrop-filter: blur(14px); }
      .tag { display: inline-flex; align-items: center; gap: 10px; color: #5df2c1; font-size: 19px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
      .tag::before { content: ""; width: 12px; height: 12px; border-radius: 999px; background: #f6b14a; box-shadow: 0 0 24px rgba(246,177,74,.9); }
      h1 { margin: 13px 0 0; font-size: 70px; line-height: .9; letter-spacing: 0; }
      p { margin: 20px 0 0; max-width: 900px; color: #c7d7e8; font-size: 30px; line-height: 1.18; font-weight: 700; }
      .brand { position: absolute; left: 92px; top: 70px; display: flex; gap: 18px; align-items: center; color: #eaf2ff; font-size: 28px; font-weight: 900; text-shadow: 0 2px 16px rgba(0,0,0,.75); }
      .mark { width: 46px; height: 46px; border: 1px solid rgba(93,242,193,.42); border-radius: 50%; background: radial-gradient(circle, rgba(93,242,193,.30), transparent 58%); box-shadow: 0 0 36px rgba(93,242,193,.24); }
      .proof { position: absolute; right: 92px; bottom: 78px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 510px; }
      .proof div { border: 1px solid rgba(159,199,232,.18); border-radius: 16px; padding: 14px 16px; background: rgba(5,9,15,.58); color: #dce8f4; font-size: 18px; font-weight: 850; }
      .proof span { display: block; margin-bottom: 6px; color: #f6b14a; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
      .line { position: absolute; left: 92px; right: 92px; bottom: 48px; height: 4px; background: linear-gradient(90deg, #5df2c1, #f6b14a, transparent); opacity: .95; box-shadow: 0 0 24px rgba(93,242,193,.24); }
    </style>
  </head>
  <body>
    <img class="bg" src="file://${source}" />
    <div class="shade"></div>
    <div class="brand"><span class="mark"></span><span>Rocket Agent Lab</span></div>
    <section class="hud">
      <div class="tag">${scene.tag}</div>
      <h1>${scene.title}</h1>
      <p>${scene.sub}</p>
    </section>
    <div class="proof">
      <div><span>Mode</span>${index < 2 ? "3D inspect" : index < 4 ? "Physics lab" : "Agent loop"}</div>
      <div><span>Proof</span>${index === 3 ? "Solar transfer" : index === 4 ? "Scene aware" : "Live UI"}</div>
      <div><span>Loop</span>${index === 5 ? "Launch" : "Learn"}</div>
    </div>
    <div class="line"></div>
  </body>
</html>`);
  await exec(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1920,1080",
    "--virtual-time-budget=1000",
    `--screenshot=${slidePng.pathname}`,
    `file://${slideHtml.pathname}`,
  ]);

  const segment = new URL(`tmp/segment-${index + 1}.mp4`, outDir);
  segmentPaths.push(segment.pathname);
  const frames = Math.round(scene.dur * 30);
  const vf = [
    "scale=1920:1080:force_original_aspect_ratio=increase",
    "crop=1920:1080",
    `zoompan=z='min(1.0+on*0.0009,1.075)':x='${scene.x}':y='${scene.y}':d=${frames}:s=1920x1080:fps=30`,
    "format=yuv420p",
  ].join(",");
  await exec(ffmpeg, [
    "-y",
    "-loop", "1",
    "-i", slidePng.pathname,
    "-t", scene.dur.toString(),
    "-vf", vf,
    "-an",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    segment.pathname,
  ]);
}

const concatFile = new URL("tmp/concat.txt", outDir);
await writeFile(concatFile, segmentPaths.map((path) => `file '${path.replaceAll("'", "'\\''")}'`).join("\n"));
const silentVideo = new URL("tmp/silent-trailer.mp4", outDir);
await exec(ffmpeg, ["-y", "-f", "concat", "-safe", "0", "-i", concatFile.pathname, "-c", "copy", silentVideo.pathname]);

const music = new URL("tmp/music.wav", outDir);
await exec(ffmpeg, [
  "-y",
  "-f", "lavfi",
  "-i", "sine=frequency=55:duration=48",
  "-f", "lavfi",
  "-i", "sine=frequency=110:duration=48",
  "-f", "lavfi",
  "-i", "anoisesrc=color=pink:duration=48:amplitude=0.045",
  "-filter_complex", "[0:a]volume=0.075[a0];[1:a]volume=0.032,tremolo=f=4:d=0.35[a1];[2:a]highpass=f=1200,lowpass=f=5200,volume=0.08,afade=t=in:st=0:d=0.6,afade=t=out:st=45:d=2[a2];[a0][a1][a2]amix=inputs=3,alimiter=limit=0.74,afade=t=in:st=0:d=1.2,afade=t=out:st=45:d=2",
  "-ar", "48000",
  "-ac", "2",
  music.pathname,
]);

const mix = new URL("tmp/mix.wav", outDir);
await exec(ffmpeg, [
  "-y",
  "-i", voiceWav.pathname,
  "-i", music.pathname,
  "-filter_complex", "[0:a]volume=1.12,acompressor=threshold=-18dB:ratio=2.2:attack=12:release=160[a0];[1:a]volume=0.55[a1];[a0][a1]amix=inputs=2:duration=longest,alimiter=limit=0.92",
  "-ar", "48000",
  "-ac", "2",
  mix.pathname,
]);

const trailer = new URL("rocket-agent-lab-trailer.mp4", outDir);
await exec(ffmpeg, [
  "-y",
  "-i", silentVideo.pathname,
  "-i", mix.pathname,
  "-c:v", "copy",
  "-c:a", "aac",
  "-b:a", "192k",
  "-shortest",
  trailer.pathname,
]);

const poster = new URL("rocket-agent-lab-poster.png", outDir);
await exec(ffmpeg, ["-y", "-ss", "00:00:04", "-i", trailer.pathname, "-frames:v", "1", poster.pathname]);

const { stdout } = await exec(ffprobe, [
  "-v", "error",
  "-show_entries", "format=duration,size",
  "-of", "default=noprint_wrappers=1",
  trailer.pathname,
]);

console.log(`Trailer: ${trailer.pathname}`);
console.log(`Poster: ${poster.pathname}`);
console.log(`Voice: ${voiceMp3.pathname}`);
console.log(stdout.trim());
