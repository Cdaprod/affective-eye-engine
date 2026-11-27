export type SemanticIntent='listening'|'thinking'|'speaking'|'confused'|'acknowledging'|'happy';
export class SemanticEvents{
 private latest?:{kind:SemanticIntent;at:number};
 private allowed=new Set<SemanticIntent>(['listening','thinking','speaking','confused','acknowledging','happy']);
 private onIntent=(event:Event)=>{const value=(event as CustomEvent).detail?.kind;if(this.allowed.has(value))this.latest={kind:value,at:performance.now()}};
 start(){window.addEventListener('affective-intent',this.onIntent)}
 current(now:number){return this.latest&&now-this.latest.at<2500?this.latest.kind:undefined}
 stop(){window.removeEventListener('affective-intent',this.onIntent);this.latest=undefined}
}
