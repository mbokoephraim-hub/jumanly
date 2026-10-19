# Version ordinateur et tablette · recruteur, lot 4 : ATS avec Orbi, réponses groupées, messagerie, propositions, rejoindre une organisation, fin d'offre, rapport PDF (19/10/2026).
# python3 webr4.py && node shotw.js recruteur-4   (calendrier réel : 22 oct. = jeudi, 28 oct. = mercredi)
import os
H = os.path.dirname(os.path.abspath(__file__))
_m4 = open(H + '/recruteur4.py').read(); exec(_m4[:_m4.index('\n# ---------- Chemins')])     # écrans, CSS et modèles d'e-mail du lot 4 mobile
_K4 = (CSS2, CSS3L, CSS4, CSSR)
MAILS_M = MAILS if 'MAILS' in dir() else None
_w3 = open(H + '/webr3.py').read(); exec(_w3[:_w3.index('\n# ---------- Chemins')])        # cadres web, CSS et écrans du lot 3 web (messagerie, rapports, paramètres)
CSS2, CSS3L, CSS4, CSSR = _K4

CSSWR4 = '''
.a2-c .md{display:grid;grid-template-columns:none;place-items:center}
.pq-o .h .ring{display:grid;place-items:center;width:48px;height:48px}.pq-o .h .ring b{display:grid!important;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--plein);font-size:11px!important;white-space:nowrap;line-height:1}
.ofh{display:flex;align-items:center;gap:14px}.ofh .cases{width:52px;height:52px;border-radius:17px;display:grid;place-items:center;background:var(--g-former);color:#0F3F37;flex:none}
.ofh .t{flex:1}.ofh h1{font-size:30px}.ofh p{font-size:13.5px;color:var(--texte2)}
.ofh .bts{display:flex;gap:10px}.ofh .bts .bt{flex:none}
.w-c .sub-t{max-width:720px}
.ats-w{display:grid;grid-template-columns:380px minmax(0,1fr);gap:22px;align-items:start}
.a2-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start}.a2-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.w-c .sec-t{display:flex;justify-content:space-between;align-items:baseline}.w-c .sec-t h2{font-size:17px;font-weight:600}.w-c .sec-t a{font-size:13px;font-weight:600;color:var(--texte2)}
.w-c .a2-hero{padding:22px}.w-c .a2-hero .r .t b{font-size:19px}
.reco-w{display:grid;grid-template-columns:360px minmax(0,1fr);gap:26px;align-items:end;padding:22px!important}
.reco-w .tx{display:flex;flex-direction:column;gap:12px;align-self:center}.reco-w .tx p{font-size:14px}
.w-c .a2-pod .p.c1 .av{width:70px;height:70px;font-size:18px}.w-c .a2-pod .c1 .st{height:100px}.w-c .a2-pod .c2 .st{height:76px}.w-c .a2-pod .c3 .st{height:60px}
.w-c .a2-tabs{max-width:520px}
.web .a2-sb{left:auto;right:36px;bottom:28px;width:640px;flex-direction:row;align-items:center;padding:12px 12px 12px 16px}
.web .a2-sb .h{flex:1}.web .a2-sb .acts{display:flex;gap:8px}.web .a2-sb .acts a{padding:0 18px}
.a2-c.mini .a2-sc .rg{width:50px;height:50px}.a2-c.mini .a2-sc .rg b{width:40px;height:40px}
.ret-w .ret-l .r{padding:14px 18px;gap:14px}.ret-w .ret-l .av{width:44px;height:44px}.ret-w .ret-l .sc{font-weight:800;font-size:13px;padding:5px 10px;border-radius:99px;background:var(--lime-c);color:#0F3F37}
.w-c .cmp-c .r{grid-template-columns:150px minmax(0,1fr) 30px;padding:12px 18px;font-size:13px}
.w-c .qx{font-size:13.5px;padding:16px 18px;gap:12px}
.w-c .mini-c{display:flex;align-items:center;gap:14px;padding:18px 20px}.w-c .mini-c .av{width:56px;height:56px;font-size:16px;box-shadow:none;color:#0F3F37}.w-c .mini-c .t{flex:1}.w-c .mini-c .t b{display:block;font-size:19px}.w-c .mini-c .t span{font-size:13px;color:var(--texte2)}
.w-c .env-t{max-height:none;font-size:13.5px;padding:16px 18px}.w-c .env-t:after{display:none}
.w-c .ch2 a{padding:16px;font-size:12.5px}.w-c .ch2 a b{font-size:14.5px}.w-c .ch2 a .cases{width:38px;height:38px;display:grid;place-items:center}
.dlg .ch2 a .cases,.op .ch2 a .cases,.pop .ch2 a .cases{display:grid;place-items:center}
.w-c .long-m{padding:22px;font-size:14px}
.rcp{display:flex;flex-wrap:wrap;gap:8px}.rcp span{display:inline-flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;border-radius:99px;background:var(--plein);box-shadow:var(--verre);font-size:12.5px;font-weight:600}
.rcp span .av{width:28px;height:28px;font-size:9.5px;box-shadow:none;color:#0F3F37}.rcp span.on{box-shadow:0 0 0 2px #0F3F37}.sombre .rcp span.on{box-shadow:0 0 0 2px #A6F26B}
.mw{zoom:.74}.mw .mail{box-shadow:0 18px 40px -24px rgba(15,63,55,.35)!important}
.ap2{display:grid;grid-template-columns:minmax(0,1fr) 450px;gap:24px;align-items:start}
.pop.dd{width:360px}.pop.dd::before{display:none}.pop .e-menu a{padding:12px 6px}
.pop.plus{right:auto;left:640px;top:auto;bottom:118px;width:440px}.pop.plus::before{display:none}
.ctc-g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.ctc-g .c{display:flex;flex-direction:column;gap:12px;padding:18px;border-radius:24px;background:var(--plein);box-shadow:var(--verre)}
.ctc-g .c .h{display:flex;gap:12px;align-items:center}.ctc-g .c .av{width:50px;height:50px;font-size:14px;box-shadow:none;color:#0F3F37}
.ctc-g .c .t{flex:1;min-width:0}.ctc-g .c .t b{display:block;font-size:15px}.ctc-g .c .t span{font-size:12px;color:var(--texte2)}
.ctc-g .c .o{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--texte2);padding:10px 12px;border-radius:14px;background:var(--zone)}
.ctc-g .c .bt{width:100%}
.w-c .quota-g{padding:16px 18px}
.dn{position:absolute;right:28px;top:60px;width:400px;z-index:9;display:flex;flex-direction:column;gap:10px}
.dn .lk-n{background:rgba(15,63,55,.97);box-shadow:0 30px 60px -24px rgba(0,0,0,.55);padding:14px 16px;border-radius:20px}
.dn .lk-n{flex:none;position:relative;margin:0!important;transform:none!important;opacity:1!important;top:auto;left:auto}
.w-c .f-card{padding:20px}
.w-c .rap-l .r{padding:14px 18px}
.org2{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:24px;width:100%;max-width:960px;margin:0 auto;align-items:start}
.org2 .org-f .ban{display:block;height:90px;overflow:hidden}.org2 .org-f .ban svg{display:block}.org2 .org-f .c{padding:0 18px 18px;margin-top:-28px}.org2 .org-f .lg-e{width:62px;height:62px;font-size:17px}
.org2 .org-f b.n{font-size:19px}
.w-c .req{padding:22px}.w-c .req p{font-size:14px}
.w-c .pq-o{padding:18px}
'''

FIX = [('Mardi 22 octobre', 'Jeudi 22 octobre'), ('mardi 22 octobre', 'jeudi 22 octobre'), ('Mardi 22 oct.', 'Jeudi 22 oct.'), ('mardi 22', 'jeudi 22'), ('Mardi 22', 'Jeudi 22'), ('Mar. 22', 'Jeu. 22'),
       ('Mardi 28 octobre', 'Mercredi 28 octobre'), ('mardi 28 octobre', 'mercredi 28 octobre'), ('mardi 19 octobre', 'lundi 19 octobre'), ('Mardi 19 octobre', 'Lundi 19 octobre'),
       ('Indisponible mardi (examen), demande jeudi.', 'Indisponible jeudi (examen), demande lundi.'), ('Vous avez proposé jeudi 24 à 11:00', 'Vous avez proposé lundi 26 à 11:00'), ('jeudi 24', 'lundi 26')]
def fx(h):
    for a, b in FIX: h = h.replace(a, b)
    return h
UO = '/hire/offres/analyste-donnees-junior'
NEW_B = f'<a class="bt a m">{ic("plus","s")}Publier une offre</a>'

# ---------- 0 bis. Accès à l'ATS ----------
def e_offw(titre, meta, cand, nv, vues, oc, bg, icn='offre'):
    return e_off(titre, meta, '', cand, nv, vues, oc=oc, icn=icn, bg=bg).replace('</span></div></div><div class="kp">', f'</span></div>{bi("plus-options")}</div><div class="kp">', 1)
