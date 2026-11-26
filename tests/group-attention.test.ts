import {test} from 'node:test';import assert from 'node:assert/strict';import {GroupAttention} from '../src/group-attention.ts';
const faces=[{id:1,x:-.5,y:0,size:.2,seen:0},{id:2,x:.5,y:0,size:.2,seen:0}];
test('quiet group receives alternating attention',()=>{const g=new GroupAttention(),s={activity:0,pan:0,directional:false};assert.equal(g.choose(faces,s,new Map(),0,.016)?.id,1);assert.equal(g.choose(faces,s,new Map(),2300,.016)?.id,2)});
test('mono speech proxy switches and holds speaker',()=>{const g=new GroupAttention(),s={activity:1,pan:0,directional:false};g.choose(faces,s,new Map(),0,.016);let t;for(let n=16;n<5000;n+=16)t=g.choose(faces,s,new Map([[2,1]]),n,.016);assert.equal(t?.id,2);for(let n=5000;n<8000;n+=16)t=g.choose(faces,s,new Map(),n,.016);assert.equal(t?.id,2)});
