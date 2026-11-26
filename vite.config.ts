import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const pkg=JSON.parse(readFileSync('package.json','utf8'));
let sha=process.env.GITHUB_SHA||'unknown';
if(sha==='unknown'){try{sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}catch{}}
const info={version:pkg.version,commit:sha};
export default defineConfig({base:'./',define:{__BUILD_INFO__:JSON.stringify(info)},plugins:[{name:'build-info',generateBundle(){this.emitFile({type:'asset',fileName:'build-info.json',source:JSON.stringify(info,null,2)+'\n'})}}],build:{rollupOptions:{input:{main:'index.html',gallery:'gallery.html'}}}});
