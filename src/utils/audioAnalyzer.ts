// Audio capture and analysis module (optimized for performance)

export type AudioSourceType = "none" | "tab" | "mic" | "file" | "mixer";

// Global state
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let dataArray: Uint8Array | null = null;
let mediaStream: MediaStream | null = null;
let audioElement: HTMLAudioElement | null = null;
let sourceNode:
  | MediaStreamAudioSourceNode
  | MediaElementAudioSourceNode
  | null = null;
let isCapturing = false;
let currentSourceType: AudioSourceType = "none";

// Mixer mode state
let mixerGain: GainNode | null = null;
const connectedElements = new Map<string, MediaElementAudioSourceNode>();
const registeredElements = new Map<
  string,
  HTMLAudioElement | HTMLVideoElement
>();

// Frame‑level frequency cache (one call per animation frame)
let cachedFrameId = -1;
let cachedDataArray: Uint8Array | null = null;

// Analyzer configuration
export interface AudioAnalyzerConfig {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  freqStartIndex: number;
  freqLength: number;
}

const DEFAULT_CONFIG: AudioAnalyzerConfig = {
  fftSize: 8192,
  smoothingTimeConstant: 0.03,
  minDecibels: -85,
  maxDecibels: -22,
  freqStartIndex: 4,
  freqLength: 25,
};

const CONFIG: AudioAnalyzerConfig = { ...DEFAULT_CONFIG };

// Beat detection configuration and circular buffers
const BEAT_CONFIG = {
  historySize: 43,
  beatThreshold: 1.35,
  cooldownFrames: 8,
  beatDecay: 0.92,
  beatMultiplier: 1.5,
};

interface BandBeatState {
  history: Float32Array;
  index: number;
  count: number;
  beatCooldown: number;
  lastBeatIntensity: number;
}

function createBandState(): BandBeatState {
  return {
    history: new Float32Array(BEAT_CONFIG.historySize),
    index: 0,
    count: 0,
    beatCooldown: 0,
    lastBeatIntensity: 0,
  };
}

const bandBeatState = {
  bass: createBandState(),
  mid: createBandState(),
  high: createBandState(),
};

// Pre‑computed FFT bin indices (updated when audioContext is ready)
let BASS_START = 0,
  BASS_END = 0,
  MID_START = 0,
  MID_END = 0,
  HIGH_START = 0,
  HIGH_END = 0;

function computeBinIndices() {
  if (!audioContext || !analyser) return;
  const { sampleRate } = audioContext;
  const { fftSize } = analyser;
  const binCount = analyser.frequencyBinCount;
  const f2b = (freq: number) => Math.round((freq * fftSize) / sampleRate);
  BASS_START = Math.max(1, f2b(20));
  BASS_END = Math.min(binCount, f2b(250));
  MID_START = Math.min(binCount, f2b(250));
  MID_END = Math.min(binCount, f2b(4000));
  HIGH_START = Math.min(binCount, f2b(4000));
  HIGH_END = Math.min(binCount, f2b(16000));
}

// =====================
// Config Functions
// =====================
export function getDefaultAnalyzerConfig(): AudioAnalyzerConfig {
  return { ...DEFAULT_CONFIG };
}

export function getAnalyzerConfig(): AudioAnalyzerConfig {
  return { ...CONFIG };
}

export function updateAnalyzerConfig(
  newConfig: Partial<AudioAnalyzerConfig>
): void {
  Object.assign(CONFIG, newConfig);
  if (analyser) {
    if (newConfig.fftSize !== undefined) {
      analyser.fftSize = newConfig.fftSize;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      cachedDataArray = null;
      cachedFrameId = -1;
      computeBinIndices();
    }
    if (newConfig.smoothingTimeConstant !== undefined)
      analyser.smoothingTimeConstant = newConfig.smoothingTimeConstant;
    if (newConfig.minDecibels !== undefined)
      analyser.minDecibels = newConfig.minDecibels;
    if (newConfig.maxDecibels !== undefined)
      analyser.maxDecibels = newConfig.maxDecibels;
  }
}

