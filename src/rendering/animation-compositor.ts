import {clamp,smooth,type Eyes} from '../core';
import type {RenderFrame,RenderInputs} from './types';
// Visual secondary motion is derived from canonical behavioral state, never fed back into tracking.
export class AnimationCompositor {
 private stretch=0;
 private pulse=0;
 private initialized=false;
 compose(eyes:Eyes,input:RenderInputs):RenderFrame {
  const dt=clamp(input.dt,0,.1);
  const speed=Math.hypot(input.velocityX,input.velocityY);
  const desired=clamp(speed*.035,0,.22);
  if(!this.initialized){this.stretch=0;this.initialized=true}
  this.stretch=smooth(this.stretch,desired,dt,11);
  const breath=1+.012*Math.sin(input.time*.95);
  this.pulse=smooth(this.pulse,.035*Math.sin(input.time*.65)+.035,dt,2);
  return {
   ...eyes,
   scale:clamp((eyes.scale??1)*breath,.62,1.44),
   time:input.time,
   velocityX:clamp(input.velocityX,-12,12),
   velocityY:clamp(input.velocityY,-12,12),
   orientationX:clamp(input.orientationX),
   orientationY:clamp(input.orientationY),
   stretch:this.stretch,
   breath,
   emissionPulse:this.pulse
  };
 }
 reset(){this.stretch=0;this.pulse=0;this.initialized=false}
}
