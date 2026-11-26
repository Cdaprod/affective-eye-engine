import {clamp,smooth} from './core';
export class ListeningGesture {
 private since=-1;private quiet=-1;private started=-1;private side=1;private tilt=0;private arousal=0;private active=false;
 update(sound:{activity:number;pan:number;directional:boolean},now:number,dt:number){
  if(sound.activity>.24){this.quiet=-1;if(this.since<0)this.since=now;if(!this.active&&now-this.since>=250){this.active=true;this.started=now;this.side=sound.directional&&Math.abs(sound.pan)>.12?Math.sign(sound.pan):1}}
  else if(sound.activity<.12){this.since=-1;if(this.quiet<0)this.quiet=now;if(now-this.quiet>=1800)this.active=false}
  else if(!this.active)this.since=-1;
  const age=Math.max(0,now-this.started);
  const target=this.active?this.side*(4+5*Math.exp(-age/2200)):0;
  this.tilt=smooth(this.tilt,target,clamp(dt,0,.1),this.active?2.5:1.2);
  this.arousal=smooth(this.arousal,this.active?.12+.12*Math.exp(-age/1800):0,clamp(dt,0,.1),2);
  return {active:this.active,tilt:this.tilt,arousal:this.arousal};
 }
 reset(){this.since=this.quiet=this.started=-1;this.active=false;this.tilt=this.arousal=0}
}
