/**
 * SYNC-OS HARDWARE MONITOR: Visualizes system resource utilization.
 * Tracks memory allocation, workspace processing loads, and context sync status.
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Database, Cpu, HardDrive, RefreshCw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SystemMonitor: React.FC = () => {
  const [memoryUsage, setMemoryUsage] = useState(42);
  const [cpuUsage, setCpuUsage] = useState(15);
  const [syncStatus, setSyncStatus] = useState('Active');
  const [pastDataSync, setPastDataSync] = useState(98);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryUsage(prev => {
        const delta = Math.random() * 2 - 1;
        return Math.min(Math.max(prev + delta, 30), 85);
      });
      setCpuUsage(prev => {
        const delta = Math.random() * 4 - 2;
        return Math.min(Math.max(prev + delta, 5), 90);
      });
      setUptime(prev => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, suffix = '%' }: any) => (
    <div className="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-white/20 dark:border-white/10 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium">{title}</span>
        <Icon size={14} className={color} />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold font-mono">{Math.round(value)}{suffix}</span>
        <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
          <motion.div 
            className={cn("h-full", color.replace('text-', 'bg-'))}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(value, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-auto scrollbar-hide">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="text-blue-500" />
          SyncOS Intelligence Resource Monitor
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium border border-green-500/20">
          <RefreshCw size={12} className="animate-spin-slow" />
          Synchronized
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard 
          title="Intelligence Memory Allocation" 
          value={memoryUsage} 
          icon={Database} 
          color="text-indigo-500" 
        />
        <StatCard 
          title="Workspace Processing Load" 
          value={cpuUsage} 
          icon={Cpu} 
          color="text-orange-500" 
        />
        <StatCard 
          title="Past Context Synchronization" 
          value={pastDataSync} 
          icon={HardDrive} 
          color="text-emerald-500" 
        />
        <StatCard 
          title="Session Uptime" 
          value={uptime} 
          icon={Zap} 
          color="text-yellow-500"
          suffix="s" 
        />
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Active Sync Streams</h3>
        <div className="space-y-3">
          {[
            { name: 'AITutor Context', status: 'Optimal', load: 'High' },
            { name: 'Workspace Metadata', status: 'Synced', load: 'Low' },
            { name: 'Session Intelligence Log', status: 'Writing', load: 'Med' },
          ].map((stream) => (
            <div key={stream.name} className="flex items-center justify-between p-3 bg-white/30 dark:bg-white/5 rounded-lg border border-white/10">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{stream.name}</span>
                <span className="text-[10px] text-gray-400 capitalize">{stream.status}</span>
              </div>
              <div className="flex items-center gap-2 scale-75">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-1 h-3 rounded-full",
                        i <= (stream.load === 'High' ? 5 : stream.load === 'Med' ? 3 : 1) 
                          ? "bg-blue-500" 
                          : "bg-gray-300 dark:bg-gray-700"
                      )} 
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-[11px] text-blue-600/80 dark:text-blue-400/80 italic">
        * Diverse memory utilization is currently active. SyncOS is automatically synchronizing workspace and past data triggers unless manual override is initiated.
      </div>
    </div>
  );
};
