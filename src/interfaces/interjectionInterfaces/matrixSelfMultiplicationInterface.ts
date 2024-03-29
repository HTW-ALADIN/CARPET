import type { IInterjection, taskGraphPath } from "@/interfaces/TaskGraphInterface";

export interface IMatrixSelfMultiplication extends IInterjection {
  dependencies: { baseMatrix: taskGraphPath; n: taskGraphPath; secondaryNeedsVector: taskGraphPath };
}
