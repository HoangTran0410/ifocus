import React, { useState, useEffect } from "react";
import loadable from "@loadable/component";
import { LoadingFallback } from "../utils/loader";

const ColorTab = loadable(() => import("./TabColor"), {
  fallback: LoadingFallback,
});
const ImageTab = loadable(() => import("./TabImage"), {
  fallback: LoadingFallback,
});
const VideoTab = loadable(() => import("./TabVideo"), {
  fallback: LoadingFallback,
});
const SettingsTab = loadable(() => import("./TabSettings"), {
  fallback: LoadingFallback,
});

type TabType = "image" | "color" | "video" | "settings";

export default function SceneScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("image");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabType>>(
    new Set(["image"])
  );

  useEffect(() => {
    if (!visitedTabs.has(activeTab)) {
      setVisitedTabs((prev) => new Set([...prev, activeTab]));
    }
  }, [activeTab, visitedTabs]);

  return (
    <div className="flex flex-col h-full text-white">
      {/* Tabs */}
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
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "settings"
              ? "text-white border-b-2 border-white"
              : "text-white/50 hover:text-white"
          }`}
        >
          Settings
        </button>
      </div>

      <div
        className={
          "flex-1 custom-scrollbar" +
          (activeTab === "video" ? " overflow-hidden" : " overflow-y-auto p-2")
        }
      >
        {/* COLOR TAB */}
        <div className={activeTab === "color" ? "block" : "hidden"}>
          {visitedTabs.has("color") && <ColorTab />}
        </div>

        {/* IMAGE TAB */}
        <div className={activeTab === "image" ? "block" : "hidden"}>
          {visitedTabs.has("image") && <ImageTab />}
        </div>

        {/* VIDEO TAB */}
        <div
          className={
            activeTab === "video" ? "flex flex-col h-full min-h-0" : "hidden"
          }
        >
          {visitedTabs.has("video") && <VideoTab />}
        </div>

        {/* SETTINGS TAB */}
        <div className={activeTab === "settings" ? "block" : "hidden"}>
          {visitedTabs.has("settings") && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
