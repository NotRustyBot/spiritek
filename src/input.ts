import { game } from "./game";
import { Action } from "./types";
import { Vector } from "./vector";

export enum MousePriority {
    order = 0,
    select = 1,
    selectOrderTarget = 2,
    ui = 3,
}

export class ControlManager {
    pressed: Record<string, boolean> = {};
    held: Record<string, boolean> = {};
    released: Record<string, boolean> = {};
    mousePosition = new Vector(window.innerWidth / 2, window.innerHeight / 2);
    pointerDown = false;
    clicked = false;
    rightClicked = false;
    rightDown = false;
    wheel = 0;
    get worldMouse() {
        const cam = game.objects.getFirst("Camera")!;
        return this.mousePosition.clone().sub(cam.center).mult(1 / cam.zoom).add(cam);
    }
    constructor() {
        const element = game.app.canvas;

        document.addEventListener("keydown", (k) => {
            console.log(k.code);

            this.pressed[k.code] = true;
            this.held[k.code] = true;
        });

        document.addEventListener("keyup", (k) => {
            this.released[k.code] = true;
            delete this.held[k.code];
        });

        element.addEventListener("mousemove", (e) => {
            this.mousePosition.set(e);
            this.pointerDown = mouseButtonPressed(e, "left");
            this.rightDown = mouseButtonPressed(e, "right");
        });

        element.addEventListener("contextmenu", (e) => { e.preventDefault() });

        element.addEventListener("mouseup", (e) => {
            this.pointerDown = mouseButtonPressed(e, "left");
            this.rightDown = mouseButtonPressed(e, "right");

        });

        element.addEventListener("mousedown", (e) => {
            this.pointerDown = mouseButtonPressed(e, "left");
            this.rightDown = mouseButtonPressed(e, "right");
            this.clicked = this.pointerDown;
            this.rightClicked = this.rightDown;
        });

        element.addEventListener("wheel", (e) => {
            this.wheel = e.deltaY;
        })
    }

    requestMouse(priority: MousePriority, action: () => boolean | void, cr?: any) {
        this.clickRequests.push({ action, priority, cancelationReference: cr });
    }

    requestClick(priority: MousePriority, action: () => boolean | void, cr?: any) {
        this.requestMouse(priority, () => {
            if (!this.clicked) return false;
            let retval = action();
            game.controls.clicked = false;
            game.controls.pointerDown = false;
            return retval;
        }, cr)
    }

    requestPointerDown(priority: MousePriority, action: () => boolean | void, cr?: any) {
        this.requestMouse(priority, () => {
            if (!this.pointerDown) return false;
            return action();
        }, cr)
    }

    cancelMouseRequest(cr: any) {
        let index = this.clickRequests.indexOf(cr);
        if (index == -1) return;
        this.clickRequests.splice(index, 1);
    }

    clickRequests = new Array<{
        action: () => boolean | void,
        priority: MousePriority,
        cancelationReference?: any
    }>;

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