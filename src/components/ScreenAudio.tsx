import React, { useState, useEffect } from "react";
import loadable from "@loadable/component";
import { LoadingFallback } from "../utils/loader";

const AmbienceTab = loadable(() => import("./TabAmbience"), {
  fallback: LoadingFallback,
});
const MediaTab = loadable(() => import("./TabMedia"), {
  fallback: LoadingFallback,
});

export default function AudioScreen() {
  const [activeTab, setActiveTab] = useState<"sounds" | "media">("sounds");
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    new Set(["sounds"])
  );

  // Track visited tabs for lazy loading
  useEffect(() => {
    if (!visitedTabs.has(activeTab)) {
      setVisitedTabs((prev) => new Set([...prev, activeTab]));
    }
  }, [activeTab, visitedTabs]);

  return (
    <div className="flex flex-col h-full text-white">
      <div className="flex border-b border-white/10 mb-4">
        <button
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "sounds"
              ? "border-b-2 border-white text-white"
              : "text-white/50 hover:text-white"
          }`}
          onClick={() => setActiveTab("sounds")}
        >
          Ambience
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "media"
              ? "border-b-2 border-white text-white"
              : "text-white/50 hover:text-white"
          }`}
          onClick={() => setActiveTab("media")}
        >
          Media
        </button>
      </div>

      <div className="flex-1 overflow-y-auto  p-1 pt-0">
        <div className={activeTab === "sounds" ? "block" : "hidden"}>
          {visitedTabs.has("sounds") && <AmbienceTab />}
        </div>

        <div className={activeTab === "media" ? "block" : "hidden"}>
          {visitedTabs.has("media") && <MediaTab />}
        </div>
      </div>
    </div>
  );
}
