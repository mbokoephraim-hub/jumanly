class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const p = this.props || {};
    const S = (o) => this.setState(o);
    const flash = (t) => { S({ toast: t }); clearTimeout(this._t); this._t = setTimeout(() => this.setState({ toast: null }), 2300); };
    const v = st.v !== undefined ? st.v : (p.variante || '');
    const PILES = { liste: ['liste'], demandes: ['liste', 'demandes'], conv: ['liste', 'conv'], infos: ['liste', 'conv', 'infos'], medias: ['liste', 'conv', 'infos', 'medias'], camera: ['liste', 'conv', 'camera'] };
    const pile = st.pile || PILES[p.ecran] || ['liste'];
    const ecran = pile[pile.length - 1];
    const sheet = st.sheet !== undefined ? st.sheet : (p.feuille || null);
    const ong = st.ong ?? p.onglet ?? 'connexions';
    const cid0 = st.cid ?? p.conv ?? 'patrick';
    const go = (e, extra) => () => S({ pile: [...pile, e], sheet: null, ...(extra || {}) });
    const retour = () => S({ pile: pile.length > 1 ? pile.slice(0, -1) : ['liste'], sheet: null, rech: false, cliche: false });
    const ouvrir = (s, extra) => () => S({ sheet: s, ...(extra || {}) });
    const fermer = () => S({ sheet: null });
    const TG = (on) => ({ bg: on ? '#A6F26B' : '#2A3A3D', x: on ? '21px' : '3px', ac: on ? 'true' : 'false' });
    const CH = (on) => ({ bg: on ? '#F2EDE5' : 'transparent', col: on ? '#0B1A1F' : '#F2EDE5', bd: on ? '#F2EDE5' : 'rgba(255,255,255,.28)' });
    const RD = (on) => ({ bd: on ? '#A6F26B' : 'rgba(255,255,255,.35)', on: on ? '1' : '0' });
    const maintenant = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

    // ---------- Conversations ----------
    const T = (de, t, h, x) => ({ de, type: 'texte', t, h, ...(x || {}) });
    const BASE = {
      patrick: { nom: 'Patrick Ilunga', type: 'c', pp: true, verif: true, on: true, statut: 'En ligne', sous: 'Analyste crédit · Fleuve Banque', nl: 2, heure: '09:42', profil: 'Personne.dc.html', cible: 'Baobab Fintech',
        msgs: [{ de: 'sys', t: 'Vous êtes connectés depuis le 12 octobre' },
          T('lui', 'Salut Grâce ! J’ai vu ton tableau de bord des ventes dans le Fil. Très propre.', '09:30'),
          T('moi', 'Merci Patrick ! J’ai validé SQL sur Jumanly ce mois-ci.', '09:34'),
          { de: 'lui', type: 'photos', ph: ['s1'], h: '09:36' },
          T('lui', 'Voilà celui qu’on utilise chez nous pour le suivi des prêts.', '09:36'),
          T('lui', 'Baobab Fintech cherche une analyste junior, tu as postulé ?', '09:41'),
          { de: 'lui', type: 'lien', t: 'jumanly.io/offres/analyste-baobab', d: 'Analyste de données junior · Baobab Fintech', h: '09:42' }],
        rep: 'Oui, j’ai postulé ! J’ai même un entretien jeudi. Merci d’avoir pensé à moi.', pro: 'Bonjour Patrick, merci pour l’information. J’ai postulé et j’ai un entretien jeudi.', court: 'Oui, entretien jeudi ! Merci.', en: 'Yes, I applied! I even have an interview on Thursday. Thanks for thinking of me.' },
      joel: { nom: 'Joël Kabeya', type: 'c', ini: 'JK', col: '#DDF6EE', lc: '#14745F', verif: false, on: false, statut: 'Vu à 08:12', sous: 'Community manager · Kinshasa', nl: 9, heure: '08:15', profil: 'Personne-joel.dc.html', cible: 'Baobab Fintech',
        msgs: [T('moi', 'Tu as fini le cours SQL ?', 'Hier'), T('lui', 'Presque !', '07:58'), T('lui', 'Les jointures me prennent la tête', '07:58'), T('lui', 'Tu as compris LEFT JOIN ?', '07:59'), T('lui', 'J’ai trouvé un exercice sur les ventes', '08:01'), { de: 'lui', type: 'photos', ph: ['s4'], h: '08:02' }, T('lui', 'C’est celui-là', '08:02'), T('lui', 'On le fait ensemble ce soir ?', '08:10'), T('lui', '19 h ?', '08:12'), T('lui', 'Je réserve la salle de la bibliothèque', '08:15')],
        rep: 'Oui, 19 h c’est parfait ! LEFT JOIN garde toutes les lignes de la première table. On en parle ce soir.', pro: 'Bonjour Joël, je suis disponible à 19 h. À ce soir.', court: 'Ok pour 19 h !', en: 'Yes, 7 pm works! See you tonight.' },
      ruth: { nom: 'Ruth Mavungu', type: 'c', ini: 'RM', col: '#5A3B1E', lc: '#FFE1A1', verif: true, on: true, statut: 'En ligne', sous: 'Comptable · Matadi', nl: 0, heure: 'Hier', profil: 'Personne-ruth-mavungu.dc.html', cible: 'Fleuve Banque',
        msgs: [T('lui', 'Tu connais quelqu’un en finance à Kinshasa ?', 'Hier'), T('moi', 'Oui ! Je t’envoie le contact de Patrick.', 'Hier'), { de: 'moi', type: 'contact', t: 'Patrick Ilunga', d: 'Analyste crédit · Fleuve Banque', ct: 'patrick', h: 'Hier' }, T('lui', 'Merci pour le contact !', 'Hier')],
        rep: 'Avec plaisir ! Dis-lui que tu viens de ma part.', pro: 'Avec plaisir, Ruth. N’hésitez pas à lui écrire de ma part.', court: 'Avec plaisir !', en: 'My pleasure! Tell him I sent you.' },
      sarah: { nom: 'Sarah Ngoy', type: 'c', ini: 'SN', col: '#1E4E79', lc: '#CFE4F7', verif: false, on: false, statut: 'Vu hier à 21:40', sous: 'Développeuse web · Lubumbashi', nl: 0, heure: 'Lun.', profil: 'Personne-sarah-ngoy.dc.html', cible: 'Mwinda Énergie',
        msgs: [T('moi', 'Coucou Sarah, tu peux me raconter ton entretien chez Mwinda ?', 'Lun.'), { de: 'lui', type: 'vocal', t: '0:24', h: 'Lun.' }],
        rep: 'Merci beaucoup pour tes conseils, ça m’aide énormément !', pro: 'Merci Sarah pour ces conseils très utiles.', court: 'Merci, super utile !', en: 'Thanks a lot for your advice, it really helps!' },
      nadia: { nom: 'Nadia Kalala', type: 'r', ini: 'NK', col: '#0F3F37', lc: '#A6F26B', verif: true, on: true, statut: 'En ligne', sous: 'Recruteuse · Baobab Fintech', nl: 1, heure: '10:05', profil: 'Personne-nadia.dc.html', cible: 'Baobab Fintech',
        msgs: [{ de: 'sys', t: 'Nadia vous écrit au sujet de votre candidature : Analyste de données junior' },
          T('lui', 'Bonjour Grâce, merci pour votre candidature. Votre profil nous intéresse.', '16 oct.'),
          T('moi', 'Bonjour Nadia, merci beaucoup pour votre retour.', '16 oct.'),
          { de: 'lui', type: 'event', lab: 'Entretien', t: 'Jeudi 22 octobre, 10 h', d: 'Gombe, siège de Baobab Fintech', h: '16 oct.' },
          T('lui', 'Pouvez-vous m’envoyer votre attestation Excel avant jeudi ?', '10:05')],
        rep: 'Bonjour Nadia, voici mon attestation Excel en pièce jointe. À jeudi 10 h. Bonne journée, Grâce', pro: 'Bonjour Madame Kalala, veuillez trouver ci-joint mon attestation Excel. Je vous confirme ma présence jeudi à 10 h. Cordialement, Grâce Mbuyi', court: 'Bonjour Nadia, attestation ci-jointe. À jeudi !', en: 'Hello Nadia, please find my Excel certificate attached. See you Thursday at 10 am. Best, Grâce' },
      moussa: { nom: 'Moussa Kanté', type: 'r', ini: 'MK', col: '#FFE1A1', lc: '#8A5A00', verif: true, on: false, statut: 'Vu à 07:50', sous: 'Responsable RH · Mwinda Énergie', nl: 0, heure: 'Hier', profil: 'Personne-moussa.dc.html', cible: 'Mwinda Énergie',
        msgs: [T('lui', 'Merci pour votre candidature. Nous revenons vers vous la semaine prochaine.', 'Hier'), T('moi', 'Merci beaucoup, bonne journée.', 'Hier')],
        rep: 'Bonjour Moussa, je reste disponible pour un échange quand vous voulez.', pro: 'Bonjour Monsieur Kanté, je reste à votre disposition pour tout complément. Cordialement.', court: 'Je reste disponible, merci !', en: 'Hello Moussa, I remain available whenever suits you.' },
      clarisse: { nom: 'Clarisse Mbala', type: 'r', ini: 'CM', col: '#CFE4F7', lc: '#1E4E79', verif: false, on: false, statut: 'Vu le 18 oct.', sous: 'Chargée de recrutement · Fleuve Banque', nl: 0, heure: '18 oct.', profil: 'Personne-clarisse.dc.html', cible: 'Fleuve Banque',
        msgs: [{ de: 'moi', type: 'doc', t: 'CV_Grace_Mbuyi_Data.pdf', d: '2 pages · 180 Ko', ext: 'PDF', h: '18 oct.' }, T('lui', 'Bien reçu, merci.', '18 oct.')],
        rep: 'Bonjour Clarisse, avez-vous des nouvelles de ma candidature ?', pro: 'Bonjour Madame Mbala, je me permets de revenir vers vous au sujet de ma candidature. Cordialement.', court: 'Des nouvelles de ma candidature ?', en: 'Hello Clarisse, any news about my application?' },
      baobab: { nom: 'Baobab Fintech', type: 'e', ini: 'BF', col: '#0F3F37', lc: '#A6F26B', rad: '14px', verif: true, on: false, statut: 'Compte entreprise', sous: 'Fintech · Kinshasa · 4 812 abonnés', nl: 2, heure: '10:20', profil: 'Entreprise.dc.html', cible: 'Baobab Fintech',
        msgs: [T('lui', 'Bienvenue dans la communauté Baobab Fintech, Grâce !', 'Lun.'), T('lui', 'Nous ouvrons nos portes aux talents data ce samedi.', '10:19'), { de: 'lui', type: 'event', lab: 'Portes ouvertes', t: 'Samedi 24 octobre, 9 h', d: 'Siège de Baobab Fintech, Gombe', h: '10:20' }],
        rep: 'Merci ! Je m’inscris pour samedi.', pro: 'Bonjour, merci pour l’invitation. Je serai présente samedi à 9 h.', court: 'Je viens samedi !', en: 'Thank you! I’ll be there on Saturday.' },
      mwinda: { nom: 'Mwinda Énergie', type: 'e', ini: 'ME', col: '#FFE1A1', lc: '#8A5A00', rad: '14px', verif: true, on: false, statut: 'Compte entreprise', sous: 'Énergie solaire · Kinshasa', nl: 0, heure: 'Lun.', profil: 'Entreprise.dc.html', cible: 'Mwinda Énergie',
        msgs: [T('lui', 'Merci de suivre Mwinda Énergie. Nos offres sont sur notre page.', 'Lun.')],
        rep: 'Merci, je regarde vos offres.', pro: 'Bonjour, merci pour votre message. Je consulte vos offres avec intérêt.', court: 'Merci !', en: 'Thanks, I’ll look at your openings.' },
      fleuve: { nom: 'Fleuve Banque', type: 'e', ini: 'FB', col: '#CFE4F7', lc: '#1E4E79', rad: '14px', verif: false, on: false, statut: 'Compte entreprise', sous: 'Banque · Kinshasa', nl: 0, heure: '12 oct.', profil: 'Entreprise.dc.html', cible: 'Fleuve Banque',
        msgs: [T('lui', 'Votre candidature a bien été reçue.', '12 oct.')],
        rep: 'Merci pour la confirmation.', pro: 'Bonjour, merci pour la confirmation de réception.', court: 'Merci !', en: 'Thank you for confirming.' }
    };
    const DEM = [
      { id: 'esther', nom: 'Esther Kabila', ini: 'EK', col: '#14745F', lc: '#C9F1E3', sous: 'Chargée RH · Baobab Fintech', profil: 'Personne-esther.dc.html', mot: 'Bonjour Grâce, j’ai vu votre portfolio, j’aimerais rester en contact.' },
      { id: 'junior', nom: 'Junior Mukendi', ini: 'JM', col: '#7A5C00', lc: '#FFF4D6', sous: 'Data analyst · Mwinda Énergie', profil: 'Personne-junior.dc.html', mot: 'On a suivi le même cours SQL !' }
    ];
    const dem = st.dem || {};
    DEM.filter((d) => dem[d.id] === 'ok').forEach((d) => { BASE[d.id] = { nom: d.nom, type: 'c', ini: d.ini, col: d.col, lc: d.lc, verif: false, on: true, statut: 'En ligne', sous: d.sous, nl: 0, heure: 'À l’instant', profil: d.profil, cible: 'Baobab Fintech', msgs: [{ de: 'sys', t: 'Vous êtes maintenant connectés' }], rep: 'Bonjour ' + d.nom.split(' ')[0] + ', merci pour la connexion !', pro: 'Bonjour, merci pour votre demande de connexion.', court: 'Merci pour la connexion !', en: 'Hi, thanks for connecting!' }; });

    const cid = BASE[cid0] ? cid0 : 'patrick';
    const add = st.add || {};
    const eff = st.eff || {};
    const lus = st.lus || (PILES[p.ecran] && p.ecran !== 'liste' && p.ecran !== 'demandes' ? [cid] : []);
    const muets = st.muets || { joel: false };
    const ephem = st.ephem || (v === 'ephem' ? { [cid]: '24 h' } : {});
    const bloques = st.bloques || (v === 'bloque' ? { [cid]: true } : {});
    const msgsDe = (id) => (eff[id] ? [] : BASE[id].msgs).concat(add[id] || []);
    const apercu = (m) => {
      if (!m) return 'Aucun message';
      const pre = m.de === 'moi' ? 'Vous : ' : '';
      const t = { texte: m.t, photos: (m.ph || []).length > 1 ? (m.ph.length + ' photos') : 'Photo', doc: 'Document · ' + m.t, contact: 'Contact · ' + m.t, event: (m.lab || 'Rendez-vous') + ' · ' + m.t, org: 'Organisation · ' + m.t, vocal: 'Note vocale · ' + m.t, lien: m.t }[m.type];
      return m.de === 'sys' ? m.t : pre + t;
    };
    const nonLus = (id) => (lus.includes(id) ? 0 : BASE[id].nl);
    const fmtN = (n) => (n > 99 ? '99+' : String(n));
    const ouvrirConv = (id) => () => S({ pile: ['liste', 'conv'], cid: id, sheet: null, lus: [...lus.filter((x) => x !== id), id], rech: false, draft: '', rec: false, q: st.q || '' });
    const avatarVals = (b, id) => ({ pp: !!b.pp, pi: !b.pp, ini: b.ini || '', col: b.col || '#1A2629', lc: b.lc || '#F2EDE5', rad: b.rad || '50%', on: b.on ? '1' : '0', verif: !!b.verif });
    const ligne = (id) => {
      const b = BASE[id]; const ms = msgsDe(id); const last = ms[ms.length - 1]; const nl = nonLus(id);
      return { id, nom: b.nom, sous: b.sous, ...avatarVals(b, id), heure: (add[id] && add[id].length) ? 'À l’instant' : b.heure, apercu: apercu(last), nl: fmtN(nl), bo: nl ? '1' : '0', fw: nl ? '700' : '500', ac: nl ? '#F2EDE5' : '#8FA39E', hc: nl ? '#A6F26B' : '#8FA39E', muet: !!muets[id], ouvrir: ouvrirConv(id) };
    };
    const TYPE = { connexions: 'c', recruteurs: 'r', entreprises: 'e' };
    const ids = Object.keys(BASE);
    const convs = ids.filter((id) => BASE[id].type === TYPE[ong]).map(ligne);
    const onglets = [['connexions', 'Connexions'], ['recruteurs', 'Recruteurs'], ['entreprises', 'Entreprises']].map(([k, t]) => {
      const n = ids.filter((id) => BASE[id].type === TYPE[k]).reduce((s, id) => s + nonLus(id), 0);
      return { t, n: fmtN(n), bo: n ? '1' : '0', fw: k === ong ? '600' : '400', col: k === ong ? '#F2EDE5' : '#9FB3AE', on: k === ong ? '1' : '0', pick: () => S({ ong: k }) };
    });
    const nbDemAtt = DEM.filter((d) => !dem[d.id]).length;

    // Recherche dans la liste
    const q = st.q ?? (v === 'liste-recherche' ? 'Baobab' : '');
    const ql = q.trim().toLowerCase();
    const resPers = ql ? ids.filter((id) => BASE[id].nom.toLowerCase().includes(ql) || BASE[id].sous.toLowerCase().includes(ql)).map(ligne) : [];
    const rf = st.rf ?? (v === 'liste-options' || v === 'liste-photos');
    const rt = st.rt ?? (v === 'liste-photos' ? 'photos' : null);
    const RT = { photos: ['Photos', 'photos'], docs: ['Documents', 'doc'], liens: ['Liens', 'lien'], contacts: ['Contacts', 'contact'], vocaux: ['Notes vocales', 'vocal'], rdv: ['Rendez-vous', 'event'] };
    const resType = [];
    if (rt) ids.forEach((id) => msgsDe(id).forEach((m) => {
      if (m.type !== RT[rt][1]) return;
      const base = { nom: BASE[id].nom, prenom: BASE[id].type === 'e' ? BASE[id].nom : BASE[id].nom.split(' ')[0], ...avatarVals(BASE[id]), h: m.h || '', t: apercu(m), ouvrir: () => S({ pile: ['liste', 'conv'], cid: id, sheet: null, lus: [...lus, id], rech: false }) };
      if (rt === 'photos') (m.ph || []).forEach((k) => resType.push({ ...base, ph: { [k]: true }, voir: () => S({ vue: { kind: 'photo', k } }) }));
      else if (!ql || (base.nom + ' ' + base.t).toLowerCase().includes(ql)) resType.push({ ...base, ph: {}, voir: base.ouvrir });
    }));
    const resMsg = [];
    if (ql) ids.forEach((id) => msgsDe(id).forEach((m) => { const txt = (m.t || '') + ' ' + (m.d || ''); if (m.de !== 'sys' && txt.toLowerCase().includes(ql)) resMsg.push({ nom: BASE[id].nom, ...avatarVals(BASE[id]), h: m.h || '', t: apercu(m), ouvrir: () => S({ pile: ['liste', 'conv'], cid: id, sheet: null, lus: [...lus, id], rech: true, rq: q, ri: null }) }); }));

    // ---------- Discussion courante ----------
    const b = BASE[cid] || BASE.patrick;
    const prenom = b.type === 'e' ? b.nom : b.nom.split(' ')[0];
    const ephC = ephem[cid] || '';
    const cur = { ...avatarVals(b), nom: b.nom, prenom, sous: b.sous, statut: b.statut, sc: b.on ? '#5FE0B8' : '#8FA39E', profil: b.profil, cible: b.cible, muet: !!muets[cid], eph: ephC || 'Désactivés', ephOn: !!ephC };
    const ms = msgsDe(cid);
    const rech = st.rech ?? (v === 'recherche');
    const rq = st.rq ?? (v === 'recherche' ? 'Baobab' : '');
    const rql = rq.trim().toLowerCase();
    const matches = rql ? ms.map((m, i) => (m.de !== 'sys' && ((m.t || '') + ' ' + (m.d || '')).toLowerCase().includes(rql) ? i : -1)).filter((i) => i >= 0) : [];
    const ri = st.ri == null ? matches.length - 1 : Math.min(st.ri, matches.length - 1);
    const play = st.play ?? -1;
    const voirPhotos = (k) => () => S({ vue: { kind: 'photo', k } });
    const msgs = ms.map((m, i) => {
      const moi = m.de === 'moi';
      const ph = {}; (m.ph || []).forEach((k) => { ph[k] = true; });
      const n = (m.ph || []).length;
      const media = ['photos', 'contact', 'event', 'org', 'lien'].includes(m.type);
      const onde = [8, 14, 22, 12, 18, 26, 10, 16, 24, 12, 8, 20, 14, 26, 18, 10, 16, 12, 8, 6].map((hh, j) => ({ h: hh + 'px', c: (i === play && j < 9) ? '#5FE0B8' : (moi ? '#C9F1E3' : '#9FB3AE') }));
      return {
        sys: m.de === 'sys', bulle: m.de !== 'sys', t: m.t || '', d: m.d || '', h: m.h || '', lab: m.lab || 'Rendez-vous', ext: m.ext || 'PDF',
        jc: m.de === 'sys' ? 'center' : (moi ? 'flex-end' : 'flex-start'),
        bg: moi ? '#1F4A42' : '#13282C', rad: moi ? '20px 20px 6px 20px' : '20px 20px 20px 6px', pad: m.type === 'photos' ? '4px 4px 6px' : '10px 13px 7px',
        hl: matches[ri] === i ? '2px' : (matches.includes(i) ? '1px' : '0px'),
        hcol: moi ? '#9FC9BD' : '#8FA39E', lu: moi ? (b.on || i < ms.length - 1 ? '· Lu' : '· Envoyé') : '', hd: !!m.hd, eph: !!m.eph,
        texte: m.type === 'texte', photos: m.type === 'photos', doc: m.type === 'doc', contact: m.type === 'contact', event: m.type === 'event', org: m.type === 'org', vocal: m.type === 'vocal', lien: m.type === 'lien',
        ph, cols: String(Math.min(n, 2) || 1), th: n > 1 ? '112px' : '160px',
        voir: m.type === 'doc' ? () => S({ vue: { kind: 'doc', t: m.t } }) : voirPhotos((m.ph || ['s1'])[0]),
        ct: m.ct ? avatarVals(BASE[m.ct] || {}) : avatarVals({ ini: (m.t || '?').split(' ').map((x) => x[0]).join('').slice(0, 2), col: '#1B3338' }),
        oc: m.oc || '#0F3F37', olc: m.olc || '#A6F26B', oi: m.oi || 'BF',
        agenda: () => flash('Ajouté à votre agenda : ' + m.t),
        jouer: () => S({ play: play === i ? -1 : i }), jl: play === i ? 'Mettre en pause' : 'Écouter la note vocale', jd: play === i ? 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z' : 'M8 5.5v13l10-6.5z', onde,
        media
      };
    });
    const bloque = !!bloques[cid];
    const rec = st.rec ?? (v === 'vocal');
    const draft = st.draft ?? (v === 'brouillon' ? 'je vous envoie l attestation demain' : '');
    const envoyerMsg = (m, extra) => { const ex = { ...m, de: 'moi', h: maintenant(), eph: !!ephC }; S({ add: { ...add, [cid]: [...(add[cid] || []), ex] }, sheet: null, draft: '', rec: false, sel: [], ...(extra || {}) }); };

    // Galerie et HD
    const galOk = st.galOk ?? (v !== 'sansacces');
    const sel = st.sel || (v === 'photos' ? ['p2', 'bn'] : []);
    const hd = !!(st.hd ?? (v === 'photos'));
    const gal = {};
    ['p2', 'bn', 's1', 'p4', 's2', 's3', 's4', 's5'].forEach((k) => { const idx = sel.indexOf(k); gal[k] = { n: idx >= 0 ? String(idx + 1) : '', bg: idx >= 0 ? '#A6F26B' : 'rgba(0,0,0,.3)', ring: idx >= 0 ? '3px' : '0px', pick: () => S({ sel: idx >= 0 ? sel.filter((x) => x !== k) : [...sel, k] }) }; });

    // Pièces jointes
    const fichiers = [['Attestation_Excel_Jumanly.pdf', '1 page · 120 Ko'], ['Releve_de_notes_L3.pdf', '3 pages · 320 Ko'], ['Diplome_Licence_Statistiques.pdf', '1 page · 410 Ko']].map(([t, d]) => ({ t, d, envoyer: () => { envoyerMsg({ type: 'doc', t, d, ext: 'PDF' }); flash('Document envoyé'); } }));
    const cvs = [['CV Data', 'Moderne · modifié hier', '#2FD3A6', 'CV_Grace_Mbuyi_Data.pdf'], ['CV Général', 'Colonne · par défaut', '#0F3F37', 'CV_Grace_Mbuyi_General.pdf'], ['CV Stage', 'Classique · brouillon', '#D9941E', 'CV_Grace_Mbuyi_Stage.pdf']].map(([t, d, c, f]) => ({ t, d, c, envoyer: () => { envoyerMsg({ type: 'doc', t: f, d: '2 pages · 180 Ko', ext: 'PDF' }); flash(t + ' envoyé'); } }));
    const lettres = [['Lettre · Baobab Fintech', 'Modifiée hier', 'Lettre_Baobab_Fintech.pdf'], ['Lettre générale', 'Modifiée le 3 oct.', 'Lettre_motivation_Grace_Mbuyi.pdf']].map(([t, d, f]) => ({ t, d, envoyer: () => { envoyerMsg({ type: 'doc', t: f, d: '1 page · 90 Ko', ext: 'PDF' }); flash('Lettre envoyée'); } }));
    const contacts = ids.filter((id) => BASE[id].type === 'c' && id !== cid).map((id) => ({ ...ligne(id), envoyer: () => { envoyerMsg({ type: 'contact', t: BASE[id].nom, d: BASE[id].sous.split(' · ')[0], ct: id }); flash('Contact partagé'); } }));
    const jour = st.jour ?? 'Ven. 23 oct.', heure = st.heure ?? '14 h', mode = st.mode ?? 'Visio';
    const jours = ['Jeu. 22 oct.', 'Ven. 23 oct.', 'Lun. 26 oct.'].map((t) => ({ t, ...CH(t === jour), pick: () => S({ jour: t }) }));
    const heures = ['10 h', '14 h', '16 h'].map((t) => ({ t, ...CH(t === heure), pick: () => S({ heure: t }) }));
    const modes = ['Visio', 'Sur place', 'Appel'].map((t) => ({ t, ...CH(t === mode), pick: () => S({ mode: t }) }));
    const orgs = [['Baobab Fintech', 'Fintech · Kinshasa', 'BF', '#0F3F37', '#A6F26B'], ['Mwinda Énergie', 'Énergie solaire · Kinshasa', 'ME', '#FFE1A1', '#8A5A00'], ['Fleuve Banque', 'Banque · Kinshasa', 'FB', '#CFE4F7', '#1E4E79']].map(([t, d, i, c, lc]) => ({ t, d, i, c, lc, envoyer: () => { envoyerMsg({ type: 'org', t, d, oi: i, oc: c, olc: lc }); flash('Organisation partagée'); } }));

    // Orbi
    const orbiAct = st.oa ?? (p.feuille === 'orbi' && v === 'rep' ? 'rep' : null);
    const enListe = ecran === 'liste' || ecran === 'demandes';
    const QL = [
      ['rep', 'Résumer mes non-lus', 'Nadia confirme l’entretien de jeudi à 10 h et attend votre attestation Excel. Patrick vous signale l’offre de Baobab Fintech. Joël propose de réviser SQL ce soir à 19 h.'],
      ['prio', 'À qui répondre d’abord ?', 'À Nadia Kalala : elle attend votre attestation Excel avant l’entretien de jeudi.'],
      ['aide', 'Écrire à un recruteur', 'Ouvrez la discussion, puis touchez l’étincelle à côté du champ : je propose un message que vous pouvez modifier.']
    ];
    const autre = !!st.oAutre;
    const fixer = (t) => { const x = t.trim(); return x ? x.charAt(0).toUpperCase() + x.slice(1).replace(/ l attestation/g, ' l’attestation') + (/[.!?]$/.test(x) ? '' : '.') : ''; };
    const QC = [
      ['rep', 'Proposer une réponse', autre ? b.pro : b.rep],
      ['pro', 'Plus professionnel', draft ? 'Bonjour ' + prenom + ', ' + fixer(draft).charAt(0).toLowerCase() + fixer(draft).slice(1) + ' Cordialement, Grâce' : b.pro],
      ['court', 'Plus court', b.court],
      ['fautes', 'Corriger les fautes', draft ? fixer(draft) : 'Écrivez d’abord votre message : Orbi corrige l’orthographe et la ponctuation.'],
      ['en', 'Traduire en anglais', b.en]
    ];
    const QA = enListe ? QL : QC;
    const qa = QA.find((x) => x[0] === orbiAct);
    const orbiActions = QA.map(([k, t]) => ({ t, ...CH(k === orbiAct), pick: () => S({ oa: k, oAutre: false }) }));

    // Paramètres de discussion
    const ephems = ['Désactivés', '24 h', '7 jours', '90 jours'].map((t) => ({ t: t === '24 h' ? '24 heures' : t, ...RD((ephC || 'Désactivés') === t), pick: () => { const val = t === 'Désactivés' ? '' : t; S({ ephem: { ...ephem, [cid]: val }, sheet: null, add: { ...add, [cid]: [...(add[cid] || []), { de: 'sys', t: val ? 'Vous avez activé les messages éphémères : ' + (t === '24 h' ? '24 heures' : t) : 'Vous avez désactivé les messages éphémères' }] } }); flash(val ? 'Messages éphémères activés' : 'Messages éphémères désactivés'); } }));
    const expAvec = !!st.expAvec;
    const exports = [[false, 'Sans les médias', 'Un fichier texte, plus léger'], [true, 'Avec les médias', 'Photos et documents dans un dossier .zip']].map(([k, t, d]) => ({ t, d, ...RD(k === expAvec), pick: () => S({ expAvec: k }) }));
    const nomFichier = 'Discussion_' + b.nom.replace(/\s+/g, '_') + (expAvec ? '.zip' : '.txt');
    const CONF = {
      bloquer: { t: 'Bloquer ' + prenom + ' ?', d: prenom + ' ne pourra plus vous écrire ni voir votre profil. ' + (b.type === 'e' ? 'L’entreprise' : 'La personne') + ' n’est pas prévenue.', b: 'Bloquer', f: () => { S({ bloques: { ...bloques, [cid]: true }, sheet: null, pile: ['liste', 'conv'] }); flash(prenom + ' est bloqué·e'); } },
      effacer: { t: 'Effacer la discussion ?', d: 'Les messages sont effacés de votre téléphone seulement. ' + prenom + ' les garde.', b: 'Effacer', f: () => { S({ eff: { ...eff, [cid]: true }, add: { ...add, [cid]: [] }, sheet: null, pile: ['liste', 'conv'] }); flash('Discussion effacée'); } }
    };
    const confK = st.confK ?? (v === 'effacer' ? 'effacer' : 'bloquer');
    const confirm = CONF[confK];

    // Médias de la discussion
    const mt = st.mt ?? (v === 'docs' ? 'docs' : (v === 'liens' ? 'liens' : 'medias'));
    const mOnglets = [['medias', 'Médias'], ['liens', 'Liens'], ['docs', 'Documents']].map(([k, t]) => ({ t, fw: k === mt ? '600' : '400', col: k === mt ? '#F2EDE5' : '#9FB3AE', on: k === mt ? '1' : '0', pick: () => S({ mt: k }) }));
    const docsConv = [['CV_Grace_Mbuyi_Data.pdf', '18 oct. · 180 Ko'], ['Attestation_Excel_Jumanly.pdf', '12 oct. · 120 Ko']].concat((add[cid] || []).filter((m) => m.type === 'doc').map((m) => [m.t, 'Aujourd’hui · ' + m.d])).map(([t, d]) => ({ t, d, voir: () => S({ vue: { kind: 'doc', t } }) }));

    // Visionneuse
    const vueSt = st.vue || null;
    const vue = {}; if (vueSt && vueSt.kind === 'photo') vue[vueSt.k] = true;

    // Caméra
    const cliche = !!st.cliche;

    // Navigation
    const ICO = {
      fil: 'M4 6h16M4 12h16M4 18h10',
      explorer: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM15.5 8.5l-2 5-5 2 2-5z',
      progression: 'M3.5 8.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3.5 12.5h17M12 11.5v2',
      formation: 'M2.5 9 12 4.5 21.5 9 12 13.5zM6.5 11.2v4.6c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.6',
      messages: 'M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5z'
    };
    const HREF = { fil: 'Fil.dc.html', explorer: 'Offres.dc.html', progression: 'Carriere.dc.html', formation: 'Formation.dc.html', messages: 'Messages.dc.html' };
    const nav = [['fil', 'Fil'], ['explorer', 'Explorer'], ['progression', 'Carrière'], ['formation', 'Formation'], ['messages', 'Messages']]
      .map(([k, t]) => ({ t, d: ICO[k], href: HREF[k], c: k === 'messages' ? '#A6F26B' : '#8FA39E', sw: k === 'messages' ? '2.1' : '1.7', dot: k === 'messages' ? '1' : '0' }));

    const vals = {
      nav, onglets, convs, ongC: ong === 'connexions',
      q, aQ: !!ql && !rt, sansQ: !ql && !rf, chercher: (e) => S({ q: e && e.target ? e.target.value : '', rf: true }), effacerQ: () => S({ q: '' }),
      focusQ: () => { if (!rf) S({ rf: true }); }, rOuvert: rf || !!ql, annulerQ: () => S({ rf: false, rt: null, q: '' }),
      rOptions: rf && !ql && !rt, rType: !!rt, rtNom: rt ? RT[rt][0] : '', rtCompte: resType.length + ' résultat' + (resType.length > 1 ? 's' : ''), viderRt: () => S({ rt: null }),
      rtPhotos: rt === 'photos' && resType.length > 0, rtListe: rt !== 'photos' && resType.length > 0, rtVide: !!rt && !resType.length, resType,
      rt_photos: () => S({ rt: 'photos', rf: true }), rt_docs: () => S({ rt: 'docs', rf: true }), rt_liens: () => S({ rt: 'liens', rf: true }), rt_contacts: () => S({ rt: 'contacts', rf: true }), rt_vocaux: () => S({ rt: 'vocaux', rf: true }), rt_rdv: () => S({ rt: 'rdv', rf: true }),
      recents: [['Baobab', 'il y a 2 h'], ['entretien', 'hier'], ['SQL', 'lun.']].map(([t, d]) => ({ t, d, pick: () => S({ q: t, rf: true }) })),
      rapides: ids.filter((id) => BASE[id].type !== 'e').map((id) => ({ ...ligne(id), prenom: BASE[id].nom.split(' ')[0] })),
      hautMsgs: rech ? '158px' : '104px', rcPhotos: () => S({ pile: [...pile, 'medias'], mt: 'medias', rech: false }), rcDocs: () => S({ pile: [...pile, 'medias'], mt: 'docs', rech: false }), rcLiens: () => S({ pile: [...pile, 'medias'], mt: 'liens', rech: false }),
      resPers, resPersVide: !!ql && !resPers.length, resMsg: resMsg.slice(0, 8), resMsgVide: !!ql && !resMsg.length,
      goDemandes: go('demandes'), nbDem: String(nbDemAtt), demO: nbDemAtt ? '1' : '0', demTexte: nbDemAtt ? 'Esther Kabila et 1 autre personne' : 'Aucune demande en attente',
      demandes: DEM.map((d) => ({ ...d, prenom: d.nom.split(' ')[0], pp: false, pi: true, rad: '50%', on: '0', verif: false, attente: !dem[d.id], ok: dem[d.id] === 'ok', non: dem[d.id] === 'non',
        accepter: () => { S({ dem: { ...dem, [d.id]: 'ok' } }); flash('Vous êtes connectés : vous pouvez écrire à ' + d.nom.split(' ')[0]); },
        refuser: () => S({ dem: { ...dem, [d.id]: 'non' } }), ecrire: () => S({ pile: ['liste', 'conv'], cid: d.id, ong: 'connexions' }) })),
      eDem: ecran === 'demandes', eConv: ecran === 'conv', eInfos: ecran === 'infos', eMedias: ecran === 'medias', eCam: ecran === 'camera',
      retour, fermer, cur, msgs, vide: !ms.length,
      goInfos: go('infos'), goMedias: () => S({ pile: [...pile.filter((x) => x !== 'medias'), 'medias'], sheet: null, mt: 'medias' }), goCamera: go('camera', { cliche: false }),
      ouvrirMenu: ouvrir('menu'), ouvrirPlus: ouvrir('plus'), ouvrirEphem: ouvrir('ephem'), ouvrirExport: ouvrir('export'),
      ouvrirBloquer: ouvrir('confirm', { confK: 'bloquer' }), ouvrirEffacer: ouvrir('confirm', { confK: 'effacer' }), confirm, confirmer: () => confirm.f(),
      ajouterRaccourci: () => { S({ sheet: null }); flash('Raccourci vers ' + prenom + ' ajouté à l’écran d’accueil'); },
      exports, exporter: () => { S({ sheet: null }); flash(nomFichier + ' enregistré dans vos fichiers'); },
      ephems,
      muetT: TG(!!muets[cid]), muetBg: muets[cid] ? 'rgba(166,242,107,.14)' : '#111D20', muetCol: muets[cid] ? '#A6F26B' : '#F2EDE5', muetLab: muets[cid] ? 'Silencieux' : 'Son activé',
      basculerMuet: () => { const on = !muets[cid]; S({ muets: { ...muets, [cid]: on } }); flash(on ? 'Mode silencieux activé' : 'Notifications réactivées'); },
      nbMedias: String(9 + (add[cid] || []).filter((m) => m.type === 'photos' || m.type === 'doc').length),
      sansRech: !rech, aRech: rech, rq, rCompte: rql ? (matches.length ? (ri + 1) + ' sur ' + matches.length : '0 résultat') : '',
      chercherConv: (e) => S({ rq: e && e.target ? e.target.value : '', ri: null }), rPrec: () => S({ ri: Math.max(0, ri - 1) }), rSuiv: () => S({ ri: Math.min(matches.length - 1, ri + 1) }),
      fermerRech: () => S({ rech: false, rq: '' }), lancerRech: () => S({ pile: ['liste', 'conv'], sheet: null, rech: true, rq: '', ri: null }),
      basMsgs: bloque ? '120px' : '84px',
      composeur: !bloque && !rec, enreg: !bloque && rec, bloque, debloquer: () => { S({ bloques: { ...bloques, [cid]: false } }); flash(prenom + ' est débloqué·e'); },
      draft, aDraft: !!draft.trim(), sansDraft: !draft.trim(), saisir: (e) => S({ draft: e && e.target ? e.target.value : '' }),
      envoyer: () => { if (draft.trim()) envoyerMsg({ type: 'texte', t: draft.trim() }); },
      enregistrer: () => S({ rec: true }), annulerVocal: () => { S({ rec: false }); flash('Note vocale supprimée'); }, envoyerVocal: () => envoyerMsg({ type: 'vocal', t: '0:07' }),
      duree: '0:07', ondeRec: [6, 12, 20, 10, 16, 24, 14, 8, 18, 26, 12, 20, 10, 16, 22, 8, 14, 10, 6, 4].map((h) => ({ h: h + 'px' })),
      ouvrirJoindre: ouvrir('joindre'), versJoindre: ouvrir('joindre'),
      goDocs: ouvrir('docs'), goCv: ouvrir('cv'), goLettre: ouvrir('lettre', { lettreO: false }), goContact: ouvrir('contact'), goAgenda: ouvrir('agenda'), goOrg: ouvrir('org'),
      galOk, galNon: !galOk, autoriserGal: () => S({ galOk: true }), gal, aSel: !!sel.length, selTexte: sel.length ? sel.length + ' choisie' + (sel.length > 1 ? 's' : '') : 'Touchez pour choisir',
      selEnvoi: sel.length > 1 ? sel.length + ' photos' : '1 photo', viderSel: () => S({ sel: [] }),
      hdBg: hd ? '#A6F26B' : 'transparent', hdCol: hd ? '#0B1A1F' : '#F2EDE5', hdBd: hd ? '#A6F26B' : 'rgba(255,255,255,.3)', basculerHd: () => S({ hd: !hd }),
      envoyerPhotos: () => { envoyerMsg({ type: 'photos', ph: sel.slice(0, 4), hd }); flash((sel.length > 1 ? sel.length + ' photos envoyées' : 'Photo envoyée') + (hd ? ' en HD' : '')); },
      fichiers, cvs, lettres, contacts, jours, heures, modes, orgs,
      lettreOrbi: !!st.lettreO, orbiLettre: () => S({ lettreO: true }), envoyerLettreOrbi: () => { envoyerMsg({ type: 'doc', t: 'Lettre_' + b.cible.replace(/\s+/g, '_') + '.pdf', d: '1 page · 85 Ko', ext: 'PDF' }, { lettreO: false }); flash('Lettre envoyée'); },
      rdvTexte: jour + ', ' + heure, envoyerRdv: () => { envoyerMsg({ type: 'event', lab: 'Rendez-vous proposé', t: jour + ', ' + heure, d: mode }); flash('Proposition de rendez-vous envoyée'); },
      cliche, sansCliche: !cliche, prendre: () => S({ cliche: true }), retourner: () => flash('Caméra avant'), camVersGalerie: () => S({ pile: pile.slice(0, -1), sheet: 'joindre' }),
      legende: st.legende || '', saisirLegende: (e) => S({ legende: e && e.target ? e.target.value : '' }),
      envoyerCliche: () => { const leg = (st.legende || '').trim(); const extra = leg ? [{ type: 'texte', t: leg, de: 'moi', h: maintenant() }] : []; S({ add: { ...add, [cid]: [...(add[cid] || []), { type: 'photos', ph: ['p2'], hd, de: 'moi', h: maintenant() }, ...extra] }, pile: pile.slice(0, -1), cliche: false, legende: '' }); flash('Photo envoyée' + (hd ? ' en HD' : '')); },
      aVue: !!vueSt, vuePhoto: !!vueSt && vueSt.kind === 'photo', vueDoc: !!vueSt && vueSt.kind === 'doc', vue,
      vueTitre: vueSt && vueSt.kind === 'doc' ? vueSt.t : b.nom, vueSous: vueSt && vueSt.kind === 'doc' ? 'Document PDF' : 'Photo · octobre',
      fermerVue: () => S({ vue: null }), vueTransferer: () => { S({ vue: null, sheet: 'nouveau' }); }, vueEnregistrer: () => { S({ vue: null }); flash('Enregistré dans votre galerie'); },
      ouvrirNouveau: ouvrir('nouveau'), toutes: ids.map(ligne),
      ouvrirOrbi: ouvrir('orbi', { oa: null }), ouvrirOrbiEcrire: ouvrir('orbi', { oa: null, oAutre: false }),
      orbiSous: enListe ? 'Vos messages' : 'Vous aide à écrire à ' + prenom, orbiDraft: !enListe && !!draft.trim(),
      orbiActions, orbiRep: !!qa, orbiTexte: qa ? qa[2] : '', orbiUtilisable: !!qa && !enListe && !(qa[0] === 'fautes' && !draft),
      orbiUtiliser: () => { if (qa) S({ draft: qa[2], sheet: null, oa: null }); }, orbiAutre: () => S({ oAutre: !autre, oa: 'rep' }),
      sheetOuverte: !!sheet, sJoindre: sheet === 'joindre', sDocs: sheet === 'docs', sCv: sheet === 'cv', sLettre: sheet === 'lettre', sContact: sheet === 'contact', sAgenda: sheet === 'agenda', sOrg: sheet === 'org',
      sMenu: sheet === 'menu', sPlus: sheet === 'plus', sEphem: sheet === 'ephem', sExport: sheet === 'export', sConfirm: sheet === 'confirm', sNouveau: sheet === 'nouveau', sOrbi: sheet === 'orbi',
      mOnglets, mtMedias: mt === 'medias', mtLiens: mt === 'liens', mtDocs: mt === 'docs', docsConv,
      aToast: !!st.toast, toast: st.toast || ''
    };
    ['s1', 'p2', 's2', 'bn', 'p4', 's3', 's4', 's5', 'p3'].forEach((k) => { vals['voir_' + k] = voirPhotos(k); });
    return vals;
  }
}
