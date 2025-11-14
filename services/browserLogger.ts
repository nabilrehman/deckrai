/**
 * Browser-compatible logging service
 * Stores logs in localStorage and provides download capability
 * For server-side monitoring, check browser console or download logs
 */

const LOG_KEY = 'deckr_logs';
const MAX_LOGS = 1000; // Keep last 1000 log entries

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  data?: any;
}

/**
 * Get all logs from localStorage
 */
function getLogs(): LogEntry[] {
  try {
    const logs = localStorage.getItem(LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
}

/**
 * Save logs to localStorage
 */
function saveLogs(logs: LogEntry[]) {
  try {
    // Keep only last MAX_LOGS entries
    const trimmedLogs = logs.slice(-MAX_LOGS);
    localStorage.setItem(LOG_KEY, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Failed to save logs to localStorage:', error);
  }
}

/**
 * Add log entry
 */
export function logToStorage(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  };

  // Also log to console for immediate visibility
  const consoleMessage = data
    ? `[${level}] ${message}:`
    : `[${level}] ${message}`;

  switch (level) {
    case 'ERROR':
      console.error(consoleMessage, data || '');
      break;
    case 'WARN':
      console.warn(consoleMessage, data || '');
      break;
    case 'DEBUG':
      console.debug(consoleMessage, data || '');
      break;
    default:
      console.log(consoleMessage, data || '');
  }

  // Save to localStorage
  const logs = getLogs();
  logs.push(entry);
  saveLogs(logs);
}

/**
 * Convenience methods
 */
export const browserLogger = {
  info: (message: string, data?: any) => logToStorage('INFO', message, data),
  warn: (message: string, data?: any) => logToStorage('WARN', message, data),
  error: (message: string, data?: any) => logToStorage('ERROR', message, data),
  debug: (message: string, data?: any) => logToStorage('DEBUG', message, data),

  /**
   * Download logs as a file
   */
  download: (filename?: string) => {
    const logs = getLogs();
    const logText = logs
      .map(entry => {
        const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
        return `[${entry.timestamp}] [${entry.level}] ${entry.message}${dataStr}`;
      })
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `deckr-logs-${new Date().toISOString()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`📥 Downloaded ${logs.length} log entries to ${a.download}`);
  },

  /**
   * Clear all logs
   */
  clear: () => {
    localStorage.removeItem(LOG_KEY);
    console.log('🗑️  Cleared all logs');
  },

  /**
   * Get all logs (for displaying in UI)
   */
  getAll: (): LogEntry[] => {
    return getLogs();
  },

  /**
   * Print all logs to console (for tail -f like monitoring)
   */
  printAll: () => {
    const logs = getLogs();
    console.log(`\n📋 Showing ${logs.length} log entries:\n`);
    logs.forEach(entry => {
      const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
      console.log(`[${entry.timestamp}] [${entry.level}] ${entry.message}${dataStr}`);
    });
  },
};

// Expose to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).deckrLogs = browserLogger;
}
