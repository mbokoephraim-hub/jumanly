# Canvas web du recruteur et de l’administrateur : l’appli sur ordinateur (1440 × 900), deux personnes, toutes les pages.
import os, json as _j, re
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen_r_web.py')).read()
exec(_src[:_src.index('VUES = [')])
from r_web_pil_tpl import SW, PILLX, MODAL as MODALW
I['maison'] = 'M4 11 12 4l8 7v9h-5v-6H9v6H4z'
I['perso'] = 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0'
PW = os.path.join(D, 'w/canvas/project'); os.makedirs(PW, exist_ok=True)
B = lambda h, t, cls='btn2', st='': f'<button onClick="{{{{{h}}}}}" class="{cls}" style="{st}">{t}</button>'
CARTE = lambda inner, st='': f'<div class="carte" style="{st}">{inner}</div>'
H3 = lambda t, st='': f'<b style="display: block; font-size: 16px; margin-bottom: 10px; {st}">{t}</b>'
SWI = lambda pre, lab: (f'<button onClick="{{{{{pre}.basculer}}}}" role="switch" aria-checked="{{{{{pre}.etat}}}}" aria-label="{lab}" class="sw" style="background: {{{{{pre}.fond}}}};"><span style="transform: translateX({{{{{pre}.x}}}});"></span></button>')
SWV = lambda h, o, lab: (f'<button onClick="{{{{{h}}}}}" role="switch" aria-checked="{{{{{o}.etat}}}}" aria-label="{lab}" class="sw" style="background: {{{{{o}.fond}}}};"><span style="transform: translateX({{{{{o}.x}}}});"></span></button>')
RET = lambda h, t: f'<button onClick="{{{{{h}}}}}" style="display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #B9CBC6; min-height: 36px;">{ic("retour", 18, "2")}{t}</button>'
IF = lambda c, inner, d='false': f'<sc-if value="{{{{{c}}}}}" hint-placeholder-val="{{{{ {d} }}}}">{inner}</sc-if>'
STAR = '<button onClick="{{s.pick}}" aria-label="Note" style="font-size: 22px; line-height: 1; color: {{s.col}}; width: 28px; height: 30px; text-align: center;">{{s.t}}</button>'

WCSS2 = '''
.fd .side{overflow-y:auto;scrollbar-width:none;padding:18px 12px 14px}.fd .side::-webkit-scrollbar{display:none}
.fd .side .logo{padding:0 10px 16px}
.fd .nv{height:38px;font-size:14px;gap:12px;flex:none}
.fd .slab{display:block;font-size:11px;font-weight:700;color:#6F8580;padding:14px 12px 5px;letter-spacing:.4px}
.fd .chipx{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 6px 0 13px;border-radius:17px;background:#1B3338;font-size:13px;font-weight:600}
.fd .chipx button{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#8FA39E}
.fd .stp{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border-radius:14px;font-size:14px;font-weight:600}
.fd .stp i{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:12.5px;font-weight:800;flex:none}
.fd .rowl{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.fd .mcell{height:104px;border-radius:12px;padding:7px;display:flex;flex-direction:column;gap:3px;text-align:left;overflow:hidden}
.fd .mcell em{display:block;font-style:normal;font-size:10.5px;font-weight:600;color:#0B1A1F;border-radius:5px;padding:2px 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
'''

def NAVW(k, t, icone, handler, badge=''):
    return NAV(k, t, icone, handler, badge)
SIDEW = ('<aside class="side"><div class="logo"><span>jumanly</span><i></i></div>'
  + NAVW('accueil', 'Accueil', 'maison', 'goAccueil') + NAVW('fil', 'Fil', 'fil', 'goFil') + NAVW('offres', 'Offres', 'offres', 'goOffres') + NAVW('candidatures', 'Candidatures', 'candidatures', 'goCand', '13')
  + NAVW('agenda', 'Agenda', 'cal', 'goAgenda', '2') + NAVW('talents', 'Talents', 'talents', 'goTalents', '2') + NAVW('messages', 'Messages', 'messages', 'goMsg', '3')
  + '<span class="slab">PILOTAGE</span>' + NAVW('tableau', 'Tableau de bord', 'tri', 'goTableau') + NAVW('moi', 'Mon espace', 'carte', 'goMoi')
  + IF('admin', '<div><span class="slab">ENTREPRISE</span>' + NAVW('equipe', 'Équipe', 'equipe', 'goEquipe') + NAVW('pageEnt', 'Page entreprise', 'bat', 'goPageEnt') + NAVW('factu', 'Formule et facturation', 'pdf', 'goFactu') + NAVW('journal', 'Journal', 'oeil', 'goJournal') + NAVW('reglages', 'Réglages', 'reglage', 'goReglages') + '</div>')
  + '<span style="flex: 1; min-height: 12px;"></span>'
  + NAVW('compte', 'Compte', 'perso', 'goCompte')
  + '<button onClick="{{goBascule}}" class="sbas" style="display: flex; align-items: center; gap: 10px; width: 100%; margin-top: 8px; padding: 9px; border-radius: 16px; background: #13282C; color: #F2EDE5; flex: none;">'
    '<span class="av" style="width: 36px; height: 36px; font-size: 12px; position: relative;">{{moiIni}}<span style="position: absolute; right: -4px; bottom: -4px; width: 19px; height: 19px; border-radius: 6px; background: #14745F; color: #FFFFFF; font-size: 7.5px; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 2px solid #13282C;">BF</span></span>'
    '<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 13px;">{{moiN}}</b><span class="meta" style="font-size: 11px;">Changer de profil</span></span></button></aside>')
SIDEW = SIDEW.replace('<div><span class="slab">ENTREPRISE</span>', '<div style="display: flex; flex-direction: column;"><span class="slab">ENTREPRISE</span>')

TOPW = TOP.replace('</button></sc-for></div></sc-if></div>', '</button></sc-for><button onClick="{{voirToutNotifs}}" style="display: block; margin-top: 8px; padding: 6px 12px; font-size: 13px; font-weight: 700; color: #A6F26B; min-height: 32px;">Voir toutes les notifications</button></div></sc-if></div>')
LIEN_ORBI = '<button onClick="{{goOrbiPage}}" style="display: block; margin-top: 10px; font-size: 13px; font-weight: 700; color: #5FE0B8; min-height: 32px;">Ouvrir la conversation complète</button>'
ORBI_TABW = ORBI_TAB.replace('<p class="meta" style="font-size: 11.5px; margin-top: 10px;">Orbi recommande, vous décidez.</p>', '<p class="meta" style="font-size: 11.5px; margin-top: 10px;">Orbi recommande, vous décidez.</p>' + LIEN_ORBI)
DROITEW = DROITE.replace('<p style="font-size: 14px; line-height: 1.55; color: #DDF6EE;">{{oT}}</p></div>', '<p style="font-size: 14px; line-height: 1.55; color: #DDF6EE;">{{oT}}</p>' + LIEN_ORBI + '</div>').replace('Recommande, vous décidez · 310 crédits', 'Recommande, vous décidez · 110 crédits')

# ---------- Accueil ----------
TACHE_L = ('<div class="rowl"><span class="av" style="width: 34px; height: 34px; font-size: 11px; background: {{t.m.bg}}; color: {{t.m.fg}};">{{t.m.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 13.5px;">{{t.type}} · {{t.cand}}</b><span class="meta" style="font-size: 12px;">{{t.m.prenom}} · échéance {{t.d}}</span></span>'
  '<span style="font-size: 12px; font-weight: 700; color: {{t.ecol}};">{{t.etat}}</span><button onClick="{{t.relancer}}" class="btn2" style="height: 32px; padding: 0 12px; font-size: 12px;">Relancer</button></div>')
DEM_L = ('<div class="rowl"><span class="av" style="background: {{d.bg}}; color: {{d.fg}};">{{d.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14px;">{{d.nom}}</b><span class="meta" style="font-size: 12px;">{{d.s}}</span></span>'
  '<button onClick="{{d.non}}" class="btn2" style="height: 34px; padding: 0 12px; font-size: 12.5px;">{{d.nonT}}</button><button onClick="{{d.ok}}" class="btn" style="height: 34px; padding: 0 14px; font-size: 12.5px;">{{d.okT}}</button></div>')
V_ACC = ('<sc-if value="{{vAccueil}}" hint-placeholder-val="{{ true }}"><div>'
  '<div style="display: flex; align-items: flex-end; gap: 12px;"><div style="flex: 1;"><h2 style="font-size: 28px;">{{salut}}</h2><p class="meta" style="margin-top: 4px;">{{dateT}} · Baobab Fintech</p></div>'
  + IF('admin', '<div style="display: flex; gap: 10px;">' + B('inviterMembre', 'Inviter un membre') + B('attribuer', ic('plus', 16, '2.4') + 'Attribuer une tâche', 'btn') + '</div>')
  + IF('pasAdmin', '<div style="display: flex; gap: 10px;">' + B('goAgenda', ic('cal', 18) + 'Ouvrir l’agenda') + '</div>', 'true') + '</div>'
  '<div class="g4" style="margin-top: 20px;"><sc-for list="{{tuilesA}}" as="t" hint-placeholder-count="4"><button onClick="{{t.go}}" class="tuile" style="text-align: left; border: 1px solid rgba(255,255,255,.06);"><b>{{t.b}}</b>{{t.t}}</button></sc-for></div>'
  '<div style="display: flex; gap: 16px; margin-top: 16px; align-items: flex-start;"><div style="flex: 1.3; min-width: 0; display: flex; flex-direction: column; gap: 16px;">'
  + IF('pasAdmin', '<div style="display: flex; flex-direction: column; gap: 16px;">'
    + CARTE(H3('Aujourd’hui') + IF('aEvAuj', '<div><sc-for list="{{evAuj}}" as="e" hint-placeholder-count="2"><button onClick="{{e.go}}" class="rowl" style="width: 100%;"><b style="width: 56px; font-size: 14px;">{{e.h}}</b><span style="width: 5px; height: 40px; border-radius: 3px; background: {{e.bg}}; flex: none;"></span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14px;">{{e.t}}</b><span class="meta" style="font-size: 12px;">{{e.s}}</span></span>' + CHEV + '</button></sc-for></div>', 'true'))
    + CARTE(H3('À traiter') + '<sc-for list="{{aTraiter}}" as="a" hint-placeholder-count="4"><button onClick="{{a.go}}" class="rowl" style="width: 100%;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #A6F26B; flex: none;"></span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14px;">{{a.t}}</b><span class="meta" style="font-size: 12px;">{{a.s}}</span></span>' + CHEV + '</button></sc-for>')
    + '</div>', 'true')
  + IF('admin', '<div style="display: flex; flex-direction: column; gap: 16px;">'
    + CARTE(H3('À valider') + IF('aDemandes', '<div><sc-for list="{{demandes}}" as="d" hint-placeholder-count="3">' + DEM_L + '</sc-for></div>', 'true') + IF('sansDemandes', '<p class="meta">Rien à valider pour l’instant.</p>'))
    + CARTE('<div style="display: flex; align-items: center;"><b style="flex: 1; font-size: 16px;">Tâches de l’équipe en cours</b>' + B('goEquipeTaches', 'Toutes les tâches', 'btn2', 'height: 34px; font-size: 12.5px;') + '</div><div style="margin-top: 6px;"><sc-for list="{{tachesA}}" as="t" hint-placeholder-count="4">' + TACHE_L + '</sc-for></div>')
    + '</div>')
  + '</div><div style="width: 400px; flex: none; display: flex; flex-direction: column; gap: 16px;">'
  + IF('pasAdmin', CARTE(H3('Mes tâches') + '<sc-for list="{{mesTaches}}" as="t" hint-placeholder-count="3"><div class="rowl"><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 13.5px;">{{t.type}} · {{t.cand}}</b><span class="meta" style="font-size: 12px;">Échéance {{t.d}} · {{t.etat}}</span></span><sc-if value="{{t.pasFait}}" hint-placeholder-val="{{ true }}"><button onClick="{{t.avancerT}}" class="btn" style="height: 32px; padding: 0 12px; font-size: 12px;">{{t.btT}}</button></sc-if></div></sc-for>'), 'true')
  + IF('admin', CARTE('<div style="display: flex; align-items: center; margin-bottom: 10px;"><b style="flex: 1; font-size: 16px;">Octobre en chiffres</b>' + B('pdfEntreprise', ic('pdf', 16) + 'PDF', 'btn', 'height: 34px; font-size: 12.5px;') + '</div><div class="g2w" style="gap: 10px;"><sc-for list="{{kpisA}}" as="k" hint-placeholder-count="4"><span class="tuile" style="background: #0F2226; padding: 12px;"><b style="font-size: 21px;">{{k.b}}</b>{{k.t}}</span></sc-for></div>'))
  + CARTE(H3('Offres') + '<sc-for list="{{offresA}}" as="o" hint-placeholder-count="4"><button onClick="{{o.go}}" class="rowl" style="width: 100%;"><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 13.5px;">{{o.t}}</b><span class="meta" style="font-size: 12px;">{{o.s}}</span></span><span style="font-size: 12px; font-weight: 700; color: {{o.stCol}};">{{o.st}}</span></button></sc-for>')
  + CARTE('<div style="display: flex; align-items: center; gap: 10px;">' + ORBI(28) + '<b style="font-size: 15px;">Orbi résume</b></div><p style="font-size: 14px; line-height: 1.55; margin-top: 10px; color: #DDF6EE;">{{orbiA}}</p>' + LIEN_ORBI, 'border: 1px solid rgba(47,211,166,.3);')
  + '</div></div></div></sc-if>')

