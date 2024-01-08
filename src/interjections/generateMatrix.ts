import type { IStore } from "@/helpers/TaskGraphUtility";
import type { ILayouts, IComponent } from "@/interfaces/TaskGraphInterface";
import type { IMatrixSelfMultiplication } from "@/interfaces/interjectionInterfaces/matrixSelfMultiplicationInterface";
import { getCurrentTaskNode } from "@/interjections/interjectionHandler";

export const generateMatrix = (
  storeObject: IStore,
  dependencies: any,
  component_id: string = ""
) => {
  const { getProperty, setProperty, store } = storeObject;

  const taskNode = getCurrentTaskNode(storeObject);
  const nodeComponents = JSON.parse(JSON.stringify(taskNode.components));

  const currentNodeId = store.state.currentNode;

  const baseMatrix = getProperty(dependencies.baseMatrix);
  const baseMatrixId = dependencies.baseMatrixId;
  console.log(baseMatrixId);
  // -1 due to the baseMatrix already existing
  const n = getProperty(dependencies.n) - 1;

  const createDistanceMatrix = (baseMatrix: IComponent, currentNodeId: number, MatrixId: number, n: number) => {
    const clonedMatrix = JSON.parse(JSON.stringify(baseMatrix));

    clonedMatrix.dependencies.Matrix.data = `taskData__DigraphIteration${n}`;
    clonedMatrix.isValid = false;
    clonedMatrix.component.readOnly = false;
    clonedMatrix.methods = {
      fillZeros: { description: "Ergänze Nullen", impact: 0.5 },
      showSolution: {
        description: "Zeige Lösung",
        impact: 0
      },
      copyToClipboard: {
        description: "Kopieren",
        impact: 1
      }
    };
    clonedMatrix.component.initialize.solution.paths = [`taskData__DigraphIteration${n}`];

    // uneven matrices are required to be filled by the user
    // thus reset validationData
    //console.log(n)
    clonedMatrix.component.initialize.validation.paths = [`taskData__DigraphIteration${n}`];
    clonedMatrix.component.initialize.user.paths = [`taskData__DigraphIteration${n}`];

    return clonedMatrix;
  };

  const adaptLayouts = (layouts: ILayouts, componentId: number, verticalFactor: number) => {
    const newlayouts = Object.entries(layouts).reduce((newLayouts, [layoutSize, layout]) => {
      const baseMatrixCoordinates = layout.filter((component: any) => 
      {
        return component.i == baseMatrixId
        })[0];
      console.log(baseMatrixCoordinates);
      console.log(layout, layoutSize);
      console.log(baseMatrixId);
      const newLayout = [
        ...layout,
        {
          ...baseMatrixCoordinates,
          i: componentId,
          y: baseMatrixCoordinates.y + baseMatrixCoordinates.h * verticalFactor,
          x: baseMatrixCoordinates.x
        }
      ];
      newLayouts[layoutSize] = newLayout;
      
      return newLayouts;
    }, {} as ILayouts);

    //console.log(layouts, newlayouts);

    return newlayouts;
  };

  let layouts: ILayouts = taskNode.layouts;

  const MatrixId = baseMatrixId;
  let currentMatrixId = MatrixId;

  for (let i = 1; i <= n; i++) {
    // create i'th multiplication matrix
    //nodeComponents[currentMatrixId] = JSON.parse(JSON.stringify(baseMatrix));
    currentMatrixId = currentMatrixId + 1;

    // create i'th multiplied matrix
    nodeComponents[currentMatrixId] = createDistanceMatrix(baseMatrix, currentNodeId, currentMatrixId, i);
    console.log(nodeComponents[currentMatrixId]);
    layouts = adaptLayouts(layouts, currentMatrixId, 1);
  }

  //console.log(layouts[2]);

  // nodeComponents[secondaryRequirementsVectorId] = setSecondaryNeedsVectorSolutionCalculationPaths(
  //   secondaryNeedsVector,
  //   currentNodeId,
  //   primaryRequirementsVectorId
  // );
  setProperty({ path: `nodes__${currentNodeId}__layouts`, value: layouts });
  setProperty({ path: `nodes__${currentNodeId}__components`, value: nodeComponents });
};
