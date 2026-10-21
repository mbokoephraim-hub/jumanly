class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const p = this.props || {};
    const has = (k) => Object.prototype.hasOwnProperty.call(st, k);
    const S = (o) => this.setState(o);
    const flash = (t) => { S({ toast: t }); clearTimeout(this._t); this._t = setTimeout(() => this.setState({ toast: null }), 2300); };

    // Cours : mêmes faits que Carrière (Excel le 12 oct., SQL le 18 oct.) et Explorer (Power BI pas encore acquis)
    const L = (t, d, pts, q, reps, bonne, expl) => ({ t, d, pts, q, reps, bonne, expl });
    const C = {
      pbi: { t: 'Power BI : premiers tableaux de bord', court: 'Power BI', ab: 'BI', c: '#B07A12', dom: 'Data', niveau: 'Débutant', duree: '1 h 10', prix: 'Gratuit', fait0: 2, tags: 'power bi tableau de bord data graphique',
        acquis: ['Importer un fichier Excel dans Power BI', 'Choisir le bon graphique pour vos chiffres', 'Construire un tableau de bord des ventes et le partager'],
        lecons: [
          L('Installer et importer un fichier Excel', '6 min', ['Power BI Desktop est gratuit', 'Accueil › Obtenir les données › Excel', 'Vérifiez l’aperçu avant de charger'], 'Où importer un fichier Excel ?', ['Accueil › Obtenir les données', 'Fichier › Imprimer', 'Affichage › Thèmes'], 0, 'On importe toujours depuis Obtenir les données.'),
          L('Nettoyer les données', '9 min', ['Power Query corrige les colonnes', 'Supprimez les lignes vides', 'Le type de chaque colonne compte'], 'Où corrige-t-on une colonne mal typée ?', ['Dans Power Query', 'Dans le visuel', 'Dans le thème'], 0, 'Power Query sert à préparer les données avant le rapport.'),
          L('Votre premier graphique', '7 min', ['Glissez un champ dans l’axe et une valeur', 'Un histogramme compare des catégories', 'Une courbe montre une évolution dans le temps'], 'Quel graphique pour comparer les ventes de 4 boutiques ?', ['Un histogramme groupé', 'Une courbe', 'Une carte'], 0, 'L’histogramme compare des catégories côte à côte. La courbe sert plutôt aux évolutions dans le temps.'),
          L('Des mesures simples', '10 min', ['Une mesure calcule un total à la volée', 'SUM additionne une colonne', 'Nommez vos mesures clairement'], 'Quelle fonction additionne une colonne ?', ['SUM', 'COUNT', 'FILTER'], 0, 'SUM additionne, COUNT compte les lignes.'),
          L('Filtres et segments', '8 min', ['Un segment filtre toute la page', 'Filtrez par ville ou par mois', 'Gardez trois filtres au plus'], 'Qu’est-ce qui filtre toute la page ?', ['Un segment', 'Une info-bulle', 'Un titre'], 0, 'Le segment agit sur tous les visuels de la page.'),
          L('Tableau de bord des ventes', '12 min', ['Un chiffre clé en haut', 'Deux graphiques au plus par ligne', 'Une couleur pour ce qui compte'], 'Combien de chiffres clés en haut ?', ['Un à trois', 'Dix', 'Aucun'], 0, 'Un à trois chiffres clés suffisent à lire la page en 5 secondes.'),
          L('Partager un rapport', '6 min', ['Exportez en PDF pour un e-mail', 'Publiez en ligne pour l’équipe', 'Retirez les données sensibles'], 'Pour un recruteur, quel format ?', ['PDF', 'Fichier .pbix brut', 'Capture floue'], 0, 'Le PDF s’ouvre partout, sans logiciel.'),
          L('Quiz final', '10 min', ['8 questions', '70 % pour obtenir l’attestation', 'Vous pouvez recommencer'], 'Prête pour le quiz final ?', ['Oui, je commence', 'Je révise encore'], 0, 'Courage, vous connaissez déjà tout ce qui sera demandé.')
        ] },
      sql: { t: 'SQL pour l’analyse', court: 'SQL', ab: 'SQL', c: '#0F3F37', dom: 'Data', niveau: 'Débutant', duree: '2 h', prix: 'Gratuit', fini: '18 oct. 2026', score: '88 %', code: 'SQL-GM-1810', tags: 'sql requete join base de donnees data',
        acquis: ['Lire une table avec SELECT', 'Filtrer et trier vos résultats', 'Relier deux tables avec JOIN'],
        lecons: ['SELECT : lire une table', 'WHERE : filtrer', 'ORDER BY : trier', 'GROUP BY : regrouper', 'Fonctions utiles', 'JOIN : relier deux tables', 'LEFT JOIN', 'Sous-requêtes', 'Dates', 'Nettoyer avec SQL', 'Étude de cas : ventes', 'Quiz final'].map((t) => L(t, '10 min', ['Lisez la requête à voix haute', 'Testez sur peu de lignes', 'Nommez vos colonnes'], 'Que fait SELECT ?', ['Lire des colonnes', 'Supprimer une table', 'Créer un compte'], 0, 'SELECT lit des colonnes, sans rien modifier.')) },
      xl: { t: 'Excel pour l’analyse', court: 'Excel', ab: 'XL', c: '#14745F', dom: 'Bureautique', niveau: 'Débutant', duree: '1 h 40', prix: 'Gratuit', fini: '12 oct. 2026', score: '92 %', code: 'XL-GM-1210', tags: 'excel tableur tableau croise bureautique',
        acquis: ['Tableaux croisés dynamiques', 'RECHERCHEX et SI', 'Graphiques propres'],
        lecons: ['Tableaux propres', 'Formules de base', 'SI et RECHERCHEX', 'Tableaux croisés', 'Graphiques', 'Mise en forme', 'Quiz final'].map((t) => L(t, '12 min', ['Une ligne par donnée', 'Des titres clairs', 'Pas de cellules fusionnées'], 'Que résume un tableau croisé ?', ['Des données par catégorie', 'Un texte', 'Une image'], 0, 'Il regroupe et totalise par catégorie.')) },
      ent: { t: 'Réussir son entretien', court: 'Entretien', ab: 'EN', c: '#1E4E79', dom: 'Carrière', niveau: 'Tous niveaux', duree: '45 min', prix: 'Gratuit', tags: 'entretien embauche recrutement oral carriere',
        acquis: ['Se présenter en une minute', 'Répondre avec des exemples chiffrés', 'Poser deux bonnes questions'],
        lecons: ['Se présenter en une minute', 'La méthode STAR', 'Parler de ses chiffres', 'Les questions pièges', 'Vos questions au recruteur', 'Après l’entretien'].map((t) => L(t, '7 min', ['Situation, tâche, action, résultat', 'Un chiffre par exemple', 'Finissez par ce que vous avez appris'], 'Que veut dire le R de STAR ?', ['Résultat', 'Retard', 'Recruteur'], 0, 'R comme résultat : ce que votre action a changé.')) },
      ang: { t: 'Anglais professionnel', court: 'Anglais', ab: 'EN', c: '#4B2D7A', dom: 'Langues', niveau: 'Intermédiaire', duree: '4 h', prix: 'Pro', tags: 'anglais english langue',
        acquis: ['Écrire un e-mail professionnel', 'Se présenter en entretien', 'Comprendre une réunion'], lecons: ['Se présenter', 'E-mails', 'Réunions', 'Entretien en anglais'].map((t) => L(t, '15 min', ['Phrases courtes', 'Vocabulaire du métier', 'Pratiquez à voix haute'], 'Comment commencer un e-mail ?', ['Dear Ms Kalala,', 'Hey', 'Yo'], 0, '« Dear » + nom reste la formule la plus sûre.')) },
      fin: { t: 'Lire un bilan d’entreprise', court: 'Bilan', ab: 'FI', c: '#9A3524', dom: 'Finance', niveau: 'Débutant', duree: '1 h 30', prix: 'Starter', tags: 'finance bilan comptabilite banque credit',
        acquis: ['Actif et passif', 'Compte de résultat', 'Trois ratios utiles'], lecons: ['Actif et passif', 'Compte de résultat', 'Ratios', 'Étude de cas'].map((t) => L(t, '20 min', ['L’actif : ce qu’on possède', 'Le passif : ce qu’on doit', 'Les deux sont égaux'], 'Que trouve-t-on à l’actif ?', ['Ce que l’entreprise possède', 'Ses dettes', 'Ses clients'], 0, 'L’actif liste ce que l’entreprise possède.')) },
      mkt: { t: 'Réseaux sociaux pour les marques', court: 'Réseaux', ab: 'RS', c: '#5B2A22', dom: 'Marketing', niveau: 'Débutant', duree: '1 h', prix: 'Gratuit', tags: 'marketing reseaux sociaux communication community',
        acquis: ['Un calendrier éditorial', 'Mesurer ce qui marche', 'Écrire pour le téléphone'], lecons: ['Choisir ses réseaux', 'Calendrier', 'Écrire court', 'Mesurer'].map((t) => L(t, '15 min', ['Un message par publication', 'Une image forte', 'Publier au bon moment'], 'Que mesurer d’abord ?', ['L’engagement', 'Le nombre de couleurs', 'La police'], 0, 'L’engagement montre si votre public réagit.')) },
      py: { t: 'Python pour débuter', court: 'Python', ab: 'PY', c: '#1F5E6B', dom: 'Data', niveau: 'Débutant', duree: '3 h', prix: 'Starter', tags: 'python programmation data code',
        acquis: ['Variables et listes', 'Lire un fichier CSV', 'Un premier graphique'], lecons: ['Variables', 'Listes', 'Boucles', 'Fichiers CSV', 'Graphiques'].map((t) => L(t, '20 min', ['Testez chaque ligne', 'Nommez bien vos variables', 'Lisez les erreurs'], 'Quel type pour une liste de villes ?', ['Une liste', 'Un nombre', 'Un booléen'], 0, 'Une liste garde plusieurs valeurs dans l’ordre.')) }
    };
    const FORMULE = 'Free';
    const accessible = (k) => C[k].prix === 'Gratuit';
    const prog = st.prog || {};
    const fait = (k) => (C[k].fini ? C[k].lecons.length : (prog[k] ?? C[k].fait0 ?? 0));
    const finis = st.finis || {};
    const estFini = (k) => !!C[k].fini || !!finis[k];
    const enr = st.enr || { ent: true };

    const vue = st.vue ?? p.vue ?? 'accueil';
    const coursK = C[st.cours ?? p.cours] ? (st.cours ?? p.cours) : 'pbi';
    const co0 = C[coursK];
    const nbL = co0.lecons.length;
    const leconN = Math.min(Math.max(Number(st.lecon ?? p.lecon ?? (fait(coursK) + 1)) || 1, 1), nbL);
    const de = st.de || 'accueil';
    const ong = st.ong ?? p.onglet ?? 'pour';
    const fRaw = has('feuille') ? st.feuille : (p.feuille && p.feuille !== 'aucune' ? p.feuille : null);
    const fermer = () => S({ feuille: null });

    const ouvrirCours = (k, from) => () => S({ vue: 'cours', cours: k, de: from || (vue === 'accueil' ? 'accueil' : de), feuille: null, orbi: false, rech: false });
    const ouvrirLecon = (k, n) => () => {
      if (!accessible(k) && n > 1) { S({ vue: 'cours', cours: k, feuille: 'premium' }); return; }
      S({ vue: 'lecon', cours: k, lecon: n, rep: null, lecture: false, feuille: null, orbi: false, rech: false });
    };
    const pct = (k) => Math.round(100 * fait(k) / C[k].lecons.length) + '%';
    const PBG = (k) => (C[k].prix === 'Gratuit' ? { pbg: 'rgba(166,242,107,.14)', pcol: '#A6F26B' } : { pbg: '#2A2140', pcol: '#E4D7FF' });
    const carte = (k) => ({ ...C[k], ...PBG(k), n: String(C[k].lecons.length), ouvrir: ouvrirCours(k) });
    const ligne = (k) => {
      const f = fait(k), n = C[k].lecons.length, fin = estFini(k);
      return { ...C[k], ouvrir: ouvrirCours(k), aBarre: !fin && f > 0, pct: pct(k),
        sous: fin ? 'Attestation obtenue · ' + (C[k].fini || 'aujourd’hui') : (f > 0 ? 'Leçon ' + (f + 1) + ' sur ' + n : n + ' leçons · ' + C[k].duree),
        etat: fin ? 'Terminé' : (f > 0 ? pct(k) : C[k].prix), etatCol: fin ? '#A6F26B' : (f > 0 ? '#F2EDE5' : (C[k].prix === 'Gratuit' ? '#A6F26B' : '#E4D7FF')) };
    };

    // Accueil
    const O = [['pour', 'Pour vous'], ['mes', 'Mes cours'], ['att', 'Attestations']];
    const onglets = O.map(([k, t]) => ({ t, sel: k === ong ? 'true' : 'false', pick: () => S({ ong: k }), fw: k === ong ? '700' : '500', col: k === ong ? '#F2EDE5' : '#8FA39E', on: k === ong ? '1' : '0' }));
    const dom = st.dom || 'tout';
    const chip = (k, t) => { const a = k === dom; return { t, pick: () => S({ dom: k }), bg: a ? '#F2EDE5' : 'transparent', col: a ? '#0B1A1F' : '#F2EDE5', bd: a ? '#F2EDE5' : 'rgba(255,255,255,.28)' }; };
    const chips = [['tout', 'Tout'], ['Data', 'Data'], ['Finance', 'Finance'], ['Marketing', 'Marketing'], ['Langues', 'Langues']].map(([k, t]) => chip(k, t));
    const nonFinis = Object.keys(C).filter((k) => !estFini(k) && k !== 'ent');
    const cartes = nonFinis.filter((k) => dom === 'tout' || C[k].dom === dom).map(carte);
    const pf = fait('pbi');
    const enCoursK = 'pbi';
    const lc = Math.min(pf + 1, C.pbi.lecons.length);
    const enCours = { t: C.pbi.t, l: String(lc), n: String(C.pbi.lecons.length), lt: C.pbi.lecons[lc - 1].t, ld: C.pbi.lecons[lc - 1].d, pct: pct('pbi'), reste: String(C.pbi.lecons.length - pf) };
    const attK = Object.keys(C).filter(estFini);
    const attestations = attK.map((k) => ({ t: C[k].t, date: C[k].fini || 'aujourd’hui', score: C[k].score || '90 %', ouvrir: () => S({ vue: 'attestation', cours: k, nouvelle: false, de: 'accueil' }) }));

    // Recherche : d’abord les options, puis les résultats dès la première lettre
    const aRech = st.rech ?? (p.recherche === 'options' || p.recherche === 'texte');
    const fq = st.fq ?? (p.recherche === 'texte' ? 'p' : '');
    const q = fq.trim().toLowerCase();
    const ft = st.ft || 'tout';
    const fchip = (k, t) => { const a = k === ft; return { t, pick: () => S({ ft: k }), bg: a ? '#F2EDE5' : 'transparent', col: a ? '#0B1A1F' : '#F2EDE5', bd: a ? '#F2EDE5' : 'rgba(255,255,255,.28)' }; };
    const fTypes = [['tout', 'Tout'], ['cours', 'Cours'], ['lecons', 'Leçons'], ['att', 'Attestations']].map(([k, t]) => fchip(k, t));
    const sans = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const hit = (x) => sans(x).includes(sans(q));
    const resCours = q && (ft === 'tout' || ft === 'cours') ? Object.keys(C).filter((k) => hit(C[k].t) || hit(C[k].tags) || hit(C[k].dom)).map(ligne) : [];
    const resLecons = [];
    if (q && (ft === 'tout' || ft === 'lecons')) Object.keys(C).forEach((k) => C[k].lecons.forEach((l, i) => { if (hit(l.t) && resLecons.length < 5) resLecons.push({ t: l.t, d: l.d, cours: C[k].court, c: C[k].c, num: String(i + 1), ouvrir: ouvrirLecon(k, i + 1) }); }));
    const resAtt = q && (ft === 'tout' || ft === 'att') ? attestations.filter((a) => hit(a.t) || hit('attestation')) : [];
    const setQ = (t) => () => S({ fq: t, rech: true });

    // Détail du cours
    const fc = fait(coursK);
    const co = {
      ...co0, ...PBG(coursK), n: String(nbL), fait: String(fc), pct: pct(coursK), aBarre: fc > 0 && !estFini(coursK), aAtt: estFini(coursK), date: co0.fini || 'aujourd’hui',
      ec: enr[coursK] ? '#A6F26B' : '#F2EDE5', et: enr[coursK] ? 'Enregistré' : 'Enregistrer',
      cta: estFini(coursK) ? 'Revoir le cours' : (!accessible(coursK) ? 'Débloquer avec ' + co0.prix : (fc > 0 ? 'Reprendre la leçon ' + (fc + 1) : 'Commencer'))
    };
    const lecons = co0.lecons.map((l, i) => {
      const n = i + 1, ok = n <= fc, cur = n === fc + 1 && !estFini(coursK), verrou = !accessible(coursK) && n > 1;
      return { t: l.t, d: l.d + (verrou ? ' · ' + co0.prix : ''), sym: ok ? '✓' : (verrou ? '·' : String(n)), bd: ok ? '#A6F26B' : (cur ? '#F2EDE5' : 'rgba(255,255,255,.2)'), bg: ok ? '#A6F26B' : 'transparent', col: ok ? '#0B1A1F' : '#F2EDE5',
        fw: cur ? '700' : '500', tc: verrou ? '#8FA39E' : '#F2EDE5', etat: cur ? 'En cours' : '', ouvrir: ouvrirLecon(coursK, n) };
    });
    const commencer = () => {
      if (!accessible(coursK)) { S({ feuille: 'premium' }); return; }
      ouvrirLecon(coursK, estFini(coursK) ? 1 : Math.min(fc + 1, nbL))();
    };

    // Leçon
    const lo = co0.lecons[leconN - 1];
    const rep = has('rep') ? st.rep : (Number(p.reponse) >= 0 ? Number(p.reponse) : null);
    const repondu = rep !== null && rep !== undefined;
    const juste = repondu && rep === lo.bonne;
    const reponses = lo.reps.map((t, i) => {
      const choisi = repondu && rep === i, bon = repondu && i === lo.bonne;
      return { t, pick: () => S({ rep: i }), sym: bon ? '✓' : (choisi ? '×' : ''), bg: bon ? 'rgba(166,242,107,.12)' : (choisi ? 'rgba(255,138,122,.1)' : '#13282C'), bd: bon ? '#A6F26B' : (choisi ? '#FF8A7A' : 'rgba(255,255,255,.1)'), col: bon ? '#A6F26B' : (choisi ? '#FF8A7A' : '#F2EDE5') };
    });
    const lecture = !!st.lecture;
    const dernier = leconN === nbL;
    const le = { num: String(leconN), t: lo.t, d: lo.d, points: lo.pts, q: lo.q, aPrec: leconN > 1, pctCours: Math.round(100 * Math.max(fc, leconN - 1) / nbL) + '%',
      lireLab: lecture ? 'Mettre en pause' : 'Lire la vidéo', playOp: lecture ? '0' : '1', temps: lecture ? '2:14' : '0:00', pctVideo: lecture ? '34%' : '0%', duree: lo.d.replace(' min', ':00') };
    const marquer = (n) => ({ ...prog, [coursK]: Math.max(fait(coursK), n) });
    const suivante = () => {
      if (!repondu) { flash('Répondez à la question rapide pour continuer.'); return; }
      if (dernier) {
        S({ prog: marquer(nbL), finis: { ...finis, [coursK]: true }, vue: 'attestation', nouvelle: true, de: 'cours', rep: null });
        return;
      }
      S({ prog: marquer(leconN), lecon: leconN + 1, rep: null, lecture: false });
      flash('Leçon ' + leconN + ' terminée');
    };

    // Attestation
    const at = { t: co0.t, date: co0.fini || '21 oct. 2026', score: co0.score || '90 %', code: co0.code || (co0.ab + '-GM-2110') };
    const nouvelle = has('nouvelle') ? st.nouvelle : !!p.nouvelle;
    const auProfil = st.auProfil || {};
    const dejaProfil = !!co0.fini || !!auProfil[coursK];

    // Feuilles
    const menuCours = [
      { t: 'Partager le cours', s: 'Lien, WhatsApp ou QR code', col: '#F2EDE5', go: () => { fermer(); flash('Lien du cours copié'); } },
      { t: enr[coursK] ? 'Retirer des enregistrés' : 'Enregistrer', s: 'À retrouver dans Mes cours', col: '#F2EDE5', go: () => { S({ enr: { ...enr, [coursK]: !enr[coursK] }, feuille: null }); flash(enr[coursK] ? 'Cours retiré' : 'Cours enregistré'); } },
      { t: 'Signaler un problème', s: 'Vidéo, texte ou question', col: '#FF8A7A', go: () => { fermer(); flash('Merci, l’équipe Formation corrige sous 48 h.'); } }
    ];
    const vit = st.vit || 1;
    const menuLecon = [
      { t: 'Vitesse de lecture : ' + String(vit).replace('.', ',') + ' ×', s: 'Touchez pour changer', col: '#F2EDE5', go: () => S({ vit: vit === 1 ? 1.25 : (vit === 1.25 ? 1.5 : 1) }) },
      { t: st.stt === false ? 'Sous-titres désactivés' : 'Sous-titres en français', s: 'Touchez pour changer', col: '#F2EDE5', go: () => S({ stt: st.stt === false }) },
      { t: 'Signaler un problème', s: 'Vidéo, texte ou question', col: '#FF8A7A', go: () => { fermer(); flash('Merci, l’équipe Formation corrige sous 48 h.'); } }
    ];

    // Orbi
    const oRaw = has('oRep') ? st.oRep : (p.orbiRep && p.orbiRep !== 'aucune' ? p.orbiRep : null);
    const OR = {
      pourquoi: { q: 'Pourquoi Power BI ?', t: 'Baobab Fintech le demande pour le poste d’analyste de données junior, et 3 autres de vos offres aussi. Avec l’attestation, votre score passe de 86 % à 93 %.', actT: 'Reprendre Power BI', act: ouvrirLecon('pbi', lc) },
      entretien: { q: 'Réviser pour l’entretien de jeudi', t: 'Entretien jeudi 22 octobre à 10 h avec Nadia Kalala. Je vous propose la leçon « La méthode STAR » (7 min), puis une répétition des questions probables.', actT: 'Ouvrir la leçon STAR', act: ouvrirLecon('ent', 2) },
      sql: { q: 'Fais-moi réviser SQL', t: 'Trois questions sur JOIN et GROUP BY, comme dans l’exercice de 45 minutes de Baobab Fintech.', actT: 'Revoir le cours SQL', act: ouvrirCours('sql') },
      temps: { q: 'Combien de temps pour finir Power BI ?', t: 'Il vous reste ' + (C.pbi.lecons.length - pf) + ' leçons, environ 55 minutes. À 10 minutes par jour, vous finissez lundi.', actT: 'Voir le programme', act: ouvrirCours('pbi') },
      expliquer: { q: 'Expliquer autrement : ' + lo.t, t: lo.expl + ' Exemple : les ventes de Gombe, Lingwala, Limete et Ngaliema côte à côte.', actT: 'Revenir à la question', act: () => S({ orbi: false, oRep: null }) },
      libre: { q: st.oqEnv || '', t: 'Voici les cours qui en parlent. Je les ai mis dans la recherche.', actT: 'Voir les résultats', act: () => S({ orbi: false, oRep: null, vue: 'accueil', rech: true, fq: st.oqEnv || '' }) }
    };
    const rr = oRaw && OR[oRaw];
    const ra = rr ? { q: rr.q, t: rr.t, actT: rr.actT || '', aBtn: !!rr.act, aLien: false, href: '#', act: rr.act || (() => {}) } : { q: '', t: '', actT: '', aBtn: false, aLien: false, href: '#', act: () => {} };
    const orbi = st.orbi ?? p.orbi ?? false;
    const oq = st.oq || '';

    const ICO = {
      fil: 'M4 6h16M4 12h16M4 18h10',
      explorer: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM15.5 8.5l-2 5-5 2 2-5z',
      carriere: 'M3.5 8.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3.5 12.5h17M12 11.5v2',
      formation: 'M2.5 9 12 4.5 21.5 9 12 13.5zM6.5 11.2v4.6c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.6',
      messages: 'M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5z'
    };
    const HREF = { fil: 'Fil.dc.html', explorer: 'Offres.dc.html', carriere: 'Carriere.dc.html', formation: 'Formation.dc.html', messages: 'Messages.dc.html' };
    const nav = [['fil', 'Fil'], ['explorer', 'Explorer'], ['carriere', 'Carrière'], ['formation', 'Formation'], ['messages', 'Messages']]
      .map(([k, t]) => ({ t, d: ICO[k], href: HREF[k], c: k === 'formation' ? '#A6F26B' : '#8FA39E', sw: k === 'formation' ? '2.1' : '1.7', dot: k === 'formation' ? '1' : '0' }));

    return {
      vAccueil: vue === 'accueil', vCours: vue === 'cours', vLecon: vue === 'lecon', vAtt: vue === 'attestation',
      nav, onglets, oPour: ong === 'pour', oMes: ong === 'mes', oAtt: ong === 'att',
      enCours, reprendre: ouvrirLecon(enCoursK, lc), chips, cartes,
      toutVoir: () => S({ rech: true, ft: 'cours', fq: '' }),
      ouvrirEntretien: ouvrirCours('ent'),
      mesEnCours: Object.keys(C).filter((k) => !estFini(k) && fait(k) > 0).map(ligne),
      mesFinis: attK.map(ligne),
      mesEnr: Object.keys(C).filter((k) => enr[k]).map(ligne), sansEnr: !Object.keys(C).some((k) => enr[k]),
      attestations, attTitre: attestations.length + ' attestations obtenues',
      // recherche
      aRech, sansRech: !aRech, fq, aFq: !!q, fTypes, fVide: !q, fPlein: !!q,
      chercher: (e) => S({ fq: e && e.target ? e.target.value : '', rech: true }), focusRech: () => { if (!aRech) S({ rech: true }); },
      viderFq: () => S({ fq: '' }), annulerRech: () => S({ rech: false, fq: '', ft: 'tout' }),
      recents: [['Power BI', 'hier'], ['Entretien', 'lun.'], ['Tableau croisé', '12 oct.']].map(([t, d]) => ({ t, d, pick: setQ(t) })),
      populaires: ['Power BI', 'SQL', 'Anglais', 'Python', 'Excel'].map((t) => ({ t, pick: setQ(t) })),
      resCours, resLecons, resAtt, nCours: String(resCours.length), nLecons: String(resLecons.length), nAtt: String(resAtt.length),
      rCours: resCours.length > 0, rLecons: resLecons.length > 0, rAtt: resAtt.length > 0, rRien: !!q && !resCours.length && !resLecons.length && !resAtt.length,
      demanderOrbi: () => S({ orbi: true, oRep: 'libre', oqEnv: fq }),
      // cours
      co, lecons, commencer, retour: () => S({ vue: 'accueil', feuille: null }), retourT: 'Formation',
      enregistrer: () => { S({ enr: { ...enr, [coursK]: !enr[coursK] } }); flash(enr[coursK] ? 'Cours retiré de Mes cours' : 'Cours enregistré dans Mes cours'); },
      voirAttCours: () => S({ vue: 'attestation', nouvelle: false, de: 'cours' }),
      // leçon
      le, reponses, aFeedback: repondu, feedback: juste ? 'Bonne réponse. ' + lo.expl : 'Pas tout à fait. ' + lo.expl, fbCol: juste ? '#A6F26B' : '#FFB4A8',
      lire: () => S({ lecture: !lecture }), retourCours: () => S({ vue: 'cours', feuille: null }),
      precedente: () => S({ lecon: leconN - 1, rep: null, lecture: false }),
      suivante, suivT: dernier ? 'Terminer le cours' : 'Leçon suivante', suivOp: repondu ? '1' : '.5',
      orbiExpliquer: () => S({ orbi: true, oRep: 'expliquer' }),
      // attestation
      at, attNouvelle: !!nouvelle, attRetourT: de === 'cours' || nouvelle ? co0.court : 'Formation',
      retourAtt: () => S({ vue: nouvelle ? 'accueil' : (de === 'cours' ? 'cours' : 'accueil'), ong: nouvelle ? 'att' : ong, nouvelle: false }),
      retourAccueil: () => S({ vue: 'accueil', ong: 'pour', nouvelle: false }),
      ajouterProfil: () => { if (dejaProfil) { flash('Déjà visible sur votre profil'); return; } S({ auProfil: { ...auProfil, [coursK]: true } }); flash('Ajoutée à votre profil dans Carrière'); },
      profilT: dejaProfil ? 'Sur votre profil ✓' : 'Ajouter à mon profil', profilOp: dejaProfil ? '.6' : '1',
      telecharger: () => flash('Attestation_' + co0.court.replace(/\s/g, '_') + '.pdf téléchargée'),
      // feuilles
      fMenu: fRaw === 'menu' || fRaw === 'menuLecon', fPremium: fRaw === 'premium', fermer,
      menu: fRaw === 'menuLecon' ? menuLecon : menuCours, menuTitre: fRaw === 'menuLecon' ? 'Leçon ' + leconN + ' · ' + lo.t : co0.t,
      ouvrirMenu: () => S({ feuille: 'menu' }), ouvrirMenuLecon: () => S({ feuille: 'menuLecon' }),
      premiumD: 'Vous êtes en ' + FORMULE + '. La formule ' + co0.prix + ' débloque ce cours et ' + (co0.prix === 'Pro' ? 'tous les cours de langue' : 'les cours de finance et de Python') + '. Paiement par Mobile Money, sans engagement.',
      essaiLecon: () => S({ feuille: null, vue: 'lecon', lecon: 1, rep: null, lecture: false }),
      // Orbi
      orbi, fab: vue === 'accueil' && !aRech && !orbi && !fRaw,
      ouvrirOrbi: () => S({ orbi: true, oRep: null }), orbiEntretien: () => S({ orbi: true, oRep: 'entretien' }), orbiPourquoi: () => S({ orbi: true, oRep: 'pourquoi' }),
      fermerOrbi: () => S({ orbi: false, oRep: null }), autresQ: () => S({ oRep: null }),
      orbiTitre: rr ? 'Orbi' : 'Bonjour Grâce', aRep: !!rr, sansRep: !rr, ra,
      questions: ['pourquoi', 'entretien', 'sql', 'temps'].map((k) => ({ t: OR[k].q, go: () => S({ oRep: k }) })),
      oq, ecrireOrbi: (e) => S({ oq: e && e.target ? e.target.value : '' }),
      envoyerOrbi: () => { if (!oq.trim()) { flash('Écrivez votre question à Orbi.'); return; } S({ oRep: 'libre', oqEnv: oq.trim(), oq: '' }); },
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}
