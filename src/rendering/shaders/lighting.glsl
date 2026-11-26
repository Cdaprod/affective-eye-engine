// ACES-inspired filmic tonemapping for subdued cinematic highlights.
vec3 filmic(vec3 c) {
 return clamp((c*(2.51*c+0.03))/(c*(2.43*c+0.59)+0.14),0.0,1.0);
}
