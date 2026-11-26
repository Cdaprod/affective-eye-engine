import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Tracker,Attention,eyeSVG,presets,clamp} from '../src/core.ts';

test('multiple anonymous targets have unique persistent IDs',()=>{
 const tracker=new Tracker();
 const first=tracker.update([{x:-.7,y:0,size:.2},{x:.7,y:0,size:.25}],0);
 assert.notEqual(first[0].id,first[1].id);
 const again=tracker.update([{x:-.65,y:.03,size:.2},{x:.68,y:0,size:.25}],100);
 assert.deepEqual(again.map(t=>t.id),first.map(t=>t.id));
});
test('attention does not rotate when there is only one visible target',()=>{
 const a=new Attention();const one=[{id:12,x:0,y:0,size:.3,seen:0}];
 assert.equal(a.choose(one,0)?.id,12);
 assert.equal(a.choose(one,3000)?.id,12);
 assert.equal(a.choose([],3100),undefined);
});
test('procedural expressions render deterministic SVG',()=>{
 for(const [name,parameters] of Object.entries(presets)){
  const svg=eyeSVG({...parameters,x:clamp(.5),y:0,blink:0});
  assert.match(svg,/^<svg/,`missing svg for ${name}`);
  assert.equal(svg,eyeSVG({...parameters,x:.5,y:0,blink:0}));
  assert.doesNotMatch(svg,/NaN|undefined/);
 }
});
