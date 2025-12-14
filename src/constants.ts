import type {
  Scene,
  SoundTrack,
  TimerMode,
  EffectType,
  BgFilters,
  SyncVisualizerConfig,
} from "./types";

export const TIMER_SETTINGS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  clock: 0, // Placeholder, not used for counting down
  stopwatch: 0, // Starts at 0 and counts up
};

export const DEFAULT_BG_FILTERS: BgFilters = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  hueRotate: 0,
  invert: 0,
  opacity: 100,
  saturate: 100,
  sepia: 0,
};

export const DEFAULT_SYNC_VISUALIZER_CONFIG: SyncVisualizerConfig = {
  enabled: false,
  intensity: 0.12,
  speed: 0.15,
};

export const DEFAULT_IMAGES: Scene[] = [
  {
    id: "forest-fog",
    type: "image",
    url: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=150&auto=format&fit=crop",
    name: "Foggy Forest",
  },
  {
    id: "rain-window",
    type: "image",
    url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=150&auto=format&fit=crop",
    name: "Rainy Window",
  },
  {
    id: "coffee-shop",
    type: "image",
    url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop",
    name: "Coffee Shop",
  },
  {
    id: "japan-street",
    type: "image",
    url: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=150&auto=format&fit=crop",
    name: "Tokyo Street",
  },
  {
    id: "train-journey",
    type: "image",
    url: "https://images.unsplash.com/photo-1531266752426-aad472b7bbf4?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1531266752426-aad472b7bbf4?w=150&auto=format&fit=crop",
    name: "Train Journey",
  },
  {
    id: "beach-sunset",
    type: "image",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop",
    name: "Beach Sunset",
  },
  {
    id: "mountain-peak",
    type: "image",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=150&auto=format&fit=crop",
    name: "Mountain Peak",
  },
  {
    id: "autumn-road",
    type: "image",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&auto=format&fit=crop",
    name: "Autumn Road",
  },
  {
    id: "desk-setup",
    type: "image",
    url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=150&auto=format&fit=crop",
    name: "Workspace",
  },
  {
    id: "books",
    type: "image",
    url: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=150&auto=format&fit=crop",
    name: "Books",
  },
  {
    id: "city-sky",
    type: "image",
    url: "https://images.unsplash.com/photo-1587162146766-e06b1189b907?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1587162146766-e06b1189b907?w=150&auto=format&fit=crop",
    name: "City Sky",
  },
  {
    id: "night-city",
    type: "image",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=150&auto=format&fit=crop",
    name: "Night City",
  },
  {
    id: "loom-sky",
    type: "image",
    url: "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=150&auto=format&fit=crop",
    name: "Starry Sky",
  },
  {
    id: "purple",
    type: "image",
    url: "https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=150&auto=format&fit=crop",
    name: "Purple",
  },
  {
    id: "sunset",
    type: "image",
    url: "https://images.unsplash.com/photo-1502759683299-cdcd6974244f?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1502759683299-cdcd6974244f?w=150&auto=format&fit=crop",
    name: "Sunset",
  },
  {
    id: "astronaut",
    type: "image",
    url: "https://images.unsplash.com/photo-1674402728113-c6b4deac529e?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1674402728113-c6b4deac529e?w=150&auto=format&fit=crop",
    name: "Astronaut",
  },
  {
    id: "deep",
    type: "image",
    url: "https://images.unsplash.com/photo-1530053969600-caed2596d242?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=150&auto=format&fit=crop",
    name: "Deep",
  },
  {
    id: "water",
    type: "image",
    url: "https://images.unsplash.com/photo-1460501501851-d5946a18e552?q=80&w=2560&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1460501501851-d5946a18e552?w=150&auto=format&fit=crop",
    name: "Water",
  },
];

