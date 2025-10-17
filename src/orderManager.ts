import { Assets, Sprite, TilingSprite } from "pixi.js";
import { Astronaut } from "./astronaut";
import { CoreObject } from "./core";
import { FlareCore, KillFlare, RepellFlare } from "./flare";
import { game } from "./game";
import { MousePriority } from "./input";
import { asset, toNearest } from "./util";
import { ItemType } from "./items";
import { DrillInstallation, Installation, SpotlightInstallation } from "./installation";
import { Spotlight } from "./spotlight";
import { Drill } from "./drill";
import { Asteroid } from "./asteroid";
import { Vector } from "./vector";
import { IPickupable } from "./droppedItem";
import { Ship } from "./ship";

export class OrderManager extends CoreObject {
    orders = new Set<Order>();
    currentOrder?: Order;
    constructor() {
        super("updatable");
    }

    newOrder(order: Order) {
        this.currentOrder?.destroy();
        this.currentOrder = order;
        game.uiManager.updateObjectOptions(game.selected?.uiData);
        this.orders.add(order);
    }

    update() {
        this.currentOrder?.plan();
        for (const order of this.orders) {
            order.show();
        }
    }


    cancel() {
        this.currentOrder?.cancel();
    }
}

export class Order {
    storedTarget?: Vector;
    get orderTarget() {
        return this.storedTarget ?? game.controls.worldMouse;
    }

    plan() { }
    show() { }

    execute() { }

    cancel() {
        this.destroy();
    }

    destroy() {
        if (game.orderManager.currentOrder == this) game.orderManager.currentOrder = undefined;
        game.uiManager.updateObjectOptions(game.selected?.uiData);
        game.orderManager.orders.delete(this);
    }
}


export class AstronautOrder extends Order {
    astronaut: Astronaut;

    constructor(astronaut: Astronaut) {
        super();
        this.astronaut = astronaut;
    }

    override cancel(): void {
        this.astronaut.cancelOrders();
        super.cancel();
    }

    executeAfterMove(range: number) {
        let diff = this.astronaut.position.diff(this.orderTarget);
        const c = this.astronaut.position.clone().sub(diff.sub(diff.clone().normalize(range)));
        this.astronaut.targetPosition.set(c);
        this.storedTarget = this.orderTarget.clone();
        this.astronaut.queueOrder(this);
        if (game.orderManager.currentOrder == this) game.orderManager.currentOrder = undefined;
    }

    getNearestAsteroid(searchRange: number, aboveSurface: number, drillCheck = false) {
        let asteroids = Array.from(game.objects.getAll("asteroid"));
        let asteroid = undefined;
        this.storedTarget = undefined;
        let dist = searchRange;
        let respoint = new Vector();
        for (const ast of asteroids) {
            if (!ast.canBuildDrill && drillCheck) continue;
            let res = game.system.raycast(this.orderTarget, ast, (body) => body == ast.collider);
            if (!res) continue
            let useDist = Vector.fromLike(res.point).distance(this.orderTarget);
            if (useDist < dist && useDist > 50) {
                respoint.set(res.point);
                asteroid = ast;
                dist = useDist;
            }
        }

        if (asteroid && dist > aboveSurface) {
            this.storedTarget = respoint.add(this.orderTarget.diff(respoint).normalize(aboveSurface));
        }

        return asteroid
    }
}


export class AstronautThrowFlare extends AstronautOrder {
    sprite: Sprite;
    item: ItemType;
    flare: typeof FlareCore;

    constructor(astronaut: Astronaut, flare: typeof FlareCore, item: ItemType) {
        super(astronaut);
        this.astronaut = astronaut;
        this.item = item;
        this.flare = flare;
        const texture = asset("circle");
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(this.flare.prototype.range / texture.width * 2);
        game.containers.overlay.addChild(this.sprite);
        astronaut.cancelOrders();
    }

    override plan() {
        game.controls.requestMouse(MousePriority.order, () => {
            let inRange = this.orderTarget.distanceSquared(this.astronaut) < 500 ** 2;
            if (game.controls.clicked && this.astronaut.itemCount(this.item) > 0) {
                if (inRange) {
                    this.execute();
                } else {
                    this.executeAfterMove(500);
                }
            }
        });
    }

    override show(): void {
        this.sprite.position.set(...this.orderTarget.xy())
        let inRange = this.orderTarget.distanceSquared(this.astronaut) < 500 ** 2;
        if (inRange) {
            this.sprite.tint = 0x55ff55;
        } else {
            this.sprite.tint = 0xffff55;
        }
    }

