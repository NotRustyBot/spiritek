import { Assets, Color, ColorSource, Graphics } from "pixi.js";
import { type BundleAliases } from "./bundle.ts";
import { Vector, type Vectorlike } from "./vector.ts";
import bundle_sound, { type Bundle_soundAliases, type Bundle_soundAsset } from './bundle_sound.ts';


export function asset(name: BundleAliases): any;
export function asset(name: string): any;
export function asset(name: string) {
    return Assets.get(name);
}

export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}

export function anchor(polygon: Vectorlike[], x: number, y?: number) {
    if (y == undefined) y = x;

    const minX = Math.min(...polygon.map((p) => p.x));
    const minY = Math.min(...polygon.map((p) => p.y));

    const maxX = Math.max(...polygon.map((p) => p.x));
    const maxY = Math.max(...polygon.map((p) => p.y));

    const width = maxX - minX;
    const height = maxY - minY;

    polygon.forEach(p => {
        p.x -= minX + width * x;
        p.y -= minY + height * y;
    });

    return polygon;
}

export function rotate(polygon: Vectorlike[], rotation: number) {
    return polygon.map(p => Vector.fromLike(p).rotate(rotation));
}

export function forshapen(graphics: Graphics) {
    let first = true;
    return (vectorlike: Vectorlike) => {
        if (first) {
            first = false;
            graphics.moveTo(vectorlike.x, vectorlike.y);
        } else {
            graphics.lineTo(vectorlike.x, vectorlike.y);
        }
    }
}

export function interpolateColors(a: ColorSource, b: ColorSource, ratio: number) {
    a = new Color(a);
    b = new Color(b);
    const out = new Color([a.red + (b.red - a.red) * ratio, a.green + (b.green - a.green) * ratio, a.blue + (b.blue - a.blue) * ratio]);
    return out;
}

/*

export function sound(file: Bundle_soundAliases) {
    const path = bundle_sound.assets.find((asset: Bundle_soundAsset) => asset.alias === file)!;
    if(path == undefined) throw new Error(file + " isnt a valid sound")
    return new Howl({ src: [path.src], volume: 1 });
}*/