import React, { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, X } from "lucide-react";
import { TIMER_SETTINGS } from "../constants";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { TimerMode } from "../types";
import { useTimerMode, useSetTimerMode } from "../stores/useAppStore";

interface TimerProps {
  onTick?: () => void; // Optional callback for ticks
  onClose?: () => void; // Optional callback to hide timer
}

// Type for storing time left for each mode
type TimerStates = Record<TimerMode, number>;

export default function Timer({ onClose }: TimerProps) {
  // Get timer mode from Zustand store
  const mode = useTimerMode();
  const setMode = useSetTimerMode();

  // Store timeLeft for each mode separately (keeping useLocalStorage for timer states as it's timer-specific)
  const [timerStates, setTimerStates] = useLocalStorage<TimerStates>(
    "zen_timer_states",
    {
      pomodoro: TIMER_SETTINGS.pomodoro,
      shortBreak: TIMER_SETTINGS.shortBreak,
      longBreak: TIMER_SETTINGS.longBreak,
      clock: TIMER_SETTINGS.clock,
      stopwatch: TIMER_SETTINGS.stopwatch,
    }
  );

  const [isActive, setIsActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get current mode's time
  const timeLeft = timerStates[mode];

  // Helper to update time for current mode
  const setTimeLeft = (value: number | ((prev: number) => number)) => {
    setTimerStates((prev) => ({
      ...prev,
      [mode]: typeof value === "function" ? value(prev[mode]) : value,
    }));
  };

  // Handle Clock Mode
  useEffect(() => {
    if (mode === "clock") {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  // Stop timer when switching modes
  useEffect(() => {
    setIsActive(false);
  }, [mode]);

  useEffect(() => {
    let interval: number | null = null;
    if (mode === "stopwatch" && isActive) {
      // Stopwatch counts up
      interval = window.setInterval(() => {
        setTimeLeft((time) => time + 1);
      }, 1000);
    } else if (
      mode !== "clock" &&
      mode !== "stopwatch" &&
      isActive &&
      timeLeft > 0
    ) {
      // Regular timer counts down
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (mode !== "stopwatch" && timeLeft === 0) {
      setIsActive(false);
      // Play a bell sound or notification here if implemented
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimerStates((prev) => ({
      ...prev,
      [mode]: TIMER_SETTINGS[mode],
    }));
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatClock = (date: Date) => {
    // 24-hour format
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Update document title
  useEffect(() => {
    if (mode === "clock") {
      document.title = `iFocus`;
    } else {
      document.title = `${formatTimer(timeLeft)} - iFocus`;
    }
  }, [timeLeft, mode]);

  return (
    <div className="group relative flex items-center justify-center p-8 transition-all duration-500 ease-in-out text-white max-w-md mx-auto hover:bg-black/40 hover:backdrop-blur-md rounded-3xl font-sans">
      {/* Mode Selectors - Absolutely positioned above timer display */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 flex sm:space-x-2 space-x-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 bg-white/10">
        {(
          [
            "pomodoro",
            "shortBreak",
            "longBreak",
            "stopwatch",
            "clock",
          ] as TimerMode[]
        ).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-2 py-1 sm:px-4 sm:py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
              mode === m
                ? "bg-white text-black shadow-lg"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            {m === "pomodoro"
              ? "Focus"
              : m === "shortBreak"
              ? "Short"
              : m === "longBreak"
              ? "Long"
              : m === "stopwatch"
              ? "Stopwatch"
              : "Clock"}
          </button>
        ))}
      </div>

      {/* Timer Display - Centered, always visible, enhances on hover */}
      <div className="timer-display text-7xl sm:text-9xl font-bold tracking-tight select-none drop-shadow-2xl transition-transform duration-500 group-hover:scale-105">
        {mode === "clock" ? formatClock(currentTime) : formatTimer(timeLeft)}
      </div>

      {/* Controls - Absolutely positioned below timer display */}
      {mode !== "clock" && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-4 flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
          <button
            onClick={toggleTimer}
            className="bg-white text-black sm:p-6 p-4 rounded-full hover:scale-105 transition-transform shadow-lg active:scale-95"
          >
            {isActive ? (
              <Pause size={32} fill="black" />
            ) : (
              <Play size={32} fill="black" className="ml-1" />
            )}
          </button>

          {(mode === "stopwatch"
            ? timeLeft > 0
            : timeLeft < TIMER_SETTINGS[mode]) && (
            <button
              onClick={resetTimer}
              className="bg-white/10 text-white sm:p-4 p-3 rounded-full hover:bg-white/20 transition-colors"
            >
              <RotateCcw size={24} />
            </button>
          )}
        </div>
      )}

      {/* Close button - Top right corner */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Hide Timer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
