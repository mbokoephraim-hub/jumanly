# Espace administrateur entreprise, web uniquement, lot 2 : organisation, abonnement, rapports, viviers, modèles communs, sécurité, Orbi (19/10/2026).
# python3 webadm2.py && node shotw.js admin-2   (lundi 19 octobre 2026 ; organisation fictive Mwinda Énergies, Company Plus)
import os, re
H = os.path.dirname(os.path.abspath(__file__))
_a1 = open(H + '/webadm1.py').read(); exec(_a1[:_a1.index('\n# ---------- Chemins')])     # cadre admin, CSS et écrans du lot 1

SEC_ADM[:] = [('favori', 'Viviers'), ('document', 'Modèles communs'), ('portefeuille', 'Crédits et quotas'), ('progression', 'Rapports'), ('confidentialite', 'Sécurité')]
CSSA2 = '''
.a2-st{display:flex;align-items:center;gap:10px;padding:0 4px}.a2-st .e{display:flex;align-items:center;gap:10px;flex:1}.a2-st .e i{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:800;font-size:13px;background:var(--zone);color:var(--texte2);flex:none}
.a2-st .e.ok i{background:#A6F26B;color:#0F3F37}.a2-st .e.on i{background:#0F3F37;color:#A6F26B}.a2-st .e b{font-size:13px}.a2-st .e.on b{font-weight:800}.a2-st .tr{flex:0 0 40px;height:2px;background:var(--trait)}
.sombre .a2-st .e.on i{background:#A6F26B;color:#0F3F37}
.a2-full{display:flex;flex-direction:column;gap:22px;padding:26px 60px 40px;min-height:560px}
.a2-full .hd{display:flex;align-items:center;gap:10px}.a2-full h2{margin:0;font-size:30px}.a2-full p.s{margin:0;color:var(--texte2);font-size:14px}
.a2-pl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.a2-pl .c{padding:20px;border-radius:26px;background:var(--plein);box-shadow:var(--verre);display:flex;flex-direction:column;gap:10px;position:relative}
.a2-pl .c.on{box-shadow:0 0 0 2px #0F3F37,0 30px 60px -30px rgba(15,63,55,.4)}.sombre .a2-pl .c.on{box-shadow:0 0 0 2px #A6F26B}
.a2-pl .c .k{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--texte2)}.a2-pl .c h3{margin:0;font-size:20px}
.a2-pl .c .p{font-size:26px;font-weight:700;letter-spacing:-.02em}.a2-pl .c .p span{font-size:13px;font-weight:500;color:var(--texte2)}
.a2-pl .c ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:7px;font-size:13px}.a2-pl .c li{display:flex;gap:8px;align-items:flex-start}.a2-pl .c li i{width:18px;height:18px;border-radius:50%;flex:none;display:grid;place-items:center;background:#E4F9CF;color:#0F3F37;font-style:normal;font-size:10px;font-weight:800}
.a2-pl .c .bt{margin-top:auto;font-size:14px!important;height:44px!important;padding:0 18px!important}.a2-pl .c .rb{position:absolute;top:-10px;right:18px;padding:4px 10px;border-radius:99px;background:#A6F26B;color:#0F3F37;font-size:11px;font-weight:800}
.a2-ban{height:170px;border-radius:26px 26px 0 0;background:linear-gradient(120deg,#0F3F37 0%,#14594C 55%,#2FD3A6 130%);position:relative;overflow:hidden}
.a2-ban i{position:absolute;border-radius:50%;border:1px solid rgba(166,242,107,.35)}.a2-ban i:nth-child(1){width:300px;height:300px;right:-60px;top:-120px}.a2-ban i:nth-child(2){width:180px;height:180px;right:60px;top:20px;border-color:rgba(166,242,107,.2)}
.a2-ban .sun{position:absolute;right:120px;top:40px;width:54px;height:54px;border-radius:50%;background:#F8CF73;box-shadow:0 0 0 14px rgba(248,207,115,.15)}
.a2-org{padding:0;overflow:hidden}.a2-org .id{display:flex;align-items:flex-end;gap:16px;padding:0 22px 20px;margin-top:-38px;position:relative}
.a2-org .id .lg{width:84px;height:84px;border-radius:24px;background:#A6F26B;color:#0F3F37;display:grid;place-items:center;font-weight:800;font-size:26px;box-shadow:0 0 0 5px var(--plein)}
.a2-org .id .t{flex:1;padding-top:48px}.a2-org h2{margin:0;font-size:24px}.a2-org .id p{margin:4px 0 0;font-size:13px;color:var(--texte2)}
.a2-vb{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:99px;background:#0F3F37;color:#A6F26B}
.a2-chips{display:flex;flex-wrap:wrap;gap:6px}.a2-chips span{padding:6px 12px;border-radius:99px;background:var(--zone);font-size:12.5px;font-weight:600}
.a2-ph{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.a2-ph span{height:86px;border-radius:16px;background:linear-gradient(135deg,#ECFCD8,#93E8CD)}.a2-ph span:nth-child(2){background:linear-gradient(135deg,#FFF3D6,#F8CF73)}.a2-ph span.add{background:var(--zone);display:grid;place-items:center;font-size:12px;font-weight:600;color:var(--texte2)}
.a2-pre{border-radius:22px;overflow:hidden;background:var(--plein);box-shadow:var(--verre)}.a2-pre .b{height:70px;background:linear-gradient(120deg,#0F3F37,#2FD3A6)}.a2-pre .c{padding:0 16px 16px;margin-top:-22px;display:flex;flex-direction:column;gap:8px}
.a2-pre .c .lg{width:46px;height:46px;border-radius:14px;background:#A6F26B;color:#0F3F37;display:grid;place-items:center;font-weight:800;box-shadow:0 0 0 3px var(--plein)}.a2-pre .c b{font-size:15px}.a2-pre .c span{font-size:12px;color:var(--texte2)}
.ad-tbl.a2-inv .r{grid-template-columns:86px minmax(0,1fr) 70px 104px 76px;padding-left:14px;padding-right:14px}
.ad-tbl.a2-sec .r{grid-template-columns:44px minmax(0,1fr) minmax(0,1.4fr) 90px}
.ad-tbl.a2-vv .r{grid-template-columns:minmax(0,1fr) 96px 104px 76px 70px}
.a2-sc{display:flex;flex-direction:column;gap:8px;align-items:stretch}.a2-sc .r{width:auto;align-self:stretch;margin:0;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:var(--zone)}
.a2-sc .r .w{font-size:12px;font-weight:700;color:var(--texte2);width:60px;text-align:right}.a2-sc .r .t{flex:1}.a2-sc .r .t b{display:block;font-size:13.5px}.a2-sc .r .t span{font-size:12px;color:var(--texte2)}
.a2-sc .r .gr{width:18px;color:var(--texte2);font-size:16px;line-height:1}
.a2-stg{display:flex;align-items:stretch;gap:8px}.a2-stg .e{flex:1;padding:12px;border-radius:16px;background:var(--plein);box-shadow:var(--verre);display:flex;flex-direction:column;gap:6px;min-width:0}
.a2-stg .e i{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;color:#0F3F37;font-style:normal;font-weight:800;font-size:12px}.a2-stg .e b{font-size:13px}.a2-stg .e span{font-size:11px;color:var(--texte2)}
.a2-tpl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.a2-tpl .c{padding:14px;border-radius:20px;background:var(--plein);box-shadow:var(--verre);display:flex;flex-direction:column;gap:8px}
.a2-tpl .c .h{display:flex;align-items:center;gap:10px}.a2-tpl .c .h b{flex:1;font-size:14px}.a2-tpl .c p{margin:0;font-size:12.5px;color:var(--texte2);line-height:1.45;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.a2-tpl .c .m{display:flex;justify-content:space-between;font-size:11.5px;color:var(--texte2)}
.a2-tabs{display:flex;gap:6px;padding:5px;border-radius:99px;background:var(--zone);align-self:flex-start}.a2-tabs span{white-space:nowrap;padding:8px 16px;border-radius:99px;font-size:13px;font-weight:600;color:var(--texte2)}.a2-tabs span.on{background:var(--plein);color:var(--texte);box-shadow:var(--verre)}
.a2-bars{display:flex;align-items:flex-end;gap:14px;height:150px;padding:6px 4px 0}.a2-bars .g{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11.5px;color:var(--texte2)}
.a2-bars .g .bb{display:flex;gap:4px;align-items:flex-end;height:120px}.a2-bars .g .bb i{width:16px;border-radius:6px 6px 3px 3px}
.a2-tl{display:flex;flex-direction:column}.a2-tl .r{display:flex;gap:12px;align-items:flex-start;padding:11px 16px;border-top:1px solid var(--trait);font-size:13px}.a2-tl .r:first-child{border-top:0}
.a2-tl .r .x{flex:1}.a2-tl .r .x span{display:block;font-size:11.5px;color:var(--texte2)}.a2-tl .r small{color:var(--texte2);font-size:11.5px;white-space:nowrap}
.a2-dom{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:18px;background:var(--zone)}.a2-dom .t{flex:1}.a2-dom .t b{display:block;font-size:14px}.a2-dom .t span{font-size:12px;color:var(--texte2)}
.a2-chat{display:flex;flex-direction:column;gap:14px;max-width:820px}
.a2-chat .u{align-self:flex-end;max-width:70%;padding:12px 16px;border-radius:20px 20px 6px 20px;background:#0F3F37;color:#fff;font-size:14px}.sombre .a2-chat .u{background:#A6F26B;color:#0F3F37}
.a2-chat .o{display:flex;gap:12px;align-items:flex-start}.a2-chat .o .b{flex:1;padding:16px;border-radius:6px 22px 22px 22px;background:var(--plein);box-shadow:var(--verre);display:flex;flex-direction:column;gap:10px;font-size:14px;line-height:1.5}
.a2-in{display:flex;align-items:center;gap:10px;padding:8px 8px 8px 18px;border-radius:99px;background:var(--plein);box-shadow:var(--verre);font-size:14px;color:var(--texte2);max-width:820px}.a2-in span{flex:1}
.a2-sug{display:flex;flex-wrap:wrap;gap:8px;max-width:820px}.a2-sug span{padding:8px 14px;border-radius:99px;background:var(--plein);box-shadow:var(--verre);font-size:13px;font-weight:600}
.a2-hist{display:flex;flex-direction:column;gap:4px}.a2-hist span{padding:10px 12px;border-radius:14px;font-size:13px}.a2-hist span.on{background:var(--plein);box-shadow:var(--verre);font-weight:600}
.a2-orbi{display:grid;grid-template-columns:240px minmax(0,1fr);gap:22px;align-items:start}
.a2-dz{border:1.5px solid rgba(214,84,60,.35);border-radius:22px;padding:6px}.a2-dz .r{display:flex;align-items:center;gap:12px;padding:12px 14px;border-top:1px solid var(--trait)}.a2-dz .r:first-child{border-top:0}
.a2-dz .r .t{flex:1}.a2-dz .r .t b{display:block;font-size:14px}.a2-dz .r .t span{font-size:12px;color:var(--texte2)}.a2-dz .bt.d{color:#B23A22}.sombre .a2-dz .bt.d{color:#F4B3A6}
.a2-bars .g .bb i.rc,.ad-lg i.rc{background:#0F3F37}.sombre .a2-bars .g .bb i.rc,.sombre .ad-lg i.rc{background:#93B4F0}
.sombre .rap4 .s4,.sombre .rap4 .s4 b{color:#0F3F37}
.a2-ent{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.a2-ent .c{padding:16px;border-radius:20px;background:var(--plein);box-shadow:var(--verre);display:flex;flex-direction:column;gap:6px;opacity:.75}.a2-ent .c b{font-size:14px}.a2-ent .c span{font-size:12px;color:var(--texte2)}
'''
OK_ = '<i class="v">✓</i>'

