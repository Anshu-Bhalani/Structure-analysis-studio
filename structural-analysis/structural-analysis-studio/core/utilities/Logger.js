/**
 * Utilities / Logger.js
 * ------------------------------------------------------------------
 * Centralized logging so the rest of the app never calls
 * console.* directly. Keeps a rolling in-memory log the UI (or a
 * future diagnostics panel) can display.
 * ------------------------------------------------------------------
 */

const LEVELS = ["debug", "info", "warn", "error"];

export class Logger {
  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
    this.entries = [];
    this.listeners = [];
  }

  _push(level, message, meta) {
    const entry = { level, message, meta, time: new Date().toISOString() };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) this.entries.shift();
    this.listeners.forEach((fn) => fn(entry));
    if (level === "error") {
      // eslint-disable-next-line no-console
      console.error(`[${entry.time}] ${message}`, meta || "");
    }
    return entry;
  }

  debug(message, meta) {
    return this._push("debug", message, meta);
  }

  info(message, meta) {
    return this._push("info", message, meta);
  }

  warn(message, meta) {
    return this._push("warn", message, meta);
  }

  error(message, meta) {
    return this._push("error", message, meta);
  }

  onLog(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  getEntries() {
    return this.entries.slice();
  }
}

export const LOG_LEVELS = LEVELS;

// Single shared instance used across the whole application.
export const logger = new Logger();
