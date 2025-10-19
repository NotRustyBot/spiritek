import { Sprite } from "pixi.js";
import { Clocky, ClockyData } from "./clocky";
import { CoreObject } from "./core";
import { RangeRepeller } from "./repeller";
import { asset } from "./util";
import { Spirit } from "./spirit";
import { game } from "./game";


export class Ritual extends CoreObject {
    clocky: Clocky;
    repeller = new RangeRepeller();
    sprite: Sprite;
    constructor(data: Array<ClockyData>) {
        super("updatable", "drawable", "scenebound")
        this.clocky = Clocky.sequence(data);
        this.sprite = new Sprite(asset("ritual"));
        game.containers.ritual.addChild(this.sprite);
        this.sprite.anchor.set(0.5);
    }

    update() {
        this.clocky.check();
        this.repeller.position.set(this);
    }

    draw() {
        this.sprite.position.set(this.x, this.y);
    }

    override destroy(): void {
        super.destroy();
        this.sprite.destroy();
        this.repeller.destroy();
    }
}

export class TestRitual extends Ritual {
    power = 1;
    constructor() {
        super([
            {
                time: 30,
            },
            {
                time: 10,
                during: () => {
                    this.power = 1 - this.clocky.progress;
                },
                tick: () => {
                    this.destroy();
                }
            }
        ]);
        this.repeller.range = 2500;
        this.repeller.noStrength = true;
        this.repeller.hit = (spirit: Spirit) => {
            this.spinosa(spirit)
        }
    }

    spinosa(spirit: Spirit) {
    }
}