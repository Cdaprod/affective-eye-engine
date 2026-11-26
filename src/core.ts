export type Target={id:number,x:number,y:number,size:number,seen:number};
export type Detection=Omit<Target,'id'|'seen'>;
export const clamp=(x:number,min=-1,max=1)=>Math.max(min,Math.min(max,x));
export const smooth=(x:number,y:number,dt:number,k=8)=>x+(y-x)*(1-Math.exp(-k*dt));
// Amplify small camera offsets while retaining a bounded, continuous response.
export const gazeResponse=(x:number)=>Math.tanh(2.8*x)/Math.tanh(2.8);
export class GazeSpring {
 position=0; velocity=0;
 step(target:number,dt:number){
  target=clamp(target); const w=17,z=.65,b=w*Math.sqrt(1-z*z);
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
 update(ds:Detection[],now:number){const old=this.targets.filter(t=>now-t.seen<800), used=new Set<number>();const fresh=ds.map(d=>{const t=old.filter(t=>!used.has(t.id)).sort((a,b)=>Math.hypot(a.x-d.x,a.y-d.y)-Math.hypot(b.x-d.x,b.y-d.y))[0];const id=t&&Math.hypot(t.x-d.x,t.y-d.y)<.45?t.id:this.next++;used.add(id);return {...d,id,seen:now}});this.targets=[...fresh,...old.filter(t=>!used.has(t.id))];return fresh;}
}
export class Attention {active:number|null=null; since=0; choose(ts:Target[],now:number){if(!ts.length){this.active=null;return undefined}const current=ts.find(t=>t.id===this.active);let next=current;if(!current||now-this.since>2600){const ordered=[...ts].sort((a,b)=>a.id-b.id);next=current?ordered[(ordered.indexOf(current)+1)%ordered.length]:[...ts].sort((a,b)=>b.size-a.size)[0];this.active=next.id;this.since=now}return next;}}
export type Eyes={x:number,y:number,valence:number,arousal:number,blink:number,asymmetry:number};
export const presets:Record<string,Pick<Eyes,'valence'|'arousal'|'asymmetry'>>={neutral:{valence:0,arousal:0,asymmetry:0},happy:{valence:1,arousal:.3,asymmetry:0},curious:{valence:.2,arousal:.5,asymmetry:.35},focused:{valence:-.45,arousal:.1,asymmetry:0},sleepy:{valence:0,arousal:-.9,asymmetry:0},surprised:{valence:.2,arousal:1,asymmetry:0}};
export function eyeSVG(e:Eyes){const shapes=[0,1].map(i=>{const h=Math.max(3,(100+e.arousal*45)*(1-clamp(e.blink,0,.98))*(1-(i?e.asymmetry:0)));const w=110, r=Math.min(32,h/2), tilt=(i?1:-1)*Math.min(0,e.valence)*18;const cx=190+i*260+clamp(e.x,-1.12,1.12)*105,cy=150+clamp(e.y,-1.12,1.12)*55;const d=e.valence>.45&&e.blink<.8?`M -55 12 Q -48 ${-h} 0 ${-h*.65} Q 48 ${-h} 55 12 Q 0 ${-h*.38} -55 12 Z`:null;return `<g transform="translate(${cx} ${cy}) rotate(${tilt})">${d?`<path d="${d}"/>`:`<rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${r}"/>`}</g>`}).join('');return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300"><rect width="640" height="300" fill="#080e16"/><g fill="#76e4ff">${shapes}</g></svg>`;}
