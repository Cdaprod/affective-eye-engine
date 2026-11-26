import {test} from 'node:test';import assert from 'node:assert/strict';import {Tracker,Attention,smooth,eyeSVG,presets,gazeResponse,GazeSpring,GazeMemory,proximityScale} from '../src/core.ts';
test('stable IDs under small movement',()=>{const t=new Tracker();const a=t.update([{x:0,y:0,size:.2}],0);assert.equal(t.update([{x:.1,y:0,size:.2}],100)[0].id,a[0].id)});test('attention alternates and reacquires',()=>{const a=new Attention();const ts=[{id:1,x:0,y:0,size:.3,seen:0},{id:2,x:1,y:0,size:.2,seen:0}];assert.equal(a.choose(ts,0)?.id,1);assert.equal(a.choose(ts,2700)?.id,2);assert.equal(a.choose(ts.slice(0,1),2800)?.id,1)});test('smoothing and deterministic rendering',()=>{assert.ok(smooth(0,1,.1)>0);const e={...presets.neutral,x:0,y:0,blink:0};assert.equal(eyeSVG(e),eyeSVG(e));assert.match(eyeSVG(e),/<svg/)});

test('gaze amplification is symmetric and bounded',()=>{assert.ok(gazeResponse(.2)>.5);assert.equal(gazeResponse(0),0);assert.equal(gazeResponse(1),1);assert.equal(gazeResponse(-.2),-gazeResponse(.2))});
test('gaze spring overshoots and settles without runaway',()=>{const s=new GazeSpring();let peak=0;for(let i=0;i<180;i++){const x=s.step(.8,1/60);peak=Math.max(peak,x);assert.ok(Math.abs(x)<=1.12)}assert.ok(peak>.805);assert.ok(Math.abs(s.position-.8)<.001)});

test('high gain reaches 80 percent travel at 20 percent input',()=>assert.ok(gazeResponse(.2)>.8));
test('edge loss holds gaze before returning to center',()=>{const m=new GazeMemory();m.resolve({id:1,x:.9,y:0,size:.2,seen:0},0);assert.equal(m.resolve(undefined,3000)?.x,.9);assert.ok(m.resolve(undefined,4100)!.x<.9);assert.equal(m.resolve(undefined,4800),undefined);m.reset();assert.equal(m.resolve(undefined,0),undefined)});

test('proximity scale grows monotonically and remains bounded',()=>{assert.equal(proximityScale(0),.65);assert.equal(proximityScale(1),1.4);assert.ok(proximityScale(.3)>proximityScale(.1))});
test('stationary face jitter is rejected before amplification',()=>{const tr=new Tracker();tr.update([{x:0,y:0,size:.2}],0);assert.equal(tr.update([{x:.008,y:-.009,size:.2}],80)[0].x,0)});
