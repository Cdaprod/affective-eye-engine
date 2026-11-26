import {mkdirSync,writeFileSync} from 'node:fs';
import {eyeSVG,presets} from '../src/core.ts';

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
writeFileSync('artifacts/manifest.json',JSON.stringify({version:2,seed:0,renderer:'src/core.ts:eyeSVG',entries:manifest,contactSheet:'artifacts/contact-sheet.svg',animations:['artifacts/animations/attention-switch.svg']},null,2)+'\n');
