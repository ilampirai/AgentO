/**
 * agento_flow - Flow graph subgraph retrieval + flow protection
 *
 * Graph mode: Returns relevant flow subgraph for given symbol IDs
 * Protection mode: Define, check, verify, list, update protected flows
 */

import { readJsonMemoryFile, readMemoryFile, appendMemoryFile } from '../memory/loader.js';
import { resolveMemoryPath } from '../memory/resolver.js';
import { MEMORY_FILES } from '../types.js';
import type { FlowInput, FlowGraph, SymbolNode, FlowEdge, FlowProtectionEntry } from '../types.js';
import { parseFlowsMarkdown, checkFlowImpact, getNextFlowId, formatFlowEntry, writeFlowsIndex } from '../memory/flows.js';
import { memoryCache } from '../memory/cache.js';

export const flowToolDef = {
  name: 'agento_flow',
  description: 'Flow graph + flow protection. Without protect_action: returns call graph subgraph. With protect_action: define/check/verify/list/update protected flows.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      ids: {
        type: 'array',
        items: { type: 'string' },
        description: '[graph] Symbol IDs to start from',
      },
      depth: {
        type: 'number',
        description: '[graph] Traversal depth (default: 2)',
      },
      direction: {
        type: 'string',
        enum: ['in', 'out', 'both'],
        description: '[graph] Direction: in (callers), out (callees), both (default)',
      },
      maxNodes: {
        type: 'number',
        description: '[graph] Maximum nodes to return (default: 100)',
      },
      maxEdges: {
        type: 'number',
        description: '[graph] Maximum edges to return (default: 200)',
      },
      protect_action: {
        type: 'string',
        enum: ['define', 'check', 'verify', 'list', 'update'],
        description: 'Flow protection action',
      },
      flow_name: {
        type: 'string',
        description: '[define/update] Flow name',
      },
      description: {
        type: 'string',
        description: '[define/update] Flow description',
      },
      steps: {
        type: 'array',
        items: { type: 'string' },
        description: '[define/update] Flow steps',
      },
      files: {
        type: 'array',
        items: { type: 'string' },
        description: '[define/update] Files involved in the flow',
      },
      target_file: {
        type: 'string',
        description: '[check] File to check for flow impact',
      },
      flow_id: {
        type: 'string',
        description: '[verify/update] Flow ID to operate on',
      },
    },
  },
};

