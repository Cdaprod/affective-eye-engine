import {FaceLandmarker,FaceDetector,FilesetResolver} from '@mediapipe/tasks-vision';
import type {FaceSignal} from './face-signals';
import {parseFace} from './face-signals';
import type {Detection} from '../../core';
const WASM='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm';
const LANDMARK_MODEL='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const DETECTOR_MODEL='https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite';
export type VisionSnapshot={detections:Detection[];signals:FaceSignal[];capturedAt:number;mode:'worker-landmarks'|'landmarks'|'detector'|'idle'};
export class VisionPipeline {
 private worker?:Worker;private landmarker?:FaceLandmarker;private detector?:FaceDetector;
 private pending=false;private closed=false;private token=0;private lastRequest=-Infinity;
 private last:VisionSnapshot={detections:[],signals:[],capturedAt:0,mode:'idle'};
 get snapshot(){return this.last}
 async start(){
  this.closed=false;const token=++this.token;
  if(typeof Worker!=='undefined'&&typeof createImageBitmap==='function'){
   try{
    const worker=new Worker(new URL('../../workers/vision.worker.ts',import.meta.url),{type:'module'});
    this.worker=worker;
    const ready=await new Promise<boolean>(resolve=>{
     const timeout=setTimeout(()=>resolve(false),6500);
     worker.onmessage=e=>{
      if(e.data.type==='ready'){clearTimeout(timeout);resolve(true)}
      if(e.data.type==='error'){clearTimeout(timeout);resolve(false)}
     };
     worker.onerror=()=>{clearTimeout(timeout);resolve(false)};
     worker.postMessage({type:'init'});
    });
    if(this.closed||token!==this.token){worker.terminate();return}
    if(ready){
     worker.onmessage=e=>{
      if(e.data.type==='result'){this.pending=false;this.last={detections:e.data.signals,signals:e.data.signals,capturedAt:e.data.timestamp,mode:'worker-landmarks'}}
      if(e.data.type==='error'){this.worker?.terminate();this.worker=undefined;this.pending=false;void this.initFallback(token)}
     };return;
    }
    worker.terminate();this.worker=undefined;
   }catch{this.worker?.terminate();this.worker=undefined}
  }
  await this.initFallback(token);
 }
 private async initFallback(token:number){
  const fs=await FilesetResolver.forVisionTasks(WASM);
  if(this.closed||token!==this.token)return;
  try{
   const model=await FaceLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:LANDMARK_MODEL,delegate:'CPU'},runningMode:'VIDEO',numFaces:4,outputFaceBlendshapes:true});
   if(this.closed||token!==this.token){model.close();return}this.landmarker=model;
  }catch{
   const model=await FaceDetector.createFromOptions(fs,{baseOptions:{modelAssetPath:DETECTOR_MODEL},runningMode:'VIDEO',minDetectionConfidence:.45});
   if(this.closed||token!==this.token){model.close();return}this.detector=model;
  }
 }
 sample(video:HTMLVideoElement,now:number){
  if(this.closed||video.readyState<2||now-this.lastRequest<100||this.pending)return this.last;
  this.lastRequest=now;
  if(this.worker){
   this.pending=true;
   void createImageBitmap(video).then(bitmap=>{
    if(this.closed||!this.worker){bitmap.close();this.pending=false;return}
    this.worker.postMessage({type:'frame',bitmap,timestamp:now},[bitmap]);
   }).catch(()=>{this.pending=false});
   return this.last;
  }
  if(this.landmarker){
   const out=this.landmarker.detectForVideo(video,now);
   const signals=out.faceLandmarks.flatMap((points,i)=>{
    const signal=parseFace(points,out.faceBlendshapes[i]?.categories??[]);
    return signal?[signal]:[];
   });
   this.last={signals,detections:signals,capturedAt:now,mode:'landmarks'};
  }else if(this.detector){
   const detections=this.detector.detectForVideo(video,now).detections.flatMap(d=>{
    const b=d.boundingBox;if(!b)return [];
    return [{x:1-2*(b.originX+b.width/2)/video.videoWidth,y:2*(b.originY+b.height/2)/video.videoHeight-1,size:b.width/video.videoWidth}];
   });
   this.last={detections,signals:[],capturedAt:now,mode:'detector'};
  }
  return this.last;
 }
 close(){this.closed=true;this.token++;this.worker?.terminate();this.worker=undefined;this.landmarker?.close();this.landmarker=undefined;this.detector?.close();this.detector=undefined;this.pending=false;this.last={detections:[],signals:[],capturedAt:0,mode:'idle'}}
}
