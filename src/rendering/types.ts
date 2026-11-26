import type {Eyes} from '../core';
export type RendererMode='svg'|'cinematic'|'ultra';
export type Quality='low'|'balanced'|'high';
export type EyeMaterial='luminous'|'glass';
export interface RenderingOptions {
 mode:RendererMode;quality:Quality;material:EyeMaterial;emission:number;bloom:number;
}
export interface RenderInputs {time:number;dt:number;velocityX:number;velocityY:number;orientationX:number;orientationY:number}
export interface RenderFrame extends Eyes {
 time:number;velocityX:number;velocityY:number;orientationX:number;orientationY:number;
 stretch:number;breath:number;emissionPulse:number;
}
export const DEFAULT_OPTIONS:RenderingOptions={mode:'cinematic',quality:'balanced',material:'luminous',emission:1,bloom:.45};
