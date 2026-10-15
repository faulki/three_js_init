uniform vec3 uColor;
uniform float uOpacity;
uniform float uDecayIntensity;
uniform float uDecayDistance;
uniform float uEdgeSoftness;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    float dist = vPosition.z;
    float lengthAlpha = 1.0 - smoothstep(uDecayDistance - uDecayIntensity, uDecayDistance, dist);

    float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));
    float edgeAlpha = smoothstep(0.0, uEdgeSoftness, facing);

    gl_FragColor = vec4(uColor, uOpacity * lengthAlpha * edgeAlpha);
}
