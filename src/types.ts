import { Graphics } from "pixi.js"

export interface ObjectKinds {
    preupdate: { preupdate(): void }
    updatable: { update(): void }
    drawable: { draw(): void }
    postprocess: { postprocess(): void }
    scenebound: { destroy(): void }
    debug: { debug(graphics: Graphics): void }
}

export type ObjectKind = keyof ObjectKinds;

export type Action = () => void