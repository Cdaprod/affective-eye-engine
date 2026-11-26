precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec2 uGaze;
uniform vec2 uVelocity;
uniform vec2 uOrientation;
uniform float uTime;
uniform float uProximity;
uniform float uValence;
uniform float uArousal;
uniform float uBlink;
uniform float uAsymmetry;
uniform float uWink;
uniform float uTilt;
uniform float uBounce;
uniform float uStretch;
uniform float uEmission;
uniform float uBloom;
uniform float uMaterial;

float saturate(float x) {return clamp(x,0.0,1.0);}
/* __SDF__ */
vec2 rotate2d(vec2 v,float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c)*v;}
/* __LIGHTING__ */
/* __DEFORMATION__ */
void main(){
 vec2 res=max(uResolution,vec2(1.0));
 vec2 pixel=(vUv-.5)*res;
 vec3 background=vec3(.002,.005,.011);
 float ambient=exp(-dot(pixel / res * vec2(1.5,2.2),pixel / res * vec2(1.5,2.2))*5.0);
 background+=vec3(.005,.023,.035)*ambient*(.55+.12*uEmission);
 vec3 color=background;
 for(int i=0;i<2;i++){
  float side=i==0?-1.0:1.0;
  float width=min(res.x*.087,res.y*.26)*uProximity;
  float height=min(res.y*.17,res.x*.15)*uProximity*(1.0+.45*uArousal);
  if(i==1)height*=1.0-saturate(uAsymmetry)*.72;
  float openness=1.0-saturate(max(uBlink,i==1?uWink:0.0))*.985;
  height=max(height*openness,1.1);
  float horizontal=min(res.x*.115,max(0.0,(res.x*.5-(res.x*.205+width*1.1)))/1.12);
  float vertical=min(res.y*.17,max(0.0,(res.y*.5-height*1.15)/1.12));
  vec2 center=vec2(side*res.x*.205+uGaze.x*horizontal,-uGaze.y*vertical+uBounce*res.y/300.0);
  vec2 pivot=vec2(uGaze.x*horizontal,-uGaze.y*vertical+uBounce*res.y/300.0);
  vec2 local=rotate2d(pixel-pivot,-radians(uTilt))-(center-pivot);
  float tilt=radians((side*min(0.0,uValence)*18.0));
  local=rotate2d(local,-tilt);
  float stretch=saturate(uStretch);
  local=deform(local,stretch);
  vec2 halfSize=vec2(width,height);
  float d=sdRoundBox(local,halfSize,min(width*.58,height*.56));
  float across=clamp(local.x/max(width,1.0),-1.0,1.0);
  float arc=(1.0-across*across)*height*.44;
  float arcWidth=max(1.2,height*.24);
  float smile=max(abs(local.y-arc)-arcWidth,abs(local.x)-width);
  float happiness=smoothstep(.35,.88,uValence);
  d=mix(d,smile,happiness);
  // Screen-space analytical bloom: single pass on low-powered devices.
  float bloomRadius=max(2.0,min(res.x,res.y)*.075);
  float outer=exp(-pow(max(d,0.0)/bloomRadius,1.25))*saturate(uBloom);
  vec3 halo=vec3(.015,.42,.63)*outer*.30*uEmission;
  color+=halo;
  float edge=clamp(.8+fwidth(d),1.0,3.0);
  float coverage=1.0-smoothstep(-edge,edge,d);
  // Internal simulated surface normal and broad, orientation-driven key light.
  vec2 surface=clamp(local/max(halfSize,vec2(1.0)),-1.0,1.0);
  // A smooth hemisphere normal eliminates the point singularity at the eye center.
  float radial=dot(surface,surface);
  vec3 normal=normalize(vec3(surface.x*.68,surface.y*.68,sqrt(max(.12,1.0-radial*.44))));
  vec3 keyDir=normalize(vec3(-.45+uOrientation.x*.22,.64-uOrientation.y*.22,1.0));
  float light=saturate(dot(normal,keyDir)*.72+.24);
  float highlight=pow(saturate(1.0-length(surface-vec2(-.36,.43))/.80),2.2);
  float rim=pow(saturate(length(surface)*.84),2.5);
  vec3 luminous=mix(vec3(.025,.35,.52),vec3(.49,.95,1.0),.36+.52*light)+vec3(.65,.82,.9)*highlight*.52;
  vec3 glass=mix(vec3(.006,.041,.075),vec3(.11,.49,.64),.2+.6*light)+vec3(.54,.9,1.0)*(rim*.50+highlight*.42);
  vec3 material=mix(luminous,glass,saturate(uMaterial));
  material*=max(.25,uEmission);
  // Subtle tactile glass rim and glint, not separate pupils or eyeballs.
  material+=vec3(.14,.42,.52)*smoothstep(-5.0,-.7,d)*rim*.28;
  color=mix(color,material+halo*.35,coverage);
 }
 // Low-amplitude filmic grading; no grain (avoid noisy OLED animation).
 color=filmic(max(color,vec3(0.0)));
 color=pow(color,vec3(.93));
 gl_FragColor=vec4(color,1.0);
}
