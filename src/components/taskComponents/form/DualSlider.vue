<template>
  <div class="range_slider">
    <input 
      type="range" 
      :min="element.min" 
      :max="element.max" 
      :step="element.step" 
      v-model="lokalvalue" 
      @onchange="emitEvent"
      @keyup="onMouseDown"
      class="slider" />
    <p id="01">{{ Math.round(lokalvalue) }}</p>
    <!-- 
    <Matrix
      :rowanzahl = "displayedValue"
    />-->
    <!--
    <input type="range" min="1" max="50" step="1" v-model="sliderMin" />
    <input type="number" min="0" max="180" step="1" v-model="sliderMin" />
    <input type="range" min="0" max="180" step="1" v-model="sliderMax" />
    <input type="number" min="0" max="180" step="1" v-model="sliderMax" />
    <input type="number" min="0" max="180" step="1" v-model="sliderDiff" />
    -->
  </div>
  <!--
  <input
    :class="`${elementId}__value`"
    :type="element.type"
    :value="element.value"
    :step="element.step"
    oninput="this.reportValidity()"
    @keyup="emitEvent"
  /> -->
</template>




<script lang="ts">

import { onMounted, ref, computed, watch } from "vue";
import Matrix from "@/components/taskComponents/math/LinearAlgebra/Matrix.vue";

export default {
  name: "DualSlider",
  props: {
    componentID: String,
    storeObject: Object,
    element: Object,
    elementId: String,
  },
  /*
  components:{
    Matrix
  },*/
  setup(props, { emit }) {
    const { store, getProperty, setProperty } = props.storeObject;
    const currentNode = computed(() => store.state.currentNode);
    const currentTask = computed(() => getProperty("currentTask"));
    const componentPath = `nodes__${currentNode.value}__components__${props.componentID}__component`;
    const valuepath = `${componentPath}__form__nodeAmount__value`
    const value = getProperty(valuepath);
    const lokalvalue = ref(value);

    // Berechnete Eigenschaft zur Anzeige des aktuellen Werts
    const displayedValue = computed(() => Math.round(value));

    
    

    const emitEvent = () => {
      // Emit the slider value as the updated element
      //emit("updateElement", Math.round(value));
      console.log(value);
      console.log(valuepath);
      setProperty(valuepath,value);
    };

    watch(lokalvalue,emitEvent)
    //
    const startX = ref(0);
    const startValue = ref(0);
    const onMouseDown = (event) => {
      startX.value = event.clientX;
      startValue.value = value.value;

      const onMouseMove = (moveEvent) => {
        const diffX = moveEvent.clientX - startX.value;
        const maxDiff = 50; // Maximale Distanz, die die Maus bewegt werden kann, bevor der Sliderwert geändert wird
        const maxStep = 1; // Maximale Schrittgröße
        const stepSize = Math.min(maxStep, Math.abs(diffX / maxDiff) * maxStep);
        const newValue = startValue.value + diffX * stepSize;
        value.value = Math.max(props.element.min, Math.min(props.element.max, newValue));
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        emitEvent();
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };//

    return { value, emitEvent,displayedValue, lokalvalue, onMouseDown};
  },
};
</script>

<style scoped>
input {
  margin: 5px;
  width: 200px;
  border-radius: 5px;
  text-align: center;
  border: 3px solid black;
}


input:focus {
  outline: none;
}

input.invalid {
  border: 3px solid red;
}

input.valid {
  border: 3px solid green;
}

</style>
