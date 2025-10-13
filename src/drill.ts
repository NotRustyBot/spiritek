import { Sprite } from "pixi.js";
import { CoreObject } from "./core";
import { game } from "./game";
import { ISelectable } from "./types";
import { asset } from "./util";
import { ISelectableBase } from "./select";
import { Asteroid } from "./asteroid";
import { Astronaut } from "./astronaut";
import { Vector } from "./vector";
import { Installation } from "./installation";
import { ObjectOptionsData } from "./ui/objectOptions";


export class Drill extends CoreObject implements ISelectable {
    sprite: Sprite;
    asteroid: Asteroid;
    size = 100; // selectable
    operator?: Astronaut;
    installation: Installation;

    working = false;

    updateExtraction = (value: string) => { }

    get uiData(): ObjectOptionsData {
        return {
            name: "Drill",
            stats: [
                {
                    name: "Extraction",
                    value: "xx",
                    updateHandler: (updater) => {
                        this.updateExtraction = updater;
                    }
                }
            ]
        }
    }

    constructor(asteroid: Asteroid, installation: Installation) {
        super("updatable", "drawable", "selectable",);
        this.sprite = new Sprite(asset("drill"));
        this.sprite.anchor.set(0.5);
        game.containers.items.addChild(this.sprite);
        this.asteroid = asteroid;
        this.installation = installation;
        asteroid.drill = this;
    }

    rotate() {
        this.sprite.rotation = this.asteroid.position.diff(this).toAngle();
    }

    hover() {
        ISelectableBase.hover(this, this.sprite);
    }

    unhover() {
        ISelectableBase.unhover(this, this.sprite);
    }

    update() {
        this.working = false;
        if (this.operator && this.asteroid.resource > 0) {
            if (this.operator.position.distanceSquared(this) < 100 ** 2 && this.operator.stressTimer <= 0) {
                this.working = true;
                this.asteroid.resource -= game.dt;
            }
        }

        this.updateExtraction(this.asteroid.resource.toFixed(1));

        this.installation.attractor.enabled = this.working
    }

    draw() {
        let v = this.position.clone();
        if (this.working) {
            const add = new Vector(Math.sin(game.time * 30 + this.x) * 2, 0);
            v.add(add.rotate(this.sprite.rotation + Math.PI / 2));
            this.installation.girder!.tilePosition.y += game.dt * 100;
        }

        this.sprite.position.set(v.x, v.y);
    }
}