OFFS = (e_offw("Analyste de données junior", "Kinshasa · CDI · jusqu’au 31 oct.", 24, 9, "1 240", '#A6F26B', 'var(--g-former)')
        + e_offw("Chargé de clientèle", "Kinshasa · CDI · jusqu’au 8 nov.", 11, 3, "610", '#2FD3A6', 'var(--g-accomp)')
        + e_offw("Comptable confirmé", "Lubumbashi · CDD · jusqu’au 15 nov.", 7, 0, "380", '#F2B33D', 'var(--g-oppo)'))
def offres4():
    return (wh('Offres', '4 actives · 1 brouillon · 1 en pause', NEW_B)
            + '<div class="filtres-h"><span class="puce on">Actives<small>4</small></span><span class="puce">Brouillons<small>1</small></span><span class="puce">En pause<small>1</small></span><span class="puce">Clôturées</span></div>'
            + f'<div class="a2-g3">{OFFS}</div>'
            + f'<div class="orbi-l">{orbi(26)}<div class="t"><b>Analyser (ATS)</b> : Orbi lit tous les CV d’une offre et les classe, avec le pourquoi. Rien ne se lance sans votre geste.</div></div>')
W_EOFF = R(offres4(), 'offre', '/hire/offres')
def cand4():
    off = f'<div class="flt-b"><div class="verre off-sel" style="flex:0 0 360px">{ic("offre","s")}<div class="t"><small>Offre</small><b>Analyste de données junior</b></div>{ic("suivant","s")}</div><div class="filtres-h"><span class="puce on">Toutes<small>24</small></span><span class="puce">Reçues<small>9</small></span><span class="puce">En examen<small>7</small></span><span class="puce">Présélection<small>5</small></span></div></div>'
    h = e_ats("24 candidatures, 9 pas encore analysées", "Orbi les lit, les compare à l’offre et les classe, avec le pourquoi.", "Analyser et classer", ("24 crédits", "≈ 1 min", "Jamais de rejet"))
    l = (rc(1,"AM","","Amani M.","Reçue il y a 2 h",88,[],mini=True) + rc(2,"GM","b","Grâce M.","Entretien jeudi 22",86,[],mini=True)
         + rc(3,"FN","a","Fatou N.","Diplômée · Kinshasa",81,[],mini=True) + rc(4,"PK","b","Patrick K.","1 an · Lubumbashi",74,[],mini=True))
    return (wh('Candidats', '', '<div class="seg" style="width:380px"><span class="on">Candidatures</span><span>Rechercher des talents</span></div>') + off
            + f'<div class="ats-w"><div class="col">{h}<div class="gar">{ic("confidentialite","s")}Nom, âge, genre et photo ne comptent jamais dans le classement.</div></div><div class="col"><div class="sec-t"><h2>Dernière analyse : hier</h2><a>Voir le classement</a></div><div class="a2-g">{l}</div></div></div>')
W_ECAND = R(cand4(), 'candidats', '/hire/candidats')
def at4():
    h = e_ats("9 nouvelles candidatures à classer", "Pour « Analyste de données junior ». Je peux les analyser avec les 15 autres.", "Lancer l’analyse")
    return (wh('Bonjour Nadia', 'Lundi 19 octobre', NEW_B) + f'''<div class="g2"><div class="col">{h}<div class="sec-t"><h2>Analyses terminées</h2><a>Tout voir</a></div>
<div class="verre liste lignes">{nt("c2","candidats","Chargé de clientèle · 11 CV","3 recommandés · hier 18:10","Voir")}{nt("c1","offre","Comptable confirmé · 7 CV","2 recommandés · ven.","Voir")}</div></div>
<div class="col"><div class="sec-t"><h2>Aussi aujourd’hui</h2><a>Agenda</a></div><div class="verre liste lignes">{nt("c3","entretien","Entretien avec Grâce M.","Jeudi 22 · 10:00 · visio","Voir")}{nt("c2","message","3 messages non lus","Patrick K., Ruth B., Fatou N.","Lire")}{nt("c1","offre","Fin d’offre dans 12 jours","Analyste de données junior","31 oct.")}</div></div></div>''')
W_EAT = R(at4(), 'aujourdhui', '/hire')
EMENU = f'''<div class="pop dd" style="left:250px;top:340px"><div class="hd"><b>Analyste de données junior</b></div><div class="e-menu">
<a class="on"><span class="cases" style="background:#0F3F37;color:#A6F26B;display:grid;place-items:center">{orbi(22)}</span><span class="t">Analyser les candidatures<small>ATS · classement et recommandation d’Orbi</small></span><span class="new">24 CV</span></a>
<a><span class="cases" style="background:var(--g-accomp);display:grid;place-items:center">{ic("candidats","s")}</span><span class="t">Voir les candidatures<small>Par étape</small></span></a>
<a><span class="cases" style="background:var(--g-former);display:grid;place-items:center">{ic("valider","s")}</span><span class="t">Liste des retenus<small>5 personnes</small></span></a>
<a><span class="cases" style="background:var(--g-oppo);display:grid;place-items:center">{ic("modifier","s")}</span><span class="t">Modifier l’offre</span></a>
<a><span class="cases" style="background:var(--g-accomp);display:grid;place-items:center">{ic("partager","s")}</span><span class="t">Partager le lien</span></a></div></div>'''
W_EMENU = R(offres4(), 'offre', '/hire/offres', over='<div class="w-voile cl"></div>' + EMENU)

# ---------- 1. ATS ----------
def ofh(onglet, droite=''):
    tabs = ''.join(f'<a class="{"on" if t == onglet else ""}">{t}{f"<small>{n}</small>" if n else ""}</a>' for t, n in [('Candidatures', '24'), ('Analyse (ATS)', ''), ('Retenus', '5'), ('Statistiques', '')])
    return (f'<div class="ofh"><span class="cases">{ic("offre","s")}</span><div class="t"><h1>Analyste de données junior</h1><p>Kinshasa · CDI · hybride · jusqu’au 31 octobre</p></div><div class="bts">{droite}{bi("plus-options")}</div></div>'
            f'<div class="sub-t">{tabs}</div>')
DIST = '''<div class="a2-dist"><div class="h"><b>Où en sont les 24 candidatures</b><span>aujourd’hui</span></div>
<div class="bar"><i style="flex:9;background:#A6F26B"></i><i style="flex:7;background:#2FD3A6"></i><i style="flex:5;background:#F2B33D"></i><i style="flex:3;background:#9CC3EE"></i></div>
<div class="lg"><span style="--c:#A6F26B">Reçues 9</span><span style="--c:#2FD3A6">Examen 7</span><span style="--c:#F2B33D">Présél. 5</span><span style="--c:#9CC3EE">Entretien 3</span></div></div>'''
HERO = f'''<div class="a2-hero">{_RINGS}<div class="r"><span class="a2-docs"><i></i><i></i><i></i><b>24</b></span><div class="t"><b>Analyser les 24 CV</b>Orbi compare chaque dossier à l’offre et prépare un classement expliqué.</div></div>
<div class="a2-kp"><div><b>24</b>crédits</div><div><b>99</b>disponibles</div><div><b>≈ 1 min</b>durée</div></div><a class="bt pl">{orbi(22)}Lancer l’analyse</a></div>'''
RC4 = (rc(1,"AM","","Amani M.","1 an · Kinshasa · reçue il y a 2 h",88,["SQL","Power BI"],[("Compétences",5,0),("Expérience",3,0),("Preuves",4,0)])
       + rc(2,"GM","b","Grâce M.","2 ans · Kinshasa",86,["SQL","Projet BI"],[("Compétences",4,0),("Expérience",4,0),("Preuves",4,0)],et=("Retenue","ret"))
       + rc(3,"FN","a","Fatou N.","Diplômée · Kinshasa",81,["Power BI","!SQL à vérifier"],[("Compétences",4,0),("Expérience",2,1),("Preuves",4,0)])
       + rc(4,"PK","b","Patrick K.","1 an · Lubumbashi",74,["Excel","!Mobilité"],[("Compétences",3,0),("Expérience",3,0),("Preuves",2,1)]))
def ats1(t=False):
    d = f'<div class="col">{HERO}{DIST}<div class="gar">{ic("confidentialite","s")}Chaque dossier est lu comme une donnée. Nom, âge, genre et photo ne comptent jamais.</div></div>'
    l = f'<div class="col"><div class="sec-t"><h2>Classées par score</h2><a>Trier</a></div><div class="a2-g"{" style=grid-template-columns:1fr" if t else ""}>{RC4}</div></div>'
    return ofh('Analyse (ATS)') + (d + l if t else f'<div class="ats-w">{d}{l}</div>')
