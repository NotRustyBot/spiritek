#version 300 es
precision highp float;

const int maxLightAmount = 16;
const int angleRes = 1024;

in vec2 vUV;
uniform sampler2D occluder;
uniform sampler2D uLightData;

uniform vec2 uPixelSize;

out vec4 color;

const float DOUBLE_PI = 2.f * 3.14159265358979323846264f;

struct Light {
    vec2 position;
    float angle;
    float width;
    float range;
    float intensity;
    vec3 color;
};

Light getLight(int index) {

    // rg: position, b: rotation
    // r: width, g: range, b: intensity
    // rgb: color

    vec4 PosPosRot = texelFetch(uLightData, ivec2(0, index), 0);
    vec4 WidRanInt = texelFetch(uLightData, ivec2(1, index), 0);
    vec4 ColColCol = texelFetch(uLightData, ivec2(2, index), 0);

    vec2 pos = PosPosRot.xy;
    float rot = PosPosRot.z;
    float wid = WidRanInt.x;
    float ran = WidRanInt.y;
    float str = WidRanInt.z;
    vec3 col = ColColCol.xyz;
    return Light(pos, rot, wid, ran, str, col);
}
Light getLight() {
    return getLight(int(vUV.y * float(maxLightAmount)));
}

void main(void) {
    float shadowMap = 1.f;
    float actualAngle = vUV.x * DOUBLE_PI;
    vec2 dir = vec2(cos(actualAngle), sin(actualAngle)) * uPixelSize;
    Light l = getLight();
    int shadowDepth = 0;
    if(l.range > .1f)
    //i should start at 0 but is increased to reduce shadows from objects right next to the light
        for(float i = 10.f / l.range; i < 1.f; i += 1.f / l.range / 2.f) {
            int alpha = int(texture(occluder, l.position + dir * (i * l.range + 0.25f)).a * 255.f);
            if(alpha > 100) {
                shadowDepth++;
            }
            if(shadowDepth > 5) {
                shadowMap = i;
                break;
            }
        }

    const float div = 256.f;
    float floored = floor(shadowMap * div) / div;
    float rem = (shadowMap - floored) * div;
    float flooredRem = floor(rem * div) / div;
    float remRem = (rem - flooredRem) * div;
    color = vec4(floored, rem, remRem, 1.f);
    //color = vec4(vec3(texture(occluder, vTextureCoord).a > 0.), 1.);
}
