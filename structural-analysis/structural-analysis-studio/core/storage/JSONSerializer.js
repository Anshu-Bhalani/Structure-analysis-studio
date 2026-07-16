/**
 * Storage / JSONSerializer.js
 * ------------------------------------------------------------------
 * Wraps Model <-> JSON conversion with a format version, so future
 * versions of the app can migrate older project files safely.
 * ------------------------------------------------------------------
 */

import { Model } from "../modeling/Model.js";

export const PROJECT_FORMAT_VERSION = 1;

export class JSONSerializer {
  static serialize(model, meta = {}) {
    return JSON.stringify(
      {
        formatVersion: PROJECT_FORMAT_VERSION,
        appName: "Structural Analysis Studio",
        savedAt: new Date().toISOString(),
        meta,
        model: model.toJSON(),
      },
      null,
      2
    );
  }

  static deserialize(jsonText) {
    const parsed = JSON.parse(jsonText);
    if (!parsed.model) {
      throw new Error("Invalid project file: missing 'model' section");
    }
    if (parsed.formatVersion > PROJECT_FORMAT_VERSION) {
      throw new Error(
        `This project file was saved by a newer version of Structural Analysis Studio (format v${parsed.formatVersion}).`
      );
    }
    return { model: Model.fromJSON(parsed.model), meta: parsed.meta || {}, savedAt: parsed.savedAt };
  }
}
