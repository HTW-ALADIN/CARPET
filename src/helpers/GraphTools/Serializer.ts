import Graph from "./Graph";
import type { NodeAttributes } from "./Graph";

export class DOTSerialiser {
  constructor() {}

  public serialise(graph: Graph): string {
    const nodes = graph.mapNodes((node, attributes) => {
      return { [node]: attributes };
    });
    const edges = graph.mapEdges((edge, attributes, source, target) => {
      const edgeString = `${source} -> ${target}`;
      return { [edgeString]: attributes };
    });

    return `digraph {\ngraph [bgcolor="transparent"]\n${this.serialiseNodes(nodes)}\n${this.serialiseEdges(edges)}\n}`;
  }

  private serialiseNodes(nodes: Array<{ [key: string]: NodeAttributes }>) {
    const nodeStrings = [];
    for (const node of nodes) {
      const [nodeName] = Object.keys(node);
      const nodeAttributes = node[nodeName];
      const nodeAttributeString = Object.entries(nodeAttributes)
        .map(([key, value]) => {
          // ensure that the text-element for empty labels are still included in the DOM by the dot-engine
          if (key === "label" && value === "") value = "&nbsp;";
          return `${key}="${value}"`;
        })
        .join(", ");

      nodeStrings.push(`${nodeName} [${nodeAttributeString}]`);
    }
    return nodeStrings.join("\n");
  }

  // TODO: add :in and :out tags to edgeName/edgeIdentifier (e.g. for scheduling task)
  private serialiseEdges(edges: Array<{ [key: string]: { [key: string]: any } }>) {
    const edgeStrings = [];
    for (const edge of edges) {
      const [edgeName] = Object.keys(edge);
      const edgeAttributes = edge[edgeName];
      // add empty label if not present or if empty
      if (!Object.keys(edgeAttributes).includes("label") || edgeAttributes["label"] === "") {
        edgeAttributes["label"] = "&nbsp;";
      }
      const edgeAttributeString = Object.entries(edgeAttributes)
        .map(([key, value]) => {
          return `${key}="${value}"`;
        })
        .join(", ");
      edgeStrings.push(`${edgeName} [id="${edgeName}" ${edgeAttributeString}]`);
    }
    return edgeStrings.join("\n");
  }
}
