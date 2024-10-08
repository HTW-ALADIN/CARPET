import { matrixSelfMultiplication } from "@/interjections/matrixSelfMultiplication";
import { generateMatrix } from "@/interjections/generateMatrix";
import { formulaGenerator } from "@/interjections/FormulaGenerator";
import type { IStore } from "@/helpers/TaskGraphUtility";
import type { IInterjection } from "@/interfaces/TaskGraphInterface";

const interjectionMap: { [key: string]: Function } = {
  matrixSelfMultiplication,
  formulaGenerator,
  generateMatrix
};

export const interjectionHandler = async (
  storeObject: IStore,
  interjections: Array<IInterjection>,
  interjectionPath: string
) => {
  let i = 0;
  for (const interjection of interjections) {
    const { method, dependencies, applied, component_id } = interjection;
    if (applied) continue;
    if (Reflect.has(interjectionMap, method)) {
      await interjectionMap[method](storeObject, dependencies, component_id);
      storeObject.setProperty({ path: `${interjectionPath}__${i}__applied`, value: true });
    } else {
      try {
        const interjectionFunction = new Function(method);
        await interjectionFunction(storeObject, dependencies, component_id);
        storeObject.setProperty({ path: `${interjectionPath}__${i}__applied`, value: true });
      } catch (error) {
        throw new Error(`Unknown interjection method.\n${error}`);
      }
    }
    i++;
  }
};

export const getCurrentTaskNode = (storeObject: IStore) => {
  const { getProperty } = storeObject;

  const currentNode = getProperty(`currentNode`);
  const nodePath = `nodes__${currentNode}`;

  return getProperty(nodePath);
};

export const cloneComponent = (storeObject: IStore, dependency: string) => {
  const { getProperty } = storeObject;

  JSON.parse(JSON.stringify(getProperty(dependency)));
};
