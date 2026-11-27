import {clamp} from '../core';
export const microLibrary={
 startle:{duration:350,priority:5,arousal:.65,valence:0,asymmetry:0,blink:.15,tilt:0,bounce:-7},
 flinch:{duration:220,priority:6,arousal:-.25,valence:-.12,asymmetry:.12,blink:.85,tilt:3,bounce:3},
 suspicion:{duration:850,priority:2,arousal:-.25,valence:-.22,asymmetry:.32,blink:0,tilt:7,bounce:0},
 curiosity:{duration:950,priority:2,arousal:.22,valence:.1,asymmetry:.28,blink:0,tilt:9,bounce:0},
 disapproval:{duration:850,priority:3,arousal:-.35,valence:-.35,asymmetry:.12,blink:.2,tilt:5,bounce:0},
 impatience:{duration:360,priority:3,arousal:-.2,valence:-.18,asymmetry:.2,blink:.3,tilt:4,bounce:0},
 relief:{duration:1250,priority:3,arousal:-.25,valence:.18,asymmetry:0,blink:.55,tilt:0,bounce:5},
 acknowledgment:{duration:420,priority:2,arousal:.18,valence:.1,asymmetry:0,blink:.1,tilt:3,bounce:-4}
} as const;
export type MicroName=keyof typeof microLibrary;
export class MicroExpressions {
 private active:MicroName|undefined;private started=0;private next=0;private lastMotion=-Infinity;private lastImpact=0;private wasSpeech=false;private side=1;private lastFocus=false;private lastTrigger=-Infinity;
 trigger(name:MicroName,now:number){if(this.active&&now-this.started<microLibrary[this.active].duration&&microLibrary[name].priority<=microLibrary[this.active].priority)return false;if(now<this.next&&microLibrary[name].priority<5)return false;if(now-this.lastTrigger<180)return false;this.active=name;this.started=now;this.lastTrigger=now;this.side=-this.side;this.next=now+microLibrary[name].duration+350;return true}
 step(input:{now:number;disturbance:number;impacts:number;anger:number;speech:boolean;focusChanged:boolean}){
 const {now,disturbance,impacts,anger,speech,focusChanged}=input;
 if(this.active&&now-this.started>=microLibrary[this.active].duration)this.active=undefined;
 const moving=disturbance>.18,wasMoving=now-this.lastMotion<650;
 if(moving){if(!wasMoving)this.trigger(anger>.4?'disapproval':'startle',now);else if(impacts>this.lastImpact&&now-this.lastTrigger>850)this.trigger('flinch',now);else if(now-this.lastTrigger>1800)this.trigger(anger>.4?'impatience':'suspicion',now);this.lastMotion=now}
 else if(now-this.lastMotion>=650&&now-this.lastMotion<950)this.trigger('relief',now);
 else if(speech&&!this.wasSpeech)this.trigger('acknowledgment',now);
 else if(focusChanged&&!this.lastFocus)this.trigger('curiosity',now);
 this.lastImpact=impacts;this.wasSpeech=speech;this.lastFocus=focusChanged;
 const name=this.active;if(!name)return {name:'none',arousal:0,valence:0,asymmetry:0,blink:0,tilt:0,bounce:0};
 const p=microLibrary[name],u=clamp((now-this.started)/p.duration,0,1),w=Math.sin(Math.PI*Math.pow(u,.65))**2;
 return {name,arousal:p.arousal*w,valence:p.valence*w,asymmetry:p.asymmetry*w,blink:p.blink*w,tilt:p.tilt*w*this.side,bounce:p.bounce*w};
 }
 reset(){this.active=undefined;this.started=this.next=0;this.lastMotion=this.lastTrigger=-Infinity;this.lastImpact=0;this.wasSpeech=this.lastFocus=false;this.side=1}
}