# ---------- 1. Créer l'organisation (premiers pas de l'admin) ----------
def etapes(n):
    E = ['Formule', 'Organisation', 'Domaine', 'Équipe']
    h = ''
    for i, e in enumerate(E, 1):
        cl = 'ok' if i < n else ('on' if i == n else '')
        h += (f'<div class="e {cl}"><i>{"✓" if i < n else i}</i><b>{e}</b></div>' + ('<span class="tr"></span>' if i < len(E) else ''))
    return f'<div class="a2-st">{h}</div>'
def plein(n, corps, bas):
    return pub('/organisation/creer', f'''<div class="a2-full"><div class="hd"><span class="lg-e sap" style="width:34px;height:34px">J</span><b style="flex:1">jumanly</b><span style="font-size:12.5px;color:var(--texte2)">Compte RH de Sandrine Ilunga</span></div>{etapes(n)}{corps}
<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:auto">{bas}</div></div>''')
PLANS = f'''<div class="a2-pl">
<div class="c"><span class="k">5 sièges · 20 offres</span><h3>Company</h3><span class="p">79,9 $ <span>par mois</span></span><ul><li><i>✓</i>Profil vérifié, ATS, matching expliqué</li><li><i>✓</i>Rôles admin, recruteur, manager, lecteur</li><li><i>✓</i>Grilles d’évaluation, statistiques</li></ul><a class="bt sec m">Choisir</a></div>
<div class="c on"><span class="rb">Choisie</span><span class="k">15 sièges · 50 offres</span><h3>Company Plus</h3><span class="p">179,9 $ <span>par mois</span></span><ul><li><i>✓</i>Pôles et rôles personnalisés</li><li><i>✓</i>Viviers partagés, recherche approfondie</li><li><i>✓</i>Rapports consolidés et export</li><li><i>✓</i>Assistance prioritaire</li></ul><a class="bt p m">Continuer</a></div>
<div class="c"><span class="k">30 sièges et plus</span><h3>Company Premium</h3><span class="p" style="font-size:20px">Sur devis</span><ul><li><i>✓</i>Filiales et entités</li><li><i>✓</i>Étapes de recrutement sur mesure</li><li><i>✓</i>Intégrations RH, accompagnement</li></ul><a class="bt sec m">Demander un devis</a></div></div>
<div class="gar">{ic("aide","s")}Commencer gratuitement en RH Free est possible : vous passez à Company quand l’équipe grandit, sans rien perdre.</div>'''
W_C1 = plein(1, '<div><h2>Choisissez la formule de votre organisation</h2><p class="s">Prépayée par mois, en Mobile Money ou par carte. Candidater reste gratuit pour les talents.</p></div>' + PLANS, '')
C2 = f'''<div class="ad-g"><div class="ad-col"><div><h2>Votre organisation</h2><p class="s">Elle apparaîtra sur vos offres et votre page entreprise.</p></div>
<div class="verre" style="padding:18px;display:flex;flex-direction:column;gap:14px">{champ("Nom", "Mwinda Énergies", "focus")}<div class="ad-g2">{champ("Secteur", "Énergie et services")}{champ("Taille", "200 à 500 personnes")}</div><div class="ad-g2">{champ("Siège", "Kinshasa, Gombe")}{champ("Autres sites", "Lubumbashi")}</div></div></div>
<div class="ad-col"><span class="ck-t">Aperçu sur une offre</span><div class="a2-pre"><div class="b"></div><div class="c"><span class="lg">ME</span><b>Mwinda Énergies</b><span>Énergie et services · Kinshasa</span></div></div>
<div class="orbi-l">{orbi(26)}<div class="t">Le nom existe-t-il déjà sur Jumanly ? Non : vous créez une nouvelle organisation.</div></div></div></div>'''
W_C2 = plein(2, C2, f'<a class="bt sec m">{ic("retour","s")}Retour</a><a class="bt p m">Continuer</a>')
C3 = f'''<div class="ad-g"><div class="ad-col"><div><h2>Votre domaine e-mail</h2><p class="s">Les personnes de ce domaine pourront demander à rejoindre l’organisation. Vous choisissez toujours leur rôle.</p></div>
<div class="a2-dom">{CS("valider","accent",42,14)}<div class="t"><b>mwinda-energies.example</b><span>Confirmé par le code envoyé à sandrine.i@mwinda-energies.example</span></div><span class="ad-pl ok">Confirmé</span></div>
<div class="verre" style="padding:6px"><div class="ad-tg"><div class="r"><div class="t"><b>Demandes sur le domaine</b><span>Une personne du domaine demande, vous acceptez</span></div><span class="sw on"></span></div><div class="r"><div class="t"><b>Invitations hors domaine</b><span>Consultants, cabinets partenaires</span></div><span class="sw on"></span></div></div></div></div>
<div class="ad-col"><span class="ck-t">Ensuite</span><div class="ad-chk"><div class="r">{OK_}<span>Vérification de l’organisation : document officiel, examen par Jumanly</span></div><div class="r">{OK_}<span>Badge « Vérifiée » sur vos offres</span></div></div></div></div>'''
W_C3 = plein(3, C3, f'<a class="bt sec m">{ic("retour","s")}Retour</a><a class="bt p m">Continuer</a>')
C4 = f'''<div class="ad-g"><div class="ad-col"><div><h2>Invitez votre équipe</h2><p class="s">Maintenant ou plus tard. 15 sièges dont le vôtre.</p></div>
<div class="verre" style="padding:18px;display:flex;flex-direction:column;gap:12px"><span class="ad-lab">E-mails</span><div class="ad-ml"><span>jonathan.m@mwinda-energies.example</span><span>aicha.k@mwinda-energies.example</span><span>esther.n@mwinda-energies.example</span><em>Ajouter</em></div>
<span class="ad-lab">Rôle par défaut</span><div class="seg"><span>Admin</span><span class="on">Recruteur</span><span>Manager</span><span>Lecteur</span></div><div class="ad-sg"><b>4 sièges sur 15</b>{sieges(1, 3)}</div></div></div>
<div class="ad-col"><span class="ck-t">Votre espace sera prêt avec</span><div class="ad-li" style="background:var(--plein);box-shadow:var(--verre)"><div class="r">{CS("reglages","accent",32,11)}<div class="t"><b>Administration</b><span>Équipe, rôles, pôles, crédits</span></div></div><div class="r">{CS("offre","former",32,11)}<div class="t"><b>Recrutement</b><span>Vos propres offres</span></div></div><div class="r">{CS("orbi","accomp",32,11)}<div class="t"><b>1 000 crédits Orbi par mois</b><span>À répartir dans l’équipe</span></div></div></div></div></div>'''
W_C4 = plein(4, C4, f'<a class="bt sec m">Plus tard</a><a class="bt p m">{ic("envoyer","s")}Inviter et payer</a>')

