# Recruteur · Bascule de profil : profil talent discret, et page entreprise pour l’administrateur.
from rkit import *
CHEV = ico(I['chev'], 18, '2', '#8FA39E')

# ---------------- Profil talent du recruteur ----------------
JST = '''class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
    const joseph = p.qui === 'joseph';
    const moi = joseph ? { nom: 'Joseph Ilunga', ini: 'JI', titre: 'Responsable RH · 9 ans', retour: 'Recruteur-basculer-admin.dc.html' } : { nom: 'Nadia Kalala', ini: 'NK', titre: 'Chargée de recrutement · 5 ans', retour: 'Recruteur-basculer.dc.html' };
    const W = [35, 10, 15, 10, 10, 10, 5, 5];
    const sc = (v) => Math.round(v.reduce((a, x, i) => a + x * W[i], 0));
    const OFF = [
      ['fleuve', 'Responsable recrutement', 'Fleuve Banque', 'FB', '#1E4E79', 'Kinshasa · CDI', [1, 0.8, 0.9, 1, 1, 1, 0.5, 0.9], ['Recrutement et entretiens : vérifiés', '5 ans d’expérience pour 4 demandés']],
      ['mwinda', 'Chargée RH', 'Mwinda Énergie', 'ME', '#B07A12', 'Kinshasa · CDI', [0.9, 0.7, 0.9, 1, 0.9, 1, 0.5, 0.7], ['Recrutement : vérifié', 'Paie à vérifier en entretien']],
      ['kivu', 'Talent acquisition', 'Kivu Data Lab', 'KD', '#4B2D7A', 'Goma · hybride', [0.9, 0.6, 0.8, 1, 1, 0.5, 0.5, 0.8], ['Recrutement de profils data', 'Poste à Goma']]
    ];
    const ENTX = [['fleuve', 'Fleuve Banque', true], ['kivu', 'Kivu Data Lab', true], ['mwinda', 'Mwinda Énergie', true], ['lisanga', 'Lisanga Santé', true], ['rawbank', 'Autre entreprise', false]];
    const xps = st.xps || [];
    const xpEnt = st.xpEnt || '';
    const xpQuand = st.xpQuand || 'fini';
    const xpPoste = st.xpPoste || '';
    const xe = ENTX.find((x) => x[0] === xpEnt);
    const cands = st.cands || { lisanga: 'Reçue' };
    const ouvert = st.ouvert ?? true;
    const onglet = prop('onglet', 'offres');
    const offres = OFF.map(([k, t, ent, ini, bg, lieu, v, rs]) => { const s = sc(v); const b = bande(s); return { t, ent, ini, bg, lieu, sc: s + ' %', sbg: b[2], scol: b[1], raisons: rs.map((x) => ({ t: x })),
      deja: !!cands[k], pas: !cands[k], candidater: () => S({ feuille: 'candidater', choix: k }), href: `Recruteur-entreprise-${k}-offre.dc.html` }; });
    const ch = OFF.find((o) => o[0] === (st.choix || 'fleuve'));
    const mesCands = [['lisanga', 'Chargée RH', 'Lisanga Santé', '6 oct.'], ...OFF.map((o) => [o[0], o[1], o[2], 'aujourd’hui'])].filter(([k]) => cands[k]).map(([k, t, ent, d]) => ({ t, ent, d, etat: cands[k] }));
    return {
      moi, ongletsT: onglets([['offres', 'Offres pour vous'], ['profil', 'Mon profil'], ['candidatures', 'Mes candidatures', String(Object.keys(cands).length)]], onglet, 'onglet'),
      oOffres: onglet === 'offres', oProfil: onglet === 'profil', oCands: onglet === 'candidatures', offres, mesCands,
      ouvert, basculerOuvert: () => S({ ouvert: !ouvert }), oFond: ouvert ? '#A6F26B' : '#2A3B3E', oX: ouvert ? '20px' : '0px', oEtat: ouvert ? 'true' : 'false',
      ouvertT: ouvert ? 'Ouvert·e aux opportunités · seuls les autres employeurs le voient' : 'Profil masqué : aucun recruteur ne le voit',
      comp: [['Recrutement', 'Vérifiée'], ['Conduite d’entretiens', 'Vérifiée'], ['ATS et tableaux de suivi', 'Déclarée'], ['Excel', 'Vérifiée']].map(([t, v]) => ({ t, v, vc: v === 'Vérifiée' ? '#A6F26B' : '#8FA39E' })),
      exp: (joseph ? [['Responsable RH', 'Baobab Fintech · 4 ans'], ['Chargé RH', 'Rawbank · 5 ans']] : [['Chargée de recrutement', 'Baobab Fintech · 3 ans'], ['Assistante RH', 'Rawbank · 2 ans']]).map(([t, d]) => ({ t, d })).concat(xps),
      ajouterExp: () => S({ feuille: 'exp', xpEnt: '', xpPoste: '', xpQuand: 'fini' }), fExp: (has('feuille') ? st.feuille : p.feuille) === 'exp',
      xpPoste, ecrirePoste: (e) => S({ xpPoste: val(e) }), xpEnts: pills(ENTX.map(([k, n]) => [k, n]), xpEnt, 'xpEnt'), xpQuands: pills([['fini', 'C’est terminé'], ['actuel', 'J’y travaille en ce moment']], xpQuand, 'xpQuand'),
      xpPage: !!(xe && xe[2]), xpSansPage: !!(xe && !xe[2]), xpEntNom: xe ? xe[1] : '',
      xpEffet: xpQuand === 'actuel' ? 'Profil discret : vous n’apparaissez pas parmi ses membres tant que la recherche discrète est active. L’expérience reste visible des seuls employeurs qui voient votre profil talent.' : 'Elle est prévenue et peut confirmer ; l’expérience s’affiche sur votre profil avec son logo.',
      validerExp: () => { if (!xpPoste.trim()) return flash('Écrivez le poste occupé'); if (!xe) return flash('Choisissez l’entreprise'); S({ xps: [...xps, { t: xpPoste.trim(), d: (xe[2] ? xe[1] : 'Autre entreprise') + (xpQuand === 'actuel' ? ' · en ce moment' : ' · expérience passée') + (xe[2] ? ' · en attente de confirmation' : '') }], feuille: null }); flash(xe[2] ? xe[1] + ' est prévenue' : 'Expérience ajoutée'); },
      fCand: (has('feuille') ? st.feuille : p.feuille) === 'candidater', fOk: st.feuille === 'ok', fermer: () => S({ feuille: null }),
      chT: ch[1] + ' · ' + ch[2],
      confirmer: () => S({ cands: { ...cands, [ch[0]]: 'Reçue' }, feuille: 'ok' }),
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}'''
TOG = ('<button onClick="{{basculerOuvert}}" role="switch" aria-checked="{{oEtat}}" aria-label="Ouvert aux opportunités" style="width: 50px; height: 30px; border-radius: 15px; background: {{oFond}}; padding: 3px; flex: none;">'
       '<span style="display: block; width: 24px; height: 24px; border-radius: 50%; background: #0B1A1F; transform: translateX({{oX}}); transition: transform .2s;"></span></button>')
