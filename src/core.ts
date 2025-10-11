import { game } from "./game";
import type { ObjectKind } from "./types";
import { Vector } from "./vector";

export class CoreObject {
    tags: Set<ObjectKind> = new Set();

    position = new Vector();
    get x() {
        return this.position.x;
    }

    set x(value) {
        this.position.x = value;
    }

    get y() {
        return this.position.y;
    }

    set y(value) {
        this.position.y = value;
    }


    constructor(...tags: ObjectKind[]) {
        for (const tag of tags) {
            game.objects.add(tag, this as any);
            this.tags.add(tag);
        }
    }

    destroy() {
        this.tags.forEach(t => game.objects.remove(t, this as any));
    }
}