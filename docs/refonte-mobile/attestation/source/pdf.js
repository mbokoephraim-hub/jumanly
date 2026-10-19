// node pdf.js -> ../attestation-jumanly.pdf + ../attestation-jumanly.png (+ zoom sur la sécurité)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const html = path.resolve(__dirname, '../attestation-jumanly.html');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1123, height: 794 }, deviceScaleFactor: 2 });
  await p.goto('file://' + html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  await p.locator('.page').screenshot({ path: path.resolve(__dirname, '../attestation-jumanly.png') });
  const z = await b.newPage({ viewport: { width: 1123, height: 794 }, deviceScaleFactor: 5 });
  await z.goto('file://' + html, { waitUntil: 'load' }); await z.evaluate(() => document.fonts.ready);
  await z.screenshot({ path: path.resolve(__dirname, '../zoom-securite.png'), clip: { x: 20, y: 20, width: 300, height: 130 } });
  await z.screenshot({ path: path.resolve(__dirname, '../zoom-signature-sceau.png'), clip: { x: 80, y: 560, width: 960, height: 200 } });
  await p.pdf({ path: path.resolve(__dirname, '../attestation-jumanly.pdf'), width: '297mm', height: '210mm', printBackground: true, pageRanges: '1' });
  await b.close();
})();
