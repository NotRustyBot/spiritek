import { shapeBuilders, Sprite, spritesheetAsset } from "pixi.js";
import { CoreObject } from "./core";
import { asset, toNearest } from "./util";
import { Vector } from "./vector";
import { game } from "./game";
import { ISelectable } from "./types";
import { Common } from "./common";
import { MousePriority } from "./input";
import { RangeRepeller } from "./repeller";
import { Spirit } from "./spirit";
import { ObjectOptionsData } from "./ui/objectOptions";
import { itemDefinition, ItemType } from "./items";
import { AstronautPickupItem, AstronautGrabFlare, AstronautMove, AstronautPlaceDrill, AstronautPlaceInstallation, AstronautThrowFlare, AstronautTossGrabbedFlare, Order, OrderManager } from "./orderManager";
import { FlareCore, KillFlare, RepellFlare } from "./flare";
import { SpotlightInstallation, TurretInstallation } from "./installation";
import { Drill } from "./drill";
import { DroppedItem } from "./droppedItem";
import { AttentionIcon } from "./attention";



declare module "./types.ts" { interface ObjectKinds { astronaut: Astronaut } }
export class Astronaut extends CoreObject implements ISelectable {
    sprite: Sprite;
    overlaySprite: Sprite;
    attractor = new RangeRepeller();
    enterShipIntent = false;
    operatedDrill?: Drill;
    grabbedFlare?: FlareCore;
    rotation = 0;
    attention = new AttentionIcon();

    items: Array<{ count: number, item: ItemType }> = []

    ui = {
        setResistValue: (e: string) => { }
    }

