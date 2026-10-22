# Recruteur · Modèle B sur ordinateur (1440 × 900) et tablette (1180 × 820) : même appli, mise en page large.
from rkit import *
from r_web_pil_tpl import V_AGENDA, V_EQUIPE, V_TABLEAU, V_MOI, MOD_PIL, PCSS
import json as _j
JS = open(os.path.join(D, 'r_web_logic.js')).read()
CHEV = ico(I['chev'], 16, '2', '#8FA39E')
ic = lambda k, s=20, sw='1.8': ico(I[k], s, sw)

WCSS = '''
.fd .app{position:absolute;inset:0;display:flex}
.fd .side{width:248px;flex:none;border-right:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;padding:22px 14px 18px;background:#09161A}
.fd .logo{display:flex;align-items:center;gap:6px;font-size:24px;font-weight:800;letter-spacing:-.5px;padding:0 10px 22px;color:#F2EDE5}
.fd .logo i{width:9px;height:9px;border-radius:50%;background:#A6F26B;display:block;margin-top:10px}
.fd .nv{display:flex;align-items:center;gap:14px;width:100%;height:46px;padding:0 12px;border-radius:14px;font-size:15px;font-weight:600}
.fd .nv b{margin-left:auto;font-size:11.5px;font-weight:800;color:#0B1A1F;background:#A6F26B;border-radius:9px;padding:2px 7px}
.fd .main{flex:1;min-width:0;display:flex;flex-direction:column}
.fd .top{height:76px;flex:none;display:flex;align-items:center;gap:14px;padding:0 28px;border-bottom:1px solid rgba(255,255,255,.07);position:relative}
.fd .top h1{font-size:24px;font-weight:700;white-space:nowrap}
.fd .rch{flex:1;max-width:520px;margin-left:24px;position:relative}
.fd .rch label{display:flex;align-items:center;gap:10px;height:46px;border-radius:23px;background:#13282C;padding:0 16px;border:1px solid rgba(255,255,255,.08)}
.fd .rch input{flex:1;min-width:0;border:0;outline:0;background:none;font:inherit;font-size:14px;color:#F2EDE5}
.fd .rch input::placeholder{color:#6F8580}
.fd .pop{position:absolute;top:54px;left:0;right:0;z-index:40;background:#13282C;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:14px;box-shadow:0 24px 50px -16px rgba(0,0,0,.8)}
.fd .pop .r{display:block;width:100%;padding:10px 12px;border-radius:12px;color:#F2EDE5}
.fd .pop .r:hover{background:#1B3338}
.fd .btn{height:44px;padding:0 20px;border-radius:22px;background:#A6F26B;color:#0B1A1F;font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px;white-space:nowrap;text-align:center}
.fd .btn2{height:44px;padding:0 18px;border-radius:22px;border:1px solid rgba(255,255,255,.2);color:#F2EDE5;font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;white-space:nowrap;text-align:center}
.fd .zone{flex:1;min-height:0;display:flex}
.fd .centre{flex:1;min-width:0;overflow-y:auto;padding:24px 28px 60px}
.fd .droite{width:320px;flex:none;border-left:1px solid rgba(255,255,255,.07);overflow-y:auto;padding:22px 22px 40px;background:#09161A}
.fd .carte{background:#13282C;border-radius:22px;padding:18px}
.fd .kan{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;align-items:start}
.fd .col{background:#0F2226;border-radius:20px;padding:10px;min-height:420px}
.fd .col h3{font-size:13.5px;font-weight:700;color:#B9CBC6;display:flex;justify-content:space-between;padding:4px 4px 10px}
.fd .kc{display:block;width:100%;background:#13282C;border-radius:16px;padding:12px;margin-bottom:10px;border:1px solid rgba(255,255,255,.05)}
.fd .kc:hover{border-color:rgba(166,242,107,.5)}
.fd .sc{display:inline-block;white-space:nowrap;font-size:12px;font-weight:800;padding:3px 8px;border-radius:8px}
.fd .tr{display:grid;align-items:center;gap:12px;width:100%;padding:14px;border-bottom:1px solid rgba(255,255,255,.06);font-size:14px;color:#F2EDE5;text-align:left}
.fd .th{font-size:12.5px;font-weight:600;color:#8FA39E;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.1)}
.fd button.tr:hover{background:#0F2226}
.fd .tbl th{text-align:left;font-size:12.5px;font-weight:600;color:#8FA39E;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
.fd .tbl td{padding:14px;border-bottom:1px solid rgba(255,255,255,.06);font-size:14px}
.fd .tbl tr.l{cursor:pointer}.fd .tbl tr.l:hover td{background:#0F2226}
.fd .g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.fd .g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.fd .g2w{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.fd .tuile{display:block;padding:16px;border-radius:18px;background:#13282C;font-size:12.5px;color:#8FA39E;line-height:1.4}
.fd .tuile b{display:block;font-size:24px;color:#F2EDE5;margin-bottom:4px}
.fd .pq{display:grid;grid-template-columns:170px 1fr 74px;gap:12px;align-items:center;font-size:13.5px;padding:6px 0}
.fd .pq .bar{height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden}
.fd .pq .bar i{display:block;height:100%;background:#2FD3A6;border-radius:4px}
.fd .modal{position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center}
.fd .modal .boite{position:relative;width:520px;max-width:calc(100% - 48px);background:#13282C;border-radius:26px;padding:26px;border:1px solid rgba(255,255,255,.1)}
.fd .bulle{max-width:70%;padding:12px 16px;border-radius:18px;font-size:14.5px;line-height:1.45}
.fd .orbiF{position:absolute;right:24px;bottom:24px;z-index:30;width:60px;height:60px;border-radius:50%;box-shadow:0 14px 30px -8px rgba(0,0,0,.7)}
.fd .panO{position:absolute;right:20px;bottom:96px;z-index:35;width:360px;background:#13282C;border-radius:24px;padding:20px;border:1px solid rgba(47,211,166,.35);box-shadow:0 24px 50px -16px rgba(0,0,0,.8)}
.fd .ta2{width:100%;min-height:96px;border-radius:18px;background:#0B1A1F;border:1px solid rgba(255,255,255,.12);padding:14px 16px;font:inherit;font-size:15px;color:#F2EDE5;resize:none;outline:0}
'''
TABCSS = '''
.fd .side{width:84px;padding:20px 12px}
.fd .logo{justify-content:center;padding:0 0 22px}.fd .logo span{display:none}
.fd .nv{justify-content:center;padding:0}.fd .nv span,.fd .nv b{display:none}.fd .side .sbas{display:none !important}
.fd .rch{margin-left:12px}
.fd .top{padding:0 20px}
.fd .centre{padding:20px 20px 90px}
.fd .kan{grid-template-columns:repeat(5,minmax(170px,1fr));overflow-x:auto}
.fd .g4{grid-template-columns:repeat(3,minmax(0,1fr))}
.fd .btn .lg{display:none}
'''

