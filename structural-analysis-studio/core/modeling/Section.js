export class Section {
    constructor(id, shape = "I-Beam") {
        if (!id) throw new Error("Section must have a valid ID.");
        this.id = id;
        this.shape = shape;
    }
    toJSON() { return { id: this.id, shape: this.shape }; }
}
