import React, { useState } from "react";
import { Upload, Video, Volume2, VolumeX, VideoIcon } from "lucide-react";
import { Scene } from "../types";
import { DEFAULT_SCENES } from "../constants";

interface SceneSelectorProps {
  currentScene: Scene;
  setScene: (scene: Scene) => void;
  isBgMuted: boolean;
  setIsBgMuted: (muted: boolean) => void;
}

export const SceneSelector: React.FC<SceneSelectorProps> = ({
  currentScene,
  setScene,
  isBgMuted,
  setIsBgMuted,
}) => {
  const [activeTab, setActiveTab] = useState<"image" | "video" | "custom">(
    "image"
  );
  const [customVideoUrl, setCustomVideoUrl] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");

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

  return (
    <div className="flex flex-col h-full text-white">
      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-4">
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
          Custom
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {/* IMAGE TAB */}
        {activeTab === "image" && (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {DEFAULT_SCENES.filter(
              (scene) => scene.type === "image" || scene.type === "color"
            ).map((scene) => (
              <button
                key={scene.id}
                onClick={() => setScene(scene)}
                className={`relative group aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                  currentScene.id === scene.id
                    ? "border-white shadow-xl scale-[1.02]"
                    : "border-transparent hover:scale-[1.02]"
                }`}
              >
                {scene.type === "color" ? (
                  <div
                    style={{ backgroundColor: scene.url }}
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={scene.thumbnail || scene.url}
                    alt={scene.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
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
        )}

        {/* VIDEO TAB */}
        {activeTab === "video" && (
          <div className="flex flex-col">
            {/* Background Audio Control - Inside Video Tab */}
            <div className="sticky top-0 bg-transparent backdrop-blur z-10">
              <button
                onClick={() => setIsBgMuted(!isBgMuted)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-white/30 ${
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
                  <span className="text-xs font-medium">Background Audio</span>
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
            </div>

            <div className="grid grid-cols-2 gap-3 pb-4 mt-4">
              {DEFAULT_SCENES.filter(
                (scene) => scene.type === "youtube" || scene.type === "video"
              ).map((scene) => (
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
        )}

        {/* CUSTOM TAB */}
        {activeTab === "custom" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase">
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
              <p className="text-[10px] text-white/30">
                Supports direct image URLs (.jpg, .png, .gif, etc.)
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10">
              <label className="text-xs font-bold text-white/50 uppercase">
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
              <p className="text-[10px] text-white/30">
                Supports YouTube links or direct .mp4 URLs.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10">
              <label className="text-xs font-bold text-white/50 uppercase">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
