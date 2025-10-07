import { game } from "./game";
import { Vector } from "./vector";

export class ControlManager {
    pressed: Record<string, boolean> = {};
    held: Record<string, boolean> = {};
    released: Record<string, boolean> = {};
    mousePosition = new Vector();
    pointerDown = false;
    click = false;
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

        game.objects.add("postprocess", this);

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
            this.click = true;
        });

        document.addEventListener("wheel", (e) => {
            this.wheel = e.deltaY;
        })
    }

    postprocess() {
        this.pressed = {};
        this.released = {};
        this.wheel = 0;
        this.click = false;
    }
}

const buttonNames = ["left", "right", "wheel", "back", "forward"];
function mouseButtonPressed(event: MouseEvent, buttonName: string) {
    return Boolean(event.buttons & (1 << buttonNames.indexOf(buttonName)));
}