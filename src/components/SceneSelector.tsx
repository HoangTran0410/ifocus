import React, { useState, useEffect } from "react";
import {
  Upload,
  Video,
  Volume2,
  VolumeX,
  VideoIcon,
  Palette,
  Save,
  Trash2,
  Check,
} from "lucide-react";
import type { Scene } from "../types";
import {
  DEFAULT_IMAGES,
  DEFAULT_VIDEOS,
  DEFAULT_COLORS,
  DEFAULT_GRADIENTS,
  DEFAULT_YOUTUBE,
} from "../constants";
import useDebounce from "../hooks/useHook";

interface SceneSelectorProps {
  currentScene: Scene;
  setScene: (scene: Scene) => void;
  isBgMuted: boolean;
  setIsBgMuted: (muted: boolean) => void;
  setShowVideoModal?: (show: boolean) => void;
}

const STORAGE_KEY_COLORS = "zen_user_colors";
const STORAGE_KEY_GRADIENTS = "zen_user_gradients";

type TabType = "image" | "color" | "video" | "custom";

export default function SceneSelector({
  currentScene,
  setScene,
  isBgMuted,
  setIsBgMuted,
  setShowVideoModal = (_: boolean) => {},
}: SceneSelectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>("image");

  const [visitedTabs, setVisitedTabs] = useState<Set<TabType>>(
    new Set(["image"])
  );

  useEffect(() => {
    if (!visitedTabs.has(activeTab)) {
      setVisitedTabs((prev) => new Set([...prev, activeTab]));
    }
  }, [activeTab, visitedTabs]);
  const [customVideoUrl, setCustomVideoUrl] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customColor, setCustomColorRaw] = useState("#1a1a1a");
  const [gradientStops, setGradientStopsRaw] = useState([
    { color: "#0d1b2a", position: 0 },
    { color: "#2a1f3d", position: 100 },
  ]);
  const [gradientAngle, setGradientAngle] = useState(180);

  // Debounced setters (100ms)
  const setCustomColor = useDebounce(setCustomColorRaw, 100);
  const setGradientStops = useDebounce(setGradientStopsRaw, 100);

  // User saved presets
  const [userColors, setUserColors] = useState<Scene[]>([]);
  const [userGradients, setUserGradients] = useState<Scene[]>([]);

  // Load user presets from localStorage on mount
  useEffect(() => {
    const savedColors = localStorage.getItem(STORAGE_KEY_COLORS);
    const savedGradients = localStorage.getItem(STORAGE_KEY_GRADIENTS);
    if (savedColors) setUserColors(JSON.parse(savedColors));
    if (savedGradients) setUserGradients(JSON.parse(savedGradients));
  }, []);

  // Save user presets to localStorage
  const saveUserColors = (colors: Scene[]) => {
    setUserColors(colors);
    localStorage.setItem(STORAGE_KEY_COLORS, JSON.stringify(colors));
  };

  const saveUserGradients = (gradients: Scene[]) => {
    setUserGradients(gradients);
    localStorage.setItem(STORAGE_KEY_GRADIENTS, JSON.stringify(gradients));
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
    saveUserColors([...userColors, newColor]);
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
    saveUserGradients([...userGradients, newGradient]);
  };

  const handleDeleteUserColor = (id: string) => {
    saveUserColors(userColors.filter((c) => c.id !== id));
  };

  const handleDeleteUserGradient = (id: string) => {
    saveUserGradients(userGradients.filter((g) => g.id !== id));
  };

  const handleCustomColorApply = () => {
    setScene({
      id: `custom-color-${Date.now()}`,
      type: "color",
      url: customColor,
      name: "Custom Color",
    });
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
    // Parse gradient string: linear-gradient(180deg, #color1 0%, #color2 50%, #color3 100%)
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

  const handleCustomGradientApply = () => {
    setScene({
      id: `custom-gradient-${Date.now()}`,
      type: "gradient",
      url: getGradientUrl(),
      name: "Custom Gradient",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith("video") ? "video" : "image";
      setScene({
        id: `custom-${Date.now()}`,
        type,
        url,
        name: file.name,
      });
    }
  };

  const handleCustomVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVideoUrl) return;

    const isYoutube =
      customVideoUrl.includes("youtube.com") ||
      customVideoUrl.includes("youtu.be");

    setScene({
      id: `custom-vid-${Date.now()}`,
      type: isYoutube ? "youtube" : "video",
      url: customVideoUrl,
      name: "Custom Video",
    });
    setCustomVideoUrl("");
  };

  const handleCustomImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customImageUrl) return;

    setScene({
      id: `custom-img-${Date.now()}`,
      type: "image",
      url: customImageUrl,
      name: "Custom Image",
    });
    setCustomImageUrl("");
  };

  const renderTabs = () => (
    <div className="flex border-b border-white/10 mb-4">
      <button
        onClick={() => setActiveTab("color")}
        className={`flex-1 py-3 text-sm font-medium transition-colors ${
          activeTab === "color"
            ? "text-white border-b-2 border-white"
            : "text-white/50 hover:text-white"
        }`}
      >
        Color
      </button>
      <button
        onClick={() => setActiveTab("image")}
        className={`flex-1 py-3 text-sm font-medium transition-colors ${
          activeTab === "image"
            ? "text-white border-b-2 border-white"
            : "text-white/50 hover:text-white"
        }`}
      >
        Image
      </button>
      <button
        onClick={() => setActiveTab("video")}
        className={`flex-1 py-3 text-sm font-medium transition-colors ${
          activeTab === "video"
            ? "text-white border-b-2 border-white"
            : "text-white/50 hover:text-white"
        }`}
      >
        Video
      </button>
      <button
        onClick={() => setActiveTab("custom")}
        className={`flex-1 py-3 text-sm font-medium transition-colors ${
          activeTab === "custom"
            ? "text-white border-b-2 border-white"
            : "text-white/50 hover:text-white"
        }`}
      >
        Upload
      </button>
    </div>
  );

  const renderImageTab = () => (
    <div className="space-y-4 pb-4">
      {/* Custom Image URL */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <label className="text-xs font-bold text-white/50 uppercase mb-2 block">
          Image URL
        </label>
        <form onSubmit={handleCustomImageSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            value={customImageUrl}
            onChange={(e) => setCustomImageUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/50"
          />
          <button
            type="submit"
            className="bg-white text-black p-2 rounded-lg hover:bg-white/90"
          >
            <Upload size={18} />
          </button>
        </form>
        <p className="text-[10px] text-white/30 mt-1">
          Supports direct image URLs (.jpg, .png, .gif, etc.)
        </p>
      </div>

      {/* Preset Images */}
      <div className="grid grid-cols-2 gap-3">
        {DEFAULT_IMAGES.map((scene) => (
          <button
            key={scene.id}
            onClick={() => setScene(scene)}
            className={`relative group aspect-video rounded-xl overflow-hidden border-2 transition-all ${
              currentScene.id === scene.id
                ? "border-white shadow-xl scale-[1.02]"
                : "border-transparent hover:scale-[1.02]"
            }`}
          >
            <img
              src={scene.thumbnail || scene.url}
              alt={scene.name}
              loading="lazy"
              className="w-full h-full object-cover"
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
  );

  const renderColorTab = () => (
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

  const renderVideoTab = () => (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-2">
        <div className="flex items-center gap-2 mb-2">
          {/* Audio Control */}
          <button
            onClick={() => setIsBgMuted(!isBgMuted)}
            className={`backdrop-blur-md w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-white/30 ${
              !isBgMuted
                ? "bg-white/20 border-white/20"
                : "bg-white/5 border-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              {isBgMuted ? (
                <VolumeX size={18} className="text-white/70" />
              ) : (
                <Volume2 size={18} className="text-white" />
              )}
              <span className="text-xs font-medium">Audio</span>
            </div>
            <div
              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                !isBgMuted
                  ? "bg-green-500/20 text-green-300"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {isBgMuted ? "OFF" : "ON"}
            </div>
          </button>

          {/* Expand / Control Video Button */}
          <button
            onClick={() => setShowVideoModal(true)}
            className="backdrop-blur-md w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white/80 hover:text-white"
          >
            <VideoIcon size={18} />
            <span className="text-xs font-medium">Control Video</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="flex flex-col space-y-4">
          {/* Custom Video URL */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <label className="text-xs font-bold text-white/50 uppercase mb-2 block">
              Video URL
            </label>
            <form onSubmit={handleCustomVideoSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                value={customVideoUrl}
                onChange={(e) => setCustomVideoUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/50"
              />
              <button
                type="submit"
                className="bg-white text-black p-2 rounded-lg hover:bg-white/90"
              >
                <Video size={18} />
              </button>
            </form>
            <p className="text-[10px] text-white/30 mt-1">
              Supports YouTube links or direct .mp4 URLs.
            </p>
          </div>

          {/* Preset Videos */}
          <div className="grid grid-cols-2 gap-3 pb-4">
            {[...DEFAULT_VIDEOS, ...DEFAULT_YOUTUBE].map((scene) => (
              <button
                key={scene.id}
                onClick={() => setScene(scene)}
                className={`relative group aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                  currentScene.id === scene.id
                    ? "border-white shadow-xl scale-[1.02]"
                    : "border-transparent hover:scale-[1.02]"
                }`}
              >
                {scene.type === "youtube" ? (
                  <img
                    src={`https://img.youtube.com/vi/${
                      scene.url.split("v=")[1]
                    }/hqdefault.jpg`}
                    loading="lazy"
                    className="w-full h-full object-cover opacity-80"
                    alt={scene.name}
                  />
                ) : (
                  <img
                    src={scene.thumbnail || scene.url}
                    alt={scene.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                )}

                {scene.type === "youtube" && (
                  <div className="absolute top-2 left-2 bg-red-600 rounded px-1.5 py-0.5 text-[10px] font-bold">
                    <VideoIcon size={16} className="text-white" />
                  </div>
                )}

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
      </div>
    </div>
  );

  const renderCustomTab = () => (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <label className="text-xs font-bold text-white/50 uppercase mb-2 block">
          Upload File
        </label>
        <label className="relative cursor-pointer group w-full aspect-video rounded-xl border-2 border-dashed border-white/20 hover:border-white/50 flex flex-col items-center justify-center transition-all bg-white/5 hover:bg-white/10">
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileUpload}
          />
          <Upload
            size={24}
            className="mb-2 text-white/50 group-hover:text-white"
          />
          <span className="text-xs text-white/50 group-hover:text-white font-medium">
            Click to Upload
          </span>
        </label>
        <p className="text-[10px] text-white/30 mt-2">
          Supports images and video files from your device.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full text-white">
      {/* Tabs */}
      {renderTabs()}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {/* COLOR TAB */}
        <div className={activeTab === "color" ? "block" : "hidden"}>
          {visitedTabs.has("color") && renderColorTab()}
        </div>

        {/* IMAGE TAB */}
        <div className={activeTab === "image" ? "block" : "hidden"}>
          {visitedTabs.has("image") && renderImageTab()}
        </div>

        {/* VIDEO TAB */}
        <div className={activeTab === "video" ? "block" : "hidden"}>
          {visitedTabs.has("video") && renderVideoTab()}
        </div>

        {/* CUSTOM TAB */}
        <div className={activeTab === "custom" ? "block" : "hidden"}>
          {visitedTabs.has("custom") && renderCustomTab()}
        </div>
      </div>
    </div>
  );
}
