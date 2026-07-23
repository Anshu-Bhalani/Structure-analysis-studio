/**
 * App / State.js
 * ------------------------------------------------------------------
 * Application-level state: which tool is active, whether the model
 * has unsaved changes, the current project name, and the latest
 * solver result. This is distinct from Modeling.Model, which holds
 * the structural DATA — State holds session/UI concerns instead.
 * ------------------------------------------------------------------
 */

export class State {
  constructor() {
    this.projectName = "untitled";
    this.currentTool = "select";
    this.isDirty = false;
    this.lastResult = null; // most recent Solver.run() output
    this.pendingElementStartNodeId = null; // used while drawing Spring/Bar/Beam
    this.listeners = [];
  }

  onChange(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  _notify() {
    this.listeners.forEach((fn) => fn(this));
  }

  setTool(tool) {
    this.currentTool = tool;
    this.pendingElementStartNodeId = null;
    this._notify();
  }

  markDirty() {
    this.isDirty = true;
    this._notify();
  }

  markClean() {
    this.isDirty = false;
    this._notify();
  }

  setResult(result) {
    this.lastResult = result;
    this._notify();
  }

  clearResult() {
    this.lastResult = null;
    this._notify();
  }
}
