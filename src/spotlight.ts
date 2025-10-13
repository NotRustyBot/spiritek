import { Sprite } from "pixi.js";
import { Clocky } from "./clocky";
import { CoreObject } from "./core";
import { game } from "./game";
import { PolygonRepeller } from "./repeller";
import { Spirit } from "./spirit";
import { ISelectable } from "./types";
import { asset, angleInterpolate, rotate } from "./util";
import { Vectorlike, Vector } from "./vector";
import { ISelectableBase } from "./select";
import { MousePriority } from "./input";
import { SpotlightTarget } from "./orderManager";
import { ObjectOptionsData } from "./ui/objectOptions";
import { Light } from "./lighting/light";
import { CustomColor } from "./lighting/color";


export class Spotlight extends CoreObject implements ISelectable {
    repeller: PolygonRepeller;
    lightSprite: Sprite;
    sprite: Sprite;

    size = 100; // selectable

    confused = false;
    polygon: Array<Vectorlike>;

    aimAngle = 0;

    targetPosition = new Vector();

    get uiData(): ObjectOptionsData {
        return {
            name: "Spotlight",
        }
    }
    light: Light;

    constructor() {
        super("updatable", "drawable", "selectable");
        this.lightSprite = new Sprite(asset("floodlight"));
        this.lightSprite.anchor.set(0, 0.5);
        game.containers.light.addChild(this.lightSprite);
        this.sprite = new Sprite(asset("spotlight"));
        this.sprite.anchor.set(0.5);
        game.containers.items.addChild(this.sprite);
        this.repeller = new PolygonRepeller();
        this.polygon = [
            {
                "x": 0,
                "y": 0
            },
            {
                "x": 0.8,
                "y": 0.4,
            },
            {
                "x": 1,
                "y": 0,
            },
            {
                "x": 0.8,
                "y": -0.4,
            }
        ];
        const scale = 2000;
        this.polygon = this.polygon.map(n => ({ x: n.x * scale, y: n.y * scale }));
        this.repeller.setPolygon(this.polygon);
        this.lightSprite.scale.set(scale / 127);

        this.repeller.noStrength = true;
        this.repeller.lineOfSight = true;

        this.repeller.hit = (s: Spirit) => {
            let proximity = 1 - (s.position.distance(this) / scale) / s.power;
            let power = (proximity) * this.repeller.strength * 0.3;

            if (this.repeller.strength > 0.03) {
                this.repeller.strength -= s.power * 0.1 * game.dt * (1 - proximity) * this.repeller.strength;
            }

            s.affect(-power, this);
        };
        this.light = new Light({ position: this.position, intensity: 0.7,color:new CustomColor(255,10,5) });
    }

    select(): void {
        game.orderManager.newOrder(new SpotlightTarget(this));
    }

    hover() {
        ISelectableBase.hover(this, this.sprite);
    }

    unhover() {
        ISelectableBase.unhover(this, this.sprite);
    }

    update() {
        let targetAngle = this.targetPosition.diff(this.position).toAngle();

        if (this.confused) {
            targetAngle = Math.sin(game.time / 6 + this.position.x) * 6;
        } else {
            this.repeller.strength += game.dt;
        }

        if (this.aimAngle != targetAngle) {
            this.aimAngle = angleInterpolate(this.aimAngle, targetAngle, game.dt);
            this.repeller.setPolygon(rotate(this.polygon, this.aimAngle));
        }

        if (this.repeller.strength > 1) this.repeller.strength = 1;

        this.repeller.position.set(this);

        this.light.position.set(this);
        this.light.angle = this.aimAngle;


        if (game.selected == this) {
            game.controls.requestPointerDown(MousePriority.order, () => {
                this.targetPosition.set(game.controls.worldMouse.clone());
            })
        }

    }

    blinker = new Clocky(0.05);

    draw() {
        this.lightSprite.position.set(this.repeller.x, this.repeller.y);
        this.sprite.position.set(this.repeller.x, this.repeller.y);
        if (this.blinker.check()) {
            this.lightSprite.alpha = 0.2 * (1 + (1 - this.repeller.strength) * Math.random()) * this.repeller.strength;
            this.light.intensity = this.lightSprite.alpha*3;
            this.lightSprite.alpha = 0;

        }
        this.lightSprite.rotation = this.aimAngle;
        this.sprite.rotation = this.aimAngle;
    }
}
