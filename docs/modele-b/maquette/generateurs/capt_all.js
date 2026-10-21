// usage: node capt_all.js dossier_sortie  — capture chaque planche du canvas, dans l'ordre
const fs=require('fs');const {chromium}=require('playwright');
const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
const C=JSON.parse(fs.readFileSync('canvas/project/canvas.json','utf8'));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
let i=0;const liste=[];
for(const f of C.order){i++;const B=C.boards[f];
 let src=f,props={};let s=fs.readFileSync('canvas/project/'+f,'utf8');
 const m=s.match(/<dc-import name="([^"]+)"([^>]*)>/);
 if(m&&!s.includes('class="couche')){src=m[1]+'.dc.html';for(const x of m[2].matchAll(/([a-zA-Z]+)="([^"]*)"/g)){if(x[1]!=='hint')props[x[1]]=x[2]}delete props.hint;s=fs.readFileSync('canvas/project/'+src,'utf8')}
 Object.keys(props).forEach(k=>{if(k.startsWith('hint'))delete props[k]});
 const tpl=s.slice(s.indexOf('<x-dc>')+6,s.indexOf('</x-dc>'));
 const js=s.slice(s.indexOf('class Component'),s.lastIndexOf('</script>'));
 const p=await b.newPage({viewport:{width:B.w,height:B.h},deviceScaleFactor:1.5});
 await p.setContent('<!doctype html><html><head></head><body style="margin:0;background:#0B1A1F"></body></html>');
 const pj=JSON.stringify(props),etat=null;
 try{
 await p.evaluate(({tpl,js,props,etat})=>{
 const helm=tpl.match(/<helmet>([\s\S]*?)<\/helmet>/);document.head.innerHTML=helm?helm[1]:'';
 const body=tpl.replace(/<helmet>[\s\S]*?<\/helmet>/,'');
 window.setTimeout0=window.setTimeout;
 eval("class DCLogic{constructor(p){this.props=p;this.state={}}setState(o){Object.assign(this.state,o)}}\n"+js+";window.C=Component;");
 const c=new C(props);if(etat)Object.assign(c.state,etat);const v=c.renderVals();
 const look=(sc,path)=>{path=path.trim();if(path==='true')return true;if(path==='false')return false;return path.split('.').reduce((a,k)=>a==null?a:a[k],sc)};
 const sub=(str,sc)=>str.replace(/\{\{\s*([^}]+?)\s*\}\}/g,(m,k)=>{const x=look(sc,k);return (x==null||typeof x==='function')?'':String(x)});
 const t=document.createElement('template');t.innerHTML=body;
 function proc(node,sc){for(const ch of [...node.childNodes]){
  if(ch.nodeType===3){ch.textContent=sub(ch.textContent,sc);continue}
  if(ch.nodeType!==1)continue;const tag=ch.tagName.toLowerCase();
  if(tag==='sc-if'){const m=ch.getAttribute('value').match(/\{\{\s*([^}]+?)\s*\}\}/);const ok=!!look(sc,m[1]);if(ok){proc(ch,sc);ch.replaceWith(...ch.childNodes)}else ch.remove();continue}
  if(tag==='sc-for'){const m=ch.getAttribute('list').match(/\{\{\s*([^}]+?)\s*\}\}/);const L=look(sc,m[1])||[];const as=ch.getAttribute('as');const frag=[];for(const it of L){const cl=ch.cloneNode(true);proc(cl,{...sc,[as]:it});frag.push(...cl.childNodes)}ch.replaceWith(...frag);continue}
  for(const a of [...ch.attributes]){if(/^on[A-Z]/.test(a.name)){ch.removeAttribute(a.name);continue}if(a.value.includes('{{'))ch.setAttribute(a.name,sub(a.value,sc))}
  proc(ch.content||ch,sc)}}
 proc(t.content,v);document.body.appendChild(t.content);
},{tpl,js,props:JSON.parse(pj||'{}'),etat:etat?JSON.parse(etat):null});

 await p.waitForTimeout(1500);
 const nom=String(i).padStart(3,'0')+'-'+f.replace('.dc.html','')+'.jpg';
 await p.screenshot({path:out+'/'+nom,type:'jpeg',quality:84});liste.push([nom,B.title||'']);
 }catch(e){console.log('ERREUR',f,e.message.slice(0,120))}
 await p.close();}
fs.writeFileSync(out+'/liste.json',JSON.stringify(liste,null,1));console.log('ok',liste.length);await b.close();})();