W_ATS1 = R(ats1(), 'offre', UO + '/analyse')
T_ATS1 = RT(ats1(True), 'offre')
def ats2():
    p = '''<div class="a2-prog"><span class="big"><b>17<small>sur 24 CV</small></b></span><h3>Orbi analyse les dossiers</h3><p>Environ 20 secondes. Vous pouvez quitter la page,<br>une notification arrive à la fin.</p>
<div class="a2-step"><div class="ok"><i></i>Lecture</div><div class="ok"><i></i>Compétences</div><div class="en"><i></i>Preuves</div><div><i></i>Classement</div></div></div>'''
    rows = [("AM","","Amani M.","CV, lettre, 2 réponses","88"),("GM","b","Grâce M.","CV, projet Power BI","86"),("FN","a","Fatou N.","CV, attestation","81"),("RB","","Ruth B.","CV, attestation SQL","80"),("DK","b","David K.","CV, 2 réponses","79")]
    fl = ''.join(f'<div class="r"><span class="av {c}">{i}</span><div class="t"><b>{n}</b><span>{s_}</span></div><span class="pill">{v}</span></div>' for i, c, n, s_, v in rows)
    fl += '<div class="r en"><span class="av a">AN</span><div class="t"><b>Ange M.</b><span>Vérification des preuves…</span><div class="mb"><i style="width:62%"></i></div></div><span class="pill w">…</span></div>'
    fl += f'<div class="r" style="opacity:.6"><span class="av">PL</span><div class="t"><b>Prisca L.</b><span>En attente</span></div><span class="pill w">{ic("horloge","xs")}</span></div>'
    return ofh('Analyse (ATS)', '<a class="bt sec m">Arrêter l’analyse</a>') + f'<div class="ats-w"><div class="col">{p}<div class="orbi-l">{orbi(26)}<div class="t">Chaque dossier est lu comme une donnée. Nom, âge, genre et photo ne comptent jamais.</div></div></div><div class="col"><div class="sec-t"><h2>Dossier par dossier</h2><a>17 / 24</a></div><div class="a2-fl">{fl}</div></div></div>'
W_ATS2 = R(ats2(), 'offre', UO + '/analyse')
RECO = f'''<div class="a2-reco reco-w"><div class="a2-pod">
<div class="p c2"><span class="av b">GM</span><b>Grâce M.</b><small>2 ans</small><span class="st">2<small>86</small></span></div>
<div class="p c1">{_CROWN}<span class="av">AM</span><b>Amani M.</b><small>1 an</small><span class="st">1<small>88</small></span></div>
<div class="p c3"><span class="av a">FN</span><b>Fatou N.</b><small>Diplômée</small><span class="st">3<small>81</small></span></div></div>
<div class="tx"><div class="h">{orbi(36)}<div class="t"><b>Recommandation d’Orbi</b><span>24 CV analysés · 24 crédits utilisés</span></div></div>
<p><b>5 dossiers à voir en priorité.</b> Ils ont SQL et Power BI, avec une preuve. Fatou et David : un point à vérifier en entretien.</p>
<div class="acts"><a class="bt p m">Voir les 5</a><a class="bt sec m">{ic("pourquoi","xs")}Pourquoi ?</a><span style="font-size:12px;color:var(--texte2);align-self:center">Orbi recommande, vous décidez. Personne n’est rejeté.</span></div></div></div>'''
def ats3(t=False):
    r = (rc(4,"RB","","Ruth B.","Analyste BI · Kinshasa",80,["SQL","Attestation"],[("Compétences",4,0),("Expérience",3,0),("Preuves",5,0)])
         + rc(5,"DK","b","David K.","Data analyst · Kinshasa",79,["SQL","!Disponibilité"],[("Compétences",4,0),("Expérience",4,0),("Preuves",3,1)]))
    if not t: r += rc(6,"PK","b","Patrick K.","1 an · Lubumbashi",74,["Excel","!Mobilité"],[("Compétences",3,0),("Expérience",3,0),("Preuves",2,1)])
    rec = RECO.replace(' reco-w', '') .replace('<div class="tx">', '<div class="tx" style="padding-top:8px">') if t else RECO
    return (ofh('Analyse (ATS)', f'<a class="bt sec m">Sélectionner</a><a class="bt p m">{ic("valider","s")}Liste des retenus</a>' if not t else '') + rec
            + '<div class="a2-tabs"><a class="on">Recommandés<small>5</small></a><a>À vérifier<small>7</small></a><a>Tous<small>24</small></a></div>'
            + f'<div class="{"a2-g" if t else "a2-g3"}">{r}</div>')
W_ATS3 = R(ats3(), 'offre', UO + '/analyse/recommandation')
T_ATS3 = RT(ats3(True), 'offre')
def ats4():
    g = f'''<div class="col"><div class="verre mini-c"><span class="av">AM</span><div class="t"><b>Amani M.</b><span>Reçue il y a 2 h · Kinshasa · rang 1 sur 24</span></div>{ring(88)}</div>
<div class="pq-o"><div class="h">{orbi(30)}<div class="t"><b>Synthèse d’Orbi</b><span>Profil lu au regard de l’offre</span></div></div>
<div class="pt"><i class="v">✓</i><span>Les 3 compétences requises, dont 2 prouvées par un projet.</span></div>
<div class="pt"><i class="v">✓</i><span>Disponible maintenant, à Kinshasa, CDI accepté.</span></div>
<div class="pt"><i class="a">!</i><span>Python souhaité : non mentionné.</span></div></div>
<div class="verre cmp-c"><div class="r h"><span>Critère de l’offre</span><span>Ce que montre le dossier</span><span></span></div>
<div class="r"><b>SQL</b><span>Projet « Ventes 2025 », CV p. 1</span><span class="s v">✓</span></div><div class="r"><b>Power BI</b><span>Tableau de bord, lien public</span><span class="s v">✓</span></div>
<div class="r"><b>Excel</b><span>Déclaré dans le CV</span><span class="s v">✓</span></div><div class="r"><b>Python</b><span>Non indiqué</span><span class="s a">!</span></div>
<div class="r"><b>Disponibilité</b><span>Immédiate</span><span class="s v">✓</span></div><div class="r"><b>Documents</b><span>CV, lettre</span><span class="s v">✓</span></div></div></div>'''
    d = f'''<div class="col"><div class="verre carte" style="padding:18px;display:flex;flex-direction:column;gap:10px"><a class="bt a m" style="width:100%">{ic("valider","s")}Ajouter aux retenus</a><a class="bt sec m" style="width:100%">{ic("candidats","s")}Ouvrir le dossier complet</a><a class="bt sec m" style="width:100%">{ic("message","s")}Écrire à Amani</a></div>
<span class="ck-t">Questions proposées pour l’entretien</span><div class="verre qx"><div><i>1</i>Comment avez-vous fiabilisé les données du projet Ventes ?</div><div><i>2</i>Avez-vous déjà écrit un script, en Python ou autre ?</div></div>
<div class="gar">{ic("confidentialite","s")}Non pris en compte : nom, âge, genre, photo, nationalité, adresse précise.</div></div>'''
    return ofh('Analyse (ATS)') + f'<div class="g2">{g}{d}</div>'
W_ATS4 = R(ats4(), 'offre', UO + '/analyse/amani-m')
def sel4():
    c = (rc(1,"AM","","Amani M.","1 an · Kinshasa",88,[],sel=True,mini=True) + rc(2,"GM","b","Grâce M.","2 ans · Kinshasa",86,[],sel=True,mini=True) + rc(3,"FN","a","Fatou N.","Diplômée · Kinshasa",81,[],sel=True,mini=True)
         + rc(4,"RB","","Ruth B.","Analyste BI · Kinshasa",80,[],sel=True,mini=True) + rc(5,"DK","b","David K.","Data analyst · Kinshasa",79,[],sel=True,mini=True) + rc(6,"PK","b","Patrick K.","1 an · Lubumbashi",74,[],sel=False,mini=True))
    return (ofh('Analyse (ATS)') + '<div class="a2-tabs"><a class="on">Recommandés<small>5</small></a><a>À vérifier<small>7</small></a><a>Tous<small>24</small></a></div>'
            + f'<div class="a2-selh"><span class="ck">{CK}</span><div class="t"><b>5 sur 5 sélectionnés</b>Recommandés par Orbi</div><a>Tout retirer</a></div><div class="a2-g3">{c}</div><div style="height:90px"></div>')
