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

// Legacy function name for backward compatibility
export async function startAudioCapture(): Promise<boolean> {
  return startTabCapture();
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
  isCapturing = false;
  currentSourceType = "none";
}

// Get frequency data from the analyser
export function getFrequencyData(): Uint8Array {
  if (!analyser || !dataArray) {
    return new Uint8Array(64).fill(0);
  }
  // @ts-ignore
  analyser.getByteFrequencyData(dataArray);
  return dataArray;
}

/**
 * Applies the Savitsky-Golay smoothing algorithm to an array of data points.
 *
 * @param array - The array of data points to be smoothed.
 * @param smoothingPoints - The number of points to use for smoothing.
 * @param smoothingPasses - The number of smoothing passes to perform.
 * @return The smoothed array of data points.
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
  const data = getFrequencyData();

  // Extract only the useful frequency range based on config
  const startIdx = CONFIG.freqStartIndex;
  const endIdx = Math.min(startIdx + CONFIG.freqLength, data.length);
  const windowedData = Array.from(data.slice(startIdx, endIdx));

  // Normalize to 0-1 range
  const normalized = windowedData.map((val) => val / 255);

  // return normalized;

  // Apply Savitsky-Golay smoothing (5 points, 2 passes)
  return savitskyGolaySmooth(normalized, 5, 2);
}

// Check if audio capture is active
export function isAudioCaptureActive(): boolean {
  return isCapturing && analyser !== null;
}

// ============================================
// Beat Detection System
// ============================================

// Beat detection state
const beatState = {
  energyHistory: [] as number[],
  historySize: 43, // ~43 frames at 60fps = ~0.7 seconds of history
  beatThreshold: 1.3, // Current energy must be 30% higher than average to be a beat
  beatCooldown: 0, // Frames to wait before detecting another beat
  cooldownFrames: 8, // Minimum frames between beats (~133ms at 60fps)
  lastBeatIntensity: 0, // Intensity of the last detected beat (0-1)
  beatDecay: 0.92, // How fast beat intensity decays (lower = faster decay)
};

/**
 * Get the current bass energy from low frequencies (best for beat detection)
 * Bass frequencies are typically in the 20-250Hz range
 */
export function getBassEnergy(): number {
  if (!analyser || !dataArray || !audioContext) return 0;

  // @ts-ignore - TypeScript buffer type strictness
  analyser.getByteFrequencyData(dataArray);

  const sampleRate = audioContext.sampleRate;
  const fftSize = analyser.fftSize;
  const binCount = dataArray.length;

  // Calculate bin indices for bass range (20-250Hz)
  const bassStart = Math.max(1, Math.round((20 * fftSize) / sampleRate));
  const bassEnd = Math.min(binCount, Math.round((250 * fftSize) / sampleRate));
  const bassCount = Math.max(1, bassEnd - bassStart);

  let sum = 0;
  for (let i = bassStart; i < bassEnd && i < binCount; i++) {
    sum += dataArray[i];
  }

  return sum / (bassCount * 255); // Normalize to 0-1
}

/**
 * Get the current mid-range energy (best for synths, vocals, guitars)
 * Mid frequencies are typically in the 250-2000Hz range
 */
export function getMidEnergy(): number {
  if (!analyser || !dataArray || !audioContext) return 0;

  // @ts-ignore - TypeScript buffer type strictness
  analyser.getByteFrequencyData(dataArray);

  const sampleRate = audioContext.sampleRate;
  const fftSize = analyser.fftSize;
  const binCount = dataArray.length;

  // Calculate bin indices for mid range (250-2000Hz)
  const midStart = Math.min(binCount, Math.round((250 * fftSize) / sampleRate));
  const midEnd = Math.min(binCount, Math.round((2000 * fftSize) / sampleRate));
  const midCount = Math.max(1, midEnd - midStart);

  let sum = 0;
  for (let i = midStart; i < midEnd && i < binCount; i++) {
    sum += dataArray[i];
  }

  return sum / (midCount * 255); // Normalize to 0-1
}

/**
 * Get the current high frequency energy (best for hi-hats, cymbals, brightness)
 * High frequencies are typically in the 2000-16000Hz range
 */
export function getHighEnergy(): number {
  if (!analyser || !dataArray || !audioContext) return 0;

  // @ts-ignore - TypeScript buffer type strictness
  analyser.getByteFrequencyData(dataArray);

  const sampleRate = audioContext.sampleRate;
  const fftSize = analyser.fftSize;
  const binCount = dataArray.length;

  // Calculate bin indices for high range (2000-16000Hz)
  const highStart = Math.min(
    binCount,
    Math.round((2000 * fftSize) / sampleRate)
  );
  const highEnd = Math.min(
    binCount,
    Math.round((16000 * fftSize) / sampleRate)
  );
  const highCount = Math.max(1, highEnd - highStart);

  let sum = 0;
  for (let i = highStart; i < highEnd && i < binCount; i++) {
    sum += dataArray[i];
  }

  return sum / (highCount * 255); // Normalize to 0-1
}

