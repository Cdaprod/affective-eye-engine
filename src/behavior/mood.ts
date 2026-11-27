import {clamp} from '../core';
export type MoodStage='passive'|'startled'|'uneasy'|'irritated'|'frustrated'|'angry'|'recovering';
export const moodLibrary={
 passive:{valence:0,arousal:0,asymmetry:0,gestures:['breathing','blink']},
 startled:{valence:-.05,arousal:.85,asymmetry:.04,gestures:['recoil','double-blink']},
 uneasy:{valence:-.22,arousal:.15,asymmetry:.22,gestures:['side-glance','hesitation']},
 irritated:{valence:-.45,arousal:-.25,asymmetry:.12,gestures:['slow-blink','disapproving-tilt']},
 frustrated:{valence:-.72,arousal:-.48,asymmetry:.08,gestures:['twitch','squint']},
 angry:{valence:-1,arousal:-.65,asymmetry:0,gestures:['stare','shake-off']},
 recovering:{valence:-.15,arousal:-.2,asymmetry:.04,gestures:['sigh','long-blink']}
} as const;
export const moodTuning={episodeGapMs:900,minimumJolt:.18,episodeGain:.085,sustainedGain:.085,decayPerSecond:.075} as const;
export class MoodEngine {
 level=0;episodes=0;private last=-Infinity;private start=-Infinity;private strength=0;private stage:MoodStage='passive';private entered=0;
 disturb(now:number,strength=1){
  if(strength<moodTuning.minimumJolt)return;
  if(now-this.last>moodTuning.episodeGapMs){this.episodes++;this.start=now;this.level=clamp(this.level+moodTuning.episodeGain,0,1)}
  this.strength=clamp(strength,0,1);
  this.last=now;
 }
 step(now:number,dt:number){
  const quiet=now-this.last>650;
  const elapsed=clamp(dt,0,.1);
  if(!quiet&&now-this.last<250&&now-this.start>350)this.level=clamp(this.level+elapsed*moodTuning.sustainedGain*(.55+.45*this.strength),0,1);
  if(quiet)this.level=Math.max(0,this.level-Math.max(0,Math.min(.1,dt))*moodTuning.decayPerSecond);
  if(this.level===0)this.episodes=0;
  const l=this.level;
  const stage:MoodStage=l===0?'passive':!quiet&&now-this.start<450&&l<.18?'startled':l>=.8?'angry':l>=.6?'frustrated':l>=.4?'irritated':l>=.18?'uneasy':'recovering';
  if(stage!==this.stage){this.stage=stage;this.entered=now}
  const age=Math.max(0,now-this.entered),phase=age%3200, pulse=(center:number,width:number)=>Math.max(0,1-Math.abs(phase-center)/width);
  const profile=moodLibrary[stage];const blend=stage==='passive'?0:stage==='startled'?1:Math.min(1,l*3);
  let tilt=0,bounce=0,blink=0,gaze=0;
  if(stage==='startled'){bounce=-12*Math.sin(Math.PI*Math.min(1,age/450));blink=Math.max(pulse(160,65),pulse(340,65))}
  if(stage==='uneasy'){gaze=.22*Math.sin(age/550);tilt=5*Math.sin(age/700)}
  if(stage==='irritated'){tilt=7*pulse(600,500);blink=.85*pulse(1100,350)}
  if(stage==='frustrated'){tilt=5*Math.sin(age/45)*pulse(450,250);blink=.5*pulse(900,180)}
  if(stage==='angry'){tilt=3*Math.sin(age/60)*pulse(500,350);blink=.35*pulse(2400,180)}
  if(stage==='recovering'){bounce=5*pulse(650,650);blink=.8*pulse(650,450)}
  return {stage,level:l,episodes:this.episodes,quiet,blend,valence:profile.valence,arousal:profile.arousal,asymmetry:profile.asymmetry,tilt,bounce,blink,gaze};
 }
 reset(){this.level=this.episodes=0;this.strength=0;this.last=this.start=-Infinity;this.stage='passive';this.entered=0}
}
