<template>
  <!-- element to render the DOTGraph in -->
  <div class="dotGraph" :id="completeGraphID"></div>
</template>

<script lang="ts" setup>
import { onMounted, watch, toRefs, unref } from "vue";
import { DOTGraphComponent } from "@/components/DOTGraph/DOTGraph";
import type { DOTGraphProps } from "@/components/DOTGraph/DOTGraph";
import * as d3 from "d3";

import { graphviz } from "d3-graphviz";

/**
 * as defineProps is not available at runtime, destructuring props reactively needs to be done in two steps
 * https://github.com/vuejs/core/issues/4994#issuecomment-984311639
 * */
const props = defineProps<DOTGraphProps>();
const reactiveProps = toRefs(props);
const { storeObject, componentID, componentPath, graphID } = reactiveProps;

const component = new DOTGraphComponent(storeObject, unref(componentID), unref(componentPath));
const componentData = component.getComponentData();
const dependencies = component.loadDependencies();

const completeGraphID = unref(graphID)
  ? `graph_${unref(componentID)}_${unref(graphID)}`
  : `graph_${unref(componentID)}_default`;

const getDOTDescription = () => {
  const dependencies = component.loadDependencies();
  // TODO: perhaps handle user Error for DJINN?
  // -> throw Error and propagate to user?
  if (unref(unref(dependencies).dotDescription)) return unref(unref(dependencies).dotDescription);
  // fallback to componentData
  if (unref(componentData) && unref(componentData).dotDescription) return unref(componentData).dotDescription;
  // fallback to empty String
  return "";
};

const renderGraph = (description: string) => {
  // TODO: causes the error: "transition.js:17 Uncaught Error: transition 5 not found"
  // does not impair functionality - look into it later
  const transition = () => {
    return d3.transition("animateGraph").duration(150).ease(d3.easeLinear);
  };

  graphviz(`#${completeGraphID}`, {
    fit: true,
    zoom: false,
    useWorker: false
  })
    .transition(() => transition())
    .renderDot(description);
};

const renderIfGraph = () => {
  let dotDescription = "";
  if (component.validate()) {
    dotDescription = <string>getDOTDescription();
  }
  renderGraph(dotDescription);
};

// TODO: check for better reactivity method to react to deeply nested states when swapping to Pinia
// const unsubscribe = unref(storeObject).store.subscribe(
//   (action: { type: string; payload: { path: string } }, state: object) => {
//     if (action.type === "SET_PROPERTY") {
//       if (action.payload.path === dependencyPaths.dotDescription) {
//         renderIfGraph();
//       }
//     }
//   }
// );
// onBeforeUnmount(() => {
//   unsubscribe();
// });

watch(
  () => dependencies.value.dotDescription,
  () => {
    renderIfGraph();
  }
);

onMounted(() => {
  renderIfGraph();
});
</script>

<style>
.dotGraph {
  display: flex;
  justify-items: center;
  align-content: center;
  width: 100%;
  height: 100%;
}

.dotGraph > svg {
  display: flex;
  justify-items: center;
  align-content: center;
  width: 100%;
  height: 100%;
}

.graph {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style>