BIENV = ('<sc-if value="{{bienvenue}}" hint-placeholder-val="{{ false }}"><div class="modal" style="z-index: 70;"><button onClick="{{fermerBienv}}" aria-label="Fermer" class="voile"></button><div class="boite" style="width: 620px; text-align: center;">'
  '<div style="display: flex; justify-content: center;"><span class="mini" style="width: 64px; height: 64px; border-radius: 18px; background: #14745F; font-size: 20px;">BF</span></div>'
  '<h2 style="font-size: 26px; margin-top: 16px;">Bienvenue, {{prenom}}</h2><p class="meta" style="margin-top: 6px;">Votre espace Baobab Fintech est prêt.</p>'
  '<div class="g3" style="margin-top: 22px; text-align: left;"><sc-for list="{{bienvPts}}" as="b" hint-placeholder-count="3"><div style="padding: 16px; border-radius: 18px; background: #0F2226;"><b style="display: block; font-size: 14.5px;">{{b.t}}</b><span class="meta" style="display: block; font-size: 12.5px; margin-top: 6px; line-height: 1.45;">{{b.s}}</span></div></sc-for></div>'
  '<button onClick="{{fermerBienv}}" class="btn" style="margin: 24px auto 0;">Commencer</button></div></div></sc-if>')

# ---------- Offre : détail ----------
V_OFFRE = ('<sc-if value="{{vOffre}}" hint-placeholder-val="{{ false }}"><div>' + RET('retourOffres', 'Offres')
  + '<div style="display: flex; align-items: center; gap: 10px; margin-top: 12px; flex-wrap: wrap;"><div style="flex: 1; min-width: 300px;"><h2 style="font-size: 24px;">{{ofSel.t}}</h2><p class="meta" style="margin-top: 4px;">{{ofSel.lieu}} · publiée le {{ofSel.d}} · <b style="color: {{ofStCol}};">{{ofStatut}}</b></p></div>'
  + B('voirCandOf', 'Voir les {{ofSel.cand}} candidatures', 'btn') + B('partagerOf', ic('partage', 18) + 'Partager') + IF('ofOuverte', '<div style="display: flex; gap: 10px;">' + B('pauseOf', '{{pauseT}}') + B('modifierOf', 'Modifier') + B('cloturerOf', 'Clôturer', 'btn2', 'color: #B9CBC6;') + '</div>', 'true') + '</div>'
  + '<div style="margin-top: 18px;">' + SEG('oOnglets', 3).replace('class="seg"', 'class="seg" style="padding: 0;"') + '</div>'
  + IF('oApercu', '<div style="padding-top: 18px;"><div class="g4"><sc-for list="{{ofTuiles}}" as="t" hint-placeholder-count="4"><span class="tuile"><b>{{t.b}}</b>{{t.t}}</span></sc-for></div>'
    '<div style="display: flex; gap: 16px; margin-top: 16px;">'
    + CARTE(H3('Où en sont les candidatures') + '<sc-for list="{{ofEt}}" as="e" hint-placeholder-count="5"><div class="pq" style="grid-template-columns: 130px 1fr 40px;"><span>{{e.t}}</span><span class="bar" style="height: 12px;"><i style="width: {{e.w}};"></i></span><b style="text-align: right;">{{e.n}}</b></div></sc-for>' + B('voirCandOf', 'Ouvrir l’ATS de cette offre', 'btn2', 'margin-top: 14px;'), 'flex: 1.4;')
    + CARTE(H3('D’où viennent-elles') + '<sc-for list="{{ofSrc}}" as="s" hint-placeholder-count="3"><div class="rowl"><span style="flex: 1; font-size: 14px;">{{s.t}}</span><b>{{s.n}}</b></div></sc-for><p class="meta" style="font-size: 12.5px; margin-top: 12px; line-height: 1.5;">Candidater est gratuit pour tous : chaque personne reçoit une réponse.</p>', 'flex: 1;')
    + '</div></div>', 'true')
  + IF('oAnnonce', '<div style="display: flex; gap: 16px; padding-top: 18px; align-items: flex-start;">'
    + CARTE('<p style="font-size: 15px; line-height: 1.6;">{{ofd.desc}}</p>' + H3('Missions', 'margin-top: 18px;') + '<sc-for list="{{ofMiss}}" as="m" hint-placeholder-count="3"><div class="li"><i></i><span>{{m.t}}</span></div></sc-for>'
      + H3('Compétences requises', 'margin-top: 18px;') + '<div style="display: flex; gap: 8px; flex-wrap: wrap;"><sc-for list="{{ofReq}}" as="r" hint-placeholder-count="3"><span class="tag" style="background: rgba(166,242,107,.14); color: #DFF7C6;">{{r.t}}</span></sc-for></div>'
      + H3('Compétences souhaitées', 'margin-top: 16px;') + '<div style="display: flex; gap: 8px; flex-wrap: wrap;"><sc-for list="{{ofSouh}}" as="r" hint-placeholder-count="2"><span class="tag">{{r.t}}</span></sc-for></div>'
      + H3('Questions de présélection', 'margin-top: 18px;') + '<sc-for list="{{ofQs}}" as="q" hint-placeholder-count="2"><div class="li"><i style="background: #2FD3A6;"></i><span>{{q.t}}</span></div></sc-for>', 'flex: 1.5;')
    + '<div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">' + CARTE(H3('Conditions') + '<div class="rowl"><span class="meta" style="flex: 1;">Contrat</span><b style="font-size: 14px;">{{ofd.contrat}}</b></div><div class="rowl"><span class="meta" style="flex: 1;">Lieu</span><b style="font-size: 14px;">{{ofd.lieu}}</b></div><div class="rowl"><span class="meta" style="flex: 1;">Salaire</span><b style="font-size: 14px;">{{ofd.sal}}</b></div><div class="rowl" style="border: 0;"><span class="meta" style="flex: 1;">Date limite</span><b style="font-size: 14px;">{{ofd.limite}}</b></div>')
    + CARTE('<b style="display: block; font-size: 15px;">Ce que voient les talents</b><p class="meta" style="font-size: 12.5px; margin-top: 6px; line-height: 1.5;">L’annonce, le logo de Baobab Fintech, leur score de compatibilité avec son « Pourquoi ? » et la mention « Candidature gratuite ».</p>') + '</div></div>')
  + IF('oReglages', '<div style="padding-top: 18px; max-width: 720px;">' + CARTE('<div class="rowl"><span class="meta" style="flex: 1;">Responsable de l’offre</span><b style="font-size: 14px;">{{ofd.resp}}</b></div><div class="rowl"><span class="meta" style="flex: 1;">Évaluateurs</span><b style="font-size: 14px;">{{ofd.evals}}</b></div><div class="rowl"><span class="meta" style="flex: 1;">Documents demandés</span><b style="font-size: 14px;">{{ofd.docs}}</b></div><div class="rowl" style="border: 0;"><span class="meta" style="flex: 1;">Accusé de réception</span><b style="font-size: 14px;">Envoyé automatiquement</b></div>' + B('modifierOf', 'Modifier l’offre', 'btn2', 'margin-top: 14px;')) + '</div>')
  + '</div></sc-if>')

# ---------- Nouvelle offre ----------
CHIPX = lambda lst, n=3: f'<div style="display: flex; gap: 8px; flex-wrap: wrap;"><sc-for list="{{{{{lst}}}}}" as="r" hint-placeholder-count="{n}"><span class="chipx">{{{{r.t}}}}<button onClick="{{{{r.retirer}}}}" aria-label="Retirer {{{{r.t}}}}">{ico(I["croix"], 13, "2.4")}</button></span></sc-for></div>'
V_NOUV = ('<sc-if value="{{vNouvelle}}" hint-placeholder-val="{{ false }}"><div style="display: flex; gap: 22px; align-items: flex-start;">'
  '<div style="width: 220px; flex: none;"><sc-for list="{{nEtapes}}" as="e" hint-placeholder-count="5"><button onClick="{{e.go}}" class="stp" style="background: {{e.bg}};"><i style="background: {{e.pcol}}; color: {{e.pfg}};">{{e.sym}}</i>{{e.t}}</button></sc-for><p class="meta" style="font-size: 12px; padding: 14px 12px; line-height: 1.45;">{{nQuotaT}}</p></div>'
  '<div class="carte" style="flex: 1; min-width: 0; padding: 24px;"><p class="meta" style="font-weight: 700;">{{nEtapeT}}</p>'
  + IF('nE1', '<div><span class="lab">Intitulé du poste</span><input class="in" value="{{nf.t}}" onChange="{{ecrireNt}}" aria-label="Intitulé du poste"><span class="lab">Service</span>' + PILLX('nServices', 5)
    + '<span class="lab">Nombre de postes</span><input class="in" style="width: 120px;" value="{{nf.postes}}" onChange="{{ecrireNpostes}}" aria-label="Nombre de postes">'
    + '<div style="display: flex; align-items: center; margin: 20px 0 10px;"><span class="lab" style="margin: 0; flex: 1;">Description</span><button onClick="{{orbiDesc}}" style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #5FE0B8; min-height: 34px;">' + ORBI(22) + 'Orbi propose une description</button></div>'
    + '<textarea class="ta2" style="min-height: 120px;" onChange="{{ecrireNdesc}}" aria-label="Description du poste" placeholder="Ce que la personne fera, avec qui, et pourquoi c’est important">{{nf.desc}}</textarea></div>', 'true')
  + IF('nE2', '<div><span class="lab">Compétences requises · 35 points du score</span>' + CHIPX('nReq') + '<span class="lab">Compétences souhaitées · 10 points</span>' + CHIPX('nSouh', 1)
    + '<div style="display: flex; gap: 10px; margin-top: 18px;"><label class="champ" style="flex: 1; border-color: rgba(255,255,255,.16);"><input value="{{nComp}}" onChange="{{ecrireNcomp}}" aria-label="Ajouter une compétence" placeholder="Ajouter une compétence"></label>' + B('ajouterReq', 'Requise') + B('ajouterSouh', 'Souhaitée') + '</div>'
    + '<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;"><span class="meta" style="font-size: 12.5px; align-self: center;">Orbi suggère</span><sc-for list="{{nSuggComp}}" as="s" hint-placeholder-count="2"><button onClick="{{s.go}}" class="pill" style="border: 1px dashed rgba(47,211,166,.6); color: #9FE8D2;">+ {{s.t}}</button></sc-for></div>'
    + '<p class="meta" style="font-size: 12.5px; margin-top: 18px; line-height: 1.5;">Aucun rejet automatique : une compétence manquante baisse le score, la personne reste visible et reçoit une réponse.</p></div>')
  + IF('nE3', '<div><span class="lab">Contrat</span>' + PILLX('nContrats', 4) + '<span class="lab">Mode de travail</span>' + PILLX('nModes')
    + '<div style="display: flex; align-items: center; gap: 12px; margin-top: 20px;"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Afficher le salaire</b><span class="meta" style="font-size: 12.5px;">Les offres avec un salaire reçoivent plus de candidatures</span></span>' + SWV('basculerSal', 'nSalSw', 'Afficher le salaire') + '</div>'
    + IF('nSalOn', '<input class="in" style="margin-top: 10px;" value="{{nf.sal}}" onChange="{{ecrireNsal}}" aria-label="Salaire">', 'true')
    + '<span class="lab">Date limite</span>' + PILLX('nLimites') + '</div>')
  + IF('nE4', '<div><span class="lab">Questions de présélection</span><sc-for list="{{nQs}}" as="r" hint-placeholder-count="2"><div class="rowl"><span style="flex: 1; font-size: 14px;">{{r.t}}</span><button onClick="{{r.retirer}}" class="btn2" style="height: 32px; padding: 0 12px; font-size: 12px;">Retirer</button></div></sc-for>'
    + '<div style="display: flex; gap: 10px; margin-top: 12px;"><label class="champ" style="flex: 1; border-color: rgba(255,255,255,.16);"><input value="{{nQ}}" onChange="{{ecrireNq}}" aria-label="Ajouter une question" placeholder="Ajouter une question"></label>' + B('ajouterQ', 'Ajouter') + '</div>'
    + '<span class="lab">Documents demandés</span><sc-for list="{{nDocs}}" as="d" hint-placeholder-count="3"><div class="rowl"><span style="flex: 1; font-size: 14px;">{{d.t}}</span>' + SWI('d', '{{d.t}}') + '</div></sc-for>'
    + '<p class="meta" style="font-size: 12.5px; margin-top: 14px;">Les réponses aident à préparer l’entretien ; elles n’éliminent personne.</p></div>')
  + IF('nE5', '<div><span class="lab">Responsable de l’offre</span>' + PILLX('nResps', 2) + '<span class="lab">Évaluateurs (managers)</span><sc-for list="{{nEvals}}" as="d" hint-placeholder-count="2"><div class="rowl"><span style="flex: 1; font-size: 14px;">{{d.t}}</span>' + SWI('d', '{{d.t}}') + '</div></sc-for>'
    + '<div style="margin-top: 18px; padding: 16px; border-radius: 16px; background: #0F2226;"><b style="display: block; font-size: 15px;">{{nf.t}}</b><span class="meta" style="font-size: 12.5px;">{{nContratT}} · {{nModeT}} · date limite {{nf.limite}}</span><p style="font-size: 13.5px; line-height: 1.5; margin-top: 10px; color: #C9D6D2;">{{nDescA}}</p></div>'
    + '<p class="meta" style="font-size: 12.5px; margin-top: 12px;">À la publication, les talents compatibles qui ont rendu leur profil visible sont prévenus.</p></div>')
  + '<div style="display: flex; gap: 10px; margin-top: 26px;">' + B('nPrec', '{{nPrecT}}') + '<span style="flex: 1;"></span>' + B('nSuivant', '{{nSuivT}}', 'btn') + '</div></div>'
  '<div style="width: 300px; flex: none;"><p class="meta" style="font-weight: 700; margin-bottom: 10px;">Aperçu pour les talents</p><div class="carte"><div style="display: flex; align-items: center; gap: 10px;"><span class="mini" style="width: 40px; height: 40px; background: #14745F; font-size: 12px;">BF</span><span><b style="display: block; font-size: 13.5px;">Baobab Fintech</b><span class="meta" style="font-size: 11.5px;">Kinshasa · vérifiée</span></span></div>'
  '<b style="display: block; font-size: 16px; margin-top: 14px;">{{nf.t}}</b><div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;"><span class="tag">{{nContratT}}</span><span class="tag">{{nModeT}}</span></div>' + IF('nSalOn', '<p style="font-size: 13px; font-weight: 700; color: #A6F26B; margin-top: 10px;">{{nf.sal}}</p>', 'true')
  + '<div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px;"><sc-for list="{{nReq}}" as="r" hint-placeholder-count="3"><span class="tag" style="background: rgba(166,242,107,.14); color: #DFF7C6;">{{r.t}}</span></sc-for></div>'
  '<p class="meta" style="font-size: 12.5px; margin-top: 12px; line-height: 1.5; max-height: 76px; overflow: hidden;">{{nDescA}}</p><span style="display: block; margin-top: 14px; padding: 10px; border-radius: 12px; background: #0F2226; text-align: center; font-size: 12.5px; font-weight: 700;">Candidature gratuite</span></div></div>'
  '</div></sc-if>')

