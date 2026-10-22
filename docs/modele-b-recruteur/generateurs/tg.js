// usage: node tg.js Fichier.dc.html '{"props":...}' ...
const fs=require('fs');const f=process.argv[2];const s=fs.readFileSync('canvas/project/'+f,'utf8');
const js=s.slice(s.indexOf('class Component'),s.lastIndexOf('</script>'));
global.setTimeout=()=>0;global.clearTimeout=()=>0;
eval("class DCLogic{constructor(p){this.props=p;this.state={}}setState(o){Object.assign(this.state,o)}}\n"+js+";global.Component=Component;");
const b=s.slice(0,s.indexOf('<script type="text/x-dc"'));
const holes=[...b.matchAll(/\{\{\s*([a-zA-Z_][\w.]*)\s*\}\}/g)].map(m=>m[1]);
const loops=new Set([...b.matchAll(/as="(\w+)"/g)].map(m=>m[1]));
const PS=process.argv.slice(3).map(x=>JSON.parse(x));if(!PS.length)PS.push({});
let errs=0,n=0;
function chk(v,tag){for(const h of holes){const parts=h.split('.');if(loops.has(parts[0])||h==='true'||h==='false')continue;let x=v;for(const q of parts){if(x==null){break}x=x[q]}if(x===undefined){console.log('MANQUE',tag,h);errs++}}}
function fns(o,p,pre,out){for(const k in o){const x=o[k];if(typeof x==='function')out.push(pre+k);else if(x&&typeof x==='object'&&p<3)fns(x,p+1,pre+k+'.',out)}return out}
function get(o,path){return path.split('.').reduce((a,k)=>a&&a[k],o)}
for(const pr of PS){const c0=new Component(pr);const v0=c0.renderVals();chk(v0,JSON.stringify(pr));
 for(const k of fns(v0,0,'',[])){const c=new Component(pr);const v=c.renderVals();try{get(v,k)({target:{value:'ba'}});const v2=c.renderVals();chk(v2,JSON.stringify(pr)+' après '+k);
   for(const k2 of fns(v2,0,'',[]).slice(0,400)){const c3=new Component(pr);c3.state=JSON.parse(JSON.stringify(c.state));const v3=c3.renderVals();try{get(v3,k2)({target:{value:'x'}});chk(c3.renderVals(),k+' > '+k2);n++}catch(e){console.log('ERR2',k,k2,e.message);errs++}}
 }catch(e){console.log('ERR',JSON.stringify(pr),k,e.message);errs++}}}
console.log(f,'erreurs',errs,'clics',n);
