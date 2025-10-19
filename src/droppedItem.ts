import { Sprite } from "pixi.js";
import { CoreObject } from "./core";
import { itemDefinition, ItemType } from "./items";
import { asset } from "./util";
import { game } from "./game";
import { ISelectable } from "./types";
import { ObjectOptionsData } from "./ui/objectOptions";
import { Common } from "./common";


export type IPickupable = {
    pickup(): void
    checkPickup(): {
        item: ItemType;
        count: number;
    }
}

declare module "./types" { interface ObjectKinds { droppedItem: DroppedItem } }
declare module "./types" { interface ObjectKinds { pickupable: IPickupable } }
export class DroppedItem extends CoreObject implements ISelectable, IPickupable {
    sprite: Sprite;
    item: ItemType;
    count = 1;
    constructor(item: ItemType, count = 1) {
        super("droppedItem", "drawable", "selectable", "pickupable", "scenebound");
        this.count = count;
        this.item = item;
        this.sprite = new Sprite(asset(this.definition.icon));
        this.sprite.anchor.set(0.5);
        game.containers.items.addChild(this.sprite);
        this.sprite.width = 50;
        this.sprite.height = 50;
    }

    pickup(): void {
        this.destroy();
    }

    checkPickup() {
        return {
            item: this.item,
            count: this.count
        }
    }

    get definition() {
        return itemDefinition[this.item];
    }

    get uiData(): ObjectOptionsData {
        return {
            name: this.definition.name,
            stats: [
                {
                    name: "count",
                    value: this.count.toFixed()
                }
            ]
        }
    }


    hover?(): void {
        Common.hover(this, this.sprite);
    }
    unhover?(): void {
        Common.unhover(this, this.sprite);
    }

    size = 50;

    draw() {
        this.sprite.position.set(this.x, this.y);
    }

    destroy(): void {
        super.destroy();
        this.sprite.destroy();
    }
}
