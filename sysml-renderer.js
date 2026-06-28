/**
 * Module: sysml-renderer.js
 * Responsibility: Updates the DOM, coordinates drag-and-drop actions, cleans up elements safely, 
 * and renders SVG connection vectors.
 */

import { modelState, selection, updateSelection, dragInfo, checkpoint, saveModel } from './sysml-state.js';
import { calculateNonOverlappingPortCoordinates } from './sysml-actions.js';

const canvas = document.getElementById('canvas');
const svgLayer = document.getElementById('svg-layer');
const diagramCtx = document.getElementById('diagram-context');

/**
 * Clears the canvas safely and completely re-renders all visual elements based on the current modelState.
 * Includes parent blocks, nested compartments, boundary ports, and relational lines.
 */
export function renderActiveView() {
    if (!canvas || !svgLayer) return;

    // Fixed: Safe node cleanup pattern verifies canvas child containment to prevent DOM exceptions
    canvas.querySelectorAll('.block').forEach(b => { 
        if (canvas.contains(b)) canvas.removeChild(b); 
    });
    svgLayer.querySelectorAll('.connection-wrapper').forEach(w => w.remove());

    const active = modelState.definitions;

    for (let bId in active.blocks) {
        const bData = active.blocks[bId];
        const block = document.createElement('div');
        block.className = 'block'; 
        block.id = bId;
        block.style.left = bData.left; 
        block.style.top = bData.top;
        if (selection.type === 'block' && selection.id === bId) block.classList.add('selected');

        // Header Section Construction
        const header = document.createElement('div');
        header.className = 'block-header';
        header.innerHTML = `<div class="stereotype">«part def»</div><div class="text">${bData.text}</div>`;
        
        // Connect event handlers
        header.addEventListener('mousedown', (e) => initBlockDrag(e, bId, e.clientX, e.clientY));
        header.addEventListener('dblclick', (e) => {
            e.stopPropagation(); 
            const txtEl = header.querySelector('.text');
            txtEl.contentEditable = "true"; txtEl.focus();
            txtEl.addEventListener('blur', () => {
                checkpoint(); bData.text = txtEl.innerText; txtEl.contentEditable = "false"; saveModel();
            }, { once: true });
        });
        header.addEventListener('click', (e) => { e.stopPropagation(); setVisualSelection('block', bId); });
        block.appendChild(header);

        // Structural Parts Section
        const partComp = document.createElement('div');
        partComp.className = 'compartment';
        partComp.innerHTML = `<div class="compartment-title">parts usage</div>`;
        bData.partsCompartment.forEach((item) => {
            const row = document.createElement('div'); row.className = 'compartment-item'; row.innerText = item;
            partComp.appendChild(row);
        });
        block.appendChild(partComp);

        // Behavioral Actions Section
        const actionComp = document.createElement('div');
        actionComp.className = 'compartment';
        actionComp.innerHTML = `<div class="compartment-title">actions flow</div>`;
        bData.actionsCompartment.forEach((item) => {
            const row = document.createElement('div'); row.className = 'compartment-item'; row.innerText = item;
            actionComp.appendChild(row);
        });
        block.appendChild(actionComp);

        // Render composition diamonds when in STRUCTURE mode
        if (modelState.currentMode === 'STRUCTURE') {
            const diamondId = 'diamond_' + bId;
            const diamond = document.createElement('div');
            diamond.className = 'structural-diamond'; 
            diamond.id = diamondId;
            if (selection.type === 'diamond' && selection.id === diamondId) diamond.classList.add('selected');
            
            diamond.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDiamondLinkAction(diamondId);
            });
            block.appendChild(diamond);
        }

        canvas.appendChild(block);

        // Render edge interface ports when in CONNECT or ACTION modes
        if (modelState.currentMode === 'CONNECT' || modelState.currentMode === 'ACTION') {
            bData.ports.forEach(pId => {
                const pData = active.ports[pId];
                if (!pData) return;
                const port = document.createElement('div');
                port.className = 'port'; port.id = pId;
                port.style.left = `calc(${pData.pctX}% - 6px)`;
                port.style.top = `calc(${pData.pctY}% - 6px)`;
                if (selection.type === 'port' && selection.id === pId) port.classList.add('selected');
                if (modelState.currentMode === 'ACTION') port.style.backgroundColor = 'var(--accent-action)';
                
                port.addEventListener('click', (e) => { e.stopPropagation(); handlePortLinkAction(pId); });
                block.appendChild(port);
            });
        }
    }

    // Re-draw connection routes
    for (let cId in active.connections) {
        const conn = active.connections[cId];
        if (conn.type === modelState.currentMode) {
            buildConnectionUI(cId, conn.from, conn.to, conn.type);
        }
    }
    updateLines();
}

/**
 * Initializes the dragging sequence for a block or spawns an interface port.
 */
