    // ================= Canvas web : recruteur (Nadia) et administrateur (Joseph), de l’accueil aux réglages =================
    const prenom = moiN.split(' ')[0];
    const hF = (h) => Math.floor(h) + ' h' + (h % 1 ? String(Math.round((h % 1) * 60)).padStart(2, '0') : '');
    const pk2 = (lst, actif, set) => lst.map(([k, t]) => ({ t, pick: () => set(k), bg: k === actif ? '#F2EDE5' : 'transparent', col: k === actif ? '#0B1A1F' : '#F2EDE5', bd: k === actif ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));
    const sw = (on) => ({ fond: on ? '#A6F26B' : '#2A3B3E', x: on ? '20px' : '0px', etat: on ? 'true' : 'false' });
    const etT = (k) => (ETAPES.find((e) => e[0] === k) || ETAPES[0])[1];

    // ---------- Demandes à valider (administrateur) ----------
    const dem = st.dem || {};
    const DEM0 = [['merveille', 'Merveille Tshala', 'MT', '#FBE3EF', '#8A2D5C', 'Chargée RH · demande à rejoindre l’équipe de recrutement', 'rattachement'],
      ['fabrice', 'Fabrice Lumbu', 'FL', '#E8F0D8', '#4F6B12', 'Indique travailler chez Baobab Fintech · Analyste risque', 'membre'],
      ['sandra', 'Sandra Mukendi', 'SM', '#EDE3FB', '#5A2D8A', 'Indique travailler chez Baobab Fintech · Développeuse', 'membre']];
    const demandes = DEM0.filter((d) => !dem[d[0]]).map(([k, nom, ini, bg, fg, s, ty]) => ({ k, nom, ini, bg, fg, s, ty, rat: ty === 'rattachement', mem: ty === 'membre',
      okT: ty === 'rattachement' ? 'Accepter' : 'Confirmer', nonT: ty === 'rattachement' ? 'Refuser' : 'Ne travaille pas ici',
      ok: () => { S({ dem: { ...dem, [k]: 'ok' } }); flash(ty === 'rattachement' ? nom.split(' ')[0] + ' rejoint l’équipe : 5 utilisateurs sur 5' : nom.split(' ')[0] + ' apparaît comme membre confirmé·e'); },
      non: () => { S({ dem: { ...dem, [k]: 'non' } }); flash(ty === 'rattachement' ? 'Demande refusée : ' + nom.split(' ')[0] + ' est prévenue' : 'Retiré·e des membres de la page'); } }));
    const sieges = 4 + (dem.merveille === 'ok' ? 1 : 0);

    // ---------- Invitations envoyées ----------
    const invs = st.invs || [['david', 'David Kanza', 'Lecteur', 'envoyée mardi']];
    const ROLES = [['admin', 'Administrateur', 'Membres, rôles, offres, rapports et formule'], ['recruteur', 'Recruteur', 'Offres attribuées, ATS, messages, rendez-vous'], ['manager', 'Manager', 'Voit les candidats de ses offres, évalue et commente ; ne publie pas'], ['lecteur', 'Lecteur', 'Lit les tableaux de bord et les rapports']];
    const PRESET = { recruteur: { publier: true, trier: true, entretiens: true, evaluer: true, evolution: false, page: false }, manager: { publier: false, trier: true, entretiens: true, evaluer: true, evolution: false, page: false }, lecteur: { publier: false, trier: false, entretiens: false, evaluer: false, evolution: true, page: false }, admin: { publier: true, trier: true, entretiens: true, evaluer: true, evolution: true, page: true } };
    const roles = st.roles || { nadia: 'recruteur', aline: 'manager', patrice: 'manager' };
    const roleSel = roles[membreK] || 'manager';
    const invMail = st.invMail ?? '';
    const invRole = st.invRole || 'recruteur';
    const eqOng = prop('eqOng', 'membres');
    const tF = st.tF || 'toutes';
    const retard = (t) => t.k === 't4' && !t.fait;
    const tachesF = taches.filter((t) => tF === 'toutes' || (tF === 'cours' ? !t.fait : tF === 'fait' ? t.fait : retard(t))).map((t) => ({ ...t, retT: retard(t) ? 'En retard' : '', aRet: retard(t) }));

    // ---------- Offres : détail ----------
    const OFD = {
      analyste: { desc: 'Rejoignez l’équipe data de Baobab Fintech pour suivre l’usage du paiement mobile et aider les équipes à décider avec des chiffres fiables.', missions: ['Préparer les tableaux de bord hebdomadaires', 'Écrire et vérifier les requêtes SQL', 'Présenter les résultats aux équipes produit'], req: ['SQL', 'Excel', 'Power BI'], souh: ['Python', 'Anglais B2'], contrat: 'CDI', lieu: 'Kinshasa · hybride', sal: 'Non affiché', limite: '15 nov. 2026', qs: ['Avez-vous déjà utilisé SQL ou Power BI ?', 'Quand pouvez-vous commencer ?'], docs: 'CV', resp: 'Nadia Kalala', evals: 'Aline Mukeba', et: [27, 5, 3, 2, 1], src: [['Explorer', 18], ['Lien partagé', 11], ['Proposée par l’équipe', 9]], vues: 412 },
      clientele: { desc: 'Accueillez et accompagnez les clients Mobile Money de nos agences de Lubumbashi, en français et en swahili.', missions: ['Répondre aux clients en agence et au téléphone', 'Résoudre les incidents de paiement', 'Former les clients aux services'], req: ['Relation client', 'Swahili', 'Mobile Money'], souh: ['Anglais'], contrat: 'CDI', lieu: 'Lubumbashi · sur site', sal: '450 à 600 USD par mois', limite: '31 oct. 2026', qs: ['Parlez-vous swahili au quotidien ?', 'Êtes-vous disponible le samedi matin ?'], docs: 'CV', resp: 'Nadia Kalala', evals: 'Patrice Nzuzi', et: [33, 10, 5, 3, 1], src: [['Explorer', 29], ['Lien partagé', 15], ['Proposée par l’équipe', 8]], vues: 680 },
      flutter: { desc: 'Construisez avec nous l’appli de paiement utilisée chaque jour par nos clients.', missions: ['Développer de nouveaux écrans en Flutter', 'Améliorer les performances sur réseau lent', 'Relire le code de l’équipe'], req: ['Flutter', 'Dart', 'API REST'], souh: ['Tests automatisés'], contrat: 'CDI', lieu: 'Kinshasa · télétravail possible', sal: 'Non affiché', limite: '30 nov. 2026', qs: ['Une appli que vous avez publiée ?', 'Quel est votre préavis ?'], docs: 'CV et lien vers un projet', resp: 'Nadia Kalala', evals: 'Aline Mukeba', et: [5, 2, 1, 1, 0], src: [['Explorer', 4], ['Lien partagé', 2], ['Proposée par l’équipe', 3]], vues: 233 },
      marketing: { desc: 'Six mois pour apprendre le marketing digital d’une fintech, avec un tuteur.', missions: ['Préparer les publications', 'Suivre les campagnes', 'Analyser les résultats'], req: ['Réseaux sociaux', 'Rédaction'], souh: ['Canva'], contrat: 'Stage de 6 mois', lieu: 'Kinshasa · sur site', sal: '150 USD par mois', limite: 'En pause', qs: ['Un exemple de publication que vous avez faite ?'], docs: 'CV', resp: 'Nadia Kalala', evals: 'Joseph Ilunga', et: [55, 9, 4, 2, 1], src: [['Explorer', 40], ['Lien partagé', 21], ['Proposée par l’équipe', 10]], vues: 1104 }
    };
    const ofNew = st.ofNew || [];
    const ofSt = st.ofSt || {};
    const ofTous = OFFRES.concat(ofNew);
    const ofSel = ofTous.find((o) => o.k === ofK) || ofTous[0];
    const ofd = OFD[ofSel.k] || { ...OFD.analyste, desc: (st.nf || {}).desc || 'Annonce publiée aujourd’hui.', et: [0, 0, 0, 0, 0], src: [['Explorer', 0], ['Lien partagé', 0], ['Proposée par l’équipe', 0]], vues: 0 };
    const ofStatut = ofSt[ofSel.k] || ofSel.statut;
    const oTab = prop('oTab', 'apercu');

    // ---------- Nouvelle offre en 5 étapes ----------
    const nStep = Math.min(5, Math.max(1, Number(prop('nStep', 1)) || 1));
    const NF0 = { t: 'Analyste risque crédit', service: 'risques', postes: '1', desc: '', req: ['Excel', 'Analyse financière', 'SQL'], souh: ['Python'], contrat: 'cdi', mode: 'hybride', salOn: true, sal: '900 à 1 200 USD par mois', limite: '20 nov. 2026', qs: ['Avez-vous déjà analysé un portefeuille de crédits ?', 'Quand pouvez-vous commencer ?'], docs: { cv: true, lettre: false, diplome: false }, resp: 'nadia', evals: { aline: true, patrice: false } };
    const nf = { ...NF0, ...(st.nf || {}) };
    const setNf = (o) => S({ nf: { ...nf, ...o } });
    const nComp = st.nComp ?? '';
    const nQ = st.nQ ?? '';
    const NETAPES = ['Le poste', 'Compétences', 'Conditions', 'Questions', 'Aperçu et équipe'];
    const CONTRATS = [['cdi', 'CDI'], ['cdd', 'CDD'], ['stage', 'Stage'], ['freelance', 'Mission']];
    const MODES = [['site', 'Sur site'], ['hybride', 'Hybride'], ['distance', 'À distance']];

    // ---------- Candidatures : liste ----------
    const cMode = prop('cMode', 'colonnes');
    const cF = st.cF || 'toutes';
    const SUIVI = { grace: 'Aline Mukeba', benjamin: 'Nadia Kalala', didier: 'Aline Mukeba', nathan: 'Patrice Nzuzi', moussa: 'Nadia Kalala', esther: 'Nadia Kalala' };
    const listeC = CANDS.filter((x) => x.of === offreSel.k).filter((x) => cF === 'toutes' || (cF === 'fort' ? x.s >= 85 : x.et === 'nouvelles')).sort((a, b) => b.s - a.s).map((x) => ({ ...x, etT: x.nr ? 'Non retenu·e' : etT(x.et), suivi: SUIVI[x.k] || 'Personne pour l’instant' }));

    // ---------- Fiche candidat : onglets ----------
    const fT = prop('fT', 'resume');
    const EXPS = { grace: [['Stagiaire data', 'Kivu Data Lab · 6 mois · 2025'], ['Assistante de recherche', 'Université de Kinshasa · 1 an']], benjamin: [['Analyste junior', 'Lisanga Assurances · 1 an'], ['Stagiaire BI', 'Fleuve Banque · 6 mois']], esther: [['Stagiaire data', 'Kivu Data Lab · 4 mois']], didier: [['Assistant statisticien', 'Institut national de la statistique · 2 ans']], moussa: [['Développeur mobile', 'Mwinda Énergie · 2 ans'], ['Freelance Flutter', '3 applis publiées']], nathan: [['Conseiller clientèle', 'Fleuve Banque · 3 ans']] };
    const FORMS = { grace: 'Licence en économie · Université de Kinshasa · 2025', benjamin: 'Master en statistique · Université de Lubumbashi · 2024', moussa: 'Licence en informatique · ISTA Kinshasa · 2022', nathan: 'Graduat en gestion · ISC Lubumbashi · 2021' };
    const COMPS = { grace: [['SQL', true], ['Excel', true], ['Power BI', true], ['Python', false]], benjamin: [['Python', true], ['SQL', true], ['Excel', true], ['Power BI', false]], esther: [['Excel', true], ['SQL', false], ['Power BI', false]], moussa: [['Flutter', true], ['Dart', true], ['API REST', true]], nathan: [['Relation client', true], ['Swahili', true], ['Mobile Money', true]] };
    const REPS = { grace: ['Oui, SQL chaque jour pendant mon stage et Power BI pour deux tableaux de bord.', 'Dans deux semaines, après ma soutenance.'], benjamin: ['Oui, SQL et Python depuis deux ans.', 'Le 9 novembre.'], esther: ['Excel tous les jours ; SQL appris en ligne, pas encore en entreprise.', 'Tout de suite.'] };
    const DIAGS = { grace: ['Analyste de données', 'Rigueur, SQL, présentation claire', 'Python, prise de parole en réunion'], benjamin: ['Analyste de données confirmé', 'Statistique, Python', 'Gestion de projet'], moussa: ['Développeur mobile senior', 'Flutter, qualité du code', 'Encadrer une équipe'], didier: ['Data analyst', 'Statistiques, anglais', 'Power BI, visualisation'] };
    const NOTES0 = { grace: [['Aline Mukeba', 'hier', 'Très bon test SQL. Vérifier Python en entretien.']], benjamin: [['Nadia Kalala', 'lundi', 'Proposition envoyée : 1 100 USD, début souhaité le 9 novembre.']], didier: [['Aline Mukeba', 'mardi', 'Bon niveau en statistiques ; Power BI à travailler.']] };
    const EVALS0 = { didier: [['Aline Mukeba', 'Mar. 20 oct.', '4', 'Poursuivre']], nathan: [['Patrice Nzuzi', 'Mar. 20 oct.', '4,2', 'Poursuivre']], benjamin: [['Aline Mukeba', 'Ven. 16 oct.', '4,4', 'Poursuivre'], ['Nadia Kalala', 'Ven. 16 oct.', '4', 'Poursuivre']] };
    const notesAj = st.notesAj || {};
    const noteBr = st.noteBr ?? '';
    const evals = st.evals || {};
    const dg = st.dg || {};
    const cvOuvert = modal === 'cv';
    const diag = DIAGS[c.k] || ['Selon son profil', 'Points forts du profil', 'À développer'];
    const tDiag = taches.find((t) => t.candK === c.k && t.ty === 'diagnostic');
    const histo = [['Candidature reçue', 'Via Explorer · ' + c.d], ['Score calculé : ' + c.sT + ' sur 8 critères fixes', 'Le même calcul pour tout le monde'], ['Profil consulté par ' + moiN, 'Aujourd’hui · enregistré dans le journal']]
      .concat(iEt >= 1 ? [['Passé·e en présélection', 'Par Nadia Kalala']] : []).concat(iEt >= 2 ? [['Entretien planifié', 'Invitation acceptée par la personne']] : []).concat(iEt >= 3 ? [['Proposition envoyée', 'Lundi 19 octobre']] : []).concat(c.nr ? [['Non retenu·e : message envoyé', 'Décision prise par ' + moiN]] : []);

    // ---------- Évaluation d’entretien ----------
    const CRITE = ['Compétences techniques', 'Résolution de problèmes', 'Communication', 'Motivation pour le poste', 'Travail en équipe'];
    const evN = st.evN || {};
    const evRec = st.evRec || 'poursuivre';
    const evCom = st.evCom ?? '';
    const notesV = CRITE.map((t, i) => evN[i] || 0);
    const nNotes = notesV.filter((x) => x > 0).length;
    const moy = nNotes ? (notesV.reduce((a, x) => a + x, 0) / nNotes) : 0;
    const moyT = nNotes ? moy.toFixed(1).replace('.', ',') + ' sur 5' : 'pas encore notée';
    const evCand = EV0.concat(evAjout).find((e) => e[8] === c.k && e[4] === 'entretien');

    // ---------- Agenda : jour, semaine, mois ----------
    const agMode = prop('agMode', 'semaine');
    const agJour = st.agJour || 'jeu';
    const JN = { lun: 19, mar: 20, mer: 21, jeu: 22, ven: 23 };
    const jourNom = { lun: 'Lundi', mar: 'Mardi', mer: 'Mercredi', jeu: 'Jeudi', ven: 'Vendredi' };
    const evsJour = EV0.concat(evAjout).filter((e) => !evAnn[e[0]] && e[1] === agJour).sort((a, b) => a[2] - b[2]).map((e) => ({ k: e[0], t: e[5], s: e[6], h: hF(e[2]) + ' · ' + Math.round(e[3] * 60) + ' min', bg: TYPEC[e[4]][0], qui: e[7].map((q) => eqDe(q).prenom).join(', '), ouvrir: () => S({ evK: e[0] }), sel: e[0] === evK, bord: e[0] === evK ? '#A6F26B' : 'rgba(255,255,255,.08)' }));
    const jourDeN = (d) => Object.keys(JN).find((k) => JN[k] === d);
    const MOISG = []; for (let i = 0; i < 3; i++) MOISG.push({ t: '', vide: true, evs: [], bg: 'transparent', bord: 'transparent', go: () => {} , col: '#8FA39E' });
    for (let d = 1; d <= 31; d++) { const jk = jourDeN(d); const lst = jk ? EV0.concat(evAjout).filter((e) => !evAnn[e[0]] && e[1] === jk).sort((a, b) => a[2] - b[2]) : (d === 28 ? [['x1', '', 10, 1, 'equipe', 'Comité de recrutement']] : d === 30 ? [['x2', '', 9, 1, 'entretien', 'Entretiens Flutter']] : []);
      MOISG.push({ t: String(d), vide: false, evs: lst.slice(0, 3).map((e) => ({ t: hF(e[2]) + ' ' + e[5].replace('Entretien · ', '').replace('Appel · ', ''), bg: TYPEC[e[4]][0] })), plus: lst.length > 3 ? '+' + (lst.length - 3) : '', aPlus: lst.length > 3, bg: d === 22 ? 'rgba(166,242,107,.08)' : '#0D1E22', bord: d === 22 ? '#A6F26B' : 'rgba(255,255,255,.06)', col: d === 22 ? '#A6F26B' : '#B9CBC6',
        go: () => { if (jk) S({ agMode: 'jour', agJour: jk }); else flash(d === 28 || d === 30 ? 'Semaine prochaine : le détail s’ouvre en vue Semaine' : 'Aucun rendez-vous le ' + d + ' octobre'); } }); }
    while (MOISG.length % 7) MOISG.push({ t: '', vide: true, evs: [], bg: 'transparent', bord: 'transparent', go: () => {}, col: '#8FA39E' });
    const dispo = st.dispo || { lun: true, mar: true, mer: true, jeu: true, ven: true };

    // ---------- Notifications (page) ----------
    const nF = st.nF || 'tout';
    const lu = !!st.lu;
    const NALL = [['cand', 'Esther Kabila a candidaté', 'Analyste de données junior · 85 % · il y a 2 h', go('candidat', { candK: 'esther', fT: 'resume' })],
      ['cand', 'Benjamin Tshibangu a répondu à la proposition', 'Messages · 8 h 40', go('messages', { convK: 'benjamin' })],
      ['equipe', admin ? 'Aline a terminé : évaluer le diagnostic de Didier' : 'Joseph vous a attribué : évaluer le diagnostic de Moussa', admin ? 'Équipe · ce matin' : 'Mon espace · échéance lundi 26 octobre', admin ? go('equipe', { eqOng: 'taches' }) : go('moi')],
      ['agenda', 'Entretien avec Moussa Diallo à 14 h', 'Agenda · aujourd’hui', go('agenda', { agMode: 'jour', evK: 'e5' })],
      ['reseau', 'Prince Kalonji veut se connecter', 'Réseau · hier', go('talents', { sousT: 'reseau' })],
      ['orbi', '3 profils à fort potentiel pour Flutter', 'Orbi · 7 h', go('candidatures', { offre: 'flutter' })]]
      .concat(admin ? [['equipe', 'Merveille Tshala demande à rejoindre l’équipe', 'Équipe · il y a 1 h', go('equipe', { eqOng: 'invitations' })], ['equipe', '2 personnes indiquent travailler chez Baobab Fintech', 'Page entreprise · hier', go('pageEnt')], ['formule', 'Votre formule se renouvelle le 14 novembre', 'Formule · rappel 7 jours avant', go('factu')]] : []);
    const notifsL = NALL.filter((n) => nF === 'tout' || n[0] === nF).map(([cat, t, s, g], i) => ({ t, s, go: g, nouv: !lu && i < 3, pt: !lu && i < 3 ? '#A6F26B' : 'transparent', cat: { cand: 'Candidature', equipe: 'Équipe', agenda: 'Agenda', reseau: 'Réseau', orbi: 'Orbi', formule: 'Formule' }[cat] }));

    // ---------- Orbi (page) ----------
    const OCONV = [['entretien', 'Préparer l’entretien de Grâce', [['moi', 'Que demander à Grâce Mbuyi vendredi ?'], ['orbi', 'Trois questions : un projet SQL récent et ce qu’elle a vérifié elle-même ; comment elle expliquerait un tableau de bord à une équipe non technique ; ce qu’elle a appris en Python. Son score de 93 % vient surtout des compétences requises, toutes vérifiées.']]],
      ['semaine', 'Résumé de la semaine', [['moi', 'Résume ma semaine.'], ['orbi', '41 candidatures reçues, 3 entretiens menés, 1 proposition envoyée. Tout le monde a reçu une réponse en moins de 6 jours. À faire : répondre à Benjamin et évaluer le diagnostic de Moussa.']]],
      ['clientele', 'Offre Clientèle : peu de bons profils', [['moi', 'Pourquoi l’offre Clientèle reçoit peu de bons profils ?'], ['orbi', 'Elle demande le swahili et 2 ans d’expérience : 31 candidats sur 52 n’ont pas l’expérience. Afficher le salaire et accepter 1 an élargirait le vivier. Vous décidez.']]]];
    const oK = st.oK || 'entretien';
    const oAj = st.oAj || {};
    const oBr = st.oBr ?? '';
    const oConv = OCONV.find((x) => x[0] === oK) || OCONV[0];
    const oMsgs = oConv[2].concat(oAj[oK] || []).map(([q, t]) => ({ t, moi: q === 'moi', orbi: q !== 'moi' }));

    // ---------- Page entreprise (administrateur) ----------
    const pe = { nom: 'Baobab Fintech', secteur: 'Fintech · paiement mobile', taille: '51 à 200 personnes', ville: 'Kinshasa', site: 'baobabfintech.cd', apropos: 'Nous rendons le paiement mobile simple pour les commerçants et les familles, de Kinshasa à Lubumbashi.', ...(st.pe || {}) };
    const peRec = st.peRec ?? true;
    const bOng = prop('bOng', 'apropos');
    const membresB = [['joseph', 'Joseph Ilunga', 'JI', '#14745F', '#FFFFFF', 'Responsable RH'], ['nadia', 'Nadia Kalala', 'NK', '#1B3338', '#F2EDE5', 'Chargée de recrutement'], ['aline', 'Aline Mukeba', 'AM', '#2A3B3E', '#F2EDE5', 'Responsable data'], ['patrice', 'Patrice Nzuzi', 'PN', '#2A3B3E', '#F2EDE5', 'Responsable service client']]
      .concat(dem.fabrice === 'ok' ? [['fabrice', 'Fabrice Lumbu', 'FL', '#E8F0D8', '#4F6B12', 'Analyste risque']] : []).concat(dem.sandra === 'ok' ? [['sandra', 'Sandra Mukendi', 'SM', '#EDE3FB', '#5A2D8A', 'Développeuse']] : [])
      .map(([k, nom, ini, bg, fg, r]) => ({ k, nom, ini, bg, fg, r }));

    // ---------- Formule et facturation ----------
    const payOp = st.payOp || 'mpesa';
    const payE = st.payE || '';
    const payPlan = st.payPlan || 'company';
    const PLANS = [['company', 'Company', '79,9 USD par mois', '5 utilisateurs · 20 offres en ligne · ATS avancé · grilles d’évaluation · statistiques', 'Votre formule'], ['plus', 'Company Plus', '179,9 USD par mois', '15 utilisateurs · 50 offres · plusieurs équipes · viviers partagés · export des rapports', 'Passer à Company Plus'], ['premium', 'Company Premium', 'Sur devis', '30 utilisateurs et plus · filiales · intégrations · accompagnement', 'Demander un devis']];
    const FACT = [['JMN-2026-10-0412', '14 oct. 2026', '79,90 USD', 'Payée · M-Pesa'], ['JMN-2026-09-0388', '14 sept. 2026', '79,90 USD', 'Payée · M-Pesa'], ['JMN-2026-08-0351', '14 août 2026', '79,90 USD', 'Payée · carte']];
    const factK = st.factK || FACT[0][0];
    const factSel = FACT.find((f) => f[0] === factK) || FACT[0];

    // ---------- Journal des consultations ----------
    const jF = st.jF || 'tous';
    const JRN = [['Aujourd’hui · 9 h 12', 'nadia', 'Profil consulté', 'Esther Kabila', 'Analyste de données junior', 'esther'], ['Aujourd’hui · 8 h 47', 'aline', 'CV ouvert', 'Grâce Mbuyi', 'Analyste de données junior', 'grace'], ['Hier · 16 h 05', 'patrice', 'Profil consulté', 'Nathan Ilunga', 'Chargé·e de clientèle', 'nathan'], ['Hier · 11 h 30', 'nadia', 'Profil consulté (talent visible)', 'Rachel Kanku', 'Proposition d’offre', ''], ['Hier · 10 h 02', 'joseph', 'Rapport exporté en PDF', 'Aucune personne', 'Rapport de recrutement d’octobre', ''], ['Mar. 20 oct. · 14 h 40', 'patrice', 'Évaluation enregistrée', 'Nathan Ilunga', 'Chargé·e de clientèle', 'nathan'], ['Mar. 20 oct. · 9 h 15', 'aline', 'Diagnostic consulté', 'Didier Lukusa', 'Analyste de données junior', 'didier'], ['Lun. 19 oct. · 15 h 20', 'nadia', 'Profil consulté', 'Moussa Diallo', 'Développeur·se mobile Flutter', 'moussa']];
    const journal = JRN.filter((j) => jF === 'tous' || j[1] === jF).map(([d, mk, a, pers2, of, ck]) => ({ d, m: eqDe(mk), a, pers: pers2, of, aC: !!ck, go: ck ? go('candidat', { candK: ck, fT: 'historique' }) : () => flash('Aucune fiche de candidature liée à cette ligne') }));

    // ---------- Réglages du recrutement ----------
    const rgOng = prop('rgOng', 'etapes');
    const etapesP = st.etapesP || ['Nouvelles', 'Présélection', 'Entretien', 'Proposition', 'Décision'];
    const MODS = [['accuse', 'Accuser réception', 'Bonjour {prénom}, merci pour votre candidature au poste {offre}. Nous vous répondons sous 7 jours. {recruteur}, Baobab Fintech'], ['entretien', 'Inviter à un entretien', 'Bonjour {prénom}, nous aimerions vous rencontrer pour le poste {offre}. Choisissez un créneau dans l’invitation jointe. {recruteur}'], ['nonretenu', 'Non retenu, avec conseil', 'Bonjour {prénom}, merci pour votre candidature au poste {offre}. Nous avons retenu des profils plus avancés en {compétence}. Votre profil reste dans notre vivier. {recruteur}'], ['proposition', 'Proposition d’embauche', 'Bonjour {prénom}, nous avons le plaisir de vous proposer le poste {offre}. Les conditions sont jointes. {recruteur}']];
    const modK = st.modK || 'nonretenu';
    const modTx = st.modTx || {};
    const modSel = MODS.find((m) => m[0] === modK) || MODS[0];
    const grille = st.grille || CRITE;
    const grAj = st.grAj ?? '';

    // ---------- Compte : sections ajoutées ----------
    const nPref = st.nPref || { cand: true, msg: true, agenda: true, equipe: true, resume: false };
    const deuxEt = st.deuxEt ?? true;

    // ---------- Accueil ----------
    const evAuj = EV0.concat(evAjout).filter((e) => !evAnn[e[0]] && e[1] === 'jeu').sort((a, b) => a[2] - b[2]).map((e) => ({ t: e[5], s: e[6], h: hF(e[2]), bg: TYPEC[e[4]][0], go: go('agenda', { evK: e[0], agMode: 'jour' }) }));
    const enCours = taches.filter((t) => !t.fait);
    const bienvenue = has('bienv') ? st.bienv : oui(p.bienvenue);

    const W = {
      admin, pasAdmin: !admin, prenom, sieges: String(sieges), siegesT: sieges + ' utilisateurs sur 5',
      // navigation ajoutée
      nb_accueil: navOn('accueil'), nc_accueil: navCol('accueil'), nb_pageEnt: navOn('pageEnt'), nc_pageEnt: navCol('pageEnt'), nb_factu: navOn('factu'), nc_factu: navCol('factu'), nb_journal: navOn('journal'), nc_journal: navCol('journal'), nb_reglages: navOn('reglages'), nc_reglages: navCol('reglages'),
      goAccueil: go('accueil'), goPageEnt: go('pageEnt'), goFactu: go('factu'), goJournal: go('journal'), goReglages: go('reglages', { rgOng: 'etapes' }), goNotifs: go('notifs'), goOrbiPage: go('orbi'), goBaobab: go('baobab'),
      vAccueil: vue === 'accueil', vOffre: vue === 'offre', vNouvelle: vue === 'nouvelle', vEval: vue === 'evaluation', vNotifs: vue === 'notifs', vOrbi: vue === 'orbi', vPageEnt: vue === 'pageEnt', vBaobab: vue === 'baobab', vFactu: vue === 'factu', vJournal: vue === 'journal', vReglages: vue === 'reglages',
      orbiFlot: (tab || pilote) && vue !== 'orbi',
      // bienvenue (premier passage)
      bienvenue, fermerBienv: () => S({ bienv: false }),
      bienvPts: admin ? [['Invitez votre équipe', 'Donnez un rôle à chacun : recruteur, manager ou lecteur.'], ['Attribuez des tâches', 'Suivre un candidat, évaluer un diagnostic, mener un entretien.'], ['Suivez l’évolution', 'Le tableau de bord et le rapport PDF du mois.']].map(([t, s]) => ({ t, s })) : [['Vos candidatures', 'Toutes les étapes de l’ATS, triées par compatibilité. Personne n’est écarté.'], ['Votre agenda', 'Entretiens, appels et réunions, avec des créneaux proposés.'], ['Votre espace', 'Le rôle que Joseph vous a donné, vos tâches et votre rapport PDF.']].map(([t, s]) => ({ t, s })),
      // accueil
      salut: 'Bonjour ' + prenom, dateT: 'Jeudi 22 octobre 2026',
      tuilesA: (admin ? [[sieges + ' sur 5', 'utilisateurs dans l’équipe', go('equipe', { eqOng: 'membres' })], [String(taches.filter(retard).length), 'tâche en retard à relancer', go('equipe', { eqOng: 'taches' })], [String(demandes.length), 'demandes à valider', go('equipe', { eqOng: 'invitations' })], ['14 nov.', 'renouvellement de la formule', go('factu')]]
        : [['13', 'nouvelles candidatures', go('candidatures')], [String(evAuj.length), 'rendez-vous aujourd’hui', go('agenda', { agMode: 'jour' })], [String(mesTaches.filter((t) => !t.fait).length), 'tâches à faire', go('moi')], ['3', 'messages non lus', go('messages')]]).map(([b, t, g]) => ({ b, t, go: g })),
      evAuj, aEvAuj: evAuj.length > 0,
      aTraiter: [['Esther Kabila a candidaté', 'Analyste de données junior · ' + CANDS.find((x) => x.k === 'esther').sT, go('candidat', { candK: 'esther', fT: 'resume' })], ['Benjamin Tshibangu a répondu', 'Il propose de commencer le 9 novembre', go('messages', { convK: 'benjamin' })], ['3 profils à fort potentiel', 'Développeur·se mobile Flutter', go('candidatures', { offre: 'flutter' })], ['Prince Kalonji veut se connecter', 'Étudiant en data · Kinshasa', go('talents', { sousT: 'reseau' })]].map(([t, s, g]) => ({ t, s, go: g })),
      offresA: ofTous.map((o) => ({ t: o.t, s: o.cand + ' candidatures · ' + (o.nouv ? o.nouv + ' nouvelles' : 'aucune nouvelle'), st: ofSt[o.k] || o.statut, stCol: (ofSt[o.k] || o.statut) === 'En ligne' ? '#A6F26B' : '#F4D59A', go: go('offre', { offre: o.k, oTab: 'apercu' }) })),
      tachesA: enCours.slice(0, 5), demandes, aDemandes: demandes.length > 0, sansDemandes: demandes.length === 0,
      kpisA: [['170', 'candidatures en octobre'], ['14', 'entretiens'], ['3', 'embauches'], ['6 j', 'délai de réponse']].map(([b, t]) => ({ b, t })),
      orbiA: admin ? 'Aline a terminé 3 tâches sur 4. La tâche de Patrice sur Nathan Ilunga a dépassé son échéance de mercredi : une relance suffit souvent.' : 'Deux rendez-vous aujourd’hui. Esther Kabila (85 %) mérite une réponse rapide : SQL est déclaré mais pas encore vérifié. Vous décidez.',
      // offre détail
      ofSel: { t: ofSel.t, lieu: ofSel.lieu, cand: String(ofSel.cand), nouv: String(ofSel.nouv), d: ofSel.d }, ofd: { ...ofd, vues: String(ofd.vues) }, ofStatut, ofStCol: ofStatut === 'En ligne' ? '#A6F26B' : ofStatut === 'Clôturée' ? '#8FA39E' : '#F4D59A', ofEnLigne: ofStatut === 'En ligne', ofPause: ofStatut === 'En pause', ofOuverte: ofStatut !== 'Clôturée', ofClose: ofStatut === 'Clôturée',
      oOnglets: onglets([['apercu', 'Aperçu'], ['annonce', 'Annonce'], ['reglages', 'Équipe et réglages']], oTab, 'oTab'), oApercu: oTab === 'apercu', oAnnonce: oTab === 'annonce', oReglages: oTab === 'reglages',
      ofEt: ETAPES.map(([k, t], i) => ({ t, n: String(ofd.et[i]), w: Math.max(4, Math.round((ofd.et[i] / Math.max(1, Math.max(...ofd.et))) * 100)) + '%' })), ofSrc: ofd.src.map(([t, n]) => ({ t, n: String(n) })),
      ofReq: ofd.req.map((t) => ({ t })), ofSouh: ofd.souh.map((t) => ({ t })), ofMiss: ofd.missions.map((t) => ({ t })), ofQs: ofd.qs.map((t) => ({ t })),
      ofTuiles: [[String(ofd.vues), 'vues de l’annonce'], [String(ofSel.cand), 'candidatures'], [ofSel.nouv ? '+' + ofSel.nouv : '0', 'nouvelles cette semaine'], ['100 %', 'ont reçu une réponse']].map(([b, t]) => ({ b, t })),
      voirCandOf: go('candidatures', { offre: OFFRES.find((o) => o.k === ofSel.k) ? ofSel.k : 'analyste', cMode: 'colonnes' }), retourOffres: go('offres'),
      partagerOf: () => S({ modal: 'partage' }), mPartage: modal === 'partage', lienOf: 'jumanly.io/offres/' + ofSel.k + '-baobab-fintech', copierLien: () => { S({ modal: '' }); flash('Lien copié : collez-le où vous voulez'); },
      pauseOf: () => { S({ ofSt: { ...ofSt, [ofSel.k]: ofStatut === 'En pause' ? 'En ligne' : 'En pause' } }); flash(ofStatut === 'En pause' ? 'Offre remise en ligne' : 'Offre en pause : elle ne compte plus dans vos 20 offres'); },
      pauseT: ofStatut === 'En pause' ? 'Remettre en ligne' : 'Mettre en pause',
      cloturerOf: () => S({ modal: 'cloture' }), mCloture: modal === 'cloture', nEnCours: String(ofd.et[0] + ofd.et[1]),
      confirmerCloture: () => { S({ modal: '', ofSt: { ...ofSt, [ofSel.k]: 'Clôturée' } }); flash('Offre clôturée : chaque personne en cours reçoit un message'); },
      modifierOf: go('nouvelle', { nStep: 1 }),
      // nouvelle offre
      nStep: String(nStep), nf, nEtapes: NETAPES.map((t, i) => ({ t, n: String(i + 1), on: i + 1 === nStep, fait: i + 1 < nStep, bg: i + 1 === nStep ? '#13282C' : 'transparent', pcol: i + 1 < nStep ? '#A6F26B' : i + 1 === nStep ? '#F2EDE5' : '#2A3B3E', pfg: i + 1 <= nStep ? '#0B1A1F' : '#8FA39E', sym: i + 1 < nStep ? '✓' : String(i + 1), go: () => S({ nStep: i + 1 }) })),
      nE1: nStep === 1, nE2: nStep === 2, nE3: nStep === 3, nE4: nStep === 4, nE5: nStep === 5, nEtapeT: 'Étape ' + nStep + ' sur 5 · ' + NETAPES[nStep - 1], nSuivT: nStep === 5 ? 'Publier l’offre' : 'Continuer',
      nSuivant: () => { if (nStep < 5) return S({ nStep: nStep + 1 }); S({ ofNew: [...ofNew, { k: 'nouv' + ofNew.length, t: nf.t || 'Nouvelle offre', lieu: 'Kinshasa · ' + (CONTRATS.find((x) => x[0] === nf.contrat) || CONTRATS[0])[1], cand: 0, nouv: 0, statut: 'En ligne', d: 'aujourd’hui', vues: 0 }], vue: 'offres', nStep: 1 }); flash('Offre publiée : ' + (5 + ofNew.length) + ' offres sur 20. Les talents compatibles sont prévenus'); },
      nPrec: () => { if (nStep > 1) return S({ nStep: nStep - 1 }); S({ vue: 'offres' }); }, nPrecT: nStep > 1 ? 'Retour' : 'Annuler',
      ecrireNt: (e) => setNf({ t: val(e) }), ecrireNdesc: (e) => setNf({ desc: val(e) }), ecrireNpostes: (e) => setNf({ postes: val(e) }), ecrireNsal: (e) => setNf({ sal: val(e) }),
      nServices: pk2([['risques', 'Risques'], ['data', 'Data'], ['client', 'Service client'], ['tech', 'Technique'], ['marketing', 'Marketing']], nf.service, (k) => setNf({ service: k })),
      orbiDesc: () => { setNf({ desc: 'Vous analysez le portefeuille de crédits de Baobab Fintech, préparez les indicateurs de risque et proposez des améliorations aux équipes. Vous travaillez avec l’équipe data et rendez compte au responsable des risques.' }); flash('Orbi propose une description : modifiez-la librement'); },
      nReq: nf.req.map((t) => ({ t, retirer: () => setNf({ req: nf.req.filter((x) => x !== t) }) })), nSouh: nf.souh.map((t) => ({ t, retirer: () => setNf({ souh: nf.souh.filter((x) => x !== t) }) })),
      nComp, ecrireNcomp: (e) => S({ nComp: val(e) }), ajouterReq: () => { if (!nComp.trim()) return flash('Écrivez une compétence'); setNf({ req: [...nf.req, nComp.trim()] }); S({ nComp: '' }); }, ajouterSouh: () => { if (!nComp.trim()) return flash('Écrivez une compétence'); setNf({ souh: [...nf.souh, nComp.trim()] }); S({ nComp: '' }); },
      nSuggComp: ['Power BI', 'Statistiques', 'Anglais B2'].filter((t) => !nf.req.includes(t) && !nf.souh.includes(t)).map((t) => ({ t, go: () => setNf({ souh: [...nf.souh, t] }) })),
      nContrats: pk2(CONTRATS, nf.contrat, (k) => setNf({ contrat: k })), nModes: pk2(MODES, nf.mode, (k) => setNf({ mode: k })), nLimites: pk2([['20 nov. 2026', '20 nov. 2026'], ['30 nov. 2026', '30 nov. 2026'], ['15 déc. 2026', '15 déc. 2026']], nf.limite, (k) => setNf({ limite: k })),
      nSalSw: sw(nf.salOn), basculerSal: () => setNf({ salOn: !nf.salOn }), nSalOn: nf.salOn,
      nQs: nf.qs.map((t) => ({ t, retirer: () => setNf({ qs: nf.qs.filter((x) => x !== t) }) })), nQ, ecrireNq: (e) => S({ nQ: val(e) }), ajouterQ: () => { if (!nQ.trim()) return flash('Écrivez une question'); setNf({ qs: [...nf.qs, nQ.trim()] }); S({ nQ: '' }); },
      nDocs: [['cv', 'CV'], ['lettre', 'Lettre de motivation'], ['diplome', 'Diplôme']].map(([k, t]) => ({ t, ...sw(!!nf.docs[k]), basculer: () => setNf({ docs: { ...nf.docs, [k]: !nf.docs[k] } }) })),
      nResps: pk2([['nadia', 'Nadia Kalala'], ['joseph', 'Joseph Ilunga']], nf.resp, (k) => setNf({ resp: k })),
      nEvals: [['aline', 'Aline Mukeba · Manager'], ['patrice', 'Patrice Nzuzi · Manager']].map(([k, t]) => ({ t, ...sw(!!nf.evals[k]), basculer: () => setNf({ evals: { ...nf.evals, [k]: !nf.evals[k] } }) })),
      nContratT: (CONTRATS.find((x) => x[0] === nf.contrat) || CONTRATS[0])[1], nModeT: (MODES.find((x) => x[0] === nf.mode) || MODES[0])[1], nDescA: nf.desc || 'La description apparaîtra ici.', nQuotaT: 'Après publication : ' + (5 + ofNew.length) + ' offres sur 20',
      // candidatures liste
      cModes: pk2([['colonnes', 'Colonnes'], ['liste', 'Liste']], cMode, (k) => S({ cMode: k })), cCol: cMode === 'colonnes', cListe: cMode === 'liste',
      cFiltres: pk2([['toutes', 'Toutes'], ['fort', 'Fort potentiel'], ['nouv', 'Nouvelles']], cF, (k) => S({ cF: k })), listeC, aListeC: listeC.length > 0, sansListeC: listeC.length === 0,
      // fiche onglets
      fTabs: onglets([['resume', 'Résumé'], ['profil', 'Profil et CV'], ['reponses', 'Réponses'], ['diagnostic', 'Diagnostic'], ['evaluations', 'Évaluations', String((EVALS0[c.k] || []).length + (evals[c.k] ? 1 : 0)) === '0' ? '' : String((EVALS0[c.k] || []).length + (evals[c.k] ? 1 : 0))], ['notes', 'Notes'], ['historique', 'Historique']], fT, 'fT'),
      fResume: fT === 'resume', fProfil: fT === 'profil', fReponses: fT === 'reponses', fDiag: fT === 'diagnostic', fEvals: fT === 'evaluations', fNotes: fT === 'notes', fHisto: fT === 'historique',
      cExps: (EXPS[c.k] || [['Expérience déclarée', 'Voir le CV joint']]).map(([t, s]) => ({ t, s })), cForm: FORMS[c.k] || 'Formation déclarée dans le CV', cLang: c.k === 'nathan' ? 'Français C2 · Swahili C2 · Anglais B1' : 'Français C2 · Anglais B2 · Lingala',
      cComps: (COMPS[c.k] || c.forts.map((f) => [f.t, false])).map(([t, ok]) => ({ t, vT: ok ? 'Vérifiée' : 'Déclarée', vCol: ok ? '#A6F26B' : '#8FA39E' })),
      ouvrirCv: () => S({ modal: 'cv' }), mCv: cvOuvert, cTitre: c.k === 'moussa' || c.k === 'kevin' ? 'Développeur·se mobile' : c.of === 'clientele' ? 'Conseiller·ère clientèle' : 'Analyste de données',
      cReps: (OFD[c.of] || OFD.analyste).qs.map((q, i) => ({ q, r: (REPS[c.k] || [])[i] || 'Réponse écrite dans le formulaire de candidature.' })),
      dCap: diag[0], dForts: diag[1], dDev: diag[2], aTDiag: !!tDiag, tDiagT: tDiag ? 'Tâche « Évaluer le diagnostic » attribuée à ' + tDiag.m.nom + ' · ' + tDiag.etat : '',
      dgEtoiles: [1, 2, 3, 4, 5].map((n) => ({ t: '★', col: n <= (dg[c.k] || 0) ? '#A6F26B' : '#2A3B3E', pick: () => S({ dg: { ...dg, [c.k]: n } }) })), dgT: dg[c.k] ? dg[c.k] + ' sur 5' : 'Pas encore évalué',
      enregistrerDg: () => { if (!dg[c.k]) return flash('Choisissez une note de 1 à 5'); if (tDiag && !tDiag.fait) S({ tEtat: { ...tEtat, [tDiag.k]: 3 } }); flash('Évaluation du diagnostic enregistrée' + (tDiag ? ' : la tâche passe à « Terminée »' : '')); },
      cEvals: (EVALS0[c.k] || []).concat(evals[c.k] ? [[evals[c.k].par, 'aujourd’hui', evals[c.k].moy, evals[c.k].rec]] : []).map(([par, d, n, r]) => ({ par, d, n, r })), aCEvals: (EVALS0[c.k] || []).length + (evals[c.k] ? 1 : 0) > 0, sansCEvals: (EVALS0[c.k] || []).length + (evals[c.k] ? 1 : 0) === 0,
      evaluer: go('evaluation', { evN: {}, evRec: 'poursuivre', evCom: '' }),
      cNotes: (NOTES0[c.k] || []).concat(notesAj[c.k] || []).map(([par, d, t]) => ({ par, d, t })), aCNotes: (NOTES0[c.k] || []).concat(notesAj[c.k] || []).length > 0, sansCNotes: (NOTES0[c.k] || []).concat(notesAj[c.k] || []).length === 0,
      noteBr, ecrireNote: (e) => S({ noteBr: val(e) }), ajouterNote: () => { if (!noteBr.trim()) return flash('Écrivez votre note'); S({ notesAj: { ...notesAj, [c.k]: [...(notesAj[c.k] || []), [moiN, 'à l’instant', noteBr.trim()]] }, noteBr: '' }); flash('Note ajoutée : seule l’équipe la voit'); },
      cHisto: histo.map(([t, s]) => ({ t, s })),
      // évaluation
      evCrit: CRITE.map((t, i) => ({ t, et: [1, 2, 3, 4, 5].map((n) => ({ t: '★', col: n <= (evN[i] || 0) ? '#A6F26B' : '#2A3B3E', pick: () => S({ evN: { ...evN, [i]: n } }) })), nT: evN[i] ? evN[i] + ' / 5' : '—' })),
      moyT, evRecs: pk2([['poursuivre', 'Poursuivre'], ['revoir', 'À revoir avec l’équipe'], ['stop', 'Ne pas poursuivre']], evRec, (k) => S({ evRec: k })), evCom, ecrireEvCom: (e) => S({ evCom: val(e) }),
      evCtx: evCand ? 'Entretien du ' + JOURS.find((j) => j[0] === evCand[1])[1] + ' octobre à ' + hF(evCand[2]) : 'Entretien de ' + c.nom, evOffre: cOffre.t,
      enregistrerEv: () => { if (nNotes < CRITE.length) return flash('Notez les 5 critères avant d’enregistrer'); S({ evals: { ...evals, [c.k]: { par: moiN, moy: moy.toFixed(1).replace('.', ','), rec: { poursuivre: 'Poursuivre', revoir: 'À revoir', stop: 'Ne pas poursuivre' }[evRec] } }, vue: 'candidat', fT: 'evaluations' }); flash('Évaluation enregistrée : la décision reste à l’équipe'); },
      pdfEval: () => S({ modal: 'pdf', rapK: 'entretien' }), retourFiche: go('candidat', { fT: 'resume' }),
      // agenda
      agModes: pk2([['jour', 'Jour'], ['semaine', 'Semaine'], ['mois', 'Mois']], agMode, (k) => S({ agMode: k })), agSem: agMode === 'semaine', agJ: agMode === 'jour', agM: agMode === 'mois',
      agTitre: agMode === 'jour' ? jourNom[agJour] + ' ' + JN[agJour] + ' octobre' + (agJour === 'jeu' ? ' · aujourd’hui' : '') : agMode === 'mois' ? 'Octobre 2026' : 'Semaine du 19 au 23 octobre',
      jourPills: pk2(Object.keys(JN).map((k) => [k, jourNom[k].slice(0, 3) + '. ' + JN[k]]), agJour, (k) => S({ agJour: k })),
      evsJour, aEvsJour: evsJour.length > 0, sansEvsJour: evsJour.length === 0, MOISG,
      MOIS: MOIS.map((d) => ({ ...d, go: () => { const n = Number(d.t); const jk = jourDeN(n); if (jk) S({ agMode: 'jour', agJour: jk }); else if (n) flash('Aucun rendez-vous le ' + n + ' octobre'); } })),
      dispoT: Object.keys(JN).filter((k) => dispo[k]).map((k) => jourNom[k].slice(0, 3) + '.').join(' ') + ' · 9 h à 17 h', ouvrirDispo: () => S({ modal: 'dispo' }), mDispo: modal === 'dispo',
      dispoL: Object.keys(JN).map((k) => ({ t: jourNom[k], ...sw(!!dispo[k]), basculer: () => S({ dispo: { ...dispo, [k]: !dispo[k] } }) })), enregistrerDispo: () => { S({ modal: '' }); flash('Disponibilités enregistrées : Orbi propose les créneaux en fonction'); },
      // notifications
      notifsL, nPills: pk2([['tout', 'Tout'], ['cand', 'Candidatures'], ['equipe', 'Équipe'], ['agenda', 'Agenda'], ['reseau', 'Réseau']], nF, (k) => S({ nF: k })), toutLu: () => { S({ lu: true }); flash('Tout est marqué comme lu'); },
      voirToutNotifs: go('notifs'),
      // Orbi (page)
      oConvs: OCONV.map(([k, t]) => ({ t, go: () => S({ oK: k }), bg: k === oK ? '#13282C' : 'transparent', fw: k === oK ? '700' : '500' })), oMsgs, oBr, ecrireOb: (e) => S({ oBr: val(e) }),
      envoyerOb: () => { if (!oBr.trim()) return flash('Écrivez votre question à Orbi'); S({ oAj: { ...oAj, [oK]: [...(oAj[oK] || []), ['moi', oBr.trim()], ['orbi', 'Voici ma proposition, à partir de vos offres et des profils qui ont candidaté. Je recommande ; c’est vous qui décidez.']] }, oBr: '' }); },
      oSugg: ['Qui recevoir en premier ?', 'Prépare un message de refus bienveillant', 'Résume l’activité de l’équipe'].map((t) => ({ t, go: () => S({ oBr: t }) })),
      nouvelleConv: () => { S({ oK: 'semaine' }); flash('Nouvelle conversation : posez votre question'); }, creditsT: '110 crédits restants sur 300 ce mois · formule Company',
      // page entreprise
      pe, ecrirePe: (champ) => (e) => S({ pe: { ...pe, [champ]: val(e) } }), ecrirePeNom: (e) => S({ pe: { ...pe, nom: val(e) } }), ecrirePeSect: (e) => S({ pe: { ...pe, secteur: val(e) } }), ecrirePeTaille: (e) => S({ pe: { ...pe, taille: val(e) } }), ecrirePeVille: (e) => S({ pe: { ...pe, ville: val(e) } }), ecrirePeSite: (e) => S({ pe: { ...pe, site: val(e) } }), ecrirePeApropos: (e) => S({ pe: { ...pe, apropos: val(e) } }),
      peRec, peRecSw: sw(peRec), basculerPeRec: () => S({ peRec: !peRec }), publierPe: () => flash('Page mise à jour : les visiteurs voient les changements'),
      changerLogo: () => flash('Logo importé : carré, 400 × 400 px conseillé'), changerBann: () => flash('Bannière importée : 1 600 × 400 px conseillé'),
      membresDecl: demandes.filter((d) => d.mem), aMembresDecl: demandes.filter((d) => d.mem).length > 0, sansMembresDecl: demandes.filter((d) => d.mem).length === 0,
      bOnglets: onglets([['apropos', 'À propos'], ['membres', 'Membres', String(membresB.length)], ['offres', 'Offres', String(ofTous.filter((o) => (ofSt[o.k] || o.statut) === 'En ligne').length)]], bOng, 'bOng'), bApropos: bOng === 'apropos', bMembres: bOng === 'membres', bOffres: bOng === 'offres', membresB,
      offresB: ofTous.filter((o) => (ofSt[o.k] || o.statut) === 'En ligne').map((o) => ({ t: o.t, s: o.lieu, go: go('offre', { offre: o.k, oTab: 'annonce' }) })), peRecT: peRec ? 'Recrute en ce moment' : '',
      // facturation
      plansL: PLANS.map(([k, t, prix, s, bt]) => ({ t, prix, s, bt, actuel: k === 'company', autre: k !== 'company', bord: k === 'company' ? '#A6F26B' : 'rgba(255,255,255,.1)', go: () => (k === 'premium' ? flash('Demande de devis envoyée : réponse par e-mail depuis assistant@jumanly.io') : k === 'plus' ? S({ modal: 'payer', payPlan: 'plus', payE: '' }) : flash('C’est votre formule actuelle')) })),
      usageF: [['Utilisateurs', sieges + ' sur 5', Math.round(sieges / 5 * 100) + '%'], ['Offres en ligne', '4 sur 20', '20%'], ['Recherches de talents ce mois', '112 sur 300', '37%'], ['Demandes de mise en relation', '23 sur 100', '23%'], ['Crédits Orbi ce mois', '190 sur 300', '63%']].map(([t, v, pct]) => ({ t, v, pct })),
      factL: FACT.map(([n, d, m, s]) => ({ n, d, m, s, go: () => S({ modal: 'facture', factK: n }) })), mFacture: modal === 'facture', fact: { n: factSel[0], d: factSel[1], m: factSel[2], s: factSel[3] },
      renouveler: () => S({ modal: 'payer', payPlan: 'company', payE: '' }), mPayer: modal === 'payer', payOps: pk2([['mpesa', 'M-Pesa'], ['orange', 'Orange Money'], ['airtel', 'Airtel Money'], ['carte', 'Carte bancaire']], payOp, (k) => S({ payOp: k })),
      payCarte: payOp === 'carte', payMm: payOp !== 'carte', payMontant: payPlan === 'plus' ? '179,90 USD' : '79,90 USD', payPlanT: payPlan === 'plus' ? 'Company Plus · 1 mois' : 'Company · 1 mois, du 14 novembre au 14 décembre', payProrata: payPlan === 'plus',
      payForm: payE === '', payAttente: payE === 'attente', payOk: payE === 'ok', payer: () => S({ payE: 'attente' }), payConfirme: () => { S({ payE: 'ok' }); flash('Paiement reçu : la facture arrive par e-mail'); }, payRetry: () => S({ payE: '' }),
      payFin: () => S({ modal: '', payE: '' }), payOpT: { mpesa: 'M-Pesa', orange: 'Orange Money', airtel: 'Airtel Money', carte: 'carte' }[payOp],
      // journal
      journal, jPills: pk2([['tous', 'Toute l’équipe'], ['nadia', 'Nadia'], ['aline', 'Aline'], ['patrice', 'Patrice'], ['joseph', 'Joseph']], jF, (k) => S({ jF: k })),
      // réglages
      rgOnglets: onglets([['etapes', 'Étapes de l’ATS'], ['modeles', 'Modèles de messages'], ['grille', 'Grille d’entretien']], rgOng, 'rgOng'), rgEtapes: rgOng === 'etapes', rgModeles: rgOng === 'modeles', rgGrille: rgOng === 'grille',
      etapesL: etapesP.map((t, i) => ({ t, n: String(i + 1), fixe: i === 0 || i === etapesP.length - 1, modif: i > 0 && i < etapesP.length - 1, retirer: () => { S({ etapesP: etapesP.filter((x, j) => j !== i) }); flash('Étape « ' + t + ' » retirée'); } })),
      aTest: etapesP.includes('Test pratique'), pasTest: !etapesP.includes('Test pratique'), ajouterEtape: () => { S({ etapesP: [...etapesP.slice(0, 2), 'Test pratique', ...etapesP.slice(2)] }); flash('Étape « Test pratique » ajoutée après la présélection'); },
      modsL: MODS.map(([k, t]) => ({ t, go: () => S({ modK: k }), bg: k === modK ? '#13282C' : 'transparent', fw: k === modK ? '700' : '500' })), modT: modSel[1], modTexte: modTx[modK] ?? modSel[2], ecrireMod: (e) => S({ modTx: { ...modTx, [modK]: val(e) } }), enregistrerMod: () => flash('Modèle enregistré pour toute l’équipe'),
      grilleL: grille.map((t, i) => ({ t, n: String(i + 1), retirer: () => S({ grille: grille.filter((x, j) => j !== i) }) })), grAj, ecrireGr: (e) => S({ grAj: val(e) }), ajouterGr: () => { if (!grAj.trim()) return flash('Écrivez un critère'); S({ grille: [...grille, grAj.trim()], grAj: '' }); flash('Critère ajouté à la grille'); },
      // équipe : onglets, rôles, invitations
      eqOnglets: onglets([['membres', 'Membres et rôles'], ['taches', 'Tâches', String(taches.filter((t) => !t.fait).length)], ['invitations', 'Invitations et demandes', String(demandes.length + invs.length)]], eqOng, 'eqOng'), eqMembres: eqOng === 'membres', eqTaches: eqOng === 'taches', eqInvit: eqOng === 'invitations',
      rolesL: ROLES.filter((r) => r[0] !== 'admin').map(([k, t, s]) => ({ t, s, bord: k === roleSel ? '#A6F26B' : 'rgba(255,255,255,.1)', bg: k === roleSel ? 'rgba(166,242,107,.08)' : 'transparent', pick: () => { S({ roles: { ...roles, [membreK]: k }, droits: { ...droits, [membreK]: { ...PRESET[k] } } }); flash(mSel.prenom + ' devient ' + t.toLowerCase() + ' : ses droits sont mis à jour'); } })),
      roleT: (ROLES.find((r) => r[0] === roleSel) || ROLES[2])[1],
      tPills: pk2([['toutes', 'Toutes'], ['cours', 'En cours'], ['retard', 'En retard'], ['fait', 'Terminées']], tF, (k) => S({ tF: k })), tachesF, aTachesF: tachesF.length > 0, sansTachesF: tachesF.length === 0,
      invsL: invs.map(([k, nom, r, d]) => ({ nom, r, d, relancer: () => flash('Invitation renvoyée à ' + nom.split(' ')[0]), annuler: () => { S({ invs: invs.filter((x) => x[0] !== k) }); flash('Invitation annulée'); } })), aInvs: invs.length > 0,
      inviterMembre: () => S({ modal: 'inviter', invMail: '', invRole: 'recruteur' }), mInviter: modal === 'inviter', invMail, ecrireInv: (e) => S({ invMail: val(e) }), invRoles: pk2(ROLES.filter((r) => r[0] !== 'admin').map(([k, t]) => [k, t]), invRole, (k) => S({ invRole: k })),
      invPlein: sieges + invs.length >= 6, invPlace: sieges + invs.length < 6, invPlacesT: (5 - sieges) > 0 ? 'Il reste ' + (5 - sieges) + ' place dans la formule Company (5 utilisateurs)' : 'Les 5 places de la formule Company sont prises',
      envoyerInv: () => { if (!invMail.includes('@')) return flash('Écrivez une adresse e-mail valide'); if (sieges >= 5) return flash('Plus de place : passez à Company Plus pour 15 utilisateurs'); S({ invs: [...invs, ['i' + invs.length, invMail.trim(), (ROLES.find((r) => r[0] === invRole) || ROLES[1])[1], 'envoyée à l’instant']], modal: '', eqOng: 'invitations' }); flash('Invitation envoyée par e-mail'); },
      droitsSrc: admin ? 'Administrateur : tous les droits' : 'Droits accordés par Joseph Ilunga', moiBio: admin ? 'Je dirige les ressources humaines de Baobab Fintech et j’anime une équipe de quatre recruteurs et managers.' : 'Je cherche des talents data et service client qui veulent rendre le paiement mobile plus simple. Réponse à chaque candidature.',
      // compte : sections ajoutées
      cSecurite: cV === 'securite', cNotifsP: cV === 'notifs', cAide: cV === 'aide', cSortie: cV === 'sortie',
      deuxEtSw: sw(deuxEt), basculerDeuxEt: () => S({ deuxEt: !deuxEt }), changerMdp: () => flash('Lien pour changer le mot de passe envoyé par e-mail'),
      sessions: [['Chrome · Windows', 'Kinshasa · maintenant', true], ['Appli Jumanly · Android', 'Kinshasa · hier', false]].map(([t, s, ici]) => ({ t, s, ici, pasIci: !ici, fermer: () => flash('Session fermée sur cet appareil') })),
      nPrefL: [['cand', 'Nouvelles candidatures'], ['msg', 'Messages'], ['agenda', 'Rappels d’entretien'], ['equipe', 'Tâches et équipe'], ['resume', 'Résumé chaque lundi par e-mail']].map(([k, t]) => ({ t, ...sw(!!nPref[k]), basculer: () => S({ nPref: { ...nPref, [k]: !nPref[k] } }) })),
      faq: [['Comment le score est-il calculé ?', '8 critères fixes et les mêmes pour tous. Le nom, l’âge, le genre, la photo ou la nationalité ne comptent jamais.'], ['Puis-je refuser automatiquement ?', 'Non. Orbi classe et explique ; chaque décision est prise par une personne de votre équipe.'], ['Qui voit les profils ?', 'Vous voyez un profil seulement si la personne a candidaté ou l’a rendu visible. Chaque consultation est enregistrée.']].map(([q, r]) => ({ q, r }))
    };
