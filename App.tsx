/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SYNC-OS CORE KERNEL: The root application component.
 * Responsible for window lifecycle management, Z-index layers, 
 * workspace context scraping patterns, and the intelligence event loop.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Bot, FileText, LayoutDashboard, Globe, BrainCircuit, Settings, LogIn, Zap, Activity } from 'lucide-react';
import { Taskbar } from './components/Taskbar';
import { StartMenu } from './components/StartMenu';
import { Window } from './components/Window';
import { AppId, WindowState, AppConfig } from './types';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ThemeProvider, useTheme } from './components/ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';

// App Components
import { AITutor } from './components/apps/AITutor';
import { Notepad } from './components/apps/Notepad';
import { SyllabusTracker } from './components/apps/SyllabusTracker';
import { QuizGenerator } from './components/apps/QuizGenerator';
import { EdgeBrowser } from './components/apps/EdgeBrowser';
import { SystemMonitor } from './components/apps/SystemMonitor';

const APPS: AppConfig[] = [
  { id: 'ai-tutor', name: 'AI Tutor', icon: <Bot />, component: AITutor },
  { id: 'notepad', name: 'Notepad', icon: <FileText />, component: Notepad },
  { id: 'syllabus', name: 'Syllabus Tracker', icon: <LayoutDashboard />, component: SyllabusTracker },
  { id: 'browser', name: 'Edge Browser', icon: <Globe />, component: EdgeBrowser },
  { id: 'quiz', name: 'Quiz Gen', icon: <BrainCircuit />, component: QuizGenerator },
  { id: 'system-monitor', name: 'System Monitor', icon: <Activity />, component: SystemMonitor },
  { id: 'settings', name: 'Settings', icon: <Settings />, component: () => <div className="p-10 text-center">Settings Mockup</div> },
];

