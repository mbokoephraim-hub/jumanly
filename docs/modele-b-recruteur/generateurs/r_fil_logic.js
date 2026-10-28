class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
    // Fil du recruteur : talents, entreprises, Jumanly. Nadia publie en son nom ou au nom de Baobab Fintech (droit donné par Joseph, administrateur).
    const AUT = {
      rachel: { nom: 'Rachel Kanku', ini: 'RK', bg: '#DDF6EE', fg: '#14745F', s: 'Data analyst · Goma', href: 'Recruteur-talent.dc.html', type: 'talent' },
      cedric: { nom: 'Cédric Mpoyi', ini: 'CM', bg: '#E3E8FB', fg: '#2D3F8A', s: 'Développeur Flutter · Kinshasa', href: 'Recruteur-talent-cedric.dc.html', type: 'talent' },
      joel: { nom: 'Joël Kabeya', ini: 'JK', bg: '#E8F0D8', fg: '#4F6B12', s: 'Community manager · Kinshasa', href: 'Recruteur-talent-joel.dc.html', type: 'talent' },
      fleuve: { nom: 'Fleuve Banque', ini: 'FB', bg: '#1E4E79', fg: '#FFFFFF', s: 'Banque · Kinshasa', href: 'Recruteur-entreprise-fleuve.dc.html', type: 'ent', carre: true },
      kivu: { nom: 'Kivu Data Lab', ini: 'KD', bg: '#4B2D7A', fg: '#FFFFFF', s: 'Data · Goma', href: 'Recruteur-entreprise-kivu.dc.html', type: 'ent', carre: true },
      baobab: { nom: 'Baobab Fintech', ini: 'BF', bg: '#14745F', fg: '#FFFFFF', s: 'Publié par Joseph Ilunga', href: 'Recruteur-entreprise.dc.html', type: 'ent', carre: true, nous: true },
      jumanly: { nom: 'Jumanly', ini: 'J', bg: '#A6F26B', fg: '#0F3F37', s: 'Learn. Grow. Connect.', href: 'Recruteur-fil-jumanly.dc.html', type: 'ent', carre: true },
      nadia: { nom: 'Nadia Kalala', ini: 'NK', bg: '#F4C9A0', fg: '#2A1A12', s: 'Chargée de recrutement · Baobab Fintech', href: 'Recruteur-compte-profil.dc.html', type: 'moi', moi: true }
    };
    const POSTS0 = [
      { k: 'p1', a: 'rachel', d: '2 h', t: 'Mon tableau de bord des ventes de Kivu Data Lab est en ligne : 18 mois de paiements Mobile Money, lus en 30 secondes.', vis: 'graph', visT: 'Ventes · Goma · 2025-2026', j: 48, c: 6, cat: 'talents', suivi: true, tag: 'Réalisation' },
      { k: 'p2', a: 'fleuve', d: '4 h', t: 'Nous recrutons 5 analystes crédit à Kinshasa. Candidature gratuite sur Jumanly.', vis: 'offre', visT: 'Analyste crédit · CDI · Kinshasa', j: 120, c: 14, cat: 'entreprises', suivi: false, tag: 'Offre' },
      { k: 'p3', a: 'baobab', d: 'hier', t: 'Bienvenue à Joëlle, notre nouvelle stagiaire marketing, recrutée via Jumanly. Elle commence le 2 novembre.', vis: 'bienvenue', visT: 'Bienvenue Joëlle', j: 86, c: 11, cat: 'entreprises', suivi: true, tag: 'Votre entreprise' },
      { k: 'p4', a: 'cedric', d: 'hier', t: 'Kin Express passe 50 000 téléchargements. L’appli pèse 9 Mo et tient sur un réseau 2G.', vis: 'appli', visT: 'Kin Express · 50 000 téléchargements', j: 210, c: 23, cat: 'talents', suivi: false, tag: 'Réalisation' },
      { k: 'p5', a: 'jumanly', d: 'lundi', t: 'Journée carrière à Kinshasa le samedi 14 novembre : stands entreprises et entretiens sur place. Inscription des recruteurs ouverte.', vis: 'evenement', visT: 'Sam. 14 nov. · Kinshasa', j: 340, c: 41, cat: 'entreprises', suivi: true, tag: 'Événement' },
      { k: 'p6', a: 'kivu', d: 'lundi', t: 'Ce que nous avons appris en recrutant 12 data analysts à Goma : les attestations vérifiées font gagner une semaine.', vis: '', visT: '', j: 64, c: 9, cat: 'entreprises', suivi: false, tag: 'Article' },
      { k: 'p7', a: 'nadia', d: '16 oct.', t: 'Baobab Fintech recrute un·e analyste de données junior à Kinshasa. Candidature gratuite, réponse à chaque personne.', vis: 'offre', visT: 'Analyste de données junior · CDI · Kinshasa', j: 92, c: 8, cat: 'moi', suivi: true, tag: 'Votre offre', stats: '412 vues · 38 candidatures' }
    ];
    const POSTS = [...(st.miens || []), ...POSTS0];
    const aime = st.aime || {};
    const enreg = st.enreg || {};
    const caches = st.caches || {};
    const suivis = st.suivis || { baobab: true, jumanly: true, rachel: true, kivu: false, fleuve: false };
    const COMS = { p1: [['Aline Mukeba', 'AM', 'Très clair. Tu utilises Power BI ?', '1 h'], ['Rachel Kanku', 'RK', 'Oui, avec des données SQL en dessous.', '45 min']], p4: [['Kevin Lumbala', 'KL', 'Bravo ! Tu as un conseil pour alléger une appli ?', '20 h']] };

    const vue = prop('vue', 'liste');
    const sous = prop('sous', 'pourvous');
    const pk = prop('post', 'p1');
    const fRaw = has('feuille') ? st.feuille : (p.feuille && p.feuille !== 'aucune' ? p.feuille : null);
    const fermer = () => S({ feuille: null });

    const carte = (x) => {
      const a = AUT[x.a];
      return { ...x, ...a, auteur: a.nom, aut: a, rond: a.carre ? '12px' : '50%', aVis: !!x.vis, vGraph: x.vis === 'graph', vOffre: x.vis === 'offre', vBienv: x.vis === 'bienvenue', vAppli: x.vis === 'appli', vEven: x.vis === 'evenement',
        jt: (x.j + (aime[x.k] ? 1 : 0)) + '', jcol: aime[x.k] ? '#A6F26B' : '#B9CBC6', aimer: () => S({ aime: { ...aime, [x.k]: !aime[x.k] } }),
        commenter: () => S({ vue: 'publication', post: x.k, feuille: null }), ouvrir: () => S({ vue: 'publication', post: x.k, feuille: null }), menu: () => S({ feuille: 'menu', post: x.k }),
        partager: () => S({ feuille: 'partage', post: x.k }), ct: x.c + (st.comsAj && st.comsAj[x.k] ? st.comsAj[x.k].length : 0) + '', stats: x.stats || '', aStats: !!x.stats, aTag: !!x.tag,
        aSuivre: !a.moi && !a.nous && !suivis[x.a], suivre: () => { S({ suivis: { ...suivis, [x.a]: true } }); flash(`Vous suivez ${a.nom}`); } };
    };
    const liste = POSTS.filter((x) => !caches[x.a]).filter((x) => sous === 'pourvous' || (sous === 'abonnements' ? (suivis[x.a] || x.a === 'nadia') : AUT[x.a].type === 'ent')).map(carte);

    // Entreprises à suivre (onglet Entreprises)
    const ENTS = [['fleuve', 'Banque · 5 offres'], ['kivu', 'Data · 4 offres'], ['mwinda', 'Énergie · 3 offres'], ['lisanga', 'Santé · 2 offres']].map(([k, s]) => {
      const a = AUT[k] || { nom: k === 'mwinda' ? 'Mwinda Énergie' : 'Lisanga Santé', ini: k === 'mwinda' ? 'ME' : 'LS', bg: k === 'mwinda' ? '#B07A12' : '#0F6B5A', fg: '#FFFFFF' };
      return { nom: a.nom, ini: a.ini, bg: a.bg, fg: a.fg, s, href: `Recruteur-entreprise-${k}.dc.html`, suivi: !!suivis[k], bt: suivis[k] ? 'Suivie' : 'Suivre', bbg: suivis[k] ? 'transparent' : '#A6F26B', bcol: suivis[k] ? '#B9CBC6' : '#0B1A1F', bbd: suivis[k] ? 'rgba(255,255,255,.22)' : '#A6F26B',
        suivre: () => S({ suivis: { ...suivis, [k]: !suivis[k] } }) };
    });

    // Publication ouverte
    const po = carte(POSTS.find((x) => x.k === pk) || POSTS[0]);
    const comsAj = st.comsAj || {};
    const coms = [...(COMS[po.k] || []), ...(comsAj[po.k] || [])].map(([n, ini, t, d]) => ({ n, ini, t, d }));
    const com = st.com ?? '';
    const envoyerCom = () => { if (!com.trim()) return flash('Écrivez un commentaire'); S({ comsAj: { ...comsAj, [po.k]: [...(comsAj[po.k] || []), ['Nadia Kalala', 'NK', com.trim(), 'à l’instant']] }, com: '' }); };

    // Menu ···
    const pm = POSTS.find((x) => x.k === (st.post ?? pk)) || POSTS[0];
    const am = AUT[pm.a];
    const menu = am.moi ? [
      { t: 'Voir les statistiques', s: pm.stats || 'Vues et réactions', href: 'Recruteur-offre-detail.dc.html', lien: true },
      { t: 'Modifier la publication', s: 'Le texte et l’image', go: () => S({ vue: 'publier', feuille: null, texte: pm.t, auNom: 'moi' }) },
      { t: 'Supprimer', s: 'Elle disparaît du Fil', go: () => { S({ caches: { ...caches }, miens: (st.miens || []).filter((x) => x.k !== pm.k), feuille: null }); flash('Publication supprimée'); }, col: '#F4D59A' }
    ] : [
      { t: enreg[pm.k] ? 'Retirer des enregistrements' : 'Enregistrer', s: 'Retrouvez-la dans votre compte', go: () => { S({ enreg: { ...enreg, [pm.k]: !enreg[pm.k] }, feuille: null }); flash(enreg[pm.k] ? 'Retirée des enregistrements' : 'Publication enregistrée'); } },
      { t: `Voir ${am.type === 'ent' ? 'la page de' : 'le profil de'} ${am.nom}`, s: am.s, href: am.href, lien: true },
      { t: `Ne plus voir ${am.nom}`, s: 'Ses publications disparaissent de votre Fil', go: () => { S({ caches: { ...caches, [pm.a]: true }, feuille: null, vue: 'liste' }); flash(`${am.nom} n’apparaît plus dans votre Fil`); } },
      { t: 'Signaler', s: 'L’équipe Jumanly vérifie sous 24 h', go: () => { fermer(); flash('Signalement envoyé'); } }
    ];
    const menuL = menu.map((m) => ({ ...m, lien: !!m.lien, bouton: !m.lien, href: m.href || '', go: m.go || (() => {}), col: m.col || '#F2EDE5' }));
    const partage = [['Copier le lien', 'jumanly.io/fil/' + pm.k], ['Envoyer dans Messages', 'À un collègue ou un candidat'], ['WhatsApp', 'Envoyer à un contact']].map(([t, s], i) => ({ t, s,
      go: () => { fermer(); flash(i === 0 ? 'Lien copié' : i === 1 ? 'Envoyé à Aline Mukeba' : 'Ouverture de WhatsApp'); } }));

    // Publier
    const auNom = prop('auNom', 'moi');
    const MAXC = 220; // limite d’une publication (demande d’Ephraïm du 22/10)
    const ptype = prop('ptype', 'texte');
    const texte = has('texte') ? st.texte : (oui(p.rempli) ? 'Nous ouvrons un poste de développeur·se Flutter en télétravail. Si vous aimez les applis légères qui tiennent sur un réseau lent, parlons-en.' : '');
    const pOffre = st.pOffre || 'flutter';
    const OFF = [['analyste', 'Analyste de données junior'], ['clientele', 'Chargé·e de clientèle Mobile Money'], ['flutter', 'Développeur·se mobile Flutter']];
    const auNoms = [['moi', 'Nadia Kalala', 'Votre profil', 'NK', '#F4C9A0', '#2A1A12', '50%'], ['baobab', 'Baobab Fintech', 'Page de l’entreprise', 'BF', '#14745F', '#FFFFFF', '12px']].map(([k, t, s, ini, bg, fg, r]) => ({ t, s, ini, bg, fg, r,
      pick: () => S({ auNom: k }), bd: k === auNom ? '#A6F26B' : 'rgba(255,255,255,.14)', fond: k === auNom ? 'rgba(166,242,107,.08)' : 'transparent', rb: k === auNom ? '#A6F26B' : 'rgba(255,255,255,.3)', rbg: k === auNom ? '#A6F26B' : 'transparent' }));
    const ptypes = pills([['texte', 'Texte'], ['photo', 'Photo'], ['offre', 'Une offre'], ['evenement', 'Un événement']], ptype, 'ptype');
    const offresP = OFF.map(([k, t]) => ({ t, pick: () => S({ pOffre: k }), bd: k === pOffre ? '#A6F26B' : 'rgba(255,255,255,.14)', bg: k === pOffre ? 'rgba(166,242,107,.08)' : 'transparent', rb: k === pOffre ? '#A6F26B' : 'rgba(255,255,255,.3)', rbg: k === pOffre ? '#A6F26B' : 'transparent' }));
    const photo = !!st.photo;
    const publier = () => {
      if (!texte.trim()) return flash('Écrivez quelques mots avant de publier');
      if (texte.length > MAXC) return flash('220 caractères au plus : raccourcissez le texte');
      const nv = { k: 'm' + ((st.miens || []).length + 1), a: auNom === 'baobab' ? 'baobab' : 'nadia', d: 'à l’instant', t: texte.trim(), vis: ptype === 'offre' ? 'offre' : ptype === 'evenement' ? 'evenement' : ptype === 'photo' && photo ? 'bienvenue' : '', visT: ptype === 'offre' ? OFF.find((o) => o[0] === pOffre)[1] : ptype === 'evenement' ? 'Événement Baobab Fintech' : 'Photo', j: 0, c: 0, cat: 'moi', suivi: true, tag: ptype === 'offre' ? 'Votre offre' : '' };
      S({ miens: [nv, ...(st.miens || [])], vue: 'liste', sous: 'pourvous', texte: '', photo: false, ptype: 'texte' }); flash(auNom === 'baobab' ? 'Publié au nom de Baobab Fintech' : 'Publié dans le Fil');
    };

    // Recherche en deux temps
    const rech = has('rech') ? st.rech : !!p.recherche;
    const q = has('q') ? st.q : (p.recherche === 'texte' ? 'data' : '');
    const nq = norm(q.trim());
    const rt = st.rt || 'tout';
    const rTypes = pills([['tout', 'Tout'], ['publications', 'Publications'], ['personnes', 'Personnes'], ['entreprises', 'Entreprises']], rt, 'rt');
    const rPubs = (!nq || !['tout', 'publications'].includes(rt)) ? [] : POSTS.filter((x) => norm(x.t + ' ' + x.visT).includes(nq)).map((x) => ({ t: x.t, a: AUT[x.a].nom, ouvrir: () => S({ vue: 'publication', post: x.k, rech: false }) }));
    const rAut = (!nq) ? [] : Object.entries(AUT).filter(([k, a]) => !a.moi && (rt === 'tout' || (rt === 'personnes' ? a.type === 'talent' : rt === 'entreprises' ? a.type === 'ent' : false)) && norm(a.nom + ' ' + a.s).includes(nq)).map(([k, a]) => ({ ...a, rond: a.carre ? '12px' : '50%' }));
    const recents = [['Data', 'publications'], ['Fleuve Banque', 'entreprise'], ['Journée carrière', 'événement']].map(([t, d]) => ({ t, d, pick: () => S({ q: t }) }));

    const OQ = {
      idee: { q: 'Que publier pour attirer des profils Flutter ?', t: 'Les talents Flutter lisent surtout les publications concrètes : une capture de l’appli, la taille de l’équipe, le télétravail. Une phrase sur les réseaux lents parle aux développeurs d’ici.', actT: 'Préparer la publication', act: () => S({ vue: 'publier', ptype: 'offre', pOffre: 'flutter', texte: 'Nous ouvrons un poste de développeur·se Flutter en télétravail. Si vous aimez les applis légères qui tiennent sur un réseau lent, parlons-en.', orbi: false }) },
      resultats: { q: 'Comment marche ma publication du 16 octobre ?', t: '412 vues et 38 candidatures, dont 28 % venues du Fil. Elle a surtout été vue à Kinshasa, entre 19 h et 22 h.', actT: 'Voir les statistiques de l’offre', href: 'Recruteur-offre-detail.dc.html' },
      evenement: { q: 'Faut-il aller à la Journée carrière du 14 novembre ?', t: 'Elle réunit surtout des jeunes diplômés de Kinshasa : bon pour l’offre Analyste junior et le stage marketing. Les stands se réservent auprès de Jumanly par e-mail.', actT: 'Ouvrir la publication', act: () => S({ vue: 'publication', post: 'p5', orbi: false }) }
    };
    const ok = orbiKit(OQ, 'depuis le Fil', 'Votre Fil', vue === 'liste' ? 'idee' : null);
    const ameliorer = () => { if (!texte.trim()) return flash('Écrivez d’abord quelques mots'); const plus = texte.trim().replace(/\.$/, '') + '. Candidature gratuite, réponse à chaque personne.'; if (plus.length > MAXC) return flash('Plus de place : 220 caractères au plus'); S({ texte: plus }); flash('Orbi a complété le texte : relisez avant de publier'); };

    return {
      ...ok,
      vListe: vue === 'liste', vPub: vue === 'publication', vPublier: vue === 'publier',
      sousOnglets: onglets([['pourvous', 'Pour vous'], ['abonnements', 'Abonnements'], ['entreprises', 'Entreprises']], sous, 'sous'),
      sEnt: sous === 'entreprises', liste, ENTS, rien: liste.length === 0,
      ouvrirPublier: () => S({ vue: 'publier', auNom: 'moi', ptype: 'texte' }), ouvrirPublierBaobab: () => S({ vue: 'publier', auNom: 'baobab', ptype: 'texte' }),
      // publication ouverte
      po, coms, aComs: coms.length > 0, com, ecrireCom: (e) => S({ com: val(e) }), envoyerCom, retourPub: () => S({ vue: 'liste', feuille: null }),
      // feuilles
      fMenu: fRaw === 'menu', fPartage: fRaw === 'partage', fermer, menuL, partage, menuTitre: am.nom,
      // publier
      auNoms, ptypes, aOffreT: ptype === 'offre', aPhotoT: ptype === 'photo', aEvenT: ptype === 'evenement', offresP, texte, ecrireTexte: (e) => S({ texte: val(e).slice(0, MAXC) }), MAXC, nCar: texte.length + ' / ' + MAXC, carCol: texte.length > MAXC - 20 ? '#F4D59A' : '#8FA39E', resteCar: (MAXC - texte.length) + ' caractères restants',
      photo, sansPhoto: !photo, ajouterPhoto: () => S({ photo: true }), retirerPhoto: () => S({ photo: false }), publier, annulerPublier: () => S({ vue: 'liste', texte: '' }), ameliorer,
      pubOp: texte.trim() ? '1' : '.45', auNomT: auNom === 'baobab' ? 'Visible sur la page de Baobab Fintech et dans le Fil de ses abonnés.' : 'Visible par votre réseau et les talents qui suivent Baobab.',
      evenJ: 'Samedi 14 novembre', evenL: 'Baobab Fintech, Gombe',
      // recherche
      aRech: rech, sansRech: !rech, q, aQ: q.length > 0, qVide: !nq, qPlein: !!nq, rTypes, recents, rPubs, rAut, aRPubs: rPubs.length > 0, aRAut: rAut.length > 0, rRien: !!nq && !rPubs.length && !rAut.length,
      ouvrirRech: () => S({ rech: true }), annulerRech: () => S({ rech: false, q: '' }), chercher: (e) => S({ q: val(e) }), viderQ: () => S({ q: '' }),
      fab: vue === 'liste' && !rech
    };
  }
}
