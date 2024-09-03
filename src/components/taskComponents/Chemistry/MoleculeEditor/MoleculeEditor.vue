<template>
  <div :id="component.jsmeID" class="jsmeContainer" :style="props.style ?? {}"></div>
</template>

<script lang="ts" setup>
import { toRefs, unref, onBeforeMount, onMounted } from "vue";
import { MoleculeEditorComponent } from "@/components/taskComponents/Chemistry/MoleculeEditor/MoleculeEditor";
import type { MoleculeEditorProps } from "@/components/taskComponents/Chemistry/MoleculeEditor/MoleculeEditor";

const props = defineProps<MoleculeEditorProps>();
const reactiveProps = toRefs(props);
const { storeObject, componentID, componentPath } = reactiveProps;

const component = new MoleculeEditorComponent(storeObject, unref(componentID), unref(componentPath));

onBeforeMount(async () => {
  // load JSME
  // await component.loadJSME();
});
onMounted(async () => {
  // wait for JSME to be fully loaded, then instantiate it and render it
  await component.instantiateJSME(props);
  // wait for JSME instance to be fully instantiated, then set the callback handlers
  component.setJSMECallbackHandler();
});

// TODO: implement watcher to render when smiles changes
</script>

<style>
.jsmeContainer {
  width: 100%;
  height: 100%;
}
</style>