function Desktop() {
  const { user, signIn, loading } = useAuth();
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(100);
  const [isScanning, setIsScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scanningTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intelligence Context Scraping: Listens for requests to aggregate cross-app data
  React.useEffect(() => {
    const handleRequestContext = () => {
      if (scanningTimeoutRef.current) clearTimeout(scanningTimeoutRef.current);
      setIsScanning(true);
      // Status visualization timeout
      scanningTimeoutRef.current = setTimeout(() => setIsScanning(false), 1500);
    };
    window.addEventListener('syncos-request-context', handleRequestContext);
    return () => {
      window.removeEventListener('syncos-request-context', handleRequestContext);
      if (scanningTimeoutRef.current) clearTimeout(scanningTimeoutRef.current);
    };
  }, []);

  // Primary Application Launcher: Manages window lifecycle and Z-stacking
  const launchApp = useCallback((id: AppId) => {
    setIsStartOpen(false);
    
    setWindows(prev => {
      const existing = prev.find(w => w.id === id);
      if (existing) {
        // Bring to front and un-minimize
        const nextZ = Math.max(...prev.map(w => w.zIndex), 100) + 1;
        return prev.map(w => w.id === id ? { ...w, isMinimized: false, zIndex: nextZ } : w);
      }
      
      const app = APPS.find(a => a.id === id);
      if (!app) return prev;

      const offset = prev.length * 30;
      const nextZ = Math.max(...prev.map(w => w.zIndex), 100) + 1;

      const defaultSize = isMobile 
        ? { width: window.innerWidth, height: window.innerHeight - 48 }
        : { width: 800, height: 600 };
      
      const defaultPosition = isMobile
        ? { x: 0, y: 0 }
        : { x: 100 + offset, y: 50 + offset };

      return [...prev, {
        id,
        title: app.name,
        isOpen: true,
        isMinimized: false,
        isMaximized: isMobile,
        zIndex: nextZ,
        position: defaultPosition,
        size: defaultSize
      }];
    });
  }, []);

  React.useEffect(() => {
    const handleTriggerAnalyze = (e: any) => {
      launchApp('ai-tutor');
      // Small delay to ensure AI Tutor is mounted before it receives the event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('syncos-trigger-analyze-internal', {
          detail: e.detail
        }));
      }, 100);
    };
    window.addEventListener('syncos-trigger-analyze', handleTriggerAnalyze);
    return () => window.removeEventListener('syncos-trigger-analyze', handleTriggerAnalyze);
  }, [launchApp]);

  React.useEffect(() => {
    const handleTriggerQuiz = (e: any) => {
      launchApp('quiz');
      // Small delay to ensure Quiz Generator is mounted
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('syncos-trigger-quiz-internal', {
          detail: e.detail
        }));
      }, 100);
    };
    window.addEventListener('syncos-trigger-quiz', handleTriggerQuiz);
    return () => window.removeEventListener('syncos-trigger-quiz', handleTriggerQuiz);
  }, [launchApp]);

  const closeWindow = (id: AppId) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  const toggleMinimize = (id: AppId) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w));
  };

  const toggleMaximize = (id: AppId) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized, snapState: 'none' } : w));
  };

  const snapWindow = (id: AppId, snap: any) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, snapState: snap, isMaximized: false, isMinimized: false } : w));
  };

  const moveWindow = (id: AppId, x: number, y: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, position: { x, y } } : w));
  };

  const focusWindow = (id: AppId) => {
    setWindows(prev => {
      const win = prev.find(w => w.id === id);
      const maxZ = Math.max(...prev.map(w => w.zIndex), 100);
      if (win && win.zIndex === maxZ) return prev;
      return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w);
    });
  };

  const minimizeAll = () => {
    setWindows(prev => prev.map(w => ({ ...w, isMinimized: true })));
  };

  // Aero-Snap & Window Tiling Logic: Orchestrates complex multi-window layouts
  const tileWindows = () => {
    setWindows(prev => {
      const openWindows = prev.filter(w => !w.isMinimized);
      const count = openWindows.length;
      if (count === 0) return prev;

      return prev.map(w => {
        if (w.isMinimized) return w;
        const index = openWindows.findIndex(ow => ow.id === w.id);
        
        // Dynamic Grid Calculation for diverse monitor sizes
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const width = 100 / cols;
        const height = (100 - 10) / rows; // Leave space for taskbar
        
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        return {
          ...w,
          isMaximized: false,
          snapState: 'none',
          position: { x: (window.innerWidth * col) / cols + 20, y: (window.innerHeight * row) / rows + 20 },
          size: { width: (window.innerWidth / cols) - 40, height: (window.innerHeight / rows) - 80 }
        };
      });
    });
  };

  React.useEffect(() => {
    const handleStudyMode = () => {
      // Launch Notepad if not open
      launchApp('notepad');
      // Snap AI Tutor to left and Notepad to right
      setWindows(prev => prev.map(w => {
        if (w.id === 'ai-tutor') return { ...w, snapState: 'left', isMaximized: false, isMinimized: false };
        if (w.id === 'notepad') return { ...w, snapState: 'right', isMaximized: false, isMinimized: false };
        return w;
      }));
    };

    window.addEventListener('syncos-study-mode', handleStudyMode);
    return () => window.removeEventListener('syncos-study-mode', handleStudyMode);
  }, [launchApp]);

  // Stable Prototype: Render immediately without loading/login gates
  return (
    <div className="h-screen w-screen overflow-hidden relative bg-[#004a86]">
      <img 
        src="https://wallpapers.ispazio.net/wp-content/uploads/2021/10/ispazio-2-1280x2770.jpg" 
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      
      <div className="relative z-10 h-full w-full">
        {/* Scanning Overlay */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[999] pointer-events-none overflow-hidden bg-blue-500/5 backdrop-blur-[1px]"
            >
              <motion.div 
                initial={{ y: "-100%" }}
                animate={{ y: "200%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="w-full h-[30vh] bg-gradient-to-b from-transparent via-blue-500/40 to-transparent blur-2xl"
              />
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
                className="absolute inset-y-0 w-[30vw] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent blur-2xl"
              />
              
              <div className="absolute inset-0 border-[8px] border-blue-500/10 animate-pulse" />
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                <div className="bg-blue-600/90 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-4 scale-125 backdrop-blur-md border border-white/20">
                  <Zap className="animate-pulse text-yellow-300" size={24} />
                  <div className="flex flex-col">
                    <span className="text-lg tracking-tight">SyncOS Intelligence</span>
                    <span className="text-[10px] opacity-70 font-mono uppercase tracking-widest">Scraping Global Workspace Context...</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                    />
                  ))}
                </div>
              </div>

              {/* Grid Effect */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" 
                   style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Icons */}
        <div className="p-4 grid grid-flow-col grid-rows-6 gap-4 w-fit">
          {APPS.slice(0, 5).map(app => (
            <button
              key={app.id}
              onClick={() => launchApp(app.id)}
              className="flex flex-col items-center gap-1 p-2 w-20 hover:bg-white/10 rounded transition-colors group"
            >
              <div className="w-10 h-10 text-white drop-shadow-md group-active:scale-90 transition-transform">
                {app.icon}
              </div>
              <span className="text-[10px] text-white text-center font-medium drop-shadow-md">{app.name}</span>
            </button>
          ))}
          
          <button
            onClick={() => APPS.slice(0, 5).forEach(app => launchApp(app.id))}
            className="flex flex-col items-center gap-1 p-2 w-20 hover:bg-white/10 rounded transition-colors group"
          >
            <div className="w-10 h-10 text-white drop-shadow-md group-active:scale-90 transition-transform flex items-center justify-center bg-green-500/20 rounded-lg border border-white/20">
              <Zap size={20} className="text-yellow-300" />
            </div>
            <span className="text-[10px] text-white text-center font-medium drop-shadow-md">Launch All</span>
          </button>

          <button
            onClick={tileWindows}
            className="flex flex-col items-center gap-1 p-2 w-20 hover:bg-white/10 rounded transition-colors group"
          >
            <div className="w-10 h-10 text-white drop-shadow-md group-active:scale-90 transition-transform flex items-center justify-center bg-blue-500/20 rounded-lg border border-white/20">
              <LayoutDashboard size={20} />
            </div>
            <span className="text-[10px] text-white text-center font-medium drop-shadow-md">Tile All</span>
          </button>
        </div>

        {/* Windows */}
        {windows.map(win => {
          const app = APPS.find(a => a.id === win.id);
          if (!app) return null;
          return (
            <Window
              key={win.id}
              id={win.id}
              title={win.title}
              icon={app.icon}
              isOpen={win.isOpen}
              isMinimized={win.isMinimized}
              isMaximized={win.isMaximized}
              snapState={win.snapState}
              zIndex={win.zIndex}
              position={win.position}
              size={win.size}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => toggleMinimize(win.id)}
              onMaximize={() => toggleMaximize(win.id)}
              onSnap={(snap) => snapWindow(win.id, snap)}
              onFocus={() => focusWindow(win.id)}
              onMove={(x, y) => moveWindow(win.id, x, y)}
            >
              <app.component onClose={() => closeWindow(win.id)} />
            </Window>
          );
        })}

        {/* Start Menu */}
        <StartMenu 
          isOpen={isStartOpen} 
          apps={APPS} 
          onLaunch={launchApp} 
        />

        {/* Taskbar */}
        <Taskbar 
          apps={APPS} 
          activeApps={windows.map(w => w.id)}
          onStartClick={() => setIsStartOpen(!isStartOpen)}
          onAppClick={launchApp}
          onShowDesktop={minimizeAll}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Desktop />
      </AuthProvider>
    </ThemeProvider>
  );
}


