<template>
  <div class="canvas">
    <Navigation :storeObject="storeObject" />
    <Hint :storeObject="storeObject" />

    <div class="modals">
      <Modal v-for="(modal, i) in modals" :key="i" :storeObject="storeObject" :modalIndex="i" />
    </div>

    <div class="zoomWrapper">
      <grid-layout
        class="grid"
        v-model:layout="currentLayout"
        :col-num="columnAmount"
        :row-height="rowHeight"
        :is-draggable="true"
        :is-resizable="true"
        :vertical-compact="false"
        :use-css-transforms="true"
        :prevent-collision="true"
        @breakpoint-changed="() => {}"
        :key="layoutSize"
        :transform-scale="zoomScale"
        :is-bounded="true"
        :restore-on-drag="true"
      >
        <grid-item
          class="noPan"
          v-for="item in currentLayout"
          :key="nodeComponentIds[item.i]"
          :static="item.static"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :minW="parseInt(item.minW) ?? 1"
          :minH="parseInt(item.minH) ?? 1"
          :i="nodeComponentIds[item.i]"
          :drag-allow-from="`.${CONSTANTS.DRAGELEMENTCLASS}`"
          @move="setCoordinates"
          @resize="updateDimensions"
          :preserveAspectRatio="item.preserveAspectRatio ?? true"
          :data-id="nodeComponentIds[item.i]"
        >
          <img class="dragHandler" :class="CONSTANTS.DRAGELEMENTCLASS" src="/img/drag_arrow.webp" />
          <component
            :is="nodeComponents[nodeComponentIds[item.i]].type"
            :componentID="parseInt(nodeComponentIds[item.i])"
            :storeObject="storeObject"
            :componentPath="`nodes__${currentNode}__components__${parseInt(nodeComponentIds[item.i])}`"
          ></component>
        </grid-item>
      </grid-layout>
    </div>
  </div>
</template>

<script lang="ts">
import { onMounted, computed } from "vue";
import { GridLayout, GridItem } from "grid-layout-plus";
import panzoom from "@panzoom/panzoom";
import { interjectionHandler } from "@/interjections/interjectionHandler";
import { CONSTANTS } from "@/CARPET_config";

import MiniMap from "@/components/MiniMap.vue";
import Navigation from "@/components/Navigation.vue";
import Hint from "@/components/Hint.vue";
import TextArea from "@/components/TextArea.vue";
import Modal from "@/components/Modal.vue";

import Matrix from "@/components/taskComponents/math/LinearAlgebra/Matrix.vue";
import DOTGraph from "@/components/taskComponents/DOTGraph/DOTGraph.vue";
import DecisionTree from "@/components/taskComponents/DecisionTree/DecisionTree.vue";
import TaskConfiguration from "@/components/taskComponents/TaskConfiguration.vue";
import VisualGraphTraversal from "@/components/taskComponents/VisualGraphTraversal.vue";
import PathDisplay from "@/components/taskComponents/PathDisplay.vue";
import CodeEditor from "@/components/taskComponents/CodeEditor.vue";
import Output from "@/components/taskComponents/Output.vue";
import Dropdown from "@/components/taskComponents/Dropdown.vue";
import ContourPlot from "@/components/taskComponents/ContourPlot.vue";
import BackgroundGraph from "@/components/taskComponents/BackgroundGraph.vue";
import Equation from "@/components/taskComponents/math/Equation/Equation.vue";
import TexDisplay from "@/components/taskComponents/math/Equation/TexDisplay.vue";
import DijkstraTable from "@/components/taskComponents/dijkstra/DijkstraTable.vue";
import DijkstraGraph from "@/components/taskComponents/dijkstra/DijkstraGraph.vue";
import PlanGraph from "@/components/taskComponents/scheduling/PlanGraph.vue";
import EditableGraph from "@/components/taskComponents/EditableGraph.vue";
import GanttDiagram from "@/components/taskComponents/scheduling/GanttDiagram.vue";
import ManipulatableGraph from "@/components/taskComponents/ManipulatableGraph/ManipulatableGraph.vue";
import ItemPallet from "@/components/taskComponents/DragDrop/ItemPallet/ItemPallet.vue";
import MoleculeEditor from "@/components/taskComponents/Chemistry/MoleculeEditor/MoleculeEditor.vue";

