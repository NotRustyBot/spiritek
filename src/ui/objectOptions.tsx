import { createElement, CssRuler } from "../tsxFactory"
import { itemDefinition, ItemType } from "../items"


export type ObjectOptionsData = {
    name: string,
    actions?: Array<{
        name: string,
        action: () => void,
        disabled?: () => boolean,
        active?: () => boolean,
        icon: string,
    }>,
    items?: Array<{
        item: ItemType
        count: number
        action: () => void
    }>
}

export function ObjectOptions(data?: ObjectOptionsData) {
    if (data == undefined) return <div id="object-options" style="display:none;" />

    const sections = new Array<HTMLElement>();
    if (data.actions) {
        sections.push(
            <div class="option-container">
                {data.actions?.map((d) => {
                    let ref: HTMLDivElement;
                    return <div class={
                        "object-action"
                        + ((!(d.disabled == undefined || d.disabled())) ? " disabled" : "")
                        + (d.active?.() ? " active" : "")
                    }
                        ref={(e: HTMLDivElement) => { ref = e }}
                        onMouseEnter={() => {
                            if (d.disabled == undefined || d.disabled()) {
                                ref.classList.remove("disabled");
                            } else {
                                ref.classList.add("disabled");
                            }
                        }}
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
            <div class="item-container">
                {
                    data.items.map((d) => {
                        let ref: HTMLDivElement;
                        let def = itemDefinition[d.item];
                        return <div class="item-action"
                            ref={(e: HTMLDivElement) => { ref = e }}
                            onClick={() => {
                                d.action();
                            }}
                        >
                            <img src={def.icon} />
                            <span class="item-name">{def.name}</span>
                            <span class="item-count">{" x" + d.count}</span>
                        </div>
                    })
                }
            </div>
        );
    }
    return <div id="object-options">
        <h2>{data.name}</h2>
        {sections}
    </div>
}