function initBlockDrag(e, id, clientX, clientY) {
    if (e.target.contentEditable === "true") return;
    const blockEl = document.getElementById(id);
    const rect = blockEl.getBoundingClientRect();
    const x = clientX - rect.left; 
    const y = clientY - rect.top;
    const borderThresh = 15;
    const active = modelState.definitions;

    if ((x <= borderThresh || x >= rect.width - borderThresh || y <= borderThresh || y >= rect.height - borderThresh) && modelState.currentMode !== 'STRUCTURE') {
        e.stopPropagation(); e.preventDefault();
        
        let pctX = 50, pctY = 50, edge = 'top';
        const minDist = Math.min(x, rect.width - x, y, rect.height - y);
        if (minDist === x) { pctX = 0; pctY = (y / rect.height) * 100; edge = 'left'; }
        else if (minDist === (rect.width - x)) { pctX = 100; pctY = (y / rect.height) * 100; edge = 'right'; }
        else if (minDist === y) { pctX = (x / rect.width) * 100; pctY = 0; edge = 'top'; }
        else { pctX = (x / rect.width) * 100; pctY = 100; edge = 'bottom'; }

        // Apply anti-overlap checks
        const cleanCoords = calculateNonOverlappingPortCoordinates(id, pctX, pctY, edge);
        const portId = 'port_' + active.portCounter++;
        
        active.ports[portId] = { blockId: id, pctX: cleanCoords.pctX, pctY: cleanCoords.pctY, edge };
        active.blocks[id].ports.push(portId);
        
        renderActiveView();
        setVisualSelection('port', portId);
        saveModel();
        return;
    }

    dragInfo.isDragging = true; 
    dragInfo.targetId = id;
    dragInfo.startX = clientX - parseInt(blockEl.style.left);
    dragInfo.startY = clientY - parseInt(blockEl.style.top);
    setVisualSelection('block', id);
    e.stopPropagation();
}

/**
 * Sets the active selection in state and updates visual styles across the UI.
 */
export function setVisualSelection(type, id) {
    clearVisualSelection();
    updateSelection(type, id);
    const el = document.getElementById(id);
    if (el) el.classList.add('selected');
    const btnDelete = document.getElementById('btn-delete');
    if (btnDelete) btnDelete.disabled = false;
}

/**
 * Clears the active selection styling and disables context-dependent toolbar buttons.
 */
export function clearVisualSelection() {
    if (selection.id) {
        const el = document.getElementById(selection.id);
        if (el) el.classList.remove('selected');
    }
    updateSelection(null, null);
    const btnDelete = document.getElementById('btn-delete');
    if (btnDelete) btnDelete.disabled = true;
}

/**
 * Handles connecting structural composition lines using base diamond markers.
 */
function handleDiamondLinkAction(diamondId) {
    const active = modelState.definitions;
    if (selection.type === 'diamond' && selection.id !== diamondId) {
        checkpoint();
        const connId = 'conn_' + active.connCounter++;
        active.connections[connId] = { from: selection.id, to: diamondId, type: 'STRUCTURE' };
        clearVisualSelection();
        renderActiveView();
        saveModel();
    } else {
        setVisualSelection('diamond', diamondId);
    }
}

/**
 * Handles connecting dynamic hardware or flow interfaces using boundary ports.
 */
function handlePortLinkAction(portId) {
    const active = modelState.definitions;
    if (selection.type === 'port' && selection.id !== portId) {
        checkpoint();
        const connId = 'conn_' + active.connCounter++;
        active.connections[connId] = { from: selection.id, to: portId, type: modelState.currentMode };
        clearVisualSelection();
        renderActiveView();
        saveModel();
    } else {
        setVisualSelection('port', portId);
    }
}

/**
 * Builds and injects SVG markup wrapper pipelines directly into the graph layer.
 */
function buildConnectionUI(id, fromId, toId, type) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'connection-wrapper'); g.setAttribute('id', id);

    const bgLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bgLine.setAttribute('class', 'connection-bg-line');
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    if (type === 'STRUCTURE') line.setAttribute('class', 'connection-line struct-line');
    else if (type === 'ACTION') line.setAttribute('class', 'connection-line action-line');
    else line.setAttribute('class', 'connection-line');

    g.appendChild(bgLine); g.appendChild(line);
    svgLayer.appendChild(g);
    g.addEventListener('click', (e) => { e.stopPropagation(); setVisualSelection('conn', id); });
}

/**
 * Recalculates screen positions and traces smooth Cubic Bézier splines for active connectors.
 */
export function updateLines() {
    const active = modelState.definitions;
    svgLayer.querySelectorAll('.connection-wrapper').forEach(g => {
        const conn = active.connections[g.id]; if(!conn) return;
        
        const getPos = (id) => {
            if (id.startsWith('diamond_')) {
                const bId = id.replace('diamond_', '');
                const bEl = document.getElementById(bId);
                return { x: parseInt(bEl.style.left) + (bEl.offsetWidth / 2), y: parseInt(bEl.style.top) + bEl.offsetHeight, edge: 'bottom' };
            } else {
                const p = active.ports[id]; const bEl = document.getElementById(p.blockId);
                return { x: parseInt(bEl.style.left) + (bEl.offsetWidth * (p.pctX / 100)), y: parseInt(bEl.style.top) + (bEl.offsetHeight * (p.pctY / 100)), edge: p.edge };
            }
        };

        try {
            const p1 = getPos(conn.from); const p2 = getPos(conn.to);
            const getCtrl = (p) => {
                if (p.edge === 'left') return { x: p.x - 40, y: p.y };
                if (p.edge === 'right') return { x: p.x + 40, y: p.y };
                if (p.edge === 'top') return { x: p.x, y: p.y - 40 };
                return { x: p.x, y: p.y + 40 };
            };
            const d = `M ${p1.x} ${p1.y} C ${getCtrl(p1).x} ${getCtrl(p1).y}, ${getCtrl(p2).x} ${getCtrl(p2).y}, ${p2.x} ${p2.y}`;
            g.querySelector('.connection-line').setAttribute('d', d);
            g.querySelector('.connection-bg-line').setAttribute('d', d);
        } catch(e){}
    });
}
