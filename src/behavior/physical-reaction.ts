import {clamp,smooth} from '../core';
export class PhysicalReaction {
 private impacts=0;private x=0;private y=0;private vx=0;private vy=0;private ax=0;private ay=0;private energy=0;private frustration=0;private at=-Infinity;private recovery=-Infinity;private cooldown=-Infinity;
 ingest(x:number,y:number,rotation:number,now:number){
  if(![x,y,rotation,now].every(Number.isFinite))return;
  this.ax=clamp(x/9.81,-2,2);this.ay=clamp(y/9.81,-2,2);
  this.energy=clamp(Math.hypot(x,y)/12+Math.abs(rotation)/240,0,2);this.at=now;
 }
 step(now:number,dt:number){
  dt=clamp(dt,0,.05);const fresh=now-this.at<180;
  const energy=fresh?this.energy:0;
  const drive=Math.max(0,energy-.28);
  this.frustration=clamp(this.frustration+dt*(drive*.55-(drive<.1?.19:.025)),0,1);
  if(this.frustration>.78&&now>this.cooldown){this.recovery=now;this.cooldown=now+3000;this.frustration=.48}
  const age=(now-this.recovery)/1000, recovering=age>=0&&age<.85;
  const shake=recovering?Math.sin(age*Math.PI*8)*Math.sin(Math.PI*age/.85):0;
  const moving=energy>.22;const spring=moving?2:18,drag=moving?1.1:5;
  for(let i=0;i<8;i++){const h=dt/8;this.vx+=(-spring*this.x-drag*this.vx-(fresh?this.ax:0)*65)*h;this.vy+=(-spring*this.y-drag*this.vy+(fresh?this.ay:0)*65)*h;
   this.vx=clamp(this.vx,-12,12);this.vy=clamp(this.vy,-12,12);
   this.x+=this.vx*h;this.y+=this.vy*h;
   if(Math.abs(this.x)>1){this.x=Math.sign(this.x)*(2-Math.abs(this.x));this.vx*=-.72;this.impacts++;this.frustration=clamp(this.frustration+.035,0,1)}
   if(Math.abs(this.y)>1){this.y=Math.sign(this.y)*(2-Math.abs(this.y));this.vy*=-.72;this.impacts++;this.frustration=clamp(this.frustration+.035,0,1)}
  }
  return {x:clamp(this.x+shake*.15),y:this.y,vx:this.vx,vy:this.vy,impacts:this.impacts,tilt:clamp(this.x*16+shake*18,-24,24),frustration:this.frustration,weight:clamp(Math.max(energy*.65,this.frustration,recovering?1:0),0,1),recovering};
 }
 reset(){this.impacts=0;this.x=this.y=this.vx=this.vy=this.ax=this.ay=this.energy=this.frustration=0;this.at=this.recovery=this.cooldown=-Infinity}
}
