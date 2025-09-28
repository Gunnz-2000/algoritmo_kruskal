// Graph Visualization and Kruskal Algorithm Implementation
class KruskalVisualizer {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.mstEdges = [];
        this.isRunning = false;
        this.stepIndex = 0;
        this.algorithmSteps = [];
        this.showMSTOnly = false;
        
        // SVG setup
        this.width = 800;
        this.height = 500;
        this.svg = d3.select('#graphSvg')
            .attr('width', '100%')
            .attr('height', this.height)
            .style('background', '#fafbfc');
        
        // Event listeners
        this.setupEventListeners();
        this.updateGraphInfo();
        
        // Initialize with example
        this.loadExampleGraph('simple');
    }

    setupEventListeners() {
        // Button events
        document.getElementById('addNode').addEventListener('click', () => this.setAddNodeMode());
        document.getElementById('addEdge').addEventListener('click', () => this.setAddEdgeMode());
        document.getElementById('clearGraph').addEventListener('click', () => this.clearGraph());
        document.getElementById('runKruskal').addEventListener('click', () => this.runKruskal());
        document.getElementById('stepByStep').addEventListener('click', () => this.runStepByStep());
        document.getElementById('reset').addEventListener('click', () => this.reset());
        document.getElementById('toggleMST').addEventListener('click', () => this.toggleMSTView());
        document.getElementById('exitMode').addEventListener('click', () => this.exitMode());
        document.getElementById('exampleGraphs').addEventListener('change', (e) => this.loadExampleGraph(e.target.value));
        
        // Mobile FAB events
        document.getElementById('fabToggle').addEventListener('click', () => this.toggleFabMenu());
        document.getElementById('mobileAddNode').addEventListener('click', () => this.setAddNodeMode());
        document.getElementById('mobileAddEdge').addEventListener('click', () => this.setAddEdgeMode());
        document.getElementById('mobileRunKruskal').addEventListener('click', () => this.runKruskal());
        document.getElementById('mobileClear').addEventListener('click', () => this.clearGraph());
        
        // Mobile quick actions events
        document.getElementById('mobileStepByStep').addEventListener('click', () => this.runStepByStep());
        document.getElementById('mobileReset').addEventListener('click', () => this.reset());
        document.getElementById('mobileToggleMST').addEventListener('click', () => this.toggleMSTView());
        
        // Modal events
        document.getElementById('confirmWeight').addEventListener('click', () => this.confirmEdgeWeight());
        document.getElementById('cancelWeight').addEventListener('click', () => this.cancelEdgeWeight());
        
        // SVG click events
        this.svg.on('click', (event) => this.handleSvgClick(event));
        this.svg.on('contextmenu', (event) => this.handleRightClick(event));
        
        // Keyboard events
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    }

    setAddNodeMode() {
        this.mode = 'addNode';
        this.svg.style('cursor', 'crosshair');
        this.updateStatus('Modo: Agregar Nodo - Haz clic en el área del grafo. Presiona ESC o haz clic en "Salir del Modo" para salir');
        
        // Show exit mode button
        document.getElementById('exitMode').style.display = 'flex';
        
        // Update mobile toolbar button states and close FAB
        this.updateMobileToolbarStates();
        this.closeFabMenu();
    }

    setAddEdgeMode() {
        if (this.nodes.size < 2) {
            this.updateStatus('Error: Se necesitan al menos 2 nodos para crear aristas');
            return;
        }
        this.mode = 'addEdge';
        this.selectedNode = null;
        this.svg.style('cursor', 'crosshair');
        this.updateStatus('Modo: Agregar Arista - Selecciona el primer nodo. Presiona ESC o haz clic en "Salir del Modo" para salir');
        
        // Show exit mode button
        document.getElementById('exitMode').style.display = 'flex';
        
        // Update mobile toolbar button states and close FAB
        this.updateMobileToolbarStates();
        this.closeFabMenu();
    }

    handleSvgClick(event) {
        if (this.isRunning) return;
        
        const [x, y] = d3.pointer(event);
        
        if (this.mode === 'addNode') {
            this.addNode(x, y);
        } else if (this.mode === 'addEdge') {
            this.handleEdgeClick(x, y);
        }
    }

    handleRightClick(event) {
        event.preventDefault();
        
        const [x, y] = d3.pointer(event);
        const clickedNode = this.getNodeAtPosition(x, y);
        
        if (clickedNode && !this.isRunning) {
            this.deleteNode(clickedNode);
        }
    }

    addNode(x, y) {
        const nodeId = `node_${Date.now()}`;
        const node = {
            id: nodeId,
            x: x,
            y: y,
            label: String.fromCharCode(65 + this.nodes.size) // A, B, C, ...
        };
        
        this.nodes.set(nodeId, node);
        this.updateGraphInfo();
        this.renderGraph();
        this.updateStatus(`Nodo ${node.label} agregado. Haz clic para agregar otro nodo o presiona ESC/haz clic en "Salir del Modo" para salir`);
        // Keep mode active for adding more nodes
    }

    deleteNode(nodeToDelete) {
        // Remove all edges connected to this node
        this.edges = this.edges.filter(edge => 
            edge.source.id !== nodeToDelete.id && edge.target.id !== nodeToDelete.id
        );
        
        // Remove the node from MST edges if it exists
        this.mstEdges = this.mstEdges.filter(edge => 
            edge.source.id !== nodeToDelete.id && edge.target.id !== nodeToDelete.id
        );
        
        // Remove the node
        this.nodes.delete(nodeToDelete.id);
        
        // Reset any selected node if it was the one being deleted
        if (this.selectedNode && this.selectedNode.id === nodeToDelete.id) {
            this.resetEdgeSelection();
            this.mode = null;
            this.svg.style('cursor', 'default');
        }
        
        // Update display
        this.renderGraph();
        this.updateGraphInfo();
        this.updateStatus(`Nodo ${nodeToDelete.label} eliminado`);
        
        // Disable MST buttons if no edges remain
        if (this.edges.length === 0) {
            this.disableMSTButtons();
        }
    }

    showNodeTooltip(event, node) {
        if (this.isRunning) return;
        
        // Create tooltip if it doesn't exist
        let tooltip = d3.select('body').select('.node-tooltip');
        if (tooltip.empty()) {
            tooltip = d3.select('body')
                .append('div')
                .attr('class', 'node-tooltip')
                .style('position', 'absolute')
                .style('background', '#1f2937')
                .style('color', 'white')
                .style('padding', '8px 12px')
                .style('border-radius', '6px')
                .style('font-size', '12px')
                .style('font-weight', '500')
                .style('pointer-events', 'none')
                .style('z-index', '1000')
                .style('opacity', '0')
                .style('transition', 'opacity 0.2s ease');
        }
        
        tooltip
            .html(`Node ${node.label}<br><span style="color: #9ca3af;">Right-click to delete</span>`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .style('opacity', '1');
    }

    hideNodeTooltip() {
        d3.select('.node-tooltip').style('opacity', '0');
    }

    handleKeyDown(event) {
        if (event.key === 'Escape' && this.mode) {
            this.exitMode();
        }
    }

    exitMode() {
        this.mode = null;
        this.selectedNode = null;
        this.svg.style('cursor', 'default');
        this.updateStatus('Listo para ejecutar el algoritmo de Kruskal');
        
        // Hide exit mode button
        document.getElementById('exitMode').style.display = 'none';
        
        // Update mobile toolbar button states
        this.updateMobileToolbarStates();
    }

    toggleFabMenu() {
        const fabMenu = document.getElementById('fabMenu');
        const fabToggle = document.getElementById('fabToggle');
        
        const isOpen = fabMenu.classList.contains('open');
        
        if (isOpen) {
            fabMenu.classList.remove('open');
            fabToggle.classList.remove('rotated');
        } else {
            fabMenu.classList.add('open');
            fabToggle.classList.add('rotated');
        }
    }

    closeFabMenu() {
        const fabMenu = document.getElementById('fabMenu');
        const fabToggle = document.getElementById('fabToggle');
        
        fabMenu.classList.remove('open');
        fabToggle.classList.remove('rotated');
    }

    updateMobileToolbarStates() {
        const mobileAddNode = document.getElementById('mobileAddNode');
        const mobileAddEdge = document.getElementById('mobileAddEdge');
        
        // Reset all mobile buttons
        mobileAddNode.classList.remove('active');
        mobileAddEdge.classList.remove('active');
        
        // Set active state based on current mode
        if (this.mode === 'addNode') {
            mobileAddNode.classList.add('active');
        } else if (this.mode === 'addEdge') {
            mobileAddEdge.classList.add('active');
        }
    }

    handleEdgeClick(x, y) {
        const clickedNode = this.getNodeAtPosition(x, y);
        
        if (!clickedNode) {
            this.updateStatus('Modo: Agregar Arista - Haz clic en un nodo válido');
            return;
        }

        if (!this.selectedNode) {
            this.selectedNode = clickedNode;
            this.updateStatus(`Nodo ${clickedNode.label} seleccionado. Selecciona el segundo nodo o presiona ESC/haz clic en "Salir del Modo" para salir`);
            this.highlightNode(clickedNode.id, true);
        } else if (this.selectedNode.id !== clickedNode.id) {
            // Check if edge already exists
            const existingEdge = this.edges.find(edge => 
                (edge.source.id === this.selectedNode.id && edge.target.id === clickedNode.id) ||
                (edge.source.id === clickedNode.id && edge.target.id === this.selectedNode.id)
            );
            
            if (existingEdge) {
                this.updateStatus('Error: Ya existe una arista entre estos nodos');
                this.resetEdgeSelection();
                return;
            }
            
            this.showWeightModal(this.selectedNode, clickedNode);
        } else {
            this.updateStatus('Error: No puedes conectar un nodo consigo mismo');
            this.resetEdgeSelection();
        }
    }

    getNodeAtPosition(x, y) {
        for (const [id, node] of this.nodes) {
            const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
            if (distance <= 20) { // Node radius
                return node;
            }
        }
        return null;
    }

    highlightNode(nodeId, highlight) {
        d3.select(`#${nodeId}`)
            .transition()
            .duration(200)
            .attr('r', highlight ? 25 : 20)
            .attr('fill', highlight ? '#ffd700' : '#667eea');
    }

    resetEdgeSelection() {
        if (this.selectedNode) {
            this.highlightNode(this.selectedNode.id, false);
            this.selectedNode = null;
        }
    }

    showWeightModal(source, target) {
        this.pendingEdge = { source, target };
        document.getElementById('weightModal').style.display = 'block';
        document.getElementById('weightInput').focus();
    }

    confirmEdgeWeight() {
        const weight = parseInt(document.getElementById('weightInput').value);
        if (isNaN(weight) || weight < 1) {
            alert('Por favor ingresa un peso válido (número mayor a 0)');
            return;
        }

        const edge = {
            id: `edge_${Date.now()}`,
            source: this.pendingEdge.source,
            target: this.pendingEdge.target,
            weight: weight
        };

        this.edges.push(edge);
        this.updateGraphInfo();
        this.renderGraph();
        this.updateStatus(`Arista agregada: ${this.pendingEdge.source.label} - ${this.pendingEdge.target.label} (peso: ${weight}). Haz clic para agregar otra arista o presiona ESC/haz clic en "Salir del Modo" para salir`);
        
        this.closeWeightModal();
        this.resetEdgeSelection();
        // Keep mode active for adding more edges
    }

    cancelEdgeWeight() {
        this.closeWeightModal();
        this.resetEdgeSelection();
        this.exitMode();
        this.updateStatus('Agregar arista cancelado');
    }

    closeWeightModal() {
        document.getElementById('weightModal').style.display = 'none';
        document.getElementById('weightInput').value = '1';
        this.pendingEdge = null;
    }

    renderGraph() {
        // Clear previous rendering
        this.svg.selectAll('*').remove();

        // Determine which edges to show
        const edgesToShow = this.showMSTOnly ? this.mstEdges : this.edges;
        const mstEdgeIds = new Set(this.mstEdges.map(e => e.id));

        // Draw edges
        const edgeSelection = this.svg.selectAll('.edge')
            .data(edgesToShow)
            .enter()
            .append('line')
            .attr('class', d => {
                const isMST = mstEdgeIds.has(d.id);
                return isMST ? 'edge mst-edge' : 'edge';
            })
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)
            .attr('stroke', d => {
                const isMST = mstEdgeIds.has(d.id);
                return isMST ? '#ff6b6b' : (this.showMSTOnly ? '#ff6b6b' : '#666');
            })
            .attr('stroke-width', d => {
                const isMST = mstEdgeIds.has(d.id);
                return isMST ? 4 : (this.showMSTOnly ? 4 : 2);
            })
            .attr('id', d => d.id);

        // Determine which nodes to show (only connected nodes when showing MST only)
        let nodesToShow;
        if (this.showMSTOnly) {
            // Get all nodes that are connected by MST edges
            const connectedNodeIds = new Set();
            this.mstEdges.forEach(edge => {
                connectedNodeIds.add(edge.source.id);
                connectedNodeIds.add(edge.target.id);
            });
            nodesToShow = Array.from(this.nodes.values()).filter(node => connectedNodeIds.has(node.id));
        } else {
            nodesToShow = Array.from(this.nodes.values());
        }

        // Draw nodes
        const nodeSelection = this.svg.selectAll('.node')
            .data(nodesToShow)
            .enter()
            .append('circle')
            .attr('class', 'node')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 20)
            .attr('fill', '#667eea')
            .attr('stroke', '#fff')
            .attr('stroke-width', 3)
            .attr('id', d => d.id)
            .on('mouseenter', (event, d) => this.showNodeTooltip(event, d))
            .on('mouseleave', () => this.hideNodeTooltip());

        // Draw node labels
        this.svg.selectAll('.node-label')
            .data(nodesToShow)
            .enter()
            .append('text')
            .attr('class', 'node-label')
            .attr('x', d => d.x)
            .attr('y', d => d.y + 5)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .text(d => d.label);

        // Draw edge weights (always show weights for visible edges)
        const edgesForWeights = this.showMSTOnly ? this.mstEdges : this.edges;
        this.svg.selectAll('.edge-weight')
            .data(edgesForWeights)
            .enter()
            .append('text')
            .attr('class', 'edge-weight')
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2 - 5)
            .attr('text-anchor', 'middle')
            .attr('fill', '#333')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('background', 'white')
            .text(d => d.weight);
    }

    // Kruskal Algorithm Implementation
    runKruskal() {
        if (this.nodes.size < 2) {
            this.updateStatus('Error: Se necesitan al menos 2 nodos para ejecutar el algoritmo');
            return;
        }

        const startTime = performance.now();
        
        // Reset MST
        this.mstEdges = [];
        this.renderGraph();
        
        // Create union-find data structure
        const parent = new Map();
        const rank = new Map();
        
        // Initialize each node as its own parent
        for (const [id, node] of this.nodes) {
            parent.set(id, id);
            rank.set(id, 0);
        }
        
        // Find function with path compression
        const find = (x) => {
            if (parent.get(x) !== x) {
                parent.set(x, find(parent.get(x)));
            }
            return parent.get(x);
        };
        
        // Union function with union by rank
        const union = (x, y) => {
            const px = find(x);
            const py = find(y);
            
            if (px === py) return false; // Already in same set
            
            if (rank.get(px) < rank.get(py)) {
                parent.set(px, py);
            } else if (rank.get(px) > rank.get(py)) {
                parent.set(py, px);
            } else {
                parent.set(py, px);
                rank.set(px, rank.get(px) + 1);
            }
            return true;
        };
        
        // Sort edges by weight
        const sortedEdges = [...this.edges].sort((a, b) => a.weight - b.weight);
        
        // Kruskal's algorithm
        let mstWeight = 0;
        for (const edge of sortedEdges) {
            if (union(edge.source.id, edge.target.id)) {
                this.mstEdges.push(edge);
                mstWeight += edge.weight;
                
                // Check if we have enough edges
                if (this.mstEdges.length === this.nodes.size - 1) {
                    break;
                }
            }
        }
        
        const endTime = performance.now();
        const executionTime = (endTime - startTime).toFixed(2);
        
        // Update results
        this.updateResults(mstWeight, executionTime);
        this.renderGraph();
        
        // Enable MST toggle buttons
        this.enableMSTButtons();
        
        // Check if graph is connected
        if (this.mstEdges.length < this.nodes.size - 1) {
            this.updateStatus('Advertencia: El grafo no está completamente conectado. No se puede formar un MST completo.');
        } else {
            this.updateStatus(`Algoritmo completado. MST encontrado con peso total: ${mstWeight}`);
        }
        
        // Close FAB menu
        this.closeFabMenu();
    }

    runStepByStep() {
        if (this.nodes.size < 2) {
            this.updateStatus('Error: Se necesitan al menos 2 nodos para ejecutar el algoritmo');
            return;
        }

        this.isRunning = true;
        this.stepIndex = 0;
        this.algorithmSteps = [];
        this.mstEdges = [];
        
        // Initialize union-find
        const parent = new Map();
        const rank = new Map();
        
        for (const [id, node] of this.nodes) {
            parent.set(id, id);
            rank.set(id, 0);
        }
        
        const find = (x) => {
            if (parent.get(x) !== x) {
                parent.set(x, find(parent.get(x)));
            }
            return parent.get(x);
        };
        
        const union = (x, y) => {
            const px = find(x);
            const py = find(y);
            
            if (px === py) return false;
            
            if (rank.get(px) < rank.get(py)) {
                parent.set(px, py);
            } else if (rank.get(px) > rank.get(py)) {
                parent.set(py, px);
            } else {
                parent.set(py, px);
                rank.set(px, rank.get(px) + 1);
            }
            return true;
        };
        
        // Sort edges
        const sortedEdges = [...this.edges].sort((a, b) => a.weight - b.weight);
        
        // Create steps
        this.algorithmSteps.push({
            text: `Paso 1: Ordenar aristas por peso (${sortedEdges.length} aristas)`,
            edges: sortedEdges.map(e => `${e.source.label}-${e.target.label}:${e.weight}`).join(', ')
        });
        
        let mstWeight = 0;
        let stepNumber = 2;
        
        for (let i = 0; i < sortedEdges.length; i++) {
            const edge = sortedEdges[i];
            const canAdd = union(edge.source.id, edge.target.id);
            
            if (canAdd) {
                this.mstEdges.push(edge);
                mstWeight += edge.weight;
                
                this.algorithmSteps.push({
                    text: `Paso ${stepNumber}: Agregar arista ${edge.source.label}-${edge.target.label} (peso: ${edge.weight})`,
                    weight: mstWeight,
                    edge: edge
                });
                stepNumber++;
                
                if (this.mstEdges.length === this.nodes.size - 1) {
                    break;
                }
            } else {
                this.algorithmSteps.push({
                    text: `Paso ${stepNumber}: Omitir arista ${edge.source.label}-${edge.target.label} (crearía ciclo)`,
                    weight: mstWeight
                });
                stepNumber++;
            }
        }
        
        this.algorithmSteps.push({
            text: `Algoritmo completado. Peso total del MST: ${mstWeight}`,
            weight: mstWeight
        });
        
        this.displayStep();
        this.updateStatus('Ejecutando paso a paso...');
        
        // Enable MST toggle buttons after step by step completes
        if (this.algorithmSteps.length > 0) {
            setTimeout(() => {
                this.enableMSTButtons();
            }, (this.algorithmSteps.length - 1) * 2000 + 1000);
        }
    }

    displayStep() {
        if (this.stepIndex >= this.algorithmSteps.length) {
            this.isRunning = false;
            this.updateStatus('Algoritmo paso a paso completado');
            this.updateResults(this.algorithmSteps[this.algorithmSteps.length - 1].weight, 'Paso a paso');
            return;
        }
        
        const step = this.algorithmSteps[this.stepIndex];
        
        // Update steps display
        const stepsContent = document.getElementById('algorithmSteps');
        stepsContent.innerHTML = '';
        
        for (let i = 0; i <= this.stepIndex; i++) {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step-text';
            stepDiv.innerHTML = `
                <strong>${this.algorithmSteps[i].text}</strong>
                ${this.algorithmSteps[i].weight !== undefined ? `<br>Peso acumulado: ${this.algorithmSteps[i].weight}` : ''}
                ${this.algorithmSteps[i].edges ? `<br>Aristas: ${this.algorithmSteps[i].edges}` : ''}
            `;
            
            if (i === this.stepIndex) {
                stepDiv.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
                stepDiv.style.color = 'white';
            }
            
            stepsContent.appendChild(stepDiv);
        }
        
        // Update graph visualization
        this.renderGraph();
        
        // Auto-advance after 2 seconds
        setTimeout(() => {
            this.stepIndex++;
            this.displayStep();
        }, 2000);
    }

    updateResults(weight, time) {
        document.getElementById('totalWeight').textContent = weight;
        document.getElementById('mstEdges').textContent = this.mstEdges.length;
    }

    clearGraph() {
        this.nodes.clear();
        this.edges = [];
        this.mstEdges = [];
        this.algorithmSteps = [];
        this.stepIndex = 0;
        this.isRunning = false;
        this.showMSTOnly = false;
        this.exitMode();
        
        this.renderGraph();
        this.updateGraphInfo();
        this.updateStatus('Grafo limpiado');
        
        // Clear results
        document.getElementById('totalWeight').textContent = '-';
        document.getElementById('mstEdges').textContent = '-';
        
        // Clear steps
        document.getElementById('algorithmSteps').innerHTML = '<div class="step-placeholder"><i class="fas fa-play"></i><p>Haz clic en "Paso a Paso" para ver el algoritmo en acción</p></div>';
        
        // Disable MST buttons
        this.disableMSTButtons();
        
        // Close FAB menu
        this.closeFabMenu();
        
        // Hide tooltip
        this.hideNodeTooltip();
    }

    reset() {
        this.clearGraph();
        this.loadExampleGraph('simple');
    }

    updateGraphInfo() {
        document.getElementById('nodeCount').textContent = this.nodes.size;
        document.getElementById('edgeCount').textContent = this.edges.length;
    }

    updateStatus(message) {
        document.getElementById('algorithmStatus').innerHTML = `<p>${message}</p>`;
    }

    loadExampleGraph(type) {
        this.clearGraph();
        
        switch (type) {
            case 'simple':
                this.loadSimpleGraph();
                break;
            case 'complex':
                this.loadComplexGraph();
                break;
            case 'medium10':
                this.loadMedium10Graph();
                break;
        }
        
        this.renderGraph();
        this.updateGraphInfo();
        this.updateStatus(`Example graph "${type}" loaded`);
        
        // Disable MST buttons when loading new graph
        this.disableMSTButtons();
    }

    loadSimpleGraph() {
        // Simple 4-node graph
        const positions = [
            { x: 200, y: 100, label: 'A' },
            { x: 400, y: 100, label: 'B' },
            { x: 200, y: 250, label: 'C' },
            { x: 400, y: 250, label: 'D' }
        ];
        
        positions.forEach((pos, index) => {
            const node = {
                id: `node_${index}`,
                x: pos.x,
                y: pos.y,
                label: pos.label
            };
            this.nodes.set(node.id, node);
        });
        
        // Add edges
        this.edges = [
            { id: 'edge_0', source: this.nodes.get('node_0'), target: this.nodes.get('node_1'), weight: 4 },
            { id: 'edge_1', source: this.nodes.get('node_0'), target: this.nodes.get('node_2'), weight: 2 },
            { id: 'edge_2', source: this.nodes.get('node_1'), target: this.nodes.get('node_3'), weight: 3 },
            { id: 'edge_3', source: this.nodes.get('node_2'), target: this.nodes.get('node_3'), weight: 5 },
            { id: 'edge_4', source: this.nodes.get('node_0'), target: this.nodes.get('node_3'), weight: 6 }
        ];
    }

    loadComplexGraph() {
        // More complex 6-node graph
        const positions = [
            { x: 150, y: 80, label: 'A' },
            { x: 300, y: 80, label: 'B' },
            { x: 450, y: 80, label: 'C' },
            { x: 150, y: 200, label: 'D' },
            { x: 300, y: 200, label: 'E' },
            { x: 450, y: 200, label: 'F' }
        ];
        
        positions.forEach((pos, index) => {
            const node = {
                id: `node_${index}`,
                x: pos.x,
                y: pos.y,
                label: pos.label
            };
            this.nodes.set(node.id, node);
        });
        
        // Add more edges for complexity
        this.edges = [
            { id: 'edge_0', source: this.nodes.get('node_0'), target: this.nodes.get('node_1'), weight: 3 },
            { id: 'edge_1', source: this.nodes.get('node_1'), target: this.nodes.get('node_2'), weight: 2 },
            { id: 'edge_2', source: this.nodes.get('node_0'), target: this.nodes.get('node_3'), weight: 4 },
            { id: 'edge_3', source: this.nodes.get('node_1'), target: this.nodes.get('node_4'), weight: 1 },
            { id: 'edge_4', source: this.nodes.get('node_2'), target: this.nodes.get('node_5'), weight: 5 },
            { id: 'edge_5', source: this.nodes.get('node_3'), target: this.nodes.get('node_4'), weight: 6 },
            { id: 'edge_6', source: this.nodes.get('node_4'), target: this.nodes.get('node_5'), weight: 2 },
            { id: 'edge_7', source: this.nodes.get('node_0'), target: this.nodes.get('node_4'), weight: 3 },
            { id: 'edge_8', source: this.nodes.get('node_1'), target: this.nodes.get('node_5'), weight: 4 }
        ];
    }

    loadMedium10Graph() {
        // Medium complexity 10-node graph in a pentagon-like structure
        const positions = [
            { x: 300, y: 80, label: 'A' },    // Top center
            { x: 450, y: 150, label: 'B' },   // Top right
            { x: 450, y: 250, label: 'C' },   // Middle right
            { x: 300, y: 320, label: 'D' },   // Bottom center
            { x: 150, y: 250, label: 'E' },   // Middle left
            { x: 150, y: 150, label: 'F' },   // Top left
            { x: 200, y: 120, label: 'G' },   // Inner top left
            { x: 400, y: 120, label: 'H' },   // Inner top right
            { x: 400, y: 210, label: 'I' },   // Inner middle right
            { x: 200, y: 210, label: 'J' }    // Inner middle left
        ];
        
        positions.forEach((pos, index) => {
            const node = {
                id: `node_${index}`,
                x: pos.x,
                y: pos.y,
                label: pos.label
            };
            this.nodes.set(node.id, node);
        });
        
        // Create a well-connected network with moderate complexity
        this.edges = [
            // Outer ring connections
            { id: 'edge_0', source: this.nodes.get('node_0'), target: this.nodes.get('node_1'), weight: 3 },
            { id: 'edge_1', source: this.nodes.get('node_1'), target: this.nodes.get('node_2'), weight: 2 },
            { id: 'edge_2', source: this.nodes.get('node_2'), target: this.nodes.get('node_3'), weight: 4 },
            { id: 'edge_3', source: this.nodes.get('node_3'), target: this.nodes.get('node_4'), weight: 3 },
            { id: 'edge_4', source: this.nodes.get('node_4'), target: this.nodes.get('node_5'), weight: 2 },
            { id: 'edge_5', source: this.nodes.get('node_5'), target: this.nodes.get('node_0'), weight: 4 },
            
            // Inner connections
            { id: 'edge_6', source: this.nodes.get('node_6'), target: this.nodes.get('node_7'), weight: 1 },
            { id: 'edge_7', source: this.nodes.get('node_7'), target: this.nodes.get('node_8'), weight: 3 },
            { id: 'edge_8', source: this.nodes.get('node_8'), target: this.nodes.get('node_9'), weight: 2 },
            { id: 'edge_9', source: this.nodes.get('node_9'), target: this.nodes.get('node_6'), weight: 4 },
            
            // Connections between outer and inner rings
            { id: 'edge_10', source: this.nodes.get('node_0'), target: this.nodes.get('node_6'), weight: 2 },
            { id: 'edge_11', source: this.nodes.get('node_0'), target: this.nodes.get('node_7'), weight: 3 },
            { id: 'edge_12', source: this.nodes.get('node_1'), target: this.nodes.get('node_7'), weight: 1 },
            { id: 'edge_13', source: this.nodes.get('node_1'), target: this.nodes.get('node_8'), weight: 4 },
            { id: 'edge_14', source: this.nodes.get('node_2'), target: this.nodes.get('node_8'), weight: 2 },
            { id: 'edge_15', source: this.nodes.get('node_2'), target: this.nodes.get('node_9'), weight: 3 },
            { id: 'edge_16', source: this.nodes.get('node_3'), target: this.nodes.get('node_9'), weight: 1 },
            { id: 'edge_17', source: this.nodes.get('node_4'), target: this.nodes.get('node_9'), weight: 2 },
            { id: 'edge_18', source: this.nodes.get('node_4'), target: this.nodes.get('node_6'), weight: 4 },
            { id: 'edge_19', source: this.nodes.get('node_5'), target: this.nodes.get('node_6'), weight: 3 },
            
            // Additional cross-connections for more interesting MST
            { id: 'edge_20', source: this.nodes.get('node_0'), target: this.nodes.get('node_2'), weight: 5 },
            { id: 'edge_21', source: this.nodes.get('node_1'), target: this.nodes.get('node_3'), weight: 6 },
            { id: 'edge_22', source: this.nodes.get('node_2'), target: this.nodes.get('node_4'), weight: 4 },
            { id: 'edge_23', source: this.nodes.get('node_3'), target: this.nodes.get('node_5'), weight: 5 },
            { id: 'edge_24', source: this.nodes.get('node_4'), target: this.nodes.get('node_0'), weight: 3 }
        ];
    }



    // MST View Toggle Functions
    enableMSTButtons() {
        document.getElementById('toggleMST').disabled = false;
        document.getElementById('mobileToggleMST').disabled = false;
    }

    disableMSTButtons() {
        document.getElementById('toggleMST').disabled = true;
        document.getElementById('mobileToggleMST').disabled = true;
        document.getElementById('toggleMST').innerHTML = '<i class="fas fa-eye"></i>';
        document.getElementById('mobileToggleMST').innerHTML = '<i class="fas fa-eye"></i><span>MST</span>';
        this.showMSTOnly = false;
    }

    toggleMSTView() {
        if (this.mstEdges.length === 0) {
            this.updateStatus('Error: No hay MST para mostrar. Ejecuta el algoritmo primero.');
            return;
        }

        // Toggle between showing all edges and only MST
        this.showMSTOnly = !this.showMSTOnly;
        this.renderGraph();
        
        if (this.showMSTOnly) {
            this.updateStatus('Mostrando solo el Árbol de Expansión Mínima');
            document.getElementById('toggleMST').innerHTML = '<i class="fas fa-eye-slash"></i>';
            document.getElementById('mobileToggleMST').innerHTML = '<i class="fas fa-eye-slash"></i><span>MST</span>';
        } else {
            this.updateStatus('Mostrando grafo original completo');
            document.getElementById('toggleMST').innerHTML = '<i class="fas fa-eye"></i>';
            document.getElementById('mobileToggleMST').innerHTML = '<i class="fas fa-eye"></i><span>MST</span>';
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.kruskalVisualizer = new KruskalVisualizer();
});