# ---------- Candidatures : colonnes ou liste ----------
LISTE = ('<sc-if value="{{cListe}}" hint-placeholder-val="{{ false }}"><div>'
  '<div class="tr th" style="grid-template-columns: 2fr .8fr 1fr 1.3fr 1fr 20px;"><span>Candidat·e</span><span>Score</span><span>Étape</span><span>Suivi par</span><span>Reçue</span><span></span></div>'
  '<sc-for list="{{listeC}}" as="x" hint-placeholder-count="4"><button onClick="{{x.ouvrir}}" class="tr" style="grid-template-columns: 2fr .8fr 1fr 1.3fr 1fr 20px;"><span style="display: flex; align-items: center; gap: 10px;"><span class="av" style="width: 34px; height: 34px; font-size: 11px; background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><b>{{x.nom}}</b></span>'
  '<span>' + sc_('x') + '</span><span>{{x.etT}}</span><span class="meta" style="font-size: 13px;">{{x.suivi}}</span><span class="meta" style="font-size: 13px;">{{x.d}}</span>' + CHEV + '</button></sc-for>'
  '<sc-if value="{{sansListeC}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 20px 0;">Personne avec ce filtre.</p></sc-if></div></sc-if>')
V_CANDW = V_CAND.replace('<div class="kan">', '<div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: -6px 0 16px;">' + PILLX('cModes', 2) + IF('cListe', '<div style="display: flex; gap: 8px; align-items: center;"><span class="meta" style="padding: 0 6px;">·</span>' + PILLX('cFiltres') + '</div>') + '</div><sc-if value="{{cCol}}" hint-placeholder-val="{{ true }}"><div class="kan">', 1)
V_CANDW = V_CANDW[:-len('</div></sc-if>')] + '</sc-if>' + LISTE + '</div></sc-if>'

# ---------- Fiche candidat : onglets ----------
FTABS = '<div style="margin-top: 20px;">' + SEG('fTabs', 7).replace('class="seg"', 'class="seg" style="padding: 0;"') + '</div>'
F_AUTRES = (
  IF('fProfil', '<div style="display: flex; gap: 16px; margin-top: 18px; align-items: flex-start;"><div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">'
    + CARTE(H3('Expériences') + '<sc-for list="{{cExps}}" as="e" hint-placeholder-count="2"><div class="rowl"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{e.t}}</b><span class="meta" style="font-size: 12.5px;">{{e.s}}</span></span></div></sc-for>')
    + CARTE(H3('Formation et langues') + '<p style="font-size: 14px;">{{cForm}}</p><p class="meta" style="margin-top: 8px;">{{cLang}}</p>') + '</div>'
    + '<div style="width: 340px; flex: none; display: flex; flex-direction: column; gap: 16px;">' + CARTE(H3('Compétences') + '<sc-for list="{{cComps}}" as="k" hint-placeholder-count="3"><div class="rowl"><span style="flex: 1; font-size: 14px;">{{k.t}}</span><span style="font-size: 12px; font-weight: 700; color: {{k.vCol}};">{{k.vT}}</span></div></sc-for>' + B('ouvrirCv', ic('pdf', 18) + 'Voir le CV', 'btn', 'margin-top: 14px; width: 100%; justify-content: center;'))
    + '<p class="meta" style="font-size: 12px; line-height: 1.5;">Âge, photo, nationalité et situation familiale ne sont jamais montrés ici ni utilisés par le score.</p></div></div>')
  + IF('fReponses', '<div style="margin-top: 18px; max-width: 820px;">' + CARTE('<sc-for list="{{cReps}}" as="r" hint-placeholder-count="2"><div style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.06);"><p class="meta" style="font-size: 13px;">{{r.q}}</p><p style="font-size: 15px; line-height: 1.5; margin-top: 6px;">{{r.r}}</p></div></sc-for><p class="meta" style="font-size: 12.5px; margin-top: 12px;">Ces réponses aident à préparer l’entretien. Elles n’éliminent personne.</p>') + '</div>')
  + IF('fDiag', '<div style="display: flex; gap: 16px; margin-top: 18px; align-items: flex-start;">'
    + CARTE(H3('Diagnostic de carrière partagé par {{c.nom}}') + '<div class="rowl"><span class="meta" style="width: 130px;">Cap visé</span><b style="font-size: 14px;">{{dCap}}</b></div><div class="rowl"><span class="meta" style="width: 130px;">Points forts</span><span style="font-size: 14px;">{{dForts}}</span></div><div class="rowl" style="border: 0;"><span class="meta" style="width: 130px;">À développer</span><span style="font-size: 14px;">{{dDev}}</span></div>'
      + IF('aTDiag', '<p style="margin-top: 12px; padding: 10px 14px; border-radius: 12px; background: #0F2226; font-size: 13px; color: #9FE8D2;">{{tDiagT}}</p>', 'true'), 'flex: 1.4;')
    + CARTE(H3('Évaluer ce diagnostic') + '<p class="meta" style="font-size: 12.5px; margin-bottom: 10px;">Votre avis sur l’adéquation avec le poste, de 1 à 5</p><div style="display: flex; gap: 4px;"><sc-for list="{{dgEtoiles}}" as="s" hint-placeholder-count="5">' + STAR + '</sc-for></div><p style="font-size: 13px; margin-top: 8px; font-weight: 700;">{{dgT}}</p>' + B('enregistrerDg', 'Enregistrer', 'btn', 'margin-top: 14px;'), 'flex: 1;')
    + '</div>')
  + IF('fEvals', '<div style="margin-top: 18px; max-width: 860px;">' + CARTE(IF('aCEvals', '<div><div class="tr th" style="grid-template-columns: 1.4fr 1fr .8fr 1.2fr; padding: 8px 0;"><span>Évaluateur</span><span>Date</span><span>Note</span><span>Recommandation</span></div><sc-for list="{{cEvals}}" as="e" hint-placeholder-count="2"><div class="tr" style="grid-template-columns: 1.4fr 1fr .8fr 1.2fr; padding: 12px 0;"><b>{{e.par}}</b><span class="meta">{{e.d}}</span><b style="color: #A6F26B;">{{e.n}} / 5</b><span>{{e.r}}</span></div></sc-for></div>', 'true')
    + IF('sansCEvals', '<p class="meta">Pas encore d’évaluation. La grille est prête pour l’entretien.</p>')
    + '<div style="display: flex; gap: 10px; margin-top: 16px;">' + B('evaluer', ic('etoile', 18) + 'Évaluer l’entretien', 'btn') + B('pdfEval', ic('pdf', 18) + 'Compte rendu PDF') + '</div><p class="meta" style="font-size: 12px; margin-top: 12px;">Les évaluations éclairent la décision ; c’est l’équipe qui décide.</p>') + '</div>')
  + IF('fNotes', '<div style="margin-top: 18px; max-width: 820px;">' + CARTE('<sc-if value="{{aCNotes}}" hint-placeholder-val="{{ true }}"><div><sc-for list="{{cNotes}}" as="n" hint-placeholder-count="1"><div style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.06);"><span class="meta" style="font-size: 12.5px;"><b style="color: #F2EDE5;">{{n.par}}</b> · {{n.d}}</span><p style="font-size: 14.5px; line-height: 1.5; margin-top: 4px;">{{n.t}}</p></div></sc-for></div></sc-if>'
    + IF('sansCNotes', '<p class="meta">Aucune note pour l’instant.</p>') + '<div style="display: flex; gap: 10px; margin-top: 14px;"><label class="champ" style="flex: 1; border-color: rgba(255,255,255,.16);"><input value="{{noteBr}}" onChange="{{ecrireNote}}" aria-label="Ajouter une note" placeholder="Ajouter une note pour l’équipe"></label>' + B('ajouterNote', 'Ajouter', 'btn') + '</div><p class="meta" style="font-size: 12px; margin-top: 10px;">Visibles par l’équipe Baobab Fintech, jamais par la personne.</p>') + '</div>')
  + IF('fHisto', '<div style="margin-top: 18px; max-width: 820px;">' + CARTE('<sc-for list="{{cHisto}}" as="h" hint-placeholder-count="4"><div style="display: flex; gap: 14px; padding: 10px 0;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #2FD3A6; margin-top: 5px; flex: none;"></span><span><b style="display: block; font-size: 14px;">{{h.t}}</b><span class="meta" style="font-size: 12.5px;">{{h.s}}</span></span></div></sc-for>') + '</div>'))
V_FICHEW = V_FICHE.replace('Planifier un entretien</button>', 'Planifier un entretien</button><button onClick="{{evaluer}}" class="btn2">' + ic('etoile', 18) + 'Évaluer</button>', 1)
V_FICHEW = V_FICHEW.replace('<div class="g2w" style="margin-top: 22px;">', FTABS + '<sc-if value="{{fResume}}" hint-placeholder-val="{{ true }}"><div class="g2w" style="margin-top: 22px;">', 1)
V_FICHEW = V_FICHEW[:-len('</div></sc-if>')] + '</sc-if>' + F_AUTRES + '</div></sc-if>'
MOD_CV = MODALW('mCv', '<div style="display: flex; gap: 20px;"><div style="width: 300px; flex: none;"><div class="page" style="padding: 24px;"><b style="display: block; font-size: 17px; color: #0F3F37;">{{c.nom}}</b><span style="display: block; font-size: 10px; color: #5B6B68; margin-top: 2px;">{{cTitre}} · Kinshasa</span><span style="display: block; height: 3px; background: #A6F26B; margin: 12px 0; border-radius: 2px;"></span>'
  '<b style="display: block; font-size: 9px; color: #0F3F37; letter-spacing: .5px;">EXPÉRIENCES</b><sc-for list="{{cExps}}" as="e" hint-placeholder-count="2"><span style="display: block; font-size: 9px; margin-top: 5px;"><b>{{e.t}}</b><br><span style="color: #5B6B68;">{{e.s}}</span></span></sc-for>'
  '<b style="display: block; font-size: 9px; color: #0F3F37; letter-spacing: .5px; margin-top: 12px;">FORMATION</b><span style="display: block; font-size: 9px; margin-top: 5px;">{{cForm}}</span>'
  '<b style="display: block; font-size: 9px; color: #0F3F37; letter-spacing: .5px; margin-top: 12px;">COMPÉTENCES</b><span style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 5px;"><sc-for list="{{cComps}}" as="k" hint-placeholder-count="3"><span style="font-size: 8.5px; padding: 2px 6px; border-radius: 4px; background: #F2EDE5;">{{k.t}}</span></sc-for></span>'
  '<b style="display: block; font-size: 9px; color: #0F3F37; letter-spacing: .5px; margin-top: 12px;">LANGUES</b><span style="display: block; font-size: 9px; margin-top: 5px;">{{cLang}}</span></div></div>'
  '<div style="flex: 1;"><b style="display: block; font-size: 19px;">CV de {{c.nom}}</b><p class="meta" style="margin-top: 6px; line-height: 1.5;">Envoyé avec la candidature. Son ouverture est enregistrée dans le journal de Baobab Fintech.</p><div style="display: flex; gap: 10px; margin-top: 22px;">' + B('fermerM', 'Fermer') + '</div></div></div>', 'width: 640px;')