SB = f'''<div class="a2-sb"><div class="h"><span class="avs"><span class="av">AM</span><span class="av b">GM</span><span class="av a">FN</span><span class="av">RB</span><span class="av b">DK</span></span><div class="t"><b>5 sélectionnés</b>sur 24 candidatures</div><span class="x">{ic("fermer","xs")}</span></div>
<div class="acts"><a>{ic("message","s")}Écrire</a><a>{ic("agenda","s")}Entretien</a><a class="p">{ic("valider","s")}Retenir</a></div></div>'''
W_SEL = R(sel4(), 'offre', UO + '/analyse', over=SB)
def ret4():
    rows = [("AM","","Amani M.","88","ajoutée par vous"),("GM","b","Grâce M.","86","entretien jeudi 22 à 10:00"),("FN","a","Fatou N.","81","SQL à vérifier"),("RB","","Ruth B.","80","ajoutée par Olivier"),("DK","b","David K.","79","disponibilité à vérifier")]
    l = ''.join(f'<div class="r"><span class="poig"><i></i><i></i><i></i></span><span class="av {c}">{i}</span><div class="t"><b>{n}</b><span>{s_}</span></div><span class="sc">{v}</span><span class="etq-s ret">{"Retenu" if n.startswith("David") else "Retenue"}</span></div>' for i, c, n, v, s_ in rows)
    return (ofh('Retenus', f'<a class="bt sec m">{ic("agenda","s")}Créneaux</a><a class="bt p m">{ic("message","s")}Informer les 5</a>')
            + f'''<div class="g2 ret-w"><div class="col"><div class="sec-t"><h2>Liste des retenus · étape Entretien</h2><a>Réordonner</a></div><div class="verre ret-l">{l}</div></div>
<div class="col"><div class="orbi-l">{orbi(26)}<div class="t">19 autres candidatures restent ouvertes. Leur envoyer une réponse ?</div><a class="bt sec s">Préparer</a></div>
<div class="verre carte" style="padding:16px 18px;display:flex;flex-direction:column;gap:6px"><b style="font-size:14px">Ensuite</b><span style="font-size:12.5px;color:var(--texte2)">Proposer des créneaux aux 5, puis évaluer chaque entretien avec la grille de l’offre.</span></div>
<div class="gar">{ic("valider","s")}Retenir n’envoie rien : vous informez les personnes quand vous êtes prêt.</div></div></div>''')
W_RET = R(ret4(), 'offre', UO + '/retenus')

# ---------- 1 bis. Quand analyser ----------
DLG_Q = f'''<h3>Quand analyser les candidatures ?</h3><div class="q-op">
<a class="on"><span class="cases" style="background:var(--g-former);display:grid;place-items:center">{orbi(22)}</span><span class="t"><b>Maintenant</b><span>Les 24 candidatures reçues à ce jour. Les suivantes pourront être analysées plus tard.</span><em>24 crédits</em></span><span class="rd"></span></a>
<a><span class="cases" style="background:var(--g-oppo);display:grid;place-items:center">{ic("agenda","s")}</span><span class="t"><b>À la fin de l’offre</b><span>Une seule fois, le 31 octobre, sur toutes les candidatures. Vous êtes prévenu dès que c’est prêt.</span><em>1 crédit par CV, au lancement</em></span><span class="rd"></span></a></div>
<div class="q-sw"><div class="t"><b>Ajouter les nouvelles au classement</b>Chaque CV reçu après l’analyse est lu à son arrivée.</div><span class="sw"></span></div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">{orbi(20)}Lancer l’analyse</a></div>'''
W_QUAND = R(ats1(), 'offre', UO + '/analyse', over=fenetre(DLG_Q).replace('class="dlg"', 'class="dlg" style="width:580px"'))
def prog4():
    p = f'''<div class="prg"><div class="h"><span class="cal"><i>OCT.</i><b>31</b></span><div class="t"><b>Analyse programmée</b><span>À la clôture de l’offre, sur toutes les candidatures</span></div></div>
<div class="tl2"><div class="ok">Publiée 2 oct.</div><div class="ok">Aujourd’hui</div><div>Rappel 28 oct.</div><div>Analyse 31 oct.</div></div>
<div class="f-kp"><div><b>24</b>reçues</div><div><b>≈ 35</b>attendues</div><div><b>99</b>crédits dispo.</div></div>
<div class="rw"><a class="bt sec s" style="flex:1">Modifier</a><a class="bt sec s" style="flex:1">Annuler</a><a class="bt p s" style="flex:1.3">Lancer maintenant</a></div></div>'''
    l = rc(1,"AM","","Amani M.","Reçue il y a 2 h",88,[],mini=True) + rc(2,"GM","b","Grâce M.","Reçue le 14 oct.",86,[],mini=True) + rc(3,"FN","a","Fatou N.","Reçue le 12 oct.",81,[],mini=True) + rc(4,"PK","b","Patrick K.","Reçue le 9 oct.",74,[],mini=True)
    return ofh('Analyse (ATS)') + f'<div class="ats-w"><div class="col">{p}<div class="orbi-l">{orbi(26)}<div class="t">Les crédits ne sont utilisés qu’au lancement. S’il en manque le 31, je vous préviens avant.</div></div></div><div class="col"><div class="sec-t"><h2>Candidatures reçues · score de la dernière analyse</h2><a>Voir les 24</a></div><div class="a2-g">{l}</div></div></div>'
W_PROG = R(prog4(), 'offre', UO + '/analyse')

# ---------- 2. Répondre à tous ----------
def env4(t=False):
    g = f'''<div class="col"><div class="ch2"><a class="on"><span class="cases" style="background:var(--g-accent)">{ic("valider","s")}</span><b>Retenus · 5</b>Invitation à l’entretien</a><a><span class="cases" style="background:var(--zone)">{ic("message","s")}</span><b>Non retenus · 19</b>Réponse respectueuse</a></div>
<span class="ck-t">Envoyer par</span><div class="puces"><span class="puce on">{OK()}Message Jumanly</span><span class="puce on">{OK()}E-mail</span></div>
<span class="ck-t">Modèle « Candidature retenue »</span><div class="verre env-t"><b>Objet : Vous êtes invité·e à un entretien</b><span>Bonjour <mark>{{prénom}}</mark>, merci pour votre candidature au poste d’Analyste de données junior. Nous avons lu votre dossier avec attention, et <mark>{{point fort relevé par Orbi}}</mark> a particulièrement retenu notre attention. Nous avons le plaisir de vous inviter à un entretien de 45 minutes, en visio. Choisissez le créneau qui vous convient.</span></div>
<div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> personnalise une phrase par personne, à partir de son dossier. Vous voyez chaque message avant l’envoi.</div></div></div>'''
    a = f'''<div class="col"><div class="sec-t"><h2>Aperçu · 2 sur 5</h2><a>Suivant</a></div><div class="rcp"><span><span class="av">AM</span>Amani</span><span class="on"><span class="av b">GM</span>Grâce</span><span><span class="av a">FN</span>Fatou</span><span><span class="av">RB</span>Ruth</span><span><span class="av b">DK</span>David</span></div>
<div class="long-m"><div class="h"><span class="lg-e sap">BF</span><div class="t"><b>Baobab Fintech</b>Nadia K. · Analyste de données junior</div><span class="etq-s ret">Retenue</span></div>
<p>Bonjour Grâce,</p><p>Merci pour votre candidature. Nous avons lu votre dossier avec attention, et votre <mark style="background:#E4F8D2;border-radius:4px;padding:0 3px">projet Power BI pour trois agences</mark> a particulièrement retenu notre attention.</p><p>Nous avons le plaisir de vous inviter à un entretien de 45 minutes, en visio…</p></div>
<div class="relu"><span class="cb">{CK}</span>J’ai relu les 5 messages</div><div style="display:flex;gap:10px;justify-content:flex-end"><a class="bt sec m">Annuler</a><a class="bt p m">{ic("envoyer","s")}Envoyer à 5</a></div></div>'''
    return wh('Répondre aux candidats', 'Analyste de données junior · par message Jumanly et par e-mail') + (g + a if t else f'<div class="g2e">{g}{a}</div>')
W_ENV = R(env4(), 'offre', UO + '/reponses')
T_ENV = RT(env4(True), 'offre')
DLG_ENV = f'''<h3>Envoyer 19 réponses ?</h3><div class="verre liste lignes" style="box-shadow:none;background:var(--zone)"><div class="li"><span class="cases" style="background:var(--plein)">{ic("message","s")}</span><div class="t"><b>Non retenus · 19</b><span>Message Jumanly et e-mail</span></div></div>
<div class="li"><span class="cases" style="background:var(--g-accomp)">{ic("horloge","s")}</span><div class="t"><b>Annulation possible 10 minutes</b><span>Rien ne part avant</span></div></div></div>
<div class="relu"><span class="cb">{CK}</span>J’ai relu le modèle et la liste des 19 personnes</div><div class="bts"><a class="bt sec m">Revoir la liste</a><a class="bt p m pl">Envoyer</a></div>'''
W_ENVOK = R(env4().replace('<a class="on"><span class="cases" style="background:var(--g-accent)">', '<a><span class="cases" style="background:var(--g-accent)">', 1).replace('<a><span class="cases" style="background:var(--zone)">', '<a class="on"><span class="cases" style="background:var(--zone)">', 1),
            'offre', UO + '/reponses', over=fenetre(DLG_ENV).replace('class="dlg"', 'class="dlg" style="width:520px"'))
def apercu(nom, et, msg, mail):
    return (wh('Aperçu du message', f'Ce que {nom} reçoit, dans Jumanly et par e-mail')
            + f'<div class="ap2"><div class="col"><span class="ck-t">Dans Jumanly</span>{msg}</div><div class="col"><span class="ck-t">Par e-mail</span><div class="mw">{mail}</div></div></div>')
