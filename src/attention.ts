import { ColorSource, Sprite } from "pixi.js";
import { CoreObject } from "./core";
import { asset } from "./util";
import { BundleAliases } from "./bundle";
import { Vector, Vectorlike } from "./vector";
import { game } from "./game";
import { Clocky } from "./clocky";

export class AttentionIcon {
    sprite: Sprite;
    scale = 1;

    autohideClock = Clocky.once(1);

    set visible(value: boolean) {
        this.sprite.visible = value;
    }

    get visible() {
        return this.sprite.visible;
    }

    constructor() {
        this.sprite = new Sprite(asset("icon-Icon_Warning"));
        game.containers.attention.addChild(this.sprite);
        this.sprite.anchor.set(0.5, 1);
        this.autohideClock.tick = () => { this.sprite.visible = false };
        this.autohideClock.stop = true;
        this.autohideClock.autoTick();
        this.visible = false;
    }

    setIcon(name: BundleAliases, tint: ColorSource = 0xffffff, autoHide = true) {
        this.sprite.texture = asset(name);
        this.sprite.tint = tint;
        this.visible = true;
        this.autohideClock.time = 0;
        this.autohideClock.stop = !autoHide;
    }

    forPosition(position: Vectorlike, verticalOffset = 0) {
        const padding = 0.9;
        const usePosition = Vector.fromLike(position).addXY(0, -verticalOffset);
        const diff = usePosition.diff(game.camera).vecdiv(game.camera.center).mult(game.camera.zoom);
        if (diff.x < -padding) usePosition.x -= game.camera.width * (diff.x + padding) / game.camera.zoom / 2;
        if (diff.x > padding) usePosition.x -= game.camera.width * (diff.x - padding) / game.camera.zoom / 2;
        if (diff.y < -padding) usePosition.y -= game.camera.height * (diff.y + padding) / game.camera.zoom / 2;
        if (diff.y > padding) usePosition.y -= game.camera.height * (diff.y - padding) / game.camera.zoom / 2;
        this.sprite.position.set(usePosition.x, usePosition.y);
        this.sprite.scale.set(1 / game.camera.zoom * this.scale);
    }

    destroy(){
        this.sprite.destroy();
        this.autohideClock.stop = true;
    }
}