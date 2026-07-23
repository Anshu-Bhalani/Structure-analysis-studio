/**
 * Storage / ProjectStorage.js
 * ------------------------------------------------------------------
 * New / Open / Save / Export / Import for project files.
 *
 * "Save" persists to the browser's localStorage (auto-recoverable
 * across sessions). "Export" downloads a portable .json file the
 * user can move between machines; "Import" reads one back in.
 * ------------------------------------------------------------------
 */

import { Model } from "../modeling/Model.js";
import { JSONSerializer } from "./JSONSerializer.js";
import { logger } from "../utilities/Logger.js";

const STORAGE_KEY = "structural-analysis-studio:autosave";
const RECENT_KEY = "structural-analysis-studio:recent-project-name";

export class ProjectStorage {
  static newProject() {
    return new Model();
  }

  static save(model, projectName = "untitled") {
    try {
      const json = JSONSerializer.serialize(model, { projectName });
      window.localStorage.setItem(STORAGE_KEY, json);
      window.localStorage.setItem(RECENT_KEY, projectName);
      logger.info("Project saved to local storage", { projectName });
      return true;
    } catch (err) {
      logger.error("Failed to save project", { error: err.message });
      return false;
    }
  }

  static hasAutosave() {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  }

  static open() {
    const json = window.localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    const { model, meta } = JSONSerializer.deserialize(json);
    return { model, projectName: meta.projectName || "untitled" };
  }

  /** Triggers a browser download of the project as a .json file. */
  static exportToFile(model, projectName = "structural-model") {
    const json = JSONSerializer.serialize(model, { projectName });
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** @param {File} file  a File object from an <input type="file"> element */
  static importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const { model, meta } = JSONSerializer.deserialize(reader.result);
          resolve({ model, projectName: meta.projectName || file.name.replace(/\.json$/, "") });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Could not read the selected file"));
      reader.readAsText(file);
    });
  }
}
