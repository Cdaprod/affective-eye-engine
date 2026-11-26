import {eyeSVG} from '../core';
import type {RenderFrame} from './types';
export class SVGRenderer {
 readonly element:HTMLDivElement;
 constructor(private host:HTMLElement){
  this.element=document.createElement('div');
  this.element.className='eyes-svg-layer';
  this.element.style.cssText='position:absolute;inset:0;display:grid;place-items:center;pointer-events:none';
  host.append(this.element);
 }
 render(frame:RenderFrame){this.element.innerHTML=eyeSVG(frame)}
 dispose(){this.element.remove()}
}
