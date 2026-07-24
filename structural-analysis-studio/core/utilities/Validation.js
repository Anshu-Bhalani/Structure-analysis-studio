/**
 * Helper class to standardize validation outputs.
 */
class ValidationResult {
    constructor() {
        this.valid = true;
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    addError(message) {
        this.errors.push(message);
        this.valid = false;
    }

    addWarning(message) {
        this.warnings.push(message);
    }

    addInfo(message) {
        this.info.push(message);
    }

    merge(otherResult) {
        if (!otherResult.valid) this.valid = false;
        this.errors.push(...otherResult.errors);
        this.warnings.push(...otherResult.warnings);
        this.info.push(...otherResult.info);
    }
}

/**
 * LEVEL 4: Validation Engine
 * Prevents an invalid model from ever reaching Level 5 (Formulations) or Level 6 (Solver).
 */
export class Validator {
    
    static validateModel(model) {
        const result = new ValidationResult();

        if (!model) {
            result.addError("Model object is null or undefined.");
            return result;
        }

        result.merge(this.validateNodes(model));
        result.merge(this.validateElements(model));
        result.merge(this.validateSupports(model));
        result.merge(this.validateLoads(model));

        if (result.valid) {
            result.addInfo("Model validation passed successfully. Geometry and properties are mathematically sound.");
        }

        return result;
    }

    static validateNodes(model) {
        const result = new ValidationResult();
        if (!model.nodes || model.nodes.size === 0) {
            result.addError("Fatal: Model contains no nodes.");
            return result;
        }
        
        const coordinatesSet = new Set();
        const idSet = new Set();

        for (const [mapKey, node] of model.nodes.entries()) {
            if (!node) continue; 
            const id = node.id || mapKey;

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
        if (!model.elements || model.elements.size === 0) {
            result.addError("Fatal: Model contains no elements.");
            return result;
        }

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

            if (!sNode) result.addError(`Dangling Reference: Element [${id}] points to missing Start Node [${sNodeId}].`);
            if (!eNode) result.addError(`Dangling Reference: Element [${id}] points to missing End Node [${eNodeId}].`);

            if (sNode && eNode && sNodeId !== eNodeId) {
                if (sNode.distanceTo && sNode.distanceTo(eNode) === 0) {
                    result.addError(`Zero Length: Element [${id}] connects distinct nodes that occupy the exact same physical coordinates.`);
                }
            }

            if (element.type === 'beam' || element.type === 'frame' || element.type === 'truss') {
                if (!element.material) result.addError(`Missing Material: ${element.type.toUpperCase()} [${id}] requires a Material assignment.`);
                if (!element.section) result.addError(`Missing Section: ${element.type.toUpperCase()} [${id}] requires a Section assignment.`);
            }

            if (element.type === 'spring') {
                if (element.springStiffness === undefined || element.springStiffness <= 0) {
                    result.addError(`Invalid Spring: SPRING [${id}] requires a stiffness value greater than 0.`);
                }
            }
        }
        return result;
    }

    static validateSupports(model) {
        const result = new ValidationResult();
        
        if (!model.supports || model.supports.size === 0) {
            result.addWarning("No supports defined. The structure is currently unstable (Rigid Body Motion).");
            return result;
        }

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
                result.addError(`Duplicate Support: Node [${nodeId}] has multiple supports assigned. A node can only have one support.`);
            }
            supportedNodes.add(nodeId);

            if (!support.restrainedDOFs || typeof support.restrainedDOFs !== 'object') {
                result.addError(`Invalid Restraints: Support [${id}] is missing the 'restrainedDOFs' definition object.`);
            } else {
                const { dx, dy, mz } = support.restrainedDOFs;
                if (typeof dx !== 'boolean' || typeof dy !== 'boolean' || typeof mz !== 'boolean') {
                    result.addError(`Malformed Restraints: Support [${id}] restrainedDOFs values (dx, dy, mz) must be strictly true/false booleans.`);
                }
                if (dx === false && dy === false && mz === false && support.type !== 'Spring') {
                    result.addWarning(`Useless Support: Support [${id}] on Node [${nodeId}] has all restraints set to false (Free).`);
                }
            }

            if (support.type === 'Spring') {
                const k = support.springStiffness;
                if (!k || (k.kx === 0 && k.ky === 0 && k.kmz === 0)) {
                    result.addError(`Invalid Spring Support: Support [${id}] is set to 'Spring' but has zero stiffness in all directions.`);
                }
            }
        }

