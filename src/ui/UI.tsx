import { MissionReportData } from "../levelManager";
import { createElement } from "../tsxFactory"
import { Log, LogData } from "./log";
import { MissionResults } from "./missionResults";
import { Objectives, ObjectiveUiData, ObjectiveUiDataGetter } from "./objectives";
import { ObjectOptions, ObjectOptionsData } from "./objectOptions"


export class UiManager {

    get objectOptions(): HTMLElement {
        return document.getElementById("object-options")!;
    }

    get objectives(): HTMLElement {
        return document.getElementById("objectives")!;
    }

    get logList(): HTMLElement {
        return document.getElementById("log-list")!;
    }

    get talk(): HTMLElement {
        return document.getElementById("talk")!;
    }

    get app() {
        return document.getElementById("app")!;
    }

    get missionResult() {
        return document.getElementById("mission-result")!;
    }

    updateObjectOptions(objectOptions?: ObjectOptionsData) {
        if (this.objectOptions) this.objectOptions.replaceWith(ObjectOptions(objectOptions));
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

    addTalk(name: string, text: string) {
        if (!this.talk) return;
        this.talk.appendChild(<div class="talk-container">
            <div class="talk-name">{name}</div>
            <div class="talk-content">{text}</div>
        </div>);
        let children = Array.from(this.talk.children);
        for (let index = children.length - 3; index >= 0; index--) {
            const child = children[index];
            if (child.classList.contains("removal")) continue;
            removeLog(child as HTMLElement);
        }
    }

    clear() {
        this.app?.remove();
    }

    readyGameUi() {
        this.missionResult?.remove();
        document.body.appendChild(UI());
    }

    readyReportUi(data: MissionReportData) {
        document.body.appendChild(MissionResults(data));
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
        <div id="talk"></div>
    </div>
}