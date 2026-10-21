class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const p = this.props || {};
    const has = (k) => Object.prototype.hasOwnProperty.call(st, k);
    const S = (o) => this.setState(o);
    const flash = (t) => { S({ toast: t }); clearTimeout(this._t); this._t = setTimeout(() => this.setState({ toast: null }), 2300); };
    const oui = (x) => x === true || x === 'true';
    const val = (e) => (e && e.target ? e.target.value : '');
    // Orbi lit la question à voix haute (synthèse vocale du navigateur, si elle existe)
    const parler = (t) => { try { if (typeof window !== 'undefined' && window.speechSynthesis && !this.state.muet) { window.speechSynthesis.cancel(); const u = new window.SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; u.rate = 1; window.speechSynthesis.speak(u); } } catch (e) { /* pas de voix */ } };
    const taire = () => { try { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* rien */ } };

    // D’où l’on vient : la candidature (par défaut), le panneau Orbi de la candidature, ou Formation
    const DE = {
      candidature: { href: 'Carriere-candidature.dc.html', t: 'Candidature' },
      orbi: { href: 'Carriere-cand-orbi.dc.html', t: 'Candidature' },
      formation: { href: 'Formation.dc.html', t: 'Formation' }
    };
    const de = DE[p.de] || DE.candidature;

    const formule = st.formule ?? p.formule ?? 'Free';
    const rang = { Free: 0, Starter: 1, Pro: 2, Premium: 3 }[formule] ?? 0;
    const essaiPris = st.essaiPris ?? oui(p.essaiPris);

    const vue = st.vue ?? p.vue ?? 'choix';
    const mode = st.mode ?? p.mode ?? 'vocal';
    const duree0 = Number(st.duree ?? p.duree ?? 10);
    const focus0 = st.focus ?? p.focus ?? 'experiences';
    const ton = st.ton ?? p.ton ?? 'bienveillant';
    const sousTitres = has('sousTitres') ? st.sousTitres : true;
    const fRaw = has('feuille') ? st.feuille : (p.feuille && p.feuille !== 'aucune' ? p.feuille : null);
    const fermer = () => S({ feuille: null });

    // Ce que chaque formule permet (règle : écrit dès Starter, oral dès Pro ; un essai de 5 min offert)
    const inclus = mode === 'vocal' ? rang >= 2 : rang >= 1;
    const essai = !inclus;
    const besoin = mode === 'vocal' ? 'Pro' : 'Starter';
    const dureeOk = (d) => inclus || d === 5;
    const duree = dureeOk(duree0) ? duree0 : 5;

    const Q = (q, aide) => ({ q, aide });
    const FOCUS = {
      complet: { t: 'Entretien complet', d: 'Un peu de tout, comme le vrai', pro: false, qs: [] },
      experiences: { t: 'Mes expériences', d: 'Stage chez Mwinda, projets, méthode STAR', pro: false, qs: [
        Q('Présentez-vous en une minute.', 'Formation, stage, ce que vous visez. Finissez par Baobab.'),
        Q('Parlez-moi de votre stage chez Mwinda. Qu’avez-vous amélioré ?', 'Situation, tâche, action, résultat. Donnez un chiffre.'),
        Q('Racontez un projet où les données vous ont surprise.', 'Ce que vous pensiez, ce que les chiffres ont montré, ce que vous avez fait.'),
        Q('Décrivez un désaccord avec un collègue et comment vous l’avez réglé.', 'Restez factuelle. Montrez l’écoute puis la solution.'),
        Q('De quelle réalisation de votre portfolio êtes-vous la plus fière ?', 'Le tableau de bord des ventes : le problème, votre rôle, l’effet.'),
        Q('Parlez-moi d’un échec et de ce que vous en avez appris.', 'Un vrai échec, petit. Insistez sur ce que vous faites autrement depuis.'),
        Q('Comment organisez-vous une semaine chargée ?', 'Une méthode simple : priorités du lundi, point du vendredi.'),
        Q('Quel retour d’un responsable vous a fait progresser ?', 'Citez le retour, puis ce que vous avez changé.'),
        Q('Pourquoi être passée d’Excel à SQL ?', 'Le besoin concret qui vous a poussée : des fichiers trop lourds.')] },
      technique: { t: 'Questions techniques', d: 'SQL, Power BI, qualité des données', pro: false, qs: [
        Q('Comment vérifiez-vous la qualité d’un fichier de ventes ?', 'Doublons, valeurs manquantes, dates, totaux qui collent.'),
        Q('Quelle différence entre INNER JOIN et LEFT JOIN ?', 'LEFT JOIN garde toutes les lignes de la première table.'),
        Q('Quel graphique pour montrer les paiements par mois ?', 'Une courbe pour une évolution dans le temps.'),
        Q('Comment calculez-vous le panier moyen par commerçant en SQL ?', 'GROUP BY commerçant, puis AVG du montant.'),
        Q('Que faites-vous des valeurs manquantes ?', 'Comprendre pourquoi elles manquent avant de les remplir ou de les écarter.'),
        Q('Comment présentez-vous un tableau de bord à un directeur pressé ?', 'Un chiffre clé, une tendance, une décision à prendre.'),
        Q('Une mesure Power BI donne un total faux. Que vérifiez-vous ?', 'Les filtres, les relations entre tables, la fonction utilisée.'),
        Q('Comment repérer une transaction Mobile Money suspecte ?', 'Montants inhabituels, heures, répétitions rapides.'),
        Q('Quels indicateurs suivre pour une fintech de paiement ?', 'Volume, nombre de commerçants actifs, taux d’échec, délai de paiement.')] },
      motivation: { t: 'Motivation et entreprise', d: 'Pourquoi Baobab, la fintech, votre projet', pro: false, qs: [
        Q('Pourquoi Baobab Fintech ?', 'Leurs commerçants et le Mobile Money, relié à votre stage.'),
        Q('Que savez-vous de nos clients ?', 'Des commerçants qui encaissent par Mobile Money à Kinshasa et Goma.'),
        Q('Où vous voyez-vous dans trois ans ?', 'Analyste confirmée, référente sur un domaine, toujours chez eux.'),
        Q('Pourquoi la fintech plutôt que la banque ?', 'Le rythme, l’impact direct sur les commerçants.'),
        Q('Qu’apporteriez-vous dès le premier mois ?', 'Un premier rapport utile, en partant de leurs données.'),
        Q('Qu’attendez-vous de votre manager ?', 'Des objectifs clairs et des retours réguliers.'),
        Q('Qu’est-ce qui vous motive le matin ?', 'Un exemple vrai, pas une formule.'),
        Q('Quelle question aimeriez-vous nous poser ?', 'Préparez-en deux : l’équipe data, les outils.'),
        Q('Pourquoi quitter Kinshasa vous dérangerait-il ou non ?', 'Soyez honnête sur votre mobilité.')] },
      situation: { t: 'Mises en situation', d: 'Des cas concrets à résoudre à voix haute', pro: true, qs: [
        Q('Les paiements baissent de 20 % à Goma cette semaine. Par quoi commencez-vous ?', 'Vérifier les données, puis comparer par jour, par commerçant, par opérateur.'),
        Q('Un directeur veut un chiffre pour demain, les données sont incomplètes. Que faites-vous ?', 'Donner le chiffre avec sa limite, et la date du chiffre complet.'),
        Q('Deux équipes ont des chiffres différents. Comment tranchez-vous ?', 'Retrouver la définition et la source de chaque chiffre.'),
        Q('Un commerçant se plaint d’un paiement non reçu. Quelles données regardez-vous ?', 'L’historique de la transaction, son statut, l’opérateur.'),
        Q('On vous demande un tableau de bord en deux jours. Comment vous organisez-vous ?', 'Une question à la fois : besoin, données, maquette, retour.'),
        Q('Vous trouvez une erreur dans un rapport déjà envoyé. Que faites-vous ?', 'Prévenir vite, corriger, expliquer ce qui change.'),
        Q('Votre requête est trop lente. Que tentez-vous ?', 'Filtrer tôt, limiter les colonnes, vérifier les index.'),
        Q('Un collègue vous demande des données personnelles de clients. Que répondez-vous ?', 'Vérifier le droit d’accès, ne partager que le nécessaire.'),
        Q('Comment mesurer si une nouvelle offre plaît aux commerçants ?', 'Un indicateur avant, un après, un groupe de comparaison.')] },
      pieges: { t: 'Questions pièges', d: 'Défaut, salaire, comparaison', pro: true, qs: [
        Q('Quel est votre plus grand défaut ?', 'Un vrai défaut, et ce que vous faites pour le corriger.'),
        Q('Quelles sont vos prétentions salariales ?', 'Une fourchette préparée, puis la question des avantages.'),
        Q('Pourquoi vous plutôt qu’un autre candidat ?', 'Trois raisons courtes liées à l’offre.'),
        Q('Avez-vous d’autres entretiens en cours ?', 'Oui ou non, sans détails, et redites votre intérêt.'),
        Q('Vous n’avez qu’un stage. Est-ce suffisant ?', 'Ce que le stage vous a fait faire pour de vrai.'),
        Q('Que ferez-vous si on ne vous prend pas ?', 'Continuer à progresser, rester en contact.'),
        Q('Qu’est-ce qui vous agace chez un collègue ?', 'Restez positive, parlez d’organisation.'),
        Q('Pourquoi ce trou de quatre mois dans votre CV ?', 'Ce que vous avez appris pendant : SQL, Power BI.'),
        Q('Seriez-vous prête à travailler le samedi ?', 'Une réponse claire, avec vos conditions.')] },
      anglais: { t: 'Entretien en anglais', d: 'Les mêmes questions, en anglais', pro: true, qs: [
        Q('Tell me about yourself.', 'Studies, internship, goal. Short sentences.'),
        Q('Why do you want to join Baobab Fintech?', 'Merchants, Mobile Money, your internship.'),
        Q('Describe a dashboard you built.', 'Problem, tool, result.'),
        Q('How do you check data quality?', 'Duplicates, missing values, totals.'),
        Q('What is your greatest strength?', 'One strength, one example.'),
        Q('Where do you see yourself in three years?', 'Growing in data, in the company.'),
        Q('How do you handle pressure?', 'A real example.'),
        Q('Do you have any questions for us?', 'Ask about the data team.'),
        Q('What are your salary expectations?', 'A range, then benefits.')] }
    };
    const melange = ['experiences', 'technique', 'motivation', 'situation', 'pieges'];
    FOCUS.complet.qs = [0, 1, 2].flatMap((i) => melange.slice(0, 3).map((k) => FOCUS[k].qs[i]));
    const focus = FOCUS[focus0] && (!FOCUS[focus0].pro || inclus) ? focus0 : 'experiences';
    const fo = FOCUS[focus] || FOCUS.experiences;
    const nbQ = { 5: 3, 10: 6, 15: 9 }[duree] || 6;
    const faibles = !!st.faibles;
    const questions = faibles ? [fo.qs[1], fo.qs[3]] : fo.qs.slice(0, nbQ);
    const nQ = questions.length;

    // Réglages
    const MODES = [['ecrit', 'Par écrit', 'Starter'], ['vocal', 'À l’oral', 'Pro']];
    const modes = MODES.map(([k, t, f]) => ({ t, sous: 'Dès ' + f, pick: () => S({ mode: k, duree: (rang >= ({ ecrit: 1, vocal: 2 })[k] || duree === 5) ? duree : 5 }), bg: k === mode ? '#F2EDE5' : 'transparent', col: k === mode ? '#0B1A1F' : '#F2EDE5', sc: k === mode ? '#3E4F4B' : '#8FA39E' }));
    const durees = [5, 10, 15].map((d) => {
      const ok = dureeOk(d), sel = d === duree;
      return { t: d + ' min', sous: ({ 5: 3, 10: 6, 15: 9 })[d] + ' questions', verrou: !ok, libre: ok, cadenas: ok ? '' : besoin,
        pick: () => (ok ? S({ duree: d }) : S({ feuille: 'formule', voulu: d + ' minutes' })),
        bd: sel ? '#A6F26B' : 'rgba(255,255,255,.12)', bg: sel ? 'rgba(166,242,107,.08)' : '#13282C', op: ok ? '1' : '.55' };
    });
    const focusListe = Object.keys(FOCUS).map((k) => {
      const f = FOCUS[k], ok = !f.pro || inclus, sel = k === focus;
      return { t: f.t, d: f.d, cadenas: ok ? '' : besoin, verrou: !ok,
        pick: () => (ok ? S({ focus: k }) : S({ feuille: 'formule', voulu: '« ' + f.t + ' »' })),
        bd: sel ? '#A6F26B' : 'rgba(255,255,255,.12)', bg: sel ? 'rgba(166,242,107,.08)' : '#13282C', rb: sel ? '#A6F26B' : 'rgba(255,255,255,.3)', rbg: sel ? '#A6F26B' : 'transparent', sym: sel ? '✓' : '', op: ok ? '1' : '.6' };
    });
    const TONS = [['bienveillant', 'Bienveillant'], ['exigeant', 'Exigeant']];
    const tons = TONS.map(([k, t]) => ({ t, pick: () => S({ ton: k }), bg: k === ton ? '#F2EDE5' : 'transparent', col: k === ton ? '#0B1A1F' : '#F2EDE5', bd: k === ton ? '#F2EDE5' : 'rgba(255,255,255,.28)' }));
    const preparer = () => {
      if (essai && essaiPris) { S({ feuille: 'formule', voulu: 'une nouvelle simulation' }); return; }
      S({ vue: 'telechargement', dl: 0, faibles: false });
    };

    // Téléchargement des questions
    const dl = st.dl ?? (vue === 'telechargement' ? (oui(p.pret) ? 4 : Number(p.dl ?? 0)) : 4);
    if (vue === 'telechargement' && dl < 4 && !this._dl) {
      this._dl = setTimeout(() => { this._dl = null; this.setState({ dl: (this.state.dl ?? dl) + 1 }); }, 700);
    }
    const ETAPES_DL = ['Lecture de l’offre de Baobab Fintech', 'Lecture de votre CV Data', nQ + ' questions choisies : ' + fo.t.toLowerCase(), mode === 'vocal' ? 'Voix d’Orbi prête, ton ' + ton : 'Chronomètre réglé sur ' + duree + ' min'];
    const etapesDl = ETAPES_DL.map((t, i) => ({ t, fait: i < dl, encours: i === dl, attente: i > dl, col: i < dl ? '#F2EDE5' : (i === dl ? '#F2EDE5' : '#6F8580') }));
    const dlFini = dl >= 4;
    const apercu = questions.map((x, i) => ({ n: String(i + 1), t: x.q }));

    // Micro
    const micro = st.micro ?? (oui(p.micro) ? 'ok' : 'non');

    // Simulation en cours
    const qi = Math.min(Number(st.qi ?? p.qi ?? 0) || 0, nQ - 1);
    const phase = st.phase ?? p.phase ?? 'orbi';
    const pause = has('pause') ? st.pause : oui(p.pause);
    const relance = st.relance ?? oui(p.relance);
    const q = questions[qi] || questions[0];
    const tick = st.tick ?? (p.vue === 'appel' ? 47 + qi * 95 : 0);
    if (vue === 'appel' && mode === 'vocal' && !pause && !fRaw && !this._tk) {
      this._tk = setTimeout(() => { this._tk = null; if (this.state.vue === 'appel' || (!this.state.vue && vue === 'appel')) this.setState({ tick: (this.state.tick ?? tick) + 1 }); }, 1000);
    }
    if (vue === 'appel' && phase === 'orbi' && !pause && !fRaw && !this._ph) {
      this._ph = setTimeout(() => { this._ph = null; if ((this.state.phase ?? phase) === 'orbi' && !this.state.pause) this.setState({ phase: 'vous' }); }, 3200);
    }
    const restant = Math.max(duree * 60 - tick, 0);
    const mm = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    const TRANS = {
      experiences: 'Pendant mon stage chez Mwinda, je suivais les ventes de 12 boutiques sur Excel. J’ai construit un tableau de bord qui…',
      technique: 'D’abord je regarde les doublons et les valeurs manquantes, ensuite je vérifie que les totaux correspondent au…',
      motivation: 'Baobab aide les commerçants à encaisser par Mobile Money, et c’est exactement ce que j’ai vu chez Mwinda…',
      situation: 'Je commencerais par vérifier que les données de Goma sont complètes, puis je comparerais jour par jour…',
      pieges: 'Mon défaut, c’est que je veux tout vérifier deux fois. Maintenant je fixe une limite de temps…',
      anglais: 'I studied economics in Kinshasa, then I did an internship at Mwinda where I…',
      complet: 'Pendant mon stage chez Mwinda, je suivais les ventes de 12 boutiques et j’ai construit un tableau de bord qui…'
    };
    const reponseEcrite = st.rep ?? (oui(p.repRempli) ? TRANS[focus] : '');
    const suivante = () => {
      taire();
      if (!relance && qi === 1 && !st.relanceFaite && mode === 'vocal') { S({ relance: true, relanceFaite: true, phase: 'orbi' }); parler('Pouvez-vous donner un chiffre précis ?'); return; }
      if (qi + 1 >= nQ) { S({ vue: 'analyse', an: 0, relance: false, rep: '', essaiPris: essai ? true : essaiPris }); return; }
      S({ qi: qi + 1, phase: 'orbi', relance: false, rep: '', tick: Math.max(tick, (qi + 1) * Math.round(duree * 60 / nQ)) });
      parler(questions[qi + 1].q);
    };
    const envoyerEcrit = () => { if (!reponseEcrite.trim()) { flash('Écrivez votre réponse, même courte.'); return; } suivante(); };

    // Analyse
    const an = st.an ?? (vue === 'analyse' ? Number(p.an ?? 0) : 3);
    if (vue === 'analyse' && an < 3 && !this._an) {
      this._an = setTimeout(() => { this._an = null; const n = (this.state.an ?? an) + 1; this.setState(n >= 3 ? { an: n, vue: 'bilan' } : { an: n }); }, 900);
    }
    const ETAPES_AN = ['Transcription de vos réponses', mode === 'vocal' ? 'Débit, pauses et mots de remplissage' : 'Longueur et clarté des réponses', 'Comparaison avec l’offre de Baobab'];
    const etapesAn = ETAPES_AN.map((t, i) => ({ t, fait: i < an, encours: i === an, attente: i > an }));

    // Bilan
    const SCORES = [78, 61, 74, 66, 81, 58, 70, 64, 76];
    const scoreQ = (i) => SCORES[(i + Object.keys(FOCUS).indexOf(focus)) % SCORES.length];
    const global = Math.round(questions.reduce((a, x, i) => a + scoreQ(i), 0) / nQ);
    const crit = (mode === 'vocal'
      ? [['Clarté', 76, 'Phrases courtes, idée principale en premier.'], ['Exemples concrets', 62, 'Deux réponses sans chiffre : dites « 12 boutiques », « 3 jours gagnés ».'], ['Lien avec l’offre', 74, 'Vous citez le Mobile Money : bien vu.'], ['Aisance à l’oral', 68, '142 mots par minute, 6 « euh ». Respirez avant de répondre.']]
      : [['Clarté', 78, 'Réponses bien construites.'], ['Exemples concrets', 60, 'Ajoutez un chiffre par réponse.'], ['Lien avec l’offre', 72, 'Citez davantage Baobab.'], ['Longueur', 70, 'Visez 4 à 6 phrases.']])
      .map(([t, v, pq]) => ({ t, v: String(v), pct: v + '%', pq, col: v >= 70 ? '#A6F26B' : '#F4C463' }));
    const liste = questions.map((x, i) => { const s = scoreQ(i); return { n: String(i + 1), t: x.q, s: String(s), col: s >= 70 ? '#A6F26B' : '#F4C463', ouvrir: () => S({ vue: 'reponse', ri: i, ecoute: false }) }; });
    const enregistre = st.enregistre ?? false;

    // Détail d’une réponse
    const ri = Math.min(Number(st.ri ?? p.ri ?? 1) || 0, nQ - 1);
    const rq = questions[ri] || questions[0];
    const rs = scoreQ(ri);
    const ecoute = !!st.ecoute;
    const detail = {
      n: String(ri + 1), q: rq.q, s: String(rs), col: rs >= 70 ? '#A6F26B' : '#F4C463', trans: TRANS[focus],
      bien: rs >= 70 ? 'Vous partez d’une situation réelle et vous restez dans le sujet.' : 'Le début est clair : vous situez le contexte.',
      mieux: rs >= 70 ? 'Terminez par ce que l’entreprise y gagne.' : 'Il manque le résultat chiffré. Le recruteur ne sait pas ce qui a changé.',
      conseil: rq.aide, duree: mode === 'vocal' ? '1 min 12' : '86 mots'
    };

    // Historique
    const HIST = [
      { t: 'Mes expériences · à l’oral', d: 'Aujourd’hui · 10 min', s: '72' },
      { t: 'Questions techniques · par écrit', d: '19 oct. · 5 min', s: '64' },
      { t: 'Entretien complet · par écrit', d: '16 oct. · 15 min', s: '58' }
    ].map((h, i) => ({ ...h, col: Number(h.s) >= 70 ? '#A6F26B' : '#F4C463', ouvrir: () => S({ vue: 'bilan', focus: ['experiences', 'technique', 'complet'][i], mode: i ? 'ecrit' : 'vocal', duree: [10, 5, 15][i], de2: 'historique' }) }));

    const quitter = () => { taire(); S({ feuille: null, vue: 'choix', qi: 0, phase: 'orbi', pause: false, tick: 0 }); flash('Simulation arrêtée. Rien n’est envoyé au recruteur.'); };
    const finirMaintenant = () => { taire(); S({ feuille: null, vue: 'analyse', an: 0, pause: false, essaiPris: essai ? true : essaiPris }); };

    return {
      vChoix: vue === 'choix', vDl: vue === 'telechargement', vMicro: vue === 'micro', vAppel: vue === 'appel', vAnalyse: vue === 'analyse', vBilan: vue === 'bilan', vReponse: vue === 'reponse', vHist: vue === 'historique',
      deHref: de.href, deT: de.t, finHref: p.de === 'formation' ? 'Formation.dc.html' : 'Carriere-candidature.dc.html', finT: p.de === 'formation' ? 'Formation' : 'ma candidature',
      // réglages
      modes, durees, focusListe, tons, preparer, vocal: mode === 'vocal', ecrit: mode === 'ecrit',
      formule, essai, inclus, besoin, essaiPris: !!essaiPris,
      bandeau: inclus ? 'Inclus dans votre formule ' + formule : (essaiPris ? 'Essai utilisé · passez en ' + besoin + ' pour continuer' : 'Essai offert : une simulation de 5 min. Le reste dès ' + besoin + '.'),
      bandeauCol: inclus ? '#A6F26B' : '#F4C463',
      preparerT: essai ? (essaiPris ? 'Passer en ' + besoin : 'Essayer gratuitement · 5 min') : 'Préparer la simulation · ' + duree + ' min',
      ouvrirHist: () => S({ vue: 'historique' }),
      // téléchargement
      etapesDl, dlFini, dlEnCours: !dlFini, apercu, voirQ: !!st.voirQ, basculerVoirQ: () => S({ voirQ: !st.voirQ }), voirQT: st.voirQ ? 'Masquer les questions' : 'Voir les questions avant', nQT: nQ + ' questions · ' + duree + ' min · ' + (mode === 'vocal' ? 'à l’oral' : 'par écrit'),
      retourChoix: () => { clearTimeout(this._dl); this._dl = null; S({ vue: 'choix' }); },
      commencer: () => { if (mode === 'vocal') S({ vue: 'micro' }); else S({ vue: 'appel', qi: 0, phase: 'vous', tick: 0, rep: '' }); },
      // micro
      microNon: micro === 'non', microOk: micro === 'ok', demanderMicro: () => S({ feuille: 'micro' }),
      autoriserMicro: () => S({ micro: 'ok', feuille: null }), refuserMicro: () => { S({ feuille: null }); flash('Sans micro, choisissez la simulation par écrit.'); },
      passerEcrit: () => S({ mode: 'ecrit', vue: 'appel', qi: 0, phase: 'vous', tick: 0, rep: '', feuille: null }),
      sousTitres: sousTitres ? 'true' : 'false', stBg: sousTitres ? '#A6F26B' : 'rgba(255,255,255,.18)', stX: sousTitres ? '20px' : '0px', basculerST: () => S({ sousTitres: !sousTitres }),
      retourDl: () => S({ vue: 'telechargement' }),
      demarrer: () => { S({ vue: 'appel', qi: 0, phase: 'orbi', tick: 0, pause: false }); parler(questions[0].q); },
      // appel
      qNum: 'Question ' + (qi + 1) + ' sur ' + nQ, q: relance ? { q: 'Pouvez-vous donner un chiffre précis ?', aide: 'Un nombre, une durée, un pourcentage.' } : q,
      relance: !!relance, orbiParle: phase === 'orbi', vousParlez: phase === 'vous', aSousTitres: sousTitres || mode === 'ecrit',
      etat: phase === 'orbi' ? (relance ? 'Orbi relance' : 'Orbi pose la question') : 'À vous · Orbi écoute',
      chrono: mm(restant), chronoT: mode === 'vocal' ? 'restantes' : 'pour répondre',
      transLive: phase === 'vous' ? TRANS[focus] : '', aTrans: phase === 'vous' && mode === 'vocal',
      repondre: () => { taire(); S({ phase: 'vous' }); }, suivante, finiT: qi + 1 >= nQ && !(qi === 1 && !st.relanceFaite) ? 'Terminer' : 'J’ai fini de répondre',
      repeter: () => { S({ phase: 'orbi' }); parler(q.q); flash('Orbi répète la question'); },
      muet: !!st.muet, muetT: st.muet ? 'Son coupé' : 'Son', basculerMuet: () => { taire(); S({ muet: !st.muet }); },
      mettrePause: () => { taire(); S({ pause: true }); }, reprendre: () => S({ pause: false }),
      recommencerQ: () => { S({ pause: false, phase: 'orbi' }); parler(q.q); },
      pause: !!pause, indice: () => S({ feuille: 'indice' }), demanderQuitter: () => { taire(); S({ feuille: 'quitter', pause: true }); },
      rep: reponseEcrite, ecrireRep: (e) => S({ rep: val(e) }), envoyerEcrit, nMots: (reponseEcrite.trim() ? reponseEcrite.trim().split(/\s+/).length : 0) + ' mots',
      progression: questions.map((x, i) => ({ bg: i < qi ? '#A6F26B' : (i === qi ? '#F2EDE5' : 'rgba(255,255,255,.16)') })),
      // analyse
      etapesAn,
      // bilan
      global: String(global), globalDash: (2 * Math.PI * 52 * global / 100).toFixed(1) + ' 326.7', crit, liste,
      bilanSous: fo.t + ' · ' + (mode === 'vocal' ? 'à l’oral' : 'par écrit') + ' · ' + duree + ' min',
      fort1: mode === 'vocal' ? 'Vous parlez de Mwinda avec assurance : c’est votre meilleur atout.' : 'Vos réponses sont bien construites.',
      fort2: 'Vous reliez votre parcours au Mobile Money de Baobab.',
      mieux1: 'Donnez un chiffre dans chaque exemple.', mieux2: mode === 'vocal' ? 'Faites une pause d’une seconde au lieu de « euh ».' : 'Terminez par ce que l’entreprise y gagne.',
      recommencer: () => S({ vue: 'choix', qi: 0, tick: 0, faibles: false }),
      refaireFaibles: () => { if (essai && (essaiPris || st.essaiPris)) { S({ feuille: 'formule', voulu: 'refaire les questions faibles' }); return; } S({ vue: mode === 'vocal' ? 'micro' : 'appel', faibles: true, qi: 0, phase: mode === 'vocal' ? 'orbi' : 'vous', tick: 0 }); },
      enregistrer: () => { if (enregistre) { flash('Déjà dans votre candidature'); return; } S({ enregistre: true }); flash('Bilan rangé dans votre candidature Baobab Fintech'); },
      enregT: enregistre ? 'Rangé dans la candidature ✓' : 'Ranger dans ma candidature',
      bilanRetourHist: st.de2 === 'historique', bilanRetourNormal: st.de2 !== 'historique', retourHist: () => S({ vue: 'historique', de2: null }),
      // réponse
      detail, ecoute, ecouteT: ecoute ? 'Pause' : (mode === 'vocal' ? 'Écouter ma réponse' : 'Lire ma réponse'),
      basculerEcoute: () => S({ ecoute: !ecoute }), retourBilan: () => S({ vue: 'bilan' }),
      refaireQ: () => S({ vue: mode === 'vocal' ? 'micro' : 'appel', faibles: false, qi: ri, phase: mode === 'vocal' ? 'orbi' : 'vous', tick: ri * Math.round(duree * 60 / nQ) }),
      aSuivanteR: ri + 1 < nQ, suivanteR: () => S({ ri: ri + 1, ecoute: false }),
      // historique
      hist: HIST,
      // feuilles
      fFormule: fRaw === 'formule', fMicro: fRaw === 'micro', fIndice: fRaw === 'indice', fQuitter: fRaw === 'quitter', fermer,
      formuleTitre: (mode === 'vocal' ? 'L’entretien à l’oral' : 'L’entretien par écrit') + ' est inclus dans ' + besoin,
      formuleD: 'Vous voulez ' + (st.voulu || 'plus de simulations') + '. ' + besoin + ' débloque 5, 10 et 15 minutes, tous les focus et des simulations sans limite. Paiement par Mobile Money, sans engagement.',
      essaiDispo: !essaiPris, garderEssai: () => S({ feuille: null, duree: 5 }),
      fermerIndice: () => S({ feuille: null }), quitter, finirMaintenant,
      continuerApres: () => S({ feuille: null, pause: false }),
      quitterD: 'Vous avez répondu à ' + qi + ' question' + (qi > 1 ? 's' : '') + ' sur ' + nQ + '. Rien n’est envoyé au recruteur.',
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}
