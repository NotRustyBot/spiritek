import { CoreObject } from "./core";
import { game } from "./game";
import { AttractFlare, KillFlare, RepellFlare } from "./flare";
import { ShipModule, Spotlight } from "./shipModule";
import { Sprite } from "pixi.js";
import { asset, rotate } from "./util";
import { PolygonRepeller, RangeRepeller } from "./repeller";
import shipHitbox from "./hitbox/ship.json";
import { Spirit } from "./spirit";
import { Clocky } from "./clocky";
import { Projectile } from "./projectile";

export class Ship extends CoreObject {
    action = new SpawnRepellFlare(this);
    repeller: PolygonRepeller;
    attractor: RangeRepeller;
    sprite: Sprite;

    spotlight = new Spotlight();

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

    constructor() {
        super("updatable");
        this.sprite = new Sprite(asset("ship"));
        game.containers.ship.addChild(this.sprite);
        this.sprite.anchor.set(0.5);
        this.attractor = new RangeRepeller();
        this.attractor.range = 2000;
        this.attractor.emotional = true;
        this.attractor.strength = -0.1;
        this.attractor.hit = (spirit: Spirit) => {
            spirit.velocity.sub(spirit.direction.clone().mult(0.9));
        }

        this.repeller = new PolygonRepeller();
        this.repeller.setPolygon(shipHitbox);

        this.x = 1000;
        this.y = 500;
        this.rotation = -1;
    }


    actions = [
        SpawnRepellFlare,
        SpawnKillFlare,
        SpawnAttractFlare,
        MoveSpotlight
    ]

    setAction(index = 0) {
        this.action.destroy();
        this.action = new this.actions[index](this);
    }

    clocky = new Clocky(0.1);

    update() {
        if (game.controls.pressed["Digit1"]) {
            this.setAction(0);
        } else if (game.controls.pressed["Digit2"]) {
            this.setAction(1);
        } else if (game.controls.pressed["Digit3"]) {
            this.setAction(2);
        } else if (game.controls.pressed["Digit4"]) {
            this.setAction(3);
        }


        if (this.clocky.check()) {
            const p = new Projectile(this);
        }

        this.action.update();

        this.repeller.position.set(this);
        this.attractor.position.set(this);
        this.sprite.position.set(this.x, this.y);
        this.sprite.rotation = this.rotation;
    }
}

class ShipAction {
    ship: Ship;
    module?: ShipModule;
    constructor(ship: Ship, module?: ShipModule) {
        this.ship = ship;
        this.module = module;
    }
    get click() {
        return game.controls.click && game.controls.pointerDown;
    }
    update() { }

    destroy() { }
}

class SpawnRepellFlare extends ShipAction {
    override update() {
        if (this.click) {
            game.controls.click = false;
            const flare = new RepellFlare();

            flare.position = game.camera.position.clone();
            flare.position = game.controls.worldMouse.clone();
        }
    }
}

class SpawnKillFlare extends ShipAction {
    override update() {
        if (this.click) {
            game.controls.click = false;
            const flare = new KillFlare();

            flare.position = game.camera.position.clone();
            flare.position = game.controls.worldMouse.clone();
        }
    }
}

class SpawnAttractFlare extends ShipAction {
    override update() {
        if (this.click) {
            game.controls.click = false;
            const flare = new AttractFlare();

            flare.position = game.camera.position.clone();
            flare.position = game.controls.worldMouse.clone();
        }
    }
}

class MoveSpotlight extends ShipAction {
    override update() {
        if (game.controls.pointerDown) {
            this.ship.spotlight.targetPosition.set(game.controls.worldMouse.clone());
        }
    }
}