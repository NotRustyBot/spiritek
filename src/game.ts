import { BlurFilter, Container, Graphics, RenderTexture, Sprite, type Application } from "pixi.js";
import { ObjectManager } from "./objectManager";
import { Asteroid } from "./asteroid";
import { WaveManager } from "./waveManager";
import { Camera } from "./camera";
import { ControlManager, MousePriority } from "./input";
import { Ship } from "./ship";
import { ISelectable } from "./types";
import { Astronaut } from "./astronaut";
import { ObjectOptionsData } from "./ui/objectOptions";
import { UiManager } from "./ui/UI";
import { OrderManager } from "./orderManager";
import { Lightmap } from "./lighting/lightmap";
import { Shadowmap } from "./lighting/shadowmap";
import { Light } from "./lighting/light";
import { System } from "check2d"
import { ObjectiveManager } from "./objectives";
import { DroppedItem } from "./droppedItem";
import { ItemType } from "./items";
import { Vectorlike } from "./vector";
import { LogData } from "./ui/log";
import { Random } from "random";
import { LevelManager } from "./levelManager";
import { AudioManager } from "./audioManager";
import { ShaderMesh } from "./lighting/shaderMesh";

export let game: Game;


export class Game {
    app: Application;

    pause = false

    get dtms(): number {
        if (this.pause) return 0;
        return this.app.ticker.deltaMS;
    }

    get dt(): number {
        if (this.pause) return 0;
        return this.app.ticker.deltaMS / 1000;
    }

    get rawDt(): number {
        return this.app.ticker.deltaMS / 1000;
    }

    dtHistory = new Array<number>();

    avgDt = 16;
    time = 0;

    debugGraphics = new Graphics();

    containers = {
        backdrop: new Container(),
        underworld: new Container(),
        screenLight: new Container(),
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
        attention: new Container(),
        transitionContainer: new Container(),
    }

    objects = new ObjectManager();
    controls!: ControlManager;
    ship!: Ship;
    camera: Camera;
    uiManager!: UiManager;
    orderManager!: OrderManager;
    waveManager!: WaveManager;
    objectiveManager!: ObjectiveManager;
    audioManager!: AudioManager;
    levelManager!: LevelManager;
    selected: ISelectable | undefined = undefined;
    hovered: ISelectable | undefined = undefined;

    shadowCasterTexture: RenderTexture;

    system!: System;


    constructor(app: Application) {
        game = this;

        this.app = app;
        this.controls = new ControlManager();
        this.camera = new Camera();

        this.app.ticker.add(this.update.bind(this))
        this.shadowCasterTexture = RenderTexture.create({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener("resize", () => {
            Lightmap.resize();
            Shadowmap.resize();
            this.shadowCasterTexture.resize(window.innerWidth, window.innerHeight);
        });
    }

    init() {
        ShaderMesh.list.clear();
        console.log("init real");
        Lightmap.init();
        this.system = new System();
        this.app.stage.addChild(this.containers.backdrop);
        this.app.stage.addChild(this.containers.underworld);
        this.app.stage.addChild(this.containers.screenLight);
        this.app.stage.addChild(this.containers.world);
        this.app.stage.addChild(this.containers.transitionContainer);
        this.containers.underworld.addChild(this.containers.darkness);
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
        this.containers.world.addChild(this.containers.overlay);
        this.containers.world.addChild(this.containers.attention);

        this.containers.light.filters = [new BlurFilter({})]
        this.containers.overlay.alpha = 0.25;

        for (let index = 0; index < 100; index++) {
            this.dtHistory.push(16);
        }

        this.containers.world.scale.set(0.5);
        game.audioManager = new AudioManager();
        game.waveManager = new WaveManager();

        this.uiManager = new UiManager();
        this.orderManager = new OrderManager();
        this.objectiveManager = new ObjectiveManager();
        this.levelManager = new LevelManager();

        //TODO this is only temp
        let sprite = new Sprite(Lightmap.texture);
        this.containers.screenLight.addChild(sprite);
        sprite.filters = [new BlurFilter({})];

        this.levelManager.loadLevel();

    }


    update() {
        this.debugGraphics.clear();
        this.dtHistory.push(this.app.ticker.deltaMS);
        this.dtHistory.unshift();
        this.avgDt = this.dtHistory.reduce((a, c) => { return a + c }) / this.dtHistory.length;

        this.time += this.dt;

        for (const obj of [...this.objects.getAll("preupdate")]) {
            obj.preupdate();
        }

        /*if (this.controls.pressed["KeyR"]) {
            console.log(Light.list);
            let sprite = new Sprite(Shadowmap.shadowDataTexture);
            this.app.stage.addChild(sprite);
            sprite.filters = [new BlurFilter({})];
        }*/

        if (this.controls.pressed["KeyP"]) {
            game.pause = !game.pause;
        }

        if (this.controls.pressed["KeyO"]) {
            game.levelManager.transition();
        }

        this.controls.requestMouse(MousePriority.select, () => {

            let nearest: undefined | ISelectable = undefined
            let dist = 500;
            for (const obj of [...this.objects.getAll("selectable")]) {
                let useDist = this.controls.worldMouse.distance(obj);
                if (useDist < dist && obj.size > useDist && (obj.hoverCheck == undefined || obj.hoverCheck())) {
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
                    this.select(nearest);
                    return true;
                }
            } else {
                this.hovered?.unhover?.();
                this.hovered = undefined;
            }
            return false;
        });


        for (const obj of this.objects.getAll("updatable")) {
            obj.update();
        }


        this.camera.update();
        this.controls.update();
        if (this.controls.rightDown) {
            this.orderManager.cancel();
            this.selected?.unselect?.();
            this.selected = undefined;
            game.uiManager.updateObjectOptions();
        }

        for (const obj of [...this.objects.getAll("drawable")]) {
            obj.draw();
        }
        for (const shaderMesh of ShaderMesh.list) {
            shaderMesh.setUniform("uInverseCameraMatrix", this.camera.transformMatrix.invert().toArray(true));
        }

        Shadowmap.clearOccluderTexture();
        for (const obj of [...this.objects.getAll("shadowCaster")]) {
            obj.drawShadow(game.app.renderer, Shadowmap.occluderTexture);
        }
        Shadowmap.update();
        Lightmap.update();

        for (const obj of [...this.objects.getAll("postprocess")]) {
            obj.postprocess();
        }

        for (const obj of [...this.objects.getAll("debug")]) {
            //obj.debug(this.debugGraphics);
        }

    }

    log(message: string, target?: Vectorlike | ISelectable, kind?: LogData["className"], icon?: string) {
        let data: LogData = {
            text: message,
            className: kind
        }

        if (target) {
            data.click = () => {
                this.camera.position.set(target);
                if ("select" in target) {
                    this.select(target);
                }
            }
        }

        if (icon == undefined) {
            if (kind == "objective") data.icon = "icon/Icon_Star"
            if (kind == "warn") data.icon = "icon/Icon_Warning"
            if (kind == "critical") data.icon = "icon/Icon_Warning"
        }


        this.uiManager.addLog(data);
    }

    select(target: ISelectable) {
        this.selected?.unselect?.();
        target.select?.();
        this.selected = target;
        if ("uiData" in target) {
            const data = target.uiData;
            game.uiManager.updateObjectOptions(data as ObjectOptionsData);
        } else {
            game.uiManager.updateObjectOptions();
        }
    }

    clear() {
        for (const obj of [...this.objects.getAll("scenebound")]) {
            obj.destroy();
        }
        this.uiManager.clear();
    }
}

