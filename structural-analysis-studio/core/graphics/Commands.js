/**
 * Commands.js
 * ------------------------------------------------------------------
 * Command-pattern undo/redo for the Geometry Editor.
 *
 * Each user-facing edit is represented as a Command with symmetrical
 * execute()/undo() methods. CommandHistory keeps the undo/redo stacks
 * and is the only thing App/ToolManager needs to talk to.
 * ------------------------------------------------------------------
 */

export class Command {
    execute() { throw new Error('execute() must be implemented by subclass'); }
    undo() { throw new Error('undo() must be implemented by subclass'); }
}

export class CommandHistory {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
    }

    execute(command) {
        if (!command) return false;
        command.execute();
        this.undoStack.push(command);
        this.redoStack.length = 0;
        return true;
    }

    /**
     * Use for commands that were already applied live (e.g. drag move).
     */
    push(command) {
        if (!command) return false;
        this.undoStack.push(command);
        this.redoStack.length = 0;
        return true;
    }

    undo() {
        const command = this.undoStack.pop();
        if (!command) return false;
        command.undo();
        this.redoStack.push(command);
        return true;
    }

    redo() {
        const command = this.redoStack.pop();
        if (!command) return false;
        command.execute();
        this.undoStack.push(command);
        return true;
    }

    canUndo() { return this.undoStack.length > 0; }
    canRedo() { return this.redoStack.length > 0; }

    clear() {
        this.undoStack.length = 0;
        this.redoStack.length = 0;
    }
}

function _idOf(value) {
    return value?.id || value;
}

function _collectLoadsOnNodes(model, nodeIds) {
    const ids = new Set(nodeIds);
    return model.getAllLoads().filter((load) => {
        if (load.targetType !== 'node') return false;
        return ids.has(_idOf(load.target));
    });
}

function _collectLoadsOnElements(model, elementIds) {
    const ids = new Set(elementIds);
    return model.getAllLoads().filter((load) => {
        if (load.targetType !== 'element') return false;
        return ids.has(_idOf(load.target));
    });
}

function _collectSupportsOnNodes(model, nodeIds) {
    const ids = new Set(nodeIds);
    return model.getAllSupports().filter((support) => ids.has(_idOf(support.node)));
}

// ==========================================
// Node Commands
// ==========================================

export class CreateNodeCommand extends Command {
    constructor(model, node) {
        super();
        this.model = model;
        this.node = node;
    }

    execute() {
        this.model.addNode(this.node);
    }

    undo() {
        this.model.deleteNode(this.node.id, true);
    }
}

export class DeleteNodeCommand extends Command {
    constructor(model, nodeId) {
        super();
        this.model = model;
        this.nodeId = nodeId;

        this._node = null;
        this._elements = [];
        this._supports = [];
        this._loads = [];
    }

    execute() {
        const node = this.model.getNode(this.nodeId);
        if (!node) return;

        this._node = node;

        const connectedElements = this.model.getAllElements().filter((el) => {
            const a = el.startNode?.id || el.startNode;
            const b = el.endNode?.id || el.endNode;
            return a === this.nodeId || b === this.nodeId;
        });

        this._elements = connectedElements;
        this._supports = _collectSupportsOnNodes(this.model, [this.nodeId]);

        const connectedElementIds = connectedElements.map((el) => el.id);
        this._loads = [
            ..._collectLoadsOnNodes(this.model, [this.nodeId]),
            ..._collectLoadsOnElements(this.model, connectedElementIds),
        ];

        this.model.deleteNode(this.nodeId, true);
        for (const load of this._loads) this.model.removeLoad(load.id);
    }

    undo() {
        if (!this._node) return;

        this.model.addNode(this._node);
        for (const el of this._elements) this.model.addElement(el);
        for (const support of this._supports) this.model.addSupport(support);
        for (const load of this._loads) this.model.addLoad(load);
    }
}

export class MoveNodeCommand extends Command {
    constructor(model, nodeId, fromX, fromY, toX, toY) {
        super();
        this.model = model;
        this.nodeId = nodeId;
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
    }

