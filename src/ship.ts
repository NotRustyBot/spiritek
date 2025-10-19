import { CoreObject } from "./core";
import { game } from "./game";
import { AttractFlare, KillFlare, RepellFlare } from "./flare";
import { ShipFloodlight, ShipModule, ShipTurret } from "./shipModule";
import { Spotlight } from "./spotlight";
import { Sprite } from "pixi.js";
import { angleDistance, angleInterpolate, asset, fixAngle, rotate, toNearest } from "./util";
import { PolygonRepeller, RangeRepeller } from "./repeller";
import shipHitbox from "./hitbox/ship.json";
import { Spirit } from "./spirit";
import { Clocky } from "./clocky";
import { Projectile } from "./projectile";
import { Vector } from "./vector";
import { Turret } from "./turret";
import { SpotlightInstallation, TurretInstallation } from "./installation";
import { MousePriority } from "./input";
import { ISelectable } from "./types";
import { Common } from "./common";
import { TestRitual } from "./ritual";
import { ObjectOptionsData } from "./ui/objectOptions";
import { TranslateTo, RotateTo, MoveTo, ShipPickupItem } from "./orderManager";
import { AttentionIcon } from "./attention";
import { Inventory, itemDefinition, ItemType } from "./items";
import { DroppedItem } from "./droppedItem";
import { Astronaut } from "./astronaut";

export class Ship extends CoreObject implements ISelectable {
    repeller: PolygonRepeller;
    attractor: RangeRepeller;
    sprite: Sprite;
    overlaySprite: Sprite;

    spotlightL: ShipFloodlight;
    spotlightR: ShipFloodlight;
    turret: ShipTurret;

    attention: AttentionIcon;

    astronauts = 3;

    resist = 250;
    maxResist = 250;
    ui = {
        setResist: (value: string) => { }
    }

    get uiData(): ObjectOptionsData {
        const actions: ObjectOptionsData["actions"] = new Array();
        actions.push({
            name: "Move",
            icon: "img/ship.png",
            active: () => (game.orderManager.currentOrder instanceof MoveTo),
            action: () => {
                const order = new MoveTo();
                game.orderManager.newOrder(order);
            }
        });

        actions.push({
            name: "Translate",
            icon: "img/ship.png",
            active: () => (game.orderManager.currentOrder instanceof TranslateTo),
            action: () => {
                const order = new TranslateTo();
                game.orderManager.newOrder(order);
            }
        });

        actions.push({
            name: "Rotate",
            icon: "img/ship.png",
            active: () => (game.orderManager.currentOrder instanceof RotateTo),
            action: () => {
                const order = new RotateTo();
                game.orderManager.newOrder(order);
            }
        })

        actions.push({
            name: "Pick Up",
            icon: "img/stone_1.png",
            active: () => (game.orderManager.currentOrder instanceof ShipPickupItem),
            action: () => {
                const order = new ShipPickupItem();
                game.orderManager.newOrder(order);
            },
        });

        if (this.astronauts > 0) {
            actions.push({
                name: "Deploy Astronaut",
                icon: "img/astronaut.png",
                action: () => {
                    const astronaut = new Astronaut();
                    astronaut.position.set(this).add(Vector.fromAngle(this.rotation).mult(this.size + 50));
                    astronaut.targetPosition.set(astronaut.position);
                    this.astronauts--;
                    game.uiManager.updateObjectOptions(game.selected?.uiData);
                },
            });
        }

        return {
            name: "Spiritek",
            stats: [
                {
                    name: "resist",
                    updateHandler: (updater) => {
                        this.ui.setResist = updater;
                    }
                }
            ],
            actions,
            items: this.items.map((i) => {
                return {
                    ...i,
                    drop: () => {
                        this.dropItem(i.item)
                    },
                    action: () => {
                    }
                }
            })
        }
    }

    private _rotation = 0;
    get rotation() {
        return this._rotation;
    }

    set rotation(value) {
        if (value != this._rotation) {
            this._rotation = value;
            this.repeller.setPolygon(rotate(shipHitbox, value));
        }
    }

    targetRotation = -1;
    targetPosition = new Vector();

    items: Inventory = [];

