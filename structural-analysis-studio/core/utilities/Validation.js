    // ==========================================
    // LOAD VALIDATION (Phase 3.4)
    // ==========================================
    static validateLoads(model) {
        const result = new ValidationResult();
        
        if (!model.loads || model.loads.size === 0) {
            result.addInfo("No external loads applied to the model.");
            return result;
        }

        const validDirections = ['FX', 'FY', 'FZ', 'MX', 'MY', 'MZ', 'Local-X', 'Local-Y', 'Global-X', 'Global-Y'];
        const validTypes = ['Point Load', 'Moment', 'Uniform Load', 'Triangular Load', 'Trapezoidal Load', 'Temperature Load'];

        for (const [id, load] of model.loads.entries()) {
            // Check 7: Missing required values
            if (!load.targetType) { result.addError(`Missing Target Type: Load [${id}] must specify 'node' or 'element'.`); continue; }
            if (!load.target) { result.addError(`Missing Target: Load [${id}] has no target assigned.`); continue; }
            if (!load.loadType) { result.addError(`Missing Type: Load [${id}] has no loadType assigned.`); continue; }
            if (!load.direction) { result.addError(`Missing Direction: Load [${id}] has no direction assigned.`); continue; }

            // Check 4: Load type
            if (!validTypes.includes(load.loadType)) {
                result.addError(`Invalid Load Type: Load [${id}] type '${load.loadType}' is unsupported.`);
            }

            // Check 3: Direction
            if (!validDirections.includes(load.direction)) {
                result.addError(`Invalid Direction: Load [${id}] direction '${load.direction}' is unsupported.`);
            }

            // Check 2: Magnitude
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

            // Check 1: Target exists + Checks 5 & 6 (Positions)
            const targetId = load.target?.id || load.target;
            
            if (load.targetType === 'node') {
                const nodeExists = typeof model.findNodeById === 'function' ? model.findNodeById(targetId) : model.nodes.has(targetId);
                if (!nodeExists) result.addError(`Dangling Reference: Load [${id}] targets missing Node [${targetId}].`);
            
            } else if (load.targetType === 'element') {
                const element = typeof model.findElementById === 'function' ? model.findElementById(targetId) : model.elements.get(targetId);
                if (!element) {
                    result.addError(`Dangling Reference: Load [${id}] targets missing Element [${targetId}].`);
                } else {
                    // Extract length using Node math
                    const sNode = typeof model.findNodeById === 'function' ? model.findNodeById(element.startNode?.id || element.startNode) : model.nodes.get(element.startNode);
                    const eNode = typeof model.findNodeById === 'function' ? model.findNodeById(element.endNode?.id || element.endNode) : model.nodes.get(element.endNode);
                    
                    if (sNode && eNode) {
                        const length = sNode.distanceTo(eNode);

                        // Check 5: Element position (Point Loads)
                        if (['Point Load', 'Moment'].includes(load.loadType) && load.position !== undefined) {
                            if (load.position < 0 || load.position > length) {
                                result.addError(`Position Error: Load [${id}] position (${load.position}) is outside element length (${length}).`);
                            }
                        }

                        // Check 6: Distributed load limits
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
