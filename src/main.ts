import {PhysicalReaction} from './behavior/physical-reaction';
import {VisionPipeline} from './perception/vision/vision-pipeline';
import {correlateFaces,type FaceSignal} from './perception/vision/face-signals';
import {HandPerception} from './perception/hand/gesture';
import {VoiceActivity} from './perception/audio/voice-activity';
import {SpeakerEvidence} from './perception/fusion/speaker-attention';
import {PersonalityEngine} from './behavior/personality';
import {IntentionEngine} from './behavior/intention';
import {AnimationDirector} from './animation/director';
import {SemanticEvents} from './integrations/semantic-events';
import {GroupAttention,MouthMotion} from './group-attention';
import {ListeningGesture} from './listening';
import {AcousticPerception} from './audio';
import {AnimationCompositor} from './rendering/animation-compositor';
import {RendererManager} from './rendering/renderer-manager';
import type {RendererMode,Quality,EyeMaterial} from './rendering/types';
import {Tracker,presets,eyeSVG,smooth,clamp,gazeResponse,GazeSpring,proximityScale,EmoteEngine,type Target,type Eyes} from './core';
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const video=document.createElement('video');video.muted=true;video.playsInline=true;
const tracker=new Tracker(),attention=new GroupAttention(),emotes=new EmoteEngine();
const vision=new VisionPipeline(),hands=new HandPerception(),audio=new AcousticPerception(),voice=new VoiceActivity();
const gestures=new ListeningGesture(),speaker=new SpeakerEvidence(),personality=new PersonalityEngine(),intentions=new IntentionEngine(),director=new AnimationDirector(),semantic=new SemanticEvents();
const mouth=new MouthMotion(),patch=document.createElement('canvas');patch.width=8;patch.height=8;
const ctx=patch.getContext('2d',{willReadFrequently:true});
const faceSignals=new Map<number,FaceSignal>();
let targets:Target[]=[],stream:MediaStream|undefined,generation=0,orientation=false,ox=0,oy=0,sim=false,handsOn=false;
let lastVision=-1,lastDetect=-Infinity,message='Manual mode',presenceSince=0,missingSince=0,engaged=false,held:Target|undefined,previousFocus:number|null=null;
let intention='resting',intentX=0,intentY=0,qualityFps=60;
const select=el<HTMLSelectElement>('preset');for(const name of Object.keys(presets))select.add(new Option(name,name));
const physical=new PhysicalReaction();let lastMotion=-Infinity,lastPose:{beta:number;gamma:number;at:number}|undefined;
function deviceMotion(ev:DeviceMotionEvent){
 const a=ev.acceleration,r=ev.rotationRate;if(!a||a.x===null||a.y===null)return;
 const angle=(screen.orientation?.angle??Number((window as Window & {orientation?:number}).orientation??0))*Math.PI/180;
 physical.ingest(a.x*Math.cos(angle)+a.y*Math.sin(angle),-a.x*Math.sin(angle)+a.y*Math.cos(angle),Math.hypot(r?.alpha??0,r?.beta??0,r?.gamma??0),performance.now());lastMotion=performance.now();
}
function orient(ev:DeviceOrientationEvent){ox=clamp((ev.gamma??0)/45);oy=clamp(((ev.beta??0)-45)/45);const now=performance.now();if(ev.beta===null||ev.gamma===null)return;const prev=lastPose;lastPose={beta:ev.beta,gamma:ev.gamma,at:now};if(prev&&now-lastMotion>200&&now-prev.at>0&&now-prev.at<200){const delta=(a:number,b:number)=>((a-b+540)%360)-180;const rate=1000/(now-prev.at);const x=delta(ev.gamma,prev.gamma)*rate,y=delta(ev.beta,prev.beta)*rate;physical.ingest(x*.045,y*.045,Math.hypot(x,y),now)}}
function stop(keepAudio=false){
 generation++;sim=false;stream?.getTracks().forEach(t=>t.stop());stream=undefined;video.pause();video.srcObject=null;vision.close();hands.close();handsOn=false;
 if(!keepAudio){voice.stop();audio.stop();gestures.reset()}
 window.removeEventListener('deviceorientation',orient);window.removeEventListener('devicemotion',deviceMotion);physical.reset();lastPose=undefined;lastMotion=-Infinity;orientation=false;ox=oy=0;
 targets=[];tracker.targets=[];attention.reset();mouth.reset();speaker.clear();emotes.reset();personality.reset();intentions.reset();director.reset();faceSignals.clear();
 presenceSince=missingSince=0;engaged=false;held=undefined;previousFocus=null;intentX=intentY=0;lastVision=-1;lastDetect=-Infinity;message='Sensors stopped';
}
el('stop').onclick=()=>stop();
window.addEventListener('pagehide',()=>{stop();semantic.stop();renderer.dispose()});
el('audio').onclick=async()=>{
 if(audio.active){voice.stop();audio.stop();gestures.reset();message='Microphone off';return}
 try{await audio.start();const s=audio.mediaStream;if(s){message='Microphone active; initializing neural voice detection';void voice.start(s).then(()=>{message=voice.enabled?'Neural voice detection active':'Acoustic fallback active'}).catch(()=>{message='Acoustic fallback active'})}}
 catch(err){message=String(err)}
};
el('camera').onclick=async()=>{
 const keepOrientation=orientation;stop(true);
 if(keepOrientation){window.addEventListener('deviceorientation',orient);window.addEventListener('devicemotion',deviceMotion);orientation=true}
 const token=generation;
 try{
  if(!navigator.mediaDevices)throw Error('Camera needs HTTPS or localhost');
  const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});
  if(token!==generation){s.getTracks().forEach(t=>t.stop());return}
  stream=s;
  const track=s.getVideoTracks()[0];try{const caps=track.getCapabilities?.() as MediaTrackCapabilities & {zoom?:{min:number}};if(caps?.zoom)await track.applyConstraints({advanced:[{zoom:caps.zoom.min} as MediaTrackConstraintSet]})}catch{}
  video.srcObject=s;await video.play();
  if(token!==generation)return;
  message='Camera initializing: facial landmarks / worker / detector fallback';
  await vision.start();
  if(token===generation)message='Camera active · '+video.videoWidth+'×'+video.videoHeight+' · '+vision.snapshot.mode;
 }catch(err){if(token===generation){stop(true);message='Camera error: '+String(err)}}
};
el('gestures').onclick=async()=>{
 if(handsOn){hands.close();handsOn=false;message='Hand gestures disabled';return}
 if(!stream?.active){message='Enable camera before gestures';return}
 const token=generation;try{await hands.start();if(token!==generation){hands.close();return}handsOn=true;message='Hand gestures enabled'}catch(err){message='Hand gestures unavailable: '+String(err)}
};
el('motion').onclick=async()=>{try{const D=DeviceOrientationEvent as typeof DeviceOrientationEvent & {requestPermission?:()=>Promise<string>};const M=window.DeviceMotionEvent as typeof DeviceMotionEvent & {requestPermission?:()=>Promise<string>};const permissions=await Promise.all([D?.requestPermission?.()??Promise.resolve('granted'),M?.requestPermission?.()??Promise.resolve('granted')]);if(permissions.every(p=>p!=='granted'))throw Error('Motion permission denied');window.addEventListener('deviceorientation',orient);window.addEventListener('devicemotion',deviceMotion);orientation=true;message='Physical interaction enabled'}catch(err){message=String(err)}};
el('sim').onclick=()=>{const enable=!sim;stop();sim=enable;message=sim?'Three-person simulation':'Manual mode'};
const gazeX=new GazeSpring(),gazeY=new GazeSpring(),compositor=new AnimationCompositor();
let last=performance.now(),eyes:Eyes={x:0,y:0,valence:0,arousal:0,blink:0,asymmetry:0};
el('snapshot').onclick=()=>{const blob=new Blob([eyeSVG(eyes)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='affective-eye-'+select.value+'.svg';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
const stage=el('eyes'),controls=el('controls'),hint=el('hint');
const renderer=new RendererManager(stage,mode=>{stage.dataset.renderer=mode});
const renderMode=el<HTMLSelectElement>('render-mode'),quality=el<HTMLSelectElement>('quality'),material=el<HTMLSelectElement>('material');
const emission=el<HTMLInputElement>('emission'),bloom=el<HTMLInputElement>('bloom');
function updateRenderer(){renderer.setOptions({mode:renderMode.value as RendererMode,quality:quality.value as Quality,material:material.value as EyeMaterial,emission:Number(emission.value),bloom:Number(bloom.value)})}
for(const input of [renderMode,quality,material,emission,bloom]){input.addEventListener('change',updateRenderer);if(input instanceof HTMLInputElement)input.addEventListener('input',updateRenderer)}
updateRenderer();semantic.start();
function showControls(show:boolean){controls.hidden=!show;stage.setAttribute('aria-expanded',String(show));hint.hidden=true;if(show)el('close-ui').focus({preventScroll:true});else stage.focus({preventScroll:true})}
stage.addEventListener('click',()=>showControls(controls.hidden));
stage.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();showControls(controls.hidden)}});
el('close-ui').onclick=()=>showControls(false);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!controls.hidden)showControls(false)});
setTimeout(()=>{hint.hidden=true},3500);
const full=el<HTMLButtonElement>('fullscreen');if(!document.documentElement.requestFullscreen)full.hidden=true;
full.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();showControls(false)}catch{message='Fullscreen unavailable in this browser'}};
document.addEventListener('fullscreenchange',()=>{full.textContent=document.fullscreenElement?'Exit fullscreen':'Enter fullscreen'});
function frame(now:number){
 const dt=Math.min(.1,Math.max(.001,(now-last)/1000));last=now;qualityFps=smooth(qualityFps,Math.min(120,1/dt),dt,1);
 if(stream?.active&&video.readyState>=2){
  try{
   const snapshot=vision.sample(video,now);
   if(snapshot.capturedAt>lastVision){
    lastVision=snapshot.capturedAt;lastDetect=now;
    targets=tracker.update(snapshot.detections,now);
    faceSignals.clear();
    const matched=correlateFaces(targets,snapshot.signals);
    for(let i=0;i<targets.length;i++){const signal=matched.get(i);if(signal)faceSignals.set(targets[i].id,signal)}
    if(snapshot.mode==='detector'&&ctx){
     mouth.prune(targets.map(t=>t.id));
     for(const t of targets){
      const w=t.size*video.videoWidth,h=w*.85,x=(1-t.x)*video.videoWidth/2,y=(1+t.y)*video.videoHeight/2;
      ctx.drawImage(video,x-w*.27,y-h*.12,w*.54,h*.48,0,0,8,8);
      const data=ctx.getImageData(0,0,8,8).data;
      mouth.update(t.id,Float32Array.from({length:64},(_,i)=>.299*data[i*4]+.587*data[i*4+1]+.114*data[i*4+2]));
     }
    }
   }
   if(handsOn)hands.sample(video,now);
  }catch(err){message='Perception fallback: '+String(err)}
 }
 if(sim)targets=[{id:1,x:-.72,y:Math.sin(now/800)*.15,size:.22,seen:now},{id:2,x:0,y:0,size:.29,seen:now},{id:3,x:.72,y:0,size:.18,seen:now}];
 const fresh=targets.filter(t=>now-t.seen<550&&(!stream||now-lastDetect<1250));
 const sound=audio.sample(dt,now),speech=voice.observation(now,sound.activity);
 const acoustic={...sound,activity:voice.enabled?speech.probability:sound.activity};
 const listening=gestures.update(acoustic,now,dt);
 const jaw=new Map<number,number>();for(const [id,signal] of faceSignals)jaw.set(id,signal.jaw);
 if(lastVision>0&&lastDetect===now){const visual=speaker.update(fresh,jaw,speech.probability,now,dt);for(const [id,score] of visual)mouth.scores.set(id,score)}
 const visible=attention.choose(fresh,acoustic,mouth.scores,now,dt);
 if(visible){missingSince=0;if(!presenceSince)presenceSince=now;if(engaged||now-presenceSince>300){engaged=true;held=visible}}
 else{presenceSince=0;if(!missingSince)missingSince=now}
 const absent=missingSince?now-missingSince:0;if(absent>9000){engaged=false;held=undefined}
 const t=visible&&engaged?visible:engaged?held:undefined;
 const observed=visible?faceSignals.get(visible.id):undefined,hand=handsOn?hands.observation:undefined;
 const behavioral=intentions.update(now,fresh.map(t=>t.id),speech.active);
 intention=behavioral;
 const semanticIntent=semantic.current(now);
 if(semanticIntent==='thinking')intention='searching';
 if(semanticIntent==='listening'||semanticIntent==='speaking')intention='listening';
 if(semanticIntent==='acknowledging')intention='acknowledging';
 const personalityState=personality.step({people:fresh.length,smile:observed?.smile??0,brow:observed?.brow??0,voice:speech.probability,gesture:hand?.name},dt);
 const base=presets[select.value],auto=el<HTMLInputElement>('auto-emotes').checked,em=emotes.update(visible,now);
 const reaction=physical.step(now,dt);
 const w=auto&&!listening.active?em.weight*.5*(1-reaction.weight):0;
 const valence=clamp(base.valence+personalityState.valence*.45+(em.valence-base.valence)*w+(semanticIntent==='happy'?.3:0));
 const arousal=clamp(base.arousal+personalityState.arousal*.5+(em.arousal-base.arousal)*w);
 const asymmetry=clamp(base.asymmetry+personalityState.curiosity*.12+(em.asymmetry-base.asymmetry)*w);
 const fade=intention==='searching'?clamp(1-(absent-5000)/1800,0,1):1;
 const gx=t?t.x*fade:stream?.active||audio.active?0:+el<HTMLInputElement>('x').value;
 const gy=t?t.y*fade:stream?.active?0:+el<HTMLInputElement>('y').value;
 const fusedX=!visible&&listening.active&&sound.directional?gx+(sound.pan-gx)*sound.activity*.5:gx;
 intentX=smooth(intentX,gazeResponse(clamp(fusedX-ox*.3)),dt,listening.active?8:3.2);
 intentY=smooth(intentY,gazeResponse(clamp(gy-oy*.3)),dt,3.2);
 const activeChanged=visible?.id!==undefined&&visible.id!==previousFocus;previousFocus=visible?.id??null;
 const motion=director.step({intention:behavioral,gazeChanged:activeChanged,hand:hand?.name,time:now,dt,listeningTilt:listening.tilt,listeningArousal:listening.arousal});
 eyes={
  wink:smooth(eyes.wink??0,Math.max(motion.wink,w?em.wink:0),dt,6),
  tilt:clamp((listening.active?motion.tilt:w?em.tilt:intention==='searching'?3:0)*(1-reaction.weight)+reaction.tilt,-25,25),
  bounce:smooth(eyes.bounce??0,motion.bounce+(w?em.bounce:0),dt,4),
  scale:smooth(eyes.scale??1,t?proximityScale(t.size):1,dt,2),
  x:clamp(gazeX.step(intentX,dt)+reaction.x,-1.12,1.12),y:clamp(gazeY.step(intentY,dt)+reaction.y,-1.12,1.12),
  valence:smooth(eyes.valence,clamp(valence-reaction.frustration*1.5),dt,5),
  arousal:smooth(eyes.arousal,clamp(arousal+motion.arousal-reaction.frustration*.85),dt,4),
  asymmetry:smooth(eyes.asymmetry,asymmetry,dt,2),
  blink:Math.max(motion.blink,reaction.recovering?.25:0)
 };
 renderer.render(compositor.compose(eyes,{time:now/1000,dt,velocityX:gazeX.velocity,velocityY:gazeY.velocity,orientationX:ox,orientationY:oy}));
 el('status').textContent=message+'\nFaces: '+fresh.length+' | Focus: '+(visible?.id??'none')+' | Vision: '+vision.snapshot.mode+' | Audio: '+speech.source+' '+speech.probability.toFixed(2)+' | Gesture: '+(hand?.name??'none')+'\nIntention: '+intention+' | Affect: '+personalityState.valence.toFixed(2)+'/'+personalityState.arousal.toFixed(2)+'/'+personalityState.dominance.toFixed(2)+' | Frustration: '+Math.round(reaction.frustration*100)+'%'+(reaction.recovering?' (shake-off)':'')+' | FPS: '+qualityFps.toFixed(0)+' | Renderer: '+renderer.activeMode;
 requestAnimationFrame(frame)
}
requestAnimationFrame(frame);
