import { Sprite } from "pixi.js";
import { CoreObject } from "./core";
import { game } from "./game";
import { ItemType } from "./items";
import { ObjectiveUiData } from "./ui/objectives";
import { asset } from "./util";

export class ObjectiveManager extends CoreObject {
    minedOre = 0;
    updateUi!: (data: ObjectiveUiData) => void;
    activeObjectives = new Array<Objective>();

    get criticalObjectivesComplete() {
        return this.activeObjectives.every(o => o.isCompleted || o.isOptional)
    }

    constructor() {
        super("updatable");
        this.activeObjectives.push(new MiningObjective())
        this.activeObjectives.push(new RecoverMiningEquipment())
        this.activeObjectives.push(new CrewOnBoard())
        this.activeObjectives.push(new ExitStrategy())
        game.uiManager.updateObjectives(this.activeObjectives.map(v => ({ dataGetter: (g) => v.updateUi = g })));

    }

    update() {
        for (const objective of this.activeObjectives) {
            objective.update();
        }
    }
}

export class Objective {
    isCompleted = false;
    isOptional: boolean;
    constructor(optional = false) {
        this.isOptional = optional;
    }
    updateUi!: (data: ObjectiveUiData) => void;
    update() { }

    getRating() { }
}

export class MiningObjective extends Objective {
    target = 200;
    update(): void {
        if (game.objectiveManager.minedOre >= this.target) this.isCompleted = true;
        this.updateUi({
            name: "Restock",
            desc: "Mine ore",
            status: game.objectiveManager.minedOre.toFixed(1) + " / " + this.target.toFixed(1),
            completed: this.isCompleted
        });
    }
}

export class RecoverMiningEquipment extends Objective {
    target = 2;
    update(): void {
        let count = game.ship.itemCount(ItemType.DrillParts);
        if (count >= this.target) this.isCompleted = true;
        this.updateUi({
            name: "Reuse",
            desc: "Bring mining equipment back to the ship",
            status: count + " / " + this.target,
            completed: this.isCompleted
        });
    }
}

export class CrewOnBoard extends Objective {
    target = 3;
    update(): void {
        let count = game.ship.astronauts;
        if (count >= this.target) this.isCompleted = true;
        this.updateUi({
            name: "Human Resources",
            desc: "Have astronauts on board",
            status: count + " / " + this.target,
            completed: this.isCompleted
        });
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
        this.sprite.x = 4000;
    }

    update(): void {
        if (game.ship.position.distanceSquared(this.sprite) < 400 ** 2) this.isCompleted = true;
        this.updateUi({
            name: "Exit Strategy",
            desc: "Enter the exit zone",
            status: "",
            completed: this.isCompleted
        });
    }
}