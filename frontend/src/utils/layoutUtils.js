import dagre from 'dagre';

export function applyHierarchicalLayout(nodes, edges, direction = 'TB') {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 60 });
  g.setDefaultEdgeLabel(() => ({}));
  
  nodes.forEach(node => {
    g.setNode(node.id, { width: 320, height: 140 });
  });
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });
  
  dagre.layout(g);
  
  return nodes.map(node => {
    const { x, y } = g.node(node.id);
    return { ...node, position: { x: x - 160, y: y - 70 } };
  });
}

export function applyRadialLayout(nodes) {
  const cx = 500, cy = 400;
  const radius = Math.max(200, nodes.length * 50);
  return nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    return {
      ...node,
      position: {
        x: cx + radius * Math.cos(angle) - 160,
        y: cy + radius * Math.sin(angle) - 70,
      }
    };
  });
}

export function applyGridLayout(nodes, cols = 3) {
  const COL_W = 380, ROW_H = 260;
  return nodes.map((node, i) => ({
    ...node,
    position: {
      x: 80 + (i % cols) * COL_W,
      y: 80 + Math.floor(i / cols) * ROW_H,
    }
  }));
}
