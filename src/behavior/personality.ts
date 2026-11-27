import {clamp,smooth} from '../core';
export type PersonalityInput={people:number;smile:number;brow:number;voice:number;gesture?:string};
export type Personality={valence:number;arousal:number;dominance:number;curiosity:number};
export class PersonalityEngine {
 state:Personality={valence:.15,arousal:.08,dominance:.45,curiosity:.2};
 private exposure=0;
 step(input:PersonalityInput,dt:number){
  dt=clamp(dt,0,.1);
  const exposure=input.voice>.35?1:0;
  this.exposure=smooth(this.exposure,exposure,dt,exposure? .22 : .7);
  const novelty=clamp(1-this.exposure,0,1);
  const positive=clamp(input.smile*.65+(input.gesture==='Thumb_Up'?.35:0)+(input.gesture==='Open_Palm'?.22:0),0,1);
  const target={valence:clamp(.12+positive*.72),arousal:clamp(.08+input.voice*.32*novelty+input.brow*.2),dominance:clamp(.45+positive*.15),curiosity:clamp(.14+(input.people>0?.2:0)+input.brow*.3+novelty*input.voice*.2)};
  this.state={valence:smooth(this.state.valence,target.valence,dt,1.4),arousal:smooth(this.state.arousal,target.arousal,dt,2.2),dominance:smooth(this.state.dominance,target.dominance,dt,.9),curiosity:smooth(this.state.curiosity,target.curiosity,dt,1.1)};
  return {...this.state};
 }
 reset(){this.state={valence:.15,arousal:.08,dominance:.45,curiosity:.2};this.exposure=0}
}
