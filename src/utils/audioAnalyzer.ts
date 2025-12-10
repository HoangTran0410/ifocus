// Audio capture and analysis using getDisplayMedia

// Global AudioContext and Analyser singleton
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let dataArray: Uint8Array | null = null;
let mediaStream: MediaStream | null = null;
let isCapturing = false;

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

// Request permission to capture system/tab audio
export async function startAudioCapture(): Promise<boolean> {
  if (isCapturing && analyser) {
    return true;
  }

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
      // preferCurrentTab: true,
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

    // Create audio context and analyser
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = CONFIG.fftSize;
    analyser.smoothingTimeConstant = CONFIG.smoothingTimeConstant;
    analyser.minDecibels = CONFIG.minDecibels;
    analyser.maxDecibels = CONFIG.maxDecibels;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Connect the stream to the analyser
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);
    // Note: We don't connect to destination to avoid audio feedback

    // Listen for track ending (user stops sharing)
    audioTracks[0].addEventListener("ended", () => {
      stopAudioCapture();
    });

    isCapturing = true;
    return true;
  } catch (error) {
    console.error("Failed to start audio capture:", error);
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
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  analyser = null;
  dataArray = null;
  isCapturing = false;
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
