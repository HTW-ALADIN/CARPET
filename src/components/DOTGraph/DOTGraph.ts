import type {
  SerializedTaskComponent,
  SerialisedDependencies,
  ComponentDependencies,
  TaskGraphPath,
  ComponentProps,
  ComponentData
} from "@/components/TaskComponent";
import { TaskComponent } from "@/components/TaskComponent";
import type { ComputedRef } from "vue";
import { unref } from "vue";

export interface DOTGraphProps extends ComponentProps {
  graphID?: string | number;
}

export type DOTGraphComponentType = "DOTGraph";

export interface SerializedDOTGraphDependencies extends SerialisedDependencies {
  dotDescription?: TaskGraphPath;
}

export interface DOTGraphDependencies extends ComponentDependencies {
  dotDescription?: ComputedRef<string>;
}

export interface DotGraphComponentData extends ComponentData {
  dotDescription?: string;
}

export interface SerializedDOTGraphComponent
  extends SerializedTaskComponent<DOTGraphComponentType, SerializedDOTGraphDependencies, DotGraphComponentData> {}

export class DOTGraphComponent extends TaskComponent<
  SerializedDOTGraphComponent,
  SerializedDOTGraphDependencies,
  DOTGraphDependencies,
  DotGraphComponentData
> {
  /**
   * The DOTGraphComponent class is a derived taskComponent, that display a Graph written in the Graphviz-DOT language.
   */
  public validate() {
    let isValid = false;
    const dependencies = this.loadDependencies();
    if (unref(unref(dependencies).dotDescription) !== "") isValid = true;
    unref(this.storeObject).setProperty({ path: `${this.serialisedTaskComponentPath}__isValid`, value: isValid });

    return isValid;
  }
}
