import { Assets, Graphics, MeshRope, Sprite, Texture } from "pixi.js";
import { CoreObject } from "./core";
import { game } from "./game";
import { Vector, Vectorlike } from "./vector";
import { Clocky } from "./clocky";
import { asset } from "./util";
import { IRepeller } from "./repeller";

export class Spirit extends CoreObject {
    sprite: MeshRope;
    darkness: Sprite;
    velocity = new Vector(1, 0);

    nodes = new Array<Vector>();

    nodeUpdate = new Clocky(100);

    get direction() {
        return this.waveManager.direction;
    }
    graphicNodes = new Array<Vector>();
    power = 2;
    fadeAway: Clocky;

    get waveManager() {
        return game.objects.getFirst("WaveManager");
    }


    constructor() {
        super("updatable", "drawable");

        const v = this.position.clone();
        for (let index = 0; index < 100; index++) {
            this.nodes.unshift(v.clone());
        }

        for (let index = 0; index < 10; index++) {
            this.graphicNodes.push(v.clone());
        }

        this.sprite = new MeshRope({
            texture: asset("spirit"),
            points: this.graphicNodes
        });

        this.darkness = new Sprite(asset("light"));

        this.darkness.anchor.set(0.5);
        this.darkness.scale.set(5);
        this.darkness.alpha = 0.3
        this.darkness.tint = 0;

        game.containers.darkness.addChild(this.darkness);
        game.containers.spirit.addChild(this.sprite);

        let a = this.waveManager.angle + Math.random() * this.waveManager.spread - this.waveManager.spread / 2;

        this.teleport(Vector.fromAngle(a).mult(-this.waveManager.size + 100));

        this.fadeAway = Clocky.once(1);
        this.fadeAway.stop = true;
        this.fadeAway.during = () => {
            let visibility = 1 - this.fadeAway.progress;
            this.darkness.alpha = 0.3 * visibility;
            this.sprite.alpha = visibility;
        }

        this.fadeAway.tick = () => { this.destroy() };

    }

    teleport(pos: Vectorlike) {
        this.position.set(pos);
        for (const node of this.nodes) {
            node.set(pos);
        }
    }

    topSpeed = 0.5;


    update() {

        this.velocity.x += Math.random() * 0.2 - 0.1;
        this.velocity.y += Math.random() * 0.2 - 0.1;

        this.velocity.add(this.direction);

        if (this.position.lengthSquared() > this.waveManager.size ** 2) {
            this.destroy();
        }

        let repellers = game.objects.getAll("repeller");

        for (const repeller of repellers) {
            if (!repeller.emotional) continue;
            this.repellerCheck(repeller);
        }

        let speed = this.velocity.length();

        if (speed > this.topSpeed) {
            this.velocity.mult(0.9);
        }

        if (speed < this.topSpeed * 0.5) {
            this.velocity.normalize(this.topSpeed * 0.5);
        }

        for (const repeller of repellers) {
            if (repeller.emotional) continue;
            this.repellerCheck(repeller);
        }

        this.fadeAway.check();


        this.position.add(this.velocity.clone().mult(game.dt));

        this.nodes.unshift(this.position.clone());
        this.nodes.pop();
    }

    repellerCheck(repeller: IRepeller) {
        if (repeller.check(this)) {
            let strength = -repeller.strength;

            if (this.power <= 1) {
                this.fadeAway.stop = false;
            } else {
                repeller.hit(this);
            }
            
            if (repeller.emotional) {
                let speed = this.velocity.length();
                const repell = repeller.position.diff(this).normalize(strength);
                this.velocity.add(repell);
                this.velocity.normalize(speed);

            } else {
                strength /= (Math.max(this.power, 1));
                const repell = repeller.position.diff(this).normalize(strength);
                this.velocity.add(repell);
            }

        }
    }

    destroy(): void {
        this.sprite.destroy();
        this.darkness.destroy();
        super.destroy();
    }

    draw() {


        const lax = 16 / game.avgDt * 5;
        let gsize = this.graphicNodes.length - 1;

        for (let index = 0; index < this.graphicNodes.length; index++) {
            if (Math.floor(lax * index) < this.nodes.length - 1) {
                this.graphicNodes[gsize - index] = this.nodes[Math.floor(lax * index)];
            } else {
                this.graphicNodes[gsize - index] = this.nodes[this.nodes.length - 1];
            }
        }

        this.darkness.position.set(...this.graphicNodes[this.graphicNodes.length - 2].xy());
    }
}