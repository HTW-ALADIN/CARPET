<template>

<div :id="editorID" class="jsmeContainer"></div>
        
</template>

<script>
 
import { JSMEComponent } from './Vorlage.ts';
import { onMounted } from "vue";

export default {
  props: {componentID: Number, storeObject: Object, componentPath: String },

  name: 'JSME',

  setup(props){ 
    
    const instance = new JSMEComponent(props.storeObject, props.componentID, props.componentPath);

    const editorID = instance.getID();

    onMounted( ()=>{ 
      
      // Methode aufrufen, um JSME zu laden und zu instanziieren
      instance.loadJSME();
    })
  
    return {editorID};
  
  }

}; 

</script>

<style>
</style>
