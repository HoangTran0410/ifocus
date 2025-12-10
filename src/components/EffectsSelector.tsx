import React from "react";
import { BarChart } from "lucide-react";
import { EffectType } from "../types";
import { EFFECTS } from "../constants";

interface EffectsSelectorProps {
  currentEffect: EffectType;
  setEffect: (effect: EffectType) => void;
  showVisualizer: boolean;
  setShowVisualizer: (show: boolean) => void;
}

export const EffectsSelector: React.FC<EffectsSelectorProps> = ({
  currentEffect,
  setEffect,
  showVisualizer,
  setShowVisualizer,
}) => {
  return (
    <div className="flex flex-col h-full text-white">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {/* Visualizer Toggle - Special independent effect */}
        <div className="mb-4">
          <button
            onClick={() => setShowVisualizer(!showVisualizer)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              showVisualizer
                ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400 shadow-xl"
                : "bg-white/5 border-transparent hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart size={24} />
              <div className="text-left">
                <div className="font-medium text-white">Music Visualizer</div>
                <div className="text-xs text-white/60">
                  Runs alongside other effects
                </div>
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                showVisualizer ? "bg-purple-500" : "bg-white/20"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  showVisualizer ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </div>
          </button>
        </div>

        {/* Effects Grid */}
        <div className="text-xs text-white/40 uppercase tracking-wider mb-2 px-1">
          Background Effects
        </div>
        <div className="grid grid-cols-2 gap-3 pb-4">
          {EFFECTS.map((effect) => (
            <button
              key={effect.id}
              onClick={() => setEffect(effect.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                currentEffect === effect.id
                  ? "bg-white/20 border-white shadow-xl scale-[1.02]"
                  : "bg-white/5 border-transparent hover:bg-white/10 hover:scale-[1.02]"
              }`}
            >
              <span className="text-4xl mb-2">{effect.icon}</span>
              <span className="text-sm font-medium text-white/90">
                {effect.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
