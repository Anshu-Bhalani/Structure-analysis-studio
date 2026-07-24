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
 * Knows about: Utilities (L1), Math (L2), and Core Data Models (L3).
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

            // Duplicate IDs
            if (idSet.has(id)) result.addError(`Duplicate ID: Node ID [${id}] is used more than once.`);
            idSet.add(id);

            // Duplicate coordinates (Coincident nodes)
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

    static validateElements(model) {
        const result = new ValidationResult();

        if (!model.elements || model.elements.size === 0) {
            result.addError("Fatal: Model contains no elements.");
            return result;
        }

        for (const [id, element] of model.elements.entries()) {
            const sNodeId = element.startNode?.id || element.startNode;
            const eNodeId = element.endNode?.id || element.endNode;

            if (!sNodeId || !eNodeId) {
                result.addError(`Element [${id}] is missing a start or end node.`);
                continue;
            }

            // Zero-Length Members
            if (sNodeId === eNodeId) {
                result.addError(`Zero-Length Element: Element [${id}] has the same start and end node (${sNodeId}).`);
            }

            // Dangling References
            const sNodeExists = typeof model.findNodeById === 'function' ? model.findNodeById(sNodeId) : model.nodes.has(sNodeId);
            const eNodeExists = typeof model.findNodeById === 'function' ? model.findNodeById(eNodeId) : model.nodes.has(eNodeId);

            if (!sNodeExists) result.addError(`Dangling Reference: Element [${id}] points to missing Start Node [${sNodeId}].`);
            if (!eNodeExists) result.addError(`Dangling Reference: Element [${id}] points to missing End Node [${eNodeId}].`);

            // Check Missing Materials & Sections (Level 4 Specific Checks)
            if (element.type === 'beam' || element.type === 'frame' || element.type === 'truss') {
                if (!element.material) {
                    result.addError(`Missing Material: ${element.type.toUpperCase()} [${id}] requires a Material assignment.`);
                }
                if (!element.section) {
                    result.addError(`Missing Section: ${element.type.toUpperCase()} [${id}] requires a Section assignment.`);
                }
            }

            // Check Invalid Spring properties
            if (element.type === 'spring') {
                // Assuming springStiffness is initialized to 0 in Element.js
                if (element.springStiffness === undefined || element.springStiffness <= 0) {
                    result.addError(`Invalid Spring: SPRING [${id}] requires a stiffness value greater than 0.`);
                }
            }
        }

        return result;
    }

    static validateSupports(model) {
        const result = new ValidationResult();
        // Will be fully fleshed out when Support.js (Level 3) is created
        if (!model.supports || model.supports.size === 0) {
            result.addWarning("No supports defined. Structure is unstable (Rigid Body Motion).");
        }
        return result;
    }

    static validateLoads(model) {
        const result = new ValidationResult();
        // Will be fully fleshed out when Load.js (Level 3) is created
        if (!model.loads || model.loads.size === 0) {
            result.addInfo("No external loads applied to the model.");
        }
        return result;
    }
}
