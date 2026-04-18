/**
 * SYNC-OS NOTEPAD: A persistent, cloud-synced text editor.
 * Integrates with Firestore for real-time note saving and syncs context to the OS layer.
 */
import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export const Notepad: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const path = 'notes';
    const q = query(
      collection(db, path),
      where('uid', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setNotes(notesData);
      if (notesData.length > 0 && !activeNoteId) {
        setContent(notesData[0].content);
        setActiveNoteId(notesData[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const handleRequestContext = () => {
      window.dispatchEvent(new CustomEvent('syncos-context-response', {
        detail: { name: 'Notepad', content }
      }));
    };

    window.addEventListener('syncos-request-context', handleRequestContext);
    return () => window.removeEventListener('syncos-request-context', handleRequestContext);
  }, [content]);

  const saveNote = async () => {
    if (!user || !content.trim()) return;
    
    const path = 'notes';
    try {
      await addDoc(collection(db, path), {
        uid: user.uid,
        content,
        updatedAt: new Date().toISOString(),
        title: content.split('\n')[0].substring(0, 30) || 'Untitled Note'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const triggerGlobalAnalyze = () => {
    window.dispatchEvent(new CustomEvent('syncos-trigger-analyze'));
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 py-1 bg-gray-100 dark:bg-gray-800 border-b dark:border-white/10 text-xs text-gray-600 dark:text-gray-300">
        <div className="flex gap-4">
          <button className="hover:bg-gray-200 dark:hover:bg-white/10 px-2 py-1 rounded">File</button>
          <button className="hover:bg-gray-200 dark:hover:bg-white/10 px-2 py-1 rounded" onClick={() => setContent('')}>New</button>
          <button className="hover:bg-gray-200 dark:hover:bg-white/10 px-2 py-1 rounded font-bold text-blue-600 dark:text-blue-400" onClick={saveNote}>Save to Cloud</button>
          <button 
            className="hover:bg-purple-100 dark:hover:bg-purple-900/30 px-2 py-1 rounded font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1" 
            onClick={triggerGlobalAnalyze}
          >
            <Sparkles size={12} />
            Summarize Workspace
          </button>
        </div>
        <div className="text-[10px] opacity-50">Cloud Sync Active</div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 border-r dark:border-white/10 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto p-2 space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-2">My Notes</p>
          {notes.map(note => (
            <button 
              key={note.id}
              onClick={() => { setContent(note.content); setActiveNoteId(note.id); }}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-[11px] truncate",
                activeNoteId === note.id ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : "hover:bg-gray-200 dark:hover:bg-white/10 dark:text-gray-300"
              )}
            >
              {note.title}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 p-4 resize-none outline-none font-mono text-sm bg-white dark:bg-gray-900 dark:text-gray-200"
          placeholder="Start typing your notes here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
};

