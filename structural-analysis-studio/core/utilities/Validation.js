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

    // Merges the results of sub-validations (e.g., merging nodes into model)
    merge(otherResult) {
        if (!otherResult.valid) this.valid = false;
        this.errors.push(...otherResult.errors);
        this.warnings.push(...otherResult.warnings);
        this.info.push(...otherResult.info);
    }
}

/**
 * Validation Engine Engine: Prevents invalid structural models from reaching the Solver.
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
            result.addInfo("Model validation passed successfully. Ready for analysis.");
        }

        return result;
    }

    static validateNodes(model) {
        const result = new ValidationResult();
        
        if (!model.nodes || model.nodes.size === 0) {
            result.addError("Fatal: Model contains no nodes.");
            return result;
        }

        // Check for duplicate coordinates (Coincident nodes)
        const coordinatesSet = new Set();
        for (const [id, node] of model.nodes.entries()) {
            const coordString = `${node.x},${node.y}`;
            if (coordinatesSet.has(coordString)) {
                result.addWarning(`Node [${id}] shares exact coordinates (${node.x}, ${node.y}) with another node.`);
            }
            coordinatesSet.add(coordString);
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
            // Extract IDs safely whether they are objects or strings
            const sNodeId = element.startNode?.id || element.startNode;
            const eNodeId = element.endNode?.id || element.endNode;

            if (!sNodeId || !eNodeId) {
                result.addError(`Element [${id}] is missing a start or end node.`);
                continue;
            }

            // 1. Check for Zero-Length Elements
            if (sNodeId === eNodeId) {
                result.addError(`Element [${id}] has the same start and end node (${sNodeId}). Zero-length elements will crash the solver.`);
            }

            // 2. Check for Dangling References (Element points to a deleted node)
            const sNodeExists = typeof model.findNodeById === 'function' ? model.findNodeById(sNodeId) : model.nodes.has(sNodeId);
            const eNodeExists = typeof model.findNodeById === 'function' ? model.findNodeById(eNodeId) : model.nodes.has(eNodeId);

            if (!sNodeExists) result.addError(`Element [${id}] references Start Node [${sNodeId}], which does not exist.`);
            if (!eNodeExists) result.addError(`Element [${id}] references End Node [${eNodeId}], which does not exist.`);
        }

        return result;
    }

    static validateSupports(model) {
        const result = new ValidationResult();
        
        // Placeholder for future phase
        if (!model.supports || model.supports.size === 0) {
            result.addWarning("No supports defined. The structure is currently unstable (Rigid Body Motion). Safe for modeling, but will fail solver.");
        }
        
        return result;
    }

    static validateLoads(model) {
        const result = new ValidationResult();
        
        // Placeholder for future phase
        if (!model.loads || model.loads.size === 0) {
            result.addInfo("No external loads applied to the model.");
        }
        
        return result;
    }
}
