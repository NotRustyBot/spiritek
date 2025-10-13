import { CoreObject } from "./core";
import { game } from "./game";
import { AttractFlare, KillFlare, RepellFlare } from "./flare";
import { ShipFloodlight, ShipModule, ShipTurret } from "./shipModule";
import { Spotlight } from "./spotlight";
import { Sprite } from "pixi.js";
import { angleDistance, angleInterpolate, asset, rotate, toNearest } from "./util";
import { PolygonRepeller, RangeRepeller } from "./repeller";
import shipHitbox from "./hitbox/ship.json";
import { Spirit } from "./spirit";
import { Clocky } from "./clocky";
import { Projectile } from "./projectile";
import { Vector } from "./vector";
import { Turret } from "./turret";
import { SpotlightInstallation, TurretInstallation } from "./installation";
import { MousePriority } from "./input";
import { ISelectable } from "./types";
import { ISelectableBase } from "./select";
import { TestRitual } from "./ritual";
import { ObjectOptionsData } from "./ui/objectOptions";
import { TranslateTo, RotateTo, MoveTo } from "./orderManager";

export class Ship extends CoreObject implements ISelectable {
    repeller: PolygonRepeller;
    attractor: RangeRepeller;
    sprite: Sprite;
    overlaySprite: Sprite;

    spotlightL: ShipFloodlight;
    spotlightR: ShipFloodlight;
    turret: ShipTurret;

    resist = 1000;
    ui = {
        setResist: (value: string) => { }
    }

    get uiData(): ObjectOptionsData {
        return {
            name: "Spiritek",
            stats: [
                {
                    name: "resist",
                    updateHandler: (updater) => {
                        this.ui.setResist = updater;
                    }
                }
            ],
            actions: [
                {
                    name: "Move",
                    icon: "img/ship.png",
                    active: () => (game.orderManager.currentOrder instanceof MoveTo),
                    action: () => {
                        const order = new MoveTo();
                        game.orderManager.newOrder(order);
                    }
                },
                {
                    name: "Translate",
                    icon: "img/ship.png",
                    active: () => (game.orderManager.currentOrder instanceof TranslateTo),
                    action: () => {
                        const order = new TranslateTo();
                        game.orderManager.newOrder(order);
                    }
                },
                {
                    name: "Rotate",
                    icon: "img/ship.png",
                    active: () => (game.orderManager.currentOrder instanceof RotateTo),
                    action: () => {
                        const order = new RotateTo();
                        game.orderManager.newOrder(order);
                    }
                }
            ]
        }
    }

    private _rotation = 0;
    get rotation() {
        return this._rotation;
    }

    set rotation(value) {
        if (value != this._rotation) {
            this._rotation = value;
            this.repeller.setPolygon(rotate(shipHitbox, value));
        }
    }

    targetRotation = -1;
    targetPosition = new Vector();

    constructor() {
        super("updatable", "selectable");
        this.sprite = new Sprite(asset("ship"));
        game.containers.ship.addChild(this.sprite);
        this.sprite.anchor.set(0.5);

        this.overlaySprite = new Sprite(asset("ship"));
        game.containers.overlay.addChild(this.overlaySprite);
        this.overlaySprite.anchor.set(0.5);
        this.overlaySprite.tint = 0x55ff55;

        this.attractor = new RangeRepeller();
        this.attractor.range = 1800;
        this.attractor.emotional = true;
        this.attractor.strength = -1;

        this.repeller = new PolygonRepeller();
        this.repeller.setPolygon(shipHitbox);
        this.repeller.hit = (spirit: Spirit) => {
            this.resist -= game.dt * 4;
        };

        this.spotlightL = new ShipFloodlight({ x: -50, y: 100 }, this);
        this.spotlightR = new ShipFloodlight({ x: -50, y: -100 }, this);

        this.turret = new ShipTurret({ x: 300, y: 0 }, this);
        this.turret.turret.range = 1500;

        this.spotlightL.spotlight.targetPosition.set(-1000, 500);
        this.spotlightR.spotlight.targetPosition.set(-1000, -500);

        this.rotation = -1;
    }

    size = 500;

    select(): void {
        const order = new MoveTo();
        game.orderManager.newOrder(order);
    }

    hover(): void {
        ISelectableBase.hover(this, this.sprite);
    }

    unhover(): void {
        ISelectableBase.unhover(this, this.sprite);
    }

    hoverCheck(): boolean {
        return this.repeller.check(game.controls.worldMouse);
    }

    clocky = new Clocky(1);

    update() {
        this.repeller.position.set(this);
        this.attractor.position.set(this);
        this.sprite.position.set(this.x, this.y);
        this.sprite.rotation = this.rotation;

        this.overlaySprite.position.set(this.targetPosition.x, this.targetPosition.y);
        this.overlaySprite.rotation = this.targetRotation;

        const rotSpeed = 0.3;
        if (this.rotation != this.targetRotation) {
            this.rotation = angleInterpolate(this.rotation, this.targetRotation, game.dt * rotSpeed);
        }

        const dsq = this.position.distanceSquared(this.targetPosition);
        if (dsq > 1) {
            const diff = this.targetPosition.diff(this);
            const align = Math.abs(angleDistance(diff.toAngle(), this.rotation)) < 1 ? 1 : 0.3;
            const speed = 100 * game.dt * align;
            if (dsq < speed) {
                this.position.set(this.targetPosition);
            } else {
                this.position.add(diff.normalize(speed));
            }
            this.overlaySprite.visible = true;
        } else {
            this.overlaySprite.visible = false;
        }

        this.ui.setResist(this.resist.toFixed(0));

        this.spotlightL.update();
        this.spotlightR.update();
        this.turret.update();
    }
}

