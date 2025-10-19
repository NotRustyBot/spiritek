import { Matrix, Rectangle } from "pixi.js";
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

    get worldRect(): Rectangle {
        return new Rectangle(this.x - this.center.x, this.y - this.center.y, this.width, this.height);
    }

    get transformMatrix(): Matrix {
        const m = new Matrix();
        m.setTransform(
            (-this.x) * this.zoom+this.center.x,
            (-this.y) * this.zoom+this.center.y,
            0,
            0,
            this.zoom,
            this.zoom,
            0,
            0,
            0
        );
        //m.translate(-1000*this.zoom,-1*this.zoom);
        return m;
    }

    constructor() {
        super("Camera");
    }


    update() {
        const speed = 1000 / this.zoom * game.rawDt;
        if (game.controls.held["KeyD"]) this.position.x += speed;
        if (game.controls.held["KeyA"]) this.position.x -= speed;
        if (game.controls.held["KeyS"]) this.position.y += speed;
        if (game.controls.held["KeyW"]) this.position.y -= speed;

        if (game.controls.wheel != 0) {
            let zoom = this.zoom * 1 + (-Math.sign(game.controls.wheel) / 10) * Math.abs(this.zoom);
            game.containers.world.scale.set(zoom);
        }

        this.position.clampAxis(game.objects.getFirst("WaveManager")?.size ?? 4000);

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