# ---------- 2. Page de l'organisation et vérification ----------
def org_a():
    h = f'''<div class="verre a2-org"><div class="a2-ban"><i></i><i></i><span class="sun"></span></div><div class="id"><span class="lg">ME</span><div class="t"><div style="display:flex;gap:10px;align-items:center"><h2>Mwinda Énergies</h2><span class="a2-vb">{ic("valider","xs")}Vérifiée</span></div><p>Énergie et services · 200 à 500 personnes · {FLAG["cd"]} Kinshasa, Lubumbashi</p></div>
<div class="ad-bts"><a class="bt sec m">Voir comme un talent</a><a class="bt p m">{ic("modifier","s")}Modifier</a></div></div></div>'''
    g = f'''<div class="ad-g"><div class="ad-col"><div class="verre" style="padding:18px;display:flex;flex-direction:column;gap:12px"><b>Présentation</b><span style="font-size:13.5px;line-height:1.55">Nous produisons et distribuons une électricité solaire fiable pour les entreprises et les foyers de RD Congo.</span>
<div class="a2-chips"><span>Formation continue</span><span>Assurance santé</span><span>Transport</span><span>Télétravail partiel</span></div></div>
<div class="verre" style="padding:18px;display:flex;flex-direction:column;gap:12px"><b>Photos</b><div class="a2-ph"><span></span><span></span><span class="add">{ic("photo","s")}&nbsp;Ajouter</span></div></div></div>
<div class="ad-col"><div class="ad-g2"><div class="verre ad-k"><small>Offres en ligne</small><b class="v">23</b></div><div class="verre ad-k"><small>Pôles visibles</small><b class="v">4</b></div></div>
<div class="verre" style="padding:6px"><div class="ad-tg"><div class="r"><div class="t"><b>Afficher les pôles</b><span>Tech et Data, Commercial…</span></div><span class="sw on"></span></div><div class="r"><div class="t"><b>Afficher les recruteurs</b><span>Nom et rôle sur chaque offre</span></div><span class="sw on"></span></div></div></div>
<div class="orbi-l" data-ob="1">{orbi(26)}<div class="t">Une photo de l’équipe sur le terrain rend la page plus parlante. Je ne publie rien sans vous.</div></div></div></div>'''
    return wh('Page de l’organisation', 'Vue par les talents sur chaque offre et sur votre page') + h + g
