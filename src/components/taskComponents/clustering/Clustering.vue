<template>
  <!-- element to render the VORLAGE in -->
  <div class="Clustering" :style="props.style ?? {}"></div>
</template>

<script lang="ts" setup>
import { toRefs, unref, computed, onBeforeUnmount } from "vue";
import { ClusteringComponent } from "@/components/taskComponents/clustering/Clustering";
import type { ClusteringProps } from "@/components/taskComponents/clustering/Clustering";

const props = defineProps<ClusteringProps>();
const reactiveProps = toRefs(props);
const { storeObject, componentID, componentPath } = reactiveProps;

const component = new ClusteringComponent(storeObject, unref(componentID), unref(componentPath));

const componentData = component.getComponentData();

const taskData = component.getTaskData();

const currentTaskGraphNode = component.getCurrentTaskGraphNode();

const dependencyPaths = component.getDependencyPaths();
</script>

<style></style>