LONG_M = f'''<div class="long-m"><div class="h"><span class="lg-e sap">BF</span><div class="t"><b>Baobab Fintech</b>Nadia K. · Analyste de données junior</div><span class="etq-s ret">Retenue</span></div>
<p>Bonjour Grâce,</p><p>Merci pour votre candidature. Nous avons lu votre dossier avec attention, et votre <b>projet Power BI pour trois agences</b> a particulièrement retenu notre attention.</p>
<p>Nous avons le plaisir de vous inviter à un entretien de 45 minutes, en visio, avec Nadia et Olivier. Choisissez le créneau qui vous convient :</p>
<div class="invl"><span class="cases" style="width:34px;height:34px;border-radius:11px;background:var(--g-accomp);display:grid;place-items:center">{ic("agenda","s")}</span><div style="flex:1"><b style="display:block">Jeudi 22 octobre</b>10:00 ou 14:30 · heure de Kinshasa</div></div>
<p>Si aucun créneau ne convient, répondez ici : nous trouverons une autre date. À très bientôt !</p><div class="cta"><a class="bt p s">Choisir un créneau</a><a class="bt sec s">Répondre</a></div></div>'''
REFUS_M = '''<div class="long-m"><div class="h"><span class="lg-e sap">BF</span><div class="t"><b>Baobab Fintech</b>Nadia K. · Chargé de clientèle</div><span class="etq-s nr">Non retenu</span></div>
<p>Bonjour Joël,</p><p>Merci pour l’intérêt que vous portez à Baobab Fintech et pour le temps consacré à votre candidature.</p>
<p>Après avoir étudié l’ensemble des dossiers, notre équipe a retenu d’autres profils pour la suite de ce recrutement. Cette décision ne remet pas en cause la qualité de votre parcours.</p>
<p>Votre profil reste visible des recruteurs, et 12 offres de relation client sont ouvertes à Kinshasa.</p><p>Avec nos remerciements et tous nos vœux de réussite.</p><div class="cta"><a class="bt p s">Voir les offres proches</a></div></div>'''
W_MLONG = R(apercu('Grâce', 'ret', LONG_M, mail_retenu()), 'offre', UO + '/reponses/apercu')
W_MREF = R(apercu('Joël', 'nr', REFUS_M, mail_refus()), 'offre', '/hire/offres/charge-clientele/reponses/apercu')

# ---------- 4. Messagerie ----------
CMENU = f'''<div class="pop dd" style="left:690px;top:330px"><div class="hd"><b>Patrick K.</b></div><div class="liste lignes">
<div class="li"><span class="cases c2">{ic("candidats","s")}</span><div class="t"><b>Voir le dossier</b><span>Analyste de données junior</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c3">{ic("document","s")}</span><div class="t"><b>Modèles de messages</b><span>4 modèles</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("agenda","s")}</span><div class="t"><b>Proposer des créneaux</b></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("favori","s")}</span><div class="t"><b>Épingler la conversation</b></div></div>
<div class="li"><span class="cases">{ic("notification","s")}</span><div class="t"><b>Couper les notifications</b></div><span class="sw"></span></div>
<div class="li"><span class="cases">{ic("supprimer","s")}</span><div class="t"><b>Retirer de ma messagerie</b><span>Patrick garde ses messages</span></div></div>
<div class="li danger"><span class="cases">{ic("aide","s")}</span><div class="t"><b>Signaler</b></div></div></div></div>'''
W_CMENU = web(msgs_r(), 'message', 'rh', UM + '/patrick-k', over='<div class="w-voile cl"></div>' + CMENU)
CPLUS = f'''<div class="pop plus"><div class="hd"><b>Ajouter au message</b></div><div class="ch2"><a><span class="cases" style="background:var(--g-former)">{ic("document","s")}</span><b>Modèles</b>Insérés, puis relus</a><a><span class="cases" style="background:var(--g-accomp)">{ic("agenda","s")}</span><b>Créneaux</b>Depuis l’agenda</a><a><span class="cases" style="background:var(--g-oppo)">{ic("cv","s")}</span><b>Demander un document</b>Diplôme, attestation</a><a><span class="cases" style="background:var(--zone)">{ic("telecharger","s")}</span><b>Joindre un fichier</b>PDF, 5 Mo au plus</a></div>
<span class="ck-t">Modèles récents</span><div class="liste lignes"><div class="li"><span class="cases c1">{ic("agenda","s")}</span><div class="t"><b>Invitation à un entretien</b><span>Avec les créneaux de l’offre</span></div><a class="bt sec s">Insérer</a></div>
<div class="li"><span class="cases c3">{ic("valider","s")}</span><div class="t"><b>Confirmation de date</b><span>Rappel du lien et de l’heure</span></div><a class="bt sec s">Insérer</a></div></div></div>'''
W_CPLUS = web(msgs_r(), 'message', 'rh', UM + '/patrick-k', over=CPLUS)
CORBI = f'''<div class="pq-o"><div class="h"><div class="t"><b>Résumé de l’échange</b><span>8 messages depuis le 18 oct.</span></div></div>
<div class="pt"><i class="v">1</i><span>Invité jeudi 22 à 10:00 ou 14:30.</span></div><div class="pt"><i class="a">2</i><span>Indisponible jeudi (examen), demande lundi.</span></div><div class="pt"><i class="v">3</i><span>Vous avez proposé lundi 26 à 11:00. Réponse en cours.</span></div></div>
<div class="ch2"><a><span class="cases" style="background:var(--g-accent)">{ic("message","s")}</span><b>Proposer une réponse</b>Brouillon à relire</a><a><span class="cases" style="background:var(--g-accomp)">{ic("modifier","s")}</span><b>Changer le ton</b>Chaleureux, formel</a><a><span class="cases" style="background:var(--g-former)">{ic("document","s")}</span><b>Traduire</b>Anglais, swahili</a><a><span class="cases" style="background:var(--g-oppo)">{ic("horloge","s")}</span><b>Relance</b>Si pas de réponse en 2 j</a></div>
<div class="gar">{ic("orbi","s")}1 crédit par aide. Orbi n’envoie rien sans vous.</div>'''
W_CORBI = web(msgs_r(), 'message', 'rh', UM + '/patrick-k', over=panneau_orbi('Orbi dans cette conversation', 'Patrick K. · 99 crédits', CORBI))
DLG_CLEAN = f'''<h3 style="display:flex;align-items:center;gap:10px">{orbi(28)}Alléger la messagerie</h3><p style="margin:0;font-size:13px;color:var(--texte2)">Ces conversations de candidats non retenus sont terminées depuis plus de 30 jours.</p>
<div class="verre rks" style="box-shadow:none;background:var(--zone)">
<div class="rk"><span class="cb on">{CK}</span><span class="av">JT</span><div class="t"><b>Joël T.<span class="etq-s nr">Non retenu</span></b><span>Chargé de clientèle · 12 sept.</span></div></div>
<div class="rk"><span class="cb on">{CK}</span><span class="av a">AM</span><div class="t"><b>Ange M.<span class="etq-s nr">Non retenue</span></b><span>Comptable · 9 sept.</span></div></div>
<div class="rk"><span class="cb"></span><span class="av b">PL</span><div class="t"><b>Prisca L.<span class="etq-s nr">Non retenue</span></b><span>Chargé de clientèle · 2 sept.</span></div></div></div>
<p style="margin:0;font-size:12px;color:var(--texte2)">Les candidats gardent leurs messages. Le dossier reste dans l’offre.</p><div class="bts"><a class="bt sec m">Garder</a><a class="bt p m pl">Retirer 2 conversations</a></div>'''
W_CLEAN = web(msgs_r(), 'message', 'rh', UM, over=fenetre(DLG_CLEAN).replace('class="dlg"', 'class="dlg" style="width:540px"'))

# ---------- 5. Propositions aux talents ----------
def contacts4():
    cs = [("RB","","Ruth B.","Analyste BI · Kinshasa","ct","Acceptée","● en ligne",True),("DK","b","David K.","Data analyst · Kinshasa","ct","Acceptée","vu hier",True),("MT","","Merveille T.","Analyste · envoyée il y a 2 j","at","En attente","sous 14 jours",False),
          ("SL","a","Sarah L.","Analyste · envoyée il y a 5 j","at","En attente","sous 14 jours",False),("CN","b","Christian N.","Comptable · Lubumbashi","ct","Acceptée","vu ven.",True),("YK","","Yannick K.","Chargé de clientèle · 3 oct.","nr","Refusée","sans détail",None)]
    def c(i, cl, n, s_, ec, e, v, ok):
        b = f'<a class="bt p m">{ic("message","s")}Écrire</a>' if ok else ('<a class="bt sec m">Relancer</a>' if ok is False else '<a class="bt sec m" style="opacity:.5">Rien à faire</a>')
        return f'<div class="c"><div class="h"><span class="av {cl}{" enl" if v.startswith("●") else ""}">{i}</span><div class="t"><b>{n}</b><span>{s_}</span></div></div><div class="o"><span class="etq-s {ec}">{e}</span><span>{v}</span></div>{b}</div>'
    return (wh('Candidats', 'Rechercher des talents · vos propositions d’offre', '<div class="seg" style="width:380px"><span>Candidatures</span><span class="on">Rechercher des talents</span></div>')
            + '<div class="sub-t" style="max-width:420px"><a>Découvrir</a><a class="on">Mes propositions<small>18</small></a></div>'
            + f'<div class="flt-b"><div class="verre rech">{ic("recherche","s")}<span>Nom, métier, offre</span></div><div class="filtres-h"><span class="puce on">Toutes<small>18</small></span><span class="puce">Acceptées<small>12</small></span><span class="puce">En attente<small>4</small></span><span class="puce">Refusées<small>2</small></span></div></div>'
            + '<div class="verre quota-g"><div class="h"><b>Propositions ce mois</b><span>6 sur 10</span></div><span class="barre"><i style="width:60%"></i></span></div>'
            + '<div class="ctc-g">' + ''.join(c(*x) for x in cs) + '</div>')
