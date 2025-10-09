import { BlurFilter, Container, Graphics, type Application } from "pixi.js";
import { ObjectManager } from "./objectManager";
import { Spirit } from "./spirit";
import { PolygonRepeller, RangeRepeller } from "./repeller";
import { Clocky } from "./clocky";
import { RepellFlare } from "./flare";
import { Asteroid } from "./asteroid";
import { WaveManager } from "./waveManager";
import { Camera } from "./camera";
import { ControlManager } from "./input";
import { Ship } from "./ship";
import { ISelectable, ObjectKinds } from "./types";
import { Projectile } from "./projectile";
import { GlowFilter, OutlineFilter } from "pixi-filters";

export let game: Game;


export class Game {
    app: Application;

    get dt(): number {
        return this.app.ticker.deltaMS;
    }

    get dts(): number {
        return this.app.ticker.deltaMS / 1000;
    }

    dtHistory = new Array<number>();

    avgDt = 16;

    debugGraphics = new Graphics();

    containers = {
        world: new Container(),
        darkness: new Container(),
        stone: new Container(),
        light: new Container(),
        items: new Container(),
        ship: new Container(),
        projectile: new Container(),
        spirit: new Container(),
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
        this.app.stage.addChild(this.containers.world);
        this.containers.world.addChild(this.containers.darkness);
        this.containers.world.addChild(this.containers.stone);
        this.containers.world.addChild(this.containers.light);
        this.containers.world.addChild(this.containers.items);
        this.containers.world.addChild(this.containers.ship);
        this.containers.world.addChild(this.containers.projectile);
        this.containers.world.addChild(this.containers.spirit);
        this.containers.world.addChild(this.debugGraphics);

        this.containers.light.filters = [new BlurFilter({})]

        new WaveManager();

        const stone = new Asteroid("stone_1", 2, 500, -100);
        const stone2 = new Asteroid("stone_2", 5, 1000, -500);
        const stone3 = new Asteroid("stone_2", 2, 100, 300);

        for (let index = 0; index < 100; index++) {
            this.dtHistory.push(16);
        }

        this.containers.world.scale.set(0.5);
    }

    clocky = new Clocky(0.9);

    update() {
        this.debugGraphics.clear();
        this.dtHistory.push(this.dt);
        this.dtHistory.unshift();
        this.avgDt = this.dtHistory.reduce((a, c) => { return a + c }) / this.dtHistory.length;

         this.clocky.check() && new Spirit();

        for (const obj of [...this.objects.getAll("preupdate")]) {
            obj.preupdate();
        }

        for (const obj of [...this.objects.getAll("updatable")]) {
            obj.update();
        }


        for (const obj of [...this.objects.getAll("drawable")]) {
            obj.draw();
        }

        let nearest: undefined | ISelectable = undefined
        let dist = 100;
        for (const obj of [...this.objects.getAll("selectable")]) {
            let useDist = this.controls.worldMouse.distance(obj) - obj.size;
            if (useDist < dist) {
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

            if (this.controls.click) {
                this.selected?.unselect?.();
                nearest.select?.();
                this.selected = nearest;
            }
        } else {
            this.hovered?.unhover?.();
            this.hovered = undefined;
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