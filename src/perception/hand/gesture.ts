import {GestureRecognizer,FilesetResolver} from '@mediapipe/tasks-vision';
export type HandGesture={name:string;score:number;timestamp:number};
export class HandPerception {
 private recognizer?:GestureRecognizer;private last=0;private current?:HandGesture;
 get observation(){return this.current}
 async start(){
  const fs=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm');
  this.recognizer=await GestureRecognizer.createFromOptions(fs,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'},runningMode:'VIDEO',numHands:2});
 }
 sample(video:HTMLVideoElement,now:number){
  if(!this.recognizer||video.readyState<2||now-this.last<260)return this.current;
  this.last=now;const recognized=this.recognizer.recognizeForVideo(video,now).gestures.flat().sort((a,b)=>b.score-a.score)[0];
  this.current=recognized&&recognized.score>.55&&recognized.categoryName!=='None'?{name:recognized.categoryName,score:recognized.score,timestamp:now}:undefined;
  return this.current;
 }
 close(){this.recognizer?.close();this.recognizer=undefined;this.current=undefined;this.last=0}
}
