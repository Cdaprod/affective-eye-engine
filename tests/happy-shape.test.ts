import {test} from 'node:test';
import assert from 'node:assert/strict';
import {eyeSVG,presets} from '../src/core.ts';
test('happy eyes use a single symmetric convex upper arc',()=>{const svg=eyeSVG({...presets.happy,x:0,y:0,blink:0});assert.equal((svg.match(/M -55 12 Q 0 [^ ]+ 55 12 Q 0 [^ ]+ -55 12 Z/g)||[]).length,2);assert.ok(!svg.includes('Q -48'));});
