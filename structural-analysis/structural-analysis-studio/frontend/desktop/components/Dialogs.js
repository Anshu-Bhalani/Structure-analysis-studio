/**
 * UI / Dialogs.js
 * ------------------------------------------------------------------
 * A small, dependency-free modal system used for confirmations and
 * short data-entry forms (e.g. "what stiffness should this spring
 * have?"). The UI module owns this because it is pure presentation —
 * it never touches the Model directly; callers pass the collected
 * values back through a Promise.
 * ------------------------------------------------------------------
 */

export class Dialogs {
  constructor(rootEl) {
    this.rootEl = rootEl;
  }

  /**
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  confirm(title, message) {
    return new Promise((resolve) => {
      const { overlay, panel } = this._scaffold(title);
      const p = document.createElement("p");
      p.className = "dialog-message";
      p.textContent = message;
      panel.appendChild(p);

      const actions = this._actionsRow();
      const cancelBtn = this._button("Cancel", "ghost");
      const okBtn = this._button("Confirm", "primary");
      actions.append(cancelBtn, okBtn);
      panel.appendChild(actions);

      cancelBtn.onclick = () => this._close(overlay, () => resolve(false));
      okBtn.onclick = () => this._close(overlay, () => resolve(true));
      this.rootEl.appendChild(overlay);
      okBtn.focus();
    });
  }

  /**
   * @param {string} title
   * @param {Array<{name:string, label:string, type?:string, value?:any, options?:Array<{value:string,label:string}>, step?:string}>} fields
   * @returns {Promise<object|null>} field values keyed by name, or null if cancelled
   */
  form(title, fields, submitLabel = "Add") {
    return new Promise((resolve) => {
      const { overlay, panel } = this._scaffold(title);
      const formEl = document.createElement("form");
      formEl.className = "dialog-form";

      const inputs = {};
      fields.forEach((field) => {
        const row = document.createElement("label");
        row.className = "dialog-field";
        const span = document.createElement("span");
        span.textContent = field.label;
        row.appendChild(span);

        let input;
        if (field.type === "select") {
          input = document.createElement("select");
          (field.options || []).forEach((opt) => {
            const o = document.createElement("option");
            o.value = opt.value;
            o.textContent = opt.label;
            input.appendChild(o);
          });
          if (field.value !== undefined) input.value = field.value;
        } else {
          input = document.createElement("input");
          input.type = field.type || "number";
          if (field.step) input.step = field.step;
          input.value = field.value ?? "";
        }
        input.name = field.name;
        row.appendChild(input);
        formEl.appendChild(row);
        inputs[field.name] = input;
      });

      const actions = this._actionsRow();
      const cancelBtn = this._button("Cancel", "ghost");
      cancelBtn.type = "button";
      const okBtn = this._button(submitLabel, "primary");
      okBtn.type = "submit";
      actions.append(cancelBtn, okBtn);
      formEl.appendChild(actions);
      panel.appendChild(formEl);

      cancelBtn.onclick = () => this._close(overlay, () => resolve(null));
      formEl.onsubmit = (e) => {
        e.preventDefault();
        const values = {};
        Object.entries(inputs).forEach(([name, el]) => {
          values[name] = el.type === "number" ? parseFloat(el.value) : el.value;
        });
        this._close(overlay, () => resolve(values));
      };

      this.rootEl.appendChild(overlay);
      const firstInput = formEl.querySelector("input, select");
      firstInput?.focus();
      firstInput?.select?.();
    });
  }

  _scaffold(title) {
    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay";
    const panel = document.createElement("div");
    panel.className = "dialog-panel";
    const h = document.createElement("h3");
    h.textContent = title;
    panel.appendChild(h);
    overlay.appendChild(panel);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this._close(overlay, () => {});
    });
    return { overlay, panel };
  }

  _actionsRow() {
    const row = document.createElement("div");
    row.className = "dialog-actions";
    return row;
  }

  _button(label, kind) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = `btn btn-${kind}`;
    return btn;
  }

  _close(overlay, after) {
    overlay.classList.add("closing");
    setTimeout(() => {
      overlay.remove();
      after();
    }, 120);
  }
}
