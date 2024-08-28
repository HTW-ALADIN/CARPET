
<template>
    <div>
        <button id="button" type="button">{{name}}</button>
    </div>
</template>

<script lang="ts">
    import { defineComponent, computed} from 'vue';

    export default defineComponent({
        props: {
            componentID: Number,        // ID der Komponente
            storeObject: Object         // Store-Objekt zur Datenhaltung
        },
        setup(props) {
            // Extrahiere store und getProperty Methode aus dem Store-Objekt
            const { store, getProperty } = props.storeObject;

            // den aktuellen Knoten des Zustands
            const currentNode = computed(() => store.state.currentNode);
            // Pfad zur Komponente
            const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);
            

            const loadData = (path: string) => {
                const data = getProperty(path);
                if (data !== null && data !== undefined) {
                    return data.toString();
                }
                return null;
            };
            const name = computed(() => loadData(`${componentPath.value}__name`));
            
            return {
                name
            };
        }
    });
</script>

<style>
#button {
    height: 85px;
    width: 100%;
    background-color: green;
    color: black;
    font-size: medium;
    font-family: fantasy;
}
</style>