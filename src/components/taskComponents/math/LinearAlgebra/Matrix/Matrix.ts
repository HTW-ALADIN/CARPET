import type {
  SerializedTaskComponent,
  SerialisedDependencies,
  ComponentDependencies,
  TaskGraphPath,
  ComponentProps,
  ComponentData
} from "@/components/taskComponents/TaskComponent";
import { TaskComponent } from "@/components/taskComponents/TaskComponent";
import type { ComputedRef } from "vue";
import { unref } from "vue";
import { Matrix } from "@/helpers/LinearAlgebra";

export interface MatrixProps extends ComponentProps {}

export type MatrixComponentType = "Matrix";

export interface SerializedMatrixDependencies extends SerialisedDependencies {}

export interface MatrixDependencies extends ComponentDependencies {}

export interface MatrixComponentData extends ComponentData {}

export interface SerializedMatrixComponent
  extends SerializedTaskComponent<MatrixComponentType, SerializedMatrixDependencies, MatrixComponentData> {}

export class MatrixComponent extends TaskComponent<
  SerializedMatrixComponent,
  SerializedMatrixDependencies,
  MatrixDependencies,
  MatrixComponentData
> {
  /**
   * The MatrixComponent class is a derived taskComponent, that allows for displaying Matrices with arbitrary values and mathematical operations in case of numerical values.
   */
  public validate() {
    let isValid = false;
    const dependencies = this.loadDependencies();
    if (unref(unref(dependencies).dotDescription) !== "") isValid = true;
    unref(this.storeObject).setProperty({ path: `${this.serialisedTaskComponentPath}__isValid`, value: isValid });

    return isValid;
  }
}

export interface MatrixFieldProps extends ComponentProps {
  rowIndex: number;
  columnIndex: number;
  isReadOnly: boolean;
  element: number;
  inputType: string;
  taskComponent: MatrixComponent;
}
