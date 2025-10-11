import { CoreObject } from "./core";
import { RangeRepeller } from "./repeller";
import { Ship } from "./ship";
import { Spotlight } from "./spotlight";
import { Turret } from "./turret";
import { Vector, Vectorlike } from "./vector";

export class ShipModule extends CoreObject {
    private relativePosition = new Vector();

    setRelativePosition(x: number | Vectorlike, y?: number) {
        this.relativePosition.set(x as any, y as any);
        this.angle = this.relativePosition.toAngle();
        this.distance = this.relativePosition.length();
    }


    private distance!: number;
    private angle!: number;
    ship: Ship;
    constructor(relativePosition: Vectorlike, ship: Ship) {
        super();
        this.ship = ship
        this.setRelativePosition(relativePosition);
    }



    update() {
        this.position.set(0, 0);
        this.position.add(this.ship);
        this.position.add(Vector.fromAngle(this.ship.rotation + this.angle).mult(this.distance));
    }
}

export class ShipFloodlight extends ShipModule {
    spotlight = new Spotlight();
    override update() {
        super.update();
        this.spotlight.position.set(this);
    }
}

export class ShipTurret extends ShipModule {
    turret = new Turret();
    override update() {
        super.update();
        this.turret.position.set(this);
    }
}