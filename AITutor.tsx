/**
 * SYNC-OS INTELLIGENCE CORE: The primary AI application.
 * Manages Google Gemini integration, real-time workspace synthesis,
 * persistent session memory, and diversity settings.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BrainCircuit, FileText, CheckSquare, BookOpen, Zap, Mic, MicOff } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const getApiKey = () => {
  return (
    process.env.GEMINI_API_KEY || 
    (import.meta as any).env?.VITE_GEMINI_API_KEY || 
    ''
  );
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'module';
  moduleData?: any;
}

export const AITutor: React.FC = () => {
  const { user } = useAuth();
  
  // Diversified Settings State
  const [isDiverse, setIsDiverse] = useState(() => {
    const saved = localStorage.getItem('syncos-diversity');
    return saved ? JSON.parse(saved) : true; // Default to Diverse
  });
  
  const [isSyncingPast, setIsSyncingPast] = useState(true);

  // Load messages from local storage for "Past Data Synchronization"
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('syncos-messages');
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: "Hello! I'm your SyncOS AI Tutor. I'm currently synchronized with your workspace and past data. How can I assist you today?" }
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Persist messages
  useEffect(() => {
    if (isSyncingPast) {
      localStorage.setItem('syncos-messages', JSON.stringify(messages));
    }
  }, [messages, isSyncingPast]);

  // Persist diversity setting
  useEffect(() => {
    localStorage.setItem('syncos-diversity', JSON.stringify(isDiverse));
  }, [isDiverse]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  useEffect(() => {
    if (!apiKey) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "⚠️ GEMINI_API_KEY is missing. In Vercel, please set VITE_GEMINI_API_KEY in your environment variables." 
      }]);
    }
  }, []);

  const enableStudyMode = () => {
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: "I've optimized your workspace for studying! I'll stay on the left while you take notes on the right. Hover over my maximize button to see more tiling options." 
    }]);
    window.dispatchEvent(new CustomEvent('syncos-study-mode'));
  };

  // Intelligent Workspace Analysis: Aggregates content from all open windows in real-time
  const syncAnalyze = async (customPrompt?: string) => {
    if (isLoading) return;
    setIsLoading(true);
    
    // UI Feedback: Inject localized analysis status
    const statusMsgId = Date.now();
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: customPrompt ? `🔍 Analyzing request: "${customPrompt}"...` : "🧠 Syncing workspace context...",
      id: statusMsgId
    } as any]);

    const contextData: any[] = [];
    const handleContextResponse = (e: any) => {
      contextData.push(e.detail);
    };
    window.addEventListener('syncos-context-response', handleContextResponse);
    window.dispatchEvent(new CustomEvent('syncos-request-context'));

    // Ultra-fast real-time scan
    await new Promise(resolve => setTimeout(resolve, 400));
    window.removeEventListener('syncos-context-response', handleContextResponse);

    const globalContext = contextData.map(c => `[WINDOW: ${c.name}]\n${c.content}`).join("\n\n");

    try {
      // Gemini LLM integration: Primary Intelligence Core
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: customPrompt 
          ? `USER REQUEST: ${customPrompt}\n\nWORKSPACE CONTEXT:\n${globalContext}\n\nIMPORTANT: If a URL is provided in the context, use your Google Search tool to fetch and analyze its real-time content to provide an accurate response. Do not hallucinate content.`
          : `Analyze the following workspace context and provide a unified summary or study plan. 
        
        CONTEXT FROM ACTIVE WINDOWS:
        ${globalContext}

        PERSISTENT SESSION CONTEXT (PAST DATA):
        ${isSyncingPast ? messages.slice(-5).map(m => `${m.role}: ${m.content}`).join("\n") : "Disabled"}
        
        FORMATTING RULES:
        1. Use Markdown TABLES for all comparisons or data sets.
        2. Use Markdown HEADERS (#, ##, ###) for sections.
        3. Use bullet points for lists.
        4. CRITICAL: Do NOT use raw ** symbols for bolding. Use Headers instead.
        5. If possible, create a text-based "DIAGRAM" or "FLOWCHART" using characters like | -> -- if it helps explain a process.
        6. Acknowledge specific windows you've read (e.g., "I see you're researching Calculus on Wikipedia while taking notes in Notepad").`,
        config: {
          systemInstruction: `You are the SyncOS Intelligence Core. ${isDiverse ? "Be creative and proactive. Suggest diverse ways to use the context." : "Be strictly logical and concise. Focus on efficient memory utilization."} You have unique access to all open windows. Your goal is to synthesize information across apps. If the user is looking at a webpage, use your search tool to understand its content. Format your output beautifully using Markdown tables, headers, and lists. Avoid raw ** symbols; use clean typography and structured layouts. Be concise but highly insightful.`,
          tools: [{ googleSearch: {} }] as any
        },
      });

      const responseText = response.text;
      
      // Replace the status message with the actual response
      setMessages(prev => {
        const filtered = prev.filter((m: any) => m.id !== statusMsgId);
        return [...filtered, { 
          role: 'assistant', 
          content: responseText || "Analysis complete." 
        }];
      });
    } catch (error) {
      console.error("Sync-Analysis Failed:", error);
      const isQuota = error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'));
      
      setMessages(prev => {
        const filtered = prev.filter((m: any) => m.id !== statusMsgId);
        return [...filtered, { 
          role: 'assistant', 
          content: isQuota 
            ? "⚠️ **Usage Limit Reached.** You've hit the Gemini API quota. Please wait a minute before trying again or check your Vercel VITE_GEMINI_API_KEY."
            : `❌ **Sync-Analysis failed.** ${error instanceof Error ? "The model is currently busy. Please try again soon." : "Connectivity issue"}.`
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleTriggerAnalyze = (e: any) => {
      syncAnalyze(e.detail?.prompt);
    };
    window.addEventListener('syncos-trigger-analyze-internal', handleTriggerAnalyze);
    return () => window.removeEventListener('syncos-trigger-analyze-internal', handleTriggerAnalyze);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getContext = async () => {
    if (!user) return "";
    const path = 'notes';
    try {
      const q = query(collection(db, path), where('uid', '==', user.uid));
      const snap = await getDocs(q);
      const notes = snap.docs.map(d => d.data().content).join("\n---\n");
      return notes ? `\n\nUSER NOTES CONTEXT:\n${notes}` : "";
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return "";
    }
  };

  const generateModule = async (type: 'pointwise' | 'flashcards' | 'test', topic: string) => {
    setIsLoading(true);
    
    // Real-time scan for context
    const contextData: any[] = [];
    const handleContextResponse = (e: any) => {
      contextData.push(e.detail);
    };
    window.addEventListener('syncos-context-response', handleContextResponse);
    window.dispatchEvent(new CustomEvent('syncos-request-context'));
    await new Promise(resolve => setTimeout(resolve, 600));
    window.removeEventListener('syncos-context-response', handleContextResponse);

    const realTimeContext = contextData.map(c => `[${c.name}]: ${c.content}`).join("\n");
    
    let prompt = "";
    let schema: any = {};

    if (type === 'pointwise') {
      prompt = `Generate detailed pointwise study notes for the topic: ${topic}. 
      Use this REAL-TIME WORKSPACE CONTEXT if relevant:
      ${realTimeContext}`;
      schema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          points: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      };
    } else if (type === 'flashcards') {
      prompt = `Generate 5 effective flashcards (question and answer) for the topic: ${topic}.
      Use this REAL-TIME WORKSPACE CONTEXT if relevant:
      ${realTimeContext}`;
      schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING }
          }
        }
      };
    } else {
      prompt = `Generate a 3-question multiple choice test for the topic: ${topic}.
      Use this REAL-TIME WORKSPACE CONTEXT if relevant:
      ${realTimeContext}`;
      schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER }
          }
        }
      };
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          systemInstruction: "You are an expert educator. Generate high-quality study materials based on user context and topics. If a URL is provided, use your search tool to understand the content.",
          tools: [{ googleSearch: {} }]
        }
      });

      const data = JSON.parse(response.text || "{}");
      
      // Save to Firebase
      if (user) {
        const path = 'modules';
        try {
          await addDoc(collection(db, path), {
            uid: user.uid,
            topic,
            type,
            data,
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I've generated your ${type} module for "${topic}".`,
        type: 'module',
        moduleData: { type, data }
      }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const context = await getContext();

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: userMessage + context,
        config: {
          systemInstruction: `You are a helpful AI Tutor. ${isDiverse ? "Provide diversified insights and creative examples." : "Focus on high-density information for efficient cognitive memory utilization."} You have access to the student's notes and workspace context. If the user mentions a website or is looking at one, use your search tool to analyze it. Format your output beautifully using Markdown tables, headers, and lists. Avoid raw ** symbols; use clean typography and structured layouts.`,
          tools: [{ googleSearch: {} }]
        },
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "Error" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className={cn("transition-colors", isDiverse ? "text-purple-500" : "text-blue-500")} size={20} />
          <div className="flex flex-col leading-tight">
            <h2 className="font-semibold text-gray-800 dark:text-white text-xs">OS Intelligence</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <button 
                onClick={() => setIsDiverse(!isDiverse)}
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter border transition-all",
                  isDiverse ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                )}
              >
                {isDiverse ? "Diverse Mode" : "Concise Mode"}
              </button>
              <button 
                onClick={() => setIsSyncingPast(!isSyncingPast)}
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter border transition-all",
                  isSyncingPast ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                )}
              >
                {isSyncingPast ? "Sync Active" : "Sync Disabled"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setMessages([{ role: 'assistant', content: "Memory cleared. Workspace sync reset." }])} className="p-1.5 hover:bg-red-50 dark:hover:bg-white/10 rounded-lg text-red-500 transition-colors" title="Clear Memory"><Zap size={14} /></button>
          <button onClick={() => syncAnalyze()} className="p-1.5 hover:bg-yellow-50 dark:hover:bg-white/10 rounded-lg text-yellow-600 dark:text-yellow-400 transition-colors" title="Sync-Analyze Workspace"><BrainCircuit size={18} /></button>
          <button onClick={enableStudyMode} className="p-1.5 hover:bg-orange-50 dark:hover:bg-white/10 rounded-lg text-orange-600 dark:text-orange-400 transition-colors" title="Study Mode"><BookOpen size={18} /></button>
          <button onClick={() => generateModule('pointwise', 'Current Topic')} className="p-1.5 hover:bg-blue-50 dark:hover:bg-white/10 rounded-lg text-blue-600 dark:text-blue-400 transition-colors" title="Generate Notes"><FileText size={18} /></button>
          <button onClick={() => generateModule('flashcards', 'Current Topic')} className="p-1.5 hover:bg-purple-50 dark:hover:bg-white/10 rounded-lg text-purple-600 dark:text-purple-400 transition-colors" title="Generate Flashcards"><BrainCircuit size={18} /></button>
          <button onClick={() => generateModule('test', 'Current Topic')} className="p-1.5 hover:bg-green-50 dark:hover:bg-white/10 rounded-lg text-green-600 dark:text-green-400 transition-colors" title="Generate Test"><CheckSquare size={18} /></button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
            <div className={cn(
              "max-w-[85%] p-3 rounded-2xl flex gap-3",
              msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-white dark:bg-gray-800 border dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm"
            )}>
              <div className="mt-1 shrink-0">
                {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className="text-sm leading-relaxed overflow-hidden">
                <div className="prose dark:prose-invert max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                
                {msg.type === 'module' && msg.moduleData && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300">
                    {msg.moduleData.type === 'pointwise' && (
                      <div className="space-y-2">
                        <p className="font-bold border-b dark:border-white/10 pb-1">{msg.moduleData.data.title}</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {msg.moduleData.data.points?.map((p: string, j: number) => <li key={j}>{p}</li>)}
                        </ul>
                      </div>
                    )}
                    {msg.moduleData.type === 'flashcards' && (
                      <div className="space-y-3">
                        {msg.moduleData.data.map((f: any, j: number) => (
                          <div key={j} className="p-2 bg-white dark:bg-gray-800 rounded border dark:border-white/10 text-[11px]">
                            <p className="font-bold text-purple-600 dark:text-purple-400">Q: {f.question}</p>
                            <p className="mt-1 text-gray-500 dark:text-gray-400 italic">A: {f.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.moduleData.type === 'test' && (
                      <div className="space-y-3">
                        {msg.moduleData.data.map((q: any, j: number) => (
                          <div key={j} className="p-2 bg-white dark:bg-gray-800 rounded border dark:border-white/10 text-[11px]">
                            <p className="font-bold">{q.question}</p>
                            <div className="mt-1 grid grid-cols-1 gap-1">
                              {q.options?.map((o: string, k: number) => <div key={k} className="px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded">{o}</div>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border dark:border-white/10 p-3 rounded-2xl rounded-tl-none flex gap-2 items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-white/10">
        <div className="flex gap-2">
          <button
            onClick={toggleListening}
            className={cn(
              "p-2 rounded-full transition-all",
              isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 dark:bg-gray-900 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10"
            )}
            title={isListening ? "Stop listening" : "Voice Command"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Ask AI or type a topic to generate modules..."}
            className="flex-1 bg-gray-100 dark:bg-gray-900 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none dark:text-white"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
