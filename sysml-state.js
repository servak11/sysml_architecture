/**
 * Module: sysml-state.js
 * Responsibility: Manages the absolute single-source-of-truth state, undo/redo history stacks,
 * and browser disk persistence configuration.
 */

export const STORAGE_KEY = 'sysml_v2_diamond_view_state';

// Global Memory State Store Configuration
export let modelState = {
    currentMode: 'STRUCTURE', // Active user perspective: STRUCTURE, CONNECT, ACTION
    definitions: { 
        blockCounter: 0, 
        portCounter: 0, 
        connCounter: 0, 
        blocks: {}, 
        ports: {}, 
        connections: {} 
    }
};

export const historyStack = [];

// Selection Tracking Pointers
export let selection = { type: null, id: null };
export let dragInfo = { isDragging: false, targetId: null, startX: 0, startY: 0 };

/**
 * Creates an immutable snapshot of the current state and pushes it to the undo history stack.
 */
export function checkpoint() {
    historyStack.push(JSON.parse(JSON.stringify(modelState)));
    const btnUndo = document.getElementById('btn-undo');
    if (btnUndo) btnUndo.disabled = false;
}

/**
 * Reverts the system data model state back by one structural checkpoint history layer.
 */
export function popHistory() {
    if (historyStack.length === 0) return false;
    modelState = historyStack.pop();
    saveModel();
    const btnUndo = document.getElementById('btn-undo');
    if (btnUndo && historyStack.length === 0) btnUndo.disabled = true;
    return true;
}

/**
 * Synchronizes the runtime memory state with the browser's persistent local storage.
 */
export function saveModel() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modelState));
}

/**
 * Hydrates the memory state store from local storage if a saved model is found.
 */
export function loadModel() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        modelState = JSON.parse(raw);
        return true;
    }
    return false;
}

/**
 * Updates selection references globally across working module contexts.
 * @param {string|null} type - Selection category constraint ('block', 'port', 'diamond', 'conn')
 * @param {string|null} id - Unique identifier matching targeted object entity
 */
export function updateSelection(type, id) {
    selection.type = type;
    selection.id = id;
}
