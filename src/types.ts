export type TimerMode = "pomodoro" | "shortBreak" | "longBreak" | "clock" | "stopwatch";

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
  type: "image" | "video" | "color" | "youtube";
  url: string; // URL for image/video/youtube or Hex code for color
  name: string;
}

export interface SoundTrack {
  id: string;
  name: string;
  emoji: string;
  url: string;
  category?: string;
}

export interface SoundState {
  id: string;
  volume: number;
  isPlaying: boolean;
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
