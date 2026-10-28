class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
/*DONNEES*/
    // ===== État : étapes déplacées, répartitions, notes, évaluations, réponses envoyées =====
    const etapes = st.etapes || {};
    const etapeDe = (c) => etapes[c.k] || c.etape;
    const assign = st.assign || {};
    const assigneDe = (c) => (Object.prototype.hasOwnProperty.call(assign, c.k) ? assign[c.k] : c.assigne);
    const repondu = st.repondu || { ruth: true };
    const notesEn = st.notesEn || {};
    const evals = st.evals || (oui(p.evalFaite) ? { didier: { n: [4, 4, 5, 3], reco: 'retenir', fort: 'Python solide, très motivé.', vig: 'Visualisation à renforcer.' } } : {});
    const rdv = st.rdv || {};
    const entretienDe = (c) => rdv[c.k] || c.entretien;

    const vue = prop('vue', 'liste');
    const of = prop('of', 'tout');
    const sous = prop('sous', 'fort');
    const ck = prop('cand', 'grace');
    const c0 = candDe(ck);
    const fRaw = has('feuille') ? st.feuille : (p.feuille && p.feuille !== 'aucune' ? p.feuille : null);
    const fermer = () => S({ feuille: null });
    const ouvrir = (k, onglet) => () => S({ vue: 'fiche', cand: k, onglet: onglet || 'resume', feuille: null, depuis: vue === 'fiche' ? 'liste' : vue, rech: false, orbi: false });

    const dansOffre = (c) => of === 'tout' || c.offre === of;
    const actives = CANDS.filter((c) => OFFRES[c.offre].statut !== 'terminee');

    // Raisons principales (gabarits à partir des faits, doc 08)
    const raisons = (c) => {
      const R = [];
      const verif = c.comp.filter((x) => x[1]).map((x) => x[0]);
      if (c.v[0] >= 0.85) R.push('Couvre les compétences requises' + (verif.length ? ' (' + verif.slice(0, 2).join(', ') + ' vérifiés)' : ''));
      else if (c.v[0] >= 0.6) R.push('Couvre une partie des compétences requises');
      if (c.v[2] >= 0.8 && c.exp[0]) R.push(c.exp[0][0] + ' · ' + c.exp[0][1].split(' · ')[0]);
      if (c.v[5] >= 1) R.push('À ' + c.ville + ', comme le poste');
      if (c.v[4] >= 0.9) R.push('Langues : ' + c.langues.split(' · ').slice(0, 2).join(', '));
      if (c.v[6] >= 1) R.push('Disponibilité : ' + c.dispo.toLowerCase());
      return R.slice(0, 3);
    };
    const ligneC = (c) => {
      const s = c.score, b = bande(s), e = etapeDe(c), a = assigneDe(c);
      return { k: c.k, nom: c.nom, ini: c.ini, bg: c.bg, fg: c.fg, offre: OFFRES[c.offre].court, score: s + ' %', sbg: b[2], scol: b[1], bandeT: b[0],
        et: ETAPE_T[e], nouv: c.nouv && e === 'recue', recu: c.recu, ville: c.ville, titre: c.titre, dispo: c.dispo,
        interets: c.interets.slice(0, 3).map((t) => ({ t })), raisons: raisons(c).map((t) => ({ t })),
        assigneT: a ? 'Suivi par ' + EQUIPE[a].nom.split(' ')[0] : 'Pas encore réparti', ouvrir: ouvrir(c.k),
        sel: !!(st.sel || {})[c.k], case: (st.sel || {})[c.k] ? '✓' : '', caseBg: (st.sel || {})[c.k] ? '#A6F26B' : 'transparent', caseBd: (st.sel || {})[c.k] ? '#A6F26B' : 'rgba(255,255,255,.3)',
        basculer: () => { const s2 = { ...(st.sel || {}) }; if (s2[c.k]) delete s2[c.k]; else s2[c.k] = true; S({ sel: s2 }); },
        preselectionner: () => { S({ etapes: { ...etapes, [c.k]: 'presel' } }); flash(c.nom.split(' ')[0] + ' passe en présélection'); },
        aPresel: e === 'recue' };
    };

    // ===== Filtres d’offre =====
    const offresF = [['tout', 'Toutes les offres', actives.length], ...Object.keys(OFFRES).map((k) => [k, OFFRES[k].court, CANDS.filter((c) => c.offre === k).length])]
      .map(([k, t, n]) => ({ t: t + ' · ' + n, pick: () => S({ of: k, lim: 30, etapeF: has('etapeF') ? st.etapeF : 'recue' }), bg: k === of ? '#F2EDE5' : 'transparent', col: k === of ? '#0B1A1F' : '#F2EDE5', bd: k === of ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));

    // ===== Fort potentiel =====
    const fort = actives.filter((c) => dansOffre(c) && c.score >= 80 && ['recue', 'presel', 'entretien'].includes(etapeDe(c))).sort((a, b) => b.score - a.score);
    // ===== Toutes : par étape =====
    const ETAPES_F = [...ETAPES, ['nonretenu', 'Non retenus']];
    const etapeF = prop('etapeF', 'recue');
    const tri = st.tri || 'score';
    const dansEtape = actives.filter((c) => dansOffre(c) && etapeDe(c) === etapeF).sort((a, b) => (tri === 'score' ? b.score - a.score : (b.nouv ? 1 : 0) - (a.nouv ? 1 : 0)));
    const lim = st.lim || 30;
    const etapesF = ETAPES_F.map(([k, t]) => { const n = actives.filter((c) => dansOffre(c) && etapeDe(c) === k).length; return { t, n, pick: () => S({ etapeF: k, lim: 30 }), bg: k === etapeF ? '#A6F26B' : '#13282C', col: k === etapeF ? '#0B1A1F' : '#F2EDE5', ncol: k === etapeF ? '#0B1A1F' : '#A6F26B' }; });
    const selMode = !!st.selMode;
    const sel = Object.keys(st.sel || {});
    const nSel = sel.length;

    // ===== Entretiens =====
    const avecEnt = actives.filter((c) => dansOffre(c) && entretienDe(c));
    const ENT_F = [['aujourdhui', 'Aujourd’hui'], ['avenir', 'À venir'], ['documenter', 'À documenter'], ['faits', 'Documentés']];
    const entF = prop('entF', 'aujourdhui');
    const classeEnt = (c) => { const e = entretienDe(c); if (evals[c.k]) return 'faits'; if (e.fait) return 'documenter'; if (e.j.startsWith('Jeudi 22')) return 'aujourdhui'; return 'avenir'; };
    const entListe = avecEnt.filter((c) => classeEnt(c) === entF).map((c) => { const e = entretienDe(c); return { ...ligneC(c), j: e.j, h: e.h, mode: e.mode, avec: e.avec, lieu: e.lien, aDoc: classeEnt(c) === 'documenter', aFait: classeEnt(c) === 'faits', aVenir: ['aujourdhui', 'avenir'].includes(classeEnt(c)),
      documenter: () => S({ vue: 'evaluation', cand: c.k, depuis: 'liste' }), rejoindre: () => flash(e.mode === 'Visio' ? 'Visio ouverte : ' + e.lien : e.mode === 'Appel' ? 'Appel lancé vers ' + c.nom.split(' ')[0] : 'Itinéraire vers ' + e.lien) }; });
    const entOnglets = ENT_F.map(([k, t]) => ({ t, n: avecEnt.filter((c) => classeEnt(c) === k).length, pick: () => S({ entF: k }), bg: k === entF ? '#F2EDE5' : 'transparent', col: k === entF ? '#0B1A1F' : '#F2EDE5', bd: k === entF ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));

    // ===== Décisions =====
    const DEC_F = [['propositions', 'Propositions'], ['recrutes', 'Recrutés'], ['nonretenus', 'Non retenus']];
    const decF = prop('decF', 'propositions');
    const props2 = actives.filter((c) => dansOffre(c) && etapeDe(c) === 'proposition');
    const recrutes = CANDS.filter((c) => dansOffre(c) && etapeDe(c) === 'recrute');
    const nonret = actives.filter((c) => dansOffre(c) && etapeDe(c) === 'nonretenu');
    const sansRep = nonret.filter((c) => !repondu[c.k]);
    const decListe = (decF === 'propositions' ? props2 : decF === 'recrutes' ? recrutes : nonret).map((c) => ({ ...ligneC(c),
      statut: decF === 'propositions' ? (c.proposition ? c.proposition.etat : 'Proposition envoyée') : decF === 'recrutes' ? 'Recruté·e · ' + OFFRES[c.offre].court : (repondu[c.k] ? 'Réponse envoyée' : 'Sans réponse pour l’instant'),
      stCol: decF === 'nonretenus' && !repondu[c.k] ? '#F4C463' : '#8FA39E' }));
    const decOnglets = DEC_F.map(([k, t]) => ({ t, n: (k === 'propositions' ? props2 : k === 'recrutes' ? recrutes : nonret).length, pick: () => S({ decF: k }), bg: k === decF ? '#F2EDE5' : 'transparent', col: k === decF ? '#0B1A1F' : '#F2EDE5', bd: k === decF ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));

    const SOUS = [['fort', 'Fort potentiel', fort.length], ['toutes', 'Toutes', ''], ['entretiens', 'Entretiens', avecEnt.filter((c) => ['aujourdhui', 'documenter'].includes(classeEnt(c))).length || ''], ['decisions', 'Décisions', sansRep.length || '']];
    const sousOnglets = onglets(SOUS, sous, 'sous', { selMode: false, sel: {} });

    // ===== Recherche en deux temps =====
    const rech = has('rech') ? st.rech : (p.recherche === 'options' || p.recherche === 'texte');
    const q = st.q ?? (p.recherche === 'texte' ? 'sql' : '');
    const rt = st.rt || 'tout';
    const nq = norm(q.trim());
    const rTypes = pills([['tout', 'Tout'], ['nom', 'Nom'], ['comp', 'Compétence'], ['ville', 'Ville']], rt, 'rt');
    const resRech = !nq ? [] : actives.filter((c) => (rt === 'tout' || rt === 'nom') && norm(c.nom).includes(nq) || (rt === 'tout' || rt === 'comp') && c.comp.some((x) => norm(x[0]).includes(nq)) || (rt === 'tout' || rt === 'ville') && norm(c.ville).includes(nq))
      .sort((a, b) => b.score - a.score).slice(0, 20).map(ligneC);
    const recents = [['Power BI', 'compétence'], ['Grâce Mbuyi', 'nom'], ['Lubumbashi', 'ville']].map(([t, d]) => ({ t, d, pick: () => S({ q: t }) }));

    // ===== Fiche candidat =====
    const e0 = etapeDe(c0), b0 = bande(c0.score), a0 = assigneDe(c0), ent0 = entretienDe(c0);
    const ONGLETS_F = [['resume', 'Résumé'], ['cv', 'CV'], ['reponses', 'Réponses'], ['notes', 'Notes'], ['historique', 'Historique']];
    const ongletF = prop('onglet', 'resume');
    const notes0 = [...(notesEn[c0.k] || []), ...c0.notes].map(([au, t, d]) => ({ au, t, d, ini: au.split(' ').map((m) => m[0]).join('') }));
    const ev0 = evals[c0.k];
    const suiv = { recue: ['Présélectionner', 'presel'], presel: ['Planifier un entretien', 'planifier'], entretien: ev0 || (ent0 && ent0.fait) ? ['Faire une proposition', 'proposition'] : ['Documenter l’entretien', 'evaluation'], proposition: ['Marquer comme recruté·e', 'recrute'], recrute: ['Voir le message de bienvenue', 'bienvenue'], nonretenu: ['Revoir la candidature', 'recue'], retire: ['Revoir la candidature', 'recue'] }[e0];
    const actionSuiv = () => {
      const [, cible] = suiv;
      if (cible === 'planifier') return S({ vue: 'planifier', depuis: 'fiche', jour: 0, creneau: null });
      if (cible === 'evaluation') return S({ vue: 'evaluation', depuis: 'fiche' });
      if (cible === 'proposition') return S({ vue: 'proposition', depuis: 'fiche' });
      if (cible === 'bienvenue') return S({ feuille: 'bienvenue' });
      S({ etapes: { ...etapes, [c0.k]: cible } });
      flash(c0.nom.split(' ')[0] + ' : ' + ETAPE_T[cible].toLowerCase());
    };
    const HIST = [[c0.recu, 'Candidature reçue via ' + c0.src], ...(e0 !== 'recue' ? [['', 'Passée en ' + (e0 === 'nonretenu' ? 'non retenue' : 'présélection') + ' par Nadia']] : []),
      ...(ent0 ? [[ent0.j, 'Entretien ' + ent0.mode.toLowerCase() + ' avec ' + ent0.avec + (ent0.fait ? ' · fait' : ' · prévu')]] : []), ...(ev0 ? [['aujourd’hui', 'Évaluation enregistrée']] : []),
      ...(c0.proposition ? [['mardi', 'Proposition envoyée : ' + c0.proposition.salaire]] : []), ['aujourd’hui', 'Fiche consultée par Nadia Kalala (journal)']];
    const criteres0 = CRITERES.map(([k, t, w], i) => ({ t, w: w + ' pts', pts: Math.round(w * c0.v[i] * 10) / 10 + ' / ' + w, larg: Math.round(c0.v[i] * 100) + '%', col: c0.v[i] >= 0.85 ? '#A6F26B' : c0.v[i] >= 0.6 ? '#9FE8D2' : '#F4D59A' }));
    const fiche = { nom: c0.nom, ini: c0.ini, bg: c0.bg, fg: c0.fg, titre: c0.titre, ville: c0.ville, offre: OFFRES[c0.offre].t, et: ETAPE_T[e0], score: c0.score + ' %', sbg: b0[2], scol: b0[1], bandeT: b0[0],
      recu: c0.recu, src: c0.src, dispo: c0.dispo, interets: c0.interets.map((t) => ({ t })), raisons: raisons(c0).map((t) => ({ t })), verifier: c0.verifier.map((t) => ({ t })), aVerif: c0.verifier.length > 0,
      exp: c0.exp.map(([t, d]) => ({ t, d })), form: c0.form, langues: c0.langues, comp: c0.comp.map(([t, v]) => ({ t, v: v ? 'vérifiée' : 'déclarée', vc: v ? '#A6F26B' : '#8FA39E' })),
      attest: c0.attest, aAttest: !!c0.attest, reponses: c0.reponses.map(([q2, r]) => ({ q: q2, r })), aReponses: c0.reponses.length > 0, sansReponses: c0.reponses.length === 0,
      assigneT: a0 ? EQUIPE[a0].nom + ' · ' + EQUIPE[a0].role : 'Personne pour l’instant', assIni: a0 ? EQUIPE[a0].ini : '?',
      aEnt: !!ent0, ent: ent0 || { j: '', h: '', mode: '', avec: '', lien: '' }, entFait: !!(ent0 && ent0.fait), entPrevu: !!(ent0 && !ent0.fait),
      aEval: !!ev0, evalT: ev0 ? ({ retenir: 'Recommandation : retenir', revoir: 'Recommandation : à revoir', non: 'Recommandation : ne pas retenir' }[ev0.reco]) : '', evalMoy: ev0 ? (ev0.n.reduce((a, x) => a + x, 0) / ev0.n.length).toFixed(1).replace('.', ',') + ' / 5' : '',
      aProp: !!c0.proposition, prop: c0.proposition || { salaire: '', debut: '', etat: '' }, suivT: suiv[0], nonRetenu: e0 === 'nonretenu', decide: ['nonretenu', 'recrute'].includes(e0),
      hist: HIST.map(([d, t]) => ({ d, t })), criteres: criteres0, notes: notes0, aNotes: notes0.length > 0, nNotes: notes0.length, nouv: c0.nouv && e0 === 'recue' };
    const ongletsFiche = onglets(ONGLETS_F.map(([k, t]) => [k, t, k === 'notes' && notes0.length ? String(notes0.length) : '']), ongletF, 'onglet');
    const note = st.note ?? '';
    const ajouterNote = () => { if (!note.trim()) return flash('Écrivez une note'); S({ notesEn: { ...notesEn, [c0.k]: [['Nadia Kalala', note.trim(), 'à l’instant'], ...(notesEn[c0.k] || [])] }, note: '' }); flash('Note ajoutée, visible par l’équipe'); };

    // Déplacer
    const deplacer = [...ETAPES, ['nonretenu', 'Non retenu·e']].map(([k, t]) => ({ t, sym: k === e0 ? '✓' : '', pick: () => {
      if (k === 'nonretenu') return S({ feuille: 'nonretenu' });
      if (k === 'entretien' && !ent0) return S({ feuille: null, vue: 'planifier', depuis: 'fiche' });
      S({ etapes: { ...etapes, [c0.k]: k }, feuille: null }); flash(c0.nom.split(' ')[0] + ' : ' + t.toLowerCase());
    } }));
    // Répartir (une personne ou la sélection)
    const cibleRep = st.pourSel ? sel : [c0.k];
    const charge = (m) => CANDS.filter((c) => assigneDe(c) === m && !['nonretenu', 'recrute'].includes(etapeDe(c))).length;
    const repartir = Object.keys(EQUIPE).map((m) => ({ nom: EQUIPE[m].nom + (EQUIPE[m].moi ? ' (moi)' : ''), ini: EQUIPE[m].ini, role: EQUIPE[m].role + ' · ' + charge(m) + ' candidats suivis', sym: !st.pourSel && a0 === m ? '✓' : '',
      pick: () => { const a2 = { ...assign }; cibleRep.forEach((k) => { a2[k] = m; }); S({ assign: a2, feuille: null, selMode: false, sel: {} }); flash(cibleRep.length > 1 ? cibleRep.length + ' candidats confiés à ' + EQUIPE[m].nom.split(' ')[0] : 'Confié à ' + EQUIPE[m].nom.split(' ')[0] + ', prévenu par notification'); } }));
    // Ne pas retenir : motif privé + message bienveillant
    const MOTIFS = ['Compétences éloignées du poste', 'Autre candidat plus proche', 'Disponibilité incompatible', 'Poste pourvu'];
    const motif = st.motif ?? 0;
    const motifs = MOTIFS.map((t, i) => ({ t, pick: () => S({ motif: i }), bg: i === motif ? '#F2EDE5' : 'transparent', col: i === motif ? '#0B1A1F' : '#F2EDE5', bd: i === motif ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));
    const cibleNon = st.pourSel ? sel : [c0.k];
    const msgNon = st.msgNon ?? `Bonjour ${st.pourSel ? '{prénom}' : c0.nom.split(' ')[0]}, merci pour votre candidature au poste « ${OFFRES[c0.offre].court} ». Nous avons choisi un autre profil cette fois. Votre profil reste visible pour nos prochaines offres, et le cours gratuit « SQL pour l’analyse » peut vous aider. Bonne continuation. Nadia, Baobab Fintech`;
    const envoyerNon = () => { const e2 = { ...etapes }, r2 = { ...repondu }; cibleNon.forEach((k) => { e2[k] = 'nonretenu'; r2[k] = true; }); S({ etapes: e2, repondu: r2, feuille: null, selMode: false, sel: {} }); flash(cibleNon.length > 1 ? cibleNon.length + ' réponses envoyées' : 'Réponse envoyée à ' + c0.nom.split(' ')[0]); };
    // Réponse groupée
    const MODELES = [['entretien', 'Invitation à un entretien', 'Bonjour {prénom}, votre profil nous intéresse pour le poste « {poste} ». Choisissez un créneau d’entretien avec ce lien. Nadia, Baobab Fintech'],
      ['document', 'Demande de document', 'Bonjour {prénom}, pour avancer, pouvez-vous ajouter votre dernier diplôme ou une attestation à votre candidature ? Merci. Nadia'],
      ['attente', 'Candidature bien reçue', 'Bonjour {prénom}, nous avons bien reçu votre candidature. Nous revenons vers vous d’ici le 5 novembre. Nadia'],
      ['non', 'Réponse non retenue', 'Bonjour {prénom}, merci pour votre candidature. Nous avons choisi d’autres profils cette fois. Votre profil reste visible pour nos prochaines offres. Nadia']];
    const modele = st.modele || 'entretien';
    const modeles = MODELES.map(([k, t]) => ({ t, pick: () => S({ modele: k }), bd: k === modele ? '#A6F26B' : 'rgba(255,255,255,.12)', bg: k === modele ? 'rgba(166,242,107,.08)' : 'transparent', rb: k === modele ? '#A6F26B' : 'rgba(255,255,255,.3)', rbg: k === modele ? '#A6F26B' : 'transparent' }));
    const ciblesGroupe = st.groupeNonRep ? sansRep.map((c) => c.k) : sel;
    const premierG = candDe(ciblesGroupe[0] || 'esther');
    const apercuG = (MODELES.find((m) => m[0] === modele) || MODELES[0])[2].replace('{prénom}', premierG.nom.split(' ')[0]).replace('{poste}', OFFRES[premierG.offre].court);
    const envoyerGroupe = () => {
      const e2 = { ...etapes }, r2 = { ...repondu };
      ciblesGroupe.forEach((k) => { if (modele === 'non') { e2[k] = 'nonretenu'; r2[k] = true; } if (modele === 'entretien' && ['recue', 'presel'].includes(etapeDe(candDe(k)))) e2[k] = 'presel'; });
      S({ etapes: e2, repondu: r2, feuille: null, selMode: false, sel: {}, groupeNonRep: false });
      flash(ciblesGroupe.length + ' messages envoyés, chacun à son prénom');
    };
    // PDF
    const PDFC = [['fiche', 'Fiche et score expliqué'], ['cv', 'CV'], ['reponses', 'Réponses et documents'], ['notes', 'Notes et évaluations'], ['hist', 'Historique des décisions']];
    const pdfSel = st.pdfSel || { fiche: true, cv: true, reponses: true, notes: true, hist: false };
    const pdfOpts = PDFC.map(([k, t]) => ({ t, pick: () => S({ pdfSel: { ...pdfSel, [k]: !pdfSel[k] } }), sym: pdfSel[k] ? '✓' : '', bg: pdfSel[k] ? '#A6F26B' : 'transparent', bd: pdfSel[k] ? '#A6F26B' : 'rgba(255,255,255,.3)' }));
    const pdfPour = st.pdfPour || (st.pourSel ? 'sel' : vue === 'diagnostic' ? 'offre' : 'un');
    const pdfTitre = pdfPour === 'sel' ? nSel + ' candidats sélectionnés' : pdfPour === 'offre' ? 'Toutes les candidatures · ' + OFFRES[of === 'tout' ? 'analyste' : of].court : c0.nom;
    const telechargerPdf = () => { S({ feuille: null, selMode: false, sel: {}, pdfPour: null, pourSel: false }); flash('PDF téléchargé : ' + pdfTitre + ' (' + Object.values(pdfSel).filter(Boolean).length + ' parties)'); };

    // ===== Planifier un entretien =====
    const JOURS = [['Ven. 23', 'vendredi 23 octobre'], ['Lun. 26', 'lundi 26 octobre'], ['Mar. 27', 'mardi 27 octobre'], ['Mer. 28', 'mercredi 28 octobre'], ['Jeu. 29', 'jeudi 29 octobre'], ['Ven. 30', 'vendredi 30 octobre']];
    const jour = st.jour ?? 0;
    const CREN = ['9 h 00', '10 h 00', '11 h 30', '14 h 00', '15 h 30', '16 h 30'];
    const pris = { 0: [1, 3], 1: [0], 2: [4], 3: [], 4: [2, 3], 5: [5] };
    const creneau = has('creneau') ? st.creneau : (oui(p.rempli) ? 1 : null);
    const jours = JOURS.map(([t], i) => ({ t: t.split(' ')[0], n: t.split(' ')[1], pick: () => S({ jour: i, creneau: null }), bg: i === jour ? '#A6F26B' : '#13282C', col: i === jour ? '#0B1A1F' : '#F2EDE5' }));
    const creneaux = CREN.map((t, i) => { const occ = (pris[jour] || []).includes(i); return { t, occ, libre: !occ, pick: () => (occ ? flash('Aline a déjà un rendez-vous à ' + t) : S({ creneau: i })), bg: i === creneau ? '#A6F26B' : 'transparent', col: occ ? '#56706B' : i === creneau ? '#0B1A1F' : '#F2EDE5', bd: i === creneau ? '#A6F26B' : occ ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.22)', deco: occ ? 'line-through' : 'none' }; });
    const MODES = [['Visio', 'Lien Jumanly créé'], ['Sur place', 'Baobab Fintech, Gombe'], ['Appel', 'Appel dans l’app']];
    const mode = st.mode || 'Visio';
    const modes = MODES.map(([k, d]) => ({ t: k, d, pick: () => S({ mode: k }), bd: k === mode ? '#A6F26B' : 'rgba(255,255,255,.12)', bg: k === mode ? 'rgba(166,242,107,.08)' : '#13282C' }));
    const DUREES = [['30', '30 min'], ['45', '45 min'], ['60', '1 h']];
    const duree = st.duree || '45';
    const durees = pills(DUREES, duree, 'duree');
    const invites = st.invites || { aline: true };
    const invitesL = ['joseph', 'aline', 'patrice'].map((m) => ({ nom: EQUIPE[m].nom, ini: EQUIPE[m].ini, role: EQUIPE[m].role, pick: () => S({ invites: { ...invites, [m]: !invites[m] } }), sym: invites[m] ? '✓' : '', bg: invites[m] ? '#A6F26B' : 'transparent', bd: invites[m] ? '#A6F26B' : 'rgba(255,255,255,.3)' }));
    const avecT = Object.keys(invites).filter((m) => invites[m]).map((m) => EQUIPE[m].nom).join(', ') || 'vous seule';
    const planOk = creneau !== null;
    const envoyerInvit = () => {
      if (!planOk) return flash('Choisissez un créneau');
      const e = { j: JOURS[jour][1].replace(/^\w/, (x) => x.toUpperCase()).replace(' octobre', ' oct.'), h: CREN[creneau], mode, avec: avecT, lien: mode === 'Visio' ? 'meet.jumanly.io/bf-' + c0.k : mode === 'Sur place' ? 'Baobab Fintech, Gombe' : 'Appel Jumanly' };
      S({ rdv: { ...rdv, [c0.k]: e }, etapes: { ...etapes, [c0.k]: 'entretien' }, vue: 'planifie' });
    };
    const planifie = rdv[c0.k] || { j: 'Vendredi 23 oct.', h: '10 h 00', mode: 'Visio', avec: 'Aline Mukeba', lien: 'meet.jumanly.io/bf-' + c0.k };

    // ===== Évaluation (grille) =====
    const GRILLE = ['Compétences techniques', 'Communication', 'Motivation pour le poste', 'Connaissance du secteur'];
    const notesG = st.notesG || (ev0 ? ev0.n : [0, 0, 0, 0]);
    const grille = GRILLE.map((t, i) => ({ t, etoiles: [1, 2, 3, 4, 5].map((n) => ({ n, pick: () => { const g2 = [...notesG]; g2[i] = n; S({ notesG: g2 }); }, col: n <= notesG[i] ? '#A6F26B' : '#33464A', lab: t + ' : ' + n + ' sur 5' })), val: notesG[i] ? notesG[i] + ' / 5' : '—' }));
    const reco = st.reco ?? (ev0 ? ev0.reco : '');
    const RECO = [['retenir', 'Retenir'], ['revoir', 'À revoir'], ['non', 'Ne pas retenir']];
    const recos = RECO.map(([k, t]) => ({ t, pick: () => S({ reco: k }), bg: k === reco ? (k === 'non' ? '#F2EDE5' : '#A6F26B') : '#13282C', col: k === reco ? '#0B1A1F' : '#F2EDE5' }));
    const ptFort = st.ptFort ?? (ev0 ? ev0.fort : '');
    const ptVig = st.ptVig ?? (ev0 ? ev0.vig : '');
    const evalOk = notesG.every((n) => n > 0) && !!reco;
    const enregistrerEval = () => {
      if (!evalOk) return flash(notesG.some((n) => !n) ? 'Notez les 4 critères' : 'Choisissez une recommandation');
      S({ evals: { ...evals, [c0.k]: { n: notesG, reco, fort: ptFort, vig: ptVig } }, vue: 'fiche', onglet: 'notes', notesG: null, reco: null });
      flash('Évaluation enregistrée · la décision reste à prendre');
    };

    // ===== Proposition =====
    const salaire = st.salaire ?? '850';
    const debut = st.debut ?? '5 novembre 2026';
    const msgProp = st.msgProp ?? `Bonjour ${c0.nom.split(' ')[0]}, toute l’équipe a apprécié nos échanges. Nous avons le plaisir de vous proposer le poste de ${OFFRES[c0.offre].court}. Vous trouverez les détails ci-dessous.`;
    const envoyerProp = () => { S({ etapes: { ...etapes, [c0.k]: 'proposition' }, vue: 'fiche', onglet: 'resume' }); flash('Proposition envoyée à ' + c0.nom.split(' ')[0]); };

    // ===== Diagnostic des CV par Orbi =====
    const ofD = st.ofD || (of === 'tout' ? 'analyste' : of);
    const cvD = CANDS.filter((c) => c.offre === ofD);
    const tous = cvD.filter((c) => c.score >= 80), part = cvD.filter((c) => c.score >= 60 && c.score < 80), peu = cvD.filter((c) => c.score < 60);
    const SK = SKL[ofD];
    const couv = SK.map((s) => { const n = cvD.filter((c) => c.comp.some((x) => x[0] === s)).length; return { t: s, n: n + ' sur ' + cvD.length, larg: Math.round(n / cvD.length * 100) + '%' }; });
    const diagOffres = Object.keys(OFFRES).map((k) => ({ t: OFFRES[k].court, pick: () => S({ ofD: k }), bg: k === ofD ? '#F2EDE5' : 'transparent', col: k === ofD ? '#0B1A1F' : '#F2EDE5', bd: k === ofD ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));
    const diag = { offre: OFFRES[ofD].t, n: cvD.length, tous: tous.length, part: part.length, peu: peu.length, wT: Math.round(tous.length / cvD.length * 100) + '%', wP: Math.round(part.length / cvD.length * 100) + '%', wQ: Math.round(peu.length / cvD.length * 100) + '%',
      top: tous.sort((a, b) => b.score - a.score).slice(0, 5).map(ligneC), manque: SK[2] + ' manque à ' + (cvD.length - cvD.filter((c) => c.comp.some((x) => x[0] === SK[2])).length) + ' candidats : le cours gratuit Jumanly peut leur être proposé.' };
    const aPreselTous = tous.filter((c) => etapeDe(c) === 'recue');
    const preselTous = () => { const e2 = { ...etapes }; aPreselTous.forEach((c) => { e2[c.k] = 'presel'; }); S({ etapes: e2, feuille: null }); flash(aPreselTous.length + ' candidats passent en présélection'); };

    // ===== Retours =====
    const retourFiche = () => S({ vue: st.depuis === 'diagnostic' ? 'diagnostic' : 'liste', feuille: null });
    const retourVue = () => S({ vue: st.depuis === 'liste' ? 'liste' : 'fiche', feuille: null });

    // ===== Orbi =====
    const top3 = fort.slice(0, 3);
    const OQ = {
      qui: { q: 'Qui recevoir en premier ?', t: top3.length ? top3.map((c) => c.nom.split(' ')[0] + ' (' + c.score + ' %)').join(', ') + ' couvrent le mieux vos critères. Le score compare les profils à l’offre ; c’est vous qui choisissez.' : 'Aucun profil au-dessus de 80 % pour ce filtre.', actT: 'Voir le fort potentiel', act: () => S({ sous: 'fort', vue: 'liste', orbi: false }) },
      diag: { q: 'Faire le diagnostic de tous les CV', t: `J’ai lu les ${CANDS.filter((c) => c.offre === 'analyste').length} CV d’Analyste de données : ${CANDS.filter((c) => c.offre === 'analyste' && c.score >= 80).length} couvrent tous vos critères. Je ne retire personne de la liste.`, actT: 'Ouvrir le diagnostic', act: () => S({ vue: 'diagnostic', ofD: 'analyste', orbi: false }) },
      reponse: { q: `Répondre aux ${sansRep.length} candidats sans réponse`, t: 'Je prépare un message bienveillant, adressé à chacun par son prénom. Vous le relisez avant l’envoi.', actT: 'Préparer la réponse groupée', act: () => S({ feuille: 'groupe', groupeNonRep: true, modele: 'non', orbi: false }) },
      entretien: { q: 'Préparer l’entretien de Grâce (10 h)', t: 'Points à vérifier : niveau réel sur Power BI (déclaré, non vérifié) et expérience en équipe produit. Ses réponses et les notes d’Aline sont dans sa fiche.', actT: 'Ouvrir la fiche de Grâce', act: () => S({ vue: 'fiche', cand: 'grace', onglet: 'resume', orbi: false }) }
    };
    const ok = orbiKit(OQ, 'depuis Candidatures', 'Vos candidatures', vue === 'liste' && sous === 'fort' ? (sansRep.length ? 'reponse' : 'qui') : null);

    return {
      ...ok,
      vListe: vue === 'liste', vFiche: vue === 'fiche', vPlan: vue === 'planifier', vPlanifie: vue === 'planifie', vEval: vue === 'evaluation', vProp: vue === 'proposition', vDiag: vue === 'diagnostic',
      offresF, sousOnglets, sFort: sous === 'fort', sToutes: sous === 'toutes', sEnt: sous === 'entretiens', sDec: sous === 'decisions',
      resume: `${actives.filter((c) => c.nouv && etapeDe(c) === 'recue').length} nouvelles · ${actives.filter((c) => dansOffre(c)).length} candidatures · ${fort.length} à fort potentiel`,
      fort: fort.slice(0, 12).map(ligneC), aFort: fort.length > 0, sansFort: fort.length === 0, nFortT: fort.length + ' profils à 80 % et plus',
      ouvrirDiag: () => S({ vue: 'diagnostic', ofD: of === 'tout' ? 'analyste' : of, depuis: 'liste' }), diagT: `Orbi a lu ${actives.filter((c) => dansOffre(c)).length} CV`,
      etapesF, dansEtape: dansEtape.slice(0, lim).map(ligneC), aPlus: dansEtape.length > lim, plusT: 'Afficher ' + Math.min(30, dansEtape.length - lim) + ' de plus', plus: () => S({ lim: lim + 30 }),
      etapeVide: dansEtape.length === 0, triT: tri === 'score' ? 'Par score' : 'Nouvelles d’abord', basculerTri: () => S({ tri: tri === 'score' ? 'date' : 'score' }),
      selMode, sansSel: !selMode, entrerSel: () => S({ selMode: true, sel: {} }), sortirSel: () => S({ selMode: false, sel: {} }), nSelT: nSel + ' sélectionné' + (nSel > 1 ? 's' : ''), aSel: nSel > 0,
      toutSel: () => { const s2 = {}; dansEtape.slice(0, lim).forEach((c) => { s2[c.k] = true; }); S({ sel: s2 }); },
      selDeplacer: () => (nSel ? S({ feuille: 'deplacerSel' }) : flash('Sélectionnez au moins une personne')),
      selRepondre: () => (nSel ? S({ feuille: 'groupe', groupeNonRep: false }) : flash('Sélectionnez au moins une personne')),
      selRepartir: () => (nSel ? S({ feuille: 'repartir', pourSel: true }) : flash('Sélectionnez au moins une personne')),
      selPdf: () => (nSel ? S({ feuille: 'pdf', pourSel: true, pdfPour: 'sel' }) : flash('Sélectionnez au moins une personne')),
      deplacerSel: [...ETAPES, ['nonretenu', 'Non retenu·e']].map(([k, t]) => ({ t, pick: () => { if (k === 'nonretenu') return S({ feuille: 'nonretenu', pourSel: true }); const e2 = { ...etapes }; sel.forEach((x) => { e2[x] = k; }); S({ etapes: e2, feuille: null, selMode: false, sel: {} }); flash(nSel + ' candidats : ' + t.toLowerCase()); } })),
      entOnglets, entListe, entVide: entListe.length === 0,
      decOnglets, decListe, decVide: decListe.length === 0, aSansRep: decF === 'nonretenus' && sansRep.length > 0, sansRepT: `Répondre aux ${sansRep.length} sans réponse`, repondreNonRep: () => S({ feuille: 'groupe', groupeNonRep: true, modele: 'non' }),
      // recherche
      aRech: !!rech, sansRech: !rech, q, chercher: (e) => S({ q: val(e) }), ouvrirRech: () => S({ rech: true }), annulerRech: () => S({ rech: false, q: '' }), viderQ: () => S({ q: '' }),
      aQ: q.length > 0, qVide: !q.trim(), qPlein: !!q.trim(), rTypes, recents, resRech, nRes: resRech.length + ' résultat' + (resRech.length > 1 ? 's' : ''), rRien: !!q.trim() && resRech.length === 0,
      // fiche
      fiche, ongletsFiche, oResume: ongletF === 'resume', oCv: ongletF === 'cv', oRep: ongletF === 'reponses', oNotes: ongletF === 'notes', oHist: ongletF === 'historique',
      retourFiche, retourT: st.depuis === 'diagnostic' ? 'Diagnostic' : 'Candidatures', actionSuiv, ouvrirMenu: () => S({ feuille: 'menu' }), ouvrirPourquoi: () => S({ feuille: 'pourquoi' }),
      ouvrirDeplacer: () => S({ feuille: 'deplacer' }), ouvrirRepartir: () => S({ feuille: 'repartir', pourSel: false }), deplacer, repartir,
      note, ecrireNote: (e) => S({ note: val(e) }), ajouterNote, voirEval: () => S({ vue: 'evaluation', depuis: 'fiche' }), planifierDepuisFiche: () => S({ vue: 'planifier', depuis: 'fiche', creneau: null }),
      telechargerCv: () => flash('CV de ' + c0.nom.split(' ')[0] + ' téléchargé (PDF)'), ouvrirDoc: () => flash('Document ouvert dans la visionneuse'),
      ecrireMsg: () => S({ feuille: 'message' }), msgRapide: st.msgRapide ?? '', ecrireMsgRapide: (e) => S({ msgRapide: val(e) }),
      envoyerMsgRapide: () => { if (!String(st.msgRapide || '').trim()) return flash('Écrivez votre message'); S({ feuille: null, msgRapide: '' }); flash('Message envoyé à ' + c0.nom.split(' ')[0] + ' · retrouvez-le dans Messages'); },
      menuF: [
        { t: 'Changer d’étape', s: 'Actuellement : ' + ETAPE_T[e0], go: () => S({ feuille: 'deplacer' }), col: '#F2EDE5' },
        { t: 'Répartir à un collègue', s: a0 ? 'Suivi par ' + EQUIPE[a0].nom : 'Personne pour l’instant', go: () => S({ feuille: 'repartir', pourSel: false }), col: '#F2EDE5' },
        { t: 'Planifier un entretien', s: ent0 ? 'Déjà prévu : ' + ent0.j + ', ' + ent0.h : 'Créneaux de l’équipe', go: () => S({ vue: 'planifier', depuis: 'fiche', feuille: null, creneau: null }), col: '#F2EDE5' },
        { t: 'Demander un document', s: 'Diplôme, attestation, références', go: () => S({ feuille: 'document' }), col: '#F2EDE5' },
        { t: 'Télécharger le PDF', s: 'Fiche, CV, réponses, notes', go: () => S({ feuille: 'pdf', pdfPour: 'un', pourSel: false }), col: '#F2EDE5' },
        { t: 'Ne pas retenir', s: 'Avec un message bienveillant', go: () => S({ feuille: 'nonretenu', pourSel: false }), col: '#F08A7C' }
      ],
      DOCS: ['Dernier diplôme', 'Attestation de travail', 'Deux références', 'Pièce d’identité'].map((t) => ({ t, go: () => { S({ feuille: null }); flash('Demande envoyée : ' + t.toLowerCase()); } })),
      motifs, msgNon, ecrireMsgNon: (e) => S({ msgNon: val(e) }), envoyerNon, nonTitre: cibleNon.length > 1 ? 'Ne pas retenir ' + cibleNon.length + ' candidats' : 'Ne pas retenir ' + c0.nom.split(' ')[0],
      modeles, apercuG, envoyerGroupe, groupeTitre: 'Message à ' + ciblesGroupe.length + ' candidat' + (ciblesGroupe.length > 1 ? 's' : ''), groupeNoms: ciblesGroupe.slice(0, 4).map((k) => candDe(k).nom.split(' ')[0]).join(', ') + (ciblesGroupe.length > 4 ? ' et ' + (ciblesGroupe.length - 4) + ' autres' : ''),
      pdfOpts, pdfTitre, telechargerPdf, repTitre: st.pourSel ? 'Répartir ' + nSel + ' candidats' : 'Confier ' + c0.nom.split(' ')[0] + ' à',
      fMenu: fRaw === 'menu', fPourquoi: fRaw === 'pourquoi', fDeplacer: fRaw === 'deplacer', fDeplacerSel: fRaw === 'deplacerSel', fRepartir: fRaw === 'repartir', fNon: fRaw === 'nonretenu', fGroupe: fRaw === 'groupe', fPdf: fRaw === 'pdf',
      fDoc: fRaw === 'document', fMessage: fRaw === 'message', fBienvenue: fRaw === 'bienvenue', fPresel: fRaw === 'presel', fermer,
      // planifier
      jours, creneaux, modes, durees, invitesL, envoyerInvit, planOp: planOk ? '1' : '.45', planTitre: 'Entretien avec ' + c0.nom.split(' ')[0], retourVue,
      planMsg: `Bonjour ${c0.nom.split(' ')[0]}, je vous propose un entretien pour le poste « ${OFFRES[c0.offre].court} » le ${JOURS[jour][1]}${creneau !== null ? ' à ' + CREN[creneau] : ''}, ${mode === 'Visio' ? 'en visio' : mode === 'Sur place' ? 'dans nos bureaux de la Gombe' : 'par appel'}. Vous pouvez accepter ou proposer un autre moment.`,
      planifie, voirFicheApres: () => S({ vue: 'fiche', onglet: 'resume' }), retourListeApres: () => S({ vue: 'liste', sous: 'entretiens', entF: 'avenir' }), ajouterAgenda: () => flash('Ajouté à votre agenda et à celui de ' + avecT.split(',')[0]),
      // évaluation
      grille, recos, ptFort, ptVig, ecrireFort: (e) => S({ ptFort: val(e) }), ecrireVig: (e) => S({ ptVig: val(e) }), enregistrerEval, evalOp: evalOk ? '1' : '.45', evalTitre: 'Entretien de ' + c0.nom.split(' ')[0], evalSous: (ent0 ? ent0.j + ' · ' + ent0.mode + ' · avec ' + ent0.avec : 'Entretien'),
      // proposition
      salaire, debut, ecrireSalaire: (e) => S({ salaire: val(e).replace(/\D/g, '') }), ecrireDebut: (e) => S({ debut: val(e) }), msgProp, ecrireMsgProp: (e) => S({ msgProp: val(e) }), envoyerProp, propTitre: 'Proposition à ' + c0.nom.split(' ')[0], propPoste: OFFRES[c0.offre].t,
      // diagnostic
      diag, couv, diagOffres, preselTous, aPreselTous: aPreselTous.length > 0, preselTousT: aPreselTous.length === 1 ? 'Présélectionner la personne encore en « Reçue »' : 'Présélectionner les ' + aPreselTous.length + ' encore en « Reçue »', confirmerPresel: () => S({ feuille: 'presel' }),
      pdfDiag: () => S({ feuille: 'pdf', pdfPour: 'offre', pourSel: false }), retourDiag: () => S({ vue: 'liste' }),
      fab: vue === 'liste' && !rech && !selMode
    };
  }
}
