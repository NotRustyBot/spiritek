import fragment from './shadowmap.frag?raw';
import vertex from './vert.vert?raw';
import { Container, RenderTexture, Sprite } from 'pixi.js';
import { ShaderMesh } from './shaderMesh';
import { Light } from './light';
import { game } from '../game';
import { Vector } from '../vector';

const defaultUniforms = {
    viewport: {
        type: "vec4<f32>",
        value: [0, 0, 0, 0]
    },
    uPixelSize: {
        type: "vec2<f32>",
        value: [0, 0]
    },
    lightAmount: {
        type: "i32",
        value: 0
    }
}

export class Shadowmap {
    static angles = 1024;
    static fragment: string = fragment;
    static vertex: string = vertex;
    static shadowDataTexture: RenderTexture;
    static shaderMesh: ShaderMesh;
    static occluderTexture: RenderTexture;
    static init() {
        console.log("initialising shadowmesh");
        this.occluderTexture = RenderTexture.create({ width: window.innerWidth, height: window.innerHeight });
        this.shadowDataTexture = RenderTexture.create({ width: this.angles, height: Light.maxAmount, format: "r32float" });
        this.shaderMesh = new ShaderMesh({ frag: Shadowmap.fragment, customTextures: [{ name: "occluder", texture: this.occluderTexture }, { name: "uLightData", texture: Light.dataTexture }], customUniforms: defaultUniforms, size: new Vector(this.angles, Light.maxAmount), anchor: new Vector(0, 0) });
        this.resize();
    }
    static clearOccluderTexture() {
        game.app.renderer.render({ target: this.occluderTexture, clearColor: [0, 0, 0, 0], container: new Container() });
        Shadowmap.occluderTexture.source.update();
    }
    static update() {
        Light.updateDataTexture();

        this.shaderMesh.setUniform("uPixelSize", [1 / window.innerWidth, 1 / window.innerHeight]);
        this.shaderMesh.setUniform("lightAmount", Light.list.length);
        this.shaderMesh.setUniform("viewport", [...game.camera.position.xy(), window.innerWidth, window.innerHeight]);

        game.app.renderer.render({ target: this.shadowDataTexture, container: this.shaderMesh });
    }
    static resize() {
        this.occluderTexture.resize(window.innerWidth, window.innerHeight);
        //this.occluderTexture = RenderTexture.create({ width: window.innerHeight, height: window.innerWidth});
        this.shaderMesh.shader.resources.occluder = this.occluderTexture.source;
    }
}