export const DEFAULT_COLORS: Scene[] = [
  { id: "solid-dark", type: "color", url: "#1a1a1a", name: "Dark Mode" },
  { id: "solid-warm", type: "color", url: "#2c241b", name: "Warm Brown" },
  // Focus colors - deep, stable tones that minimize distraction
  { id: "solid-navy", type: "color", url: "#0d1b2a", name: "Deep Navy" },
  {
    id: "solid-midnight",
    type: "color",
    url: "#1b2838",
    name: "Midnight Blue",
  },
  { id: "solid-charcoal", type: "color", url: "#2d2d2d", name: "Charcoal" },
  // Relaxation colors - calming, nature-inspired tones
  { id: "solid-forest", type: "color", url: "#1a2f1a", name: "Forest Green" },
  { id: "solid-teal", type: "color", url: "#1a3a3a", name: "Deep Teal" },
  { id: "solid-ocean", type: "color", url: "#0a2540", name: "Ocean Deep" },
  { id: "solid-sage", type: "color", url: "#2f3b2f", name: "Soft Sage" },
  // Meditation colors - soft, spiritual tones
  { id: "solid-purple", type: "color", url: "#2a1f3d", name: "Muted Purple" },
  {
    id: "solid-twilight",
    type: "color",
    url: "#2d1f47",
    name: "Twilight Purple",
  },
  { id: "solid-zen", type: "color", url: "#3a3a3a", name: "Zen Gray" },
];

export const DEFAULT_GRADIENTS: Scene[] = [
  // Focus gradients - smooth transitions for deep concentration
  {
    id: "gradient-aurora",
    type: "gradient",
    url: "linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #2a1f3d 100%)",
    name: "Aurora",
  },
  {
    id: "gradient-deep-space",
    type: "gradient",
    url: "linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)",
    name: "Deep Space",
  },
  {
    id: "gradient-cosmic",
    type: "gradient",
    url: "linear-gradient(135deg, #2d1f47 0%, #1a3a3a 100%)",
    name: "Cosmic",
  },
  // Relaxation gradients - nature-inspired flowing colors
  {
    id: "gradient-sunset",
    type: "gradient",
    url: "linear-gradient(180deg, #2c1810 0%, #3d2914 50%, #1a1a1a 100%)",
    name: "Sunset Calm",
  },
  {
    id: "gradient-ocean",
    type: "gradient",
    url: "linear-gradient(180deg, #0a2540 0%, #1a3a3a 50%, #0d1b2a 100%)",
    name: "Ocean Depth",
  },
  {
    id: "gradient-forest",
    type: "gradient",
    url: "linear-gradient(180deg, #1a2f1a 0%, #2f3b2f 50%, #1a1a1a 100%)",
    name: "Forest Mist",
  },
  // Meditation gradients - ethereal, spiritual transitions
  {
    id: "gradient-twilight",
    type: "gradient",
    url: "linear-gradient(180deg, #2d1f47 0%, #1b2838 50%, #0d1b2a 100%)",
    name: "Twilight",
  },
  {
    id: "gradient-zen",
    type: "gradient",
    url: "linear-gradient(180deg, #2f3b2f 0%, #3a3a3a 50%, #1a1a1a 100%)",
    name: "Zen Garden",
  },
  {
    id: "gradient-ember",
    type: "gradient",
    url: "linear-gradient(135deg, #1a0a0a 0%, #2c1810 50%, #1a1a1a 100%)",
    name: "Warm Ember",
  },
  {
    id: "gradient-northern",
    type: "gradient",
    url: "linear-gradient(180deg, #0d1b2a 0%, #1a3a3a 30%, #2a1f3d 70%, #0d1b2a 100%)",
    name: "Northern Lights",
  },
];

