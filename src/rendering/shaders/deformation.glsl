// Velocity-based squash and stretch; keeps geometry continuous.
vec2 deform(vec2 local,float stretch) {
 local.x/=1.0+stretch;
 local.y/=max(.55,1.0-.38*stretch);
 return local;
}
