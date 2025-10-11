import { Sprite, Texture } from 'pixi.js';
import { game } from '../game';
import { Vector } from '../vector';
import { CustomColor } from './color';

export type LightOptions = { position: Vector; angle?: number; width?: number; color?: CustomColor; range?: number; intensity?: number; parent?: Sprite; };

export class Light {
    static maxAmount = 16;
    private _position = new Vector();
    width = 1;
    private _angle: number;
    range = 100;
    private _intensity = 1;
    color: CustomColor;
    parent?: Sprite;
    constructor(options: LightOptions) {

        this._position = options.position;
        this._angle = options.angle ?? 0;
        this.width = options.width ?? 1;
        this.range = options.range ?? 1000;
        this.color = options.color ?? CustomColor.white();
        this._intensity = options.intensity ?? 1;
        this.parent = options.parent;
        //console.log(this);
        Light.list.push(this);
    }

    public get angle(): number {
        if (!this.parent) return this._angle;
        //if (this.parent.graphics.scale.x < 0) return Math.PI - (this._angle) + this.parent.angle;
        return this._angle + this.parent.rotation;
    }
    public get position(): Vector {
        if (!this.parent) return this._position;
        return Vector.fromLike(this.parent.position);
    }
    public set angle(angle) {
        this._angle = angle;
    }
    public set position(position) {
        this._position = position;
    }
    public set intensity(intensity) {
        this._intensity = intensity;
    }
    public get intensity() {
        return this._intensity;
    }

    remove() {
        Light.list.splice(Light.list.indexOf(this), 1);
    }

    static list: Light[] = [];

    static init() {
        this.list = [];
        this.dataTexture = Texture.from({ resource: new Float32Array(Light.maxAmount * 3 * 4), height: Light.maxAmount, width: 3, format: "rgba32float" });
        this.updateDataTexture();
    }

    static dataTexture: Texture;
    static updateDataTexture() {
        const width = 3;
        const dataWidth = width * 4;
        const array = new Float32Array(Light.maxAmount * dataWidth);
        for (let i = 0; i < Light.list.length && i < Light.maxAmount; i++) {
            const index = i * dataWidth;
            const light = Light.list[i];
            const pos = light.position.clone();
            pos.floor();
            const renderPos = game.camera.worldToRender(pos);
            // rg: position, b: rotation
            // r: width, g: range, b: intensity
            // rgb: color
            array.set([renderPos.x, renderPos.y, light.angle, 1], index + 4 * 0);
            array.set([light.width, light.range, light.intensity, 1], index + 4 * 1);
            array.set([light.color.r / 255, light.color.g / 255, light.color.b / 255, 1], index + 4 * 2);
        }
        //Shadowmap.lightDataTexture = Texture.from({ resource: array, height: Light.maxAmount, width: width, format: "rgba32float" });
        this.dataTexture.source.resource = array;
        //Shadowmap.lightDataTexture.update();
        this.dataTexture.source.update();
        return this.dataTexture;
    }


}
