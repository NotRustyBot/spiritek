#version 300 es
precision highp float;

const int maxLightAmount = 16;
const int angleRes = 1024;

const float shadowStrength = .95f;

uniform int lightAmount;

in vec2 vUV;
in vec2 vWorldUV;
uniform sampler2D uSampler;
uniform sampler2D uShadowMap;
uniform sampler2D uLightData;
uniform vec4 filterClamp;

uniform vec2 uPixelSize;
out vec4 color;

const float DOUBLE_PI = 2.f * 3.14159265358979323846264f;
const float PI = 3.14159265358979323846264f;

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

vec3 PBRNeutralToneMapping(vec3 color) {
    const float startCompression = 0.8f - 0.04f;
    const float desaturation = 0.15f;

    float x = min(color.r, min(color.g, color.b));
    float offset = x < 0.08f ? x - 6.25f * x * x : 0.04f;
    color -= offset;

    float peak = max(color.r, max(color.g, color.b));
    if(peak < startCompression)
        return color;

    const float d = 1.f - startCompression;
    float newPeak = 1.f - d * d / (peak + d - startCompression);
    color *= newPeak / peak;

    float g = 1.f - 1.f / (desaturation * (peak - newPeak) + 1.f);
    return mix(color, newPeak * vec3(1, 1, 1), g);
}

vec4 demult(vec4 color) {
    return vec4(vec3(color.rgb) / color.a, color.a);
}
float map(float value, float fromMin, float fromMax, float toMin, float toMax) {
    return toMin + (value - fromMin) * (toMax - toMin) / (fromMax - fromMin);
}
float nClamp(float value) {
    return clamp(value, 0.0f, 1.0f);
}

void main(void) {
    vec3 lightMap = vec3(.0f);
    for(int i = 0; i < lightAmount; i++) {
        Light l = getLight(i);

        vec2 off = (l.position - vUV) / uPixelSize / l.range;
        float angle = map(atan(off.y, off.x), -PI, PI, 0.f, 1.f);
        vec4 shadow = texelFetch(uShadowMap, ivec2(int(angle * float(angleRes)), i), 0);
        float shadowDist = shadow.r + shadow.g / 255.f + shadow.b / 255.f / 255.f;
        //float shadowDist = texture(shadowMap, vec2((angle), (i))).g;

        float dis = length(off);
        float disLinear = nClamp(1.f - dis);
        float distanceFalloff = disLinear * disLinear;

        vec2 targetDir = vec2(cos(l.angle), sin(l.angle));
        float angleOffset = (acos(clamp(dot(normalize(off), (targetDir)), -1.f, 1.f)));
        float angularFalloff = nClamp(smoothstep(l.width, -l.width, PI - angleOffset));
        angularFalloff += (min(.03,angularFalloff)/.03)*.2;
        //angularFalloff = 1.;

        vec3 addition = distanceFalloff * angularFalloff * l.color * l.intensity * 4.f;


        /*angularFalloff = nClamp(1.-step(l.width,abs(PI - angleOffset)));
        addition = disLinear*angularFalloff*l.color*l.intensity*3.f;*/

        addition *= 1.f - nClamp((dis - shadowDist) * .2f * l.range) * shadowStrength;

        lightMap+=addition;

        //lightMap+= length((l.position - vUV) / uPixelSize / l.range);
    }

    color = vec4(lightMap, 1.f);
    color.rgb = PBRNeutralToneMapping(color.rgb / 2.f);
    //color.rg = vUV;
    color.a = 0.;
    //color.rg = vWorldUV/100.;
    //color.r = sin(vWorldUV.x/10.)*1.-abs(vWorldUV.x/1000.);
    //color.g = sin(vWorldUV.y/10.)*1.-abs(vWorldUV.y/1000.);
}
