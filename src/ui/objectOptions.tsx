import { createElement, CssRuler } from "../tsxFactory"
import { itemDefinition, ItemType } from "../items"


export type ObjectOptionsData = {
    name: string,
    stats?: Array<{
        name: string,
        value?: string
        updateHandler?: (updater: (value: string) => void) => void
    }>
    actions?: Array<{
        name: string,
        action: () => void,
        active?: () => boolean,
        icon: string,
    }>,
    items?: Array<{
        item: ItemType
        count: number
        action: () => void
        drop: () => void
    }>
}



export function ObjectOptions(data?: ObjectOptionsData) {
    if (data == undefined) return <div id="object-options" style="display:none;" />

    const sections = new Array<HTMLElement>();

    if (data.stats) {
        sections.push(
            <div>
                {data.stats?.map((s) => {
                    return <div>
                        <span>{s.name}</span>
                        <span ref={(e: HTMLSpanElement) => {
                            if (s.updateHandler) {
                                s.updateHandler((v) => {
                                    e.innerHTML = v;
                                });
                            }
                        }}>{s.value}</span>
                    </div>
                })}
            </div>
        )
    }
    if (data.actions) {
        sections.push(
            <div class="option-container">
                {data.actions?.map((d) => {
                    let ref: HTMLDivElement;
                    return <div class={
                        "object-action"
                        + (d.active?.() ? " active" : "")
                    }
                        ref={(e: HTMLDivElement) => { ref = e }}
                        onClick={() => {
                            d.action();
                        }}
                    >
                        <img src={d.icon} />
                        <span>{d.name}</span>
                    </div>
                })}
            </div>
        )
    }

    if (data.items) {
        sections.push(
            <div class="items-container">
                {
                    data.items.map((d) => {
                        let ref: HTMLDivElement;
                        let def = itemDefinition[d.item];
                        return <div class="item-container">
                            <div class="item-action"
                                ref={(e: HTMLDivElement) => { ref = e }}
                                onClick={() => {
                                    d.action();
                                }}
                            >
                                <img src={"img/" + def.icon + ".png"} />
                                <span class="item-name">{def.name}</span>
                                <span class="item-count">{" x" + d.count}</span>
                            </div>
                            <span class="item-drop" onClick={() => { d.drop() }}>drop</span>
                        </div>
                    })
                }
            </div >
        );
    }
    return <div id="object-options">
        <h2>{data.name}</h2>
        {sections}
    </div>
}