def NAV(k, t, icone, handler, badge=''):
    b = f'<b>{badge}</b>' if badge else ''
    return (f'<button onClick="{{{{{handler}}}}}" class="nv" aria-label="{t}" style="background: {{{{nb_{k}}}}}; color: {{{{nc_{k}}}}};">{ic(icone, 22)}<span>{t}</span>{b}</button>')

SIDE = ('<aside class="side"><div class="logo"><span>jumanly</span><i></i></div>'
  + NAV('fil', 'Fil', 'fil', 'goFil') + NAV('offres', 'Offres', 'offres', 'goOffres') + NAV('candidatures', 'Candidatures', 'candidatures', 'goCand', '13') + NAV('agenda', 'Agenda', 'cal', 'goAgenda', '3')
  + NAV('talents', 'Talents', 'talents', 'goTalents', '2') + NAV('messages', 'Messages', 'messages', 'goMsg', '3')
  + '<span class="sbas" style="display: block; font-size: 11.5px; font-weight: 700; color: #6F8580; padding: 18px 12px 6px; letter-spacing: .4px;">PILOTAGE</span>'
  + NAV('tableau', 'Tableau de bord', 'tri', 'goTableau') + '<sc-if value="{{admin}}" hint-placeholder-val="{{ false }}">' + NAV('equipe', 'Équipe', 'equipe', 'goEquipe') + '</sc-if>' + NAV('moi', 'Mon espace', 'carte', 'goMoi')
  + '<span style="flex: 1;"></span>'
  + NAV('compte', 'Compte', 'reglage', 'goCompte')
  + '<button onClick="{{goBascule}}" class="sbas" style="display: flex; align-items: center; gap: 10px; width: 100%; margin-top: 10px; padding: 10px; border-radius: 16px; background: #13282C; color: #F2EDE5;">'
    '<span class="av" style="width: 38px; height: 38px; font-size: 12px; position: relative;">{{moiIni}}<span style="position: absolute; right: -4px; bottom: -4px; width: 20px; height: 20px; border-radius: 6px; background: #14745F; color: #FFFFFF; font-size: 8px; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 2px solid #13282C;">BF</span></span>'
    '<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 13.5px;">{{moiN}}</b><span class="meta" style="font-size: 11.5px;">Changer de profil</span></span></button></aside>')

TOP = ('<header class="top"><h1>{{titre}}</h1>'
  '<div class="rch"><label>' + LOUPE + '<input value="{{rq}}" onChange="{{ecrireR}}" onClick="{{ouvrirR}}" aria-label="{{rPlace}}" placeholder="{{rPlace}}"></label>'
  '<sc-if value="{{rOpen}}" hint-placeholder-val="{{ false }}"><div class="pop">'
  '<sc-if value="{{rVide}}" hint-placeholder-val="{{ true }}"><div><p class="meta" style="font-weight: 700; padding: 0 4px 10px;">Essayez</p><div style="display: flex; gap: 8px; flex-wrap: wrap;"><sc-for list="{{rSugg}}" as="s" hint-placeholder-count="3"><button onClick="{{s.go}}" class="pill" style="border: 1px solid rgba(255,255,255,.22);">{{s.t}}</button></sc-for></div></div></sc-if>'
  '<sc-if value="{{aRes}}" hint-placeholder-val="{{ false }}"><div><sc-for list="{{rRes}}" as="r" hint-placeholder-count="3"><button onClick="{{r.go}}" class="r"><b style="display: block; font-size: 14px;">{{r.t}}</b><span class="meta" style="font-size: 12.5px;">{{r.s}}</span></button></sc-for></div></sc-if>'
  '<sc-if value="{{sansRes}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 6px 4px;">Aucun résultat. Essayez un prénom, un métier ou une offre.</p></sc-if>'
  '<button onClick="{{fermerR}}" style="display: block; margin-top: 10px; font-size: 13px; font-weight: 700; color: #A6F26B; min-height: 32px;">Fermer</button></div></sc-if></div>'
  '<span style="flex: 1;"></span>'
  '<div style="position: relative;"><button onClick="{{basculerNotif}}" class="rond" aria-label="Notifications, 4 nouvelles" style="background: #13282C; color: #F2EDE5; position: relative;">' + ic('cloche', 21) + '<span style="position: absolute; right: 6px; top: 6px; width: 9px; height: 9px; border-radius: 50%; background: #A6F26B;"></span></button>'
  '<sc-if value="{{notifOpen}}" hint-placeholder-val="{{ false }}"><div class="pop" style="left: auto; right: 0; width: 340px;"><p style="font-size: 15px; font-weight: 700; padding: 0 4px 8px;">Notifications</p><sc-for list="{{NOTIFS}}" as="n" hint-placeholder-count="4"><button onClick="{{n.go}}" class="r"><b style="display: block; font-size: 14px;">{{n.t}}</b><span class="meta" style="font-size: 12.5px;">{{n.s}}</span></button></sc-for></div></sc-if></div>'
  '<button onClick="{{publierOffre}}" class="btn">' + ic('plus', 18, '2.4') + '<span class="lg">Publier une offre</span></button></header>')

# ---------------- Vues ----------------
SCORE = '<span class="sc" style="background: {{X.sbg}}; color: {{X.scol}};">{{X.sT}}</span>'
sc_ = lambda x: SCORE.replace('X.', x + '.')

V_CAND = ('<sc-if value="{{vCand}}" hint-placeholder-val="{{ true }}"><div>'
  '<div style="display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap;"><div style="flex: 1; min-width: 260px;"><h2 style="font-size: 20px;">{{offreT}}</h2><p class="meta" style="margin-top: 4px;">{{offreS}} · triées par compatibilité, personne n’est écarté</p></div></div>'
  '<div style="display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0 18px;"><sc-for list="{{ofPills}}" as="f" hint-placeholder-count="3"><button onClick="{{f.pick}}" class="pill" style="border: 1px solid {{f.bd}}; background: {{f.bg}}; color: {{f.col}};">{{f.t}}</button></sc-for></div>'
  '<div class="kan"><sc-for list="{{colonnes}}" as="k" hint-placeholder-count="5"><div class="col"><h3><span>{{k.t}}</span><span>{{k.n}}</span></h3>'
  '<sc-for list="{{k.items}}" as="x" hint-placeholder-count="2"><button onClick="{{x.ouvrir}}" class="kc">'
  '<span style="display: flex; align-items: center; gap: 10px;"><span class="av" style="width: 36px; height: 36px; font-size: 12px; background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><b style="flex: 1; min-width: 0; font-size: 13.5px; line-height: 1.3;">{{x.nom}}</b></span><span class="meta" style="display: block; font-size: 11.5px; margin-top: 6px; line-height: 1.35;">{{x.d}}</span>'
  '<span style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">' + sc_('x') + '<span style="font-size: 12px; font-weight: 700; color: #5FE0B8; white-space: nowrap;">Pourquoi ?</span></span>'
  '<sc-if value="{{x.nr}}" hint-placeholder-val="{{ false }}"><span style="display: block; margin-top: 8px; font-size: 11.5px; color: #8FA39E;">Non retenu·e · message envoyé</span></sc-if></button></sc-for>'
  '<sc-if value="{{k.vide}}" hint-placeholder-val="{{ false }}"><p class="meta" style="font-size: 12.5px; padding: 10px 4px;">Personne à cette étape.</p></sc-if>'
  '</div></sc-for></div></div></sc-if>')

