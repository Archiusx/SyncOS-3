/**
 * SYNC-OS WINDOW SHELL: The high-fidelity windowing container.
 * Features Framer Motion powered dragging, resizing, and Aero-Snap logic.
 * Implements the system-wide 'Sync-Scrape' context reporting mechanism.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue } from 'motion/react';
import { X, Minus, Square, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppId, SnapState } from '@/types';

interface WindowProps {
  id: AppId;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  snapState?: SnapState;
  zIndex: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onSnap: (snap: SnapState) => void;
  onFocus: () => void;
  onMove?: (x: number, y: number) => void;
}

export const Window: React.FC<WindowProps> = ({
  id,
  title,
  icon,
  children,
  isOpen,
  isMinimized,
  isMaximized,
  snapState = 'none',
  zIndex,
  position,
  size,
  onClose,
  onMinimize,
  onMaximize,
  onSnap,
  onFocus,
  onMove,
}) => {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [showSnapLayouts, setShowSnapLayouts] = useState(false);
  
  const x = useMotionValue(position?.x ?? 40);
  const y = useMotionValue(position?.y ?? 40);

  // Sync motion values when position prop changes (e.g. from tiling or snapping)
  React.useEffect(() => {
    if (!isDragging) {
      x.set(position?.x ?? 40);
      y.set(position?.y ?? 40);
    }
  }, [position, isDragging, x, y]);

  if (!isOpen || isMinimized) return null;

  const getLayout = () => {
    if (isMaximized) {
      return { 
        width: '100%', 
        height: 'calc(100% - 48px)', // Account for taskbar
        borderRadius: 0 
      };
    }
    
    // Safety check for mobile
    const isSmallScreen = window.innerWidth < 768;
    
    switch (snapState) {
      case 'left': return { width: '50%', height: 'calc(100% - 48px)', borderRadius: 0 };
      case 'right': return { width: '50%', height: 'calc(100% - 48px)', borderRadius: 0 };
      case 'top-left': return { width: '50%', height: 'calc(50% - 24px)', borderRadius: 0 };
      case 'top-right': return { width: '50%', height: 'calc(50% - 24px)', borderRadius: 0 };
      case 'bottom-left': return { width: '50%', height: 'calc(50% - 24px)', borderRadius: 0 };
      case 'bottom-right': return { width: '50%', height: 'calc(50% - 24px)', borderRadius: 0 };
      default: 
        const w = typeof size?.width === 'number' 
          ? Math.min(size.width, window.innerWidth - (isSmallScreen ? 10 : 40)) 
          : (isSmallScreen ? '95%' : size?.width || 800);
        const h = typeof size?.height === 'number' 
          ? Math.min(size.height, window.innerHeight - 100) 
          : (isSmallScreen ? '85%' : size?.height || 600); // Taller on mobile for better visibility
        return { 
          width: w, 
          height: h,
          borderRadius: isSmallScreen ? 12 : 8
        };
    }
  };

  const getAnimatePosition = () => {
    if (isMaximized) return { x: 0, y: 0 };
    const isSmallScreen = window.innerWidth < 768;
    
    switch (snapState) {
      case 'left': return { x: 0, y: 0 };
      case 'right': return { x: window.innerWidth / 2, y: 0 };
      case 'top-left': return { x: 0, y: 0 };
      case 'top-right': return { x: window.innerWidth / 2, y: 0 };
      case 'bottom-left': return { x: 0, y: window.innerHeight / 2 - 24 };
      case 'bottom-right': return { x: window.innerWidth / 2, y: window.innerHeight / 2 - 24 };
      default: 
        // Improved centering on mobile and small devices
        if (isSmallScreen) {
          const w = typeof size?.width === 'number' ? size.width : (window.innerWidth * 0.95);
          const h = typeof size?.height === 'number' ? size.height : (window.innerHeight * 0.7);
          return { 
            x: (window.innerWidth - w) / 2, 
            y: Math.max(10, (window.innerHeight - h - 60) / 2) 
          };
        }
        return { x: position?.x ?? 40, y: position?.y ?? 40 };
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ ...getLayout(), ...getAnimatePosition() }}
      exit={{ scale: 0.95, opacity: 0 }}
      drag={!isMaximized && snapState === 'none'}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => {
        setIsDragging(true);
        if (snapState !== 'none') onSnap('none');
      }}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        if (onMove) {
          const newX = x.get() + info.offset.x;
          const newY = y.get() + info.offset.y;
          onMove(newX, newY);
        }
      }}
      onPointerDown={onFocus}
      style={{ x, y, zIndex }}
      className={cn(
        "absolute top-0 left-0 flex flex-col mica overflow-hidden win-shadow border border-white/30 dark:border-white/10",
        isDragging ? "shadow-2xl z-[999] ring-2 ring-blue-500/50" : ""
      )}
      transition={isDragging ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 40 }}
    >
      <div 
        className="h-10 flex items-center justify-between px-3 bg-white/40 dark:bg-black/40 backdrop-blur-md cursor-default select-none active:cursor-grabbing touch-none"
        onPointerDown={(e) => {
          e.preventDefault();
          dragControls.start(e);
        }}
        onDoubleClick={onMaximize}
      >
        <div className="flex items-center gap-2 flex-1 h-full">
          <div className="w-4 h-4 shrink-0">{icon}</div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{title}</span>
        </div>
        
        <div className="flex items-center h-full shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="h-full px-3 hover:bg-black/5 dark:hover:bg-white/10 flex items-center transition-colors dark:text-gray-200"
          >
            <Minus size={14} />
          </button>
          
          <div 
            className="relative h-full"
            onMouseEnter={() => setShowSnapLayouts(true)}
            onMouseLeave={() => setShowSnapLayouts(false)}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); onMaximize(); }}
              className="h-full px-3 hover:bg-black/5 dark:hover:bg-white/10 flex items-center transition-colors dark:text-gray-200"
            >
              {isMaximized ? <Copy size={12} /> : <Square size={12} />}
            </button>

            <AnimatePresence>
              {showSnapLayouts && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-10 right-0 mica p-3 rounded-lg win-shadow z-[100] grid grid-cols-2 gap-2 w-48"
                >
                  <button onClick={() => onSnap('left')} className="h-12 border-2 border-blue-500/30 hover:bg-blue-500/20 rounded flex items-center justify-start p-1 transition-colors">
                    <div className="w-1/2 h-full bg-blue-500/40 rounded-sm" />
                  </button>
                  <button onClick={() => onSnap('right')} className="h-12 border-2 border-blue-500/30 hover:bg-blue-500/20 rounded flex items-center justify-end p-1 transition-colors">
                    <div className="w-1/2 h-full bg-blue-500/40 rounded-sm" />
                  </button>
                  <button onClick={() => onSnap('top-left')} className="h-12 border-2 border-blue-500/30 hover:bg-blue-500/20 rounded grid grid-cols-2 grid-rows-2 p-1 gap-1 transition-colors">
                    <div className="bg-blue-500/40 rounded-sm" />
                  </button>
                  <button onClick={() => onSnap('top-right')} className="h-12 border-2 border-blue-500/30 hover:bg-blue-500/20 rounded grid grid-cols-2 grid-rows-2 p-1 gap-1 transition-colors">
                    <div />
                    <div className="bg-blue-500/40 rounded-sm" />
                  </button>
                  <button onClick={() => onSnap('bottom-left')} className="h-12 border-2 border-blue-500/30 hover:bg-blue-500/20 rounded grid grid-cols-2 grid-rows-2 p-1 gap-1 transition-colors">
                    <div /><div />
                    <div className="bg-blue-500/40 rounded-sm" />
                  </button>
                  <button onClick={() => onSnap('bottom-right')} className="h-12 border-2 border-blue-500/30 hover:bg-blue-500/20 rounded grid grid-cols-2 grid-rows-2 p-1 gap-1 transition-colors">
                    <div /><div /><div />
                    <div className="bg-blue-500/40 rounded-sm" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="h-full px-4 hover:bg-red-500 hover:text-white flex items-center transition-colors dark:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white/80 dark:bg-black/40 relative">
        {isDragging && <div className="absolute inset-0 z-50 bg-transparent" />}
        {children}
      </div>
    </motion.div>
  );
};
