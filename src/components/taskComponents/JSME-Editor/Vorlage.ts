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
import { unref } from "vue";

export interface JSMEProps extends ComponentProps {}

export type JSMEComponentType = "JSME";

export interface serialisedJSMEDependencies extends SerialisedDependencies {}

export interface JSMEDependencies extends ComponentDependencies {}

export interface JSMEComponentData extends ComponentData {}

export interface SerializedJSMEComponent
  extends SerializedTaskComponent<JSMEComponentType, JSMEDependencies, JSMEComponentData> {
  readonly: boolean;
  Reaktionsmiles: string;
}

export class JSMEComponent extends TaskComponent<
  SerializedJSMEComponent,
  serialisedJSMEDependencies,
  JSMEDependencies,
  JSMEComponentData
> {
  /**
   * The JSMEComponent class is a derived taskComponent, that is a template for actual CARPET UI-Elements.
   */

  public validate() {}

  public JSApplet: any;
  static editorID: number = 0;
  private currentID: number;
  constructor(storeObject: any, componentID: number, serialisedTaskComponentPath: TaskGraphPath) {
    super(storeObject, componentID, serialisedTaskComponentPath);
    this.currentID = JSMEComponent.editorID;
    JSMEComponent.editorID++;
  }

  public getID() {
    return this.currentID;
  }

  public async loadJSME(JSMEsource: string = "https://jsme.cloud.douglasconnect.com/JSME_2020-06-11/jsme/jsme.nocache.js") {
    const script = document.createElement("script");
    script.src = JSMEsource;
    document.head.appendChild(script);

   
    
      script.onload = async () => {
        console.log(window);
      
        await this.delay(800); 
        console.log(window);
        
        const store = unref(this.storeObject);
        const path = this.serialisedTaskComponentPath;
        var smiles: any;

        function show_smiles(event: any) {
          smiles = event.src.smiles(); 

          store.setProperty({ path: `${path}__smiles`, value: smiles });
          
          console.log(smiles);

          const data = unref(store).getProperty(`taskData__Smiles`);
          

          if (smiles == data) {
            console.log("Happy!");
            
          } else {
            console.log("not Happy ._.");
          }
        }

        const readonly = unref(this.serializedTaskComponent).readonly;
        const Reaktionspath = unref(this.serializedTaskComponent).Reaktionsmiles;

        if (readonly == true) {
          this.JSApplet = new (window as any).JSApplet.JSME(`${this.currentID}`, "380px", "320px", {
            options: "reaction, depict"
          });

          const Reaktionsmiles = store.getProperty(Reaktionspath);
          this.JSApplet.readGenericMolecularInput(Reaktionsmiles);
          
         
        } else {
          this.JSApplet = new (window as any).JSApplet.JSME(`${this.currentID}`, "380px", "320px");
         
        };
        
        this.JSApplet.setCallBack("AfterStructureModified", show_smiles);
      };
    
  }
  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
