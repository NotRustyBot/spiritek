import { Clocky } from "./clocky";
import { CoreObject } from "./core";
import { game } from "./game";
import { Vector } from "./vector";

declare module "./types" { interface ObjectKinds { WaveManager: WaveManager } }
export class WaveManager extends CoreObject {

    angle = 0;
    spread = 1.5;

    direction = new Vector();
    speed = 0.1;
    size = 4000;


    clocky: Clocky;
    constructor() {
        super("updatable", "WaveManager");
        this.clocky = Clocky.sequence([
            { time: 10 },
            { time: 10, during: () => { this.angle += game.dts * 0.15 } },
            { time: 10 },
            { time: 10, during: () => { this.angle -= game.dts * 0.15 } },
        ]);
    }

    update() {
        this.clocky.check();
        this.direction.set(Vector.fromAngle(this.angle)).mult(this.speed);
    }
}