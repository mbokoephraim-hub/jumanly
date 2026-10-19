// node shot.js -> ../captures/sN.png (chaque section) + ../refonte-mobile-fondations.jpg
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{
 const nom=process.argv[2]||'fondations'; const file=path.resolve(__dirname,`../refonte-web-${nom}.html`); const out=path.resolve(__dirname,nom==='fondations'?'../captures':`../captures/web-${nom}`); fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1400,height:1000},deviceScaleFactor:1.5});
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.goto('file://'+file,{waitUntil:'networkidle'}); await p.evaluate(()=>document.fonts.ready);
 for(const id of await p.$$eval('.bloc',els=>els.map(e=>e.id))){ await p.locator('#'+id).screenshot({path:`${out}/${id}.png`}); }
 await p.screenshot({path:path.resolve(__dirname,`../refonte-web-${nom}.jpg`),fullPage:true,type:'jpeg',quality:80});
 console.log(await p.evaluate(()=>{const r=[];document.querySelectorAll('.web,.tab').forEach(ph=>{const pr=ph.getBoundingClientRect();ph.querySelectorAll('*').forEach(el=>{const q=el.getBoundingClientRect();if(q.width&&q.right>pr.right+1)r.push((el.closest('.bloc')||{}).id+' '+el.className.baseVal+el.className+' '+Math.round(q.right-pr.right))})});return r.slice(0,20)}));
 await b.close();})();
