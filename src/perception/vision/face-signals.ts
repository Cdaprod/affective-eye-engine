import {clamp,type Detection} from '../../core';
export type FacePoint={x:number;y:number;z?:number};
export type FaceSignal=Detection & {jaw:number;smile:number;brow:number;blink:number;headTilt:number;mouthMotion:number};
export type BlendCategory={categoryName:string;score:number};
export function parseFace(landmarks:FacePoint[],blendshapes:BlendCategory[]=[]):FaceSignal|undefined{
 if(landmarks.length<20)return;
 let minX=1,minY=1,maxX=0,maxY=0;
 for(const p of landmarks){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y)}
 const scores=new Map(blendshapes.map(b=>[b.categoryName,b.score]));
 const jaw=clamp(scores.get('jawOpen')??0,0,1), smile=clamp(((scores.get('mouthSmileLeft')??0)+(scores.get('mouthSmileRight')??0))/2,0,1);
 const brow=clamp(scores.get('browInnerUp')??0,0,1),blink=clamp(((scores.get('eyeBlinkLeft')??0)+(scores.get('eyeBlinkRight')??0))/2,0,1);
 const left=landmarks[33],right=landmarks[263];
 const headTilt=left&&right?clamp(Math.atan2(right.y-left.y,right.x-left.x)*180/Math.PI,-30,30):0;
 return {x:clamp(1-minX-maxX),y:clamp(minY+maxY-1),size:clamp(maxX-minX,0,1),jaw,smile,brow,blink,headTilt,mouthMotion:0};
}
export function correlateFaces<T extends {x:number;y:number}>(tracks:T[],observations:FaceSignal[]):Map<number,FaceSignal>{
 const used=new Set<number>(),out=new Map<number,FaceSignal>();
 tracks.forEach((t,i)=>{let best=-1,d=.34;for(let j=0;j<observations.length;j++){if(used.has(j))continue;const dist=Math.hypot(t.x-observations[j].x,t.y-observations[j].y);if(dist<d){best=j;d=dist}}if(best>=0){used.add(best);out.set(i,observations[best])}});
 return out;
}
