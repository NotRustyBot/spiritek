#version 300 es
precision mediump float;
uniform sampler2D uSampler;
in vec2 vUV;
out vec4 color;

void main() {
    vec2 uv = vUV;
    color = texture(uSampler, uv);
    //color = vec4(1.);
}