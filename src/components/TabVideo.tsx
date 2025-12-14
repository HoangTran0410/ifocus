import React, { useState } from "react";
import {
  Upload,
  Video,
  Volume2,
  VolumeX,
  VideoIcon,
  Check,
} from "lucide-react";
import { DEFAULT_VIDEOS, DEFAULT_YOUTUBE } from "../constants";
import {
  useCurrentScene,
  useSetCurrentScene,
  useIsBgMuted,
  useSetIsBgMuted,
  useSetShowVideoModal,
} from "../stores/useAppStore";

export default function VideoTab() {
  const currentScene = useCurrentScene();
  const setScene = useSetCurrentScene();
  const isBgMuted = useIsBgMuted();
  const setIsBgMuted = useSetIsBgMuted();
  const setShowVideoModal = useSetShowVideoModal();

  const [customVideoUrl, setCustomVideoUrl] = useState("");

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setScene({
        id: `custom-${Date.now()}`,
        type: "video",
        url,
        name: file.name,
      });
    }
  };

  return (
    <>
      {/* Header - fixed at top */}
      <div className="flex-shrink-0 p-2">
        <div className="flex items-center gap-2">
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
                <Check size={18} />
              </button>
            </form>
            <p className="text-[10px] text-white/30 mt-1">
              Supports YouTube links or direct .mp4 URLs.
            </p>
          </div>

          {/* File Upload */}
          <label className="p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all flex items-center gap-3">
            <input
              type="file"
              className="hidden"
              accept="video/*"
              onChange={handleFileUpload}
            />
            <Upload size={18} className="text-white/50" />
            <span className="text-xs text-white/70 font-medium">
              Upload from device
            </span>
          </label>

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
    </>
  );
}
