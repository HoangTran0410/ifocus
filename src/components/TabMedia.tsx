import React, { useMemo, useState } from "react";
import { History, Play, Music as MusicIcon, X, Sparkles } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { DEFAULT_MUSIC } from "../constants";

export default function MediaTab() {
  const [youtubeUrl, setYoutubeUrl] = useLocalStorage<string>("zen_yt_url", "");
  const [youtubeHistory, setYoutubeHistory] = useLocalStorage<string[]>(
    "zen_yt_history",
    []
  );
  const [inputUrl, setInputUrl] = useState(youtubeUrl);

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
    <div className="space-y-6">
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

      <div className="text-xs text-white/30 leading-relaxed">
        Supports YouTube videos, Spotify tracks/playlists, and Apple Music
        albums. Paste the link and we'll handle the embed.
      </div>

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
    return {
      type: "youtube",
      src: `https://www.youtube.com/embed/${ytMatch[2]}?enablejsapi=1&origin=${window.location.origin}`,
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
