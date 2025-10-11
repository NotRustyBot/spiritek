import { Sprite, TilingSprite } from "pixi.js";
import { Asteroid } from "./asteroid";
import { Vectorlike } from "./vector";
import { CoreObject } from "./core";
import { game } from "./game";
import { asset } from "./util";
import { Turret } from "./turret";
import { RangeRepeller } from "./repeller";
import { Spirit } from "./spirit";
import { Spotlight } from "./spotlight";

export class Installation extends CoreObject {
    parentAsteroid?: Asteroid;
    girder?: TilingSprite;
    attractor = new RangeRepeller();
    resist = 100;
    underAttack = false;

    constructor(position: Vectorlike, asteroid?: Asteroid) {
        super("updatable");
        this.parentAsteroid = asteroid;
        this.position.set(position);

        if (asteroid) {
            const dist = asteroid.position.distance(position);
            const texture = asset("girder")
            this.girder = new TilingSprite({
                texture: texture,
                width: texture.width,
                height: dist,
            });
            game.containers.girder.addChild(this.girder);
            this.girder.position.set(this.x, this.y);
            this.girder.rotation = asteroid.position.diff(this).toAngle() + Math.PI / 2;
            this.girder.anchor.set(0.5, 1);
        }

        this.attractor.strength = -1;
        this.attractor.emotional = true;
        this.attractor.range = 800;

        this.attractor.hit = (spirit: Spirit) => {
            if (spirit.position.distanceSquared(this) < 100 ** 2) {
                this.resist -= game.dt * 5;
                this.underAttack = true;
            }
        }
    }

    update() {
        this.attractor.range = 800 * (this.resist / 100);
        this.attractor.position.set(this);
    };

}

export class TurretInstallation extends Installation {
    turret = new Turret();

    override update(): void {
        super.update();
        this.turret.confused = this.resist < 90;
        if (this.resist < 100 && !this.underAttack && this.resist > 90) {
            this.resist += 10 * game.dt;
        }

        this.underAttack = false;
        this.turret.position.set(this);
    }
}


export class SpotlightInstallation extends Installation {
    spotlight = new Spotlight();

    override update(): void {
        super.update();
        this.spotlight.confused = this.resist < 90;
        if (this.resist < 100 && !this.underAttack && this.resist > 90) {
            this.resist += 10 * game.dt;
        }

        this.underAttack = false;
        this.spotlight.position.set(this);
    }
}