V_FICHE = ('<sc-if value="{{vFiche}}" hint-placeholder-val="{{ false }}"><div>'
  '<button onClick="{{retourTableau}}" style="display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #B9CBC6; min-height: 36px;">' + ic('retour', 18, '2') + 'Tableau {{cOffreT}}</button>'
  '<div style="display: flex; align-items: center; gap: 18px; margin-top: 14px; flex-wrap: wrap;"><span class="av" style="width: 72px; height: 72px; font-size: 22px; background: {{c.bg}}; color: {{c.fg}};">{{c.ini}}</span>'
  '<div style="flex: 1; min-width: 220px;"><h2 style="font-size: 24px;">{{c.nom}}</h2><p class="meta" style="margin-top: 4px;">{{cOffreT}} · étape « {{etapeT}} » · {{c.d}}</p></div>'
  '<sc-if value="{{peutAvancer}}" hint-placeholder-val="{{ true }}"><button onClick="{{avancer}}" class="btn">{{suivanteT}}</button></sc-if>'
  '<button onClick="{{planifier}}" class="btn2">' + ic('cal', 18) + 'Planifier un entretien</button><button onClick="{{ecrireC}}" class="btn2">' + ic('messages', 18) + 'Écrire</button>'
  '<sc-if value="{{peutAvancer}}" hint-placeholder-val="{{ true }}"><button onClick="{{nonRetenu}}" class="btn2" style="color: #B9CBC6;">Non retenu</button></sc-if></div>'
  '<div style="display: flex; gap: 6px; margin-top: 22px;"><sc-for list="{{timeline}}" as="t" hint-placeholder-count="5"><span style="flex: 1;"><span style="display: block; height: 5px; border-radius: 3px; background: {{t.col}};"></span><span style="display: block; font-size: 12px; margin-top: 6px; font-weight: {{t.fw}}; color: #B9CBC6;">{{t.t}}</span></span></sc-for></div>'
  '<sc-if value="{{aNr}}" hint-placeholder-val="{{ false }}"><p style="margin-top: 16px; padding: 12px 16px; border-radius: 16px; background: #13282C; font-size: 14px; color: #C9D6D2;">Non retenu·e : un message lui a été envoyé. La candidature reste dans votre historique.</p></sc-if>'
  '<div class="g2w" style="margin-top: 22px;">'
  '<div class="carte"><div style="display: flex; align-items: center; justify-content: space-between;"><h3 style="font-size: 16px;">Pourquoi ce score ?</h3><span class="sc" style="background: {{c.sbg}}; color: {{c.scol}}; font-size: 14px;">{{c.sT}} · {{c.bT}}</span></div>'
  '<p class="meta" style="font-size: 12.5px; margin: 6px 0 12px; line-height: 1.5;">8 critères fixes. Le nom, l’âge, le genre, la photo ou la nationalité ne comptent jamais.</p>'
  '<sc-for list="{{pourquoi}}" as="q" hint-placeholder-count="8"><div class="pq"><span>{{q.t}}</span><span class="bar"><i style="width: {{q.pct}};"></i></span><span style="text-align: right; font-weight: 700;">{{q.pts}}<span class="meta" style="font-size: 11px; font-weight: 400;">/{{q.w}}</span></span></div></sc-for></div>'
  '<div style="display: flex; flex-direction: column; gap: 14px;">'
  '<div class="carte"><h3 style="font-size: 16px; margin-bottom: 8px;">Points forts</h3><sc-for list="{{c.forts}}" as="f" hint-placeholder-count="2"><div class="li"><i></i><span>{{f.t}}</span></div></sc-for>'
  '<h3 style="font-size: 16px; margin: 14px 0 8px;">À vérifier en entretien</h3><sc-for list="{{c.verif}}" as="f" hint-placeholder-count="1"><div class="li"><i style="background: #F4D59A;"></i><span>{{f.t}}</span></div></sc-for></div>'
  '<div class="carte" style="border: 1px solid rgba(47,211,166,.3);"><div style="display: flex; align-items: center; gap: 10px;">' + ORBI(26) + '<b style="font-size: 15px;">Orbi résume</b></div><p style="font-size: 14px; line-height: 1.55; margin-top: 10px; color: #C9D6D2;">Profil solide sur les compétences requises. Orbi recommande un entretien ; c’est vous qui décidez.</p></div>'
  '<p class="meta" style="font-size: 12px;">Votre consultation de ce profil est enregistrée dans le journal de Baobab Fintech.</p></div></div>'
  '</div></sc-if>')

V_OFFRES = ('<sc-if value="{{vOffres}}" hint-placeholder-val="{{ false }}"><div>'
  '<div class="g4"><sc-for list="{{tuilesO}}" as="t" hint-placeholder-count="4"><span class="tuile"><b>{{t.b}}</b>{{t.t}}</span></sc-for></div>'
  '<div style="display: flex; align-items: center; justify-content: space-between; margin: 26px 0 8px;"><h2 style="font-size: 18px;">Vos offres</h2><span class="meta">{{quotaT}}</span></div>'
  '<div class="tr th" style="grid-template-columns: 2.4fr 1fr 1fr .8fr 1fr .8fr 20px;"><span>Offre</span><span>Candidatures</span><span>Nouvelles</span><span>Vues</span><span>Statut</span><span>Publiée</span><span></span></div>'
  '<sc-for list="{{OFFRES}}" as="o" hint-placeholder-count="4"><button onClick="{{o.ouvrir}}" class="tr" style="grid-template-columns: 2.4fr 1fr 1fr .8fr 1fr .8fr 20px;"><span><b style="display: block;">{{o.t}}</b><span class="meta" style="font-size: 12.5px;">{{o.lieu}}</span></span><span>{{o.candT}}</span><span style="color: #A6F26B; font-weight: 700;">{{o.nouvT}}</span><span>{{o.vues}}</span><span style="font-weight: 700; color: {{o.stCol}};">{{o.statut}}</span><span class="meta">{{o.d}}</span>' + CHEV + '</button></sc-for>'
  '</div></sc-if>')

TALCARD = ('<button onClick="{{x.ouvrir}}" class="carte" style="display: block; width: 100%; text-align: center; border: 2px solid {{x.bord}};"><span class="av" style="width: 60px; height: 60px; font-size: 18px; margin: 0 auto; background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span>'
  '<b style="display: block; font-size: 14.5px; margin-top: 10px;">{{x.nom}}</b><span class="meta" style="display: block; font-size: 12px; line-height: 1.35; margin-top: 2px;">{{x.titre}}</span><span class="meta" style="display: block; font-size: 12px;">{{x.ville}}</span>'
  '<span style="display: block; margin-top: 10px;">' + sc_('x') + '</span></button>')
