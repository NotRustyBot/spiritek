import { CoreObject } from "./core";
import { game } from "./game";


declare module "./types" { interface ObjectKinds { Camera: Camera } }
export class Camera extends CoreObject {

    get zoom() {
        return game.containers.world.scale.x;
    }

    get width() {
        return window.innerWidth;
    }

    get height() {
        return window.innerHeight;
    }

    get center() {
        return { x: this.width / 2, y: this.height / 2 };
    }

    get aspectRatio() {
        return this.width / this.height;
    }

    constructor() {
        super("drawable", "Camera");
    }

    draw() {
        let dist = game.controls.mousePosition.clone().distance(this.center);

        if (dist > this.height / 3) {
            dist -= this.height / 3;
            dist /= this.height;
            dist = Math.min(dist * 5, 1);
           // this.position.add(game.controls.mousePosition.diff(this.center).normalize(10 * dist / this.zoom));
        }

        if (game.controls.wheel != 0) {
            let zoom = this.zoom * 1 + (-Math.sign(game.controls.wheel) / 10) * Math.abs(this.zoom);
            game.containers.world.scale.set(zoom);
        }

        game.containers.world.x = (-this.x * this.zoom + window.innerWidth / 2);
        game.containers.world.y = (-this.y * this.zoom + window.innerHeight / 2);
    }
}