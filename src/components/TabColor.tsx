import React, { useState } from "react";
import { Palette, Save, Check, Trash2 } from "lucide-react";
import type { Scene } from "../types";
import { DEFAULT_COLORS, DEFAULT_GRADIENTS } from "../constants";
import { useLocalStorage } from "../hooks/useLocalStorage";
import useDebounce from "../hooks/useDebounce";
import { useCurrentScene, useSetCurrentScene } from "../stores/useAppStore";

export default function ColorTab() {
  const currentScene = useCurrentScene();
  const setScene = useSetCurrentScene();

  const [customColor, setCustomColorRaw] = useState("#1a1a1a");
  const [gradientStops, setGradientStopsRaw] = useState([
    { color: "#0d1b2a", position: 0 },
    { color: "#2a1f3d", position: 100 },
  ]);
  const [gradientAngle, setGradientAngle] = useState(180);

  // Debounced setters
  const setCustomColor = useDebounce(setCustomColorRaw, 100);
  const setGradientStops = useDebounce(setGradientStopsRaw, 100);

  // User saved presets
  const [userColors, setUserColors] = useLocalStorage<Scene[]>(
    "zen_user_colors",
    []
  );
  const [userGradients, setUserGradients] = useLocalStorage<Scene[]>(
    "zen_user_gradients",
    []
  );

  const getGradientUrl = () => {
    const sortedStops = [...gradientStops].sort(
      (a, b) => a.position - b.position
    );
    const stopsStr = sortedStops
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(", ");
    return `linear-gradient(${gradientAngle}deg, ${stopsStr})`;
  };

  const parseGradientUrl = (url: string) => {
    const angleMatch = url.match(/linear-gradient\((\d+)deg/);
    const angle = angleMatch ? parseInt(angleMatch[1]) : 180;

    const stopsRegex = /(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\s+(\d+)%/g;
    const stops: { color: string; position: number }[] = [];
    let match;
    while ((match = stopsRegex.exec(url)) !== null) {
      stops.push({ color: match[1], position: parseInt(match[2]) });
    }

    return { angle, stops };
  };

  const handlePresetColorSelect = (scene: Scene) => {
    setScene(scene);
    setCustomColor(scene.url);
  };

  const handlePresetGradientSelect = (scene: Scene) => {
    setScene(scene);
    const { angle, stops } = parseGradientUrl(scene.url);
    if (stops.length >= 2) {
      setGradientStops(stops);
      setGradientAngle(angle);
    }
  };

  const handleCustomColorApply = () => {
    setScene({
      id: `custom-color-${Date.now()}`,
      type: "color",
      url: customColor,
      name: "Custom Color",
    });
  };

  const handleCustomGradientApply = () => {
    setScene({
      id: `custom-gradient-${Date.now()}`,
      type: "gradient",
      url: getGradientUrl(),
      name: "Custom Gradient",
    });
  };

  const handleSaveColor = () => {
    const name = prompt("Enter a name for this color:");
    if (!name) return;
    const newColor: Scene = {
      id: `user-color-${Date.now()}`,
      type: "color",
      url: customColor,
      name,
    };
    setUserColors([...userColors, newColor]);
  };

  const handleSaveGradient = () => {
    const name = prompt("Enter a name for this gradient:");
    if (!name) return;
    const newGradient: Scene = {
      id: `user-gradient-${Date.now()}`,
      type: "gradient",
      url: getGradientUrl(),
      name,
    };
    setUserGradients([...userGradients, newGradient]);
  };

  const handleDeleteUserColor = (id: string) => {
    setUserColors(userColors.filter((c) => c.id !== id));
  };

  const handleDeleteUserGradient = (id: string) => {
    setUserGradients(userGradients.filter((g) => g.id !== id));
  };

  const addGradientStop = () => {
    const lastStop = gradientStops[gradientStops.length - 1];
    const secondLastStop = gradientStops[gradientStops.length - 2];
    const newPosition = Math.min(
      100,
      Math.round((lastStop.position + secondLastStop.position) / 2)
    );
    const newStops = [...gradientStops];
    newStops.splice(gradientStops.length - 1, 0, {
      color: "#1a3a3a",
      position: newPosition,
    });
    setGradientStops(newStops);
  };

  const removeGradientStop = (index: number) => {
    if (gradientStops.length <= 2) return;
    setGradientStops(gradientStops.filter((_, i) => i !== index));
  };

  const updateGradientStop = (
    index: number,
    field: "color" | "position",
    value: string | number
  ) => {
    const newStops = [...gradientStops];
    if (field === "color") {
      newStops[index].color = value as string;
    } else {
      newStops[index].position = Math.min(100, Math.max(0, value as number));
    }
    setGradientStops(newStops);
  };

  return (
    <div className="pb-4 space-y-5">
      {/* Solid Colors */}
      <div>
        <h3 className="text-xs font-bold text-white/50 uppercase mb-3">
          Solid Colors
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {DEFAULT_COLORS.map((scene) => (
            <button
              key={scene.id}
              onClick={() => handlePresetColorSelect(scene)}
              className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                currentScene.id === scene.id
                  ? "border-white shadow-xl scale-[1.02]"
                  : "border-transparent hover:scale-[1.02]"
              }`}
            >
              <div
                style={{ backgroundColor: scene.url }}
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold tracking-wide text-center px-1">
                  {scene.name}
                </span>
              </div>
              {currentScene.id === scene.id && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-glow" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Gradients */}
      <div>
        <h3 className="text-xs font-bold text-white/50 uppercase mb-3">
          Gradients
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {DEFAULT_GRADIENTS.map((scene) => (
            <button
              key={scene.id}
              onClick={() => handlePresetGradientSelect(scene)}
              className={`relative group aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                currentScene.id === scene.id
                  ? "border-white shadow-xl scale-[1.02]"
                  : "border-transparent hover:scale-[1.02]"
              }`}
            >
              <div
                style={{ background: scene.url }}
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-bold tracking-wide">
                  {scene.name}
                </span>
              </div>
              {currentScene.id === scene.id && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full shadow-glow" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-xs font-bold text-white/50 uppercase mb-3 flex items-center gap-2">
          <Palette size={14} />
          Custom Color
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/20 bg-transparent"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/50 font-mono"
              placeholder="#1a1a1a"
            />
          </div>
          <button
            onClick={handleCustomColorApply}
            className="p-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            title="Apply"
          >
            <Check size={18} />
          </button>
          <button
            onClick={handleSaveColor}
            className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            title="Save to presets"
          >
            <Save size={18} />
          </button>
        </div>
      </div>

      {/* User Saved Colors */}
      {userColors.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-white/50 uppercase mb-3">
            My Saved Colors
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {userColors.map((scene) => (
              <div key={scene.id} className="relative group">
                <button
                  onClick={() => handlePresetColorSelect(scene)}
                  className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    currentScene.id === scene.id
                      ? "border-white shadow-xl scale-[1.02]"
                      : "border-transparent hover:scale-[1.02]"
                  }`}
                >
                  <div
                    style={{ backgroundColor: scene.url }}
                    className="w-full h-full"
                  />
                </button>
                <button
                  onClick={() => handleDeleteUserColor(scene.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={10} />
                </button>
                <span className="absolute bottom-1 left-1 right-1 text-[8px] text-white/70 text-center truncate">
                  {scene.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Gradient Picker */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-xs font-bold text-white/50 uppercase mb-3 flex items-center gap-2">
          <Palette size={14} />
          Custom Gradient
        </h3>
        {/* Preview */}
        <div
          className="w-full h-24 rounded-lg mb-3 border border-white/10"
          style={{ background: getGradientUrl() }}
        />
        {/* Gradient Stops */}
        <div className="flex flex-col gap-2 mb-3">
          {gradientStops.map((stop, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="color"
                value={stop.color}
                onChange={(e) =>
                  updateGradientStop(index, "color", e.target.value)
                }
                className="w-10 h-8 rounded-lg cursor-pointer border-2 border-white/20 bg-transparent"
              />
              <input
                type="text"
                value={stop.color}
                onChange={(e) =>
                  updateGradientStop(index, "color", e.target.value)
                }
                className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-white/50 font-mono"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={stop.position}
                onChange={(e) =>
                  updateGradientStop(index, "position", Number(e.target.value))
                }
                className="w-14 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-white/50 font-mono text-center"
              />
              <span className="text-xs text-white/50">%</span>
              {gradientStops.length > 2 && (
                <button
                  onClick={() => removeGradientStop(index)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {/* Add Stop Button */}
        <button
          onClick={addGradientStop}
          className="w-full py-1.5 mb-3 border border-dashed border-white/20 rounded-lg text-xs text-white/50 hover:text-white hover:border-white/40 transition-colors"
        >
          + Add Color Stop
        </button>
        {/* Angle & Apply */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="360"
            value={gradientAngle}
            onChange={(e) => setGradientAngle(Number(e.target.value))}
            className="flex-1 accent-white"
          />
          <span className="text-xs font-mono w-10">{gradientAngle}°</span>
          <button
            onClick={handleCustomGradientApply}
            className="p-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            title="Apply"
          >
            <Check size={18} />
          </button>
          <button
            onClick={handleSaveGradient}
            className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            title="Save to presets"
          >
            <Save size={18} />
          </button>
        </div>
      </div>

      {/* User Saved Gradients */}
      {userGradients.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-white/50 uppercase mb-3">
            My Saved Gradients
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {userGradients.map((scene) => (
              <div key={scene.id} className="relative group">
                <button
                  onClick={() => handlePresetGradientSelect(scene)}
                  className={`w-full aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                    currentScene.id === scene.id
                      ? "border-white shadow-xl scale-[1.02]"
                      : "border-transparent hover:scale-[1.02]"
                  }`}
                >
                  <div
                    style={{ background: scene.url }}
                    className="w-full h-full"
                  />
                </button>
                <button
                  onClick={() => handleDeleteUserGradient(scene.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={10} />
                </button>
                <span className="absolute bottom-1 left-1 right-1 text-[10px] text-white/70 text-center truncate">
                  {scene.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
