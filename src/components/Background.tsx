import React, { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { YouTubeProps } from "react-youtube";
import { Scene, EffectType } from "../types";
import loadable from "@loadable/component";
import { LoadingFallback } from "../utils/loader";

const YouTube = loadable(() => import("react-youtube"), {
  fallback: LoadingFallback,
});
const EffectsLayer = loadable(() => import("./EffectsLayer"), {
  fallback: LoadingFallback,
});

interface BackgroundProps {
  scene: Scene;
  effect?: EffectType;
  isMuted?: boolean;
  disableYouTube?: boolean; // Option to disable YouTube for PiP
  showVideoModal?: boolean;
  setShowVideoModal?: (show: boolean) => void;
  isPiP?: boolean; // When true, don't use portals (they'd render to wrong document)
}

export default function Background({
  scene,
  effect = "none",
  isMuted = true,
  disableYouTube = false,
  showVideoModal = false,
  setShowVideoModal = (_: boolean) => {},
  isPiP = false,
}: BackgroundProps) {
  const playerRef = useRef<any>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [youtubeError, setYoutubeError] = useState(false);
  // State to control whether YouTube player should be shown in modal for user interaction
  const [internalShowYoutubeModal, setInternalShowYoutubeModal] =
    useState(false);
  // Track if we've ever successfully started playback
  const hasStartedPlayingRef = useRef(false);

  const isModal = showVideoModal || internalShowYoutubeModal;

  const handleCloseModal = () => {
    setShowVideoModal(false);
    setInternalShowYoutubeModal(false);
  };

  const getYoutubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Reset states when scene changes
  useEffect(() => {
    setImageLoaded(false);
    setShowVideoModal(false);
    setInternalShowYoutubeModal(false);
    hasStartedPlayingRef.current = false;

    // Clear player ref when scene changes to prevent stale references
    // This helps avoid the "Cannot read properties of null" error
    return () => {
      playerRef.current = null;
    };
  }, [scene.url, setShowVideoModal]);

  // Handle mute/unmute changes
  useEffect(() => {
    if (playerRef.current && scene.type === "youtube") {
      try {
        if (isMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
        }
      } catch (e) {
        console.warn("Error changing mute state:", e);
      }
    }
  }, [isMuted, scene.type]);

  // Check if YouTube is playing and handle modal visibility
  const checkAndShowModal = useCallback(() => {
    if (!playerRef.current || hasStartedPlayingRef.current) return;

    try {
      const playerState = playerRef.current.getPlayerState?.();
      if (playerState === undefined) return; // Player not ready

      // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
      if (playerState !== 1 && playerState !== 3) {
        // Try to play programmatically first
        playerRef.current.playVideo?.();

        // Set a timeout to check if playback actually started
        setTimeout(() => {
          if (!playerRef.current) return;
          try {
            const newState = playerRef.current.getPlayerState?.();
            if (
              newState !== undefined &&
              newState !== 1 &&
              newState !== 3 &&
              !hasStartedPlayingRef.current
            ) {
              // Playback didn't start, show the modal for user to click directly
              setInternalShowYoutubeModal(true);
            }
          } catch (e) {
            console.warn("Error checking player state:", e);
          }
        }, 500);
      }
    } catch (e) {
      console.warn("Error checking YouTube player state:", e);
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
    try {
      playerRef.current = event.target;
      // Set initial mute state
      if (isMuted) {
        event.target.mute();
      } else {
        event.target.unMute();
      }
      // Try to start playing
      event.target.playVideo();
    } catch (e) {
      console.warn("Error in onPlayerReady:", e);
    }
  };

  // Handle state changes - detect when playback actually starts
  const onPlayerStateChange: YouTubeProps["onStateChange"] = (event) => {
    try {
      // If playing (state 1), hide modal and mark as started
      if (event.data === 1) {
        hasStartedPlayingRef.current = true;
        setInternalShowYoutubeModal(false);
      }
    } catch (e) {
      console.warn("Error in onPlayerStateChange:", e);
    }
  };

  // Error handler for YouTube player
  const onPlayerError: YouTubeProps["onError"] = (event) => {
    console.error("YouTube player error:", event.data);
    // Don't set youtubeError for recoverable errors (like video unavailable)
    // Only set it for fatal errors that prevent any playback
    if (event.data === 150 || event.data === 101) {
      // Video unavailable or embedding restricted - these are recoverable
      console.warn("Video may be unavailable or embedding restricted");
    } else {
      setYoutubeError(true);
    }
  };

  const youtubeOpts: YouTubeProps["opts"] = {
    playerVars: {
      autoplay: 1,
      mute: 1,
      controls: 1,
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

      {scene.type === "gradient" && (
        <div className="w-full h-full" style={{ background: scene.url }} />
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

      {(scene.type === "video" ||
        (scene.type === "youtube" && !disableYouTube && !youtubeError)) && (
        <>
          {/* Placeholder for where the video/YouTube player would appear in background */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Single Video/YouTube player rendered via Portal - styling changes based on modal state */}
          {createPortal(
            <>
              {/* CSS keyframes for animation */}
              <style>{`
                @keyframes modalFadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
              `}</style>

              {/* Modal backdrop - only visible in modal mode */}
              {isModal && (
                <div
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                  style={{
                    zIndex: 99998,
                    animation: "modalFadeIn 0.3s ease-out forwards",
                  }}
                  onClick={handleCloseModal}
                />
              )}

              {/* Video/YouTube player container - changes position based on modal state */}
              <div
                className={
                  isModal
                    ? "fixed w-[80vw] max-w-4xl aspect-video left-1/2 top-1/2 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black"
                    : "fixed inset-0 w-full h-full"
                }
                style={
                  isModal
                    ? {
                        zIndex: 99999,
                        transform: "translate(-50%, -50%)",
                        animation: "modalFadeIn 0.3s ease-out forwards",
                      }
                    : {
                        zIndex: -1, // Behind everything when in background mode
                        pointerEvents: "none",
                      }
                }
              >
                {/* Instructional text & close button - only in modal mode */}
                {isModal && (
                  <>
                    {scene.type === "youtube" &&
                      internalShowYoutubeModal &&
                      !hasStartedPlayingRef.current && (
                        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-black/60 text-white/90 text-sm">
                          Click the video to start playback
                        </div>
                      )}
                    <button
                      onClick={handleCloseModal}
                      className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-all cursor-pointer"
                    >
                      ✕
                    </button>
                  </>
                )}

                {scene.type === "video" ? (
                  <video
                    autoPlay
                    loop
                    muted={isMuted}
                    controls={isModal}
                    playsInline
                    className="w-full h-full object-cover"
                    key={scene.url}
                  >
                    <source src={scene.url} type="video/mp4" />
                  </video>
                ) : (
                  /* Single YouTube player */
                  <YouTube
                    videoId={getYoutubeVideoId(scene.url) || ""}
                    opts={youtubeOpts}
                    onReady={onPlayerReady}
                    onStateChange={onPlayerStateChange}
                    onError={onPlayerError}
                    className="w-full h-full"
                    iframeClassName={`w-full h-full ${
                      isModal ? "" : "pointer-events-none"
                    }`}
                    style={{ width: "100%", height: "100%" }}
                    key={scene.url} // Only reload when scene URL changes
                  />
                )}
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

      {/* Canvas Effects - rendered via Portal to appear above YouTube iframe (except in PiP) */}
      {isPiP ? (
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <EffectsLayer type={effect} />
        </div>
      ) : (
        createPortal(
          <div
            className="fixed inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <EffectsLayer type={effect} />
          </div>,
          document.body
        )
      )}
    </div>
  );
}
