    // ================= Pilotage : agenda, équipe, tableau de bord, mon espace =================
    const admin = oui(p.admin);
    const moiN = admin ? 'Joseph Ilunga' : 'Nadia Kalala';
    const moiIni = admin ? 'JI' : 'NK';
    const moiRole = admin ? 'Responsable RH · administrateur' : 'Chargée de recrutement';
    const EQ = [['joseph', 'Joseph Ilunga', 'JI', '#14745F', '#FFFFFF', 'Administrateur'], ['nadia', 'Nadia Kalala', 'NK', '#1B3338', '#F2EDE5', 'Recruteuse'], ['aline', 'Aline Mukeba', 'AM', '#2A3B3E', '#F2EDE5', 'Manager · data'], ['patrice', 'Patrice Nzuzi', 'PN', '#2A3B3E', '#F2EDE5', 'Manager · service client']];
    const eqDe = (k) => { const m = EQ.find((x) => x[0] === k); return { k, nom: m[1], prenom: m[1].split(' ')[0], ini: m[2], bg: m[3], fg: m[4], role: m[5] }; };
    const moiK = admin ? 'joseph' : 'nadia';

    // ---------- Agenda (semaine du lundi 20 octobre 2026 ; aujourd’hui jeudi 22) ----------
    const JOURS = [['lun', 'Lun. 20'], ['mar', 'Mar. 21'], ['mer', 'Mer. 22'], ['jeu', 'Jeu. 23'], ['ven', 'Ven. 24']];
    const EV0 = [
      ['e1', 'mar', 14, 0.75, 'entretien', 'Entretien · Nathan Ilunga', 'Chargé·e de clientèle · en agence, Lubumbashi', ['patrice'], 'nathan'],
      ['e2', 'mer', 9.5, 0.5, 'equipe', 'Point équipe recrutement', 'Salle Kasaï · ordre du jour : offres de novembre', ['joseph', 'nadia', 'aline', 'patrice'], ''],
      ['e3', 'mer', 15, 0.5, 'appel', 'Appel · Benjamin Tshibangu', 'Date de début : il propose le 9 novembre', ['nadia'], 'benjamin'],
      ['e4', 'jeu', 10, 0.75, 'entretien', 'Entretien · Grâce Mbuyi', 'Analyste de données junior · visio', ['nadia', 'aline'], 'grace'],
      ['e5', 'jeu', 14, 0.75, 'entretien', 'Entretien · Moussa Diallo', 'Développeur·se Flutter · visio', ['nadia'], 'moussa'],
      ['e6', 'ven', 11, 0.5, 'eval', 'Restitution · évaluation de Didier Lukusa', 'Aline présente son évaluation 4 étoiles', ['aline', 'nadia'], 'didier'],
      ['e7', 'lun', 16, 1, 'equipe', 'Préparer la journée carrière', 'Samedi 14 novembre, Kinshasa', ['joseph', 'nadia'], '']
    ];
    const TYPEC = { entretien: ['#A6F26B', '#0B1A1F'], equipe: ['#2FD3A6', '#0B1A1F'], appel: ['#F4D59A', '#0B1A1F'], eval: ['#9FC6F2', '#0B1A1F'] };
    const evAjout = st.evAjout || [];
    const evAnn = st.evAnn || {};
    const agF = prop('agF', 'tout');
    const evs = EV0.concat(evAjout).filter((e) => !evAnn[e[0]]).filter((e) => agF === 'tout' || (agF === 'moi' ? e[7].includes(moiK) : e[4] === 'equipe'));
    const evK = prop('evK', 'e4');
    const HEURES = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => ({ t: h + ' h' }));
    const colsAg = JOURS.map(([jk, jt]) => ({ t: jt, auj: jk === 'jeu' ? '#A6F26B' : '#B9CBC6', fond: jk === 'jeu' ? 'rgba(166,242,107,.05)' : 'transparent',
      evs: evs.filter((e) => e[1] === jk).map(([k, j, h, dur, ty, t, s, qui]) => ({ k, t, heure: (Math.floor(h) + ' h' + (h % 1 ? String(Math.round((h % 1) * 60)).padStart(2, '0') : '')), top: ((h - 8) * 64) + 'px', haut: Math.max(dur * 64 - 4, 30) + 'px', bg: k === evK ? '#F2EDE5' : TYPEC[ty][0], col: TYPEC[ty][1], qui: qui.map((q) => eqDe(q).ini).join(' · '), ouvrir: () => S({ evK: k }) })) }));
    const evSel = EV0.concat(evAjout).find((e) => e[0] === evK) || EV0[3];
    const evD = { t: evSel[5], s: evSel[6], jour: JOURS.find((j) => j[0] === evSel[1])[1] + ' octobre', heure: Math.floor(evSel[2]) + ' h' + (evSel[2] % 1 ? '30' : '') + ' · ' + Math.round(evSel[3] * 60) + ' min', type: { entretien: 'Entretien', equipe: 'Réunion d’équipe', appel: 'Appel', eval: 'Évaluation' }[evSel[4]],
      qui: evSel[7].map(eqDe), aCand: !!evSel[8], cand: evSel[8], estEnt: evSel[4] === 'entretien', annule: !!evAnn[evSel[0]] };
    const MOIS = []; for (let i = 0; i < 3; i++) MOIS.push({ t: '', vide: true, bg: 'transparent', col: '#8FA39E', fw: '500' });
    for (let d = 1; d <= 31; d++) { const sem = d >= 20 && d <= 24; const occ = [20, 21, 22, 23, 24, 28, 30].includes(d); MOIS.push({ t: String(d), vide: false, bg: d === 22 ? '#A6F26B' : sem ? '#13282C' : 'transparent', col: d === 22 ? '#0B1A1F' : '#F2EDE5', fw: occ ? '700' : '400' }); }
    const aVenir = EV0.concat(evAjout).filter((e) => !evAnn[e[0]] && (e[1] === 'jeu' || e[1] === 'ven')).map((e) => ({ t: e[5], d: JOURS.find((j) => j[0] === e[1])[1] + ' · ' + Math.floor(e[2]) + ' h' + (e[2] % 1 ? '30' : ''), go: () => S({ evK: e[0] }) }));
    const nvType = st.nvType || 'entretien';
    const nvCand = st.nvCand || 'esther';
    const nvCren = st.nvCren ?? 0;
    const CRENS = [['ven', 9, 'Ven. 24 · 9 h', 'Aline et Nadia libres'], ['ven', 14, 'Ven. 24 · 14 h', 'Nadia libre · Aline en réunion'], ['jeu', 16, 'Jeu. 23 · 16 h', 'Tout le monde est libre']];
    const sync = st.sync ?? true;

    // ---------- Équipe (administrateur) : droits et tâches ----------
    const DROITS = [['publier', 'Publier et modifier les offres'], ['trier', 'Trier les candidatures (ATS)'], ['entretiens', 'Planifier et mener les entretiens'], ['evaluer', 'Évaluer les candidats et le diagnostic'], ['evolution', 'Voir l’évolution et les statistiques'], ['page', 'Publier au nom de Baobab Fintech']];
    const D0 = { nadia: { publier: true, trier: true, entretiens: true, evaluer: true, evolution: true, page: true }, aline: { publier: false, trier: true, entretiens: true, evaluer: true, evolution: false, page: false }, patrice: { publier: false, trier: true, entretiens: true, evaluer: true, evolution: false, page: false } };
    const droits = st.droits || D0;
    const membreK = prop('membreK', 'aline');
    const TYPESA = [['suivre', 'Suivre un candidat'], ['diagnostic', 'Évaluer le diagnostic'], ['entretien', 'Faire un entretien']];
    const T0A = [
      ['t1', 'entretien', 'grace', 'aline', 'Jeu. 23 oct.', 1],
      ['t2', 'diagnostic', 'didier', 'aline', 'Lun. 20 oct.', 3],
      ['t3', 'suivre', 'benjamin', 'nadia', 'Ven. 31 oct.', 2],
      ['t4', 'suivre', 'nathan', 'patrice', 'Ven. 24 oct.', 2],
      ['t5', 'diagnostic', 'moussa', 'nadia', 'Ven. 24 oct.', 0],
      ['t6', 'entretien', 'moussa', 'nadia', 'Jeu. 23 oct.', 1]
    ];
    const tAjout = st.tAjout || [];
    const tEtat = st.tEtat || {};
    const ETATSA = ['Attribuée', 'Acceptée', 'En cours', 'Terminée'];
    const taches = T0A.concat(tAjout).map(([k, ty, ck, mk, d, e0]) => { const e = tEtat[k] ?? e0; const cand = CANDS.find((x) => x.k === ck); const m = eqDe(mk);
      return { k, type: TYPESA.find((x) => x[0] === ty)[1], ty, cand: cand.nom, candK: ck, m, mk, d, e, etat: ETATSA[e], btT: ['Accepter', 'Commencer', 'Marquer comme terminée', ''][e], fait: e === 3, pasFait: e < 3, pct: Math.round((e / 3) * 100) + '%', ecol: e === 3 ? '#A6F26B' : e === 0 ? '#F4D59A' : '#2FD3A6',
        etapes: ETATSA.map((t, i) => ({ t, col: i <= e ? '#2FD3A6' : '#2A3B3E', fw: i === e ? '700' : '500' })),
        ouvrirC: go('candidat', { candK: ck }), relancer: () => flash('Rappel envoyé à ' + m.prenom),
        avancerT: () => { S({ tEtat: { ...tEtat, [k]: Math.min(3, e + 1) } }); flash(e + 1 >= 3 ? 'Tâche terminée : ' + (admin ? m.prenom + ' a fini' : 'Joseph est prévenu') : 'Tâche passée à « ' + ETATSA[e + 1] + ' »'); } }; });
    const eqL = EQ.filter((x) => x[0] !== 'joseph').map(([k]) => { const m = eqDe(k); const mes = taches.filter((t) => t.mk === k); const f = mes.filter((t) => t.fait).length;
      return { ...m, n: String(mes.length), fT: f + ' sur ' + mes.length + ' terminée' + (f > 1 ? 's' : ''), pct: (mes.length ? Math.round((f / mes.length) * 100) : 0) + '%', sel: k === membreK, bord: k === membreK ? '#A6F26B' : 'transparent', choisir: () => S({ membreK: k }),
        nDroits: String(DROITS.filter(([d]) => (droits[k] || {})[d]).length) + ' droits sur ' + DROITS.length }; });
    const mSel = eqDe(membreK);
    const droitsL = DROITS.map(([d, t]) => { const on = !!(droits[membreK] || {})[d]; return { t, on, fond: on ? '#A6F26B' : '#2A3B3E', x: on ? '20px' : '0px', etat: on ? 'true' : 'false', basculer: () => { S({ droits: { ...droits, [membreK]: { ...(droits[membreK] || {}), [d]: !on } } }); flash((on ? 'Droit retiré à ' : 'Droit accordé à ') + mSel.prenom + ' : ' + t.toLowerCase()); } }; });
    const tachesM = taches.filter((t) => t.mk === membreK);
    const aT = st.aT || {};
    const aMembre = aT.m || membreK, aType = aT.t || 'entretien', aCand = aT.c || 'esther', aEch = aT.e || 'Ven. 24 oct.';
    const pk = (lst, actif, champ) => lst.map(([k, t]) => ({ t, pick: () => S({ aT: { ...aT, [champ]: k } }), bg: k === actif ? '#F2EDE5' : 'transparent', col: k === actif ? '#0B1A1F' : '#F2EDE5', bd: k === actif ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));

    // ---------- Tableau de bord ----------
    const per = prop('per', 'mois');
    const K = per === 'mois' ? [['170', 'candidatures reçues'], ['14', 'entretiens menés'], ['3', 'embauches'], ['6 j', 'délai moyen de première réponse'], ['100 %', 'des candidats ont eu une réponse'], ['4 sur 20', 'offres en ligne']] : [['412', 'candidatures reçues'], ['37', 'entretiens menés'], ['8', 'embauches'], ['7 j', 'délai moyen de première réponse'], ['100 %', 'des candidats ont eu une réponse'], ['4 sur 20', 'offres en ligne']];
    const ENT = per === 'mois' ? [['Candidatures', 170], ['Présélection', 42], ['Entretien', 14], ['Proposition', 4], ['Embauche', 3]] : [['Candidatures', 412], ['Présélection', 101], ['Entretien', 37], ['Proposition', 11], ['Embauche', 8]];
    const entonnoir = ENT.map(([t, n], i) => ({ t, n: String(n), nIn: i === 0 ? String(n) : '', w: Math.max(6, Math.round((n / ENT[0][1]) * 100)) + '%', taux: i ? Math.round((n / ENT[i - 1][1]) * 100) + ' % de l’étape précédente' : 'point de départ' }));
    const SEM = per === 'mois' ? [['22 sept.', 31], ['29 sept.', 38], ['6 oct.', 44], ['13 oct.', 52], ['20 oct.', 36]] : [['Août', 96], ['Sept.', 146], ['Oct.', 170]];
    const maxS = Math.max(...SEM.map((x) => x[1]));
    const barres = SEM.map(([t, n]) => ({ t, n: String(n), h: Math.round((n / maxS) * 150) + 'px' }));
    const parOffre = [['Analyste de données junior', 38, 8, 3, 0, '5 j'], ['Chargé·e de clientèle Mobile Money', 52, 14, 5, 2, '7 j'], ['Développeur·se mobile Flutter', 9, 4, 2, 0, '3 j'], ['Stagiaire marketing digital', 71, 16, 4, 1, '8 j']].map(([t, c, p2, e, h, d]) => ({ t, c: String(c), p: String(p2), e: String(e), h: String(h), d }));
    const parMembre = [['nadia', 96, 8, 5, '6 sur 8'], ['aline', 22, 4, 6, '3 sur 4'], ['patrice', 52, 2, 3, '2 sur 3'], ['joseph', 0, 0, 1, '1 sur 1']].map(([k, tr, en, ev, ta]) => ({ ...eqDe(k), tr: String(tr), en: String(en), ev: String(ev), ta }));
    const peutStats = admin || !!(droits.nadia || {}).evolution;

    // ---------- Mon espace ----------
    const mesTaches = taches.filter((t) => t.mk === moiK);
    const suivis = (admin ? ['grace', 'benjamin', 'nathan'] : ['benjamin', 'moussa', 'grace', 'esther']).map((k) => CANDS.find((x) => x.k === k)).map((x) => ({ ...x, etT: ETAPES.find((e) => e[0] === x.et)[1] }));
    const mesDroits = DROITS.map(([d, t]) => { const on = admin ? true : !!(droits.nadia || {})[d]; return { t, on, sym: on ? '✓' : '—', col: on ? '#A6F26B' : '#6F8580' }; });
    const actMoi = admin ? [['1', 'offre publiée'], ['4', 'tâches attribuées'], ['1', 'entretien mené'], ['12', 'messages au nom de Baobab']] : [['96', 'candidatures traitées'], ['8', 'entretiens menés'], ['5', 'évaluations'], ['2', 'offres publiées']];
    const rapT = prop('rapT', 'mensuel');
    const RAPS = { mensuel: ['Rapport d’activité · octobre 2026', 'Mes chiffres du mois, mes offres, mes entretiens et le suivi des candidats'], entretien: ['Compte rendu d’entretien · Grâce Mbuyi', 'Le score et son « Pourquoi ? », les points vérifiés, l’évaluation et la décision'], ats: ['Suivi ATS · Analyste de données junior', 'Chaque étape, les délais, les candidats et les messages envoyés'], entreprise: ['Rapport de recrutement · Baobab Fintech · octobre 2026', 'Indicateurs, entonnoir, offres, activité de l’équipe et délais'] };
    const rapK = st.rapK || rapT;

    const pilote = ['agenda', 'equipe', 'tableau', 'moi'].includes(vue);
    const PIL = {
      droiteOn: !tab && !pilote, orbiFlot: tab || pilote,
      admin, moiN, moiIni, moiRole, pasAdmin: !admin,
      vAgenda: vue === 'agenda', vEquipe: vue === 'equipe', vTableau: vue === 'tableau', vMoi: vue === 'moi',
      nb_agenda: navOn('agenda'), nc_agenda: navCol('agenda'), nb_equipe: navOn('equipe'), nc_equipe: navCol('equipe'), nb_tableau: navOn('tableau'), nc_tableau: navCol('tableau'), nb_moi: navOn('moi'), nc_moi: navCol('moi'),
      goAgenda: go('agenda'), goEquipe: go('equipe'), goTableau: go('tableau'), goMoi: go('moi'),
      // agenda
      HEURES, colsAg, evD, MOIS, aVenir, agPills: pills([['tout', 'Tout'], ['moi', 'Mes rendez-vous'], ['equipe', 'Réunions d’équipe']], agF, 'agF'),
      ficheEv: go('candidat', { candK: evSel[8] || 'grace' }), evalEv: () => flash('Grille d’évaluation ouverte : 5 critères, notée de 1 à 5'),
      rejoindre: () => flash('La visio s’ouvre dans le navigateur, sans installation'),
      reprogrammer: () => S({ modal: 'nouvel', nvCand: evSel[8] || 'grace' }), annulerEv: () => { S({ evAnn: { ...evAnn, [evSel[0]]: true }, evK: 'e5' }); flash('Rendez-vous annulé : la personne est prévenue par e-mail et message'); },
      nouvelEv: () => S({ modal: 'nouvel' }), mNouvel: modal === 'nouvel',
      nvTypes: pills([['entretien', 'Entretien'], ['appel', 'Appel'], ['equipe', 'Réunion d’équipe']], nvType, 'nvType'),
      nvCands: pills([['esther', 'Esther Kabila'], ['didier', 'Didier Lukusa'], ['kevin', 'Kevin Lumbala'], ['ruth', 'Ruth Kalenga']], nvCand, 'nvCand'), nvEstEq: nvType === 'equipe', nvPasEq: nvType !== 'equipe',
      nvCrens: CRENS.map(([j, h, t, s], i) => ({ t, s, pick: () => S({ nvCren: i }), bord: i === nvCren ? '#A6F26B' : 'rgba(255,255,255,.12)', bg: i === nvCren ? 'rgba(166,242,107,.08)' : 'transparent' })),
      creerEv: () => { const cr = CRENS[nvCren]; const cand = CANDS.find((x) => x.k === nvCand); const k = 'n' + evAjout.length; const titre = nvType === 'equipe' ? 'Réunion d’équipe' : (nvType === 'appel' ? 'Appel · ' : 'Entretien · ') + cand.nom; S({ evAjout: [...evAjout, [k, cr[0], cr[1], nvType === 'appel' ? 0.5 : 0.75, nvType, titre, nvType === 'equipe' ? 'Salle Kasaï' : OFFRES.find((o) => o.k === cand.of).t + ' · visio', nvType === 'equipe' ? ['joseph', 'nadia', 'aline', 'patrice'] : ['nadia', 'aline'], nvType === 'equipe' ? '' : nvCand]], modal: '', evK: k }); flash(nvType === 'equipe' ? 'Réunion ajoutée à l’agenda de l’équipe' : 'Invitation envoyée à ' + cand.nom.split(' ')[0] + ' : elle accepte ou propose un autre créneau'); },
      sync, basculerSync: () => S({ sync: !sync }), syFond: sync ? '#A6F26B' : '#2A3B3E', syX: sync ? '20px' : '0px', syEtat: sync ? 'true' : 'false',
      // équipe
      eqL, mSel, droitsL, tachesM, aTachesM: tachesM.length > 0, sansTachesM: tachesM.length === 0, taches,
      attribuer: () => S({ modal: 'tache', aT: { m: membreK } }), mTache: modal === 'tache',
      aMembres: pk(EQ.filter((x) => x[0] !== 'joseph').map((x) => [x[0], x[1]]), aMembre, 'm'), aTypes: pk(TYPESA, aType, 't'),
      aCands: pk([['esther', 'Esther Kabila'], ['didier', 'Didier Lukusa'], ['kevin', 'Kevin Lumbala'], ['ruth', 'Ruth Kalenga'], ['amani', 'Amani Kahindo']], aCand, 'c'), aEchs: pk([['Ven. 24 oct.', 'Ven. 24 oct.'], ['Mar. 28 oct.', 'Mar. 28 oct.'], ['Ven. 31 oct.', 'Ven. 31 oct.']], aEch, 'e'),
      confirmerTache: () => { S({ tAjout: [...tAjout, ['a' + tAjout.length, aType, aCand, aMembre, aEch, 0]], modal: '', membreK: aMembre }); flash('Tâche attribuée à ' + eqDe(aMembre).prenom + ' : elle la voit dans « Mon espace »'); },
      inviterMembre: () => flash('Invitation envoyée : 4 utilisateurs sur 5 dans la formule Company'),
      // tableau de bord
      kpis: K.map(([b, t]) => ({ b, t })), entonnoir, barres, parOffre, parMembre, perPills: pills([['mois', 'Octobre 2026'], ['trim', '3 derniers mois']], per, 'per'), perT: per === 'mois' ? 'octobre 2026' : 'août à octobre 2026',
      peutStats, pasStats: !peutStats,
      pdfEntreprise: () => S({ modal: 'pdf', rapK: 'entreprise' }),
      // mon espace
      mesTaches, aMesTaches: mesTaches.length > 0, suivis, mesDroits, actMoi: actMoi.map(([b, t]) => ({ b, t })),
      rapPills: pills([['mensuel', 'Activité du mois'], ['entretien', 'Un entretien'], ['ats', 'ATS d’une offre']], rapT, 'rapT'), rapTitre: RAPS[rapT][0], rapDesc: RAPS[rapT][1],
      pdfMoi: () => S({ modal: 'pdf', rapK: rapT }), mPdf: modal === 'pdf', pdfTitre: RAPS[rapK][0], pdfDesc: RAPS[rapK][1], pdfEnt: rapK === 'entreprise', pdfPers: rapK !== 'entreprise',
      pdfNom: rapK === 'entreprise' ? 'Joseph Ilunga · administrateur' : moiN + ' · ' + moiRole,
      pdfHref: 'rapports/' + { entreprise: 'Jumanly-Baobab-rapport-recrutement-octobre-2026', mensuel: 'Jumanly-Nadia-Kalala-rapport-activite-octobre-2026', entretien: 'Jumanly-compte-rendu-entretien-Nathan-Ilunga', ats: 'Jumanly-suivi-ATS-analyste-donnees' }[rapK] + '.pdf',
      telechargerPdf: () => { S({ modal: '' }); flash('PDF prêt : ' + (rapK === 'entreprise' ? 'Jumanly-Baobab-rapport-octobre-2026.pdf' : 'Jumanly-' + moiN.split(' ')[0] + '-' + rapK + '-octobre-2026.pdf')); }
    };
