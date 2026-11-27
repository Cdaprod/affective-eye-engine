import {clamp,smooth} from './core';
export class AcousticPerception {
 private context?:AudioContext;private stream?:MediaStream;private nodes:AnalyserNode[]=[];private buffers:Float32Array<ArrayBuffer>[]=[];private generation=0;private activity=0;private pan=0;private noise=.008;private directional=false;private until=0;
 get active(){return !!this.stream?.active}
 get mediaStream(){return this.stream}
 async start(provided?:Promise<MediaStream>){
  this.stop();const token=this.generation;const context=new AudioContext();this.context=context;
  try{const resume=context.resume();const stream=await (provided??navigator.mediaDevices.getUserMedia({audio:{channelCount:{ideal:2},echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false}));await resume;
  if(token!==this.generation){stream.getTracks().forEach(t=>t.stop());return}
  this.stream=stream;const source=context.createMediaStreamSource(stream);const channels=stream.getAudioTracks()[0].getSettings().channelCount===2?2:1;
  const split=context.createChannelSplitter(channels);source.connect(split);
  for(let i=0;i<channels;i++){const a=context.createAnalyser();a.fftSize=512;split.connect(a,i);this.nodes.push(a);this.buffers.push(new Float32Array(a.fftSize))}
  }catch(e){if(token===this.generation)this.stop();throw e}
 }
 sample(dt:number,now:number){
  const rms=this.nodes.map((a,i)=>{const b=this.buffers[i];a.getFloatTimeDomainData(b);return Math.sqrt(b.reduce((s,x)=>s+x*x,0)/b.length)});
  const level=Math.max(0,...rms);if(level<this.noise*2)this.noise=smooth(this.noise,Math.max(.002,level),dt,.5);
  const raw=clamp((level-this.noise*2)/Math.max(.025,this.noise*5),0,1);
  if(raw>.2)this.until=now+900;
  this.activity=smooth(this.activity,now<this.until?Math.max(raw,.25):raw,dt,raw>this.activity?18:1.2);
  const difference=rms.length===2?(rms[1]-rms[0])/Math.max(.001,rms[0]+rms[1]):0;
  this.directional=rms.length===2&&Math.abs(difference)>.08&&level>.015;
  this.pan=smooth(this.pan,this.directional?clamp(difference*2):0,dt,this.directional?9:2);
  return {activity:this.activity,pan:this.pan,directional:this.directional};
 }
 stop(){this.generation++;this.stream?.getTracks().forEach(t=>t.stop());this.stream=undefined;void this.context?.close().catch(()=>{});this.context=undefined;this.nodes=[];this.buffers=[];this.activity=this.pan=this.until=0;this.directional=false}
}
