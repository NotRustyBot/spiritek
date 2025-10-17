import { OutlineFilter } from "pixi-filters";
import { AnimatedSprite, Sprite } from "pixi.js";
import { Clocky } from "./clocky";
import { CoreObject } from "./core";
import { game } from "./game";
import { PolygonRepeller } from "./repeller";
import { Spirit } from "./spirit";
import { ISelectable } from "./types";
import { asset, angleInterpolate, rotate } from "./util";
import { Vectorlike, Vector } from "./vector";
import { Common } from "./common";
import { Projectile } from "./projectile";
import { IPickupable } from "./droppedItem";
import random from 'random'


export class Turret extends CoreObject implements ISelectable {
    sprite: Sprite;
    muzzle: AnimatedSprite;
    muzzleGlow: Sprite;

    size = 100; // selectable

    burst = 0;
    maxBurst = 3;
    betweenShots = 0.1;
    betweenBursts = 1.3;
    firerate = new Clocky(0.5);
    muzzleTime = Clocky.once(0.05);

    aimAngle = 0;
    range = 3000;

    confused = false;
    pickupProxy?: IPickupable;

    constructor() {
        super("updatable", "drawable", "selectable", "debug");
        this.sprite = new Sprite(asset("turret"));
        this.sprite.anchor.set(0.5);
        game.containers.items.addChild(this.sprite);

        this.muzzleGlow = new Sprite(asset("light"));
        this.muzzleGlow.anchor.set(0.5);
        this.muzzleGlow.scale.set(5);
        this.muzzleGlow.alpha = 0.1;
        this.muzzleGlow.visible = false;
        game.containers.light.addChild(this.muzzleGlow);
        //this.muzzleGlow.visible = false;


        this.muzzle = new AnimatedSprite([
            asset("muzzle-Muzzle_01"),
            asset("muzzle-Muzzle_02"),
            asset("muzzle-Muzzle_03"),
            asset("muzzle-Muzzle_04"),
            asset("muzzle-Muzzle_05"),
        ]);
        this.muzzle.visible = false;
        this.muzzle.anchor.set(-0.1, 0.5);
        game.containers.items.addChild(this.muzzle);

        this.muzzleTime.tick = () => {
            this.muzzle.visible = false;
            this.muzzleGlow.visible = false;
        };

        this.muzzleTime.stop = true;
    }

    hover() {
        Common.hover(this, this.sprite);
    }

    unhover() {
        Common.unhover(this, this.sprite);
    }

    lastTarget?: Spirit;

    update() {
        let fireTick = this.firerate.check();
        this.muzzleTime.check();

        if (this.confused) {
            this.aimAngle = Math.sin(game.time + this.position.x) * 10;
        } else {

            let nearest = undefined as Spirit | undefined;
            let dist = this.range;
            for (const spirit of Array.from(game.objects.getAll("spirit"))) {
                if (spirit.power <= 1) continue;
                let cdist = spirit.position.distance(this);
                if (cdist < dist) {
                    if (!game.system.raycast(this, spirit)) {
                        dist = cdist;
                        nearest = spirit;
                    }
                }
            }

            if (nearest) {
                this.aimAngle = nearest.position.diff(this).toAngle();
            }

            let followShots = this.burst < (this.maxBurst - 1);

            if (fireTick && (nearest || followShots)) {
                if (followShots && nearest != this.lastTarget) nearest = undefined;
                const proj = new Projectile(this.position, nearest, this.sprite.rotation);
                this.muzzle.currentFrame = random.int(0, this.muzzle.totalFrames - 1);
                this.muzzle.visible = true;
                this.muzzleGlow.visible = true;
                this.muzzle.rotation = proj.velocity.toAngle();
                this.muzzleTime.time = 0;
                this.muzzleTime.stop = false;
                this.lastTarget = nearest;

                if (this.burst <= 0) {
                    this.burst = this.maxBurst;
                    this.firerate.limit = this.betweenBursts;
                } else {
                    this.firerate.limit = this.betweenShots;
                }
                this.burst--;
            }
        }
    }

    debug() {
        let dist = this.range;
        for (const spirit of Array.from(game.objects.getAll("spirit"))) {
            if (spirit.power <= 1) continue;
            let cdist = spirit.position.distance(this);
            if (cdist < dist) {
                let res = game.system.raycast(this, spirit)
                if (res) {
                    game.debugGraphics.moveTo(this.x, this.y);
                    game.debugGraphics.lineTo(spirit.x, spirit.y);
                    game.debugGraphics.stroke({ color: 0x999999, width: 1 / game.camera.zoom });

                    game.debugGraphics.moveTo(this.x, this.y);
                    game.debugGraphics.lineTo(res.point.x, res.point.y);
                    game.debugGraphics.stroke({ color: 0xff0000, width: 1 / game.camera.zoom });
                } else {
                    game.debugGraphics.moveTo(this.x, this.y);
                    game.debugGraphics.lineTo(spirit.x, spirit.y);
                    game.debugGraphics.stroke({ color: 0x99ff99, width: 1 / game.camera.zoom });
                }
            }
        }
    }




    draw() {
        this.sprite.position.set(this.x, this.y);
        this.muzzle.position.set(this.x, this.y);
        this.muzzleGlow.position.set(this.x, this.y);


        if (this.aimAngle != this.sprite.rotation) {
            this.sprite.rotation = angleInterpolate(this.sprite.rotation, this.aimAngle, game.dt * 10);
        }
    }

    override destroy(): void {
        super.destroy();
        this.sprite.destroy();
    }
}
