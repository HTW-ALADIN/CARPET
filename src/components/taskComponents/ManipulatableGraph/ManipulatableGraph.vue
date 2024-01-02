<template>
  <ContextMenu :componentId="componentID" :methods="selectedMethods" :storeObject="storeObject">
    <div :class="componentHTMLClass">
      <DOTGraph
        :style="props.style ?? {}"
        v-bind="{ componentID, storeObject, componentPath: nestedComponentPaths.DOTGraph, graphID: 'epc' }"
      />
    </div>
  </ContextMenu>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, toRefs, unref, watch } from "vue";
import DOTGraph from "@/components/taskComponents/DOTGraph/DOTGraph.vue";
import ContextMenu from "@/components/taskComponents/mixins/ContextMenu.vue";
import { pollDOMElementRender } from "@/helpers/HelperFunctions";
import { getSelectedMethods } from "@/helpers/getSelectedMethods";
import { ManipulatableGraphComponent } from "@/components/taskComponents/ManipulatableGraph/ManipulatableGraph";
import type { ComponentProps } from "@/components/taskComponents/TaskComponent";

// set props
const props = defineProps<ComponentProps>();
const reactiveProps = toRefs(props);
const { storeObject, componentID, componentPath } = reactiveProps;
const { getProperty, setProperty } = unref(storeObject);

// initialize component
const component = new ManipulatableGraphComponent(storeObject, unref(componentID), unref(componentPath));
const nestedComponentPaths = component.getNestedComponentPaths();
const currentNode = component.getCurrentTaskGraphNode();
const componentHTMLClass = component.componentHTMLClass;

// load dependencies
const dependencies = component.loadDependencies();
const dependencyPaths = component.getDependencyPaths();

const validationData = unref(dependencies).validationData;
const droppedElements = unref(dependencies).droppedElements;
const dragElements = unref(dependencies).dragElements;

// watch for droppedElements
// if dropedElement is node, add node to graph
watch(droppedElements, (newElements) => {
  if (newElements.length) {
    for (const newElement of newElements) {
      const template = unref(dragElements)[newElement].dropData.template;

      component.addNode(template, unref(componentPath));
    }
    // empty droppedElements
    unref(storeObject).setProperty({
      path: dependencyPaths.droppedElements,
      value: []
    });
  }
});

onMounted(() => {
  // pollDOMElementRender(".manipulatableGraph .node", assignEventHandlers);
  // set handler for node interactions
  pollDOMElementRender(
    `.${componentHTMLClass} g.node`,
    component.assignNodeInteractionHandlers(`.${componentHTMLClass} g.node`)
  );
  pollDOMElementRender(
    `${componentHTMLClass} g.edge`,
    component.assignEdgeInteractionHandlers(`.${componentHTMLClass} g.edge`)
  );
  component.validate();
});
onUnmounted(() => {});

// TODO: implement methods
const methods = {
  showSolution: () => {
    const solution = unref(validationData);
    setProperty({ path: dependencyPaths.dotDescription, value: solution });
    pollDOMElementRender(`.${componentHTMLClass} .node`, () =>
      Array.from(document.querySelectorAll("g.node")).forEach((node) => node.setAttribute("pointer-events", "visible"))
    );
    component.validate();
  }
};
const selectedMethods = getSelectedMethods(
  getProperty(`nodes__${currentNode}__components__${props.componentID}__methods`),
  methods
);
</script>

<style scoped>
.ManipulatableGraph {
  width: 100%;
  height: 100%;
}
</style>
