import type {Quality,RendererMode} from './types';
export type QualityProfile={maxDpr:number;postprocessing:boolean;targetFps:number};
export const qualityProfiles:Record<Quality,QualityProfile>={
 low:{maxDpr:1,postprocessing:false,targetFps:30},
 balanced:{maxDpr:1.5,postprocessing:false,targetFps:60},
 high:{maxDpr:2,postprocessing:true,targetFps:60},
};
export function profileFor(mode:RendererMode,quality:Quality):QualityProfile {
 const base=qualityProfiles[quality];
 return {...base,postprocessing:mode==='ultra' && quality==='high'};
}
export function clipValue(value:number,min:number,max:number){return Math.min(max,Math.max(min,Number.isFinite(value)?value:min))}