/**
 * Convert a frequency (Hz) to the corresponding FFT bin index
 * binIndex = frequency * fftSize / sampleRate
 */
function frequencyToBin(
  frequency: number,
  fftSize: number,
  sampleRate: number
): number {
  return Math.round((frequency * fftSize) / sampleRate);
}

/**
 * Get all frequency band energies at once
 * More efficient than calling each function separately
 *
 * Frequency ranges are dynamically calculated based on current fftSize:
 * - Bass: 20-250Hz (kick drums, bass lines)
 * - Mid: 250-2000Hz (vocals, guitars, synths)
 * - High: 2000-16000Hz (hi-hats, cymbals, brightness)
 */
export function getFrequencyBands(): {
  bass: number;
  mid: number;
  high: number;
} {
  if (!analyser || !dataArray || !audioContext) {
    return { bass: 0, mid: 0, high: 0 };
  }

  // @ts-ignore - TypeScript buffer type strictness
  analyser.getByteFrequencyData(dataArray);

  const sampleRate = audioContext.sampleRate; // Typically 44100 or 48000
  const fftSize = analyser.fftSize;
  const binCount = dataArray.length; // = fftSize / 2

  // Calculate bin indices for frequency ranges
  // Bass: 20-250Hz
  const bassStart = Math.max(1, frequencyToBin(20, fftSize, sampleRate));
  const bassEnd = Math.min(binCount, frequencyToBin(250, fftSize, sampleRate));

  // Mid: 250-2000Hz
  const midStart = Math.min(binCount, frequencyToBin(250, fftSize, sampleRate));
  const midEnd = Math.min(binCount, frequencyToBin(2000, fftSize, sampleRate));

  // High: 2000-16000Hz
  const highStart = Math.min(
    binCount,
    frequencyToBin(2000, fftSize, sampleRate)
  );
  const highEnd = Math.min(
    binCount,
    frequencyToBin(16000, fftSize, sampleRate)
  );

  // Calculate bass energy
  let bassSum = 0;
  const bassCount = Math.max(1, bassEnd - bassStart);
  for (let i = bassStart; i < bassEnd && i < binCount; i++) {
    bassSum += dataArray[i];
  }

  // Calculate mid energy
  let midSum = 0;
  const midCount = Math.max(1, midEnd - midStart);
  for (let i = midStart; i < midEnd && i < binCount; i++) {
    midSum += dataArray[i];
  }

  // Calculate high energy
  let highSum = 0;
  const highCount = Math.max(1, highEnd - highStart);
  for (let i = highStart; i < highEnd && i < binCount; i++) {
    highSum += dataArray[i];
  }

  return {
    bass: bassSum / (bassCount * 255),
    mid: midSum / (midCount * 255),
    high: highSum / (highCount * 255),
  };
}

/**
 * Detect if a beat is occurring
 * Returns a value 0-1 indicating beat intensity (0 = no beat, 1 = strong beat)
 * Uses energy comparison against rolling average
 */
export function detectBeat(): number {
  const currentEnergy = getBassEnergy();

  // Add to history
  beatState.energyHistory.push(currentEnergy);
  if (beatState.energyHistory.length > beatState.historySize) {
    beatState.energyHistory.shift();
  }

  // Need enough history to compare
  if (beatState.energyHistory.length < 10) {
    return (beatState.lastBeatIntensity *= beatState.beatDecay);
  }

  // Calculate average energy from history
  const avgEnergy =
    beatState.energyHistory.reduce((a, b) => a + b, 0) /
    beatState.energyHistory.length;

  // Decrease cooldown
  if (beatState.beatCooldown > 0) {
    beatState.beatCooldown--;
  }

  // Check if current energy exceeds threshold compared to average
  const isBeat =
    beatState.beatCooldown === 0 &&
    currentEnergy > avgEnergy * beatState.beatThreshold &&
    currentEnergy > 0.1; // Minimum energy threshold

  if (isBeat) {
    // Calculate beat intensity based on how much it exceeds the average
    const intensity = Math.min(1, (currentEnergy - avgEnergy) / avgEnergy);
    beatState.lastBeatIntensity = Math.max(
      beatState.lastBeatIntensity,
      intensity
    );
    beatState.beatCooldown = beatState.cooldownFrames;
  }

  // Decay the beat intensity over time for smooth animation
  beatState.lastBeatIntensity *= beatState.beatDecay;

  return beatState.lastBeatIntensity;
}

/**
 * Get the current beat intensity without detecting new beats
 * Useful for checking the current "pulse" level
 */
export function getBeatIntensity(): number {
  return beatState.lastBeatIntensity;
}

/**
 * Reset beat detection state (call when stopping capture)
 */
export function resetBeatDetection(): void {
  beatState.energyHistory = [];
  beatState.beatCooldown = 0;
  beatState.lastBeatIntensity = 0;
}
