import React, { useState } from "react";
import { Trash2, CheckCircle, Circle, Clock } from "lucide-react";
import type { Task } from "../types";
import { useTasks, useSetTasks } from "../stores/useAppStore";

export default function Tasks() {
  // Get state from Zustand store
  const tasks = useTasks();
  const setTasks = useSetTasks();

  const [newTaskText, setNewTaskText] = useState("");
  const [estPomos, setEstPomos] = useState(1);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(), // Simple ID
      text: newTaskText,
      completed: false,
      estimatedPomodoros: estPomos,
    };

    setTasks([...tasks, newTask]);
    setNewTaskText("");
    setEstPomos(1);
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col h-full text-white">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CheckCircle size={20} /> Tasks
      </h3>

      <form onSubmit={addTask} className="mb-6">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/50 transition-colors mb-2"
        />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
            <Clock size={14} className="text-white/50" />
            <input
              type="number"
              min="1"
              max="10"
              value={estPomos}
              onChange={(e) => setEstPomos(parseInt(e.target.value))}
              className="w-8 bg-transparent text-center text-sm focus:outline-none"
            />
            <span className="text-xs text-white/50">est.</span>
          </div>
          <button
            type="submit"
            className="bg-white text-black px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-white/90"
          >
            Add
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
        {tasks.length === 0 && (
          <div className="text-center text-white/30 py-8 text-sm">
            No tasks yet. Stay focused!
          </div>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`group flex items-start gap-3 p-3 rounded-xl border border-transparent transition-all ${
              task.completed
                ? "bg-white/5 opacity-60"
                : "bg-white/10 hover:border-white/20"
            }`}
          >
            <button
              onClick={() => toggleTask(task.id)}
              className="mt-0.5 text-white/50 hover:text-white transition-colors"
            >
              {task.completed ? (
                <CheckCircle size={20} />
              ) : (
                <Circle size={20} />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm truncate ${
                  task.completed ? "line-through text-white/50" : "text-white"
                }`}
              >
                {task.text}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-white/40">
                <Clock size={10} />
                <span>{task.estimatedPomodoros} pomodoros</span>
              </div>
            </div>

            <button
              onClick={() => deleteTask(task.id)}
              className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