export async function handleFlow(args: unknown) {
  const input = args as FlowInput;

  // Route to flow protection if protect_action is set
  if (input.protect_action) {
    return handleFlowProtection(input);
  }

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
    for (const id of (ids || [])) {
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
    
    // Check which files are in protected flows for annotation
    let protectedFlows: FlowProtectionEntry[] = [];
    try {
      protectedFlows = await memoryCache.getFlows();
    } catch { /* non-fatal */ }

    // Format output
    let output = `🔍 **Flow Subgraph** (${Object.keys(resultNodes).length} nodes, ${resultEdges.length} edges)\n\n`;

    output += '## Nodes\n\n';
    for (const node of Object.values(resultNodes)) {
      const impacted = protectedFlows.length ? checkFlowImpact(node.file, protectedFlows) : [];
      const protectedTag = impacted.length ? ` 🔒 [${impacted.map(f => f.id).join(', ')}]` : '';
      output += `- **${node.id}**: ${node.name} (${node.kind}) @ ${node.file}:${node.line || '?'}${protectedTag}\n`;
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

// ─── Flow Protection ──────────────────────────────────────────────────────

async function handleFlowProtection(input: FlowInput) {
  switch (input.protect_action) {
    case 'define':
      return handleDefine(input);
    case 'check':
      return handleCheck(input);
    case 'verify':
      return handleVerify(input);
    case 'list':
      return handleListFlows();
    case 'update':
      return handleUpdate(input);
    default:
      return {
        content: [{ type: 'text', text: `❌ Unknown protect_action: ${input.protect_action}` }],
        isError: true,
      };
  }
}

async function handleDefine(input: FlowInput) {
  if (!input.flow_name || !input.description) {
    return {
      content: [{ type: 'text', text: '❌ Missing flow_name and description' }],
      isError: true,
    };
  }

  const mdPath = resolveMemoryPath('FLOWS');
  const content = await readMemoryFile(mdPath);
  const existing = parseFlowsMarkdown(content);
  const id = getNextFlowId(existing);

  const entry: FlowProtectionEntry = {
    id,
    name: input.flow_name,
    description: input.description,
    steps: input.steps || [],
    files: input.files || [],
  };

  await appendMemoryFile(mdPath, '\n' + formatFlowEntry(entry));
  existing.push(entry);
  await writeFlowsIndex(existing);
  memoryCache.invalidateFlows();

  return {
    content: [{ type: 'text', text: `✅ Flow defined: ${id} — ${entry.name} (${entry.files.length} files, ${entry.steps.length} steps)` }],
  };
}

async function handleCheck(input: FlowInput) {
  if (!input.target_file) {
    return {
      content: [{ type: 'text', text: '❌ Missing target_file' }],
      isError: true,
    };
  }

  const flows = await memoryCache.getFlows();
  const impacted = checkFlowImpact(input.target_file, flows);

  if (!impacted.length) {
    return {
      content: [{ type: 'text', text: `✅ ${input.target_file} is not in any protected flow` }],
    };
  }

  const text = impacted.map(f =>
    `🔒 **${f.id}**: ${f.name}\n  Steps: ${f.steps.join(' → ')}\n  Files: ${f.files.join(', ')}`
  ).join('\n\n');

  return {
    content: [{ type: 'text', text: `⚠️ ${input.target_file} is in ${impacted.length} protected flow(s):\n\n${text}` }],
  };
}

async function handleVerify(input: FlowInput) {
  const mdPath = resolveMemoryPath('FLOWS');
  const content = await readMemoryFile(mdPath);
  const flows = parseFlowsMarkdown(content);

  if (input.flow_id) {
    const flow = flows.find(f => f.id === input.flow_id);
    if (!flow) {
      return {
        content: [{ type: 'text', text: `❌ Flow ${input.flow_id} not found` }],
        isError: true,
      };
    }
    return verifyFlow(flow);
  }

  // Verify all flows
  const results: string[] = [];
  for (const flow of flows) {
    const r = await verifySingleFlow(flow);
    results.push(r);
  }

  return {
    content: [{ type: 'text', text: results.join('\n\n') || 'No flows defined.' }],
  };
}

async function verifyFlow(flow: FlowProtectionEntry) {
  const result = await verifySingleFlow(flow);
  return { content: [{ type: 'text', text: result }] };
}

async function verifySingleFlow(flow: FlowProtectionEntry): Promise<string> {
  const { existsSync } = await import('fs');
  const missing: string[] = [];
  for (const file of flow.files) {
    if (!existsSync(file)) {
      missing.push(file);
    }
  }

  if (missing.length) {
    return `⚠️ **${flow.id}**: ${flow.name} — ${missing.length} file(s) missing:\n${missing.map(f => `  - ${f}`).join('\n')}`;
  }

  // Update last_verified
  const mdPath = resolveMemoryPath('FLOWS');
  const content = await readMemoryFile(mdPath);
  const flows = parseFlowsMarkdown(content);
  const idx = flows.findIndex(f => f.id === flow.id);
  if (idx >= 0) {
    flows[idx].last_verified = new Date().toISOString().slice(0, 10);
    await writeFlowsIndex(flows);
    memoryCache.invalidateFlows();
  }

  return `✅ **${flow.id}**: ${flow.name} — all ${flow.files.length} files present`;
}

async function handleListFlows() {
  const mdPath = resolveMemoryPath('FLOWS');
  const content = await readMemoryFile(mdPath);
  const flows = parseFlowsMarkdown(content);

  if (!flows.length) {
    return { content: [{ type: 'text', text: 'No protected flows defined.' }] };
  }

  const text = flows.map(f =>
    `**${f.id}**: ${f.name} (${f.files.length} files, ${f.steps.length} steps)${f.last_verified ? ` — verified ${f.last_verified}` : ''}`
  ).join('\n');

  return {
    content: [{ type: 'text', text: `Protected flows (${flows.length}):\n\n${text}` }],
  };
}

async function handleUpdate(input: FlowInput) {
  if (!input.flow_id) {
    return {
      content: [{ type: 'text', text: '❌ Missing flow_id' }],
      isError: true,
    };
  }

  const mdPath = resolveMemoryPath('FLOWS');
  const content = await readMemoryFile(mdPath);
  const flows = parseFlowsMarkdown(content);
  const idx = flows.findIndex(f => f.id === input.flow_id);

  if (idx < 0) {
    return {
      content: [{ type: 'text', text: `❌ Flow ${input.flow_id} not found` }],
      isError: true,
    };
  }

  if (input.flow_name) flows[idx].name = input.flow_name;
  if (input.description) flows[idx].description = input.description;
  if (input.steps) flows[idx].steps = input.steps;
  if (input.files) flows[idx].files = input.files;

  // Rewrite FLOWS.md
  let newContent = '# Protected Flows\n\n';
  for (const flow of flows) {
    newContent += formatFlowEntry(flow) + '\n';
  }
  const { writeMemoryFile: writeMem } = await import('../memory/loader.js');
  await writeMem(mdPath, newContent);
  await writeFlowsIndex(flows);
  memoryCache.invalidateFlows();

  return {
    content: [{ type: 'text', text: `✅ Flow ${input.flow_id} updated` }],
  };
}