W_ORGA = A(org_a(), '', '/profil')
def verif_a():
    s = f'''<div class="verw"><div class="verre st ok"><span class="n">{ic("valider","xs")}</span><b>Domaine e-mail</b><span>mwinda-energies.example</span><span class="etq-s ok" style="align-self:flex-start">Confirmé</span></div>
<div class="verre st ok"><span class="n">{ic("valider","xs")}</span><b>Document officiel</b><span>RCCM et numéro d’identification</span><span class="etq-s ok" style="align-self:flex-start">Accepté</span></div>
<div class="verre st ok"><span class="n">{ic("valider","xs")}</span><b>Examen par Jumanly</b><span>Le 12 octobre</span><span class="etq-s ok" style="align-self:flex-start">Vérifiée</span></div></div>'''
    d = f'''<div class="ad-g2"><div class="ad-col"><span class="ck-t">Ce que la vérification apporte</span><div class="ad-chk"><div class="r">{OK_}<span>Badge « Vérifiée » sur la page et les offres</span></div><div class="r">{OK_}<span>Publication sans passage en validation chez Jumanly</span></div><div class="r">{OK_}<span>Demandes sur le domaine acceptées en un geste</span></div></div></div>
<div class="ad-col"><span class="ck-t">À renouveler</span><div class="gar">{ic("horloge","s")}Chaque année, ou si le nom ou le domaine change. Une question : assistant@jumanly.io</div></div></div>'''
    return wh('Vérification', 'Mwinda Énergies · vérifiée le 12 octobre 2026') + s + d
W_VERA = A(verif_a(), '', '/profil/verification')

# ---------- 3. Abonnement, sièges, factures ----------
def abo_a():
    h = f'''<div class="abr"><span class="jr"><i><b>21</b>jours</i></span><div class="t"><small>Formule de l’organisation</small><b>Company Plus · 179,9 $</b><span>Par mois · payée jusqu’au 9 novembre · prépayé, sans prélèvement automatique</span></div><div class="ad-bts"><a class="bt sec m">Changer de formule</a><a class="bt a m">Prolonger</a></div></div>'''
    q = f'''<div class="ad-g4"><div class="verre ad-k"><div class="h">{CS("candidats","accomp")}<small>Sièges</small></div><b class="v">12 <span>sur 15</span></b>{sieges()}</div>
<div class="verre ad-k"><div class="h">{CS("offre","former")}<small>Offres actives</small></div><b class="v">23 <span>sur 50</span></b><span class="barre"><i style="width:46%"></i></span></div>
<div class="verre ad-k"><div class="h">{CS("orbi","accent")}<small>Crédits Orbi</small></div><b class="v">640 <span>sur 1 000</span></b><span class="barre"><i style="width:64%"></i></span></div>
<div class="verre ad-k"><div class="h">{CS("recherche","oppo")}<small>Recherches de talents</small></div><b class="v">412 <span>sur 1 000</span></b><span class="barre"><i style="width:41%"></i></span></div></div>'''
    F = [('9 oct. 2026', 'Company Plus · octobre', '179,9 $', 'Orange Money'), ('9 sept. 2026', 'Company Plus · septembre', '179,9 $', 'Carte'), ('9 août 2026', 'Company · août', '79,9 $', 'Orange Money'), ('20 juil. 2026', 'Crédits Orbi · 200', '19,9 $', 'M-Pesa')]
    r = '<div class="r"><span>Date</span><span>Objet</span><span>Montant</span><span>Payé par</span><span></span></div>' + ''.join(
        f'<div class="r"><span class="g">{d}</span><b style="font-size:13.5px">{o}</b><b>{m}</b><span class="g">{p}</span><a class="bt sec s">{ic("telecharger","xs")}PDF</a></div>' for d, o, m, p in F)
    return (wh('Abonnement', 'Mwinda Énergies · géré par l’admin principale') + h + q
            + f'''<div class="ad-g"><div class="ad-col"><div class="ad-sec">Factures<a>Au nom de Mwinda Énergies</a></div><div class="verre ad-tbl a2-inv">{r}</div></div>
<div class="ad-col"><div class="verre" style="padding:6px"><div class="ad-tg"><div class="r"><div class="t"><b>Rappels de paiement</b><span>J-7, J-3 et le jour même, à vous et à Jonathan</span></div><span class="sw on"></span></div><div class="r"><div class="t"><b>Délai de grâce</b><span>3 jours, puis RH Free sans perte de données</span></div></div></div></div>
<div class="gar">{ic("document","s")}Factures sans numéro de téléphone. Une question : assistant@jumanly.io</div></div></div>''')
W_ABO = A(abo_a(), 'portefeuille', '/abonnement')
def formules_a():
    return (wh('Changer de formule', 'Vous êtes en Company Plus · 12 sièges utilisés', '') + PLANS.replace('<span class="rb">Choisie</span>', '<span class="rb">Actuelle</span>').replace('<a class="bt p m">Continuer</a>', '<a class="bt sec m" style="opacity:.6">Formule actuelle</a>')
            .replace('<a class="bt sec m">Choisir</a>', '<a class="bt sec m">Passer à Company</a>')
            + f'''<div class="manq">{ic("aide","s")}<span><b>Passer à Company : 5 sièges.</b> Vous avez 12 membres. Choisissez qui garde l’accès avant le changement, le 9 novembre. Aucune donnée n’est perdue.</span></div>''')
W_FORMA = A(formules_a(), 'portefeuille', '/abonnement/formules')
PAYA = (paiement_r().replace('RH Premium', 'Company Plus').replace('49,9', '179,9').replace('Baobab Fintech', 'Mwinda Énergies').replace('19 oct. au 18 nov.', '9 nov. au 8 déc.'))
W_PAYA = A(PAYA, 'portefeuille', '/abonnement/paiement')

