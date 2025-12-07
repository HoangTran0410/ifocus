import { Scene, SoundTrack, TimerMode, EffectType } from './types';

export const TIMER_SETTINGS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  clock: 0, // Placeholder, not used for counting down
};

export const DEFAULT_SCENES: Scene[] = [
  { id: 'rain-window', type: 'image', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=2560&auto=format&fit=crop', name: 'Rainy Window' },
  { id: 'forest-fog', type: 'image', url: 'https://images.unsplash.com/photo-1448375240586-dfd8d395ea6c?q=80&w=2560&auto=format&fit=crop', name: 'Foggy Forest' },
  { id: 'lofi-girl', type: 'youtube', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', name: 'Lofi Girl' },
  { id: 'coffee-jazz', type: 'youtube', url: 'https://www.youtube.com/watch?v=5qap5aO4i9A', name: 'Coffee Jazz' },
  { id: 'night-city', type: 'image', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2560&auto=format&fit=crop', name: 'Night City' },
  { id: 'loom-sky', type: 'image', url: 'https://images.unsplash.com/photo-1534067783941-51c9c2363063?q=80&w=2560&auto=format&fit=crop', name: 'Starry Sky' },
  { id: 'solid-dark', type: 'color', url: '#1a1a1a', name: 'Dark Mode' },
  { id: 'solid-warm', type: 'color', url: '#2c241b', name: 'Warm Brown' },
];

export const SEARCHABLE_SCENES: Scene[] = [
  ...DEFAULT_SCENES,
  { id: 'coffee-shop', type: 'image', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2560&auto=format&fit=crop', name: 'Coffee Shop' },
  { id: 'japan-street', type: 'image', url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2560&auto=format&fit=crop', name: 'Tokyo Street' },
  { id: 'train-journey', type: 'image', url: 'https://images.unsplash.com/photo-1531266752426-aad472b7bbf4?q=80&w=2560&auto=format&fit=crop', name: 'Train Journey' },
  { id: 'beach-sunset', type: 'image', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop', name: 'Beach Sunset' },
  { id: 'mountain-peak', type: 'image', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2560&auto=format&fit=crop', name: 'Mountain Peak' },
  { id: 'autumn-road', type: 'image', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2560&auto=format&fit=crop', name: 'Autumn Road' },
  { id: 'desk-setup', type: 'image', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2560&auto=format&fit=crop', name: 'Workspace' },
  { id: 'cabin', type: 'image', url: 'https://images.unsplash.com/photo-1449156493391-d2cfa28e468b?q=80&w=2560&auto=format&fit=crop', name: 'Cabin' },
  { id: 'underwater', type: 'image', url: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?q=80&w=2560&auto=format&fit=crop', name: 'Deep Ocean' },
  { id: 'zen-garden', type: 'image', url: 'https://images.unsplash.com/photo-1587162146766-e06b1189b907?q=80&w=2560&auto=format&fit=crop', name: 'Zen Garden' },
];

export const EFFECTS: { id: EffectType; name: string; icon: string }[] = [
  { id: 'none', name: 'None', icon: '🚫' },
  { id: 'rain', name: 'Rain', icon: '🌧️' },
  { id: 'heavy-rain', name: 'Heavy Rain', icon: '⛈️' },
  { id: 'snow', name: 'Snow', icon: '❄️' },
  { id: 'leaves', name: 'Leaves', icon: '🍂' },
  { id: 'cherry-blossom', name: 'Blossom', icon: '🌸' },
  { id: 'fireflies', name: 'Fireflies', icon: '✨' },
  { id: 'cloud-shadows', name: 'Clouds', icon: '☁️' },
  { id: 'sun-rays', name: 'Sun Rays', icon: '🌅' },
];

export const DEFAULT_SOUNDS: SoundTrack[] = [
  { id: 'rain', name: 'Rain', emoji: '🌧️', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg', volume: 0.5, isPlaying: false },
  { id: 'thunder', name: 'Thunder', emoji: '⚡', url: 'https://actions.google.com/sounds/v1/weather/thunderstorm.ogg', volume: 0.5, isPlaying: false },
  { id: 'fire', name: 'Fireplace', emoji: '🔥', url: 'https://actions.google.com/sounds/v1/ambiences/fireplace.ogg', volume: 0.5, isPlaying: false },
  { id: 'forest', name: 'Forest', emoji: '🌲', url: 'https://actions.google.com/sounds/v1/nature/forest_morning.ogg', volume: 0.5, isPlaying: false },
  { id: 'coffee', name: 'Cafe', emoji: '☕', url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg', volume: 0.5, isPlaying: false },
  { id: 'crickets', name: 'Night', emoji: '🦗', url: 'https://actions.google.com/sounds/v1/nature/jungle_atmosphere_late_night.ogg', volume: 0.5, isPlaying: false },
  { id: 'ocean', name: 'Waves', emoji: '🌊', url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rocks_wait.ogg', volume: 0.5, isPlaying: false },
  { id: 'wind', name: 'Wind', emoji: '💨', url: 'https://actions.google.com/sounds/v1/weather/wind_blowing_loops.ogg', volume: 0.5, isPlaying: false },
  { id: 'train', name: 'Train', emoji: '🚂', url: 'https://actions.google.com/sounds/v1/transportation/steam_train_whistle_distant.ogg', volume: 0.3, isPlaying: false },
  { id: 'chimes', name: 'Chimes', emoji: '🎐', url: 'https://actions.google.com/sounds/v1/foley/glasses_clinking.ogg', volume: 0.4, isPlaying: false },
  { id: 'fan', name: 'Fan', emoji: '🌀', url: 'https://actions.google.com/sounds/v1/household/vacuum_cleaner_running.ogg', volume: 0.2, isPlaying: false },
];
