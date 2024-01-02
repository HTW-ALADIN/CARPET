import { defineStore } from "pinia";
import axios from "axios";
import type { State, Replay } from "@/interfaces/TaskGraphInterface";

const baseState = (): State => ({
  isLoading: false,
  currentTask: null,
  taskMode: null,
  layoutSize: "lg",
  currentNode: null,
  previousNode: null,
  rootNode: null,
  topology: [],
  edges: {},
  nodes: {},
  taskData: {},
  taskReplay: { steps: [], mouse: [], panning: [], zooming: [], meta: {} },
  restoredFromReplay: false
});

export const taskStore = defineStore("taskGraph", {
  state: () => baseState(),
  getters: {
    getPropertyFromPath: (state: State) => (path: string) => {
      if (typeof path !== "string") {
        throw new Error(`Path is not a string: ${path}`);
      }
      const splitPath = path.split("__");

      // Typescript makes it impossible to infer nested types dynamically, thus the any
      let subState: State | any = state;
      for (let depth = 0; depth < splitPath.length; depth++) {
        const key = splitPath[depth];
        if (subState && Object.keys(subState).includes(key)) {
          subState = subState[key];
        } else {
          throw new Error(`Property not found in store: ${key}, ${subState}, ${path}`);
        }
      }
      return subState;
    }
  },
  actions: {
    async trackMouse(payload: { timestamp: string; x: number; y: number }) {
      this.taskReplay.mouse.push(payload);
    },
    async trackPanning(payload: { timestamp: string; x: number; y: number }) {
      this.taskReplay.panning.push(payload);
    },
    async trackZooming(payload: { timestamp: string; scale: number }) {
      this.taskReplay.zooming.push(payload);
    },
    async storeReplay() {
      const replay = this.taskReplay;
      replay.meta = extractMetaInformation(this, replay);
      const hash = await axios.post("/api/storeReplay", { replay: JSON.stringify(replay) });
      console.log(hash);
    },
    async setRestoredFromReplay() {
      this.restoredFromReplay = true;
    },
    async fetchTaskData(payloadObject: { [key: string]: any }) {
      // await dispatch("fetchTaskGraph");
      const { endpoint, payload } = payloadObject;
      // TODO extract language to seperate user module
      const result = await axios.post(`/api/${endpoint}`, { ...payload, language: "de" });
      Object.entries(JSON.parse(result.data)).forEach(async ([key, value]) => {
        await this.setPropertyFromPath({ path: `taskData__${key}`, value: value });
      });
      return result;
    },
    async fetchTaskGraph(payload: { task: string }) {
      try {
        // trigger loading screen
        await this.toggleLoading();
        // reset Store
        this.$reset();

        const result = await axios.post("/api/fetchTaskGraph", payload);
        const { UI } = JSON.parse(result.data);
        const { topology, edges, nodes, rootNode, taskMode } = UI;

        this.setPropertyFromPath({ path: "topology", value: topology });
        this.setPropertyFromPath({ path: "edges", value: edges });
        this.setPropertyFromPath({ path: "nodes", value: nodes });
        this.setPropertyFromPath({ path: "rootNode", value: rootNode });
        this.setPropertyFromPath({ path: "currentNode", value: rootNode });
        this.setPropertyFromPath({ path: "taskMode", value: taskMode });

        // remove loading screen
        await this.toggleLoading();
      } catch (error) {
        console.log(error);
        // remove loading screen, even if error occurs
        await this.toggleLoading();
      }
    },
    async setPropertyFromPath(payload: { path: string; value: any; metadata?: { descriptor: string } }) {
      const { path, value } = payload;
      if (typeof path !== "string") {
        throw new Error(`Path is not a string: ${path}`);
      }

      const splitPath = path.split("__");

      let subState = this as any;
      let changingState = false;
      for (let depth = 0; depth < splitPath.length; depth++) {
        if (depth === splitPath.length - 1) {
          if (subState[splitPath[depth]] != value) {
            subState[splitPath[depth]] = value;
            changingState = true;
          }
        } else subState = subState[splitPath[depth]];
      }

      // if a change was recorded, save state on every mutation as a side effect for task replay
      if (changingState) {
        this.taskReplay.steps.push({ timestamp: new Date().getTime(), ...JSON.parse(JSON.stringify(payload)) });
        // for debugging purposes
        console.log(path, value);
      }
    },
    async toggleLoading() {
      this.isLoading = !this.isLoading;
    },
    async ensurePathExists(path: string) {
      if (typeof path !== "string") {
        throw new Error(`Path is not a string: ${path}`);
      }
      const splitPath = path.split("__");
      let subState = <any>this;
      let pathIsValid = true;
      for (let depth = 0; depth < splitPath.length; depth++) {
        if (splitPath[depth] in subState) {
          subState = subState[splitPath[depth]];
        } else {
          pathIsValid = false;
          break;
        }
      }
      return pathIsValid;
    }
  }
});

const extractMetaInformation = (state: State, replay: Replay) => {
  const calcDuration = (replay: Replay) => {
    const times = { start: new Date().getTime(), duration: 0, end: 0, date: "" };
    Object.values(replay).forEach((events: Array<any>) => {
      if (!events.length) return;
      const firstEvent = events[0].timestamp;
      const lastEvent = events[events.length - 1].timestamp;
      if (firstEvent < times.start) times.start = firstEvent;
      if (lastEvent > times.end) times.end = lastEvent;
    });

    times.duration = times.end - times.start;

    times.date = new Date().toISOString();
    return times;
  };

  const task = state.currentTask;
  // 0 = unfinished, 1 = finished successfully, 2 finished with wrong result
  type completionStatus = 0 | 1 | 2;
  const completion: completionStatus = 0;
  const { duration, date } = calcDuration(replay);

  return { task, completion, date, duration };
};