# ---------- Évaluation d’entretien ----------
V_EVAL = ('<sc-if value="{{vEval}}" hint-placeholder-val="{{ false }}"><div>' + RET('retourFiche', 'Fiche de {{c.nom}}')
  + '<h2 style="font-size: 24px; margin-top: 12px;">Évaluer l’entretien de {{c.nom}}</h2><p class="meta" style="margin-top: 4px;">{{evCtx}} · {{evOffre}} · grille commune à l’équipe</p>'
  '<div style="display: flex; gap: 16px; margin-top: 18px; align-items: flex-start;">'
  + CARTE('<sc-for list="{{evCrit}}" as="k" hint-placeholder-count="5"><div class="rowl"><span style="flex: 1; font-size: 14.5px; font-weight: 600;">{{k.t}}</span><span style="display: flex; gap: 2px;"><sc-for list="{{k.et}}" as="s" hint-placeholder-count="5">' + STAR + '</sc-for></span><b style="width: 44px; text-align: right; font-size: 13px;">{{k.nT}}</b></div></sc-for>'
    + '<span class="lab">Votre recommandation</span>' + PILLX('evRecs') + '<p class="meta" style="font-size: 12.5px; margin-top: 8px;">Une recommandation, pas une décision : l’équipe décide ensemble.</p>'
    + '<span class="lab">Commentaire</span><textarea class="ta2" onChange="{{ecrireEvCom}}" aria-label="Commentaire" placeholder="Ce qui vous a convaincu, ce qui reste à vérifier">{{evCom}}</textarea>'
    + '<div style="display: flex; gap: 10px; margin-top: 18px;">' + B('pdfEval', ic('pdf', 18) + 'Aperçu du compte rendu PDF') + '<span style="flex: 1;"></span>' + B('enregistrerEv', 'Enregistrer l’évaluation', 'btn') + '</div>', 'flex: 1; padding: 22px;')
  + '<div style="width: 320px; flex: none; display: flex; flex-direction: column; gap: 16px;">' + CARTE('<span class="meta">Moyenne</span><b style="display: block; font-size: 30px; margin-top: 4px;">{{moyT}}</b>')
  + CARTE(H3('À vérifier') + '<sc-for list="{{c.verif}}" as="f" hint-placeholder-count="1"><div class="li"><i style="background: #F4D59A;"></i><span>{{f.t}}</span></div></sc-for>')
  + CARTE('<div style="display: flex; align-items: center; gap: 10px;">' + ORBI(24) + '<b style="font-size: 14.5px;">Orbi rappelle</b></div><p style="font-size: 13.5px; line-height: 1.5; margin-top: 8px; color: #DDF6EE;">Notez ce que vous avez observé, pas une impression générale. Le score de compatibilité et l’évaluation sont deux choses distinctes.</p>', 'border: 1px solid rgba(47,211,166,.3);')
  + '</div></div></div></sc-if>')

# ---------- Agenda : jour, semaine, mois ----------
A_JOUR = ('<sc-if value="{{agJ}}" hint-placeholder-val="{{ false }}"><div>' + PILLX('jourPills', 5)
  + IF('aEvsJour', '<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 16px;"><sc-for list="{{evsJour}}" as="e" hint-placeholder-count="2"><button onClick="{{e.ouvrir}}" class="carte" style="display: flex; align-items: center; gap: 16px; width: 100%; border: 1px solid {{e.bord}};"><span style="width: 6px; height: 56px; border-radius: 3px; background: {{e.bg}}; flex: none;"></span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15.5px;">{{e.t}}</b><span class="meta" style="font-size: 12.5px;">{{e.s}}</span></span><span style="text-align: right;"><b style="display: block; font-size: 14px;">{{e.h}}</b><span class="meta" style="font-size: 12px;">{{e.qui}}</span></span></button></sc-for></div>', 'true')
  + IF('sansEvsJour', '<div class="carte" style="margin-top: 16px;"><p class="meta">Aucun rendez-vous ce jour.</p>' + B('nouvelEv', 'Nouveau rendez-vous', 'btn', 'margin-top: 12px;') + '</div>')
  + '</div></sc-if>')
