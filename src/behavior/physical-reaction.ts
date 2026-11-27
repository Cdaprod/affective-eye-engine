import {clamp} from '../core';
import {MoodEngine} from './mood';
export class PhysicalReaction {
 readonly mood=new MoodEngine();private armed=true;private impacts=0;private x=0;private y=0;private vx=0;private vy=0;private ax=0;private ay=0;private energy=0;private frustration=0;private at=-Infinity;private recovery=-Infinity;private cooldown=-Infinity;
 ingest(x:number,y:number,rotation:number,now:number,z=0){
  if(![x,y,rotation,now,z].every(Number.isFinite))return;
  const nx=clamp(x/9.81,-2,2),ny=clamp(y/9.81,-2,2);
  const impulseX=nx-this.ax,impulseY=ny-this.ay;
  const jolt=Math.max(Math.hypot(impulseX,impulseY),Math.abs(z)/9.81);
  if(jolt>.18)this.mood.disturb(now,jolt);
  if(Math.hypot(impulseX,impulseY)>.12){this.vx=clamp(this.vx-impulseX*18,-18,18);this.vy=clamp(this.vy+impulseY*18,-18,18)}
  if(Math.abs(z)>3&&Math.hypot(x,y)<2){this.vy=clamp(this.vy+Math.sign(z)*Math.min(8,Math.abs(z)*.6),-18,18)}
  this.ax=nx;this.ay=ny;
  this.energy=clamp(Math.hypot(x,y,z)/7+Math.abs(rotation)/240,0,2);this.at=now;
 }
 step(now:number,dt:number){
  dt=clamp(dt,0,.05);const fresh=now-this.at<180;
  const energy=fresh?this.energy:0;
  const mood=this.mood.step(now,dt);this.frustration=mood.level;
  if(this.frustration<.45)this.armed=true;
  if(this.armed&&mood.quiet&&this.frustration>.78&&now>this.cooldown){this.recovery=now;this.cooldown=now+3000;this.armed=false}
  const age=(now-this.recovery)/1000, recovering=age>=0&&age<.85;
  const shake=recovering?Math.sin(age*Math.PI*8)*Math.sin(Math.PI*age/.85):0;
  const moving=energy>.22;const spring=moving?2:18,drag=moving?1.1:5;
  for(let i=0;i<8;i++){const h=dt/8;this.vx+=(-spring*this.x-drag*this.vx-(fresh?this.ax:0)*65)*h;this.vy+=(-spring*this.y-drag*this.vy+(fresh?this.ay:0)*65)*h;
   this.vx=clamp(this.vx,-18,18);this.vy=clamp(this.vy,-18,18);
   this.x+=this.vx*h;this.y+=this.vy*h;
   if(Math.abs(this.x)>1){this.x=Math.sign(this.x)*(2-Math.abs(this.x));this.vx*=-.72;this.impacts++}
   if(Math.abs(this.y)>1){this.y=Math.sign(this.y)*(2-Math.abs(this.y));this.vy*=-.72;this.impacts++}
  }
  return {x:clamp(this.x+shake*.15),y:this.y,vx:this.vx,vy:this.vy,impacts:this.impacts,tilt:clamp(this.x*16+shake*18,-24,24),frustration:this.frustration,mood,weight:clamp(Math.max(energy*1.5,Math.hypot(this.vx,this.vy)*.25,Math.hypot(this.x,this.y),recovering?1:0),0,1),recovering};
 }
 reset(){this.mood.reset();this.armed=true;this.impacts=0;this.x=this.y=this.vx=this.vy=this.ax=this.ay=this.energy=this.frustration=0;this.at=this.recovery=this.cooldown=-Infinity}
}