    execute(): void {
        const flare = new this.flare(this.astronaut.position);
        flare.toss(this.orderTarget.clone());
        this.astronaut.spendItem(this.item);
        this.destroy();
    }



    override destroy(): void {
        super.destroy();
        this.sprite.destroy();
    }
}

export class AstronautGrabFlare extends AstronautOrder {
    flare?: FlareCore;

    constructor(astronaut: Astronaut) {
        super(astronaut);
        this.astronaut = astronaut;
        astronaut.cancelOrders();
    }

    override plan() {
        game.controls.requestMouse(MousePriority.selectOrderTarget, () => {

            if (game.hovered instanceof FlareCore) {
                this.flare = game.hovered;
            } else {
                return false;
            }

            let inRange = this.astronaut.position.distance(this.flare) < 100;

            if (game.controls.clicked) {
                if (inRange) {
                    this.execute();
                } else {
                    this.executeAfterMove(100);
                }
            }
        });
    }


    execute(): void {
        this.astronaut.grabbedFlare = this.flare;
        this.flare!.grabbedBy = this.astronaut;
        this.destroy();
    }
}

export class AstronautCollectItem extends AstronautOrder {
    target?: CoreObject & IPickupable;

    constructor(astronaut: Astronaut) {
        super(astronaut);
        this.astronaut = astronaut;
        astronaut.cancelOrders();
    }

    override plan() {
        game.controls.requestMouse(MousePriority.selectOrderTarget, () => {

            if (game.hovered && (game.hovered.tags.has("pickupable") || game.hovered.pickupProxy)) {
                if (game.hovered.pickupProxy) {
                    this.target = game.hovered.pickupProxy as unknown as IPickupable & CoreObject;
                } else {
                    this.target = game.hovered as unknown as IPickupable & CoreObject;
                }
            } else {
                return false;
            }

            let inRange = this.astronaut.position.distance(this.target) < 50;

            if (game.controls.clicked) {
                if (inRange) {
                    this.execute();
                } else {
                    this.executeAfterMove(50);
                }
                return true;
            }

            return false;
        });
    }


    execute(): void {
        if (this.target && game.objects.getAll("pickupable").has(this.target)) {
            const left = this.astronaut.pickup(this.target.checkPickup());
            if (left == 0) this.target.destroy();
        } else {
            game.log("Item no longer available", this.astronaut, "warn");
        }
        this.destroy();
    }
}





export class AstronautTossGrabbedFlare extends AstronautOrder {
    sprite: Sprite;

    constructor(astronaut: Astronaut) {
        super(astronaut);
        this.astronaut = astronaut;
        const texture = asset("circle");
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(this.astronaut.grabbedFlare!.range / texture.width * 2);
        game.containers.overlay.addChild(this.sprite);
        astronaut.cancelOrders();
    }

    override plan() {
        game.controls.requestMouse(MousePriority.order, () => {
            let inRange = this.orderTarget.distanceSquared(this.astronaut) < 500 ** 2;
            if (game.controls.clicked) {
                if (inRange) {
                    this.execute();
                } else {
                    this.executeAfterMove(500);
                }
            }
        });
    }

    override show(): void {
        this.sprite.position.set(...this.orderTarget.xy())
        let inRange = this.orderTarget.distanceSquared(this.astronaut) < 500 ** 2;
        if (inRange) {
            this.sprite.tint = 0x55ff55;
        } else {
            this.sprite.tint = 0xffff55;
        }
    }

    execute(): void {
        if (this.astronaut.grabbedFlare) {
            this.astronaut.grabbedFlare!.toss(this.orderTarget.clone());
        }
        this.astronaut.grabbedFlare = undefined;
        this.destroy();
    }



    override destroy(): void {
        super.destroy();
        this.sprite.destroy();
    }
}

export class AstronautMove extends AstronautOrder {
    sprite: Sprite;

    drillToOperate?: Drill;
    intendToBoard = false;

