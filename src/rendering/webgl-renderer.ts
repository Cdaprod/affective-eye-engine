import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import vertexShader from './shaders/eye.vert.glsl?raw';
import fragmentShader from './shaders/eye.frag.glsl?raw';
import type {Quality,EyeMaterial,RenderFrame} from './types';
import {qualityProfiles} from './profiles';

export class WebGLRenderer {
 readonly canvas:HTMLCanvasElement;
 private renderer:THREE.WebGLRenderer;
 private scene=new THREE.Scene();
 private camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 private material:THREE.ShaderMaterial;
 private mesh:THREE.Mesh;
 private composer?:EffectComposer;
 private bloomPass?:UnrealBloomPass;
 private resizeObserver:ResizeObserver|undefined;
 private lost=false;
 private onLost:(event:Event)=>void;
 private onRestored:()=>void;
 constructor(private host:HTMLElement,private quality:Quality,private ultra:boolean,private onFailure:()=>void){
  this.canvas=document.createElement('canvas');
  this.canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  this.onLost=(event)=>{event.preventDefault();this.lost=true;this.onFailure()};
  this.onRestored=()=>{this.lost=false};
  this.canvas.addEventListener('webglcontextlost',this.onLost);
  this.canvas.addEventListener('webglcontextrestored',this.onRestored);
  this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,alpha:false,antialias:quality!=='low',powerPreference:'low-power',preserveDrawingBuffer:false});
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.NoToneMapping;
  this.renderer.setClearColor(0x020407,1);
  this.material=new THREE.ShaderMaterial({vertexShader,fragmentShader,depthTest:false,depthWrite:false,uniforms:{
   uResolution:{value:new THREE.Vector2(640,300)},uGaze:{value:new THREE.Vector2()},
   uVelocity:{value:new THREE.Vector2()},uOrientation:{value:new THREE.Vector2()},
   uTime:{value:0},uProximity:{value:1},uValence:{value:0},uArousal:{value:0},
   uBlink:{value:0},uAsymmetry:{value:0},uWink:{value:0},uTilt:{value:0},
   uBounce:{value:0},uStretch:{value:0},uEmission:{value:1},uBloom:{value:.45},
   uMaterial:{value:0}
  }});
  this.mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material);
  this.mesh.frustumCulled=false;
  this.scene.add(this.mesh);
  this.host.append(this.canvas);
  this.configurePostprocessing();
  this.resize();
  if(typeof ResizeObserver!=='undefined'){this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host)}
  window.addEventListener('resize',this.resize);
 }
 private configurePostprocessing(){
  this.composer?.dispose();this.composer=undefined;this.bloomPass=undefined;
  if(!this.ultra||!qualityProfiles[this.quality].postprocessing)return;
  const w=Math.max(1,this.host.clientWidth),h=Math.max(1,this.host.clientHeight);
  const composer=new EffectComposer(this.renderer);
  composer.addPass(new RenderPass(this.scene,this.camera));
  this.bloomPass=new UnrealBloomPass(new THREE.Vector2(w,h),.28,.35,.87);
  composer.addPass(this.bloomPass);
  composer.addPass(new OutputPass());
  this.composer=composer;
 }
 private resize=()=>{
  const w=Math.max(1,this.host.clientWidth),h=Math.max(1,this.host.clientHeight);
  const dpr=Math.min(window.devicePixelRatio||1,qualityProfiles[this.quality].maxDpr);
  this.renderer.setPixelRatio(dpr);
  this.renderer.setSize(w,h,false);
  this.composer?.setPixelRatio(dpr);this.composer?.setSize(w,h);
  this.renderer.getDrawingBufferSize(this.material.uniforms.uResolution.value as THREE.Vector2);
 };
 setQuality(value:Quality,ultra:boolean){
  this.quality=value;this.ultra=ultra;this.configurePostprocessing();this.resize();
 }
 render(frame:RenderFrame,options:{material:EyeMaterial;emission:number;bloom:number}){
  if(this.lost)return;
  const u=this.material.uniforms;
  u.uGaze.value.set(frame.x,frame.y);
  u.uVelocity.value.set(frame.velocityX,frame.velocityY);
  u.uOrientation.value.set(frame.orientationX,frame.orientationY);
  u.uTime.value=frame.time;
  u.uProximity.value=frame.scale??1;
  u.uValence.value=frame.valence;
  u.uArousal.value=frame.arousal;
  u.uBlink.value=frame.blink;
  u.uAsymmetry.value=frame.asymmetry;
  u.uWink.value=frame.wink??0;
  u.uTilt.value=frame.tilt??0;
  u.uBounce.value=frame.bounce??0;
  u.uStretch.value=frame.stretch;
  u.uEmission.value=options.emission+frame.emissionPulse;
  u.uBloom.value=options.bloom;
  u.uMaterial.value=options.material==='glass'?1:0;
  if(this.bloomPass)this.bloomPass.strength=options.bloom*.65;
  if(this.composer)this.composer.render();else this.renderer.render(this.scene,this.camera);
 }
 dispose(){
  this.resizeObserver?.disconnect();
  window.removeEventListener('resize',this.resize);
  this.canvas.removeEventListener('webglcontextlost',this.onLost);
  this.canvas.removeEventListener('webglcontextrestored',this.onRestored);
  this.composer?.dispose();
  this.mesh.geometry.dispose();this.material.dispose();this.renderer.dispose();
  this.canvas.remove();
 }
}
