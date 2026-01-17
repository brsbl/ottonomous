/**
 * GraphView component for visualizing notes as a force-directed graph.
 * Uses D3.js for rendering with zoom/pan controls and interactive features.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { useKnowledgeBase } from '../stores/knowledgeBase';
import { extractLinks } from '../lib/linkParser';
import type { GraphNode, GraphEdge } from '../types';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Extended node type for D3 simulation with position properties.
 */
interface SimulationNode extends GraphNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * Extended edge type for D3 simulation with resolved source/target.
 */
interface SimulationEdge {
  source: SimulationNode;
  target: SimulationNode;
}

/**
 * Props for the GraphView component.
 */
interface GraphViewProps {
  /** Callback to close the graph view */
  onClose?: () => void;
  /** Additional CSS class names */
  className?: string;
}

/**
 * GraphView renders an interactive force-directed graph of notes and their links.
 * Features:
 * - Nodes represent notes (circles with titles)
 * - Edges represent bidirectional links between notes
 * - Click on a node to navigate to that note
 * - Zoom and pan with mouse/trackpad
 * - Highlight connected nodes on hover
 */
export function GraphView({ onClose, className }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notes, setActiveNote } = useKnowledgeBase();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Store zoom transform for controls
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);

  /**
   * Build graph data from notes and their links.
   */
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const edgeSet = new Set<string>();

    // Create nodes from notes
    for (const note of notes) {
      const links = extractLinks(note, notes);
      nodes.push({
        id: note.id,
        title: note.title,
        linkCount: links.length,
      });

      // Create edges from links (bidirectional - only add once)
      for (const link of links) {
        const edgeKey = [note.id, link.targetId].sort().join('-');
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            source: note.id,
            target: link.targetId,
          });
        }
      }
    }

    return { nodes, edges };
  }, [notes]);

  /**
   * Get connected node IDs for a given node.
   */
  const getConnectedNodes = useCallback(
    (nodeId: string): Set<string> => {
      const connected = new Set<string>();
      connected.add(nodeId);
      for (const edge of graphData.edges) {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
        if (sourceId === nodeId) {
          connected.add(targetId);
        } else if (targetId === nodeId) {
          connected.add(sourceId);
        }
      }
      return connected;
    },
    [graphData.edges]
  );

  /**
   * Handle container resize.
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 800,
          height: rect.height || 600,
        });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  /**
   * Initialize and update D3 force simulation and SVG rendering.
   */
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svgSelectionRef.current = svg;
    const width = dimensions.width;
    const height = dimensions.height;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create a group for zoom/pan transformations
    const g = svg.append('g');

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Initialize simulation with deep copies to avoid mutation issues
    const simulationNodes: SimulationNode[] = graphData.nodes.map((node) => ({
      ...node,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
    }));

    const simulationEdges: SimulationEdge[] = graphData.edges
      .map((edge) => {
        const sourceNode = simulationNodes.find(
          (n) => n.id === (typeof edge.source === 'string' ? edge.source : edge.source.id)
        );
        const targetNode = simulationNodes.find(
          (n) => n.id === (typeof edge.target === 'string' ? edge.target : edge.target.id)
        );
        // Skip edges where source or target node is not found (prevents crash)
        if (!sourceNode || !targetNode) {
          return null;
        }
        return { source: sourceNode, target: targetNode };
      })
      .filter((edge): edge is SimulationEdge => edge !== null);

    // Create force simulation
    const simulation = d3.forceSimulation<SimulationNode>(simulationNodes)
      .force('link', d3.forceLink<SimulationNode, SimulationEdge>(simulationEdges)
        .id((d) => d.id)
        .distance(100)
        .strength(0.5)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create edges (links)
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simulationEdges)
      .join('line')
      .attr('stroke', '#6b7280')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5);

    // Create node groups
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, SimulationNode>('g')
      .data(simulationNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, SimulationNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Add circles to nodes
    node.append('circle')
      .attr('r', (d) => Math.max(8, Math.min(20, 8 + d.linkCount * 2)))
      .attr('fill', '#3b82f6')
      .attr('stroke', '#1d4ed8')
      .attr('stroke-width', 2);

    // Add labels to nodes
    node.append('text')
      .text((d) => d.title.length > 15 ? d.title.slice(0, 15) + '...' : d.title)
      .attr('x', 0)
      .attr('y', (d) => Math.max(8, Math.min(20, 8 + d.linkCount * 2)) + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#e5e7eb')
      .attr('pointer-events', 'none');

    // Node interactions
    node
      .on('click', (_event, d) => {
        setActiveNote(d.id);
        onClose?.();
      })
      .on('mouseenter', (_event, d) => {
        setHoveredNodeId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredNodeId(null);
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Center the graph initially
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

    return () => {
      simulation.stop();
    };
  }, [graphData, dimensions, setActiveNote, onClose]);

  /**
   * Update node/edge styling based on hover state.
   */
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const connectedNodes = hoveredNodeId ? getConnectedNodes(hoveredNodeId) : null;

    // Update node styling
    svg.selectAll<SVGGElement, SimulationNode>('.nodes g')
      .select('circle')
      .transition()
      .duration(150)
      .attr('opacity', (d) => {
        if (!connectedNodes) return 1;
        return connectedNodes.has(d.id) ? 1 : 0.2;
      })
      .attr('fill', (d) => {
        if (!connectedNodes) return '#3b82f6';
        if (d.id === hoveredNodeId) return '#22c55e';
        return connectedNodes.has(d.id) ? '#60a5fa' : '#3b82f6';
      });

    // Update edge styling
    svg.selectAll<SVGLineElement, SimulationEdge>('.links line')
      .transition()
      .duration(150)
      .attr('stroke-opacity', (d) => {
        if (!connectedNodes) return 0.6;
        const sourceId = d.source.id;
        const targetId = d.target.id;
        return (sourceId === hoveredNodeId || targetId === hoveredNodeId) ? 1 : 0.1;
      })
      .attr('stroke-width', (d) => {
        if (!connectedNodes) return 1.5;
        const sourceId = d.source.id;
        const targetId = d.target.id;
        return (sourceId === hoveredNodeId || targetId === hoveredNodeId) ? 2.5 : 1.5;
      })
      .attr('stroke', (d) => {
        if (!connectedNodes) return '#6b7280';
        const sourceId = d.source.id;
        const targetId = d.target.id;
        return (sourceId === hoveredNodeId || targetId === hoveredNodeId) ? '#22c55e' : '#6b7280';
      });

    // Update label styling
    svg.selectAll<SVGGElement, SimulationNode>('.nodes g')
      .select('text')
      .transition()
      .duration(150)
      .attr('opacity', (d) => {
        if (!connectedNodes) return 1;
        return connectedNodes.has(d.id) ? 1 : 0.2;
      });
  }, [hoveredNodeId, getConnectedNodes]);

  /**
   * Zoom control handlers.
   */
  const handleZoomIn = () => {
    if (svgSelectionRef.current && zoomRef.current) {
      svgSelectionRef.current.transition().duration(300).call(zoomRef.current.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (svgSelectionRef.current && zoomRef.current) {
      svgSelectionRef.current.transition().duration(300).call(zoomRef.current.scaleBy, 0.67);
    }
  };

  const handleResetZoom = () => {
    if (svgSelectionRef.current && zoomRef.current) {
      svgSelectionRef.current
        .transition()
        .duration(300)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  if (notes.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-gray-900', className)}>
        <p className="text-gray-400">No notes to visualize. Create some notes first!</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full bg-gray-900 overflow-hidden', className)}
    >
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {onClose && (
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            title="Close graph view"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          className="bg-gray-800 border-gray-700 hover:bg-gray-700"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          className="bg-gray-800 border-gray-700 hover:bg-gray-700"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleResetZoom}
          className="bg-gray-800 border-gray-700 hover:bg-gray-700"
          title="Reset zoom"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Graph info */}
      <div className="absolute bottom-4 left-4 z-10 bg-gray-800/80 px-3 py-2 rounded-md text-sm text-gray-300">
        <span>{graphData.nodes.length} notes</span>
        <span className="mx-2">|</span>
        <span>{graphData.edges.length} links</span>
      </div>

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}

export default GraphView;
