import {GroupAttention,MouthMotion} from './group-attention';
import {ListeningGesture} from './listening';
import {AcousticPerception} from './audio';
import {FaceDetector,FilesetResolver} from '@mediapipe/tasks-vision';
import {AnimationCompositor} from './rendering/animation-compositor';
import {RendererManager} from './rendering/renderer-manager';
import type {RendererMode,Quality,EyeMaterial} from './rendering/types';
import {Tracker,Attention,presets,eyeSVG,smooth,clamp,gazeResponse,GazeSpring,GazeMemory,proximityScale,EmoteEngine,type Target,type Eyes} from './core';
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const tracker=new Tracker(),attention=new GroupAttention(),memory=new GazeMemory(),emotes=new EmoteEngine();let targets:Target[]=[], stream:MediaStream|undefined, detector:FaceDetector|undefined, generation=0, sim=false, orientation=false, ox=0,oy=0, message='Manual mode', lastDetect=0,lastVideo=-1;
const acoustic=new AcousticPerception(), listeningGesture=new ListeningGesture();
el('audio').onclick=async()=>{try{if(acoustic.active)acoustic.stop();else await acoustic.start();}catch(err){message=String(err)}};
const mouth=new MouthMotion();const patch=document.createElement('canvas');patch.width=8;patch.height=8;const ctx=patch.getContext('2d',{willReadFrequently:true});
const video=document.createElement('video');video.muted=true;video.playsInline=true;
const select=el<HTMLSelectElement>('preset');for(const p of Object.keys(presets))select.add(new Option(p,p));
function orient(e:DeviceOrientationEvent){ox=clamp((e.gamma??0)/45);oy=clamp(((e.beta??0)-45)/45)}
function stop(keepAudio=false){if(!keepAudio){acoustic.stop();listeningGesture.reset();}generation++;sim=false;stream?.getTracks().forEach(t=>t.stop());stream=undefined;video.srcObject=null;detector?.close();detector=undefined;window.removeEventListener('deviceorientation',orient);orientation=false;ox=oy=0;targets=[];tracker.targets=[];attention.reset();mouth.reset();memory.reset();emotes.reset();presenceSince=missingSince=0;engaged=false;held=undefined;intention='resting';intentX=intentY=0;lastVideo=-1;message='Sensors stopped';}
el('stop').onclick=()=>stop();window.addEventListener('pagehide',()=>stop());
el('camera').onclick=async()=>{const preserveOrientation=orientation;stop(true);if(preserveOrientation){window.addEventListener('deviceorientation',orient);orientation=true}const token=generation;try{if(!navigator.mediaDevices)throw Error('Camera requires HTTPS or localhost');const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960},...({resizeMode:{ideal:'none'}} as MediaTrackConstraints)},audio:false});if(token!==generation){s.getTracks().forEach(t=>t.stop());return}stream=s;const track=s.getVideoTracks()[0];let cameraMode='native FOV';try{const caps=track.getCapabilities?.() as (MediaTrackCapabilities & {zoom?:{min:number}})|undefined;if(caps?.zoom&&Number.isFinite(caps.zoom.min)){await track.applyConstraints({advanced:[{zoom:caps.zoom.min} as MediaTrackConstraintSet]});cameraMode='minimum zoom'}}catch{cameraMode='default FOV'}if(token!==generation){s.getTracks().forEach(t=>t.stop());return}video.srcObject=s;await video.play();const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm');const d=await FaceDetector.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite'},runningMode:'VIDEO',minDetectionConfidence:.45});if(token!==generation){d.close();return}detector=d;lastVideo=-1;message='Camera active | '+cameraMode+' | '+video.videoWidth+'×'+video.videoHeight;}catch(e){if(token===generation){stop();message=String(e)}}};
el('motion').onclick=async()=>{try{const D=DeviceOrientationEvent as typeof DeviceOrientationEvent & {requestPermission?:()=>Promise<string>};if(D.requestPermission&&await D.requestPermission()!=='granted')throw Error('Motion permission denied');window.addEventListener('deviceorientation',orient);orientation=true;message='Orientation enabled';}catch(e){message=String(e)}};
el('sim').onclick=()=>{const enable=!sim;stop();sim=enable;message=sim?'Two-person simulation':'Manual mode'};
let presenceSince=0,missingSince=0,engaged=false,held:Target|undefined, intention='resting', intentX=0,intentY=0;
const gazeX=new GazeSpring(),gazeY=new GazeSpring(),compositor=new AnimationCompositor();
let last=performance.now(),e:Eyes={x:0,y:0,valence:0,arousal:0,blink:0,asymmetry:0};
el('snapshot').onclick=()=>{const blob=new Blob([eyeSVG(e)],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`affective-eye-${select.value}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function frame(now:number){const dt=Math.min(.1,(now-last)/1000);last=now;if(detector&&video.readyState>=2&&now-lastDetect>80&&video.currentTime!==lastVideo){lastDetect=now;lastVideo=video.currentTime;try{targets=tracker.update(detector.detectForVideo(video,now).detections.flatMap(d=>{const b=d.boundingBox;if(!b)return [];return [{x:clamp(1-2*(b.originX+b.width/2)/video.videoWidth),y:clamp(2*(b.originY+b.height/2)/video.videoHeight-1),size:b.width/video.videoWidth}]}),now);
if(ctx){mouth.prune(targets.map(t=>t.id));for(const t of targets){const w=t.size*video.videoWidth,h=w*.85;const x=(1-t.x)*video.videoWidth/2,y=(1+t.y)*video.videoHeight/2;ctx.drawImage(video,x-w*.27,y-h*.12,w*.54,h*.48,0,0,8,8);const data=ctx.getImageData(0,0,8,8).data;mouth.update(t.id,Float32Array.from({length:64},(_,i)=>.299*data[i*4]+.587*data[i*4+1]+.114*data[i*4+2]));}}
}catch(err){stop();message=String(err)}}if(sim)targets=[{id:1,x:-.7,y:Math.sin(now/800)*.2,size:.24+.15*Math.sin(now/1600),seen:now},{id:2,x:.7,y:0,size:.12,seen:now}];const fresh=targets.filter(t=>now-t.seen<450);
const sound=acoustic.sample(dt,now);const gesture=listeningGesture.update(sound,now,dt);
const visible=attention.choose(fresh,sound,mouth.scores,now,dt);
if(visible){missingSince=0;if(!presenceSince)presenceSince=now;if(engaged||now-presenceSince>450){engaged=true;held=visible;}}
else{presenceSince=0;if(!missingSince)missingSince=now;}
const absent=missingSince?now-missingSince:0;
if(absent>9000)engaged=false;
intention=visible&&engaged?'engaged':engaged&&absent<2500?'remembering':engaged&&absent<6500?'searching':engaged?'settling':'resting';
const t=visible&&engaged?visible:engaged?held:undefined;const base=presets[select.value];const auto=el<HTMLInputElement>('auto-emotes').checked;const em=emotes.update(engaged?held:undefined,now);const w=auto&&intention==='engaged'&&!gesture.active?em.weight*.65:0;const p={valence:base.valence+(em.valence-base.valence)*w,arousal:base.arousal+(em.arousal-base.arousal)*w,asymmetry:base.asymmetry+(em.asymmetry-base.asymmetry)*w};const search=intention==='searching'?Math.sin((absent-2500)/1800)*.12:0;const fade=intention==='settling'?clamp(1-(absent-6500)/2500,0,1):1;const listening=!visible&&gesture.active; if(listening)intention='listening';const gx=t?t.x*fade+search:detector||acoustic.active?0:+el<HTMLInputElement>('x').value;const fusedX=listening&&sound.directional?gx+(sound.pan-gx)*sound.activity*.7:gx;const gy=t?t.y*fade:detector?0:+el<HTMLInputElement>('y').value;intentX=smooth(intentX,gazeResponse(clamp(fusedX-ox*.3)),dt,gesture.active?8:3.2);intentY=smooth(intentY,gazeResponse(clamp(gy-oy*.3)),dt,3.2);e={wink:smooth(e.wink??0,w?em.wink:0,dt,5),tilt:smooth(e.tilt??0,gesture.active?gesture.tilt:w?em.tilt:intention==='searching'?4:0,dt,gesture.active?10:2),bounce:smooth(e.bounce??0,w?em.bounce:0,dt,3),scale:smooth(e.scale??1,t?1+(proximityScale(t.size)-1)*fade:1,dt,1.5),x:gazeX.step(intentX,dt),y:gazeY.step(intentY,dt),valence:smooth(e.valence,p.valence,dt,1.8),arousal:smooth(e.arousal,p.arousal+gesture.arousal+(auto&&intention==='searching'?.18:auto&&intention==='resting'&&detector?-.22:0),dt,gesture.active?9:1.8),asymmetry:smooth(e.asymmetry,p.asymmetry,dt,2),blink:now%4800<220?Math.sin(Math.PI*(now%4800)/220):0};renderer.render(compositor.compose(e,{time:now/1000,dt,velocityX:gazeX.velocity,velocityY:gazeY.velocity,orientationX:ox,orientationY:oy}));el('status').textContent=`${message}\nTargets: ${targets.length} | Active: ${t?.id??'none'}${t&&!visible?' (last seen)':''} | Orientation: ${orientation?'on':'off'} | Camera: ${stream?.active?'on':'off'} | Simulation: ${sim?'on':'off'}\nGaze: ${e.x.toFixed(2)}, ${e.y.toFixed(2)} | Audio: ${acoustic.active?(sound.directional?'stereo estimate':'mono/non-directional'):'off'} ${(sound.activity*100).toFixed(0)}% | Listening: ${gesture.active?'engaged':'idle'} | Intention: ${intention} | Renderer: ${renderer.activeMode} | Emote: ${auto?(em.name??'idle'):'off'} | Eye scale: ${(e.scale??1).toFixed(2)} | Face width: ${t?(100*t.size).toFixed(1)+'%':'—'}`;requestAnimationFrame(frame)}requestAnimationFrame(frame);

const stage=el('eyes'),controls=el('controls'),hint=el('hint');
const renderer=new RendererManager(stage,(mode)=>{stage.dataset.renderer=mode});
const modeSelect=el<HTMLSelectElement>('render-mode');
const qualitySelect=el<HTMLSelectElement>('quality');
const materialSelect=el<HTMLSelectElement>('material');
const emissionSlider=el<HTMLInputElement>('emission');
const bloomSlider=el<HTMLInputElement>('bloom');
function updateRenderer(){
 renderer.setOptions({
   mode:modeSelect.value as RendererMode,
   quality:qualitySelect.value as Quality,
   material:materialSelect.value as EyeMaterial,
   emission:Number(emissionSlider.value),
   bloom:Number(bloomSlider.value)
 });
}
for(const control of [modeSelect,qualitySelect,materialSelect,emissionSlider,bloomSlider]){
 control.addEventListener('change',updateRenderer);
 if(control instanceof HTMLInputElement)control.addEventListener('input',updateRenderer);
}
updateRenderer();
window.addEventListener('pagehide',()=>renderer.dispose());

function showControls(show:boolean){controls.hidden=!show;stage.setAttribute('aria-expanded',String(show));hint.hidden=true;if(show)el('close-ui').focus({preventScroll:true});else stage.focus({preventScroll:true})}
stage.addEventListener('click',()=>showControls(controls.hidden));
stage.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();showControls(controls.hidden)}});
el('close-ui').onclick=()=>showControls(false);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!controls.hidden)showControls(false)});
setTimeout(()=>{hint.hidden=true},3500);
const full=el<HTMLButtonElement>('fullscreen');
if(!document.documentElement.requestFullscreen)full.hidden=true;
full.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();showControls(false)}catch{message='Fullscreen unavailable in this browser'}};
document.addEventListener('fullscreenchange',()=>{full.textContent=document.fullscreenElement?'Exit fullscreen':'Enter fullscreen'});
