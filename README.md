# iFocus 🎯

A beautiful, feature-rich **Pomodoro Timer** with stunning **Music Visualizer** effects. Stay focused and productive with immersive backgrounds, ambient sounds, and mesmerizing audio-reactive visualizations.

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite)

## ✨ Features

### 🍅 Pomodoro Timer
- **Pomodoro sessions** with customizable work/break durations
- **Stopwatch mode** for flexible time tracking
- **Clock display** to keep track of time
- Persistent state across sessions

### 🎨 Music Visualizer
17+ stunning audio-reactive visualizations:
- **Bars** - Classic frequency bars
- **Wave** - Flowing waveform
- **Circular** - Radial frequency display
- **Trap Nation** - Popular music video style
- **Aurora** - Northern lights effect
- **Black Hole** - Cosmic vortex
- **Fireworks** - Explosive particles
- **Galaxy** - Rotating star systems
- **Matrix** - Digital rain
- **Starfield** - 3D space travel
- **DNA Helix** - Spiraling structure
- **Rings** - Concentric circles
- **Particles** - Floating particles
- **Oscilloscope** - Classic waveform
- **Spectrum** - Audio spectrum
- **Radial Lines** - Radiating lines
- **Waveform 3D** - Three-dimensional waves

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

Open [http://localhost:5173](http://localhost:5173) in your browser.

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
│   ├── components/        # React components
│   │   ├── AudioController.tsx
│   │   ├── Background.tsx
│   │   ├── EffectsLayer.tsx
│   │   ├── EffectsSelector.tsx
│   │   ├── Notes.tsx
│   │   ├── PiPContent.tsx
│   │   ├── SceneSelector.tsx
│   │   ├── Tasks.tsx
│   │   ├── Timer.tsx
│   │   └── Visualizer.tsx
│   ├── visualizers/       # Visualizer effects
│   │   ├── Aurora.ts
│   │   ├── Bars.ts
│   │   ├── BlackHole.ts
│   │   └── ... (17+ visualizers)
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand stores
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main application
│   ├── constants.ts       # App constants
│   └── types.ts           # TypeScript types
├── public/
│   ├── images/            # Static images
│   ├── sounds/            # Audio files
│   └── videos/            # Video backgrounds
└── index.html
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
