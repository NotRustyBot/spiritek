import { game } from "../game";
import { MissionReportData } from "../levelManager"
import { createElement } from "../tsxFactory"


function scoreProcessor(value: number | undefined) {
    let socreText = "";

    if (value) {
        if (value > 0) {
            socreText = "+" + Math.round(value);
        } else {
            socreText = Math.round(value) + "";
        }
    }

    return socreText;
}

export function MissionResults(data: MissionReportData) {
    let objectives = data.objectives.map(p => {
        let socreText = scoreProcessor(p.score);

        return <div class={"objective-result " + p.result}>
            <div class="objective-result__status">{p.status}</div>
            <div class="objective-result__score">{socreText}</div>
        </div>
    })

    const el: HTMLElement = <div id="mission-result">
    </div>

    let delay = 500;
    for (const o of objectives) {
        setTimeout(() => { el.appendChild(o) }, delay);
        delay += 1000;
    }

    let score = <div class="result-total">
        <div class="result-total__label">Total Score:</div>
        <div class="result-total__value">{scoreProcessor(data.totalScore)}</div>
    </div>
    setTimeout(() => { el.appendChild(score) }, delay);
    let otherUi = <div class="result-bottom"><button onclick={
        ()=>{
            game.levelManager.nextLevel();
            game.levelManager.endTransition();
        }
    }>oof</button></div>
    setTimeout(() => { el.appendChild(otherUi) }, delay + 1000);


    return el;

}