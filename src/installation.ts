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
import { Drill } from "./drill";
import { IPickupable } from "./droppedItem";
import { ItemType } from "./items";

export class Installation extends CoreObject {
    parentAsteroid?: Asteroid;
    girder?: TilingSprite;
    attractor = new RangeRepeller();
    resist = 100;
    underAttack = false;

    constructor(position: Vectorlike, asteroid?: Asteroid) {
        super("updatable", "pickupable", "scenebound");
        this.parentAsteroid = asteroid;
        this.position.set(position);

        if (asteroid) {
            const dist = asteroid.position.distance(position);
            const texture = asset("girder");
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
                if (!this.underAttack && this.resist >= 100) {
                    game.log("Infrastructure under attack", this, "warn");
                }

                if (this.resist > 0) {
                    this.resist -= game.dt * 5;
                    this.underAttack = true;
                }
            }
        }
    }

    update() {
        this.attractor.range = 800 * (this.resist / 100)
        this.attractor.position.set(this);
    };

    override destroy(): void {
        super.destroy();
        this.girder?.destroy();
    }

}

export class TurretInstallation extends Installation implements IPickupable {
    turret = new Turret();

    constructor(position: Vectorlike, asteroid: Asteroid) {
        super(position, asteroid);
        this.turret.pickupProxy = this;
    }

    pickup(): void {
        this.destroy();
    }

    override destroy(): void {
        this.turret.destroy();
        super.destroy();
    }

    checkPickup(): { item: ItemType; count: number; } {
        return { item: ItemType.ConstructionParts, count: 1 }
    }

    override update(): void {
        super.update();
        this.turret.confused = this.resist < 90;
        if (this.resist < 100 && !this.underAttack && this.resist) {
            this.resist += 10 * game.dt;
        }

        this.underAttack = false;
        this.turret.position.set(this);
    }
}


export class SpotlightInstallation extends Installation {
    spotlight = new Spotlight();

    constructor(position: Vectorlike, asteroid: Asteroid) {
        super(position, asteroid);
        this.spotlight.pickupProxy = this;
    }

    override update(): void {
        super.update();
        this.spotlight.confused = this.resist < 90;
        if (this.resist < 100 && !this.underAttack) {
            this.resist += 10 * game.dt;
        }

        this.underAttack = false;
        this.spotlight.position.set(this);
    }

    pickup(): void {
        this.destroy();
    }

    override destroy(): void {
        this.spotlight.destroy();
        super.destroy();
    }

    checkPickup(): { item: ItemType; count: number; } {
        return { item: ItemType.ConstructionParts, count: 1 }
    }
}

export class DrillInstallation extends Installation {
    drill: Drill;
    constructor(position: Vectorlike, asteroid: Asteroid) {
        super(position, asteroid);
        this.attractor.enabled = false;
        this.drill = new Drill(asteroid, this);
        this.drill.pickupProxy = this;

        this.attractor.hit = () => { };

        if (asteroid) {
            const texture = asset("drillbit");
            this.girder!.texture = texture;
            this.girder!.width = texture.width;
        }

        this.drill.position.set(position);
        this.drill.rotate();

    }


    pickup(): void {
        this.destroy();
    }

    checkPickup(): { item: ItemType; count: number; } {
        return { item: ItemType.DrillParts, count: 1 }
    }

    override destroy(): void {
        this.drill.destroy();
        super.destroy();
    }

}