CT = '''
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 120px;">
<div style="height: 140px; background: linear-gradient(160deg, #0F3F37 0%, #13282C 70%); position: relative;">
<a href="{{moi.retour}}" class="rond" aria-label="Changer de profil" style="position: absolute; left: 12px; top: 50px; background: rgba(11,26,31,.55); color: #F2EDE5;">@RETOUR@</a>
<span style="position: absolute; right: 20px; top: 60px; padding: 6px 10px; border-radius: 8px; background: #A6F26B; color: #0B1A1F; font-size: 12px; font-weight: 800;">PROFIL TALENT</span></div>
<div style="padding: 0 20px; margin-top: -40px; position: relative;">
<span class="av" style="width: 84px; height: 84px; font-size: 25px; background: #0F3F37; color: #A6F26B; border: 4px solid #0B1A1F;">{{moi.ini}}</span>
<h1 style="font-size: 23px; margin-top: 10px;">{{moi.nom}}</h1><p style="font-size: 14.5px; color: #C9D6D2; margin-top: 2px;">{{moi.titre}} · Kinshasa</p>
</div>
<div style="margin: 16px 20px 0; padding: 14px; border-radius: 18px; background: #13282C; border: 1px solid rgba(47,211,166,.25);">
<div style="display: flex; align-items: center; gap: 12px;"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Recherche discrète</b><span class="meta" style="font-size: 12.5px; line-height: 1.4;">{{ouvertT}}</span></span>@TOG@</div>
<p style="font-size: 12.5px; color: #9FD9C6; margin-top: 10px; line-height: 1.45;">Baobab Fintech et son équipe ne voient jamais ce profil ni vos candidatures.</p></div>
<div style="margin-top: 14px;">@SEG@</div>
<sc-if value="{{oOffres}}" hint-placeholder-val="{{ true }}"><div style="padding: 14px 20px 0; display: flex; flex-direction: column; gap: 12px;">
<sc-for list="{{offres}}" as="o" hint-placeholder-count="3"><div class="carte">
<a href="{{o.href}}" style="display: flex; align-items: center; gap: 12px; color: #F2EDE5;"><span class="mini" style="width: 42px; height: 42px; background: {{o.bg}};">{{o.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{o.t}}</b><span class="meta" style="font-size: 12.5px;">{{o.ent}} · {{o.lieu}}</span></span><span class="score" style="background: {{o.sbg}}; color: {{o.scol}};">{{o.sc}}</span></a>
<div style="margin-top: 10px;"><sc-for list="{{o.raisons}}" as="r" hint-placeholder-count="2"><div class="li" style="font-size: 13px; padding: 1px 0;"><i></i>{{r.t}}</div></sc-for></div>
<sc-if value="{{o.pas}}" hint-placeholder-val="{{ true }}"><button onClick="{{o.candidater}}" class="bp" style="height: 44px; margin-top: 12px; font-size: 14px;">Candidater gratuitement</button></sc-if>
<sc-if value="{{o.deja}}" hint-placeholder-val="{{ false }}"><p style="margin-top: 12px; font-size: 13px; font-weight: 700; color: #A6F26B;">✓ Candidature envoyée</p></sc-if>
</div></sc-for></div></sc-if>
<sc-if value="{{oProfil}}" hint-placeholder-val="{{ false }}"><div>
<div class="bloc"><h3>Compétences</h3><sc-for list="{{comp}}" as="r" hint-placeholder-count="4"><div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14.5px;"><span>{{r.t}}</span><span style="font-size: 12.5px; font-weight: 700; color: {{r.vc}};">{{r.v}}</span></div></sc-for></div>
<div class="bloc"><h3>Expérience</h3><sc-for list="{{exp}}" as="r" hint-placeholder-count="2"><div style="padding: 6px 0;"><b style="display: block; font-size: 14.5px;">{{r.t}}</b><span class="meta">{{r.d}}</span></div></sc-for><button onClick="{{ajouterExp}}" style="margin-top: 8px; min-height: 40px; font-size: 14px; font-weight: 700; color: #A6F26B;">+ Ajouter une expérience</button></div>
<div class="bloc"><h3>Formation</h3><p style="font-size: 14.5px;">Licence en psychologie du travail, UNIKIN</p></div>
</div></sc-if>
<sc-if value="{{oCands}}" hint-placeholder-val="{{ false }}"><div>
<sc-for list="{{mesCands}}" as="c" hint-placeholder-count="2"><div class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 15px;">{{c.t}}</b><span class="meta">{{c.ent}} · envoyée {{c.d}}</span></span><span class="tag" style="font-weight: 700;">{{c.etat}}</span></div></sc-for>
<p class="meta" style="padding: 16px 20px; font-size: 12.5px;">Candidater reste toujours gratuit.</p></div></sc-if>
</div>
<div class="bas"><a href="Recruteur-compte.dc.html" class="bs" style="width: 100%;">Revenir au profil recruteur</a></div>
</div>
@F_CAND@
@F_EXP@
@F_OK@
@TOAST@
'''
for a, b in {'@RETOUR@': ico(I['retour'], 20, '2'), '@TOG@': TOG, '@SEG@': SEG('ongletsT', 3), '@TOAST@': TOAST,
             '@F_EXP@': feuille('fExp', '<b style="display: block; font-size: 17px;">Ajouter une expérience</b><span class="lab">Poste</span><label class="champ"><input value="{{xpPoste}}" onChange="{{ecrirePoste}}" aria-label="Poste" placeholder="Ex. Chargée RH"></label><span class="lab">Entreprise</span>' + PILLS('xpEnts', 5) + '<span class="lab">Période</span>' + PILLS('xpQuands', 2) + '<sc-if value="{{xpPage}}" hint-placeholder-val="{{ false }}"><p style="margin-top: 16px; padding: 12px 14px; border-radius: 16px; background: rgba(47,211,166,.12); color: #CFF5E9; font-size: 13.5px; line-height: 1.5;"><b>{{xpEntNom}}</b> a une page sur Jumanly. {{xpEffet}}</p></sc-if><sc-if value="{{xpSansPage}}" hint-placeholder-val="{{ false }}"><p class="meta" style="margin-top: 16px; font-size: 13px; line-height: 1.5;">Cette entreprise n’a pas encore de page : l’expérience s’affiche sans logo.</p></sc-if><button onClick="{{validerExp}}" class="bp" style="margin-top: 18px;">Ajouter</button><button onClick="{{fermer}}" class="annuler">Annuler</button>'),
             '@F_CAND@': feuille('fCand', '<b style="display: block; font-size: 17px;">Candidater : {{chT}}</b><p class="meta" style="margin-top: 6px; line-height: 1.5;">Votre profil talent est envoyé tel quel. Baobab Fintech n’en est pas informée.</p><button onClick="{{confirmer}}" class="bp" style="margin-top: 16px;">Envoyer ma candidature</button><button onClick="{{fermer}}" class="annuler">Annuler</button>'),
             '@F_OK@': feuille('fOk', '<b style="display: block; font-size: 18px; margin-top: 6px;">Candidature envoyée</b><p class="meta" style="font-size: 14px; margin-top: 6px;">Vous la suivez dans « Mes candidatures ».</p><button onClick="{{fermer}}" class="bp" style="margin-top: 16px;">D’accord</button>', style='text-align: center;')}.items():
    CT = CT.replace(a, b)
