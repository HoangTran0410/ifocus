import React, { useState, useRef, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Youtube,
  ExternalLink,
  History,
  Play,
  Music as MusicIcon,
} from "lucide-react";
import { SoundTrack, SoundState } from "../types";

interface AudioControllerProps {
  sounds: SoundTrack[];
  soundStates: SoundState[];
  setSoundStates: (states: SoundState[]) => void;
  youtubeUrl: string;
  setYoutubeUrl: (url: string) => void;
  showYoutube: boolean;
  setShowYoutube: (show: boolean) => void;
  youtubeHistory: string[];
  addToHistory: (url: string) => void;
}

export const AudioController: React.FC<AudioControllerProps> = ({
  sounds,
  soundStates,
  setSoundStates,
  youtubeUrl,
  setYoutubeUrl,
  showYoutube,
  setShowYoutube,
  youtubeHistory,
  addToHistory,
}) => {
  const [activeTab, setActiveTab] = useState<"sounds" | "media">("sounds");
  const [inputUrl, setInputUrl] = useState(youtubeUrl);

  // Refs to hold audio elements
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    // Sync audio elements with state
    sounds.forEach((sound) => {
      if (!audioRefs.current[sound.id]) {
        audioRefs.current[sound.id] = new Audio(sound.url);
        audioRefs.current[sound.id].loop = true;
      }

      const audio = audioRefs.current[sound.id];
      const soundState = soundStates.find(s => s.id === sound.id);

      if (!soundState) return;

      audio.volume = soundState.volume;

      if (soundState.isPlaying) {
        // Prevent interruption error by checking promise
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) =>
            console.log("Audio play prevented:", error)
          );
        }
      } else {
        audio.pause();
      }
    });
  }, [sounds, soundStates]);

  const toggleSound = (id: string) => {
    const newStates = soundStates.map((s) =>
      s.id === id ? { ...s, isPlaying: !s.isPlaying } : s
    );
    setSoundStates(newStates);
  };

  const changeVolume = (id: string, vol: number) => {
    const newStates = soundStates.map((s) =>
      s.id === id ? { ...s, volume: vol } : s
    );
    setSoundStates(newStates);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    setYoutubeUrl(inputUrl);
    addToHistory(inputUrl);
    setShowYoutube(true);
  };

  const handleHistoryClick = (url: string) => {
    setInputUrl(url);
    setYoutubeUrl(url);
    setShowYoutube(true);
  };

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
    // Converts https://open.spotify.com/track/ID to https://open.spotify.com/embed/track/ID
    if (url.includes("open.spotify.com")) {
      let src = url;
      if (!url.includes("/embed")) {
        src = url.replace("open.spotify.com/", "open.spotify.com/embed/");
      }
      return { type: "spotify", src };
    }

    // Apple Music
    // Converts https://music.apple.com/us/album/ID to https://embed.music.apple.com/us/album/ID
    if (url.includes("music.apple.com")) {
      let src = url;
      if (!url.includes("embed.music.apple.com")) {
        src = url.replace("music.apple.com", "embed.music.apple.com");
      }
      return { type: "apple", src };
    }

    return null;
  };

  const embedInfo = getEmbedInfo(youtubeUrl);

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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
        {activeTab === "sounds" && (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {sounds.map((sound) => {
              const soundState = soundStates.find(s => s.id === sound.id);
              if (!soundState) return null;

              return (
                <div
                  key={sound.id}
                  onClick={() => toggleSound(sound.id)}
                  className={`cursor-pointer flex flex-col items-center p-4 rounded-2xl border transition-all duration-200 ${
                    soundState.isPlaying
                      ? "bg-white/20 border-white/40 shadow-lg scale-[1.02]"
                      : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
                  }`}
                >
                  <div className="text-3xl mb-2 filter drop-shadow-md">
                    {sound.emoji}
                  </div>
                  <div className="text-sm font-medium mb-3">{sound.name}</div>

                  <div
                    className="w-full h-6 flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={soundState.volume}
                      onChange={(e) =>
                        changeVolume(sound.id, parseFloat(e.target.value))
                      }
                      className={`w-full h-1 rounded-lg appearance-none cursor-pointer transition-colors ${
                        soundState.isPlaying
                          ? "bg-white/40 accent-white"
                          : "bg-white/10 accent-white/50"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "media" && (
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
                  className="bg-white text-black p-2 rounded-lg hover:bg-white/90"
                >
                  <ExternalLink size={18} />
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
                    onClick={() => setShowYoutube(!showYoutube)}
                    className="text-xs text-white/50 hover:text-white underline"
                  >
                    {showYoutube ? "Hide Player" : "Show Player"}
                  </button>
                </div>

                {showYoutube && (
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
                )}
                {!showYoutube && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center text-sm text-white/50">
                    Media is playing in background (hidden)
                  </div>
                )}
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
                    <button
                      key={idx}
                      onClick={() => handleHistoryClick(url)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 text-left group transition-colors"
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
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-white/30 leading-relaxed">
              Supports YouTube videos, Spotify tracks/playlists, and Apple Music
              albums. Paste the link and we'll handle the embed.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
