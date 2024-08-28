<template>
    <div v-if="datasets.length > 0">
      <h1>{{ title }}</h1>
      <canvas :id="chartId" ref="chartRef"></canvas>
    </div>
    <div v-else>
      <p>No data available to display.</p>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, computed, ref, onMounted, watch } from 'vue';
  import { Chart, registerables } from 'chart.js';
  
  Chart.register(...registerables);
  
  export default defineComponent({
    props: {
      componentID: Number,
      storeObject: Object
    },
    setup(props) {
      const { store, getProperty } = props.storeObject;
  
      const currentNode = computed(() => store.state.currentNode);
      const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);
  
      const loadData = (path: string) => {
        const data = getProperty(path);
        console.log(`Data loaded from path ${path}:`, data); // Debug-Ausgabe
        if (data !== null && data !== undefined) {
          return data.toString();
        }
        return null;
      };
  
      const loadDatasets = (path: string) => {
        const datasetsPath = getProperty(path);
        console.log(`Datasets path from ${path}:`, datasetsPath); // Debug-Ausgabe
        if (datasetsPath) {
          const datasets = getProperty(datasetsPath);
          console.log(`Datasets loaded from path ${datasetsPath}:`, datasets); // Debug-Ausgabe
          if (Array.isArray(datasets)) {
            return datasets.map(item => ({
              label: item.label,
              data: item.data,
              borderColor: item.borderColor,
              backgroundColor: item.backgroundColor,
              tension: item.tension
            }));
          }
        }
        return [];
      };
  
      const loadLabels = (path: string) => {
        const labelsPath = getProperty(path);
        console.log(`Labels loaded from path ${path}:`, labels); // Debug-Ausgabe
        if (labelsPath) {
          const labels = getProperty(labelsPath);
          console.log(`Labels loaded from path ${labelsPath}:`, labels); // Debug-Ausgabe
          if (Array.isArray(labels) && labels.length > 0) {
            //return labels.map(item => item.toString());
            // Konvertiere die Labels in Ganzzahlen
            return labels.map(item => parseInt(item, 10));
        }
        
        }
        return [""];
      };
  
      const title = computed(() => loadData(`${componentPath.value}__title`));
      const type = computed(() => loadData(`${componentPath.value}__type`));
      const datasets = computed(() => loadDatasets(`${componentPath.value}__datasets`));
      const labels = computed(() => loadLabels(`${componentPath.value}__labels`));
  
      const chartId = `myChart${props.componentID}`;
      const chartRef = ref<HTMLCanvasElement | null>(null);
  
      let chartInstance: Chart | null = null;

      
  
      const createChart = () => {
        if (datasets.value.length > 0 && chartRef.value) {
          const ctx = chartRef.value.getContext('2d');
          if (ctx) {
            if (chartInstance) {
              chartInstance.destroy();
            }
            console.log('Creating chart with the following data:', {
              type: type.value || 'line',
              labels: labels.value,
              datasets: datasets.value
            }); // Debug-Ausgabe
            
            // Berechne die Schrittgröße für die Ticks
            const stepSize = Math.round((Math.max.apply(Math, labels.value) / 10) / 5) * 5;
            console.log('hier'+stepSize)
            chartInstance = new Chart(ctx, {
              type: type.value || 'line',
              data: {
                labels: labels.value,
                datasets: datasets.value.map(item => ({
                  label: item.label,
                  data: item.data,
                  borderColor: item.borderColor,
                  backgroundColor: item.backgroundColor,
                  tension: item.tension,
                  fill: false,
                  borderWidth: 2
                }))
              },
              options: {
                scales: {
                  x: {
                    ticks: {
                      
                      stepSize: stepSize,
                      beginAtZero: true,
                      precision: 10,
                      maxTicksLimit: 10, // Begrenze die Anzahl der Ticks auf der x-Achse
                  }
                  },
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
          } else {
            console.error('Unable to get context from canvas.');
          }
        } else {
          console.log('No datasets available to display chart.'); // Debug-Ausgabe
        }
      };
  
      watch([datasets, labels, type, chartRef], () => {
        createChart();
      }, { immediate: true });
  
      onMounted(() => {
        createChart();
      });
  
      return {
        title,
        type,
        datasets,
        chartId,
        chartRef
      };
    }
  });
  </script>
  
  <style>
  h1 {
    text-align: center;
  }
  </style>
  