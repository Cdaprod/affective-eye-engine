// Signed-distance geometry for rounded, continuously morphing procedural eyes.
float sdRoundBox(vec2 p,vec2 b,float r) {
 vec2 q=abs(p)-b+vec2(r);
 return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;
}
