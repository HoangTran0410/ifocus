import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  History,
  Play,
  Pause,
  Music as MusicIcon,
  X,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
  Video,
  Repeat,
} from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { DEFAULT_MUSIC } from "../constants";
import {
  registerAudioElement,
  unregisterAudioElement,
} from "../utils/audioAnalyzer";
interface UploadedMedia {
  id: string;
  name: string;
  type: "audio" | "video";
  url: string;
  timestamp: number;
}

export default function MediaTab() {
  const [youtubeUrl, setYoutubeUrl] = useLocalStorage<string>("zen_yt_url", "");
  const [youtubeHistory, setYoutubeHistory] = useLocalStorage<string[]>(
    "zen_yt_history",
    []
  );
  const [inputUrl, setInputUrl] = useState(youtubeUrl);

  // Uploaded media state
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia | null>(
    null
  );
  const [isLooping, setIsLooping] = useLocalStorage<boolean>(
    "zen_media_loop",
    true
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useLocalStorage<number>("zen_media_volume", 0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync media element with state
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterAudioElement("uploaded-media");
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Cleanup previous blob URL
      if (uploadedMedia?.url.startsWith("blob:")) {
        URL.revokeObjectURL(uploadedMedia.url);
      }

      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video/");
      const media: UploadedMedia = {
        id: `media-${Date.now()}`,
        name: file.name,
        type: isVideo ? "video" : "audio",
        url,
        timestamp: Date.now(),
      };

      setUploadedMedia(media);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePlayPause = () => {
    if (!mediaRef.current) return;

    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);

      // Register audio element for mixer mode visualization
      registerAudioElement("uploaded-media", mediaRef.current);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (isMuted && vol > 0) setIsMuted(false);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const clearUploadedMedia = () => {
    if (uploadedMedia?.url.startsWith("blob:")) {
      URL.revokeObjectURL(uploadedMedia.url);
    }
    // Unregister from audio analyzer
    unregisterAudioElement("uploaded-media");
    setUploadedMedia(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const addToHistory = (url: string) => {
    const newHistory = [url, ...youtubeHistory.filter((u) => u !== url)].slice(
      0,
      5
    );
    setYoutubeHistory(newHistory);
  };

  const removeFromHistory = (url: string) => {
    setYoutubeHistory(youtubeHistory.filter((u) => u !== url));
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    setYoutubeUrl(inputUrl);
    addToHistory(inputUrl);
  };

  const handleHistoryClick = (url: string) => {
    setInputUrl(url);
    setYoutubeUrl(url);
  };

  const embedInfo = useMemo(() => getEmbedInfo(youtubeUrl), [youtubeUrl]);

  return (
    <div className="space-y-4">
      <form onSubmit={handleUrlSubmit} className="space-y-2">
        <label className="text-xs text-white/70 uppercase tracking-wider">
          Media URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="YouTube, Spotify, Apple Music..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/50 transition-colors"
          />
          <button
            type="submit"
            className="bg-white/10 text-white p-2 rounded-lg hover:bg-white/20"
          >
            <Play size={18} />
          </button>
        </div>
      </form>

      <div className="text-xs text-white/30 leading-relaxed">
        Supports YouTube videos, Spotify tracks/playlists, and Apple Music
        albums. Paste the link and we'll handle the embed.
      </div>

      {/* Upload from Device */}
      <div className="space-y-3">
        <label className="p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="audio/*,video/*"
            onChange={handleFileUpload}
          />
          <Upload size={18} className="text-white/50" />
          <span className="text-xs text-white/70 font-medium">
            Upload from device
          </span>
        </label>

        {/* Uploaded Media Player */}
        {uploadedMedia && uploadedMedia.url && (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                {uploadedMedia.type === "video" ? (
                  <Video size={16} className="text-purple-400 shrink-0" />
                ) : (
                  <MusicIcon size={16} className="text-blue-400 shrink-0" />
                )}
                <span className="text-sm font-medium truncate">
                  {uploadedMedia.name}
                </span>
              </div>
              <button
                onClick={clearUploadedMedia}
                className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded transition-all shrink-0"
                title="Close player"
              >
                <X size={16} />
              </button>
            </div>

            {/* Media Element */}
            <div className="relative">
              {uploadedMedia.type === "video" ? (
                <video
                  ref={mediaRef as React.RefObject<HTMLVideoElement>}
                  src={uploadedMedia.url}
                  className="w-full aspect-video bg-black"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => !isLooping && setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  playsInline
                  loop={isLooping}
                />
              ) : (
                <div className="p-6 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <audio
                    ref={mediaRef as React.RefObject<HTMLAudioElement>}
                    src={uploadedMedia.url}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => !isLooping && setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    loop={isLooping}
                  />
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                    <MusicIcon size={32} className="text-white/60" />
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-3 space-y-2">
              {/* Seek Bar */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 rounded-lg appearance-none cursor-pointer bg-white/20 accent-white"
                />
                <span className="text-xs text-white/50 w-10">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Play/Pause & Volume */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  {isPlaying ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} className="ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={18} />
                  ) : (
                    <Volume2 size={18} />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 rounded-lg appearance-none cursor-pointer bg-white/20 accent-white"
                />

                <div className="flex-1" />

                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-2 rounded transition-colors ${
                    isLooping
                      ? "text-white bg-white/20"
                      : "text-white/40 hover:text-white/60"
                  }`}
                  title={isLooping ? "Loop: On" : "Loop: Off"}
                >
                  <Repeat size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {embedInfo && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70 flex items-center gap-2">
              {embedInfo.type === "spotify"
                ? "Spotify"
                : embedInfo.type === "apple"
                ? "Apple Music"
                : "YouTube"}{" "}
              Player
            </span>
            <button
              onClick={() => {
                setYoutubeUrl("");
                setInputUrl("");
              }}
              className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded transition-all"
              title="Close player"
            >
              <X size={16} />
            </button>
          </div>

          <div
            className={`relative bg-black rounded-xl overflow-hidden shadow-lg border border-white/10 ${
              embedInfo.type === "youtube" ? "pt-[56.25%]" : "h-40"
            }`}
          >
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={embedInfo.src}
              title="Media player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ border: 0 }}
            ></iframe>
          </div>
        </div>
      )}

      {/* History Section */}
      {youtubeHistory.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-xs font-bold text-white/50 uppercase mb-3 flex items-center gap-2">
            <History size={12} /> Recent
          </h4>
          <div className="space-y-2">
            {youtubeHistory.map((url, idx) => (
              <div
                key={idx}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 text-left group transition-colors"
              >
                <button
                  onClick={() => handleHistoryClick(url)}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="w-8 h-6 bg-white/10 rounded flex items-center justify-center shrink-0">
                    {url.includes("spotify") ? (
                      <MusicIcon size={12} className="text-green-400" />
                    ) : url.includes("apple") ? (
                      <MusicIcon size={12} className="text-pink-500" />
                    ) : (
                      <Play size={10} fill="white" className="ml-0.5" />
                    )}
                  </div>
                  <span className="text-xs text-white/70 truncate flex-1 group-hover:text-white">
                    {url}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(url);
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 text-white/50 hover:text-white hover:bg-white/10 rounded transition-all shrink-0"
                  title="Remove from history"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommend Section */}
      <div className="border-t border-white/10 pt-4">
        <h4 className="text-xs font-bold text-white/50 uppercase mb-3 flex items-center gap-2">
          <Sparkles size={12} /> Recommended - No Copyright Music
        </h4>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">
          {DEFAULT_MUSIC.map((music) => (
            <button
              key={music.id}
              onClick={() => {
                const url = `https://www.youtube.com/watch?v=${music.videoId}`;
                setYoutubeUrl(url);
              }}
              className="group relative rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all text-left"
            >
              <div className="relative aspect-video">
                <img
                  src={music.thumbnailUrl}
                  alt={music.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Play size={14} fill="white" className="ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="p-2">
                <span className="text-xs text-white/80 line-clamp-2 group-hover:text-white transition-colors">
                  {music.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Improved Embed URL generator
const getEmbedInfo = (url: string) => {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  );
  if (ytMatch && ytMatch[2].length === 11) {
    const videoId = ytMatch[2];
    return {
      type: "youtube",
      src: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&loop=1&playlist=${videoId}`,
    };
  }

  // Spotify
  if (url.includes("open.spotify.com")) {
    let src = url;
    if (!url.includes("/embed")) {
      src = url.replace("open.spotify.com/", "open.spotify.com/embed/");
    }
    return { type: "spotify", src };
  }

  // Apple Music
  if (url.includes("music.apple.com")) {
    let src = url;
    if (!url.includes("embed.music.apple.com")) {
      src = url.replace("music.apple.com", "embed.music.apple.com");
    }
    return { type: "apple", src };
  }

  return null;
};
