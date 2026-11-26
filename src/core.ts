export type Target={id:number,x:number,y:number,size:number,seen:number};
export type Detection=Omit<Target,'id'|'seen'>;
export const clamp=(x:number,min=-1,max=1)=>Math.max(min,Math.min(max,x));
export const smooth=(x:number,y:number,dt:number,k=8)=>x+(y-x)*(1-Math.exp(-k*dt));
// Amplify small camera offsets while retaining a bounded, continuous response.
export const gazeResponse=(x:number)=>Math.tanh(5.5*x)/Math.tanh(5.5);
export class GazeSpring {
 position=0; velocity=0;
 step(target:number,dt:number){
  target=clamp(target); const w=14,z=.78,b=w*Math.sqrt(1-z*z);
  const a=this.position-target,c=(this.velocity+z*w*a)/b;
  const decay=Math.exp(-z*w*dt),co=Math.cos(b*dt),si=Math.sin(b*dt);
  const offset=decay*(a*co+c*si);
  this.velocity=decay*((-z*w*a+b*c)*co+(-z*w*c-b*a)*si);
  this.position=clamp(target+offset,-1.12,1.12);
  if(Math.abs(this.position)>=1.12 && this.position*this.velocity>0)this.velocity=0;
  return this.position;
 }
}
export class Tracker {
 targets:Target[]=[]; next=1;
 update(ds:Detection[],now:number){const old=this.targets.filter(t=>now-t.seen<800), used=new Set<number>();const fresh=ds.map(d=>{const t=old.filter(t=>!used.has(t.id)).sort((a,b)=>Math.hypot(a.x-d.x,a.y-d.y)-Math.hypot(b.x-d.x,b.y-d.y))[0];const id=t&&Math.hypot(t.x-d.x,t.y-d.y)<.45?t.id:this.next++;used.add(id);const prev=id===t?.id?t:undefined;const dt=prev?Math.max(.001,(now-prev.seen)/1000):0;const filter=(a:number,b:number)=>Math.abs(a-b)<.012?a:smooth(a,b,dt,5+18*Math.min(1,Math.abs(a-b)));return {...d,x:prev?filter(prev.x,d.x):d.x,y:prev?filter(prev.y,d.y):d.y,size:prev?smooth(prev.size,d.size,dt,5):d.size,id,seen:now}});this.targets=[...fresh,...old.filter(t=>!used.has(t.id))];return fresh;}
}
export class Attention {active:number|null=null; since=0; choose(ts:Target[],now:number){if(!ts.length){this.active=null;return undefined}const current=ts.find(t=>t.id===this.active);let next=current;if(!current||now-this.since>2600){const ordered=[...ts].sort((a,b)=>a.id-b.id);next=current?ordered[(ordered.indexOf(current)+1)%ordered.length]:[...ts].sort((a,b)=>b.size-a.size)[0];this.active=next.id;this.since=now}return next;}}
export type Eyes={x:number,y:number,valence:number,arousal:number,blink:number,asymmetry:number;scale?:number;wink?:number;tilt?:number;bounce?:number};
export const presets:Record<string,Pick<Eyes,'valence'|'arousal'|'asymmetry'>>={neutral:{valence:0,arousal:0,asymmetry:0},happy:{valence:1,arousal:.3,asymmetry:0},curious:{valence:.2,arousal:.5,asymmetry:.35},focused:{valence:-.45,arousal:.1,asymmetry:0},sleepy:{valence:0,arousal:-.9,asymmetry:0},surprised:{valence:.2,arousal:1,asymmetry:0}};
export function eyeSVG(e:Eyes){const shapes=[0,1].map(i=>{const h=Math.max(3,(100+e.arousal*45)*(1-clamp(Math.max(e.blink,i===1?(e.wink??0):0),0,.98))*(1-(i?e.asymmetry:0)));const scale=clamp(e.scale??1,.65,1.4);const w=110, r=Math.min(32,h/2), tilt=(i?1:-1)*Math.min(0,e.valence)*18+(e.tilt??0);const extent=Math.hypot(55,Math.max(h/2,h*.9))*scale;const cx=190+i*260+clamp(e.x,-1.12,1.12)*Math.min(105,Math.max(0,(185-extent)/1.12)),cy=150+(e.bounce??0)+clamp(e.y,-1.12,1.12)*Math.min(55,Math.max(0,(145-extent)/1.12));const d=e.valence>.45&&e.blink<.8&&!(i===1&&(e.wink??0)>.5)?`M -55 12 Q -48 ${-h} 0 ${-h*.65} Q 48 ${-h} 55 12 Q 0 ${-h*.38} -55 12 Z`:null;return `<g transform="translate(${cx} ${cy}) rotate(${tilt}) scale(${scale})">${d?`<path d="${d}"/>`:`<rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${r}"/>`}</g>`}).join('');return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300"><rect width="640" height="300" fill="#080e16"/><g fill="#76e4ff">${shapes}</g></svg>`;}

export class GazeMemory {
 last:Target|undefined;
 resolve(target:Target|undefined,now:number){
  if(target){this.last={...target,seen:now};return target}
  if(!this.last)return undefined;
  const age=now-this.last.seen;
  const hold=Math.abs(this.last.x)>.65?3500:1500;
  if(age<hold)return this.last;
  if(age<hold+1200){const f=1-(age-hold)/1200;return {...this.last,x:this.last.x*f,y:this.last.y*f,size:.2+(this.last.size-.2)*f}}
  return undefined;
 }
 reset(){this.last=undefined}
}

export function proximityScale(size:number){const u=clamp((size-.06)/.44,0,1);return .65+.75*u*u*(3-2*u)}

export type Emote='greet'|'surprise'|'curious'|'wink'|'sleepy'|'delight';
const durations:Record<Emote,number>={greet:1400,surprise:1000,curious:1800,wink:850,sleepy:2200,delight:1500};
export class EmoteEngine {
 active:Emote|undefined; start=0; next=0; previous:Target|undefined; lastSeen=-Infinity;
 constructor(private random= Math.random){}
 reset(){this.active=undefined;this.next=0;this.previous=undefined;this.lastSeen=-Infinity}
 update(target:Target|undefined,now:number){
  const old=this.previous, absent=now-this.lastSeen;
  if(target)this.lastSeen=now;
  this.previous=target;
  if(this.active&&now-this.start>=durations[this.active]){this.active=undefined;this.next=now+2500+this.random()*4500}
  if(!this.active){
   let event:Emote|undefined;
   if(now>=this.next){
    if(target&&absent>2000)event='greet';
    else if(target&&old&&target.id!==old.id)event='curious';
    else if(target&&old&&target.size-old.size>.035)event='surprise';
    else if(this.next===0)this.next=now+4000;
    else {const pool:Emote[]=target?['wink','delight','curious']:['sleepy','curious'];event=pool[Math.floor(this.random()*pool.length)]}
   }
   if(event){this.active=event;this.start=now}
  }
  const name=this.active;
  const phase=name?clamp((now-this.start)/durations[name],0,1):0;
  const weight=Math.sin(Math.PI*phase)**2;
  const p=name==='greet'||name==='delight'?presets.happy:name==='surprise'?presets.surprised:name==='sleepy'?presets.sleepy:presets.curious;
  return {name,weight,...p,wink:name==='wink'?weight:0,tilt:name==='curious'?weight*8:0,bounce:name==='greet'||name==='delight'?-8*weight*Math.sin(phase*Math.PI*2):0};
 }
}
