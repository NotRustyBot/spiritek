import { OutlineFilter } from "pixi-filters";
import { Sprite } from "pixi.js";
import { Clocky } from "./clocky";
import { CoreObject } from "./core";
import { game } from "./game";
import { PolygonRepeller } from "./repeller";
import { Spirit } from "./spirit";
import { ISelectable } from "./types";
import { asset, angleInterpolate, rotate } from "./util";
import { Vectorlike, Vector } from "./vector";
import { ISelectableBase } from "./select";
import { Projectile } from "./projectile";


export class Turret extends CoreObject implements ISelectable {
    sprite: Sprite;

    size = 100; // selectable

    firerate = new Clocky(1);

    aimAngle = 0;
    range = 3000;

    confused = false;

    constructor() {
        super("updatable", "drawable", "selectable");
        this.sprite = new Sprite(asset("turret"));
        this.sprite.anchor.set(0.5);
        game.containers.items.addChild(this.sprite);
    }

    hover() {
        ISelectableBase.hover(this, this.sprite);
    }

    unhover() {
        ISelectableBase.unhover(this, this.sprite);
    }

    update() {
        let fireTick = this.firerate.check();

        if (this.confused) {
            this.aimAngle = Math.sin(game.time + this.position.x) * 10;
        } else {

            let nearest = undefined as unknown as Spirit;
            let dist = this.range;
            for (const spirit of Array.from(game.objects.getAll("spirit"))) {
                if (spirit.power <= 1) continue;
                let cdist = spirit.position.distance(this);
                if (cdist < dist) {
                    dist = cdist;
                    nearest = spirit;
                }
            }

            if (nearest) {
                this.aimAngle = nearest.position.diff(this).toAngle();
            }


            if (fireTick && nearest) {
                const proj = new Projectile(this.position, nearest);
            }
        }
    }




    draw() {
        this.sprite.position.set(this.x, this.y);


        if (this.aimAngle != this.sprite.rotation) {
            this.sprite.rotation = angleInterpolate(this.sprite.rotation, this.aimAngle, game.dt * 10);
        }
    }
}
