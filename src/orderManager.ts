import { Assets, Sprite, TilingSprite } from "pixi.js";
import { Astronaut } from "./astronaut";
import { CoreObject } from "./core";
import { FlareCore, KillFlare, RepellFlare } from "./flare";
import { game } from "./game";
import { MousePriority } from "./input";
import { asset, toNearest } from "./util";
import { ItemType } from "./items";
import { Installation, SpotlightInstallation } from "./installation";
import { Spotlight } from "./spotlight";

export class OrderManager extends CoreObject {

    currentOrder?: Order;
    constructor() {
        super("updatable");
    }

    newOrder(order: Order) {
        this.currentOrder?.destroy();
        this.currentOrder = order;
        game.uiManager.updateObjectOptions(game.selected?.uiData);
    }

    update() {
        this.currentOrder?.update();
    }

    cancel() {
        this.currentOrder?.destroy();
    }
}

class Order {
    update() { }

    destroy() {
        if (game.orderManager.currentOrder == this) game.orderManager.currentOrder = undefined;
        game.uiManager.updateObjectOptions(game.selected?.uiData);

    }
}



export class AstronautThrowFlare extends Order {
    astronaut: Astronaut;
    sprite: Sprite;
    item: ItemType;
    flare: typeof FlareCore;

    constructor(astronaut: Astronaut, flare: typeof FlareCore, item: ItemType) {
        super();
        this.astronaut = astronaut;
        this.item = item;
        this.flare = flare;
        const texture = asset("circle");
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(this.flare.prototype.range / texture.width * 2);
        game.containers.overlay.addChild(this.sprite);
    }

    override update() {
        game.controls.requestMouse(MousePriority.order, () => {
            this.sprite.position.set(...game.controls.worldMouse.xy())
            let inRange = game.controls.worldMouse.distance(this.astronaut) < 500;
            if (inRange) {
                this.sprite.tint = 0x55ff55;
            } else {
                this.sprite.tint = 0xff5555;
            }

            if (inRange && game.controls.clicked && this.astronaut.itemCount(this.item) > 0) {
                const flare = new this.flare();
                flare.position = game.controls.worldMouse.clone();
                this.astronaut.spendItem(this.item);
                this.destroy();
            }
        });
    }

    override destroy(): void {
        super.destroy();
        this.sprite.destroy();
    }
}


export class AstronautMove extends Order {
    astronaut: Astronaut;
    sprite: Sprite;

    constructor(astronaut: Astronaut) {
        super();
        this.astronaut = astronaut;
        const texture = asset("astronaut");
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);
        game.containers.overlay.addChild(this.sprite);
    }

    override update() {
        game.controls.requestMouse(MousePriority.selectOrderTarget, () => {
            this.sprite.position.set(...game.controls.worldMouse.xy())
            this.sprite.tint = 0x55ff55;
            this.sprite.rotation = game.controls.worldMouse.diff(this.astronaut).toAngle();

            this.sprite.visible = true;
            if (game.hovered && (game.hovered != game.ship && game.hovered != this.astronaut)) this.sprite.visible = false;

            if (game.controls.pointerDown) {
                if (game.hovered && (game.hovered != game.ship && game.hovered != this.astronaut)) return false;
                this.astronaut.targetPosition.set(game.controls.worldMouse);
                return true
            }

            return false;
        });
    }

    override destroy(): void {
        super.destroy();
        this.sprite.destroy();
    }
}

export class AstronautPlaceInstallation extends Order {
    astronaut: Astronaut;
    sprite: Sprite;
    girder: TilingSprite;
    item: ItemType;
    installation: typeof Installation;

    constructor(astronaut: Astronaut, installation: typeof Installation, item: ItemType = ItemType.ConstructionParts) {
        super();
        this.astronaut = astronaut;
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
    }

    override update() {
        game.controls.requestMouse(MousePriority.order, () => {
            this.sprite.position.set(...game.controls.worldMouse.xy())
            const asteroid = Array.from(game.objects.getAll("asteroid")).reduce(toNearest(game.controls.worldMouse));
            let asteroidDist = game.controls.worldMouse.distance(asteroid);
            let astInRange = asteroidDist < 800;
            let inRange = game.controls.worldMouse.distance(this.astronaut) < 500;

            if (astInRange) {
                this.girder.position.set(...game.controls.worldMouse.xy());
                this.girder.rotation = asteroid.position.diff(game.controls.worldMouse).toAngle() + Math.PI / 2;
                this.girder.height = asteroidDist;
                this.girder.visible = true;
            } else {
                this.girder.visible = false;
            }

            if (inRange && astInRange) {
                this.sprite.tint = 0x55ff55;
                this.girder.tint = 0x55ff55;
            } else {
                this.sprite.tint = 0xff5555;
                this.girder.tint = 0xff5555;
            }

            if (inRange && astInRange && game.controls.clicked && this.astronaut.itemCount(this.item) > 0) {
                const installation = new this.installation(game.controls.worldMouse, asteroid);
                this.astronaut.spendItem(this.item);
                this.destroy();
            }
        });
    }

    override destroy(): void {
        super.destroy();
        this.sprite.destroy();
        this.girder.destroy();
    }
}

class PlaceTurret extends Order {
    override update() {
        game.controls.requestClick(MousePriority.order, () => {

        });
    }
}

class PlaceSpotlight extends Order {
    override update() {
        game.controls.requestClick(MousePriority.order, () => {
            const ast = Array.from(game.objects.getAll("asteroid")).reduce(toNearest(game.controls.worldMouse));
            const turret = new SpotlightInstallation(game.controls.worldMouse, ast);
        });
    }
}


export class RotateTo extends Order {
    override update() {
        game.controls.requestPointerDown(MousePriority.selectOrderTarget, () => {
            if (game.hovered != game.ship) return false;
            game.ship.targetRotation = game.controls.worldMouse.diff(game.ship).toAngle();
        });
    }
}

export class TranslateTo extends Order {
    override update() {
        game.controls.requestPointerDown(MousePriority.selectOrderTarget, () => {
            if (game.hovered && game.hovered != game.ship) return false;
            game.ship.targetPosition.set(game.controls.worldMouse);
        });
    }
}


export class MoveTo extends Order {
    override update() {
        game.controls.requestPointerDown(MousePriority.selectOrderTarget, () => {
            if (game.hovered && game.hovered != game.ship) return false;
            game.ship.targetPosition.set(game.controls.worldMouse);
            game.ship.targetRotation = game.controls.worldMouse.diff(game.ship).toAngle();
        });
    }
}


export class SpotlightTarget extends Order {
    spotlight: Spotlight;
    constructor(spotlight: Spotlight) {
        super();
        this.spotlight = spotlight;
    }
    override update() {
        game.controls.requestPointerDown(MousePriority.order, () => {
            this.spotlight.targetPosition.set(game.controls.worldMouse.clone());
        })
    }
}