A_MOIS = ('<sc-if value="{{agM}}" hint-placeholder-val="{{ false }}"><div><div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; margin-bottom: 6px;">' + ''.join(f'<span class="meta" style="font-size: 12px; font-weight: 700; padding-left: 8px;">{j}</span>' for j in ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.']) + '</div>'
  '<div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px;"><sc-for list="{{MOISG}}" as="d" hint-placeholder-count="35"><sc-if value="{{d.vide}}" hint-placeholder-val="{{ false }}"><span class="mcell"></span></sc-if><sc-if value="{{d.plein}}" hint-placeholder-val="{{ true }}"><button onClick="{{d.go}}" class="mcell" style="background: {{d.bg}}; border: 1px solid {{d.bord}};"><b style="font-size: 13px; color: {{d.col}};">{{d.t}}</b><sc-for list="{{d.evs}}" as="e" hint-placeholder-count="1"><em style="background: {{e.bg}};">{{e.t}}</em></sc-for></button></sc-if></sc-for></div></div></sc-if>')
V_AGENDAW = V_AGENDA.replace('Semaine du 20 au 24 octobre', '{{agTitre}}').replace('<span style="flex: 1;"></span>' + PILLX('agPills'), PILLX('agModes') + '<span style="flex: 1;"></span>' + PILLX('agPills'), 1)
V_AGENDAW = V_AGENDAW.replace('<div class="ag">', '<sc-if value="{{agSem}}" hint-placeholder-val="{{ true }}"><div><div class="ag">', 1).replace('Aujourd’hui : jeudi 22 octobre.</p>', 'Aujourd’hui : jeudi 22 octobre.</p></div></sc-if>' + A_JOUR + A_MOIS, 1)
V_AGENDAW = V_AGENDAW.replace('<sc-for list="{{MOIS}}" as="d" hint-placeholder-count="31"><span style="background: {{d.bg}}; color: {{d.col}}; font-weight: {{d.fw}};">{{d.t}}</span></sc-for>',
  '<sc-for list="{{MOIS}}" as="d" hint-placeholder-count="31"><sc-if value="{{d.vide}}" hint-placeholder-val="{{ false }}"><span></span></sc-if><sc-if value="{{d.plein}}" hint-placeholder-val="{{ true }}"><button onClick="{{d.go}}" style="height: 28px; border-radius: 8px; font-size: 12px; text-align: center; background: {{d.bg}}; color: {{d.col}}; font-weight: {{d.fw}};">{{d.t}}</button></sc-if></sc-for>', 1)
V_AGENDAW = V_AGENDAW.replace('<div class="carte" style="display: flex; align-items: center; gap: 12px;"><span style="flex: 1;"><b style="display: block; font-size: 14px;">Synchroniser</b>',
  '<button onClick="{{ouvrirDispo}}" class="carte" style="display: flex; align-items: center; gap: 12px; width: 100%;"><span style="flex: 1;"><b style="display: block; font-size: 14px;">Mes disponibilités</b><span class="meta" style="font-size: 12px;">{{dispoT}}</span></span>' + CHEV + '</button><div class="carte" style="display: flex; align-items: center; gap: 12px;"><span style="flex: 1;"><b style="display: block; font-size: 14px;">Synchroniser</b>', 1)
assert V_AGENDAW.count('agModes') == 1 and 'agJ' in V_AGENDAW and 'ouvrirDispo' in V_AGENDAW and 'd.plein' in V_AGENDAW
MOD_DISPO = MODALW('mDispo', '<b style="display: block; font-size: 19px;">Mes disponibilités</b><p class="meta" style="margin-top: 6px;">Orbi ne propose des créneaux qu’aux jours ouverts, de 9 h à 17 h.</p><div style="margin-top: 12px;"><sc-for list="{{dispoL}}" as="d" hint-placeholder-count="5"><div class="rowl"><span style="flex: 1; font-size: 14.5px;">{{d.t}}</span>' + SWI('d', '{{d.t}}') + '</div></sc-for></div><div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">' + B('fermerM', 'Annuler') + B('enregistrerDispo', 'Enregistrer', 'btn') + '</div>')

# ---------- Équipe (administrateur) : onglets ----------
ROLE_PICK = ('<span class="lab" style="margin-top: 4px;">Rôle : {{roleT}}</span><div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;"><sc-for list="{{rolesL}}" as="r" hint-placeholder-count="3"><button onClick="{{r.pick}}" style="padding: 10px 12px; border-radius: 12px; border: 1px solid {{r.bord}}; background: {{r.bg}};"><b style="display: block; font-size: 13.5px;">{{r.t}}</b><span class="meta" style="font-size: 11.5px;">{{r.s}}</span></button></sc-for></div><span class="lab">Droits de {{mSel.prenom}}</span>')
EQ_TACHES = ('<sc-if value="{{eqTaches}}" hint-placeholder-val="{{ false }}"><div style="padding-top: 16px;">' + PILLX('tPills', 4)
  + '<div class="tr th" style="grid-template-columns: 1.3fr 1.2fr 1fr 1fr 1.4fr 190px; margin-top: 14px;"><span>Tâche</span><span>Candidat·e</span><span>Membre</span><span>Échéance</span><span>Avancement</span><span></span></div>'
  '<sc-for list="{{tachesF}}" as="t" hint-placeholder-count="5"><div class="tr" style="grid-template-columns: 1.3fr 1.2fr 1fr 1fr 1.4fr 190px;"><b>{{t.type}}</b><span>{{t.cand}}</span><span style="display: flex; align-items: center; gap: 8px;"><span class="av" style="width: 28px; height: 28px; font-size: 10px; background: {{t.m.bg}}; color: {{t.m.fg}};">{{t.m.ini}}</span>{{t.m.prenom}}</span>'
  '<span><span class="meta" style="display: block; font-size: 13px;">{{t.d}}</span><sc-if value="{{t.aRet}}" hint-placeholder-val="{{ false }}"><b style="font-size: 11.5px; color: #F4D59A;">{{t.retT}}</b></sc-if></span>'
  '<span><b style="font-size: 12.5px; color: {{t.ecol}};">{{t.etat}}</b><span class="barre"><i style="width: {{t.pct}};"></i></span></span>'
  '<span style="display: flex; gap: 6px; justify-content: flex-end;"><button onClick="{{t.ouvrirC}}" class="btn2" style="height: 32px; padding: 0 12px; font-size: 12px;">Fiche</button><sc-if value="{{t.pasFait}}" hint-placeholder-val="{{ true }}"><button onClick="{{t.relancer}}" class="btn2" style="height: 32px; padding: 0 12px; font-size: 12px;">Relancer</button></sc-if></span></div></sc-for>'
  + IF('sansTachesF', '<p class="meta" style="padding: 20px 0;">Aucune tâche avec ce filtre.</p>') + '</div></sc-if>')
EQ_INVIT = ('<sc-if value="{{eqInvit}}" hint-placeholder-val="{{ false }}"><div style="display: flex; gap: 16px; padding-top: 16px; align-items: flex-start;">'
  + CARTE(H3('Demandes à valider') + '<p class="meta" style="font-size: 12.5px; margin: -4px 0 6px;">Rattachement à l’équipe, ou personnes qui indiquent travailler chez Baobab Fintech</p>' + IF('aDemandes', '<div><sc-for list="{{demandes}}" as="d" hint-placeholder-count="3">' + DEM_L + '</sc-for></div>', 'true') + IF('sansDemandes', '<p class="meta">Rien à valider.</p>'), 'flex: 1.3;')
  + CARTE('<div style="display: flex; align-items: center; margin-bottom: 6px;"><b style="flex: 1; font-size: 16px;">Invitations envoyées</b>' + B('inviterMembre', 'Inviter', 'btn', 'height: 34px; font-size: 12.5px;') + '</div>'
    + '<sc-for list="{{invsL}}" as="v" hint-placeholder-count="1"><div class="rowl"><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14px;">{{v.nom}}</b><span class="meta" style="font-size: 12px;">{{v.r}} · {{v.d}}</span></span><button onClick="{{v.relancer}}" class="btn2" style="height: 32px; padding: 0 12px; font-size: 12px;">Relancer</button><button onClick="{{v.annuler}}" class="btn2" style="height: 32px; padding: 0 12px; font-size: 12px; color: #B9CBC6;">Annuler</button></div></sc-for>'
    + '<p class="meta" style="font-size: 12.5px; margin-top: 12px;">{{invPlacesT}}</p>', 'flex: 1;')
  + '</div></sc-if>')
V_EQUIPEW = V_EQUIPE.replace('Formule Company · 4 utilisateurs sur 5.', 'Formule Company · {{siegesT}}.').replace('<div class="g3"><sc-for list="{{eqL}}"', SEG('eqOnglets', 3).replace('class="seg"', 'class="seg" style="padding: 0; margin-bottom: 4px;"') + '<sc-if value="{{eqMembres}}" hint-placeholder-val="{{ true }}"><div style="padding-top: 16px;"><div class="g3"><sc-for list="{{eqL}}"', 1)
V_EQUIPEW = V_EQUIPEW.replace('<sc-for list="{{droitsL}}"', ROLE_PICK + '<sc-for list="{{droitsL}}"', 1)
V_EQUIPEW = V_EQUIPEW[:-len('</div></sc-if>')] + '</div></sc-if>' + EQ_TACHES + EQ_INVIT + '</div></sc-if>'
MOD_INV = MODALW('mInviter', '<b style="display: block; font-size: 19px;">Inviter un membre</b><span class="lab">Adresse e-mail</span><input class="in" value="{{invMail}}" onChange="{{ecrireInv}}" aria-label="Adresse e-mail" placeholder="prenom.nom@entreprise.cd"><span class="lab">Rôle</span>' + PILLX('invRoles') + '<p class="meta" style="font-size: 12.5px; margin-top: 14px;">{{invPlacesT}}</p><div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">' + B('fermerM', 'Annuler') + B('envoyerInv', 'Envoyer l’invitation', 'btn') + '</div>', 'width: 560px;')

V_MOIW = V_MOI.replace('Droits accordés par Joseph Ilunga', '{{droitsSrc}}').replace('<span class="barre"><i style="width: {{t.pct}};"></i></span></div></sc-for></div>', '<span class="barre"><i style="width: {{t.pct}};"></i></span></div></sc-for><sc-if value="{{pasMesTaches}}" hint-placeholder-val="{{ false }}"><p class="meta" style="font-size: 13px;">Vous attribuez les tâches ; aucune ne vous est attribuée.</p></sc-if></div>', 1)
assert 'pasMesTaches' in V_MOIW

# ---------- Notifications, Orbi ----------
V_NOTIFS = ('<sc-if value="{{vNotifs}}" hint-placeholder-val="{{ false }}"><div style="max-width: 900px;"><div style="display: flex; align-items: center; gap: 12px;">' + PILLX('nPills', 5) + '<span style="flex: 1;"></span>' + B('toutLu', 'Tout marquer comme lu') + '</div>'
  '<div class="carte" style="margin-top: 16px; padding: 0 18px;"><sc-for list="{{notifsL}}" as="n" hint-placeholder-count="6"><button onClick="{{n.go}}" class="rowl" style="width: 100%; padding: 15px 0;"><span style="width: 9px; height: 9px; border-radius: 50%; background: {{n.pt}}; flex: none;"></span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14.5px;">{{n.t}}</b><span class="meta" style="font-size: 12.5px;">{{n.s}}</span></span><span class="tag">{{n.cat}}</span>' + CHEV + '</button></sc-for></div></div></sc-if>')
V_ORBI = ('<sc-if value="{{vOrbi}}" hint-placeholder-val="{{ false }}"><div style="display: flex; margin: -24px -28px -60px; height: 824px;">'
  '<div style="width: 290px; flex: none; border-right: 1px solid rgba(255,255,255,.07); padding: 18px 14px; display: flex; flex-direction: column; gap: 6px;">' + B('nouvelleConv', ic('plus', 16, '2.4') + 'Nouvelle conversation', 'btn', 'justify-content: center; margin-bottom: 10px;')
  + '<sc-for list="{{oConvs}}" as="o" hint-placeholder-count="3"><button onClick="{{o.go}}" style="display: block; width: 100%; padding: 12px 14px; border-radius: 14px; background: {{o.bg}}; font-weight: {{o.fw}}; font-size: 14px;">{{o.t}}</button></sc-for><span style="flex: 1;"></span><p class="meta" style="font-size: 12px; line-height: 1.45; padding: 0 6px;">{{creditsT}}</p></div>'
  '<div style="flex: 1; min-width: 0; display: flex; flex-direction: column;"><div style="display: flex; align-items: center; gap: 12px; padding: 16px 26px; border-bottom: 1px solid rgba(255,255,255,.07);">' + ORBI(36) + '<span><b style="display: block; font-size: 16px;">Orbi</b><span class="meta" style="font-size: 12.5px;">Recommande, vous décidez</span></span></div>'
  '<div style="flex: 1; overflow-y: auto; padding: 24px 26px; display: flex; flex-direction: column; gap: 14px;"><sc-for list="{{oMsgs}}" as="m" hint-placeholder-count="2"><div style="display: flex; flex-direction: column;">'
  '<sc-if value="{{m.moi}}" hint-placeholder-val="{{ true }}"><div class="bulle" style="background: #F2EDE5; color: #0B1A1F; align-self: flex-end;">{{m.t}}</div></sc-if>'
  '<sc-if value="{{m.orbi}}" hint-placeholder-val="{{ false }}"><div style="display: flex; gap: 10px; align-items: flex-start; max-width: 76%;">' + ORBI(28) + '<div class="bulle" style="max-width: none; background: rgba(47,211,166,.1); border: 1px solid rgba(47,211,166,.3); color: #DDF6EE;">{{m.t}}</div></div></sc-if></div></sc-for></div>'
  '<div style="padding: 12px 26px 22px; border-top: 1px solid rgba(255,255,255,.07);"><div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;"><sc-for list="{{oSugg}}" as="s" hint-placeholder-count="3"><button onClick="{{s.go}}" class="pill" style="border: 1px solid rgba(47,211,166,.45); color: #9FE8D2;">{{s.t}}</button></sc-for></div>'
  '<label class="champ"><input value="{{oBr}}" onChange="{{ecrireOb}}" aria-label="Écrire à Orbi" placeholder="Écrire à Orbi…"><button onClick="{{envoyerOb}}" class="env">Envoyer</button></label></div></div></div></sc-if>')

# ---------- Page entreprise (administrateur) et page publique ----------
CH = lambda lab, v, h: f'<div><span class="lab" style="margin-top: 14px;">{lab}</span><input class="in" value="{{{{pe.{v}}}}}" onChange="{{{{{h}}}}}" aria-label="{lab}"></div>'
V_PAGEENT = ('<sc-if value="{{vPageEnt}}" hint-placeholder-val="{{ false }}"><div style="display: flex; gap: 18px; align-items: flex-start;"><div style="flex: 1; min-width: 0;">'
  '<div class="carte" style="padding: 0; overflow: hidden;"><div style="height: 140px; background: linear-gradient(120deg, #14745F 0%, #0B1A1F 100%); position: relative;"><button onClick="{{changerBann}}" class="btn2" style="position: absolute; right: 14px; top: 14px; height: 36px; background: rgba(11,26,31,.6);">' + ic('photo', 16) + 'Changer la bannière</button></div>'
  '<div style="display: flex; align-items: flex-end; gap: 16px; margin-top: -40px; padding: 0 20px 18px;"><span style="width: 84px; height: 84px; border-radius: 22px; background: #14745F; border: 4px solid #13282C; color: #FFFFFF; font-size: 24px; font-weight: 800; display: flex; align-items: center; justify-content: center;">BF</span>'
  '<span style="flex: 1;"><b style="display: block; font-size: 20px;">{{pe.nom}}</b><span class="meta" style="font-size: 12.5px;">{{pe.secteur}} · {{pe.ville}}</span></span>' + B('changerLogo', 'Changer le logo', 'btn2', 'height: 36px;') + '</div></div>'
  '<div class="carte" style="margin-top: 16px;"><div class="g2w" style="gap: 0 16px;">' + CH('Nom', 'nom', 'ecrirePeNom') + CH('Secteur', 'secteur', 'ecrirePeSect') + CH('Taille', 'taille', 'ecrirePeTaille') + CH('Ville', 'ville', 'ecrirePeVille') + CH('Site', 'site', 'ecrirePeSite') + '</div>'
  '<span class="lab">À propos</span><textarea class="ta2" onChange="{{ecrirePeApropos}}" aria-label="À propos">{{pe.apropos}}</textarea>'
  '<div style="display: flex; align-items: center; gap: 12px; margin-top: 16px;"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Badge « Recrute en ce moment »</b><span class="meta" style="font-size: 12.5px;">Affiché sur la page et dans Explorer</span></span>' + SWV('basculerPeRec', 'peRecSw', 'Recrute en ce moment') + '</div>'
  '<div style="display: flex; gap: 10px; margin-top: 20px;">' + B('goBaobab', ic('oeil', 18) + 'Voir la page publique') + '<span style="flex: 1;"></span>' + B('publierPe', 'Publier les changements', 'btn') + '</div></div></div>'
  '<div style="width: 380px; flex: none; display: flex; flex-direction: column; gap: 16px;">'
  + CARTE(H3('Membres déclarés') + '<p class="meta" style="font-size: 12.5px; margin: -4px 0 6px; line-height: 1.45;">Ces personnes indiquent travailler chez vous. Confirmer est facultatif : sans réponse, « Indiqué par la personne » reste affiché.</p>' + IF('aMembresDecl', '<div><sc-for list="{{membresDecl}}" as="d" hint-placeholder-count="2">' + DEM_L + '</sc-for></div>', 'true') + IF('sansMembresDecl', '<p class="meta">Tout est à jour.</p>'))
  + CARTE('<div style="display: flex; align-items: center; gap: 10px;">' + ico(I['check'], 20, '2.6', '#A6F26B') + '<b style="font-size: 15px;">Entreprise vérifiée</b></div><p class="meta" style="font-size: 12.5px; margin-top: 6px; line-height: 1.45;">Vérifiée par Jumanly : le badge apparaît sur la page et sur chaque offre.</p>')
  + CARTE(H3('Membres confirmés') + '<div style="display: flex; flex-wrap: wrap; gap: 6px;"><sc-for list="{{membresB}}" as="m" hint-placeholder-count="4"><span class="av" title="{{m.nom}}" style="width: 38px; height: 38px; font-size: 12px; background: {{m.bg}}; color: {{m.fg}};">{{m.ini}}</span></sc-for></div>')
  + '</div></div></sc-if>')
V_BAOBAB = ('<sc-if value="{{vBaobab}}" hint-placeholder-val="{{ false }}"><div>' + RET('retourBaobab', '{{retourBaobabT}}')
  + '<div style="height: 150px; border-radius: 24px; background: linear-gradient(120deg, #14745F 0%, #0B1A1F 100%); margin-top: 10px;"></div>'
  '<div style="display: flex; align-items: flex-end; gap: 18px; margin-top: -44px; padding: 0 24px; flex-wrap: wrap;"><span style="width: 92px; height: 92px; border-radius: 24px; background: #14745F; border: 4px solid #0B1A1F; color: #FFFFFF; font-size: 26px; font-weight: 800; display: flex; align-items: center; justify-content: center;">BF</span>'
  '<div style="flex: 1; min-width: 240px; padding-bottom: 6px;"><h2 style="font-size: 24px; display: flex; align-items: center; gap: 8px;">{{pe.nom}}' + ico(I['check'], 20, '2.6', '#A6F26B') + '</h2><p class="meta">{{pe.secteur}} · {{pe.ville}} · {{pe.taille}}</p></div>'
  + IF('peRec', '<span class="tag" style="background: rgba(166,242,107,.14); color: #DFF7C6; margin-bottom: 10px;">{{peRecT}}</span>', 'true') + '</div>'
  '<div style="margin-top: 16px;">' + SEG('bOnglets', 3).replace('class="seg"', 'class="seg" style="padding: 0 16px;"') + '</div>'
  + IF('bApropos', '<div style="padding: 20px 24px; max-width: 760px;"><p style="font-size: 15px; line-height: 1.6;">{{pe.apropos}}</p><p class="meta" style="margin-top: 10px;">{{pe.site}}</p></div>', 'true')
  + IF('bMembres', '<div class="g4" style="padding-top: 18px;"><sc-for list="{{membresB}}" as="m" hint-placeholder-count="4"><div class="carte" style="text-align: center;"><span class="av" style="width: 56px; height: 56px; margin: 0 auto; font-size: 16px; background: {{m.bg}}; color: {{m.fg}};">{{m.ini}}</span><b style="display: block; font-size: 14px; margin-top: 8px;">{{m.nom}}</b><span class="meta" style="display: block; font-size: 12px;">{{m.r}}</span><span style="display: block; font-size: 11.5px; font-weight: 700; color: #A6F26B; margin-top: 4px;">Confirmé par Baobab Fintech</span></div></sc-for></div>')
  + IF('bOffres', '<div style="padding-top: 10px;"><sc-for list="{{offresB}}" as="o" hint-placeholder-count="3"><button onClick="{{o.go}}" class="ligne" style="padding: 14px 0;"><span style="flex: 1;"><b style="display: block; font-size: 15px;">{{o.t}}</b><span class="meta">{{o.s}}</span></span>' + CHEV + '</button></sc-for></div>')
  + '</div></sc-if>')

# ---------- Formule et facturation ----------
V_FACTU = ('<sc-if value="{{vFactu}}" hint-placeholder-val="{{ false }}"><div><div style="display: flex; gap: 16px; align-items: stretch;">'
  + CARTE('<span class="tag" style="background: rgba(166,242,107,.14); color: #DFF7C6;">Formule actuelle</span><h2 style="font-size: 24px; margin-top: 12px;">Company · 79,9 USD par mois</h2><p class="meta" style="margin-top: 6px;">Prépayée jusqu’au 14 novembre 2026 · payée avec M-Pesa</p>'
    + '<p style="font-size: 13.5px; line-height: 1.55; color: #C9D6D2; margin-top: 12px;">Rappels 7, 3 et 0 jours avant l’échéance. Sans paiement, 3 jours de grâce, puis retour à RH Free : aucune donnée n’est perdue.</p>' + B('renouveler', 'Renouveler maintenant', 'btn', 'margin-top: 16px;'), 'flex: 1.1; border: 1px solid rgba(166,242,107,.35);')
  + CARTE(H3('Usage ce mois') + '<sc-for list="{{usageF}}" as="u" hint-placeholder-count="5"><div style="margin-top: 10px;"><div style="display: flex; justify-content: space-between; font-size: 13.5px;"><span>{{u.t}}</span><b>{{u.v}}</b></div><span class="barre"><i style="width: {{u.pct}};"></i></span></div></sc-for>', 'flex: 1;')
  + '</div><h3 style="font-size: 17px; margin: 24px 0 12px;">Changer de formule</h3><div class="g3"><sc-for list="{{plansL}}" as="f" hint-placeholder-count="3"><div class="carte" style="border: 1px solid {{f.bord}}; display: flex; flex-direction: column;"><b style="font-size: 16px;">{{f.t}}</b><b style="font-size: 20px; margin-top: 6px; color: #A6F26B;">{{f.prix}}</b><p class="meta" style="font-size: 12.5px; line-height: 1.5; margin: 8px 0 14px; flex: 1;">{{f.s}}</p>'
  '<sc-if value="{{f.actuel}}" hint-placeholder-val="{{ true }}"><span class="tag" style="align-self: flex-start;">{{f.bt}}</span></sc-if><sc-if value="{{f.autre}}" hint-placeholder-val="{{ false }}"><button onClick="{{f.go}}" class="btn2" style="justify-content: center;">{{f.bt}}</button></sc-if></div></sc-for></div>'
  '<p class="meta" style="font-size: 12.5px; margin-top: 10px;">Monter en gamme prend effet tout de suite ; réduire prend effet à la fin de la période payée.</p>'
  '<div class="carte" style="margin-top: 20px;">' + H3('Factures') + '<div class="tr th" style="grid-template-columns: 1.4fr 1fr 1fr 1.2fr 20px; padding: 8px 0;"><span>Numéro</span><span>Date</span><span>Montant</span><span>Statut</span><span></span></div>'
  '<sc-for list="{{factL}}" as="f" hint-placeholder-count="3"><button onClick="{{f.go}}" class="tr" style="grid-template-columns: 1.4fr 1fr 1fr 1.2fr 20px; padding: 12px 0;"><b>{{f.n}}</b><span class="meta">{{f.d}}</span><span>{{f.m}}</span><span style="color: #A6F26B; font-weight: 600;">{{f.s}}</span>' + CHEV + '</button></sc-for></div></div></sc-if>')
MOD_PAY = MODALW('mPayer', '<b style="display: block; font-size: 19px;">Payer {{payMontant}}</b><p class="meta" style="margin-top: 6px;">{{payPlanT}}</p>'
  + IF('payProrata', '<p style="font-size: 13px; color: #F4D59A; margin-top: 8px;">Le temps restant de votre formule Company est déduit.</p>')
  + IF('payForm', '<div><span class="lab">Moyen de paiement</span>' + PILLX('payOps', 4) + IF('payMm', '<div><span class="lab">Numéro du compte {{payOpT}} qui paie</span><input class="in" value="+243 81 ••• •• 47" aria-label="Numéro Mobile Money" readonly></div>', 'true') + IF('payCarte', '<div><span class="lab">Carte bancaire</span><input class="in" value="•••• •••• •••• 4012" aria-label="Carte" readonly></div>')
    + '<div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px;">' + B('fermerM', 'Annuler') + B('payer', 'Payer {{payMontant}}', 'btn') + '</div></div>', 'true')
  + IF('payAttente', '<div style="text-align: center; padding: 18px 0 4px;"><span style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; border: 4px solid #2A3B3E; border-top-color: #A6F26B;"></span><b style="display: block; font-size: 16px; margin-top: 14px;">Confirmez sur votre téléphone</b><p class="meta" style="margin-top: 6px; line-height: 1.5;">{{payOpT}} vous demande votre code secret. Sans réponse dans 15 minutes, le paiement expire.</p>'
    + '<div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">' + B('payRetry', 'Réessayer') + B('payConfirme', 'J’ai confirmé', 'btn') + '</div></div>')
  + IF('payOk', '<div style="text-align: center; padding: 18px 0 4px;">' + ico(I['check'], 48, '2.4', '#A6F26B') + '<b style="display: block; font-size: 17px; margin-top: 10px;">Paiement reçu</b><p class="meta" style="margin-top: 6px;">La facture arrive par e-mail. Votre formule est prolongée d’un mois.</p>' + B('payFin', 'Terminer', 'btn', 'margin: 20px auto 0;') + '</div>'), 'width: 560px;')
MOD_FACT = MODALW('mFacture', '<div style="display: flex; gap: 22px;"><div style="width: 260px; flex: none;"><div class="page"><div style="display: flex; align-items: center; justify-content: space-between;"><span style="display: flex; align-items: center; gap: 3px; font-size: 15px; font-weight: 700; color: #0F3F37;">jumanly<i style="width: 5px; height: 5px; border-radius: 50%; background: #3DA14F; display: block; margin-top: 6px;"></i></span><b style="font-size: 9px; color: #0F3F37;">FACTURE</b></div>'
  '<span style="display: block; height: 3px; background: #A6F26B; margin: 10px 0 12px; border-radius: 2px;"></span><span style="display: block; font-size: 8px; color: #5B6B68;">{{fact.n}} · {{fact.d}}</span><b style="display: block; font-size: 10px; margin-top: 10px; color: #0F3F37;">Baobab Fintech</b><span style="display: block; font-size: 8px; color: #5B6B68;">Kinshasa, RD Congo</span>'
  '<span style="display: flex; justify-content: space-between; font-size: 8.5px; margin-top: 16px; padding: 6px 0; border-top: 1px solid #DCE5E1; border-bottom: 1px solid #DCE5E1;"><span>Formule Company · 1 mois</span><b>{{fact.m}}</b></span><span style="display: flex; justify-content: space-between; font-size: 9.5px; margin-top: 8px;"><b>Total</b><b>{{fact.m}}</b></span>'
  '<span style="display: block; font-size: 7.5px; color: #5B6B68; margin-top: 8px;">{{fact.s}}</span><span style="position: absolute; left: 0; right: 0; bottom: 0; height: 22px; background: #0F3F37; color: #F2EDE5; font-size: 6px; display: flex; align-items: center; padding: 0 12px;">Une plateforme développée par The Growth Lab · assistant@jumanly.io</span></div></div>'
  '<div style="flex: 1;"><b style="display: block; font-size: 19px;">Facture {{fact.n}}</b><p class="meta" style="margin-top: 6px;">{{fact.d}} · {{fact.m}} · {{fact.s}}</p><p style="font-size: 13.5px; line-height: 1.5; margin-top: 12px; color: #C9D6D2;">Envoyée aussi par e-mail à l’administrateur.</p><div style="display: flex; gap: 10px; margin-top: 22px;">' + B('fermerM', 'Fermer') + '</div></div></div>', 'width: 620px;')

# ---------- Journal et réglages ----------
V_JOURNAL = ('<sc-if value="{{vJournal}}" hint-placeholder-val="{{ false }}"><div><p class="meta" style="max-width: 760px; line-height: 1.5; margin-bottom: 14px;">Chaque consultation de profil, ouverture de CV, évaluation ou export est enregistrée automatiquement. Seul l’administrateur voit ce journal.</p>' + PILLX('jPills', 5)
  + '<div class="tr th" style="grid-template-columns: 1.2fr 1.1fr 1.4fr 1.2fr 1.6fr 20px; margin-top: 14px;"><span>Date</span><span>Membre</span><span>Action</span><span>Personne</span><span>Offre ou objet</span><span></span></div>'
  '<sc-for list="{{journal}}" as="j" hint-placeholder-count="6"><button onClick="{{j.go}}" class="tr" style="grid-template-columns: 1.2fr 1.1fr 1.4fr 1.2fr 1.6fr 20px;"><span class="meta" style="font-size: 13px;">{{j.d}}</span><span style="display: flex; align-items: center; gap: 8px;"><span class="av" style="width: 28px; height: 28px; font-size: 10px; background: {{j.m.bg}}; color: {{j.m.fg}};">{{j.m.ini}}</span>{{j.m.prenom}}</span><span>{{j.a}}</span><b>{{j.pers}}</b><span class="meta" style="font-size: 13px;">{{j.of}}</span>' + CHEV + '</button></sc-for></div></sc-if>')
V_REGL = ('<sc-if value="{{vReglages}}" hint-placeholder-val="{{ false }}"><div>' + SEG('rgOnglets', 3).replace('class="seg"', 'class="seg" style="padding: 0;"')
  + IF('rgEtapes', '<div style="padding-top: 18px; max-width: 760px;">' + CARTE('<sc-for list="{{etapesL}}" as="e" hint-placeholder-count="5"><div class="rowl"><span class="av" style="width: 32px; height: 32px; font-size: 12px;">{{e.n}}</span><b style="flex: 1; font-size: 14.5px;">{{e.t}}</b><sc-if value="{{e.fixe}}" hint-placeholder-val="{{ false }}"><span class="tag">Toujours présente</span></sc-if><sc-if value="{{e.modif}}" hint-placeholder-val="{{ true }}"><button onClick="{{e.retirer}}" class="btn2" style="height: 32px; padding: 0 12px; font-size: 12px;">Retirer</button></sc-if></div></sc-for>'
    + IF('pasTest', B('ajouterEtape', ic('plus', 16, '2.4') + 'Ajouter « Test pratique »', 'btn2', 'margin-top: 14px;'), 'true') + '<p class="meta" style="font-size: 12.5px; margin-top: 14px; line-height: 1.5;">S’applique aux nouvelles offres. La décision (retenu·e ou non) est toujours prise par une personne : Orbi n’écarte personne.</p>') + '</div>', 'true')
  + IF('rgModeles', '<div style="display: flex; gap: 16px; padding-top: 18px; align-items: flex-start;"><div style="width: 260px; flex: none;"><sc-for list="{{modsL}}" as="m" hint-placeholder-count="4"><button onClick="{{m.go}}" style="display: block; width: 100%; padding: 12px 14px; border-radius: 14px; background: {{m.bg}}; font-weight: {{m.fw}}; font-size: 14px;">{{m.t}}</button></sc-for></div>'
    + CARTE(H3('{{modT}}') + '<textarea class="ta2" style="min-height: 160px;" onChange="{{ecrireMod}}" aria-label="Texte du modèle">{{modTexte}}</textarea><p class="meta" style="font-size: 12.5px; margin-top: 8px;">Remplacés à l’envoi : {prénom}, {offre}, {compétence}, {recruteur}</p>' + B('enregistrerMod', 'Enregistrer', 'btn', 'margin-top: 14px;'), 'flex: 1;') + '</div>')
  + IF('rgGrille', '<div style="padding-top: 18px; max-width: 760px;">' + CARTE('<sc-for list="{{grilleL}}" as="g" hint-placeholder-count="5"><div class="rowl"><span class="av" style="width: 32px; height: 32px; font-size: 12px;">{{g.n}}</span><b style="flex: 1; font-size: 14.5px;">{{g.t}}</b><button onClick="{{g.retirer}}" class="btn2" style="height: 32px; padding: 0 12px; font-size: 12px;">Retirer</button></div></sc-for>'
    + '<div style="display: flex; gap: 10px; margin-top: 14px;"><label class="champ" style="flex: 1; border-color: rgba(255,255,255,.16);"><input value="{{grAj}}" onChange="{{ecrireGr}}" aria-label="Ajouter un critère" placeholder="Ajouter un critère"></label>' + B('ajouterGr', 'Ajouter') + '</div><p class="meta" style="font-size: 12.5px; margin-top: 12px;">Chaque critère est noté de 1 à 5 par l’évaluateur, après l’entretien.</p>') + '</div>')
  + '</div></sc-if>')

# ---------- Compte ----------
V_COMPTEW = (V_COMPTE.replace('<span class="av" style="width: 72px; height: 72px; font-size: 22px;">NK</span><span style="flex: 1;"><h2 style="font-size: 21px;">Nadia Kalala</h2><span class="meta">Chargée de recrutement · Baobab Fintech · Kinshasa</span>', '<span class="av" style="width: 72px; height: 72px; font-size: 22px;">{{moiIni}}</span><span style="flex: 1;"><h2 style="font-size: 21px;">{{moiN}}</h2><span class="meta">{{moiRole}} · Baobab Fintech · Kinshasa</span>')
  .replace('Je cherche des talents data et service client qui veulent rendre le paiement mobile plus simple. Réponse à chaque candidature.', '{{moiBio}}')
  .replace('<span class="av">NK</span><span style="flex: 1;"><b style="display: block;">Profil recruteur</b><span class="meta" style="font-size: 12.5px;">Nadia Kalala · Baobab Fintech · actuel</span>', '<span class="av">{{moiIni}}</span><span style="flex: 1;"><b style="display: block;">Profil recruteur</b><span class="meta" style="font-size: 12.5px;">{{moiN}} · Baobab Fintech · actuel</span>')
  .replace('<span class="av" style="background: #DDF6EE; color: #14745F;">NK</span>', '<span class="av" style="background: #DDF6EE; color: #14745F;">{{moiIni}}</span>'))
_ent_old = re.search(r'<div class="carte" style="display: flex; align-items: center; gap: 14px; opacity: \.75;">.*?</div>', V_COMPTEW).group(0)
V_COMPTEW = V_COMPTEW.replace(_ent_old, IF('pasAdmin', _ent_old, 'true') + IF('admin', '<button onClick="{{goPageEnt}}" class="carte" style="display: flex; align-items: center; gap: 14px; width: 100%;"><span class="mini" style="background: #14745F;">BF</span><span style="flex: 1;"><b style="display: block;">Baobab Fintech</b><span class="meta" style="font-size: 12.5px;">Agir au nom de l’entreprise : page, publications, membres</span></span>' + CHEV + '</button>'))
V_COMPTEW = V_COMPTEW.replace('L’administration de l’entreprise (équipe, formule, réglages) se fait sur ordinateur, dans l’espace Entreprise : étape 3 de la refonte.', 'L’administration de l’entreprise (équipe, formule, réglages) est réservée à l’administrateur, sur ordinateur.')
V_COMPTEW = V_COMPTEW.replace('<p class="meta" style="font-size: 12.5px; margin-top: 12px;">Pour inviter un collègue, Joseph Ilunga valide la demande.</p>', IF('pasAdmin', '<p class="meta" style="font-size: 12.5px; margin-top: 12px;">Pour inviter un collègue, Joseph Ilunga valide la demande.</p>', 'true') + IF('admin', B('goEquipe', 'Gérer l’équipe', 'btn', 'margin-top: 14px;')))
V_COMPTEW = V_COMPTEW.replace('<button onClick="{{demanderPlus}}" class="btn2" style="margin-top: 18px;">Demander plus à l’administrateur</button>', IF('pasAdmin', '<button onClick="{{demanderPlus}}" class="btn2" style="margin-top: 18px;">Demander plus à l’administrateur</button>', 'true') + IF('admin', B('goFactu', 'Formule et facturation', 'btn', 'margin-top: 18px;')))
C_NEW = (IF('cSecurite', CARTE('<div class="rowl"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Mot de passe</b><span class="meta" style="font-size: 12.5px;">Modifié il y a 2 mois</span></span>' + B('changerMdp', 'Changer') + '</div>'
    + '<div class="rowl"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Connexion en deux étapes</b><span class="meta" style="font-size: 12.5px;">Un code par e-mail à chaque nouvel appareil</span></span>' + SWV('basculerDeuxEt', 'deuxEtSw', 'Connexion en deux étapes') + '</div>'
    + H3('Appareils connectés', 'margin-top: 16px;') + '<sc-for list="{{sessions}}" as="s" hint-placeholder-count="2"><div class="rowl"><span style="flex: 1;"><b style="display: block; font-size: 14px;">{{s.t}}</b><span class="meta" style="font-size: 12.5px;">{{s.s}}</span></span><sc-if value="{{s.ici}}" hint-placeholder-val="{{ true }}"><span class="tag">Cet appareil</span></sc-if><sc-if value="{{s.pasIci}}" hint-placeholder-val="{{ false }}"><button onClick="{{s.fermer}}" class="btn2" style="height: 32px; padding: 0 12px; font-size: 12px;">Déconnecter</button></sc-if></div></sc-for>'))
  + IF('cNotifsP', CARTE('<sc-for list="{{nPrefL}}" as="d" hint-placeholder-count="5"><div class="rowl"><span style="flex: 1; font-size: 14.5px;">{{d.t}}</span>' + SWI('d', '{{d.t}}') + '</div></sc-for><p class="meta" style="font-size: 12.5px; margin-top: 12px;">Dans l’appli et par e-mail. Jamais de SMS.</p>'))
  + IF('cAide', CARTE('<sc-for list="{{faq}}" as="q" hint-placeholder-count="3"><div style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.06);"><b style="display: block; font-size: 14.5px;">{{q.q}}</b><p class="meta" style="font-size: 13px; line-height: 1.5; margin-top: 4px;">{{q.r}}</p></div></sc-for><p style="font-size: 14px; margin-top: 14px;">Une question ? Écrivez à <b style="color: #A6F26B;">assistant@jumanly.io</b></p>'))
  + IF('cSortie', CARTE('<b style="display: block; font-size: 17px;">Se déconnecter de Jumanly ?</b><p class="meta" style="margin-top: 6px;">Vous resterez connecté·e sur vos autres appareils.</p><div style="display: flex; gap: 10px; margin-top: 18px;"><a href="Web-acces-connexion.dc.html" class="btn">' + ic('sortie', 18) + 'Se déconnecter</a>' + B('goCompte', 'Rester connecté·e') + '</div>')))
V_COMPTEW = V_COMPTEW[:-len('</div></div></sc-if>')] + C_NEW + '</div></div></sc-if>'

MOD_PART = MODALW('mPartage', '<b style="display: block; font-size: 19px;">Partager l’offre</b><p class="meta" style="margin-top: 6px;">Le lien ouvre l’annonce ; la candidature reste gratuite.</p><input class="in" style="margin-top: 16px;" value="{{lienOf}}" aria-label="Lien de l’offre" readonly><div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">' + B('fermerM', 'Fermer') + B('copierLien', ic('lien', 18) + 'Copier le lien', 'btn') + '</div>')
MOD_CLOT = MODALW('mCloture', '<b style="display: block; font-size: 19px;">Clôturer « {{ofSel.t}} » ?</b><p class="meta" style="margin-top: 6px; line-height: 1.5;">Les {{nEnCours}} personnes encore en cours reçoivent un message bienveillant. Leurs candidatures restent dans votre historique.</p><div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px;">' + B('fermerM', 'Annuler') + B('confirmerCloture', 'Clôturer l’offre', 'btn') + '</div>')

CORPSW = ('<div class="app">' + SIDEW + '<div class="main">' + TOPW + '<div class="zone"><div class="centre scroll">'
  + V_ACC + V_CANDW + V_FICHEW + V_OFFRES + V_OFFRE + V_NOUV + V_EVAL + V_TAL + V_MSG + V_FIL + V_ENT + V_COMPTEW + V_AGENDAW + V_EQUIPEW + V_TABLEAU + V_MOIW + V_NOTIFS + V_ORBI + V_PAGEENT + V_BAOBAB + V_FACTU + V_JOURNAL + V_REGL
  + '</div>' + DROITEW + '</div></div></div>' + ORBI_TABW + MODALES + MOD_PIL + MOD_CV + MOD_DISPO + MOD_INV + MOD_PAY + MOD_FACT + MOD_PART + MOD_CLOT + BIENV + TOASTW)

# ---------- Logique ----------
PIL_JS = open(os.path.join(D, 'r_web_pilotage.js')).read()
for a, b in [("[['lun', 'Lun. 20'], ['mar', 'Mar. 21'], ['mer', 'Mer. 22'], ['jeu', 'Jeu. 23'], ['ven', 'Ven. 24']]", "[['lun', 'Lun. 19'], ['mar', 'Mar. 20'], ['mer', 'Mer. 21'], ['jeu', 'Jeu. 22'], ['ven', 'Ven. 23']]"),
             ("['e4', 'jeu', 10, 0.75,", "['e4', 'ven', 10, 0.75,"), ("['e6', 'ven', 11, 0.5,", "['e6', 'ven', 15, 0.5,"),
             ("['e7', 'lun', 16, 1, 'equipe', 'Préparer la journée carrière', 'Samedi 14 novembre, Kinshasa', ['joseph', 'nadia'], '']", "['e7', 'lun', 16, 1, 'equipe', 'Préparer la journée carrière', 'Samedi 14 novembre, Kinshasa', ['joseph', 'nadia'], ''],\n      ['e8', 'jeu', 11, 0.5, 'appel', 'Appel · Ruth Kalenga', 'Chargé·e de clientèle · premier échange de 30 min', ['nadia'], 'ruth']"),
             ("const evK = prop('evK', 'e4');", "const evK = prop('evK', 'e5');"), ("const sem = d >= 20 && d <= 24; const occ = [20, 21, 22, 23, 24, 28, 30].includes(d);", "const sem = d >= 19 && d <= 23; const occ = [19, 20, 21, 22, 23, 28, 30].includes(d);"),
             ("'Ven. 24 · 9 h'", "'Ven. 23 · 9 h'"), ("'Ven. 24 · 14 h'", "'Ven. 23 · 14 h'"), ("'Jeu. 23 · 16 h'", "'Jeu. 22 · 16 h'"),
             ("['t1', 'entretien', 'grace', 'aline', 'Jeu. 23 oct.'", "['t1', 'entretien', 'grace', 'aline', 'Ven. 23 oct.'"), ("['t6', 'entretien', 'moussa', 'nadia', 'Jeu. 23 oct.'", "['t6', 'entretien', 'moussa', 'nadia', 'Jeu. 22 oct.'"),
             ("['t4', 'suivre', 'nathan', 'patrice', 'Ven. 24 oct.', 2]", "['t4', 'suivre', 'nathan', 'patrice', 'Mer. 21 oct.', 1]"),
             ("'Ven. 24 oct.'", "'Lun. 26 oct.'"), ("'Ven. 31 oct.'", "'Ven. 30 oct.'"), ("'Mar. 28 oct.'", "'Mer. 28 oct.'"), ("'Lun. 20 oct.'", "'Mar. 20 oct.'"),
             ("[['22 sept.', 31], ['29 sept.', 38], ['6 oct.', 44], ['13 oct.', 52], ['20 oct.', 36]]", "[['21 sept.', 31], ['28 sept.', 38], ['5 oct.', 44], ['12 oct.', 52], ['19 oct.', 36]]"),
             ("const admin = oui(p.admin);", "const admin = oui(p.admin) || p.qui === 'joseph';"),
             ("const pilote = ['agenda', 'equipe', 'tableau', 'moi'].includes(vue);", "const pilote = ['agenda', 'equipe', 'tableau', 'moi', 'accueil', 'offre', 'nouvelle', 'evaluation', 'notifs', 'orbi', 'pageEnt', 'baobab', 'factu', 'journal', 'reglages', 'compte'].includes(vue);"),
             ("Rendez-vous annulé : la personne est prévenue par e-mail et message'); },", "Rendez-vous annulé : la personne est prévenue par e-mail et message'); },")]:
    assert a in PIL_JS, a
    PIL_JS = PIL_JS.replace(a, b)
BASE = open(os.path.join(D, 'r_web_logic.js')).read()
for a, b in [("const vue = prop('vue', 'candidatures');", "const vue = prop('vue', 'accueil');"),
             ("const navOn = (k) => (vue === k || (k === 'candidatures' && vue === 'candidat') ? '#13282C' : 'transparent');", "const GRP = { candidat: 'candidatures', evaluation: 'candidatures', offre: 'offres', nouvelle: 'offres', baobab: 'pageEnt', notifs: 'accueil', orbi: 'accueil' };\n    const navOn = (k) => (vue === k || GRP[vue] === k ? '#13282C' : 'transparent');"),
             ("const navCol = (k) => (vue === k || (k === 'candidatures' && vue === 'candidat') ? '#F2EDE5' : '#8FA39E');", "const navCol = (k) => (vue === k || GRP[vue] === k ? '#F2EDE5' : '#8FA39E');"),
             ("const TITRES = {", "const TITRES = { accueil: 'Accueil', nouvelle: 'Publier une offre', evaluation: 'Évaluation d’entretien', notifs: 'Notifications', orbi: 'Orbi', pageEnt: 'Page entreprise', baobab: 'Baobab Fintech', factu: 'Formule et facturation', journal: 'Journal des consultations', reglages: 'Réglages du recrutement',"),
             ("titre: TITRES[vue],", "titre: vue === 'offre' ? ofSel.t : TITRES[vue],"),
             ("...PIL,", "...PIL, ...W,"),
             ("publierOffre: () => S({ modal: 'offre' }),", "publierOffre: go('nouvelle', { nStep: 1 }),"),
             ("ouvrir: go('candidat', { candK: k }) }; });", "ouvrir: go('candidat', { candK: k, fT: 'resume' }) }; });"),
             ("['Jeu. 23 oct. · 10 h', 'Jeu. 23 oct. · 14 h', 'Ven. 24 oct. · 9 h 30']", "['Ven. 23 oct. · 14 h', 'Lun. 26 oct. · 10 h', 'Mar. 27 oct. · 9 h 30']"),
             ("'Entretien jeudi']", "'Entretien mardi · compte rendu prêt']"),
             ("votre entretien est confirmé demain à 10 h, en visio avec Aline Mukeba.", "votre entretien est confirmé vendredi à 10 h, en visio avec Aline Mukeba."),
             ("['Crédits Orbi ce mois', '310 sur 500', '62%']", "['Crédits Orbi ce mois', '190 sur 300', '63%']"),
             ("['tableau', 'Tableau de bord']" if False else "['modeles', 'Modèles de messages']].map", "['modeles', 'Modèles de messages'], ['securite', 'Sécurité et connexion'], ['notifs', 'Notifications'], ['aide', 'Aide et contact'], ['sortie', 'Se déconnecter']].map"),
             ("ficheConv: go('candidat', { candK: conv[0] === 'grace' ? 'grace' : 'benjamin' })", "ficheConv: go('candidat', { candK: conv[0] === 'grace' ? 'grace' : 'benjamin', fT: 'resume' })")]:
    assert a in BASE, a
    BASE = BASE.replace(a, b)
BASE = re.sub(r"      OFFRES: OFFRES\.map\(.*\n", "      OFFRES: ofTous.map((o) => { const s0 = ofSt[o.k] || o.statut; return { ...o, statut: s0, candT: String(o.cand), nouvT: o.nouv ? '+' + o.nouv : '—', enLigne: s0 === 'En ligne', stCol: s0 === 'En ligne' ? '#A6F26B' : s0 === 'Clôturée' ? '#8FA39E' : '#F4D59A', ouvrir: go('offre', { offre: o.k, oTab: 'apercu' }) }; }),\n", BASE, count=1)
assert 'ofTous.map((o) => { const s0' in BASE
EXT = open(os.path.join(D, 'w_ext.js')).read()
EXT = EXT.replace("      orbiFlot: (tab || pilote) && vue !== 'orbi',", "      orbiFlot: (tab || pilote) && vue !== 'orbi', goEquipeTaches: go('equipe', { eqOng: 'taches' }), pasMesTaches: mesTaches.length === 0, retourBaobab: admin ? go('pageEnt') : go('compte', { cV: 'profil' }), retourBaobabT: admin ? 'Modifier la page' : 'Compte',")
EXT = EXT.replace("evsJour, aEvsJour: evsJour.length > 0, sansEvsJour: evsJour.length === 0, MOISG,", "evsJour, aEvsJour: evsJour.length > 0, sansEvsJour: evsJour.length === 0, MOISG: MOISG.map((d) => ({ ...d, plein: !d.vide })),")
EXT = EXT.replace("MOIS: MOIS.map((d) => ({ ...d, go:", "MOIS: MOIS.map((d) => ({ ...d, plein: !d.vide, go:")
JSW = BASE.replace('/*PILOTAGE*/', PIL_JS + EXT).replace("goEnt: go('entreprise'),", "goEnt: go('entreprise'), voirMembresE: () => S({ eOng: 'membres' }),")

VUESW = ['accueil', 'fil', 'offres', 'offre', 'nouvelle', 'candidatures', 'candidat', 'evaluation', 'agenda', 'talents', 'messages', 'notifs', 'orbi', 'tableau', 'moi', 'compte', 'entreprise', 'baobab', 'equipe', 'pageEnt', 'factu', 'journal', 'reglages']
PROPS = {'qui': ['nadia', 'joseph'], 'vue': VUESW, 'offre': ['analyste', 'clientele', 'flutter', 'marketing'], 'oTab': ['apercu', 'annonce', 'reglages'], 'nStep': ['1', '2', '3', '4', '5'], 'cMode': ['colonnes', 'liste'],
         'candK': ['grace', 'benjamin', 'esther', 'didier', 'moussa', 'nathan'], 'fT': ['resume', 'profil', 'reponses', 'diagnostic', 'evaluations', 'notes', 'historique'], 'agMode': ['semaine', 'jour', 'mois'], 'sousT': ['decouvrir', 'vivier', 'propositions', 'reseau'],
         'eqOng': ['membres', 'taches', 'invitations'], 'cV': ['profil', 'bascule', 'equipe', 'formule', 'confid', 'modeles', 'securite', 'notifs', 'aide', 'sortie'], 'rgOng': ['etapes', 'modeles', 'grille'], 'bOng': ['apropos', 'membres', 'offres']}

def ecrire_app():
    props = {k: {'editor': 'enum', 'options': v, 'default': v[0]} for k, v in PROPS.items()}
    props['bienvenue'] = {'editor': 'boolean', 'default': False}
    props['$preview'] = {'width': 1440, 'height': 900}
    js = JSW.replace('/*PRELUDE*/', PRELUDE).replace('/*DONNEES*/', DONNEES)
    html = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Jumanly · Recruteur et administrateur sur ordinateur (prototype cliquable)</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
<style>{CSS}{WCSS}{PCSS}{WCSS2}</style>
</helmet>
<div class="fd" style="width: 1440px; height: 900px; position: relative; overflow: hidden; background: #0B1A1F; border-radius: 14px;">
{CORPSW}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{_j.dumps(props, ensure_ascii=False)}'>
{js}
</script>
</body>
</html>
'''
    open(os.path.join(PW, 'Web-App.dc.html'), 'w').write(html)

def impW(fn, titre, props):
    attrs = ' '.join(f'{k}="{v}"' for k, v in props.items())
    open(os.path.join(PW, fn), 'w').write(f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>{titre}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
<style>body{{margin:0}}</style>
</helmet>
<div style="width: 1440px; height: 900px; font-family: Sora, system-ui, sans-serif; color: #F2EDE5;">
<dc-import name="Web-App" {attrs} hint-size="1440px,900px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":900}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{ oui: true }}; }}
}}
</script>
</body>
</html>
''')

