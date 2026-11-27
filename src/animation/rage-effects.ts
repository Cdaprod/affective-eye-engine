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
 render(now:number,anger:number,disturbance:number){const state=this.sequence.step(now,anger,disturbance),c=this.ctx;if(!c)return state;const w=innerWidth,h=innerHeight;if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}c.clearRect(0,0,w,h);const x=w/2,y=h/2,r=Math.min(w,h)*.39,t=now/1000;
 if(state.phase==='charge'||state.phase==='super'){const a=state.phase==='super'?1:.65;const g=c.createRadialGradient(x,y,r*.2,x,y,r*1.5);g.addColorStop(0,'rgba(255,220,60,0)');g.addColorStop(.65,'rgba(255,180,20,.48)');g.addColorStop(1,'rgba(255,120,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);for(let i=0;i<18;i++){const q=i*Math.PI*2/18,rr=r*(.85+.12*Math.sin(t*9+i*2));c.beginPath();c.moveTo(x+Math.cos(q-.08)*rr*.8,y+Math.sin(q-.08)*rr*.8);c.lineTo(x+Math.cos(q)*rr*1.35,y+Math.sin(q)*rr*1.35);c.lineTo(x+Math.cos(q+.08)*rr*.8,y+Math.sin(q+.08)*rr*.8);c.fillStyle='rgba(255,190,30,'+a*.85+')';c.fill()}if(state.phase==='super'){for(let i=0;i<3;i++){const q=t*2+i*2.1;c.beginPath();for(let j=0;j<6;j++){const rr=r*(.8+j*.08),xx=x+Math.cos(q+j*.16)*rr+(j%2?12:-12),yy=y+Math.sin(q+j*.16)*rr;j?c.lineTo(xx,yy):c.moveTo(xx,yy)}c.strokeStyle='rgba(255,246,175,.85)';c.lineWidth=4;c.stroke()}}}
 if(state.steam>0){for(const side of [-1,1])for(let i=0;i<7;i++){const u=(t*.85+i/7)%1,xx=x+side*(w*.32+u*w*.13),yy=y-h*(.02+u*.23);c.beginPath();c.arc(xx,yy,12+u*r*.23,0,Math.PI*2);c.fillStyle='rgba(220,235,245,'+state.steam*(1-u)*.85+')';c.fill()}}
 return state}
 reset(){this.sequence.reset();this.ctx?.clearRect(0,0,this.canvas.width,this.canvas.height)}
}
