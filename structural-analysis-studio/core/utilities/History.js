/**
 * Utilities / History.js
 * ------------------------------------------------------------------
 * Generic undo/redo command stack. Works on plain JSON snapshots so
 * it has no knowledge of what "Model" or "Node" mean.
 * ------------------------------------------------------------------
 */

export class History {
  constructor(limit = 100) {
    this.limit = limit;
    this.past = [];
    this.future = [];
  }

  /** Push a new snapshot (call this BEFORE mutating state, or with the state right after a change). */
  push(snapshot) {
    this.past.push(snapshot);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  canUndo() {
    return this.past.length > 1;
  }

  canRedo() {
    return this.future.length > 0;
  }

  undo() {
    if (!this.canUndo()) return null;
    const current = this.past.pop();
    this.future.push(current);
    return this.past[this.past.length - 1];
  }

  redo() {
    if (!this.canRedo()) return null;
    const next = this.future.pop();
    this.past.push(next);
    return next;
  }

  clear(initialSnapshot) {
    this.past = initialSnapshot !== undefined ? [initialSnapshot] : [];
    this.future = [];
  }
}
