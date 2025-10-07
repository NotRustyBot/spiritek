import { Clocky } from "./clocky";
import { CoreObject } from "./core";
import { game } from "./game";
import { Vector } from "./vector";

declare module "./types" { interface ObjectKinds { WaveManager: WaveManager } }
export class WaveManager extends CoreObject {

    angle = 0;
    spread = 2;

    direction = new Vector();
    speed = 0.1;
    size = 4000;


    clocky: Clocky;
    constructor() {
        super("updatable", "WaveManager");
        this.clocky = Clocky.sequence([
            { time: 10 },
            { time: 10, during: () => { this.angle += game.dts * 0.2 } },
            { time: 10 },
            { time: 10, during: () => { this.angle -= game.dts * 0.2 } },
        ]);
    }

    update() {
        this.clocky.check();
        this.direction.set(Vector.fromAngle(this.angle)).mult(this.speed);
    }
}