V_TAL = ('<sc-if value="{{vTalents}}" hint-placeholder-val="{{ false }}"><div>' + SEG('sousTal', 4).replace('class="seg"', 'class="seg" style="padding: 0; margin: -6px 0 18px;"') +
  '<sc-if value="{{tDec}}" hint-placeholder-val="{{ true }}"><div>'
  '<label class="champ" style="max-width: 420px; border-color: rgba(255,255,255,.14);">' + LOUPE + '<input value="{{tq}}" onChange="{{ecrireTq}}" aria-label="Filtrer les talents" placeholder="Métier, compétence ou ville"></label>'
  '<p class="meta" style="margin: 12px 0 14px;">Compatibilité avec l’offre Analyste de données junior · seuls les profils rendus visibles apparaissent</p>'
  '<sc-if value="{{aTalF}}" hint-placeholder-val="{{ true }}"><div class="g4"><sc-for list="{{talF}}" as="x" hint-placeholder-count="8">' + TALCARD + '</sc-for></div></sc-if>'
  '<sc-if value="{{sansTalF}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 30px 0;">Aucun talent ne correspond. Essayez un autre métier.</p></sc-if></div></sc-if>'
  '<sc-if value="{{tViv}}" hint-placeholder-val="{{ false }}"><div><p class="meta" style="margin-bottom: 14px;">Votre vivier personnel. Le vivier partagé avec l’équipe est réservé à la formule Company Plus.</p>'
  '<sc-if value="{{aVivier}}" hint-placeholder-val="{{ true }}"><div class="g4"><sc-for list="{{vivierL}}" as="x" hint-placeholder-count="2"><div>' + TALCARD + '<button onClick="{{x.retirer}}" style="display: block; width: 100%; text-align: center; margin-top: 6px; font-size: 13px; color: #8FA39E; min-height: 32px;">Retirer du vivier</button></div></sc-for></div></sc-if>'
  '<sc-if value="{{sansVivier}}" hint-placeholder-val="{{ false }}"><p class="meta">Votre vivier est vide.</p></sc-if></div></sc-if>'
  '<sc-if value="{{tProp}}" hint-placeholder-val="{{ false }}"><div><div class="tr th" style="grid-template-columns: 1.6fr 1.6fr 1.4fr 20px;"><span>Talent</span><span>Offre proposée</span><span>Statut</span><span></span></div><sc-for list="{{proposL}}" as="x" hint-placeholder-count="1"><button onClick="{{x.ouvrir}}" class="tr" style="grid-template-columns: 1.6fr 1.6fr 1.4fr 20px;"><span style="display: flex; align-items: center; gap: 10px;"><span class="av" style="width: 34px; height: 34px; font-size: 11px; background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><b>{{x.nom}}</b></span><span>Analyste de données junior</span><span class="meta">{{x.d}} · le talent décide</span>' + CHEV + '</button></sc-for></div></sc-if>'
  '<sc-if value="{{tRes}}" hint-placeholder-val="{{ false }}"><div>'
  '<sc-if value="{{aInvit}}" hint-placeholder-val="{{ true }}"><div><h3 style="font-size: 16px; margin-bottom: 12px;">Invitations reçues</h3><div class="g2w"><sc-for list="{{invitations}}" as="x" hint-placeholder-count="2"><div class="carte" style="display: flex; align-items: center; gap: 12px;"><span class="av" style="background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14.5px;">{{x.nom}}</b><span class="meta" style="font-size: 12.5px;">{{x.s}}</span></span><button onClick="{{x.ignorer}}" class="btn2" style="height: 38px;">Ignorer</button><button onClick="{{x.accepter}}" class="btn" style="height: 38px;">Accepter</button></div></sc-for></div></div></sc-if>'
  '<h3 style="font-size: 16px; margin: 24px 0 12px;">À connaître</h3><div class="g4"><sc-for list="{{aConnaitre}}" as="x" hint-placeholder-count="4"><div class="carte" style="text-align: center;"><span class="av" style="width: 56px; height: 56px; margin: 0 auto; font-size: 16px; background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><b style="display: block; font-size: 14px; margin-top: 8px;">{{x.nom}}</b><span class="meta" style="display: block; font-size: 12px; margin: 2px 0 10px;">{{x.s}}</span><button onClick="{{x.connecter}}" style="width: 100%; height: 36px; border-radius: 18px; border: 1px solid {{x.bbd}}; background: {{x.bbg}}; color: {{x.bcol}}; font-size: 13px; font-weight: 700; text-align: center;">{{x.bt}}</button></div></sc-for></div>'
  '<h3 style="font-size: 16px; margin: 24px 0 4px;">Mes relations</h3><sc-for list="{{relations}}" as="x" hint-placeholder-count="3"><div class="ligne" style="padding: 12px 0;"><span class="av" style="background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{x.nom}}</b><span class="meta" style="font-size: 12.5px;">{{x.s}}</span></span><button onClick="{{goMsg}}" class="btn2" style="height: 38px;">Écrire</button></div></sc-for>'
  '</div></sc-if></div></sc-if>')

V_MSG = ('<sc-if value="{{vMsg}}" hint-placeholder-val="{{ false }}"><div style="display: flex; gap: 0; height: 100%; margin: -24px -28px -60px; min-height: 740px;">'
  '<div style="width: 320px; flex: none; border-right: 1px solid rgba(255,255,255,.07); overflow-y: auto;"><div style="padding: 16px;">' + PILLS('mPills', 4).replace('flex-wrap: wrap', 'flex-wrap: nowrap; overflow-x: auto') + '</div>'
  '<sc-for list="{{CONV}}" as="x" hint-placeholder-count="5"><button onClick="{{x.ouvrir}}" style="display: flex; gap: 12px; width: 100%; padding: 14px 16px; background: {{x.fond}}; border-bottom: 1px solid rgba(255,255,255,.05);"><span class="av" style="background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><span style="flex: 1; min-width: 0;"><span style="display: flex; justify-content: space-between; gap: 8px;"><b style="font-size: 14.5px;">{{x.nom}}</b><span class="meta" style="font-size: 11.5px; white-space: nowrap;">{{x.d}}</span></span><span class="meta" style="display: block; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.dernier}}</span></span></button></sc-for></div>'
  '<div style="flex: 1; min-width: 0; display: flex; flex-direction: column;">'
  '<div style="display: flex; align-items: center; gap: 12px; padding: 14px 22px; border-bottom: 1px solid rgba(255,255,255,.07);"><span class="av" style="background: {{conv.bg}}; color: {{conv.fg}};">{{conv.ini}}</span><span style="flex: 1;"><b style="display: block; font-size: 15px;">{{conv.nom}}</b><span class="meta" style="font-size: 12.5px;">{{conv.s}}</span></span>'
  '<sc-if value="{{convCand}}" hint-placeholder-val="{{ true }}"><button onClick="{{ficheConv}}" class="btn2" style="height: 38px;">Voir la fiche</button></sc-if></div>'
  '<div style="flex: 1; overflow-y: auto; padding: 22px; display: flex; flex-direction: column; gap: 10px;"><sc-for list="{{filM}}" as="m" hint-placeholder-count="2"><div style="display: flex; flex-direction: column;">'
  '<sc-if value="{{m.lui}}" hint-placeholder-val="{{ true }}"><div class="bulle" style="background: #13282C; align-self: flex-start;">{{m.t}}<span class="meta" style="display: block; font-size: 11px; margin-top: 4px;">{{m.d}}</span></div></sc-if>'
  '<sc-if value="{{m.moi}}" hint-placeholder-val="{{ false }}"><div class="bulle" style="background: #F2EDE5; color: #0B1A1F; align-self: flex-end;">{{m.t}}<span style="display: block; font-size: 11px; margin-top: 4px; color: #4A5E59;">{{m.d}} · envoyé</span></div></sc-if></div></sc-for></div>'
  '<div style="padding: 14px 22px 20px; border-top: 1px solid rgba(255,255,255,.07);"><label class="champ" style="border-color: rgba(255,255,255,.16);"><input value="{{br}}" onChange="{{ecrireM}}" aria-label="Écrire un message" placeholder="Écrire un message"><button onClick="{{envoyerM}}" class="btn" style="height: 40px;">Envoyer</button></label></div></div></div></sc-if>')

