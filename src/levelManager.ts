import { game } from "./game";
import { Ship } from "./ship";
import { WaveManager } from "./waveManager";
import tutorial from "./scenes/tutorial.json"
import lvl1 from "./scenes/lvl1.json"
import lvl2 from "./scenes/objects.json"
import { Asteroid } from "./asteroid";
import { ItemType } from "./items";
import { Vector } from "./vector";
import { CrewOnBoard, ExitStrategy, MiningObjective, ObjectiveManager, RecoverMiningEquipment } from "./objectives";
import { CoreObject } from "./core";
import { Clocky } from "./clocky";
import { Sprite } from "pixi.js";
import { asset } from "./util";


export type MissionReportData = {
    totalScore: number,
    objectives: Array<ObjectiveReportData>
};

export type ObjectiveReportData = {
    score?: number,
    status: string
    result: "success" | "failure" | "yellow",
}

export class LevelManager extends CoreObject {


    shipSkin?: Sprite;
    constructor() {
        super("updatable")
    }

    levelIndex = 0;
    activeLevel?: Level;
    isTransition = true;
    isTransitionEnding = false;

    animationX = 0;
    loadLevel() {
        this.isTransition = false;
        this.shipSkin?.destroy();
        game.clear();
        game.uiManager.readyGameUi();
        game.waveManager = new WaveManager();
        game.objectiveManager = new ObjectiveManager();
        this.activeLevel = new levels[this.levelIndex]();
        this.activeLevel.load();
    }

    update() {
        this.activeLevel?.update();
        if (this.isTransition && this.shipSkin) {
            if (!this.isTransitionEnding && this.animationX > game.camera.width / 2) this.animationX -= game.dt * 1000;
            if (this.isTransitionEnding && this.animationX > -1000) this.animationX -= game.dt * 1000;
            this.shipSkin.position.y = game.camera.height/2 - 50 + Math.sin(game.time * 20) ** 4 * 4;
            this.shipSkin.position.x = this.animationX + Math.sin(game.time * 0.5) ** 3 * 200;
            this.shipSkin.rotation = Math.sin(game.time * 10) ** 4 * 0.01 + Math.PI;
        } else if (game.ship.resist <= 0 && !game.pause) {
            game.pause = true;
            setTimeout(() => {
                game.pause = false;
                this.loadLevel();
            }, 3000)
        }
    }

    transition() {
        game.clear();
        this.shipSkin = new Sprite(asset("ship"));
        this.shipSkin.anchor.set(0.5);
        game.containers.transitionContainer.addChild(this.shipSkin);
        let objectiveRatings: Array<ObjectiveReportData> = [];
        game.audioManager.music("music-wolf").seek(15);
        let total = 0
        for (const objective of game.objectiveManager.activeObjectives) {
            let rating = objective.getRating();
            if (rating) {
                objectiveRatings.push(rating);
                total += rating.score ?? 0;
            }
        }

        if (game.ship.resist < game.ship.maxResist) {
            let diff = Math.round(game.ship.maxResist - game.ship.resist);
            objectiveRatings.push({
                result: "failure",
                status: "Ship took " + diff + " damage",
                score: -diff
            });
            total += -diff;
        }

        this.animationX = game.camera.width + 1000;
        this.isTransition = true;
        this.isTransitionEnding = false;


        game.uiManager.readyReportUi({
            totalScore: total,
            objectives: objectiveRatings
        });

    }

    nextLevel() {
        this.levelIndex++;
    }

    endTransition() {
        this.isTransitionEnding = true;
        const end = Clocky.once(2);
        end.autoTick();
        end.tick = () => {
            this.loadLevel();
        };
    }
}

class Level extends CoreObject {
    constructor() {
        super("scenebound");
    }

    get sceneData() {
        return tutorial;
    }
    update() { }
    load() {
        const ship = new Ship();
        game.ship = ship;

        for (const obj of this.sceneData) {
            if (obj.type == "asteroid") {
                const stone = new Asteroid(obj.kind ?? "stone_1" as any, obj.rotation, obj.x, obj.y, obj.resource);
            } else if (obj.type == "ship") {
                ship.position.set(obj);
                ship.rotation = obj.rotation ?? 0;
                ship.targetRotation = obj.rotation ?? 0;
                ship.targetPosition.set(obj).add(Vector.fromAngle(ship.rotation).mult(300));
            }
        }
    }
}



class TutorialLevel extends Level {
    sprite!: Sprite;
    override load(): void {
        super.load();

        game.ship.pickup({ item: ItemType.DrillParts, count: 2 });
        game.ship.pickup({ item: ItemType.RepellFlare, count: 6 });
        game.ship.pickup({ item: ItemType.ConstructionParts, count: 3 });

        const activeObjectives = [];
        activeObjectives.push(new MiningObjective());
        activeObjectives.push(new RecoverMiningEquipment());
        activeObjectives.push(new CrewOnBoard());
        activeObjectives.push(new ExitStrategy());

        game.objectiveManager.init(activeObjectives);

        game.waveManager.spawnClocky.limit = 3;
        game.audioManager.music("music-crystalEchoes");

        this.sprite = new Sprite(asset("tutorial"));
        game.containers.overlay.addChild(this.sprite);
        this.sprite.anchor.set(0.5);
        this.sprite.position.set(-900, 80);
        this.sprite.scale.set(6);
        this.sprite.visible = false;

        Clocky.once(3).autoTick().tick = () => {
            game.audioManager.voiceline("voice-s_look");
            this.sprite.visible = true;
        };
    }

