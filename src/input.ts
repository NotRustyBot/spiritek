import { game } from "./game";
import { Action } from "./types";
import { Vector } from "./vector";

export enum MousePriority {
    order = 0,
    select = 1,
    ui = 2,
}

export class ControlManager {
    pressed: Record<string, boolean> = {};
    held: Record<string, boolean> = {};
    released: Record<string, boolean> = {};
    mousePosition = new Vector();
    pointerDown = false;
    clicked = false;
    rightDown = false;
    wheel = 0;
    get worldMouse() {
        const cam = game.objects.getFirst("Camera");
        return this.mousePosition.clone().sub(cam.center).mult(1 / cam.zoom).add(cam);
    }
    constructor() {
        document.addEventListener("keydown", (k) => {
            console.log(k.code);

            this.pressed[k.code] = true;
            this.held[k.code] = true;
        });

        document.addEventListener("keyup", (k) => {
            this.released[k.code] = true;
            delete this.held[k.code];
        });

        document.addEventListener("mousemove", (e) => {
            this.mousePosition.set(e);
            this.pointerDown = mouseButtonPressed(e, "left");
            this.rightDown = mouseButtonPressed(e, "right");
        });

        document.addEventListener("contextmenu", (e) => { e.preventDefault() });

        document.addEventListener("mouseup", (e) => {
            this.pointerDown = mouseButtonPressed(e, "left");
            this.rightDown = mouseButtonPressed(e, "right");

        });

        document.addEventListener("mousedown", (e) => {
            this.pointerDown = mouseButtonPressed(e, "left");
            this.rightDown = mouseButtonPressed(e, "right");
            this.clicked = true;
        });

        document.addEventListener("wheel", (e) => {
            this.wheel = e.deltaY;
        })
    }

    requestMouse(priority: MousePriority, action: () => boolean | void) {
        this.clickRequests.push({ action, priority });
    }

    requestClick(priority: MousePriority, action: () => boolean | void) {
        this.requestMouse(priority, () => {
            if (!this.clicked) return false;
            action();
            game.controls.clicked = false;
            game.controls.pointerDown = false;
        })
    }

    requestPointerDown(priority: MousePriority, action: () => boolean | void) {
        this.requestMouse(priority, () => {
            if (!this.pointerDown) return false;
            action();
        })
    }



    clickRequests = new Array<{ action: () => boolean | void, priority: MousePriority }>;

    update() {
        this.pressed = {};
        this.released = {};
        this.wheel = 0;

        if (this.clickRequests.length > 0) {
            const rq = this.clickRequests.sort((a, b) => (b.priority - a.priority));
            while (rq.length > 0) {
                const result = rq.shift()!.action();
                if (result !== false) break;
            }
        }

        this.clickRequests = [];


        this.clicked = false;
    }
}

const buttonNames = ["left", "right", "wheel", "back", "forward"];
function mouseButtonPressed(event: MouseEvent, buttonName: string) {
    return Boolean(event.buttons & (1 << buttonNames.indexOf(buttonName)));
}