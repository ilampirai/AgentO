/**
 * agento_flow - Flow graph subgraph retrieval
 * Returns relevant flow subgraph for given symbol IDs
 */

import { readJsonMemoryFile } from '../memory/loader.js';
import { MEMORY_FILES } from '../types.js';
import type { FlowInput, FlowGraph, SymbolNode, FlowEdge } from '../types.js';

export const flowToolDef = {
  name: 'agento_flow',
  description: 'Get flow subgraph for given symbol IDs. Returns call graph edges and connected nodes within specified depth.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Symbol IDs to start from',
      },
      depth: {
        type: 'number',
        description: 'Traversal depth (default: 2)',
      },
      direction: {
        type: 'string',
        enum: ['in', 'out', 'both'],
        description: 'Direction: in (callers), out (callees), both (default)',
      },
      maxNodes: {
        type: 'number',
        description: 'Maximum nodes to return (default: 100)',
      },
      maxEdges: {
        type: 'number',
        description: 'Maximum edges to return (default: 200)',
      },
    },
    required: ['ids'],
  },
};

export async function handleFlow(args: unknown) {
  const input = args as FlowInput;
  const { 
    ids, 
    depth = 2, 
    direction = 'both',
    maxNodes = 100,
    maxEdges = 200
  } = input;
  
  try {
    const flowGraph = await readJsonMemoryFile<FlowGraph>(
      MEMORY_FILES.FLOW_GRAPH,
      { version: '1.0', generated: '', nodes: {}, edges: [], entryPoints: [] }
    );
    
    if (!flowGraph.nodes || Object.keys(flowGraph.nodes).length === 0) {
      return {
        content: [{ 
          type: 'text', 
          text: '⚠️ Flow graph not found. Run agento_index first to generate it.' 
        }],
        isError: false,
      };
    }
    
    // Build adjacency lists
    const outgoing: Record<string, string[]> = {};
    const incoming: Record<string, string[]> = {};
    
    for (const edge of flowGraph.edges) {
      if (!outgoing[edge.from]) outgoing[edge.from] = [];
      outgoing[edge.from].push(edge.to);
      
      if (!incoming[edge.to]) incoming[edge.to] = [];
      incoming[edge.to].push(edge.from);
    }
    
    // BFS traversal to get subgraph
    const visited = new Set<string>();
    const resultNodes: Record<string, SymbolNode> = {};
    const resultEdges: FlowEdge[] = [];
    const queue: Array<{ id: string; depth: number }> = [];
    
    // Initialize queue with starting nodes
    for (const id of ids) {
      if (flowGraph.nodes[id]) {
        queue.push({ id, depth: 0 });
        visited.add(id);
        resultNodes[id] = flowGraph.nodes[id];
      }
    }
    
    // Traverse
    while (queue.length > 0 && Object.keys(resultNodes).length < maxNodes) {
      const { id, depth: currentDepth } = queue.shift()!;
      
      if (currentDepth >= depth) continue;
      
      // Get neighbors based on direction
      const neighbors: string[] = [];
      if (direction === 'out' || direction === 'both') {
        neighbors.push(...(outgoing[id] || []));
      }
      if (direction === 'in' || direction === 'both') {
        neighbors.push(...(incoming[id] || []));
      }
      
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId) && flowGraph.nodes[neighborId]) {
          visited.add(neighborId);
          resultNodes[neighborId] = flowGraph.nodes[neighborId];
          queue.push({ id: neighborId, depth: currentDepth + 1 });
        }
        
        // Add edge if both nodes are in result
        if (resultNodes[id] && resultNodes[neighborId] && resultEdges.length < maxEdges) {
          const edge = flowGraph.edges.find(
            e => (e.from === id && e.to === neighborId) || 
                 (direction === 'both' && e.from === neighborId && e.to === id)
          );
          if (edge && !resultEdges.find(e => e.from === edge.from && e.to === edge.to)) {
            resultEdges.push(edge);
          }
        }
      }
    }
    
    // Format output
    let output = `🔍 **Flow Subgraph** (${Object.keys(resultNodes).length} nodes, ${resultEdges.length} edges)\n\n`;
    
    output += '## Nodes\n\n';
    for (const node of Object.values(resultNodes)) {
      output += `- **${node.id}**: ${node.name} (${node.kind}) @ ${node.file}:${node.line || '?'}\n`;
      if (node.signature) {
        output += `  - ${node.signature}\n`;
      }
    }
    
    output += '\n## Edges\n\n';
    for (const edge of resultEdges.slice(0, 50)) {
      const fromNode = resultNodes[edge.from];
      const toNode = resultNodes[edge.to];
      if (fromNode && toNode) {
        output += `- ${fromNode.name} --[${edge.type}]--> ${toNode.name}\n`;
      }
    }
    if (resultEdges.length > 50) {
      output += `... and ${resultEdges.length - 50} more edges\n`;
    }
    
    return {
      content: [{ type: 'text', text: output }],
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `❌ Flow retrieval failed: ${errorMsg}` }],
      isError: true,
    };
  }
}