export function getAudioSourceType(): AudioSourceType {
  return currentSourceType;
}

export function isAudioCaptureActive(): boolean {
  return isCapturing && analyser !== null;
}

// =====================
// Internal Helpers
// =====================
function initAudioContext(): void {
  if (!audioContext) audioContext = new AudioContext();
  if (!analyser) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = CONFIG.fftSize;
    analyser.smoothingTimeConstant = CONFIG.smoothingTimeConstant;
    analyser.minDecibels = CONFIG.minDecibels;
    analyser.maxDecibels = CONFIG.maxDecibels;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    computeBinIndices();
  }
}

function getCachedFrequencyData(): Uint8Array | null {
  if (!analyser || !dataArray) return null;
  const frame = Math.floor(performance.now() / 16);
  if (frame !== cachedFrameId) {
    analyser.getByteFrequencyData(dataArray);
    cachedFrameId = frame;
    cachedDataArray = dataArray;
  }
  return cachedDataArray;
}

function savitskyGolaySmooth(
  array: number[],
  smoothingPoints = 5,
  smoothingPasses = 1
): number[] {
  const side = Math.floor(smoothingPoints / 2);
  const cn = 1 / (2 * side + 1);
  const result = array.slice();
  for (let i = side; i < array.length - side; i++) {
    let sum = 0;
    for (let n = -side; n <= side; n++) sum += cn * array[i + n];
    result[i] = sum;
  }
  return result;
}

function pushBandHistory(state: BandBeatState, value: number) {
  state.history[state.index] = value;
  state.index = (state.index + 1) % BEAT_CONFIG.historySize;
  if (state.count < BEAT_CONFIG.historySize) state.count++;
}

function averageBandHistory(state: BandBeatState): number {
  if (state.count === 0) return 0;
  let sum = 0;
  for (let i = 0; i < state.count; i++) sum += state.history[i];
  return sum / state.count;
}

function detectBandBeat(state: BandBeatState, currentEnergy: number): number {
  const { beatThreshold, cooldownFrames, beatDecay } = BEAT_CONFIG;
  pushBandHistory(state, currentEnergy);
  if (state.count < 10) {
    state.lastBeatIntensity *= beatDecay;
    return state.lastBeatIntensity;
  }
  const avg = averageBandHistory(state);
  if (state.beatCooldown > 0) state.beatCooldown--;
  const isBeat =
    state.beatCooldown === 0 &&
    currentEnergy > avg * beatThreshold &&
    currentEnergy > 0.08;
  if (isBeat) {
    const intensity = Math.min(1, (currentEnergy - avg) / avg);
    state.lastBeatIntensity = Math.max(state.lastBeatIntensity, intensity);
    state.beatCooldown = cooldownFrames;
  }
  state.lastBeatIntensity *= beatDecay;
  return state.lastBeatIntensity;
}

export function resetBeatDetection(): void {
  Object.assign(bandBeatState, {
    bass: createBandState(),
    mid: createBandState(),
    high: createBandState(),
  });
}

// =====================
// Audio Capture Functions
// =====================
export async function startTabCapture(): Promise<boolean> {
  if (isCapturing && currentSourceType === "tab") return true;
  stopAudioCapture();
  try {
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "browser" },
      audio: { suppressLocalAudioPlayback: false },
      // @ts-ignore – extra options not in TS defs yet
      selfBrowserSurface: "include",
      systemAudio: "include",
      surfaceSwitching: "include",
      monitorTypeSurfaces: "include",
    } as DisplayMediaStreamOptions);
    const audioTracks = mediaStream.getAudioTracks();
    if (audioTracks.length === 0) {
      stopAudioCapture();
      return false;
    }
    initAudioContext();
    sourceNode = audioContext!.createMediaStreamSource(mediaStream);
    sourceNode.connect(analyser!);
    audioTracks[0].addEventListener("ended", stopAudioCapture);
    isCapturing = true;
    currentSourceType = "tab";
    return true;
  } catch (e) {
    console.error("Tab capture failed:", e);
    stopAudioCapture();
    return false;
  }
}

