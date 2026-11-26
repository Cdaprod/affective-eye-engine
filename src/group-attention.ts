import {smooth,clamp,type Target} from './core';
export class GroupAttention {
 active:number|null=null; private since=0;private candidate:number|null=null;private candidateSince=0;private lastVisit=new Map<number,number>();private evidence=new Map<number,number>();
 reset(){this.active=null;this.since=0;this.candidate=null;this.lastVisit.clear();this.evidence.clear()}
 choose(ts:Target[],sound:{activity:number;pan:number;directional:boolean},motion:Map<number,number>,now:number,dt:number){
  for(const id of this.lastVisit.keys())if(!ts.some(t=>t.id===id)){this.lastVisit.delete(id);this.evidence.delete(id)}
  if(!ts.length){this.active=null;this.candidate=null;return undefined}
  const current=ts.find(t=>t.id===this.active);
  const scores=ts.map(t=>{const visual=clamp(motion.get(t.id)??0,0,1);const spatial=sound.directional?Math.max(0,1-Math.abs(t.x-sound.pan)/.65):0;const raw=sound.activity>.22?visual*.8+spatial*.2:0;const score=smooth(this.evidence.get(t.id)??0,raw,dt,4);this.evidence.set(t.id,score);return {t,score}});
  const ranked=scores.sort((a,b)=>b.score-a.score);const best=ranked[0];const incumbent=scores.find(s=>s.t.id===this.active)?.score??0;
  const speaker=best.score>.16&&(ts.length===1||best.score-(ranked[1]?.score??0)>.08);
  let next=current;
  if(!current)next=best.t;
  else if(speaker&&best.t.id!==current.id&&best.score>incumbent+.08){
   if(this.candidate!==best.t.id){this.candidate=best.t.id;this.candidateSince=now}
   if(now-this.candidateSince>=450&&now-this.since>=1100)next=best.t;
  }else{this.candidate=null;
   if(!speaker&&sound.activity<.22&&now-this.since>=2200){
    next=[...ts].sort((a,b)=>(this.lastVisit.get(a.id)??-Infinity)-(this.lastVisit.get(b.id)??-Infinity))[0];
   }
  }
  if(next&&next.id!==this.active){this.active=next.id;this.since=now;this.candidate=null}
  if(next)this.lastVisit.set(next.id,now);
  return next;
 }
}
// Estimate local mouth-region temporal change, normalized against cheek motion.
// This is a visual speech proxy, not lip reading or speaker identification.
export class MouthMotion {
 private previous=new Map<number,Float32Array>();readonly scores=new Map<number,number>();
 update(id:number,pixels:Float32Array){const old=this.previous.get(id);this.previous.set(id,pixels);if(!old)return;let mouth=0,cheek=0;for(let i=0;i<64;i++){const d=Math.abs(pixels[i]-old[i]);if(i>=32)mouth+=d;else cheek+=d}this.scores.set(id,clamp((mouth-cheek*.8)/32/18,0,1))}
 prune(ids:number[]){for(const id of this.previous.keys())if(!ids.includes(id)){this.previous.delete(id);this.scores.delete(id)}}
 reset(){this.previous.clear();this.scores.clear()}
}
