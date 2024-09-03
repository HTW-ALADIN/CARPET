import type { IStore } from "@/helpers/TaskGraphUtility";
import type {
  SerializedTaskComponent,
  SerialisedDependencies,
  ComponentDependencies,
  TaskGraphPath,
  ComponentData,
  SerialisedMethod,
  SerialisedMethods,
  MethodImplementation,
  MethodImplementations,
  SerialisedContextMenu,
  NestedComponents
} from "@/components/taskComponents/TaskComponent";
import { TaskComponent } from "@/components/taskComponents/TaskComponent";
import Graph from "@/helpers/GraphTools/Graph";
import { DOTSerialiser } from "@/helpers/GraphTools/Serializer";
import { unref } from "vue";
import { capitalizeFirstLetter } from "@/helpers/StringManipulation";

import type { ComputedRef, Ref } from "vue";
import type { SerializedDOTGraphComponent } from "@/components/taskComponents/DOTGraph/DOTGraph";
import type { DroppedElements, DropData, DragElements } from "@/components/taskComponents/DragDrop/ItemPallet/ItemPallet";
import type { CSSIDSelector } from "@/components/taskComponents/DragDrop/DragElement/DragElement";
import type { SerializedGraph } from "@/helpers/GraphTools/Graph";

export type ManipulatableGraphComponentType = "ManipulatableGraph";

export interface GraphNodeTemplate {
  label?: string;
  shape?: string;
  fixedSize?: string;
  style?: string;
}

export interface ManipulatableGraphDropData extends DropData {
  template: GraphNodeTemplate;
}

export interface ManipulatableGraphDragElements extends DragElements {
  [dragElement: string]: {
    componentType: string;
    props: { [key: string]: any };
    elementSelector: CSSIDSelector;
    dropData: ManipulatableGraphDropData;
  };
}

export interface SerializedManipulatableGraphDependencies extends SerialisedDependencies {
  dotDescription: TaskGraphPath;
  validationData: TaskGraphPath;
  droppedElements: TaskGraphPath;
  dragElements: TaskGraphPath;
}

export interface ManipulatableGraphDependencies extends ComponentDependencies {
  dotDescription: ComputedRef<string>;
  validationData: ComputedRef<any>;
  droppedElements: ComputedRef<DroppedElements>;
  dragElements: ComputedRef<ManipulatableGraphDragElements>;
}

export interface ManipulatableGraphComponentData extends ComponentData {
  editable: Array<string>;
  dotUserGraph: string;
  userGraph: SerializedGraph;
}

export interface ManipulatableGraphMethodImplementations extends MethodImplementations {}
export interface ManipulatableGraphSerialisedMethods extends SerialisedMethods {}

export interface ManipulatedGraphNestedComponents extends NestedComponents {
  DOTGraph: SerializedDOTGraphComponent;
}

export interface SerializedManipulatableGraphComponent
  extends SerializedTaskComponent<
    ManipulatableGraphComponentType,
    SerializedManipulatableGraphDependencies,
    ManipulatableGraphComponentData,
    ManipulatableGraphSerialisedMethods,
    SerialisedContextMenu,
    ManipulatedGraphNestedComponents
  > {}

export class ManipulatableGraphComponent extends TaskComponent<
  SerializedManipulatableGraphComponent,
  SerializedManipulatableGraphDependencies,
  ManipulatableGraphDependencies,
  ManipulatableGraphComponentData,
  ManipulatableGraphSerialisedMethods,
  ManipulatableGraphMethodImplementations,
  ManipulatedGraphNestedComponents