ecrire_page('Recruteur-mode-talent', 'Jumanly Modèle B · Recruteur · Profil talent (discret)', CT, JST,
            {'qui': {'editor': 'enum', 'options': ['nadia', 'joseph'], 'default': 'nadia'}, 'onglet': {'editor': 'enum', 'options': ['offres', 'profil', 'candidatures'], 'default': 'offres'}, 'feuille': {'editor': 'enum', 'options': ['aucune', 'candidater', 'exp'], 'default': 'aucune'}})

# ---------------- Page entreprise, côté administrateur ----------------
JSE = '''class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
    const onglet = prop('onglet', 'accueil');
    const reps = st.reps || {};
    const brouillons = st.br || {};
    const decl = st.decl || {};
    const DECL = [['grace', 'Grâce Mbuyi', 'GM', '#E3E8FB', '#2D3F8A', 'Analyste de données · depuis septembre 2026', 'il y a 3 h'], ['fabrice', 'Fabrice Lumbu', 'FL', '#F9E3C8', '#8A4B12', 'Agent Mobile Money · Lubumbashi · depuis 2025', 'hier']];
    const declL = DECL.filter(([k]) => !decl[k] || decl[k] === 'ok').map(([k, nom, ini, bg, fg, r, d]) => ({ nom, ini, bg, fg, r, d, fait: decl[k] === 'ok', attente: !decl[k],
      confirmer: () => { S({ decl: { ...decl, [k]: 'ok' } }); flash(nom.split(' ')[0] + ' apparaît comme membre confirmé'); },
      refuser: () => { S({ decl: { ...decl, [k]: 'non' } }); flash('Merci : ' + nom.split(' ')[0] + ' n’apparaît plus parmi les membres'); } }));
    const nDecl = declL.filter((x) => x.attente).length;
    const Q = [['prisca', 'Prisca Banza', 'PB', 'Proposez-vous des stages en data l’an prochain ?', 'il y a 2 h'], ['glody', 'Glody Kazadi', 'GK', 'Le poste Flutter accepte-t-il des candidats hors de Kinshasa ?', 'hier']];
    const questions = Q.map(([k, nom, ini, t, d]) => ({ nom, ini, t, d, rep: reps[k] || '', aRep: !!reps[k], sansRep: !reps[k], br: brouillons[k] || '',
      ecrire: (e) => S({ br: { ...brouillons, [k]: val(e) } }), envoyer: () => { const b = (brouillons[k] || '').trim(); if (!b) return flash('Écrivez la réponse de Baobab Fintech'); S({ reps: { ...reps, [k]: b }, br: { ...brouillons, [k]: '' } }); flash('Réponse envoyée au nom de Baobab Fintech'); } }));
    return {
      declL, aDecl: declL.length > 0, nDeclT: nDecl ? nDecl + ' à confirmer' : 'Tout est à jour',
      ongletsE: onglets([['accueil', 'Accueil', nDecl ? String(nDecl) : ''], ['publications', 'Publications'], ['messages', 'Messages', String(questions.filter((q) => q.sansRep).length || '')], ['offres', 'Offres']], onglet, 'onglet'),
      oAccueil: onglet === 'accueil', oPubs: onglet === 'publications', oMsg: onglet === 'messages', oOffres: onglet === 'offres', questions,
      tuiles: [['2 140', 'abonnés · +38 cette semaine'], ['1 260', 'vues de la page · 7 jours'], ['3', 'offres en ligne · 1 en pause'], ['170', 'candidatures · 30 jours']].map(([b, t]) => ({ b, t })),
      pubs: [['Bienvenue à Joëlle, notre nouvelle stagiaire marketing, recrutée via Jumanly.', 'hier · 86 réactions'], ['Baobab Fintech recrute un·e analyste de données junior à Kinshasa.', '16 oct. · par Nadia Kalala · 412 vues']].map(([t, d]) => ({ t, d })),
      offres: [['Analyste de données junior', 'Nadia Kalala · 38 candidatures', 'Recruteur-offre-detail.dc.html'], ['Chargé·e de clientèle Mobile Money', 'Nadia Kalala, Patrice Nzuzi · 52 candidatures', 'Recruteur-offres-encours.dc.html'], ['Développeur·se mobile Flutter', 'Nadia Kalala · 9 candidatures', 'Recruteur-offres-encours.dc.html'], ['Stagiaire marketing digital', 'En pause · 71 candidatures', 'Recruteur-offres-encours.dc.html']].map(([t, s, href]) => ({ t, s, href })),
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}'''
CE = '''
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<div style="padding: 50px 12px 10px; background: #14745F; display: flex; align-items: center; gap: 8px;">
<a href="Recruteur-basculer-admin.dc.html" class="rond" aria-label="Changer de profil" style="color: #FFFFFF;">@RETOUR@</a>
<span class="mini" style="width: 40px; height: 40px; background: #0F3F37; border: 2px solid #A6F26B;">BF</span>
<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; color: #FFFFFF;">Baobab Fintech</b><span style="font-size: 12px; color: #DDF6EE;">Vous agissez au nom de l’entreprise</span></span><a href="Recruteur-notifications-admin.dc.html" class="rond" aria-label="Notifications" style="color: #FFFFFF;">@CLOCHE@</a></div>
@SEG@
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 130px;">
<sc-if value="{{oAccueil}}" hint-placeholder-val="{{ true }}"><div>
<sc-if value="{{aDecl}}" hint-placeholder-val="{{ true }}"><div style="margin: 16px 20px 0; padding: 16px; border-radius: 22px; background: #13282C;">
<div style="display: flex; justify-content: space-between; align-items: baseline;"><b style="font-size: 15.5px;">Nouveaux membres</b><span style="font-size: 12.5px; font-weight: 700; color: #A6F26B;">{{nDeclT}}</span></div>
<p class="meta" style="font-size: 12.5px; line-height: 1.45; margin-top: 4px;">Ces personnes indiquent travailler chez Baobab Fintech. Confirmer n’est pas obligatoire : sans réponse, elles restent affichées « Indiqué par la personne ».</p>
<sc-for list="{{declL}}" as="d" hint-placeholder-count="2"><div style="padding: 12px 0 0; margin-top: 12px; border-top: 1px solid rgba(255,255,255,.08);">
<div style="display: flex; gap: 12px; align-items: center;"><span class="av" style="width: 40px; height: 40px; font-size: 12.5px; background: {{d.bg}}; color: {{d.fg}};">{{d.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14.5px;">{{d.nom}}</b><span class="meta" style="font-size: 12.5px;">{{d.r}} · {{d.d}}</span></span></div>
<sc-if value="{{d.attente}}" hint-placeholder-val="{{ true }}"><div style="display: flex; gap: 8px; margin-top: 10px;"><button onClick="{{d.confirmer}}" style="flex: 1; height: 38px; border-radius: 19px; background: #A6F26B; color: #0B1A1F; font-size: 13.5px; font-weight: 700; text-align: center;">Confirmer</button><button onClick="{{d.refuser}}" style="flex: 1; height: 38px; border-radius: 19px; border: 1px solid rgba(255,255,255,.22); color: #F2EDE5; font-size: 13.5px; font-weight: 700; text-align: center;">Ne travaille pas ici</button></div></sc-if>
<sc-if value="{{d.fait}}" hint-placeholder-val="{{ false }}"><p style="margin-top: 8px; font-size: 13px; font-weight: 700; color: #A6F26B;">✓ Membre confirmé</p></sc-if>
</div></sc-for>
<a href="Recruteur-entreprise-membres.dc.html" style="display: block; margin-top: 14px; font-size: 14px; font-weight: 700;">Voir tous les membres</a>
</div></sc-if>
<div class="g2" style="padding: 16px 20px 0;"><sc-for list="{{tuiles}}" as="t" hint-placeholder-count="4"><span class="tuile"><b>{{t.b}}</b>{{t.t}}</span></sc-for></div>
<a href="Recruteur-entreprise.dc.html" class="ligne" style="margin-top: 10px;"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Voir la page comme un talent</b><span class="meta">Ce que voient les abonnés</span></span>@CHEV@</a>
<p class="meta" style="padding: 16px 20px; font-size: 12.5px; line-height: 1.5;">Équipe, formule et réglages de la page se gèrent sur ordinateur, dans l’administration.</p>
</div></sc-if>
<sc-if value="{{oPubs}}" hint-placeholder-val="{{ false }}"><div>
<sc-for list="{{pubs}}" as="x" hint-placeholder-count="2"><a href="Recruteur-fil-publication.dc.html" class="ligne" style="flex-direction: column; align-items: flex-start; gap: 4px;"><span style="font-size: 14.5px; line-height: 1.45;">{{x.t}}</span><span class="meta">{{x.d}}</span></a></sc-for>
</div></sc-if>
<sc-if value="{{oMsg}}" hint-placeholder-val="{{ false }}"><div>
<p class="meta" style="padding: 14px 20px 4px;">Questions envoyées à la page. Vous répondez au nom de Baobab Fintech.</p>
<sc-for list="{{questions}}" as="q" hint-placeholder-count="2"><div class="bloc">
<div style="display: flex; gap: 12px;"><span class="av" style="width: 38px; height: 38px; font-size: 12px;">{{q.ini}}</span><span style="flex: 1;"><span style="display: flex; justify-content: space-between;"><b style="font-size: 14px;">{{q.nom}}</b><span class="meta" style="font-size: 12px;">{{q.d}}</span></span><span style="display: block; font-size: 14.5px; line-height: 1.45; margin-top: 4px;">{{q.t}}</span></span></div>
<sc-if value="{{q.aRep}}" hint-placeholder-val="{{ false }}"><p style="margin: 10px 0 0 50px; padding: 10px 14px; border-radius: 16px; background: #F2EDE5; color: #0B1A1F; font-size: 14px; line-height: 1.45;">{{q.rep}}</p></sc-if>
<sc-if value="{{q.sansRep}}" hint-placeholder-val="{{ true }}"><label class="champ" style="margin-top: 10px; border-color: rgba(255,255,255,.18);"><input value="{{q.br}}" onChange="{{q.ecrire}}" aria-label="Répondre au nom de Baobab Fintech" placeholder="Répondre au nom de Baobab"><button onClick="{{q.envoyer}}" class="env">Envoyer</button></label></sc-if>
</div></sc-for></div></sc-if>
<sc-if value="{{oOffres}}" hint-placeholder-val="{{ false }}"><div>
<p class="meta" style="padding: 14px 20px 4px;">Les offres de toute l’équipe</p>
<sc-for list="{{offres}}" as="o" hint-placeholder-count="4"><a href="{{o.href}}" class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 15px;">{{o.t}}</b><span class="meta">{{o.s}}</span></span>@CHEV@</a></sc-for>
</div></sc-if>
</div>
<div class="bas"><a href="Recruteur-fil-publier-baobab.dc.html" class="bp">Publier au nom de Baobab Fintech</a></div>
</div>
@TOAST@
'''
for a, b in {'@CLOCHE@': ico(I['cloche'], 20, '1.8') if 'cloche' in I else CLOCHE, '@RETOUR@': ico(I['retour'], 20, '2'), '@SEG@': SEG('ongletsE', 4), '@CHEV@': CHEV, '@TOAST@': TOAST}.items():
    CE = CE.replace(a, b)
