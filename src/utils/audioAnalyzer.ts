// Audio capture and analysis using getDisplayMedia, getUserMedia, or file input

// Audio source types
export type AudioSourceType = "none" | "tab" | "mic" | "file";

// Global AudioContext and Analyser singleton
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

// Config for analyzer - optimized settings from music-visualizer
export interface AudioAnalyzerConfig {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  freqStartIndex: number;
  freqLength: number;
}

// Default configuration values
const DEFAULT_CONFIG: AudioAnalyzerConfig = {
  fftSize: 8192, // Higher resolution for better frequency analysis
  smoothingTimeConstant: 0.03, // Low temporal smoothing for responsive visualization
  minDecibels: -85, // Sensitivity floor
  maxDecibels: -22, // Sensitivity ceiling
  // Frequency windowing - extract only the most useful frequency range
  freqStartIndex: 4, // Skip the lowest frequencies (usually noise)
  freqLength: 25, // Number of frequency bins to use
};

// Current config (mutable)
const CONFIG: AudioAnalyzerConfig = { ...DEFAULT_CONFIG };

// ============================================
// Frame-based frequency data caching
// Prevents multiple getByteFrequencyData calls per draw loop
// ============================================
let cachedFrameId = -1;
let cachedDataArray: Uint8Array | null = null;

/**
 * Get cached frequency data for the current frame.
 * Uses requestAnimationFrame's implied frame ID to cache data.
 * Multiple calls within the same frame will return cached data.
 */
function getCachedFrequencyData(): Uint8Array | null {
  if (!analyser || !dataArray) return null;

  // Use performance.now() floored to ~16ms (60fps) as frame identifier
  const currentFrame = Math.floor(performance.now() / 16);

  if (currentFrame !== cachedFrameId) {
    // @ts-ignore
    analyser.getByteFrequencyData(dataArray);
    cachedFrameId = currentFrame;
    cachedDataArray = dataArray;
  }

  return cachedDataArray;
}

// Get default config for reset functionality
export function getDefaultAnalyzerConfig(): AudioAnalyzerConfig {
  return { ...DEFAULT_CONFIG };
}

// Get current config
export function getAnalyzerConfig(): AudioAnalyzerConfig {
  return { ...CONFIG };
}

// Update analyzer config
export function updateAnalyzerConfig(
  newConfig: Partial<AudioAnalyzerConfig>
): void {
  Object.assign(CONFIG, newConfig);

  // If analyser exists, apply new settings immediately
  if (analyser) {
    if (newConfig.fftSize !== undefined) {
      analyser.fftSize = newConfig.fftSize;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      cachedDataArray = null;
      cachedFrameId = -1;
    }
    if (newConfig.smoothingTimeConstant !== undefined) {
      analyser.smoothingTimeConstant = newConfig.smoothingTimeConstant;
    }
    if (newConfig.minDecibels !== undefined) {
      analyser.minDecibels = newConfig.minDecibels;
    }
    if (newConfig.maxDecibels !== undefined) {
      analyser.maxDecibels = newConfig.maxDecibels;
    }
  }
}

// Get current audio source type
export function getAudioSourceType(): AudioSourceType {
  return currentSourceType;
}

// Initialize audio context and analyser
function initAudioContext(): void {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (!analyser) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = CONFIG.fftSize;
    analyser.smoothingTimeConstant = CONFIG.smoothingTimeConstant;
    analyser.minDecibels = CONFIG.minDecibels;
    analyser.maxDecibels = CONFIG.maxDecibels;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }
}

// Request permission to capture system/tab audio (Desktop only)
export async function startTabCapture(): Promise<boolean> {
  if (isCapturing && currentSourceType === "tab") {
    return true;
  }

  // Stop any existing capture first
  stopAudioCapture();

  try {
    // Request display media with audio
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "browser",
      },
      audio: {
        suppressLocalAudioPlayback: false,
      },
      // @ts-ignore - These are valid options but not in TypeScript defs yet
      selfBrowserSurface: "include",
      systemAudio: "include",
      surfaceSwitching: "include",
      monitorTypeSurfaces: "include",
    } as DisplayMediaStreamOptions);

    // Check if we got audio
    const audioTracks = mediaStream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn("No audio track in the captured stream");
      stopAudioCapture();
      return false;
    }

    // Initialize audio context and analyser
    initAudioContext();

    // Connect the stream to the analyser
    sourceNode = audioContext!.createMediaStreamSource(mediaStream);
    sourceNode.connect(analyser!);
    // Note: We don't connect to destination to avoid audio feedback

    // Listen for track ending (user stops sharing)
    audioTracks[0].addEventListener("ended", () => {
      stopAudioCapture();
    });

    isCapturing = true;
    currentSourceType = "tab";
    return true;
  } catch (error) {
    console.error("Failed to start tab audio capture:", error);
    stopAudioCapture();
    return false;
  }
}