export const DEFAULT_VIDEOS: Scene[] = [
  {
    id: "202004-916894674",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/202004-916894674/1080p/index.m3u8",
    thumbnail:
      "https://cdn.studyfoc.us/studyfocus-1/202004-916894674/480p/thumb.jpg",
  },
  {
    id: "1448735-uhd_4096_2160_24fps",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/1448735-uhd_4096_2160_24fps/1080p/index.m3u8",
    thumbnail:
      "https://cdn.studyfoc.us/studyfocus-1/1448735-uhd_4096_2160_24fps/480p/thumb.jpg",
  },
  {
    id: "1720220-uhd_3840_2160_25fps",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/1720220-uhd_3840_2160_25fps/1080p/index.m3u8",
    thumbnail:
      "https://cdn.studyfoc.us/studyfocus-1/1720220-uhd_3840_2160_25fps/480p/thumb.jpg",
  },
  {
    id: "266786",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/266786/1080p/index.m3u8",
    thumbnail: "https://cdn.studyfoc.us/studyfocus-1/266786/480p/thumb.jpg",
  },
  {
    id: "7094565-uhd_3840_2160_25fps",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/7094565-uhd_3840_2160_25fps/1080p/index.m3u8",
    thumbnail:
      "https://cdn.studyfoc.us/studyfocus-1/7094565-uhd_3840_2160_25fps/480p/thumb.jpg",
  },
  {
    id: "118087-713900116",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/118087-713900116/1080p/index.m3u8",
    thumbnail:
      "https://cdn.studyfoc.us/studyfocus-1/118087-713900116/480p/thumb.jpg",
  },
  {
    id: "148134-793525322",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/148134-793525322/1080p/index.m3u8",
    thumbnail:
      "https://cdn.studyfoc.us/studyfocus-1/148134-793525322/480p/thumb.jpg",
  },
  {
    id: "176303-855196335",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/176303-855196335/1080p/index.m3u8",
    thumbnail:
      "https://cdn.studyfoc.us/studyfocus-1/176303-855196335/480p/thumb.jpg",
  },
  {
    id: "203878-922675732",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/203878-922675732/1080p/index.m3u8",
    thumbnail:
      "https://cdn.studyfoc.us/studyfocus-1/203878-922675732/480p/thumb.jpg",
  },
  {
    id: "226711",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/226711/1080p/index.m3u8",
    thumbnail: "https://cdn.studyfoc.us/studyfocus-1/226711/480p/thumb.jpg",
  },
  {
    id: "270507",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/270507/1080p/index.m3u8",
    thumbnail: "https://cdn.studyfoc.us/studyfocus-1/270507/480p/thumb.jpg",
  },
  {
    id: "270940",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/270940/1080p/index.m3u8",
    thumbnail: "https://cdn.studyfoc.us/studyfocus-1/270940/480p/thumb.jpg",
  },
  {
    id: "270983",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/270983/1080p/index.m3u8",
    thumbnail: "https://cdn.studyfoc.us/studyfocus-1/270983/480p/thumb.jpg",
  },
  {
    id: "6847-196978755",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/6847-196978755/1080p/index.m3u8",
    thumbnail:
      "https://cdn.studyfoc.us/studyfocus-1/6847-196978755/480p/thumb.jpg",
  },
  {
    id: "856171-hd_1920_1080_30fps",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/856171-hd_1920_1080_30fps/720p/index.m3u8",
    thumbnail:
      "https://cdn.studyfoc.us/studyfocus-1/856171-hd_1920_1080_30fps/480p/thumb.jpg",
  },
  {
    id: "91562-629172467",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/91562-629172467/1080p/index.m3u8",
    thumbnail:
      "https://cdn.studyfoc.us/studyfocus-1/91562-629172467/480p/thumb.jpg",
  },
  {
    id: "9584-220312371",
    name: "studyfoc.us",
    type: "video",
    url: "https://cdn.studyfoc.us/studyfocus-1/9584-220312371/1080p/index.m3u8",
    thumbnail:
      "https://cdn.studyfoc.us/studyfocus-1/9584-220312371/480p/thumb.jpg",
  },
];

