import fragment from './lightmap.frag?raw';
import vertex from './vert.vert?raw';
import { Container, RenderTexture, Texture } from 'pixi.js';
import { Light } from './light';
import { Shadowmap } from './shadowmap';
import { ShaderMesh } from './shaderMesh';
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

export class Lightmap {
    static fragment: string = fragment;
    static vertex: string = vertex;
    //TODO float texture not doing anything
    static texture: RenderTexture = RenderTexture.create({ format: "rgba32float" });
    static shaderMesh: ShaderMesh;
    static init() {
        Light.init();
        Shadowmap.init();
        this.texture.resize(window.innerWidth, window.innerHeight);
        //this.texture.update();
        this.shaderMesh = new ShaderMesh({
            frag: this.fragment,
            customTextures: [{ name: "uShadowMap", texture: Shadowmap.shadowDataTexture }, { name: "uLightData", texture: Light.dataTexture }],
            customUniforms: defaultUniforms,
            size: new Vector(window.innerWidth, window.innerHeight),
            anchor: new Vector(0, 0)
        });
        this.resize();
    }

    static update() {
        //Shadowmap.update();
        this.shaderMesh.setUniform("uPixelSize", [1 / window.innerWidth, 1 / window.innerHeight]);
        this.shaderMesh.setUniform("lightAmount", Light.list.length);
        this.shaderMesh.setUniform("viewport", [...game.camera.position.xy(), window.innerWidth/game.camera.zoom, window.innerHeight/game.camera.zoom]);
        game.app.renderer.render({ target: this.texture, container: this.shaderMesh, clear: true});
    }

    static resize() {
        if (game.camera) {
            this.texture.resize(window.innerWidth, window.innerHeight);
            this.shaderMesh.resize(window.innerWidth, window.innerHeight);
        }
    }
}