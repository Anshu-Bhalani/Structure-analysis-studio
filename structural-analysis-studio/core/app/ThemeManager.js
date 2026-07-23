/**
 * App / ThemeManager.js
 * ------------------------------------------------------------------
 * Single source of truth for color tokens. Applies them as CSS
 * custom properties (for the HTML/CSS UI chrome) AND exposes a flat
 * color dictionary the Canvas-based Graphics/Visualization renderers
 * can use directly (a <canvas> cannot read CSS variables on its own).
 * ------------------------------------------------------------------
 */

const THEMES = {
  dark: {
    canvasBackground: "#14171c",
    panelBackground: "#1b1f26",
    panelBackgroundAlt: "#20252d",
    borderColor: "#2c323c",
    gridLine: "#242932",
    axis: "#3a4250",
    text: "#e6e9ee",
    textMuted: "#8b93a3",
    accent: "#4d8dff",
    danger: "#e5584f",
    node: "#cfd6e0",
    nodeStroke: "#0d0f12",
    support: "#9aa4b2",
    load: "#ff7a45",
    deflected: "#ef5da8",
    reaction: "#ffcf5c",
    sfd: "#4fd1c5",
    bmd: "#f56565",
    elementByType: {
      Spring: "#f2a33d",
      Bar: "#4fb0e0",
      Beam: "#57c98b",
    },
    element: "#a9b3c2",
  },
  light: {
    canvasBackground: "#f7f8fa",
    panelBackground: "#ffffff",
    panelBackgroundAlt: "#f1f3f6",
    borderColor: "#dde1e7",
    gridLine: "#e7eaee",
    axis: "#b9c1cd",
    text: "#1c222b",
    textMuted: "#5b6472",
    accent: "#2563eb",
    danger: "#c0392b",
    node: "#1c222b",
    nodeStroke: "#ffffff",
    support: "#55606e",
    load: "#d1451f",
    deflected: "#c2298a",
    reaction: "#a5720a",
    sfd: "#0f9488",
    bmd: "#c53030",
    elementByType: {
      Spring: "#c97a1a",
      Bar: "#1d7fb0",
      Beam: "#1f9d63",
    },
    element: "#4b5563",
  },
};

export class ThemeManager {
  constructor() {
    this.current = "dark";
  }

  getColors(themeName = this.current) {
    return THEMES[themeName];
  }

  apply(themeName) {
    this.current = themeName;
    const colors = THEMES[themeName];
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value === "string") {
        root.style.setProperty(`--color-${key}`, value);
      }
    });
    root.dataset.theme = themeName;
    return colors;
  }

  toggle() {
    return this.apply(this.current === "dark" ? "light" : "dark");
  }
}
