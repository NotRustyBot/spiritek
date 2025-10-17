import { Container } from "pixi.js";
import { ISelectable } from "./types";
import { OutlineFilter } from "pixi-filters";
import { Inventory, itemDefinition, ItemType } from "./items";

const filtre = new OutlineFilter({ color: 0x00ff00, thickness: 2 })

export class Common {
    static hover(select: ISelectable, container: Container) {
        container.filters = [filtre];
    }

    static unhover(select: ISelectable, container: Container) {
        container.filters = [];
    }

    static pickup(data: { item: ItemType, count: number }, items: Inventory, inventorySize: number): number {
        const { item, count } = { ...data };
        let countLeft = count;
        for (let index = 0; index < inventorySize; index++) {
            if (index >= items.length) {
                items[index] = { item, count: 0 };
            }

            const slot = items[index];

            if (slot.item == item && slot.count < itemDefinition[item].stack) {
                const space = itemDefinition[item].stack - slot.count;
                let picked = Math.min(space, countLeft);
                countLeft -= picked;
                slot.count += picked;
            }

            if (countLeft == 0) break;
        }

        return countLeft;
    }

    static spendItem(item: ItemType, items: Inventory) {
        const i = items.find(i => i.item == item);
        if (i == undefined) return;
        i.count--;
        if (i.count == 0) items.splice(items.indexOf(i), 1);
    }

    static itemCount(item: ItemType, items: Inventory) {
        return items.filter(i => i.item == item).reduce<number>((a, b) => a + b.count, 0);
    }
}