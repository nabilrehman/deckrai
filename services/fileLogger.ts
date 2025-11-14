/**
 * File-based logging service for server-side logging
 * Supports tail -f monitoring
 */

import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'deckr.log');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Ensure log directory exists
 */
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Rotate log file if it exceeds max size
 */
function rotateLogIfNeeded() {
  if (!fs.existsSync(LOG_FILE)) {
    return;
  }

  const stats = fs.statSync(LOG_FILE);
  if (stats.size > MAX_LOG_SIZE) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFile = path.join(LOG_DIR, `deckr-${timestamp}.log`);
    fs.renameSync(LOG_FILE, rotatedFile);
    console.log(`📦 Rotated log file to: ${rotatedFile}`);
  }
}

/**
 * Write log entry to file
 */
export function logToFile(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any) {
  try {
    ensureLogDir();
    rotateLogIfNeeded();

    const timestamp = new Date().toISOString();
    const logEntry = data
      ? `[${timestamp}] [${level}] ${message} ${JSON.stringify(data)}\n`
      : `[${timestamp}] [${level}] ${message}\n`;

    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

/**
 * Convenience methods
 */
export const fileLogger = {
  info: (message: string, data?: any) => logToFile('INFO', message, data),
  warn: (message: string, data?: any) => logToFile('WARN', message, data),
  error: (message: string, data?: any) => logToFile('ERROR', message, data),
  debug: (message: string, data?: any) => logToFile('DEBUG', message, data),
};

/**
 * Get log file path for monitoring
 */
export function getLogFilePath(): string {
  return LOG_FILE;
}

/**
 * Clear log file
 */
export function clearLogFile() {
  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
    console.log('🗑️  Cleared log file');
  }
}
