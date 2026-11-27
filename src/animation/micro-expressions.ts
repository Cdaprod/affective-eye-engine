import {clamp} from '../core';
export const microLibrary={
 startle:{duration:350,priority:5,arousal:.65,valence:0,asymmetry:0,blink:.15,tilt:0,bounce:-7},
 flinch:{duration:220,priority:6,arousal:-.25,valence:-.12,asymmetry:.12,blink:.85,tilt:3,bounce:3},
 suspicion:{duration:850,priority:2,arousal:-.25,valence:-.22,asymmetry:.32,blink:0,tilt:7,bounce:0},
 curiosity:{duration:950,priority:2,arousal:.22,valence:.1,asymmetry:.28,blink:0,tilt:9,bounce:0},
 disapproval:{duration:850,priority:3,arousal:-.35,valence:-.35,asymmetry:.12,blink:.2,tilt:5,bounce:0},
 impatience:{duration:360,priority:3,arousal:-.2,valence:-.18,asymmetry:.2,blink:.3,tilt:4,bounce:0},
 relief:{duration:1250,priority:3,arousal:-.25,valence:.18,asymmetry:0,blink:.55,tilt:0,bounce:5},
 exhausted:{duration:1400,priority:4,arousal:-.55,valence:-.12,asymmetry:.08,blink:.65,tilt:2,bounce:8},
 doubleSigh:{duration:1200,priority:4,arousal:-.3,valence:.05,asymmetry:0,blink:.45,tilt:0,bounce:6},
 residual:{duration:650,priority:4,arousal:-.3,valence:-.25,asymmetry:.18,blink:.12,tilt:4,bounce:0},
 composure:{duration:900,priority:4,arousal:-.15,valence:-.08,asymmetry:0,blink:.65,tilt:6,bounce:2},
 resignation:{duration:1100,priority:4,arousal:-.35,valence:-.12,asymmetry:.05,blink:.55,tilt:0,bounce:7},
 cautious:{duration:850,priority:4,arousal:.12,valence:-.08,asymmetry:.3,blink:.1,tilt:6,bounce:0},
 reengage:{duration:750,priority:4,arousal:.24,valence:.22,asymmetry:.12,blink:.12,tilt:3,bounce:-3},
 acknowledgment:{duration:420,priority:2,arousal:.18,valence:.1,asymmetry:0,blink:.1,tilt:3,bounce:-4}
} as const;
export type MicroName=keyof typeof microLibrary;
export class MicroExpressions {
 private peak=0;private recovering=false;private recoveryQueue:MicroName[]=[];private active:MicroName|undefined;private started=0;private next=0;private lastMotion=-Infinity;private lastImpact=0;private wasSpeech=false;private side=1;private lastFocus=false;private lastTrigger=-Infinity;
 trigger(name:MicroName,now:number){if(this.active&&now-this.started<microLibrary[this.active].duration&&microLibrary[name].priority<=microLibrary[this.active].priority)return false;if(now<this.next&&microLibrary[name].priority<5)return false;if(now-this.lastTrigger<180)return false;this.active=name;this.started=now;this.lastTrigger=now;this.side=-this.side;this.next=now+microLibrary[name].duration+350;return true}
 step(input:{now:number;disturbance:number;impacts:number;anger:number;speech:boolean;focusChanged:boolean}){
 const {now,disturbance,impacts,anger,speech,focusChanged}=input;
 if(this.active&&now-this.started>=microLibrary[this.active].duration)this.active=undefined;
 const moving=disturbance>.18,wasMoving=now-this.lastMotion<650;
 if(moving){if(this.recovering){this.recovering=false;this.recoveryQueue=[];this.active=undefined;this.next=0;this.lastTrigger=-Infinity}this.peak=Math.max(this.peak,anger);if(!wasMoving)this.trigger(anger>.4?'disapproval':'startle',now);else if(impacts>this.lastImpact&&now-this.lastTrigger>850)this.trigger('flinch',now);else if(now-this.lastTrigger>1800)this.trigger(anger>.4?'impatience':'suspicion',now);this.lastMotion=now}
 else if(Number.isFinite(this.lastMotion)&&now-this.lastMotion>=650){
 if(!this.recovering){this.recovering=true;this.recoveryQueue=this.peak>=.65?['residual','composure','exhausted','resignation','cautious','doubleSigh','relief','reengage']:this.peak>=.3?['composure','resignation','cautious','relief','reengage']:this.peak>=.15?['cautious','relief','reengage']:['relief'];this.next=Math.min(this.next,now);}
 const name=this.recoveryQueue[0];const eligible=name==='cautious'?anger<=.55:name==='relief'?anger<=.25:name==='reengage'?anger<=.06:true;
 if(name&&eligible&&!this.active&&now>=this.next&&this.trigger(name,now))this.recoveryQueue.shift();
 if(!this.recoveryQueue.length&&!this.active){this.recovering=false;this.peak=0;this.lastMotion=-Infinity}
 }
 else if(speech&&!this.wasSpeech)this.trigger('acknowledgment',now);
 else if(focusChanged&&!this.lastFocus)this.trigger('curiosity',now);
 this.lastImpact=impacts;this.wasSpeech=speech;this.lastFocus=focusChanged;
 const name=this.active;if(!name)return {name:'none',arousal:0,valence:0,asymmetry:0,blink:0,tilt:0,bounce:0};
 const p=microLibrary[name],u=clamp((now-this.started)/p.duration,0,1),w=Math.sin(Math.PI*Math.pow(u,.65))**2;
 return {name,arousal:p.arousal*w,valence:p.valence*w,asymmetry:p.asymmetry*w,blink:p.blink*w,tilt:p.tilt*w*this.side,bounce:p.bounce*w};
 }
 reset(){this.peak=0;this.recovering=false;this.recoveryQueue=[];this.active=undefined;this.started=this.next=0;this.lastMotion=this.lastTrigger=-Infinity;this.lastImpact=0;this.wasSpeech=this.lastFocus=false;this.side=1}
}
