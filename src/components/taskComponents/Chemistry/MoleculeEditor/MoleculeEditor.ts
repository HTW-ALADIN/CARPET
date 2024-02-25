declare global {
  interface Window {
    JSApplet: {
      JSME: any;
      setCallBack: any;
      readGenericMolecularInput: any;
    };
  }
}

import type {
  SerializedTaskComponent,
  SerialisedDependencies,
  ComponentDependencies,
  TaskGraphPath,
  ComponentProps,
  ComponentData
} from "@/components/taskComponents/TaskComponent";
import { TaskComponent } from "@/components/taskComponents/TaskComponent";
import { unref } from "vue";
import { pollWindowsProperty, pollClassProperty } from "@/helpers/HelperFunctions";

export interface MoleculeEditorProps extends ComponentProps {
  options?: {};
}

export type MoleculeEditorComponentType = "MoleculeEditor";

export interface serialisedMoleculeEditorDependencies extends SerialisedDependencies {
  smilesCode?: TaskGraphPath;
}

export interface MoleculeEditorDependencies extends ComponentDependencies {
  smilesCode?: string;
}

export interface MoleculeEditorComponentData extends ComponentData {
  userInput: string;
}

export interface SerializedMoleculeEditorComponent
  extends SerializedTaskComponent<MoleculeEditorComponentType, MoleculeEditorDependencies, MoleculeEditorComponentData> {}

export class MoleculeEditorComponent extends TaskComponent<
  SerializedMoleculeEditorComponent,
  serialisedMoleculeEditorDependencies,
  MoleculeEditorDependencies,
  MoleculeEditorComponentData
> {
  /**
   * The MoleculeEditorComponent class is a derived taskComponent.
   * It implements the JSME Molecule Editor.
   */
  public jsmeID = "jsmeContainer";
  public jsmeApplet: any;

  public validate() {
    const isValid = true;
    unref(this.storeObject).setProperty({ path: `${this.serialisedTaskComponentPath}__isValid`, value: isValid });

    return isValid;
  }

  // https://jsme.cloud.douglasconnect.com/JSME_2017-02-26/jsme/jsme.nocache.js
  // obsolete
  public async loadJSME(JSMEsource: string = "https://jsme.cloud.douglasconnect.com/JSME_2017-02-26/jsme/jsme.nocache.js") {
    const script = document.createElement("script");
    script.src = JSMEsource;
    document.head.appendChild(script);
  }

  public async instantiateJSME(props: MoleculeEditorProps) {
    return await pollWindowsProperty(
      window,
      "JSApplet",
      async () => {
        if (window.JSApplet) {
          this.jsmeApplet = new window.JSApplet.JSME(this.jsmeID, { options: props.options ?? {} });
          this.jsmeApplet.readGenericMolecularInput("Clc(c(Cl)c(Cl)c1C(=O)O)c(Cl)c1Cl");
        }
      },
      150
    );
  }

  public setJSMECallbackHandler() {
    pollClassProperty(
      this,
      "jsmeApplet",
      () => {
        this.jsmeApplet.setCallBack("AfterStructureModified", (jsmeEvent: { src: any }) => {
          const jsme = jsmeEvent.src;
          const smilesCode = jsme.smiles();
          unref(this.storeObject).setProperty({ path: `${this.serialisedTaskComponentPath}__userInput`, value: smilesCode });
        });
      },
      150
    );
  }
}