    get uiData(): ObjectOptionsData {
        const stats: ObjectOptionsData["stats"] = [{
            name: "resist",
            value: this.resist.toFixed(0),
            updateHandler: (updater) => {
                this.ui.setResistValue = updater;
            }
        }];
        const actions = [];

        if (!this.incapacitated) {

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


            if (this.itemCount(ItemType.DrillParts) > 0) {
                actions.push({
                    name: "Build Drill",
                    icon: "img/drill.png",
                    active: () => (game.orderManager.currentOrder instanceof AstronautPlaceDrill),
                    action: () => {
                        const order = new AstronautPlaceDrill(this);
                        game.orderManager.newOrder(order);
                    },
                })
            }
            if (this.grabbedFlare == undefined) {
                actions.push({
                    name: "Grab Flare",
                    icon: "img/flare.png",
                    active: () => (game.orderManager.currentOrder instanceof AstronautGrabFlare),
                    action: () => {
                        const order = new AstronautGrabFlare(this);
                        game.orderManager.newOrder(order);
                    },
                })
            } else {
                actions.push({
                    name: "Toss Flare",
                    icon: "img/flare.png",
                    active: () => (game.orderManager.currentOrder instanceof AstronautTossGrabbedFlare),
                    action: () => {
                        const order = new AstronautTossGrabbedFlare(this);
                        game.orderManager.newOrder(order);
                    },
                })
            }

            actions.push({
                name: "Pick Up",
                icon: "img/stone_1.png",
                active: () => (game.orderManager.currentOrder instanceof AstronautPickupItem),
                action: () => {
                    const order = new AstronautPickupItem(this);
                    game.orderManager.newOrder(order);
                },
            })
        }


        return {
            name: "Astronaut",
            actions,
            stats: stats,
            items: this.items.map((i) => {
                return {
                    ...i,
                    drop: () => {
                        this.dropItem(i.item)
                    },
                    action: () => {
                        !this.incapacitated && this.useItem(i.item)
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

    dropdir = 0;
    dropItem(item: ItemType) {
        if (this.itemCount(item) > 0) {
            const drop = new DroppedItem(item);
            this.spendItem(item);
            drop.position.set(this).add(Vector.fromAngle(this.dropdir += Math.PI / 2).mult(50));
            game.uiManager.updateObjectOptions(this.uiData);
        }
    }



    itemCount(item: ItemType) {
        return this.items.filter(i => i.item == item).reduce<number>((a, b) => a + b.count, 0);
    }

    spendItem(item: ItemType) {
        return Common.spendItem(item, this.items);

    }

    inventorySize = 3;

    pickup(data: { item: ItemType, count: number }): number {
        return Common.pickup(data, this.items, this.inventorySize);
    }

    moving = false;
    get isBusy() {
        return this.moving;
    }
    orderQueue = new Array<Order>();

    cancelOrders() {
        for (const order of Array.from(this.orderQueue)) {
            order.destroy();
        }

        this.orderQueue = [];
    }

    queueOrder(order: Order) {
        this.orderQueue.push(order);
    }

    speed = 120;
    resist = 100;
    stressTimer = 0;
    incapacitated = false;

    targetPosition = new Vector();

    constructor() {
        super("updatable", "drawable", "astronaut", "selectable", "scenebound");
        this.sprite = new Sprite(asset("astronaut"));
        this.sprite.anchor.set(0.5);
        game.containers.astronaut.addChild(this.sprite);

        this.overlaySprite = new Sprite(asset("astronaut"));
        this.overlaySprite.anchor.set(0.5);
        game.containers.overlay.addChild(this.overlaySprite);
        this.overlaySprite.tint = 0x55ff55;

        this.attractor.strength = -1;
        this.attractor.emotional = true;
        this.attractor.range = 750;


        this.attractor.hit = (spirit: Spirit) => {
            if (spirit.position.distanceSquared(this) < 100 ** 2) {
                if (this.resist >= 100) {
                    game.log("Astroaut under attack", this, "critical");
                }

                this.resist -= game.dt * 5;

                this.stressTimer = 1;
                if (this.resist < 0) {
                    if (!this.incapacitated) {
                        this.incapacitated = true;
                        this.attractor.enabled = false;
                        this.resist = 0;
                        this.overlaySprite.visible = false;
                        this.cancelOrders();
                        game.log("Astroaut incapacitated", this, "critical");

                    }

                }
            }
        }
    }

    select(): void {
        const order = new AstronautMove(this);
        game.orderManager.newOrder(order);
    }

    hover(): void {
        Common.hover(this, this.sprite);
    }

    unhover(): void {
        Common.unhover(this, this.sprite);
    }

    size = 50;


    avoid(vector: Vector) {
        const avoidanceRequired = game.system.raycast(this.position, this.targetPosition);
        if (!avoidanceRequired) return;
        const asteroid = Array.from(game.objects.getAll("asteroid")).reduce(toNearest(this));
        const res = game.system.raycast(this.position, asteroid);

        if (res) {
            let dist = Vector.fromLike(res.point).distance(this.position);
            if (dist > 125) return;
            dist = Math.min(dist, 100);
            const radi = this.position.diff(asteroid);
            const radius = radi.length() + 100 - dist;
            const prefferedResult = this.position.clone().add(vector.normalize(this.speed * game.dt)).sub(asteroid).minLength(radius).add(asteroid);
            const fdif = prefferedResult.diff(this)
            vector.set(fdif);
        }
    }

    update() {
        if (this.incapacitated) return;
        if (this.enterShipIntent) {
            if (game.ship.position.distance(this) < game.ship.size) game.ship.board(this);
            this.targetPosition.set(game.ship);
        }

        const dsq = this.position.distanceSquared(this.targetPosition);
        this.moving = false;
        if (dsq > 1) {
            if (dsq < this.speed * game.dt) {
                this.position.set(this.targetPosition);
            } else {

                const diff = this.targetPosition.diff(this);
                this.avoid(diff);
                this.position.add(diff.normalize(this.speed * game.dt));
                this.rotation = diff.toAngle();
                this.moving = true;
            }
            this.overlaySprite.visible = true;
        } else {
            this.overlaySprite.visible = false;
        }

        if (!this.isBusy && this.orderQueue.length > 0) {
            this.orderQueue.shift()?.execute();
        }


        this.attractor.position.set(this);

        if (this.grabbedFlare) {
            this.grabbedFlare.position.set(this).add(this.targetPosition.clone().normalize(30));
        }


        if (this.stressTimer > 0) {
            this.attention.setIcon("icon-Icon_Warning", 0xffaa00);
            this.stressTimer -= game.dt;
        } else {
            if (this.resist < 100) {
                this.resist += game.dt * 10;
            }
        }

        this.ui.setResistValue(this.resist.toFixed(0));


    }

    draw() {
        this.sprite.position.set(this.x, this.y);
        this.sprite.rotation = this.rotation;

        this.overlaySprite.position.set(this.targetPosition.x, this.targetPosition.y);
        this.overlaySprite.rotation = this.rotation;
        this.attention.forPosition(this, this.size);
    }

    override destroy(): void {
        super.destroy();
        this.sprite.destroy();
        this.overlaySprite.destroy();
        this.cancelOrders();
        this.attention.destroy();
        if (this.operatedDrill) this.operatedDrill.operator = undefined;
        if (this.grabbedFlare) this.grabbedFlare.grabbedBy = undefined;
        this.cancelOrders();
        this.attractor.destroy();
        if (game.selected == this) {
            game.selected = undefined;
            game.uiManager.updateObjectOptions();
        }
    }
}