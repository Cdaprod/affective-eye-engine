import {mkdirSync,writeFileSync} from 'node:fs';
import {eyeSVG,presets,EmoteEngine,proximityScale,gazeResponse,GazeSpring} from '../src/core.ts';

mkdirSync('artifacts/previews',{recursive:true});
mkdirSync('artifacts/animations',{recursive:true});
const manifest=[];
const entries=Object.entries(presets);
for(const [name,p] of entries){
  const parameters={...p,x:0,y:0,blink:0};
  const file=`artifacts/previews/${name}.svg`;
  writeFileSync(file,eyeSVG(parameters));
  manifest.push({name,file,parameters});
}
const panel=(name:string,svg:string,x:number,y:number)=>svg.replace('<svg xmlns=',`<svg x="${x}" y="${y}" width="640" height="300" xmlns=`)+`<text x="${x+20}" y="${y+329}" font-size="24" font-family="sans-serif" fill="#dcecf6">${name}</text>`;
const sheet='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 1020"><rect width="1280" height="1020" fill="#101923"/>'+entries.map(([name,p],i)=>panel(name,eyeSVG({...p,x:0,y:0,blink:0}),(i%2)*640,Math.floor(i/2)*340)).join('')+'</svg>';
writeFileSync('artifacts/contact-sheet.svg',sheet);
const count=12;
const frames=Array.from({length:count},(_,i)=>{
  const progress=i/(count-1);
  const x=progress<.5?-.75:.75;
  const blink=progress>.46&&progress<.55?.65:0;
  const frame=eyeSVG({...presets.curious,x,y:Math.sin(progress*Math.PI*2)*.18,blink});
  const values=Array.from({length:count},(_,j)=>i===j?'visible':'hidden').join(';');
  return `<g visibility="hidden">${frame}<animate attributeName="visibility" values="${values}" dur="6s" calcMode="discrete" repeatCount="indefinite"/></g>`;
});
const animation='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300">'+frames.join('')+'</svg>';
writeFileSync('artifacts/animations/attention-switch.svg',animation);
const extra:string[]=[];
function animated(name:string,frames:string[],seconds:number){
 const n=frames.length;
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300">'+frames.map((f,i)=>'<g visibility="hidden">'+f+'<animate attributeName="visibility" values="'+Array.from({length:n},(_,j)=>i===j?'visible':'hidden').join(';')+'" dur="'+seconds+'s" calcMode="discrete" repeatCount="indefinite"/></g>').join('')+'</svg>';
 const file='artifacts/animations/'+name+'.svg';writeFileSync(file,svg);extra.push(file);
}
const spring=new GazeSpring();
animated('gaze-response',Array.from({length:90},(_,i)=>eyeSVG({...presets.neutral,x:spring.step(gazeResponse(.25*Math.sin(i/90*Math.PI*2)),1/30),y:0,blink:0})),3);
animated('proximity',Array.from({length:90},(_,i)=>eyeSVG({...presets.neutral,x:0,y:0,blink:0,scale:proximityScale(.06+.44*(1-Math.cos(i/90*Math.PI*2))/2)})),3);
for(const name of ['greet','surprise','curious','wink','sleepy','delight'] as const){
 const engine=new EmoteEngine(()=>.5);engine.active=name;engine.start=0;
 animated(name,Array.from({length:72},(_,i)=>{const em=engine.update(undefined,i*1000/30);return eyeSVG({x:0,y:0,blink:0,valence:em.valence*em.weight,arousal:em.arousal*em.weight,asymmetry:em.asymmetry*em.weight,wink:em.wink,tilt:em.tilt,bounce:em.bounce})}),2.4);
}
writeFileSync('artifacts/manifest.json',JSON.stringify({version:6,seed:0,renderer:'src/core.ts:eyeSVG',entries:manifest,contactSheet:'artifacts/contact-sheet.svg',animations:['artifacts/animations/attention-switch.svg',...extra]},null,2)+'\n');
