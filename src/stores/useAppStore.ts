import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Scene,
  EffectType,
  TimerMode,
  Task,
  Note,
  BgFilters,
  SyncVisualizerConfig,
} from "../types";
import {
  DEFAULT_IMAGES,
  DEFAULT_BG_FILTERS,
  DEFAULT_SYNC_VISUALIZER_CONFIG,
} from "../constants";

// ============================================================================
// State Interfaces
// ============================================================================

interface SceneState {
  currentScene: Scene;
  setCurrentScene: (scene: Scene) => void;
}

interface EffectState {
  currentEffect: EffectType;
  setCurrentEffect: (effect: EffectType) => void;
}

interface TimerState {
  timerMode: TimerMode;
  showTimer: boolean;
  setTimerMode: (mode: TimerMode) => void;
  setShowTimer: (show: boolean) => void;
}

interface VisualizerState {
  showVisualizer: boolean;
  visualizerMode: "center" | "window";
  setShowVisualizer: (show: boolean) => void;
  setVisualizerMode: (mode: "center" | "window") => void;
}

interface BackgroundState {
  isBgMuted: boolean;
  bgFilters: BgFilters;
  bgInitialZoom: number;
  syncVisualizerConfig: SyncVisualizerConfig;
  showVideoModal: boolean;
  setIsBgMuted: (muted: boolean) => void;
  setBgFilters: (filters: BgFilters) => void;
  setBgInitialZoom: (zoom: number) => void;
  setSyncVisualizerConfig: (config: SyncVisualizerConfig) => void;
  setShowVideoModal: (show: boolean) => void;
}

interface TasksState {
  tasks: Task[];
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  addTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
}

interface NotesState {
  notes: Note[];
  setNotes: (notes: Note[] | ((prev: Note[]) => Note[])) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}

// Combined App State
interface AppState
  extends SceneState,
    EffectState,
    TimerState,
    VisualizerState,
    BackgroundState,
    TasksState,
    NotesState {}

// ============================================================================
// Store Creation
// ============================================================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ========================================
      // Scene State
      // ========================================
      currentScene: DEFAULT_IMAGES[0],
      setCurrentScene: (scene) => set({ currentScene: scene }),

      // ========================================
      // Effect State
      // ========================================
      currentEffect: "none" as EffectType,
      setCurrentEffect: (effect) => set({ currentEffect: effect }),

      // ========================================
      // Timer State
      // ========================================
      timerMode: "pomodoro" as TimerMode,
      showTimer: true,
      setTimerMode: (mode) => set({ timerMode: mode }),
      setShowTimer: (show) => set({ showTimer: show }),

      // ========================================
      // Visualizer State
      // ========================================
      showVisualizer: false,
      visualizerMode: "window" as "center" | "window",
      setShowVisualizer: (show) => set({ showVisualizer: show }),
      setVisualizerMode: (mode) => set({ visualizerMode: mode }),

      // ========================================
      // Background State
      // ========================================
      isBgMuted: true,
      bgFilters: DEFAULT_BG_FILTERS,
      bgInitialZoom: 100,
      syncVisualizerConfig: DEFAULT_SYNC_VISUALIZER_CONFIG,
      showVideoModal: false,
      setIsBgMuted: (muted) => set({ isBgMuted: muted }),
      setBgFilters: (filters) => set({ bgFilters: filters }),
      setBgInitialZoom: (zoom) => set({ bgInitialZoom: zoom }),
      setSyncVisualizerConfig: (config) =>
        set({ syncVisualizerConfig: config }),
      setShowVideoModal: (show) => set({ showVideoModal: show }),

      // ========================================
      // Tasks State
      // ========================================
      tasks: [],
      setTasks: (tasks) =>
        set((state) => ({
          tasks: typeof tasks === "function" ? tasks(state.tasks) : tasks,
        })),
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      // ========================================
      // Notes State
      // ========================================
      notes: [],
      setNotes: (notes) =>
        set((state) => ({
          notes: typeof notes === "function" ? notes(state.notes) : notes,
        })),
      addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
          ),
        })),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),
    }),
    {
      name: "ifocus-storage", // localStorage key
      partialize: (state) => ({
        // Persist only these fields (exclude showVideoModal - transient state)
        currentScene: state.currentScene,
        currentEffect: state.currentEffect,
        timerMode: state.timerMode,
        showTimer: state.showTimer,
        showVisualizer: state.showVisualizer,
        visualizerMode: state.visualizerMode,
        isBgMuted: state.isBgMuted,
        bgFilters: state.bgFilters,
        bgInitialZoom: state.bgInitialZoom,
        syncVisualizerConfig: state.syncVisualizerConfig,
        tasks: state.tasks,
        notes: state.notes,
      }),
    }
  )
);

// ============================================================================
// Selector Hooks (for optimized re-renders)
// ============================================================================

// Scene selectors
export const useCurrentScene = () => useAppStore((s) => s.currentScene);
export const useSetCurrentScene = () => useAppStore((s) => s.setCurrentScene);

// Effect selectors
export const useCurrentEffect = () => useAppStore((s) => s.currentEffect);
export const useSetCurrentEffect = () => useAppStore((s) => s.setCurrentEffect);

// Timer selectors
export const useTimerMode = () => useAppStore((s) => s.timerMode);
export const useSetTimerMode = () => useAppStore((s) => s.setTimerMode);
export const useShowTimer = () => useAppStore((s) => s.showTimer);
export const useSetShowTimer = () => useAppStore((s) => s.setShowTimer);

// Visualizer selectors
export const useShowVisualizer = () => useAppStore((s) => s.showVisualizer);
export const useSetShowVisualizer = () =>
  useAppStore((s) => s.setShowVisualizer);
export const useVisualizerMode = () => useAppStore((s) => s.visualizerMode);
export const useSetVisualizerMode = () =>
  useAppStore((s) => s.setVisualizerMode);

// Background selectors
export const useIsBgMuted = () => useAppStore((s) => s.isBgMuted);
export const useSetIsBgMuted = () => useAppStore((s) => s.setIsBgMuted);
export const useBgFilters = () => useAppStore((s) => s.bgFilters);
export const useSetBgFilters = () => useAppStore((s) => s.setBgFilters);
export const useBgInitialZoom = () => useAppStore((s) => s.bgInitialZoom);
export const useSetBgInitialZoom = () => useAppStore((s) => s.setBgInitialZoom);
export const useSyncVisualizerConfig = () =>
  useAppStore((s) => s.syncVisualizerConfig);
export const useSetSyncVisualizerConfig = () =>
  useAppStore((s) => s.setSyncVisualizerConfig);
export const useShowVideoModal = () => useAppStore((s) => s.showVideoModal);
export const useSetShowVideoModal = () =>
  useAppStore((s) => s.setShowVideoModal);

// Tasks selectors
export const useTasks = () => useAppStore((s) => s.tasks);
export const useSetTasks = () => useAppStore((s) => s.setTasks);
export const useAddTask = () => useAppStore((s) => s.addTask);
export const useToggleTask = () => useAppStore((s) => s.toggleTask);
export const useDeleteTask = () => useAppStore((s) => s.deleteTask);

// Notes selectors
export const useNotes = () => useAppStore((s) => s.notes);
export const useSetNotes = () => useAppStore((s) => s.setNotes);
export const useAddNote = () => useAppStore((s) => s.addNote);
export const useUpdateNote = () => useAppStore((s) => s.updateNote);
export const useDeleteNote = () => useAppStore((s) => s.deleteNote);