# ---------- 4. Rapports consolidés ----------
def rap_a():
    tabs = '<div class="a2-tabs"><span class="on">Toute l’organisation</span><span>Par pôle</span><span>Par recruteur</span><span>Par offre</span></div>'
    k = '<div class="rap4"><div class="s1"><b>412</b>candidatures</div><div class="s2"><b>3 j</b>délai moyen de réponse</div><div class="s3"><b>41</b>entretiens</div><div class="s4"><b>9</b>recrutements</div></div>'
    P = [('Tech et Data', 132, 12, 3), ('Commercial', 151, 14, 2), ('Finance', 48, 6, 1), ('Lubumbashi', 81, 9, 3)]
    bars = ''.join(f'<div class="g"><div class="bb"><i style="height:{round(c/151*110)}px;background:linear-gradient(180deg,#A6F26B,#2FD3A6)"></i><i style="height:{e*7}px;background:#F8CF73"></i><i class="rc" style="height:{r*14}px"></i></div>{n}</div>' for n, c, e, r in P)
    ch = f'''<div class="verre" style="padding:16px;display:flex;flex-direction:column;gap:10px"><b>Par pôle</b><div class="a2-bars">{bars}</div><div class="ad-lg"><span><i style="background:#2FD3A6"></i>Candidatures</span><span><i style="background:#F8CF73"></i>Entretiens</span><span><i class="rc"></i>Recrutements</span></div></div>'''
    R_ = [('AK', '', 'Aïcha K.', 'Tech et Data', '96', '2 j', '2'), ('EN', 'c', 'Esther N.', 'Lubumbashi', '81', '2 j', '3'), ('PL', 'd', 'Pascal L.', 'Commercial', '74', '5 j', '1'), ('FL', 'e', 'Franck L.', 'Commercial', '9', '—', '0')]
    t = '<div class="r"><span>Recruteur</span><span>Pôle</span><span>Candidatures</span><span>Réponse</span><span>Recrutés</span></div>' + ''.join(
        f'<div class="r"><div class="m">{AV(i, c, 30)}<div class="t"><b>{n}</b></div></div><span class="g">{p}</span><span>{k_}</span><span class="{"g" if d == "—" else ""}">{d}</span><span>{r}</span></div>' for i, c, n, p, k_, d, r in R_)
    return (wh('Rapports', 'Mwinda Énergies · consolidés · 30 derniers jours', f'<a class="bt p m">{ic("telecharger","s")}Exporter en PDF</a>') + tabs + k
            + f'''<div class="ad-g"><div class="ad-col">{ch}<div class="verre ad-tbl a2-vv">{t}</div></div><div class="ad-col"><div class="verre" data-ob="1" style="padding:16px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;gap:10px;align-items:center">{orbi(32)}<b>Lecture d’Orbi</b></div>
<div class="ad-chk"><div class="r"><i class="a">!</i><span>Commercial répond en 5 jours en moyenne : 2 offres sans réponse pèsent dessus.</span></div><div class="r"><i class="v">✓</i><span>Lubumbashi recrute le plus avec moins de candidatures.</span></div></div><span style="font-size:11.5px;color:var(--texte2)">Des constats sur les chiffres. Aucune personne n’est classée.</span></div>
<div class="gar">{ic("confidentialite","s")}Rapports sans donnée personnelle des candidats.</div></div></div>''')
W_RAPA = A(rap_a(), 'progression', '/rapports')

# ---------- 5. Viviers partagés ----------
def viviers():
    V = [('Data et BI', 'accent', 'Tech et Data', 34, 'Toute l’organisation'), ('Commerciaux terrain', 'former', 'Commercial', 52, 'Pôle Commercial'), ('Techniciens solaire', 'accomp', 'Lubumbashi', 27, 'Lubumbashi, Tech et Data'),
         ('Finance et contrôle', 'oppo', 'Finance', 18, 'Pôle Finance'), ('Anciens finalistes', 'accent', 'Tous', 41, 'Toute l’organisation')]
    c = ''.join(f'<div class="verre ad-pole"><div class="h">{CS("favori",g,42,14)}<div class="t"><b>{n}</b><span>{k} talents · créé par {p}</span></div></div><div style="display:flex;justify-content:space-between;align-items:center"><span class="ad-pl">{v}</span><a class="bt sec s">Ouvrir</a></div></div>' for n, g, p, k, v in V)
    return (wh('Viviers partagés', 'Listes de talents partagées entre pôles', f'<a class="bt p m">{ic("plus","s")}Créer un vivier</a>') + f'<div class="ad-g3">{c}</div>'
            + f'''<div class="ad-g2"><div class="gar">{ic("confidentialite","s")}Un talent n’entre dans un vivier que s’il a postulé ou rendu son profil visible. Il peut demander à en sortir.</div><div class="gar">{ic("horloge","s")}Sans activité pendant 12 mois, un talent sort du vivier automatiquement.</div></div>''')
W_VIV = A(viviers(), 'favori', '/viviers')
DLG_VIV = f'''<h3>Qui voit « Commerciaux terrain » ?</h3><div class="ad-opt"><div class="o">{CS("entreprise","accent",36,12)}<div class="t"><b>Toute l’organisation</b><span>Recruteurs et managers de tous les pôles</span></div><span class="rd"></span></div>
<div class="o on">{CS("offre","former",36,12)}<div class="t"><b>Pôle Commercial</b><span>Jonathan, Pascal, Franck</span></div><span class="rd"></span></div><div class="o">{CS("candidats","accomp",36,12)}<div class="t"><b>Personnes choisies</b><span>Nom par nom</span></div><span class="rd"></span></div></div>
<div class="ad-tg"><div class="r"><div class="t"><b>Les recruteurs peuvent ajouter des talents</b></div><span class="sw on"></span></div><div class="r"><div class="t"><b>Les managers voient le vivier</b></div><span class="sw"></span></div></div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Enregistrer</a></div>'''
W_VIVP = A(viviers(), 'favori', '/viviers', over=dlg(DLG_VIV, 540))

