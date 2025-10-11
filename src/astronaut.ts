import { Sprite, spritesheetAsset } from "pixi.js";
import { CoreObject } from "./core";
import { asset } from "./util";
import { Vector } from "./vector";
import { game } from "./game";
import { ISelectable } from "./types";
import { ISelectableBase } from "./select";
import { MousePriority } from "./input";
import { RangeRepeller } from "./repeller";
import { Spirit } from "./spirit";



declare module "./types.ts" { interface ObjectKinds { astronaut: Astronaut } }
export class Astronaut extends CoreObject implements ISelectable {
    sprite: Sprite;
    attractor = new RangeRepeller();

    rotation = 0;

    speed = 120;
    resist = 100;
    underAttack = false;

    targetPosition = new Vector();

    constructor() {
        super("updatable", "drawable", "astronaut", "selectable");
        this.sprite = new Sprite(asset("astronaut"));
        this.sprite.anchor.set(0.5);
        game.containers.astronaut.addChild(this.sprite);

        this.attractor.strength = -1;
        this.attractor.emotional = true;
        this.attractor.range = 500;

        this.attractor.hit = (spirit: Spirit) => {
            if (spirit.position.distanceSquared(this) < 100 ** 2) {
                this.resist -= game.dt * 5;
                this.underAttack = true;
            }
        }
    }

    hover(): void {
        ISelectableBase.hover(this, this.sprite);
    }

    unhover(): void {
        ISelectableBase.unhover(this, this.sprite);
    }

    size = 50;

    update() {
        if (game.selected == this) {
            game.controls.requestClick(MousePriority.order, () => {
                this.targetPosition.set(game.controls.worldMouse);
            })
        }

        const dsq = this.position.distanceSquared(this.targetPosition);
        if (dsq > 1) {
            if (dsq < this.speed * game.dt) {
                this.position.set(this.targetPosition);
            } else {
                const diff = this.targetPosition.diff(this);
                this.position.add(diff.normalize(this.speed * game.dt));
                this.rotation = diff.toAngle();
            }
        }

        this.attractor.position.set(this);
    }

    draw() {
        this.sprite.position.set(this.x, this.y);
        this.sprite.rotation = this.rotation;
    }
}