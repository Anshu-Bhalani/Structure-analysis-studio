class ValidationResult {
    constructor() {
        this.valid = true;
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }
    addError(message) { this.errors.push(message); this.valid = false; }
    addWarning(message) { this.warnings.push(message); }
    addInfo(message) { this.info.push(message); }
    merge(otherResult) {
        if (!otherResult.valid) this.valid = false;
        this.errors.push(...otherResult.errors);
        this.warnings.push(...otherResult.warnings);
        this.info.push(...otherResult.info);
    }
}

export class Validator {
    
    // ==========================================
    // ENTRY POINT: MODEL-LEVEL CHECKS
    // ==========================================
    static validateModel(model) {
        const result = new ValidationResult();

        if (!model) {
            result.addError("Model object is null or undefined.");
            return result;
        }

        // 1. At least one node
        if (!model.nodes || model.nodes.size === 0) {
            result.addError("Invalid Model: No nodes found.");
        }
        
        // 2. At least one element
        if (!model.elements || model.elements.size === 0) {
            result.addError("Invalid Model: No elements found.");
        }
        
        // 3. At least one support
        if (!model.supports || model.supports.size === 0) {
            result.addError("Invalid Model: Structure is unstable because no supports exist.");
        }

        // Merge specific validations (only run if collections exist)
        if (model.nodes && model.nodes.size > 0) result.merge(this.validateNodes(model));
        if (model.elements && model.elements.size > 0) result.merge(this.validateElements(model));
        if (model.supports && model.supports.size > 0) result.merge(this.validateSupports(model));
        if (model.loads && model.loads.size > 0) result.merge(this.validateLoads(model));

        if (result.valid) {
            result.addInfo("Model validation passed successfully. Ready for Analysis.");
        }

        return result;
    }

    static validateNodes(model) {
        const result = new ValidationResult();
        const coordinatesSet = new Set();
        const idSet = new Set();

        for (const [mapKey, node] of model.nodes.entries()) {
            if (!node) continue; 
            const id = node.id || mapKey;

            // Note: Map inherently prevents duplicate keys, but this checks if IDs were manually duplicated
            if (idSet.has(id)) result.addError(`Duplicate ID: Node ID [${id}] is used more than once.`);
            idSet.add(id);

            if (Number.isFinite(node.x) && Number.isFinite(node.y)) {
                const coordString = `${node.x},${node.y}`;
                if (coordinatesSet.has(coordString)) {
                    result.addWarning(`Coincident Nodes: Node [${id}] shares exact coordinates (${node.x}, ${node.y}).`);
                }
                coordinatesSet.add(coordString);
            }
        }
        return result;
    }

    static validateElements(model) {
        const result = new ValidationResult();
        const validTypes = ['beam', 'frame', 'truss', 'spring'];

        for (const [id, element] of model.elements.entries()) {
            if (!element.type || !validTypes.includes(element.type.toLowerCase())) {
                result.addError(`Invalid Type: Element [${id}] has an unrecognized type '${element.type}'.`);
                continue;
            }

            const sNodeId = element.startNode?.id || element.startNode;
            const eNodeId = element.endNode?.id || element.endNode;

            if (!sNodeId || !eNodeId) {
                result.addError(`Missing Node: Element [${id}] is missing a start or end node.`);
                continue;
            }

            if (sNodeId === eNodeId) {
                result.addError(`Same Node: Element [${id}] connects Node [${sNodeId}] to itself.`);
            }

            const sNode = typeof model.findNodeById === 'function' ? model.findNodeById(sNodeId) : model.nodes.get(sNodeId);
            const eNode = typeof model.findNodeById === 'function' ? model.findNodeById(eNodeId) : model.nodes.get(eNodeId);

            // 4. Every element references valid nodes
            if (!sNode) result.addError(`Dangling Reference: Element [${id}] points to missing Start Node [${sNodeId}].`);
            if (!eNode) result.addError(`Dangling Reference: Element [${id}] points to missing End Node [${eNodeId}].`);

            if (sNode && eNode && sNodeId !== eNodeId && sNode.distanceTo) {
                if (sNode.distanceTo(eNode) === 0) {
                    result.addError(`Zero Length: Element [${id}] connects distinct nodes that occupy the exact same physical coordinates.`);
                }
            }

            if (element.type === 'beam' || element.type === 'frame' || element.type === 'truss') {
                // 5. Every material reference exists
                if (!element.material) {
                    result.addError(`Missing Material: Element [${id}] requires a Material assignment.`);
                } else if (!model.materials.has(element.material)) {
                    result.addError(`Missing Material Reference: Element [${id}] references Material '${element.material}' which does not exist in the model.`);
                }

                // 6. Every section reference exists
                if (!element.section) {
                    result.addError(`Missing Section: Element [${id}] requires a Section assignment.`);
                } else if (!model.sections.has(element.section)) {
                    result.addError(`Missing Section Reference: Element [${id}] references Section '${element.section}' which does not exist in the model.`);
                }
            }
        }
        return result;
    }