# ---------- 6. Modèles communs ----------
def modeles(onglet='grilles'):
    tabs = '<div class="a2-tabs">' + ''.join(f'<span class="{"on" if k == onglet else ""}">{l}</span>' for k, l in [('grilles', 'Grilles d’évaluation'), ('etapes', 'Étapes du recrutement'), ('messages', 'Modèles de messages')]) + '</div>'
    if onglet == 'grilles':
        crit = [('Compétences techniques', 'Ce que la personne sait faire, avec une preuve', '40 %'), ('Expérience utile', 'Missions proches du poste', '25 %'), ('Communication', 'Explique simplement', '20 %'), ('Esprit d’équipe', 'Exemples concrets', '15 %')]
        sc = ''.join(f'<div class="r"><span class="gr">⋮⋮</span><div class="t"><b>{n}</b><span>{s}</span></div><span class="w">{w}</span></div>' for n, s, w in crit)
        corps = f'''<div class="ad-g"><div class="ad-col"><div class="verre" style="padding:18px;display:flex;flex-direction:column;gap:12px"><div style="display:flex;align-items:center;gap:10px"><b style="flex:1;font-size:16px">Grille « Profils techniques »</b><span class="ad-pl">Tech et Data · Lubumbashi</span></div>
<div class="a2-sc">{sc}</div><a style="font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px">{ic("plus","xs")}Ajouter un critère</a><span style="font-size:12px;color:var(--texte2)">Notes de 1 à 5. Âge, genre, origine, photo ou situation familiale ne peuvent pas être des critères.</span></div></div>
<div class="ad-col"><span class="ck-t">Grilles de l’organisation</span><div class="ad-li" style="background:var(--plein);box-shadow:var(--verre)"><div class="r">{CS("candidature","accent",32,11)}<div class="t"><b>Profils techniques</b><span>Utilisée sur 9 offres</span></div></div><div class="r">{CS("candidature","former",32,11)}<div class="t"><b>Vente et relation client</b><span>8 offres</span></div></div><div class="r">{CS("candidature","oppo",32,11)}<div class="t"><b>Finance</b><span>3 offres</span></div></div></div>
<div class="gar">{ic("aide","s")}Les recruteurs choisissent une grille commune ou partent d’elle pour leur offre.</div></div></div>'''
    elif onglet == 'etapes':
        E = [('1', 'Reçue', 'accent'), ('2', 'Examinée', 'former'), ('3', 'Présélection', 'accomp'), ('4', 'Entretien', 'oppo'), ('5', 'Décision', 'former')]
        st = ''.join(f'<div class="e"><i style="background:var(--g-{g})">{n}</i><b>{l}</b><span>{"Message au candidat" if l in ("Entretien", "Décision") else "Sans message"}</span></div>' for n, l, g in E)
        corps = f'''<div class="verre" style="padding:18px;display:flex;flex-direction:column;gap:14px"><b>Étapes par défaut des offres</b><div class="a2-stg">{st}</div>
<div class="ad-g2"><div class="verre" style="padding:6px;box-shadow:none"><div class="ad-tg"><div class="r"><div class="t"><b>Grille obligatoire avant la décision</b><span>Au moins une évaluation</span></div><span class="sw on"></span></div><div class="r"><div class="t"><b>Réponse aux non retenus</b><span>Proposée à la clôture, relue avant l’envoi</span></div><span class="sw on"></span></div></div></div>
<div class="ad-lock">{ic("cadenas","s")}Ajouter, renommer ou réordonner des étapes : Company Premium.</div></div></div>'''
    else:
        T = [('Invitation à l’entretien', 'Bonjour {prénom}, votre candidature pour {offre} a retenu notre attention. Nous aimerions vous rencontrer…', 'Tous les pôles', '214 envois'),
             ('Candidature non retenue', 'Bonjour {prénom}, merci pour l’intérêt porté à {offre}. Nous avons retenu d’autres profils cette fois…', 'Tous les pôles', '188 envois'),
             ('Documents à envoyer', 'Bonjour {prénom}, pour avancer, pourriez-vous nous transmettre votre diplôme et une pièce d’identité…', 'Lubumbashi', '42 envois'),
             ('Visite de site', 'Bonjour {prénom}, l’entretien a lieu sur notre site de Lubumbashi. Prévoyez des chaussures fermées…', 'Lubumbashi', '19 envois'),
             ('Offre d’emploi', 'Bonjour {prénom}, nous avons le plaisir de vous proposer le poste de {offre}…', 'Admins seulement', '9 envois'),
             ('Relance douce', 'Bonjour {prénom}, nous revenons vers vous au sujet de {offre}…', 'Tous les pôles', '61 envois')]
        corps = '<div class="a2-tpl">' + ''.join(f'<div class="c"><div class="h">{CS("message","former",32,11)}<b>{n}</b></div><p>{p}</p><div class="m"><span class="ad-pl">{v}</span><span>{e}</span></div></div>' for n, p, v, e in T) + '</div>'
        corps += f'<div class="gar">{ic("message","s")}Signature commune : « L’équipe recrutement de Mwinda Énergies · recrutement@mwinda-energies.example ». Jamais de numéro de téléphone.</div>'
    return wh('Modèles communs', 'Pour que toute l’équipe recrute de la même façon', f'<a class="bt p m">{ic("plus","s")}Nouveau</a>') + tabs + corps
W_MGRI = A(modeles('grilles'), 'document', '/modeles/grilles')
W_MSTG = A(modeles('etapes'), 'document', '/modeles/etapes')
W_MMSG = A(modeles('messages'), 'document', '/modeles/messages')

# ---------- 7. Sécurité et journal ----------
def securite(onglet='journal'):
    tabs = '<div class="a2-tabs">' + ''.join(f'<span class="{"on" if k == onglet else ""}">{l}</span>' for k, l in [('journal', 'Journal d’activité'), ('consult', 'Consultations de profils'), ('acces', 'Connexion et accès')]) + '</div>'
    if onglet == 'journal':
        J = [('SI', 's', 'Sandrine a nommé Aïcha <b>Admin</b>', 'Rôles · avant : Recruteuse', '10:42'), ('JM', 'b', 'Jonathan a retiré <b>Franck Lokwa</b>', 'Équipe · 2 offres confiées à Pascal', '10:05'),
             ('SI', 's', 'Sandrine a accordé <b>100 crédits Orbi</b> à Esther', 'Crédits · pour ce mois', '09:51'), ('AK', '', 'Aïcha a exporté le rapport <b>Tech et Data</b>', 'Rapports · PDF', '09:30'),
             ('JM', 'b', 'Jonathan a validé <b>Commercial terrain B2B</b>', 'Offres · publiée', 'Ven.'), ('SI', 's', 'Sandrine a créé le rôle <b>Recruteur junior</b>', 'Rôles', 'Jeu.')]
        corps = f'<div class="ad-flt"><div class="rch2">{ic("recherche","s")}Personne, action</div><span class="ad-pc on">Tout</span><span class="ad-pc">Rôles</span><span class="ad-pc">Équipe</span><span class="ad-pc">Offres</span><span class="ad-pc">Exports</span></div>'
        corps += '<div class="verre a2-tl">' + ''.join(f'<div class="r">{AV(i, c, 32)}<div class="x">{t}<span>{s}</span></div><small>{h}</small></div>' for i, c, t, s, h in J) + '</div>'
        corps += f'<div class="gar">{ic("confidentialite","s")}Le journal se garde 12 mois. Personne ne peut le modifier, pas même l’admin principale.</div>'
    elif onglet == 'consult':
        C = [('AK', '', 'Aïcha Kasongo', 'Ruth B.', 'A postulé · Data analyst confirmé', '10:12'), ('DM', 'b', 'Dieudonné Mpiana', 'Ruth B.', 'A postulé · offre confiée', '09:15'),
             ('EN', 'c', 'Esther Nzuzi', 'Profil anonyme', 'Vivier · profil visible', '08:47'), ('PL', 'd', 'Pascal Lumbala', 'Patrick K.', 'A postulé · Chargé de clientèle', 'Ven.')]
        corps = '<div class="verre ad-tbl a2-sec"><div class="r"><span>Membre</span><span></span><span>Profil consulté et motif</span><span>Quand</span></div>' + ''.join(
            f'<div class="r"><div class="m">{AV(i, c, 30)}</div><b style="font-size:13.5px">{n}</b><div><b style="font-size:13px">{p}</b><span style="display:block;font-size:12px;color:var(--texte2)">{m}</span></div><span class="g">{h}</span></div>' for i, c, n, p, m, h in C) + '</div>'
        corps += f'<div class="ad-g2"><div class="gar">{ic("confidentialite","s")}Chaque consultation est journalisée. Le talent peut savoir quelle organisation a vu son profil.</div><div class="verre ad-k"><small>Consultations ce mois</small><b class="v">318</b><span class="n">toutes justifiées : candidature ou profil visible</span></div></div>'
    else:
        tg = lambda b, s, on: f'<div class="r"><div class="t"><b>{b}</b><span>{s}</span></div><span class="sw{" on" if on else ""}"></span></div>'
        corps = f'''<div class="ad-g"><div class="ad-col"><div class="verre" style="padding:6px"><div class="ad-tg">{tg("Vérification en deux étapes obligatoire", "Pour les admins et les recruteurs", True)}{tg("Connexion avec le domaine seulement", "E-mails @mwinda-energies.example", False)}{tg("Déconnexion après 12 h d’inactivité", "Sur les ordinateurs partagés", True)}{tg("Export des listes de candidats", "Réservé aux admins", True)}</div></div>
<div class="a2-dom">{CS("valider","accent",40,13)}<div class="t"><b>mwinda-energies.example</b><span>Domaine confirmé · demandes pour rejoindre activées</span></div><a class="bt sec s">Gérer</a></div></div>
<div class="ad-col"><span class="ck-t">Sessions ouvertes</span><div class="ad-li" style="background:var(--plein);box-shadow:var(--verre)"><div class="r">{CS("reglages","accent",32,11)}<div class="t"><b>Ordinateur · Kinshasa</b><span>Vous · maintenant</span></div></div><div class="r">{CS("reglages","former",32,11)}<div class="t"><b>Tablette · Kinshasa</b><span>Vous · hier</span></div><a class="bt sec s">Fermer</a></div></div>
<div class="orbi-l" data-ob="1">{orbi(26)}<div class="t">3 membres n’ont pas encore activé la vérification en deux étapes. Je peux leur envoyer un rappel, si vous le voulez.</div></div></div></div>'''
    return wh('Sécurité', 'Mwinda Énergies') + tabs + corps
