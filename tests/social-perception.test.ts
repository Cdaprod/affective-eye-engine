import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseFace,correlateFaces} from '../src/perception/vision/face-signals.ts';
import {SpeakerEvidence} from '../src/perception/fusion/speaker-attention.ts';
import {PerceptionCache} from '../src/perception/cache.ts';
import {PersonalityEngine} from '../src/behavior/personality.ts';
import {IntentionEngine} from '../src/behavior/intention.ts';
import {AnimationDirector} from '../src/animation/director.ts';
test('face signals extract normalized center, smile, and jaw independently of identity',()=>{
 const points=Array.from({length:478},()=>({x:.4,y:.5,z:0}));
 points[33]={x:.34,y:.44,z:0};points[263]={x:.46,y:.44,z:0};
 points[4]={x:.36,y:.48,z:0};points[6]={x:.64,y:.7,z:0};
 const face=parseFace(points,[{categoryName:'jawOpen',score:.6},{categoryName:'mouthSmileLeft',score:.8},{categoryName:'mouthSmileRight',score:.6}]);
 assert.ok(face);assert.ok(face.size>.2);assert.equal(face.jaw,.6);assert.equal(Number(face.smile.toFixed(2)),.7);
 const matched=correlateFaces([{x:face.x,y:face.y}], [face]);
 assert.equal(matched.get(0)?.jaw,.6);
});
test('speaker evidence is temporally bounded and tied to mouth change',()=>{
 const e=new SpeakerEvidence(),targets=[{id:4,x:0,y:0,size:.2,seen:0}];
 e.update(targets,new Map([[4,.1]]),1,0,.08);
 const next=e.update(targets,new Map([[4,.6]]),1,80,.08);
 assert.ok((next.get(4)??0)>.1);assert.ok((next.get(4)??0)<=1);
 e.clear();
});
test('perception cache expires stale frames',()=>{const cache=new PerceptionCache<number>(250);cache.put(42,1000);assert.equal(cache.get(1249),42);assert.equal(cache.get(1251),undefined)});
test('personality habituates constant speech without runaway arousal',()=>{
 const p=new PersonalityEngine();let first=0,last=0;
 for(let i=0;i<600;i++){const v=p.step({people:2,smile:.2,brow:.1,voice:1},.016);if(i===10)first=v.arousal;last=v.arousal;assert.ok(v.valence<=1&&v.arousal<=1&&v.dominance<=1)}
 assert.ok(last<first);p.reset();assert.ok(p.state.arousal<.1);
});
test('social intentions distinguish group, speech, and absence',()=>{
 const i=new IntentionEngine();assert.equal(i.update(10000,[],false),'resting');
 assert.equal(i.update(10100,[1,2],false),'acknowledging');
 assert.equal(i.update(10200,[1,2],true),'engaged');
 assert.equal(i.update(10300,[],false),'listening');
 assert.equal(i.update(12100,[],false),'searching');
 assert.equal(i.update(18000,[],false),'resting');
});
test('animation director prioritizes a blink on focus shift while bounded',()=>{
 const d=new AnimationDirector();
 d.step({intention:'observing',gazeChanged:true,time:1000,dt:.016,listeningTilt:0,listeningArousal:0});
 const p=d.step({intention:'listening',gazeChanged:false,time:1100,dt:.016,listeningTilt:-10,listeningArousal:.15});
 assert.ok(p.blink>.9);assert.equal(p.tilt,-10);
 d.reset();
});
