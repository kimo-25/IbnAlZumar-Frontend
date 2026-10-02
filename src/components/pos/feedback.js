// File: src/utils/pos/feedback.js
// إشارات صوتية خفيفة للسكانر. بتستخدم Web Audio مباشرة عشان ما نضيفش أي dependency.
// مفيش أي حاجة بتتحفظ على القرص، والـ AudioContext بيتفتح أول مرة بس.

let audioCtx = null;

function getCtx() {
  if (audioCtx) return audioCtx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

function beep(freq, durationSec, gainValue = 0.05) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    // بعض المتصفحات بتحتاج resume بعد أول تفاعل مع المستخدم
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = gainValue;
    osc.connect(gain).connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    osc.stop(now + durationSec);
  } catch {
    /* صوت best-effort */
  }
}

export function playScanSuccess() {
  beep(1250, 0.07, 0.05);
}

export function playScanError() {
  beep(320, 0.18, 0.06);
}