// Capture audio from microphone (Works on mobile)
export async function startMicCapture(): Promise<boolean> {
  if (isCapturing && currentSourceType === "mic") {
    return true;
  }

  // Stop any existing capture first
  stopAudioCapture();

  // Check if mediaDevices is available (requires HTTPS)
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const msg =
      "Microphone access requires HTTPS. Please access the site via HTTPS.";
    console.error(msg);
    alert(msg);
    return false;
  }

  try {
    // Request microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    // Initialize audio context and analyser
    initAudioContext();

    // Connect the stream to the analyser
    sourceNode = audioContext!.createMediaStreamSource(mediaStream);
    sourceNode.connect(analyser!);

    // Listen for track ending
    mediaStream.getAudioTracks()[0].addEventListener("ended", () => {
      stopAudioCapture();
    });

    isCapturing = true;
    currentSourceType = "mic";
    return true;
  } catch (error) {
    console.error("Failed to start microphone capture:", error);
    alert(`Mic capture error: ${(error as Error).message || error}`);
    stopAudioCapture();
    return false;
  }
}

// Capture audio from uploaded file (Works on mobile)
export async function startFileCapture(file: File): Promise<boolean> {
  // Stop any existing capture first
  stopAudioCapture();

  try {
    // Create audio element
    audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);
    audioElement.loop = true;
    audioElement.crossOrigin = "anonymous";

    // Wait for audio to be ready
    await new Promise<void>((resolve, reject) => {
      audioElement!.oncanplaythrough = () => resolve();
      audioElement!.onerror = () =>
        reject(new Error("Failed to load audio file"));
    });

    // Initialize audio context and analyser
    initAudioContext();

    // Resume audio context if suspended (required for user interaction)
    if (audioContext!.state === "suspended") {
      await audioContext!.resume();
    }

    // Connect audio element to analyser
    sourceNode = audioContext!.createMediaElementSource(audioElement);
    sourceNode.connect(analyser!);
    sourceNode.connect(audioContext!.destination); // Play the audio

    // Start playing
    await audioElement.play();

    // Listen for audio ending
    audioElement.onended = () => {
      // Audio will loop, so this won't fire unless loop is false
    };

    isCapturing = true;
    currentSourceType = "file";
    return true;
  } catch (error) {
    console.error("Failed to start file audio capture:", error);
    stopAudioCapture();
    return false;
  }
}

