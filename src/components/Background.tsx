import React from "react";
import { Scene, EffectType } from "../types";
import { EffectsLayer } from "./EffectsLayer";

interface BackgroundProps {
  scene: Scene;
  effect?: EffectType;
  isMuted?: boolean;
}

export const Background: React.FC<BackgroundProps> = ({
  scene,
  effect = "none",
  isMuted = true,
}) => {
  const getYoutubeEmbedId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getYoutubeEmbedUrl = (videoId: string | null, muted: boolean) => {
    if (!videoId) return "";
    // enablejsapi=1 is important for control
    // origin must be set to window.location.origin to prevent error 153 in some envs
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${
      muted ? 1 : 0
    }&controls=0&loop=1&playlist=${videoId}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${origin}`;
  };

  return (
    <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden transition-all duration-700 ease-in-out bg-black">
      {scene.type === "color" && (
        <div className="w-full h-full" style={{ backgroundColor: scene.url }} />
      )}

      {scene.type === "image" && (
        <>
          <img
            src={scene.url}
            alt="background"
            className="w-full h-full object-cover transition-opacity duration-700"
          />
          {/* Dark Overlay for readability */}
          <div className="absolute inset-0 bg-black/20" />
        </>
      )}

      {scene.type === "video" && (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            key={scene.url} // Key forces reload on change
          >
            <source src={scene.url} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/20" />
        </>
      )}

      {scene.type === "youtube" && (
        <>
          <div className="absolute inset-0 w-full h-full pointer-events-none scale-[1.5]">
            <iframe
              src={getYoutubeEmbedUrl(getYoutubeEmbedId(scene.url), isMuted)}
              className="w-full h-full object-cover pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ border: 0 }}
              key={`${scene.url}-${isMuted}`}
            />
          </div>
          <div className="absolute inset-0 bg-black/20" />
        </>
      )}

      {/* Advanced God Rays Effect */}
      {effect === "sun-rays" && (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-10">
          {/* Primary warm light source (Top Right) */}
          <div className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-[radial-gradient(circle,rgba(255,220,150,0.4)_0%,rgba(0,0,0,0)_70%)] blur-[80px]" />

          {/* Moving Beams Layer 1 (Slow) */}
          <div className="absolute -top-[50%] -right-[50%] w-[200%] h-[200%] opacity-40 mix-blend-overlay origin-center animate-[spin_120s_linear_infinite]">
            <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(0,0,0,0)_0deg,rgba(255,255,255,0.1)_15deg,rgba(0,0,0,0)_30deg,rgba(255,200,100,0.1)_45deg,rgba(0,0,0,0)_60deg,rgba(255,255,255,0.1)_90deg,rgba(0,0,0,0)_130deg)]" />
          </div>

          {/* Moving Beams Layer 2 (Reverse, Faster, Textured) */}
          <div className="absolute -top-[50%] -right-[50%] w-[200%] h-[200%] opacity-30 mix-blend-soft-light origin-center animate-[spin_180s_linear_infinite_reverse]">
            <div className="w-full h-full bg-[conic-gradient(from_180deg_at_50%_50%,rgba(0,0,0,0)_0deg,rgba(255,255,200,0.1)_10deg,rgba(0,0,0,0)_20deg,rgba(255,255,255,0.05)_40deg,rgba(0,0,0,0)_80deg)]" />
          </div>

          {/* Atmospheric haze */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-orange-200/20 mix-blend-screen" />

          {/* Dust motes (handled by EffectsLayer fireflies re-purposed or just let EffectsLayer handle it if user stacks them, but here we keep it pure css for the rays) */}
        </div>
      )}

      {/* Canvas Effects */}
      <EffectsLayer type={effect} />
    </div>
  );
};