W_SJ = A(securite('journal'), 'confidentialite', '/securite')
W_SC = A(securite('consult'), 'confidentialite', '/securite/consultations')
W_SA = A(securite('acces'), 'confidentialite', '/securite/acces')

# ---------- 8. Orbi pour l'admin ----------
def orbi_a():
    hist = '<div class="a2-hist"><span class="ck-t" style="padding:4px 12px">Récemment</span><span class="on">Répartir les crédits</span><span>Offres sans réponse</span><span>Préparer le comité RH</span><span>Rôle pour les stagiaires</span></div>'
    ch = f'''<div class="a2-chat"><div class="u">Comment répartir les crédits Orbi le mois prochain ?</div>
<div class="o">{orbi(36)}<div class="b"><span>D’après les 3 derniers mois, voici une répartition possible des 1 000 crédits :</span>
<div class="ad-li"><div class="r"><div class="t"><b>Lubumbashi</b><span>5 offres, beaucoup de CV analysés</span></div><span class="v">300 <small style="color:var(--texte2)">au lieu de 250</small></span></div><div class="r"><div class="t"><b>Tech et Data</b></div><span class="v">300</span></div><div class="r"><div class="t"><b>Commercial</b><span>Une partie inutilisée</span></div><span class="v">250 <small style="color:var(--texte2)">au lieu de 300</small></span></div><div class="r"><div class="t"><b>Finance</b></div><span class="v">150</span></div></div>
<span style="font-size:12.5px;color:var(--texte2)">C’est une proposition : rien ne change sans votre accord.</span><div class="ad-bts"><a class="bt p s">Appliquer le 9 novembre</a><a class="bt sec s">Modifier</a></div></div></div></div>
<div class="a2-sug"><span>Qui n’a pas répondu depuis 7 jours ?</span><span>Résumer le mois pour la direction</span><span>Quels sièges sont peu utilisés ?</span></div>
<div class="a2-in">{ic("plus","s")}<span>Écrire à Orbi</span>{bi("micro")}{bi("envoyer","","e")}</div>'''
    return wh('Orbi', 'Pour l’administration · 640 crédits restants ce mois') + f'<div class="a2-orbi">{hist}<div class="ad-col">{ch}</div></div>'
W_ORBA = A(orbi_a(), 'orbi', '/orbi')

# ---------- 9. Réglages de l'organisation ----------
def reglages_a():
    nt = lambda b, s, on: f'<div class="r"><div class="t"><b>{b}</b><span>{s}</span></div><span class="sw{" on" if on else ""}"></span></div>'
    return (wh('Paramètres de l’organisation', 'Mwinda Énergies')
            + f'''<div class="ad-g"><div class="ad-col"><span class="ck-t">Vous prévenir quand</span><div class="verre" style="padding:6px"><div class="ad-tg">{nt("Quelqu’un demande à rejoindre", "Dans l’app et par e-mail", True)}{nt("Une offre attend votre validation", "Dans l’app", True)}{nt("Un membre demande des crédits", "Dans l’app", True)}{nt("Un quota atteint 80 %", "Dans l’app et par e-mail", True)}{nt("Résumé de la semaine", "Le lundi à 8 h, par e-mail", False)}</div></div>
<span class="ck-t">Filiales et entités</span><div class="a2-ent"><div class="c"><b>Mwinda Énergies Kinshasa</b><span>Entité principale</span></div><div class="c"><b>Ajouter une filiale</b><span>Factures et équipes séparées</span></div><div class="c"><b>Company Premium</b><span>Sur devis</span></div></div></div>
<div class="ad-col"><span class="ck-t">Admin principale</span><div class="verre ad-act"><div class="r">{AV("SI","s",36)}<span class="x"><b>Sandrine Ilunga</b><br><small>Abonnement, factures, suppression</small></span></div></div>
<span class="ck-t">Zone sensible</span><div class="a2-dz"><div class="r"><div class="t"><b>Transférer le rôle d’admin principale</b><span>À un admin de l’équipe, avec sa confirmation</span></div><a class="bt sec s">Transférer</a></div>
<div class="r"><div class="t"><b>Fermer l’organisation</b><span>Offres retirées, export proposé, comptes RH gardés</span></div><a class="bt sec s d">Fermer</a></div></div></div></div>''')
W_REGA = A(reglages_a(), '', '/parametres')
DLG_TR = f'''<h3>Transférer le rôle d’admin principale</h3><span style="font-size:13px;color:var(--texte2);margin-top:-8px">Une seule admin principale par organisation.</span>
<div class="ad-opt"><div class="o on">{AV("JM","b",36)}<div class="t"><b>Jonathan Mukendi</b><span>Admin · Commercial</span></div><span class="rd"></span></div><div class="o">{AV("AK","",36)}<div class="t"><b>Aïcha Kasongo</b><span>Admin · Tech et Data</span></div><span class="rd"></span></div></div>
<span class="ck-t">Après le transfert</span><div class="ad-chk"><div class="r">{OK_}<span>Jonathan gère l’abonnement et les factures</span></div><div class="r">{OK_}<span>Vous restez admin, avec vos offres en Recrutement</span></div><div class="r"><i class="a">!</i><span>Jonathan doit accepter : rien ne change avant</span></div></div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Envoyer la demande</a></div>'''
W_TR = A(reglages_a(), '', '/parametres', over=dlg(DLG_TR, 540))

