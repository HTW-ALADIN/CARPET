<template>
  <ContextMenu :componentId="id" :methods="selectedMethods" :storeObject="storeObject">
    <table :id="`matrix_${id}`" class="matrix">
      <tr v-if="columnLabel && columnLabel.length">
        <p class="placeholder">&nbsp;</p>
        <!--zakaria span mouseover-->
        <th v-for="(label, i) in columnLabel" :key="i" @mouseover="handleMouseOver(i)" @mouseleave="handleMouseLeave">
          <p class="matrix_label column_label">{{ label }}</p>
          <span v-show="tooltipVisible && hoveredColumn === i" id="tooltiptext">{{ tooltipMessage }}</span>
        </th>
      </tr>
      <tr v-for="(row, i) in userData" :key="i">
      <th v-if="rowLabel && rowLabel.length">
        <p  v-if="rowAnzahl != undefined" class="matrix_label row_label">{{ rowLabel[0] +" "+(i+1)}}</p>
        <p  v-else class="matrix_label row_label"> {{ rowLabel[i]  }}</p>
      </th>
      <td class="matrix_element" v-for="(element, j) in userData[i]" :key="j">
        <!-- zakaria min max-->
        <MatrixField
          :min="getMinValueForColumn(columnLabel[j])"
          :max="getMaxValueForColumn(columnLabel[j])"
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
import { onMounted, computed, watch, ref , watchEffect} from "vue";
import { Matrix } from "@/helpers/LinearAlgebra";
import MatrixField from "@/components/taskComponents/math/LinearAlgebra/MatrixField.vue";
import type { IMatrixInstruction } from "@/interfaces/componentInterfaces/MatrixInterface";
import ContextMenu from "@/components/taskComponents/mixins/ContextMenu.vue";
import type { IMethodsDefinition } from "@/interfaces/TaskGraphInterface";
import { getSelectedMethods } from "@/helpers/getSelectedMethods";
import { isInteger } from "lodash";
//import DualSlider from "../../form/DualSlider.vue";



