import {clamp,smooth} from '../core';
import type {Intention} from '../behavior/intention';
export type AnimationInput={intention:Intention;gazeChanged:boolean;hand?:string;time:number;dt:number;listeningTilt:number;listeningArousal:number};
export class AnimationDirector{
 private blink=0;private blinkStart=-Infinity;private winkStart=-Infinity;private lastGaze=-Infinity;
 private gesture='';private bounce=0;
 step(input:AnimationInput){
  const now=input.time,dt=clamp(input.dt,0,.1);
  if(input.gazeChanged&&now-this.lastGaze>600){this.lastGaze=now;this.blinkStart=now}
  if(now-this.blinkStart>4300){this.blinkStart=now}
  if(input.hand==='Open_Palm'&&now-this.winkStart>4500)this.winkStart=now;
  const elapsed=now-this.blinkStart;
  this.blink=elapsed>=0&&elapsed<210?Math.sin(Math.PI*elapsed/210):0;
  const ack=now-this.winkStart;
  const wink=ack>=0&&ack<700?Math.sin(Math.PI*ack/700):0;
  const targetBounce=input.hand==='Thumb_Up'? -4 :input.intention==='acknowledging'?-3:0;
  this.bounce=smooth(this.bounce,targetBounce,dt,3);
  this.gesture=wink>0?'wave-acknowledgment':input.intention;
  return {blink:this.blink,wink,tilt:input.listeningTilt,bounce:this.bounce,arousal:input.listeningArousal,gesture:this.gesture};
 }
 reset(){this.blink=0;this.blinkStart=-Infinity;this.winkStart=-Infinity;this.lastGaze=-Infinity;this.gesture='';this.bounce=0}
}