# ---------- Nouvelle barre latérale : Viviers, Modèles, Page de l'organisation ----------

# ---------- Chemins ----------
def chemins_w():
    def c(t, et):
        p = f' {ic("suivant","xs")} '.join(f'<span class="{"f" if i == len(et) - 1 else ""}">{e}</span>' for i, e in enumerate(et))
        return f'<div class="c"><b>{t}</b><div class="p">{p}</div></div>'
    return '<div class="ch0">' + ''.join(c(t, e) for t, e in [
        ('Créer l’organisation', ['Compte RH', 'Créer une organisation', 'Formule, organisation, domaine, équipe']), ('Modifier la page', ['Nom de l’organisation', 'Page de l’organisation', 'Modifier']),
        ('Payer ou prolonger', ['Crédits et quotas', 'Abonnement', 'Prolonger']), ('Changer de formule', ['Abonnement', 'Changer de formule']),
        ('Télécharger une facture', ['Abonnement', 'Factures', 'PDF']), ('Rapport consolidé', ['Rapports', 'Par pôle ou par recruteur', 'Exporter en PDF']),
        ('Partager un vivier', ['Viviers', 'Ouvrir', 'Qui le voit']), ('Créer une grille commune', ['Modèles communs', 'Grilles d’évaluation', 'Nouveau']),
        ('Voir qui a fait quoi', ['Sécurité', 'Journal d’activité']), ('Voir les consultations', ['Sécurité', 'Consultations de profils']),
        ('Imposer la double vérification', ['Sécurité', 'Connexion et accès']), ('Demander à Orbi', ['Orbi dans la barre de gauche', 'Écrire à Orbi']),
        ('Transférer l’admin principale', ['Paramètres', 'Zone sensible', 'Transférer'])]) + '</div>'

def W(e, t, n=''): return wrow(wfig(e, '<span class="wtag">Ordinateur</span>' + t, n))
def T(e, t, n=''): return wrow(wfig(e, '<span class="wtag t">Tablette</span>' + t, n))
ECR = [
 ('w0', '0 · Comment on y arrive', 'Le lot 2 complète l’administration : ce qui concerne l’organisation entière, son image, son abonnement, ses règles communes et sa sécurité.', [chemins_w()]),
 ('w1', '1 · Créer l’organisation', 'Depuis son compte RH, l’admin crée l’organisation en quatre étapes plein écran. Il en devient l’admin principale.',
  [W(W_C1, 'Formule', 'Company, Company Plus, ou devis pour Premium.'), W(W_C2, 'Organisation', 'Nom, secteur, sites, aperçu.'), W(W_C3, 'Domaine e-mail', 'Pour les demandes de rejoindre.'), W(W_C4, 'Équipe', 'Inviter maintenant ou plus tard.')]),
 ('w2', '2 · Page de l’organisation', 'Ce que voient les talents sur chaque offre. La vérification donne le badge.', [W(W_ORGA, 'Page de l’organisation', 'Bannière, présentation, avantages, photos.'), W(W_VERA, 'Vérification', 'Domaine, document, examen.')]),
 ('w3', '3 · Abonnement et factures', 'Prépayé, en Mobile Money ou par carte, au nom de l’organisation. Réservé à l’admin principale.',
  [W(W_ABO, 'Abonnement', 'Jours restants, quotas, factures.'), W(W_FORMA, 'Changer de formule', 'Ce qui change est dit avant.'), W(W_PAYA, 'Paiement', 'Mobile Money ou carte.')]),
 ('w4', '4 · Rapports consolidés', 'Toute l’organisation, par pôle, par recruteur ou par offre. Export en PDF.', [W(W_RAPA, 'Rapports consolidés', 'Chiffres et lecture d’Orbi, sans donnée personnelle.')]),
 ('w5', '5 · Viviers partagés', 'Des listes de talents communes aux pôles, avec des droits clairs.', [W(W_VIV, 'Viviers', 'Par pôle ou pour toute l’organisation.'), W(W_VIVP, 'Qui voit le vivier', 'Organisation, pôle ou personnes.')]),
 ('w6', '6 · Modèles communs', 'Grilles d’évaluation, étapes par défaut et modèles de messages : toute l’équipe recrute de la même façon.',
  [W(W_MGRI, 'Grilles d’évaluation', 'Critères pondérés, jamais personnels.'), W(W_MSTG, 'Étapes du recrutement', 'Sur mesure en Company Premium.'), W(W_MMSG, 'Modèles de messages', 'Signature commune, sans téléphone.')]),
 ('w7', '7 · Sécurité', 'Qui a fait quoi, qui a consulté quel profil, et comment on se connecte.',
  [W(W_SJ, 'Journal d’activité', 'Rôles, équipe, crédits, exports.'), W(W_SC, 'Consultations de profils', 'Chacune avec son motif.'), W(W_SA, 'Connexion et accès', 'Double vérification, sessions, domaine.')]),
 ('w8', '8 · Orbi pour l’admin', 'Orbi aide à piloter : répartir les crédits, repérer les retards, préparer un point. Il propose, l’admin décide.', [W(W_ORBA, 'Orbi', 'Historique à gauche, conversation à droite.')]),
 ('w9', '9 · Paramètres de l’organisation', 'Notifications de l’admin, filiales, transfert du rôle d’admin principale.', [W(W_REGA, 'Paramètres', 'Notifications, filiales, zone sensible.'), W(W_TR, 'Transférer l’admin principale', 'L’autre admin doit accepter.')]),
 ('w10', '10 · Mode sombre', 'Les mêmes écrans sur fond Nuit.', [W(wsombre(W_ABO), 'Abonnement'), W(wsombre(W_RAPA), 'Rapports consolidés'), W(wsombre(W_SJ), 'Journal d’activité'), W(wsombre(W_ORBA), 'Orbi')]),
]
_st = lambda x: x.replace("<style>", "").replace("</style>", "")
page_w('admin-2', 'Jumanly for Companies · administration, ordinateur et tablette', 'Administrateur entreprise, lot 2 : l’organisation',
       '19 octobre 2026. La suite de l’espace admin : créer l’organisation, sa page et sa vérification, l’abonnement et les factures, les rapports consolidés, les viviers partagés, les modèles communs, la sécurité, Orbi pour l’admin et les paramètres. Web uniquement. Organisation et personnes fictives.', ECR,
       CSS + CSS1 + CSS2 + CSS3L + CSS4 + CSSR + _st(CSS_AB) + _st(CSS_RP) + CSSWR1 + CSSW2 + CSSW4 + CSSWR3 + CSSWR4 + CSSA1 + CSSA2)