export const DEFAULT_YOUTUBE: Scene[] = [
  {
    id: "lofi-girl",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    name: "Lofi Girl",
  },
  {
    id: "beach",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=8HDjaAV_12s",
    name: "Beach",
  },
  {
    id: "beach-purple",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=ZMOjfn-wyOQ",
    name: "Purple Beach",
  },
  {
    id: "train-japan",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=q8nPaqfRm_c",
    name: "Train Japan",
  },
  {
    id: "city-night",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=-Xh4BNbxpI8",
    name: "City Night",
  },
  {
    id: "drive",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=4UOOcSfkbQQ",
    name: "Sunset Drive",
  },
  {
    id: "rainy-day",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=HXvFSwm-ITo",
    name: "Rainy Day",
  },
  {
    id: "calm-rain",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=JbJ0sYt9Nyk",
    name: "Calm Rain",
  },
  {
    id: "white-noise-rain",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=yIQd2Ya0Ziw",
    name: "White Noise Rain",
  },
  {
    id: "deep-rain",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=0dcFWLV_OlI",
    name: "Deep Rain",
  },
  {
    id: "just-relax",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=zuCRSwWssVk",
    name: "Just Relax",
  },
  {
    id: "aquarium",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=XVkADAwOXnU",
    name: "Aquarium",
  },
  {
    id: "walk",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=qgfd-uWTVwg",
    name: "Walk",
  },
  {
    id: "road",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=2AH5t_o7lmg",
    name: "Road",
  },
  {
    id: "HDR",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=UYmvFzDuO5k",
    name: "HDR",
  },
  {
    id: "weeknd-lofi",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=wVKDb9RTkrI",
    name: "Weeknd Lofi",
  },
  {
    id: "no-ai-lofi",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=mT4g0paZ5gI",
    name: "No AI Lofi",
  },
  {
    id: "c418",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=5ZYZ5HeuNsg",
    name: "C418",
  },
  {
    id: "interstellar",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=WHqbqzqeskw", // "https://www.youtube.com/watch?v=UDVtMYqUAyw",
    name: "Interstellar",
  },
  {
    id: "purple-cat",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=kLvZUXtVXQ0",
    name: "Purple Cat",
  },
  {
    id: "sontung",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=IfYjuHnAAFU",
    name: "Sơn Tùng MTP",
  },
  {
    id: "tet",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=4qArfv4C2Lg",
    name: "Tết",
  },
  {
    id: "macos-redwood",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=Riqc0t4HA0Q",
    name: "MacOS Redwood",
  },
  {
    id: "macos-soloma-horizon",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=NGFFNsxQ-Mg",
    name: "MacOS Soloma Horizon",
  },
  {
    id: "macos-soloma-evening",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=jS3veX19cxk",
    name: "MacOS Soloma Evening",
  },
  {
    id: "macos-sunset",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=OrLMdAT4zIY",
    name: "MacOS Sunset",
  },
  {
    id: "macos-dubai",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=oH0npaIHSfA",
    name: "MacOS Dubai",
  },
  {
    id: "macos-himalaya",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=6AcnOJcM8oo",
    name: "MacOS Himalaya",
  },
  {
    id: "macos-reservoir",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=zQVWAfpRvZg",
    name: "MacOS Reservoir",
  },
  {
    id: "macos-tea-garden",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=CGgj95GhG0k",
    name: "MacOS Tea Garden",
  },
];

export const EFFECTS: { id: EffectType; name: string; icon: string }[] = [
  { id: "none", name: "None", icon: "🚫" },
  { id: "rain", name: "Rain", icon: "🌧️" },
  { id: "heavy-rain", name: "Heavy Rain", icon: "⛈️" },
  { id: "snow", name: "Snow", icon: "❄️" },
  { id: "leaves", name: "Leaves", icon: "🍂" },
  { id: "cherry-blossom", name: "Blossom", icon: "🌸" },
  { id: "fireflies", name: "Fireflies", icon: "✨" },
  { id: "cloud-shadows", name: "Clouds", icon: "☁️" },
  { id: "sun-rays", name: "Sun Rays", icon: "🌅" },
];

