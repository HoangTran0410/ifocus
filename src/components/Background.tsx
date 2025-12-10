import React, { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import YouTube, { YouTubeProps } from "react-youtube";
import { Scene, EffectType } from "../types";
import { EffectsLayer } from "./EffectsLayer";

interface BackgroundProps {
  scene: Scene;
  effect?: EffectType;
  isMuted?: boolean;
  disableYouTube?: boolean; // Option to disable YouTube for PiP
}

export const Background: React.FC<BackgroundProps> = ({
  scene,
  effect = "none",
  isMuted = true,
  disableYouTube = false,
}) => {
  const playerRef = useRef<any>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [youtubeError, setYoutubeError] = useState(false);
  // State to control whether YouTube player should be shown in modal for user interaction
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  // Track if we've ever successfully started playback
  const hasStartedPlayingRef = useRef(false);

  const getYoutubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Reset states when scene changes
  useEffect(() => {
    setImageLoaded(false);
    setShowYoutubeModal(false);
    hasStartedPlayingRef.current = false;
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

  // Check if YouTube is playing and handle modal visibility
  const checkAndShowModal = useCallback(() => {
    // setShowYoutubeModal(true);
    if (!playerRef.current || hasStartedPlayingRef.current) return;

    try {
      const playerState = playerRef.current.getPlayerState();
      // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
      if (playerState !== 1 && playerState !== 3) {
        // Try to play programmatically first
        playerRef.current.playVideo();

        // Set a timeout to check if playback actually started
        setTimeout(() => {
          if (!playerRef.current) return;
          const newState = playerRef.current.getPlayerState();
          if (
            newState !== 1 &&
            newState !== 3 &&
            !hasStartedPlayingRef.current
          ) {
            // Playback didn't start, show the modal for user to click directly
            setShowYoutubeModal(true);
          }
        }, 500);
      }
    } catch (e) {
      console.error("Error checking YouTube player state:", e);
    }
  }, []);

  // Handle window click for YouTube autoplay - now shows modal if autoplay fails
  useEffect(() => {
    if (scene.type !== "youtube" || disableYouTube) return;

    const handleWindowClick = () => {
      checkAndShowModal();
    };

    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [scene.type, disableYouTube, checkAndShowModal]);

  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    playerRef.current = event.target;
    // Set initial mute state
    if (isMuted) {
      event.target.mute();
    } else {
      event.target.unMute();
    }
    // Try to start playing
    event.target.playVideo();
  };

  // Handle state changes - detect when playback actually starts
  const onPlayerStateChange: YouTubeProps["onStateChange"] = (event) => {
    // If playing (state 1), hide modal and mark as started
    if (event.data === 1) {
      hasStartedPlayingRef.current = true;
      setShowYoutubeModal(false);
    }
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

      {scene.type === "youtube" && !disableYouTube && !youtubeError && (
        <>
          {/* Placeholder for where the YouTube player would appear in background */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Single YouTube player rendered via Portal - styling changes based on modal state */}
          {createPortal(
            <>
              {/* CSS keyframes for animation */}
              <style>{`
                @keyframes ytModalFadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
              `}</style>

              {/* Modal backdrop - only visible in modal mode */}
              {showYoutubeModal && (
                <div
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                  style={{
                    zIndex: 99998,
                    animation: "ytModalFadeIn 0.3s ease-out forwards",
                  }}
                  onClick={() => setShowYoutubeModal(false)}
                />
              )}

              {/* YouTube player container - changes position based on modal state */}
              <div
                className={
                  showYoutubeModal
                    ? "fixed w-[80vw] max-w-4xl aspect-video left-1/2 top-1/2 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black"
                    : "fixed inset-0 w-full h-full"
                }
                style={
                  showYoutubeModal
                    ? {
                        zIndex: 99999,
                        transform: "translate(-50%, -50%)",
                        animation: "ytModalFadeIn 0.3s ease-out forwards",
                      }
                    : {
                        zIndex: -1, // Behind everything when in background mode
                        pointerEvents: "none",
                      }
                }
              >
                {/* Instructional text & close button - only in modal mode */}
                {showYoutubeModal && (
                  <>
                    <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-black/60 text-white/90 text-sm">
                      Click the video to start playback
                    </div>
                    <button
                      onClick={() => setShowYoutubeModal(false)}
                      className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-all cursor-pointer"
                    >
                      ✕
                    </button>
                  </>
                )}

                {/* Single YouTube player */}
                <YouTube
                  videoId={getYoutubeVideoId(scene.url) || ""}
                  opts={youtubeOpts}
                  onReady={onPlayerReady}
                  onStateChange={onPlayerStateChange}
                  onError={() => {
                    console.error("YouTube player error");
                    setYoutubeError(true);
                  }}
                  className="w-full h-full"
                  iframeClassName={`w-full h-full ${
                    showYoutubeModal ? "" : "pointer-events-none"
                  }`}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </>,
            document.body
          )}
        </>
      )}

      {scene.type === "youtube" && (disableYouTube || youtubeError) && (
        <>
          {/* Fallback: solid color background when YouTube fails */}
          <div
            className="w-full h-full"
            style={{ backgroundColor: "#1a1a1a" }}
          />
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
