export class Material {
    constructor(id, type = "Steel") {
        if (!id) throw new Error("Material must have a valid ID.");
        this.id = id;
        this.type = type;
    }
    toJSON() { return { id: this.id, type: this.type }; }
}
