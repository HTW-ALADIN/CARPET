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

export interface serialisedMoleculeEditorDependencies extends SerialisedDependencies {}

export interface MoleculeEditorDependencies extends ComponentDependencies {}

export interface MoleculeEditorComponentData extends ComponentData {
  readOnly: boolean;
  smiles: string;
  initialSmiles: TaskGraphPath;
  solution?: TaskGraphPath;
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
  static IDcounter: number = 0;

  constructor(storeObject: any, componentID: number, serialisedTaskComponentPath: TaskGraphPath) {
    super(storeObject, componentID, serialisedTaskComponentPath);
    this.jsmeID = `${this.jsmeID}_${MoleculeEditorComponent.IDcounter}`;
    MoleculeEditorComponent.IDcounter++;
  }

  public validate() {
    let isValid = true;

    const solutionPath = unref(this.storeObject).getProperty(`${this.serialisedTaskComponentPath}__component__solution`);
    if (solutionPath) {
      const solution = unref(this.storeObject).getProperty(solutionPath);

      const userInput = unref(this.storeObject).getProperty(`${this.serialisedTaskComponentPath}__component__smiles`);
      if (solution !== userInput) {
        isValid = false;
      }
    }

    unref(this.storeObject).setProperty({ path: `${this.serialisedTaskComponentPath}__isValid`, value: isValid });

    return isValid;
  }

  // https://jsme.cloud.douglasconnect.com/JSME_2017-02-26/jsme/jsme.nocache.js
  // obsolete
  public async loadJSME(JSMEsource: string = "/public/jsme/jsme.nocache.js") {
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
          this.jsmeApplet = new window.JSApplet.JSME(this.jsmeID, { options: this.getOptions(props) });

          const initialSmilesPath = unref(this.storeObject).getProperty(
            `${this.serialisedTaskComponentPath}__component__initialSmiles`
          );
          const initialSmiles = unref(this.storeObject).getProperty(initialSmilesPath);
          if (initialSmiles) {
            unref(this.storeObject).setProperty({
              path: `${this.serialisedTaskComponentPath}__component__smiles`,
              value: initialSmiles
            });
          }

          // render Smiles
          this.renderSmiles();
        }
      },
      50
    );
  }

  public renderSmiles() {
    const smilesCode = unref(this.storeObject).getProperty(`${this.serialisedTaskComponentPath}__component__smiles`);
    this.jsmeApplet.readGenericMolecularInput(smilesCode);
  }

  private getOptions(props: MoleculeEditorProps) {
    // See JSME options-api at https://jsme-editor.github.io/dist/doc.html
    let options = "";
    const isReadOnly = unref(this.storeObject).getProperty(`${this.serialisedTaskComponentPath}__component__readOnly`);
    if (isReadOnly) {
      options = "reaction, depict";
    }
    return options;
  }

  public setJSMECallbackHandler() {
    pollClassProperty(
      this,
      "jsmeApplet",
      () => {
        this.jsmeApplet.setCallBack("AfterStructureModified", (jsmeEvent: { src: any }) => {
          const jsme = jsmeEvent.src;
          const smilesCode = jsme.smiles();
          unref(this.storeObject).setProperty({
            path: `${this.serialisedTaskComponentPath}__component__smiles`,
            value: smilesCode
          });
          this.validate();
        });
      },
      10
    );
  }
}
