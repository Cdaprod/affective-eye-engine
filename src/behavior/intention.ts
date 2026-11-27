export type Intention='resting'|'observing'|'engaged'|'listening'|'searching'|'acknowledging';
export class IntentionEngine{
 private lastPerson=-Infinity;private lastSpeech=-Infinity;private seen=new Set<number>();private acknowledgementUntil=0;
 update(now:number,faces:number[],speaking:boolean){
  if(faces.length){this.lastPerson=now;for(const id of faces)if(!this.seen.has(id)){this.seen.add(id);this.acknowledgementUntil=now+650}}
  if(speaking)this.lastSpeech=now;
  if(faces.length&&speaking)return 'engaged' as Intention;
  if(faces.length&&now<this.acknowledgementUntil)return 'acknowledging' as Intention;
  if(faces.length)return 'observing' as Intention;
  if(now-this.lastSpeech<1300)return 'listening' as Intention;
  if(now-this.lastPerson<5000)return 'searching' as Intention;
  this.seen.clear();return 'resting' as Intention;
 }
 reset(){this.lastPerson=-Infinity;this.lastSpeech=-Infinity;this.acknowledgementUntil=0;this.seen.clear()}
}
