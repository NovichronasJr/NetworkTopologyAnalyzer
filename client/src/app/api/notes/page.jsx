"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Save, ArrowLeft, Clock, CheckCircle2, Activity } from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';
import { useUser } from '../../../context/userContext';

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 animate-pulse space-y-4">
      <Activity size={24} className="animate-spin-slow" />
      <p className="text-sm font-medium tracking-wide">Initializing workspace...</p>
    </div>
  )
});

const NoteEditor = () => {
  // 1. FIXED DESTRUCTURING: Extract userEmail directly from context
  const { userEmail } = useUser(); 
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); 
  const [saveStatus, setSaveStatus] = useState('Saved'); 
  const [lastSaved, setLastSaved] = useState('Just now');

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }], 
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block', 'link'],
      ['clean']
    ],
  };

  useEffect(() => {
    if (content.length > 0 || title.length > 0) {
      setSaveStatus('Unsaved changes');
    }
  }, [content, title]);

  // 2. THE SAVE LOGIC
  const saveNoteToDatabase = async () => {
    // Basic validation before hitting the server
    if (!title.trim() || !content.trim()) {
      alert("Please provide both a title and some content.");
      return;
    }

    if (!userEmail) {
      alert("Error: User email not found. Please log in again.");
      return;
    }

    setSaveStatus('Saving...');

    try {
      // NOTE: Update 'http://localhost:5000' to match your Express server's port
      const response = await fetch('http://localhost:8003/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userEmail,
          title: title,
          content: content
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveStatus('Saved');
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setSaveStatus('Failed to save');
        console.error('Backend Error:', data.message);
        alert(data.message || 'Failed to save note.');
      }
    } catch (error) {
      setSaveStatus('Failed to save');
      console.error('Network Error:', error);
      alert('Could not connect to the server.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1121] flex flex-col font-sans text-slate-300 selection:bg-indigo-500/30">
      
      {/* --- CLEAN TOP ACTION BAR --- */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-slate-800/60 bg-[#0B1121]/90 backdrop-blur-md sticky top-0 z-30">
        
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="hidden sm:flex flex-col">
            <span className="text-slate-200 font-semibold text-sm">Network Note</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
            {saveStatus === 'Saved' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Clock size={14} />}
            <span>{saveStatus === 'Saved' ? `Last saved at ${lastSaved}` : saveStatus}</span>
          </div>
          
          <button 
            onClick={saveNoteToDatabase} 
            disabled={saveStatus === 'Saving...'}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-slate-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-900/20"
          >
            <Save size={18} /> <span className="hidden sm:inline">{saveStatus === 'Saving...' ? 'Saving...' : 'Save Note'}</span>
          </button>
        </div>
      </header>

      {/* --- FULL SCREEN WORKSPACE --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 md:py-12 flex flex-col flex-1">
          
          <input 
            type="text" 
            placeholder="Note Title..." 
            className="w-full bg-transparent text-3xl md:text-5xl font-bold mb-8 text-white placeholder-slate-600 outline-none focus:ring-0"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          <div className="enterprise-quill flex-1 flex flex-col">
            <ReactQuill
              theme="snow" 
              value={content} 
              onChange={setContent} 
              modules={modules}
              placeholder="Start typing..."
            />
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;