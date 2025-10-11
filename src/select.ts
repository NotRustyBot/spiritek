import { Container } from "pixi.js";
import { ISelectable } from "./types";
import { OutlineFilter } from "pixi-filters";

const filtre = new OutlineFilter({ color: 0x00ff00, thickness: 2 })

export class ISelectableBase {
    static hover(select: ISelectable, container: Container) {
        container.filters = [filtre];
    }

   static unhover(select: ISelectable, container: Container) {
        container.filters = [];
    }
}