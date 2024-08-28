<!--**************************************************************** Zakaria *********************************** -->
<template>
    <div class="container">
        <img :src="bildPath" alt="Bild konnte nicht hochgeladen werden!!!" class="background-image">
        <template v-if="inputFelder">
            <div class="flex-container">
                <input   
                    class="input-field"
                    v-for="(input, index) in inputFelder"
                    :key="index"
                    :type="input.type"
                    :id="'input' + (index + 1)"
                    :placeholder="handlePlaceholder(input.placeholder)"
                    @input="handleInput(input.placeholder, $event)"
                    :style="{
                        width: input.width
                    }"
                >
                
            </div>
        </template>
        
    </div>
</template>


<script lang="ts">
    import { defineComponent, computed, ref, watch } from 'vue';

    export default defineComponent({
        props: {
            componentID: Number,        // ID der Komponente
            storeObject: Object         // Store-Objekt zur Datenhaltung
        },
        setup(props) {
            // Extrahiere store und getProperty Methode aus dem Store-Objekt
            const { store, getProperty , setProperty} = props.storeObject;
            // Berechnet den aktuellen Knoten des Zustands
            const currentNode = computed(() => store.state.currentNode);
            // Generiert den Pfad zur Komponente basierend auf currentNode und componentID
            const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);

            // Funktion zum Laden von Daten
            const loadData = (path: string) => {
                const data = getProperty(path);
                if (data !== null && data !== undefined) {
                    return data.toString();
                }
                return null;
            };
            // der Pfad zum Bild
            const bildPath = computed(() => loadData(`${componentPath.value}__pfad`));
            // der Pfad zu den Input-Feldern
            const input = computed(() => `${componentPath.value}__inputFelder`);
            let inputFelder = undefined;
            const inputFelderValues = ref<{ [key: string]: string | number }>({});

            // Überprüft, ob input nicht null ist und lädt dann die Input-Daten
            if (input != null) {
                inputFelder = computed(() => loadInputData(`${componentPath.value}__inputFelder`));

                // Funktion zum Laden der Input-Daten aus dem Store
                const loadInputData = (path) => {
                    const data = getProperty(path);
                    if (data) {
                        return data.map(item => ({
                            type: item.type,
                            placeholder: item.placeholder,
                            align:item.align,
                            width: item.width
                        }));
                    }
                    return [];
                };
                
                // Watcher to update inputFelderValues whenever inputFelder changes
                watch(inputFelder, (newInputFelder) => {
                    const values = {};
                    newInputFelder.forEach(input => {
                        values[input.placeholder] = '';  // Or use a different default value if necessary
                    });
                    inputFelderValues.value = values;
                }, { immediate: true }); // immediate: true to initsialize on setup
            }
            // Function to handle input events
            const handleInput = (placeholder: string, event: Event) => {
                const target = event.target as HTMLInputElement;
                const value = parseFloat(target.value);
                if (isNaN(value)) target.value = '0';
                if (placeholder in inputFelderValues.value) {
                    inputFelderValues.value[placeholder] = value;
                }
                setProperty({ path: `${componentPath.value}__inputFelderValues`, value: inputFelderValues });
                
            };
            // Funktion zum Handhaben des Mouseover-Ereignisses
            const handlePlaceholder = (nachricht: String) => {
                const neueNachricht = nachricht.split(' ');
                if (neueNachricht.length < 2) {
                    return nachricht;
                }
                return nachricht;
                //return `${neueNachricht[0]} <sub>${neueNachricht[1]}</sub>`;
            };
            

            // Rückgabe der berechneten Werte zur Nutzung in der Template
            return {
                bildPath,
                inputFelder,
                inputFelderValues,
                handlePlaceholder,
                handleInput
            };
        }
    });
</script>


<style>
.container {
    position: relative;
    width: 100%;
    height: 100%;
}

.background-image {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover; /* Skaliert das Bild, um den gesamten Container auszufüllen */
}

.flex-container {
    display: flex;
    flex-direction: row; /* Oder row, je nach Layout-Anforderung */
    flex-wrap: wrap;
    top: 2em;
    justify-content: space-between; /* Beispiel-Ausrichtung**/ 
    /*align-items: center;  Beispiel-Ausrichtung */
    gap: 100px; /* Abstand zwischen den Input-Feldern */
    position: absolute;
    
    
}

.input-field {
    background: gray;
    color: black;
    border: 1px solid #ccc;
    padding: 5px;
    border-radius: 30px;
    font-family: cursive;
}

/* Stil für den Placeholder-Text */
.input-field::placeholder {
    color: black;
}

/*************************************************************End  **********************************/

</style>