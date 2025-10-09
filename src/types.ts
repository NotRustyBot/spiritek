import { Graphics } from "pixi.js"
import { CoreObject } from "./core"

export interface ObjectKinds {
    preupdate: { preupdate(): void }
    updatable: { update(): void }
    drawable: { draw(): void }
    postprocess: { postprocess(): void }
    scenebound: { destroy(): void }
    debug: { debug(graphics: Graphics): void }
    selectable: ISelectable;
}

export type ISelectable = CoreObject & { select?(): void, unselect?(): void, hover?(): void, unhover?(): void, size: number }

export type ObjectKind = keyof ObjectKinds;

export type Action = () => void