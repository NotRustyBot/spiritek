import { Sprite } from "pixi.js";
import { PolygonRepeller, RangeRepeller } from "./repeller";
import { CoreObject } from "./core";
import { Vector, Vectorlike } from "./vector";
import { angleInterpolate, asset, rotate } from "./util";
import { game } from "./game";
import { Spirit } from "./spirit";
import { Clocky } from "./clocky";

export class ShipModule {
    slot: number;
    constructor(slot: number) {
        this.slot = slot;
    }
}

export class Spotlight extends CoreObject {
    repeller: PolygonRepeller;
    light: Sprite;
    sprite: Sprite;

    polygon: Array<Vectorlike>;

    aimAngle = 0;

    targetPosition = new Vector();

    constructor() {
        super("updatable", "drawable");
        this.light = new Sprite(asset("floodlight"));
        this.light.anchor.set(0, 0.5);
        game.containers.light.addChild(this.light);
        this.repeller = new PolygonRepeller();
        this.polygon = [
            {
                "x": 0,
                "y": 0
            },
            {
                "x": 0.8,
                "y": 0.4,
            },
            {
                "x": 1,
                "y": 0,
            },
            {
                "x": 0.8,
                "y": -0.4,
            }
        ]
        const scale = 2000;
        this.polygon = this.polygon.map(n => ({ x: n.x * scale, y: n.y * scale }));
        this.repeller.setPolygon(this.polygon);
        this.light.scale.set(scale / 127);

        this.repeller.noStrength = true;

        this.repeller.hit = (s: Spirit) => {
            let proximity = 1 - (s.position.distance(this) / scale) / s.power;
            let power = (proximity) * this.repeller.strength * 0.3;

            if (this.repeller.strength > 0.03) {
                this.repeller.strength -= s.power * 0.1 * game.dts * (1 - proximity) * this.repeller.strength;
            }

            s.affect(-power * game.dts * 60, this);
        }
    }

    update() {
        const targetAngle = this.targetPosition.toAngle();

        if (this.aimAngle != targetAngle) {
            this.aimAngle = angleInterpolate(this.aimAngle, targetAngle, game.dts)
            this.repeller.setPolygon(rotate(this.polygon, this.aimAngle));
        }

        this.repeller.strength += game.dts;
        if (this.repeller.strength > 1) this.repeller.strength = 1;

        const current = Vector.fromAngle(this.aimAngle);
        this.repeller.position.set(current);

    }

    blinker = new Clocky(0.05);

    draw() {
        this.light.position.set(this.repeller.x, this.repeller.y);
        if (this.blinker.check()) this.light.alpha = 0.2 * (1 + (1 - this.repeller.strength) * Math.random());
        this.light.rotation = this.aimAngle;
    }
}