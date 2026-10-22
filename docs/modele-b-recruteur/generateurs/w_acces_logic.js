class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
    // Accès sur ordinateur : ouverture, connexion, puis deux parcours d’inscription (recruteur qui rejoint, administrateur qui crée l’entreprise).
    const ORDRE_R = ['r-compte', 'r-code', 'r-photo', 'r-pays', 'r-role', 'r-entreprise', 'r-demande', 'r-recrute', 'r-profil'];
    const ORDRE_A = ['a-forfait', 'a-compte', 'a-code', 'a-role', 'a-entreprise', 'a-logo', 'a-verif', 'a-paiement', 'a-equipe'];
    const TIT = {
      'r-compte': ['Créer votre compte recruteur', 'Avec Google, Apple ou LinkedIn, ou avec votre e-mail professionnel'], 'r-code': ['Vérifiez votre e-mail', 'Un code à 6 chiffres vient de partir'], 'r-photo': ['Votre photo', 'Les talents aiment savoir qui leur répond'],
      'r-pays': ['Où travaillez-vous ?', 'Pays, ville et contacts professionnels'], 'r-role': ['Votre rôle', 'Ce que vous faites dans le recrutement'], 'r-entreprise': ['Votre entreprise', 'Si elle est sur Jumanly, demandez à la rejoindre'],
      'r-demande': ['Demande de rattachement', 'L’administrateur valide, puis le logo s’affiche sur votre profil'], 'r-recrute': ['Ce que vous recrutez', 'Les talents de ces métiers vous trouvent plus vite'], 'r-profil': ['Votre profil recruteur', 'Une accroche courte, puis c’est prêt'],
      'a-forfait': ['Choisissez une formule', 'Commencez gratuitement ou recrutez à plusieurs'], 'a-compte': ['Créer le compte de l’entreprise', 'Vous en serez l’administrateur'], 'a-code': ['Vérifiez votre e-mail', 'Un code à 6 chiffres vient de partir'],
      'a-role': ['Votre rôle', 'Administrateur : équipe, rôles, offres et formule'], 'a-entreprise': ['L’entreprise', 'Ce que verront les talents sur sa page'], 'a-logo': ['Logo et bannière', 'Ils apparaissent sur la page, les offres et les rapports PDF'],
      'a-verif': ['Vérification', 'Le badge « vérifiée » rassure les talents'], 'a-paiement': ['Paiement', 'Prépayé chaque mois, par Mobile Money ou carte'], 'a-equipe': ['Invitez votre équipe', 'Chacun reçoit un e-mail et choisit son mot de passe']
    };
    const et = prop('etape', 'connexion');
    const estA = ORDRE_A.includes(et) || et === 'a-pret';
    const ordre = estA ? ORDRE_A : ORDRE_R;
    const idx = ordre.indexOf(et);
    if (et === 'ouverture' && !this._auto) { this._auto = true; setTimeout(() => this.setState({ etape: 'connexion' }), 2400); }
    const F0 = estA ? { nom: 'Joseph Ilunga', mail: 'joseph.ilunga@baobabfintech.cd', poste: 'Responsable RH' } : { nom: 'Nadia Kalala', mail: 'nadia.kalala@baobabfintech.cd', poste: 'Chargée de recrutement' };
    const f = { ...F0, mdp: 'motdepasse', cond: false, code: '482913', photo: false, pays: 'cd', ville: 'Kinshasa', tel: '', telVis: 'equipe', linkedin: '', service: 'rh', roleR: 'recrute', ent: '', msg: 'Bonjour Joseph, je rejoins l’équipe de recrutement de Baobab Fintech comme chargée de recrutement. Merci de valider ma demande. Nadia',
      metiers: { data: true, client: true, tech: false, finance: false, marketing: false }, villes: { kin: true, lub: true, goma: false }, recrute: true, accroche: '', notif: true,
      plan: 'company', org: 'Baobab Fintech', secteur: 'fintech', taille: 'm', site: 'baobabfintech.cd', apropos: 'Nous rendons le paiement mobile simple pour les commerçants et les familles, de Kinshasa à Lubumbashi.', logo: false, bann: 'sapin', doc: false, payOp: 'mpesa', payE: '',
      invites: [['nadia.kalala@baobabfintech.cd', 'recruteur'], ['aline.mukeba@baobabfintech.cd', 'manager'], ['patrice.nzuzi@baobabfintech.cd', 'manager']], invMail: '', ...(st.f || {}) };
    const setF = (o) => S({ f: { ...f, ...o } });
    const ec = (k) => (e) => setF({ [k]: val(e) });
    const pkF = (lst, k) => lst.map(([v, t]) => ({ t, pick: () => setF({ [k]: v }), bg: f[k] === v ? '#F2EDE5' : 'transparent', col: f[k] === v ? '#0B1A1F' : '#F2EDE5', bd: f[k] === v ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));
    const multi = (lst, k) => lst.map(([v, t]) => ({ t, pick: () => setF({ [k]: { ...f[k], [v]: !f[k][v] } }), bg: f[k][v] ? '#F2EDE5' : 'transparent', col: f[k][v] ? '#0B1A1F' : '#F2EDE5', bd: f[k][v] ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));
    const sw = (on) => ({ fond: on ? '#A6F26B' : '#2A3B3E', x: on ? '20px' : '0px', etat: on ? 'true' : 'false' });
    const rq = st.rqE ?? (p.rq || '');
    const PAYS = [['cd', 'RD Congo', '+243'], ['cg', 'Congo', '+242'], ['cm', 'Cameroun', '+237'], ['ci', 'Côte d’Ivoire', '+225'], ['sn', 'Sénégal', '+221']];
    const pays = PAYS.find((x) => x[0] === f.pays) || PAYS[0];
    const METIERS = [['data', 'Data'], ['client', 'Service client'], ['tech', 'Technique'], ['finance', 'Finance'], ['marketing', 'Marketing']];
    const nomP = f.nom.split(' ')[0];
    const ini = f.nom.split(' ').map((x) => x[0] || '').join('').slice(0, 2).toUpperCase();
    const BANN = { sapin: 'linear-gradient(120deg, #14745F 0%, #0B1A1F 100%)', nuit: 'linear-gradient(120deg, #1E4E79 0%, #0B1A1F 100%)', lime: 'linear-gradient(120deg, #A6F26B 0%, #14745F 100%)', creme: 'linear-gradient(120deg, #F2EDE5 0%, #9FE8D2 100%)' };
    const PLANS = [['rhfree', 'RH Free', 'Gratuit', '1 utilisateur · 1 offre en ligne', false], ['company', 'Company', '79,9 USD par mois', '5 utilisateurs · 20 offres · ATS avancé · grilles d’évaluation · statistiques', true], ['plus', 'Company Plus', '179,9 USD par mois', '15 utilisateurs · 50 offres · plusieurs équipes · viviers partagés · export des rapports', false], ['premium', 'Company Premium', 'Sur devis', '30 utilisateurs et plus · filiales · intégrations', false]];
    const plan = PLANS.find((x) => x[0] === f.plan) || PLANS[1];
    const payant = f.plan === 'company' || f.plan === 'plus';
    const ROLESI = [['recruteur', 'Recruteur'], ['manager', 'Manager'], ['lecteur', 'Lecteur']];

    const valide = () => {
      if (et === 'r-compte' || et === 'a-compte') { if (!f.nom.trim() || !f.mail.includes('@')) return 'Écrivez votre nom et votre e-mail professionnel'; if (!f.cond) return 'Acceptez les conditions pour continuer'; }
      if ((et === 'r-code' || et === 'a-code') && String(f.code).replace(/\D/g, '').length !== 6) return 'Le code compte 6 chiffres';
      if (et === 'r-entreprise' && !f.ent) return 'Choisissez votre entreprise, ou créez sa page';
      if (et === 'a-forfait' && f.plan === 'premium') return 'Company Premium se fait sur devis : écrivez-nous depuis le formulaire';
      if (et === 'a-paiement' && payant && f.payE !== 'ok') return 'Terminez le paiement, ou commencez en RH Free';
      return '';
    };
    const suivant = () => { const m = valide(); if (m) return flash(m); if (idx >= 0 && idx < ordre.length - 1) S({ etape: ordre[idx + 1] }); else S({ etape: estA ? 'a-pret' : 'r-attente' }); };
    const precedent = () => { if (idx > 0) S({ etape: ordre[idx - 1] }); else S({ etape: 'profil' }); };
    const scene = ['connexion', 'oubli', 'profil', 'r-compte', 'r-code', 'a-forfait', 'a-compte', 'a-code'].includes(et);
    const accrocheOrbi = 'Je recrute des talents data et service client pour rendre le paiement mobile plus simple. Je réponds à chaque candidature.';
    const resultats = norm(rq).length >= 1 && 'baobab fintech'.includes(norm(rq)) ? [{ t: 'Baobab Fintech', s: 'Fintech · Kinshasa · vérifiée · 4 membres', pick: () => { setF({ ent: 'baobab' }); flash('Baobab Fintech choisie'); } }] : [];
    const accepte = et === 'r-accepte';

    return {
      et, scene, prevR: !scene && !estA && et !== 'ouverture', prevA: !scene && estA && et !== 'ouverture', ouv: et === 'ouverture', split: et !== 'ouverture', passer: () => S({ etape: 'connexion' }),
      accroche: estA || et === 'a-forfait' ? 'Prêt à bâtir l’équipe qui fera grandir votre entreprise ?' : 'Prêt à recruter les bons profils, plus vite ?',
      eConnexion: et === 'connexion', eOubli: et === 'oubli', eProfil: et === 'profil', eRcompte: et === 'r-compte' || et === 'a-compte', eAcompte: et === 'a-compte', eCode: et === 'r-code' || et === 'a-code', ePhoto: et === 'r-photo', ePays: et === 'r-pays', eRole: et === 'r-role', eEnt: et === 'r-entreprise', eDemande: et === 'r-demande', eRecrute: et === 'r-recrute', eProfilR: et === 'r-profil',
      eAttente: et === 'r-attente' || et === 'r-accepte', attente: et === 'r-attente', accepte, eForfait: et === 'a-forfait', eArole: et === 'a-role', eAent: et === 'a-entreprise', eLogo: et === 'a-logo', eVerif: et === 'a-verif', ePay: et === 'a-paiement', eEquipe: et === 'a-equipe', ePret: et === 'a-pret',
      etapeAff: idx >= 0, etapeT: idx >= 0 ? 'Étape ' + (idx + 1) + ' sur ' + ordre.length : '', pct: idx >= 0 ? Math.round(((idx + 1) / ordre.length) * 100) + '%' : '0%', titre: (TIT[et] || ['', ''])[0], sous: (TIT[et] || ['', ''])[1],
      suivant, precedent, suivT: idx === ordre.length - 1 ? 'Terminer' : 'Continuer', f, nomP, ini,
      // connexion
      cMail: st.cMail ?? 'nadia.kalala@baobabfintech.cd', ecrireCmail: (e) => S({ cMail: val(e) }), entrerHref: norm(st.cMail ?? '').startsWith('joseph') ? 'Web-J-accueil.dc.html' : 'Web-N-accueil.dc.html',
      fournisseur: () => flash('Connexion avec votre compte : Jumanly ne voit jamais votre mot de passe'), goOubli: () => S({ etape: 'oubli', envoye: false }), goProfil: () => S({ etape: 'profil' }), goConnexion: () => S({ etape: 'connexion' }),
      envoye: !!st.envoye, pasEnvoye: !st.envoye, envoyerLien: () => S({ envoye: true }),
      // vous êtes…
      choixTalent: () => flash('Les talents ont leur propre appli : candidater y est toujours gratuit'), choixR: () => S({ etape: 'r-compte' }), choixA: () => S({ etape: 'a-forfait' }), choixP: () => flash('Institutions partenaires : écrivez à infojumanly@gmail.com, nous revenons vers vous'),
      // compte
      eNom: ec('nom'), eMail: ec('mail'), eMdp: ec('mdp'), eOrg: ec('org'), eCode2: ec('code'), condSym: f.cond ? '✓' : '', condBg: f.cond ? '#A6F26B' : 'transparent', basculerCond: () => setF({ cond: !f.cond }),
      renvoyer: () => flash('Nouveau code envoyé à ' + f.mail), codeMail: f.mail,
      // photo
      aPhoto: f.photo, sansPhoto: !f.photo, importerPhoto: () => { setF({ photo: true }); flash('Photo ajoutée'); }, retirerPhoto: () => setF({ photo: false }),
      // pays et contacts
      paysP: pkF(PAYS.map((x) => [x[0], x[1]]), 'pays'), indicatif: pays[2], paysT: pays[1], eVille: ec('ville'), eTel: ec('tel'), eLinkedin: ec('linkedin'), telVisP: pkF([['personne', 'Personne'], ['equipe', 'Mon équipe'], ['entretien', 'Candidats en entretien']], 'telVis'),
      // rôle
      ePoste: ec('poste'), servicesP: pkF([['rh', 'Ressources humaines'], ['data', 'Data'], ['client', 'Service client'], ['direction', 'Direction']], 'service'),
      rolesR: [['recrute', 'Je recrute', 'Je publie des offres, je trie et je rencontre les candidats'], ['evalue', 'J’évalue', 'Je donne mon avis sur les candidats de mon équipe'], ['pilote', 'Je pilote', 'Je dirige le recrutement et l’équipe']].map(([k, t, s]) => ({ t, s, pick: () => setF({ roleR: k }), bord: f.roleR === k ? '#A6F26B' : 'rgba(255,255,255,.12)', bg: f.roleR === k ? 'rgba(166,242,107,.08)' : 'transparent' })),
      // entreprise
      rq, ecrireRq: (e) => S({ rqE: val(e) }), rVide: !rq.trim(), aRes: resultats.length > 0, sansRes: !!rq.trim() && resultats.length === 0, resultats, essayer: () => S({ rqE: 'Baobab' }),
      entChoisie: f.ent === 'baobab', entPasChoisie: f.ent !== 'baobab', changerEnt: () => setF({ ent: '' }), creerPage: () => S({ etape: 'a-forfait' }),
      eMsg: ec('msg'),
      // ce que vous recrutez
      metiersP: multi(METIERS, 'metiers'), villesP: multi([['kin', 'Kinshasa'], ['lub', 'Lubumbashi'], ['goma', 'Goma']], 'villes'), recruteSw: sw(f.recrute), basculerRecrute: () => setF({ recrute: !f.recrute }),
      eAccroche: ec('accroche'), orbiAccroche: () => { setF({ accroche: accrocheOrbi }); flash('Orbi propose une accroche : modifiez-la librement'); }, accrocheA: f.accroche || 'Votre accroche apparaîtra ici.',
      metiersT: METIERS.filter(([k]) => f.metiers[k]).map((x) => ({ t: x[1] })), posteT: f.poste || 'Votre poste',
      logoAttente: !accepte, logoOk: accepte, entT: f.ent === 'baobab' || et === 'r-attente' || accepte ? 'Baobab Fintech' : 'Votre entreprise',
      // attente
      notifSw: sw(f.notif), basculerNotif: () => setF({ notif: !f.notif }), voirAcceptation: () => S({ etape: 'r-accepte' }),
      // administrateur : formule
      plansL: PLANS.map(([k, t, prix, s, reco]) => ({ t, prix, s, reco, pick: () => (k === 'premium' ? flash('Company Premium se fait sur devis : réponse par e-mail depuis assistant@jumanly.io') : setF({ plan: k })), bord: f.plan === k ? '#A6F26B' : 'rgba(255,255,255,.12)', bg: f.plan === k ? 'rgba(166,242,107,.07)' : '#13282C', sym: f.plan === k ? '✓' : '', cbg: f.plan === k ? '#A6F26B' : 'transparent' })),
      planT: plan[1], planPrix: plan[2], payant, gratuit: !payant,
      // entreprise
      secteursP: pkF([['fintech', 'Fintech'], ['banque', 'Banque'], ['telecom', 'Télécoms'], ['energie', 'Énergie'], ['ong', 'ONG']], 'secteur'), taillesP: pkF([['s', '1 à 50'], ['m', '51 à 200'], ['l', '201 à 1 000'], ['xl', 'Plus de 1 000']], 'taille'),
      tailleT: { s: '1 à 50 personnes', m: '51 à 200 personnes', l: '201 à 1 000 personnes', xl: 'plus de 1 000 personnes' }[f.taille], secteurT: { fintech: 'Fintech', banque: 'Banque', telecom: 'Télécoms', energie: 'Énergie', ong: 'ONG' }[f.secteur],
      eSite: ec('site'), eApropos: ec('apropos'),
      // logo
      aLogo: f.logo, sansLogo: !f.logo, importerLogo: () => { setF({ logo: true }); flash('Logo ajouté'); }, bannFond: BANN[f.bann], bannP: [['sapin', 'Sapin'], ['nuit', 'Nuit'], ['lime', 'Lime'], ['creme', 'Crème']].map(([k, t]) => ({ t, fond: BANN[k], bord: f.bann === k ? '#A6F26B' : 'transparent', pick: () => setF({ bann: k }) })),
      orgIni: (f.org || 'E').split(' ').map((x) => x[0] || '').join('').slice(0, 2).toUpperCase(),
      // vérification
      aDoc: f.doc, sansDoc: !f.doc, importerDoc: () => { setF({ doc: true }); flash('Document ajouté : Jumanly le vérifie'); }, verifT: f.doc ? 'Vérification en cours' : 'Non vérifiée',
      domaine: (f.mail.split('@')[1] || 'votre domaine'),
      // paiement
      payOps: pkF([['mpesa', 'M-Pesa'], ['orange', 'Orange Money'], ['airtel', 'Airtel Money'], ['carte', 'Carte bancaire']], 'payOp'), payMm: f.payOp !== 'carte', payCarte: f.payOp === 'carte', payOpT: { mpesa: 'M-Pesa', orange: 'Orange Money', airtel: 'Airtel Money', carte: 'carte' }[f.payOp],
      payMontant: f.plan === 'plus' ? '179,90 USD' : '79,90 USD', payForm: payant && !f.payE, payAttente: payant && f.payE === 'attente', payOk: payant && f.payE === 'ok',
      payer: () => setF({ payE: 'attente' }), payConfirme: () => { setF({ payE: 'ok' }); flash('Paiement reçu : facture envoyée par e-mail'); }, payRetry: () => setF({ payE: '' }),
      enFree: () => { S({ f: { ...f, plan: 'rhfree', payE: '', invites: [] }, etape: 'a-equipe' }); flash('Vous commencez en RH Free : passez à Company quand vous voulez'); },
      // équipe
      invitesL: f.invites.map(([m, r], i) => ({ m, roles: ROLESI.map(([k, t]) => ({ t, pick: () => setF({ invites: f.invites.map((x, j) => (j === i ? [x[0], k] : x)) }), bg: r === k ? '#F2EDE5' : 'transparent', col: r === k ? '#0B1A1F' : '#F2EDE5', bd: r === k ? '#F2EDE5' : 'rgba(255,255,255,.22)' })), retirer: () => setF({ invites: f.invites.filter((x, j) => j !== i) }) })),
      eInv: ec('invMail'), ajouterInv: () => { if (!f.invMail.includes('@')) return flash('Écrivez une adresse e-mail'); if (f.invites.length >= (f.plan === 'plus' ? 14 : f.plan === 'company' ? 4 : 0)) return flash(f.plan === 'rhfree' ? 'RH Free compte 1 utilisateur : passez à Company pour inviter votre équipe' : 'Plus de place dans la formule ' + plan[1]); setF({ invites: [...f.invites, [f.invMail.trim(), 'recruteur']], invMail: '' }); },
      placesT: (f.plan === 'plus' ? 15 : f.plan === 'company' ? 5 : 1) + ' utilisateurs au plus dans la formule ' + plan[1] + ' · ' + (f.invites.length + 1) + ' avec vous',
      nInv: String(f.invites.length),
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}
