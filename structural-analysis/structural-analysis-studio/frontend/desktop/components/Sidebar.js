/**
 * UI / Sidebar.js
 * ------------------------------------------------------------------
 * Model tree (nodes / elements / supports / loads) and a visible
 * roadmap of future analysis modules. The roadmap list is presentation
 * only — proof that the architecture already has a place for Frame,
 * Grid, Plate, Shell, Solid, 3D, Dynamic, and AI without any code
 * changes elsewhere.
 * ------------------------------------------------------------------
 */

const FUTURE_MODULES = ["Frame", "Grid", "Cable", "Plate", "Shell", "Solid", "3D", "Dynamic", "Buckling", "Modal", "Thermal", "AI Assistant"];

export class Sidebar {
  constructor(containerEl, callbacks) {
    this.containerEl = containerEl;
    this.callbacks = callbacks;
    this._render();
  }

  _render() {
    this.containerEl.innerHTML = "";

    const treeSection = document.createElement("div");
    treeSection.className = "sidebar-section";
    const treeTitle = document.createElement("h4");
    treeTitle.textContent = "Model Tree";
    treeSection.appendChild(treeTitle);
    this.treeBody = document.createElement("div");
    this.treeBody.className = "model-tree";
    treeSection.appendChild(this.treeBody);
    this.containerEl.appendChild(treeSection);

    const futureSection = document.createElement("div");
    futureSection.className = "sidebar-section";
    const futureTitle = document.createElement("h4");
    futureTitle.textContent = "Future Modules";
    futureSection.appendChild(futureTitle);
    const futureList = document.createElement("div");
    futureList.className = "future-module-list";
    FUTURE_MODULES.forEach((name) => {
      const chip = document.createElement("div");
      chip.className = "future-module-chip";
      chip.textContent = name;
      chip.title = `${name} — architecture reserved, not implemented in Version 1`;
      futureList.appendChild(chip);
    });
    futureSection.appendChild(futureList);
    this.containerEl.appendChild(futureSection);
  }

  /** @param {import('../../../core/modeling/Model.js').Model} model */
  refresh(model, selection) {
    this.treeBody.innerHTML = "";

    this._treeGroup("Nodes", model.getAllNodes(), (node, i) => ({
      id: node.id,
      text: node.label || `N${i + 1}`,
      sub: `(${node.x.toFixed(2)}, ${node.y.toFixed(2)})`,
      selected: selection.selectedNodeId === node.id,
      onClick: () => this.callbacks.onSelectNode?.(node),
    }));

    this._treeGroup("Elements", model.getAllElements(), (el, i) => ({
      id: el.id,
      text: `${el.type} ${i + 1}`,
      sub: el.label || "",
      selected: selection.selectedElementId === el.id,
      onClick: () => this.callbacks.onSelectElement?.(el),
    }));

    this._treeGroup("Supports", model.getAllSupports(), (s, i) => ({
      id: s.id,
      text: `Support ${i + 1}`,
      sub: s.type,
      onClick: () => {
        const node = model.getNode(s.nodeId);
        if (node) this.callbacks.onSelectNode?.(node);
      },
    }));

    this._treeGroup("Loads", model.getAllLoads(), (l, i) => ({
      id: l.id,
      text: `Load ${i + 1}`,
      sub: `Fx=${l.Fx}, Fy=${l.Fy}, Mz=${l.Mz}`,
      onClick: () => {
        const node = model.getNode(l.nodeId);
        if (node) this.callbacks.onSelectNode?.(node);
      },
    }));
  }

  _treeGroup(title, items, mapFn) {
    const header = document.createElement("div");
    header.className = "tree-group-header";
    header.textContent = `${title} (${items.length})`;
    this.treeBody.appendChild(header);

    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "tree-empty";
      empty.textContent = "—";
      this.treeBody.appendChild(empty);
      return;
    }

    items.forEach((item, i) => {
      const info = mapFn(item, i);
      const row = document.createElement("div");
      row.className = "tree-row" + (info.selected ? " selected" : "");
      row.innerHTML = `<span class="tree-row-text">${info.text}</span><span class="tree-row-sub">${info.sub || ""}</span>`;
      row.onclick = info.onClick;
      this.treeBody.appendChild(row);
    });
  }
}
