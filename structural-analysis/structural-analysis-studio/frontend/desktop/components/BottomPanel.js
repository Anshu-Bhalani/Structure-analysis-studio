/**
 * UI / BottomPanel.js
 * ------------------------------------------------------------------
 * Tabbed bottom panel: Results table, Learning Mode walkthrough,
 * and a Console showing the application Logger's entries.
 * ------------------------------------------------------------------
 */

export class BottomPanel {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.activeTab = "results";
    this.lastResult = null;
    this.lastSteps = null;
    this._renderShell();
  }

  _renderShell() {
    this.containerEl.innerHTML = "";
    const tabs = document.createElement("div");
    tabs.className = "bottom-tabs";
    ["results", "learning", "console"].forEach((tab) => {
      const btn = document.createElement("button");
      btn.textContent = tab === "results" ? "Results" : tab === "learning" ? "Learning" : "Console";
      btn.className = "bottom-tab" + (tab === this.activeTab ? " active" : "");
      btn.dataset.tab = tab;
      btn.onclick = () => this._switchTab(tab);
      tabs.appendChild(btn);
    });
    this.containerEl.appendChild(tabs);

    this.body = document.createElement("div");
    this.body.className = "bottom-body";
    this.containerEl.appendChild(this.body);
    this._renderActiveTab();
  }

  _switchTab(tab) {
    this.activeTab = tab;
    [...this.containerEl.querySelectorAll(".bottom-tab")].forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.tab === tab)
    );
    this._renderActiveTab();
  }

  _renderActiveTab() {
    if (this.activeTab === "results") this._renderResults();
    else if (this.activeTab === "learning") this._renderLearning();
    else this._renderConsole();
  }

  showResults(result) {
    this.lastResult = result;
    if (this.activeTab === "results") this._renderResults();
  }

  showLearningSteps(steps) {
    this.lastSteps = steps;
    if (this.activeTab === "learning") this._renderLearning();
  }

  showConsole(entries) {
    this.lastEntries = entries;
    if (this.activeTab === "console") this._renderConsole();
  }

  _renderResults() {
    this.body.innerHTML = "";
    if (!this.lastResult) {
      this.body.innerHTML = `<div class="bottom-empty">Run analysis to see reactions, displacements, and member forces here.</div>`;
      return;
    }
    const { dofManager, restrained, reactions, elementResults } = this.lastResult;

    const reactionTable = this._table(
      "Reactions",
      ["DOF", "Value"],
      restrained.map((i) => [dofManager.describeDOF(i), reactions[i].toFixed(3)])
    );

    const memberTable = this._table(
      "Member Forces",
      ["Element", "Type", "Key Results"],
      elementResults.map((r) => [r.elementId.slice(0, 10), r.type, this._summarize(r)])
    );

    this.body.appendChild(reactionTable);
    this.body.appendChild(memberTable);
  }

  _summarize(r) {
    if (r.type === "Spring" || r.type === "Bar") {
      return `Axial force = ${r.axialForce.toFixed(2)} N (${r.axialForce >= 0 ? "tension" : "compression"})`;
    }
    if (r.type === "Beam") {
      return `V_i=${r.shearI.toFixed(2)} N, M_i=${r.momentI.toFixed(2)} N·m, V_j=${r.shearJ.toFixed(2)} N, M_j=${r.momentJ.toFixed(2)} N·m`;
    }
    return "—";
  }

  _renderLearning() {
    this.body.innerHTML = "";
    if (!this.lastSteps) {
      this.body.innerHTML = `<div class="bottom-empty">Enable Learning Mode and run analysis to see the full step-by-step solution.</div>`;
      return;
    }
    this.lastSteps.forEach((step, i) => {
      const card = document.createElement("div");
      card.className = "learning-step";
      const title = document.createElement("h5");
      title.textContent = `${i + 1}. ${step.title}`;
      const p = document.createElement("p");
      p.textContent = step.explanation;
      card.append(title, p);

      const pre = document.createElement("pre");
      pre.className = "learning-data";
      pre.textContent = JSON.stringify(step.data, null, 2);
      card.appendChild(pre);
      this.body.appendChild(card);
    });
  }

  _renderConsole() {
    this.body.innerHTML = "";
    const list = document.createElement("div");
    list.className = "console-list";
    (this.lastEntries || []).slice().reverse().forEach((entry) => {
      const row = document.createElement("div");
      row.className = `console-row level-${entry.level}`;
      row.textContent = `[${entry.time.split("T")[1].replace("Z", "")}] ${entry.level.toUpperCase()}  ${entry.message}`;
      list.appendChild(row);
    });
    this.body.appendChild(list);
  }

  _table(title, headers, rows) {
    const wrap = document.createElement("div");
    wrap.className = "results-table-wrap";
    const h = document.createElement("h5");
    h.textContent = title;
    wrap.appendChild(h);

    const table = document.createElement("table");
    table.className = "results-table";
    const thead = document.createElement("thead");
    thead.innerHTML = `<tr>${headers.map((h2) => `<th>${h2}</th>`).join("")}</tr>`;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${headers.length}" class="muted">—</td></tr>`;
    } else {
      rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = row.map((cell) => `<td>${cell}</td>`).join("");
        tbody.appendChild(tr);
      });
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }
}
