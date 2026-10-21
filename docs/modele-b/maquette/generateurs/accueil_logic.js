class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const p = this.props || {};
    const has = (k) => Object.prototype.hasOwnProperty.call(st, k);
    const S = (o) => this.setState(o);
    const flash = (t) => { S({ toast: t }); clearTimeout(this._t); this._t = setTimeout(() => this.setState({ toast: null }), 2300); };
    const val = (e) => (e && e.target ? e.target.value : '');
    const sansAccent = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const oui = (x) => x === true || x === 'true';

    // Grâce Mbuyi, le talent d’exemple de toute la maquette
    const PHOTO = '/_blob/b19fba46d85726a0c5e063a063d71f68';
    const rempli = oui(p.rempli);
    const D0 = rempli
      ? { prenom: 'Grâce', nom: 'Mbuyi', email: 'grace.mbuyi@gmail.com', photo: true, pays: 'cd', ville: 'Kinshasa', bouger: false, sit: 'diplome', cap: 'Analyste de données', contrats: { cdi: true, stage: true }, comp: { Excel: true, SQL: true, 'Power BI': true, Communication: true } }
      : { prenom: '', nom: '', email: '', photo: false, pays: 'cd', ville: '', bouger: false, sit: '', cap: '', contrats: {}, comp: {} };
    const g = (k) => (has(k) ? st[k] : D0[k]);

    const vue = st.vue ?? p.vue ?? 'ouverture';
    const auto = p.auto === undefined ? true : oui(p.auto);
    const court = oui(p.court);
    const etape = Math.min(Math.max(Number(st.etape ?? p.etape ?? 1) || 1, 1), 6);
    const fRaw = has('feuille') ? st.feuille : (p.feuille && p.feuille !== 'aucune' ? p.feuille : null);
    const fournisseur = st.four ?? p.fournisseur ?? 'google';
    const mode = st.mode ?? (vue === 'connexion' ? 'connexion' : 'inscription');
    const fermer = () => S({ feuille: null });

    // Ouverture : le logo s’anime, puis l’accueil (ou on rejoue en boucle sur le canvas)
    if (vue === 'ouverture' && !this._tm) {
      this._tm = setTimeout(() => {
        this._tm = null;
        if (auto) this.setState({ vue: 'bienvenue' });
        else this.setState({ rejoue: !this.state.rejoue });
      }, auto ? (court ? 1700 : 3900) : (court ? 2600 : 5200));
    }
    const rejoue = !!st.rejoue;

    // Bienvenue : trois écrans Learn, Grow, Connect
    const SL = [
      { mot: 'Learn', t: 'Apprenez ce que les employeurs cherchent', d: 'Des cours courts, gratuits pour commencer, et une attestation à la fin.' },
      { mot: 'Grow', t: 'Un profil qui progresse avec vous', d: 'Orbi vous dit quoi améliorer, et pourquoi.' },
      { mot: 'Connect', t: 'Postulez et rencontrez les recruteurs', d: 'Des offres qui vous correspondent. Candidater reste gratuit.' }
    ];
    const slide = Math.min(Math.max(Number(st.slide ?? p.slide ?? 0) || 0, 0), 2);
    const points = SL.map((s, i) => ({ t: 'Écran ' + (i + 1) + ' : ' + s.mot, pick: () => S({ slide: i }), w: i === slide ? '22px' : '7px', bg: i === slide ? '#A6F26B' : 'rgba(255,255,255,.25)' }));
    const sl = SL[slide];

    // Inscription
    const email = g('email');
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    const err = st.err || '';
    const FOUR = {
      google: { t: 'Google', titre: 'Choisissez un compte Google', lignes: [['Grâce Mbuyi', 'grace.mbuyi@gmail.com'], ['Grâce M. (travail)', 'g.mbuyi@baobab-etudiants.cd']], autre: 'Utiliser un autre compte' },
      apple: { t: 'Apple', titre: 'Continuer avec Apple', lignes: [['Partager mon e-mail', 'grace.mbuyi@icloud.com'], ['Masquer mon e-mail', 'Apple crée une adresse relais privée']], autre: 'Annuler' },
      linkedin: { t: 'LinkedIn', titre: 'Autoriser Jumanly sur LinkedIn', lignes: [['Grâce Mbuyi', 'Nom, photo et e-mail seulement'], ['Grâce Mbuyi + parcours', 'Importe aussi poste et formation']], autre: 'Annuler' }
    };
    const fo = FOUR[fournisseur] || FOUR.google;
    const ouvrirFour = (k) => () => S({ feuille: 'compte', four: k, mode });
    const viaFour = (i) => () => {
      const mail = fo.lignes[i][1].includes('@') ? fo.lignes[i][1] : (fournisseur === 'apple' ? 'x7k2p9@privaterelay.appleid.com' : 'grace.mbuyi@gmail.com');
      S({ feuille: null, email: mail, prenom: 'Grâce', nom: 'Mbuyi', photo: fournisseur !== 'apple', viaFour: true, vue: 'profil', etape: 1, err: '' });
    };
    const comptes = fo.lignes.map(([t, s], i) => ({ t, s, ini: 'GM', go: viaFour(i), aLien: mode === 'connexion', href: 'Fil.dc.html' }));
    const continuerEmail = () => {
      if (!emailOk) { S({ err: 'email' }); return; }
      S({ vue: 'code', code: '', err: '', viaFour: false });
    };

    // Code à 6 chiffres
    const code = String(st.code ?? (vue === 'code' && rempli ? '4829' : '')).replace(/\D/g, '').slice(0, 6);
    const cases = [0, 1, 2, 3, 4, 5].map((i) => ({ c: code[i] || '', bd: i === code.length ? '#A6F26B' : (code[i] ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.14)') }));
    const verifier = () => {
      if (code.length < 6) { S({ err: 'code' }); return; }
      S({ vue: 'motdepasse', err: '' });
    };

    // Mot de passe
    const mdp = st.mdp ?? (rempli && vue === 'motdepasse' ? 'Kinshasa7' : '');
    const voirMdp = !!st.voirMdp;
    const R = [['8 caractères au moins', mdp.length >= 8], ['Une majuscule', /[A-Z]/.test(mdp)], ['Un chiffre', /\d/.test(mdp)]];
    const mdpOk = R.every((r) => r[1]);
    const regles = R.map(([t, ok]) => ({ t, sym: ok ? '✓' : '', col: ok ? '#A6F26B' : '#8FA39E', bd: ok ? '#A6F26B' : 'rgba(255,255,255,.25)', bg: ok ? 'rgba(166,242,107,.14)' : 'transparent' }));
    const validerMdp = () => {
      if (!mdpOk) { S({ err: 'mdp' }); return; }
      S({ vue: 'profil', etape: 1, err: '' });
    };

    // Connexion et mot de passe oublié
    const cEmail = st.cEmail ?? '';
    const cMdp = st.cMdp ?? '';
    const connOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cEmail.trim()) && cMdp.length >= 6;
    const oEmail = st.oEmail ?? '';
    const oEnvoye = !!st.oEnvoye || (oui(p.envoye) && !has('oEnvoye'));

    // ===== Détails du profil =====
    const prenom = g('prenom'), nom = g('nom');
    const photo = g('photo');
    const PAYS = [
      ['cd', 'RD Congo', 'Votre pays', 'linear-gradient(150deg, #007FFF 0 40%, #F7D618 40% 44%, #CE1021 44% 56%, #F7D618 56% 60%, #007FFF 60%)', ['Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Bukavu', 'Matadi']],
      ['cg', 'Congo-Brazzaville', 'Afrique centrale', 'linear-gradient(135deg, #009543 0 42%, #FBDE4A 42% 58%, #DC241F 58%)', ['Brazzaville', 'Pointe-Noire', 'Dolisie']],
      ['cm', 'Cameroun', 'Afrique centrale', 'linear-gradient(90deg, #007A5E 0 33.3%, #CE1126 33.3% 66.6%, #FCD116 66.6%)', ['Douala', 'Yaoundé', 'Bafoussam']],
      ['ga', 'Gabon', 'Afrique centrale', 'linear-gradient(180deg, #009E60 0 33.3%, #FCD116 33.3% 66.6%, #3A75C4 66.6%)', ['Libreville', 'Port-Gentil', 'Franceville']],
      ['rw', 'Rwanda', 'Afrique centrale', 'linear-gradient(180deg, #00A1DE 0 50%, #FAD201 50% 75%, #20603D 75%)', ['Kigali', 'Huye', 'Musanze']],
      ['ci', 'Côte d’Ivoire', 'Afrique de l’Ouest', 'linear-gradient(90deg, #F77F00 0 33.3%, #FFFFFF 33.3% 66.6%, #009E60 66.6%)', ['Abidjan', 'Bouaké', 'Yamoussoukro']],
      ['sn', 'Sénégal', 'Afrique de l’Ouest', 'linear-gradient(90deg, #00853F 0 33.3%, #FDEF42 33.3% 66.6%, #E31B23 66.6%)', ['Dakar', 'Thiès', 'Saint-Louis']],
      ['ml', 'Mali', 'Afrique de l’Ouest', 'linear-gradient(90deg, #14B53A 0 33.3%, #FCD116 33.3% 66.6%, #CE1126 66.6%)', ['Bamako', 'Sikasso', 'Ségou']],
      ['be', 'Belgique', 'Hors d’Afrique', 'linear-gradient(90deg, #111111 0 33.3%, #FDDA24 33.3% 66.6%, #EF3340 66.6%)', ['Bruxelles', 'Liège', 'Anvers']],
      ['fr', 'France', 'Hors d’Afrique', 'linear-gradient(90deg, #002395 0 33.3%, #FFFFFF 33.3% 66.6%, #ED2939 66.6%)', ['Paris', 'Lyon', 'Marseille']],
      ['ca', 'Canada', 'Hors d’Afrique', 'linear-gradient(90deg, #D52B1E 0 25%, #FFFFFF 25% 75%, #D52B1E 75%)', ['Montréal', 'Ottawa', 'Toronto']]
    ];
    const paysK = g('pays');
    const pa = PAYS.find((x) => x[0] === paysK) || PAYS[0];
    const ville = g('ville');
    const villeLibre = !!st.villeLibre;
    const villes = pa[4].map((v) => ({ t: v, pick: () => S({ ville: v, villeLibre: false, err: '' }), bg: v === ville ? '#F2EDE5' : 'transparent', col: v === ville ? '#0B1A1F' : '#F2EDE5', bd: v === ville ? '#F2EDE5' : 'rgba(255,255,255,.28)' }));
    const pq = st.pq ?? (oui(p.paysTexte) ? 'ca' : '');
    const pqs = sansAccent(pq);
    let derniereZone = '';
    const listePays = PAYS.filter((x) => !pqs || sansAccent(x[1]).includes(pqs)).map((x) => {
      const titre = !pqs && x[2] !== derniereZone ? x[2] : '';
      derniereZone = x[2];
      return { t: x[1], flag: x[3], aTitre: !!titre, titre, sym: x[0] === paysK ? '✓' : '', pick: () => S({ pays: x[0], ville: '', feuille: null, pq: '' }) };
    });
    const bouger = g('bouger');

    const SIT = [
      ['etudiant', 'Étudiant ou étudiante', 'Je cherche un stage'],
      ['diplome', 'Jeune diplômé ou diplômée', 'Je cherche mon premier emploi'],
      ['recherche', 'En recherche d’emploi', 'J’ai déjà travaillé'],
      ['poste', 'En poste', 'Je regarde les opportunités'],
      ['reconv', 'En reconversion', 'Je change de métier']
    ];
    const sit = g('sit');
    const situations = SIT.map(([k, t, d]) => ({ t, d, pick: () => S({ sit: k, err: '' }), bd: k === sit ? '#A6F26B' : 'rgba(255,255,255,.12)', bg: k === sit ? 'rgba(166,242,107,.08)' : '#13282C', sym: k === sit ? '✓' : '', rb: k === sit ? '#A6F26B' : 'rgba(255,255,255,.3)', rbg: k === sit ? '#A6F26B' : 'transparent' }));

    const METIERS = ['Analyste de données', 'Assistant ou assistante RH', 'Chargé ou chargée de clientèle', 'Comptable', 'Community manager', 'Commercial ou commerciale', 'Développeur ou développeuse web', 'Développeur ou développeuse mobile', 'Gestionnaire de projet', 'Analyste crédit', 'Logisticien ou logisticienne', 'Juriste d’entreprise', 'Designer graphique', 'Enseignant ou enseignante'];
    const SUGG = { etudiant: ['Analyste de données', 'Community manager', 'Assistant ou assistante RH'], diplome: ['Analyste de données', 'Chargé ou chargée de clientèle', 'Comptable'], recherche: ['Commercial ou commerciale', 'Gestionnaire de projet', 'Logisticien ou logisticienne'], poste: ['Gestionnaire de projet', 'Analyste crédit', 'Développeur ou développeuse web'], reconv: ['Développeur ou développeuse web', 'Community manager', 'Designer graphique'] };
    const cap = g('cap');
    const mq = st.mq ?? (oui(p.capTexte) ? 'an' : '');
    const mqs = sansAccent(mq);
    const choisirCap = (t) => () => S({ cap: t, mq: '', err: '', feuille: null, orbi: false });
    const suggCap = (SUGG[sit] || SUGG.diplome).map((t) => ({ t, pick: choisirCap(t) }));
    const resMetiers = METIERS.filter((t) => mqs && sansAccent(t).includes(mqs)).map((t) => ({ t, pick: choisirCap(t) }));
    const contrats = g('contrats');
    const CT = [['cdi', 'CDI'], ['cdd', 'CDD'], ['stage', 'Stage'], ['free', 'Freelance'], ['partiel', 'Temps partiel']];
    const chipsContrat = CT.map(([k, t]) => { const a = !!contrats[k]; return { t, pick: () => S({ contrats: { ...contrats, [k]: !a } }), bg: a ? '#F2EDE5' : 'transparent', col: a ? '#0B1A1F' : '#F2EDE5', bd: a ? '#F2EDE5' : 'rgba(255,255,255,.28)' }; });

    const COMPS = ['Excel', 'SQL', 'Power BI', 'Python', 'Analyse de données', 'Communication', 'Anglais', 'Gestion de projet', 'Comptabilité', 'Service client', 'Réseaux sociaux', 'Rédaction'];
    const comp = g('comp');
    const cq = st.cq ?? '';
    const cqs = sansAccent(cq);
    const toutes = [...COMPS, ...Object.keys(comp).filter((k) => !COMPS.includes(k))];
    const nComp = Object.keys(comp).filter((k) => comp[k]).length;
    const basculer = (t) => () => S({ comp: { ...comp, [t]: !comp[t] }, err: '' });
    const chipsComp = toutes.filter((t) => !cqs || sansAccent(t).includes(cqs)).map((t) => { const a = !!comp[t]; return { t, pick: basculer(t), sym: a ? '✓ ' : '+ ', bg: a ? '#A6F26B' : 'transparent', col: a ? '#0B1A1F' : '#F2EDE5', bd: a ? '#A6F26B' : 'rgba(255,255,255,.28)' }; });
    const peutAjouter = !!cq.trim() && !toutes.some((t) => sansAccent(t) === cqs);
    const ajouterComp = () => { const t = cq.trim(); if (!t) return; S({ comp: { ...comp, [t]: true }, cq: '' }); flash('« ' + t + ' » ajoutée'); };
    const cvEtat = st.cv ?? (p.feuille === 'cv' && oui(p.cvLu) ? 'lu' : 'choix');
    const CV_TROUVE = ['Excel', 'SQL', 'Power BI', 'Analyse de données', 'Anglais', 'Communication'];
    const lireCv = () => { S({ cv: 'lecture' }); clearTimeout(this._cv); this._cv = setTimeout(() => this.setState({ cv: 'lu' }), 1400); };
    const ajouterCv = () => { const c2 = { ...comp }; CV_TROUVE.forEach((t) => { c2[t] = true; }); S({ comp: c2, feuille: null, cv: 'choix', cvImporte: true }); flash('6 compétences ajoutées depuis votre CV'); };

    // Étapes : ce qui est obligatoire
    const ETAPES = [
      { t: 'Votre nom', ok: !!prenom.trim() && !!nom.trim(), msg: 'Indiquez votre prénom et votre nom.', passer: false },
      { t: 'Votre photo', ok: true, passer: !photo },
      { t: 'Où vous habitez', ok: !!ville, msg: 'Choisissez votre ville.', passer: false },
      { t: 'Votre situation', ok: !!sit, msg: 'Choisissez ce qui vous ressemble le plus.', passer: false },
      { t: 'Votre Cap', ok: !!cap, msg: 'Choisissez un métier, ou laissez Orbi vous aider.', passer: false },
      { t: 'Vos compétences', ok: nComp >= 3, msg: 'Choisissez au moins 3 compétences.', passer: false }
    ];
    const et = ETAPES[etape - 1];
    const barres = ETAPES.map((x, i) => ({ bg: i < etape ? '#A6F26B' : 'rgba(255,255,255,.14)' }));
    const suivant = () => {
      if (!et.ok) { S({ err: 'etape' }); return; }
      if (etape < 6) S({ etape: etape + 1, err: '' }); else S({ vue: 'notifs', err: '' });
    };
    const precedent = () => {
      if (etape > 1) { S({ etape: etape - 1, err: '' }); return; }
      S({ vue: st.viaFour ? 'inscription' : (has('mdp') ? 'motdepasse' : 'inscription'), err: '' });
    };

    // Profil prêt
    const pct = 10 + (photo ? 10 : 0) + (ville ? 5 : 0) + (sit ? 5 : 0) + (cap ? 5 : 0) + (nComp >= 3 ? 5 : 0);
    const R0 = 2 * Math.PI * 34;
    const compListe = Object.keys(comp).filter((k) => comp[k]).slice(0, 4).map((t) => ({ t }));
    const sitT = (SIT.find((x) => x[0] === sit) || ['', ''])[1];

    // Orbi : aide pour le Cap
    const orbi = has('orbi') ? st.orbi : oui(p.orbi);
    const gout = st.gout ?? (oui(p.orbi) && p.gout ? p.gout : null);
    const GOUT = {
      chiffres: { t: 'Les chiffres et l’analyse', m: ['Analyste de données', 'Comptable', 'Analyste crédit'], pq: 'Vous aimez comprendre ce que disent les chiffres. Ces métiers recrutent à Kinshasa et se préparent avec les cours gratuits de Formation.' },
      gens: { t: 'Aider et convaincre les gens', m: ['Chargé ou chargée de clientèle', 'Assistant ou assistante RH', 'Commercial ou commerciale'], pq: 'Vous êtes à l’aise avec les autres. Ces métiers demandent de l’écoute et de bons échanges.' },
      creer: { t: 'Créer et communiquer', m: ['Community manager', 'Designer graphique', 'Développeur ou développeuse web'], pq: 'Vous aimez créer. Ces métiers se montrent bien avec des réalisations dans votre portfolio.' }
    };
    const gouts = Object.keys(GOUT).map((k) => ({ t: GOUT[k].t, go: () => S({ gout: k }) }));
    const go0 = GOUT[gout];
    const propositions = go0 ? go0.m.map((t) => ({ t, pick: choisirCap(t) })) : [];

    // Notifications
    const autoriser = (ok) => () => { S({ feuille: null, vue: 'pret', notifOk: ok }); };

    return {
      vOuverture: vue === 'ouverture', vBienvenue: vue === 'bienvenue', vInscription: vue === 'inscription', vCode: vue === 'code', vMdp: vue === 'motdepasse',
      vConnexion: vue === 'connexion', vOubli: vue === 'oubli', vProfil: vue === 'profil', vNotifs: vue === 'notifs', vPret: vue === 'pret',
      // ouverture
      longA: !court && !rejoue, longB: !court && rejoue, courtA: court && !rejoue, courtB: court && rejoue,
      // bienvenue
      points, sl, s0: slide === 0, s1: slide === 1, s2: slide === 2,
      suivantSlide: () => S({ slide: (slide + 1) % 3 }), photo: PHOTO,
      versInscription: () => S({ vue: 'inscription', mode: 'inscription', err: '' }),
      versConnexion: () => S({ vue: 'connexion', mode: 'connexion', err: '' }),
      versBienvenue: () => S({ vue: 'bienvenue', err: '' }),
      // inscription
      email, ecrireEmail: (e) => S({ email: val(e), err: '' }), errEmail: err === 'email', continuerEmail,
      emailOp: emailOk ? '1' : '.45',
      google: ouvrirFour('google'), apple: ouvrirFour('apple'), linkedin: ouvrirFour('linkedin'),
      legalCond: () => S({ feuille: 'legal', legal: 'cond' }), legalConf: () => S({ feuille: 'legal', legal: 'conf' }),
      // code
      cases, ecrireCode: (e) => S({ code: val(e).replace(/\D/g, '').slice(0, 6), err: '' }), code, errCode: err === 'code',
      remplirCode: () => S({ code: '482913', err: '' }), verifier, codeOp: code.length === 6 ? '1' : '.45',
      renvoyer: () => flash('Nouveau code envoyé à ' + (email || 'votre adresse')),
      modifierEmail: () => S({ vue: 'inscription', err: '' }), emailAff: email || 'votre adresse',
      // mot de passe
      mdp, ecrireMdp: (e) => S({ mdp: val(e), err: '' }), typeMdp: voirMdp ? 'text' : 'password', voirT: voirMdp ? 'Masquer' : 'Afficher',
      basculerMdp: () => S({ voirMdp: !voirMdp }), regles, errMdp: err === 'mdp', validerMdp, mdpOp: mdpOk ? '1' : '.45',
      suggererMdp: () => S({ mdp: 'Kin-Bao7-Mvu2', voirMdp: true, err: '' }), retourCode: () => S({ vue: 'code', err: '' }),
      // connexion
      cEmail, cMdp, ecrireCEmail: (e) => S({ cEmail: val(e), err: '' }), ecrireCMdp: (e) => S({ cMdp: val(e), err: '' }),
      connOk, connPas: !connOk, refuserConn: () => S({ err: 'conn' }), errConn: err === 'conn',
      trousseau: () => S({ cEmail: 'grace.mbuyi@gmail.com', cMdp: 'Kinshasa7', err: '' }),
      versOubli: () => S({ vue: 'oubli', oEmail: cEmail, oEnvoye: false, err: '' }),
      oEmail, ecrireOEmail: (e) => S({ oEmail: val(e), err: '' }), oEnvoye, oPas: !oEnvoye,
      envoyerLien: () => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(oEmail.trim())) { S({ err: 'oubli' }); return; } S({ oEnvoye: true, err: '' }); },
      errOubli: err === 'oubli', oEmailAff: oEmail || 'grace.mbuyi@gmail.com',
      renvoyerLien: () => flash('Lien renvoyé à ' + (oEmail || 'votre adresse')),
      // profil
      etapeT: 'Étape ' + etape + ' sur 6', barres, suivant, precedent, aPasser: et.passer, passer: () => S({ etape: etape + 1, err: '' }),
      errEtape: err === 'etape', errMsg: et.msg || '', suivOp: et.ok ? '1' : '.45', suivT: etape === 6 ? 'Terminer' : 'Continuer',
      e1: etape === 1, e2: etape === 2, e3: etape === 3, e4: etape === 4, e5: etape === 5, e6: etape === 6,
      prenom, nom, ecrirePrenom: (e) => S({ prenom: val(e), err: '' }), ecrireNom: (e) => S({ nom: val(e), err: '' }),
      viaFour: !!st.viaFour, fourT: fo.t,
      ini: ((prenom[0] || 'G') + (nom[0] || 'M')).toUpperCase(),
      aPhoto: !!photo, sansPhoto: !photo, prendrePhoto: () => S({ feuille: 'photo' }),
      choisirPhoto: () => { S({ photo: true, feuille: null }); flash('Photo ajoutée'); }, retirerPhoto: () => S({ photo: false }),
      paysT: pa[1], paysFlag: pa[3], ouvrirPays: () => S({ feuille: 'pays', pq: '' }), villes, ville, villeLibre,
      autreVille: () => S({ villeLibre: true, ville: '' }), ecrireVille: (e) => S({ ville: val(e), err: '' }),
      pq, ecrirePays: (e) => S({ pq: val(e) }), listePays, aucunPays: listePays.length === 0,
      bouger: bouger ? 'true' : 'false', bougerBg: bouger ? '#A6F26B' : 'rgba(255,255,255,.18)', bougerX: bouger ? '20px' : '0px', basculerBouger: () => S({ bouger: !bouger }),
      situations,
      cap, aCap: !!cap, sansCap: !cap, mq, ecrireMetier: (e) => S({ mq: val(e) }), mVide: !mq.trim(), mPlein: !!mq.trim(), suggCap, resMetiers,
      mRien: !!mq.trim() && resMetiers.length === 0, garderMetier: () => { const t = mq.trim(); if (t) S({ cap: t, mq: '', err: '' }); },
      changerCap: () => S({ cap: '', mq: '' }), chipsContrat,
      chipsComp, cq, ecrireComp: (e) => S({ cq: val(e) }), peutAjouter, ajouterComp, nCompT: nComp + (nComp > 1 ? ' choisies' : ' choisie'),
      nCompCol: nComp >= 3 ? '#A6F26B' : '#8FA39E', ouvrirCv: () => S({ feuille: 'cv', cv: 'choix' }), cvImporte: !!st.cvImporte,
      cvChoix: cvEtat === 'choix', cvLecture: cvEtat === 'lecture', cvLu: cvEtat === 'lu', lireCv, ajouterCv,
      cvTrouve: CV_TROUVE.map((t) => ({ t })),
      // Orbi
      orbi, ouvrirOrbi: () => S({ orbi: true, gout: null }), fermerOrbi: () => S({ orbi: false, gout: null }),
      sansGout: !go0, aGout: !!go0, gouts, propositions, goutT: go0 ? go0.t : '', goutPq: go0 ? go0.pq : '', autresGouts: () => S({ gout: null }),
      // notifications
      activer: () => S({ feuille: 'systeme' }), plusTard: () => S({ vue: 'pret', notifOk: false }),
      autoriserOui: autoriser(true), autoriserNon: autoriser(false),
      // prêt
      pctT: pct + ' %', ringDash: (R0 * pct / 100).toFixed(1) + ' ' + R0.toFixed(1), nomComplet: (prenom || 'Grâce') + ' ' + (nom || 'Mbuyi'),
      villeAff: ville || 'Kinshasa', prenomAff: prenom || 'Grâce', capAff: cap || 'Analyste de données', lieuAff: (ville || 'Kinshasa') + ', ' + pa[1], sitAff: sitT || 'Jeune diplômé ou diplômée',
      compListe, notifOk: st.notifOk !== false, notifT: st.notifOk === false ? 'Notifications désactivées · à changer dans Carrière › Paramètres' : 'Vous serez prévenue des offres pour vous',
      modifierProfil: () => S({ vue: 'profil', etape: 1 }),
      // feuilles
      fCompte: fRaw === 'compte', fLegal: fRaw === 'legal', fPays: fRaw === 'pays', fSysteme: fRaw === 'systeme', fCv: fRaw === 'cv', fPhoto: fRaw === 'photo', fermer,
      fo, comptes, compteBtn: mode !== 'connexion', compteLien: mode === 'connexion',
      autreCompte: () => S({ feuille: null, vue: mode === 'connexion' ? 'connexion' : 'inscription' }),
      legal: (st.legal ?? p.legal ?? 'cond') === 'conf'
        ? { t: 'Politique de confidentialité', l: [{ t: 'Vos données restent à vous : vous pouvez les télécharger ou les effacer.' }, { t: 'Les recruteurs ne voient que ce que vous rendez visible.' }, { t: 'Orbi explique toujours pourquoi il vous propose une offre.' }] }
        : { t: 'Conditions d’utilisation', l: [{ t: 'Créer un compte et candidater est gratuit.' }, { t: 'Un compte par personne, avec votre vrai nom.' }, { t: 'Les formules payantes se paient par Mobile Money, sans engagement.' }] },
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}