export default {
  props: { componentID: Number, 
            storeObject: Object,
          },
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

    //muss vor dem Aufruf stehen
    const loadData = (path) => {
      const data = getProperty(path);
      if (data) {
        if (data.length > 1) return data;
        return data[0].map((scalar) => [scalar]);
      } else return [];
    };

    const userData = computed(() => loadData(`${componentPath}__userData`));
    const solutionData = computed(() => loadData(`${componentPath}__solutionData`));
    const validationData = computed(() => loadData(`${componentPath}__validationData`));

    //************************************************************ Zakaria ************************************/
    let rowAnzahl = undefined;
    let standardZeile = undefined;
    let newData = []; // Initialisiere ein neues Array, um die duplizierten Daten zu speichern
    // Überprüfen, ob die Property für die Anzahl der Zeilen existiert
    const rowAnzahlCheck = getProperty(`${componentPath}__rowAnzahl`);
    if (rowAnzahlCheck != null) {
      // die Anzahl der Zeilen laden
      rowAnzahl = computed(() => loadIntZahl(getProperty(`${componentPath}__rowAnzahl`)));
      standardZeile = computed(() => loadData(`${componentPath}__standardZeile`));
      // Funktion, um eine Integer-Attribut zu laden
      const loadIntZahl = (path) => {
        const data = getProperty(path);
        return data;
      };
    }
    
    
    
    let i = 0; // Zähler für die Schleife
    // Überwacht Änderungen an 'rowAnzahl' und aktualisiert 'newData' entsprechend
    watchEffect(() => {

      // Überprüfen, ob 'rowAnzahl' definiert ist
      if (rowAnzahl != undefined) {
        // Wenn 'rowAnzahl.value' größer oder gleich dem aktuellen Wert von 'i' ist
        if (rowAnzahl.value >= i) {
          // Schleife von 'i' bis 'rowAnzahl.value' 

          for (i; i < rowAnzahl.value; i++) {
            // Füge 'standardSpalte' zu 'newData' hinzu
            newData.push([...standardZeile?.value]);
            //console.log(standardSpalte);
            }
        } 
        // Wenn 'rowAnzahl.value' kleiner als 'i' aber größer oder gleich 0 ist
        else if (rowAnzahl.value < i && rowAnzahl.value >= 0) {
          // Entferne die überschüssigen Elemente aus 'newData'
          newData.splice(rowAnzahl.value, i - rowAnzahl.value);
          // Setze 'i' auf den neuen Wert von 'rowAnzahl.value'
          i = rowAnzahl.value;
        }
        setProperty({ path: `${componentPath}__userData`, value: newData });
      }
    });


    // Min- und Max-Werte für jede Spalte  überwachen
    // Erstelle ein computed-Property, das die Daten für die Spaltenbereiche lädt
    const columnRange = computed(() => loadColumnRangeData(`${componentPath}__columnRange`));

    // Funktion zum Laden der Spaltenbereichsdaten
    const loadColumnRangeData = (path) => {
        // Holen Sie sich die Spaltenbereichsdaten
        const columnRangeData = getProperty(path);
        if (columnRangeData) {
            // Mappt die Daten auf ein Array von Objekten mit 'name', 'min' und 'max'
            return columnRangeData.map(item => ({
                name: item.name,
                min: Number(item.min), // Konvertieren Sie min zu einer Zahl
                max: Number(item.max)  // Konvertieren Sie max zu einer Zahl
            }));
        }
        // Gibt ein leeres Array zurück, wenn keine Daten vorhanden sind
        return [];
    };

    // Funktion zum Abrufen des Minimalwerts einer bestimmten Spalte
    const getMinValueForColumn = (columnName: string) => {
      const column = columnRange.value.find(c => c.name === columnName);
      return column ? column.min : null;
    };

    // Funktion zum Abrufen des Maximalwerts einer bestimmten Spalte
    const getMaxValueForColumn = (columnName: string) => {
      const column = columnRange.value.find(c => c.name === columnName);
      return column ? column.max : null;
    };

    // Tooltip-Status und -Nachricht verwalten
    const tooltipVisible = ref(false); // Steuerung, ob der Tooltip sichtbar ist
    const tooltipMessage = ref(''); // Nachricht, die im Tooltip angezeigt wird
    const hoveredColumn = ref(null); // Index der gerade überfahrenen Spalte

    // Funktion zum Handhaben des Mouseover-Ereignisses
    const handleMouseOver = (index: number) => {
      const columnName = columnLabel.value[index]; // Spaltenname basierend auf dem Index abrufen
      const minValue = getMinValueForColumn(columnName); // Minimalwert für die Spalte abrufen
      const maxValue = getMaxValueForColumn(columnName); // Maximalwert für die Spalte abrufen
      tooltipMessage.value = `Min: ${minValue}, Max: ${maxValue}`; // Tooltip-Nachricht setzen
      hoveredColumn.value = index; // Index der überfahrenen Spalte speichern
      tooltipVisible.value = true; // Tooltip sichtbar machen
    };

    // Funktion zum Handhaben des Mouseleave-Ereignisses
    const handleMouseLeave = () => {
      tooltipVisible.value = false; // Tooltip unsichtbar machen
      hoveredColumn.value = null; // Index der überfahrenen Spalte zurücksetzen
    };

    // Die Summe einer Spalte berechnen und überwachen
    // Erstelle ein computed-Property, das die maximalen Summendaten für die Spalten lädt
    const spaltenMaxSumme = computed(() => loadColumnMaxSummeData(`${componentPath}__spaltenMaxSumme`));

    // Funktion zum Laden der maximalen Summendaten für die Spalten
    const loadColumnMaxSummeData = (path) => {
        // Holen Sie sich die Spaltenmaximale Summendaten
        const columnData = getProperty(path);
        if (columnData) {
            // Mappt die Daten auf ein Array von Objekten mit 'spaltenName' und 'maxSumme'
            return columnData.map(item => ({
                spaltenName: item.spaltenName,
                maxSumme: item.maxSumme
            }));
        }
        // Gibt ein leeres Array zurück, wenn keine Daten vorhanden sind
        return [];
    };

    const spaltenMaxSummeUeberwachen = () => {
    // Überprüfen, ob 'spaltenMaxSumme' nicht leer ist
    if (spaltenMaxSumme.value.length != 0) {
      const MatrixData =userData.value;

      // Abrufen der maximalen Summendaten für die Spalten
      const spaltenMaxSummeValue = spaltenMaxSumme.value;
      // Iteriere über jede Spalte in spaltenMaxSummeValue
      spaltenMaxSummeValue.forEach(spalte => {
        // Suche den Index des Spaltennamens in columnLabel.value
        const index = columnLabel.value.findIndex(name => name === spalte.spaltenName);

        // Prüfe, ob der Spaltenname gefunden wurde
        if (index !== -1) {
          
          // Berechnen Sie die Summe der Werte in der Spalte
          let sum:number = 0;
          for (let j = 0; j < MatrixData.length; j++) {
            // Zugriff auf den Wert jeder Zeile basierend auf der Spaltenindex
            let value:number = Number(MatrixData[j][index]);
            sum += value;
          }
          //console.log(`Spalte '${spalte.spaltenName}' gefunden an Index ${index}. Maximale Summe: ${spalte.maxSumme}. sum: ${sum}`);
          if(sum > spalte.maxSumme){
            //alert(`Die Summe der Spalte '${spalte.spaltenName}' darf nicht größer als ${spalte.maxSumme}`);
            setProperty({ path: `${componentPath}__checkUserDataValidity`, value: "invalid" });
          }
          else{
            setProperty({ path: `${componentPath}__checkUserDataValidity`, value: "valid" });
          }
        } 
        else {
          console.log(`Spalte '${spalte.spaltenName}' nicht in columnLabel gefunden.`);
        }
      });
    }
  }

    //**********************************************************END ******************************************************************/


    
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
        console.log('hier'+ resultMatrix);
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
        spaltenMaxSummeUeberwachen();
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
      inputType,
      //***************************************************************zakaria***************************
      columnRange,
      getMinValueForColumn,
      getMaxValueForColumn,
      tooltipVisible,
      tooltipMessage,
      hoveredColumn,
      handleMouseOver,
      handleMouseLeave,
      rowAnzahl,
      newData,
      spaltenMaxSumme
      /********************************************************************end */
    };
  }
};
</script>

<style scoped>
/*********zakaria**************************** */
#tooltiptext {
  position: absolute;
  background-color: #f9f9f9;
  color: #333;
  border: 1px solid #ccc;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/********************END*************************** */


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
  writing-mode: horizontal-tb;
  /*
  writing-mode: vertical-rl;
   text-orientation: upright; */
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
