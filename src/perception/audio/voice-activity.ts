import {MicVAD} from '@ricky0123/vad-web';
export type SpeechObservation={probability:number;active:boolean;source:'neural'|'energy';onset:boolean;timestamp:number};
export class VoiceActivity {
 private vad?:MicVAD;private p=0;private speaking=false;private lastOnset=-Infinity;private generation=0;
 private fallback=false;
 get enabled(){return !!this.vad}
 async start(stream:MediaStream){
  this.stop();const generation=this.generation;
  try{
   const vad=await MicVAD.new({
    model:'v5',
    getStream:async()=>stream,
    pauseStream:async()=>{},
    resumeStream:async()=>stream,
    baseAssetPath:'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.31/dist/',
    onnxWASMBasePath:'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/',
    onFrameProcessed:probs=>{if(generation!==this.generation)return;this.p=probs.isSpeech;this.speaking=this.p>.42},
    onSpeechStart:()=>{if(generation!==this.generation)return;this.speaking=true;this.lastOnset=performance.now()},
    onSpeechEnd:()=>{if(generation!==this.generation)return;this.speaking=false},
    positiveSpeechThreshold:.42,negativeSpeechThreshold:.3,minSpeechMs:160,redemptionMs:380
   });
   if(generation!==this.generation){vad.pause();return}
   this.vad=vad;vad.start();
  }catch{this.fallback=true}
 }
 observation(now:number,energy:number):SpeechObservation{
  if(!this.vad)return {probability:energy,active:energy>.24,source:'energy',onset:false,timestamp:now};
  return {probability:this.p,active:this.speaking,source:'neural',onset:now-this.lastOnset<120,timestamp:now};
 }
 stop(){this.generation++;this.vad?.pause();this.vad=undefined;this.p=0;this.speaking=false;this.fallback=false;this.lastOnset=-Infinity}
}
