class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
    // Page entreprise vue par une recruteuse : la sienne (Baobab Fintech) ou une autre.
    const E = {
      baobab: { nom: 'Baobab Fintech', ini: 'BF', bg: '#14745F', sect: 'Fintech · paiement mobile', ville: 'Kinshasa · Lubumbashi', taille: '120 personnes', nous: true, abonnes: '2 140',
        desc: 'Baobab Fintech rend le paiement mobile simple pour 2 millions de clients en RD Congo : transferts, épargne et paiement des marchands.',
        offres: [['Analyste de données junior', 'Kinshasa · CDI', 'Recruteur-offre-detail.dc.html'], ['Chargé·e de clientèle Mobile Money', 'Lubumbashi · CDI', 'Recruteur-offres-encours.dc.html'], ['Développeur·se mobile Flutter', 'Kinshasa · télétravail', 'Recruteur-offres-encours.dc.html']],
        equipe: [['JI', 'Joseph Ilunga', 'Responsable RH · administrateur'], ['NK', 'Nadia Kalala', 'Chargée de recrutement (vous)'], ['AM', 'Aline Mukeba', 'Responsable data'], ['PN', 'Patrice Nzuzi', 'Responsable service client']],
        pubs: [['Bienvenue à Joëlle, notre nouvelle stagiaire marketing, recrutée via Jumanly.', 'hier', 'Recruteur-fil-publication.dc.html']] },
      fleuve: { nom: 'Fleuve Banque', ini: 'FB', bg: '#1E4E79', sect: 'Banque', ville: 'Kinshasa', taille: '800 personnes', abonnes: '9 300',
        desc: 'Banque de détail présente dans 14 villes de RD Congo.', offres: [['Analyste crédit', 'Kinshasa · CDI · 5 postes', ''], ['Conseiller·e clientèle', 'Matadi · CDI', '']], equipe: [], pubs: [['Nous recrutons 5 analystes crédit à Kinshasa.', 'aujourd’hui', 'Recruteur-fil-entreprises.dc.html']] },
      kivu: { nom: 'Kivu Data Lab', ini: 'KD', bg: '#4B2D7A', sect: 'Data et études', ville: 'Goma', taille: '35 personnes', abonnes: '1 800',
        desc: 'Bureau d’études data pour les ONG et les entreprises de l’Est.', offres: [['Data analyst', 'Goma · CDI', ''], ['Stagiaire statistique', 'Goma · Stage', '']], equipe: [], pubs: [['Ce que nous avons appris en recrutant 12 data analysts à Goma.', 'lundi', 'Recruteur-fil-entreprises.dc.html']] },
      mwinda: { nom: 'Mwinda Énergie', ini: 'ME', bg: '#B07A12', sect: 'Énergie solaire', ville: 'Kinshasa', taille: '200 personnes', abonnes: '3 100',
        desc: 'Kits solaires pour les foyers et les petits commerces.', offres: [['Technicien·ne solaire', 'Kinshasa · CDI', ''], ['Commercial·e terrain', 'Kikwit · CDI', '']], equipe: [], pubs: [] },
      lisanga: { nom: 'Lisanga Santé', ini: 'LS', bg: '#0F6B5A', sect: 'Santé', ville: 'Kinshasa', taille: '60 personnes', abonnes: '1 200',
        desc: 'Réseau de centres de santé de proximité.', offres: [['Infirmier·ère', 'Kinshasa · CDI', '']], equipe: [], pubs: [] },
      jumanly: { nom: 'Jumanly', ini: 'J', bg: '#A6F26B', fg: '#0F3F37', sect: 'Plateforme · une plateforme développée par The Growth Lab', ville: 'Afrique', taille: '', abonnes: '', jum: true,
        desc: 'Learn. Grow. Connect. Se former, enrichir son profil, candidater et être recruté. Contact : assistant@jumanly.io.', offres: [], equipe: [], pubs: [['Journée carrière à Kinshasa le samedi 14 novembre.', 'lundi', 'Recruteur-fil-publication.dc.html']] }
    };
    // Membres : toute personne qui indique travailler ici dans son expérience. L’entreprise est prévenue et peut confirmer.
    // [clé, nom, initiales, fond, texte, rôle, confirmé, page de profil]
    const MB = {
      baobab: [['joseph', 'Joseph Ilunga', 'JI', '#14745F', '#FFFFFF', 'Responsable RH · administrateur', true, 'Recruteur-equipe.dc.html'], ['aline', 'Aline Mukeba', 'AM', '#2A3B3E', '#F2EDE5', 'Responsable data', true, 'Recruteur-equipe.dc.html'], ['patrice', 'Patrice Nzuzi', 'PN', '#2A3B3E', '#F2EDE5', 'Responsable service client', true, 'Recruteur-equipe.dc.html'], ['joelle', 'Joëlle Kasongo', 'JK', '#F9E3C8', '#8A4B12', 'Stagiaire marketing digital', true, ''], ['grace', 'Grâce Mbuyi', 'GM', '#E3E8FB', '#2D3F8A', 'Analyste de données · depuis septembre', false, '']],
      fleuve: [['christelle', 'Christelle Mwamba', 'CM', '#1E4E79', '#FFFFFF', 'Recruteuse', true, ''], ['nathalie', 'Nathalie Banza', 'NB', '#FBE3EF', '#8A2D5C', 'Conseillère clientèle · Lubumbashi', true, 'Recruteur-talent-nathalie.dc.html'], ['gloria', 'Gloria Ndaya', 'GN', '#EDE3FB', '#5A2D8A', 'Analyste crédit', false, 'Recruteur-talent-gloria.dc.html'], ['didier', 'Didier Mbala', 'DM', '#2A3B3E', '#F2EDE5', 'Directeur des risques', true, ''], ['sarah', 'Sarah Lukusa', 'SL', '#2A3B3E', '#F2EDE5', 'Chargée de conformité', false, '']],
      kivu: [['tresor', 'Trésor Banza', 'TB', '#4B2D7A', '#FFFFFF', 'Responsable RH', true, ''], ['esther', 'Esther Kahindo', 'EK', '#2A3B3E', '#F2EDE5', 'Data analyst', true, ''], ['moise', 'Moïse Bahati', 'MB', '#2A3B3E', '#F2EDE5', 'Statisticien', false, '']],
      mwinda: [['joel', 'Joël Kabeya', 'JK', '#E8F0D8', '#4F6B12', 'Community manager', false, 'Recruteur-talent-joel.dc.html'], ['ornella', 'Ornella Kazadi', 'OK', '#B07A12', '#FFFFFF', 'Chargée RH', true, ''], ['benoit', 'Benoît Mukendi', 'BM', '#2A3B3E', '#F2EDE5', 'Technicien solaire', true, '']],
      lisanga: [['rose', 'Rose Kanku', 'RK', '#2A3B3E', '#F2EDE5', 'Infirmière', true, ''], ['paul', 'Paul Tshibangu', 'PT', '#2A3B3E', '#F2EDE5', 'Médecin', false, '']],
      jumanly: []
    };
    // Réseau de Nadia : ses collègues, et Christelle, Nathalie, Joël
    const RES0 = { joseph: 'relation', aline: 'relation', patrice: 'relation', joelle: 'relation', christelle: 'relation', nathalie: 'relation', joel: 'relation' };
    const k = E[prop('ent', 'baobab')] ? prop('ent', 'baobab') : 'baobab';
    const e = E[k];
    const rel = st.rel || RES0;
    const mb = MB[k].map(([mk, nom, ini, bg, fg, r, conf, h0]) => { const href = h0 || `Recruteur-personne-${mk}.dc.html`; const et = rel[mk] || ''; return { k: mk, nom, ini, bg, fg, r, conf, href, aLien: true, sansLien: false, et,
      confT: conf ? 'Confirmé par ' + e.nom : 'Indiqué par la personne', confCol: conf ? '#A6F26B' : '#8FA39E', aConf: conf,
      bt: et === 'relation' ? 'Relation' : et === 'attente' ? 'En attente' : 'Se connecter', bbg: et ? 'transparent' : '#A6F26B', bcol: et ? '#B9CBC6' : '#0B1A1F', bbd: et ? 'rgba(255,255,255,.22)' : '#A6F26B',
      connecter: () => { if (et === 'relation') return; if (!et && (st.env ?? 4) >= 50) return flash('Limite atteinte : 50 invitations par jour'); S({ rel: { ...rel, [mk]: et === 'attente' ? undefined : 'attente' }, env: (st.env ?? 4) + (et ? 0 : 1) }); if (!et) flash('Invitation envoyée à ' + nom.split(' ')[0]); } }; });
    const duReseau = mb.filter((m) => RES0[m.k] === 'relation');
    const autres = mb.filter((m) => RES0[m.k] !== 'relation');
    const envoyees = st.env ?? 4; const reste = Math.max(0, 50 - envoyees);
    const aInviter = mb.filter((m) => !m.et);
    const lot = aInviter.slice(0, reste);
    const prenoms = duReseau.map((m) => m.nom.split(' ')[0]);
    const nomsR = prenoms.length <= 2 ? prenoms.join(' et ') : prenoms.slice(0, 2).join(', ') + ' et ' + (prenoms.length - 2) + (prenoms.length - 2 > 1 ? ' autres' : ' autre');
    const nR = duReseau.length;
    const reseauT = e.nous ? nomsR + ' : ' + nR + ' collègues de votre réseau' : nR + (nR > 1 ? ' membres de votre réseau travaillent ici' : ' membre de votre réseau travaille ici');
    const suivi = st.suivi ?? (k === 'jumanly');
    const onglet = prop('onglet', 'apropos');
    return {
      e: { ...e, fg: e.fg || '#FFFFFF', aTaille: !!e.taille, aAbonnes: !!e.abonnes, offres: e.offres.map(([t, s, href]) => ({ t, s, href: href || `Recruteur-entreprise-${k}-offre.dc.html`, propre: !!href })), equipe: e.equipe.map(([ini, nom, r]) => ({ ini, nom, r })), pubs: e.pubs.map(([t, d, href]) => ({ t, d, href })) },
      nous: !!e.nous, autre: !e.nous, aOffres: e.offres.length > 0, sansOffres: e.offres.length === 0, aEquipe: e.equipe.length > 0, aPubs: e.pubs.length > 0, sansPubs: e.pubs.length === 0,
      ongletsE: onglets([['apropos', 'À propos'], ['membres', 'Membres', mb.length ? String(mb.length) : ''], ['offres', 'Offres', String(e.offres.length)], ['publications', 'Publications']], onglet, 'onglet'),
      oApropos: onglet === 'apropos', oMembres: onglet === 'membres',
      aReseau: nR > 0, reseauT, avsR: duReseau.slice(0, 3).map((m, i) => ({ ini: m.ini, bg: m.bg, fg: m.fg, ml: i ? '-8px' : '0px' })), voirMembres: () => S({ onglet: 'membres' }),
      duReseau, autres, autresT: nR ? 'Autres membres' : 'Membres', aDuReseau: nR > 0, aAutres: autres.length > 0, sansMembres: mb.length === 0, aMembresL: mb.length > 0, nMembres: mb.length,
      aInviter: aInviter.length > 0, toutInvite: mb.length > 0 && aInviter.length === 0, inviterT: aInviter.length === 1 ? 'Se connecter au membre restant' : 'Se connecter aux ' + aInviter.length + ' membres', nInv: aInviter.length,
      inviterTous: () => S({ feuille: 'tous' }), fTous: (has('feuille') ? st.feuille : p.feuille) === 'tous', fermer: () => S({ feuille: null }),
      confirmerTous: () => { if (!lot.length) return flash('Limite atteinte : 50 invitations par jour'); const r2 = { ...rel }; lot.forEach((m) => { r2[m.k] = 'attente'; }); S({ rel: r2, feuille: null, env: envoyees + lot.length }); flash(lot.length > 1 ? lot.length + ' invitations envoyées : chacun accepte ou non' : 'Invitation envoyée'); },
      resteT: 'Au plus 50 invitations par jour : il vous en reste ' + reste + ' aujourd’hui.',
 oOffres: onglet === 'offres', oPubs: onglet === 'publications',
      suivi, suivreT: suivi ? 'Suivie' : 'Suivre', sBg: suivi ? 'transparent' : '#A6F26B', sCol: suivi ? '#F2EDE5' : '#0B1A1F', sBd: suivi ? 'rgba(255,255,255,.25)' : '#A6F26B',
      suivre: () => { S({ suivi: !suivi }); if (!suivi) flash(`Vous suivez ${e.nom} : ses publications arrivent dans votre Fil`); },
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}