    execute() {
        const node = this.model.getNode(this.nodeId);
        if (node) node.setPosition(this.toX, this.toY, node.z);
    }

    undo() {
        const node = this.model.getNode(this.nodeId);
        if (node) node.setPosition(this.fromX, this.fromY, node.z);
    }
}

export class MoveNodesCommand extends Command {
    constructor(model, moves) {
        super();
        this.model = model;
        this.moves = moves;
    }

    execute() {
        for (const m of this.moves) {
            const node = this.model.getNode(m.nodeId);
            if (node) node.setPosition(m.toX, m.toY, node.z);
        }
    }

    undo() {
        for (const m of this.moves) {
            const node = this.model.getNode(m.nodeId);
            if (node) node.setPosition(m.fromX, m.fromY, node.z);
        }
    }
}

// ==========================================
// Element Commands
// ==========================================

export class CreateBeamCommand extends Command {
    constructor(model, element) {
        super();
        this.model = model;
        this.element = element;
    }

    execute() {
        this.model.addElement(this.element);
    }

    undo() {
        this.model.deleteElement(this.element.id);
    }
}

export class DeleteBeamCommand extends Command {
    constructor(model, elementId) {
        super();
        this.model = model;
        this.elementId = elementId;

        this._element = null;
        this._loads = [];
    }

    execute() {
        this._element = this.model.findElementById(this.elementId) || null;
        if (!this._element) return;

        this._loads = _collectLoadsOnElements(this.model, [this.elementId]);
        this.model.deleteElement(this.elementId);
        for (const load of this._loads) this.model.removeLoad(load.id);
    }

    undo() {
        if (this._element) this.model.addElement(this._element);
        for (const load of this._loads) this.model.addLoad(load);
    }
}

// ==========================================
// Compound Delete Selection
// ==========================================

export class DeleteSelectionCommand extends Command {
    constructor(model, nodeIds = [], elementIds = []) {
        super();
        this.model = model;
        this.nodeIds = [...nodeIds];
        this.elementIds = [...elementIds];

        this._removedNodes = [];
        this._removedElements = [];
        this._removedSupports = [];
        this._removedLoads = [];
    }

    execute() {
        const elementIdsToRemove = new Set(this.elementIds);

        for (const el of this.model.getAllElements()) {
            const a = el.startNode?.id || el.startNode;
            const b = el.endNode?.id || el.endNode;
            if (this.nodeIds.includes(a) || this.nodeIds.includes(b)) {
                elementIdsToRemove.add(el.id);
            }
        }

        const loadsOnSelectedNodes = _collectLoadsOnNodes(this.model, this.nodeIds);
        const loadsOnSelectedElements = _collectLoadsOnElements(this.model, [...elementIdsToRemove]);

        this._removedElements = [];
        for (const elementId of elementIdsToRemove) {
            const el = this.model.findElementById(elementId);
            if (el) this._removedElements.push(el);
            this.model.deleteElement(elementId);
        }

        this._removedNodes = [];
        this._removedSupports = [];
        for (const nodeId of this.nodeIds) {
            const node = this.model.getNode(nodeId);
            if (!node) continue;

            const supports = _collectSupportsOnNodes(this.model, [nodeId]);
            const loads = _collectLoadsOnNodes(this.model, [nodeId]);

            this._removedNodes.push(node);
            this._removedSupports.push(...supports);

            this.model.deleteNode(nodeId, true);
            for (const load of loads) this.model.removeLoad(load.id);
        }

        this._removedLoads = [...loadsOnSelectedNodes, ...loadsOnSelectedElements];
        for (const load of this._removedLoads) this.model.removeLoad(load.id);
    }

    undo() {
        for (const node of this._removedNodes) this.model.addNode(node);
        for (const element of this._removedElements) this.model.addElement(element);
        for (const support of this._removedSupports) this.model.addSupport(support);
        for (const load of this._removedLoads) this.model.addLoad(load);
    }
}