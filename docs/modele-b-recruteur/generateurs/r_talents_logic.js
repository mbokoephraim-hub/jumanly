class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
/*DONNEES*/
    // Talents visibles par les recruteurs : ils ont rendu leur profil visible (règle d’or 5). Les candidats sont rangés dans Candidatures.
    const T = (o) => ({ ...o, scores: Object.fromEntries(Object.entries(o.v).map(([k, v]) => [k, scoreDe(v)])) });
    const TAL = [
      T({ k: 'rachel', nom: 'Rachel Kanku', ini: 'RK', bg: '#DDF6EE', fg: '#14745F', titre: 'Data analyst · 2 ans', ville: 'Goma', mobile: 'Prête à venir à Kinshasa', ouvert: true, cap: true,
        comp: [['SQL', true], ['Excel', true], ['Power BI', true], ['Python', false]], exp: [['Data analyst', 'Kivu Data Lab · 2 ans'], ['Stagiaire statistique', 'INS Goma · 6 mois']], form: 'Licence en statistique, ULPGL (2023)', langues: 'Français C2 · Anglais B2 · Swahili C2',
        interets: ['Fintech', 'Tableaux de bord', 'Kinshasa'], reals: [['Tableau de bord des ventes', '3 200 vues · publié dans le Fil'], ['Attestation SQL Jumanly', 'Vérifiable en ligne']], v: { analyste: [1, 0.9, 0.9, 1, 1, 0.7, 1, 0.9] }, actif: 'hier' }),
      T({ k: 'cedric', nom: 'Cédric Mpoyi', ini: 'CM', bg: '#E3E8FB', fg: '#2D3F8A', titre: 'Développeur Flutter · 4 ans', ville: 'Kinshasa', mobile: '', ouvert: true, cap: false,
        comp: [['Flutter', true], ['Dart', true], ['Firebase', true]], exp: [['Développeur mobile', 'Kin Digital · 4 ans']], form: 'Licence en informatique, UPN (2021)', langues: 'Français C2 · Anglais B2',
        interets: ['Mobile', 'Télétravail', 'Encadrer'], reals: [['Appli de livraison Kin Express', '50 000 téléchargements']], v: { flutter: [1, 0.9, 1, 1, 0.9, 1, 0.5, 0.9] }, actif: 'aujourd’hui' }),
      T({ k: 'nathalie', nom: 'Nathalie Banza', ini: 'NB', bg: '#FBE3EF', fg: '#8A2D5C', titre: 'Conseillère clientèle · 5 ans', ville: 'Lubumbashi', mobile: '', ouvert: true, cap: true,
        comp: [['Service client', true], ['Swahili', true], ['Encadrement', false]], exp: [['Cheffe d’équipe accueil', 'Orange Money · 2 ans'], ['Conseillère', 'Orange Money · 3 ans']], form: 'Licence en gestion, UNILU (2019)', langues: 'Français C2 · Swahili C2 · Anglais B1',
        interets: ['Service client', 'Encadrer une équipe'], reals: [['Meilleure équipe du trimestre', 'Orange Money Lubumbashi']], v: { clientele: [1, 1, 1, 1, 1, 1, 0.5, 0.9] }, actif: 'il y a 3 jours' }),
      T({ k: 'joel', nom: 'Joël Kabeya', ini: 'JK', bg: '#E8F0D8', fg: '#4F6B12', titre: 'Community manager · 2 ans', ville: 'Kinshasa', mobile: '', ouvert: true, cap: false,
        comp: [['Réseaux sociaux', true], ['Canva', true], ['Rédaction', false]], exp: [['Community manager', 'Agence Mboka · 2 ans']], form: 'Licence en communication, IFASIC (2023)', langues: 'Français C2 · Anglais B1 · Lingala',
        interets: ['Marketing', 'Fintech'], reals: [['Campagne « Mboka na biso »', '120 000 personnes touchées']], v: { marketing: [0.9, 0.8, 0.8, 1, 0.9, 1, 1, 0.8] }, actif: 'aujourd’hui' }),
      T({ k: 'prince', nom: 'Prince Kalonji', ini: 'PK', bg: '#F9E3C8', fg: '#8A4B12', titre: 'Étudiant en data · cherche un stage', ville: 'Kinshasa', mobile: '', ouvert: true, cap: true,
        comp: [['Excel', true], ['SQL', false]], exp: [['Projet de fin d’études', 'Analyse des prix du marché de la Liberté']], form: 'Licence en économie en cours, UNIKIN', langues: 'Français C2 · Lingala',
        interets: ['Data', 'Stage'], reals: [['Cours SQL Jumanly terminé', '12 leçons · Cap']], v: { analyste: [0.6, 0.5, 0.3, 0.8, 0.8, 1, 0.5, 0.7] }, actif: 'il y a 2 jours' }),
      T({ k: 'gloria', nom: 'Gloria Ndaya', ini: 'GN', bg: '#EDE3FB', fg: '#5A2D8A', titre: 'Analyste crédit · 3 ans', ville: 'Kinshasa', mobile: '', ouvert: false, cap: false,
        comp: [['Excel', true], ['Risque crédit', true], ['SQL', false]], exp: [['Analyste crédit', 'Fleuve Banque · 3 ans']], form: 'Master en finance, UNIKIN (2022)', langues: 'Français C2 · Anglais C1',
        interets: ['Risques', 'Fintech'], reals: [['Modèle de score de crédit', 'Présenté au Forum Fintech Kinshasa']], v: { analyste: [0.8, 0.7, 0.9, 1, 1, 1, 0.5, 0.8] }, actif: 'il y a 1 semaine' })
    ];
    const talDe = (k) => TAL.find((t) => t.k === k) || TAL[0];
    const meilleure = (t) => Object.entries(t.scores).sort((a, b) => b[1] - a[1])[0];

    const vue = prop('vue', 'accueil');
    const sous = prop('sous', 'decouvrir');
    const tk = prop('talent', 'rachel');
    const t0 = talDe(tk);
    const fRaw = has('feuille') ? st.feuille : (p.feuille && p.feuille !== 'aucune' ? p.feuille : null);
    const fermer = () => S({ feuille: null });
    const ouvrir = (k) => () => S({ vue: 'profil', talent: k, ongletP: 'profil', feuille: null, rech: false, orbi: false, depuis: vue });

    // ---------- Vivier (listes) et propositions ----------
    const LISTES0 = { data: { t: 'Data · Kinshasa et Goma', m: ['rachel', 'prince', 'gloria'] }, managers: { t: 'Futurs chefs d’équipe', m: ['nathalie'] }, mobile: { t: 'Mobile', m: ['cedric'] } };
    const listes = st.listes || LISTES0;
    const listeK = prop('liste', 'data');
    const dansVivier = (k) => Object.values(listes).some((l) => l.m.includes(k));
    const props0 = { gloria: { of: 'analyste', etat: 'vue', d: 'mardi' }, joel: { of: 'marketing', etat: 'acceptee', d: 'lundi' } };
    const propsE = st.props || props0;
    const ETATP = { envoyee: ['Envoyée', '#B9CBC6'], vue: ['Vue, sans réponse', '#F4D59A'], acceptee: ['Acceptée : il candidate', '#A6F26B'], declinee: ['Déclinée', '#8FA39E'] };

    const filtreOf = prop('fo', 'tout');
    const tuile = (t) => {
      const [ok, sc] = filtreOf !== 'tout' && t.scores[filtreOf] !== undefined ? [filtreOf, t.scores[filtreOf]] : meilleure(t);
      const b = bande(sc);
      return { ...t, sc: sc + ' %', sbg: b[2], scol: b[1], pour: OFFRES[ok].court, ouvrir: ouvrir(t.k), aCap: t.cap, enVivier: dansVivier(t.k), aProp: !!propsE[t.k], propT: propsE[t.k] ? ETATP[propsE[t.k].etat][0] : '' };
    };
    const filtres = [['tout', 'Toutes mes offres'], ...Object.keys(OFFRES).map((k) => [k, OFFRES[k].court])];
    const visibles = TAL.filter((t) => t.ouvert || propsE[t.k]);
    const pourOffres = visibles.filter((t) => filtreOf === 'tout' || t.scores[filtreOf] !== undefined).map(tuile).sort((a, b) => parseInt(b.sc) - parseInt(a.sc));

    // ---------- Recherche en deux temps ----------
    const rech = has('rech') ? st.rech : !!p.recherche;
    const q = has('q') ? st.q : (p.recherche === 'texte' ? 'sql' : '');
    const nq = norm(q.trim());
    const rt = st.rt || 'tout';
    const rTypes = pills([['tout', 'Tout'], ['competence', 'Compétence'], ['metier', 'Métier'], ['ville', 'Ville']], rt, 'rt');
    const resRech = !nq ? [] : visibles.filter((t) => {
      const champs = { competence: t.comp.map((c) => c[0]).join(' '), metier: t.titre, ville: t.ville + ' ' + t.mobile };
      return norm(rt === 'tout' ? Object.values(champs).join(' ') + ' ' + t.nom : champs[rt]).includes(nq);
    }).map(tuile);
    const recents = [['SQL', 'compétence'], ['Swahili Lubumbashi', 'compétence et ville'], ['Flutter', 'métier']].map(([t, d]) => ({ t, d, pick: () => S({ q: t.split(' ')[0] }) }));
    const suggestions = [['Power BI', 'manque à 14 candidats de l’offre Analyste'], ['Encadrement', 'pour Chargé·e de clientèle']].map(([t, d]) => ({ t, d, pick: () => S({ q: t }) }));

    // ---------- Profil vu par le recruteur ----------
    const ongletP = prop('ongletP', 'profil');
    const [okP, scP] = meilleure(t0);
    const bP = bande(scP);
    const vP = t0.v[okP];
    const profil = { ...t0, sc: scP + ' %', sbg: bP[2], scol: bP[1], bandeT: bP[0], pour: OFFRES[okP].t, aMobile: !!t0.mobile, aCap: t0.cap,
      enVivier: dansVivier(t0.k), vivierT: dansVivier(t0.k) ? 'Dans votre vivier' : 'Ajouter au vivier',
      aProp: !!propsE[t0.k], propT: propsE[t0.k] ? 'Proposition ' + OFFRES[propsE[t0.k].of].court + ' · ' + ETATP[propsE[t0.k].etat][0].toLowerCase() : '',
      comp: t0.comp.map(([t, ok]) => ({ t, v: ok ? 'Vérifiée' : 'Déclarée', vc: ok ? '#A6F26B' : '#8FA39E' })),
      exp: t0.exp.map(([t, d]) => ({ t, d })), interets: t0.interets.map((t) => ({ t })), reals: t0.reals.map(([t, d]) => ({ t, d })),
      criteres: CRITERES.map(([k, t, w], i) => ({ t, pts: (Math.round(w * vP[i] * 10) / 10) + ' / ' + w, larg: Math.round(vP[i] * 100) + '%', col: vP[i] >= 0.85 ? '#A6F26B' : vP[i] >= 0.6 ? '#9FE8D2' : '#F4D59A' })) };
    const ongletsP = onglets([['profil', 'Profil'], ['parcours', 'Parcours'], ['realisations', 'Réalisations']], ongletP, 'ongletP');

    // Proposer une offre
    const pOf = st.pOf || okP;
    const offresProp = Object.keys(OFFRES).filter((k) => OFFRES[k].statut === 'encours').map((k) => {
      const s = t0.scores[k]; const on = k === pOf;
      return { t: OFFRES[k].t, s: s !== undefined ? s + ' % compatible' : 'Score calculé à l’envoi', pick: () => S({ pOf: k }), bd: on ? '#A6F26B' : 'rgba(255,255,255,.14)', bg: on ? 'rgba(166,242,107,.08)' : 'transparent', rb: on ? '#A6F26B' : 'rgba(255,255,255,.3)', rbg: on ? '#A6F26B' : 'transparent' };
    });
    const msgPropDef = `Bonjour ${t0.nom.split(' ')[0]}, votre profil correspond à notre offre « ${OFFRES[pOf].t} ». Si elle vous intéresse, vous pouvez candidater en un geste, gratuitement. Nadia, Baobab Fintech`;
    const msgProp = st.msgProp ?? msgPropDef;
    const envoyerProp = () => S({ props: { ...propsE, [t0.k]: { of: pOf, etat: 'envoyee', d: 'à l’instant' } }, feuille: 'propEnvoyee', msgProp: undefined });

    // Ajouter au vivier
    const lsel = st.lsel || Object.keys(listes).filter((k) => listes[k].m.includes(t0.k));
    const listesChoix = Object.entries(listes).map(([k, l]) => { const on = lsel.includes(k); return { t: l.t, n: l.m.length + ' personne' + (l.m.length > 1 ? 's' : ''), pick: () => S({ lsel: on ? lsel.filter((x) => x !== k) : [...lsel, k] }), sym: on ? '✓' : '', bg: on ? '#A6F26B' : 'transparent', bd: on ? '#A6F26B' : 'rgba(255,255,255,.3)' }; });
    const nouvelleL = st.nouvelleL ?? '';
    const enregistrerVivier = () => {
      const L = JSON.parse(JSON.stringify(listes));
      Object.keys(L).forEach((k) => { L[k].m = L[k].m.filter((x) => x !== t0.k); if (lsel.includes(k)) L[k].m.push(t0.k); });
      if (nouvelleL.trim()) L['l' + Object.keys(L).length] = { t: nouvelleL.trim(), m: [t0.k] };
      S({ listes: L, feuille: null, lsel: undefined, nouvelleL: '' }); flash(lsel.length || nouvelleL.trim() ? `${t0.nom.split(' ')[0]} est dans votre vivier` : 'Retiré du vivier');
    };

    // Vivier : listes et liste ouverte
    const vivierL = Object.entries(listes).map(([k, l]) => ({ t: l.t, n: l.m.length + ' talent' + (l.m.length > 1 ? 's' : ''), avs: l.m.slice(0, 3).map((m) => { const x = talDe(m); return { ini: x.ini, bg: x.bg, fg: x.fg }; }), ouvrir: () => S({ vue: 'liste', liste: k }) }));
    const lst = listes[listeK] || Object.values(listes)[0];
    const membres = lst.m.map((m) => tuile(talDe(m)));
    const propsL = Object.entries(propsE).map(([k, pr]) => { const x = talDe(k); return { nom: x.nom, ini: x.ini, bg: x.bg, fg: x.fg, offre: OFFRES[pr.of].court, d: pr.d, etat: ETATP[pr.etat][0], ecol: ETATP[pr.etat][1], ouvrir: ouvrir(k), aCand: pr.etat === 'acceptee' }; });

    // ---------- Réseau : relations avec des talents et d’autres recruteurs ----------
    const PERS = {
      christelle: { nom: 'Christelle Mwamba', ini: 'CM', bg: '#1E4E79', fg: '#FFFFFF', s: 'Recruteuse · Fleuve Banque · Kinshasa', type: 'Recruteuse', href: 'Recruteur-entreprise-fleuve.dc.html', commun: '12 relations en commun' },
      tresor: { nom: 'Trésor Banza', ini: 'TB', bg: '#4B2D7A', fg: '#FFFFFF', s: 'Responsable RH · Kivu Data Lab · Goma', type: 'RH', href: 'Recruteur-entreprise-kivu.dc.html', commun: 'Même domaine : data' },
      ornella: { nom: 'Ornella Kazadi', ini: 'OK', bg: '#B07A12', fg: '#FFFFFF', s: 'Chargée RH · Mwinda Énergie · Kinshasa', type: 'RH', href: 'Recruteur-entreprise-mwinda.dc.html', commun: 'Même ville : Kinshasa' }
    };
    TAL.forEach((t) => { PERS[t.k] = { nom: t.nom, ini: t.ini, bg: t.bg, fg: t.fg, s: t.titre + ' · ' + t.ville, type: 'Talent', href: t.k === 'rachel' ? 'Recruteur-talent.dc.html' : `Recruteur-talent-${t.k}.dc.html`, commun: t.cap ? 'Badge Cap' : 'Même pays : RD Congo' }; });
    const rel = st.rel || { joel: 'relation', christelle: 'relation', nathalie: 'relation' };
    const recues = (st.recues || ['prince', 'tresor']).filter((k) => !rel[k]);
    const etatRel = (k) => rel[k] || '';
    const relBouton = (k) => { const e = etatRel(k); return { bt: e === 'relation' ? 'Relation' : e === 'attente' ? 'En attente' : 'Se connecter', bbg: e ? 'transparent' : '#A6F26B', bcol: e ? '#B9CBC6' : '#0B1A1F', bbd: e ? 'rgba(255,255,255,.22)' : '#A6F26B',
      connecter: () => { if (e === 'relation') return; S({ rel: { ...rel, [k]: e === 'attente' ? undefined : 'attente' } }); if (!e) flash(`Invitation envoyée à ${PERS[k].nom.split(' ')[0]}`); } }; };
    const convDe = (k) => (k === 'joel' ? 'Recruteur-conversation-talent.dc.html' : ['nathalie', 'christelle'].includes(k) ? `Recruteur-conversation-${k}.dc.html` : 'Recruteur-messages-nouveau.dc.html');
    const persL = (k) => ({ k, ...PERS[k], ...relBouton(k), msgHref: convDe(k) });
    const invitations = recues.map((k) => ({ ...persL(k), accepter: () => { S({ rel: { ...rel, [k]: 'relation' } }); flash(`${PERS[k].nom.split(' ')[0]} fait partie de vos relations`); }, ignorer: () => S({ recues: recues.filter((x) => x !== k) }) }));
    const relations = Object.keys(rel).filter((k) => rel[k] === 'relation').map(persL);
    const suggestionsR = ['ornella', 'rachel', 'cedric', 'gloria'].filter((k) => rel[k] !== 'relation').map(persL);
    const relFiltre = prop('rf', 'tous');
    const relationsF = relations.filter((x) => relFiltre === 'tous' || (relFiltre === 'talents' ? x.type === 'Talent' : x.type !== 'Talent'));
    const profilRel = relBouton(t0.k);

    const OQ = {
      qui: { q: 'Qui proposer pour l’offre Analyste ?', t: `Rachel Kanku (Goma, prête à venir à Kinshasa) couvre SQL, Excel et Power BI vérifiés : ${talDe('rachel').scores.analyste} %. Elle n’a pas encore candidaté. Gloria Ndaya a vu votre proposition mardi sans répondre.`, actT: 'Voir le profil de Rachel', act: () => S({ vue: 'profil', talent: 'rachel', orbi: false }) },
      relance: { q: 'Relancer les propositions sans réponse', t: 'Une seule proposition attend : Gloria Ndaya, vue mardi. Une relance courte suffit ; si elle ne répond pas, Jumanly ne la relancera pas une deuxième fois.', actT: 'Voir les propositions', act: () => S({ vue: 'accueil', sous: 'propositions', orbi: false }) },
      visibilite: { q: 'Pourquoi je ne vois pas tous les talents ?', t: 'Vous voyez les personnes qui ont rendu leur profil visible aux recruteurs, et celles qui ont candidaté chez vous (dans Candidatures). Chaque profil ouvert est enregistré et la personne le sait.' }
    };
    const ok = orbiKit(OQ, 'depuis Talents', 'Trouver des talents', vue === 'accueil' && sous === 'decouvrir' ? 'qui' : null);

    return {
      ...ok,
      vAccueil: vue === 'accueil', vProfil: vue === 'profil', vListe: vue === 'liste',
      sousOnglets: onglets([['decouvrir', 'Découvrir'], ['vivier', 'Vivier', String(Object.values(listes).reduce((a, l) => a + l.m.length, 0))], ['propositions', 'Propositions', String(Object.keys(propsE).length)], ['reseau', 'Réseau', recues.length ? String(recues.length) : '']], sous, 'sous'),
      sRes: sous === 'reseau', invitations, aInvit: invitations.length > 0, relationsF, suggestionsR, nRelT: (relations.length + 125) + ' relations', relFiltres: pills([['tous', 'Toutes'], ['talents', 'Talents'], ['recruteurs', 'Recruteurs et RH']], relFiltre, 'rf'), profilRel, msgHrefP: convDe(t0.k), estRelation: etatRel(t0.k) === 'relation', pasRelation: etatRel(t0.k) !== 'relation',
      sDec: sous === 'decouvrir', sViv: sous === 'vivier', sProp: sous === 'propositions',
      filtres: pills(filtres, filtreOf, 'fo'), pourOffres, aPourOffres: pourOffres.length > 0, sansPourOffres: pourOffres.length === 0,
      nVisT: `${visibles.length} talents visibles · mis à jour aujourd’hui`,
      aRech: rech, sansRech: !rech, q, aQ: q.length > 0, qVide: !nq, qPlein: !!nq, rTypes, recents, suggestions, resRech, rRien: !!nq && resRech.length === 0, nRes: resRech.length + ' talent' + (resRech.length > 1 ? 's' : ''),
      ouvrirRech: () => S({ rech: true }), annulerRech: () => S({ rech: false, q: '' }), chercher: (e) => S({ q: val(e) }), viderQ: () => S({ q: '' }),
      vivierL, nouvelleListe: () => S({ feuille: 'creerListe' }), nomListe: st.nomListe ?? '', ecrireNomListe: (e) => S({ nomListe: val(e) }),
      creerListe: () => { const n = (st.nomListe || '').trim(); if (!n) return flash('Donnez un nom à la liste'); S({ listes: { ...listes, ['l' + Object.keys(listes).length]: { t: n, m: [] } }, feuille: null, nomListe: '' }); flash(`Liste « ${n} » créée`); },
      propsL, aPropsL: propsL.length > 0,
      // liste ouverte
      listeT: lst.t, listeN: lst.m.length + ' talent' + (lst.m.length > 1 ? 's' : ''), membres, retourListe: () => S({ vue: 'accueil', sous: 'vivier' }),
      // profil
      profil, ongletsP, oProfil: ongletP === 'profil', oParcours: ongletP === 'parcours', oReals: ongletP === 'realisations',
      retourProfil: () => S({ vue: st.depuis === 'liste' ? 'liste' : 'accueil', feuille: null }), retourT: st.depuis === 'liste' ? lst.t : 'Talents',
      ouvrirPourquoi: () => S({ feuille: 'pourquoi' }), ouvrirProposer: () => S({ feuille: 'proposer', pOf: okP }), ouvrirVivier: () => S({ feuille: 'vivier' }), ouvrirMenuP: () => S({ feuille: 'menuP' }),
      fPourquoi: fRaw === 'pourquoi', fProposer: fRaw === 'proposer', fPropEnvoyee: fRaw === 'propEnvoyee', fVivier: fRaw === 'vivier', fMenuP: fRaw === 'menuP', fCreerListe: fRaw === 'creerListe', fermer,
      offresProp, msgProp, ecrireMsgProp: (e) => S({ msgProp: val(e) }), envoyerProp, propOffreT: OFFRES[pOf].t,
      listesChoix, nouvelleL, ecrireNouvelleL: (e) => S({ nouvelleL: val(e) }), enregistrerVivier,
      menuP: [
        { t: 'Partager le profil à un collègue', s: 'Aline, Patrice ou Joseph le reçoivent dans Messages', go: () => { fermer(); flash('Profil partagé avec Aline Mukeba'); } },
        { t: 'Télécharger le profil en PDF', s: 'Le téléchargement est enregistré', go: () => { fermer(); flash('Profil téléchargé en PDF'); } },
        { t: 'Masquer ce profil de mes suggestions', s: 'Il reste visible par recherche', go: () => { S({ vue: 'accueil', feuille: null }); flash('Profil masqué de vos suggestions'); } },
        { t: 'Signaler ce profil', s: 'L’équipe Jumanly vérifie sous 24 h', go: () => { fermer(); flash('Signalement envoyé à l’équipe Jumanly'); } }
      ],
      fab: vue === 'accueil' && !rech
    };
  }
}
