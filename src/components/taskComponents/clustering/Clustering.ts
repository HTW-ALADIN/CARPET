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

export interface ClusteringProps extends ComponentProps {
  graphID?: string | number;
}

export type ClusteringComponentType = "Clustering";

export interface serialisedClusteringDependencies extends SerialisedDependencies {
  Clustering?: TaskGraphPath;
}

export interface ClusteringDependencies extends ComponentDependencies {
  Clustering?: ComputedRef<string>;
}

export interface ClusteringComponentData extends ComponentData {
  Clustering?: string;
}

export interface SerializedClusteringComponent
  extends SerializedTaskComponent<ClusteringComponentType, ClusteringDependencies, ClusteringComponentData> {}

export class ClusteringComponent extends TaskComponent<
  SerializedClusteringComponent,
  serialisedClusteringDependencies,
  ClusteringDependencies,
  ClusteringComponentData
> {
  /**
   * The ClusteringComponent class is a derived taskComponent, that is a template for actual CARPET UI-Elements.
   */
  public validate() {
    let isValid = true;
    unref(this.storeObject).setProperty({ path: `${this.serialisedTaskComponentPath}__isValid`, value: isValid });

    return isValid;
  }
}
