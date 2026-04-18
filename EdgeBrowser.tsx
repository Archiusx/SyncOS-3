/**
 * SYNC-OS EDGE BROWSER: A high-fidelity web browsing simulator.
 * Supports cross-reference URL analysis through the OS Intelligence Core.
 */
import React, { useState, useEffect } from 'react';
import { Globe, ArrowLeft, ArrowRight, RotateCcw, Search, Sparkles, BrainCircuit } from 'lucide-react';

export const EdgeBrowser: React.FC = () => {
  const [url, setUrl] = useState('https://www.wikipedia.org');
  const [inputUrl, setInputUrl] = useState('https://www.wikipedia.org');

  // Sync input with URL state (for back/forward/home actions)
  useEffect(() => {
    setInputUrl(url);
  }, [url]);

  useEffect(() => {
    const handleRequestContext = () => {
      // Extract topic from URL if it's wikipedia
      let topic = "General Web Page";
      if (url.includes('wikipedia.org/wiki/')) {
        topic = url.split('wikipedia.org/wiki/')[1].replace(/_/g, ' ');
      }

      window.dispatchEvent(new CustomEvent('syncos-context-response', {
        detail: { 
          name: 'Edge Browser', 
          content: `CURRENT BROWSER URL: ${url}. TOPIC: ${topic}. AI: You MUST use your Google Search tool to fetch the content of this specific URL (${url}) to provide real-time analysis. Do not rely on training data for this URL.` 
        }
      }));
    };

    window.addEventListener('syncos-request-context', handleRequestContext);
    return () => window.removeEventListener('syncos-request-context', handleRequestContext);
  }, [url]);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let targetUrl = inputUrl.trim();
    if (!targetUrl) return;

    if (!targetUrl.startsWith('http')) {
      // If it looks like a URL but missing protocol
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = `https://${targetUrl}`;
      } else {
        // Otherwise it's a search
        targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}&igu=1`;
      }
    }
    setUrl(targetUrl);
  };

  const askGemini = () => {
    // Force URL update before analysis
    setUrl(inputUrl);
    window.dispatchEvent(new CustomEvent('syncos-trigger-analyze', {
      detail: { prompt: `I am currently viewing this page: ${inputUrl}. Please use your search tool to read the content of this URL and summarize the key points or answer questions based on it.` }
    }));
  };

  const syncUrl = () => {
    setUrl(inputUrl);
  };

  const generateQuiz = () => {
    // Force URL update before quiz generation
    setUrl(inputUrl);
    // Extract topic from URL if it's wikipedia
    let topic = inputUrl;
    if (inputUrl.includes('wikipedia.org/wiki/')) {
      topic = inputUrl.split('wikipedia.org/wiki/')[1].replace(/_/g, ' ');
    }
    window.dispatchEvent(new CustomEvent('syncos-trigger-quiz', {
      detail: { topic }
    }));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="bg-gray-100 p-2 flex items-center gap-2 border-b dark:bg-gray-800 dark:border-white/10">
        <div className="flex gap-1 items-center px-2">
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors text-gray-600 dark:text-gray-400">
            <ArrowLeft size={14} />
          </button>
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors text-gray-600 dark:text-gray-400">
            <ArrowRight size={14} />
          </button>
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors text-gray-600 dark:text-gray-400" onClick={() => setUrl('https://www.wikipedia.org')}>
            <Globe size={14} />
          </button>
          <button 
            className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors text-blue-600 dark:text-blue-400" 
            onClick={syncUrl}
            title="Update Link Context"
          >
            <RotateCcw size={14} />
          </button>
        </div>
        
        <form onSubmit={handleNavigate} className="flex-1 flex items-center bg-white dark:bg-gray-900 rounded-full border dark:border-white/10 px-3 py-1 text-xs shadow-sm">
          <Globe size={12} className="text-gray-400 mr-2" />
          <input 
            type="text" 
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-700 dark:text-gray-200"
          />
          <Search size={12} className="text-gray-400 ml-2" />
        </form>

        <div className="flex gap-2">
          <button 
            onClick={askGemini}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] font-bold transition-all shadow-sm"
          >
            <Sparkles size={12} />
            Ask Gemini
          </button>
          <button 
            onClick={generateQuiz}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-[10px] font-bold transition-all shadow-sm"
          >
            <BrainCircuit size={12} />
            Gen Quiz
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative bg-white">
        <iframe 
          src={url} 
          className="w-full h-full border-none" 
          title="Browser Content"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
