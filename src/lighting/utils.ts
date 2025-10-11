import { Geometry } from "pixi.js";

export class RandomGenerator {
    seed: number = 0;
    constructor(seed: number = Math.random() * 1000) {
        this.seed = seed;
    }
    float() {
        const result = this.mulberry32(this.seed);
        this.seed += parseInt((result + '').charAt(3)) * 100 + 1
        return result;
    }
    range(min: number, max: number) {
        return (this.float() * (max - min) + min);
    }
    int(min: number, max: number) {
        return Math.floor(this.range(min, max));
    }
    private mulberry32(a: number) {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    child() {
        return new RandomGenerator(this.float() * 10000);
    }
    bool(probability = 0.5) {
        return this.float() < probability
    }
}

export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

export function clamp(n: number, min = 0, max = 1) {
    return Math.min(max, Math.max(min, n));
}

export function displayNumber(n: number, digits = 2) {
    return parseFloat(n.toFixed(digits)).toString();
}
export const placeholderGeometry = new Geometry({ attributes: { aPosition: [0, 1], aUV: [0, 1], aTerrainStats: [0, 0, 0, 0], aTerrainStats2: [0], aTerrainInspect: [0] } });

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

export const limitAbs = (n: number, max: number) => Math.sign(n) * Math.min(Math.abs(n), max);