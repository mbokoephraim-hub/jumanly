// Rendu PDF des modèles : node rendu.js [jobs.json]  → ../modeles/pdf/<nom>.pdf (pagination exécutée dans Chromium avant l'impression)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, 'jobs.json')));
  const out = path.join(__dirname, '..', 'modeles', 'pdf');
  const b = await chromium.launch();
  const rapport = [];
  for (const j of jobs) {
    const p = await b.newPage();
    await p.goto('file://' + j.html, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => document.body.dataset.pret === '1', null, { timeout: 15000 });
    const info = await p.evaluate(() => { const a = document.querySelector('article.cv'); return { pages: +a.dataset.pages, alerte: a.dataset.alerte || '' }; });
    const f = path.join(out, j.nom + '.pdf');
    fs.mkdirSync(path.dirname(f), { recursive: true });
    await p.pdf({ path: f, preferCSSPageSize: true, printBackground: true });
    rapport.push({ nom: j.nom, ...info });
    await p.close();
  }
  await b.close();
  console.log(JSON.stringify(rapport));
})();