UTP = '/hire/candidats/talents/propositions'
W_CONT = R(contacts4(), 'candidats', UTP)
DLG_DEM = f'''<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center"><span class="rond-ok" style="width:64px;height:64px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37">{ic("envoyer")}</span><h3 style="margin:4px 0 0">Proposition envoyée à Ruth</h3><span style="font-size:13px;color:var(--texte2)">Elle reçoit l’offre et votre message. Vous serez prévenue de sa réponse.</span></div>
<div class="verre tl-c" style="box-shadow:none;background:var(--zone)"><div class="e ok"><span class="o">{CK}</span><div><b>Envoyée</b><span>Aujourd’hui 10:05</span></div></div><div class="e at"><span class="o">{ic("horloge","xs")}</span><div><b>Ruth décide</b><span>Accepter ou refuser, sous 14 jours</span></div></div><div class="e"><span class="o">{ic("message","xs")}</span><div><b>Conversation ouverte</b><span>Si elle accepte</span></div></div></div>
<a class="bt p m" style="width:100%">Voir mes propositions</a>'''
W_DEM = R(contacts4(), 'candidats', UTP, over=fenetre(DLG_DEM).replace('class="dlg"', 'class="dlg" style="width:500px"'))
def talreq():
    l = f'''<div class="req"><div class="h"><span class="lg-e sap">BF</span><div class="t"><b>Baobab Fintech</b>Nadia K. · Responsable recrutement · organisation vérifiée</div></div>
<p>Bonjour Ruth, votre attestation SQL et votre tableau de bord Power BI correspondent à ce que nous cherchons. L’offre vous intéresse-t-elle ?</p>
<div class="verre off-m" style="box-shadow:none;background:var(--zone)"><span class="im">{BAN["baobab"]}</span><div class="t"><b>Analyste de données junior</b><span>CDI · Hybride · Kinshasa</span></div></div>
<div class="vu"><b style="font-size:12.5px">Si vous acceptez, Baobab Fintech voit :</b><div><span class="o">{CK}</span>Votre profil complet et vos projets</div><div><span class="o">{CK}</span>Une conversation avec vous</div><div><span class="o n"></span>Pas votre téléphone ni votre adresse</div></div>
<div style="display:flex;gap:10px;justify-content:flex-end"><a class="bt sec m">Refuser</a><a class="bt p m">{ic("valider","s")}Accepter</a></div></div>'''
    r = f'''<div class="col"><div class="pq-o"><div class="h">{orbi(30)}<div class="t"><b>Ce que vous en dit Orbi</b><span>Votre profil et cette offre</span></div>{ring(84)}</div>
<div class="pt"><i class="v">✓</i><span>SQL et Power BI demandés : vous avez les deux, avec une attestation.</span></div><div class="pt"><i class="a">!</i><span>Python souhaité : une formation courte existe sur Jumanly.</span></div></div>
<div class="gar">{ic("confidentialite","s")}Un refus est annoncé sans détail. Postuler et répondre restent gratuits.</div></div>'''
    return wh('Proposition d’offre', 'Reçue aujourd’hui à 10:05') + f'<div class="g2">{l}{r}</div>'
W_TALREQ = web(talreq(), 'accueil', 'talent', '/app/propositions/baobab-fintech').replace('Grâce Mbuyi', 'Ruth Bisimwa').replace('>GM<', '>RB<')
DLG_ACC = f'''<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center"><span class="av enl" style="width:76px;height:76px;font-size:21px;color:#0F3F37">RB</span><h3 style="margin:6px 0 0">Ruth a accepté votre proposition</h3><span style="font-size:13px;color:var(--texte2)">Analyste de données junior · il y a 2 min</span><span class="etq-s ct">Proposition acceptée</span></div>
<div class="orbi-l">{orbi(26)}<div class="t">Je peux préparer un premier message ou l’inviter à postuler.</div></div><div class="bts"><a class="bt sec m">Profil</a><a class="bt p m pl">{ic("message","s")}Écrire à Ruth</a></div>'''
W_ACC = web(msgs_r(), 'message', 'rh', UM, over=fenetre(DLG_ACC).replace('class="dlg"', 'class="dlg c" style="width:480px"'))

# ---------- 6. Rejoindre une organisation existante ----------
ORGF = f'''<div class="verre org-f"><span class="ban">{BAN["baobab"]}</span><div class="c"><span class="lg-e sap">BF</span><b class="n">Baobab Fintech<span class="ok-v">{ic("valider","xs")}Vérifiée</span></b><span class="m">Services financiers · 50 à 200 · {FLAG["cd"]} Kinshasa</span>
<div class="eq"><span class="avs"><span class="av">NK</span><span class="av b">OB</span></span>2 recruteurs · admin principale : Nadia K.</div></div></div>'''
OBT_C = f'''<div class="ob-q"><h2>Votre organisation</h2><p>Elle apparaîtra sur vos offres.</p></div>
<div class="org2"><div class="col">{champ('Nom','Baobab','focus')}<span class="trouve">{ic("valider","xs")}Déjà sur Jumanly</span>{ORGF}<a style="font-size:13px;font-weight:600">Ce n’est pas mon organisation</a></div>
<div class="col"><div class="orbi-l">{orbi(26)}<div class="t">Votre e-mail <b>@baobab-fintech.example</b> correspond à cette organisation.</div></div><div class="gar">{ic("candidats","s")}L’admin principale reçoit votre demande et choisit votre rôle.</div></div></div>'''
W_ORGT = pub('/hire/bienvenue/organisation', obr(2, OBT_C, f'<a class="bt sec m">{ic("retour","s")}Retour</a><a class="bt p m">Demander à rejoindre</a>'))
JOIN_C = f'''<div class="pret" style="align-items:center"><span class="rond-ok" style="width:72px;height:72px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37">{ic("envoyer")}</span><h2>Demande envoyée</h2><p>Nadia K., admin principale de Baobab Fintech, a reçu une notification et un e-mail.</p></div>
<div class="g2e" style="width:100%;max-width:900px;margin:0 auto"><div class="verre tl-c"><div class="e ok"><span class="o">{CK}</span><div><b>Demande envoyée</b><span>Aujourd’hui 10:20</span></div></div><div class="e at"><span class="o">{ic("horloge","xs")}</span><div><b>L’admin choisit votre rôle</b><span>Recruteur, admin ou lecteur</span></div></div><div class="e"><span class="o">{ic("candidats","xs")}</span><div><b>Accès aux offres</b><span>Selon votre rôle</span></div></div></div>
<div class="col"><div class="orbi-l">{orbi(26)}<div class="t">En attendant, vous pouvez compléter votre profil RH.</div><a class="bt sec s">Profil</a></div>{ORGF}</div></div>'''
W_JOIN = pub('/hire/bienvenue/en-attente', obr(3, JOIN_C, f'<a class="bt sec m">Annuler la demande</a><a class="bt p m">Compléter mon profil RH</a>'))
ADM = f'''<div class="w-voile cl"></div><div class="pop" style="width:460px"><div class="hd"><b>Notifications</b><a>Tout marquer comme lu</a></div>
<div class="req" style="box-shadow:0 0 0 2px #F8CF73;padding:16px"><div class="h"><span class="av" style="width:48px;height:48px;color:#0F3F37">MT</span><div class="t"><b>Merveille Tshala veut rejoindre Baobab Fintech</b>Chargée RH · e-mail sur votre domaine confirmé</div></div>
<div class="ch2"><a class="on"><b>Recruteur</b>Ses offres et candidats</a><a><b>Lecteur</b>Consulter et noter</a></div><span style="font-size:12px;color:var(--texte2)">Sièges : 3 sur 3 après acceptation · RH Premium</span>
<div style="display:flex;gap:8px"><a class="bt sec m">Refuser</a><a class="bt p m" style="flex:1">{ic("valider","s")}Accepter</a></div></div>
<div class="grp-t">Aujourd’hui</div><div class="liste lignes">{nt('c3','candidature','4 nouvelles candidatures','Analyste de données junior','10:40',True)}{nt('c2','entretien','Grâce M. a confirmé','Jeudi 22 oct. à 10:00 · visio','10:12')}</div></div>'''
W_ADM = R(at4(), 'aujourdhui', '/hire', over=ADM)

