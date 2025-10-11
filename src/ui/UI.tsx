import { createElement } from "../tsxFactory"
import { ObjectOptions, ObjectOptionsData } from "./objectOptions"


export class UiManager {
    app: HTMLElement;
    get objectOptions(): HTMLElement {
        return document.getElementById("object-options")!;
    }
    constructor() {
        document.body.appendChild(UI());
        this.app = document.getElementById("app")!;
    }
    updateObjectOptions(objectOptions?: ObjectOptionsData) {
        this.objectOptions.replaceWith(ObjectOptions(objectOptions));
    }
}

export function UI() {
    return <div id="app">
        <ObjectOptions />
    </div>
}