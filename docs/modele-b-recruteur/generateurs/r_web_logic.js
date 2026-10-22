class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
    // Modèle B recruteur sur ordinateur et tablette : une seule appli, navigation par l’état (aucun clic vide).
    const tab = oui(p.tablette);
    const vue = prop('vue', 'candidatures');
    const go = (v, extra) => () => S({ vue: v, rOpen: false, notifOpen: false, orbiOpen: false, ...(extra || {}) });

    // ---------- Matching (partie 08) : 8 critères fixes, poids sur 100 ----------
    const CRIT = [['Compétences requises', 35], ['Compétences souhaitées', 10], ['Expérience', 15], ['Formation', 10], ['Langues', 10], ['Lieu', 10], ['Contrat', 5], ['Proximité du profil', 5]];
    const score = (v) => Math.round(v.reduce((a, x, i) => a + x * CRIT[i][1], 0));

    const OFFRES = [
      { k: 'analyste', t: 'Analyste de données junior', lieu: 'Kinshasa · CDI', cand: 38, nouv: 6, statut: 'En ligne', d: '16 oct.', vues: 412 },
      { k: 'clientele', t: 'Chargé·e de clientèle Mobile Money', lieu: 'Lubumbashi · CDI', cand: 52, nouv: 4, statut: 'En ligne', d: '9 oct.', vues: 680 },
      { k: 'flutter', t: 'Développeur·se mobile Flutter', lieu: 'Kinshasa · télétravail', cand: 9, nouv: 3, statut: 'En ligne', d: '19 oct.', vues: 233 },
      { k: 'marketing', t: 'Stagiaire marketing digital', lieu: 'Kinshasa · Stage', cand: 71, nouv: 0, statut: 'En pause', d: '2 oct.', vues: 1104 }
    ];
    const ETAPES = [['nouvelles', 'Nouvelles'], ['preselection', 'Présélection'], ['entretien', 'Entretien'], ['proposition', 'Proposition'], ['decision', 'Décision']];
    const C0 = [
      ['grace', 'Grâce Mbuyi', 'GM', '#E3E8FB', '#2D3F8A', 'analyste', 'entretien', [1, 0.8, 1, 1, 1, 1, 0.5, 0.9], ['Power BI et SQL vérifiés', '2 tableaux de bord publiés'], ['Travail en équipe produit'], 'Entretien demain à 10 h'],
      ['benjamin', 'Benjamin Tshibangu', 'BT', '#F9E3C8', '#8A4B12', 'analyste', 'proposition', [0.9, 0.8, 0.9, 1, 1, 1, 1, 0.8], ['Python vérifié', 'Disponible le 9 novembre'], ['Prétentions salariales'], 'Proposition envoyée lundi'],
      ['esther', 'Esther Kabila', 'EK', '#FBE3EF', '#8A2D5C', 'analyste', 'nouvelles', [0.85, 0.7, 0.8, 1, 1, 1, 0.5, 0.8], ['Excel avancé vérifié', 'Stage data chez Kivu Data Lab'], ['SQL déclaré, non vérifié'], 'il y a 2 h'],
      ['didier', 'Didier Lukusa', 'DL', '#E8F0D8', '#4F6B12', 'analyste', 'preselection', [0.8, 0.6, 0.8, 1, 1, 1, 0.5, 0.7], ['Statistiques', 'Anglais courant'], ['Power BI à vérifier'], 'Évalué 4 étoiles par Aline'],
      ['amani', 'Amani Kahindo', 'AK', '#DDF6EE', '#14745F', 'analyste', 'nouvelles', [0.7, 0.5, 0.7, 1, 0.5, 1, 0.5, 0.6], ['Excel', 'Motivée par la fintech'], ['Peu d’expérience', 'Anglais à vérifier'], 'hier'],
      ['chris', 'Chris Ngoy', 'CN', '#EDE3FB', '#5A2D8A', 'analyste', 'nouvelles', [0.6, 0.4, 0.6, 0.8, 1, 1, 0.5, 0.5], ['Volonté d’apprendre'], ['Compétences requises partielles'], 'hier'],
      ['moussa', 'Moussa Diallo', 'MD', '#E3E8FB', '#2D3F8A', 'flutter', 'preselection', [1, 0.8, 0.8, 1, 1, 1, 0.5, 0.8], ['Flutter et Dart vérifiés', '3 applis publiées'], ['Préavis d’un mois'], 'il y a 3 h'],
      ['kevin', 'Kevin Lumbala', 'KL', '#F9E3C8', '#8A4B12', 'flutter', 'nouvelles', [0.6, 0.4, 0.5, 1, 1, 1, 1, 0.5], ['Disponible tout de suite'], ['Débute en Flutter'], 'aujourd’hui'],
      ['nathan', 'Nathan Ilunga', 'NI', '#DDF6EE', '#14745F', 'clientele', 'entretien', [0.9, 0.7, 0.8, 1, 1, 1, 1, 0.8], ['Swahili et français', '3 ans en agence'], ['Horaires du samedi'], 'Entretien jeudi'],
      ['ruth', 'Ruth Kalenga', 'RK', '#FBE3EF', '#8A2D5C', 'clientele', 'nouvelles', [0.8, 0.6, 0.6, 1, 1, 1, 1, 0.7], ['Mobile Money au quotidien'], ['Expérience courte'], 'il y a 5 h']
    ];
    const etapes = st.etapes || {};
    const nonRet = st.nonRet || {};
    const CANDS = C0.map(([k, nom, ini, bg, fg, of, et, v, forts, verif, d]) => { const s = score(v); const b = bande(s); return { k, nom, ini, bg, fg, of, et: nonRet[k] ? 'decision' : (etapes[k] || et), v, s, sT: s + ' %', bT: b[0], sbg: b[2], scol: b[1], forts: forts.map((t) => ({ t })), verif: verif.map((t) => ({ t })), d, nr: !!nonRet[k], ouvrir: go('candidat', { candK: k }) }; });
    const ofK = prop('offre', 'analyste');
    const offreSel = OFFRES.find((o) => o.k === ofK) || OFFRES[0];
    const colonnes = ETAPES.map(([ek, et]) => { const items = CANDS.filter((c) => c.of === offreSel.k && c.et === ek).sort((a, b) => b.s - a.s); return { t: et, n: String(items.length), items, vide: items.length === 0 }; });
    const ofPills = OFFRES.filter((o) => o.statut === 'En ligne').map((o) => ({ t: o.t, pick: () => S({ offre: o.k }), bg: o.k === offreSel.k ? '#F2EDE5' : 'transparent', col: o.k === offreSel.k ? '#0B1A1F' : '#F2EDE5', bd: o.k === offreSel.k ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));
    const cK = prop('candK', 'grace');
    const c = CANDS.find((x) => x.k === cK) || CANDS[0];
    const cOffre = OFFRES.find((o) => o.k === c.of);
    const iEt = ETAPES.findIndex((e) => e[0] === c.et);
    const pourquoi = CRIT.map(([t, w], i) => ({ t, w: w + ' pts', pts: String(Math.round(c.v[i] * w)), pct: Math.round(c.v[i] * 100) + '%' }));
    const timeline = ETAPES.map(([ek, et], i) => ({ t: et, fait: i <= iEt, col: i <= iEt ? '#A6F26B' : '#2A3B3E', fw: i === iEt ? '700' : '500' }));

    // ---------- Talents ----------
    const T0 = [
      ['rachel', 'Rachel Kanku', 'RK', '#DDF6EE', '#14745F', 'Analyste de données · 3 ans', 'Goma', [1, 0.9, 0.9, 1, 1, 0.8, 1, 0.7], true],
      ['cedric', 'Cédric Mpoyi', 'CM', '#E3E8FB', '#2D3F8A', 'Développeur Flutter · 4 ans', 'Kinshasa', [0.5, 0.4, 0.9, 1, 1, 1, 1, 0.5], false],
      ['nathalie', 'Nathalie Banza', 'NB', '#FBE3EF', '#8A2D5C', 'Conseillère clientèle · 5 ans', 'Lubumbashi', [0.4, 0.3, 1, 0.8, 1, 0.5, 1, 0.4], true],
      ['joel', 'Joël Kabeya', 'JK', '#E8F0D8', '#4F6B12', 'Community manager · 2 ans', 'Kinshasa', [0.3, 0.5, 0.6, 0.8, 1, 1, 1, 0.4], false],
      ['prince', 'Prince Kalonji', 'PK', '#F9E3C8', '#8A4B12', 'Étudiant en data · cherche un stage', 'Kinshasa', [0.7, 0.6, 0.3, 0.8, 1, 1, 0.5, 0.7], true],
      ['gloria', 'Gloria Ndaya', 'GN', '#EDE3FB', '#5A2D8A', 'Analyste crédit · 3 ans', 'Kinshasa', [0.8, 0.7, 0.9, 1, 1, 1, 1, 0.8], false],
      ['patience', 'Patience Mbala', 'PM', '#DDF6EE', '#14745F', 'Data analyst · 1 an', 'Kinshasa', [0.8, 0.5, 0.6, 1, 1, 1, 1, 0.7], false],
      ['samuel', 'Samuel Kasongo', 'SK', '#E3E8FB', '#2D3F8A', 'Statisticien · 6 ans', 'Matadi', [0.9, 0.6, 1, 1, 1, 0.5, 1, 0.8], false]
    ];
    const rel = st.rel || { joel: 'relation', nathalie: 'relation', christelle: 'relation' };
    const recues = (st.recues || ['prince', 'tresor']).filter((k) => !rel[k]);
    const vivier = st.vivier || ['rachel', 'gloria'];
    const propos = st.propos || { rachel: 'Envoyée lundi' };
    const relB = (k, nom) => { const e = rel[k] || ''; return { bt: e === 'relation' ? 'Relation' : e === 'attente' ? 'En attente' : 'Se connecter', bbg: e ? 'transparent' : '#A6F26B', bcol: e ? '#B9CBC6' : '#0B1A1F', bbd: e ? 'rgba(255,255,255,.22)' : '#A6F26B',
      connecter: () => { if (e === 'relation') return; S({ rel: { ...rel, [k]: e === 'attente' ? undefined : 'attente' } }); if (!e) flash('Invitation envoyée à ' + nom.split(' ')[0]); } }; };
    const TAL = T0.map(([k, nom, ini, bg, fg, titre, ville, v, cap]) => { const s = score(v); const b = bande(s); return { k, nom, ini, bg, fg, titre, ville, v, cap, s, sT: s + ' %', bT: b[0], sbg: b[2], scol: b[1], ...relB(k, nom), ouvrir: () => S({ talK: k }), sel: false, bord: 'transparent' }; }).sort((a, b) => b.s - a.s);
    const talK = prop('talK', 'rachel');
    TAL.forEach((t) => { t.sel = t.k === talK; t.bord = t.sel ? '#A6F26B' : 'transparent'; });
    const tal = TAL.find((t) => t.k === talK) || TAL[0];
    const talPourquoi = CRIT.map(([t, w], i) => ({ t, pts: String(Math.round(tal.v[i] * w)), w: w + ' pts', pct: Math.round(tal.v[i] * 100) + '%' }));
    const sousT = prop('sousT', 'decouvrir');
    const tq = st.tq ?? '';
    const talF = TAL.filter((t) => !tq || norm(t.nom + ' ' + t.titre + ' ' + t.ville).includes(norm(tq)));
    const AUTRES = { christelle: ['Christelle Mwamba', 'CM', '#1E4E79', '#FFFFFF', 'Recruteuse · Fleuve Banque'], tresor: ['Trésor Banza', 'TB', '#4B2D7A', '#FFFFFF', 'Responsable RH · Kivu Data Lab'], ornella: ['Ornella Kazadi', 'OK', '#B07A12', '#FFFFFF', 'Chargée RH · Mwinda Énergie'] };
    const pers = (k) => { if (AUTRES[k]) { const a = AUTRES[k]; return { k, nom: a[0], ini: a[1], bg: a[2], fg: a[3], s: a[4], ...relB(k, a[0]) }; } const t = TAL.find((x) => x.k === k); return { k, nom: t.nom, ini: t.ini, bg: t.bg, fg: t.fg, s: t.titre, ...relB(k, t.nom) }; };
    const invitations = recues.map((k) => ({ ...pers(k), accepter: () => { S({ rel: { ...rel, [k]: 'relation' } }); flash(pers(k).nom.split(' ')[0] + ' fait partie de vos relations'); }, ignorer: () => S({ recues: recues.filter((x) => x !== k) }) }));
    const aConnaitre = ['ornella', 'gloria', 'cedric', 'samuel'].filter((k) => rel[k] !== 'relation').map(pers);
    const relations = Object.keys(rel).filter((k) => rel[k] === 'relation').map(pers);

    // ---------- Messages ----------
    const CONV0 = [
      ['benjamin', 'Benjamin Tshibangu', 'BT', '#F9E3C8', '#8A4B12', 'Candidat · Analyste', 'cand', [['lui', 'Bonjour Nadia, merci pour la proposition. Serait-il possible de commencer le 9 novembre ?', '8 h 40']]],
      ['grace', 'Grâce Mbuyi', 'GM', '#E3E8FB', '#2D3F8A', 'Candidate · Analyste', 'cand', [['moi', 'Bonjour Grâce, votre entretien est confirmé demain à 10 h, en visio avec Aline Mukeba.', 'hier'], ['lui', 'Merci, j’y serai.', 'hier']]],
      ['joel', 'Joël Kabeya', 'JK', '#E8F0D8', '#4F6B12', 'Relation · Community manager', 'reseau', [['lui', 'J’ai bien envoyé ma candidature au stage marketing.', 'lundi']]],
      ['christelle', 'Christelle Mwamba', 'CM', '#1E4E79', '#FFFFFF', 'Relation · Recruteuse, Fleuve Banque', 'reseau', [['lui', 'On organise une journée carrière commune en novembre ?', 'mardi']]],
      ['equipe', 'Équipe Baobab', 'BF', '#14745F', '#FFFFFF', 'Équipe · 4 personnes', 'equipe', [['lui', 'Aline : j’ai évalué Didier, 4 étoiles.', 'hier']]]
    ];
    const ajouts = st.ajouts || {};
    const mF = prop('mF', 'tout');
    const convK = prop('convK', 'benjamin');
    const CONV = CONV0.filter((x) => mF === 'tout' || x[6] === mF).map(([k, nom, ini, bg, fg, s, cat, msgs]) => { const tout = msgs.concat(ajouts[k] || []); const der = tout[tout.length - 1]; return { k, nom, ini, bg, fg, s, dernier: der[1], d: der[2], sel: k === convK, fond: k === convK ? '#13282C' : 'transparent', ouvrir: () => S({ convK: k }) }; });
    const conv = CONV0.find((x) => x[0] === convK) || CONV0[0];
    const fil = conv[7].concat(ajouts[conv[0]] || []).map(([qui, t, d]) => ({ t, d, moi: qui === 'moi', lui: qui !== 'moi' }));
    const brouillon = st.br ?? '';
    const mPills = pills([['tout', 'Tout'], ['cand', 'Candidats'], ['reseau', 'Réseau'], ['equipe', 'Équipe']], mF, 'mF');

    // ---------- Fil ----------
    const MAXC = 220;
    const pub = st.pub ?? '';
    const auNom = st.auNom || 'nadia';
    const aime = st.aime || {};
    const mesPubs = st.mesPubs || [];
    const P0 = [
      ['rachel', 'Rachel Kanku', 'RK', '#DDF6EE', '#14745F', 'Analyste de données · Goma', 'J’ai terminé mon tableau de bord des ventes pour une coopérative de Goma : 12 indicateurs, mis à jour chaque semaine.', 'il y a 2 h', 48, 6],
      ['fleuve', 'Fleuve Banque', 'FB', '#1E4E79', '#FFFFFF', 'Entreprise · Banque', 'Nous recrutons 5 analystes crédit à Kinshasa. Candidature gratuite sur Jumanly.', 'aujourd’hui', 132, 14],
      ['christelle', 'Christelle Mwamba', 'CM', '#1E4E79', '#FFFFFF', 'Recruteuse · Fleuve Banque', 'Trois questions que je pose à chaque entretien d’analyste, et pourquoi.', 'hier', 76, 9]
    ];
    const posts = mesPubs.concat(P0.map(([k, nom, ini, bg, fg, s, t, d, n, com]) => ({ k, nom, ini, bg, fg, s, t, d, n, com }))).map((x) => ({ ...x, nT: String(x.n + (aime[x.k] ? 1 : 0)), coeur: aime[x.k] ? '#A6F26B' : '#B9CBC6', aimer: () => S({ aime: { ...aime, [x.k]: !aime[x.k] } }), commenter: () => flash('Les commentaires s’ouvrent sous la publication'), estEnt: x.k === 'fleuve', ouvrirEnt: go('entreprise') }));
    const nCar = pub.length;

    // ---------- Entreprise (Fleuve Banque) ----------
    const MB = [['christelle', 'Christelle Mwamba', 'CM', '#1E4E79', '#FFFFFF', 'Recruteuse', true], ['nathalie', 'Nathalie Banza', 'NB', '#FBE3EF', '#8A2D5C', 'Conseillère clientèle', true], ['gloria', 'Gloria Ndaya', 'GN', '#EDE3FB', '#5A2D8A', 'Analyste crédit', false], ['didierm', 'Didier Mbala', 'DM', '#2A3B3E', '#F2EDE5', 'Directeur des risques', true], ['sarah', 'Sarah Lukusa', 'SL', '#2A3B3E', '#F2EDE5', 'Chargée de conformité', false]];
    const env = st.env ?? 4;
    const membres = MB.map(([k, nom, ini, bg, fg, r, conf]) => ({ k, nom, ini, bg, fg, r, confT: conf ? 'Confirmé par Fleuve Banque' : 'Indiqué par la personne', confCol: conf ? '#A6F26B' : '#8FA39E', ...relB(k, nom), duRes: k === 'christelle' || k === 'nathalie' }));
    const aInv = membres.filter((m) => !rel[m.k]);
    const eOng = prop('eOng', 'membres');
    const followE = !!st.followE;

    // ---------- Compte ----------
    const cV = prop('cV', 'profil');
    const cMenu = [['profil', 'Mon profil'], ['bascule', 'Changer de profil'], ['equipe', 'Équipe de recrutement'], ['formule', 'Formule et usage'], ['confid', 'Confidentialité et données'], ['modeles', 'Modèles de messages']].map(([k, t]) => ({ t, go: () => S({ cV: k }), bg: k === cV ? '#13282C' : 'transparent', fw: k === cV ? '700' : '500' }));
    const recrute = st.recrute ?? true;

    // ---------- Recherche en deux temps ----------
    const rq = st.rq ?? '';
    const rOpen = !!st.rOpen;
    const SC = { candidatures: 'candidats', candidat: 'candidats', offres: 'offres', talents: 'talents', messages: 'conversations', fil: 'publications et personnes', entreprise: 'membres', compte: 'réglages' };
    const res = !rq.trim() ? [] : [
      ...CANDS.filter((x) => norm(x.nom).includes(norm(rq))).map((x) => ({ t: x.nom, s: 'Candidat·e · ' + OFFRES.find((o) => o.k === x.of).t, go: go('candidat', { candK: x.k, rq: '' }) })),
      ...TAL.filter((x) => norm(x.nom + ' ' + x.titre).includes(norm(rq))).map((x) => ({ t: x.nom, s: 'Talent · ' + x.titre, go: go('talents', { talK: x.k, sousT: 'decouvrir', rq: '' }) })),
      ...OFFRES.filter((x) => norm(x.t).includes(norm(rq))).map((x) => ({ t: x.t, s: 'Offre · ' + x.cand + ' candidatures', go: go('candidatures', { offre: x.k, rq: '' }) }))
    ].slice(0, 6);
    const SUGG = { candidatures: ['Grâce', 'Moussa', 'Flutter'], candidat: ['Esther', 'Didier', 'Analyste'], offres: ['Analyste', 'Clientèle', 'Stage'], talents: ['data', 'Kinshasa', 'Flutter'], messages: ['Benjamin', 'Christelle'], fil: ['Rachel', 'Fleuve'], entreprise: ['Gloria', 'Christelle'], compte: ['Rachel', 'Grâce'] };

    // ---------- Orbi (panneau de droite, ou flottant sur tablette) ----------
    const OQ = {
      candidatures: [['Qui recevoir en premier ?', 'Grâce Mbuyi (' + CANDS.find((x) => x.k === 'grace').s + ' %) est en entretien demain. Parmi les nouvelles, Esther Kabila couvre Excel et la data mais SQL reste à vérifier. Je classe, vous décidez : personne n’est écarté.'], ['Que répondre aux non retenus ?', 'Un message bienveillant qui donne une raison et une piste. Le modèle « Non retenu, avec conseil » est prêt dans vos modèles.']],
      candidat: [['Que vérifier en entretien ?', 'Pour ' + c.nom + ' : ' + c.verif.map((x) => x.t.toLowerCase()).join(', ') + '. Posez une question concrète sur un projet récent.'], ['Pourquoi ce score ?', 'Le score suit 8 critères fixes. Le nom, l’âge, le genre, la photo ou la nationalité ne comptent jamais.']],
      offres: [['Pourquoi l’offre Clientèle reçoit peu de bons profils ?', 'Elle demande le swahili et 2 ans d’expérience : 31 candidats sur 52 n’ont pas l’expérience. Ajouter le salaire élargirait le vivier.']],
      talents: [['Des talents pour l’offre Analyste ?', 'Rachel Kanku couvre les trois compétences requises, vérifiées. Elle n’a pas candidaté : vous pouvez lui proposer l’offre.']],
      messages: [['Répondre à Benjamin ?', 'Proposez le 9 novembre si l’équipe data peut l’accueillir ; Aline Mukeba est disponible ce jour-là.']],
      fil: [['Une idée de publication ?', 'Montrez une recrue : « Bienvenue à Joëlle, recrutée via Jumanly ». Restez sous 220 caractères.']],
      entreprise: [['Qui connaître chez Fleuve Banque ?', 'Christelle et Nathalie sont déjà dans votre réseau. Didier Mbala dirige les risques : utile pour comparer les profils d’analystes.']],
      compte: [['Comment améliorer mon profil ?', 'Ajoutez une accroche courte et le badge « Recrute en ce moment » : les talents vous trouvent plus vite.']]
    };
    const oqL = (OQ[vue] || OQ.candidatures);
    const oRep = st.oRep ?? 0;
    const oChoix = oqL.map(([q], i) => ({ t: q, go: () => S({ oRep: i, orbiOpen: true }), fw: i === oRep ? '700' : '500', bg: i === oRep ? '#1B3338' : 'transparent' }));
    const oR = oqL[Math.min(oRep, oqL.length - 1)];

    // ---------- Notifications ----------
    const NOTIFS = [['Esther Kabila a candidaté', 'Analyste · il y a 2 h', go('candidat', { candK: 'esther' })], ['Benjamin Tshibangu a répondu', 'Proposition · 8 h 40', go('messages', { convK: 'benjamin' })], ['Prince Kalonji veut se connecter', 'Réseau · hier', go('talents', { sousT: 'reseau' })], ['3 profils à fort potentiel pour Flutter', 'Orbi · 7 h', go('candidatures', { offre: 'flutter' })]].map(([t, s, g]) => ({ t, s, go: g }));

    const TITRES = { agenda: 'Agenda', equipe: 'Équipe', tableau: 'Tableau de bord', moi: 'Mon espace', fil: 'Fil', offres: 'Offres', candidatures: 'Candidatures', candidat: c.nom, talents: 'Talents', messages: 'Messages', entreprise: 'Fleuve Banque', compte: 'Compte' };
    const navOn = (k) => (vue === k || (k === 'candidatures' && vue === 'candidat') ? '#13282C' : 'transparent');
    const navCol = (k) => (vue === k || (k === 'candidatures' && vue === 'candidat') ? '#F2EDE5' : '#8FA39E');
    const modal = st.modal || '';
/*PILOTAGE*/
    return {
      ...PIL,
      titre: TITRES[vue], tab, ordi: !tab,
      vFil: vue === 'fil', vOffres: vue === 'offres', vCand: vue === 'candidatures', vFiche: vue === 'candidat', vTalents: vue === 'talents', vMsg: vue === 'messages', vEnt: vue === 'entreprise', vCompte: vue === 'compte',
      nb_fil: navOn('fil'), nc_fil: navCol('fil'), nb_offres: navOn('offres'), nc_offres: navCol('offres'), nb_candidatures: navOn('candidatures'), nc_candidatures: navCol('candidatures'), nb_talents: navOn('talents'), nc_talents: navCol('talents'), nb_messages: navOn('messages'), nc_messages: navCol('messages'), nb_compte: navOn('compte'), nc_compte: navCol('compte'),
      goFil: go('fil'), goOffres: go('offres'), goCand: go('candidatures'), goTalents: go('talents'), goMsg: go('messages'), goCompte: go('compte', { cV: 'profil' }), goBascule: go('compte', { cV: 'bascule' }), goEnt: go('entreprise'),
      // recherche
      rq, rOpen, ouvrirR: () => S({ rOpen: true, notifOpen: false }), fermerR: () => S({ rOpen: false, rq: '' }), ecrireR: (e) => S({ rq: val(e), rOpen: true }),
      rPlace: 'Rechercher des ' + (SC[vue] || 'candidats'), rSugg: (SUGG[vue] || []).map((t) => ({ t, go: () => S({ rq: t }) })), rRes: res, aRes: res.length > 0, sansRes: !!rq.trim() && res.length === 0, rVide: !rq.trim(),
      // notifications
      notifOpen: !!st.notifOpen, basculerNotif: () => S({ notifOpen: !st.notifOpen, rOpen: false }), NOTIFS,
      publierOffre: () => S({ modal: 'offre' }),
      // Orbi
      oChoix, oQ: oR[0], oT: oR[1], orbiOpen: !!st.orbiOpen, ouvrirOrbi: () => S({ orbiOpen: true, rOpen: false, notifOpen: false }), fermerOrbi: () => S({ orbiOpen: false }),
      // offres
      OFFRES: OFFRES.map((o) => ({ ...o, candT: String(o.cand), nouvT: o.nouv ? '+' + o.nouv : '—', enLigne: o.statut === 'En ligne', stCol: o.statut === 'En ligne' ? '#A6F26B' : '#F4D59A', ouvrir: go('candidatures', { offre: o.k }) })),
      quotaT: '4 offres sur 20 · formule Company', tuilesO: [['170', 'candidatures · 30 jours'], ['13', 'nouvelles cette semaine'], ['6 j', 'délai moyen de réponse'], ['100 %', 'des candidats ont reçu une réponse']].map(([b, t]) => ({ b, t })),
      // candidatures
      colonnes, ofPills, offreT: offreSel.t, offreS: offreSel.lieu + ' · ' + offreSel.cand + ' candidatures',
      // fiche
      c, cOffreT: cOffre.t, pourquoi, timeline, etapeT: ETAPES[iEt][1], peutAvancer: iEt < 3 && !c.nr, finEtapes: iEt >= 3 || c.nr, suivanteT: iEt < 3 ? 'Passer à « ' + ETAPES[iEt + 1][1] + ' »' : '',
      avancer: () => { if (iEt >= 3) return; S({ etapes: { ...etapes, [c.k]: ETAPES[iEt + 1][0] } }); flash(c.nom.split(' ')[0] + ' passe à l’étape « ' + ETAPES[iEt + 1][1] + ' »'); },
      planifier: () => S({ modal: 'planifier' }), nonRetenu: () => S({ modal: 'nonretenu' }), ecrireC: go('messages', { convK: c.k === 'benjamin' || c.k === 'grace' ? c.k : 'benjamin' }),
      aNr: c.nr, retourTableau: go('candidatures', { offre: c.of }),
      // modales
      mOffre: modal === 'offre', mPlan: modal === 'planifier', mNr: modal === 'nonretenu', fermerM: () => S({ modal: '' }),
      creneaux: ['Jeu. 23 oct. · 10 h', 'Jeu. 23 oct. · 14 h', 'Ven. 24 oct. · 9 h 30'].map((t, i) => ({ t, pick: () => S({ cren: i }), bg: (st.cren ?? 0) === i ? '#F2EDE5' : 'transparent', col: (st.cren ?? 0) === i ? '#0B1A1F' : '#F2EDE5', bd: (st.cren ?? 0) === i ? '#F2EDE5' : 'rgba(255,255,255,.22)' })),
      confirmerPlan: () => { S({ modal: '', etapes: { ...etapes, [c.k]: 'entretien' } }); flash('Invitation envoyée à ' + c.nom.split(' ')[0] + ' : elle choisit d’accepter ou de proposer un autre créneau'); },
      confirmerNr: () => { S({ modal: '', nonRet: { ...nonRet, [c.k]: true } }); flash('Message envoyé à ' + c.nom.split(' ')[0] + ' : sa candidature reste dans votre historique'); },
      nrTexte: 'Bonjour ' + c.nom.split(' ')[0] + ', merci pour votre candidature au poste ' + cOffre.t + '. Nous avons retenu des profils plus avancés en ' + (c.verif[0] ? c.verif[0].t.toLowerCase() : 'compétences requises') + '. Votre profil reste dans notre vivier. Nadia, Baobab Fintech',
      continuerOffre: () => { S({ modal: '' }); flash('Brouillon créé : 5 étapes à remplir'); },
      // talents
      sousTal: onglets([['decouvrir', 'Découvrir'], ['vivier', 'Vivier', String(vivier.length)], ['propositions', 'Propositions', String(Object.keys(propos).length)], ['reseau', 'Réseau', recues.length ? String(recues.length) : '']], sousT, 'sousT'),
      tDec: sousT === 'decouvrir', tViv: sousT === 'vivier', tProp: sousT === 'propositions', tRes: sousT === 'reseau',
      talF, aTalF: talF.length > 0, sansTalF: talF.length === 0, tq, ecrireTq: (e) => S({ tq: val(e) }), tal, talPourquoi,
      talVivier: vivier.includes(tal.k), talPasVivier: !vivier.includes(tal.k), ajouterVivier: () => { S({ vivier: [...vivier, tal.k] }); flash(tal.nom.split(' ')[0] + ' ajouté·e à votre vivier'); },
      talPropose: !!propos[tal.k], talPasPropose: !propos[tal.k], proposer: () => { S({ propos: { ...propos, [tal.k]: 'Envoyée aujourd’hui' } }); flash('Offre Analyste proposée à ' + tal.nom.split(' ')[0] + ' : elle décide de candidater ou non'); },
      vivierL: vivier.map((k) => TAL.find((t) => t.k === k)).filter(Boolean).map((t) => ({ ...t, retirer: () => S({ vivier: vivier.filter((x) => x !== t.k) }) })), aVivier: vivier.length > 0, sansVivier: vivier.length === 0,
      proposL: Object.entries(propos).map(([k, d]) => { const t = TAL.find((x) => x.k === k); return { nom: t.nom, ini: t.ini, bg: t.bg, fg: t.fg, d, ouvrir: () => S({ sousT: 'decouvrir', talK: k }) }; }),
      invitations, aInvit: invitations.length > 0, aConnaitre, relations,
      // messages
      CONV, conv: { nom: conv[1], ini: conv[2], bg: conv[3], fg: conv[4], s: conv[5] }, filM: fil, mPills, br: brouillon, ecrireM: (e) => S({ br: val(e) }),
      envoyerM: () => { if (!brouillon.trim()) return flash('Écrivez votre message'); S({ ajouts: { ...ajouts, [conv[0]]: [...(ajouts[conv[0]] || []), ['moi', brouillon.trim(), 'à l’instant']] }, br: '' }); },
      convCand: conv[6] === 'cand', ficheConv: go('candidat', { candK: conv[0] === 'grace' ? 'grace' : 'benjamin' }), convRes: conv[6] === 'reseau', convEq: conv[6] === 'equipe',
      // fil
      posts, pub, ecrirePub: (e) => S({ pub: val(e).slice(0, MAXC) }), nCar: nCar + ' / ' + MAXC, carCol: nCar > MAXC - 20 ? '#F4D59A' : '#8FA39E',
      auNomP: pills([['nadia', 'En votre nom'], ['baobab', 'Au nom de Baobab Fintech']], auNom, 'auNom'),
      publier: () => { if (!pub.trim()) return flash('Écrivez votre publication'); const moi = auNom === 'baobab' ? ['Baobab Fintech', 'BF', '#14745F', '#FFFFFF', 'Entreprise · publiée par Nadia Kalala'] : ['Nadia Kalala', 'NK', '#1B3338', '#F2EDE5', 'Chargée de recrutement · Baobab Fintech']; S({ mesPubs: [{ k: 'moi' + mesPubs.length, nom: moi[0], ini: moi[1], bg: moi[2], fg: moi[3], s: moi[4], t: pub.trim(), d: 'à l’instant', n: 0, com: 0 }, ...mesPubs], pub: '' }); flash('Publication en ligne'); },
      suggR: aConnaitre.slice(0, 3),
      // entreprise
      membres, duRes: membres.filter((m) => m.duRes), autresM: membres.filter((m) => !m.duRes), eMembres: eOng === 'membres', eApropos: eOng === 'apropos', eOffres: eOng === 'offres',
      eOnglets: onglets([['apropos', 'À propos'], ['membres', 'Membres', String(membres.length)], ['offres', 'Offres', '2']], eOng, 'eOng'),
      aInv: aInv.length > 0, invT: aInv.length > 1 ? 'Se connecter aux ' + aInv.length + ' membres' : 'Se connecter au membre restant', resteT: 'Au plus 50 invitations par jour · il vous en reste ' + Math.max(0, 50 - env),
      inviterTous: () => { const r2 = { ...rel }; const lot = aInv.slice(0, Math.max(0, 50 - env)); lot.forEach((m) => { r2[m.k] = 'attente'; }); S({ rel: r2, env: env + lot.length }); flash(lot.length + ' invitations envoyées : chacun accepte ou non'); },
      followE, suivreT: followE ? 'Suivie' : 'Suivre', sBg: followE ? 'transparent' : '#A6F26B', sCol: followE ? '#F2EDE5' : '#0B1A1F', suivre: () => { S({ followE: !followE }); if (!followE) flash('Vous suivez Fleuve Banque'); },
      offresE: [['Analyste crédit', 'Kinshasa · CDI · 5 postes'], ['Conseiller·e clientèle', 'Matadi · CDI']].map(([t, s]) => ({ t, s, voir: () => flash('Vous voyez cette offre comme un talent : un recruteur ne peut pas y candidater') })),
      // compte
      cMenu, cProfil: cV === 'profil', cBascule: cV === 'bascule', cEquipe: cV === 'equipe', cFormule: cV === 'formule', cConfid: cV === 'confid', cModeles: cV === 'modeles',
      recrute, basculerRecrute: () => S({ recrute: !recrute }), rFond: recrute ? '#A6F26B' : '#2A3B3E', rX: recrute ? '20px' : '0px', rEtat: recrute ? 'true' : 'false',
      profilTalent: () => flash('Profil talent discret ouvert : Baobab Fintech ne le voit pas'),
      equipeL: [['JI', 'Joseph Ilunga', 'Responsable RH · administrateur'], ['NK', 'Nadia Kalala', 'Chargée de recrutement (vous)'], ['AM', 'Aline Mukeba', 'Responsable data · manager'], ['PN', 'Patrice Nzuzi', 'Service client · manager']].map(([ini, nom, r]) => ({ ini, nom, r })),
      usage: [['Offres en ligne', '4 sur 20', '20%'], ['Utilisateurs', '4 sur 5', '80%'], ['Crédits Orbi ce mois', '310 sur 500', '62%']].map(([t, v, pct]) => ({ t, v, pct })),
      demanderPlus: () => flash('Demande envoyée à Joseph Ilunga, l’administrateur'),
      telecharger: () => flash('Vos données arrivent par e-mail sous 24 h'),
      modelesL: ['Accuser réception', 'Inviter à un entretien', 'Non retenu, avec conseil', 'Proposition d’embauche'].map((t) => ({ t, ouvrir: () => flash('Modèle « ' + t + ' » ouvert : modifiable et envoyé tel quel') })),
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}
