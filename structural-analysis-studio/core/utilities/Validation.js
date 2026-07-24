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
 * Phase 3: Validation Engine
 * Prevents an invalid model from ever reaching the formulations or solver.
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
            result.addInfo("Model validation passed successfully. Geometry is mathematically sound.");
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
            // 1. Missing object check
            if (!node) {
                result.addError(`Node entry for key [${mapKey}] is undefined.`);
                continue; 
            }

            const id = node.id || mapKey;

            // 2. Duplicate IDs 
            // (While Map keys are unique, we check if the internal ID was accidentally reused or corrupted)
            if (idSet.has(id)) {
                result.addError(`Duplicate ID: Node ID [${id}] is used more than once.`);
            }
            idSet.add(id);

            // 3. Missing coordinates (null or undefined)
            if (node.x === undefined || node.x === null || node.y === undefined || node.y === null) {
                result.addError(`Missing Coordinates: Node [${id}] is missing X or Y values.`);
                continue; // Skip numeric checks below to avoid type errors
            }

            // 4. NaN (Not a Number) checks
            if (Number.isNaN(node.x) || Number.isNaN(node.y)) {
                result.addError(`Invalid Number (NaN): Node [${id}] coordinates calculated to NaN.`);
            }

            // 5. Infinity checks
            if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
                result.addError(`Infinity Error: Node [${id}] coordinates are infinite.`);
            }

            // 6. Duplicate coordinates (Coincident nodes)
            // Only check if they are valid, finite numbers
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

            if (sNodeId === eNodeId) {
                result.addError(`Zero-Length Element: Element [${id}] has the same start and end node (${sNodeId}).`);
            }

            const sNodeExists = typeof model.findNodeById === 'function' ? model.findNodeById(sNodeId) : model.nodes.has(sNodeId);
            const eNodeExists = typeof model.findNodeById === 'function' ? model.findNodeById(eNodeId) : model.nodes.has(eNodeId);

            if (!sNodeExists) result.addError(`Dangling Reference: Element [${id}] points to missing Start Node [${sNodeId}].`);
            if (!eNodeExists) result.addError(`Dangling Reference: Element [${id}] points to missing End Node [${eNodeId}].`);
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
