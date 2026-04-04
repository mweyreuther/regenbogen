const STORAGE_KEY = "regenbogen:sounds";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = 0.15;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function useSoundEffects() {
  const enabled = useState("regenbogen-sounds", () => {
    if (import.meta.server) return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  function setEnabled(value: boolean) {
    enabled.value = value;
    localStorage.setItem(STORAGE_KEY, String(value));
  }

  function playClick() {
    if (!enabled.value) return;
    playTone(880, 0.06, "sine");
  }

  return {
    soundEnabled: enabled,
    setSoundEnabled: setEnabled,
    playClick,
  };
}