# ---------- 6 bis. Fin d'une offre ----------
FCARD = f'''<div class="f-card"><div class="h"><span class="cd"><b>J-3</b></span><div class="t"><b>Fin de l’offre dans 3 jours</b><span>Analyste de données junior</span><span class="when">Clôture le 31 oct. · reçu à 08:00</span></div></div>
<div class="f-kp"><div><b>24</b>candidatures</div><div><b>1 240</b>vues</div><div><b>3</b>entretiens</div></div><div class="f-ac">
<a class="p"><span class="cases" style="display:grid;place-items:center">{orbi(20)}</span><span class="t">Analyser et classer<small>Les 24 CV, avant la fin</small></span>{ic("suivant","s")}</a>
<a><span class="cases" style="background:var(--g-accomp);display:grid;place-items:center">{ic("progression","s")}</span><span class="t">Voir les statistiques<small>Vues, sources, étapes</small></span>{ic("suivant","s")}</a>
<a><span class="cases" style="background:var(--g-former);display:grid;place-items:center">{ic("agenda","s")}</span><span class="t">Prolonger l’offre<small>Choisir une nouvelle date</small></span>{ic("suivant","s")}</a>
<a><span class="cases" style="background:var(--zone);display:grid;place-items:center">{ic("fermer","s")}</span><span class="t">Clôturer ou annuler<small>Les candidats sont prévenus</small></span>{ic("suivant","s")}</a></div></div>'''
FIN_POP = f'<div class="w-voile cl"></div><div class="pop" style="width:440px"><div class="hd"><b>Notifications</b><a>Réglages</a></div><div class="grp-t">À traiter</div>{FCARD}<div class="grp-t">Plus tôt</div><div class="liste lignes">{nt("c2","candidats","4 nouvelles candidatures","Analyste de données junior","10:40")}</div></div>'
W_FIN = R(offres4(), 'offre', '/hire/offres', over=FIN_POP)
DLG_PROL = f'''<h3>Prolonger l’offre</h3><span style="font-size:13px;color:var(--texte2);margin-top:-6px">Analyste de données junior</span>
<div class="pr-ch"><a><b>+7</b>jours</a><a class="on"><b>+14</b>jours</a><a><b>+30</b>jours</a></div>
<a class="li verre" style="padding:12px 14px;border-radius:18px;display:flex;gap:10px;align-items:center">{ic("agenda","s")}<div class="t" style="flex:1"><b>Autre date</b></div>{ic("suivant","s")}</a>
<div class="pr-av"><div class="d"><s>31 oct.</s>{ic("suivant","xs")}<b>14 novembre 2026</b></div><span class="etq-s ret">Nouvelle fin</span></div>
<div class="q-sw"><div class="t"><b>Programmer l’analyse au 14 nov.</b>L’analyse prévue suit la nouvelle date.</div><span class="sw on"></span></div><div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Prolonger jusqu’au 14 nov.</a></div>'''
W_PROL = R(offres4(), 'offre', '/hire/offres', over=fenetre(DLG_PROL).replace('class="dlg"', 'class="dlg" style="width:520px"'))
DLG_CLO = f'''<h3>Clôturer ou annuler</h3><div class="cl-op">
<a class="on"><span class="cases" style="background:var(--g-former);display:grid;place-items:center">{ic("valider","s")}</span><span class="t"><b>Clôturer maintenant</b><span>Plus de nouvelles candidatures. Les 24 reçues restent à traiter, l’analyse reste possible.</span></span></a>
<a><span class="cases" style="background:var(--zone);display:grid;place-items:center">{ic("fermer","s")}</span><span class="t"><b>Annuler le recrutement</b><span>Le poste n’est plus ouvert. Chaque candidat reçoit un message relu par vous.</span></span></a>
<a><span class="cases" style="background:var(--g-accomp);display:grid;place-items:center">{ic("horloge","s")}</span><span class="t"><b>Laisser finir le 31 oct.</b><span>Rien ne change.</span></span></a></div><div class="bts"><a class="bt sec m">Retour</a><a class="bt p m pl">Clôturer l’offre</a></div>'''
W_CLO = R(offres4(), 'offre', '/hire/offres', over=fenetre(DLG_CLO).replace('class="dlg"', 'class="dlg" style="width:540px"'))
DN = '''<div class="dn"><div class="lk-n"><div class="a"><i class="lkl">J</i><span>JUMANLY HIRE</span>maintenant</div><b>Plus que 3 jours pour « Analyste de données junior »</b><p>24 candidatures, 1 240 vues. Analyser, prolonger ou clôturer ?</p><div class="bts"><a>Statistiques</a><a>Prolonger</a></div></div>
<div class="lk-n"><div class="a"><i class="lkl">J</i><span>JUMANLY HIRE</span>31 oct.</div><b>Analyse terminée : 5 dossiers recommandés</b><p>Orbi a classé les 31 candidatures, avec le pourquoi.</p></div>
<div class="lk-n" style="opacity:.85"><div class="a"><i class="lkl">J</i><span>JUMANLY HIRE</span>31 oct.</div><b>Votre offre est clôturée</b><p>Pensez à répondre aux candidats non retenus.</p></div></div>'''
W_DN = R(at4().replace('Lundi 19 octobre', 'Mercredi 28 octobre'), 'aujourdhui', '/hire', over=DN)
SNR4 = SNR[:1] + [('agenda', 'Rappels de fin d’offre')] + SNR[1:]
def prm4(on, corps):
    h = ''.join('<div class="sp"></div>' if x is None else f'<a class="{"on" if x[1] == on else ""}"><span class="cases">{ic(x[0],"s")}</span>{x[1]}</a>' for x in SNR4)
    return wh('Paramètres') + f'<div class="prm"><div class="verre snav">{h}</div><div class="col">{corps}</div></div>'
REG_C = f'''<h3>Rappels de fin d’offre</h3><div class="verre rap-l">
<div class="r"><span class="j v">J-7</span><div class="t"><b>Une semaine avant</b><span>Point d’étape et statistiques</span></div><span class="sw"></span></div>
<div class="r"><span class="j a">J-3</span><div class="t"><b>Trois jours avant</b><span>Analyser, prolonger ou clôturer</span></div><span class="sw on"></span></div>
<div class="r"><span class="j r">J-1</span><div class="t"><b>La veille</b><span>Dernier rappel</span></div><span class="sw on"></span></div>
<div class="r"><span class="j">Fin</span><div class="t"><b>Le jour de clôture</b><span>Bilan et réponses aux candidats</span></div><span class="sw on"></span></div></div>
<span class="ck-t">Recevoir par</span><div class="verre rap-l">
<div class="r"><span class="cases" style="width:40px;height:40px;border-radius:13px;background:var(--g-former);display:grid;place-items:center">{ic("notification","s")}</span><div class="t"><b>Notification</b><span>Dans l’app et sur le téléphone</span></div><span class="sw on"></span></div>
<div class="r"><span class="cases" style="width:40px;height:40px;border-radius:13px;background:var(--g-accomp);display:grid;place-items:center">{ic("message","s")}</span><div class="t"><b>E-mail</b><span>nadia.k@baobab-fintech.example</span></div><span class="sw on"></span></div></div>'''
W_REG = R(prm4('Rappels de fin d’offre', REG_C), '', '/hire/parametres/rappels')

# ---------- 7. Rapport PDF ----------
DLG_EXP = f'''<h3>Exporter le rapport en PDF</h3><span class="ck-t">Période</span><div class="puces"><span class="puce on">Octobre</span><span class="puce">Trimestre</span><span class="puce">Personnalisée</span></div>
<span class="ck-t">Offres</span><div class="puces"><span class="puce on">Toutes · 4</span><span class="puce">Choisir</span></div><span class="ck-t">Contenu</span>
<div class="verre liste lignes" style="box-shadow:none;background:var(--zone)"><div class="li"><div class="t"><b>Chiffres clés et étapes</b></div><span class="sw on"></span></div><div class="li"><div class="t"><b>Détail par offre</b></div><span class="sw on"></span></div><div class="li"><div class="t"><b>Lecture d’Orbi</b><span>Constats sur vos chiffres</span></div><span class="sw on"></span></div></div>
<div class="bts"><a class="bt sec m">Aperçu</a><a class="bt p m pl">{ic("telecharger","s")}Télécharger le PDF</a></div>'''
W_EXP = R(rapports(), 'progression', '/hire/rapports', over=fenetre(DLG_EXP).replace('class="dlg"', 'class="dlg" style="width:540px"'))

