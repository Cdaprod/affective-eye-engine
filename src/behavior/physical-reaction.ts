import {clamp,smooth} from '../core';
export class PhysicalReaction {
 private x=0;private y=0;private vx=0;private vy=0;private ax=0;private ay=0;private energy=0;private frustration=0;private at=-Infinity;private recovery=-Infinity;private cooldown=-Infinity;
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
  for(let i=0;i<4;i++){const h=dt/4;this.vx+=(-55*this.x-8*this.vx-(fresh?this.ax:0)*32)*h;this.vy+=(-55*this.y-8*this.vy+(fresh?this.ay:0)*32)*h;this.x=clamp(this.x+this.vx*h,-.65,.65);this.y=clamp(this.y+this.vy*h,-.65,.65)}
  return {x:clamp(this.x+shake*.25,-.8,.8),y:this.y,tilt:clamp(this.x*16+shake*18,-24,24),frustration:this.frustration,weight:clamp(Math.max(energy*.65,this.frustration,recovering?1:0),0,1),recovering};
 }
 reset(){this.x=this.y=this.vx=this.vy=this.ax=this.ay=this.energy=this.frustration=0;this.at=this.recovery=this.cooldown=-Infinity}
}
