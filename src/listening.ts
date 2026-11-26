import {clamp,smooth} from './core';
const ease=(x:number)=>{x=clamp(x,0,1);return x*x*(3-2*x)};
export class ListeningGesture {
 private since=-1;private quiet=-1;private started=-1;private pulse=-1;private side=-1;private arousal=0;private active=false;
 update(sound:{activity:number;pan:number;directional:boolean},now:number,dt:number){
  if(sound.activity>.24){this.quiet=-1;if(this.since<0)this.since=now;if(!this.active&&now-this.since>=100){this.active=true;this.started=now;this.pulse=now;this.side=sound.directional&&Math.abs(sound.pan)>.12?Math.sign(sound.pan):-this.side}}
  else if(sound.activity<.12){this.since=-1;if(this.quiet<0)this.quiet=now;if(now-this.quiet>=1800)this.active=false}
  else if(!this.active)this.since=-1;
  if(this.active&&sound.activity>.24&&now-this.pulse>=1900){this.pulse=now;this.side=-this.side}
  const age=Math.max(0,now-this.pulse);
  const tilt=this.active?this.side*10*(age<120?ease(age/120):age<180?1:age<440?1-ease((age-180)/260):0):0;
  this.arousal=smooth(this.arousal,this.active?.12+.12*Math.exp(-Math.max(0,now-this.started)/1800):0,clamp(dt,0,.1),this.active?12:2);
  return {active:this.active,tilt,arousal:this.arousal};
 }
 reset(){this.since=this.quiet=this.started=this.pulse=-1;this.active=false;this.arousal=0;this.side=-1}
}
