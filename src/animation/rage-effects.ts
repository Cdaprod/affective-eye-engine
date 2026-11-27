import {clamp,type Eyes} from '../core';
export class RageSequence {
 private armed=true;private since=-Infinity;
 preview(now:number){this.armed=false;this.since=now}
 step(now:number,anger:number,disturbance:number){
 if(anger<.35)this.armed=true;
 if(this.armed&&anger>=.82&&disturbance>.18){this.armed=false;this.since=now}
 const age=now-this.since;
 const phase=age<0?'none':age<650?'charge':age<4200?'super':age<6500?'vent':age<8500?'exhausted':'none';
 return {phase,age,steam:phase==='vent'?1:phase==='exhausted'?.2:anger>.5&&disturbance>.18?.85:0};
 }
 reset(){this.armed=true;this.since=-Infinity}
}
export class RageEffects {
 readonly sequence=new RageSequence();private canvas:HTMLCanvasElement;private ctx:CanvasRenderingContext2D|null;
 constructor(host:HTMLElement){this.canvas=document.createElement('canvas');this.canvas.setAttribute('aria-hidden','true');Object.assign(this.canvas.style,{position:'fixed',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'10'});host.insertAdjacentElement('afterend',this.canvas);this.ctx=this.canvas.getContext('2d')}
 draw(now:number,state:ReturnType<RageSequence['step']>,e:Eyes,svg:boolean){const c=this.ctx;if(!c)return state;const w=innerWidth,h=innerHeight;if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}c.clearRect(0,0,w,h);const t=now/1000,scale=e.scale??1,mix=1-(e.physicalWeight??0),a=(Math.abs(e.tilt??0)+Math.abs(Math.min(0,e.valence))*18)*Math.PI/180;
 const ew=Math.min(w*.087,h*.26)*scale,eh=Math.min(h*.17,w*.15)*scale*(1+.45*e.arousal),gap=w*.205;
 const tx=Math.max(0,w/2-((gap+ew)*Math.abs(Math.cos(a))+eh*Math.abs(Math.sin(a)))*1.08-3),ty=Math.max(0,h/2-((gap+ew)*Math.abs(Math.sin(a))+eh*Math.abs(Math.cos(a)))*1.08-3);
 const k=Math.min(w/640,h/300);
 const px=svg?k*((e.physicalX??0)*Math.max(0,190-scale*75)+mix*e.x*105):clamp(mix*e.x*Math.min(w*.115,Math.max(0,(w*.5-gap-ew*1.1)/1.12))+(e.physicalX??0)*tx,-tx,tx);
 const py=svg?k*((e.physicalY??0)*Math.max(0,115-scale*80)+mix*e.y*55+(e.bounce??0)):clamp(mix*e.y*Math.min(h*.17,Math.max(0,(h*.5-eh*1.15)/1.12))+(e.physicalY??0)*ty-(e.bounce??0)*h/300,-ty,ty);
 const rx=svg?k*(130+55*scale):gap+ew,ry=svg?k*55*scale:eh;
 c.save();c.translate(w/2+px,h/2+py);c.rotate((e.tilt??0)*Math.PI/180);
 if(state.phase==='charge'||state.phase==='super'){
 const power=state.phase==='super'?1:.55;
 // Vertical flame tongues, open center: no radial sunburst.
 for(const side of [-1,1])for(let i=0;i<7;i++){const u=i/6,base=side*rx*(.65+u*.48),height=ry*(1.7+1.5*u+.45*Math.sin(t*8+i*2+side)),tip=base+side*rx*(.12+.08*Math.sin(t*6+i));c.beginPath();c.moveTo(base-side*rx*.17,ry*1.15);c.quadraticCurveTo(base+side*rx*.18,0,tip,-height);c.lineTo(tip-side*rx*.19,-height*.47);c.quadraticCurveTo(base-side*rx*.28,-ry*.25,base-side*rx*.17,ry*1.15);const g=c.createLinearGradient(0,ry,0,-height);g.addColorStop(0,'rgba(255,125,0,'+power*.75+')');g.addColorStop(.45,'rgba(255,205,35,'+power*.85+')');g.addColorStop(1,'rgba(255,248,160,'+power*.9+')');c.fillStyle=g;c.fill()}
 for(let i=0;i<24;i++){const u=(t*.65+i*.137)%1,side=i%2?1:-1;c.fillStyle='rgba(255,235,100,'+(1-u)*power+')';c.fillRect(side*rx*(.8+.3*Math.sin(i*7)),ry*(1-4*u),2,5+u*7)}
 if(state.phase==='super')for(const side of [-1,1]){c.beginPath();for(let j=0;j<7;j++){const xx=side*rx*(1.05+.12*Math.sin(j*4+t*9)),yy=ry*(1.3-j*.55);j?c.lineTo(xx,yy):c.moveTo(xx,yy)}c.strokeStyle='#fff3ac';c.lineWidth=3;c.stroke()}
 }
 if(state.steam>0)for(const side of [-1,1])for(let i=0;i<8;i++){const u=(t*.9+i/8)%1,xx=side*rx*(1+u*.7),yy=-ry*(.15+u*1.4);c.beginPath();c.arc(xx,yy,Math.max(4,ry*(.13+u*.35)),0,Math.PI*2);c.fillStyle='rgba(225,238,248,'+state.steam*(1-u)*.85+')';c.fill()}
 c.restore();
 return state}
 reset(){this.sequence.reset();this.ctx?.clearRect(0,0,this.canvas.width,this.canvas.height)}
}
