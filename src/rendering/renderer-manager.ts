import type {RenderFrame,RenderingOptions,RendererMode} from './types';
import {DEFAULT_OPTIONS} from './types';
import {SVGRenderer} from './svg-renderer';
import {WebGLRenderer} from './webgl-renderer';

export class RendererManager {
 options:RenderingOptions={...DEFAULT_OPTIONS};
 activeMode:RendererMode='svg';
 private svg?:SVGRenderer;
 private gl?:WebGLRenderer;
 private failed=false;
 constructor(private host:HTMLElement,private onChange?:(mode:RendererMode)=>void){
  this.setOptions({});
 }
 setOptions(patch:Partial<RenderingOptions>){
  const before=this.options;
  this.options={...this.options,...patch};
  const desired=this.options.mode;
  if(desired==='svg'||this.failed){
   this.gl?.dispose();this.gl=undefined;
   if(!this.svg)this.svg=new SVGRenderer(this.host);
   this.activeMode='svg';
  }else{
   this.svg?.dispose();this.svg=undefined;
   try{
    if(!this.gl)this.gl=new WebGLRenderer(this.host,this.options.quality,desired==='ultra',()=>{
      this.failed=true;this.setOptions({mode:'svg'});
    });
    else if(before.quality!==this.options.quality||before.mode!==desired)this.gl.setQuality(this.options.quality,desired==='ultra');
    this.activeMode=desired;
   }catch(error){
    console.warn('WebGL failed; falling back to SVG',error);
    this.gl?.dispose();this.gl=undefined;
    this.failed=true;
    if(!this.svg)this.svg=new SVGRenderer(this.host);
    this.activeMode='svg';
   }
  }
  this.onChange?.(this.activeMode);
 }
 render(frame:RenderFrame,effects?:HTMLCanvasElement){
  if(effects&&this.activeMode!=='svg')this.gl?.setEffects(effects);
  if(this.activeMode==='svg')this.svg?.render(frame);
  else {
   try{this.gl?.render(frame,this.options)}
   catch(error){
    console.warn('WebGL render failed; switching to SVG',error);
    this.failed=true;this.setOptions({mode:'svg'});this.svg?.render(frame);
   }
  }
 }
 dispose(){this.gl?.dispose();this.svg?.dispose()}
}
