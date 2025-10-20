import { CoreObject } from "./core"
import { PolygonRepeller } from "./repeller"

import stone1 from "./hitbox/stone1.json"
import stone2 from "./hitbox/stone2.json"
import stone3 from "./hitbox/stone3.json"
import { Renderer, RenderTexture, sortMixin, Sprite } from "pixi.js";
import { asset, clamp, rotate } from "./util";
import { game } from "./game";
import { Polygon } from "check2d";
import { Drill } from "./drill";

const hitboxLookup = {
    "stone_1": stone1,
    "stone_2": stone2,
    "stone_3": stone3,
}

declare module "./types" { interface ObjectKinds { asteroid: Asteroid } }
export class Asteroid extends CoreObject {
    repeller: PolygonRepeller;
    sprite: Sprite;
    ore?: Sprite;
    collider: Polygon;
    drill?: Drill;

    resource = 0;

    get canBuildDrill() {
        return this.drill == undefined && this.resource > 0;
    }

    constructor(stone: keyof typeof hitboxLookup, rotation = 0, x = 0, y = 0, resource = 0) {
        super("asteroid", "shadowCaster", "scenebound", "drawable");

        this.sprite = new Sprite(asset(stone));
        this.sprite.anchor.set(0.5);
        this.sprite.rotation = rotation;
        game.containers.stone.addChild(this.sprite);

        this.repeller = new PolygonRepeller();
        const polygon = rotate(hitboxLookup[stone], rotation);
        this.repeller.setPolygon(polygon);
        this.collider = game.system.createPolygon(this.position, polygon);
        this.resource = resource;

        if (resource > 0) {
            this.ore = new Sprite(asset("stone_3_ore"));
            this.ore.anchor.set(0.5);
            this.ore.rotation = rotation;
            game.containers.stone.addChild(this.ore);
        }

        this.teleport(x, y);


    }

    teleport(x: number, y: number) {
        this.x = x;
        this.y = y;

        this.sprite.position.set(x, y);
        this.ore?.position.set(x, y);
        this.repeller.x = x;
        this.repeller.y = y;
        this.collider.setPosition(x, y);
    }

    drawShadow(renderer: Renderer, texture: RenderTexture) {
        this.sprite.tint = 0x000000;
        renderer.render({
            target: texture,
            container: this.sprite,
            clear: false,
            transform: this.sprite.worldTransform
        });
        this.sprite.tint = 0xffffff;
    }

    draw(){
        if(this.ore){
            let visibility = clamp(this.resource,0, 100)/100;
            this.ore.alpha = visibility;
        }
    }

    destroy(): void {
        super.destroy();
        this.sprite.destroy();
        this.ore?.destroy();
        this.repeller.destroy();
        game.system.remove(this.collider);
    }
}