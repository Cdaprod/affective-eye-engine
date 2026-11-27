import {test} from 'node:test';import assert from 'node:assert/strict';import {PhysicalReaction} from '../src/behavior/physical-reaction.ts';
test('gentle motion does not accumulate frustration',()=>{const p=new PhysicalReaction();for(let t=0;t<5000;t+=16){p.ingest(.2,.2,3,t);assert.equal(p.step(t,.016).frustration,0)}});
test('repeated motion triggers bounded recovery and settles',()=>{const p=new PhysicalReaction();let recovered=false;for(let t=0;t<5000;t+=16){p.ingest(12*Math.sin(t/100),10,180,t);const s=p.step(t,.016);recovered ||=s.recovering;assert.ok(Math.abs(s.x)<=1&&Math.abs(s.tilt)<=24)}assert.ok(recovered);assert.ok(p.step(5000,.016).impacts>0);let s=p.step(5000,.016);for(let t=5016;t<40000;t+=16)s=p.step(t,.016);assert.equal(s.frustration,0);assert.ok(Math.abs(s.x)<.01);p.reset()});

test('single acceleration impulse produces visible displacement within one frame',()=>{const p=new PhysicalReaction();p.ingest(5,0,0,0);const s=p.step(16,.016);assert.ok(Math.abs(s.x)>.1);assert.ok(s.weight>.8)});

test('shake-off retains anger and quiet recovery is delayed',()=>{const p=new PhysicalReaction();let peak=0;for(let t=0;t<3000;t+=16){p.ingest(12,10,180,t);peak=Math.max(peak,p.step(t,.016).frustration)}assert.ok(peak>.78);let s=p.step(3200,.016);const held=s.frustration;for(let t=3216;t<6500;t+=16)s=p.step(t,.016);assert.ok(s.frustration>=held-.01);for(let t=6500;t<40000;t+=16)s=p.step(t,.016);assert.equal(s.frustration,0)});

test('retained anger does not retain physical displacement weight and fresh jolts still work',()=>{const p=new PhysicalReaction();for(let n=0;n<3000;n+=16){p.ingest(12,10,180,n);p.step(n,.016)}let s=p.step(3000,.016);for(let n=3016;n<6500;n+=16)s=p.step(n,.016);assert.ok(s.frustration>.7);assert.ok(s.weight<.1);p.ingest(-8,0,0,6500);s=p.step(6516,.016);assert.ok(s.weight>.8);assert.ok(Math.abs(s.x)>.1)});

test('short alternating jolts accumulate visible persistent anger',()=>{const p=new PhysicalReaction();for(let n=0;n<600;n+=120){p.ingest(n%240===0?5:-5,0,0,n);p.step(n,.016)}const s=p.step(600,.016);assert.ok(s.frustration>.4);assert.ok(p.step(1600,.016).frustration>=s.frustration-.01)});
