import { Assets, Graphics, MeshRope, Sprite, Texture } from "pixi.js";
import { CoreObject } from "./core";
import { game } from "./game";
import { Vector, Vectorlike } from "./vector";
import { Clocky } from "./clocky";
import { asset } from "./util";

export class Spirit extends CoreObject {
    sprite: MeshRope;
    darkness: Sprite;
    velocity = new Vector(1, 0);

    nodes = new Array<Vector>();

    nodeUpdate = new Clocky(100);

    direction = { x: 0.1, y: 0 };
    graphicNodes = new Array<Vector>();
    power = 2;
    fadeAway: Clocky;


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

        this.teleport({ x: 0, y: Math.random() * 5000 });

        this.fadeAway = Clocky.once(1000);
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

    topSpeed = 0.75;


    update() {

        this.velocity.x += Math.random() * 0.2 - 0.1;
        this.velocity.y += Math.random() * 0.2 - 0.1;

        this.velocity.add(this.direction);

        if (this.position.x > 5000) {
            this.destroy();
        }

        if (this.velocity.length() > this.topSpeed) {
            this.velocity.normalize(this.topSpeed);
        }

        for (const repeller of game.objects.getAll("repeller")) {
            if (repeller.check(this)) {
                const repell = repeller.position.diff(this).normalize(-repeller.strength / (Math.max(this.power, 1)));
                this.velocity.add(repell);
                if (this.power <= 1) {
                    this.fadeAway.stop = false;
                } else {
                    this.power = repeller.hit(this.power);
                }
            }
        }

        this.fadeAway.check();


        this.position.add(this.velocity.clone().mult(game.dt));

        this.nodes.unshift(this.position.clone());
        this.nodes.pop();
    }

    destroy(): void {
        this.sprite.destroy();
        this.darkness.destroy();
        super.destroy();
    }

    draw() {


        const lax = game.avgDt / 16 * 5;
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