    static validateSupports(model) {
        const result = new ValidationResult();
        const supportedNodes = new Set();

        for (const [id, support] of model.supports.entries()) {
            const nodeId = support.node?.id || support.node;
            
            if (!nodeId) {
                result.addError(`Missing Node: Support [${id}] is not attached to any node.`);
                continue;
            }

            const nodeExists = typeof model.findNodeById === 'function' ? model.findNodeById(nodeId) : model.nodes.has(nodeId);
            if (!nodeExists) {
                result.addError(`Dangling Reference: Support [${id}] points to missing Node [${nodeId}].`);
                continue;
            }

            if (supportedNodes.has(nodeId)) {
                result.addError(`Duplicate Support: Node [${nodeId}] has multiple supports assigned.`);
            }
            supportedNodes.add(nodeId);

            if (!support.restrainedDOFs || typeof support.restrainedDOFs !== 'object') {
                result.addError(`Invalid Restraints: Support [${id}] is missing the 'restrainedDOFs' definition object.`);
            } else {
                const { dx, dy, mz } = support.restrainedDOFs;
                if (typeof dx !== 'boolean' || typeof dy !== 'boolean' || typeof mz !== 'boolean') {
                    result.addError(`Malformed Restraints: Support [${id}] restrainedDOFs values must be strictly booleans.`);
                }
            }
        }
        return result;
    }

    static validateLoads(model) {
        const result = new ValidationResult();
        const validDirections = ['FX', 'FY', 'FZ', 'MX', 'MY', 'MZ', 'Local-X', 'Local-Y', 'Global-X', 'Global-Y'];
        const validTypes = ['Point Load', 'Moment', 'Uniform Load', 'Triangular Load', 'Trapezoidal Load', 'Temperature Load'];

        for (const [id, load] of model.loads.entries()) {
            if (!load.targetType) { result.addError(`Missing Target Type: Load [${id}] must specify 'node' or 'element'.`); continue; }
            if (!load.target) { result.addError(`Missing Target: Load [${id}] has no target assigned.`); continue; }
            if (!load.loadType) { result.addError(`Missing Type: Load [${id}] has no loadType assigned.`); continue; }
            if (!load.direction) { result.addError(`Missing Direction: Load [${id}] has no direction assigned.`); continue; }

            if (!validTypes.includes(load.loadType)) result.addError(`Invalid Load Type: Load [${id}] type '${load.loadType}' is unsupported.`);
            if (!validDirections.includes(load.direction)) result.addError(`Invalid Direction: Load [${id}] direction '${load.direction}' is unsupported.`);

            const validateMagnitude = (mag, name) => {
                if (mag === undefined || mag === null) return result.addError(`Missing Magnitude: Load [${id}] is missing ${name}.`);
                if (typeof mag !== 'number' || Number.isNaN(mag)) return result.addError(`Invalid Magnitude (NaN): Load [${id}] ${name} must be a number.`);
                if (!Number.isFinite(mag)) return result.addError(`Infinity Error: Load [${id}] ${name} is infinite.`);
                return true;
            };

            if (['Point Load', 'Moment', 'Temperature Load', 'Uniform Load'].includes(load.loadType)) {
                validateMagnitude(load.magnitude, 'magnitude');
            }

            const targetId = load.target?.id || load.target;
            
            if (load.targetType === 'node') {
                const nodeExists = typeof model.findNodeById === 'function' ? model.findNodeById(targetId) : model.nodes.has(targetId);
                if (!nodeExists) result.addError(`Dangling Reference: Load [${id}] targets missing Node [${targetId}].`);
            
            } else if (load.targetType === 'element') {
                const element = typeof model.findElementById === 'function' ? model.findElementById(targetId) : model.elements.get(targetId);
                if (!element) result.addError(`Dangling Reference: Load [${id}] targets missing Element [${targetId}].`);
            }
        }
        return result;
    }
}
