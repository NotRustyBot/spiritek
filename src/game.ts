import { BlurFilter, Container, Graphics, type Application } from "pixi.js";
import { ObjectManager } from "./objectManager";
import { Spirit } from "./spirit";
import { PolygonRepeller, RangeRepeller } from "./repeller";
import { Clocky } from "./clocky";
import { RepellFlare } from "./flare";
import { Asteroid } from "./asteroid";
import { WaveManager } from "./waveManager";
import { Camera } from "./camera";
import { ControlManager, MousePriority } from "./input";
import { Ship } from "./ship";
import { ISelectable, ObjectKinds } from "./types";
import { Projectile } from "./projectile";
import { GlowFilter, OutlineFilter } from "pixi-filters";
import scene from "./scenes/objects.json"
import { Installation, TurretInstallation } from "./installation";
import { Astronaut } from "./astronaut";
import { TestRitual } from "./ritual";
import { ObjectOptions } from "./ui/objectOptions";
import { UI } from "./ui/UI";

export let game: Game;


export class Game {
    app: Application;

    get dtms(): number {
        return this.app.ticker.deltaMS;
    }

    get dt(): number {
        return this.app.ticker.deltaMS / 1000;
    }

    dtHistory = new Array<number>();

    avgDt = 16;
    time = 0;

    debugGraphics = new Graphics();

    containers = {
        backdrop: new Container(),
        world: new Container(),
        darkness: new Container(),
        girder: new Container(),
        ritual: new Container(),
        stone: new Container(),
        light: new Container(),
        ship: new Container(),
        items: new Container(),
        astronaut: new Container(),
        projectile: new Container(),
        spirit: new Container(),
        overlay: new Container(),
    }

    objects = new ObjectManager();
    controls: ControlManager;
    ship: Ship;
    camera: Camera;
    selected: ISelectable | undefined = undefined;
    hovered: ISelectable | undefined = undefined;


    constructor(app: Application) {
        game = this;
        this.controls = new ControlManager();
        this.ship = new Ship();
        this.camera = new Camera();
        this.app = app;

        this.app.ticker.add(this.update.bind(this))
    }

    init() {
        this.app.stage.addChild(this.containers.backdrop);
        this.app.stage.addChild(this.containers.world);
        this.containers.world.addChild(this.containers.darkness);
        this.containers.world.addChild(this.containers.girder);
        this.containers.world.addChild(this.containers.ritual);
        this.containers.world.addChild(this.containers.stone);
        this.containers.world.addChild(this.containers.light);
        this.containers.world.addChild(this.containers.ship);
        this.containers.world.addChild(this.containers.items);
        this.containers.world.addChild(this.containers.astronaut);
        this.containers.world.addChild(this.containers.projectile);
        this.containers.world.addChild(this.containers.spirit);
        this.containers.world.addChild(this.debugGraphics);
        this.app.stage.addChild(this.containers.overlay);


        this.containers.light.filters = [new BlurFilter({})]

        new WaveManager();

        for (const obj of scene) {
            const stone = new Asteroid(obj.kind ?? "stone_1" as any, obj.rotation, obj.x, obj.y);
        }

        for (let index = 0; index < 100; index++) {
            this.dtHistory.push(16);
        }

        this.containers.world.scale.set(0.5);

        const astro = new Astronaut();

        document.body.appendChild(UI());

    }


    update() {
        this.debugGraphics.clear();
        this.dtHistory.push(this.dtms);
        this.dtHistory.unshift();
        this.avgDt = this.dtHistory.reduce((a, c) => { return a + c }) / this.dtHistory.length;

        this.time += this.dt;

        for (const obj of [...this.objects.getAll("preupdate")]) {
            obj.preupdate();
        }

        this.controls.requestMouse(MousePriority.select, () => {

            let nearest: undefined | ISelectable = undefined
            let dist = 500;
            for (const obj of [...this.objects.getAll("selectable")]) {
                let useDist = this.controls.worldMouse.distance(obj);
                if (useDist < dist && obj.size > useDist) {
                    nearest = obj;
                    dist = useDist;
                }
            }

            if (nearest) {
                if (nearest != this.hovered) {
                    this.hovered?.unhover?.();
                    this.hovered = nearest;
                    this.hovered.hover?.();
                }

                if (this.controls.clicked) {
                    this.controls.clicked = false;
                    this.controls.pointerDown = false;
                    this.selected?.unselect?.();
                    nearest.select?.();
                    this.selected = nearest;
                    return true;
                }
            } else {
                this.hovered?.unhover?.();
                this.hovered = undefined;
            }
            return false;
        });

        for (const obj of [...this.objects.getAll("updatable")]) {
            obj.update();
        }


        this.camera.update();
        this.controls.update();

        for (const obj of [...this.objects.getAll("drawable")]) {
            obj.draw();
        }

        for (const obj of [...this.objects.getAll("postprocess")]) {
            obj.postprocess();
        }

        for (const obj of [...this.objects.getAll("debug")]) {
            //obj.debug(this.debugGraphics);
        }

    }

    clear() {
        for (const obj of [...this.objects.getAll("scenebound")]) {
            obj.destroy();
        }
    }
}