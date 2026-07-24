export class Load {
    constructor(id, config) {
        if (!id) throw new Error("Load must have a valid ID.");
        
        this.id = id;
        this.targetType = config.targetType || null; 
        this.target = config.target || null;         
        this.loadType = config.loadType || null;     
        this.direction = config.direction || null;   

        if (config.magnitude !== undefined) this.magnitude = config.magnitude;
        if (config.startMagnitude !== undefined) this.startMagnitude = config.startMagnitude;
        if (config.endMagnitude !== undefined) this.endMagnitude = config.endMagnitude;

        if (config.position !== undefined) this.position = config.position;
        if (config.startPosition !== undefined) this.startPosition = config.startPosition;
        if (config.endPosition !== undefined) this.endPosition = config.endPosition;
    }

    toJSON() {
        return {
            id: this.id,
            targetType: this.targetType,
            target: this.target?.id || this.target,
            loadType: this.loadType,
            direction: this.direction,
            magnitude: this.magnitude,
            startMagnitude: this.startMagnitude,
            endMagnitude: this.endMagnitude,
            position: this.position,
            startPosition: this.startPosition,
            endPosition: this.endPosition
        };
    }
}
