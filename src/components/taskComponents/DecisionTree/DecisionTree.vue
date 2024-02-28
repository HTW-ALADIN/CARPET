<template>
    <!-- element to render the DOTGraph in -->
    <div class="dotGraph" :style="props.style ?? {}" :id="completeGraphID" oncontextmenu="return false"></div>
  </template>

  <script lang="ts" setup>
  import { onMounted, watch, toRefs, unref, computed, onBeforeUnmount, onUpdated } from "vue";
  import { DOTGraphComponent } from "@/components/taskComponents/DOTGraph/DOTGraph";
  import type { DOTGraphProps } from "@/components/taskComponents/DOTGraph/DOTGraph";
  import * as d3 from "d3";
  import { ensurePathExists } from "@/store/taskGraph";

  import Graph from 'graphology';
  import { DOTSerialiser } from '@/helpers/GraphTools/Serializer';
  import { createRandomString, normalizeString } from '@/helpers/HelperFunctions';
  import axios from 'axios';

  import { graphviz } from "d3-graphviz";
  import { graphvizVersion } from "@hpcc-js/wasm";

  /**
   * as defineProps is not available at runtime, destructuring props reactively needs to be done in two steps
   * https://github.com/vuejs/core/issues/4994#issuecomment-984311639
   * */
  const props = defineProps<DOTGraphProps>();
  const reactiveProps = toRefs(props);
  const { storeObject, componentID, componentPath, graphID } = reactiveProps;

  const component = new DOTGraphComponent(storeObject, unref(componentID), unref(componentPath));
  const componentData = component.getComponentData();
  const taskData = component.getTaskData();
  const dependencyPaths = component.getDependencyPaths();

  const completeGraphID = unref(graphID)
    ? `graph_${unref(componentID)}_${unref(graphID)}`
    : `graph_${unref(componentID)}_default`;

  /* Neuen Graphen erstellen */
  let graph = new Graph();

  /* Array für die Speicherung der generierten IDs */
  let ids: Array<String> = [];

   /* Funktion für die generierung eindutiger IDs */
  const idGenerator = () => {
    let s = "";
    do {
      s = "key_" + createRandomString() + "dt";
    } while (ids.includes(s));
    ids.push(s);
    return s;
  }

  // Erstellung eines Wurzelknotens
  function createRootNode(graph, rootNodeKey) {
    graph.addNode(rootNodeKey, {
      id: idGenerator(),
      label: "Wurzelknoten\n(Info)",
      name: "Wurzelknoten",
      infogain: -1.0,
      level: 0,
      parentedge: "None"
    });
  }

  setTimeout(() => {
    // Event-Listener auf "Generieren!"-Button → aktuellen Baum löschen und neuen Wurzelknoten erstellen
    var generateButton = document.querySelector('.button');
    generateButton.addEventListener('click', function() {
      const rootNodeKey = '1';
      let nodeExists = graph.hasNode(rootNodeKey);
      if (!nodeExists) {
        createRootNode(graph, rootNodeKey);
      } else {
        alert('Neuer Datensatz wurde generiert!');
        graph.clear();
        createRootNode(graph, rootNodeKey);
      }
    });
  }, 100);

  document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    }, false);
  });

  const getDOTDescription = () => {
  const dependencies = component.loadDependencies();

    if (unref(componentData).header == "Entscheidungsbaum")
        return new DOTSerialiser().serialise(graph);

    // TODO: perhaps handle user Error for DJINN?
    // -> throw Error and propagate to user?
    if (unref(unref(dependencies).dotDescription)) return unref(unref(dependencies).dotDescription);
    // fallback to componentData
    if (unref(componentData) && unref(componentData).dotDescription) return unref(componentData).dotDescription;
    // fallback to empty String
    return "";
  };

  const renderGraph = (description: string) => {
    // TODO: causes the error: "transition.js:17 Uncaught Error: transition 5 not found"
    // does not impair functionality - look into it later
    const transition = () => {
      return d3.transition("animateGraph").duration(150).ease(d3.easeLinear);
    };

    graphviz(`#${completeGraphID}`, {
      fit: true,
      zoom: false,
      useWorker: false
    })
      .transition(() => transition())
      .renderDot(description);
  };

  /* Eingehende Kante einem Konten hinzufügen */
  function setParentEdge(key: any) {
    graph.findNode((node, attributes) => {
      if (key == node) {
        graph.findInEdge((edge, attributes, source, target) => {
          if (node == target) {
            graph.setNodeAttribute(node, 'parentedge', attributes['name']);
          }
        });
      }
    });
  }

  /* Startknoten und Zielknoten einer Kante hinzufügen */
  function setParentChildNode(key: any) {
    let nodeName = graph.getNodeAttribute(key, 'name')
    graph.findEdge((edge, attributes, source, target) => {
      if (key == source) {
        graph.setEdgeAttribute(edge , 'parentnode', nodeName)
      }
    });
    graph.findEdge((edge, attributes, source, target) => {
      if (key == target) {
        graph.setEdgeAttribute(edge , 'childnode', nodeName)
      }
    });
  }

  /* Farbliche Hervorhebung der Knoten und Kanten */
  function colorNodes(key: any, c: boolean) {
    if (c) { graph.setNodeAttribute(key, 'color', 'green'); }
    else { graph.setNodeAttribute(key, 'color', '#f1ad2d'); }
  }

  function colorEdges(key: any, c: boolean) {
    if (c) { graph.setEdgeAttribute(key, 'color', 'green'); }
    else { graph.setEdgeAttribute(key, 'color', '#f1ad2d'); }
  }

  /* Aktuellen Graphen validieren */
  function validateGraph(parsedResult: any){
    const solutionNodesList = parsedResult['solution_nodes_list'];
    const solutionEdgesList = parsedResult['solution_edges_list'];
    const status = parsedResult['status'];
    for (let i = 0; i < solutionNodesList.length; i++) { colorNodes(solutionNodesList[i]['key'], solutionNodesList[i]['result']); }
    for (let i = 0; i < solutionEdgesList.length; i++) { colorEdges(solutionEdgesList[i]['key'], solutionEdgesList[i]['result']); }
    if (status) {
      setTimeout(() => {
        console.log("Finished: ", status);
        alert("Herzlichen Glückwunsch!\nSie haben die Aufgabe vollständig gelöst!");
      }, 200);
    }
    renderIfGraph();
  }

  /* Event: Neuer Knoten hinzugefügt */
  graph.on('nodeAdded', function({key}) {
    unref(storeObject).store.dispatch('fetchSolution', graph.export())
    .then(result => {
      const parsedResult = JSON.parse(result);
      validateGraph(parsedResult);
      console.log("solution: ", parsedResult) /* Lösungswerte auf Konsole anzeigen */
      renderIfGraph();
    });
  });

  /* Event: Attribut eines Knoten wurde geändert */
  graph.on('nodeAttributesUpdated', function({key, type, attributes, name}) {
    if (name !== 'label' && name != 'parentedge' && name != 'infogain')
      return;

    unref(storeObject).store.dispatch('fetchSolution', graph.export())
      .then(result => {
        const parsedResult = JSON.parse(result);
        validateGraph(parsedResult);
        console.log("solution: ", parsedResult)
        renderIfGraph();
      });
  });

  /* Event: Neue Kante hinzugefügt */
  graph.on('edgeAdded', function({key, source, target}) {
    unref(storeObject).store.dispatch('fetchSolution', graph.export())
      .then(result => {
        const parsedResult = JSON.parse(result);
        validateGraph(parsedResult);
        console.log("solution: ", parsedResult)
        renderIfGraph();
      });
  });

  /* Event: Attribut einer Kante wurde geändert */
  graph.on('edgeAttributesUpdated', function({key, type, attributes, name}) {
    if (name !== 'label' && name !== 'entropy' && name != 'parentnode' && name != 'childnode')
      return;
    unref(storeObject).store.dispatch('fetchSolution', graph.export())
      .then(result => {
        const parsedResult = JSON.parse(result);
        validateGraph(parsedResult);
        console.log("solution: ", parsedResult)
      })
      .finally(() => renderIfGraph());
  });

  /* Event: Knoten gelöscht */
  graph.on('nodeDropped', function({key}) {
    unref(storeObject).store.dispatch('fetchSolution', graph.export())
      .then(result => {
        const parsedResult = JSON.parse(result);
        validateGraph(parsedResult);
        console.log("solution: ", parsedResult)
      })
      .finally(() => renderIfGraph());
  });

    /* Eingabe für Entropie prüfen, ob Float-Wert */
    function isValidInputEntropy(input: string): boolean {
      const floatValue = parseFloat(input);
      if (!isNaN(floatValue)) {
        return true;
      }
      else {
        return false;
      }
    }

    /* Eingabe für Informationsgewinn prüfen, ob Float-Wert */
    function isValidInputInfo(input: string | number): string | number | null {
    if (typeof input === 'number') {
      return parseFloat(input.toFixed(5));
    } else if (typeof input === 'string') {
      if (input.toLowerCase() === 'decision') {
        return 'decision';
      }
      const parsedFloat = parseFloat(input);
      return isNaN(parsedFloat) ? null : parseFloat(parsedFloat.toFixed(5));
    }
    return null;
  }

  const renderIfGraph = function() {
    let dotDescription = "";
    if (component.validate()) {
      dotDescription = <string>getDOTDescription();
    }

    setTimeout(() => {
      d3.selectAll('svg .node').on('click', null);
      d3.selectAll('svg .node').on('contextmenu', null);
      d3.selectAll('svg .edge').on('contextmenu', null);

      /* Rechtsklick: Kante ändern */
      d3.selectAll('svg .edge').on('contextmenu', (e) => {
        let edgeName = prompt("Kantenbeschriftung hinzufügen:", "");
        let edgeEntropyInput;
        edgeName = normalizeString(edgeName);

        if (edgeName == null || edgeName == "") {
          return;
        } else {
          do {
            edgeEntropyInput = prompt("Entropy hinzufügen:", ""); // Solange falsche Eingabe, wird Prompt angezeigt
          } while (!isValidInputEntropy(edgeEntropyInput));
        }

        const edgeLabel = edgeName + "\n" + "(" + edgeEntropyInput + ")"
        const edgeId = e.target.parentNode.id;
        const filteredEdge = graph.filterEdges((n, a) => a.id == edgeId);

        if (filteredEdge.length <= 0 || edgeLabel == null || edgeLabel == "")
          return;

        const edgeEntropy = parseFloat(edgeEntropyInput);

        graph.setEdgeAttribute(filteredEdge[0], 'label', edgeLabel);
        graph.setEdgeAttribute(filteredEdge[0], 'name', edgeName);
        graph.setEdgeAttribute(filteredEdge[0], 'entropy', edgeEntropy);

        setTimeout(() => {
          let parentEdge;
          graph.findEdge((edge, attributes, source, target) => {
            if(filteredEdge[0] == edge){
              parentEdge = target;
            }
          });
          setParentEdge(parentEdge);
        }, 300);
      });

      /* Rechtsklick: Knoten ändern */
      d3.selectAll('svg .node').on('contextmenu', (e) => {
        let nodeName = prompt("Label für Knoten ändern:", "");
        let nodeInfoGainInput: string | number;
        let nodeInfoGain;

        nodeName = normalizeString(nodeName);
        const nodeId = e.target.parentNode.id;
        const node = graph.filterNodes((n, a) => a.id == nodeId);

        if (node.length <= 0 || nodeName == null || nodeName == "") {
          return;
        } else {
          do {
            nodeInfoGainInput = prompt("Informationsgewinn hinzufügen:", "");
            nodeInfoGain = isValidInputInfo(nodeInfoGainInput);
          } while (nodeInfoGain === null);
        }

        graph.setNodeAttribute(node[0], 'name', nodeName);
        graph.setNodeAttribute(node[0], 'infogain', nodeInfoGain);
        graph.setNodeAttribute(node[0], 'label', nodeName + "\n" + "(" + nodeInfoGain + ")");

        setTimeout(() => {
          setParentChildNode(node);
        }, 200);
      });

      /* Linksklick: Neuen Knoten hinzufügen/Knoten löschen */
      d3.selectAll('svg .node').on('click', (e) => {
        let nodeName = prompt("Neuer Knoten:", "");
        let nodeInfoGainInput: string | number;
        let nodeInfoGain;

        nodeName = normalizeString(nodeName);
        const nodeId = e.target.parentNode.id;
        const node = graph.filterNodes((n, a) => a.id == nodeId);

        if (node.length <= 0)
          return;

        /* Knoten entfernen, wenn keine Eingabe für Bezeichnung vorhanden */
        if (nodeName == null || nodeName == "") {
          if (node[0] == '1')
            return;
          else if (graph.degree(node[0]) > 1) {
            alert('Es dürfen nur Blattknoten gelöscht werden!');
            return;
          }

          graph.dropNode(node[0]);
          return;
        } else {
            do {
            nodeInfoGainInput = prompt("Informationsgewinn hinzufügen:", "");
            nodeInfoGain = isValidInputInfo(nodeInfoGainInput);
          } while (nodeInfoGain === null)
        }

        /* Neuen Knoten erstellen */
        let newNode = graph.addNode(idGenerator(), {
          id: idGenerator(),
          label: nodeName + "\n" + "(" + nodeInfoGain + ")",
          name: nodeName,
          infogain: nodeInfoGain,
          level: graph.getNodeAttribute(node[0], 'level') + 2, // Level von ParentNode + 2
          parentedge: "None",
        });
        setTimeout(() => {

          /* Neue Kante erstellen */
          graph.addEdge(node[0], newNode, {
            id: idGenerator(),
            label: "Label\n(Entropie)",
            name: "Label",
            entropy: -1.0,
            parentnode: graph.getNodeAttribute(node[0], 'name'),
            childnode: graph.getNodeAttribute(newNode, 'name'),
            level: graph.getNodeAttribute(node[0], 'level') + 1,
          });
          setParentEdge(newNode);
        }, 200);
      });
    }, 500);

    renderGraph(dotDescription);

    /* Aktuellen Entscheidungsbaum auf Konsole ausgeben */
    //var graph_string = JSON.stringify(graph);
    //var json_graph = JSON.parse(graph_string);
    //console.log("current DecisionTree: ", json_graph);
  };

  // TODO: check for better reactivity method to react to deeply nested states when swapping to Pinia
  // watch(
  //   unref(storeObject).store.state,
  //   () => {
  //     console.log("hello");
  //     renderIfGraph();
  //   },
  //   { deep: true }
  // );
  const unsubscribe = unref(storeObject).store.subscribe(
    (action: { type: string; payload: { path: string } }, state: object) => {
      if (action.type === "SET_PROPERTY") {
        if (action.type === "SET_PROPERTY" && action.payload.path === dependencyPaths.dotDescription) {
          renderIfGraph();
        }
      }
    }
  );

  onBeforeUnmount(() => {
    unsubscribe();
  });
  watch(
    taskData,
    () => {
      renderIfGraph();
    },
    { deep: true }
  );
  onMounted(() => {
    renderIfGraph();
  });
  </script>

  <style>
  .dotGraph {
    display: flex;
    justify-items: center;
    align-content: center;
    width: 100%;
    height: 100%;
  }

  .dotGraph > svg {
    display: flex;
    justify-items: center;
    align-content: center;
    width: 100%;
    height: 100%;
  }

  .graph {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
  </style>