    // ==========================================
    // SUPPORT VALIDATION (Level 4)
    // ==========================================
    static validateSupports(model) {
        const result = new ValidationResult();
        
        if (!model.supports || model.supports.size === 0) {
            result.addWarning("No supports defined. The structure is currently unstable (Rigid Body Motion).");
            return result;
        }

        const supportedNodes = new Set(); // Tracks nodes that already have a support

        for (const [id, support] of model.supports.entries()) {
            
            // 1. Valid Node Check (Missing or Dangling Reference)
            const nodeId = support.node?.id || support.node;
            
            if (!nodeId) {
                result.addError(`Missing Node: Support [${id}] is not attached to any node.`);
                continue;
            }

            const nodeExists = typeof model.findNodeById === 'function' ? model.findNodeById(nodeId) : model.nodes.has(nodeId);
            if (!nodeExists) {
                result.addError(`Dangling Reference: Support [${id}] points to missing Node [${nodeId}].`);
                continue; // Skip further checks to avoid crashes
            }

            // 2. Duplicate Support Check
            if (supportedNodes.has(nodeId)) {
                result.addError(`Duplicate Support: Node [${nodeId}] has multiple supports assigned. A node can only have one support.`);
            }
            supportedNodes.add(nodeId);

            // 3. Restraint Definition Check
            if (!support.restrainedDOFs || typeof support.restrainedDOFs !== 'object') {
                result.addError(`Invalid Restraints: Support [${id}] is missing the 'restrainedDOFs' definition object.`);
            } else {
                const { dx, dy, mz } = support.restrainedDOFs;
                
                // Ensure they are strictly defined as booleans
                if (typeof dx !== 'boolean' || typeof dy !== 'boolean' || typeof mz !== 'boolean') {
                    result.addError(`Malformed Restraints: Support [${id}] restrainedDOFs values (dx, dy, mz) must be strictly true/false booleans.`);
                }

                // Warn if the support doesn't actually hold anything back (all false) and isn't a spring
                if (dx === false && dy === false && mz === false && support.type !== 'Spring') {
                    result.addWarning(`Useless Support: Support [${id}] on Node [${nodeId}] has all restraints set to false (Free).`);
                }
            }

            // 4. Spring Validation (if type is Spring)
            if (support.type === 'Spring') {
                const k = support.springStiffness;
                if (!k || (k.kx === 0 && k.ky === 0 && k.kmz === 0)) {
                    result.addError(`Invalid Spring Support: Support [${id}] is set to 'Spring' but has zero stiffness in all directions.`);
                }
            }
        }

        return result;
    }
``` *(Note: Keep the rest of `Validation.js` exactly as it was, just replace the `validateSupports` block with this updated one).*

With this, you have successfully built out the Core Data Model for Supports (Level 3), integrated it into the Model controller, and protected it with the Validation Engine (Level 4)!