export async function startMicCapture(): Promise<boolean> {
  if (isCapturing && currentSourceType === "mic") return true;
  stopAudioCapture();
  if (!navigator.mediaDevices?.getUserMedia) {
    alert("Microphone access requires HTTPS.");
    return false;
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    initAudioContext();
    sourceNode = audioContext!.createMediaStreamSource(mediaStream);
    sourceNode.connect(analyser!);
    mediaStream.getAudioTracks()[0].addEventListener("ended", stopAudioCapture);
    isCapturing = true;
    currentSourceType = "mic";
    return true;
  } catch (e) {
    console.error("Mic capture failed:", e);
    alert(`Mic error: ${(e as Error).message}`);
    stopAudioCapture();
    return false;
  }
}

export async function startFileCapture(file: File): Promise<boolean> {
  stopAudioCapture();
  try {
    audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);
    audioElement.loop = true;
    audioElement.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      audioElement!.oncanplaythrough = () => resolve();
      audioElement!.onerror = () => reject(new Error("Failed to load audio"));
    });
    initAudioContext();
    if (audioContext!.state === "suspended") await audioContext!.resume();
    sourceNode = audioContext!.createMediaElementSource(audioElement);
    sourceNode.connect(analyser!);
    sourceNode.connect(audioContext!.destination);
    await audioElement.play();
    isCapturing = true;
    currentSourceType = "file";
    return true;
  } catch (e) {
    console.error("File capture failed:", e);
    stopAudioCapture();
    return false;
  }
}

export function stopAudioCapture(): void {
  if (currentSourceType === "mixer") return;
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
  if (audioElement) {
    audioElement.pause();
    const src = audioElement.src;
    if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
    audioElement.src = "";
    audioElement.load();
    audioElement = null;
  }
  if (sourceNode) {
    try {
      sourceNode.disconnect();
    } catch {}
    sourceNode = null;
  }
  cachedDataArray = null;
  cachedFrameId = -1;
  isCapturing = false;
  currentSourceType = "none";
  resetBeatDetection();
}

// =====================
// Mixer Mode Functions
// =====================
export function registerAudioElement(
  id: string,
  element: HTMLAudioElement | HTMLVideoElement
): void {
  registeredElements.set(id, element);
  if (currentSourceType === "mixer" && mixerGain && audioContext) {
    connectElement(id, element).catch(() => {});
  }
}

export function unregisterAudioElement(id: string): void {
  registeredElements.delete(id);
  disconnectElement(id);
}

export async function initMixerMode(): Promise<boolean> {
  if (currentSourceType === "mixer" && audioContext && mixerGain && analyser)
    return true;
  try {
    if (currentSourceType !== "none" && currentSourceType !== "mixer")
      stopAudioCapture();
    if (!audioContext || audioContext.state === "closed")
      audioContext = new AudioContext();
    if (audioContext.state === "suspended") await audioContext.resume();
    if (!analyser) {
      analyser = audioContext.createAnalyser();
      analyser.fftSize = CONFIG.fftSize;
      analyser.smoothingTimeConstant = CONFIG.smoothingTimeConstant;
      analyser.minDecibels = CONFIG.minDecibels;
      analyser.maxDecibels = CONFIG.maxDecibels;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      computeBinIndices();
    }
    if (!mixerGain) {
      mixerGain = audioContext.createGain();
      mixerGain.gain.value = 1;
      mixerGain.connect(analyser);
    }
    isCapturing = true;
    currentSourceType = "mixer";

    // Re‑connect any previously created sources (they were only detached from mixerGain)
    for (const [, src] of connectedElements) {
      try {
        src.connect(mixerGain!);
      } catch {}
    }

    // Connect newly registered elements that don't have a source yet
    for (const [id, element] of registeredElements) {
      if (!connectedElements.has(id)) {
        try {
          const src = audioContext.createMediaElementSource(element);
          src.connect(mixerGain);
          src.connect(audioContext.destination);
          connectedElements.set(id, src);
        } catch {}
      }
    }
    return true;
  } catch (e) {
    console.error("Mixer init failed:", e);
    return false;
  }
}