ecrire_page('Recruteur-mode-entreprise', 'Jumanly Modèle B · Recruteur · Agir au nom de l’entreprise (administrateur)', CE, JSE,
            {'onglet': {'editor': 'enum', 'options': ['accueil', 'publications', 'messages', 'offres'], 'default': 'accueil'}})
import json as _j
L = [('Recruteur-mode-talent-candidatures.dc.html', 'Profil talent · Mes candidatures', 'Recruteur-mode-talent', {'onglet': 'candidatures'}),
     ('Recruteur-mode-talent-joseph.dc.html', 'Profil talent de l’administrateur', 'Recruteur-mode-talent', {'qui': 'joseph'}),
     ('Recruteur-mode-talent-experience.dc.html', 'Profil talent · Ajouter une expérience', 'Recruteur-mode-talent', {'onglet': 'profil', 'feuille': 'exp'}),
     ('Recruteur-mode-entreprise-messages.dc.html', 'Entreprise · répondre au nom de Baobab', 'Recruteur-mode-entreprise', {'onglet': 'messages'})]
for fn, t, n, pr in L:
    importer(n, fn, t, pr)
_j.dump([['Recruteur-basculer.dc.html', 'x'], ['Recruteur-basculer-admin.dc.html', 'x'], ['Recruteur-mode-talent.dc.html', 'x'], L[0][:2], L[1][:2], L[2][:2], ['Recruteur-mode-entreprise.dc.html', 'x'], L[3][:2]], open(os.path.join(D, 'r_modes_pages.json'), 'w'), ensure_ascii=False)
print('ok')
