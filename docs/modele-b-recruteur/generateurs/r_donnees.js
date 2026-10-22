    // ===== Données communes de la maquette recruteur (fictives) · aujourd’hui : jeudi 22 octobre 2026 =====
    const OFFRES = {
      analyste: { t: 'Analyste de données junior', court: 'Analyste de données', ville: 'Kinshasa', statut: 'encours', cand: 38, nouv: 3 },
      clientele: { t: 'Chargé·e de clientèle Mobile Money', court: 'Chargé·e de clientèle', ville: 'Lubumbashi', statut: 'encours', cand: 52, nouv: 5 },
      flutter: { t: 'Développeur·se mobile Flutter', court: 'Développeur·se Flutter', ville: 'Kinshasa', statut: 'encours', cand: 9, nouv: 9 },
      marketing: { t: 'Stagiaire marketing digital', court: 'Stagiaire marketing', ville: 'Kinshasa', statut: 'pause', cand: 71, nouv: 0 }
    };
    const ETAPES = [['recue', 'Reçue'], ['presel', 'Présélection'], ['entretien', 'Entretien'], ['proposition', 'Proposition'], ['recrute', 'Recruté·e']];
    const ETAPE_T = { recue: 'Reçue', presel: 'Présélection', entretien: 'Entretien', proposition: 'Proposition', recrute: 'Recruté·e', nonretenu: 'Non retenu·e', retire: 'Retirée' };
    // 8 critères du calcul (doc 08) : poids fixes, valeur de 0 à 1
    const CRITERES = [['skills_required', 'Compétences requises', 35], ['skills_preferred', 'Compétences souhaitées', 10], ['experience', 'Expérience', 15], ['education', 'Formation', 10],
      ['languages', 'Langues', 10], ['location', 'Lieu et mode de travail', 10], ['contract', 'Contrat et disponibilité', 5], ['semantic', 'Proximité du profil', 5]];
    const scoreDe = (v) => Math.round(CRITERES.reduce((a, c, i) => a + c[2] * v[i], 0) / CRITERES.reduce((a, c) => a + c[2], 0) * 100);
    const EQUIPE = {
      nadia: { nom: 'Nadia Kalala', ini: 'NK', role: 'Chargée de recrutement', droit: 'Recruteuse', moi: true },
      joseph: { nom: 'Joseph Ilunga', ini: 'JI', role: 'Responsable RH', droit: 'Administrateur' },
      aline: { nom: 'Aline Mukeba', ini: 'AM', role: 'Responsable data', droit: 'Manager' },
      patrice: { nom: 'Patrice Nzuzi', ini: 'PN', role: 'Responsable service client', droit: 'Manager' }
    };
    const C = (o) => ({ ...o, score: scoreDe(o.v) });
    const CANDS = [
      C({ k: 'grace', nom: 'Grâce Mbuyi', ini: 'GM', bg: '#DDF6EE', fg: '#14745F', offre: 'analyste', etape: 'entretien', ville: 'Kinshasa', recu: 'il y a 5 jours', nouv: false, src: 'Explorer', dispo: 'Dans 2 semaines', assigne: 'aline',
        v: [0.92, 0.7, 0.8, 1, 0.9, 1, 1, 0.8], titre: 'Jeune diplômée · Cap : Analyste de données',
        comp: [['SQL', true], ['Excel', true], ['Power BI', false], ['Python', false]], exp: [['Stagiaire data', 'Rawbank · 6 mois · 2025'], ['Assistante de recherche', 'UNIKIN · 1 an']],
        form: 'Licence en économie, Université de Kinshasa (2025)', langues: 'Français C2 · Anglais B2 · Lingala', interets: ['Data', 'Fintech', 'Évoluer vers analyste confirmée'],
        reponses: [['Avez-vous déjà utilisé SQL ou Power BI ?', 'Oui, SQL tous les jours en stage chez Rawbank, et Power BI pour deux tableaux de bord.'], ['Quand pouvez-vous commencer ?', 'Dans deux semaines, le 5 novembre.']],
        notes: [['Aline Mukeba', 'Très bon cas pratique SQL. À voir : Power BI avancé.', 'hier'], ['Nadia Kalala', 'Disponible le 5 novembre, prétentions dans la fourchette.', 'il y a 3 jours']],
        entretien: { j: 'Jeudi 22 oct.', h: '10 h 00', mode: 'Visio', avec: 'Aline Mukeba', lien: 'meet.jumanly.io/bf-grace' },
        verifier: ['Niveau réel sur Power BI (déclaré, non vérifié)', 'Expérience en équipe produit'], attest: 'SQL pour l’analyse · attestation Jumanly' }),
      C({ k: 'benjamin', nom: 'Benjamin Tshibangu', ini: 'BT', bg: '#E3E8FB', fg: '#2D3F8A', offre: 'analyste', etape: 'proposition', ville: 'Kinshasa', recu: 'il y a 6 jours', nouv: false, src: 'Orbi', dispo: 'Immédiate', assigne: 'nadia',
        v: [0.95, 0.9, 1, 1, 0.8, 1, 1, 0.9], titre: 'Analyste junior · 2 ans d’expérience',
        comp: [['SQL', true], ['Power BI', true], ['Python', false], ['Excel', false]], exp: [['Analyste junior', 'Vodacash · 2 ans'], ['Stage BI', 'Equity BCDC · 6 mois']],
        form: 'Master en statistique, ISTA (2023)', langues: 'Français C2 · Anglais B1', interets: ['Data', 'Tableaux de bord', 'Encadrer des juniors'],
        reponses: [['Avez-vous déjà utilisé SQL ou Power BI ?', 'Oui, les deux depuis deux ans.'], ['Quand pouvez-vous commencer ?', 'Tout de suite.']],
        notes: [['Aline Mukeba', 'Excellent entretien. Proposition validée avec Joseph.', 'mardi']], entretien: null,
        verifier: ['Anglais écrit pour les rapports au siège'], attest: 'Power BI · les bases · attestation Jumanly', proposition: { salaire: '850 USD par mois', debut: '1er novembre', etat: 'Envoyée mardi, en attente de réponse' } }),
      C({ k: 'esther', nom: 'Esther Kabila', ini: 'EK', bg: '#F9E3C8', fg: '#8A4B12', offre: 'analyste', etape: 'recue', ville: 'Kinshasa', recu: 'il y a 2 h', nouv: true, src: 'Explorer', dispo: 'Dans 1 mois', assigne: '',
        v: [0.88, 0.8, 0.7, 1, 0.9, 1, 0.5, 0.8], titre: 'Data analyst · 1 an d’expérience',
        comp: [['Power BI', true], ['SQL', false], ['Excel', false]], exp: [['Data analyst', 'Kin Marché · 1 an']], form: 'Licence en informatique de gestion, UPC (2024)', langues: 'Français C2 · Anglais B2',
        interets: ['Data', 'Visualisation', 'Commerce'], reponses: [['Avez-vous déjà utilisé SQL ou Power BI ?', 'Power BI tous les jours, SQL pour les extractions.'], ['Quand pouvez-vous commencer ?', 'Après un mois de préavis.']],
        notes: [], entretien: null, verifier: ['Préavis d’un mois : compatible avec la date ?'], attest: '' }),
      C({ k: 'patrick', nom: 'Patrick Ilunga', ini: 'PI', bg: '#E8F0D8', fg: '#4F6B12', offre: 'analyste', etape: 'presel', ville: 'Kinshasa', recu: 'il y a 4 jours', nouv: false, src: 'Fil', dispo: 'Immédiate', assigne: 'nadia',
        v: [0.8, 0.6, 0.7, 1, 0.8, 1, 1, 0.7], titre: 'Analyste crédit · reconversion vers la data',
        comp: [['Excel', true], ['SQL', false], ['Power BI', false]], exp: [['Analyste crédit', 'Advans · 3 ans']], form: 'Licence en finance, ISC (2022)', langues: 'Français C2 · Anglais B1', interets: ['Data', 'Risques', 'Fintech'],
        reponses: [['Avez-vous déjà utilisé SQL ou Power BI ?', 'SQL en formation, Excel avancé au quotidien.'], ['Quand pouvez-vous commencer ?', 'Immédiatement.']], notes: [['Nadia Kalala', 'Profil finance solide, SQL à confirmer.', 'lundi']], entretien: null,
        verifier: ['Pratique réelle de SQL'], attest: '' }),
      C({ k: 'didier', nom: 'Didier Lukusa', ini: 'DL', bg: '#EDE3FB', fg: '#5A2D8A', offre: 'analyste', etape: 'entretien', ville: 'Kinshasa', recu: 'il y a 6 jours', nouv: false, src: 'Explorer', dispo: 'Dans 2 semaines', assigne: 'aline',
        v: [0.7, 0.8, 0.6, 1, 0.8, 1, 1, 0.7], titre: 'Développeur Python · intérêt pour la data',
        comp: [['Python', true], ['SQL', false], ['Excel', false]], exp: [['Développeur', 'Freelance · 2 ans']], form: 'Licence en informatique, UNIKIN (2024)', langues: 'Français C2 · Anglais B2', interets: ['Data', 'Automatisation'],
        reponses: [['Avez-vous déjà utilisé SQL ou Power BI ?', 'SQL oui, Power BI pas encore.'], ['Quand pouvez-vous commencer ?', 'Dans deux semaines.']], notes: [],
        entretien: { j: 'Mardi 20 oct.', h: '14 h 00', mode: 'Sur place', avec: 'Aline Mukeba', lien: 'Baobab Fintech, Gombe', fait: true }, verifier: ['Visualisation de données'], attest: '' }),
      C({ k: 'sarah', nom: 'Sarah Mbala', ini: 'SM', bg: '#FBE3EF', fg: '#8A2D5C', offre: 'analyste', etape: 'recue', ville: 'Matadi', recu: 'il y a 3 h', nouv: true, src: 'Partage du lien', dispo: 'Immédiate', assigne: '',
        v: [0.7, 0.5, 0.5, 0.6, 0.9, 0.7, 1, 0.6], titre: 'Assistante comptable · Excel avancé',
        comp: [['Excel', true], ['SQL', false]], exp: [['Assistante comptable', 'Port de Matadi · 2 ans']], form: 'Graduat en comptabilité, ISP Matadi (2023)', langues: 'Français C2 · Kikongo', interets: ['Finance', 'Data', 'Déménager à Kinshasa'],
        reponses: [['Avez-vous déjà utilisé SQL ou Power BI ?', 'Pas encore, je suis la formation SQL sur Jumanly.'], ['Quand pouvez-vous commencer ?', 'Tout de suite, je peux venir à Kinshasa.']], notes: [], entretien: null,
        verifier: ['Installation à Kinshasa'], attest: '' }),
      C({ k: 'junior', nom: 'Junior Mukendi', ini: 'JM', bg: '#E3F3FB', fg: '#1E5E79', offre: 'analyste', etape: 'recue', ville: 'Kinshasa', recu: 'il y a 5 h', nouv: true, src: 'Explorer', dispo: 'Immédiate', assigne: '',
        v: [0.55, 0.4, 0.5, 1, 0.7, 1, 1, 0.5], titre: 'Étudiant en statistique',
        comp: [['Statistiques', true], ['Excel', false]], exp: [['Stage', 'INS · 3 mois']], form: 'Licence en statistique en cours, ISTA', langues: 'Français C2 · Anglais A2', interets: ['Statistiques', 'Premier emploi'],
        reponses: [['Avez-vous déjà utilisé SQL ou Power BI ?', 'Non, mais j’apprends vite.'], ['Quand pouvez-vous commencer ?', 'Immédiatement.']], notes: [], entretien: null, verifier: ['Fin des études et disponibilité réelle'], attest: '' }),
      C({ k: 'ruth', nom: 'Ruth Ngoy', ini: 'RN', bg: '#F3E8D8', fg: '#6B4F12', offre: 'analyste', etape: 'nonretenu', ville: 'Kinshasa', recu: 'il y a 6 jours', nouv: false, src: 'Explorer', dispo: 'Immédiate', assigne: 'nadia',
        v: [0.5, 0.4, 0.4, 0.6, 0.8, 1, 1, 0.5], titre: 'Assistante administrative',
        comp: [['Excel', false]], exp: [['Assistante', 'Cabinet Kalonji · 3 ans']], form: 'Graduat en secrétariat (2021)', langues: 'Français C2', interets: ['Administration', 'Data'],
        reponses: [['Avez-vous déjà utilisé SQL ou Power BI ?', 'Non.'], ['Quand pouvez-vous commencer ?', 'Immédiatement.']], notes: [['Nadia Kalala', 'Profil éloigné du poste. Orientée vers le cours SQL gratuit.', 'mardi']], entretien: null, verifier: [], attest: '' }),
      C({ k: 'amani', nom: 'Amani Kasongo', ini: 'AK', bg: '#FBE3E3', fg: '#8A2D2D', offre: 'clientele', etape: 'entretien', ville: 'Lubumbashi', recu: 'il y a 8 jours', nouv: false, src: 'Fil', dispo: 'Immédiate', assigne: 'patrice',
        v: [0.95, 0.9, 0.9, 1, 1, 1, 1, 0.9], titre: 'Chargée de clientèle · 3 ans',
        comp: [['Service client', true], ['Swahili', true], ['Mobile Money', false]], exp: [['Conseillère clientèle', 'Airtel Money · 3 ans']], form: 'Licence en communication, UNILU (2022)', langues: 'Français C2 · Swahili C2 · Anglais B1', interets: ['Service client', 'Encadrer une équipe'],
        reponses: [['Parlez-vous swahili ?', 'Oui, c’est ma langue maternelle.'], ['Avez-vous déjà travaillé au contact de clients ?', 'Trois ans chez Airtel Money.']], notes: [],
        entretien: { j: 'Vendredi 23 oct.', h: '9 h 30', mode: 'Appel', avec: 'Patrice Nzuzi', lien: 'Appel Jumanly' }, verifier: ['Gestion des réclamations difficiles'], attest: '' }),
      C({ k: 'chantal', nom: 'Chantal Kapinga', ini: 'CK', bg: '#E8F0D8', fg: '#4F6B12', offre: 'clientele', etape: 'recue', ville: 'Lubumbashi', recu: 'il y a 1 h', nouv: true, src: 'Explorer', dispo: 'Dans 2 semaines', assigne: '',
        v: [0.85, 0.7, 0.6, 1, 1, 1, 1, 0.8], titre: 'Caissière · Rawbank',
        comp: [['Service client', true], ['Swahili', true]], exp: [['Caissière', 'Rawbank Lubumbashi · 2 ans']], form: 'Graduat en gestion (2023)', langues: 'Français C2 · Swahili C2', interets: ['Banque', 'Service client'],
        reponses: [['Parlez-vous swahili ?', 'Oui.'], ['Avez-vous déjà travaillé au contact de clients ?', 'Oui, deux ans au guichet.']], notes: [], entretien: null, verifier: ['Aisance au téléphone'], attest: '' }),
      C({ k: 'fiston', nom: 'Fiston Mwamba', ini: 'FM', bg: '#E3E8FB', fg: '#2D3F8A', offre: 'clientele', etape: 'presel', ville: 'Lubumbashi', recu: 'il y a 7 jours', nouv: false, src: 'Fil', dispo: 'Immédiate', assigne: 'patrice',
        v: [0.75, 0.6, 0.7, 1, 0.9, 1, 1, 0.7], titre: 'Agent commercial',
        comp: [['Vente', true], ['Swahili', true]], exp: [['Agent commercial', 'Vodacom · 2 ans']], form: 'Diplôme d’État (2020)', langues: 'Français C1 · Swahili C2', interets: ['Commercial', 'Mobile Money'],
        reponses: [['Parlez-vous swahili ?', 'Oui.'], ['Avez-vous déjà travaillé au contact de clients ?', 'Oui, en vente terrain.']], notes: [], entretien: null, verifier: ['Rédaction des comptes rendus'], attest: '' }),
      C({ k: 'moussa', nom: 'Moussa Diallo', ini: 'MD', bg: '#E3F3FB', fg: '#1E5E79', offre: 'flutter', etape: 'recue', ville: 'Lubumbashi', recu: 'hier', nouv: true, src: 'Orbi', dispo: 'Dans 1 mois', assigne: '',
        v: [0.95, 0.9, 0.9, 1, 0.9, 1, 0.5, 0.9], titre: 'Développeur Flutter · 3 applications publiées',
        comp: [['Flutter', true], ['Dart', true], ['Firebase', false]], exp: [['Développeur mobile', 'Freelance · 3 ans']], form: 'Licence en génie logiciel, UNILU (2022)', langues: 'Français C2 · Anglais B2', interets: ['Mobile', 'Réseaux lents', 'Télétravail'],
        reponses: [['Avez-vous publié une application sur le Play Store ?', 'Oui, trois, dont une utilisée par 20 000 personnes.']], notes: [], entretien: null, verifier: ['Préavis d’un mois'], attest: '' }),
      C({ k: 'kevin', nom: 'Kevin Lumbala', ini: 'KL', bg: '#EDE3FB', fg: '#5A2D8A', offre: 'flutter', etape: 'recue', ville: 'Kinshasa', recu: 'hier', nouv: true, src: 'Explorer', dispo: 'Immédiate', assigne: '',
        v: [0.6, 0.5, 0.5, 1, 0.8, 1, 1, 0.6], titre: 'Développeur web · débute en Flutter',
        comp: [['JavaScript', true], ['Flutter', false]], exp: [['Développeur web', 'Agence Kin Digital · 1 an']], form: 'Licence en informatique, ISIPA (2024)', langues: 'Français C2 · Anglais B1', interets: ['Mobile', 'Apprendre'],
        reponses: [['Avez-vous publié une application sur le Play Store ?', 'Pas encore.']], notes: [], entretien: null, verifier: ['Projet Flutter personnel'], attest: '' }),
      C({ k: 'joelle', nom: 'Joëlle Mbayo', ini: 'JM', bg: '#FBE3EF', fg: '#8A2D5C', offre: 'marketing', etape: 'recrute', ville: 'Kinshasa', recu: 'il y a 15 jours', nouv: false, src: 'Fil', dispo: 'Immédiate', assigne: 'nadia',
        v: [0.9, 0.8, 0.8, 1, 0.9, 1, 1, 0.8], titre: 'Étudiante en marketing',
        comp: [['Réseaux sociaux', true], ['Canva', true]], exp: [['Community manager', 'Association Likelemba · 1 an']], form: 'Licence en marketing en cours, ISC', langues: 'Français C2 · Anglais B2', interets: ['Marketing', 'Fintech'],
        reponses: [['Quels réseaux utilisez-vous le plus ?', 'Instagram, TikTok et LinkedIn.']], notes: [['Nadia Kalala', 'Stage signé, début le 2 novembre.', 'lundi']], entretien: null, verifier: [], attest: '' })
    ];
    // Les autres candidatures de chaque offre, plus courtes, pour que les nombres soient justes partout
    const PRENOMS = ['Joël', 'Merveille', 'Christian', 'Divine', 'Gloire', 'Héritier', 'Nathalie', 'Glody', 'Rachel', 'Exaucé', 'Prisca', 'Dieumerci', 'Sandrine', 'Jonathan', 'Bénédicte', 'Cédric', 'Ornella', 'Arsène', 'Laetitia', 'Trésor'];
    const NOMS = ['Kabamba', 'Mutombo', 'Tshilombo', 'Lokwa', 'Mpoyi', 'Ndaya', 'Kazadi', 'Bokele', 'Masudi', 'Lufungula', 'Mwanza', 'Kanku', 'Nsimba', 'Ilunga', 'Banza'];
    const COULS = [['#DDF6EE', '#14745F'], ['#F9E3C8', '#8A4B12'], ['#E3E8FB', '#2D3F8A'], ['#FBE3EF', '#8A2D5C'], ['#E8F0D8', '#4F6B12'], ['#EDE3FB', '#5A2D8A']];
    const SKL = { analyste: ['Excel', 'SQL', 'Power BI'], clientele: ['Service client', 'Swahili', 'Vente'], flutter: ['Flutter', 'Dart', 'JavaScript'], marketing: ['Réseaux sociaux', 'Canva', 'Rédaction'] };
    let graine = 7;
    const hasard = () => { graine = (graine * 9301 + 49297) % 233280; return graine / 233280; };
    Object.keys(OFFRES).forEach((ok) => {
      const deja = CANDS.filter((c) => c.offre === ok);
      let nouvRest = OFFRES[ok].nouv - deja.filter((c) => c.nouv).length;
      for (let i = deja.length; i < OFFRES[ok].cand; i++) {
        const pr = PRENOMS[Math.floor(hasard() * PRENOMS.length)], nm = NOMS[Math.floor(hasard() * NOMS.length)];
        const v = CRITERES.map(() => Math.round((0.35 + hasard() * 0.6) * 100) / 100);
        const nouv = nouvRest > 0; if (nouv) nouvRest--;
        const r = hasard();
        const etape = nouv ? 'recue' : (ok === 'marketing' ? (r < 0.5 ? 'nonretenu' : 'presel') : (r < 0.55 ? 'recue' : r < 0.8 ? 'presel' : 'nonretenu'));
        const cl = COULS[i % COULS.length], sk = SKL[ok];
        CANDS.push(C({ k: ok + '-' + i, nom: pr + ' ' + nm, ini: (pr[0] + nm[0]).toUpperCase(), bg: cl[0], fg: cl[1], offre: ok, etape, ville: OFFRES[ok].ville, recu: nouv ? 'aujourd’hui' : 'il y a ' + (2 + (i % 9)) + ' jours', nouv,
          src: ['Explorer', 'Fil', 'Partage du lien', 'Orbi'][i % 4], dispo: ['Immédiate', 'Dans 2 semaines', 'Dans 1 mois'][i % 3], assigne: '', v, titre: sk[i % 3] + ' · ' + (1 + (i % 4)) + ' an' + ((i % 4) ? 's' : '') + ' d’expérience',
          comp: [[sk[i % 3], i % 2 === 0], [sk[(i + 1) % 3], false]], exp: [['Poste précédent', 'Entreprise de ' + OFFRES[ok].ville + ' · ' + (1 + (i % 4)) + ' an' + ((i % 4) ? 's' : '')]], form: 'Licence (' + (2018 + (i % 7)) + ')', langues: 'Français C2',
          interets: [sk[0], 'Premier poste chez Baobab'], reponses: [], notes: [], entretien: null, verifier: [], attest: '', court: true }));
      }
    });
    const candDe = (k) => CANDS.find((c) => c.k === k) || CANDS[0];