export default {
  name: "Canvas",
  components: {
    MoleculeEditor,
    ItemPallet,
    ManipulatableGraph,
    BackgroundGraph,
    ContourPlot,
    MiniMap,
    Hint,
    Matrix,
    DOTGraph,
    DecisionTree,
    TaskConfiguration,
    GridItem,
    GridLayout,
    Navigation,
    VisualGraphTraversal,
    CodeEditor,
    Output,
    Dropdown,
    PathDisplay,
    Equation,
    TexDisplay,
    DijkstraTable,
    DijkstraGraph,
    TextArea,
    Modal,
    PlanGraph,
    EditableGraph,
    GanttDiagram
  },
  props: {
    storeObject: Object
  },
  setup(props) {
    const { getProperty, setProperty, store } = props.storeObject;
    const currentNode = getProperty("currentNode");

    // handle dynamic UI-elements which depend on the data generated at runtime
    const interjectionPath = `nodes__${currentNode}__interjections`;
    const interjections = getProperty(interjectionPath) || [];
    interjectionHandler(props.storeObject, interjections, interjectionPath);

    // load modals
    const modals = getProperty(`nodes__${currentNode}__modals`);

    // init layout
    const columnAmount = 60;
    const rowHeight = 10000 / columnAmount;
    const zoomScale = computed(() => getProperty("zoomScale"));
    const nodeComponents = computed(() => getProperty(`nodes__${currentNode}__components`));
    const nodeComponentIds = Object.keys(nodeComponents.value).map((componentId) => componentId);
    const layouts = computed(() => getProperty(`nodes__${currentNode}__layouts`));
    const layoutSize = computed(() => getProperty(`layoutSize`));
    const currentLayout = computed(() => {
      const layout = getProperty(`nodes__${currentNode}__layouts__${layoutSize.value}`);
      return layout;
    });

    // setup callbacks for grid functionalities (zoom, pan, drag, resize)
    const fixQuadraticItems = (
      ids: Array<number> = currentLayout.value.filter((item) => item.w === item.h).map((item) => item.i)
    ) => {
      if (!document.querySelector(".contourPlot")) return;
      setTimeout(() => {
        ids.forEach((id) => {
          const item: HTMLElement = document.querySelector(`.vgl-item[data-id="${id}"]`);
          item.style.height = item.style.width;
        });
      }, 75);
    };

    onMounted(() => {
      const zoomElement = <HTMLElement>document.querySelector(".zoomWrapper");
      const canvas = <HTMLElement>document.querySelector(".canvas");

      const panzoomInstance = panzoom(zoomElement, {
        excludeClass: "noPan",
        canvas: true,
        startX: -(<HTMLElement>document.querySelector(".zoomWrapper")).clientWidth / 2,
        startY: -(<HTMLElement>document.querySelector(".zoomWrapper")).clientHeight / 2,
        silent: false
      });
      window.panzoom = panzoomInstance;

      zoomElement.addEventListener("wheel", (event: WheelEvent) => {
        if (event.ctrlKey) {
          panzoomInstance.zoomWithWheel(event, { animate: true });
          const scale = panzoomInstance.getScale();
          setProperty({ path: "zoomScale", value: scale });
          store.dispatch("trackZooming", { scale, timestamp: new Date().getTime(), x: event.clientX, y: event.clientY });
          fixQuadraticItems();
        }
        event.preventDefault();
        event.stopPropagation();
      });

      zoomElement.addEventListener("panzoompan", (event: Event) => {
        const pan = panzoomInstance.getPan();
        // panzoomInstance.pan(pan.x, pan.y, { relative: true });
        store.dispatch("trackPanning", { ...pan, timestamp: new Date().getTime() });
      });

      canvas.addEventListener("wheel", (event: WheelEvent) => {
        event.preventDefault();
        event.stopPropagation();
      });

      fixQuadraticItems();
    });
    setProperty({ path: "zoomScale", value: 1.0 });

    const updateDimensions = (id: number, gridHeight: number, gridWidth: number) => {
      const path = `nodes__${currentNode}__layouts__${layoutSize.value}`;
      const layout = getProperty(path);
      const index = layout.findIndex((item) => item.i == id);
      setProperty({ path: `${path}__${index}`, value: { ...layout[index], w: gridWidth, h: gridHeight } });
      // https://github.com/jbaysolutions/vue-grid-layout/issues/575
      // window.dispatchEvent(new Event("resize"));
      fixQuadraticItems();
    };

    const setCoordinates = (i: number, x: number, y: number) => {
      const movedLayout = currentLayout.value.map((node) => {
        if (node.i == i) {
          node.x = x;
          node.y = y;
        }
        return node;
      });

      const path = `nodes__${currentNode}__layouts__${layoutSize.value}`;
      setProperty({ path, value: movedLayout });
      fixQuadraticItems();
    };

    return {
      layouts,
      zoomScale,
      updateDimensions,
      nodeComponents,
      currentLayout,
      columnAmount,
      rowHeight,
      setCoordinates,
      layoutSize,
      modals,
      nodeComponentIds,
      currentNode,
      CONSTANTS
    };
  }
};
</script>

