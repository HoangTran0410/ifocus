import React, { useState } from 'react';
import { PenLine, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Note } from '../types';

interface NotesProps {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
}

export const Notes: React.FC<NotesProps> = ({ notes, setNotes }) => {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      updatedAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(notes.filter(n => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
  };

  if (activeNoteId && activeNote) {
    return (
      <div className="flex flex-col h-full text-white">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setActiveNoteId(null)}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-xs text-white/30">
            {new Date(activeNote.updatedAt).toLocaleTimeString()}
          </span>
        </div>
        
        <input 
          type="text" 
          value={activeNote.title}
          onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
          placeholder="Note Title"
          className="w-full bg-transparent text-xl font-bold mb-4 focus:outline-none placeholder-white/30"
        />
        
        <textarea 
          value={activeNote.content}
          onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
          placeholder="Start typing..."
          className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed text-white/90 placeholder-white/20 custom-scrollbar"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <PenLine size={20} /> Notes
        </h3>
        <button 
          onClick={createNote}
          className="p-1.5 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
        {notes.length === 0 && (
          <div className="text-center text-white/30 py-8 text-sm">
            Capture your thoughts...
          </div>
        )}
        {notes.map(note => (
          <div 
            key={note.id}
            onClick={() => setActiveNoteId(note.id)}
            className="group relative p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer transition-all"
          >
            <h4 className="font-medium mb-1 pr-6 truncate">
              {note.title || 'Untitled Note'}
            </h4>
            <p className="text-xs text-white/50 truncate">
              {note.content || 'No content'}
            </p>
            
            <button 
              onClick={(e) => deleteNote(note.id, e)}
              className="absolute top-3 right-3 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
