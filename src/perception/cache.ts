export class PerceptionCache<T>{
 private last?:{value:T;at:number};
 constructor(private maxAgeMs:number){}
 put(value:T,at:number){this.last={value,at}}
 get(now:number){if(!this.last||now-this.last.at>this.maxAgeMs||now<this.last.at)return undefined;return this.last.value}
 clear(){this.last=undefined}
 get age(){return this.last?.at}
}