> {
  /**
   * The ManipulatableGraphComponent class is a derived taskComponent,
   * that displays a Graph via the DOTGraph-component.
   */
  serialiser: DOTSerialiser;
  graphOptions = {
    multi: true
  };
  componentHTMLClass = "ManipulatableGraph";

  // TODO: for complex dot objects with individual fields per node, the "a_"-prefix is needed to identify the correct node id
  constructor(storeObject: Ref<IStore>, componentID: number, serialisedTaskComponentPath: TaskGraphPath) {
    super(storeObject, componentID, serialisedTaskComponentPath);
    this.serialiser = new DOTSerialiser();
  }

  private loadUserGraph(): Graph {
    const componentData = this.getComponentData();
    console.log(unref(componentData).userGraph);
    const serializedUserGraph = unref(componentData).userGraph;
    const userGraph = new Graph(this.graphOptions).import(serializedUserGraph);
    return userGraph;
  }

  public updateGraphVisualization(userGraph: Graph, componentPath: TaskGraphPath) {
    const dotUserGraph = this.serialiser.serialise(userGraph);

    unref(this.storeObject).setProperty({
      path: `${componentPath}__component__dotUserGraph`,
      value: dotUserGraph,
      metadata: { descriptor: "updateDotUserGraph" }
    });
  }

  private updateUserGraph(userGraph: Graph, componentPath: TaskGraphPath) {
    unref(this.storeObject).setProperty({
      path: `${componentPath}__component__userGraph`,
      value: userGraph.export(),
      metadata: { descriptor: "addNode" }
    });

    this.updateGraphVisualization(userGraph, componentPath);
  }

  public addNode(nodeTemplate: GraphNodeTemplate, componentPath: TaskGraphPath) {
    const userGraph = this.loadUserGraph();

    // take the highest existing Id and add 1
    const newNodeId =
      userGraph.nodes().reduce((max, current) => {
        const currentNumber = parseInt(current);
        return currentNumber > max ? currentNumber : max;
      }, 0) + 1;

    userGraph.addNode(newNodeId, nodeTemplate);

    this.updateUserGraph(userGraph, componentPath);
    this.assignNodeInteractionHandlers(`.${this.componentHTMLClass} g#node${newNodeId}`)();
  }

  public assignNodeInteractionHandlers(nodeCssSelector: string) {
    return () =>
      Array.from(document.querySelectorAll(nodeCssSelector)).forEach((node) => {
        node.setAttribute("pointer-events", "visible");
        node.addEventListener("click", this.createNodeInteractionHandler());
      });
  }

  public assignEdgeInteractionHandlers(edgeCssSelector: string) {
    return () =>
      Array.from(document.querySelectorAll(edgeCssSelector)).forEach((edge) => {
        edge.setAttribute("pointer-events", "visible");
        edge.addEventListener("click", this.createEdgeInteractionHandler());
      });
  }

  private createGraphElementActiveSetter() {
    return (target: Element) => {
      target.classList.add("active");
      target.setAttribute("stroke", "red");
      Array.from(target.querySelectorAll("polygon, path, ellipse")).forEach((node: Element) =>
        node.setAttribute("stroke", "red")
      );
    };
  }

  private createGraphElementInactiveSetter() {
    return (target: Element) => {
      target.classList.remove("active");
      target.setAttribute("stroke", "");
      Array.from(target.querySelectorAll("polygon, path, ellipse")).forEach((node: Element) =>
        node.setAttribute("stroke", "black")
      );
    };
  }

  private createGraphElementInputFieldHandler() {
    return (
      domElement: Element,
      graphElementId: string,
      graphElementType: "node" | "edge",
      graph: Graph,
      nodeElementInactiveSetter: Function,
      updateGraph: Function
    ) => {
      const input = document.createElement("input");
      input.style.textAlign = "right";
      input.style.width = "20px";
      const textField = <SVGTextElement>domElement.querySelector("text");
      input.value = <string>textField?.textContent;
      // TODO eventually shift logic into deep watcher to make replays possible
      input.onkeyup = (event) => {
        const input = event.target as unknown as HTMLInputElement;
        if (["Enter"].includes(event.key)) {
          input.blur();
          if (graphElementType === "node") {
            graph.setNodeAttribute(graphElementId, "label", input.value);
          } else if (graphElementType === "edge") {
            graph.setEdgeAttribute(graphElementId, "label", input.value);
          }
          updateGraph(graph, `update${capitalizeFirstLetter(graphElementType)}Label`);
          return;
        }
        if (["Escape"].includes(event.key)) {
          nodeElementInactiveSetter(domElement);
          input.blur();
          return;
        }
      };
      input.onblur = () => {
        foreignObject.remove();
        this.validate();
      };

      const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
      foreignObject.setAttribute("width", "100%");
      foreignObject.setAttribute("height", "100%");
      const textBox = domElement.querySelector("text");
      const yCoordinate = textBox?.getAttribute("y");
      const xCoordinate = textBox?.getAttribute("x");
      foreignObject.setAttribute("y", `${parseInt(<string>yCoordinate)}`);
      foreignObject.setAttribute("x", <string>xCoordinate);
      foreignObject.append(input);

      const svg = domElement;
      svg?.append(foreignObject);

      input.select();
    };
  }

  private createNodeInteractionHandler() {
    /**
     * This function injects the necessary data into the NodeInteraction callback handler,
     * due to the change of context of the `this`-keyword and returns the callback handler.
     */
    const storeObject = unref(this.storeObject);
    const componentPath = this.serialisedTaskComponentPath;
    const serialiser = this.serialiser;
    const graphOptions = this.graphOptions;

    const isMultigraph = graphOptions.multi;

    const nodeElementActiveSetter = this.createGraphElementActiveSetter();
    const nodeElementInactiveSetter = this.createGraphElementInactiveSetter();
    const graphElementInputFieldHandler = this.createGraphElementInputFieldHandler();

    // TODO: repainting the graph results in attaching the event handler only to the outlines and text of the nodes
    // try to fix this by reattaching the event handler to the whole node after redrawing
    const updateGraph = (userGraph: Graph, actionDescriptor: string) => {
      storeObject.setProperty({
        path: `${componentPath}__component__userGraph`,
        value: userGraph.export(),
        metadata: { descriptor: actionDescriptor }
      });
      const dotUserGraph = serialiser.serialise(userGraph);
      storeObject.setProperty({
        path: `${componentPath}__component__dotUserGraph`,
        value: dotUserGraph,
        metadata: { descriptor: "updateDotUserGraph" }
      });
    };

    let isDoubleClick = false;

    // actual event handler
    return (event: Event) => {
      const { detail } = <MouseEvent>event;
      const serializedUserGraph = storeObject.getProperty(`${componentPath}__component__userGraph`);
      const userGraph = new Graph(graphOptions).import(serializedUserGraph);

      const target = <HTMLElement>event.currentTarget;
      const activeNode = document.querySelector("g.node.active");

      // timeout is required to differentiate between double clicks and single clicks
      isDoubleClick = detail === 2 ? true : false;
      setTimeout(() => {
        // handle double click
        if (isDoubleClick) {
          userGraph.dropNode(target.querySelector("title")?.textContent);
          updateGraph(userGraph, "dropNode");
        } else {
          // handle single click

          // if there already is an active node, add an edge between the active node and the target node
          if (activeNode) {
            // reset styling for active node
            nodeElementInactiveSetter(activeNode);

            // add edge
            const parentId = activeNode.querySelector("title")?.textContent;
            const childId = target.querySelector("title")?.textContent;
            let edgeKey = `${parentId}->${childId}`;
            // if multigraph, add counter to edgeKey to differentiate between edges
            if (isMultigraph) {
              let i = 1;
              while (userGraph.hasEdge(edgeKey)) {
                edgeKey = `${parentId}->${childId}_${i}`;
                i++;
              }
            }
            userGraph.addEdgeWithKey(edgeKey, parentId, childId, { label: "" });

            // update userGraph
            updateGraph(userGraph, "addEdge");

            // assign edge interaction handlers
            this.assignEdgeInteractionHandlers(`.${this.componentHTMLClass} g.edge`)();
          } else {
            // mark target node as active
            nodeElementActiveSetter(target);

            const nodeId = <string>target.querySelector("title")?.textContent;
            const { type: nodeType } = userGraph.getNodeAttributes(nodeId);

            // allow editing of node label only if node is editable
            const editable: Array<string> = unref(this.storeObject).getProperty(`${componentPath}__component__editable`);
            if (editable.includes(nodeType)) {
              graphElementInputFieldHandler(target, nodeId, "node", userGraph, nodeElementInactiveSetter, updateGraph);
            }
          }
        }
      }, 200);
    };
  }

  private createEdgeInteractionHandler() {
    /**
     * This function injects the necessary data into the NodeInteraction callback handler,
     * due to the change of context of the `this`-keyword and returns the callback handler.
     */
    const storeObject = unref(this.storeObject);
    const componentPath = this.serialisedTaskComponentPath;
    const serialiser = this.serialiser;
    const graphOptions = this.graphOptions;

    const nodeElementActiveSetter = this.createGraphElementActiveSetter();
    const nodeElementInactiveSetter = this.createGraphElementInactiveSetter();
    const graphElementInputFieldHandler = this.createGraphElementInputFieldHandler();

    // TODO: repainting the graph results in attaching the event handler only to the outlines and text of the nodes
    // try to fix this by reattaching the event handler to the whole node after redrawing
    const updateGraph = (userGraph: Graph, actionDescriptor: string) => {
      storeObject.setProperty({
        path: `${componentPath}__component__userGraph`,
        value: userGraph.export(),
        metadata: { descriptor: actionDescriptor }
      });
      const dotUserGraph = serialiser.serialise(userGraph);
      storeObject.setProperty({
        path: `${componentPath}__component__dotUserGraph`,
        value: dotUserGraph,
        metadata: { descriptor: "updateDotUserGraph" }
      });
    };

    let isDoubleClick = false;

    // actual event handler
    return (event: Event) => {
      const { detail } = <MouseEvent>event;
      const serializedUserGraph = storeObject.getProperty(`${componentPath}__component__userGraph`);
      const userGraph = new Graph(graphOptions).import(serializedUserGraph);

      const target = <HTMLElement>event.currentTarget;
      // const activeEdge = document.querySelector("g.edge.active");

      // timeout is required to differentiate between double clicks and single clicks
      isDoubleClick = detail === 2 ? true : false;
      setTimeout(() => {
        const edgeId = <string>target.querySelector("title")?.textContent;
        // handle double click
        if (isDoubleClick) {
          userGraph.dropEdge(edgeId);
          updateGraph(userGraph, "dropEdge");
        } else {
          nodeElementActiveSetter(target);
          graphElementInputFieldHandler(target, edgeId, "edge", userGraph, nodeElementInactiveSetter, updateGraph);
        }
      }, 200);
    };
  }

  public validate(): void {}
}
