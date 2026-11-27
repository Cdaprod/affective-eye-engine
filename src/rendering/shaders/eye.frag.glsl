precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec2 uGaze;
uniform vec2 uPhysical;
uniform float uPhysicalWeight;
uniform vec2 uVelocity;
uniform vec2 uOrientation;
uniform float uTime;
uniform float uProximity;
uniform float uValence;
uniform float uFrustration;
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
  float a=radians(abs(uTilt)+abs(min(0.0,uValence))*18.0);
  float maxH=min(res.y*.17,res.x*.15)*uProximity*(1.0+.45*uArousal);
  vec2 extent=vec2((res.x*.205+width)*abs(cos(a))+maxH*abs(sin(a)),(res.x*.205+width)*abs(sin(a))+maxH*abs(cos(a)))*1.08;
  vec2 travel=max(vec2(0.0),res*.5-extent-vec2(3.0));
  vec2 gaze=vec2(uGaze.x*horizontal,-uGaze.y*vertical)*(1.0-uPhysicalWeight);
  vec2 pivot=clamp(gaze+vec2(uPhysical.x,-uPhysical.y)*travel+vec2(0.0,uBounce*res.y/300.0),-travel,travel);
  vec2 center=pivot+vec2(side*res.x*.205,0.0);
  vec2 local=rotate2d(pixel-pivot,-radians(uTilt))-(center-pivot);
  float tilt=radians((side*min(0.0,uValence)*18.0));
  local=rotate2d(local,-tilt);
  float stretch=saturate(uStretch);
  local=deform(local,stretch);
  vec2 halfSize=vec2(width,height);
  float d=sdRoundBox(local,halfSize,min(width*.58,height*.56));
  float across=clamp(local.x/max(width,1.0),-1.0,1.0);
  float arch=max(0.0,1.0-across*across);
  float arc=height*(.40*arch-.10);
  float arcWidth=max(.5,height*.15*arch);
  float smile=max(abs(local.y-arc)-arcWidth,abs(local.x)-width);
  float happiness=smoothstep(.35,.88,uValence)*smoothstep(.15,.65,openness);
  d=mix(d,smile,happiness);
  // Screen-space analytical bloom: single pass on low-powered devices.
  float bloomRadius=max(2.0,min(res.x,res.y)*.075);
  float outer=exp(-pow(max(d,0.0)/bloomRadius,1.25))*saturate(uBloom);
  float anger=saturate(uFrustration*2.0);
  float warm=smoothstep(.2,.6,uFrustration);
  float red=smoothstep(.65,.95,uFrustration);
  vec3 halo=mix(mix(mix(vec3(.015,.42,.63),vec3(.35,.65,.32),saturate(uFrustration*4.0)),vec3(.85,.27,.025),warm),vec3(.85,.015,.025),red)*outer*.30*uEmission;
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
  material=mix(material,mix(mix(vec3(.55,.9,.65),vec3(1.0,.38,.035),warm),vec3(1.0,.018,.025),red)*(.65+.65*light)*max(.25,uEmission),anger);
  color=mix(color,material+halo*.35,coverage);
 }
 // Low-amplitude filmic grading; no grain (avoid noisy OLED animation).
 color=filmic(max(color,vec3(0.0)));
 color=pow(color,vec3(.93));
 gl_FragColor=vec4(color,1.0);
}
