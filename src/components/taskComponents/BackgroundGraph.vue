<template>
  <div class="wrapper">
    <ContourPlot class="background" :componentID="componentID" :storeObject="storeObject" />
    <DOTGraph class="foreground" :componentID="componentID" :storeObject="storeObject" :componentPath="componentPath" />
  </div>
</template>

<script>
import { onMounted, computed, unref } from "vue";
import ContourPlot from "@/components/taskComponents/ContourPlot.vue";
import DOTGraph from "@/components/taskComponents/DOTGraph/DOTGraph.vue";

export default {
  props: {
    componentID: Number,
    storeObject: Object
  },
  components: {
    DOTGraph,
    ContourPlot
  },
  setup(props) {
    const { getProperty } = unref(props).storeObject;
    const currentNode = computed(() => getProperty("currentNode"));
    const componentPath = `nodes__${currentNode.value}__components__${props.componentID}__nestedComponents__DOTGraph`;
    return {
      componentPath
    };
  }
};
</script>

<style scoped>
.foreground {
  position: absolute;
  z-index: 2;
  top: 0;
}
</style>
