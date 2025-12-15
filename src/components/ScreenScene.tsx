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

const Tabs = [
  {
    name: "Image",
    component: ImageTab,
  },
  {
    name: "Color",
    component: ColorTab,
  },
  {
    name: "Video",
    component: VideoTab,
  },
  {
    name: "Settings",
    component: SettingsTab,
  },
];

export default function SceneScreen() {
  const [activeTab, setActiveTab] = useState<string>(Tabs[0].name);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    new Set([Tabs[0].name])
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
        {Tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.name
                ? "text-white border-b-2 border-white"
                : "text-white/50 hover:text-white"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={"flex-1 overflow-y-auto p-2"}>
        {Tabs.map((tab) => (
          <div
            key={tab.name}
            className={
              "flex-1 " + (tab.name === activeTab ? "block" : "hidden")
            }
          >
            {visitedTabs.has(tab.name) && <tab.component />}
          </div>
        ))}
      </div>
    </div>
  );
}
