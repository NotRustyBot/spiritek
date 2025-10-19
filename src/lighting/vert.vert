#version 300 es

in vec2 aPosition;
in vec2 aUV;

out vec2 vUV;
out vec2 vWorldUV;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

uniform mat3 uInverseCameraMatrix;

void main() {

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0f)).xy, 0.0f, 1.0f);
    vUV = aUV;
    vWorldUV = ((uInverseCameraMatrix) * vec3(aPosition, 1.f)).xy;
}