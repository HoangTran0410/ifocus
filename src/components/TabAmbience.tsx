import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Save,
  Trash2,
  Loader2,
  Volume2,
  RotateCcw,
} from "lucide-react";
import type { SoundState, SoundPreset, SoundTrack } from "../types";
import { DEFAULT_SOUNDS } from "../constants";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { connectElement, isElementConnected } from "../utils/audioAnalyzer";

export default function AmbienceTab() {
  // Sound preferences stored in localStorage
  const [savedSoundStates, setSavedSoundStates] = useLocalStorage<SoundState[]>(
    "zen_sound_states",
    []
  );

  // Derive soundStates from DEFAULT_SOUNDS, merging with saved preferences
  const soundStates = useMemo(() => {
    return DEFAULT_SOUNDS.map((sound) => {
      const saved = savedSoundStates.find((s) => s.id === sound.id);
      return {
        id: sound.id,
        volume: saved?.volume ?? 0.5,
        isPlaying: saved?.isPlaying ?? false,
      };
    });
  }, [savedSoundStates]);

  const setSoundStates = (newStates: SoundState[]) => {
    const statesToSave = newStates.filter(
      (s) => s.isPlaying || s.volume !== 0.5
    );
    setSavedSoundStates(statesToSave);
  };

  // Audio control state
  const [loadingSounds, setLoadingSounds] = useState<Set<string>>(new Set());
  const [globalVolume, setGlobalVolume] = useLocalStorage<number>(
    "zen_global_volume",
    1
  );
  const [isPaused, setIsPaused] = useState(false);

  // Refs to track latest values (for reading in effects without adding dependencies)
  const isPausedRef = useRef(isPaused);
  const globalVolumeRef = useRef(globalVolume);
  const soundStatesRef = useRef(soundStates);

  // Keep refs in sync with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    globalVolumeRef.current = globalVolume;
  }, [globalVolume]);

  useEffect(() => {
    soundStatesRef.current = soundStates;
  }, [soundStates]);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useLocalStorage<string[]>(
    "zen_expanded_categories",
    []
  );
  const [savedPresets, setSavedPresets] = useLocalStorage<SoundPreset[]>(
    "zen_sound_presets",
    []
  );
  const [presetNameInput, setPresetNameInput] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  // Audio refs
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Effect 1: Handle pause/resume all audio
  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (isPaused) {
        audio.pause();
      } else {
        // Only play if the sound is supposed to be playing
        const soundState = soundStatesRef.current.find((s) => s.id === id);
        if (soundState?.isPlaying) {
          audio.play().catch(() => {});
        }
      }
    });
  }, [isPaused]);

  // Effect 2: Update volume for all playing audio
  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      const soundState = soundStatesRef.current.find((s) => s.id === id);
      if (soundState) {
        audio.volume = soundState.volume * globalVolume;
      }
    });
  }, [globalVolume]);

  // Effect 3: Handle loading and playing individual sounds
  useEffect(() => {
    // Skip if paused (read from ref for latest value)
    if (isPausedRef.current) return;

    let cancelled = false;

    DEFAULT_SOUNDS.forEach(async (sound) => {
      const soundState = soundStates.find((s) => s.id === sound.id);
      if (!soundState) return;

      if (soundState.isPlaying) {
        // Load audio if not already loaded
        if (!audioRefs.current[sound.id]) {
          setLoadingSounds((prev) => new Set([...prev, sound.id]));

          try {
            let url = sound.url;
            if (typeof url === "function") {
              url = (await url()) as string;
              url = url?.["default"] || url;
              if (typeof url != "string") {
                setLoadingSounds((prev) => {
                  const next = new Set(prev);
                  next.delete(sound.id);
                  return next;
                });
                return;
              }
            }

            if (cancelled) return;

            const audio = new Audio(url);
            audio.autoplay = false;
            audio.loop = true;
            audio.crossOrigin = "anonymous";

            await new Promise<void>((resolve, reject) => {
              audio.addEventListener("canplaythrough", () => resolve(), {
                once: true,
              });
              audio.addEventListener("error", () => reject(), { once: true });
              audio.load();
            });

            if (cancelled) return;

            audioRefs.current[sound.id] = audio;
          } finally {
            setLoadingSounds((prev) => {
              const next = new Set(prev);
              next.delete(sound.id);
              return next;
            });
          }
        }

        // Check if paused before playing (read from ref for latest value)
        if (cancelled || isPausedRef.current) return;

        const audio = audioRefs.current[sound.id];
        if (!audio) return;

        // Connect to audio mixer for visualization (if not already connected)
        if (!isElementConnected(`ambience-${sound.id}`)) {
          connectElement(`ambience-${sound.id}`, audio).catch(() => {
            // May fail if already connected or CORS issue - that's OK
          });
        }

        // Set volume and play (read globalVolume from ref for latest value)
        audio.volume = soundState.volume * globalVolumeRef.current;
        if (audio.paused) {
          audio
            .play()
            .catch((error) => console.log("Audio play prevented:", error));
        }
      } else if (audioRefs.current[sound.id]) {
        // Stop this sound
        audioRefs.current[sound.id].pause();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [soundStates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
      });
    };
  }, []);

  const toggleSound = (id: string) => {
    const newStates = soundStates.map((s) =>
      s.id === id ? { ...s, isPlaying: !s.isPlaying } : s
    );
    setSoundStates(newStates);
  };

  const changeVolume = (id: string, vol: number) => {
    const newStates = soundStates.map((s) =>
      s.id === id ? { ...s, volume: vol } : s
    );
    setSoundStates(newStates);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Group sounds by category
  const groupedSounds = useMemo(() => {
    const groups: { [key: string]: SoundTrack[] } = {};
    DEFAULT_SOUNDS.forEach((sound) => {
      const categories = Array.isArray(sound.category)
        ? sound.category
        : [sound.category];
      categories.filter(Boolean).forEach((cat) => {
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(sound);
      });
    });
    return groups;
  }, []);

  // Filter sounds based on search
  const filteredGroupedSounds = useMemo(() => {
    if (!searchQuery.trim()) return groupedSounds;

    const query = searchQuery.toLowerCase();
    const filtered: { [key: string]: SoundTrack[] } = {};

    Object.entries(groupedSounds).forEach(([category, sounds]) => {
      const matchingSounds = sounds.filter((sound) =>
        sound.name.toLowerCase().includes(query)
      );
      if (matchingSounds.length > 0) {
        filtered[category] = matchingSounds;
      }
    });

    return filtered;
  }, [groupedSounds, searchQuery]);

  const savePreset = () => {
    if (!presetNameInput.trim()) return;

    const activeSounds = soundStates.filter((s) => s.isPlaying);
    if (activeSounds.length === 0) {
      setShowSaveInput(false);
      setPresetNameInput("");
      return;
    }

    const newPreset: SoundPreset = {
      id: Date.now().toString(),
      name: presetNameInput.trim(),
      sounds: activeSounds,
    };

    setSavedPresets((prev) => [...prev, newPreset]);
    setPresetNameInput("");
    setShowSaveInput(false);
  };

  const applyPreset = (preset: SoundPreset) => {
    const newStates = soundStates.map((s) => {
      const presetSound = preset.sounds.find((ps) => ps.id === s.id);
      if (presetSound) {
        return { ...s, volume: presetSound.volume, isPlaying: true };
      }
      return { ...s, isPlaying: false };
    });
    setSoundStates(newStates);
  };

  const deletePreset = (presetId: string) => {
    setSavedPresets((prev) => prev.filter((p) => p.id !== presetId));
  };

  const activeSoundsCount = soundStates.filter((s) => s.isPlaying).length;

  const renderSoundCard = (sound: SoundTrack) => {
    const soundState = soundStates.find((s) => s.id === sound.id);
    if (!soundState) return null;

    const isLoading = loadingSounds.has(sound.id);

    return (
      <div
        key={sound.id}
        onClick={() => !isLoading && toggleSound(sound.id)}
        className={`cursor-pointer flex flex-col items-center p-2 rounded-2xl border transition-all duration-200 ${
          soundState.isPlaying
            ? "bg-white/20 border-white/40 shadow-lg scale-[1.02]"
            : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
        } ${isLoading ? "opacity-70 cursor-wait" : ""}`}
      >
        <div className="text-3xl mb-2 filter drop-shadow-md relative">
          {sound.emoji}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
              <Loader2 size={20} className="animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="text-sm font-medium mb-2">{sound.name}</div>

        {soundState.isPlaying && (
          <div
            className="w-full h-6 flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={soundState.volume}
              onChange={(e) =>
                changeVolume(sound.id, parseFloat(e.target.value))
              }
              className={`w-full h-1 rounded-lg appearance-none cursor-pointer transition-colors ${
                soundState.isPlaying
                  ? "bg-white/40 accent-white"
                  : "bg-white/10 accent-white/50"
              }`}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Search Box */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sounds..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Master Controls */}
      {activeSoundsCount > 0 && (
        <div className="bg-white/5 rounded-xl p-3 space-y-3">
          {/* Active Sounds Display */}
          <div className="flex flex-wrap gap-1">
            {DEFAULT_SOUNDS.filter((sound) =>
              soundStates.find((s) => s.id === sound.id && s.isPlaying)
            ).map((sound) => (
              <span
                key={sound.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-xs group cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => toggleSound(sound.id)}
                title={`Turn off ${sound.name}`}
              >
                <span>{sound.emoji}</span>
                <span className="text-white/70 group-hover:text-white">
                  {sound.name}
                </span>
                <X
                  size={12}
                  className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-opacity -mr-1"
                />
              </span>
            ))}
          </div>

          {/* Global Volume Slider */}
          <div className="flex items-center gap-3">
            <Volume2 size={16} className="text-white/60 shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={globalVolume}
              onChange={(e) => {
                const newGlobalVol = parseFloat(e.target.value);
                setGlobalVolume(newGlobalVol);
                Object.entries(audioRefs.current).forEach(([id, audio]) => {
                  const soundState = soundStates.find((s) => s.id === id);
                  if (soundState && audio) {
                    audio.volume = soundState.volume * newGlobalVol;
                  }
                });
              }}
              className="flex-1 h-1 rounded-lg appearance-none cursor-pointer bg-white/20 accent-white"
            />
            <span className="text-xs text-white/60 w-8 text-right">
              {Math.round(globalVolume * 100)}%
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsPaused((prev) => {
                  const newPaused = !prev;
                  Object.values(audioRefs.current).forEach((audio) => {
                    if (newPaused) {
                      audio.pause();
                    } else {
                      const soundState = soundStates.find(
                        (s) => audioRefs.current[s.id] === audio && s.isPlaying
                      );
                      if (soundState) {
                        audio.play().catch(() => {});
                      }
                    }
                  });
                  return newPaused;
                });
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              title={isPaused ? "Resume all sounds" : "Pause all sounds"}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
              <span className="text-sm">{isPaused ? "Play" : "Pause"}</span>
            </button>

            <button
              onClick={() => {
                const newStates = soundStates.map((s) => ({
                  ...s,
                  isPlaying: false,
                }));
                setSoundStates(newStates);
                setIsPaused(false);
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              title="Turn off all sounds"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={() => setShowSaveInput(true)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              title="Save current mix"
            >
              <Save size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Save Preset Input */}
      {showSaveInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={presetNameInput}
            onChange={(e) => setPresetNameInput(e.target.value)}
            placeholder="Preset name..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") savePreset();
              if (e.key === "Escape") {
                setShowSaveInput(false);
                setPresetNameInput("");
              }
            }}
            className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/40"
          />
          <button
            onClick={savePreset}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm"
          >
            Save
          </button>
          <button
            onClick={() => {
              setShowSaveInput(false);
              setPresetNameInput("");
            }}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Saved Presets */}
      {savedPresets.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider">
            My Presets
          </h4>
          <div className="space-y-1">
            {savedPresets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <button
                  onClick={() => applyPreset(preset)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <span className="text-sm font-medium">{preset.name}</span>
                  <span className="text-xs text-white/40">
                    ({preset.sounds.length} sounds)
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePreset(preset.id);
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Sections */}
      <div>
        {Object.keys(filteredGroupedSounds).length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <Search size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sounds found for "{searchQuery}"</p>
          </div>
        ) : (
          Object.entries(filteredGroupedSounds).map(([category, sounds]) => {
            const isExpanded =
              expandedCategories.includes(category) && !searchQuery;

            return (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between py-2 px-1 text-left hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-white/50" />
                    ) : (
                      <ChevronRight size={16} className="text-white/50" />
                    )}
                    <span className="text-sm font-semibold">{category}</span>
                    <span className="text-xs text-white/40">
                      ({sounds.length})
                    </span>
                  </div>
                </button>

                <div
                  className={`grid grid-cols-2 p-1 gap-3 overflow-hidden transition-all duration-300 ${
                    isExpanded
                      ? "max-h-[2000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  {isExpanded && sounds.map((sound) => renderSoundCard(sound))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
