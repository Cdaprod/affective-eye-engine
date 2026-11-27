import {clamp,smooth,type Target} from '../../core';
export class SpeakerEvidence {
 private motion=new Map<number,{jaw:number;score:number;at:number}>();
 update(targets:Target[],jaw:Map<number,number>,speechProbability:number,now:number,dt:number){
  const scores=new Map<number,number>();
  for(const target of targets){
   const current=clamp(jaw.get(target.id)??0,0,1);
   const before=this.motion.get(target.id);
   const change=before?Math.abs(current-before.jaw):0;
   const proxy=clamp(change*5,0,1);
   const score=smooth(before?.score??0,proxy*clamp(speechProbability,0,1),dt,8);
   this.motion.set(target.id,{jaw:current,score,at:now});scores.set(target.id,score);
  }
  for(const [id,state] of this.motion)if(now-state.at>1000)this.motion.delete(id);
  return scores;
 }
 clear(){this.motion.clear()}
}
