class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
    // Compte de Nadia Kalala, recruteuse rattachée à Baobab Fintech (formule Company gérée par Joseph Ilunga sur le web).
    const vue = prop('vue', 'menu');
    const fRaw = has('feuille') ? st.feuille : (p.feuille && p.feuille !== 'aucune' ? p.feuille : null);
    const fermer = () => S({ feuille: null });
    const aller = (v) => () => S({ vue: v, feuille: null });
    const retour = () => S({ vue: 'menu', feuille: null });

    // ---------- Menu ----------
    const G = (titre, items) => ({ titre, items: items.map(([t, s, cible, ic]) => ({ t, s, href: cible.endsWith('.html') ? cible : '', lien: cible.endsWith('.html'), bouton: !cible.endsWith('.html'), go: cible.endsWith('.html') ? () => {} : aller(cible), ic })) });
    const groupes = [
      G('Mon activité', [['Mon profil recruteur', 'Ce que voient les talents', 'profil', 'oeil'], ['Mes statistiques', 'Réponses, délais, entretiens', 'stats', 'tri'], ['Publications enregistrées', '2 publications', 'enregistres', 'signet']]),
      G('Baobab Fintech', [['Page de l’entreprise', 'Vérifiée · administrée par Joseph Ilunga', 'Recruteur-entreprise.dc.html', 'bat'], ['Équipe de recrutement', '4 personnes', 'equipe', 'equipe'], ['Formule et usage', 'Company · gérée par l’administrateur', 'formule', 'carte']]),
      G('Réglages', [['Notifications', 'Candidatures, entretiens, messages', 'notifs', 'cloche'], ['Confidentialité et données', 'Contacts, journal des consultations', 'confid', 'cle'], ['Modèles de messages', '8 modèles', 'modeles', 'note'], ['Langue', 'Français', 'langue', 'reglage']]),
      G('Aide', [['Aide et contact', 'assistant@jumanly.io', 'aide', 'aide']])
    ];

    // ---------- Profil recruteur ----------
    const accroche = st.accroche ?? 'Je recrute les talents data et service client de Baobab Fintech. Je réponds à chaque candidature sous 10 jours.';
    const visTel = st.visTel ?? 'entretien';
    const profil = {
      offres: [['Analyste de données junior', 'Kinshasa · 38 candidatures', 'Recruteur-offre-detail.dc.html'], ['Chargé·e de clientèle Mobile Money', 'Lubumbashi · 52 candidatures', 'Recruteur-offres-encours.dc.html'], ['Développeur·se mobile Flutter', 'Kinshasa · télétravail · 9 candidatures', 'Recruteur-offres-encours.dc.html']].map(([t, s, href]) => ({ t, s, href })),
      domaines: ['Data', 'Service client', 'Mobile', 'Marketing'].map((t) => ({ t })),
      contacts: [['E-mail professionnel', 'n.kalala@baobabfintech.cd', 'Visible par tous'], ['Téléphone', '+243 81 234 56 78', visTel === 'entretien' ? 'Visible par les candidats en entretien' : 'Visible par votre équipe seulement'], ['WhatsApp', 'Même numéro', 'Visible par les candidats en entretien'], ['LinkedIn', 'linkedin.com/in/nadia-kalala', 'Visible par tous']].map(([t, v, s]) => ({ t, v, s }))
    };
    const visOpts = [['entretien', 'Candidats en entretien'], ['equipe', 'Équipe seulement']].map(([k, t]) => ({ t, pick: () => S({ visTel: k }), bg: k === visTel ? '#F2EDE5' : 'transparent', col: k === visTel ? '#0B1A1F' : '#F2EDE5', bd: k === visTel ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));
    const recrute = st.recrute ?? true;

    // ---------- Statistiques ----------
    const stats = { tuiles: [['170', 'candidatures reçues · 30 jours'], ['6 j', 'délai moyen de première réponse'], ['94 %', 'candidats ayant reçu une réponse'], ['7', 'entretiens menés']].map(([b, t]) => ({ b, t })),
      etapes: [['Reçues', 170, '100%'], ['Présélection', 54, '32%'], ['Entretien', 7, '12%'], ['Proposition', 1, '4%'], ['Recrutées', 1, '3%']].map(([t, n, w]) => ({ t, n: String(n), w })) };

    // ---------- Réglages ----------
    const NOTIFS0 = { cand: true, fort: true, ent: true, msg: true, equipe: true, resume: false };
    const notifs = st.notifs || NOTIFS0;
    const notifsL = [['cand', 'Nouvelle candidature', 'Une notification groupée par heure'], ['fort', 'Profil à fort potentiel', 'Score de 85 % et plus'], ['ent', 'Rappel d’entretien', '1 h avant'], ['msg', 'Nouveau message', 'Candidats et équipe'], ['equipe', 'Activité de l’équipe', 'Notes, évaluations, répartitions'], ['resume', 'Résumé par e-mail', 'Chaque lundi à 8 h']]
      .map(([k, t, s]) => ({ t, s, pick: () => S({ notifs: { ...notifs, [k]: !notifs[k] } }), fond: notifs[k] ? '#A6F26B' : '#2A3B3E', x: notifs[k] ? '20px' : '0px', etat: notifs[k] ? 'true' : 'false' }));
    const MODELES = [['Accuser réception', 'Envoyé à la main'], ['Inviter à un entretien', 'Avec jour, heure et lien'], ['Préparer l’entretien', ''], ['Demander un document', ''], ['Ne pas retenir · profil proche', 'Avec un cours gratuit conseillé'], ['Ne pas retenir · profil éloigné', ''], ['Faire une proposition', 'Salaire et date de début'], ['Relancer une proposition', 'Une seule fois']].map(([t, s]) => ({ t, s: s || 'Modèle de Baobab Fintech', ouvrir: () => S({ feuille: 'modele', modele: t }) }));
    const langue = st.langue || 'fr';
    const langues = [['fr', 'Français', 'Langue actuelle'], ['en', 'English', 'Bientôt disponible']].map(([k, t, s]) => ({ t, s, pick: () => (k === 'en' ? flash('L’anglais arrive bientôt') : S({ langue: k })), sym: k === langue ? '✓' : '' }));

    // Publications enregistrées
    const enreg = (st.enregR || ['p5', 'p6']).map((k) => ({ k, t: k === 'p5' ? 'Journée carrière à Kinshasa le samedi 14 novembre' : 'Ce que nous avons appris en recrutant 12 data analysts à Goma', a: k === 'p5' ? 'Jumanly' : 'Kivu Data Lab',
      href: 'Recruteur-fil-publication.dc.html', retirer: () => { S({ enregR: (st.enregR || ['p5', 'p6']).filter((x) => x !== k) }); flash('Retirée des enregistrements'); } }));


    // ---------- Équipe (lecture ; l’administrateur la gère sur le web) ----------
    const equipe = [['JI', 'Joseph Ilunga', 'Responsable RH', 'Administrateur', '#14745F', 'Recruteur-conversation-joseph.dc.html', 'Gère la page, l’équipe et la formule'],
      ['NK', 'Nadia Kalala (vous)', 'Chargée de recrutement', 'Recruteuse', '#F4C9A0', 'Recruteur-compte-profil.dc.html', 'Suit 112 candidatures'],
      ['AM', 'Aline Mukeba', 'Responsable data', 'Manager', '#1B3338', 'Recruteur-conversation-equipe.dc.html', 'Analyste de données · 3 dossiers'],
      ['PN', 'Patrice Nzuzi', 'Responsable service client', 'Manager', '#1B3338', 'Recruteur-messages-equipe.dc.html', 'Chargé·e de clientèle · 2 dossiers']]
      .map(([ini, nom, role, droit, bg, href, s]) => ({ ini, nom, role, droit, bg, fg: bg === '#F4C9A0' ? '#2A1A12' : '#F2EDE5', href, s, dcol: droit === 'Administrateur' ? '#A6F26B' : droit === 'Recruteuse' ? '#9FE8D2' : '#B9CBC6' }));
    const DROITS = [['Administrateur', 'Page, équipe, formule, toutes les offres'], ['Recruteuse', 'Publie, trie, planifie, répond, publie au nom de l’entreprise'], ['Manager', 'Voit les dossiers répartis, note et évalue']].map(([t, s]) => ({ t, s }));
    const invite = st.invite ?? '';
    // ---------- Formule (lecture seule) ----------
    const usage = [['Utilisateurs', 4, 5], ['Offres actives', 3, 20], ['Recherches de talents ce mois', 41, 300], ['Crédits Orbi ce mois', 88, 300]].map(([t, n, m]) => ({ t, v: n + ' / ' + m, w: Math.round(n / m * 100) + '%' }));
    const formules = [['Company', '79,9 USD/mois', '5 utilisateurs · 20 offres actives', true], ['Company Plus', '179,9 USD/mois', '15 utilisateurs · 50 offres · viviers partagés, tableaux par équipe', false], ['Company Premium', 'Sur devis', 'Filiales, workflows configurables, intégrations RH', false]]
      .map(([t, prix, s, on]) => ({ t, prix, s, bd: on ? '#A6F26B' : 'rgba(255,255,255,.12)', aOn: on }));
    const demande = st.demande || false;
    // ---------- Aide ----------
    const FAQ = [['Comment répondre à tous les candidats non retenus ?', 'Dans Candidatures › Décisions › Non retenus, touchez « Répondre aux N sans réponse ». Chaque personne reçoit un message à son prénom.'],
      ['Pourquoi ce score ?', 'Le score suit un calcul fixe sur 8 critères (compétences, expérience, formation, langues, lieu, contrat, proximité). Le nom, l’âge, le genre ou la photo ne comptent jamais.'],
      ['Qui peut voir mes contacts ?', 'Votre e-mail professionnel est visible par tous. Votre téléphone, seulement par les candidats en entretien, ou par votre équipe : vous choisissez dans votre profil.'],
      ['Comment changer de formule ?', 'La formule de Baobab Fintech est gérée par Joseph Ilunga, administrateur, depuis l’ordinateur. Vous pouvez lui envoyer une demande depuis Formule et usage.']];
    const faqO = st.faqO ?? -1;
    const faq = FAQ.map(([q, r], i) => ({ q, r, ouvert: i === faqO, sym: i === faqO ? '−' : '+', pick: () => S({ faqO: i === faqO ? -1 : i }) }));
    const msgAide = st.msgAide ?? '';

    // ---------- Basculer de profil : recruteur, talent (discret), entreprise (administrateur seulement) ----------
    const admin = oui(p.admin);
    const moi = admin ? { nom: 'Joseph Ilunga', role: 'Responsable RH · administrateur', ini: 'JI' } : { nom: 'Nadia Kalala', role: 'Chargée de recrutement', ini: 'NK' };
    const bascule = [
      { t: moi.nom, s: 'Profil recruteur · Baobab Fintech', ini: moi.ini, bg: '#F4C9A0', fg: '#2A1A12', r: '50%', actuel: true, href: '', lien: false, bouton: true, go: () => S({ feuille: null }), sym: '✓', verrou: false },
      { t: moi.nom + ' · talent', s: 'Votre profil de candidat, invisible pour Baobab Fintech', ini: moi.ini, bg: '#0F3F37', fg: '#A6F26B', r: '50%', actuel: false, href: admin ? 'Recruteur-mode-talent-joseph.dc.html' : 'Recruteur-mode-talent.dc.html', lien: true, bouton: false, go: () => {}, sym: '', verrou: false },
      admin
        ? { t: 'Baobab Fintech', s: 'Agir au nom de l’entreprise : publier, répondre', ini: 'BF', bg: '#14745F', fg: '#FFFFFF', r: '12px', actuel: false, href: 'Recruteur-mode-entreprise.dc.html', lien: true, bouton: false, go: () => {}, sym: '', verrou: false }
        : { t: 'Baobab Fintech', s: 'Réservé à l’administrateur, Joseph Ilunga · voir la page', ini: 'BF', bg: '#2A3B3E', fg: '#8FA39E', r: '12px', actuel: false, href: 'Recruteur-entreprise.dc.html', lien: true, bouton: false, go: () => {}, sym: '', verrou: true }
    ];
    return {
      moiNom: moi.nom, moiRole: moi.role, admin, pasAdmin: !admin, basculer: () => S({ feuille: 'bascule' }), fBascule: fRaw === 'bascule', bascule,
      vEquipe: vue === 'equipe', vFormule: vue === 'formule', vAide: vue === 'aide', equipe, DROITS, invite, ecrireInvite: (e) => S({ invite: val(e) }), ouvrirInvite: () => S({ feuille: 'invite' }), fInvite: fRaw === 'invite',
      envoyerInvite: () => { if (!invite.includes('@')) return flash('Écrivez l’e-mail professionnel du collègue'); S({ feuille: null, invite: '' }); flash('Demande envoyée à Joseph Ilunga'); },
      usage, formules, demande, sansDemande: !demande, demanderPlus: () => { S({ demande: true }); flash('Demande envoyée à Joseph Ilunga'); },
      faq, msgAide, ecrireAide: (e) => S({ msgAide: val(e) }), envoyerAide: () => { if (!msgAide.trim()) return flash('Décrivez votre question'); S({ msgAide: '', aideEnv: true }); }, aideEnv: !!st.aideEnv,
      vMenu: vue === 'menu', vProfil: vue === 'profil', vModif: vue === 'modifier', vStats: vue === 'stats', vEnreg: vue === 'enregistres', vNotifs: vue === 'notifs', vConfid: vue === 'confid', vModeles: vue === 'modeles', vLangue: vue === 'langue',
      groupes, retour, voirProfil: aller('profil'),
      profil, accroche, ecrireAccroche: (e) => S({ accroche: val(e) }), modifier: aller('modifier'), retourProfil: aller('profil'),
      enregistrer: () => { S({ vue: 'profil' }); flash('Profil mis à jour'); }, visOpts, recrute, recruteT: recrute ? 'Recrute en ce moment' : '', basculerRecrute: () => S({ recrute: !recrute }), rFond: recrute ? '#A6F26B' : '#2A3B3E', rX: recrute ? '20px' : '0px', rEtat: recrute ? 'true' : 'false',
      orbiAccroche: () => S({ accroche: 'Chez Baobab Fintech, je cherche des talents data et service client qui veulent rendre le paiement mobile plus simple. Réponse à chaque candidature.' }),
      stats, notifsL, MODELES, langues, enreg, aEnreg: enreg.length > 0, sansEnreg: enreg.length === 0,
      deconnecter: () => S({ feuille: 'sortie' }), fSortie: fRaw === 'sortie', fModele: fRaw === 'modele', fermer, modeleT: st.modele || 'Accuser réception',
      modeleTexte: 'Bonjour {prénom}, nous avons bien reçu votre candidature au poste {offre}. Vous aurez une réponse sous 10 jours, quelle qu’elle soit. Nadia, Baobab Fintech',
      enregistrerModele: () => { fermer(); flash('Modèle enregistré'); },
      telechargerDonnees: () => flash('Vos données arrivent par e-mail sous 24 h'),
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}
