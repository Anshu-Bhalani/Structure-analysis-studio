/**
 * UI / Toolbar.js
 * ------------------------------------------------------------------
 * Top command bar. Pure presentation: it renders buttons and reports
 * user intent through callbacks. It never touches the Model, Solver,
 * or Graphics directly — App.js decides what each action means.
 * ------------------------------------------------------------------
 */

const TOOLS = [
  { id: "select", label: "Select", hint: "Select and drag (V)" },
  { id: "move", label: "Move", hint: "Drag nodes to reposition them" },
  { id: "pan", label: "Pan", hint: "Pan the view (hold Space also pans)" },
  { id: "addNode", label: "+ Node", hint: "Click canvas to place a node" },
  { id: "addSpring", label: "+ Spring", hint: "Click two nodes to connect a spring" },
  { id: "addBar", label: "+ Bar", hint: "Click two nodes to connect a truss bar" },
  { id: "addBeam", label: "+ Beam", hint: "Click two nodes to connect a beam" },
  { id: "addSupport", label: "+ Support", hint: "Click a node to add a support" },
  { id: "addLoad", label: "+ Load", hint: "Click a node to add a nodal load" },
  { id: "delete", label: "Delete", hint: "Click a node or element to delete it" },
];

const VIEW_TOGGLES = [
  { id: "showDeflected", label: "Deflected Shape" },
  { id: "showReactions", label: "Reactions" },
  { id: "showSFD", label: "SFD" },
  { id: "showBMD", label: "BMD" },
];

export class Toolbar {
  constructor(containerEl, callbacks) {
    this.containerEl = containerEl;
    this.callbacks = callbacks;
    this.activeTool = "select";
    this.viewState = { showDeflected: true, showReactions: true, showSFD: false, showBMD: false };
    this.learningEnabled = false;
    this._render();
  }

  _render() {
    this.containerEl.innerHTML = "";
    this.containerEl.appendChild(this._fileGroup());
    this.containerEl.appendChild(this._toolGroup());
    this.containerEl.appendChild(this._snapGroup());
    this.containerEl.appendChild(this._historyGroup());
    this.containerEl.appendChild(this._analysisGroup());
    this.containerEl.appendChild(this._viewGroup());
    this.containerEl.appendChild(this._rightGroup());
  }

  _group(className) {
    const div = document.createElement("div");
    div.className = `toolbar-group ${className || ""}`.trim();
    return div;
  }

  _btn(label, hint, onClick, extraClass = "") {
    const btn = document.createElement("button");
    btn.className = `btn btn-tool ${extraClass}`.trim();
    btn.textContent = label;
    if (hint) btn.title = hint;
    btn.onclick = onClick;
    return btn;
  }

  _fileGroup() {
    const g = this._group("file-group");
    g.appendChild(this._btn("New", "New project", () => this.callbacks.onNew?.()));
    g.appendChild(this._btn("Open", "Open last autosave", () => this.callbacks.onOpen?.()));
    g.appendChild(this._btn("Save", "Save to browser storage", () => this.callbacks.onSave?.()));
    g.appendChild(this._btn("Import", "Import a .json project file", () => this.callbacks.onImport?.()));
    g.appendChild(this._btn("Export", "Download project as .json", () => this.callbacks.onExport?.()));
    return g;
  }

  _toolGroup() {
    const g = this._group("tool-group");
    TOOLS.forEach((tool) => {
      const btn = this._btn(tool.label, tool.hint, () => {
        this.setActiveTool(tool.id);
        this.callbacks.onToolChange?.(tool.id);
      });
      btn.dataset.toolId = tool.id;
      if (tool.id === this.activeTool) btn.classList.add("active");
      g.appendChild(btn);
    });
    this.toolGroupEl = g;
    return g;
  }

  setActiveTool(toolId) {
    this.activeTool = toolId;
    if (!this.toolGroupEl) return;
    [...this.toolGroupEl.children].forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.toolId === toolId);
    });
  }

  _analysisGroup() {
    const g = this._group("analysis-group");
    const runBtn = this._btn("▶ Run Analysis", "Solve the structure", () => this.callbacks.onRunAnalysis?.(), "btn-primary");
    g.appendChild(runBtn);

    const learningBtn = this._btn("Learning Mode", "Show step-by-step solver walkthrough", () => {
      this.learningEnabled = !this.learningEnabled;
      learningBtn.classList.toggle("active", this.learningEnabled);
      this.callbacks.onToggleLearning?.(this.learningEnabled);
    });
    g.appendChild(learningBtn);
    return g;
  }

  /** Snap-to-grid / snap-to-node toggles. Both default on, matching State.js's defaults. */
  _snapGroup() {
    const g = this._group("snap-group");
    g.appendChild(this._togglePill("Snap", true, (checked) => this.callbacks.onToggleSnap?.(checked)));
    g.appendChild(this._togglePill("Grid", true, (checked) => this.callbacks.onToggleGrid?.(checked)));
    return g;
  }

  /** Undo/Redo. Buttons start disabled since a fresh editor has nothing to undo yet. */
  _historyGroup() {
    const g = this._group("history-group");
    this.undoBtn = this._btn("↩ Undo", "Undo last action (Ctrl+Z)", () => this.callbacks.onUndo?.());
    this.redoBtn = this._btn("↪ Redo", "Redo last undone action (Ctrl+Y)", () => this.callbacks.onRedo?.());
    this.undoBtn.disabled = true;
    this.redoBtn.disabled = true;
    g.appendChild(this.undoBtn);
    g.appendChild(this.redoBtn);
    return g;
  }

  /** Call after any model-mutating action so the Undo/Redo buttons reflect what's actually available. */
  setHistoryState(canUndo, canRedo) {
    if (this.undoBtn) this.undoBtn.disabled = !canUndo;
    if (this.redoBtn) this.redoBtn.disabled = !canRedo;
  }

  _togglePill(label, defaultChecked, onChange) {
    const wrapper = document.createElement("label");
    wrapper.className = "checkbox-pill";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = defaultChecked;
    input.onchange = () => onChange(input.checked);
    wrapper.appendChild(input);
    wrapper.append(label);
    return wrapper;
  }

  _viewGroup() {
    const g = this._group("view-group");
    VIEW_TOGGLES.forEach((toggle) => {
      const label = document.createElement("label");
      label.className = "checkbox-pill";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = this.viewState[toggle.id];
      input.onchange = () => {
        this.viewState[toggle.id] = input.checked;
        this.callbacks.onViewOptionChange?.(this.viewState);
      };
      label.appendChild(input);
      label.append(toggle.label);
      g.appendChild(label);
    });
    return g;
  }

  _rightGroup() {
    const g = this._group("right-group");
    g.appendChild(this._btn("−", "Zoom out", () => this.callbacks.onZoomOut?.(), "btn-icon"));
    g.appendChild(this._btn("+", "Zoom in", () => this.callbacks.onZoomIn?.(), "btn-icon"));
    g.appendChild(this._btn("Fit View", "Fit the model to the viewport", () => this.callbacks.onFitView?.()));
    g.appendChild(this._btn("☾", "Toggle theme", () => this.callbacks.onToggleTheme?.(), "btn-icon"));
    return g;
  }
}