V_FIL = ('<sc-if value="{{vFil}}" hint-placeholder-val="{{ false }}"><div style="max-width: 680px;">'
  '<div class="carte"><textarea class="ta2" maxlength="220" onChange="{{ecrirePub}}" aria-label="Écrire une publication" placeholder="Partagez une offre, une recrue, un conseil…">{{pub}}</textarea>'
  '<div style="display: flex; align-items: center; gap: 10px; margin-top: 12px; flex-wrap: wrap;">' + PILLS('auNomP', 2) + '<span style="flex: 1;"></span><span style="font-size: 12.5px; font-weight: 700; color: {{carCol}};">{{nCar}}</span><button onClick="{{publier}}" class="btn" style="height: 40px;">Publier</button></div></div>'
  '<sc-for list="{{posts}}" as="x" hint-placeholder-count="3"><div style="padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,.07);">'
  '<div style="display: flex; gap: 12px; align-items: center;"><span class="av" style="background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{x.nom}}</b><span class="meta" style="font-size: 12.5px;">{{x.s}} · {{x.d}}</span></span>'
  '<sc-if value="{{x.estEnt}}" hint-placeholder-val="{{ false }}"><button onClick="{{x.ouvrirEnt}}" class="btn2" style="height: 36px;">Voir la page</button></sc-if></div>'
  '<p style="font-size: 15px; line-height: 1.55; margin-top: 12px;">{{x.t}}</p>'
  '<div style="display: flex; gap: 20px; margin-top: 12px;"><button onClick="{{x.aimer}}" style="display: flex; align-items: center; gap: 6px; color: {{x.coeur}}; font-size: 13.5px; font-weight: 600; min-height: 36px;">' + ic('coeur', 18) + '{{x.nT}}</button><button onClick="{{x.commenter}}" style="display: flex; align-items: center; gap: 6px; color: #B9CBC6; font-size: 13.5px; font-weight: 600; min-height: 36px;">' + ic('bulle', 18) + '{{x.com}}</button></div></div></sc-for>'
  '</div></sc-if>')

MEMB = ('<div class="carte" style="text-align: center;"><span class="av" style="width: 56px; height: 56px; margin: 0 auto; font-size: 16px; background: {{m.bg}}; color: {{m.fg}};">{{m.ini}}</span><b style="display: block; font-size: 14px; margin-top: 8px;">{{m.nom}}</b><span class="meta" style="display: block; font-size: 12px;">{{m.r}}</span>'
  '<span style="display: block; font-size: 11.5px; font-weight: 700; color: {{m.confCol}}; margin: 4px 0 10px;">{{m.confT}}</span><button onClick="{{m.connecter}}" style="width: 100%; height: 36px; border-radius: 18px; border: 1px solid {{m.bbd}}; background: {{m.bbg}}; color: {{m.bcol}}; font-size: 13px; font-weight: 700; text-align: center;">{{m.bt}}</button></div>')
V_ENT = ('<sc-if value="{{vEnt}}" hint-placeholder-val="{{ false }}"><div>'
  '<div style="height: 150px; border-radius: 24px; background: linear-gradient(120deg, #1E4E79 0%, #0B1A1F 100%);"></div>'
  '<div style="display: flex; align-items: flex-end; gap: 18px; margin-top: -44px; padding: 0 24px; flex-wrap: wrap;"><span style="width: 92px; height: 92px; border-radius: 24px; background: #1E4E79; border: 4px solid #0B1A1F; color: #FFFFFF; font-size: 26px; font-weight: 800; display: flex; align-items: center; justify-content: center;">FB</span>'
  '<div style="flex: 1; min-width: 240px; padding-bottom: 6px;"><h2 style="font-size: 24px;">Fleuve Banque</h2><p class="meta">Banque · Kinshasa · 800 personnes · 9 300 abonnés</p></div>'
  '<button onClick="{{suivre}}" class="btn" style="background: {{sBg}}; color: {{sCol}}; border: 1px solid #A6F26B;">{{suivreT}}</button></div>'
  '<button onClick="{{voirMembresE}}" style="display: flex; align-items: center; gap: 10px; margin: 16px 24px 0; min-height: 40px;"><span style="display: flex;"><span class="av" style="width: 30px; height: 30px; font-size: 10.5px; background: #1E4E79; color: #FFFFFF; border: 2px solid #0B1A1F;">CM</span><span class="av" style="width: 30px; height: 30px; font-size: 10.5px; background: #FBE3EF; color: #8A2D5C; border: 2px solid #0B1A1F; margin-left: -8px;">NB</span></span><span style="font-size: 14px; color: #C9D6D2;">Christelle et Nathalie : 2 membres de votre réseau travaillent ici</span></button>'
  '<div style="margin-top: 14px;">' + SEG('eOnglets', 3).replace('class="seg"', 'class="seg" style="padding: 0 16px;"') + '</div>'
  '<sc-if value="{{eMembres}}" hint-placeholder-val="{{ true }}"><div style="padding-top: 18px;">'
  '<div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;"><sc-if value="{{aInv}}" hint-placeholder-val="{{ true }}"><button onClick="{{inviterTous}}" class="btn2">{{invT}}</button></sc-if><span class="meta" style="font-size: 12.5px; color: #F4D59A;">{{resteT}}</span></div>'
  '<h3 style="font-size: 15px; color: #8FA39E; margin: 20px 0 12px;">De votre réseau</h3><div class="g4"><sc-for list="{{duRes}}" as="m" hint-placeholder-count="2">' + MEMB + '</sc-for></div>'
  '<h3 style="font-size: 15px; color: #8FA39E; margin: 22px 0 12px;">Autres membres</h3><div class="g4"><sc-for list="{{autresM}}" as="m" hint-placeholder-count="3">' + MEMB + '</sc-for></div>'
  '<p class="meta" style="font-size: 12.5px; margin-top: 16px; line-height: 1.5; max-width: 640px;">Une personne apparaît ici dès qu’elle indique travailler chez Fleuve Banque dans son expérience. L’entreprise est prévenue et peut confirmer ; sinon, la mention « Indiqué par la personne » reste.</p></div></sc-if>'
  '<sc-if value="{{eApropos}}" hint-placeholder-val="{{ false }}"><p style="font-size: 15px; line-height: 1.6; padding: 20px 0; max-width: 680px;">Banque de détail présente dans 14 villes de RD Congo.</p></sc-if>'
  '<sc-if value="{{eOffres}}" hint-placeholder-val="{{ false }}"><div style="padding-top: 10px;"><sc-for list="{{offresE}}" as="o" hint-placeholder-count="2"><button onClick="{{o.voir}}" class="ligne" style="padding: 14px 0;"><span style="flex: 1;"><b style="display: block; font-size: 15px;">{{o.t}}</b><span class="meta">{{o.s}}</span></span>' + CHEV + '</button></sc-for></div></sc-if>'
  '</div></sc-if>')

