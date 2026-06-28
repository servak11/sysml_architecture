/**
 * Module: sysml-actions.js
 * Responsibility: Implements core business logic, including structural additions, deletions, 
 * the text synchronization compiler, and anti-overlap port constraints.
 */

import { modelState, checkpoint, saveModel, updateSelection, selection } from './sysml-state.js';

/**
 * Parses the script editor's input text to create and sync SysML definitions.
 * Evaluates differences non-destructively, preserving layout properties for matched elements.
 * @param {string} codeText - Raw text source extracted from input field element
 */
export function compileV2EngineText(codeText) {
    const partDefRegex = /part\s+def\s+([A-Za-z0-9_]+)/g;
    let match, extractedNames = [];
    
    while ((match = partDefRegex.exec(codeText)) !== null) {
        if (match[1] && !extractedNames.includes(match[1])) {
            extractedNames.push(match[1]);
        }
    }
    if (extractedNames.length === 0) {
        alert("No valid definitions discovered. Declare architectural blocks using standard syntax: 'part def Name;'");
        return false;
    }

    checkpoint();
    const active = modelState.definitions;

    // Prune stale definitions missing from the source text
    for (let id in active.blocks) {
        if (!extractedNames.includes(active.blocks[id].text)) {
            delete active.blocks[id];
        }
    }

    // Spawn layout geometry specifications
    let startX = 60, startY = 80, gapX = 220, gapY = 220;
    const canvasWidth = document.getElementById('canvas')?.clientWidth || 800;
    const maxCols = Math.floor((canvasWidth - 50) / gapX) || 2;

    extractedNames.forEach((name, i) => {
        let existingId = null;
        for (let id in active.blocks) {
            if (active.blocks[id].text === name) { existingId = id; break; }
        }

        if (!existingId) {
            const id = 'def_' + active.blockCounter++;
            const col = i % maxCols; 
            const row = Math.floor(i / maxCols);
            active.blocks[id] = {
                left: (startX + (col * gapX)) + 'px',
                top: (startY + (row * gapY)) + 'px',
                text: name,
                partsCompartment: ['+ sub_module_A'],
                actionsCompartment: ['▸ compute_step()'],
                ports: []
            };
        }
    });

    saveModel();
    return true;
}

/**
 * Calculates automated border spacing to prevent newly generated ports from overlapping.
 * Applies positional offsets down the border axis if a port is created within a 20px buffer zone.
 * @param {string} blockId - Direct parent host block targeting execution
 * @param {number} pctX - Initial relative placement percentage along X-axis
 * @param {number} pctY - Initial relative placement percentage along Y-axis
 * @param {string} edge - Edge orientation keyword identifier ('top', 'bottom', 'left', 'right')
 * @returns {Object} Clean, non-colliding coordinate percentages {pctX, pctY}
 */
export function calculateNonOverlappingPortCoordinates(blockId, pctX, pctY, edge) {
    const active = modelState.definitions;
    const BUFFER = 20; // Proximity threshold in pixels
    let outputX = pctX;
    let outputY = pctY;

    const connectedPorts = active.blocks[blockId]?.ports || [];
    connectedPorts.forEach(existingPortId => {
        const ep = active.ports[existingPortId];
        if (ep && ep.edge === edge) {
            const axisDiff = (edge === 'left' || edge === 'right') ? Math.abs(ep.pctY - outputY) : Math.abs(ep.pctX - outputX);
            if (axisDiff < (BUFFER / 2)) {
                if (edge === 'left' || edge === 'right') {
                    outputY = Math.min(95, outputY + 15);
                } else {
                    outputX = Math.min(95, outputX + 15);
                }
            }
        }
    });

    return { pctX: outputX, pctY: outputY };
}

/**
 * Deletes the actively highlighted graph component from the configuration dictionary.
 * Cleans up references, including structural connections and boundary interfaces.
 */
export function executeSelectionDeletion() {
    if (!selection.type || !selection.id) return false;
    checkpoint();
    const active = modelState.definitions;
    const targetId = selection.id;

    if (selection.type === 'block') {
        active.blocks[targetId].ports.forEach(pId => {
            for (let cId in active.connections) { 
                if (active.connections[cId].from === pId || active.connections[cId].to === pId) delete active.connections[cId]; 
            }
            delete active.ports[pId];
        });
        for (let cId in active.connections) {
            if (active.connections[cId].from === 'diamond_' + targetId || active.connections[cId].to === 'diamond_' + targetId) delete active.connections[cId];
        }
        delete active.blocks[targetId];
    } else if (selection.type === 'port' || selection.type === 'diamond') {
        for (let cId in active.connections) { 
            if (active.connections[cId].from === targetId || active.connections[cId].to === targetId) delete active.connections[cId]; 
        }
        if (selection.type === 'port') {
            const bId = active.ports[targetId].blockId;
            active.blocks[bId].ports = active.blocks[bId].ports.filter(p => p !== targetId);
            delete active.ports[targetId];
        }
    } else if (selection.type === 'conn') {
        delete active.connections[targetId];
    }

    updateSelection(null, null);
    saveModel();
    return true;
}
