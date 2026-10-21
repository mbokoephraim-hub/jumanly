class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const p = this.props || {};
    const has = (k) => Object.prototype.hasOwnProperty.call(st, k);
    const S = (o) => this.setState(o);
    const flash = (t) => { S({ toast: t }); clearTimeout(this._t); this._t = setTimeout(() => this.setState({ toast: null }), 2300); };

    // Une fiche par personne : mêmes métier, entreprise et couleurs que dans le Fil, Explorer et Messages
    const E = (lg, t, d, c, lc) => ({ lg, t, d, c: c || '#1A2629', lc: lc || '#C9D6D2' });
    const UNIKIN = (t, d) => E('U', t, d || 'Université de Kinshasa');
    const JUM = (t, d) => E('J', t, d || 'Attestation Jumanly', '#0F3F37', '#A6F26B');
    const PP = {
      pi: { n: 'Patrick Ilunga', lg: 'PI', c: '#E3EEF9', lc: '#1E4E79', ban: '#1E4E79', photo: true, verif: true, handle: 'patrick.ilunga', ville: 'Kinshasa', role: 'Analyste crédit', ent: 'Fleuve Banque', conn: 312, commun: 6, etat: 'ok', msg: 'Messages-discussion.dc.html',
        about: 'Analyste crédit passionné par la donnée. J’aide les PME de Kinshasa à obtenir un financement adapté. Ancien étudiant en économie à l’UNIKIN.',
        comp: ['Analyse financière', 'Excel', 'SQL', 'Power BI', 'Relation client'],
        exp: [E('FB', 'Analyste crédit, Fleuve Banque', 'Depuis octobre 2026 · Kinshasa', '#CFE4F7', '#1E4E79'), E('CM', 'Stagiaire analyste, Coopec Mapendo', 'Dossiers de microcrédit, suivi des remboursements'), E('AV', 'Assistant comptable, Agence Vuvu', 'Saisie, rapprochements bancaires')],
        form: [UNIKIN('Licence en économie', 'Université de Kinshasa · 2021 – 2025'), JUM('Excel pour l’analyse', 'Attestation Jumanly · 2026')], lang: ['Français', 'Lingala', 'Anglais'],
        pub: 'Premier jour chez Fleuve Banque comme analyste crédit. Offre trouvée sur Jumanly il y a trois semaines.', pubH: '5 h', pubLien: 'Fil-detail.dc.html', pubLienT: 'Voir la publication et ses réponses',
        real: [['Score de crédit PME', 'Excel · 2 photos', '#0F3F37'], ['Tableau des remboursements', 'Power BI · 1 photo', '#1E4E79'], ['Mémoire de licence', 'PDF · 48 pages', '#B07A12']] },
      jk: { n: 'Joël Kabeya', lg: 'JK', c: '#DDF6EE', lc: '#14745F', ban: '#14745F', handle: 'joel.kabeya', ville: 'Kinshasa', role: 'Community manager', ent: '', conn: 184, commun: 9, etat: 'ok', msg: 'Messages-joel.dc.html',
        about: 'Je fais grandir des marques sur les réseaux sociaux. J’apprends SQL pour mieux lire mes chiffres. Je cherche un poste de community manager à Kinshasa.',
        comp: ['Réseaux sociaux', 'Rédaction', 'Canva', 'Publicité en ligne', 'SQL (débutant)'],
        exp: [E('JK', 'Community manager indépendant', 'Campagne Baobab Fintech : 275 abonnés en une semaine', '#DDF6EE', '#14745F'), E('LM', 'Stagiaire communication, Lisanga Média', '2025 · Kinshasa')],
        form: [UNIKIN('Licence en communication'), JUM('SQL pour débuter', 'En cours sur Jumanly')], lang: ['Français', 'Lingala'],
        pub: 'Ma campagne pour Baobab Fintech : 275 nouveaux abonnés en une semaine. Je cherche un poste de community manager à Kinshasa.', pubH: '1 j', pubLien: 'Fil.dc.html', pubLienT: 'Voir dans le Fil',
        real: [['Campagne Baobab Fintech', 'Réseaux sociaux · 4 visuels', '#0F3F37'], ['Calendrier éditorial', 'PDF · 6 pages', '#3A2A4F']] },
      nk: { n: 'Nadia Kalala', lg: 'NK', c: '#0F3F37', lc: '#A6F26B', ban: '#0F3F37', verif: true, handle: 'nadia.kalala', ville: 'Kinshasa', role: 'Recruteuse', ent: 'Baobab Fintech', conn: 1240, commun: 4, etat: 'ok', msg: 'Messages-nadia.dc.html',
        about: 'Je recrute les talents data et produit de Baobab Fintech. Je réponds à chaque candidature sous une semaine.',
        comp: ['Recrutement', 'Entretiens', 'Marque employeur'],
        exp: [E('BF', 'Recruteuse, Baobab Fintech', 'Depuis 2024 · Kinshasa', '#0F3F37', '#A6F26B'), E('CM', 'Chargée RH, Coopec Mapendo', '2021 – 2024')],
        form: [UNIKIN('Master en gestion des ressources humaines')], lang: ['Français', 'Lingala', 'Anglais'], real: [] },
      rn: { n: 'Ruth Nsimba', lg: 'RN', c: '#E8DDF7', lc: '#4B2D7A', ban: '#4B2D7A', handle: 'ruth.nsimba', ville: 'Kinshasa', role: 'Data analyst indépendante', ent: '', conn: 96, commun: 2, etat: 'non', msg: 'Messages.dc.html',
        about: 'Je transforme les ventes des petits commerces en tableaux simples. Nouvelle sur Jumanly.',
        comp: ['SQL', 'Python', 'Power BI'], exp: [E('RN', 'Data analyst indépendante', 'Depuis 2025 · Kinshasa', '#E8DDF7', '#4B2D7A')],
        form: [UNIKIN('Licence en statistique')], lang: ['Français', 'Anglais'], real: [['Ventes d’une boutique', 'Power BI · 1 photo', '#4B2D7A']] },
      dl: { n: 'Didier Lukusa', lg: 'DL', c: '#D7EEF2', lc: '#1F5E6B', ban: '#1F5E6B', verif: true, handle: 'didier.lukusa', ville: 'Kinshasa', role: 'Responsable data', ent: 'Baobab Fintech', conn: 530, commun: 3, etat: 'non', msg: 'Messages.dc.html',
        about: 'Je dirige l’équipe data de Baobab Fintech. Nous cherchons des analystes curieux, même débutants.',
        comp: ['SQL', 'Modélisation', 'Management'], exp: [E('BF', 'Responsable data, Baobab Fintech', 'Depuis 2023', '#0F3F37', '#A6F26B'), E('KT', 'Data analyst, Kivu Tech', '2019 – 2023', '#C9F1E3', '#14745F')],
        form: [UNIKIN('Master en informatique')], lang: ['Français', 'Anglais'], real: [] },
      sm: { n: 'Sarah Mbala', lg: 'SM', c: '#FBE4E0', lc: '#9A3524', ban: '#9A3524', handle: 'sarah.mbala', ville: 'Kinshasa', role: 'Étudiante en design graphique', ent: '', conn: 75, commun: 5, etat: 'non', msg: 'Messages.dc.html',
        about: 'Étudiante en design graphique à l’UNIKIN, je cherche un stage en agence ou en entreprise.',
        comp: ['Illustration', 'Figma', 'Canva', 'Mise en page'], exp: [E('SM', 'Projets d’école', 'Bannières, logos, affiches', '#FBE4E0', '#9A3524')],
        form: [UNIKIN('Licence en design graphique', 'Université de Kinshasa · en cours')], lang: ['Français', 'Lingala'],
        pub: 'Ma bannière pour une marque de courses en ligne, projet d’école. Vos avis m’intéressent !', pubH: '8 h', pubLien: 'Fil.dc.html', pubLienT: 'Voir dans le Fil',
        real: [['Bannière courses en ligne', 'Illustration · 1 photo', '#9A3524']] },
      ak: { n: 'Amani Kasongo', lg: 'AK', c: '#FDF1D8', lc: '#8A5A00', ban: '#8A5A00', handle: 'amani.kasongo', ville: 'Lubumbashi', role: 'Étudiante en gestion', ent: '', conn: 141, commun: 3, etat: 'non', msg: 'Messages.dc.html',
        about: 'Étudiante en gestion, j’aime aider les autres à trouver leur premier stage. Badge « Bâtisseuse de communauté ».',
        comp: ['Gestion de projet', 'Excel', 'Animation de groupe'], exp: [E('AK', 'Déléguée de promotion', '2025 – 2026 · Lubumbashi', '#FDF1D8', '#8A5A00')],
        form: [E('U', 'Licence en gestion', 'Université de Lubumbashi · en cours')], lang: ['Français', 'Swahili'],
        pub: 'Badge « Bâtisseuse de communauté » obtenu ! Merci à toutes les personnes qui ont répondu à mes questions sur Jumanly.', pubH: '3 h', pubLien: 'Fil.dc.html', pubLienT: 'Voir dans le Fil', real: [] },
      mt: { n: 'Merveille Tshala', lg: 'MT', c: '#FBE4E0', lc: '#9A3524', ban: '#5B2A22', handle: 'merveille.tshala', ville: 'Kinshasa', role: 'Développeuse mobile', ent: 'Baobab Fintech', conn: 220, commun: 1, etat: 'non', msg: 'Messages.dc.html',
        about: 'Je développe l’application mobile de Baobab Fintech.', comp: ['Flutter', 'Kotlin', 'API'], exp: [E('BF', 'Développeuse mobile, Baobab Fintech', 'Depuis 2025', '#0F3F37', '#A6F26B')],
        form: [UNIKIN('Licence en informatique')], lang: ['Français', 'Anglais'], real: [] },
      at: { n: 'Aline Tshibanda', lg: 'AT', c: '#E3EEF9', lc: '#1E4E79', ban: '#1E4E79', handle: 'aline.tshibanda', ville: 'Kinshasa', role: 'Analyste produit', ent: 'Baobab Fintech', conn: 168, commun: 2, etat: 'non', msg: 'Messages.dc.html',
        about: 'J’écoute les clients de Baobab Fintech et je traduis leurs besoins pour l’équipe produit. UNIKIN, comme vous.', comp: ['Recherche utilisateur', 'SQL', 'Rédaction'],
        exp: [E('BF', 'Analyste produit, Baobab Fintech', 'Depuis 2024', '#0F3F37', '#A6F26B')], form: [UNIKIN('Licence en économie')], lang: ['Français', 'Lingala'], real: [] },
      ek: { n: 'Esther Kabila', lg: 'EK', c: '#14745F', lc: '#C9F1E3', ban: '#14745F', handle: 'esther.kabila', ville: 'Kinshasa', role: 'Chargée RH', ent: 'Baobab Fintech', conn: 402, commun: 3, etat: 'recue', msg: 'Messages.dc.html',
        about: 'Je m’occupe de l’accueil des nouvelles recrues chez Baobab Fintech.', comp: ['Intégration', 'Paie', 'Formation interne'],
        exp: [E('BF', 'Chargée RH, Baobab Fintech', 'Depuis 2025', '#0F3F37', '#A6F26B')], form: [UNIKIN('Licence en psychologie du travail')], lang: ['Français', 'Lingala'], real: [] },
      jm: { n: 'Junior Mukendi', lg: 'JM', c: '#7A5C00', lc: '#FFF4D6', ban: '#7A5C00', handle: 'junior.mukendi', ville: 'Kinshasa', role: 'Data analyst', ent: 'Mwinda Énergie', conn: 88, commun: 1, etat: 'recue', msg: 'Messages.dc.html',
        about: 'J’analyse la production des panneaux solaires de Mwinda Énergie. Nous avons suivi le même cours SQL.', comp: ['SQL', 'Excel', 'Python'],
        exp: [E('ME', 'Data analyst, Mwinda Énergie', 'Depuis 2026', '#FFE1A1', '#8A5A00')], form: [JUM('SQL pour l’analyse', 'Attestation Jumanly · 2026')], lang: ['Français', 'Tshiluba'], real: [] },
      rm: { n: 'Ruth Mavungu', lg: 'RM', c: '#5A3B1E', lc: '#FFE1A1', ban: '#5A3B1E', verif: true, handle: 'ruth.mavungu', ville: 'Matadi', role: 'Comptable', ent: '', conn: 120, commun: 4, etat: 'ok', msg: 'Messages-ruth.dc.html',
        about: 'Comptable à Matadi, je cherche à rejoindre une banque à Kinshasa.', comp: ['Comptabilité', 'Excel', 'Fiscalité'],
        exp: [E('RM', 'Comptable, Cabinet Nzadi', 'Depuis 2023 · Matadi', '#5A3B1E', '#FFE1A1')], form: [E('U', 'Licence en comptabilité', 'ISC Matadi')], lang: ['Français', 'Kikongo'], real: [] },
      sn: { n: 'Sarah Ngoy', lg: 'SN', c: '#1E4E79', lc: '#CFE4F7', ban: '#1E4E79', handle: 'sarah.ngoy', ville: 'Lubumbashi', role: 'Développeuse web', ent: '', conn: 210, commun: 3, etat: 'ok', msg: 'Messages-sarah.dc.html',
        about: 'Développeuse web à Lubumbashi. J’ai passé un entretien chez Mwinda Énergie et je partage mes conseils.', comp: ['JavaScript', 'React', 'SQL'],
        exp: [E('SN', 'Développeuse web indépendante', 'Depuis 2024', '#1E4E79', '#CFE4F7')], form: [E('U', 'Licence en informatique', 'Université de Lubumbashi')], lang: ['Français', 'Swahili', 'Anglais'], real: [] },
      mk: { n: 'Moussa Kanté', lg: 'MK', c: '#FFE1A1', lc: '#8A5A00', ban: '#8A5A00', verif: true, handle: 'moussa.kante', ville: 'Kinshasa', role: 'Responsable RH', ent: 'Mwinda Énergie', conn: 870, commun: 2, etat: 'ok', msg: 'Messages-moussa.dc.html',
        about: 'Je recrute les équipes terrain et bureau de Mwinda Énergie.', comp: ['Recrutement', 'Droit du travail', 'Entretiens'],
        exp: [E('ME', 'Responsable RH, Mwinda Énergie', 'Depuis 2022', '#FFE1A1', '#8A5A00')], form: [UNIKIN('Master en gestion des ressources humaines')], lang: ['Français', 'Lingala', 'Anglais'], real: [] },
      cm: { n: 'Clarisse Mbala', lg: 'CM', c: '#CFE4F7', lc: '#1E4E79', ban: '#1E4E79', handle: 'clarisse.mbala', ville: 'Kinshasa', role: 'Chargée de recrutement', ent: 'Fleuve Banque', conn: 650, commun: 5, etat: 'ok', msg: 'Messages-clarisse.dc.html',
        about: 'Je recrute les profils finance et relation client de Fleuve Banque.', comp: ['Recrutement', 'Sourcing', 'Entretiens'],
        exp: [E('FB', 'Chargée de recrutement, Fleuve Banque', 'Depuis 2023', '#CFE4F7', '#1E4E79')], form: [UNIKIN('Licence en gestion')], lang: ['Français', 'Lingala'], real: [] }
    };
    const qui = PP[st.qui ?? p.qui] ? (st.qui ?? p.qui) : 'pi';
    const o = PP[qui];
    const prenom = o.n.split(' ')[0];
    const x = {
      ...o, prenom, sansPhoto: !o.photo, photo: !!o.photo, verif: !!o.verif, aEnt: !!o.ent, entPage: o.ent === 'Baobab Fintech', entTexte: !!o.ent && o.ent !== 'Baobab Fintech',
      conn: String(o.conn), commun: String(o.commun), aPub: !!o.pub, sansPub: !o.pub, pub: o.pub || '', pubH: o.pubH || '', pubLien: o.pubLien || 'Fil.dc.html', pubLienT: o.pubLienT || '',
      real: o.real.map(([t, d, c]) => ({ t, d, c })), sansReal: !o.real.length
    };

    const ong = st.ong ?? p.onglet ?? 'about';
    const T = [['pub', 'Publications'], ['about', 'À propos'], ['real', 'Réalisations · ' + o.real.length]];
    const onglets = T.map(([k, t]) => ({ t, sel: k === ong ? 'true' : 'false', pick: () => S({ ong: k }), fw: k === ong ? '600' : '400', col: k === ong ? '#F2EDE5' : '#9FB3AE', on: k === ong ? '1' : '0' }));

    const etat = st.etat ?? (p.connecte ? 'ok' : o.etat);
    const suivant = { non: 'attente', attente: 'ok', ok: 'ok', recue: 'ok' };
    const BT = {
      non: { t: 'Se connecter', bg: '#A6F26B', col: '#0B1A1F', bd: '#A6F26B' },
      attente: { t: 'Demande envoyée', bg: 'transparent', col: '#9FB3AE', bd: 'rgba(255,255,255,.25)' },
      ok: { t: 'Connecté', bg: 'transparent', col: '#F2EDE5', bd: 'rgba(255,255,255,.35)' },
      recue: { t: 'Accepter', bg: '#A6F26B', col: '#0B1A1F', bd: '#A6F26B' }
    };
    const NOTE = {
      non: 'Connectez-vous pour pouvoir lui écrire.',
      attente: prenom + ' doit accepter. Touchez encore pour simuler son accord.',
      ok: 'Vous êtes connectés : la messagerie est ouverte.',
      recue: prenom + ' veut se connecter avec vous.'
    };
    const connecter = () => {
      if (etat === 'ok') { S({ feuille: 'retirer' }); return; }
      S({ etat: suivant[etat] });
      if (etat === 'non') flash('Demande envoyée à ' + prenom);
      if (etat === 'recue' || etat === 'attente') flash('Vous êtes connectés avec ' + prenom);
    };

    const fRaw = has('feuille') ? st.feuille : null;
    const fermer = () => S({ feuille: null });
    const bloque = !!st.bloque;
    const ICM = {
      partager: 'M12 4v11M7.5 8.5 12 4l4.5 4.5M5 14v5h14v-5', lien: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
      signal: 'M5 21V4h11l-1.5 4L16 12H5', bloquer: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM6 6l12 12', retirer: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 11-6.6M16 18h5'
    };
    const menu = [
      { t: 'Partager le profil', s: 'Lien, WhatsApp ou QR code', d: ICM.partager, col: '#F2EDE5', go: () => { fermer(); flash('Lien du profil copié, prêt à partager'); } },
      { t: 'Copier le lien', s: 'jumanly.io/@' + o.handle, d: ICM.lien, col: '#F2EDE5', go: () => { fermer(); flash('Lien copié'); } }
    ];
    if (etat === 'ok') menu.push({ t: 'Retirer la connexion', s: 'Vous ne pourrez plus vous écrire', d: ICM.retirer, col: '#F2EDE5', go: () => S({ feuille: 'retirer' }) });
    menu.push({ t: 'Signaler', s: 'Faux profil, arnaque, propos blessants', d: ICM.signal, col: '#FF8A7A', go: () => S({ feuille: 'signaler' }) });
    menu.push(bloque
      ? { t: 'Débloquer ' + prenom, s: 'Il ou elle pourra de nouveau vous écrire', d: ICM.bloquer, col: '#F2EDE5', go: () => { S({ bloque: false, feuille: null }); flash(prenom + ' est débloqué(e)'); } }
      : { t: 'Bloquer ' + prenom, s: 'Il ou elle ne pourra plus vous écrire', d: ICM.bloquer, col: '#FF8A7A', go: () => S({ feuille: 'bloquer' }) });
    const raisons = ['Faux profil', 'Arnaque ou fausse offre', 'Propos blessants', 'Autre raison'].map((t) => ({ t, go: () => { fermer(); flash('Merci. Notre équipe vérifie sous 24 h.'); } }));

    // Orbi
    const oRep = st.oRep || null;
    const commun = o.comp.filter((c) => ['SQL', 'Excel', 'Power BI', 'Python'].includes(c.replace(' (débutant)', '')));
    const OR = {
      pourquoi: { q: 'Pourquoi me connecter avec ' + prenom + ' ?', t: prenom + ' est ' + o.role.toLowerCase() + (o.ent ? ' chez ' + o.ent : '') + '. Vous avez ' + o.commun + ' connexions en commun' + (commun.length ? ' et ' + commun.join(', ') + ' en commun.' : '.') },
      commun: { q: 'Qu’avons-nous en commun ?', t: (commun.length ? 'Compétences : ' + commun.join(', ') + '. ' : '') + o.commun + ' connexions en commun' + (o.ville === 'Kinshasa' ? ', et la même ville : Kinshasa.' : '.') },
      mot: etat === 'ok'
        ? { q: 'Écrire un premier message', t: '« Bonjour ' + prenom + ', merci pour la connexion. Votre parcours m’intéresse, auriez-vous 10 minutes pour en parler ? »', act: 'ecrire', actT: 'Ouvrir la discussion' }
        : { q: 'Écrire une demande de connexion', t: '« Bonjour ' + prenom + ', je suis analyste de données junior à Kinshasa. J’aimerais suivre votre parcours. »', act: 'demander', actT: etat === 'non' ? 'Envoyer la demande' : 'C’est noté' }
    };
    const rr = oRep && OR[oRep];
    const actRep = () => {
      if (rr.act === 'demander' && etat === 'non') { S({ etat: 'attente', orbi: false, oRep: null }); flash('Demande envoyée avec votre mot'); return; }
      S({ orbi: false, oRep: null });
      if (rr.act === 'ecrire') flash('Ouvrez la discussion avec l’icône de message');
    };
    const ra = rr ? { q: rr.q, t: rr.t, aAct: !!rr.act, actT: rr.actT || '', act: actRep } : { q: '', t: '', aAct: false, actT: '', act: () => {} };
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
      .map(([k, t]) => ({ t, d: ICO[k], href: HREF[k], c: k === 'explorer' ? '#A6F26B' : '#8FA39E', sw: k === 'explorer' ? '2.1' : '1.7', dot: k === 'explorer' ? '1' : '0' }));

    return {
      x, onglets, nav, retourHref: 'Offres.dc.html',
      oAbout: ong === 'about', oPub: ong === 'pub', oReal: ong === 'real',
      bt: BT[etat], note: NOTE[etat], connecte: etat === 'ok' && !bloque, recue: etat === 'recue',
      connecter, ignorer: () => { S({ etat: 'non' }); flash('Demande ignorée'); },
      bloque, debloquer: () => { S({ bloque: false }); flash(prenom + ' est débloqué(e)'); },
      ouvrirMenu: () => S({ feuille: 'menu' }), fermer, menu, raisons,
      fMenu: fRaw === 'menu', fSignaler: fRaw === 'signaler', fBloquer: fRaw === 'bloquer' || fRaw === 'retirer',
      bq: fRaw === 'retirer' ? { t: 'Retirer la connexion ?', d: 'Vous ne pourrez plus vous écrire. ' + prenom + ' ne sera pas prévenu(e).', b: 'Retirer' } : { t: 'Bloquer ' + prenom + ' ?', d: 'Il ou elle ne pourra plus voir votre profil ni vous écrire. Vous pourrez débloquer à tout moment.', b: 'Bloquer' },
      bloquer: () => {
        if (fRaw === 'retirer') { S({ etat: 'non', feuille: null }); flash('Connexion retirée'); return; }
        S({ bloque: true, feuille: null }); flash(prenom + ' est bloqué(e)');
      },
      orbi: !!st.orbi, ouvrirOrbi: () => S({ orbi: true, oRep: null }), fermerOrbi: () => S({ orbi: false, oRep: null }), autresQ: () => S({ oRep: null }),
      orbiTitre: rr ? 'Orbi' : 'Bonjour Grâce', aRep: !!rr, sansRep: !rr, ra,
      questions: ['pourquoi', 'commun', 'mot'].map((k) => ({ t: OR[k].q, go: () => S({ oRep: k }) })),
      oq, ecrireOrbi: (e) => S({ oq: e && e.target ? e.target.value : '' }),
      envoyerOrbi: () => S({ oRep: oq.trim() ? 'commun' : 'pourquoi', oq: '' }),
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}