# ---------- Chemins ----------
def chemins_w():
    def c(t, et):
        p = f' {ic("suivant","xs")} '.join(f'<span class="{"f" if i == len(et) - 1 else ""}">{e}</span>' for i, e in enumerate(et))
        return f'<div class="c"><b>{t}</b><div class="p">{p}</div></div>'
    return '<div class="ch0">' + ''.join(c(t, e) for t, e in [
        ('Analyser tous les CV, depuis Offres', ['Offres', 'Analyser (ATS) sur la carte', 'Lancer l’analyse']), ('Analyser, depuis Candidats', ['Candidats', 'Choisir l’offre', 'Analyser et classer']),
        ('Analyser, depuis À traiter', ['À traiter', 'Carte Orbi « à classer »', 'Lancer l’analyse']), ('Analyser, depuis une offre', ['Offres', '⋯ sur la carte', 'Analyser les candidatures']),
        ('Choisir quand analyser', ['Lancer l’analyse', 'Maintenant ou À la fin de l’offre']), ('Créer la liste des retenus', ['Recommandation d’Orbi', 'Sélectionner', 'Retenir']),
        ('Répondre à tous', ['Onglet Retenus', 'Informer les 5', 'Relire', 'Envoyer']), ('Ouvrir les modèles de messages', ['Conversation', '+ dans la zone de saisie', 'Modèles']),
        ('Menu d’une conversation', ['Conversation', '⋯ en haut']), ('Orbi dans une conversation', ['Conversation', 'Orbi dans la zone de saisie', 'Panneau à droite']),
        ('Voir mes propositions', ['Candidats', 'Rechercher des talents', 'Mes propositions']), ('Rejoindre son organisation', ['Inscription', 'Je recrute', 'Votre organisation', 'Demander à rejoindre']),
        ('Rappel de fin d’offre', ['Cloche ou e-mail J-3', 'Analyser, statistiques, prolonger ou clôturer']), ('Régler les rappels', ['Paramètres', 'Rappels de fin d’offre']),
        ('Exporter un rapport', ['Rapports dans la barre de gauche', 'Exporter en PDF'])]) + '</div>'

def W(e, t, n=''): return wrow(wfig(e, '<span class="wtag">Ordinateur</span>' + t, n))
def T(e, t, n=''): return wrow(wfig(e, '<span class="wtag t">Tablette</span>' + t, n))
MAILS_W = f'''<div class="mail-g"><figure>{mail_retenu()}<figcaption><b>Candidature retenue</b> · invitation à l’entretien</figcaption></figure>
<figure>{mail_refus()}<figcaption><b>Candidature non retenue</b> · réponse respectueuse</figcaption></figure>
<figure>{mail_fin_offre()}<figcaption><b>Rappel de fin d’offre</b> · trois jours avant</figcaption></figure>
<figure>{mail_admin()}<figcaption><b>Admin principale</b> · demande pour rejoindre l’organisation</figcaption></figure></div>'''
RAP_W = f'<div class="rp-g2"><div class="sc">{rapport_p1()}</div><div class="sc">{rapport_p2()}</div></div>'
ECR = [
 ('w0', '0 · Comment on y arrive', 'Les mêmes chemins qu’en mobile, sans pastilles. L’analyse a toujours le même nom, « Analyser », et rien ne se lance sans votre geste.', [chemins_w()]),
 ('w1', '1 · Arriver à l’ATS', 'Quatre entrées : la carte de l’offre, Candidats, À traiter et le menu ⋯ d’une offre.',
  [W(W_EOFF, 'Depuis Offres', 'Analyser (ATS) sur chaque carte.'), W(W_ECAND, 'Depuis Candidats', 'Carte ATS à côté du classement.'), W(W_EAT, 'Depuis À traiter', 'Orbi signale les candidatures à classer.'), W(W_EMENU, 'Depuis le menu ⋯ d’une offre')]),
 ('w2', '2 · ATS : analyser et classer', 'Orbi lit tous les CV d’une offre, les classe par score et explique. Le recruteur choisit qui retenir. Personne n’est rejeté.',
  [W(W_ATS1, 'Analyse de l’offre', 'Lancer, répartition, classement avec barres.'), W(W_ATS2, 'Analyse en cours', 'Dossier par dossier.'), W(W_ATS3, 'Recommandation d’Orbi', 'Podium, 5 prioritaires, pourquoi.'),
   W(W_ATS4, 'Profil pour cette offre', 'Critère par critère, avec la preuve.'), W(W_SEL, 'Sélection rapide', 'Cocher, puis retenir.'), W(W_RET, 'Liste des retenus', 'Pour l’étape Entretien.'), T(T_ATS1, 'Analyse de l’offre'), T(T_ATS3, 'Recommandation')]),
 ('w3', '3 · Quand lancer l’analyse', 'Maintenant, ou une seule fois à la fin de l’offre. Les crédits ne sont utilisés qu’au lancement.',
  [W(W_QUAND, 'Choisir le moment'), W(W_PROG, 'Analyse programmée', 'Modifiable, annulable, ou lancée plus tôt.')]),
 ('w4', '4 · Répondre à tous', 'Retenus et non retenus, par message Jumanly et par e-mail. Chaque message se relit, l’envoi s’annule pendant 10 minutes.',
  [W(W_ENV, 'Choisir et relire', 'Modèle, canal, aperçu personne par personne.'), W(W_ENVOK, 'Confirmer', '19 réponses, annulation possible.'), W(W_MLONG, 'Message « retenue »', 'Dans Jumanly et par e-mail.'), W(W_MREF, 'Message « non retenu »', 'Respectueux, avec une suite.'), T(T_ENV, 'Choisir et relire')]),
 ('w5', '5 · Modèles d’e-mail', 'Aux couleurs de Jumanly, sans numéro de téléphone. Le texte vient du modèle et se relit avant l’envoi.', [MAILS_W]),
 ('w6', '6 · Messagerie', 'Menu de la conversation, bouton + de la zone de saisie, Orbi en panneau à droite, et la messagerie allégée sur proposition.',
  [W(W_CMENU, 'Menu ⋯', 'Dossier, modèles, épingler, retirer, signaler.'), W(W_CPLUS, 'Bouton +', 'Modèles, créneaux, documents, fichier.'), W(W_CORBI, 'Orbi dans la conversation', 'Résumé, réponse, ton, traduction, relance.'), W(W_CLEAN, 'Alléger la messagerie', 'Proposé par Orbi, choisi par vous.')]),
 ('w7', '7 · Propositions aux talents', 'La conversation s’ouvre seulement si le talent accepte. Un refus est annoncé sans détail.',
  [W(W_CONT, 'Mes propositions', 'Acceptées, en attente à relancer, refusées.'), W(W_DEM, 'Proposition envoyée', 'Les étapes qui suivent.'), W(W_TALREQ, 'Côté talent', 'Ruth accepte ou refuse.'), W(W_ACC, 'Acceptée', 'La conversation s’ouvre.')]),
 ('w8', '8 · Rejoindre une organisation existante', 'À l’inscription, l’organisation déjà présente s’affiche. L’admin principale choisit le rôle.',
  [W(W_ORGT, 'Organisation trouvée', 'Fiche, équipe, domaine reconnu.'), W(W_JOIN, 'Demande envoyée', 'En attente de l’admin.'), W(W_ADM, 'Côté admin', 'Rôle choisi, accepter ou refuser.')]),
 ('w9', '9 · Fin d’une offre', 'Avant la clôture, le recruteur est prévenu : analyser, voir les statistiques, prolonger ou clôturer.',
  [W(W_FIN, 'Notification J-3', 'Chiffres et quatre actions.'), W(W_PROL, 'Prolonger', '+7, +14, +30 jours ou une date.'), W(W_CLO, 'Clôturer ou annuler', 'Conséquences dites clairement.'),
   W(W_DN, 'Notifications de l’ordinateur', 'Rappel, analyse prête, clôture.'), W(W_REG, 'Réglage des rappels', 'J-7, J-3, J-1, jour de fin.')]),
 ('w10', '10 · Rapport PDF', 'Toujours exporté en PDF A4, aux couleurs de Jumanly. Chiffres réels, aucune donnée personnelle.', [W(W_EXP, 'Exporter', 'Période, offres, contenu.'), RAP_W]),
 ('w11', '11 · Mode sombre', 'Les mêmes écrans sur fond Nuit.', [W(wsombre(W_ATS3), 'Recommandation'), W(wsombre(W_CORBI), 'Orbi dans la conversation'), W(wsombre(W_CONT), 'Mes propositions')]),
]
ECR = [(i, t, d, [fx(x) for x in xs]) for i, t, d, xs in ECR]
_st = lambda x: x.replace("<style>", "").replace("</style>", "")
page_w('recruteur-4', 'Jumanly Hire · version ordinateur et tablette', 'Recruteur, lot 4 : ATS, réponses, messagerie, propositions',
       '19 octobre 2026. Les écrans du lot 4 recruteur mobile adaptés aux grands écrans : analyse de tous les CV par Orbi, liste des retenus, réponses groupées, modèles d’e-mail, messagerie, propositions aux talents, organisation existante, fin d’offre, rapport PDF. Contenus fictifs.', ECR,
       CSS + CSS1 + CSS2 + CSS3L + CSS4 + CSSR + _st(CSS_AB) + _st(CSS_RP) + CSSWR1 + CSSW2 + CSSW4 + CSSWR3 + CSSWR4)