    wasDrillDeployed = false;
    exitAllowed = false;

    update(): void {
        if (!this.wasDrillDeployed && game.objectiveManager.minedOre > 0) {
            this.wasDrillDeployed = true;
            game.audioManager.music("music-fog");

            const clocky = Clocky.once(10).autoTick();
            clocky.during = () => { game.waveManager.spawnClocky.limit = 0.5 + 2.5 * (1 - clocky.progress) };
        }

        if (!this.exitAllowed && game.objectiveManager.criticalNonExitComplete) {
            this.exitAllowed = true;
            game.audioManager.music("music-darkPlanet");

        }
    }

    destroy(): void {
        super.destroy();
        this.sprite.destroy();
    }
}

class Level1 extends Level {
    clocky!: Clocky;
    override get sceneData(): any {
        return lvl1;
    }

    override load(): void {
        super.load();

        game.ship.pickup({ item: ItemType.DrillParts, count: 2 });
        game.ship.pickup({ item: ItemType.KillFlare, count: 3 });
        game.ship.pickup({ item: ItemType.RepellFlare, count: 6 });
        game.ship.pickup({ item: ItemType.ConstructionParts, count: 3 });

        const activeObjectives = [];
        const mo = new MiningObjective();
        mo.target = 200;
        activeObjectives.push(mo);
        activeObjectives.push(new RecoverMiningEquipment());
        activeObjectives.push(new CrewOnBoard());
        activeObjectives.push(new ExitStrategy());

        game.objectiveManager.init(activeObjectives);

        game.waveManager.spawnClocky.limit = 3;
        this.clocky = Clocky.sequence([
            {
                time: 60,
                tick: () => {
                    game.audioManager.voiceline("voice-s_presence")
                }
            },
            {
                time: 30, during: () => {
                    game.waveManager.spawnClocky.limit = 0.5 + 2.5 * (1 - this.clocky.progress)
                }
            },
            {
                time: 60,
                tick: () => {
                    game.audioManager.voiceline("voice-e_more")

                }
            },
            {
                time: 30, during: () => {
                    game.waveManager.spawnClocky.limit = 0.25 + 0.25 * (1 - this.clocky.progress)
                }
            },
            {
                time: 60,
                tick: () => {
                    game.audioManager.voiceline("voice-s_overstay")
                }
            },
            {
                time: 30, during: () => {
                    game.waveManager.spawnClocky.limit = 0.1 + 0.15 * (1 - this.clocky.progress)
                }
            },
        ]).autoTick();

        game.audioManager.music("music-labyrinth");
    }


    update(): void {
    }

    destroy(): void {
        super.destroy();
        this.clocky.stop = true;
    }
}

class Level2 extends Level {
    clocky!: Clocky;
    override get sceneData(): any {
        return lvl2;
    }

    override load(): void {
        super.load();

        game.ship.pickup({ item: ItemType.DrillParts, count: 2 });
        game.ship.pickup({ item: ItemType.KillFlare, count: 3 });
        game.ship.pickup({ item: ItemType.RepellFlare, count: 6 });
        game.ship.pickup({ item: ItemType.ConstructionParts, count: 5 });

        const activeObjectives = [];
        const mo = new MiningObjective();
        mo.target = 200;
        activeObjectives.push(mo);
        activeObjectives.push(new RecoverMiningEquipment());
        activeObjectives.push(new CrewOnBoard());
        activeObjectives.push(new ExitStrategy());

        game.objectiveManager.init(activeObjectives);

        game.waveManager.spawnClocky.limit = 3;
        this.clocky = Clocky.sequence([
            {
                time: 60,
                tick: () => {
                    game.audioManager.voiceline("voice-s_presence")
                }
            },
            {
                time: 30, during: () => {
                    game.waveManager.spawnClocky.limit = 0.5 + 2.5 * (1 - this.clocky.progress)
                }
            },
            {
                time: 30,
                tick: () => {
                    game.audioManager.voiceline("voice-s_shifting1")
                    game.audioManager.music("music-labyrinth");


                }
            },
            {
                time: 15, during: () => {
                    game.waveManager.angle = this.clocky.progress;
                },
                tick: () => {
                    game.audioManager.voiceline("voice-e_more")

                }
            },
            {
                time: 10, during: () => {
                    game.waveManager.spawnClocky.limit = 0.25 + 0.25 * (1 - this.clocky.progress)
                }
            },
            {
                time: 60,
                tick: () => {
                    game.audioManager.voiceline("voice-s_shifting2")

                }
            },
            {
                time: 15, during: () => {
                    game.waveManager.angle = 1 - this.clocky.progress;
                }
            },
            {
                time: 60,
                tick: () => {
                    game.audioManager.voiceline("voice-s_overstay")
                }
            },
            {
                time: 30, during: () => {
                    game.waveManager.spawnClocky.limit = 0.1 + 0.15 * (1 - this.clocky.progress)
                }
            },
        ]).autoTick();

        game.audioManager.music("music-fog");


    }


    update(): void {
    }

    destroy(): void {
        super.destroy();
        this.clocky.stop = true;
    }
}

const levels = [
    TutorialLevel,
    Level1,
    Level2,
]