export type TimerMode =
  | "pomodoro"
  | "shortBreak"
  | "longBreak"
  | "clock"
  | "stopwatch";

export type EffectType =
  | "none"
  | "rain"
  | "heavy-rain"
  | "snow"
  | "leaves"
  | "cherry-blossom"
  | "fireflies"
  | "cloud-shadows"
  | "sun-rays";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  estimatedPomodoros: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface Scene {
  id: string;
  type: "image" | "video" | "color" | "gradient" | "youtube";
  url: string; // URL for image/video/youtube or Hex code for color
  name: string;
  thumbnail?: string; // Optional thumbnail URL for lazy loading
}

export interface SoundTrack {
  id: string;
  name: string;
  emoji: string;
  url: string | (() => Promise<any>);
  category?: string;
}

export interface SoundState {
  id: string;
  volume: number;
  isPlaying: boolean;
}

export interface BgFilters {
  blur: number;
  brightness: number;
  contrast: number;
  grayscale: number;
  hueRotate: number;
  invert: number;
  opacity: number;
  saturate: number;
  sepia: number;
}

export interface SyncVisualizerConfig {
  enabled: boolean;
  intensity: number;
  speed: number;
}

export interface AppState {
  timer: {
    timeLeft: number;
    isActive: boolean;
    mode: TimerMode;
  };
  currentScene: Scene;
  currentEffect: EffectType;
  sounds: SoundTrack[];
  youtube: {
    url: string;
    isVisible: boolean;
    volume: number;
    history: string[];
  };
}
