import { createElement } from "../tsxFactory"
import { Log, LogData } from "./log";
import { Objectives, ObjectiveUiData, ObjectiveUiDataGetter } from "./objectives";
import { ObjectOptions, ObjectOptionsData } from "./objectOptions"


export class UiManager {
    app: HTMLElement;
    get objectOptions(): HTMLElement {
        return document.getElementById("object-options")!;
    }

    get objectives(): HTMLElement {
        return document.getElementById("objectives")!;
    }

    get logList(): HTMLElement {
        return document.getElementById("log-list")!;
    }

    constructor() {
        document.body.appendChild(UI());
        this.app = document.getElementById("app")!;
    }

    updateObjectOptions(objectOptions?: ObjectOptionsData) {
        this.objectOptions.replaceWith(ObjectOptions(objectOptions));
    }

    updateObjectives(objectiveOptions: Array<ObjectiveUiDataGetter>) {
        this.objectives.replaceWith(Objectives({ data: objectiveOptions }));
    }

    addLog(logData: LogData) {
        this.logList.appendChild(Log(logData));
        let children = Array.from(this.logList.children);
        for (let index = children.length - 5; index >= 0; index--) {
            const child = children[index];
            if (child.classList.contains("removal")) continue;
            removeLog(child as HTMLElement);
        }
    }

}

export function removeLog(child: HTMLElement) {
    child.classList.add("removal");

    setTimeout(() => {
        child.remove();
    }, 500);
}

export function UI() {
    return <div id="app">
        <ObjectOptions />
        <Objectives data={[]} />
        <div id="log-list"></div>
    </div>
}