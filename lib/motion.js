/* KruAu motion helpers: camera + MediaPipe pose (runs on the device, no video leaves it) and device tilt. */
import { FilesetResolver, PoseLandmarker } from "./mediapipe/vision_bundle.mjs";

const MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
let landmarker = null, stream = null, loading = null;

export async function initPose(){
  if (landmarker) return landmarker;
  if (loading) return loading;
  loading = (async () => {
    const base = new URL("./mediapipe/wasm", import.meta.url).href;
    const files = await FilesetResolver.forVisionTasks(base);
    let lastErr = null;
    for (const delegate of ["GPU", "CPU"]){
      try {
        landmarker = await PoseLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: MODEL, delegate },
          runningMode: "VIDEO", numPoses: 1,
          minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5
        });
        return landmarker;
      } catch (e){ lastErr = e; }
    }
    loading = null;
    throw lastErr;
  })();
  return loading;
}

export async function startCamera(video){
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("no-camera-api");
  if (!stream || !stream.active){
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
  }
  video.srcObject = stream; video.muted = true; video.playsInline = true; video.setAttribute("playsinline", "");
  await video.play();
  return stream;
}

export function stopCamera(){
  if (stream){ stream.getTracks().forEach(t => t.stop()); stream = null; }
}

let lastTs = -1;
/* returns the points to use as "hands" in mirrored, normalised screen coordinates: [{x,y,side}] */
export function detectHands(video){
  if (!landmarker || !video || video.readyState < 2) return null;
  let ts = performance.now();
  if (ts <= lastTs) ts = lastTs + 1;
  lastTs = ts;
  const r = landmarker.detectForVideo(video, ts);
  const lm = r && r.landmarks && r.landmarks[0];
  if (!lm) return [];
  const out = [];
  for (const [idx, wrist, side] of [[19, 15, "left"], [20, 16, "right"]]){
    const p = lm[idx] && (lm[idx].visibility ?? 1) > 0.35 ? lm[idx] : (lm[wrist] && (lm[wrist].visibility ?? 1) > 0.35 ? lm[wrist] : null);
    if (p) out.push({ x: 1 - p.x, y: p.y, side });
  }
  return out;
}

/* ---------- tilt ---------- */
export async function requestTilt(){
  const D = window.DeviceOrientationEvent;
  if (!D) return "unsupported";
  if (typeof D.requestPermission === "function"){
    try { return (await D.requestPermission()) === "granted" ? "granted" : "denied"; } catch (e){ return "denied"; }
  }
  return "granted";
}
/* left-right tilt in degrees, positive = tilted right, corrected for screen orientation */
export function tiltFrom(e){
  const ang = (screen.orientation && typeof screen.orientation.angle === "number") ? screen.orientation.angle : (window.orientation || 0);
  const g = e.gamma || 0, b = e.beta || 0;
  if (ang === 90) return b;
  if (ang === -90 || ang === 270) return -b;
  if (ang === 180) return -g;
  return g;
}

/* ---------- playing inside KruAu (iframe) ---------- */
export const IN_FRAME = (() => { try { return window.self !== window.top; } catch (e){ return true; } })();
/* help line shown when camera/tilt fails inside an iframe: open the game over the whole page (same tab) */
export function frameHelp(){
  if (!IN_FRAME) return "";
  const u = location.href.split("#")[0];
  return `<div class="frame-escape">ในเว็บ KruAu บางเครื่องไม่ยอมให้ใช้กล้อง/เซนเซอร์ — <a href="${u}" target="_top">▶ เปิดเกมเต็มหน้าจอ</a> (กลับมาด้วยปุ่ม ← กลับ) หรือ <a href="${u}" target="_blank" rel="noopener">แท็บใหม่ ↗</a></div>`;
}
/* "back" button when the game replaced the KruAu page in the same tab */
export function addBackButton(){
  if (IN_FRAME || history.length < 2) return;
  const bar = document.querySelector(".topbar");
  if (!bar || bar.querySelector(".home-back")) return;
  const b = document.createElement("button");
  b.type = "button"; b.className = "sound-btn home-back"; b.textContent = "← กลับ";
  b.onclick = () => history.back();
  bar.insertBefore(b, bar.firstChild);
}
