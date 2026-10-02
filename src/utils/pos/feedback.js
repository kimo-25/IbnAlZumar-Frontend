let audioContext;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;
    audioContext = new AudioContextConstructor();
  }
  return audioContext;
}

function playTone(frequency, durationMs, gainValue) {
  try {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      Promise.resolve(context.resume()).catch(() => {});
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startTime = context.currentTime;
    const endTime = startTime + durationMs / 1000;

    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(gainValue, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(endTime);
  } catch {}
}

export function playScanSuccess() {
  playTone(1250, 70, 0.05);
}

export function playScanError() {
  playTone(320, 180, 0.06);
}
