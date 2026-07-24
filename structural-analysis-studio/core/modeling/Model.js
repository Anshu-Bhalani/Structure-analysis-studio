    // Inside Model.js class:

    addElement(element) {
        this.elements.set(element.id, element);
        this._invalidateResults();
    }

    deleteElement(elementId) {
        this.elements.delete(elementId);
        this._invalidateResults();
    }

    // Feature 3: Safe Deletion Logic
    deleteNode(nodeId, deleteConnected = false) {
        // 1. Find all elements connected to this node
        let connectedElements = [];
        for (const [id, element] of this.elements.entries()) {
            if (element.startNode.id === nodeId || element.endNode.id === nodeId) {
                connectedElements.push(element.id);
            }
        }

        // 2. If connected and not explicitly forced, reject deletion
        if (connectedElements.length > 0 && !deleteConnected) {
            return { 
                success: false, 
                message: `Node belongs to ${connectedElements.length} element(s).`,
                connectedElements: connectedElements
            };
        }

        // 3. If forced (deleteConnected = true), delete the connected elements first
        if (deleteConnected) {
            connectedElements.forEach(elementId => this.deleteElement(elementId));
        }

        // 4. Finally, delete the node
        this.nodes.delete(nodeId);
        this._invalidateResults();
        
        return { success: true };
    }
