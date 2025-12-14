import React, { useState } from "react";
import { Upload, Check } from "lucide-react";
import type { Scene } from "../types";
import { DEFAULT_IMAGES } from "../constants";
import { useCurrentScene, useSetCurrentScene } from "../stores/useAppStore";

export default function ImageTab() {
  const currentScene = useCurrentScene();
  const setScene = useSetCurrentScene();
  const [customImageUrl, setCustomImageUrl] = useState("");

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setScene({
        id: `custom-${Date.now()}`,
        type: "image",
        url,
        name: file.name,
      });
    }
  };

  return (
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
            <Check size={18} />
          </button>
        </form>
        <p className="text-[10px] text-white/30 mt-1">
          Supports direct image URLs (.jpg, .png, .gif, etc.)
        </p>
      </div>

      {/* File Upload */}
      <label className="p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all flex items-center gap-3">
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />
        <Upload size={18} className="text-white/50" />
        <span className="text-xs text-white/70 font-medium">
          Upload from device
        </span>
      </label>

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
}