    constructor(astronaut: Astronaut) {
        super(astronaut);
        const texture = asset("astronaut");
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);
        game.containers.overlay.addChild(this.sprite);
        astronaut.cancelOrders();
    }

    override plan() {
        game.controls.requestMouse(MousePriority.selectOrderTarget, () => {
            this.sprite.position.set(...this.orderTarget.xy())
            this.sprite.tint = 0x55ff55;
            this.sprite.rotation = this.orderTarget.diff(this.astronaut).toAngle();

            this.sprite.visible = true;
            if (game.hovered && (game.hovered != game.ship && game.hovered != this.astronaut)) this.sprite.visible = false;

            if (game.controls.pointerDown) {
                if (game.hovered instanceof Drill) {
                    this.drillToOperate = game.hovered;
                    this.execute();
                    return true;
                }

                if (game.hovered instanceof Ship) {
                    this.astronaut.enterShipIntent = true;
                    this.execute();
                    return true;
                }

                if (game.hovered && (game.hovered != game.ship && game.hovered != this.astronaut)) return false;
                this.execute();

                return true
            }

            return false;
        });
    }

    execute(): void {
        if (this.astronaut.operatedDrill) {
            this.astronaut.operatedDrill.operator = undefined;
            this.astronaut.operatedDrill = undefined;
        }

        this.astronaut.targetPosition.set(this.orderTarget);

        if (this.drillToOperate) {
            this.astronaut.operatedDrill = this.drillToOperate;
            this.drillToOperate.operator = this.astronaut;
            this.astronaut.targetPosition.set(this.drillToOperate);
        }

    }

    override destroy(): void {
        super.destroy();
        this.sprite.destroy();
    }
}

export class AstronautPlaceInstallation extends AstronautOrder {
    asteroid?: Asteroid;
    sprite: Sprite;
    girder: TilingSprite;
    item: ItemType;
    installation: typeof Installation;

    constructor(astronaut: Astronaut, installation: typeof Installation, item: ItemType = ItemType.ConstructionParts) {
        super(astronaut);
        this.item = item;
        this.installation = installation;
        const texture = asset("circle");
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);
        game.containers.overlay.addChild(this.sprite);

        const girderTexture = asset("girder")
        this.girder = new TilingSprite({
            texture: girderTexture,
            width: girderTexture.width,
            height: 1,
        });
        game.containers.girder.addChild(this.girder);
        this.girder.anchor.set(0.5, 1);
        astronaut.cancelOrders();
    }

    override plan() {
        game.controls.requestMouse(MousePriority.order, () => {

            this.asteroid = this.getNearestAsteroid(500, 300);

            let inRange = this.orderTarget.distance(this.astronaut) < 200;

            if (this.asteroid && game.controls.clicked && this.astronaut.itemCount(this.item) > 0) {
                if (inRange) {
                    this.execute();
                } else {
                    this.executeAfterMove(200);
                }
            }
        });
    }

    show() {
        this.sprite.position.set(...this.orderTarget.xy())
        let inRange = this.orderTarget.distance(this.astronaut) < 200;

        this.sprite.tint = 0xff5555;
        this.girder.tint = 0xff5555;
        if (this.asteroid) {

            let asteroidDist = this.orderTarget.distance(this.asteroid);

            this.girder.position.set(...this.orderTarget.xy());
            this.girder.rotation = this.asteroid.position.diff(this.orderTarget).toAngle() + Math.PI / 2;
            this.girder.height = asteroidDist;
            this.girder.visible = true;

            if (inRange) {
                this.sprite.tint = 0x55ff55;
                this.girder.tint = 0x55ff55;
            } else {
                this.sprite.tint = 0xffff55;
                this.girder.tint = 0xffff55;
            }
        } else {
            this.girder.visible = false;
        }
    }

    execute(): void {
        const installation = new this.installation(this.orderTarget, this.asteroid);
        this.astronaut.spendItem(this.item);
        this.destroy();
    }

    override destroy(): void {
        super.destroy();
        this.sprite.destroy();
        this.girder.destroy();
    }
}



export class AstronautPlaceDrill extends AstronautOrder {
    asteroid?: Asteroid;
    sprite: Sprite;
    girder: TilingSprite;
    item: ItemType;

    constructor(astronaut: Astronaut, item: ItemType = ItemType.DrillParts) {
        super(astronaut);
        this.item = item;
        const texture = asset("drill");
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);
        game.containers.overlay.addChild(this.sprite);

