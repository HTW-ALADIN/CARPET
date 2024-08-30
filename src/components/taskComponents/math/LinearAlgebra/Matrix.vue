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
          />
        </td>
      </tr>
    </table>
  </ContextMenu>
</template>

<script lang="ts">
import { onMounted, computed, watch } from "vue";
import { Matrix } from "@/helpers/LinearAlgebra";
import MatrixField from "@/components/taskComponents/math/LinearAlgebra/MatrixField.vue";
import type { IMatrixInstruction } from "@/interfaces/componentInterfaces/MatrixInterface";
import ContextMenu from "@/components/taskComponents/mixins/ContextMenu.vue";
import type { IMethodsDefinition } from "@/interfaces/TaskGraphInterface";
import { getSelectedMethods } from "@/helpers/getSelectedMethods";

export default {
  props: { componentID: Number, storeObject: Object },
  components: {
    ContextMenu,
    MatrixField
  },
  setup(props) {
    const { store, getProperty, setProperty } = props.storeObject;
    const currentNode = computed(() => store.state.currentNode);
    const currentTask = computed(() => getProperty("currentTask"));
    const componentPath = `nodes__${currentNode.value}__components__${props.componentID}__component`;

    const dependencyPaths = getProperty(`nodes__${currentNode.value}__components__${props.componentID}__dependencies`);
    const dependencies = computed(() => {
      return Object.entries(dependencyPaths.Matrix).map(([dependency, dependencyPath]) => getProperty(dependencyPath));
    });

    const isReadOnly = getProperty(`${componentPath}__readOnly`);
    const instructions = getProperty(`${componentPath}__initialize`);
    const inputType = getProperty(`${componentPath}__inputType`);
    const rowLabelPath = getProperty(`${componentPath}__rowLabel`);
    const columnLabelPath = getProperty(`${componentPath}__columnLabel`);
    // TODO set interface in proper component
    /* interface MatrixValidationConfig {
      instruction: string;
      parameters: {
        [key: string]: string; (JSONPath)
      };
      correctOn: ValidityMatrix; (Matrix that contains validity of each field - or null)
      validOn: ValidityMatrix; (Matrix that contains validity of each field - or null)
      apiMethod?: string; Should only allow post
      payLoad?: "Matrix" | "Field";
    }
    interface ValidityMatrix extends Array<Array<boolean | null>>;
    */
    const validationConfig = getProperty(`nodes__${currentNode.value}__components__${props.componentID}__validationConfig`);
    const rowLabel = computed(() => {
      if (rowLabelPath) return getProperty(rowLabelPath);
      else return [];
    });
    const columnLabel = computed(() => {
      if (rowLabelPath) return getProperty(columnLabelPath);
      else return [];
    });

    const userData = computed(() => loadData(`${componentPath}__userData`));
    const solutionData = computed(() => loadData(`${componentPath}__solutionData`));
    const validationData = computed(() => loadData(`${componentPath}__validationData`));

    const initialize = async (instructions: IMatrixInstruction) => {
      Object.entries(instructions).forEach(([name, instructions]) => {
        // TODO: change replay functionality for stepping in task to apply incremental changes behind loading screen
        // fix for presentation; REMOVE AFTERWARDS
        if (name === "user" && getProperty("restoredFromReplay")) {
          return;
        }

        const strip = (v: string) => JSON.parse(JSON.stringify(v));
        const { paths, operations } = instructions;

        let delay = false;
        const matrices = paths.reduce((matrices: { [key: string]: any }, path: string) => {
          let matrix = strip(getProperty(`${path}`));
          // need to wait for components to be computed fully, before initializing depending component
          if (matrix === null) {
            delay = true;
            matrices[path] = new Matrix(...[[]]);
            return matrices;
          }

          if (matrix.length == 1) matrix = matrix[0].map((scalar: number) => [scalar]);

          matrices[path] = new Matrix(...matrix);
          return matrices;
        }, {} as { [key: string]: any });

        if (delay) return;

        // execute operation on matrices
        // if operation is chained, execute on the matrices listed in the paths
        // otherwise execute on "result"
        // result is initialized as the matrix with the first path
        // otherwise result is set by the result of the previous operation
        let resultMatrix = operations.reduce((result: any, operation: string) => {
          const { name: operationName, args } = JSON.parse(JSON.stringify(operation));
          if (args.includes("chain")) {
            let matrix = result;
            for (let j = 1; j < paths.length; j++) {
              const path = paths[j];
              matrix = matrix[operationName](matrices[path]);
            }
            return matrix;
          }

          return result[operationName](...args);
        }, matrices[paths[0]]);

        if (resultMatrix === undefined) {
          resultMatrix = new Matrix(...[[]]);
        }
        setProperty({ path: `${componentPath}__${name}Data`, value: resultMatrix.getRows() });
      });
    };

    onMounted(async () => {
      if ((dependencies.value && !userData.value) || !userData.value.length) {
        initialize(instructions);
      }
      // TODO: replace with call to validateMatrix, once below TODO is solved
      validateMatrixHacked();
    });

    watch(
      dependencies,
      async () => {
        initialize(instructions);
        if (props.componentID == 3) {
          console.log("DEPENDENCY UPDATE", props.componentID, dependencies.value);
        }
      },
      { deep: true }
    );

    const loadData = (path) => {
      const data = getProperty(path);
      if (data) {
        if (data.length > 1) return data;
        return data[0].map((scalar) => [scalar]);
      } else return [];
    };

    const validateMatrix = () => {
      const validity = { isValid: true, isCorrect: true };
      if (isReadOnly) return validity;

      let earlyStop = false;
      for (const column of validationData.value) {
        if (earlyStop) break;
        for (const elementValidity of column) {
          const { isValid, isCorrect } = elementValidity;

          if (isCorrect === false) {
            validity.isCorrect = isCorrect;
          }

          if (isValid === false) {
            validity.isValid = false;
            earlyStop = true;
            break;
          }
        }
      }
      return validity;
    };

    const externalValidation = async () => {
      const validity = { isValid: true, isCorrect: true };
      if (isReadOnly) return validity;

      const validationData = getProperty(`${componentPath}__validationData`).value;

      let earlyStop = false;
      for (let i = 0; i < validationData.length; i++) {
        if (earlyStop) break;
        const validationColumn = validationData[i];
        for (let j = 0; j < validationColumn.length; j++) {
          const isCorrect = validationColumn[j];
          const isSet = validationColumn[j] !== null ? true : false;

          if (isCorrect === false) {
            validity.isCorrect = isCorrect;
          }
          if (isSet === false) {
            validity.isCorrect = false;
            validity.isValid = false;
            earlyStop = true;
            break;
          }
        }
      }

      return validity;
    };

    // TODO: figure out why all validationData isValid-fields are being set to true, even if only one MatrixField is being manipulated
    const validateMatrixHacked = () => {
      const validity = { isValid: true, isCorrect: true };
      if (isReadOnly) return validity;

      let earlyStop = false;
      for (let i = 0; i < solutionData.value.length; i++) {
        if (earlyStop) break;
        const solutionColumn = solutionData.value[i];
        for (let j = 0; j < solutionColumn.length; j++) {
          const userValue = userData.value[i][j];
          const solutionValue = solutionData.value[i][j];
          const isCorrect = userValue === solutionValue;
          const isSet = userData.value[i][j] != null;

          if (isCorrect === false) {
            validity.isCorrect = isCorrect;
          }
          if (isSet === false) {
            validity.isCorrect = false;
            validity.isValid = false;
            earlyStop = true;
            break;
          }
        }
      }
      return validity;
    };

    // TODO: enable again, once above TODO is solved
    // watch(
    //   validationData,
    //   () => {
    //     const { isValid, isCorrect } = validateMatrix();
    //     setProperty({
    //       path: `nodes__${currentNode.value}__components__${props.componentID}__isValid`,
    //       value: isValid
    //     });
    //     setProperty({
    //       path: `nodes__${currentNode.value}__components__${props.componentID}__isCorrect`,
    //       value: isCorrect
    //     });
    //   },
    //   { deep: true }
    // );

    // TODO: delete, once above TODO is solved
    watch(
      userData,
      async () => {
        let { isValid, isCorrect } = { isValid: false, isCorrect: false };
        if (validationConfig) {
          ({ isValid, isCorrect } = await externalValidation());
        } else {
          ({ isValid, isCorrect } = validateMatrixHacked());
        }

        setProperty({
          path: `nodes__${currentNode.value}__components__${props.componentID}__isValid`,
          value: isValid
        });
        setProperty({
          path: `nodes__${currentNode.value}__components__${props.componentID}__isCorrect`,
          value: isCorrect
        });
      },
      { deep: true }
    );

    const methods = {
      fillZeros: () => {
        const solution = JSON.parse(JSON.stringify(getProperty(`${componentPath}__solutionData`)));
        const userData = JSON.parse(JSON.stringify(getProperty(`${componentPath}__userData`)));
        solution.forEach((row, i) =>
          row.map((value, j) => {
            if (value === 0) setProperty({ path: `${componentPath}__userData__${i}__${j}`, value });
            else setProperty({ path: `${componentPath}__userData__${i}__${j}`, value: userData[i][j] });
          })
        );
      },
      showSolution: () => {
        const solution = JSON.parse(JSON.stringify(getProperty(`${componentPath}__solutionData`)));
        solution.forEach((row, i) =>
          row.map((value, j) => {
            setProperty({ path: `${componentPath}__userData__${i}__${j}`, value });
          })
        );
      },
      copyToClipboard: () => {
        const csv = userData.value.map((row) => row.join(";") + ";").join("\n");
        window.navigator.clipboard.writeText(csv);
      }
    };
    const selectedMethods = getSelectedMethods(
      <IMethodsDefinition>getProperty(`nodes__${currentNode.value}__components__${props.componentID}__methods`),
      methods
    );

    return {
      id: props.componentID,
      solutionData,
      userData,
      rowLabel,
      columnLabel,
      isReadOnly,
      selectedMethods: selectedMethods,
      inputType
    };
  }
};
</script>

<style scoped>
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
  /* writing-mode: vertical-rl; */
  /* text-orientation: upright; */
  /* transform: rotate(180deg); */
  /* display: flex; */
  /* align-items: center; */
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
