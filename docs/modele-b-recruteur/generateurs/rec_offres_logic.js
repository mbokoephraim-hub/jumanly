class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const p = this.props || {};
    const has = (k) => Object.prototype.hasOwnProperty.call(st, k);
    const S = (o) => this.setState(o);
    const flash = (t) => { S({ toast: t }); clearTimeout(this._t); this._t = setTimeout(() => this.setState({ toast: null }), 2300); };

    // Les offres de Nadia Kalala, recruteuse chez Baobab Fintech (Kinshasa). Aujourd’hui : jeudi 22 octobre 2026.
    const O = {
      analyste: { t: 'Analyste de données junior', ville: 'Kinshasa', contrat: 'CDI', mode: 'Hybride', statut: 'encours', pub: '16 oct.', jours: 6, reste: 24, vues: 412, cand: 38, nouv: 3, retenus: 2,
        v7: [38, 61, 74, 52, 69, 58, 60], c7: [3, 6, 8, 5, 7, 4, 5], v30: [12, 18, 22, 30, 41, 38, 61, 74, 52, 69, 58, 60], src: [['Explorer', 46], ['Fil', 28], ['Partage du lien', 18], ['Orbi', 8]],
        resume: 'Vous analysez les paiements Mobile Money de 2 millions de clients et préparez les tableaux de bord de l’équipe produit.',
        missions: ['Préparer les tableaux de bord mensuels', 'Nettoyer et croiser les données clients', 'Présenter les résultats à l’équipe produit'],
        qs: ['Avez-vous déjà utilisé SQL ou Power BI ?', 'Quand pouvez-vous commencer ?'], docs: ['CV', 'Attestation Excel ou SQL'] },
      clientele: { t: 'Chargé·e de clientèle Mobile Money', ville: 'Lubumbashi', contrat: 'CDI', mode: 'Sur place', statut: 'encours', pub: '11 oct.', jours: 11, reste: 19, vues: 655, cand: 52, nouv: 5, retenus: 4,
        v7: [44, 52, 61, 70, 48, 55, 59], c7: [4, 5, 3, 6, 4, 5, 2], v30: [30, 42, 51, 60, 58, 49, 44, 52, 61, 70, 48, 59], src: [['Fil', 41], ['Explorer', 39], ['Partage du lien', 15], ['Orbi', 5]],
        resume: 'Vous accompagnez les clients de Lubumbashi dans l’ouverture de leur compte et le règlement de leurs incidents.',
        missions: ['Répondre aux clients en agence et par message', 'Régler les incidents de paiement', 'Former les agents partenaires'],
        qs: ['Parlez-vous swahili ?', 'Avez-vous déjà travaillé au contact de clients ?'], docs: ['CV'] },
      flutter: { t: 'Développeur·se mobile Flutter', ville: 'Kinshasa', contrat: 'CDI', mode: 'Télétravail', statut: 'encours', pub: '20 oct.', jours: 2, reste: 28, vues: 120, cand: 9, nouv: 9, retenus: 0,
        v7: [0, 0, 0, 0, 0, 52, 68], c7: [0, 0, 0, 0, 0, 4, 5], v30: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 52, 68], src: [['Explorer', 58], ['Orbi', 22], ['Fil', 20]],
        resume: 'Vous développez l’application Baobab sur Android et iPhone, utilisée surtout sur des téléphones d’entrée de gamme.',
        missions: ['Développer de nouveaux écrans en Flutter', 'Alléger l’application pour les réseaux lents', 'Relire le code de l’équipe'],
        qs: ['Avez-vous publié une application sur le Play Store ?'], docs: ['CV', 'Lien vers vos projets'] },
      marketing: { t: 'Stagiaire marketing digital', ville: 'Kinshasa', contrat: 'Stage · 6 mois', mode: 'Sur place', statut: 'pause', pub: '4 oct.', jours: 18, reste: 12, vues: 830, cand: 71, nouv: 0, retenus: 6,
        v7: [30, 22, 18, 0, 0, 0, 0], c7: [3, 2, 1, 0, 0, 0, 0], v30: [70, 82, 90, 76, 64, 58, 40, 30, 22, 18, 0, 0], src: [['Fil', 52], ['Explorer', 33], ['Partage du lien', 15]],
        resume: 'Vous animez les réseaux sociaux de Baobab et suivez les campagnes de recrutement de nouveaux clients.',
        missions: ['Publier chaque semaine sur les réseaux', 'Mesurer les résultats des campagnes', 'Aider aux événements en ville'],
        qs: ['Quels réseaux utilisez-vous le plus ?'], docs: ['CV', 'Exemples de publications'] },
      comptable: { t: 'Comptable junior', ville: 'Kinshasa', contrat: 'CDD · 12 mois', mode: 'Sur place', statut: 'terminee', pub: '1er sept.', jours: 30, reste: 0, vues: 1204, cand: 96, nouv: 0, retenus: 1, fin: '30 sept.',
        v7: [0, 0, 0, 0, 0, 0, 0], c7: [0, 0, 0, 0, 0, 0, 0], v30: [80, 120, 140, 130, 118, 104, 96, 110, 100, 90, 70, 46], src: [['Explorer', 49], ['Fil', 30], ['Partage du lien', 21]],
        resume: 'Vous tenez la comptabilité des agences et préparez les déclarations mensuelles.',
        missions: ['Saisir et contrôler les écritures', 'Préparer les déclarations', 'Suivre les fournisseurs'],
        qs: ['Maîtrisez-vous le plan comptable OHADA ?'], docs: ['CV', 'Diplôme'] },
      risques: { t: 'Responsable des risques', ville: 'Kinshasa', contrat: 'CDI', mode: 'Hybride', statut: 'brouillon', pub: '', jours: 0, reste: 0, vues: 0, cand: 0, nouv: 0, retenus: 0,
        v7: [0, 0, 0, 0, 0, 0, 0], c7: [0, 0, 0, 0, 0, 0, 0], v30: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], src: [],
        resume: 'Brouillon enregistré le 21 oct. à l’étape 2 sur 5.', missions: [], qs: [], docs: ['CV'] }
    };
    if (st.publiee) O.nouvelle = { t: st.publiee, ville: (st.choix || {}).ville || 'Kinshasa', contrat: (st.choix || {}).contrat || 'CDI', mode: (st.choix || {}).mode || 'Hybride', statut: 'encours', pub: '22 oct.', jours: 0, reste: 30, vues: 0, cand: 0, nouv: 0, retenus: 0,
      v7: [0, 0, 0, 0, 0, 0, 0], c7: [0, 0, 0, 0, 0, 0, 0], v30: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], src: [], resume: 'Publiée aujourd’hui : les premières vues arrivent dans l’heure.', missions: [], qs: [], docs: ['CV'] };
    const ORDRE = [...(st.publiee ? ['nouvelle'] : []), 'flutter', 'analyste', 'clientele', 'marketing', 'risques', 'comptable'];
    const statuts = st.statuts || {};
    const statutDe = (k) => statuts[k] || O[k].statut;
    const ETQ = { encours: ['En cours', '#A6F26B', 'rgba(166,242,107,.12)'], pause: ['En pause', '#F4C463', 'rgba(244,196,99,.14)'], terminee: ['Terminée', '#B9CBC6', 'rgba(255,255,255,.08)'], brouillon: ['Brouillon', '#9FB3AE', 'rgba(255,255,255,.06)'] };

    const vue = st.vue ?? p.vue ?? 'liste';
    const offreK = O[st.offre ?? p.offre] ? (st.offre ?? p.offre) : 'analyste';
    const filtre = st.filtre ?? p.filtre ?? 'toutes';
    const fRaw = has('feuille') ? st.feuille : (p.feuille && p.feuille !== 'aucune' ? p.feuille : null);
    const fermer = () => S({ feuille: null });
    const ouvrir = (k) => () => S({ vue: k === 'risques' ? 'publier' : 'detail', offre: k, etape: k === 'risques' ? 2 : 1, feuille: null, rech: false, orbi: false, depuis: vue });

    // ---------- Liste ----------
    const FILTRES = [['toutes', 'Toutes'], ['encours', 'En cours'], ['terminees', 'Terminées']];
    const garde = (k) => filtre === 'toutes' || (filtre === 'encours' ? ['encours', 'pause'].includes(statutDe(k)) : statutDe(k) === 'terminee');
    const chiffre = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const carte = (k) => {
      const o = O[k], s = statutDe(k), e = ETQ[s];
      const infos = k === 'nouvelle' ? 'Publiée à l’instant' : s === 'brouillon' ? 'Brouillon · étape 2 sur 5' : s === 'terminee' ? `Terminée le ${o.fin || 'aujourd’hui'} · ${o.retenus} recruté${o.retenus > 1 ? 's' : ''}` : `En ligne depuis ${o.jours} jour${o.jours > 1 ? 's' : ''}`;
      return { t: o.t, lieu: `${o.ville} · ${o.contrat}`, et: e[0], ec: e[1], eb: e[2], vues: chiffre(o.vues), cand: o.cand, jours: s === 'brouillon' ? '—' : o.jours, infos,
        aNouv: o.nouv > 0 && s !== 'terminee', nouv: `${o.nouv} nouvelle${o.nouv > 1 ? 's' : ''}`, op: s === 'terminee' ? '.72' : '1', ouvrir: ouvrir(k) };
    };
    const cartes = ORDRE.filter(garde).map(carte);
    const filtres = FILTRES.map(([k, t]) => ({ t, pick: () => S({ filtre: k }), bg: k === filtre ? '#F2EDE5' : 'transparent', col: k === filtre ? '#0B1A1F' : '#F2EDE5', bd: k === filtre ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));
    const nEnCours = ORDRE.filter((k) => ['encours', 'pause'].includes(statutDe(k))).length;
    const totCand = ORDRE.filter((k) => statutDe(k) === 'encours').reduce((a, k) => a + O[k].cand, 0);
    const totNouv = ORDRE.filter((k) => statutDe(k) === 'encours').reduce((a, k) => a + O[k].nouv, 0);

    const PERS = [
      ['joel', 'Joël Kabeya', 'JK', '#DDF6EE', '#14745F', 'Community manager · Kinshasa', '3 relations en commun'],
      ['esther', 'Esther Kabila', 'EK', '#F9E3C8', '#8A4B12', 'Data analyst · Kinshasa', 'Même domaine : data'],
      ['moussa', 'Moussa Diallo', 'MD', '#E3E8FB', '#2D3F8A', 'Développeur Flutter · Lubumbashi', 'Correspond à votre offre Flutter'],
      ['amani', 'Amani Kasongo', 'AK', '#FBE3E3', '#8A2D2D', 'Chargée de clientèle · Lubumbashi', 'Même pays : RD Congo']
    ];
    const cx = st.cx || {};
    const personnes = PERS.map(([k, nom, ini, bg, fg, role, info]) => ({ nom, ini, bg, fg, role, info, href: `Personne-${k}.dc.html`,
      bt: cx[k] ? 'En attente' : 'Se connecter', bbg: cx[k] ? 'transparent' : '#A6F26B', bcol: cx[k] ? '#B9CBC6' : '#0B1A1F', bbd: cx[k] ? 'rgba(255,255,255,.22)' : '#A6F26B',
      connecter: () => { S({ cx: { ...cx, [k]: !cx[k] } }); if (!cx[k]) flash(`Demande envoyée à ${nom.split(' ')[0]}`); } }));

    // ---------- Recherche en deux temps ----------
    const rech = st.rech ?? (p.recherche === 'options' || p.recherche === 'texte');
    const q = st.q ?? (p.recherche === 'texte' ? 'a' : '');
    const rt = st.rt ?? 'tout';
    const TYPES = [['tout', 'Tout'], ['offres', 'Mes offres'], ['entreprises', 'Entreprises'], ['personnes', 'Personnes']];
    const rTypes = TYPES.map(([k, t]) => ({ t, pick: () => S({ rt: k }), bg: k === rt ? '#F2EDE5' : 'transparent', col: k === rt ? '#0B1A1F' : '#F2EDE5', bd: k === rt ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const nq = norm(q.trim());
    const ENT = [['Fleuve Banque', 'FB', '#1E4E79', 'Banque · Kinshasa · 5 offres'], ['Mwinda Énergie', 'ME', '#B07A12', 'Énergie · Kinshasa · 3 offres'], ['Lisanga Santé', 'LS', '#14745F', 'Santé · Kinshasa · 2 offres'], ['Kivu Data Lab', 'KD', '#4B2D7A', 'Data · Goma · 4 offres']];
    const rOffres = (rt === 'tout' || rt === 'offres') ? ORDRE.filter((k) => norm(O[k].t + ' ' + O[k].ville).includes(nq)).map((k) => ({ t: O[k].t, s: `${O[k].ville} · ${ETQ[statutDe(k)][0]} · ${O[k].cand} candidatures`, ouvrir: ouvrir(k) })) : [];
    const rEnt = (rt === 'tout' || rt === 'entreprises') ? ENT.filter((e) => norm(e[0] + e[3]).includes(nq)).map(([t, ab, c, s]) => ({ t, ab, c, s, voir: () => flash(`Page de ${t} : visible par tous sur Jumanly`) })) : [];
    const rPers = (rt === 'tout' || rt === 'personnes') ? personnes.filter((x) => norm(x.nom + x.role).includes(nq)) : [];
    const recents = [['Analyste', 'offre'], ['Fleuve Banque', 'entreprise'], ['Développeur Flutter Lubumbashi', 'personne']].map(([t, d]) => ({ t, d, pick: () => S({ q: t.split(' ')[0] }) }));

    // ---------- Détail d’une offre ----------
    const o = O[offreK], s = statutDe(offreK);
    const per = st.per ?? '7';
    const serieV = per === '7' ? o.v7 : o.v30, serieC = per === '7' ? o.c7 : o.v30.map((v) => Math.round(v / 10));
    const mx = Math.max(1, ...serieV);
    const JOURS7 = ['ven.', 'sam.', 'dim.', 'lun.', 'mar.', 'mer.', 'jeu.'];
    const barres = serieV.map((v, i) => ({ h: Math.max(3, Math.round(v / mx * 84)) + 'px', c: serieC[i] ? '+' + serieC[i] : '', lab: per === '7' ? JOURS7[i] : (i % 3 === 0 ? `S${Math.floor(i / 3) + 1}` : ''), w: per === '7' ? '22px' : '14px', bg: i === serieV.length - 1 ? '#5FE0B8' : '#2C4A4E' }));
    const taux = o.vues ? (o.cand / o.vues * 100).toFixed(1).replace('.', ',') + ' %' : '—';
    const det = { t: o.t, lieu: `${o.ville} · ${o.contrat} · ${o.mode}`, et: ETQ[s][0], ec: ETQ[s][1], eb: ETQ[s][2],
      dates: s === 'terminee' ? `Publiée le ${o.pub} · terminée le ${o.fin || 'aujourd’hui'}` : `Publiée le ${o.pub} · en ligne depuis ${o.jours} jours · ${o.reste} jours restants`,
      vues: chiffre(o.vues), cand: o.cand, taux, nouv: o.nouv, retenus: o.retenus, jours: o.jours, reste: o.reste,
      resume: o.resume, missions: o.missions, qs: o.qs, docs: o.docs.join(' · '),
      src: o.src.map(([t, v]) => ({ t, v: v + ' %', w: v + '%' })),
      voirT: `Voir les ${o.cand} candidats`, pause: s === 'pause', fini: s === 'terminee' };
    const periodes = [['7', '7 jours'], ['30', '30 jours']].map(([k, t]) => ({ t, pick: () => S({ per: k }), bg: k === per ? '#F2EDE5' : 'transparent', col: k === per ? '#0B1A1F' : '#B9CBC6' }));
    const avis = s === 'pause' ? 'Offre en pause : elle n’apparaît plus dans Explorer, les candidatures reçues restent.' :
      (o.cand / Math.max(1, o.vues) < 0.08 ? 'Peu de candidatures pour les vues : un salaire affiché aide souvent.' : `${o.nouv} candidatures attendent une réponse.`);

    // Candidats de l’offre (aperçu ; la fiche complète vit dans l’onglet Candidatures)
    const CANDS = [['Grâce Mbuyi', 'GM', 86, 'Présélection', 'SQL, Excel · Kinshasa'], ['Esther Kabila', 'EK', 81, 'Reçue', 'Power BI, SQL · Kinshasa'], ['Didier Lukusa', 'DL', 74, 'Entretien', 'Python · Kinshasa'], ['Sarah Mbala', 'SM', 69, 'Reçue', 'Excel · Matadi'], ['Junior Mukendi', 'JM', 61, 'Reçue', 'Statistiques · Kinshasa']];
    const candidats = CANDS.map(([nom, ini, sc, et, info]) => ({ nom, ini, sc: sc + ' %', et, info, voir: () => flash(`La fiche de ${nom.split(' ')[0]} s’ouvre dans Candidatures`) }));

    // ---------- Menu ··· ----------
    const menu = [
      { t: 'Modifier l’offre', s: 'Reprend les 5 étapes, déjà remplies', go: () => S({ vue: 'publier', etape: 1, feuille: null, modif: true, copie: false, pt: o.t, redige: true }), col: '#F2EDE5' },
      s === 'pause' ? { t: 'Reprendre l’offre', s: 'Elle réapparaît dans Explorer', go: () => { S({ statuts: { ...statuts, [offreK]: 'encours' }, feuille: null }); flash('Offre remise en ligne'); }, col: '#F2EDE5' }
        : { t: 'Mettre en pause', s: 'Elle disparaît d’Explorer, rien n’est perdu', go: () => { S({ statuts: { ...statuts, [offreK]: 'pause' }, feuille: null }); flash('Offre en pause'); }, col: '#F2EDE5' },
      { t: 'Partager', s: 'Lien, Fil, WhatsApp', go: () => S({ feuille: 'partage' }), col: '#F2EDE5' },
      { t: 'Dupliquer', s: 'Une nouvelle offre à partir de celle-ci', go: () => S({ vue: 'publier', etape: 1, feuille: null, modif: false, copie: true, pt: o.t + ' (copie)', redige: true }), col: '#F2EDE5' },
      { t: 'Clôturer l’offre', s: 'Fin des candidatures, rapport PDF', go: () => S({ feuille: 'cloturer' }), col: '#F08A7C' }
    ];
    const partages = [['Copier le lien', 'jumanly.io/offres/' + offreK + '-baobab'], ['Publier dans le Fil', 'Au nom de Baobab Fintech'], ['WhatsApp', 'Envoyer à un contact']].map(([t, d], i) => ({ t, d, go: () => { S({ feuille: null }); flash(i === 0 ? 'Lien copié' : i === 1 ? 'Publication prête dans le Fil' : 'WhatsApp ouvert'); } }));
    const cloturer = () => { S({ statuts: { ...statuts, [offreK]: 'terminee' }, feuille: 'rapport' }); };
    const telecharger = () => { S({ feuille: null }); flash('Rapport PDF téléchargé'); };

    // ---------- Publier en 5 étapes ----------
    const etape = Number(st.etape ?? p.etape ?? 1) || 1;
    const modif = st.modif ?? (p.modif === true || p.modif === 'true');
    const pt = st.pt ?? (modif ? o.t : (st.copie ? o.t + ' (copie)' : (p.rempli === 'true' || p.rempli === true ? 'Analyste crédit junior' : '')));
    const redige = st.redige ?? (p.rempli === 'true' || p.rempli === true || modif);
    const villes = ['Kinshasa', 'Lubumbashi', 'Goma', 'Matadi'], modes = ['Sur place', 'Hybride', 'Télétravail'], contrats = ['CDI', 'CDD', 'Stage', 'Freelance'];
    const choix = st.choix || { ville: 'Kinshasa', mode: 'Hybride', contrat: 'CDI' };
    const pills = (lst, cle) => lst.map((t) => ({ t, pick: () => S({ choix: { ...choix, [cle]: t } }), bg: choix[cle] === t ? '#F2EDE5' : 'transparent', col: choix[cle] === t ? '#0B1A1F' : '#F2EDE5', bd: choix[cle] === t ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));
    const salaire = st.salaire ?? true;
    const QPROP = ['Avez-vous déjà utilisé Excel ou SQL ?', 'Quand pouvez-vous commencer ?', 'Êtes-vous à Kinshasa ou prêt·e à y venir ?', 'Quel salaire attendez-vous ?'];
    const qsel = st.qsel || { 0: true, 1: true };
    const questions = QPROP.map((t, i) => ({ t, pick: () => S({ qsel: { ...qsel, [i]: !qsel[i] } }), on: !!qsel[i], bd: qsel[i] ? '#A6F26B' : 'rgba(255,255,255,.22)', bg: qsel[i] ? '#A6F26B' : 'transparent', sym: qsel[i] ? '✓' : '' }));
    const DOCS = ['CV', 'Lettre', 'Attestation', 'Diplôme', 'Portfolio'];
    const dsel = st.dsel || { CV: true, Attestation: true };
    const docs = DOCS.map((t) => ({ t, pick: () => { if (t === 'CV') return flash('Le CV est toujours demandé'); S({ dsel: { ...dsel, [t]: !dsel[t] } }); }, bg: dsel[t] ? '#F2EDE5' : 'transparent', col: dsel[t] ? '#0B1A1F' : '#F2EDE5', bd: dsel[t] ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));
    const ETAPES = ['Le poste', 'Les détails', 'La présélection', 'L’aperçu', 'Publier'];
    const peutSuivre = etape !== 1 || (pt.trim().length > 2 && redige);
    const suivante = () => {
      if (!peutSuivre) return flash(pt.trim().length > 2 ? 'Demandez à Orbi de rédiger, ou écrivez le texte' : 'Écrivez l’intitulé du poste');
      if (etape < 4) return S({ etape: etape + 1 });
      if (modif) { S({ vue: 'detail', etape: 1, modif: false }); return flash('Modifications enregistrées'); }
      S({ etape: 5, publiee: modif ? st.publiee : titreFinal });
    };
    const retourPub = () => {
      if (etape > 1 && etape < 5) return S({ etape: etape - 1 });
      S({ vue: modif || st.copie ? 'detail' : 'liste', etape: 1, modif: false, copie: false });
    };
    const titreFinal = pt.trim() || 'Analyste crédit junior';
    const texteOrbi = `Baobab Fintech recrute un·e ${titreFinal.toLowerCase()} à ${choix.ville}. Vous rejoignez une équipe de 12 personnes qui sert 2 millions de clients Mobile Money. Vous analysez les demandes, préparez les dossiers et proposez des améliorations.`;

    // ---------- Orbi ----------
    const orbiOuvert = st.orbi ?? (p.orbi === true || p.orbi === 'true');
    const oRep = st.oRep ?? (p.orbiRep && p.orbiRep !== 'aucune' ? p.orbiRep : null);
    const OQ = {
      peu: ['Comment attirer plus de candidats sur « Analyste » ?', '9,2 % des personnes qui voient l’offre postulent : c’est dans la moyenne. Afficher un salaire et raccourcir la liste des documents ferait monter ce taux.', 'Modifier l’offre', () => S({ vue: 'publier', offre: 'analyste', etape: 2, modif: true, pt: 'Analyste de données junior', redige: true, orbi: false })],
      meilleure: ['Quelle offre marche le mieux ?', '« Chargé·e de clientèle » : 52 candidatures en 11 jours, surtout venues du Fil. Partager vos offres dans le Fil semble efficace.', 'Voir cette offre', () => S({ vue: 'detail', offre: 'clientele', orbi: false })],
      rediger: ['Rédiger une nouvelle offre', 'Donnez-moi l’intitulé du poste : j’écris le texte, les missions et deux questions de présélection. Vous corrigez avant de publier.', 'Commencer', () => S({ vue: 'publier', etape: 1, orbi: false, modif: false })],
      relancer: ['Relancer l’offre Flutter ?', 'Elle a 2 jours et 9 candidatures : il est trop tôt. Je vous préviens si les vues baissent sous 30 par jour.', 'D’accord', () => S({ orbi: false })]
    };
    const questionsOrbi = Object.entries(OQ).map(([k, v]) => ({ t: v[0], go: () => S({ oRep: k }) }));
    const ra = oRep && OQ[oRep] ? { q: OQ[oRep][0], t: OQ[oRep][1], actT: OQ[oRep][2], act: OQ[oRep][3] } : { q: '', t: '', actT: '', act: () => {} };
    const oq = st.oq ?? '';

    // ---------- Barre du bas (recruteur) ----------
    const ICO = {
      fil: 'M4 6h16M4 12h16M4 18h10',
      offres: 'M3.5 8.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3.5 12.5h17M12 11.5v2',
      candidatures: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.3M21.5 20a6.5 6.5 0 0 0-3.8-5.9',
      talents: 'M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z',
      messages: 'M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5z'
    };
    const nav = [['fil', 'Fil'], ['offres', 'Offres'], ['candidatures', 'Candidatures'], ['talents', 'Talents'], ['messages', 'Messages']]
      .map(([k, t]) => ({ t, d: ICO[k], c: k === 'offres' ? '#A6F26B' : '#8FA39E', sw: k === 'offres' ? '2.1' : '1.7', dot: k === 'offres' ? '1' : '0',
        go: () => (k === 'offres' ? S({ vue: 'liste', rech: false, feuille: null }) : flash(`${t} : onglet dessiné à l’étape suivante`)) }));

    const vals = {
      vListe: vue === 'liste', vDetail: vue === 'detail', vCands: vue === 'candidats', vPub: vue === 'publier',
      nav, filtres, cartes, personnes, aucune: cartes.length === 0,
      resume: `${nEnCours} offres en cours · ${totCand} candidatures · ${totNouv} nouvelles`,
      publier: () => S({ vue: 'publier', etape: 1, modif: false, copie: false, pt: '', redige: false, rech: false }),
      // recherche
      aRech: rech, sansRech: !rech, q, aQ: q.length > 0, qVide: !q.trim(), qPlein: !!q.trim(), rTypes, recents,
      chercher: (e) => S({ q: e && e.target ? e.target.value : '' }), focusRech: () => S({ rech: true }), annulerRech: () => S({ rech: false, q: '' }), viderQ: () => S({ q: '' }),
      ouvrirRech: () => S({ rech: true }),
      rOffres, rEnt, rPers, aROffres: rOffres.length > 0, aREnt: rEnt.length > 0, aRPers: rPers.length > 0, rRien: !!q.trim() && !rOffres.length && !rEnt.length && !rPers.length,
      nROffres: rOffres.length, nREnt: rEnt.length, nRPers: rPers.length,
      // détail
      det, periodes, barres, avis, missions: o.missions, aMissions: o.missions.length > 0, qsOffre: o.qs.map((t) => ({ t })), srcs: det.src,
      retourDetail: () => S({ vue: 'liste', feuille: null }), ouvrirMenu: () => S({ feuille: 'menu' }),
      voirCandidats: () => S({ vue: 'candidats' }), ouvrirCandidatures: () => flash('Candidatures : onglet dessiné à l’étape suivante'), aSrc: o.src.length > 0, retourCands: () => S({ vue: 'detail' }), candidats, candTitre: `${o.cand} candidats · ${o.nouv} nouveaux`,
      // feuilles
      fMenu: fRaw === 'menu', fPartage: fRaw === 'partage', fClot: fRaw === 'cloturer', fRapport: fRaw === 'rapport', menu, partages, fermer, cloturer, telecharger,
      menuTitre: o.t, clotTexte: `Les ${o.cand} candidats reçoivent un message. Les candidatures restent consultables, et le rapport PDF se prépare.`,
      // publier
      etape, etapeT: etape < 5 ? `Étape ${etape} sur 4 · ${ETAPES[etape - 1]}` : 'Offre publiée', e1: etape === 1, e2: etape === 2, e3: etape === 3, e4: etape === 4, e5: etape === 5, pasFin: etape < 5,
      progres: Math.min(etape, 4) * 25 + '%', pubTitre: modif ? 'Modifier l’offre' : 'Nouvelle offre', pt, redige, sansRedige: !redige, texteOrbi,
      ecrireTitre: (e) => S({ pt: e && e.target ? e.target.value : '' }), orbiRedige: () => { if (pt.trim().length < 3) return flash('Écrivez d’abord l’intitulé du poste'); S({ redige: true }); flash('Orbi a rédigé le texte : relisez-le'); },
      villes: pills(villes, 'ville'), modes: pills(modes, 'mode'), contrats: pills(contrats, 'contrat'),
      salaire, salT: salaire ? '600 à 900 USD par mois' : 'Non affiché', basculeSal: () => S({ salaire: !salaire }), salBg: salaire ? '#A6F26B' : '#33464A', salX: salaire ? '20px' : '0px',
      questions, docs, nQ: Object.values(qsel).filter(Boolean).length,
      apercu: { t: titreFinal, lieu: `${choix.ville} · ${choix.contrat} · ${choix.mode}`, sal: salaire ? '600 à 900 USD par mois' : '' }, aSal: salaire,
      suivante, retourPub, suivT: etape < 4 ? 'Continuer' : 'Publier l’offre', suivOp: peutSuivre ? '1' : '.45', lienPub: 'jumanly.io/offres/analyste-credit-baobab',
      voirPubliee: () => S({ vue: 'liste', etape: 1, filtre: 'toutes' }), partagerFil: () => flash('Publication prête dans le Fil'),
      enregistrerBrouillon: () => { S({ vue: 'liste', etape: 1 }); flash('Brouillon enregistré'); },
      // Orbi
      orbi: orbiOuvert, ouvrirOrbi: () => S({ orbi: true, oRep: null }), fermerOrbi: () => S({ orbi: false }), questionsOrbi, ra, aRep: !!oRep, sansRep: !oRep, autresQ: () => S({ oRep: null }),
      bulle: 'Comment attirer plus de candidats ?', bulleGo: () => S({ orbi: true, oRep: 'peu' }),
      oq, ecrireOrbi: (e) => S({ oq: e && e.target ? e.target.value : '' }), envoyerOrbi: () => { if (!oq.trim()) return flash('Écrivez votre question à Orbi'); S({ oRep: 'meilleure', oq: '' }); },
      fab: vue === 'liste' && !rech,
      aToast: !!st.toast, toast: st.toast || ''
    };
    return vals;
  }
}
