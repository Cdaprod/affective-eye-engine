import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {presets,gazeResponse,proximityScale} from '../src/core.ts';
import {AnimationCompositor} from '../src/rendering/animation-compositor.ts';
import {profileFor,qualityProfiles} from '../src/rendering/profiles.ts';
import {DEFAULT_OPTIONS} from '../src/rendering/types.ts';

test('all previous gaze and depth behaviors feed compositor unchanged',()=>{
 const c=new AnimationCompositor();
 const e={...presets.curious,x:gazeResponse(.2),y:-.3,scale:proximityScale(.35),blink:.2};
 const f=c.compose(e,{time:1,dt:1/60,velocityX:3,velocityY:-2,orientationX:.4,orientationY:-.2});
 assert.equal(f.x,e.x);assert.equal(f.y,e.y);assert.equal(f.blink,.2);
 assert.ok(f.scale!>=.62&&f.scale!<=1.44);assert.ok(f.stretch>0);
 assert.equal(f.orientationX,.4);
});
test('secondary motion is continuous bounded and resets',()=>{
 const c=new AnimationCompositor();
 let previous=0;
 for(let i=0;i<360;i++){
  const f=c.compose({...presets.neutral,x:0,y:0,blink:0},{time:i/60,dt:1/60,velocityX:i<60?6:0,velocityY:0,orientationX:0,orientationY:0});
  assert.ok(f.stretch>=0&&f.stretch<=.22);
  assert.ok(Math.abs(f.stretch-previous)<.12);
  previous=f.stretch;
 }
 c.reset();const f=c.compose({...presets.neutral,x:0,y:0,blink:0},{time:0,dt:0,velocityX:0,velocityY:0,orientationX:0,orientationY:0});
 assert.equal(f.stretch,0);
});
test('quality profiles keep postprocessing opt-in and constrained DPR',()=>{
 assert.equal(DEFAULT_OPTIONS.mode,'cinematic');
 assert.equal(profileFor('ultra','high').postprocessing,true);
 assert.equal(profileFor('ultra','balanced').postprocessing,false);
 assert.equal(profileFor('cinematic','high').postprocessing,false);
 assert.equal(qualityProfiles.low.maxDpr,1);
 assert.ok(qualityProfiles.high.maxDpr<=2);
});
test('canonical shader covers all emote and proximity signals',()=>{
 const shader=readFileSync('src/rendering/shaders/eye.frag.glsl','utf8');
 for(const signal of ['uGaze','uProximity','uValence','uArousal','uBlink','uWink','uTilt','uAsymmetry','uBounce','uOrientation','uEmission','uBloom']){
  assert.ok(shader.includes(signal),signal);
 }
 assert.ok(shader.includes('/* __SDF__ */'));
 assert.ok(shader.includes('/* __DEFORMATION__ */'));
 assert.ok(shader.includes('/* __LIGHTING__ */'));
});
