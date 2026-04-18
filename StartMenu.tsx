/**
 * SYNC-OS START MENU: The central hub for application access and power controls.
 * Grid-based launcher with Framer Motion animations for fluid workspace entry.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, LayoutGrid, Settings, Power, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppConfig } from '@/types';

interface StartMenuProps {
  isOpen: boolean;
  apps: AppConfig[];
  onLaunch: (id: string) => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ isOpen, apps, onLaunch }) => {
  const syncWorkspace = () => {
    window.dispatchEvent(new CustomEvent('syncos-trigger-analyze', {
      detail: { prompt: "Analyze my entire workspace and give me a unified summary of what I'm working on across all open windows." }
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 300, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[95vw] md:w-[640px] h-[80vh] md:h-[720px] mica rounded-xl win-shadow z-[1000] p-4 md:p-8 flex flex-col gap-4 md:gap-8"
        >
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search for apps, settings, and documents"
                className="w-full bg-white/50 dark:bg-white/10 border border-white/20 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-white"
              />
            </div>
            <button 
              onClick={syncWorkspace}
              className="px-4 py-2 bg-blue-600 text-white rounded-full flex items-center gap-2 font-bold text-xs hover:bg-blue-700 transition-all shadow-lg active:scale-95"
            >
              <Zap size={14} className="text-yellow-300" />
              Sync
            </button>
          </div>

          {/* Pinned Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-sm dark:text-white">Pinned</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => apps.forEach(app => onLaunch(app.id))}
                  className="text-xs bg-blue-500/20 dark:bg-blue-500/10 border border-blue-500/30 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors text-blue-700 dark:text-blue-300"
                >
                  Launch All
                </button>
                <button className="text-xs bg-white/40 dark:bg-white/10 px-2 py-1 rounded hover:bg-white/60 dark:hover:bg-white/20 transition-colors dark:text-white">All apps &gt;</button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-y-6">
              {apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => onLaunch(app.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg group-hover:bg-white/20 transition-all group-active:scale-90">
                    <div className="w-8 h-8 text-blue-600 dark:text-blue-400">{app.icon}</div>
                  </div>
                  <span className="text-xs text-center dark:text-white">{app.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Section */}
          <div className="flex-1 hidden sm:block">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-sm dark:text-white">Recommended</span>
              <button className="text-xs bg-white/40 dark:bg-white/10 px-2 py-1 rounded hover:bg-white/60 dark:hover:bg-white/20 transition-colors dark:text-white">More &gt;</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-2 hover:bg-white/20 rounded-lg cursor-pointer">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center"><LayoutGrid size={16} className="text-blue-600 dark:text-blue-400" /></div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium dark:text-white">Get Started</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Welcome to SyncOS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-2 hover:bg-white/20 rounded-lg cursor-pointer">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"><User size={16} className="dark:text-white" /></div>
              <span className="text-xs font-medium dark:text-white">Student User</span>
            </div>
            <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <Power size={18} className="text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
