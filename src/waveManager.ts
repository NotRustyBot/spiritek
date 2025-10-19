import { AlphaMask, Sprite, Texture } from "pixi.js";
import { Clocky } from "./clocky";
import { CoreObject } from "./core";
import { game } from "./game";
import { Spirit } from "./spirit";
import { Vector } from "./vector";
import { asset, clamp, interpolateColors } from "./util";

declare module "./types" { interface ObjectKinds { WaveManager: WaveManager } }
export class WaveManager extends CoreObject {

    angle = 0;
    spread = 1.5;

    direction = new Vector();
    speed = 0.1;

    size = 6000;
    spawnClocky = new Clocky(1.1);

    background: Sprite;
    light: Sprite;

    constructor() {
        super("updatable", "WaveManager", "scenebound");
        this.background = new Sprite(asset("noisy-sqare"));
        game.containers.backdrop.addChild(this.background);
        this.light = new Sprite(asset("blurcircle"));
        this.light.anchor.set(0.5);
        this.light.scale.set(this.size / 350);
    }

    update() {
        this.spawnClocky.check() && new Spirit().update();
        this.direction.set(Vector.fromAngle(this.angle)).mult(this.speed);
        this.background.width = game.camera.width;
        this.background.height = game.camera.height;
        this.background.tint = interpolateColors(0x202830, 0x010408, clamp(1 - this.spawnClocky.limit, 0, 1));
    }

    destroy(): void {
        super.destroy();
        this.background.destroy();
    }
}