class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const p = this.props || {};
    const has = (k) => Object.prototype.hasOwnProperty.call(st, k);
    const S = (o) => this.setState(o);
    const flash = (t) => { S({ toast: t }); clearTimeout(this._t); this._t = setTimeout(() => this.setState({ toast: null }), 2300); };

    const vue = st.vue ?? p.vue ?? 'fil';
    const de = st.de ?? 'fil';
    const post = st.post ?? p.post ?? 'ppi';
    const fRaw = has('feuille') ? st.feuille : (p.feuille || 'aucune');
    const feuille = fRaw && fRaw !== 'aucune' ? fRaw : null;
    const orbi = st.orbi ?? p.orbi ?? false;
    const oRaw = has('oRep') ? st.oRep : (p.orbiRep || 'aucune');
    const oRep = oRaw && oRaw !== 'aucune' ? oRaw : null;
    const ong = st.ong ?? 'tout';
    const aime = st.aime || {};
    const repub = st.repub || {};
    const cache = st.cache || {};
    const enreg = st.enreg || {};
    const mes = st.mes || {};
    const aimeR = st.aimeR || {};
    const lu = st.lu || {};
    const moi = st.moi || null;

    // Une seule fiche par personne ou entreprise, partagée avec les autres pages
    const AV = {
      gm: { n: 'Grâce Mbuyi', lg: 'GM', c: '#A6F26B', lc: '#0B1A1F', rad: '50%', r: 'Analyste de données junior', profil: 'Carriere.dc.html' },
      bf: { n: 'Baobab Fintech', lg: 'BF', c: '#0F3F37', lc: '#A6F26B', rad: '12px', r: 'Fintech · Kinshasa · 8 offres', profil: 'Entreprise.dc.html' },
      ak: { n: 'Amani Kasongo', lg: 'AK', c: '#FDF1D8', lc: '#8A5A00', rad: '50%', r: 'Étudiante en gestion · Lubumbashi', profil: 'Personne-amani.dc.html' },
      pi: { n: 'Patrick Ilunga', lg: 'PI', c: '#E3EEF9', lc: '#1E4E79', rad: '50%', r: 'Analyste crédit · Fleuve Banque', profil: 'Personne.dc.html' },
      fb: { n: 'Fleuve Banque', lg: 'FB', c: '#CFE4F7', lc: '#1E4E79', rad: '10px', r: 'Banque · Kinshasa · 3 offres' },
      sm: { n: 'Sarah Mbala', lg: 'SM', c: '#FBE4E0', lc: '#9A3524', rad: '50%', r: 'Étudiante en design graphique · Kinshasa', profil: 'Personne-sarah.dc.html' },
      me: { n: 'Mwinda Énergie', lg: 'ME', c: '#FFE1A1', lc: '#8A5A00', rad: '12px', r: 'Énergie solaire · Kinshasa · 3 offres' },
      jk: { n: 'Joël Kabeya', lg: 'JK', c: '#DDF6EE', lc: '#14745F', rad: '50%', r: 'Community manager · Kinshasa', profil: 'Personne-joel.dc.html' },
      nk: { n: 'Nadia Kalala', lg: 'NK', c: '#0F3F37', lc: '#A6F26B', rad: '50%', r: 'Recruteuse · Baobab Fintech', profil: 'Personne-nadia.dc.html' },
      ek: { n: 'Esther Kabila', lg: 'EK', c: '#14745F', lc: '#C9F1E3', rad: '50%', r: 'Chargée RH · Baobab Fintech', profil: 'Personne-esther.dc.html' },
      ob: { n: 'Orbi', lg: '✦', c: '#2FD3A6', lc: '#0B1A1F', rad: '50%', r: '' }
    };
    const R = (a, h, t, j) => ({ a, h, t, j });
    const POSTS = {
      pbf: { a: 'bf', tab: 'ent', t: 'On recrute trois analystes data à Kinshasa. Candidature en 5 minutes.', h: 'Aujourd’hui à 9 h 14', j: 142, r: 18, rp: 9, offre: true,
        reps: [R('jk', '1 h', 'Le poste est ouvert aux débutants ?', 3), R('bf', '1 h', 'Oui : deux ans d’expérience au plus, les stages comptent.', 9), R('ak', '40 min', 'Partagé à ma promo !', 2)] },
      pak: { a: 'ak', tab: 'tal', t: 'Badge « Bâtisseuse de communauté » obtenu ! Merci à toutes les personnes qui ont répondu à mes questions sur Jumanly.', h: 'Aujourd’hui à 8 h 40', j: 318, r: 24, rp: 4, img: 'A',
        reps: [R('sm', '2 h', 'Bravo Amani, c’est mérité !', 5), R('jk', '2 h', 'Tu réponds toujours en premier, normal.', 3)] },
      ppi: { a: 'pi', tab: 'tal', t: 'Premier jour chez Fleuve Banque comme analyste crédit. Offre trouvée sur Jumanly il y a trois semaines.', h: 'Aujourd’hui à 8 h 02', j: 207, r: 12, rp: 6, img: 'P',
        reps: [R('fb', '4 h', 'Bienvenue dans l’équipe, Patrick !', 48), R('jk', '4 h', 'Bravo frère, tu le mérites. Tu as postulé comment ?', 12), R('pi', '3 h', 'Profil complété à 100 %, puis Orbi m’a aidé à adapter mon CV à l’offre.', 21), R('pi', '1 h', '@Grâce Mbuyi regarde l’offre de Baobab Fintech, elle est faite pour toi.', 4), R('ak', '2 h', 'Ça motive ! Félicitations.', 6)] },
      psm: { a: 'sm', tab: 'tal', t: 'Ma bannière pour une marque de courses en ligne, projet d’école. Vos avis m’intéressent !', h: 'Aujourd’hui à 5 h 30', j: 64, r: 7, rp: 2, img: 'S',
        reps: [R('jk', '6 h', 'Les couleurs sont bien choisies. Le texte pourrait être plus gros.', 4), R('ak', '5 h', 'J’adore le personnage !', 2)] },
      pme: { a: 'me', tab: 'ent', t: 'Portes ouvertes mardi 28 octobre, 10 h, à Gombe. Venez rencontrer l’équipe solaire et déposer votre CV sur place.', h: 'Hier à 16 h 20', j: 39, r: 5, rp: 3, event: true,
        reps: [R('pi', 'hier', 'Je viens avec deux amis de promo.', 3), R('me', 'hier', 'Avec plaisir, l’entrée est libre.', 6)] },
      pjk: { a: 'jk', tab: 'tal', t: 'Ma campagne pour Baobab Fintech : 275 nouveaux abonnés en une semaine. Je cherche un poste de community manager à Kinshasa.', h: 'Lundi à 18 h 05', j: 95, r: 11, rp: 3, img: 'J',
        reps: [R('sm', '1 j', '275 en une semaine, chapeau !', 7), R('pi', '1 j', 'Je te recommande à l’équipe communication de Fleuve Banque.', 9)] }
    };
    const PJ = {
      photo: { t: 'Photo', pjI: '', pjC: '#11262A', pjLc: '#F2EDE5', pjT: '', pjD: '' },
      real: { t: 'Réalisation', pjI: 'PF', pjC: '#2A2140', pjLc: '#E4D7FF', pjT: 'Tableau de bord des ventes', pjD: 'Réalisation · Portfolio' },
      att: { t: 'Attestation', pjI: 'SQL', pjC: 'rgba(166,242,107,.16)', pjLc: '#A6F26B', pjT: 'Attestation SQL pour l’analyse', pjD: 'Formation Jumanly · 18 oct. 2026' }
    };
    if (moi) {
      POSTS.pmoi = { a: 'gm', tab: 'tal', t: moi.t, h: 'À l’instant', j: 0, r: 0, rp: 0, img: moi.pj === 'photo' ? 'M' : null, pj: moi.pj && moi.pj !== 'photo' ? moi.pj : null, cite: moi.cite || null, mien: true, reps: [] };
    }

    const ouvrirDetail = (k, from) => () => S({ vue: 'detail', post: k, de: from || vue, repA: null, saisie: '', feuille: null });
    const ouvrirFeuille = (k, f) => () => S({ post: k, feuille: f });

    const P = {};
    Object.keys(POSTS).forEach((k) => {
      const o = POSTS[k];
      const on = !!aime[k];
      const rp = !!repub[k];
      const nMes = (mes[k] || []).length;
      const okTab = ong === 'tout' || (ong === 'ent' ? o.tab === 'ent' : o.tab !== 'ent');
      P[k] = {
        jn: String(o.j + (on ? 1 : 0)), jf: on ? '#A6F26B' : 'none', jc: on ? '#A6F26B' : '#8FA39E',
        jt: () => S({ aime: { ...aime, [k]: !on } }),
        nr: String(o.r + nMes), rep: ouvrirDetail(k, 'fil'),
        nrp: String(o.rp + (rp ? 1 : 0)), rc: rp ? '#A6F26B' : '#8FA39E', rp: ouvrirFeuille(k, 'repub'),
        menu: ouvrirFeuille(k, 'menu'),
        vis: okTab && !cache[k], mask: okTab && !!cache[k],
        afficher: () => S({ cache: { ...cache, [k]: false } })
      };
    });
    const vide = { jn: '0', jf: 'none', jc: '#8FA39E', jt: () => {}, nr: '0', rep: () => {}, nrp: '0', rc: '#8FA39E', rp: () => {}, menu: () => {}, vis: false, mask: false, afficher: () => {} };
    const pmoi = P.pmoi || vide;

    const O = [['tout', 'Pour vous'], ['suivis', 'Abonnements'], ['ent', 'Entreprises']];
    const onglets = O.map(([k, t]) => ({ t, sel: k === ong ? 'true' : 'false', pick: () => S({ ong: k }), fw: k === ong ? '700' : '500', col: k === ong ? '#F2EDE5' : '#8FA39E', on: k === ong ? '1' : '0' }));

    // Détail de la publication ouverte
    const cur = POSTS[post] ? post : 'ppi';
    const o = POSTS[cur];
    const a = AV[o.a];
    const pc = P[cur];
    const d = {
      n: a.n, lg: a.lg, c: a.c, lc: a.lc, rad: a.rad, sous: a.r, t: o.t, h: o.h,
      aProfil: !!a.profil && !o.mien, profil: a.profil || 'Carriere.dc.html',
      iA: o.img === 'A', iP: o.img === 'P', iS: o.img === 'S', iJ: o.img === 'J', iMoi: o.img === 'M',
      offre: !!o.offre, event: !!o.event, aPj: !!o.pj,
      jn: pc.jn, jf: pc.jf, jc: pc.jc, jt: pc.jt, nr: pc.nr + (pc.nr === '1' ? ' réponse' : ' réponses'), nrp: pc.nrp, rc: pc.rc, rp: pc.rp, menu: pc.menu
    };
    const repA = st.repA || null;
    const allReps = o.reps.concat(mes[cur] || []);
    const reps = allReps.map((x, i) => {
      const av = AV[x.a];
      const key = cur + i;
      const on = !!aimeR[key];
      return { n: av.n, lg: av.lg, c: av.c, lc: av.lc, rad: av.rad === '12px' ? '10px' : av.rad, h: x.h, t: x.t,
        jn: String(x.j + (on ? 1 : 0)), jf: on ? '#A6F26B' : 'none', jc: on ? '#A6F26B' : '#8FA39E',
        jt: () => S({ aimeR: { ...aimeR, [key]: !on } }),
        rep: () => S({ repA: av.n, saisie: '@' + av.n + ' ' }) };
    });
    const saisie = st.saisie || '';
    const envoyer = () => {
      const t = saisie.trim();
      if (!t || t === '@' + repA) { flash('Écrivez d’abord votre réponse.'); return; }
      S({ mes: { ...mes, [cur]: (mes[cur] || []).concat([R('gm', 'à l’instant', t, 0)]) }, saisie: '', repA: null });
      flash('Réponse publiée');
    };

    // Pièce jointe de ma publication (ou du brouillon)
    const pjK = vue === 'publier' ? st.pj : (moi && moi.pj);
    const pjo = PJ[pjK] || PJ.real;
    const moiC = { pjI: pjo.pjI, pjC: pjo.pjC, pjLc: pjo.pjLc, pjT: pjo.pjT, pjD: pjo.pjD };
    const citeK = vue === 'publier' ? st.cite : (moi && moi.cite);
    const citeP = citeK && POSTS[citeK];

    // Feuille ···
    const ICM = {
      enreg: 'M7 4h10v16l-5-3.5L7 20z', lien: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
      cacher: 'M3 3l18 18M10.6 6.1A9 9 0 0 1 21 12a14 14 0 0 1-2.4 3.2M6.6 6.6A14 14 0 0 0 3 12a9 9 0 0 0 12.4 5.4',
      signal: 'M5 21V4h11l-1.5 4L16 12H5', suppr: 'M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'
    };
    const fermer = () => S({ feuille: null });
    const menu = o.mien ? [
      { t: 'Copier le lien', s: 'Pour la partager ailleurs', d: ICM.lien, col: '#F2EDE5', go: () => { fermer(); flash('Lien copié'); } },
      { t: 'Supprimer la publication', s: 'Elle disparaît du Fil', d: ICM.suppr, col: '#FF8A7A', go: () => { S({ moi: null, feuille: null, vue: 'fil' }); flash('Publication supprimée'); } }
    ] : [
      { t: enreg[cur] ? 'Retirer des enregistrements' : 'Enregistrer', s: 'À retrouver dans Carrière', d: ICM.enreg, col: '#F2EDE5', go: () => { S({ enreg: { ...enreg, [cur]: !enreg[cur] }, feuille: null }); flash(enreg[cur] ? 'Retirée des enregistrements' : 'Publication enregistrée'); } },
      { t: 'Copier le lien', s: 'Pour la partager ailleurs', d: ICM.lien, col: '#F2EDE5', go: () => { fermer(); flash('Lien copié'); } },
      { t: 'Ne plus voir ce type de publication', s: 'Le Fil s’adapte à vos choix', d: ICM.cacher, col: '#F2EDE5', go: () => { S({ cache: { ...cache, [cur]: true }, feuille: null, vue: 'fil' }); flash('C’est noté. Vous en verrez moins.'); } },
      { t: 'Signaler', s: 'Contenu faux, abusif ou arnaque', d: ICM.signal, col: '#FF8A7A', go: () => S({ feuille: 'signaler' }) }
    ];
    const raisons = ['Fausse offre ou arnaque', 'Propos blessants', 'Fausse information', 'Contenu inapproprié', 'Autre raison']
      .map((t) => ({ t, go: () => { fermer(); flash('Merci. Notre équipe vérifie sous 24 h.'); } }));

    // Feuille republier
    const estRep = !!repub[cur];
    const republier = () => { S({ repub: { ...repub, [cur]: !estRep }, feuille: null }); flash(estRep ? 'Republication annulée' : 'Republiée sur votre profil'); };
    const citer = () => S({ feuille: null, vue: 'publier', de: vue, cite: cur, pj: null, brouillon: '' });
    const contacts = ['pi', 'jk', 'sm', 'ak'].filter((k) => k !== o.a).slice(0, 3).map((k) => {
      const m = AV[k];
      return { n: m.n, r: m.r, lg: m.lg, c: m.c, lc: m.lc, go: () => { fermer(); flash('Envoyée à ' + m.n.split(' ')[0]); } };
    });

    // Publier
    const brouillon = st.brouillon || '';
    const pj = st.pj || null;
    const pjChoix = ['photo', 'real', 'att'].map((k) => ({ t: PJ[k].t, bd: pj === k ? '#A6F26B' : 'rgba(255,255,255,.16)', bg: pj === k ? 'rgba(166,242,107,.12)' : 'transparent', col: pj === k ? '#A6F26B' : '#F2EDE5', pick: () => S({ pj: pj === k ? null : k }) }));
    const AUD = ['Tout le monde peut répondre', 'Mes connexions peuvent répondre', 'Personne ne peut répondre'];
    const aud = st.aud || 0;
    const peutPub = !!brouillon.trim() || !!pj || !!st.cite;
    const publier = () => {
      if (!peutPub) { flash('Écrivez quelque chose ou ajoutez une pièce jointe.'); return; }
      S({ moi: { t: brouillon.trim() || (st.cite ? 'À lire :' : 'Nouvelle pièce ajoutée à mon profil.'), pj, cite: st.cite || null }, vue: 'fil', ong: 'tout', brouillon: '', pj: null, cite: null });
      flash('Publication partagée');
    };

    // Notifications
    const NO = [
      { k: 'n1', g: 'auj', cat: 'cand', a: 'nk', quoi: 'a consulté votre candidature « Analyste de données junior ».', h: 'Il y a 10 min', href: 'Carriere-candidature.dc.html' },
      { k: 'n2', g: 'auj', cat: 'offres', a: 'bf', quoi: 'publie une offre qui vous correspond à 86 %.', h: 'Il y a 2 h', href: 'Offres-detail.dc.html' },
      { k: 'n3', g: 'auj', cat: 'reseau', a: 'ek', quoi: 'veut se connecter avec vous.', h: 'Il y a 3 h', href: 'Messages-demandes.dc.html' },
      { k: 'n4', g: 'auj', cat: 'reseau', a: 'pi', quoi: 'vous a mentionnée dans une réponse.', h: 'Il y a 1 h', post: 'ppi', luDef: true },
      { k: 'n5', g: 'sem', cat: 'offres', a: 'me', quoi: 'vous rappelle ses portes ouvertes du mardi 28 octobre.', h: 'Hier', post: 'pme', luDef: true },
      { k: 'n6', g: 'sem', cat: 'cand', a: 'ob', qui: 'Orbi', quoi: ': votre CV peut gagner 12 points avec deux chiffres de plus.', h: 'Lundi', href: 'Carriere-cv.dc.html', luDef: true },
      { k: 'n7', g: 'sem', cat: 'reseau', a: 'jk', quoi: 'a aimé votre attestation SQL.', h: '18 oct.', href: 'Carriere-progression.dc.html', luDef: true }
    ];
    const estLu = (x) => !!lu[x.k] || !!x.luDef || !!st.toutLu;
    const nNonLu = NO.filter((x) => !estLu(x)).length;
    const nf = st.nf || 'tout';
    const NC = [['tout', 'Tout'], ['cand', 'Candidatures'], ['offres', 'Offres'], ['reseau', 'Réseau']];
    const nChips = NC.map(([k, t]) => ({ t, pick: () => S({ nf: k }), bg: nf === k ? '#F2EDE5' : 'transparent', col: nf === k ? '#0B1A1F' : '#F2EDE5', bd: nf === k ? '#F2EDE5' : 'rgba(255,255,255,.16)' }));
    const item = (x) => {
      const av = AV[x.a];
      const l = estLu(x);
      return { lien: !!x.href, btn: !x.href, href: x.href || 'Fil.dc.html', qui: x.qui || av.n, quoi: x.quoi, h: x.h, lg: av.lg, c: av.c, lc: av.lc, rad: av.rad,
        dot: l ? '0' : '1', bg: l ? 'transparent' : 'rgba(166,242,107,.05)',
        go: () => S({ lu: { ...lu, [x.k]: true }, vue: 'detail', post: x.post, de: 'notifs', repA: null, saisie: '' }) };
    };
    const filt = NO.filter((x) => nf === 'tout' || x.cat === nf);
    const groupes = [['auj', 'Aujourd’hui'], ['sem', 'Cette semaine']]
      .map(([g, t]) => ({ t, items: filt.filter((x) => x.g === g).map(item) }))
      .filter((g) => g.items.length);

    // Orbi
    const OR = {
      resume: { q: 'Résumer les nouveautés du jour', t: 'Trois choses aujourd’hui : Baobab Fintech recrute trois analystes data, Patrick a commencé chez Fleuve Banque, et Mwinda Énergie ouvre ses portes mardi.',
        items: [['bf', 'Analyste de données junior', 'Baobab Fintech · 86 % pour vous', 'Offres-detail.dc.html'], ['pi', 'Patrick Ilunga', 'Nouveau poste · Fleuve Banque', 'Personne.dc.html']] },
      offres: { q: '3 offres publiées ce matin', t: 'Classées selon votre profil : la première demande SQL et Excel, que vous avez déjà validés.',
        items: [['bf', 'Analyste de données junior', 'Baobab Fintech · Kinshasa · 86 %', 'Offres-detail.dc.html'], ['fb', 'Assistant marketing digital', 'Fleuve Banque · Kinshasa · 77 %', 'Offres.dc.html'], ['me', 'Analyste énergie solaire', 'Mwinda Énergie · Kinshasa · 79 %', 'Offres.dc.html']] },
      ent: { q: 'Quelles entreprises recrutent cette semaine ?', t: 'Trois entreprises de votre domaine recrutent en ce moment à Kinshasa.',
        items: [['bf', 'Baobab Fintech', '8 offres en cours', 'Entreprise.dc.html'], ['fb', 'Fleuve Banque', '3 offres en cours', 'Offres.dc.html'], ['me', 'Mwinda Énergie', '3 offres en cours', 'Offres.dc.html']] },
      suivre: { q: 'Qui suivre dans mon domaine ?', t: 'Ces personnes publient souvent sur la data et la finance.',
        items: [['pi', 'Patrick Ilunga', 'Analyste crédit · Fleuve Banque', 'Personne.dc.html'], ['bf', 'Baobab Fintech', 'Fintech · 8 offres', 'Entreprise.dc.html']] },
      ecrire: { q: 'Écrire une publication sur mon attestation', t: 'Voici un brouillon : « Je viens d’obtenir mon attestation SQL sur Jumanly. Prochaine étape : un tableau de bord pour une PME de Kinshasa. »', items: [], act: 'ecrire', actT: 'Ouvrir le brouillon' },
      libre: { q: st.oqEnv || '', t: 'Voici ce que j’ai trouvé dans le Fil et dans Explorer.', items: [['bf', 'Baobab Fintech', '8 offres en cours', 'Entreprise.dc.html'], ['pi', 'Patrick Ilunga', 'Analyste crédit · Fleuve Banque', 'Personne.dc.html']] }
    };
    const BROUILLON = 'Je viens d’obtenir mon attestation SQL sur Jumanly. Prochaine étape : un tableau de bord pour une PME de Kinshasa.';
    const ouvrirBrouillon = () => S({ orbi: false, oRep: null, vue: 'publier', de: 'fil', brouillon: BROUILLON, pj: 'att', cite: null });
    const rr = oRep && OR[oRep];
    const ra = rr ? {
      q: rr.q, t: rr.t,
      items: rr.items.map(([k, t, s, href]) => ({ t, s, href, lg: AV[k].lg, c: AV[k].c, lc: AV[k].lc })),
      aAct: !!rr.act, actT: rr.actT || '', act: ouvrirBrouillon
    } : { q: '', t: '', items: [], aAct: false, actT: '', act: () => {} };
    const oq = st.oq || '';
    const questions = ['resume', 'ent', 'suivre', 'ecrire'].map((k) => ({ t: OR[k].q, go: () => S({ oRep: k }) }));

    const ICO = {
      fil: 'M4 6h16M4 12h16M4 18h10',
      explorer: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM15.5 8.5l-2 5-5 2 2-5z',
      carriere: 'M3.5 8.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3.5 12.5h17M12 11.5v2',
      formation: 'M2.5 9 12 4.5 21.5 9 12 13.5zM6.5 11.2v4.6c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.6',
      messages: 'M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5z'
    };
    const HREF = { fil: 'Fil.dc.html', explorer: 'Offres.dc.html', carriere: 'Carriere.dc.html', formation: 'Formation.dc.html', messages: 'Messages.dc.html' };
    const nav = [['fil', 'Fil'], ['explorer', 'Explorer'], ['carriere', 'Carrière'], ['formation', 'Formation'], ['messages', 'Messages']]
      .map(([k, t]) => ({ t, d: ICO[k], href: HREF[k], c: k === 'fil' ? '#A6F26B' : '#8FA39E', sw: k === 'fil' ? '2.1' : '1.7', dot: k === 'fil' ? '1' : '0' }));

    const retour = () => S({ vue: de === 'notifs' ? 'notifs' : 'fil', feuille: null });

    return {
      vFil: vue === 'fil', vDetail: vue === 'detail', vPublier: vue === 'publier', vNotifs: vue === 'notifs',
      onglets, nav,
      sTout: ong === 'tout', finFil: true,
      pmoi, pbf: P.pbf, pak: P.pak, ppi: P.ppi, psm: P.psm, pme: P.pme, pjk: P.pjk,
      moiT: moi ? moi.t : '', moiPhoto: !!moi && moi.pj === 'photo', moiPj: !!moi && !!moi.pj && moi.pj !== 'photo', moiCite: !!moi && !!moi.cite, moiC,
      citeN: citeP ? AV[citeP.a].n : '', citeT: citeP ? citeP.t : '',
      participer: () => { const v = !st.part; S({ part: v }); flash(v ? 'Inscrite. Rappel la veille dans vos notifications.' : 'Participation annulée'); },
      partT: st.part ? 'Inscrite ✓' : 'Je participe', partBg: st.part ? 'rgba(166,242,107,.16)' : '#F2EDE5', partCol: st.part ? '#A6F26B' : '#0B1A1F', partN: String(86 + (st.part ? 1 : 0)),
      // détail
      d, reps, retour, retourT: de === 'notifs' ? 'Notifications' : 'Fil',
      saisie, ecrire: (e) => S({ saisie: e && e.target ? e.target.value : '' }), envoyer,
      placeRep: repA ? 'Répondre à ' + repA + '…' : 'Répondre à ' + a.n.split(' ')[0] + '…',
      aRepA: !!repA, repA: repA || '', annulerRepA: () => S({ repA: null, saisie: '' }),
      // publier
      ouvrirPublier: () => S({ vue: 'publier', de: 'fil', cite: null, pj: null, brouillon: '' }),
      annulerPub: () => S({ vue: st.de === 'detail' ? 'detail' : 'fil', brouillon: '', pj: null, cite: null }),
      brouillon, ecrirePub: (e) => S({ brouillon: e && e.target ? e.target.value : '' }),
      pjChoix, pubPhoto: pj === 'photo', pubPj: !!pj && pj !== 'photo', pubCite: !!citeP,
      retirerPj: () => S({ pj: null }),
      aEssai: !brouillon && !st.cite, essayer: () => S({ brouillon: BROUILLON, pj: 'att' }),
      audience: AUD[aud], changerAudience: () => S({ aud: (aud + 1) % 3 }),
      publier, pubOp: peutPub ? '1' : '.45',
      // notifications
      ouvrirNotifs: () => S({ vue: 'notifs' }), retourFil: () => S({ vue: 'fil' }),
      bellLabel: nNonLu ? 'Notifications, ' + nNonLu + ' nouvelles' : 'Notifications', nNonLu: String(nNonLu), bellOp: nNonLu ? '1' : '0',
      nChips, groupes, nVide: groupes.length === 0,
      resteT: nNonLu ? nNonLu + ' non lues' : 'Tout est lu', toutLu: () => { S({ toutLu: true }); if (nNonLu) flash('Tout est marqué comme lu'); }, toutLuOp: nNonLu ? '1' : '.4',
      // feuilles
      fMenu: feuille === 'menu', fSignaler: feuille === 'signaler', fRepub: feuille === 'repub', fEnvoi: feuille === 'envoi',
      fermer, menu, raisons, retourMenu: () => S({ feuille: 'menu' }), retourRepub: () => S({ feuille: 'repub' }),
      repubT: estRep ? 'Annuler la republication' : 'Republier', repubS: estRep ? 'Elle quitte votre profil' : 'Sur votre profil, sans commentaire',
      republier, citer, envoyerMsg: () => S({ feuille: 'envoi' }), contacts,
      // Orbi
      orbi, fab: !orbi && vue === 'fil' && !feuille,
      ouvrirOrbi: () => S({ orbi: true, oRep: null }), orbiResume: () => S({ orbi: true, oRep: 'resume' }), orbiOffres: () => S({ orbi: true, oRep: 'offres' }),
      fermerOrbi: () => S({ orbi: false, oRep: null }), autresQ: () => S({ oRep: null }),
      orbiTitre: rr ? 'Orbi' : 'Bonjour Grâce', aRep: !!rr, sansRep: !rr, ra, questions,
      oq, ecrireOrbi: (e) => S({ oq: e && e.target ? e.target.value : '' }),
      envoyerOrbi: () => { if (!oq.trim()) { flash('Écrivez votre question à Orbi.'); return; } S({ oRep: 'libre', oqEnv: oq.trim(), oq: '' }); },
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}
