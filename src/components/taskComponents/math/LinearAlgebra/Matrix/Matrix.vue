<template>
  <ContextMenu :componentId="id" :methods="selectedMethods" :storeObject="storeObject">
    <table :id="`matrix_${id}`" class="matrix">
      <tr v-if="columnLabel && columnLabel.length">
        <p class="placeholder">&nbsp;</p>
        <th v-for="(label, i) in columnLabel" :key="i">
          <p class="matrix_label column_label">{{ label }}</p>
        </th>
      </tr>
      <tr v-for="(row, i) in userData" :key="i">
        <th v-if="rowLabel && rowLabel.length">
          <p class="matrix_label row_label">{{ rowLabel[i] }}</p>
        </th>
        <td class="matrix_element" v-for="(element, j) in userData[i]" :key="j">
          <MatrixField
            :rowIndex="i"
            :columnIndex="j"
            :storeObject="storeObject"
            :componentID="id"
            :isReadOnly="isReadOnly"
            :element="element"
            :inputType="inputType ?? 'number'"
            :taskComponent="taskComponent"
          />
        </td>
      </tr>
    </table>
  </ContextMenu>
</template>

<script lang="ts" setup>
import { onMounted, watch, toRefs, unref, computed, onBeforeUnmount } from "vue";
import { MatrixComponent } from "@/components/taskComponents/math/LinearAlgebra/Matrix/Matrix";
import type { MatrixProps } from "@/components/taskComponents/math/LinearAlgebra/Matrix/Matrix";

/**
 * as defineProps is not available at runtime, destructuring props reactively needs to be done in two steps
 * https://github.com/vuejs/core/issues/4994#issuecomment-984311639
 * */
const props = defineProps<MatrixProps>();
const reactiveProps = toRefs(props);
const { storeObject, componentID, componentPath } = reactiveProps;

const component = new MatrixComponent(storeObject, unref(componentID), unref(componentPath));

const componentData = component.getComponentData();
const taskData = component.getTaskData();
const dependencyPaths = component.getDependencyPaths();
const dependencies = component.loadDependencies();
</script>

<style>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.matrix {
  width: 100%;
  min-height: 100%;
  height: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.matrix .matrix_element {
  min-height: 100%;
  position: relative;
  border: 2px solid black;
}

.matrix input {
  top: 0px;
  position: absolute;
  width: 100%;
  min-height: 100%;
  font-size: 130%;
  text-align: center;
}

th {
  min-height: 100%;
  border: 2px solid black;
  background: #57636b;
  color: #b1b2b4;
}

.matrix_label {
  font-size: 130%;
  width: 100%;
  text-align: center;
}

.column_label {
  writing-mode: vertical-rl;
  /* text-orientation: upright; */
  /* transform: rotate(180deg); */
  display: flex;
  align-items: center;
}

.row_label {
  min-width: fit-content;
  margin: 0 auto;
}

.valid {
  background: green;
}

.invalid {
  background: red;
}

input[disabled] {
  background: lightgrey;
}
</style>