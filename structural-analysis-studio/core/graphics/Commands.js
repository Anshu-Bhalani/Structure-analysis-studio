export class Command {
    execute() { throw new Error('execute() must be implemented by subclass'); }
    undo() { throw new Error('undo() must be implemented by subclass'); }
}

export class CreateNodeCommand extends Command {
    constructor(model, node) {
        super();
        this.model = model;
        this.node = node;
    }
    execute() { this.model.addNode(this.node); }
    undo() { this.model.deleteNode(this.node.id, true); }
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

        this._elements = this.model.getAllElements().filter((el) => {
            const a = el.startNode?.id || el.startNode;
            const b = el.endNode?.id || el.endNode;
            return a === this.nodeId || b === this.nodeId;
        });
        this._supports = this.model.getAllSupports().filter((s) => (s.node?.id || s.node) === this.nodeId);
        this._loads = this.model.getAllLoads().filter((l) => l.targetType === 'node' && (l.target?.id || l.target) === this.nodeId);

        this.model.deleteNode(this.nodeId, true);
        this._loads.forEach((l) => this.model.removeLoad(l.id));
    }
    undo() {
        if (!this._node) return;
        this.model.addNode(this._node);
        this._elements.forEach((el) => this.model.addElement(el));
        this._supports.forEach((s) => this.model.addSupport(s));
        this._loads.forEach((l) => this.model.addLoad(l));
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

export class CreateBeamCommand extends Command {
    constructor(model, element) {
        super();
        this.model = model;
        this.element = element;
    }
    execute() { this.model.addElement(this.element); }
    undo() { this.model.deleteElement(this.element.id); }
}

export class DeleteBeamCommand extends Command {
    constructor(model, elementId) {
        super();
        this.model = model;
        this.elementId = elementId;
        this._element = null;
    }
    execute() {
        this._element = this.model.findElementById(this.elementId) || null;
        this.model.deleteElement(this.elementId);
    }
    undo() {
        if (this._element) this.model.addElement(this._element);
    }
}

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
        for (const elementId of elementIdsToRemove) {
            const el = this.model.findElementById(elementId);
            if (el) {
                this._removedElements.push(el);
                this.model.deleteElement(elementId);
            }
        }
        for (const nodeId of this.nodeIds) {
            const node = this.model.getNode(nodeId);
            if (!node) continue;

            this.model.getAllSupports()
                .filter((s) => (s.node?.id || s.node) === nodeId)
                .forEach((s) => this._removedSupports.push(s));

            const loadsOnNode = this.model.getAllLoads()
                .filter((l) => l.targetType === 'node' && (l.target?.id || l.target) === nodeId);
            loadsOnNode.forEach((l) => this._removedLoads.push(l));

            this._removedNodes.push(node);
            this.model.deleteNode(nodeId, true); 
            loadsOnNode.forEach((l) => this.model.removeLoad(l.id)); 
        }
    }
    undo() {
        this._removedNodes.forEach((n) => this.model.addNode(n));
        this._removedElements.forEach((e) => this.model.addElement(e));
        this._removedSupports.forEach((s) => this.model.addSupport(s));
        this._removedLoads.forEach((l) => this.model.addLoad(l));
    }
}

export class CommandHistory {
    constructor(maxHistory = 100) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = maxHistory;
    }

    execute(command) {
        command.execute();
        this.push(command);
        return command;
    }

    push(command) {
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
        this.redoStack = []; // Empties redo stack automatically on new command creation
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
    clear() { this.undoStack = []; this.redoStack = []; }
}
