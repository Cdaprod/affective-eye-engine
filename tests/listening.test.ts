import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ListeningGesture} from '../src/listening.ts';
test('continuous sound holds a bounded tilt without repeated onset',()=>{
 const g=new ListeningGesture();let p=g.update({activity:1,pan:-.8,directional:true},0,.016);
 for(let t=16;t<60000;t+=16)p=g.update({activity:1,pan:t<1000?-.8:.8,directional:true},t,.016);
 assert.ok(p.active);assert.ok(p.tilt< -3.9&&p.tilt> -4.1);
 for(let t=60000;t<67000;t+=16)p=g.update({activity:0,pan:0,directional:false},t,.016);
 assert.ok(!p.active);assert.ok(Math.abs(p.tilt)<.05);
});
test('brief noise does not initiate listening',()=>{const g=new ListeningGesture();g.update({activity:1,pan:0,directional:false},0,.016);assert.equal(g.update({activity:0,pan:0,directional:false},100,.016).active,false)});
