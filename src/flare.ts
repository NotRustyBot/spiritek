import { Sprite } from "pixi.js";
import { CoreObject } from "./core";
import { asset, interpolateColors } from "./util";
import { RangeRepeller } from "./repeller";
import { Clocky } from "./clocky";
import { game } from "./game";
import { Spirit } from "./spirit";
import { ISelectable } from "./types";
import { OutlineFilter } from "pixi-filters";

export class FlareCore extends CoreObject implements ISelectable {
    sprite: Sprite;
    glow: Sprite;
    repeller = new RangeRepeller();

    clocky: Clocky;

    strength = 0;


    range = 3000;
    color = 0xffff00;
    constructor() {
        super("updatable", "drawable", "selectable");
        this.sprite = new Sprite(asset("flare"));
        game.containers.items.addChild(this.sprite);
        this.sprite.rotation = Math.random() * Math.PI * 2;
        this.sprite.anchor.set(0.5);
        this.glow = new Sprite(asset("light"));
        game.containers.light.addChild(this.glow);
        this.glow.anchor.set(0.5);

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
        this.sprite.filters = [new OutlineFilter({ color: 0xffffff, thickness: 2 })];
    }

    unhover() {
        this.sprite.filters = [];
    }

    hit(power: Spirit) { }

    update() {
        this.clocky.check();

        this.repeller.x = this.x;
        this.repeller.y = this.y;


        if (this.strength < 1) {
            this.strength = Math.min(1, this.strength + game.dts);
        }
    }

    draw() {
        this.glow.scale.set(this.strength / 256 * this.range * 2);
        this.glow.tint = interpolateColors(0x111111, this.color, this.strength);
        this.glow.alpha = this.strength * 0.2;
        this.repeller.range = this.strength * this.range;

        this.sprite.position.set(this.x, this.y);
        this.glow.position.set(this.x, this.y);
    }
}

export class RepellFlare extends FlareCore {
    color = 0xffff00;
    range = 300;

    override hit(spirit: Spirit) {
        this.strength -= 0.05;
    }

}


export class KillFlare extends FlareCore {
    color = 0xff0000;
    range = 200;

    override hit(spirit: Spirit) {
        this.strength -= 0.1;
        spirit.power -= 0.2;
    }
}

export class AttractFlare extends FlareCore { // test
    color = 0xff00ff;
    range = 800;

    constructor() {
        super();
        this.repeller.strength = -0.025;
        this.repeller.emotional = true;
    }

    override hit(spirit: Spirit) {
        spirit.velocity.sub(spirit.direction);
        this.strength -= 0.01;
    }
}

