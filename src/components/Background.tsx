import React, { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { YouTubeProps } from "react-youtube";
import loadable from "@loadable/component";
import { LoadingFallback } from "../utils/loader";
import { isAudioCaptureActive, detectBeat } from "../utils/audioAnalyzer";
import {
  DEFAULT_BG_FILTERS,
  DEFAULT_SYNC_VISUALIZER_CONFIG,
} from "../constants";
import {
  useCurrentScene,
  useCurrentEffect,
  useIsBgMuted,
  useBgFilters,
  useBgInitialZoom,
  useSyncVisualizerConfig,
  useShowVideoModal,
  useSetShowVideoModal,
} from "../stores/useAppStore";

const YouTube = loadable(() => import("react-youtube"), {
  fallback: LoadingFallback,
});
const EffectsLayer = loadable(() => import("./EffectsLayer"), {
  fallback: LoadingFallback,
});

interface BackgroundProps {
  disableYouTube?: boolean; // Option to disable YouTube for PiP
  isPiP?: boolean; // When true, don't use portals (they'd render to wrong document)
}

export default function Background({
  disableYouTube = false,
  isPiP = false,
}: BackgroundProps) {
  // Get state from Zustand store
  const scene = useCurrentScene();
  const effect = useCurrentEffect();
  const isMuted = useIsBgMuted();
  const bgFilters = useBgFilters();
  const bgInitialZoom = useBgInitialZoom();
  const syncVisualizerConfig = useSyncVisualizerConfig();
  const showVideoModal = useShowVideoModal();
  const setShowVideoModal = useSetShowVideoModal();

  const playerRef = useRef<any>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [youtubeError, setYoutubeError] = useState(false);
  // State to control whether YouTube player should be shown in modal for user interaction
  const [internalShowYoutubeModal, setInternalShowYoutubeModal] =
    useState(false);
  // Track if we've ever successfully started playback
  const hasStartedPlayingRef = useRef(false);

  const isModal = showVideoModal || internalShowYoutubeModal;

  // Ref for direct DOM manipulation (avoids React re-renders for smooth animation)
  const bgContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);

  // Merge with defaults to handle missing properties
  const syncConfig = {
    ...DEFAULT_SYNC_VISUALIZER_CONFIG,
    ...syncVisualizerConfig,
  };

  // Generate CSS filter string from settings
  const getFilterStyle = () => {
    const filters: string[] = [];

    // Merge with defaults to handle missing properties
    const f = { ...DEFAULT_BG_FILTERS, ...bgFilters };

    if (f.blur > 0) {
      filters.push(`blur(${f.blur}px)`);
    }
    if (f.brightness !== 100) {
      filters.push(`brightness(${f.brightness}%)`);
    }
    if (f.contrast !== 100) {
      filters.push(`contrast(${f.contrast}%)`);
    }
    if (f.grayscale > 0) {
      filters.push(`grayscale(${f.grayscale}%)`);
    }
    if (f.hueRotate !== 0) {
      filters.push(`hue-rotate(${f.hueRotate}deg)`);
    }
    if (f.invert > 0) {
      filters.push(`invert(${f.invert}%)`);
    }
    if (f.opacity !== 100) {
      filters.push(`opacity(${f.opacity}%)`);
    }
    if (f.saturate !== 100) {
      filters.push(`saturate(${f.saturate}%)`);
    }
    if (f.sepia > 0) {
      filters.push(`sepia(${f.sepia}%)`);
    }

    return filters.length > 0 ? filters.join(" ") : "none";
  };

  // Calculate initial zoom scale
  const getInitialZoomScale = () => bgInitialZoom / 100;

  // Audio-reactive zoom effect using requestAnimationFrame + direct DOM manipulation
  useEffect(() => {
    const baseZoom = getInitialZoomScale();

    if (!syncConfig.enabled) {
      // Apply only initial zoom when audio zoom is disabled
      if (bgContainerRef.current) {
        bgContainerRef.current.style.transform = `scale(${baseZoom})`;
      }
      return;
    }

    let currentZoom = baseZoom;

    const updateZoom = () => {
      if (bgContainerRef.current) {
        if (isAudioCaptureActive()) {
          // Use beat detection instead of average frequency
          const beatIntensity = detectBeat();

          // Calculate target zoom based on beat intensity (using prop)
          const targetZoom = baseZoom + beatIntensity * syncConfig.intensity;

          // Smooth transition towards target (using prop)
          currentZoom += (targetZoom - currentZoom) * syncConfig.speed;

          bgContainerRef.current.style.transform = `scale(${currentZoom})`;
        } else {
          // Smoothly return to base zoom when no audio
          currentZoom += (baseZoom - currentZoom) * syncConfig.speed;
          bgContainerRef.current.style.transform = `scale(${currentZoom})`;
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateZoom);
    };

    animationFrameRef.current = requestAnimationFrame(updateZoom);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (bgContainerRef.current) {
        bgContainerRef.current.style.transform = `scale(${baseZoom})`;
      }
    };
  }, [
    syncConfig.enabled,
    syncConfig.speed,
    syncConfig.intensity,
    bgInitialZoom,
  ]);

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

    // Programmatically load image to detect when ready (works in PiP context)
    if (scene.type === "image") {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = scene.url;
    }

    // Clear player ref when scene changes to prevent stale references
    // This helps avoid the "Cannot read properties of null" error
    return () => {
      playerRef.current = null;
    };
  }, [scene.url, scene.type, setShowVideoModal]);

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

  const renderVideo = () => (
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
    </>
  );

  const renderEffect = () => (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <EffectsLayer type={effect} />
    </div>
  );

  return (
    <div
      ref={bgContainerRef}
      className="absolute inset-0 w-full h-full -z-10 overflow-hidden bg-black"
      style={{
        filter: getFilterStyle(),
        transformOrigin: "center center",
        transition: "filter 700ms ease-in-out, opacity 700ms ease-in-out", // Only transition filter and opacity, not transform
      }}
    >
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
          {isPiP ? renderVideo() : createPortal(renderVideo(), document.body)}
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
      {isPiP ? renderEffect() : createPortal(renderEffect(), document.body)}
    </div>
  );
}
