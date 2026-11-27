/// <reference lib="webworker" />
import {FaceLandmarker,FilesetResolver} from '@mediapipe/tasks-vision';
import {parseFace} from '../perception/vision/face-signals';
let landmarker:FaceLandmarker|undefined;
const scope:DedicatedWorkerGlobalScope=self as DedicatedWorkerGlobalScope;
scope.onmessage=async e=>{
 try{
  if(e.data.type==='init'){
   const wasm=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm');
   landmarker=await FaceLandmarker.createFromOptions(wasm,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:'CPU'},runningMode:'IMAGE',numFaces:4,outputFaceBlendshapes:true});
   scope.postMessage({type:'ready'});
  }else if(e.data.type==='frame'){
   const bitmap=e.data.bitmap as ImageBitmap;
   try{
    if(!landmarker)throw Error('Worker not initialized');
    const out=landmarker.detect(bitmap);
    const signals=out.faceLandmarks.flatMap((points,i)=>{const s=parseFace(points,out.faceBlendshapes[i]?.categories??[]);return s?[s]:[]});
    scope.postMessage({type:'result',timestamp:e.data.timestamp,signals});
   }finally{bitmap.close()}
  }
 }catch(error){scope.postMessage({type:'error',message:String(error)})}
};