        const girderTexture = asset("drillbit")
        this.girder = new TilingSprite({
            texture: girderTexture,
            width: girderTexture.width,
            height: 1,
        });
        game.containers.girder.addChild(this.girder);
        this.girder.anchor.set(0.5, 1);
        astronaut.cancelOrders();
    }

    override plan() {
        game.controls.requestMouse(MousePriority.order, () => {
            this.asteroid = this.getNearestAsteroid(500, 150, true);
            let inRange = this.orderTarget.distance(this.astronaut) < 200;

            if (this.asteroid && game.controls.clicked && this.astronaut.itemCount(this.item) > 0) {
                if (inRange) {
                    this.execute();
                } else {
                    this.executeAfterMove(200);
                }
            }
        });


    }

    execute() {
        const installation = new DrillInstallation(this.orderTarget, this.asteroid!);
        this.astronaut.spendItem(this.item);
        this.astronaut.targetPosition.set(installation);
        this.astronaut.operatedDrill = installation.drill;
        installation.drill.operator = this.astronaut;
        this.destroy();
    }

    show(): void {
        this.sprite.position.set(...this.orderTarget.xy())
        let inRange = this.orderTarget.distance(this.astronaut) < 500;

        this.sprite.tint = 0xff5555;
        this.girder.tint = 0xff5555;
        if (this.asteroid) {
            let asteroidDist = this.orderTarget.distance(this.asteroid);
            this.girder.position.set(...this.orderTarget.xy());
            this.girder.rotation = this.asteroid.position.diff(this.orderTarget).toAngle() + Math.PI / 2;
            this.sprite.rotation = this.asteroid.position.diff(this.orderTarget).toAngle();
            this.girder.height = asteroidDist;
            this.girder.visible = true;
            if (inRange) {
                this.sprite.tint = 0x55ff55;
                this.girder.tint = 0x55ff55;
            } else {
                this.sprite.tint = 0xffff55;
                this.girder.tint = 0xffff55;
            }

        } else {
            this.girder.visible = false;
        }
    }

    override destroy(): void {
        super.destroy();
        this.sprite.destroy();
        this.girder.destroy();
    }
}

export class RotateTo extends Order {
    override plan() {
        game.controls.requestPointerDown(MousePriority.selectOrderTarget, () => {
            if (game.hovered && game.hovered != game.ship) return false;
            game.ship.targetRotation = this.orderTarget.diff(game.ship).toAngle();
        });
    }
}

export class TranslateTo extends Order {
    override plan() {
        game.controls.requestPointerDown(MousePriority.selectOrderTarget, () => {
            if (game.hovered && game.hovered != game.ship) return false;
            game.ship.targetPosition.set(this.orderTarget);
        });
    }
}


export class MoveTo extends Order {
    override plan() {
        game.controls.requestPointerDown(MousePriority.selectOrderTarget, () => {
            if (game.hovered && game.hovered != game.ship) return false;
            game.ship.targetPosition.set(this.orderTarget);
            game.ship.targetRotation = this.orderTarget.diff(game.ship).toAngle();
        });
    }
}


export class ShipPickupItem extends Order {
    sprite: Sprite;

    get range() {
        return game.ship.size + 200
    }

    constructor() {
        super();
        const texture = asset("circle");
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(this.range / texture.width * 2);
        game.containers.overlay.addChild(this.sprite);
    }

    target?: CoreObject & IPickupable;

    override plan() {
        game.controls.requestMouse(MousePriority.selectOrderTarget, () => {

            if (game.hovered && (game.hovered.tags.has("pickupable") || game.hovered.pickupProxy)) {
                if (game.hovered.pickupProxy) {
                    this.target = game.hovered.pickupProxy as unknown as IPickupable & CoreObject;
                } else {
                    this.target = game.hovered as unknown as IPickupable & CoreObject;
                }
            } else {
                return false;
            }

            let inRange = game.ship.position.distance(this.target) < this.range;

            if (game.controls.clicked) {
                if (!inRange) {
                    game.log("Target not in range for pickup", this.target, "warn");
                    this.destroy();
                } else {
                    this.execute();
                }
            }
        });
    }

    show(): void {
        this.sprite.position.set(game.ship.x, game.ship.y);
    }


    execute(): void {
        if (this.target) {
            const left = game.ship.pickup(this.target.checkPickup());
            if (left == 0) this.target.destroy();
        }
        this.destroy();
    }

    destroy(): void {
        super.destroy();
        this.sprite.destroy();
    }

}

export class SpotlightTarget extends Order {
    spotlight: Spotlight;
    constructor(spotlight: Spotlight) {
        super();
        this.spotlight = spotlight;
    }
    override plan() {
        game.controls.requestPointerDown(MousePriority.order, () => {
            this.spotlight.targetPosition.set(this.orderTarget.clone());
        })
    }
}

