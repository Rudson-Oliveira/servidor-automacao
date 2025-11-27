import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";

interface GraphNode {
  id: number;
  titulo: string;
  tags: string[];
  group?: number;
}

interface GraphLink {
  source: number;
  target: number;
}

interface ObsidianGraphViewProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (nodeId: number) => void;
  height?: number;
}

/**
 * 🕸️ OBSIDIAN GRAPH VIEW
 * 
 * Visualização interativa de rede de notas com D3.js
 * Force-directed graph com filtros, zoom e navegação
 */
export default function ObsidianGraphView({
  nodes,
  links,
  onNodeClick,
  height = 600,
}: ObsidianGraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoom, setZoom] = useState(1);

  // Extrair todas as tags únicas
  const allTags = Array.from(
    new Set(nodes.flatMap((node) => node.tags))
  ).sort();

  // Filtrar nodes por tag e busca
  const filteredNodes = nodes.filter((node) => {
    const matchesTag = !selectedTag || node.tags.includes(selectedTag);
    const matchesSearch =
      !searchTerm ||
      node.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredLinks = links.filter(
    (link) =>
      filteredNodeIds.has(Number(link.source)) &&
      filteredNodeIds.has(Number(link.target))
  );

  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Limpar SVG anterior
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Criar container para zoom
    const g = svg.append("g");

    // Configurar zoom
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    // Criar simulação de força
    const simulation = d3
      .forceSimulation(filteredNodes as any)
      .force(
        "link",
        d3
          .forceLink(filteredLinks)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Criar links
    const link = g
      .append("g")
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);

    // Criar nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(filteredNodes)
      .join("g")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any
      );

    // Círculos dos nodes
    node
      .append("circle")
      .attr("r", 8)
      .attr("fill", (d) => {
        // Colorir por grupo (primeira tag)
        const tagIndex = allTags.indexOf(d.tags[0] || "");
        return d3.schemeCategory10[tagIndex % 10];
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        if (onNodeClick) {
          onNodeClick(d.id);
        }
      })
      .on("mouseover", function () {
        d3.select(this).attr("r", 12);
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 8);
      });

    // Labels dos nodes
    node
      .append("text")
      .text((d) => d.titulo)
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", "10px")
      .attr("fill", "#666")
      .style("pointer-events", "none");

    // Atualizar posições na simulação
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Funções de drag
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredLinks, allTags, onNodeClick]);

  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.7);
    }
  };

  const handleReset = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg
        .transition()
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform as any,
          d3.zoomIdentity
        );
    }
  };

  const handleExport = () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "obsidian-graph.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-4">
      {/* Controles */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Buscar notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Tags:</span>
              <Badge
                variant={selectedTag === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTag(null)}
              >
                Todas
              </Badge>
              {allTags.slice(0, 5).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Zoom: {(zoom * 100).toFixed(0)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Graph */}
      <div className="border rounded-lg bg-background overflow-hidden">
        <svg ref={svgRef} style={{ width: "100%", height: `${height}px` }} />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <div>
          {filteredNodes.length} notas • {filteredLinks.length} conexões
        </div>
        <div>Arraste para mover • Scroll para zoom • Click para abrir</div>
      </div>
    </Card>
  );
}
