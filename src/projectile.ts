import { DifferenceBlend, Sprite } from "pixi.js";
import { CoreObject } from "./core";
import { game } from "./game";
import { Vector, Vectorlike } from "./vector";
import { asset } from "./util";
import { Spirit } from "./spirit";


export class Projectile extends CoreObject {
    velocity = new Vector(-2, 0);
    life = 0;
    maxLife = 3;

    sprite: Sprite;

    constructor(position: Vectorlike) {
        super("updatable");
        this.position.set(position);
        this.sprite = new Sprite(asset("projectile"));
        this.sprite.anchor.set(0.5);
        game.containers.projectile.addChild(this.sprite);
        let dist = 5000;
        this.life = this.maxLife;
        let nearest = undefined as unknown as Spirit;
        for (const spirit of Array.from(game.objects.getAll("spirit"))) {
            if (spirit.power <= 1) continue;
            let cdist = spirit.position.distance(this);
            if (cdist < dist) {
                dist = cdist;
                nearest = spirit;
            }
        }


        if (nearest) {
            this.velocity = nearest.position.clone().add(nearest.velocity.clone().mult(dist / 4)).diff(this).normalize(4);
        }

        this.sprite.rotation = this.velocity.toAngle();

        this.update();

    }

    update() {
        this.position.add(this.velocity.clone().mult(game.dt));
        const spirits = game.objects.getAll("spirit");
        this.sprite.position.set(this.x, this.y);

        for (const spirit of spirits) {
            if (spirit.position.distanceSquared(this) < 100 ** 2) {
                this.destroy();
                spirit.projectileHit(1);
                spirit.velocity.add(this.position.diff(spirit).normalize(-2));
            }
        }

        this.life -= game.dts;
        if (this.life <= 0) {
            this.destroy();
        }

    }

    destroy(): void {
        super.destroy();
        this.sprite.destroy();
    }
}