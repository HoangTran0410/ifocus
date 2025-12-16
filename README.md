# iFocus 🎯

A beautiful, feature-rich **Pomodoro Timer** with stunning **Music Visualizer** effects. Stay focused and productive with immersive backgrounds, ambient sounds, and mesmerizing audio-reactive visualizations.

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite)

## Demo

[Try it Online](https://hoangtran0410.github.io/ifocus/)

[Facebook Post 1](https://www.facebook.com/share/p/14S6yGbuV23/)

[Facebook Post 2](https://www.facebook.com/share/p/1BrAqb1Rap/)

## ✨ Features

### 🍅 Pomodoro Timer
- **Pomodoro sessions** with customizable work/break durations
- **Stopwatch mode** for flexible time tracking
- **Clock display** to keep track of time
- Persistent state across sessions

### 🎨 Music Visualizer
**59 stunning audio-reactive visualizations** organized in two categories:

#### Canvas-based (21 visualizers)
- 📊 **Bars** - Classic frequency bars
- 🌊 **Wave** - Flowing waveform
- 🟣 **Circular** - Radial frequency display
- 🔊 **TrapNation** - Popular music video style
- 🌈 **Spectrum** - Audio spectrum
- ✨ **Particles** - Floating particles
- 🧬 **DnaHelix** - Spiraling structure
- 〰️ **Oscilloscope** - Classic waveform
- 🔆 **RadialLines** - Radiating lines
- 🌌 **Galaxy** - Rotating star systems
- ⚫ **BlackHole** - Cosmic vortex
- 💻 **Matrix** - Digital rain
- 🎆 **Fireworks** - Explosive particles
- 🌠 **Aurora** - Northern lights effect
- 💍 **Rings** - Concentric circles
- 📈 **Waveform3D** - Three-dimensional waves
- ⭐ **Starfield** - 3D space travel
- ⚛️ **Plasma** - Plasma effect
- ⚡ **Lightning** - Electric bolts
- 🐝 **Hexagons** - Honeycomb grid
- 🌿 **Fractal** - Fractal patterns

#### WebGL-based (38 visualizers)
- 💧 **Fluid** - Fluid simulation
- 🕳️ **BlackHole** - Gravitational lensing
- 🌀 **Accretion** - Accretion disk
- ⚡ **Lightning** - Electric storm
- 🌅 **Sunset** - Scenic sunset
- 🎲 **HoloDice** - Holographic dice
- 📦 **Cube** - 3D cube
- ☁️ **Clouds** - Volumetric clouds
- 🌌 **Universe** - Cosmic universe
- ✨ **Kuko** - Abstract art
- 🧵 **Fiber** - Fiber optics
- ⚡ **Zippy** - Fast motion
- 🎨 **Art** - Generative art
- 🌟 **StarNest** - Star formation
- 🏞️ **Landscape** - Procedural terrain
- 🔥 **Fire** - Realistic flames
- 💎 **Fragment** - Fragment shader
- 🪐 **Orbital** - Orbital mechanics
- 🎨 **Palettes** - Color palettes
- 🍩 **Torus** - 3D torus
- 🐳 **Aqua** - Underwater effect
- 🔺 **Fractal** - Fractal pyramid
- 🧊 **4D** - Four-dimensional
- 🔮 **Sphere** - 3D sphere
- 💚 **Matrix** - Digital rain
- 🌈 **Spectrum** - Spectrum
- 🔥 **Flame** - Flame effect
- 🌀 **Portal** - Dimensional portal
- ⚛️ **Plasma** - Plasma
- 🚗 **Drive** - Driving simulation
- 🌈 **Rainbow** - Rainbow colors
- ✡️ **Octagram** - Geometric octagram
- 💓 **Beat** - Beat reactive
- 👁️ **Eye** - Eye effect
- 🌌 **Lensing** - Gravitational lensing
- 🌀 **Julia** - Julia set fractal
- 🔄 **Inversion** - Inversion effect
- 🌊 **Liquid** - Liquid effect

### 🖼️ Dynamic Backgrounds
- **Image backgrounds** - Static images or AI-generated
- **Video backgrounds** - Local MP4 or YouTube embed
- **Color gradients** - Beautiful color transitions
- **Background filters** - Blur, grayscale, sepia, invert
- **Beat sync** - Zoom with music intensity

### 🎵 Audio Controller
- **YouTube integration** - Play audio from YouTube videos
- **Local audio files** - Upload your own music
- **Audio history** - Quick access to recent tracks
- **Audio analysis** - Real-time frequency data for visualizer

### 📝 Productivity Tools
- **Task management** - Create and track todos
- **Notes** - Quick note-taking
- **Fullscreen mode** - Distraction-free focus
- **Picture-in-Picture** - Keep timer visible while working

### 🎭 Visual Effects
- Customizable visual effects layer
- Screen effects and overlays
- Smooth animations and transitions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun

### Installation

```bash
# Clone the repository
git clone https://github.com/hoangtran0410/ifocus.git
cd ifocus

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
# or
bun run build
```

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Zustand** - State management
- **Lucide React** - Icons
- **Web Audio API** - Audio analysis
- **Canvas API** - Visualizations
- **Document PiP API** - Picture-in-Picture

## 📁 Project Structure

```
ifocus/
├── src/
│   ├── components/           # React components
│   │   ├── AudioController.tsx   # Audio playback & YouTube integration
│   │   ├── Background.tsx        # Dynamic backgrounds
│   │   ├── EffectsLayer.tsx      # Visual effects overlay
│   │   ├── EffectsSelector.tsx   # Effects configuration UI
│   │   ├── Notes.tsx             # Note-taking component
│   │   ├── PiPContent.tsx        # Picture-in-Picture content
│   │   ├── SceneSelector.tsx     # Background & scene settings
│   │   ├── Tasks.tsx             # Task management
│   │   ├── Timer.tsx             # Pomodoro timer & clock
│   │   └── Visualizer.tsx        # Audio visualizer controller
│   ├── visualizers/          # 59 visualizer effects
│   │   ├── simple/               # Canvas-based (21 visualizers)
│   │   ├── shader/               # WebGL-based (38 visualizers)
│   │   ├── utils/                # Shared visualizer utilities
│   │   ├── index.ts              # Visualizer registry & loader
│   │   └── types.ts              # Visualizer type definitions
│   ├── hooks/                # Custom React hooks
│   │   ├── useDebounce.ts        # Debounce utility hook
│   │   ├── useLocalStorage.ts    # LocalStorage persistence
│   │   └── useMobile.ts          # Mobile device detection
│   ├── stores/               # Zustand stores
│   │   └── useAppStore.ts        # Global application state
│   ├── utils/                # Utility functions
│   │   ├── audioAnalyzer.ts      # Web Audio API analysis
│   │   └── loader.tsx            # Lazy loading utilities
│   ├── assets/               # Static assets (images, icons)
│   ├── App.tsx               # Main application
│   ├── constants.ts          # App constants & defaults
│   ├── types.ts              # TypeScript type definitions
│   └── index.tsx             # Application entry point
├── public/
│   ├── assets/               # Public static assets
│   ├── components/           # Pre-built component bundles
│   └── visualizers/          # Pre-built visualizer bundles
├── index.html                # HTML entry point
├── vite.config.ts            # Vite configuration
└── tsconfig.json             # TypeScript configuration
```

## 🎮 Usage

1. **Start a focus session** - Click the timer to begin a Pomodoro session
2. **Add background** - Open Scenes panel to set image/video/gradient backgrounds
3. **Play music** - Open Sounds panel to connect YouTube or upload audio
4. **Enable visualizer** - Click the visualizer button to see audio-reactive effects
5. **Track tasks** - Use Tasks panel to manage your todo list
6. **Take notes** - Quick notes in the Notes panel
7. **Go fullscreen** - Click the fullscreen button for immersive focus

## 🖼️ AI Image Generation

Generate custom backgrounds using Pollinations AI:

```javascript
const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1920&height=1080&nologo=true&seed=${seed}&model=flux`
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 👤 Author

**Hoang Tran** - [@hoangtran0410](https://github.com/hoangtran0410)

---

<p align="center">
  Made with ❤️ for productivity enthusiasts
</p>
