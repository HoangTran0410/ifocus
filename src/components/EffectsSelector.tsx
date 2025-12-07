import React from "react";
import { Sparkles } from "lucide-react";
import { EffectType } from "../types";
import { EFFECTS } from "../constants";

interface EffectsSelectorProps {
  currentEffect: EffectType;
  setEffect: (effect: EffectType) => void;
}

export const EffectsSelector: React.FC<EffectsSelectorProps> = ({
  currentEffect,
  setEffect,
}) => {
  return (
    <div className="flex flex-col h-full text-white">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
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