N = [  # recruteuse : Nadia Kalala
  ('accueil-bienvenue', 'Premier passage · Bienvenue', {'vue': 'accueil', 'bienvenue': 'true'}), ('accueil', 'Accueil · aujourd’hui', {'vue': 'accueil'}),
  ('fil', 'Fil · publier (220 caractères)', {'vue': 'fil'}), ('offres', 'Offres · liste et indicateurs', {'vue': 'offres'}),
  ('offre', 'Offre · aperçu', {'vue': 'offre', 'oTab': 'apercu'}), ('offre-annonce', 'Offre · annonce', {'vue': 'offre', 'oTab': 'annonce'}), ('offre-reglages', 'Offre · équipe et réglages', {'vue': 'offre', 'oTab': 'reglages'}),
  ('nouvelle-1', 'Publier une offre 1/5 · le poste', {'vue': 'nouvelle', 'nStep': '1'}), ('nouvelle-2', 'Publier une offre 2/5 · compétences', {'vue': 'nouvelle', 'nStep': '2'}), ('nouvelle-3', 'Publier une offre 3/5 · conditions', {'vue': 'nouvelle', 'nStep': '3'}), ('nouvelle-4', 'Publier une offre 4/5 · questions', {'vue': 'nouvelle', 'nStep': '4'}), ('nouvelle-5', 'Publier une offre 5/5 · aperçu et équipe', {'vue': 'nouvelle', 'nStep': '5'}),
  ('candidatures', 'Candidatures · ATS en colonnes', {'vue': 'candidatures'}), ('candidatures-liste', 'Candidatures · ATS en liste', {'vue': 'candidatures', 'cMode': 'liste'}),
  ('candidat', 'Fiche · résumé et « Pourquoi ? »', {'vue': 'candidat', 'candK': 'grace'}), ('candidat-profil', 'Fiche · profil et CV', {'vue': 'candidat', 'candK': 'grace', 'fT': 'profil'}), ('candidat-reponses', 'Fiche · réponses', {'vue': 'candidat', 'candK': 'grace', 'fT': 'reponses'}),
  ('candidat-diagnostic', 'Fiche · diagnostic à évaluer', {'vue': 'candidat', 'candK': 'moussa', 'fT': 'diagnostic'}), ('candidat-evaluations', 'Fiche · évaluations', {'vue': 'candidat', 'candK': 'benjamin', 'fT': 'evaluations'}), ('candidat-notes', 'Fiche · notes de l’équipe', {'vue': 'candidat', 'candK': 'grace', 'fT': 'notes'}), ('candidat-historique', 'Fiche · historique', {'vue': 'candidat', 'candK': 'grace', 'fT': 'historique'}),
  ('evaluation', 'Évaluer un entretien · grille', {'vue': 'evaluation', 'candK': 'grace'}),
  ('agenda', 'Agenda · semaine', {'vue': 'agenda'}), ('agenda-jour', 'Agenda · jour', {'vue': 'agenda', 'agMode': 'jour'}), ('agenda-mois', 'Agenda · mois', {'vue': 'agenda', 'agMode': 'mois'}),
  ('talents', 'Talents · découvrir', {'vue': 'talents'}), ('talents-vivier', 'Talents · vivier', {'vue': 'talents', 'sousT': 'vivier'}), ('talents-propositions', 'Talents · propositions', {'vue': 'talents', 'sousT': 'propositions'}), ('talents-reseau', 'Talents · réseau', {'vue': 'talents', 'sousT': 'reseau'}),
  ('messages', 'Messages', {'vue': 'messages'}), ('notifs', 'Notifications', {'vue': 'notifs'}), ('orbi', 'Orbi · conversation', {'vue': 'orbi'}),
  ('tableau', 'Tableau de bord (droit accordé)', {'vue': 'tableau'}), ('moi', 'Mon espace · rôle, tâches, rapport PDF', {'vue': 'moi'}),
  ('compte', 'Compte · profil', {'vue': 'compte'}), ('compte-bascule', 'Compte · changer de profil', {'vue': 'compte', 'cV': 'bascule'}), ('compte-formule', 'Compte · formule en lecture', {'vue': 'compte', 'cV': 'formule'}), ('compte-securite', 'Compte · sécurité', {'vue': 'compte', 'cV': 'securite'}), ('compte-notifs', 'Compte · notifications', {'vue': 'compte', 'cV': 'notifs'}), ('compte-aide', 'Compte · aide et contact', {'vue': 'compte', 'cV': 'aide'}), ('compte-sortie', 'Compte · se déconnecter', {'vue': 'compte', 'cV': 'sortie'}),
  ('entreprise', 'Page d’une autre entreprise · membres', {'vue': 'entreprise'}), ('baobab', 'Page de Baobab Fintech', {'vue': 'baobab'}),
]
J = [  # administrateur : Joseph Ilunga
  ('accueil-bienvenue', 'Premier passage · Bienvenue', {'vue': 'accueil', 'bienvenue': 'true'}), ('accueil', 'Accueil · équipe et demandes', {'vue': 'accueil'}),
  ('equipe', 'Équipe · membres, rôles et droits', {'vue': 'equipe'}), ('equipe-taches', 'Équipe · toutes les tâches', {'vue': 'equipe', 'eqOng': 'taches'}), ('equipe-invitations', 'Équipe · invitations et demandes', {'vue': 'equipe', 'eqOng': 'invitations'}),
  ('tableau', 'Tableau de bord et PDF', {'vue': 'tableau'}), ('moi', 'Mon espace', {'vue': 'moi'}),
  ('pageEnt', 'Page entreprise · modifier', {'vue': 'pageEnt'}), ('baobab', 'Page entreprise · vue publique', {'vue': 'baobab', 'bOng': 'membres'}),
  ('factu', 'Formule et facturation', {'vue': 'factu'}), ('journal', 'Journal des consultations', {'vue': 'journal'}),
  ('reglages', 'Réglages · étapes de l’ATS', {'vue': 'reglages'}), ('reglages-modeles', 'Réglages · modèles de messages', {'vue': 'reglages', 'rgOng': 'modeles'}), ('reglages-grille', 'Réglages · grille d’entretien', {'vue': 'reglages', 'rgOng': 'grille'}),
  ('candidatures', 'Candidatures de toute l’équipe', {'vue': 'candidatures'}), ('agenda', 'Agenda de l’équipe', {'vue': 'agenda'}), ('offres', 'Offres de l’équipe', {'vue': 'offres'}),
  ('compte-bascule', 'Compte · agir au nom de Baobab Fintech', {'vue': 'compte', 'cV': 'bascule'}),
]
ecrire_app()
L = {'nadia': [], 'joseph': []}
for qui, lst, pre, tit in [('nadia', N, 'Web-N-', 'Recruteuse · '), ('joseph', J, 'Web-J-', 'Administrateur · ')]:
    for k, t, pr in lst:
        fn = pre + k + '.dc.html'
        impW(fn, tit + t, {'qui': qui, **pr}); L[qui].append(fn)
_j.dump(L, open(os.path.join(D, 'w_app_pages.json'), 'w'), ensure_ascii=False)
print('ok', len(L['nadia']), len(L['joseph']))
