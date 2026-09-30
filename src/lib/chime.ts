// Two-note chime played when a class goes live while the app is open.
// Browsers only allow audio after a tap, so enableChime() runs from the toggle.

let audio: AudioContext | null = null;

export function enableChime() {
  try {
    audio ??= new AudioContext();
    void audio.resume();
  } catch {
    audio = null;
  }
}

export function playChime() {
  if (audio) {
    try {
      [880, 1175].forEach((freq, i) => {
        const osc = audio!.createOscillator();
        const gain = audio!.createGain();
        const t = audio!.currentTime + i * 0.22;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        osc.connect(gain).connect(audio!.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    } catch {
      // Audio is a nice-to-have; the on-screen alert still shows.
    }
  }
  navigator.vibrate?.([200, 100, 200]);
}