export async function connectElement(
  id: string,
  element: HTMLAudioElement | HTMLVideoElement
): Promise<boolean> {
  if (connectedElements.has(id)) return true;
  if (!(await initMixerMode())) return false;
  try {
    const src = audioContext!.createMediaElementSource(element);
    src.connect(mixerGain!);
    src.connect(audioContext!.destination);
    connectedElements.set(id, src);
    return true;
  } catch (e) {
    console.error(`Connect element "${id}" failed:`, e);
    return false;
  }
}

export function disconnectElement(id: string): void {
  const src = connectedElements.get(id);
  if (src && mixerGain) {
    try {
      src.disconnect(mixerGain);
    } catch {}
    // keep destination connection for playback
    connectedElements.delete(id);
  }
}

export function disconnectAllElements(): void {
  // Detach only from mixerGain; keep destination for playback and preserve sources for later reconnection
  for (const src of connectedElements.values()) {
    try {
      if (mixerGain) src.disconnect(mixerGain);
    } catch {}
  }
  if (mixerGain) {
    try {
      mixerGain.disconnect();
    } catch {}
    mixerGain = null;
  }
  cachedDataArray = null;
  cachedFrameId = -1;
  isCapturing = false;
  currentSourceType = "none";
  resetBeatDetection();
}

export function isElementConnected(id: string): boolean {
  return connectedElements.has(id);
}

// =====================
// Data Retrieval Functions
// =====================
export function getNormalizedFrequencyData(): number[] {
  const data = getCachedFrequencyData();
  if (!data) return new Array(CONFIG.freqLength).fill(0);
  const start = CONFIG.freqStartIndex;
  const end = Math.min(start + CONFIG.freqLength, data.length);
  const windowed = Array.from(data.slice(start, end)).map((v) => v / 255);
  // One‑pass smoothing is enough for visual quality
  return savitskyGolaySmooth(windowed, 5, 1);
}

export function getFrequencyBands(): {
  bass: number;
  mid: number;
  high: number;
} {
  if (!analyser || !audioContext) return { bass: 0, mid: 0, high: 0 };
  const data = getCachedFrequencyData();
  if (!data) return { bass: 0, mid: 0, high: 0 };

  // Single‑pass accumulation across the whole FFT array
  let bassSum = 0,
    midSum = 0,
    highSum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    if (i >= BASS_START && i < BASS_END) bassSum += v;
    else if (i >= MID_START && i < MID_END) midSum += v;
    else if (i >= HIGH_START && i < HIGH_END) highSum += v;
  }

  const bassCount = Math.max(1, BASS_END - BASS_START);
  const midCount = Math.max(1, MID_END - MID_START);
  const highCount = Math.max(1, HIGH_END - HIGH_START);

  const bassEnergy = bassSum / (bassCount * 255);
  const midEnergy = midSum / (midCount * 255);
  const highEnergy = highSum / (highCount * 255);

  const bassBeat = detectBandBeat(bandBeatState.bass, bassEnergy);
  const midBeat = detectBandBeat(bandBeatState.mid, midEnergy);
  const highBeat = detectBandBeat(bandBeatState.high, highEnergy);

  const { beatMultiplier } = BEAT_CONFIG;
  return {
    bass: Math.min(1, bassEnergy * (1 + bassBeat * beatMultiplier)),
    mid: Math.min(1, midEnergy * (1 + midBeat * beatMultiplier)),
    high: Math.min(1, highEnergy * (1 + highBeat * beatMultiplier)),
  };
}
