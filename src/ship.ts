import { CoreObject } from "./core";
import { game } from "./game";
import { AttractFlare, KillFlare, RepellFlare } from "./flare";

export class Ship extends CoreObject {
    action = new SpawnRepellFlare(this);
    constructor() {
        super("updatable");
    }


    actions = [
        SpawnRepellFlare,
        SpawnKillFlare,
        SpawnAttractFlare
    ]

    setAction(index = 0) {
        this.action.destroy();
        this.action = new this.actions[index](this);
    }

    update() {

        if (game.controls.pressed["Digit1"]) {
            this.setAction(0);
        } else if (game.controls.pressed["Digit2"]) {
            this.setAction(1);
        } else if (game.controls.pressed["Digit3"]) {
            this.setAction(2);
        }

        this.action.update();
    }
}

class ShipAction {
    ship: Ship;
    constructor(ship: Ship) {
        this.ship = ship;
    }
    get click() {
        return game.controls.click && game.controls.pointerDown;
    }
    update() { }

    destroy() { }
}

class SpawnRepellFlare extends ShipAction {
    override update() {
        if (this.click) {
            game.controls.click = false;
            const flare = new RepellFlare();

            flare.position = game.camera.position.clone();
            flare.position = game.controls.worldMouse.clone();
        }
    }
}

class SpawnKillFlare extends ShipAction {
    override update() {
        if (this.click) {
            game.controls.click = false;
            const flare = new KillFlare();

            flare.position = game.camera.position.clone();
            flare.position = game.controls.worldMouse.clone();
        }
    }
}

class SpawnAttractFlare extends ShipAction {
    override update() {
        if (this.click) {
            game.controls.click = false;
            const flare = new AttractFlare();

            flare.position = game.camera.position.clone();
            flare.position = game.controls.worldMouse.clone();
        }
    }
}