TOG = ('<button onClick="{{basculerRecrute}}" role="switch" aria-checked="{{rEtat}}" aria-label="Recrute en ce moment" style="width: 50px; height: 30px; border-radius: 15px; background: {{rFond}}; padding: 3px; flex: none;">'
       '<span style="display: block; width: 24px; height: 24px; border-radius: 50%; background: #0B1A1F; transform: translateX({{rX}}); transition: transform .2s;"></span></button>')
V_COMPTE = ('<sc-if value="{{vCompte}}" hint-placeholder-val="{{ false }}"><div style="display: flex; gap: 24px; align-items: flex-start;">'
  '<div style="width: 250px; flex: none;"><sc-for list="{{cMenu}}" as="m" hint-placeholder-count="6"><button onClick="{{m.go}}" style="display: block; width: 100%; padding: 12px 14px; border-radius: 14px; background: {{m.bg}}; font-weight: {{m.fw}}; font-size: 14.5px;">{{m.t}}</button></sc-for></div>'
  '<div style="flex: 1; min-width: 0; max-width: 720px;">'
  '<sc-if value="{{cProfil}}" hint-placeholder-val="{{ true }}"><div class="carte"><div style="display: flex; gap: 16px; align-items: center;"><span class="av" style="width: 72px; height: 72px; font-size: 22px;">NK</span><span style="flex: 1;"><h2 style="font-size: 21px;">Nadia Kalala</h2><span class="meta">Chargée de recrutement · Baobab Fintech · Kinshasa</span></span><span class="mini" style="background: #14745F;">BF</span></div>'
  '<p style="font-size: 14.5px; line-height: 1.55; margin-top: 16px; color: #C9D6D2;">Je cherche des talents data et service client qui veulent rendre le paiement mobile plus simple. Réponse à chaque candidature.</p>'
  '<div style="display: flex; align-items: center; gap: 12px; margin-top: 16px; padding: 14px; border-radius: 16px; background: #0F2226;"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Badge « Recrute en ce moment »</b><span class="meta" style="font-size: 12.5px;">Les talents vous trouvent plus vite</span></span>' + TOG + '</div></div></sc-if>'
  '<sc-if value="{{cBascule}}" hint-placeholder-val="{{ false }}"><div style="display: flex; flex-direction: column; gap: 12px;">'
  '<div class="carte" style="display: flex; align-items: center; gap: 14px; border: 2px solid #A6F26B;"><span class="av">NK</span><span style="flex: 1;"><b style="display: block;">Profil recruteur</b><span class="meta" style="font-size: 12.5px;">Nadia Kalala · Baobab Fintech · actuel</span></span>' + ico(I['check'], 20, '2.6', '#A6F26B') + '</div>'
  '<button onClick="{{profilTalent}}" class="carte" style="display: flex; align-items: center; gap: 14px; width: 100%;"><span class="av" style="background: #DDF6EE; color: #14745F;">NK</span><span style="flex: 1;"><b style="display: block;">Profil talent discret</b><span class="meta" style="font-size: 12.5px;">Pour chercher un autre poste : Baobab Fintech ne le voit jamais</span></span>' + CHEV + '</button>'
  '<div class="carte" style="display: flex; align-items: center; gap: 14px; opacity: .75;"><span class="mini" style="background: #2A3B3E; color: #8FA39E;">BF</span><span style="flex: 1;"><b style="display: block;">Baobab Fintech</b><span class="meta" style="font-size: 12.5px;">Agir au nom de l’entreprise : réservé à l’administrateur, Joseph Ilunga</span></span></div>'
  '<p class="meta" style="font-size: 12.5px;">L’administration de l’entreprise (équipe, formule, réglages) se fait sur ordinateur, dans l’espace Entreprise : étape 3 de la refonte.</p></div></sc-if>'
  '<sc-if value="{{cEquipe}}" hint-placeholder-val="{{ false }}"><div class="carte"><sc-for list="{{equipeL}}" as="m" hint-placeholder-count="4"><div style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.06);"><span class="av" style="width: 40px; height: 40px; font-size: 12px;">{{m.ini}}</span><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{m.nom}}</b><span class="meta" style="font-size: 12.5px;">{{m.r}}</span></span></div></sc-for><p class="meta" style="font-size: 12.5px; margin-top: 12px;">Pour inviter un collègue, Joseph Ilunga valide la demande.</p></div></sc-if>'
  '<sc-if value="{{cFormule}}" hint-placeholder-val="{{ false }}"><div class="carte"><b style="font-size: 17px;">Company · 79,9 USD par mois</b><p class="meta" style="margin-top: 4px;">Gérée par Joseph Ilunga, l’administrateur</p><sc-for list="{{usage}}" as="u" hint-placeholder-count="3"><div style="margin-top: 16px;"><div style="display: flex; justify-content: space-between; font-size: 14px;"><span>{{u.t}}</span><b>{{u.v}}</b></div><span class="barre"><i style="width: {{u.pct}};"></i></span></div></sc-for><button onClick="{{demanderPlus}}" class="btn2" style="margin-top: 18px;">Demander plus à l’administrateur</button></div></sc-if>'
  '<sc-if value="{{cConfid}}" hint-placeholder-val="{{ false }}"><div class="carte"><p style="font-size: 14.5px; line-height: 1.55;">Vous ne voyez un profil que si la personne a candidaté ou l’a rendu visible. Chaque consultation est enregistrée dans le journal. Les données sensibles (âge, genre, photo, nationalité, religion, santé) ne servent jamais au score.</p><button onClick="{{telecharger}}" class="btn2" style="margin-top: 16px;">Télécharger mes données</button></div></sc-if>'
  '<sc-if value="{{cModeles}}" hint-placeholder-val="{{ false }}"><div class="carte"><sc-for list="{{modelesL}}" as="m" hint-placeholder-count="4"><button onClick="{{m.ouvrir}}" class="ligne" style="padding: 14px 0;"><span style="flex: 1; font-size: 14.5px; font-weight: 600;">{{m.t}}</span>' + CHEV + '</button></sc-for></div></sc-if>'
  '</div></div></sc-if>')

