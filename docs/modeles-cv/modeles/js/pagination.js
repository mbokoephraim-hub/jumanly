/* Jumanly · Modèles de CV · pagination de référence (v1, octobre 2026).
   Le même code tourne dans l'aperçu (navigateur) et à l'export PDF (Chromium côté serveur) : la mise en page est donc identique.
   Principe : le contenu complet est rendu une fois dans .cv-source (caché). On crée des pages A4 fixes (210 × 297 mm)
   à partir du gabarit <template id="cv-page">, puis on y verse les blocs un par un. Un bloc qui dépasse part sur la page suivante.
   Unités insécables : l'en-tête d'une section + son premier élément, puis chaque élément. Sauts manuels : data-saut="avant".
   Deux flux indépendants : .cv-principal et .cv-lateral (les modèles à une colonne n'ont que le principal). */
(function () {
  function deborde(zone) { return zone.scrollHeight > zone.clientHeight + 1; }

  function paginer(article) {
    const source = article.querySelector('.cv-source');
    const gabarit = article.querySelector('template.cv-page-modele');
    const conteneur = article.querySelector('.cv-pages');
    const maxPages = parseInt(article.dataset.maxPages || '3', 10);
    conteneur.innerHTML = '';
    const pages = [];

    function nouvellePage() {
      const p = gabarit.content.firstElementChild.cloneNode(true);
      if (pages.length > 0) {
        p.classList.add('suite');
        p.querySelectorAll('[data-page1]').forEach(n => n.remove());   // en-tête et blocs réservés à la page 1
      }
      conteneur.appendChild(p);
      pages.push(p);
      return p;
    }
    if (!pages.length) nouvellePage();
    // En-tête de la page 1 (identité, coordonnées, photo) : déjà dans le gabarit, rempli depuis la source.
    source.querySelectorAll('[data-bloc-tete]').forEach(b => {
      const cible = pages[0].querySelector(b.dataset.blocTete);
      if (cible) cible.appendChild(b.cloneNode(true));
    });

    function verser(flux) {
      const sections = Array.from(source.querySelectorAll('.cv-sec[data-zone="' + flux + '"]'));
      let i = 0;                                        // index de la page courante pour ce flux
      const zone = () => { while (pages.length <= i) nouvellePage(); return pages[i].querySelector('.cv-' + flux); };
      sections.forEach(sec => {
        const elements = Array.from(sec.querySelectorAll(':scope > .cv-el'));
        const coquille = () => { const c = sec.cloneNode(false); const t = sec.querySelector(':scope > .cv-st'); if (t) c.appendChild(t.cloneNode(true)); return c; };
        if (sec.dataset.saut === 'avant' && zone().children.length) i++;
        let courant = coquille();
        zone().appendChild(courant);
        elements.forEach((el, k) => {
          if (el.dataset.saut === 'avant' && k > 0) { i++; courant = coquille(); courant.classList.add('cv-suite'); zone().appendChild(courant); }
          const copie = el.cloneNode(true);
          courant.appendChild(copie);
          if (deborde(zone())) {
            copie.remove();
            const vide = !courant.querySelector('.cv-el');
            if (vide) courant.remove();                 // le titre ne reste jamais seul en bas de page
            if (zone().children.length === 0) {         // élément plus haut qu'une page : on le garde et on signale
              courant.appendChild(copie); zone().appendChild(courant); article.dataset.alerte = 'element-trop-long'; return;
            }
            i++;
            courant = coquille();
            if (!vide) courant.classList.add('cv-suite');
            zone().appendChild(courant);
            courant.appendChild(copie);
          }
        });
      });
    }
    verser('principal');
    verser('lateral');

    const total = pages.length;
    pages.forEach((p, n) => {
      const pied = p.querySelector('.cv-pied');
      if (pied && total > 1) pied.textContent = (n + 1) + ' / ' + total;
    });
    article.dataset.pages = total;
    if (total > maxPages) article.dataset.alerte = 'trop-de-pages';
    document.body.dataset.pret = '1';
    return total;
  }

  window.paginerCV = paginer;
  // Les polices doivent être chargées AVANT de mesurer : la source est cachée, le navigateur ne les chargerait pas de lui-même.
  function chargerPolices(article) {
    const fam = getComputedStyle(article).getPropertyValue('--cv-police').trim() || 'Sora';
    return Promise.all([300, 400, 500, 600, 700].map(w => document.fonts.load(w + ' 12px ' + fam).catch(() => null)));
  }
  const go = () => document.querySelectorAll('article.cv').forEach(a => chargerPolices(a).then(() => paginer(a)));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
