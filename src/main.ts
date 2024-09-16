import * as components from "carpet-component-library";

// TODO: figure out how to add all components dynamically to hte global scope
console.log("TAAA:", components.DOTGraph);

for (const [x, y] of Object.entries(components.DOTGraph)) {
  console.log("TADA:", x, y);
}

// import { createApp } from "vue";
// import type { Plugin } from "vue";
// import App from "./App.vue";
// import router from "./router";
// import store from "./store";
// import "./registerServiceWorker";
// import VTooltip from "v-tooltip";

// const app = createApp(App);
// app
//   .use(store)
//   .use(router)
//   .use(VTooltip as unknown as Plugin);

// app.mount("#app");

// declare global {
//   interface Window {
//     panzoom: any;
//     delayed_methods: any;
//     MathLex: any;
//     MathJax: any;
//   }
// }
