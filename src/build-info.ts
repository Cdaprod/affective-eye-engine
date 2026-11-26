declare const __BUILD_INFO__: {version:string;commit:string};
const node=document.getElementById('build-info');
if(node)node.textContent='Package '+__BUILD_INFO__.version+' · Build '+__BUILD_INFO__.commit.slice(0,12);
export {};
