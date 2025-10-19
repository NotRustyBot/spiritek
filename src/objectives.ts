import { Sprite } from "pixi.js";
import { CoreObject } from "./core";
import { game } from "./game";
import { ItemType } from "./items";
import { ObjectiveUiData } from "./ui/objectives";
import { asset } from "./util";
import { ObjectiveReportData } from "./levelManager";

export class ObjectiveManager extends CoreObject {
    minedOre = 0;
    updateUi!: (data: ObjectiveUiData) => void;
    activeObjectives = new Array<Objective>();

    get criticalObjectivesComplete() {
        return this.activeObjectives.every(o => o.isCompleted || o.isOptional)
    }

    get criticalNonExitComplete() {
        return this.activeObjectives.every(o => o.isCompleted || o.isOptional || o instanceof ExitStrategy)
    }

    constructor() {
        super("updatable", "scenebound");

    }

    init(objectives: Array<Objective>) {
        this.activeObjectives = objectives;
        game.uiManager.updateObjectives(this.activeObjectives.map(v => ({ dataGetter: (g) => v.updateUi = g })));
    }

    update() {
        for (const objective of this.activeObjectives) {
            objective.update();
        }

        if (this.criticalObjectivesComplete) {
            game.levelManager.transition();
            for (const objective of this.activeObjectives) {
                objective.clear()
            }
        }
    }
}

export abstract class Objective {
    isCompleted = false;
    isOptional: boolean;
    constructor(optional = false) {
        this.isOptional = optional;
    }
    updateUi!: (data: ObjectiveUiData) => void;
    update() { }

    clear() { }
    abstract getRating(): ObjectiveReportData | undefined;
}

export class MiningObjective extends Objective {
    target = 200;
    update(): void {
        if (game.objectiveManager.minedOre >= this.target) this.isCompleted = true;
        this.updateUi({
            desc: "Mine ore",
            status: game.objectiveManager.minedOre.toFixed(1) + " / " + this.target.toFixed(1),
            completed: this.isCompleted
        });
    }

    override getRating(): ObjectiveReportData {
        return {
            result: this.isCompleted ? "success" : "failure",
            status: "Mined " + game.objectiveManager.minedOre.toFixed(1) + " ore",
            score: game.objectiveManager.minedOre
        }
    }
}

export class RecoverMiningEquipment extends Objective {
    target = 2;
    update(): void {
        let count = game.ship.itemCount(ItemType.DrillParts);
        if (count >= this.target) this.isCompleted = true;
        this.updateUi({
            desc: "Bring mining equipment back to the ship",
            status: count + " / " + this.target,
            completed: this.isCompleted
        });
    }

    getRating(): ObjectiveReportData | undefined {
        const parts = game.ship.itemCount(ItemType.DrillParts);
        if (parts >= this.target) return undefined;
        return {
            result: "failure",
            status: "Lost  " + (this.target - parts) + " pieces of mining equipment",
            score: Math.round((this.target - parts) * -100)
        };
    }
}

export class CrewOnBoard extends Objective {
    target = 3;
    update(): void {
        let count = game.ship.astronauts;
        if (count >= this.target) this.isCompleted = true;
        this.updateUi({
            desc: "Have astronauts on board",
            status: count + " / " + this.target,
            completed: this.isCompleted
        });
    }


    getRating(): ObjectiveReportData | undefined {
        let count = game.ship.astronauts;
        if (count >= this.target) return undefined;
        return {
            result: "failure",
            status: "Lost  " + (this.target - count) + " astronauts.",
            score: Math.round((this.target - count) * -1000)
        };
    }
}

export class ExitStrategy extends Objective {
    sprite: Sprite;
    constructor(optional?: boolean) {
        super(optional);
        this.sprite = new Sprite(asset("circle"));
        game.containers.overlay.addChild(this.sprite);
        this.sprite.anchor.set(0.5);
        this.sprite.width = 800;
        this.sprite.height = 800;
        this.sprite.x = -4000;
    }

    update(): void {
        this.sprite.visible = game.objectiveManager.criticalNonExitComplete;
        if (game.ship.position.distanceSquared(this.sprite) < 400 ** 2) this.isCompleted = true;
        this.updateUi({
            desc: "Enter the exit zone",
            status: "",
            completed: this.isCompleted
        });
    }

    getRating(): ObjectiveReportData | undefined {
        return undefined;
    }

    clear(): void {
        this.sprite.destroy();
    }
}