<style scoped>
.canvas {
  width: 100vw;
  height: 100vw;
}
.zoomWrapper {
  width: 10000px;
  height: 10000px;
  border: 1px solid black;
}
/* GRID */
.grid {
  width: 10000px;
  min-height: 10000px;
}
.dragHandler {
  position: absolute;
  top: 5px;
  left: 5px;
  width: 20px;
  height: 20px;
  z-index: 999;
}

.vgl-layout {
  --vgl-placeholder-bg: red;
  --vgl-placeholder-opacity: 20%;
  --vgl-placeholder-z-index: 2;

  --vgl-item-resizing-z-index: 999;
  --vgl-item-resizing-opacity: 60%;
  --vgl-item-dragging-z-index: 999;
  --vgl-item-dragging-opacity: 100%;

  --vgl-resizer-size: 10px;
  --vgl-resizer-border-color: #444;
  --vgl-resizer-border-width: 2px;
}
.vgl-item {
  touch-action: none;
  border: solid 1px black;
  box-sizing: border-box;
  cursor: default;
  box-shadow: 2px 3px 9px 0px rgba(218, 21, 7, 1);
  box-shadow: 2px 3px 5px 0px rgba(8, 166, 60, 1);
  box-shadow: 2px 3px 9px 0px rgba(0, 0, 0, 1);
}
.vgl-item--resizing {
  opacity: 0.9;
}
.vgl-item .no-drag {
  height: 100%;
  width: 100%;
}
.vgl-item .add {
  cursor: default;
}
.vue-draggable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  top: 0;
  left: 0;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><circle cx='5' cy='5' r='5' fill='#999999'/></svg>")
    no-repeat;
  background-position: bottom right;
  padding: 0 8px 8px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: pointer;
}

:deep(.vgl-item:not(.vgl-item--placeholder)) {
  background-color: #f3f3f3;
  border: 1px solid black;
}

.vgl-item .vue-grid-placeholder {
  background: grey !important;
}

.vgl-layout::before {
  position: absolute;
  width: calc(100% - 5px);
  height: calc(100% - 5px);
  margin: 5px;
  content: "";
  background-image: linear-gradient(to right, lightgrey 1px, transparent 1px),
    linear-gradient(to bottom, lightgrey 1px, transparent 1px);
  background-repeat: repeat;
  background-size: calc(calc(100% - 5px) / 12) 40px;
}
</style>

<style>
.vue-resizable-handle {
  z-index: 999 !important;
}
</style>
