import React, { useState } from "react";
import {
  Palette,
  BarChart,
  ZoomIn,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { BgFilters } from "../types";
import { DEFAULT_BG_FILTERS } from "../constants";
import {
  useBgFilters,
  useSetBgFilters,
  useBgInitialZoom,
  useSetBgInitialZoom,
  useSyncVisualizerConfig,
  useSetSyncVisualizerConfig,
} from "../stores/useAppStore";

export default function SettingsTab() {
  const bgFilters = useBgFilters();
  const setBgFilters = useSetBgFilters();
  const bgInitialZoom = useBgInitialZoom();
  const setBgInitialZoom = useSetBgInitialZoom();
  const syncVisualizerConfig = useSyncVisualizerConfig();
  const setSyncVisualizerConfig = useSetSyncVisualizerConfig();

  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const updateFilter = (key: keyof BgFilters, value: number | string) => {
    setBgFilters({ ...bgFilters, [key]: value });
  };

  const resetFilters = () => {
    setBgFilters(DEFAULT_BG_FILTERS);
    setBgInitialZoom(100);
  };

  // Merge with defaults
  const f = { ...DEFAULT_BG_FILTERS, ...bgFilters };

  return (
    <div className="space-y-4 pb-4">
      {/* Zoom with Audio */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <label className="flex justify-between items-center text-xs text-white/70">
          <span className="flex items-center gap-2">
            <BarChart size={14} />
            Sync with Visualizer
          </span>
          <button
            onClick={() =>
              setSyncVisualizerConfig({
                ...syncVisualizerConfig,
                enabled: !syncVisualizerConfig.enabled,
              })
            }
            className={`relative w-10 h-5 rounded-full transition-colors ${
              syncVisualizerConfig.enabled ? "bg-purple-500" : "bg-white/20"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                syncVisualizerConfig.enabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </label>
        <p className="text-[10px] text-white/30 mt-2">
          Background will zoom in/out following the audio intensity.
        </p>

        {syncVisualizerConfig.enabled && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
            <div>
              <label className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Intensity</span>
                <span>{Math.round(syncVisualizerConfig.intensity * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.01"
                value={syncVisualizerConfig.intensity}
                onChange={(e) =>
                  setSyncVisualizerConfig({
                    ...syncVisualizerConfig,
                    intensity: Number(e.target.value),
                  })
                }
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div>
              <label className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Smoothing</span>
                <span>{Math.round(syncVisualizerConfig.speed * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.01"
                value={syncVisualizerConfig.speed}
                onChange={(e) =>
                  setSyncVisualizerConfig({
                    ...syncVisualizerConfig,
                    speed: Number(e.target.value),
                  })
                }
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Initial Zoom */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <label className="flex justify-between text-xs text-white/70 mb-2">
          <span className="flex items-center gap-2">
            <ZoomIn size={14} />
            Initial Zoom
          </span>
          <span className="text-purple-400">{bgInitialZoom}%</span>
        </label>
        <input
          type="range"
          min="100"
          max="200"
          value={bgInitialZoom}
          onChange={(e) => setBgInitialZoom(Number(e.target.value))}
          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <p className="text-[10px] text-white/30 mt-1">
          Base zoom level for the background (100% = no zoom)
        </p>
      </div>

      {/* Filters Section */}
      <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="w-full p-3 flex justify-between items-center text-xs font-bold text-white/50 uppercase hover:bg-white/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Palette size={14} />
            Filters
          </span>
          {filtersExpanded ? (
            <ChevronUp size={16} className="text-white/30" />
          ) : (
            <ChevronDown size={16} className="text-white/30" />
          )}
        </button>

        {filtersExpanded && (
          <div className="p-3 space-y-4">
            {/* Reset Button */}
            <button
              onClick={resetFilters}
              className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} />
              Reset All Filters
            </button>

            {/* Blur */}
            <div>
              <label className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Blur</span>
                <span>{f.blur}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={f.blur}
                onChange={(e) => updateFilter("blur", Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Brightness */}
            <div>
              <label className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Brightness</span>
                <span>{f.brightness}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={f.brightness}
                onChange={(e) =>
                  updateFilter("brightness", Number(e.target.value))
                }
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Contrast */}
            <div>
              <label className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Contrast</span>
                <span>{f.contrast}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={f.contrast}
                onChange={(e) =>
                  updateFilter("contrast", Number(e.target.value))
                }
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Grayscale */}
            <div>
              <label className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Grayscale</span>
                <span>{f.grayscale}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={f.grayscale}
                onChange={(e) =>
                  updateFilter("grayscale", Number(e.target.value))
                }
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Hue Rotate */}
            <div>
              <label className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Hue Rotate</span>
                <span>{f.hueRotate}°</span>
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={f.hueRotate}
                onChange={(e) =>
                  updateFilter("hueRotate", Number(e.target.value))
                }
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Invert */}
            <div>
              <label className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Invert</span>
                <span>{f.invert}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={f.invert}
                onChange={(e) => updateFilter("invert", Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Opacity */}
            <div>
              <label className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Opacity</span>
                <span>{f.opacity}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={f.opacity}
                onChange={(e) =>
                  updateFilter("opacity", Number(e.target.value))
                }
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Saturate */}
            <div>
              <label className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Saturate</span>
                <span>{f.saturate}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="300"
                value={f.saturate}
                onChange={(e) =>
                  updateFilter("saturate", Number(e.target.value))
                }
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Sepia */}
            <div>
              <label className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Sepia</span>
                <span>{f.sepia}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={f.sepia}
                onChange={(e) => updateFilter("sepia", Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
