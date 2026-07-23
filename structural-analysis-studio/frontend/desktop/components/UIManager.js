/**
 * UI / UIManager.js
 * ------------------------------------------------------------------
 * Composition point for all UI sub-components. App.js only talks to
 * UIManager; UIManager is the only place that knows Toolbar,
 * Sidebar, PropertiesPanel, BottomPanel and Dialogs exist.
 *
 * RULE: The UI module never performs engineering calculations. Every
 * callback here just forwards user intent up to App.js, which owns
 * the Model and Solver.
 * ------------------------------------------------------------------
 */

import { Toolbar } from "./Toolbar.js";
import { Sidebar } from "./Sidebar.js";
import { PropertiesPanel } from "./PropertiesPanel.js";
import { BottomPanel } from "./BottomPanel.js";
import { Dialogs } from "./Dialogs.js";

export class UIManager {
  /**
   * @param {{toolbar:HTMLElement, sidebar:HTMLElement, properties:HTMLElement, bottom:HTMLElement, dialogRoot:HTMLElement}} mounts
   * @param {object} callbacks   forwarded verbatim to the sub-components that need them
   */
  constructor(mounts, callbacks) {
    this.callbacks = callbacks;
    this.dialogs = new Dialogs(mounts.dialogRoot);

    this.toolbar = new Toolbar(mounts.toolbar, callbacks);
    this.sidebar = new Sidebar(mounts.sidebar, {
      onSelectNode: callbacks.onSidebarSelectNode,
      onSelectElement: callbacks.onSidebarSelectElement,
    });
    this.propertiesPanel = new PropertiesPanel(mounts.properties, callbacks);
    this.bottomPanel = new BottomPanel(mounts.bottom);
  }

  refreshModelViews(model, selection) {
    this.sidebar.refresh(model, selection);
    if (selection.selectedNodeId) {
      this.propertiesPanel.showNode(model.getNode(selection.selectedNodeId), model);
    } else if (selection.selectedElementId) {
      this.propertiesPanel.showElement(model.getElement(selection.selectedElementId), model);
    } else {
      this.propertiesPanel.showEmpty();
    }
  }

  showResults(result) {
    this.bottomPanel.showResults(result);
  }

  showLearningSteps(steps) {
    this.bottomPanel.showLearningSteps(steps);
  }

  showConsole(entries) {
    this.bottomPanel.showConsole(entries);
  }

  getViewOptions() {
    return this.toolbar.viewState;
  }

  isLearningEnabled() {
    return this.toolbar.learningEnabled;
  }
}