# Colonne de droite (ordinateur) : Orbi propre à la page, puis le contexte
DROITE = ('<sc-if value="{{droiteOn}}" hint-placeholder-val="{{ true }}"><aside class="droite scroll">'
  '<div style="display: flex; align-items: center; gap: 10px;">' + ORBI(30) + '<span><b style="display: block; font-size: 15px;">Orbi</b><span class="meta" style="font-size: 12px;">Recommande, vous décidez · 310 crédits</span></span></div>'
  '<div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;"><sc-for list="{{oChoix}}" as="q" hint-placeholder-count="2"><button onClick="{{q.go}}" class="q" style="background: {{q.bg}}; font-weight: {{q.fw}};">{{q.t}}</button></sc-for></div>'
  '<div style="margin-top: 12px; padding: 14px 16px; border-radius: 18px; background: rgba(47,211,166,.1); border: 1px solid rgba(47,211,166,.3);"><p style="font-size: 14px; line-height: 1.55; color: #DDF6EE;">{{oT}}</p></div>'
  '<sc-if value="{{vTalents}}" hint-placeholder-val="{{ false }}"><div class="carte" style="margin-top: 20px; background: #13282C;">'
  '<div style="display: flex; align-items: center; gap: 12px;"><span class="av" style="width: 52px; height: 52px; font-size: 16px; background: {{tal.bg}}; color: {{tal.fg}};">{{tal.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{tal.nom}}</b><span class="meta" style="font-size: 12px;">{{tal.titre}} · {{tal.ville}}</span></span></div>'
  '<div style="display: flex; align-items: center; justify-content: space-between; margin: 14px 0 6px;"><b style="font-size: 14px;">Pourquoi {{tal.sT}} ?</b><span class="meta" style="font-size: 12px;">{{tal.bT}}</span></div>'
  '<sc-for list="{{talPourquoi}}" as="q" hint-placeholder-count="8"><div class="pq" style="grid-template-columns: 120px 1fr 34px; font-size: 12px; padding: 3px 0;"><span>{{q.t}}</span><span class="bar"><i style="width: {{q.pct}};"></i></span><span style="text-align: right; font-weight: 700;">{{q.pts}}</span></div></sc-for>'
  '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 14px;"><sc-if value="{{talPasPropose}}" hint-placeholder-val="{{ true }}"><button onClick="{{proposer}}" class="btn" style="justify-content: center;">Proposer l’offre Analyste</button></sc-if><sc-if value="{{talPropose}}" hint-placeholder-val="{{ false }}"><p style="font-size: 13px; font-weight: 700; color: #A6F26B; text-align: center;">✓ Offre proposée : le talent décide</p></sc-if>'
  '<button onClick="{{tal.connecter}}" style="height: 42px; border-radius: 21px; border: 1px solid {{tal.bbd}}; background: transparent; color: #F2EDE5; font-size: 14px; font-weight: 700; text-align: center;">{{tal.bt}}</button>'
  '<sc-if value="{{talPasVivier}}" hint-placeholder-val="{{ true }}"><button onClick="{{ajouterVivier}}" class="btn2" style="justify-content: center;">Ajouter au vivier</button></sc-if><sc-if value="{{talVivier}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: center; font-size: 12.5px;">Dans votre vivier</p></sc-if></div></div></sc-if>'
  '<sc-if value="{{vFil}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 22px;"><h3 style="font-size: 15px; margin-bottom: 10px;">À connaître</h3><sc-for list="{{suggR}}" as="x" hint-placeholder-count="3"><div style="display: flex; align-items: center; gap: 10px; padding: 8px 0;"><span class="av" style="width: 38px; height: 38px; font-size: 12px; background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 13.5px;">{{x.nom}}</b><span class="meta" style="font-size: 11.5px;">{{x.s}}</span></span><button onClick="{{x.connecter}}" style="height: 32px; padding: 0 12px; border-radius: 16px; border: 1px solid {{x.bbd}}; background: {{x.bbg}}; color: {{x.bcol}}; font-size: 12px; font-weight: 700;">{{x.bt}}</button></div></sc-for>'
  '<button onClick="{{goEnt}}" class="carte" style="display: flex; align-items: center; gap: 12px; width: 100%; margin-top: 14px;"><span class="mini" style="width: 40px; height: 40px; background: #1E4E79; font-size: 12px;">FB</span><span style="flex: 1;"><b style="display: block; font-size: 13.5px;">Fleuve Banque</b><span class="meta" style="font-size: 11.5px;">2 membres de votre réseau y travaillent</span></span>' + CHEV + '</button></div></sc-if>'
  '</aside></sc-if>')

# Tablette : Orbi flottant
ORBI_TAB = ('<sc-if value="{{orbiFlot}}" hint-placeholder-val="{{ false }}"><div>'
  '<button onClick="{{ouvrirOrbi}}" class="orbiF" aria-label="Ouvrir Orbi">' + ORBI(60) + '</button>'
  '<sc-if value="{{orbiOpen}}" hint-placeholder-val="{{ false }}"><div class="panO"><div style="display: flex; align-items: center; gap: 10px;">' + ORBI(28) + '<b style="flex: 1; font-size: 15px;">Orbi</b><button onClick="{{fermerOrbi}}" class="rond" aria-label="Fermer Orbi" style="width: 36px; height: 36px; background: #1B3338;">' + ic('croix', 16, '2') + '</button></div>'
  '<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px;"><sc-for list="{{oChoix}}" as="q" hint-placeholder-count="2"><button onClick="{{q.go}}" class="q" style="background: {{q.bg}}; font-weight: {{q.fw}};">{{q.t}}</button></sc-for></div>'
  '<p style="margin-top: 12px; font-size: 14px; line-height: 1.55; color: #DDF6EE;">{{oT}}</p><p class="meta" style="font-size: 11.5px; margin-top: 10px;">Orbi recommande, vous décidez.</p></div></sc-if></div></sc-if>')

def MODAL(cond, corps):
    return (f'<sc-if value="{{{{{cond}}}}}" hint-placeholder-val="{{{{ false }}}}"><div class="modal"><button onClick="{{{{fermerM}}}}" aria-label="Fermer" class="voile"></button><div class="boite">{corps}</div></div></sc-if>')
