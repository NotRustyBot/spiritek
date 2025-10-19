import { Mesh, Texture, MeshGeometry, GlProgram, DestroyOptions, Container, TextureShader, Shader, UniformGroup, Matrix } from "pixi.js";
import defaultVert from "./vert.vert?raw";
import defaultFrag from "./frag.frag?raw";
import { Vector, Vectorlike } from "../vector";

const array = [
    0, 0,
    0, 1,
    1, 1,
    1, 0];

export type Uniform = { type: string, value: any };
export type Uniforms = { [name: string]: Uniform };
export type ShaderMeshOptions = {
    texture?: Texture,
    customTextures?: { name: string, texture: Texture }[],
    vert?: string,
    frag: string,
    customUniforms?: Uniforms,
    anchor?: Vectorlike,
    size?: Vector,
    parent?: Container
};
export class ShaderMesh extends Mesh {
    public static list: Set<ShaderMesh> = new Set();
    public get shader(): TextureShader {
        return super.shader as TextureShader;
    }
    public set shader(value: TextureShader) {
        super.shader = value;
    }
    public anchor: Vectorlike;
    set texture(value: Texture) {
        if (this.anchor)
            this.resize(value.width, value.height);
        super.texture = value;
    }
    get texture() { return super.texture; }
    constructor(options: ShaderMeshOptions) {
        const mesh = new MeshGeometry({
            positions: new Float32Array(array),
            uvs: new Float32Array(array),
        });

        const texture = options.texture ?? Texture.WHITE;
        texture.source.scaleMode = "nearest";
        const resources: { [name: string]: any } = {
            uSampler: texture.source,
        };

        if (options.customTextures) {
            for (let i = 0; i < options.customTextures.length; i++) {
                options.customTextures[i].texture.source.scaleMode = "nearest";
                resources[options.customTextures[i].name] = options.customTextures[i].texture.source;
            }
        }
        (resources.group as Uniforms) = options.customUniforms ? Object.assign({}, options.customUniforms) : {};
        (resources.group as Uniforms).uInverseCameraMatrix = { type: "mat3x3<f32>", value: new Matrix().toArray() };

        const vertex = options.vert ?? defaultVert;
        const fragment = options.frag ?? defaultFrag;
        const shader = new Shader({
            glProgram: GlProgram.from({ vertex, fragment }),
            resources,
        });
        super({ texture, geometry: mesh, shader: shader as any, parent: options.parent });
        this.anchor = options.anchor ?? { x: 0, y: 0 };
        this.resize(options.size?.x ?? texture.width, options.size?.y ?? texture.height);
        this.scale.set(1);
        ShaderMesh.list.add(this);
        //console.log(game.app.renderer.globalUniforms.bindGroup);
    }
    resize(width: number, height: number) {
        if (!this.geometry) return;
        this.geometry.positions = new Float32Array([
            -width * this.anchor.x, -height * this.anchor.y,
            -width * this.anchor.x, height * (1 - this.anchor.y),
            width * (1 - this.anchor.x), height * (1 - this.anchor.y),
            width * (1 - this.anchor.x), -height * this.anchor.y]);
    }
    setUniform(name: string, value: any) {
        //this.shader!.resources.group.uniform
        //this.shader!.resources.group.uniformStructures[name] = { type: "f32", value };
        this.shader!.resources.group.uniforms[name] = value;
    }
    destroy(options?: DestroyOptions): void {
        super.destroy(options);
        ShaderMesh.list.delete(this);
        this.shader?.destroy();
    }
}


