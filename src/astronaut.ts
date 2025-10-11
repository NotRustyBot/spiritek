import { Sprite, spritesheetAsset } from "pixi.js";
import { CoreObject } from "./core";
import { asset } from "./util";
import { Vector } from "./vector";
import { game } from "./game";
import { ISelectable } from "./types";
import { ISelectableBase } from "./select";
import { MousePriority } from "./input";
import { RangeRepeller } from "./repeller";
import { Spirit } from "./spirit";
import { ObjectOptionsData } from "./ui/objectOptions";
import { ItemType } from "./items";
import { AstronautMove, AstronautPlaceInstallation, AstronautThrowFlare } from "./orderManager";
import { KillFlare, RepellFlare } from "./flare";
import { SpotlightInstallation, TurretInstallation } from "./installation";



declare module "./types.ts" { interface ObjectKinds { astronaut: Astronaut } }
export class Astronaut extends CoreObject implements ISelectable {
    sprite: Sprite;
    attractor = new RangeRepeller();
    enterShipIntent = false;

    rotation = 0;

    items: Array<{ count: number, item: ItemType }> = [
        { count: 1, item: ItemType.KillFlare },
        { count: 2, item: ItemType.ConstructionParts },
        { count: 2, item: ItemType.RepellFlare },
    ]

    get uiData(): ObjectOptionsData {
        const actions = [];

        actions.push({
            name: "Move",
            icon: "img/astronaut.png",
            active: () => (game.orderManager.currentOrder instanceof AstronautMove),
            action: () => {
                const order = new AstronautMove(this);
                game.orderManager.newOrder(order);
            },
        })

        if (this.itemCount(ItemType.ConstructionParts) > 0) {
            actions.push({
                name: "Build Spotlight",
                icon: "img/spotlight.png",
                active: () => (game.orderManager.currentOrder instanceof AstronautPlaceInstallation && game.orderManager.currentOrder.installation == SpotlightInstallation),
                action: () => {
                    const order = new AstronautPlaceInstallation(this, SpotlightInstallation);
                    game.orderManager.newOrder(order);
                },
            })

            actions.push({
                name: "Build Turret",
                icon: "img/turret.png",
                active: () => (game.orderManager.currentOrder instanceof AstronautPlaceInstallation && game.orderManager.currentOrder.installation == TurretInstallation),
                action: () => {
                    const order = new AstronautPlaceInstallation(this, TurretInstallation);
                    game.orderManager.newOrder(order);
                },
            })
        }

        return {
            name: "Astronaut",
            actions,
            items: this.items.map((i) => {
                return {
                    ...i, action: () => {
                        this.useItem(i.item)
                    }
                }
            })
        }
    }

    useItem(item: ItemType) {
        if (item == ItemType.RepellFlare) {
            const order = new AstronautThrowFlare(this, RepellFlare, item);
            game.orderManager.newOrder(order);
        }

        if (item == ItemType.KillFlare) {
            const order = new AstronautThrowFlare(this, KillFlare, item);
            game.orderManager.newOrder(order);
        }
    }

    itemCount(item: ItemType) {
        return this.items.find(i => i.item == item)?.count ?? 0;
    }

    spendItem(item: ItemType) {
        const i = this.items.find(i => i.item == item);
        if (i == undefined) return;
        i.count--;
        if (i.count == 0) this.items.splice(this.items.indexOf(i), 1);
    }


    speed = 120;
    resist = 100;
    underAttack = false;

    targetPosition = new Vector();

    constructor() {
        super("updatable", "drawable", "astronaut", "selectable");
        this.sprite = new Sprite(asset("astronaut"));
        this.sprite.anchor.set(0.5);
        game.containers.astronaut.addChild(this.sprite);

        this.attractor.strength = -1;
        this.attractor.emotional = true;
        this.attractor.range = 500;

        this.attractor.hit = (spirit: Spirit) => {
            if (spirit.position.distanceSquared(this) < 100 ** 2) {
                this.resist -= game.dt * 5;
                this.underAttack = true;
            }
        }
    }

    select(): void {
        const order = new AstronautMove(this);
        game.orderManager.newOrder(order);
    }

    hover(): void {
        ISelectableBase.hover(this, this.sprite);
    }

    unhover(): void {
        ISelectableBase.unhover(this, this.sprite);
    }

    size = 50;

    update() {
        const dsq = this.position.distanceSquared(this.targetPosition);
        if (dsq > 1) {
            if (dsq < this.speed * game.dt) {
                this.position.set(this.targetPosition);
            } else {
                const diff = this.targetPosition.diff(this);
                this.position.add(diff.normalize(this.speed * game.dt));
                this.rotation = diff.toAngle();
            }
        }

        this.attractor.position.set(this);
    }

    draw() {
        this.sprite.position.set(this.x, this.y);
        this.sprite.rotation = this.rotation;
    }
}