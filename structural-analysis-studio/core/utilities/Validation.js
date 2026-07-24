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
                    result.addWarning(`Coincident Nodes: Node [${id}] shares exact coordinates (${node.x}, ${node.y}) with another node.`);
                }
                coordinatesSet.add(coordString);
            }
        }

        return result;
    }

    // ==========================================
    // ELEMENT VALIDATION (Updated for Phase 3.2)
    // ==========================================
    static validateElements(model) {
        const result = new ValidationResult();

        if (!model.elements || model.elements.size === 0) {
            result.addError("Fatal: Model contains no elements.");
            return result;
        }

        const validTypes = ['beam', 'frame', 'truss', 'spring'];

        for (const [id, element] of model.elements.entries()) {
            
            // 1. Invalid Type Check
            if (!element.type || !validTypes.includes(element.type.toLowerCase())) {
                result.addError(`Invalid Type: Element [${id}] has an unrecognized type '${element.type}'. Allowed types are: ${validTypes.join(', ')}.`);
                continue; // Skip further checks on this broken element to prevent crashes
            }

            // Extract IDs safely whether they are objects or strings
            const sNodeId = element.startNode?.id || element.startNode;
            const eNodeId = element.endNode?.id || element.endNode;

            // 2 & 3. Missing Start Node / Missing End Node
            if (!sNodeId || !eNodeId) {
                result.addError(`Missing Node: Element [${id}] is missing a start or end node.`);
                continue;
            }

            // 4. Same Node (Topological Error)
            if (sNodeId === eNodeId) {
                result.addError(`Same Node: Element [${id}] connects Node [${sNodeId}] to itself.`);
            }

            // Fetch the actual node objects (Level 3 integration)
            const sNode = typeof model.findNodeById === 'function' ? model.findNodeById(sNodeId) : model.nodes.get(sNodeId);
            const eNode = typeof model.findNodeById === 'function' ? model.findNodeById(eNodeId) : model.nodes.get(eNodeId);

            if (!sNode) result.addError(`Dangling Reference: Element [${id}] points to missing Start Node [${sNodeId}].`);
            if (!eNode) result.addError(`Dangling Reference: Element [${id}] points to missing End Node [${eNodeId}].`);

            // 5. Zero Length Check (Geometric Error)
            if (sNode && eNode && sNodeId !== eNodeId) {
                // Uses distanceTo() from Node.js (Level 3) -> MathUtils (Level 2)
                if (sNode.distanceTo(eNode) === 0) {
                    result.addError(`Zero Length: Element [${id}] connects distinct nodes (${sNodeId}, ${eNodeId}) that occupy the exact same physical coordinates.`);
                }
            }

            // 6 & 7. Missing Material / Missing Section
            if (element.type === 'beam' || element.type === 'frame' || element.type === 'truss') {
                if (!element.material) {
                    result.addError(`Missing Material: ${element.type.toUpperCase()} [${id}] requires a Material assignment to be solved.`);
                }
                if (!element.section) {
                    result.addError(`Missing Section: ${element.type.toUpperCase()} [${id}] requires a Section (cross-section) assignment to be solved.`);
                }
            }

            // Spring validation (Bonus)
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
            result.addWarning("No supports defined. Structure is unstable (Rigid Body Motion).");
        }
        return result;
    }

    static validateLoads(model) {
        const result = new ValidationResult();
        if (!model.loads || model.loads.size === 0) {
            result.addInfo("No external loads applied to the model.");
        }
        return result;
    }
}
