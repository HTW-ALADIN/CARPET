<template>
  <div class="parameter_form">
    <h2>{{ title }}</h2>
    <div class="parameter_form_columns">
      <div class="parameter_labels">
        <p v-for="(element, key) in elements" :key="key" v-html="element.label"
          v-tooltip.left-center="element.description || ''" />
      </div>
      <div class="parameter_fields">
        <component @updateElement="updateElement" :is="element.formType" v-for="(element, key) in elements" :key="key"
          :element="element" :elementId="key" :storeObject="storeObject" :componentID="componentID" />
      </div>
    </div>
  </div>
</template>
  
<script lang="ts">
import type {
  SerializedTaskComponent,
  SerialisedDependencies,
  ComponentDependencies,
  TaskGraphPath,
  ComponentProps,
  ComponentData
} from "@/components/taskComponents/TaskComponent";
import { TaskComponent } from "@/components/taskComponents/TaskComponent";
import { read } from "fs";
import type { ComputedRef } from "vue";



import { computed, watch, ref } from "vue";
import RangeFormField from "@/components/taskComponents/form/RangeFormField.vue";
import DropdownFormField from "@/components/taskComponents/form/DropdownFormField.vue";
import CheckboxFormField from "@/components/taskComponents/form/CheckboxFormField.vue";
import ValueFormField from "@/components/taskComponents/form/ValueFormField.vue";
import DualSlider from "@/components/taskComponents/form/DualSlider.vue";
import ActionButtons from "@/components/taskComponents/mixins/ActionButtons.vue";
import { validateHeaderName } from "http";
import { isValidElement } from "react";
import { unref } from "vue";



export default {

  props: {
    componentID: Number,
    storeObject: Object
  },
  components: {
    RangeFormField,
    DropdownFormField,
    CheckboxFormField,
    ValueFormField,
    DualSlider,
    ActionButtons
  },
  setup(props) {
    const { store, getProperty, setProperty } = props.storeObject as {
      store: any;
      getProperty: Function;
      setProperty: Function;
    };

    const currentNode = store.state.currentNode;
    const path = `nodes__${currentNode}__components__${props.componentID}`;


    const taskData = computed(() => getProperty(`taskData`));
    watch(
      taskData,
      (newTaskData) => {
        if (Object.keys(newTaskData).length) setProperty({ path: `${path}__isValid`, value: true });
      },
      { deep: true }
    );

    const title = getProperty(`${path}__component__title`);
    const elements = computed(() => getProperty(`${path}__component__form`));


    const updateElement = (event: Event) => {

      const { classList, value, type, checked } = <HTMLFormElement>event.target;
      const className = classList[0];
      const payload = type === "checkbox" ? checked : value;
      const elementPath = `${path}__component__form__${className}`;
      setProperty({ path: elementPath, value: payload });
      validate(elementPath, value);
    };

    const validatecomponent = () => {
      setProperty({ path: `nodes__${currentNode}__components__${props.componentID}__isValid`, value: true });

      for (const [key, element] of Object.entries(elements)) {

        const isValid = element.isValid;

        console.log("isValidvalue" + isValid);
        if (isValid == false) {
          setProperty({ path: `nodes__${currentNode}__components__${props.componentID}__isValid`, value: true});

        }
      }
    }

    const validate = (elementPath: string, payload: string) => {


      store.setProperty({ path: `${path}__validation`, value: validate });

     const datainput = unref(store).getProperty(`taskData__Position`);
     console.log(`${elementPath}__validation`);
     console.log(datainput);
      if (datainput == payload) {
      
        setProperty({ path: `${elementPath}__isValid`, value: true });
        validatecomponent();
        console.log("erfolg");
      }
      else {
        setProperty({ path: `${elementPath}__isValid`, value: false });
      }
    };
    return { elements, updateElement, title };
  }
};



</script>
  


<style scoped>
.parameter_form {
  display: flex;
  flex-direction: column;
  background: #e8edf1;
  width: 100%;
  height: 100%;
  justify-content: space-around;
  align-items: center;
}

.parameter_form h2 {
  color: #57636b;
  text-shadow: 1px 1px 1px #fff;
  padding: 10px 0;
}

.parameter_form_columns {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 65%;
  min-width: 80%;
  box-shadow: 2px 3px 9px 0px rgba(0, 0, 0, 1);
  background: #e8edf1;
  padding: 5px;
  border-radius: 10px;
}

.parameter_fields,
.parameter_labels {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-grow: 1;
  align-items: center;
  justify-content: space-around;
}

.parameter_labels {
  align-items: start;
}

.parameter_labels p {
  background: #57636b;
  border-radius: 5px;
  padding: 5px;
  min-width: 85%;
  color: #fff;
  box-shadow: 2px 3px 4px 0px rgba(0, 0, 0, 1);
  text-shadow: 1px 1px 1px black;
}
</style>
  