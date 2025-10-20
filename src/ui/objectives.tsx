import { createElement } from "../tsxFactory"


export type ObjectiveUiData = {
    desc: string,
    status: string,
    completed?: boolean;
    locked?: boolean;
};

export type ObjectiveUiDataGetter = {
    dataGetter: (updater: (data: ObjectiveUiData) => void) => void
}

export function Objectives(props: { data: Array<ObjectiveUiDataGetter> }) {
    const { data } = { ...props };
    return <div id="objectives">
        <div class="objectives-list">
            {
                data.map((d) => {
                    let desc: HTMLElement;
                    let status: HTMLElement;
                    let item: HTMLElement;

                    let elements =
                        <div class="objective-item" ref={(e) => { item = e }}>
                            <div class="objective-desc" ref={(e) => { desc = e }}></div>
                            <div class="objective-status" ref={(e) => { status = e }}></div>
                        </div>;

                    d.dataGetter(v => {
                        desc.innerHTML = v.desc;
                        status.innerHTML = v.status;

                        if (v.completed) {
                            item.classList.add("completed");
                        } else {
                            item.classList.remove("completed");
                        }

                        if (v.locked) item.classList.add("locked");
                    })

                    return elements;
                })
            }
        </div>
    </div>
}