// Stop audio capture and clean up
export function stopAudioCapture(): void {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  if (audioElement) {
    // Pause and stop playback
    audioElement.pause();
    audioElement.currentTime = 0;

    // Revoke blob URL before clearing (must do before clearing src)
    const currentSrc = audioElement.src;
    if (currentSrc && currentSrc.startsWith("blob:")) {
      URL.revokeObjectURL(currentSrc);
    }

    // Clear event listeners and src
    audioElement.onended = null;
    audioElement.oncanplaythrough = null;
    audioElement.onerror = null;
    audioElement.src = "";
    audioElement.load(); // Reset the element
    audioElement = null;
  }
  if (sourceNode) {
    try {
      sourceNode.disconnect();
    } catch (e) {
      // Already disconnected
    }
    sourceNode = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  analyser = null;
  dataArray = null;
  cachedDataArray = null;
  cachedFrameId = -1;
  isCapturing = false;
  currentSourceType = "none";
  resetBeatDetection();
}

/**
 * Applies the Savitsky-Golay smoothing algorithm to an array of data points.
 */
function savitskyGolaySmooth(
  array: number[],
  smoothingPoints: number = 3,
  smoothingPasses: number = 1
): number[] {
  const sidePoints = Math.floor(smoothingPoints / 2);
  const cn = 1 / (2 * sidePoints + 1);
  let lastArray = array.slice();
  let newArr: number[] = [];

  for (let pass = 0; pass < smoothingPasses; pass++) {
    for (let i = 0; i < sidePoints; i++) {
      newArr[i] = lastArray[i];
      newArr[lastArray.length - i - 1] = lastArray[lastArray.length - i - 1];
    }
    for (let i = sidePoints; i < lastArray.length - sidePoints; i++) {
      let sum = 0;
      for (let n = -sidePoints; n <= sidePoints; n++) {
        sum += cn * lastArray[i + n] + n;
      }
      newArr[i] = sum;
    }
    lastArray = newArr;
  }
  return newArr;
}

// Get normalized frequency data (0-1 range) with smoothing and frequency windowing
export function getNormalizedFrequencyData(): number[] {
  const data = getCachedFrequencyData();
  if (!data) {
    return new Array(CONFIG.freqLength).fill(0);
  }

  // Extract only the useful frequency range based on config
  const startIdx = CONFIG.freqStartIndex;
  const endIdx = Math.min(startIdx + CONFIG.freqLength, data.length);
  const windowedData = Array.from(data.slice(startIdx, endIdx));

  // Normalize to 0-1 range
  const normalized = windowedData.map((val) => val / 255);

  // Apply Savitsky-Golay smoothing (5 points, 2 passes)
  return savitskyGolaySmooth(normalized, 5, 2);
}

// Check if audio capture is active
export function isAudioCaptureActive(): boolean {
  return isCapturing && analyser !== null;
}

// ============================================
// Beat Detection System with Per-Band History
// ============================================

// Beat detection configuration
const BEAT_CONFIG = {
  historySize: 43, // ~43 frames at 60fps = ~0.7 seconds of history
  beatThreshold: 1.35, // Current energy must be 35% higher than average to be a beat
  cooldownFrames: 8, // Minimum frames between beats (~133ms at 60fps)
  beatDecay: 0.92, // How fast beat intensity decays (lower = faster decay)
  beatMultiplier: 1.5, // How much to multiply the value when beat is detected
};

// Per-band beat detection state
interface BandBeatState {
  energyHistory: number[];
  beatCooldown: number;
  lastBeatIntensity: number;
}

const bandBeatState: {
  bass: BandBeatState;
  mid: BandBeatState;
  high: BandBeatState;
} = {
  bass: { energyHistory: [], beatCooldown: 0, lastBeatIntensity: 0 },
  mid: { energyHistory: [], beatCooldown: 0, lastBeatIntensity: 0 },
  high: { energyHistory: [], beatCooldown: 0, lastBeatIntensity: 0 },
};

/**
 * Detect beat on a specific band and update its state
 * Returns the beat intensity (0-1) for that band
 */
function detectBandBeat(
  bandState: BandBeatState,
  currentEnergy: number
): number {
  const { historySize, beatThreshold, cooldownFrames, beatDecay } = BEAT_CONFIG;

  // Add to history
  bandState.energyHistory.push(currentEnergy);
  if (bandState.energyHistory.length > historySize) {
    bandState.energyHistory.shift();
  }

  // Need enough history to compare
  if (bandState.energyHistory.length < 10) {
    bandState.lastBeatIntensity *= beatDecay;
    return bandState.lastBeatIntensity;
  }

  // Calculate average energy from history
  const avgEnergy =
    bandState.energyHistory.reduce((a, b) => a + b, 0) /
    bandState.energyHistory.length;

  // Decrease cooldown
  if (bandState.beatCooldown > 0) {
    bandState.beatCooldown--;
  }

  // Check if current energy exceeds threshold compared to average
  const isBeat =
    bandState.beatCooldown === 0 &&
    currentEnergy > avgEnergy * beatThreshold &&
    currentEnergy > 0.08; // Minimum energy threshold

  if (isBeat) {
    // Calculate beat intensity based on how much it exceeds the average
    const intensity = Math.min(1, (currentEnergy - avgEnergy) / avgEnergy);
    bandState.lastBeatIntensity = Math.max(
      bandState.lastBeatIntensity,
      intensity
    );
    bandState.beatCooldown = cooldownFrames;
  }

  // Decay the beat intensity over time for smooth animation
  bandState.lastBeatIntensity *= beatDecay;

  return bandState.lastBeatIntensity;
}

/**
 * Convert a frequency (Hz) to the corresponding FFT bin index
 */
function frequencyToBin(
  frequency: number,
  fftSize: number,
  sampleRate: number
): number {
  return Math.round((frequency * fftSize) / sampleRate);
}

/**
 * Get all frequency band energies at once with beat detection
 * More efficient than calling each function separately
 *
 * Frequency ranges:
 * - Bass: 20-250Hz (kick drums, bass lines)
 * - Mid: 250-2000Hz (vocals, guitars, synths)
 * - High: 2000-16000Hz (hi-hats, cymbals, brightness)
 *
 * Each band value is multiplied when a beat is detected on that band,
 * creating a more dynamic response for visualizers.
 */
export function getFrequencyBands(): {
  bass: number;
  mid: number;
  high: number;
} {
  if (!analyser || !audioContext) {
    return { bass: 0, mid: 0, high: 0 };
  }

  const data = getCachedFrequencyData();
  if (!data) {
    return { bass: 0, mid: 0, high: 0 };
  }

  const sampleRate = audioContext.sampleRate; // Typically 44100 or 48000
  const fftSize = analyser.fftSize;
  const binCount = data.length; // = fftSize / 2

  // Calculate bin indices for frequency ranges
  // Bass: 20-250Hz
  const bassStart = Math.max(1, frequencyToBin(20, fftSize, sampleRate));
  const bassEnd = Math.min(binCount, frequencyToBin(250, fftSize, sampleRate));

  // Mid: 250-4000Hz
  const midStart = Math.min(binCount, frequencyToBin(250, fftSize, sampleRate));
  const midEnd = Math.min(binCount, frequencyToBin(4000, fftSize, sampleRate));

  // High: 4000-16000Hz
  const highStart = Math.min(
    binCount,
    frequencyToBin(4000, fftSize, sampleRate)
  );
  const highEnd = Math.min(
    binCount,
    frequencyToBin(16000, fftSize, sampleRate)
  );

  // Calculate bass energy
  let bassSum = 0;
  const bassCount = Math.max(1, bassEnd - bassStart);
  for (let i = bassStart; i < bassEnd && i < binCount; i++) {
    bassSum += data[i];
  }
  const bassEnergy = bassSum / (bassCount * 255);

  // Calculate mid energy
  let midSum = 0;
  const midCount = Math.max(1, midEnd - midStart);
  for (let i = midStart; i < midEnd && i < binCount; i++) {
    midSum += data[i];
  }
  const midEnergy = midSum / (midCount * 255);

  // Calculate high energy
  let highSum = 0;
  const highCount = Math.max(1, highEnd - highStart);
  for (let i = highStart; i < highEnd && i < binCount; i++) {
    highSum += data[i];
  }
  const highEnergy = highSum / (highCount * 255);

  // Detect beats on each band and get beat intensity
  const bassBeat = detectBandBeat(bandBeatState.bass, bassEnergy);
  const midBeat = detectBandBeat(bandBeatState.mid, midEnergy);
  const highBeat = detectBandBeat(bandBeatState.high, highEnergy);

  // Apply beat multiplier when beat is detected
  // This makes the value "pop" when a beat occurs
  const { beatMultiplier } = BEAT_CONFIG;

  return {
    bass: Math.min(1, bassEnergy * (1 + bassBeat * beatMultiplier)),
    mid: Math.min(1, midEnergy * (1 + midBeat * beatMultiplier)),
    high: Math.min(1, highEnergy * (1 + highBeat * beatMultiplier)),
  };
}

/**
 * Reset beat detection state (called when stopping capture)
 */
export function resetBeatDetection(): void {
  bandBeatState.bass = {
    energyHistory: [],
    beatCooldown: 0,
    lastBeatIntensity: 0,
  };
  bandBeatState.mid = {
    energyHistory: [],
    beatCooldown: 0,
    lastBeatIntensity: 0,
  };
  bandBeatState.high = {
    energyHistory: [],
    beatCooldown: 0,
    lastBeatIntensity: 0,
  };
}
