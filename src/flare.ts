import { Sprite } from "pixi.js";
import { CoreObject } from "./core";
import { asset, interpolateColors } from "./util";
import { RangeRepeller } from "./repeller";
import { Clocky } from "./clocky";
import { game } from "./game";
import { Spirit } from "./spirit";
import { ISelectable } from "./types";
import { Common } from "./common";
import { Vector, Vectorlike } from "./vector";
import { Astronaut } from "./astronaut";

export class FlareCore extends CoreObject implements ISelectable {
    sprite: Sprite;
    glow: Sprite;
    repeller = new RangeRepeller();
    grabbedBy?: Astronaut;

    clocky: Clocky;

    strength = 0;

    targetPosition = new Vector();
    tossed = false;

    tossClock: Clocky;

    toss(position: Vectorlike) {
        this.targetPosition.set(position);
        this.tossClock.time = 0;
        this.tossClock.stop = false;
    }


    get range() { return 500 };
    color = 0xffff00;
    constructor(position: Vectorlike) {
        super("updatable", "drawable", "selectable", "scenebound");
        this.sprite = new Sprite(asset("flare"));
        game.containers.items.addChild(this.sprite);

        this.sprite.anchor.set(0.5);
        this.glow = new Sprite(asset("light"));
        game.containers.light.addChild(this.glow);
        this.glow.anchor.set(0.5);
        this.tossClock = Clocky.once(1);
        this.tossClock.during = () => { this.position.set(Vector.lerp(position, this.targetPosition, this.tossClock.progress)) }
        this.tossClock.tick = () => { this.position.set(this.targetPosition) }

        this.repeller.hit = (spirit: Spirit) => {
            this.hit(spirit)
        };
        this.clocky = Clocky.sequence([
            {
                time: 1,
                during: () => {
                    this.sprite.tint = interpolateColors(0x111111, this.color, this.clocky.progress);
                    this.repeller.range = this.clocky.progress * this.range;
                }
            }
        ]);

        this.update();
    }

    size = 50;

    hover() {
        Common.hover(this, this.sprite);
    }

    unhover() {
        Common.unhover(this, this.sprite);
    }

    hit(power: Spirit) { }

    update() {
        this.clocky.check();
        this.tossClock.check();

        this.repeller.x = this.x;
        this.repeller.y = this.y;

        if (this.strength < 1) {
            this.strength = Math.min(1, this.strength + game.dt);
        }
    }

    draw() {
        this.glow.scale.set(this.strength / 256 * this.range * 2);
        this.glow.tint = interpolateColors(0x111111, this.color, this.strength);
        this.glow.alpha = this.strength * 0.2;

        this.sprite.rotation = this.position.x / 100;

        this.repeller.range = this.strength * this.range;

        this.sprite.position.set(this.x, this.y);
        this.glow.position.set(this.x, this.y);
    }

    destroy(): void {
        super.destroy();
        this.sprite.destroy();
        this.repeller.destroy();
        this.glow.destroy();
        if (this.grabbedBy) this.grabbedBy.grabbedFlare = undefined;
        this.grabbedBy = undefined;
    }
}

export class RepellFlare extends FlareCore {
    color = 0xffff00;
    override get range() { return 500 };

    override hit(spirit: Spirit) {
        if (this.clocky.stop) this.strength -= 0.05;
        if (this.strength < 0.05 && this.clocky.stop) this.destroy();
    }

}


export class KillFlare extends FlareCore {
    color = 0xff0000;
    override get range() { return 300 };

    override hit(spirit: Spirit) {
        if (this.clocky.stop) this.strength -= 0.1;
        spirit.power -= 0.2;
        if (this.strength < 0.05 && this.clocky.stop) this.destroy();
    }
}

export class AttractFlare extends FlareCore { // test
    color = 0xff00ff;
    override get range() { return 800 };

    constructor(position: Vectorlike) {
        super(position);
        this.repeller.strength = -0.025;
        this.repeller.emotional = true;
    }

    override hit(spirit: Spirit) {
        spirit.velocity.sub(spirit.direction);
        this.strength -= 0.01;
    }
}

