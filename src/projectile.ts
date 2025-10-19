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

    constructor(position: Vectorlike, target: Spirit | undefined, fallbackAngle: number) {
        super("updatable", "scenebound");
        this.position.set(position);
        this.sprite = new Sprite(asset("projectile"));
        this.sprite.anchor.set(0.5);
        game.containers.projectile.addChild(this.sprite);
        this.life = this.maxLife;



        if (target) {
            let dist = this.position.distance(target);
            this.velocity = target.position.clone().add(target.velocity.clone().mult(dist / 4)).diff(this).normalize(4);
        } else {
            this.velocity = Vector.fromAngle(fallbackAngle).mult(4);
        }

        this.sprite.rotation = this.velocity.toAngle();

        this.update();

    }

    update() {
        this.position.add(this.velocity.clone().mult(game.dtms));
        const spirits = game.objects.getAll("spirit");
        this.sprite.position.set(this.x, this.y);

        for (const spirit of spirits) {
            if (spirit.position.distanceSquared(this) < 100 ** 2) {
                this.destroy();
                spirit.projectileHit(0.34);
                spirit.velocity.add(this.position.diff(spirit).normalize(-2));
            }
        }

        this.life -= game.dt;
        if (this.life <= 0) {
            this.destroy();
        }

    }

    destroy(): void {
        super.destroy();
        this.sprite.destroy();
    }
}