        return result;
    }

    static validateLoads(model) {
        const result = new ValidationResult();
        
        if (!model.loads || model.loads.size === 0) {
            result.addInfo("No external loads applied to the model.");
            return result;
        }

        const validDirections = ['FX', 'FY', 'FZ', 'MX', 'MY', 'MZ', 'Local-X', 'Local-Y', 'Global-X', 'Global-Y'];
        const validTypes = ['Point Load', 'Moment', 'Uniform Load', 'Triangular Load', 'Trapezoidal Load', 'Temperature Load'];

        for (const [id, load] of model.loads.entries()) {
            if (!load.targetType) { result.addError(`Missing Target Type: Load [${id}] must specify 'node' or 'element'.`); continue; }
            if (!load.target) { result.addError(`Missing Target: Load [${id}] has no target assigned.`); continue; }
            if (!load.loadType) { result.addError(`Missing Type: Load [${id}] has no loadType assigned.`); continue; }
            if (!load.direction) { result.addError(`Missing Direction: Load [${id}] has no direction assigned.`); continue; }

            if (!validTypes.includes(load.loadType)) {
                result.addError(`Invalid Load Type: Load [${id}] type '${load.loadType}' is unsupported.`);
            }

            if (!validDirections.includes(load.direction)) {
                result.addError(`Invalid Direction: Load [${id}] direction '${load.direction}' is unsupported.`);
            }

            const validateMagnitude = (mag, name) => {
                if (mag === undefined || mag === null) {
                    result.addError(`Missing Magnitude: Load [${id}] is missing ${name}.`);
                    return false;
                }
                if (typeof mag !== 'number' || Number.isNaN(mag)) {
                    result.addError(`Invalid Magnitude (NaN): Load [${id}] ${name} must be a valid number.`);
                    return false;
                }
                if (!Number.isFinite(mag)) {
                    result.addError(`Infinity Error: Load [${id}] ${name} is infinite.`);
                    return false;
                }
                return true;
            };

            if (['Point Load', 'Moment', 'Temperature Load', 'Uniform Load'].includes(load.loadType)) {
                validateMagnitude(load.magnitude, 'magnitude');
            } else if (['Triangular Load', 'Trapezoidal Load'].includes(load.loadType)) {
                validateMagnitude(load.startMagnitude, 'startMagnitude');
                validateMagnitude(load.endMagnitude, 'endMagnitude');
            }

            const targetId = load.target?.id || load.target;
            
            if (load.targetType === 'node') {
                const nodeExists = typeof model.findNodeById === 'function' ? model.findNodeById(targetId) : model.nodes.has(targetId);
                if (!nodeExists) result.addError(`Dangling Reference: Load [${id}] targets missing Node [${targetId}].`);
            
            } else if (load.targetType === 'element') {
                const element = typeof model.findElementById === 'function' ? model.findElementById(targetId) : model.elements.get(targetId);
                if (!element) {
                    result.addError(`Dangling Reference: Load [${id}] targets missing Element [${targetId}].`);
                } else {
                    const sNode = typeof model.findNodeById === 'function' ? model.findNodeById(element.startNode?.id || element.startNode) : model.nodes.get(element.startNode);
                    const eNode = typeof model.findNodeById === 'function' ? model.findNodeById(element.endNode?.id || element.endNode) : model.nodes.get(element.endNode);
                    
                    if (sNode && eNode && sNode.distanceTo) {
                        const length = sNode.distanceTo(eNode);

                        if (['Point Load', 'Moment'].includes(load.loadType) && load.position !== undefined) {
                            if (load.position < 0 || load.position > length) {
                                result.addError(`Position Error: Load [${id}] position (${load.position}) is outside element length (${length}).`);
                            }
                        }

                        if (['Uniform Load', 'Triangular Load', 'Trapezoidal Load'].includes(load.loadType)) {
                            const p1 = load.startPosition !== undefined ? load.startPosition : 0;
                            const p2 = load.endPosition !== undefined ? load.endPosition : length;

                            if (p1 < 0 || p1 > length || p2 < 0 || p2 > length) {
                                result.addError(`Distributed Limit Error: Load [${id}] start/end positions must lie inside element length (0 to ${length}).`);
                            }
                            if (p1 > p2) {
                                result.addError(`Distributed Limit Error: Load [${id}] startPosition (${p1}) cannot be greater than endPosition (${p2}).`);
                            }
                            if (p1 === p2) {
                                result.addError(`Distributed Limit Error: Load [${id}] length must be > 0 (startPosition == endPosition).`);
                            }
                        }
                    }
                }
            }
        }

        return result;
    }
} // <--- This final bracket properly closes the Validator class.
