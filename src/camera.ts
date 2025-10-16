import { CoreObject } from "./core";
import { game } from "./game";
import { Vector } from "./vector";


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
        super("Camera");
    }

    update() {
        const mouse = game.controls.mousePosition;
        const thickness = 50;
        const speed = 1000;

        if (mouse.x < thickness) game.camera.x -= speed / this.zoom * game.dt;
        if (mouse.x > this.width - thickness) game.camera.x += speed / this.zoom * game.dt;
        if (mouse.y < thickness) game.camera.y -= speed / this.zoom * game.dt;
        if (mouse.y > this.height - thickness) game.camera.y += speed / this.zoom * game.dt;

        if (game.controls.wheel != 0) {
            let zoom = this.zoom * 1 + (-Math.sign(game.controls.wheel) / 10) * Math.abs(this.zoom);
            game.containers.world.scale.set(zoom);
        }

        this.position.clampAxis(game.objects.getFirst("WaveManager").size);

        game.containers.world.x = (-this.x * this.zoom + window.innerWidth / 2);
        game.containers.world.y = (-this.y * this.zoom + window.innerHeight / 2);

        game.containers.underworld.x = (-this.x * this.zoom + window.innerWidth / 2);
        game.containers.underworld.y = (-this.y * this.zoom + window.innerHeight / 2);
        game.containers.underworld.scale.set(this.zoom);
    }

    worldToRender(position: Vector) {
        return position.clone().sub(this.position).mult(this.zoom).vecdiv(new Vector(window.innerWidth, window.innerHeight)).add(new Vector(0.5, 0.5));
    }
}