export const DEFAULT_SOUNDS: SoundTrack[] = [
  {
    id: "rain",
    emoji: "🌧️",
    name: "rain",
    url: () => import("./assets/sounds/rain.mp3"),
    category: "Nature",
  },
  {
    id: "bird",
    emoji: "🐦",
    name: "birds",
    url: () => import("./assets/sounds/bird.mp3"),
    category: "Nature",
  },
  {
    id: "bubble",
    emoji: "🫧",
    name: "bubble",
    url: () => import("./assets/sounds/bubble.mp3"),
    category: "Nature",
  },
  {
    id: "chicken",
    emoji: "🐓",
    name: "chicken",
    url: () => import("./assets/sounds/chicken.mp3"),
    category: "Nature",
  },
  {
    id: "fire",
    emoji: "🔥",
    name: "fire",
    url: () => import("./assets/sounds/fire.mp3"),
    category: "Nature",
  },
  {
    id: "night",
    emoji: "🌘",
    name: "night",
    url: () => import("./assets/sounds/night.mp3"),
    category: "Nature",
  },
  {
    id: "thunder",
    emoji: "⚡️",
    name: "thunder",
    url: () => import("./assets/sounds/thunder.mp3"),
    category: "Nature",
  },
  {
    id: "tractor",
    emoji: "🚜",
    name: "tractor",
    url: () => import("./assets/sounds/tractor.mp3"),
    category: "Nature",
  },
  {
    id: "water",
    emoji: "💦",
    name: "water",
    url: () => import("./assets/sounds/waterflow.mp3"),
    category: "Nature",
  },
  {
    id: "waves",
    emoji: "🌊",
    name: "ocean",
    url: () => import("./assets/sounds/ocean.mp3"),
    category: "Nature",
  },
  {
    id: "brown-noise",
    emoji: "🤎",
    name: "brown noise",
    url: () => import("./assets/sounds/soft-brown-noise.mp3"),
    category: "Noise",
  },
  {
    id: "pink-noise",
    emoji: "🩷",
    name: "pink noise",
    url: () => import("./assets/sounds/pink_noise.mp3"),
    category: "Noise",
  },
  {
    id: "white-noise",
    emoji: "🤍",
    name: "white noise",
    url: () => import("./assets/sounds/white-noise.mp3"),
    category: "Noise",
  },
  {
    id: "chalk",
    emoji: "✏️",
    name: "chalk",
    url: () => import("./assets/sounds/chalk.mp3"),
    category: "Office",
  },
  {
    id: "mouse-click-2",
    emoji: "🖱️",
    name: "mouse click",
    url: () => import("./assets/sounds/mouse-click.mp3"),
    category: "Office",
  },
  {
    id: "keyboard",
    emoji: "⌨️",
    name: "keyboard",
    url: () => import("./assets/sounds/typing.mp3"),
    category: "Office",
  },
  {
    id: "writing",
    emoji: "✍️",
    name: "writing",
    url: () => import("./assets/sounds/writing.mp3"),
    category: "Office",
  },
  {
    id: "airplane",
    emoji: "✈️",
    name: "airplane",
    url: () => import("./assets/sounds/airplane.mp3"),
    category: "Urban",
  },
  {
    id: "city",
    emoji: "🏙️",
    name: "city",
    url: () => import("./assets/sounds/city.mp3"),
    category: "Urban",
  },
  {
    id: "cafe",
    emoji: "☕",
    name: "cafe",
    url: () => import("./assets/sounds/coffee.mp3"),
    category: "Urban",
  },
  {
    id: "train",
    emoji: "🚆",
    name: "railway",
    url: () => import("./assets/sounds/railway.mp3"),
    category: "Urban",
  },
  {
    id: "fan",
    emoji: "💨",
    name: "fan",
    url: () => import("./assets/sounds/ceiling-fan.mp3"),
    category: "Urban",
  },
  {
    id: "old-clock",
    emoji: "🕰️",
    name: "clock",
    url: () => import("./assets/sounds/old-clock.mp3"),
    category: "Urban",
  },
];
