/**
 * UI / PropertiesPanel.js
 * ------------------------------------------------------------------
 * Renders an editable property sheet for whatever is currently
 * selected. Pure presentation: every edit is reported through a
 * callback; the panel never mutates the Model itself.
 * ------------------------------------------------------------------
 */

import { ELEMENT_TYPES } from "../../../core/modeling/Element.js";

export class PropertiesPanel {
  constructor(containerEl, callbacks) {
    this.containerEl = containerEl;
    this.callbacks = callbacks;
    this.showEmpty();
  }

  showEmpty() {
    this.containerEl.innerHTML = `<div class="properties-empty">Select a node or element to see and edit its properties.</div>`;
  }

  /** @param {import('../modeling/Node.js').Node} node */
  showNode(node, model) {
    this.containerEl.innerHTML = "";
    const header = this._header("Node", node.label || node.id);
    this.containerEl.appendChild(header);

    const form = document.createElement("div");
    form.className = "properties-form";

    form.appendChild(this._textField("Label", node.label, (v) => this.callbacks.onNodeChange?.(node, { label: v })));
    form.appendChild(this._numberField("X (m)", node.x, 0.01, (v) => this.callbacks.onNodeChange?.(node, { x: v })));
    form.appendChild(this._numberField("Y (m)", node.y, 0.01, (v) => this.callbacks.onNodeChange?.(node, { y: v })));

    const support = model.getSupportForNode(node.id);
    const loads = model.getLoadsForNode(node.id);

    const supportRow = document.createElement("div");
    supportRow.className = "properties-subsection";
    supportRow.innerHTML = `<strong>Support</strong> ${support ? support.type : "<span class='muted'>none</span>"}`;
    const supportBtn = this._smallButton(support ? "Change Support" : "Add Support", () => this.callbacks.onAddSupport?.(node));
    supportRow.appendChild(supportBtn);
    if (support) {
      supportRow.appendChild(this._smallButton("Remove", () => this.callbacks.onRemoveSupport?.(support), "danger"));
    }
    form.appendChild(supportRow);

    const loadRow = document.createElement("div");
    loadRow.className = "properties-subsection";
    loadRow.innerHTML = `<strong>Loads</strong> ${loads.length ? `${loads.length} applied` : "<span class='muted'>none</span>"}`;
    loadRow.appendChild(this._smallButton("Add Load", () => this.callbacks.onAddLoad?.(node)));
    loads.forEach((load) => {
      const chip = document.createElement("div");
      chip.className = "load-chip";
      chip.textContent = `Fx=${load.Fx} N, Fy=${load.Fy} N, Mz=${load.Mz} N·m`;
      chip.appendChild(this._smallButton("×", () => this.callbacks.onRemoveLoad?.(load), "danger"));
      loadRow.appendChild(chip);
    });
    form.appendChild(loadRow);

    this.containerEl.appendChild(form);
    this.containerEl.appendChild(this._deleteButton("Delete Node", () => this.callbacks.onDeleteNode?.(node)));
  }

  /** @param {import('../modeling/Element.js').Element} element */
  showElement(element, model) {
    this.containerEl.innerHTML = "";
    const header = this._header(element.type, element.label || element.id);
    this.containerEl.appendChild(header);

    const form = document.createElement("div");
    form.className = "properties-form";

    const nodeI = model.getNode(element.nodeI);
    const nodeJ = model.getNode(element.nodeJ);
    const geomRow = document.createElement("div");
    geomRow.className = "properties-subsection";
    geomRow.innerHTML = `<strong>Nodes</strong> ${nodeI?.label || element.nodeI} &rarr; ${nodeJ?.label || element.nodeJ}`;
    form.appendChild(geomRow);

    if (element.type === ELEMENT_TYPES.SPRING) {
      form.appendChild(
        this._numberField("Stiffness k (N/m)", element.properties.stiffness ?? 1000, 1, (v) =>
          this.callbacks.onElementChange?.(element, { stiffness: v })
        )
      );
    } else if (element.type === ELEMENT_TYPES.BAR || element.type === ELEMENT_TYPES.BEAM) {
      const material = model.materials.get(element.properties.materialId) || [...model.materials.values()][0];
      const section = model.sections.get(element.properties.sectionId) || [...model.sections.values()][0];

      form.appendChild(
        this._numberField("Young's Modulus E (Pa)", material.E, 1e6, (v) =>
          this.callbacks.onMaterialChange?.(material, { E: v })
        )
      );
      form.appendChild(
        this._numberField("Area A (m²)", section.A, 0.0001, (v) =>
          this.callbacks.onSectionChange?.(section, { A: v })
        )
      );
      if (element.type === ELEMENT_TYPES.BEAM) {
        form.appendChild(
          this._numberField("Moment of Inertia I (m⁴)", section.I, 1e-6, (v) =>
            this.callbacks.onSectionChange?.(section, { I: v })
          )
        );
      }
    }

    this.containerEl.appendChild(form);
    this.containerEl.appendChild(this._deleteButton("Delete Element", () => this.callbacks.onDeleteElement?.(element)));
  }

  _header(kind, name) {
    const div = document.createElement("div");
    div.className = "properties-header";
    div.innerHTML = `<span class="properties-kind">${kind}</span><span class="properties-name">${name}</span>`;
    return div;
  }

  _textField(label, value, onChange) {
    const row = document.createElement("label");
    row.className = "properties-field";
    row.innerHTML = `<span>${label}</span>`;
    const input = document.createElement("input");
    input.type = "text";
    input.value = value || "";
    input.onchange = () => onChange(input.value);
    row.appendChild(input);
    return row;
  }

  _numberField(label, value, step, onChange) {
    const row = document.createElement("label");
    row.className = "properties-field";
    row.innerHTML = `<span>${label}</span>`;
    const input = document.createElement("input");
    input.type = "number";
    input.step = step;
    input.value = value;
    input.onchange = () => onChange(parseFloat(input.value));
    row.appendChild(input);
    return row;
  }

  _smallButton(label, onClick, kind = "ghost") {
    const btn = document.createElement("button");
    btn.className = `btn btn-small btn-${kind}`;
    btn.textContent = label;
    btn.onclick = onClick;
    return btn;
  }

  _deleteButton(label, onClick) {
    const btn = document.createElement("button");
    btn.className = "btn btn-danger btn-block";
    btn.textContent = label;
    btn.onclick = onClick;
    return btn;
  }
}
