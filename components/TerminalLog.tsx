import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalLogProps {
  logs: LogEntry[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs shadow-inner">
      <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2 sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-slate-400 ml-2">Deckr.ai Core System</span>
      </div>
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-3 ${
                log.type === 'success' ? 'text-green-400' : 
                log.type === 'process' ? 'text-blue-400' : 'text-slate-400'
              }`}
            >
              <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}]</span>
              <span>{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};