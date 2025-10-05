import { Sprite } from "pixi.js";
import { CoreObject } from "./core";
import { asset, interpolateColors } from "./util";
import { RangeRepeller } from "./repeller";
import { Clocky } from "./clocky";
import { game } from "./game";

export class RepellFlare extends CoreObject {
    sprite: Sprite;
    glow: Sprite;
    repeller = new RangeRepeller();

    clocky: Clocky;

    strength = 0;
    constructor() {
        super("updatable");
        this.sprite = new Sprite(asset("flare"));
        game.containers.items.addChild(this.sprite);
        this.sprite.rotation = Math.random() * Math.PI * 2;
        this.sprite.anchor.set(0.5);
        this.glow = new Sprite(asset("light"));
        game.containers.light.addChild(this.glow);
        this.glow.anchor.set(0.5);

        this.repeller.hit = this.hit.bind(this);

        this.clocky = Clocky.sequence([
            {
                time: 1000,
                during: () => {
                    this.sprite.tint = interpolateColors(0x111111, 0xffff00, this.clocky.progress);
                    this.repeller.range = this.clocky.progress * 300;
                }
            }
        ]);
    }

    hit(power: number): number {
        this.strength -= 0.05;
        return power;
    }

    update() {
        this.clocky.check();
        this.sprite.position.set(this.x, this.y);
        this.glow.position.set(this.x, this.y);
        this.repeller.x = this.x;
        this.repeller.y = this.y;


        if (this.strength < 1) {
            this.strength = Math.min(1, this.strength + game.dts);

        }

        this.glow.scale.set(this.strength / 256 * 300 * 2);
        this.glow.tint = interpolateColors(0x111111, 0xffff00, this.strength);
        this.glow.alpha = this.strength * 0.2;
        this.repeller.range = this.strength * 300;
    }
}