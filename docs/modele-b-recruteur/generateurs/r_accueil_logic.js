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

    // Nadia Kalala, la recruteuse d’exemple : chargée de recrutement chez Baobab Fintech, Kinshasa
    const rempli = oui(p.rempli);
    const D0 = rempli
      ? { prenom: 'Nadia', nom: 'Kalala', email: 'nadia.kalala@gmail.com', photo: true, pays: 'cd', ville: 'Kinshasa', ailleurs: { Lubumbashi: true },
          emailPro: 'n.kalala@baobabfintech.cd', tel: '812 345 678', wa: true, linkedin: 'linkedin.com/in/nadiakalala', vis: 'cand',
          role: 'charge', poste: 'Chargée de recrutement', ent: 'baobab', entEtat: p.entEtat || 'attente', dom: { Data: true, Finance: true, 'Service client': true }, niv: { Junior: true, Stage: true }, vol: '6-20',
          titreP: 'Je recrute les talents data et service client de Baobab Fintech', badge: true }
      : { prenom: '', nom: '', email: '', photo: false, pays: 'cd', ville: '', ailleurs: {}, emailPro: '', tel: '', wa: false, linkedin: '', vis: 'cand',
          role: '', poste: '', ent: '', entEtat: '', dom: {}, niv: {}, vol: '', titreP: '', badge: true };
    const g = (k) => (has(k) ? st[k] : D0[k]);

    const vue = st.vue ?? p.vue ?? 'ouverture';
    const auto = p.auto === undefined ? true : oui(p.auto);
    const court = oui(p.court);
    const NE = 7;
    const etape = Math.min(Math.max(Number(st.etape ?? p.etape ?? 1) || 1, 1), NE);
    const fRaw = has('feuille') ? st.feuille : (p.feuille && p.feuille !== 'aucune' ? p.feuille : null);
    const fournisseur = st.four ?? p.fournisseur ?? 'google';
    const mode = st.mode ?? (vue === 'connexion' ? 'connexion' : 'inscription');
    const fermer = () => S({ feuille: null });

    if (vue === 'ouverture' && !this._tm) {
      this._tm = setTimeout(() => {
        this._tm = null;
        if (auto) this.setState({ vue: 'bienvenue' });
        else this.setState({ rejoue: !this.state.rejoue });
      }, auto ? (court ? 1700 : 3900) : (court ? 2600 : 5200));
    }
    const rejoue = !!st.rejoue;

    // Bienvenue côté recruteur : publier, trier, recruter
    const SL = [
      { mot: 'Publier', t: 'Votre offre en ligne en 5 minutes', d: 'Orbi rédige avec vous. Les talents qui correspondent la voient en premier.' },
      { mot: 'Trier', t: 'Toutes vos candidatures au même endroit', d: 'Étapes, CV lus par Orbi, notes de l’équipe. Le score explique toujours pourquoi.' },
      { mot: 'Recruter', t: 'Entretiens, décisions, réponses', d: 'Planifiez, évaluez, répondez à chacun. Vous décidez, Orbi vous aide.' }
    ];
    const slide = Math.min(Math.max(Number(st.slide ?? p.slide ?? 0) || 0, 0), 2);
    const points = SL.map((s, i) => ({ t: 'Écran ' + (i + 1) + ' : ' + s.mot, pick: () => S({ slide: i }), w: i === slide ? '22px' : '7px', bg: i === slide ? '#A6F26B' : 'rgba(255,255,255,.25)' }));
    const sl = SL[slide];

    // Inscription
    const email = g('email');
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    const err = st.err || '';
    const FOUR = {
      google: { t: 'Google', titre: 'Choisissez un compte Google', lignes: [['Nadia Kalala', 'nadia.kalala@gmail.com'], ['Nadia Kalala (travail)', 'n.kalala@baobabfintech.cd']], autre: 'Utiliser un autre compte' },
      apple: { t: 'Apple', titre: 'Continuer avec Apple', lignes: [['Partager mon e-mail', 'nadia.kalala@icloud.com'], ['Masquer mon e-mail', 'Apple crée une adresse relais privée']], autre: 'Annuler' },
      linkedin: { t: 'LinkedIn', titre: 'Autoriser Jumanly sur LinkedIn', lignes: [['Nadia Kalala', 'Nom, photo et e-mail seulement'], ['Nadia Kalala + poste actuel', 'Importe aussi « Chargée de recrutement · Baobab Fintech »']], autre: 'Annuler' }
    };
    const fo = FOUR[fournisseur] || FOUR.google;
    const ouvrirFour = (k) => () => S({ feuille: 'compte', four: k, mode });
    const viaFour = (i) => () => {
      const l = fo.lignes[i][1];
      const mail = l.includes('@') ? l : (fournisseur === 'apple' ? 'x7k2p9@privaterelay.appleid.com' : 'nadia.kalala@gmail.com');
      const pro = mail.endsWith('.cd') && mail.includes('baobab');
      const li = fournisseur === 'linkedin' && i === 1;
      S({ feuille: null, email: mail, prenom: 'Nadia', nom: 'Kalala', photo: fournisseur !== 'apple', viaFour: true, vue: 'profil', etape: 1, err: '',
        ...(pro ? { emailPro: mail } : {}), ...(li ? { poste: 'Chargée de recrutement', role: 'charge', linkedin: 'linkedin.com/in/nadiakalala' } : {}) });
    };
    const comptes = fo.lignes.map(([t, s], i) => ({ t, s, ini: 'NK', go: viaFour(i), aLien: mode === 'connexion', href: 'Recruteur-fil.dc.html' }));
    const continuerEmail = () => { if (!emailOk) { S({ err: 'email' }); return; } S({ vue: 'code', code: '', err: '', viaFour: false }); };

    const code = String(st.code ?? (vue === 'code' && rempli ? '4829' : '')).replace(/\D/g, '').slice(0, 6);
    const cases = [0, 1, 2, 3, 4, 5].map((i) => ({ c: code[i] || '', bd: i === code.length ? '#A6F26B' : (code[i] ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.14)') }));
    const verifier = () => { if (code.length < 6) { S({ err: 'code' }); return; } S({ vue: 'motdepasse', err: '' }); };

    const mdp = st.mdp ?? (rempli && vue === 'motdepasse' ? 'Baobab2026' : '');
    const voirMdp = !!st.voirMdp;
    const R = [['8 caractères au moins', mdp.length >= 8], ['Une majuscule', /[A-Z]/.test(mdp)], ['Un chiffre', /\d/.test(mdp)]];
    const mdpOk = R.every((r) => r[1]);
    const regles = R.map(([t, ok]) => ({ t, sym: ok ? '✓' : '', col: ok ? '#A6F26B' : '#8FA39E', bd: ok ? '#A6F26B' : 'rgba(255,255,255,.25)', bg: ok ? 'rgba(166,242,107,.14)' : 'transparent' }));
    const validerMdp = () => { if (!mdpOk) { S({ err: 'mdp' }); return; } S({ vue: 'profil', etape: 1, err: '' }); };

    const cEmail = st.cEmail ?? '';
    const cMdp = st.cMdp ?? '';
    const connOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cEmail.trim()) && cMdp.length >= 6;
    const oEmail = st.oEmail ?? '';
    const oEnvoye = !!st.oEnvoye || (oui(p.envoye) && !has('oEnvoye'));

    // ===== Profil recruteur en 7 étapes =====
    const prenom = g('prenom'), nom = g('nom');
    const photo = g('photo');
    const PAYS = [
      ['cd', 'RD Congo', 'Votre pays', 'linear-gradient(150deg, #007FFF 0 40%, #F7D618 40% 44%, #CE1021 44% 56%, #F7D618 56% 60%, #007FFF 60%)', ['Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Bukavu', 'Matadi'], '+243'],
      ['cg', 'Congo-Brazzaville', 'Afrique centrale', 'linear-gradient(135deg, #009543 0 42%, #FBDE4A 42% 58%, #DC241F 58%)', ['Brazzaville', 'Pointe-Noire', 'Dolisie'], '+242'],
      ['cm', 'Cameroun', 'Afrique centrale', 'linear-gradient(90deg, #007A5E 0 33.3%, #CE1126 33.3% 66.6%, #FCD116 66.6%)', ['Douala', 'Yaoundé', 'Bafoussam'], '+237'],
      ['ga', 'Gabon', 'Afrique centrale', 'linear-gradient(180deg, #009E60 0 33.3%, #FCD116 33.3% 66.6%, #3A75C4 66.6%)', ['Libreville', 'Port-Gentil', 'Franceville'], '+241'],
      ['rw', 'Rwanda', 'Afrique centrale', 'linear-gradient(180deg, #00A1DE 0 50%, #FAD201 50% 75%, #20603D 75%)', ['Kigali', 'Huye', 'Musanze'], '+250'],
      ['ci', 'Côte d’Ivoire', 'Afrique de l’Ouest', 'linear-gradient(90deg, #F77F00 0 33.3%, #FFFFFF 33.3% 66.6%, #009E60 66.6%)', ['Abidjan', 'Bouaké', 'Yamoussoukro'], '+225'],
      ['sn', 'Sénégal', 'Afrique de l’Ouest', 'linear-gradient(90deg, #00853F 0 33.3%, #FDEF42 33.3% 66.6%, #E31B23 66.6%)', ['Dakar', 'Thiès', 'Saint-Louis'], '+221'],
      ['ml', 'Mali', 'Afrique de l’Ouest', 'linear-gradient(90deg, #14B53A 0 33.3%, #FCD116 33.3% 66.6%, #CE1126 66.6%)', ['Bamako', 'Sikasso', 'Ségou'], '+223'],
      ['be', 'Belgique', 'Hors d’Afrique', 'linear-gradient(90deg, #111111 0 33.3%, #FDDA24 33.3% 66.6%, #EF3340 66.6%)', ['Bruxelles', 'Liège', 'Anvers'], '+32'],
      ['fr', 'France', 'Hors d’Afrique', 'linear-gradient(90deg, #002395 0 33.3%, #FFFFFF 33.3% 66.6%, #ED2939 66.6%)', ['Paris', 'Lyon', 'Marseille'], '+33'],
      ['ca', 'Canada', 'Hors d’Afrique', 'linear-gradient(90deg, #D52B1E 0 25%, #FFFFFF 25% 75%, #D52B1E 75%)', ['Montréal', 'Ottawa', 'Toronto'], '+1']
    ];
    const paysK = g('pays');
    const pa = PAYS.find((x) => x[0] === paysK) || PAYS[0];
    // l’indicatif peut venir d’un autre pays que celui de la ville (numéro étranger)
    const indK = st.ind ?? paysK;
    const ind = PAYS.find((x) => x[0] === indK) || pa;
    const ville = g('ville');
    const villeLibre = !!st.villeLibre;
    const villes = pa[4].map((v) => ({ t: v, pick: () => S({ ville: v, villeLibre: false, err: '' }), bg: v === ville ? '#F2EDE5' : 'transparent', col: v === ville ? '#0B1A1F' : '#F2EDE5', bd: v === ville ? '#F2EDE5' : 'rgba(255,255,255,.28)' }));
    const ailleurs = g('ailleurs');
    const autresVilles = pa[4].filter((v) => v !== ville).map((v) => { const a = !!ailleurs[v]; return { t: v, pick: () => S({ ailleurs: { ...ailleurs, [v]: !a } }), sym: a ? '✓ ' : '+ ', bg: a ? '#A6F26B' : 'transparent', col: a ? '#0B1A1F' : '#F2EDE5', bd: a ? '#A6F26B' : 'rgba(255,255,255,.28)' }; });
    const pq = st.pq ?? (oui(p.paysTexte) ? 'ca' : '');
    const pqs = sansAccent(pq);
    const pourInd = st.pourInd ?? (p.feuille === 'indicatif');
    let derniereZone = '';
    const listePays = PAYS.filter((x) => !pqs || sansAccent(x[1]).includes(pqs)).map((x) => {
      const titre = !pqs && x[2] !== derniereZone ? x[2] : '';
      derniereZone = x[2];
      const actif = pourInd ? x[0] === indK : x[0] === paysK;
      return { t: x[1], flag: x[3], ind: x[5], aTitre: !!titre, titre, sym: actif ? '✓' : '',
        pick: () => (pourInd ? S({ ind: x[0], feuille: null, pq: '' }) : S({ pays: x[0], ind: x[0], ville: '', ailleurs: {}, feuille: null, pq: '' })) };
    });

    // Contacts
    const emailPro = g('emailPro'), tel = g('tel'), wa = g('wa'), linkedin = g('linkedin'), vis = g('vis');
    const emailProOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(emailPro).trim());
    const domainePro = emailProOk ? String(emailPro).split('@')[1] : '';
    const estPerso = /gmail|yahoo|hotmail|outlook|icloud/.test(domainePro);
    const telChiffres = String(tel).replace(/\D/g, '');
    const telOk = telChiffres.length === 0 || telChiffres.length >= 8;
    const VIS = [['personne', 'Personne', 'Vos contacts restent privés'], ['cand', 'Candidats en entretien', 'Seulement ceux que vous invitez'], ['cx', 'Mes connexions', 'Les personnes connectées avec vous']];
    const visOpts = VIS.map(([k, t, d]) => ({ t, d, pick: () => S({ vis: k }), bd: k === vis ? '#A6F26B' : 'rgba(255,255,255,.12)', bg: k === vis ? 'rgba(166,242,107,.08)' : 'transparent', rb: k === vis ? '#A6F26B' : 'rgba(255,255,255,.3)', rbg: k === vis ? '#A6F26B' : 'transparent' }));
    const visT = (VIS.find((x) => x[0] === vis) || VIS[0])[1];

    // Rôle
    const ROLES = [
      ['charge', 'Chargé·e de recrutement', 'Je gère les offres et les candidats', 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.3M21.5 20a6.5 6.5 0 0 0-3.8-5.9'],
      ['rh', 'Responsable RH', 'Je pilote le recrutement et l’équipe', 'M4 20V9l8-5 8 5v11M9 20v-6h6v6'],
      ['manager', 'Manager qui recrute', 'Je recrute pour mon équipe', 'M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z'],
      ['dirigeant', 'Dirigeant·e', 'Je dirige l’entreprise', 'M4 19h16M6 19V9l6-4 6 4v10M10 19v-5h4v5'],
      ['cabinet', 'Cabinet de recrutement', 'Je recrute pour des clients', 'M3.5 8.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7'],
      ['indep', 'Indépendant·e', 'Je recrute à mon compte', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0']
    ];
    const role = g('role');
    const POSTE_SUGG = { charge: ['Chargée de recrutement', 'Talent acquisition', 'Recruteuse'], rh: ['Responsable RH', 'DRH', 'Responsable du personnel'], manager: ['Responsable data', 'Chef d’équipe', 'Directrice commerciale'], dirigeant: ['Directrice générale', 'Fondatrice', 'Gérante'], cabinet: ['Consultante en recrutement', 'Associée', 'Chasseuse de têtes'], indep: ['Recruteuse indépendante', 'Consultante RH'] };
    const roles = ROLES.map(([k, t, d, ic]) => ({ t, d, ic, pick: () => S({ role: k, poste: has('poste') && st.poste ? st.poste : (POSTE_SUGG[k] || [''])[0], err: '' }),
      bd: k === role ? '#A6F26B' : 'rgba(255,255,255,.1)', bg: k === role ? 'rgba(166,242,107,.1)' : '#13282C', ic2: k === role ? '#A6F26B' : '#8FA39E' }));
    const poste = g('poste');
    const postesSugg = (POSTE_SUGG[role] || []).map((t) => ({ t, pick: () => S({ poste: t }), bg: t === poste ? '#F2EDE5' : 'transparent', col: t === poste ? '#0B1A1F' : '#F2EDE5', bd: t === poste ? '#F2EDE5' : 'rgba(255,255,255,.28)' }));
    const roleT = (ROLES.find((x) => x[0] === role) || ['', ''])[1];

    // Entreprise : sur Jumanly ou non
    const ENTS = [
      { k: 'baobab', t: 'Baobab Fintech', ab: 'BF', c: '#14745F', s: 'Fintech · Kinshasa · 51 à 200 personnes', rec: 'Joseph Ilunga (RH) gère la page · 3 recruteurs', dom: 'baobabfintech.cd', offres: 8 },
      { k: 'fleuve', t: 'Fleuve Banque', ab: 'FB', c: '#1E4E79', s: 'Banque · Kinshasa · plus de 500 personnes', rec: '5 recruteurs', dom: 'fleuvebanque.cd', offres: 5 },
      { k: 'mwinda', t: 'Mwinda Énergie', ab: 'ME', c: '#B07A12', s: 'Énergie · Kinshasa · 201 à 500 personnes', rec: '2 recruteurs', dom: 'mwinda.cd', offres: 3 },
      { k: 'lisanga', t: 'Lisanga Santé', ab: 'LS', c: '#8A2D2D', s: 'Santé · Kinshasa · 51 à 200 personnes', rec: '1 recruteur', dom: 'lisanga.cd', offres: 2 },
      { k: 'kivu', t: 'Kivu Data Lab', ab: 'KD', c: '#4B2D7A', s: 'Data · Goma · 11 à 50 personnes', rec: '1 recruteur', dom: 'kivudata.cd', offres: 4 }
    ];
    const entK = g('ent');
    const entEtat = g('entEtat'); // '', 'choisie', 'attente', 'acceptee', 'creee', 'indep'
    const nouvelle = st.nouvelle || { t: '', sect: 'Fintech', taille: '11 à 50', logo: false };
    const e0 = entEtat === 'creee' ? { k: 'nouvelle', t: nouvelle.t || 'Ma société', ab: (nouvelle.t || 'MS').split(' ').map((m) => m[0]).join('').slice(0, 2).toUpperCase(), c: '#0F3F37', s: `${nouvelle.sect} · ${ville || 'Kinshasa'} · ${nouvelle.taille} personnes`, rec: 'Vous gérez la page', dom: '', offres: 0 }
      : (ENTS.find((x) => x.k === entK) || null);
    const eq = st.eq ?? (oui(p.entTexte) ? 'bao' : '');
    const eqs = sansAccent(eq);
    const resEnt = ENTS.filter((x) => eqs && sansAccent(x.t).includes(eqs)).map((x) => ({ ...x, pick: () => S({ ent: x.k, entEtat: 'choisie', eq: '', err: '' }) }));
    const entSugg = ENTS.slice(0, 3).map((x) => ({ ...x, pick: () => S({ ent: x.k, entEtat: 'choisie', eq: '', err: '' }) }));
    const emailCorrespond = !!e0 && !!e0.dom && domainePro === e0.dom;
    const msgDemande = st.msgDem ?? 'Bonjour Joseph, je rejoins l’équipe recrutement de Baobab Fintech. Pouvez-vous valider mon rattachement ?';
    const envoyerDemande = () => { S({ entEtat: 'attente', feuille: null }); flash('Demande envoyée à ' + (e0 && e0.k === 'baobab' ? 'Joseph Ilunga' : 'l’administrateur de la page')); };
    const SECT = ['Fintech', 'Banque', 'Énergie', 'Santé', 'Commerce', 'Télécoms', 'ONG', 'Autre'];
    const TAILLE = ['1 à 10', '11 à 50', '51 à 200', '201 à 500', 'plus de 500'];
    const sects = SECT.map((t) => ({ t, pick: () => S({ nouvelle: { ...nouvelle, sect: t } }), bg: t === nouvelle.sect ? '#F2EDE5' : 'transparent', col: t === nouvelle.sect ? '#0B1A1F' : '#F2EDE5', bd: t === nouvelle.sect ? '#F2EDE5' : 'rgba(255,255,255,.28)' }));
    const tailles = TAILLE.map((t) => ({ t, pick: () => S({ nouvelle: { ...nouvelle, taille: t } }), bg: t === nouvelle.taille ? '#F2EDE5' : 'transparent', col: t === nouvelle.taille ? '#0B1A1F' : '#F2EDE5', bd: t === nouvelle.taille ? '#F2EDE5' : 'rgba(255,255,255,.28)' }));
    const creerEnt = () => { if (nouvelle.t.trim().length < 2) { flash('Écrivez le nom de l’entreprise'); return; } S({ entEtat: 'creee', feuille: null, ent: 'nouvelle' }); flash('Page « ' + nouvelle.t.trim() + ' » créée : vous en êtes l’administratrice'); };
    const ENT_ETAT = {
      choisie: ['Sur Jumanly', '#5FE0B8', 'rgba(47,211,166,.12)'], attente: ['Demande envoyée', '#F4C463', 'rgba(244,196,99,.14)'],
      acceptee: ['Rattachement accepté', '#A6F26B', 'rgba(166,242,107,.14)'], creee: ['Page créée par vous', '#A6F26B', 'rgba(166,242,107,.14)']
    };
    const ee = ENT_ETAT[entEtat] || ENT_ETAT.choisie;
    const logoVisible = entEtat === 'acceptee' || entEtat === 'creee';

    // Ce que vous recrutez
    const DOMS = ['Data', 'Finance', 'Service client', 'Tech', 'Commercial', 'Marketing', 'RH', 'Juridique', 'Logistique', 'Santé'];
    const dom = g('dom');
    const doms = DOMS.map((t) => { const a = !!dom[t]; return { t, pick: () => S({ dom: { ...dom, [t]: !a }, err: '' }), sym: a ? '✓ ' : '+ ', bg: a ? '#A6F26B' : 'transparent', col: a ? '#0B1A1F' : '#F2EDE5', bd: a ? '#A6F26B' : 'rgba(255,255,255,.28)' }; });
    const nDom = Object.keys(dom).filter((k) => dom[k]).length;
    const NIV = ['Stage', 'Junior', 'Confirmé', 'Cadre'];
    const niv = g('niv');
    const nivs = NIV.map((t) => { const a = !!niv[t]; return { t, pick: () => S({ niv: { ...niv, [t]: !a } }), bg: a ? '#F2EDE5' : '#13282C', col: a ? '#0B1A1F' : '#F2EDE5' }; });
    const VOL = [['1-5', '1 à 5'], ['6-20', '6 à 20'], ['20+', 'plus de 20']];
    const vol = g('vol');
    const vols = VOL.map(([k, t]) => ({ t, pick: () => S({ vol: k }), bg: k === vol ? '#A6F26B' : 'transparent', col: k === vol ? '#0B1A1F' : '#F2EDE5', bd: k === vol ? '#A6F26B' : 'rgba(255,255,255,.2)' }));

    // Profil recruteur (aperçu)
    const titreP = g('titreP');
    const badge = g('badge');
    const domListe = Object.keys(dom).filter((k) => dom[k]).map((t) => ({ t }));
    const titreAuto = 'Je recrute ' + (nDom ? 'en ' + Object.keys(dom).filter((k) => dom[k]).slice(0, 2).join(' et ').toLowerCase() : 'des talents') + (e0 ? ' pour ' + e0.t : '');

    const ETAPES = [
      { t: 'Vous', ok: !!prenom.trim() && !!nom.trim(), msg: 'Indiquez votre prénom et votre nom.' },
      { t: 'Où vous êtes', ok: !!ville, msg: 'Choisissez votre ville.' },
      { t: 'Vos contacts', ok: emailProOk && telOk, msg: !emailProOk ? 'Indiquez votre e-mail professionnel.' : 'Le numéro doit avoir au moins 8 chiffres, ou laissez-le vide.' },
      { t: 'Votre rôle', ok: !!role && !!String(poste).trim(), msg: 'Choisissez votre rôle et votre poste.' },
      { t: 'Votre entreprise', ok: !!entEtat && entEtat !== 'choisie' || entEtat === 'indep', msg: entEtat === 'choisie' ? 'Envoyez la demande de rattachement, ou choisissez une autre option.' : 'Choisissez votre entreprise.' },
      { t: 'Ce que vous recrutez', ok: nDom >= 1, msg: 'Choisissez au moins un domaine.' },
      { t: 'Votre profil recruteur', ok: true, msg: '' }
    ];
    const et = ETAPES[etape - 1];
    const barres = ETAPES.map((x, i) => ({ bg: i < etape ? '#A6F26B' : 'rgba(255,255,255,.14)' }));
    const suivant = () => {
      if (!et.ok) { S({ err: 'etape' }); return; }
      if (etape === 7 && !String(titreP).trim()) S({ titreP: titreAuto });
      if (etape < NE) S({ etape: etape + 1, err: '' }); else S({ vue: 'notifs', err: '' });
    };
    const precedent = () => {
      if (etape > 1) { S({ etape: etape - 1, err: '' }); return; }
      S({ vue: st.viaFour ? 'inscription' : (has('mdp') ? 'motdepasse' : 'inscription'), err: '' });
    };

    const pct = 30 + (photo ? 10 : 0) + (emailProOk ? 10 : 0) + (telChiffres.length >= 8 ? 5 : 0) + (linkedin ? 5 : 0) + (logoVisible ? 15 : (entEtat === 'attente' ? 5 : 0)) + (nDom ? 10 : 0) + (String(titreP).trim() ? 10 : 0);
    const R0 = 2 * Math.PI * 34;

    // Orbi : aide pour le titre du profil
    const orbi = has('orbi') ? st.orbi : oui(p.orbi);
    const TITRES = [titreAuto, 'Rejoignez l’équipe Baobab Fintech : data, finance et service client', 'Chargée de recrutement · je réponds à chaque candidature'];
    const titresOrbi = TITRES.map((t) => ({ t, pick: () => S({ titreP: t, orbi: false }) }));

    const autoriser = (ok) => () => { S({ feuille: null, vue: 'pret', notifOk: ok }); };
    const entT = e0 ? e0.t : (entEtat === 'indep' ? 'Indépendante' : '');

    return {
      vOuverture: vue === 'ouverture', vBienvenue: vue === 'bienvenue', vInscription: vue === 'inscription', vCode: vue === 'code', vMdp: vue === 'motdepasse',
      vConnexion: vue === 'connexion', vOubli: vue === 'oubli', vProfil: vue === 'profil', vNotifs: vue === 'notifs', vPret: vue === 'pret',
      longA: !court && !rejoue, longB: !court && rejoue, courtA: court && !rejoue, courtB: court && rejoue,
      points, sl, s0: slide === 0, s1: slide === 1, s2: slide === 2, suivantSlide: () => S({ slide: (slide + 1) % 3 }),
      versInscription: () => S({ vue: 'inscription', mode: 'inscription', err: '' }), versConnexion: () => S({ vue: 'connexion', mode: 'connexion', err: '' }), versBienvenue: () => S({ vue: 'bienvenue', err: '' }),
      email, ecrireEmail: (e) => S({ email: val(e), err: '' }), errEmail: err === 'email', continuerEmail, emailOp: emailOk ? '1' : '.45',
      google: ouvrirFour('google'), apple: ouvrirFour('apple'), linkedin: ouvrirFour('linkedin'),
      legalCond: () => S({ feuille: 'legal', legal: 'cond' }), legalConf: () => S({ feuille: 'legal', legal: 'conf' }),
      cases, ecrireCode: (e) => S({ code: val(e).replace(/\D/g, '').slice(0, 6), err: '' }), code, errCode: err === 'code',
      remplirCode: () => S({ code: '482913', err: '' }), verifier, codeOp: code.length === 6 ? '1' : '.45',
      renvoyer: () => flash('Nouveau code envoyé à ' + (email || 'votre adresse')), modifierEmail: () => S({ vue: 'inscription', err: '' }), emailAff: email || 'votre adresse',
      mdp, ecrireMdp: (e) => S({ mdp: val(e), err: '' }), typeMdp: voirMdp ? 'text' : 'password', voirT: voirMdp ? 'Masquer' : 'Afficher',
      basculerMdp: () => S({ voirMdp: !voirMdp }), regles, errMdp: err === 'mdp', validerMdp, mdpOp: mdpOk ? '1' : '.45',
      suggererMdp: () => S({ mdp: 'Kin-Bao7-Mvu2', voirMdp: true, err: '' }), retourCode: () => S({ vue: 'code', err: '' }),
      cEmail, cMdp, ecrireCEmail: (e) => S({ cEmail: val(e), err: '' }), ecrireCMdp: (e) => S({ cMdp: val(e), err: '' }),
      connOk, connPas: !connOk, refuserConn: () => S({ err: 'conn' }), errConn: err === 'conn',
      trousseau: () => S({ cEmail: 'n.kalala@baobabfintech.cd', cMdp: 'Baobab2026', err: '' }),
      versOubli: () => S({ vue: 'oubli', oEmail: cEmail, oEnvoye: false, err: '' }),
      oEmail, ecrireOEmail: (e) => S({ oEmail: val(e), err: '' }), oEnvoye, oPas: !oEnvoye,
      envoyerLien: () => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(oEmail.trim())) { S({ err: 'oubli' }); return; } S({ oEnvoye: true, err: '' }); },
      errOubli: err === 'oubli', oEmailAff: oEmail || 'n.kalala@baobabfintech.cd', renvoyerLien: () => flash('Lien renvoyé à ' + (oEmail || 'votre adresse')),
      // profil
      etapeT: 'Étape ' + etape + ' sur ' + NE + ' · ' + et.t, barres, suivant, precedent,
      errEtape: err === 'etape', errMsg: et.msg || '', suivOp: et.ok ? '1' : '.45', suivT: etape === NE ? 'Terminer' : 'Continuer',
      e1: etape === 1, e2: etape === 2, e3: etape === 3, e4: etape === 4, e5: etape === 5, e6: etape === 6, e7: etape === 7,
      prenom, nom, ecrirePrenom: (e) => S({ prenom: val(e), err: '' }), ecrireNom: (e) => S({ nom: val(e), err: '' }),
      viaFour: !!st.viaFour, fourT: fo.t, ini: ((prenom[0] || 'N') + (nom[0] || 'K')).toUpperCase(),
      aPhoto: !!photo, sansPhoto: !photo, prendrePhoto: () => S({ feuille: 'photo' }),
      choisirPhoto: () => { S({ photo: true, feuille: null }); flash('Photo ajoutée'); }, retirerPhoto: () => S({ photo: false }),
      paysT: pa[1], paysFlag: pa[3], ouvrirPays: () => S({ feuille: 'pays', pq: '', pourInd: false }), villes, ville, villeLibre,
      autreVille: () => S({ villeLibre: true, ville: '' }), ecrireVille: (e) => S({ ville: val(e), err: '' }), autresVilles, aVille: !!ville,
      pq, ecrirePays: (e) => S({ pq: val(e) }), listePays, aucunPays: listePays.length === 0, paysTitre: pourInd ? 'Indicatif du numéro' : 'Votre pays',
      // contacts
      emailPro, ecrireEmailPro: (e) => S({ emailPro: val(e), err: '' }), emailProOk, estPerso: emailProOk && estPerso, estPro: emailProOk && !estPerso, domainePro,
      reprendreEmail: () => S({ emailPro: email && !/gmail|yahoo|hotmail|outlook|icloud/.test(email) ? email : 'n.kalala@baobabfintech.cd' }),
      tel, ecrireTel: (e) => S({ tel: val(e).replace(/[^\d ]/g, '').slice(0, 14), err: '' }), indT: ind[5], indFlag: ind[3], indPays: ind[1],
      ouvrirInd: () => S({ feuille: 'pays', pq: '', pourInd: true }), telErr: !telOk,
      wa: wa ? 'true' : 'false', waBg: wa ? '#A6F26B' : 'rgba(255,255,255,.18)', waX: wa ? '20px' : '0px', basculerWa: () => S({ wa: !wa }),
      linkedin, ecrireLinkedin: (e) => S({ linkedin: val(e) }), importerLinkedin: () => { S({ linkedin: 'linkedin.com/in/nadiakalala', poste: poste || 'Chargée de recrutement' }); flash('Profil LinkedIn relié'); },
      aLinkedin: !!linkedin, sansLinkedin: !linkedin, visOpts, visT,
      // rôle
      roles, poste, ecrirePoste: (e) => S({ poste: val(e), err: '' }), postesSugg, aRole: !!role, roleT,
      // entreprise
      eq, ecrireEnt: (e) => S({ eq: val(e) }), eVide: !eq.trim(), ePlein: !!eq.trim(), resEnt, entSugg, eRien: !!eq.trim() && resEnt.length === 0,
      aEnt: !!e0 && entEtat !== 'indep', sansEnt: (!e0 && entEtat !== 'indep'), indep: entEtat === 'indep', e0: e0 || { t: '', ab: '', c: '#0F3F37', s: '', rec: '', dom: '', offres: 0 },
      eeT: ee[0], eeC: ee[1], eeB: ee[2], entChoisie: entEtat === 'choisie', entAttente: entEtat === 'attente', entAcceptee: entEtat === 'acceptee', entCreee: entEtat === 'creee',
      emailCorrespond, emailDiff: !emailCorrespond && !!e0 && !!e0.dom,
      demander: () => S({ feuille: 'demande' }), msgDem: msgDemande, ecrireMsgDem: (e) => S({ msgDem: val(e) }), envoyerDemande,
      annulerDemande: () => { S({ entEtat: 'choisie' }); flash('Demande annulée'); },
      changerEnt: () => S({ ent: '', entEtat: '', eq: '' }), creerPage: () => S({ feuille: 'creer', nouvelle: { ...nouvelle, t: nouvelle.t || eq } }),
      jeSuisIndep: () => S({ entEtat: 'indep', ent: '', err: '' }),
      nouvelle, ecrireNouv: (e) => S({ nouvelle: { ...nouvelle, t: val(e) } }), sects, tailles, creerEnt,
      ajouterLogo: () => { S({ nouvelle: { ...nouvelle, logo: true } }); flash('Logo ajouté'); }, nLogo: !!nouvelle.logo, nSansLogo: !nouvelle.logo,
      // ce que vous recrutez
      doms, nDomT: nDom + (nDom > 1 ? ' domaines' : ' domaine'), nivs, vols,
      // profil
      titreP, ecrireTitreP: (e) => S({ titreP: val(e) }), titreAff: String(titreP).trim() || titreAuto, domListe,
      badge: badge ? 'true' : 'false', badgeBg: badge ? '#A6F26B' : 'rgba(255,255,255,.18)', badgeX: badge ? '20px' : '0px', basculerBadge: () => S({ badge: !badge }), aBadge: !!badge,
      entT, posteAff: (poste || 'Chargée de recrutement'), logoVisible, logoAttente: entEtat === 'attente', logoAb: e0 ? e0.ab : 'NK', logoC: e0 ? e0.c : '#0F3F37',
      // Orbi
      orbi, ouvrirOrbi: () => S({ orbi: true }), fermerOrbi: () => S({ orbi: false }), titresOrbi,
      // notifications et fin
      activer: () => S({ feuille: 'systeme' }), plusTard: () => S({ vue: 'pret', notifOk: false }), autoriserOui: autoriser(true), autoriserNon: autoriser(false),
      pctT: pct + ' %', ringDash: (R0 * Math.min(pct, 100) / 100).toFixed(1) + ' ' + R0.toFixed(1), nomComplet: (prenom || 'Nadia') + ' ' + (nom || 'Kalala'),
      prenomAff: prenom || 'Nadia', lieuAff: (ville || 'Kinshasa') + ', ' + pa[1],
      notifT: st.notifOk === false ? 'Notifications désactivées · à changer dans Compte › Paramètres' : 'Vous serez prévenue de chaque nouvelle candidature',
      pretEnt: entEtat === 'attente' ? 'Le logo ' + entT + ' s’affichera dès que Joseph aura validé.' : (logoVisible ? 'Le logo ' + entT + ' s’affiche sur votre profil.' : 'Vous recrutez en indépendante.'),
      modifierProfil: () => S({ vue: 'profil', etape: 1 }),
      // feuilles
      fCompte: fRaw === 'compte', fLegal: fRaw === 'legal', fPays: fRaw === 'pays', fSysteme: fRaw === 'systeme', fPhoto: fRaw === 'photo', fDemande: fRaw === 'demande', fCreer: fRaw === 'creer', fermer,
      fo, comptes, compteBtn: mode !== 'connexion', compteLien: mode === 'connexion',
      autreCompte: () => S({ feuille: null, vue: mode === 'connexion' ? 'connexion' : 'inscription' }),
      legal: (st.legal ?? p.legal ?? 'cond') === 'conf'
        ? { t: 'Politique de confidentialité', l: [{ t: 'Vous ne voyez un profil que si la personne a candidaté ou l’a rendu visible.' }, { t: 'Chaque consultation de profil est enregistrée.' }, { t: 'Le score ne tient jamais compte du nom, de l’âge, du genre ou de la photo.' }] }
        : { t: 'Conditions pour les recruteurs', l: [{ t: 'Candidater reste gratuit pour les talents : aucune offre ne peut le faire payer.' }, { t: 'Orbi recommande, vous décidez : aucun refus automatique.' }, { t: 'Chaque candidat reçoit une réponse, même courte.' }] },
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}
