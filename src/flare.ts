import { Sprite } from "pixi.js";
import { CoreObject } from "./core";
import { asset, interpolateColors } from "./util";
import { RangeRepeller } from "./repeller";
import { Clocky } from "./clocky";
import { game } from "./game";
import { Spirit } from "./spirit";
import { ISelectable } from "./types";
import { OutlineFilter } from "pixi-filters";
import { ISelectableBase } from "./select";
import { Light } from "./lighting/light";
import { Vector } from "./vector";
import { CustomColor } from "./lighting/color";

export class FlareCore extends CoreObject implements ISelectable {
    sprite: Sprite;
    glow: Sprite;
    light: Light;
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

        this.light = new Light({ position: new Vector(this.x, this.y), range: this.range / 10, color: CustomColor.fromPixi(this.color), intensity: 1, width: 4 });

        this.update();
    }

    size = 50;

    hover() {
        ISelectableBase.hover(this, this.sprite);
    }

    unhover() {
        ISelectableBase.unhover(this, this.sprite);
    }

    hit(power: Spirit) { }

    update() {
        this.clocky.check();

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

        this.light.position.set(this.x, this.y);
        this.light.color = CustomColor.fromPixi(this.color);
        this.light.intensity = this.strength * .3;
        this.light.angle = this.sprite.rotation;
        this.glow.alpha = 0;

        this.repeller.range = this.strength * this.range;

        this.sprite.position.set(this.x, this.y);
        this.glow.position.set(this.x, this.y);
    }
}

export class RepellFlare extends FlareCore {
    color = 0xffff00;
    range = 500;

    override hit(spirit: Spirit) {
        this.strength -= 0.05;
    }

}


export class KillFlare extends FlareCore {
    color = 0xff0000;
    range = 300;

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

