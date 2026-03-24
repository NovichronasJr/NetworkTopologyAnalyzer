"use client";

import React, { useState, useEffect } from 'react';
// Added Trash2 to your icon imports
import { Plus, FileText, X, Clock, ChevronLeft, Activity, Trash2 } from 'lucide-react';
import { useUser } from '../../../context/userContext'; 
import NoteEditor from '../../../components/Notes'; 
import { motion, AnimatePresence } from 'framer-motion';

export default function NotesDashboard() {
  const { userEmail } = useUser() || {};
  
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const fetchNotes = async () => {
    if (!userEmail) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8003/api/notes/${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      
      if (data.success) {
        const sortedNotes = data.notes.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
        setNotes(sortedNotes);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAddingNote) {
      fetchNotes();
    }
  }, [userEmail, isAddingNote]);

  // --- NEW: THE DELETE LOGIC ---
  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation(); // Prevents the card click from opening the modal!
    
    // Safety check so users don't accidentally delete important logs
    if (!window.confirm("Are you sure you want to delete this incident log? This cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8003/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        // Instantly remove the note from the UI without reloading the page
        setNotes((prevNotes) => prevNotes.filter(note => note._id !== noteId));
      } else {
        alert(data.message || 'Failed to delete note.');
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Could not connect to the server.");
    }
  };

  const getPreviewText = (html) => {
    if (typeof window === 'undefined') return '';
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || "";
    return text.length > 120 ? text.substring(0, 120) + "..." : text;
  };

  if (isAddingNote) {
    return (
      <div className="w-full min-h-screen bg-[#06121f] pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 mb-4">
          <button 
            onClick={() => setIsAddingNote(false)}
            className="flex items-center gap-2 text-[#19d5ff] hover:text-white transition-colors font-bold text-sm bg-[#19d5ff11] hover:bg-[#19d5ff33] px-4 py-2 rounded-lg"
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
        </div>
        <div className="scale-95 origin-top mt-[-20px]">
          <NoteEditor />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#06121f] text-white p-6 pt-24 font-sans selection:bg-[#19d5ff33]">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#19d5ff11] pb-10 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl font-black text-[#19d5ff] italic tracking-tighter uppercase leading-none">Incident Logs</h1>
            <p className="text-gray-500 font-bold mt-4 uppercase text-[10px] tracking-[0.3em] italic">
              Network Documentation & Analysis
            </p>
          </motion.div>
          
          <button
            onClick={() => setIsAddingNote(true)}
            className="px-8 py-4 rounded-[1.5rem] font-black uppercase italic text-sm transition-all flex items-center gap-3 border bg-[#19d5ff] text-[#06121f] hover:scale-105 shadow-[0_0_30px_rgba(25,213,255,0.3)] border-transparent"
          >
            <Plus size={20} /> New Report
          </button>
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
            <Activity size={32} className="animate-spin-slow mb-4 text-[#19d5ff]" />
            <p className="text-xs uppercase tracking-widest font-bold">Retrieving Archives...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-[#0b1f33]/30 rounded-3xl border border-dashed border-[#19d5ff22]">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="text-sm uppercase tracking-widest font-bold">No documentation found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={note._id}
                onClick={() => setSelectedNote(note)}
                className="bg-[#0b1f33] border border-[#19d5ff11] hover:border-[#19d5ff66] rounded-[2rem] p-6 cursor-pointer transition-all group hover:bg-[#19d5ff05] flex flex-col h-64 shadow-lg hover:shadow-[0_0_30px_rgba(25,213,255,0.1)] relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-100 group-hover:text-[#19d5ff] transition-colors line-clamp-2 leading-tight pr-8">
                    {note.title}
                  </h3>
                  
                  {/* --- NEW: DELETE BUTTON --- */}
                  <button
                    onClick={(e) => handleDeleteNote(note._id, e)}
                    className="p-2 text-slate-500 hover:text-[#ff2d55] hover:bg-[#ff2d5511] rounded-xl transition-colors absolute top-5 right-5"
                    title="Delete Note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <p className="text-gray-400 text-sm line-clamp-4 flex-1 mb-4 leading-relaxed">
                  {getPreviewText(note.content)}
                </p>
                
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest border-t border-[#19d5ff11] pt-4 mt-auto">
                  <Clock size={12} className="text-[#19d5ff]" />
                  {new Date(note.lastUpdated).toLocaleDateString()} at {new Date(note.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* --- VIEW MODAL --- */}
      <AnimatePresence>
        {selectedNote && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNote(null)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-[5%] bottom-[5%] left-0 right-0 mx-auto w-full max-w-4xl z-50 bg-[#0B1121] border border-[#19d5ff22] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-[#19d5ff11] bg-[#06121f]">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedNote.title}</h2>
                  <p className="text-xs text-[#19d5ff] font-mono tracking-widest mt-2">
                    LOGGED: {new Date(selectedNote.lastUpdated).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedNote(null)} 
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors bg-[#0b1f33]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div 
                  className="prose prose-invert max-w-none text-slate-300 prose-headings:text-white prose-a:text-[#19d5ff] prose-code:bg-[#06121f] prose-code:p-1 prose-code:rounded prose-pre:bg-[#06121f] prose-pre:border prose-pre:border-[#19d5ff22]"
                  dangerouslySetInnerHTML={{ __html: selectedNote.content }} 
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}