MODALES = (MODAL('mPlan', '<b style="display: block; font-size: 19px;">Planifier un entretien avec {{c.nom}}</b><p class="meta" style="margin-top: 6px;">Visio avec Aline Mukeba · 45 min · la personne accepte ou propose un autre créneau</p><div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px;"><sc-for list="{{creneaux}}" as="f" hint-placeholder-count="3"><button onClick="{{f.pick}}" class="pill" style="border: 1px solid {{f.bd}}; background: {{f.bg}}; color: {{f.col}};">{{f.t}}</button></sc-for></div><div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px;"><button onClick="{{fermerM}}" class="btn2">Annuler</button><button onClick="{{confirmerPlan}}" class="btn">Envoyer l’invitation</button></div>')
  + MODAL('mNr', '<b style="display: block; font-size: 19px;">Ne pas retenir {{c.nom}}</b><p class="meta" style="margin-top: 6px; line-height: 1.5;">C’est votre décision : Orbi n’écarte personne. Ce message part tel quel, vous pouvez le modifier.</p><p style="margin-top: 14px; padding: 14px 16px; border-radius: 16px; background: #0B1A1F; font-size: 14px; line-height: 1.55;">{{nrTexte}}</p><div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px;"><button onClick="{{fermerM}}" class="btn2">Annuler</button><button onClick="{{confirmerNr}}" class="btn">Envoyer et clore</button></div>')
  + MODAL('mOffre', '<b style="display: block; font-size: 19px;">Publier une offre</b><p class="meta" style="margin-top: 6px; line-height: 1.5;">5 étapes : le poste, les compétences, les conditions, les questions, l’aperçu. Vous utilisez 4 offres sur 20.</p><div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px;"><button onClick="{{fermerM}}" class="btn2">Annuler</button><button onClick="{{continuerOffre}}" class="btn">Commencer</button></div>'))

TOASTW = TOAST.replace('left: 20px; right: 20px; top: 54px;', 'left: 50%; transform: translateX(-50%); width: 520px; top: 18px;')
CORPS = ('<div class="app">' + SIDE + '<div class="main">' + TOP + '<div class="zone"><div class="centre scroll">'
  + V_CAND + V_FICHE + V_OFFRES + V_TAL + V_MSG + V_FIL + V_ENT + V_COMPTE + V_AGENDA + V_EQUIPE + V_TABLEAU + V_MOI + '</div>' + DROITE + '</div></div></div>' + ORBI_TAB + MODALES + MOD_PIL + TOASTW)
CORPS = CORPS.replace('{{voirMembresE}}', '{{voirMembresE}}')
JS2 = JS.replace('/*PILOTAGE*/', open(os.path.join(D, 'r_web_pilotage.js')).read()).replace("goEnt: go('entreprise'),", "goEnt: go('entreprise'), voirMembresE: () => S({ eOng: 'membres' }),")

VUES = ['candidatures', 'agenda', 'equipe', 'tableau', 'moi', 'candidat', 'offres', 'talents', 'messages', 'fil', 'entreprise', 'compte']
def ecrire_web(nom, titre, w, h, tabl):
    props = {'vue': {'editor': 'enum', 'options': VUES, 'default': 'candidatures'}, 'tablette': {'editor': 'boolean', 'default': tabl}, 'admin': {'editor': 'boolean', 'default': False},
             'sousT': {'editor': 'enum', 'options': ['decouvrir', 'vivier', 'propositions', 'reseau'], 'default': 'decouvrir'}, '$preview': {'width': w, 'height': h}}
    js = JS2.replace('/*PRELUDE*/', PRELUDE).replace('/*DONNEES*/', DONNEES)
    html = f'''<!doctype html>
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
<style>{CSS}{WCSS}{PCSS}{TABCSS if tabl else ''}</style>
</helmet>
<div class="fd" style="width: {w}px; height: {h}px; position: relative; overflow: hidden; background: #0B1A1F; border-radius: {24 if tabl else 14}px;">
{CORPS}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{_j.dumps(props, ensure_ascii=False)}'>
{js}
</script>
</body>
</html>
'''
    open(os.path.join(P, nom + '.dc.html'), 'w').write(html)

def imp(nom, fn, titre, props, w, h):
    attrs = ' '.join(f'{k}="{v}"' for k, v in props.items())
    open(os.path.join(P, fn), 'w').write(f'''<!doctype html>
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
<div style="width: {w}px; height: {h}px; font-family: Sora, system-ui, sans-serif; color: #F2EDE5;">
<dc-import name="{nom}" {attrs} hint-size="{w}px,{h}px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{ oui: true }}; }}
}}
</script>
</body>
</html>
''')

ecrire_web('RecruteurWeb', 'Jumanly Modèle B · Recruteur · Ordinateur (prototype cliquable)', 1440, 900, False)
ecrire_web('RecruteurTablette', 'Jumanly Modèle B · Recruteur · Tablette (prototype cliquable)', 1180, 820, True)
T = {'agenda': 'Agenda de la semaine', 'moi': 'Mon espace (rôle, tâches, rapport PDF)', 'candidat': 'Fiche candidat et « Pourquoi ? »', 'offres': 'Offres', 'talents': 'Talents', 'messages': 'Messages', 'fil': 'Fil et publication (220 caractères)', 'entreprise': 'Page entreprise et membres', 'compte': 'Compte et changer de profil'}
L = []
for v, t in T.items():
    imp('RecruteurWeb', f'RecruteurWeb-{v}.dc.html', f'Ordinateur · {t}', {'vue': v}, 1440, 900); L.append([f'RecruteurWeb-{v}.dc.html', 1440, 900])
for fn, t, pr in [('RecruteurWeb-admin-equipe.dc.html', 'Ordinateur · Administrateur · Équipe, rôles et tâches', {'vue': 'equipe', 'admin': 'true'}), ('RecruteurWeb-admin-tableau.dc.html', 'Ordinateur · Administrateur · Tableau de bord', {'vue': 'tableau', 'admin': 'true'}), ('RecruteurWeb-admin-moi.dc.html', 'Ordinateur · Administrateur · Mon espace', {'vue': 'moi', 'admin': 'true'})]:
    imp('RecruteurWeb', fn, t, pr, 1440, 900); L.append([fn, 1440, 900])
imp('RecruteurWeb', 'RecruteurWeb-talents-reseau.dc.html', 'Ordinateur · Talents · Réseau', {'vue': 'talents', 'sousT': 'reseau'}, 1440, 900); L.append(['RecruteurWeb-talents-reseau.dc.html', 1440, 900])
for v in ['agenda', 'candidat', 'messages', 'talents']:
    imp('RecruteurTablette', f'RecruteurTablette-{v}.dc.html', f'Tablette · {T[v]}', {'vue': v}, 1180, 820); L.append([f'RecruteurTablette-{v}.dc.html', 1180, 820])
_j.dump([['RecruteurWeb.dc.html', 1440, 900]] + [x for x in L if 'Tablette' not in x[0]] + [['RecruteurTablette.dc.html', 1180, 820]] + [x for x in L if 'Tablette' in x[0]], open(os.path.join(D, 'r_web_pages.json'), 'w'))
print('ok')
