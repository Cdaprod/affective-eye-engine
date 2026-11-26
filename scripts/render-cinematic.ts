import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
import {chromium} from 'playwright';

const port=4173;
const address='http://127.0.0.1:'+port+'/index.html';
mkdirSync('artifacts/cinematic',{recursive:true});
const server=spawn(process.execPath,['./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'});
try {
 let ready=false;
 for(let i=0;i<70;i++){
  try{const r=await fetch(address);if(r.ok){ready=true;break}}catch{}
  await sleep(200);
 }
 if(!ready)throw Error('Vite preview did not start');
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(address,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#eyes')?.getAttribute('data-renderer')==='cinematic',{timeout:15000});
  await page.waitForTimeout(300);
  await page.screenshot({path:'artifacts/cinematic/cinematic-neutral.png'});
  await page.evaluate(()=>{
   const select=document.getElementById('material') as HTMLSelectElement;
   select.value='glass';select.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForTimeout(300);
  await page.screenshot({path:'artifacts/cinematic/glass-material.png'});
  await page.evaluate(()=>{
   const material=document.getElementById('material') as HTMLSelectElement;
   material.value='luminous';material.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(450);
  await page.screenshot({path:'artifacts/cinematic/portrait.png'});
  await page.evaluate(()=>{
   const mode=document.getElementById('render-mode') as HTMLSelectElement;
   mode.value='svg';mode.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForFunction(()=>document.querySelector('#eyes')?.getAttribute('data-renderer')==='svg');
  await page.screenshot({path:'artifacts/cinematic/svg-fallback.png'});
  writeFileSync('artifacts/cinematic/metadata.json',JSON.stringify({engine:'Three.js/WebGL',capture:'playwright-chromium',viewport:[1280,720],modes:['cinematic','glass','portrait','svg'],errors},null,2)+'\n');
  if(errors.length)throw Error('Browser page errors: '+errors.join(' | '));
  console.log('Captured four cinematic and fallback browser screenshots');
 }finally{await browser.close()}
}finally{server.kill('SIGTERM')}
