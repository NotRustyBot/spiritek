import { game } from "./game";
import { Action } from "./types";


export type ClockyData = {
    time: number;
    repeat?: number;
    during?: Action;
    tick?: Action;
}
export class Clocky {

    time = 0;
    limit: number;
    repeat = Infinity;
    stop = false;
    followUp?: Array<ClockyData>;

    get progress() {
        return this.time / this.limit;
    }

    constructor(limit: number = 1000) {
        this.limit = limit;
    }

    static once(limit: number) {
        const once = new Clocky(limit);
        once.repeat = 1;
        once.repeat = 1;
        return once;
    }

    next() {
        if (!this.followUp || this.followUp.length == 0) return;
        const data = this.followUp.shift()!;

        this.stop = false;
        this.repeat = data.repeat ?? 1;
        this.limit = data.time;

        this.during = data.during;
        this.tick = data.tick;

        return this;
    }

    static sequence(data: Array<ClockyData>) {
        const c = new Clocky();
        c.followUp = data;
        c.next()
        return c;
    }

    during?: Action;
    tick?: Action;

    check() {
        if (this.stop) return false;
        this.during?.();
        this.time += game.dt;
        if (this.time > this.limit) {
            this.time -= this.limit;
            if (--this.repeat <= 0) this.stop = true;
            this.tick?.();
            if (this.followUp) this.next();
            return true;
        }
        return false;
    }

}