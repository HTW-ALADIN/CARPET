import type { IStore } from "@/helpers/TaskGraphUtility";
import { ensurePathExists } from "@/store/taskGraph";
import { unref, computed, ref } from "vue";
import type { Ref, ComputedRef, StyleValue } from "vue";

export type TaskGraphPath = string;

export interface SerialisedMethod {
  description: string;
  impact: number;
}

export interface SerialisedMethods {
  [methodName: string]: SerialisedMethod;
}

export interface MethodImplementation {
  (): void;
}

export interface MethodImplementations {
  [methodName: string]: MethodImplementation;
}

export interface ComponentProps {
  /**
   * The ID of the component in the current task graph node.
   */
  componentID: number;
  /**
   * The store object, that is used to store the task data.
   */
  storeObject: IStore;
  /**
   * The path in the taskGraph that points to the serialised component.
   */
  componentPath: TaskGraphPath;
  /**
   * Optionally passed styling for the component.
   */
  style?: StyleValue;
}

export type TaskComponentType = string;
export type SerialisedContextMenu = {
  isOpen: boolean;
  usedMethods: Array<string>;
};
export interface SerialisedDependencies {}
export type ComponentDependencies = Record<string, any>;
export interface NestedComponents {}
export interface ComponentData {}

export interface SerializedTaskComponent<
  T extends TaskComponentType = TaskComponentType,
  D extends SerialisedDependencies = SerialisedDependencies,
  C extends ComponentData = ComponentData,
  SM extends SerialisedMethods = SerialisedMethods,
  SC extends SerialisedContextMenu = SerialisedContextMenu,
  NC extends NestedComponents = NestedComponents
> {
  type: T;
  name: string;
  isValid: boolean;
  isCorrect: boolean;
  dependencies: D;
  component: C;
  methods?: SM;
  contextMenu?: SC;
  nestedComponents?: NC;
}

// TODO: keep an eye on https://github.com/microsoft/TypeScript/issues/10571 for better type inference
export abstract class TaskComponent<
  C extends SerializedTaskComponent = SerializedTaskComponent,
  SD extends SerialisedDependencies = SerialisedDependencies,
  D extends ComponentDependencies = ComponentDependencies,
  CD extends ComponentData = ComponentData,
  SM extends SerialisedMethods = SerialisedMethods,
  M extends MethodImplementations = MethodImplementations,
  NC extends NestedComponents = NestedComponents
> {
  /**
   * The TaskComponent class is the base class for all derived taskComponents that are referenced in the task graph.
   */
  protected serializedTaskComponent: ComputedRef<C>;
  protected currentNode: number;
  protected dependencies: ComputedRef<D>;

  constructor(
    protected storeObject: Ref<IStore>,
    protected componentID: number,
    protected serialisedTaskComponentPath: TaskGraphPath
  ) {
    this.serializedTaskComponent = this.getComputedTaskGraphProperty<C>(serialisedTaskComponentPath);

    this.currentNode = unref(this.getComputedTaskGraphProperty<number>("currentNode"));

    this.dependencies = this.loadDependencies();
  }

  public checkDependency(dependencyPath: string) {
    return computed(() => {
      if (dependencyPath) return ensurePathExists(dependencyPath);
      return false;
    });
  }

  public loadDependencies() {
    const dependencies = computed(() => {
      //   const dependencies: { [key: string]: any } = {};
      //   for (const [dependencyName, dependencyPath] of Object.entries(unref(this.serializedTaskComponent).dependencies)) {
      //     const dependencyExists = this.checkDependency(dependencyPath);
      //     const dependencyValue = unref(dependencyExists) ? this.getComputedTaskGraphProperty(dependencyPath) : null;
      //     // need to use Reflect.set, due to Typescript not being able to infer the type of a Generic type
      //     // this leads to typescript infering the type of the dependencyValue as any
      //     // https://github.com/microsoft/TypeScript/issues/47357#issuecomment-1364043084
      //     // Reflect.set(dependencies, dependencyName, dependencyValue);

      //     dependencies[dependencyName] = dependencyValue;
      //   }
      //   // alternatively cast to D, but this is not type safe
      //   return <D>dependencies;
      // });
      const dependencies: { [key: string]: any } = {};

      const dependencyPaths = this.getDependencyPaths();
      for (const [dependencyName, dependencyPath] of Object.entries(unref(dependencyPaths))) {
        const dependencyValue = unref(this.storeObject).getProperty(dependencyPath);
        dependencies[dependencyName] = dependencyValue;
      }
      return dependencies;
    });
    return <ComputedRef<D>>dependencies;
  }

  public getComponentData(): Ref<CD> {
    return <Ref<CD>>ref(unref(this.serializedTaskComponent).component);
  }

  public getSerializedComponent(): Ref<C> {
    return this.serializedTaskComponent;
  }

  public getTaskData(): TaskData {
    return this.getComputedTaskGraphProperty<TaskData>("taskData");
  }
  public getDependencyPaths(): SD {
    return <SD>unref(this.serializedTaskComponent).dependencies;
  }
  public getDependencies() {
    return this.dependencies;
  }
  public getCurrentTaskGraphNode(): number {
    return this.currentNode;
  }
  public getNestedComponents() {
    return unref(this.serializedTaskComponent).nestedComponents;
  }

  public getNestedComponentPaths() {
    const nestedComponents = this.getNestedComponents();
    const nestedComponentsPaths = <{ [nestedComponentName in KeyOfType<NC>]: TaskGraphPath }>{};
    for (const nestedComponentName in nestedComponents) {
      nestedComponentsPaths[
        nestedComponentName as KeyOfType<NC>
      ] = `${this.serialisedTaskComponentPath}__nestedComponents__${nestedComponentName}`;
    }
    return nestedComponentsPaths;
  }

  protected abstract validate(): void;

  public getComputedTaskGraphProperty = <T = any>(taskGraphPath: TaskGraphPath) => {
    return computed<T>(() => unref(this.storeObject).getProperty(taskGraphPath));
  };

  public getSelectedMethods = (methodImplementations: M): M => {
    const methods = <SM>unref(this.serializedTaskComponent).methods;
    return Object.entries(methods).reduce((selectedMethods, [methodName, methodDefinition]) => {
      const { description } = methodDefinition;
      return { ...selectedMethods, [description]: methodImplementations[methodName] };
    }, <M>{});
  };
}

export interface TaskData {
  [key: string]: any;
}

// see typescript issue https://github.com/microsoft/TypeScript/issues/23724
type KeyTypes<T> = {
  [K in keyof T]-?: K extends string ? string : K extends number ? number : K extends symbol ? symbol : never;
}[keyof T];
type KeyOfType<T, KeyType extends string | number | symbol = KeyTypes<T>> = Extract<keyof T, KeyType>;