    constructor() {
        super("updatable", "selectable", "drawable", "scenebound");
        this.sprite = new Sprite(asset("ship"));
        game.containers.ship.addChild(this.sprite);
        this.sprite.anchor.set(0.5);

        this.attention = new AttentionIcon();
        this.attention.setIcon("icon-Icon_Warning");

        this.overlaySprite = new Sprite(asset("ship"));
        game.containers.overlay.addChild(this.overlaySprite);
        this.overlaySprite.anchor.set(0.5);
        this.overlaySprite.tint = 0x55ff55;

        this.attractor = new RangeRepeller();
        this.attractor.range = 1800;
        this.attractor.emotional = true;
        this.attractor.strength = -1;

        this.repeller = new PolygonRepeller();
        this.repeller.setPolygon(shipHitbox);
        this.repeller.hit = (spirit: Spirit) => {
            this.resist -= game.dt * 4;
        };

        this.spotlightL = new ShipFloodlight({ x: -50, y: 100 }, this);
        this.spotlightR = new ShipFloodlight({ x: -50, y: -100 }, this);

        this.turret = new ShipTurret({ x: 300, y: 0 }, this);
        this.turret.turret.range = 1500;

        this.spotlightL.spotlight.targetPosition.set(-1000, 500);
        this.spotlightR.spotlight.targetPosition.set(-1000, -500);

        this.rotation = -1;
    }


    board(astronaut: Astronaut) {
        this.astronauts++;
        for (const item of astronaut.items) {
            this.pickup(item);
        }
        astronaut.destroy();
    }


    dropDir = 0;
    dropItem(item: ItemType) {
        if (this.itemCount(item) > 0) {
            const drop = new DroppedItem(item);
            this.spendItem(item);
            drop.position.set(this).add(Vector.fromAngle(this.rotation - 0.1 + Math.sin(this.dropDir++) * 0.2).mult(this.size + 50));
            game.uiManager.updateObjectOptions(this.uiData);
        }
    }



    itemCount(item: ItemType) {
        return this.items.filter(i => i.item == item).reduce<number>((a, b) => a + b.count, 0);
    }

    spendItem(item: ItemType) {
        return Common.spendItem(item, this.items);

    }

    inventorySize = 12;

    pickup(data: { item: ItemType, count: number }): number {

        const { item, count } = { ...data };
        let countLeft = count;
        for (let index = 0; index < this.inventorySize; index++) {
            if (index >= this.items.length) {
                this.items[index] = { item, count: 0 };
            }

            const slot = this.items[index];

            if (slot.item == item) {
                slot.count += countLeft;
                countLeft = 0;
                break;
            }
        }

        return countLeft;
    }

    size = 500;

    select(): void {
        const order = new MoveTo();
        game.orderManager.newOrder(order);
    }

    hover(): void {
        Common.hover(this, this.sprite);
    }

    unhover(): void {
        Common.unhover(this, this.sprite);
    }

    hoverCheck(): boolean {
        return this.repeller.check(game.controls.worldMouse);
    }

    clocky = new Clocky(1);

    update() {

        this.targetRotation = fixAngle(this.targetRotation);

        const rotSpeed = 30 * game.dt;
        if (this.rotation != this.targetRotation) {
            this.rotation = angleInterpolate(this.rotation, this.targetRotation, game.dt * rotSpeed);
        }

        const dsq = this.position.distanceSquared(this.targetPosition);
        if (dsq > 1) {
            const diff = this.targetPosition.diff(this);
            const align = Math.abs(angleDistance(diff.toAngle(), this.rotation)) < 1 ? 1 : 0.1;
            const speed = 600 * game.dt * align;
            if (dsq < speed) {
                this.position.set(this.targetPosition);
            } else {
                this.position.add(diff.normalize(speed));
            }
        }
        if (dsq > 1 || this.rotation != this.targetRotation) {
            this.overlaySprite.visible = true;
        } else {
            this.overlaySprite.visible = false;
        }

        this.repeller.position.set(this);
        this.attractor.position.set(this);

        this.ui.setResist(this.resist.toFixed(0));

        this.spotlightL.update();
        this.spotlightR.update();
        this.turret.update();
    }

    draw() {
        this.sprite.position.set(this.x, this.y);
        this.sprite.rotation = this.rotation;
        this.attention.forPosition(this, this.size);

        this.overlaySprite.position.set(this.targetPosition.x, this.targetPosition.y);
        this.overlaySprite.rotation = this.targetRotation;
    }

    destroy(): void {
        super.destroy();
        this.repeller.destroy();
        this.sprite.destroy();
        this.attractor.destroy();
        this.overlaySprite.destroy();
        this.attention.destroy();
    }
}

