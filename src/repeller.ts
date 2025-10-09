import { Graphics } from "pixi.js";
import { CoreObject } from "./core";
import { Vector, Vectorlike } from "./vector";
import pointInPolygon from "point-in-polygon"
import { game } from "./game";
import { Spirit } from "./spirit";


declare module "./types" { interface ObjectKinds { repeller: IRepeller } }
export interface IRepeller {
    position: Vector;
    strength: number;
    emotional: boolean;
    noStrength: boolean;
    check(pos: Vectorlike): boolean;
    hit(spirit: Spirit): void;
}

export class RangeRepeller extends CoreObject implements IRepeller {
    strength = 1;
    range = 200;
    emotional = false;
    enabled = true;
    noStrength = false;
    constructor() {
        super("repeller", "debug");
    }

    check(pos: Vectorlike) {
        return this.enabled && (this.position.distanceSquared(pos) < this.range ** 2);
    }

    hit = (spirit: Spirit) => { };

    debug(graphics: Graphics) {
        graphics.circle(this.x, this.y, this.range);
        graphics.stroke({ color: 0xffaa00, width: 1 / game.containers.world.scale.x, alpha: this.strength });
    }
}

export class PolygonRepeller extends CoreObject implements IRepeller {
    strength = 1;
    enabled = true;
    emotional = false;
    noStrength = false;
    cachedPolygon = new Array<[number, number]>();
    sourcePolygon = new Array<Vectorlike>();
    boxSize = 0;
    constructor() {
        super("repeller", "debug");
    }

    setPolygon(polygon: Array<Vectorlike>) {
        this.sourcePolygon = polygon;
        this.cachedPolygon = polygon.map(p => [p.x, p.y]);
        this.boxSize = Math.max(...polygon.map(p => Math.max(Math.abs(p.x), Math.abs(p.y))));
    }

    check(pos: Vectorlike) {
        if (!this.enabled) return false;
        if (!(this.position.boxDistance(pos) < this.boxSize ** 2)) return false;
        return pointInPolygon([pos.x - this.x, pos.y - this.y], this.cachedPolygon);
    }

    hit = (strength: Spirit) => { };

    debug(graphics: Graphics) {

        if (this.cachedPolygon.length == 0) return;
        graphics.moveTo(this.x + this.cachedPolygon[0][0], this.y + this.cachedPolygon[0][1]);

        for (const [x, y] of this.cachedPolygon) {
            graphics.lineTo(this.x + x, this.y + y);
        }

        graphics.closePath();


        graphics.stroke({ color: 0xffaa00, width: 1 / game.containers.world.scale.x, alpha: this.strength });
    }
}