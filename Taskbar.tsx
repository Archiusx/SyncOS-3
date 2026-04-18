/**
 * SYNC-OS TASKBAR: System tray and application launcher controller.
 * Manages active window icons, system status (Wifi, Battery), and Theme toggles.
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Search, Wifi, Volume2, Battery, ChevronUp, Sun, Moon, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppConfig, AppId } from '@/types';
import { useTheme } from '@/components/ThemeProvider';

interface TaskbarProps {
  apps: AppConfig[];
  activeApps: AppId[];
  onStartClick: () => void;
  onAppClick: (id: AppId) => void;
  onShowDesktop?: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({ apps, activeApps, onStartClick, onAppClick, onShowDesktop }) => {
  const [time, setTime] = useState(new Date());
  const [lang, setLang] = useState<'EN' | 'ES' | 'HI'>('EN');
  const { theme, toggleTheme } = useTheme();

  const toggleLang = () => {
    const langs: ('EN' | 'ES' | 'HI')[] = ['EN', 'ES', 'HI'];
    const next = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(next);
    // In a real app, this would trigger i18n change
    window.dispatchEvent(new CustomEvent('syncos-lang-change', { detail: next }));
  };

  const syncWorkspace = () => {
    window.dispatchEvent(new CustomEvent('syncos-trigger-analyze', {
      detail: { prompt: "Analyze my entire workspace and give me a unified summary of what I'm working on across all open windows." }
    }));
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 mica border-t border-white/20 dark:border-white/10 z-[2000] flex items-center px-3">
      {/* Left side (Widgets/Weather - optional) */}
      <div className="flex-1 hidden sm:flex">
        <button 
          onClick={syncWorkspace}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-full transition-all group"
        >
          <Zap size={14} className="text-yellow-500 group-hover:scale-125 transition-transform" />
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Sync Workspace</span>
        </button>
      </div>

      {/* Center Icons */}
      <div className="flex items-center gap-1">
        <button 
          onClick={onStartClick}
          className="p-2 hover:bg-white/10 rounded transition-all active:scale-90"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/Windows_logo_-_2021.svg" alt="Start" className="w-6 h-6" />
        </button>
        
        <button className="p-2 hover:bg-white/10 rounded transition-all active:scale-90">
          <Search size={20} className="text-gray-700 dark:text-gray-200" />
        </button>

        <div className="w-px h-6 bg-white/20 mx-1" />

        {apps.map((app) => {
          const isActive = activeApps.includes(app.id);
          return (
            <button
              key={app.id}
              onClick={() => onAppClick(app.id)}
              className={cn(
                "p-2 rounded transition-all relative group",
                isActive ? "bg-white/10" : "hover:bg-white/10"
              )}
            >
              <div className="w-6 h-6 text-blue-600 dark:text-blue-400 group-active:scale-90 transition-transform">
                {app.icon}
              </div>
              {isActive && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" 
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Right side (System Tray) */}
      <div className="flex-1 flex justify-end items-center gap-1">
        <button 
          onClick={toggleLang}
          className="px-2 py-1 hover:bg-white/10 rounded text-[10px] font-bold dark:text-white transition-colors"
          title="Change Language"
        >
          {lang}
        </button>

        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-white/10 rounded transition-all active:scale-90 text-gray-700 dark:text-gray-200"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button className="p-1 hover:bg-white/10 rounded hidden sm:block">
          <ChevronUp size={14} className="dark:text-white" />
        </button>
        
        <div className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded transition-colors cursor-pointer dark:text-white">
          <Wifi size={14} />
          <Volume2 size={14} />
          <Battery size={14} />
        </div>

        <div className="flex flex-col items-end px-2 py-1 hover:bg-white/10 rounded transition-colors cursor-pointer dark:text-white">
          <span className="text-[10px] font-medium">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px]">
            {time.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </div>

        <div 
          onClick={onShowDesktop}
          className="w-1 h-8 hover:bg-white/20 ml-1 cursor-pointer border-l border-white/10" 
          title="Show Desktop" 
        />
      </div>
    </div>
  );
};

