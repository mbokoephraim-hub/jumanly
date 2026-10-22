class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
    // Messages du recruteur : candidats (liés à leur candidature), talents (après une proposition), équipe Baobab.
    const CONV = {
      grace: { nom: 'Grâce Mbuyi', ini: 'GM', bg: '#DDF6EE', fg: '#14745F', cat: 'candidats', ctx: 'Analyste de données junior · Entretien', fiche: 'Recruteur-candidat.dc.html', h: '9 h 12', nl: 0,
        m: [['moi', 'Bonjour Grâce, nous aimerions vous rencontrer jeudi 22 octobre à 10 h, en visio avec Aline Mukeba. Le lien arrive par e-mail.', 'mar. 16 h 02'], ['elle', 'Bonjour Nadia, avec plaisir, je confirme jeudi 10 h.', 'mar. 17 h 40'], ['elle', 'Dois-je préparer quelque chose ?', '9 h 12']], inv: { j: 'Jeudi 22 oct.', h: '10 h', mode: 'Visio', etat: 'acceptée' } },
      benjamin: { nom: 'Benjamin Tshibangu', ini: 'BT', bg: '#E3E8FB', fg: '#2D3F8A', cat: 'candidats', ctx: 'Analyste de données junior · Proposition', fiche: 'Recruteur-candidat-benjamin.dc.html', h: '8 h 40', nl: 1,
        m: [['moi', 'Bonjour Benjamin, nous avons le plaisir de vous proposer le poste : 850 USD par mois, début le 2 novembre.', 'mar. 11 h'], ['elle', 'Merci beaucoup ! Est-il possible de commencer le 9 novembre ? Je termine un préavis.', '8 h 40']] },
      moussa: { nom: 'Moussa Diallo', ini: 'MD', bg: '#E3F3FB', fg: '#1E5E79', cat: 'candidats', ctx: 'Développeur·se Flutter · Reçue', fiche: 'Recruteur-candidat-moussa.dc.html', h: 'hier', nl: 1,
        m: [['elle', 'Bonjour, le poste Flutter est-il entièrement en télétravail ? Je suis à Lubumbashi.', 'hier']] },
      amani: { nom: 'Amani Kasongo', ini: 'AK', bg: '#FBE3E3', fg: '#8A2D2D', cat: 'candidats', ctx: 'Chargé·e de clientèle · Entretien', fiche: 'Recruteur-candidat-amani.dc.html', h: 'hier', nl: 0,
        m: [['moi', 'Patrice Nzuzi vous appellera vendredi à 9 h 30 dans l’app.', 'hier'], ['elle', 'Parfait, merci.', 'hier']] },
      joel: { nom: 'Joël Kabeya', ini: 'JK', bg: '#E8F0D8', fg: '#4F6B12', cat: 'talents', ctx: 'Proposition acceptée · Stagiaire marketing', fiche: 'Recruteur-talent-joel.dc.html', h: 'lundi', nl: 0,
        m: [['moi', 'Bonjour Joël, votre profil correspond à notre stage marketing digital. Si l’offre vous intéresse, vous pouvez candidater gratuitement.', 'lundi 10 h'], ['elle', 'Merci Nadia, je viens de candidater !', 'lundi 14 h']] },
      gloria: { nom: 'Gloria Ndaya', ini: 'GN', bg: '#EDE3FB', fg: '#5A2D8A', cat: 'talents', ctx: 'Proposition vue · Analyste de données', fiche: 'Recruteur-talent-gloria.dc.html', h: 'mardi', nl: 0,
        m: [['moi', 'Bonjour Gloria, votre expérience en analyse crédit nous intéresse pour notre poste d’analyste de données. Candidature gratuite, réponse à chaque personne.', 'mardi']], vue: true },
      nathalie: { nom: 'Nathalie Banza', ini: 'NB', bg: '#FBE3EF', fg: '#8A2D5C', cat: 'talents', ctx: 'Relation · Conseillère clientèle · Lubumbashi', fiche: 'Recruteur-talent-nathalie.dc.html', h: 'mardi', nl: 0,
        m: [['elle', 'Merci pour la connexion, Nadia. Je suis vos offres à Lubumbashi.', 'mardi']] },
      christelle: { nom: 'Christelle Mwamba', ini: 'CM', bg: '#1E4E79', fg: '#FFFFFF', cat: 'talents', ctx: 'Relation · Recruteuse chez Fleuve Banque', fiche: 'Recruteur-entreprise-fleuve.dc.html', h: 'lundi', nl: 0,
        m: [['elle', 'Bonjour Nadia, tu vas à la Journée carrière du 14 novembre ? On pourrait partager un stand.', 'lundi'], ['moi', 'Bonne idée, j’en parle à Joseph.', 'lundi']] },
      aline: { nom: 'Aline Mukeba', ini: 'AM', bg: '#1B3338', fg: '#F2EDE5', cat: 'equipe', ctx: 'Responsable data · Manager', fiche: 'Recruteur-equipe.dc.html', h: '9 h 30', nl: 2,
        m: [['elle', 'Je suis prête pour Grâce à 10 h. Tu peux me renvoyer ses réponses à la présélection ?', '9 h 28'], ['elle', 'Et j’ai mis 4 étoiles à Didier, ma note est dans sa fiche.', '9 h 30']] },
      patrice: { nom: 'Patrice Nzuzi', ini: 'PN', bg: '#1B3338', fg: '#F2EDE5', cat: 'equipe', ctx: 'Responsable service client · Manager', fiche: 'Recruteur-equipe.dc.html', h: 'hier', nl: 0,
        m: [['moi', 'Je t’ai réparti Amani et Fiston pour Lubumbashi.', 'hier'], ['elle', 'Reçu, j’appelle Amani vendredi.', 'hier']] },
      joseph: { nom: 'Joseph Ilunga', ini: 'JI', bg: '#14745F', fg: '#FFFFFF', cat: 'equipe', ctx: 'Responsable RH · Administrateur de la page', fiche: 'Recruteur-equipe.dc.html', h: 'lundi', nl: 0,
        m: [['elle', 'J’ai accepté ta demande : le logo Baobab Fintech est sur ton profil, et tu peux publier au nom de l’entreprise.', 'lundi']] }
    };
    const vue = prop('vue', 'liste');
    const sous = prop('sous', 'candidats');
    const ck = CONV[prop('conv', 'grace')] ? prop('conv', 'grace') : 'grace';
    const fRaw = has('feuille') ? st.feuille : (p.feuille && p.feuille !== 'aucune' ? p.feuille : null);
    const fermer = () => S({ feuille: null });
    const envoyes = st.envoyes || {};
    const lus = st.lus || {};

    const ligne = ([k, c]) => {
      const msgs = [...c.m, ...(envoyes[k] || [])];
      const der = msgs[msgs.length - 1];
      const nl = lus[k] ? 0 : c.nl;
      return { k, ...c, apercu: (der[0] === 'moi' ? 'Vous : ' : '') + der[1], h: der[2].includes('h') && !der[2].includes(' ') ? der[2] : c.h, aNl: nl > 0, nl: String(nl), fw: nl ? '700' : '500', acol: nl ? '#F2EDE5' : '#8FA39E',
        ouvrir: () => S({ vue: 'conv', conv: k, lus: { ...lus, [k]: true }, feuille: null, rech: false }) };
    };
    const tous = Object.entries(CONV);
    const nCat = (cat) => tous.filter(([k, c]) => c.cat === cat && !lus[k] && c.nl).reduce((a, [, c]) => a + c.nl, 0);
    const liste = tous.filter(([, c]) => c.cat === sous).map(ligne);

    // Recherche en deux temps
    const rech = has('rech') ? st.rech : !!p.recherche;
    const q = has('q') ? st.q : (p.recherche === 'texte' ? 'g' : '');
    const nq = norm(q.trim());
    const rt = st.rt || 'tout';
    const rTypes = pills([['tout', 'Tout'], ['candidats', 'Candidats'], ['talents', 'Réseau'], ['equipe', 'Équipe']], rt, 'rt');
    const resRech = !nq ? [] : tous.filter(([, c]) => (rt === 'tout' || c.cat === rt) && norm(c.nom + ' ' + c.ctx + ' ' + c.m.map((x) => x[1]).join(' ')).includes(nq)).map(ligne);

    // Conversation
    const c = CONV[ck];
    const brouillon = st.brouillon ?? (p.brouillon || '');
    const msgs = [...c.m, ...(envoyes[ck] || [])].map(([qui, t, d]) => ({ t, d, moi: qui === 'moi', elle: qui !== 'moi' }));
    const envoyer = () => { if (!brouillon.trim()) return flash('Écrivez votre message'); S({ envoyes: { ...envoyes, [ck]: [...(envoyes[ck] || []), ['moi', brouillon.trim(), 'à l’instant']] }, brouillon: '' }); };
    const MODELES = {
      candidats: [['Préparer l’entretien', 'Bonjour, rien de spécial à préparer : venez avec vos questions. Nous parlerons de vos expériences et du poste. À jeudi !'],
        ['Accuser réception', 'Bonjour, nous avons bien reçu votre candidature. Vous aurez une réponse sous 10 jours, quelle qu’elle soit.'],
        ['Demander un document', 'Bonjour, pourriez-vous ajouter votre attestation dans votre candidature ? Merci.'],
        ['Accepter un report', 'Bonjour, c’est possible : nous notons un début le 9 novembre. Je vous envoie la proposition mise à jour.']],
      talents: [['Relancer une proposition', 'Bonjour, l’offre est toujours ouverte jusqu’au 15 novembre. N’hésitez pas si vous avez une question.'], ['Remercier', 'Merci pour votre candidature, nous revenons vers vous très vite.']],
      equipe: [['Partager une fiche', 'Je te partage la fiche, dis-moi ce que tu en penses.'], ['Demander une évaluation', 'Peux-tu remplir la grille d’entretien dans la fiche avant demain ?']]
    }[c.cat];
    const modeles = MODELES.map(([t, m]) => ({ t, m, pick: () => S({ brouillon: m, feuille: null }) }));
    const joindre = c.cat === 'equipe'
      ? [{ t: 'Une fiche candidat', s: 'Grâce, Didier, Esther…', href: 'Recruteur-candidatures-toutes.dc.html' }, { t: 'Un profil du vivier', s: 'Talents · Vivier', href: 'Recruteur-talents-vivier.dc.html' }]
      : [{ t: 'Une invitation à un entretien', s: 'Jour, heure, visio ou sur place', href: 'Recruteur-planifier.dc.html' }, { t: 'Une demande de document', s: 'Attestation, diplôme, projets', go: () => S({ brouillon: 'Bonjour, pourriez-vous ajouter votre attestation dans votre candidature ? Merci.', feuille: null }) },
        { t: 'Un fichier', s: 'PDF ou image, 10 Mo au plus', go: () => { fermer(); flash('Fichier joint : fiche-de-poste.pdf'); } }];
    const joindreL = joindre.map((j) => ({ t: j.t, s: j.s, href: j.href || '', lien: !!j.href, bouton: !j.href, go: j.go || (() => {}) }));
    const menuC = [
      { t: c.cat === 'equipe' ? 'Voir l’équipe' : c.cat === 'talents' ? 'Voir le profil' : 'Ouvrir la fiche candidat', s: c.ctx, href: c.fiche, lien: true },
      { t: 'Marquer comme non lu', s: 'La pastille revient dans la liste', go: () => { S({ lus: { ...lus, [ck]: false }, vue: 'liste', sous: c.cat, feuille: null }); } },
      { t: 'Archiver la conversation', s: 'Elle reste liée à la candidature', go: () => { S({ vue: 'liste', feuille: null }); flash('Conversation archivée'); } },
      { t: 'Signaler', s: 'L’équipe Jumanly vérifie sous 24 h', go: () => { fermer(); flash('Signalement envoyé'); } }
    ].map((m) => ({ ...m, lien: !!m.lien, bouton: !m.lien, href: m.href || '', go: m.go || (() => {}) }));
    const nouveaux = [['grace', 'Grâce Mbuyi', 'Candidate · Analyste'], ['esther', 'Esther Kabila', 'Candidate · Analyste'], ['aline', 'Aline Mukeba', 'Équipe'], ['joseph', 'Joseph Ilunga', 'Équipe · Administrateur']].map(([k, t, s]) => ({ t, s,
      pick: () => (CONV[k] ? S({ vue: 'conv', conv: k, feuille: null }) : S({ feuille: null, vue: 'conv', conv: 'grace' })) }));

    const OQ = {
      repondre: { q: 'Que répondre à Benjamin ?', t: 'Il demande un début le 9 novembre. Si l’équipe data peut attendre une semaine, le modèle « Accepter un report » répond en une phrase. Vous décidez.', actT: 'Ouvrir la conversation', act: () => S({ vue: 'conv', conv: 'benjamin', orbi: false, brouillon: 'Bonjour Benjamin, c’est possible : nous notons un début le 9 novembre. Je vous envoie la proposition mise à jour.' }) },
      attente: { q: 'Qui attend une réponse de ma part ?', t: 'Trois personnes : Benjamin (date de début), Moussa (télétravail) et Aline (réponses de Grâce). Grâce demande aussi quoi préparer.', actT: 'Voir les candidats', act: () => S({ vue: 'liste', sous: 'candidats', orbi: false }) }
    };
    const ok = orbiKit(OQ, 'depuis Messages', 'Vos messages', vue === 'liste' ? 'attente' : null);

    return {
      ...ok,
      vListe: vue === 'liste', vConv: vue === 'conv',
      sousOnglets: onglets([['candidats', 'Candidats', nCat('candidats') ? String(nCat('candidats')) : ''], ['talents', 'Réseau'], ['equipe', 'Équipe', nCat('equipe') ? String(nCat('equipe')) : '']], sous, 'sous'),
      liste, rien: liste.length === 0, infoCat: { candidats: 'Chaque conversation reste liée à la candidature.', talents: 'Vos relations et les talents à qui vous avez proposé une offre.', equipe: 'Votre équipe de recrutement chez Baobab Fintech.' }[sous],
      aRech: rech, sansRech: !rech, q, aQ: q.length > 0, qVide: !nq, qPlein: !!nq, rTypes, resRech, rRien: !!nq && !resRech.length,
      ouvrirRech: () => S({ rech: true }), annulerRech: () => S({ rech: false, q: '' }), chercher: (e) => S({ q: val(e) }), viderQ: () => S({ q: '' }),
      nouveau: () => S({ feuille: 'nouveau' }), nouveaux,
      // conversation
      c, msgs, aInv: !!c.inv, inv: c.inv || { j: '', h: '', mode: '', etat: '' }, aVue: !!c.vue, brouillon, ecrire: (e) => S({ brouillon: val(e) }), envoyer,
      retourConv: () => S({ vue: 'liste', sous: c.cat, feuille: null }), retourT: { candidats: 'Candidats', talents: 'Réseau', equipe: 'Équipe' }[c.cat],
      ouvrirModeles: () => S({ feuille: 'modeles' }), ouvrirJoindre: () => S({ feuille: 'joindre' }), ouvrirMenuC: () => S({ feuille: 'menuC' }),
      fModeles: fRaw === 'modeles', fJoindre: fRaw === 'joindre', fMenuC: fRaw === 'menuC', fNouveau: fRaw === 'nouveau', fermer, modeles, joindreL, menuC,
      orbiRedige: () => S({ brouillon: ck === 'grace' ? 'Bonjour Grâce, rien de spécial à préparer : venez avec vos questions. Nous parlerons de votre stage chez Rawbank et du poste. À tout à l’heure !' : 'Bonjour, merci pour votre message. Je reviens vers vous aujourd’hui.' }),
      fab: vue === 'liste' && !rech
    };
  }
}
