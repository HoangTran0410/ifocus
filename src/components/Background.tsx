import React, { useRef, useEffect, useState } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
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
  const playerRef = useRef<any>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getYoutubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Reset image loaded state when scene changes
  useEffect(() => {
    setImageLoaded(false);
  }, [scene.url]);

  // Handle mute/unmute changes
  useEffect(() => {
    if (playerRef.current && scene.type === "youtube") {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    }
  }, [isMuted, scene.type]);

  // Handle window click for YouTube autoplay
  useEffect(() => {
    if (scene.type !== "youtube") return;

    const handleWindowClick = () => {
      if (playerRef.current) {
        const playerState = playerRef.current.getPlayerState();
        // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
        if (playerState !== 1) {
          playerRef.current.playVideo();
        }
      }
    };

    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [scene.type]);

  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    playerRef.current = event.target;
    // Set initial mute state
    if (isMuted) {
      event.target.mute();
    } else {
      event.target.unMute();
    }
    // Start playing
    event.target.playVideo();
  };

  const youtubeOpts: YouTubeProps["opts"] = {
    playerVars: {
      autoplay: 1,
      mute: 1, // Explicitly mute for autoplay to work in iframes
      controls: 0,
      loop: 1,
      playlist:
        scene.type === "youtube" ? getYoutubeVideoId(scene.url) || "" : "",
      playsinline: 1,
      showinfo: 0,
      rel: 0,
      iv_load_policy: 3,
      disablekb: 1,
      modestbranding: 1,
    },
  };

  return (
    <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden transition-all duration-700 ease-in-out bg-black">
      {scene.type === "color" && (
        <div className="w-full h-full" style={{ backgroundColor: scene.url }} />
      )}

      {scene.type === "image" && (
        <>
          {/* Thumbnail layer - shows immediately */}
          {scene.thumbnail && !imageLoaded && (
            <img
              src={scene.thumbnail}
              alt="background thumbnail"
              className="w-full h-full object-cover blur-sm scale-105"
            />
          )}

          {/* Full resolution image - fades in when loaded */}
          <img
            src={scene.url}
            alt="background"
            loading="eager"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{ position: scene.thumbnail ? "absolute" : "relative" }}
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
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <YouTube
              videoId={getYoutubeVideoId(scene.url) || ""}
              opts={youtubeOpts}
              onReady={onPlayerReady}
              className="w-full h-full"
              iframeClassName="w-full h-full pointer-events-none"
              style={{ width: "100%", height: "100%" }}
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
