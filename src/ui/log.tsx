import { createElement } from "../tsxFactory"
import { removeLog } from "./UI";

type LogType =
    "info"
    | "warn"
    | "critical"
    | "character"
    | "objective"
    ;
export type LogData = {
    text: string,
    className?: LogType,
    click?: () => void,
    icon?: string,
};


export function Log(props: LogData) {
    const { className, click, text, icon } = { ...props };
    let mainElement: HTMLElement;
    return <div class={"log-item " + (className ?? "") + (click != undefined ? " clickable" : "")} onclick={() => { click && click() }} ref={(e) => { mainElement = e }}>
        <div class="log-text">{text}</div>
        {icon != undefined ? <img class="log-icon" src={"img/" + icon + ".png"} /> : null}
        <img class="log-close" src="img/icon/Icon_Cross.png" onclick={(e: MouseEvent) => {
            mainElement.remove();
            e.stopPropagation();
        }} />
        {click && <img class="log-clickable" src="img/icon/Icon_Share1.png" />}
    </div>
}