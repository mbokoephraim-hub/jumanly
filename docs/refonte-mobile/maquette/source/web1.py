# Version ordinateur et tablette · talent, lot 1 (19/10/2026). python3 web1.py && node shotw.js talent-1
import os
H = os.path.dirname(os.path.abspath(__file__))
_s = open(H + '/talent1.py').read(); exec(_s[:_s.index('\nECR = [')])
exec(open(H + '/web.py').read())

CSS1 = '''
.w-et{display:flex;align-items:center;gap:22px;padding:22px 24px;background:linear-gradient(120deg,var(--plein),var(--plein)),var(--plein);position:relative;overflow:hidden}
.w-et::after{content:"";position:absolute;right:-60px;top:-80px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(166,242,107,.35),transparent 70%)}
.w-et .anneau{width:84px;height:84px}.w-et .anneau b{font-size:17px;width:68px;height:68px;white-space:nowrap}
.w-et .t{flex:1;position:relative;z-index:1}.w-et .k{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--texte2)}
.w-et .k i{width:7px;height:7px;border-radius:50%;background:#A6F26B}
.w-et h3{font-size:22px;font-weight:600;letter-spacing:-.02em;margin:4px 0 2px}.w-et p{font-size:13px;color:var(--texte2)}
.w-et .bt{position:relative;z-index:1}
.sec-w{display:flex;align-items:baseline;justify-content:space-between;margin:6px 2px -4px}.sec-w h2{font-size:18px;font-weight:600;letter-spacing:-.01em}.sec-w a{font-size:13px;font-weight:600;color:var(--texte2)}
.w-of .of .ban{height:96px}
.w-fo{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.w-fo .fo .ban{height:110px}
.w-side{display:flex;flex-direction:column;gap:16px}
.w-pr{padding:18px;display:flex;flex-direction:column;gap:12px}
.w-pr .h{display:flex;align-items:center;gap:12px}.w-pr .h>div>b{display:block;font-size:15px}.w-pr .h span{font-size:12px;color:var(--texte2)}
.w-pr .anneau{width:62px;height:62px}.w-pr .anneau b{width:50px;height:50px;font-size:12.5px;white-space:nowrap}
.w-pr .l{display:flex;align-items:center;gap:10px;font-size:13px;padding:9px 0;border-top:1px solid var(--trait)}
.w-pr .l i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex:none;font-style:normal}
.w-pr .l.ok i{background:var(--lime-c)}.w-pr .l.ko i{background:var(--ambre-c)}.w-pr .l i .ic{width:13px;height:13px}
.w-pr .l span{flex:1}.w-pr .l a{font-size:12px;font-weight:700;padding:5px 10px;border-radius:999px;background:var(--zone)}
.w-os{padding:18px;display:flex;flex-direction:column;gap:12px;background:var(--g-accomp)}
.w-os .h{display:flex;gap:12px;align-items:center}.w-os .h b{font-size:15px;display:block}.w-os .h span{font-size:12px;color:var(--texte2)}
.w-os p{font-size:13px;line-height:1.5}
.w-os .ch{display:flex;flex-wrap:wrap;gap:8px}.w-os .ch span{font-size:12.5px;font-weight:600;padding:8px 12px;border-radius:999px;background:var(--plein);box-shadow:var(--verre)}
.w-side .raccs{grid-template-columns:repeat(2,1fr);padding:10px}
.w-side .raccs a{flex-direction:row;justify-content:flex-start;gap:10px;padding:10px;font-size:13px;font-weight:600}
.w-side .raccs .cases{width:36px;height:36px;border-radius:12px}
/* Offres */
.w-fl{padding:18px;display:flex;flex-direction:column;gap:16px}
.w-fl h3{font-size:16px;font-weight:600;display:flex;justify-content:space-between;align-items:center}.w-fl h3 a{font-size:12.5px;color:var(--texte2);font-weight:600}
.w-fl .champ label{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2);display:block;margin-bottom:8px}
.w-fl .puces{flex-wrap:wrap}
.w-fl .li{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600}.w-fl .li .t{flex:1}
.w-ol{display:flex;flex-direction:column;gap:16px;min-width:0}
.w-ol .bar{display:flex;align-items:center;gap:16px}.w-ol .bar .seg{flex:none;width:380px}.w-ol .bar .res-l{flex:1;flex-direction:column;align-items:flex-end;text-align:right;gap:2px}
.w-ol .res-l{display:flex;justify-content:space-between}.w-ol .res-l b{color:var(--texte)}
.w-ol .of .ban{height:92px}
/* Détail */
.w-od{position:relative;border-radius:28px;overflow:hidden;height:190px}.w-od svg{width:100%;height:100%}
.w-od .act{position:absolute;right:16px;top:16px;display:flex;gap:8px}.w-od .act .bi{background:rgba(255,255,255,.88);color:#0F3F37}
.w-od .ret{position:absolute;left:16px;top:16px;background:rgba(255,255,255,.88);color:#0F3F37}
.w-odi{display:flex;align-items:flex-start;gap:18px;margin-top:-4px;padding:0 26px;position:relative}.w-odi .lg-e{margin-top:-50px}
.w-odi .lg-e{width:92px;height:92px;font-size:26px;border:5px solid var(--fond);border-radius:26px}
.w-odi .t{flex:1;padding-top:12px}.w-odi h2{font-size:28px;font-weight:600;letter-spacing:-.025em}
.w-odi .ent{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--texte2);margin-top:4px}
.w-odc{display:flex;flex-direction:column;gap:16px}
.w-ap{padding:20px;display:flex;flex-direction:column;gap:14px}
.w-ap .sc{display:flex;align-items:center;gap:14px}.w-ap .anneau{width:72px;height:72px}.w-ap .anneau b{font-size:16px;width:58px;height:58px;white-space:nowrap}
.w-ap .sc>div>b{display:block;font-size:15px}.w-ap .sc span{font-size:12px;color:var(--texte2)}
.w-ap .bt{width:100%;justify-content:center;height:54px;font-size:15px}
.w-ap .gratuit{text-align:center;font-size:12px;color:var(--texte2);margin-top:-6px}
.w-ap .pq{align-self:flex-start}
.w-ap .rg{display:flex;gap:8px}.w-ap .rg .bt{flex:1}
.w-2b{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.op .ck,.op .crit{padding:14px 16px;border-radius:22px;background:var(--plein);box-shadow:var(--verre)}
.op .bt.pl{width:100%;justify-content:center}
.dlg .crit .c .j{height:8px}
.dlg .acts{display:flex;gap:10px}.dlg .acts .bt{flex:1;justify-content:center}
.tab .w-odi h2{font-size:24px}.tab .w-od{height:160px}
'''

GR = f'''<div class="g3 w-of">{offre('baobab','BF','sap','Analyste de données junior','Baobab Fintech','Kinshasa',['CDI','Hybride'],86)}
{offre('mwinda','ME','amb','Analyste énergie solaire','Mwinda Énergie','Kinshasa',['CDI'],79,True)}
{offre('fleuve','FB','mer','Chargée d’études marketing','Fleuve Banque','Kinshasa',['CDI'],72)}</div>'''
ETW = f'''<div class="verre w-et"><span class="anneau"><b>70 %</b></span><div class="t"><span class="k"><i></i>Prochaine étape</span><h3>Ajoutez 2 compétences</h3><p>Votre profil passe à 80 % et 4 offres de plus deviennent compatibles.</p></div><a class="bt p pl">Compléter{ic("suivant","xs")}</a></div>'''
PROF = f'''<div class="verre w-pr"><div class="h"><span class="anneau"><b>70 %</b></span><div><b>Votre profil</b><span>Visible par les recruteurs où vous postulez</span></div></div>
<div class="l ok"><i>{ic_ok()}</i><span>CV « Data · octobre »</span></div><div class="l ok"><i>{ic_ok()}</i><span>Expériences et formation</span></div>
<div class="l ko"><i>{ic("plus","xs")}</i><span>2 compétences</span><a>Ajouter</a></div><div class="l ko"><i>{ic("plus","xs")}</i><span>Une réalisation</span><a>Ajouter</a></div></div>'''
OSUG = f'''<div class="verre w-os"><div class="h">{orbi(40)}<div><b>Orbi vous suggère</b><span>112 crédits</span></div></div><p>Le SQL avancé revient dans 5 offres que vous avez consultées. Une formation de 45 min suffit.</p>
<div class="ch"><span>Préparer un entretien</span><span>Améliorer mon CV</span><span>Voir la formation</span></div></div>'''
RACW = f'''<div class="sec-w"><h2>Accès rapide</h2></div>{RACCS}'''
FOS = (formation('numerique','Numérique','Excel pour le travail','6 modules','1 h') + formation('entretien','Entretien','Réussir son entretien','5 modules','40 min') + formation('savoir','Savoir-être','Travailler en équipe','4 modules','30 min'))

def pm_job(t=False):
    side = f'<div class="w-side">{PROF}{OSUG}{RACW}</div>'
    main = f'''<div class="col">{ETW}<div class="sec-w"><h2>3 opportunités pour vous</h2><a>Tout voir</a></div>{GR}
<div class="sec-w"><h2>Continuer à apprendre</h2><a>Apprendre</a></div>{CONT}</div>'''
    h = wh('Bonjour, Grâce', OBJ('Trouver un emploi'))
    if t:
        return h + f'''{ETW}<div class="sec-w"><h2>3 opportunités pour vous</h2><a>Tout voir</a></div><div class="g2e w-of">{offre('baobab','BF','sap','Analyste de données junior','Baobab Fintech','Kinshasa',['CDI','Hybride'],86)}{offre('mwinda','ME','amb','Analyste énergie solaire','Mwinda Énergie','Kinshasa',['CDI'],79,True)}</div>
<div class="g2e">{PROF}<div class="col">{CONT}{OSUG}</div></div>'''
    return h + f'<div class="g2">{main}{side}</div>'

def pm_skill():
    return wh('Bonjour, Grâce', OBJ('Développer mes compétences')) + f'''<div class="g2"><div class="col">
{formation('cv','Reprendre','Écrire un CV qui décroche un entretien','Module 2 sur 5 · Employabilité','8 min','w-big', barre=40)}
<div class="sec-w"><h2>Pour vos objectifs</h2><a>Tout voir</a></div><div class="w-fo">{FOS}</div></div>
<div class="w-side">{groupe3()}{OSUG}</div></div>'''

FL = f'''<div class="verre w-fl"><h3>Filtres<a>Effacer</a></h3>
<div class="champ"><label>Domaine</label><div class="puces"><span class="puce on">Data et finance</span><span class="puce">Énergie</span><span class="puce">Marketing</span><span class="puce">{ic("plus","xs")}Autre</span></div></div>
<div class="champ"><label>Lieu</label><div class="puces"><span class="puce on">Kinshasa</span><span class="puce">Lubumbashi</span><span class="puce">À distance</span></div></div>
<div class="champ"><label>Contrat</label><div class="puces"><span class="puce on">CDI</span><span class="puce">CDD</span><span class="puce">Stage</span><span class="puce">Freelance</span></div></div>
<div class="champ"><label>Expérience</label><div class="puces"><span class="puce">Sans expérience</span><span class="puce on">Junior</span><span class="puce">Confirmé</span></div></div>
<div class="li"><div class="t">Entreprises vérifiées seulement</div><span class="sw"></span></div></div>'''
OFS6 = [offre('baobab','BF','sap','Analyste de données junior','Baobab Fintech','Kinshasa',['CDI','Hybride'],86),
        offre('mwinda','ME','amb','Analyste énergie solaire','Mwinda Énergie','Kinshasa',['CDI'],79,True),
        offre('fleuve','FB','mer','Chargée d’études marketing','Fleuve Banque','Kinshasa',['CDI'],72),
        offre('kivu','KL','kiv','Assistante logistique','Kivu Logistique','Kinshasa',['CDD'],68),
        offre('baobab','BF','sap','Chargé de reporting','Baobab Fintech','À distance',['Stage'],64),
        offre('fleuve','FB','mer','Analyste crédit','Fleuve Banque','Kinshasa',['CDI'],61)]

def offres(t=False):
    seg = '<div class="seg"><span class="on">Pour vous</span><span>Récentes</span><span>Enregistrées</span></div>'
    rech = f'<div class="verre rech">{ic("recherche","s")}<span>Poste, entreprise, compétence</span><a class="f">{ic("filtres","s")}<b>2</b></a></div>'
    res = '<div class="res-l"><span>Classées selon votre profil. Toutes les offres restent visibles.</span><b>24 offres</b></div>'
    if t:
        return wh('Offres') + f'<div class="w-ol">{rech}{seg}<div class="puces"><span class="puce on">{ic("valider","xs")}Data et finance</span><span class="puce on">{ic("valider","xs")}Kinshasa</span><span class="puce">CDI</span><span class="puce">Junior</span></div>{res}<div class="g2e">{"".join(OFS6[:4])}</div></div>'
    return wh('Offres') + f'<div style="display:grid;grid-template-columns:280px minmax(0,1fr);gap:22px;align-items:start">{FL}<div class="w-ol">{rech}<div class="bar">{seg}{res}</div><div class="g3">{"".join(OFS6)}</div></div></div>'

def od_w():
    return f'''<div class="w-od">{BAN["baobab"]}{bi("retour","","ret")}<span class="act">{bi("partager")}{bi("favori")}</span></div>
<div class="w-odi"><span class="lg-e sap">BF</span><div class="t"><h2>Analyste de données junior</h2><div class="ent">Baobab Fintech · Kinshasa <span class="verif">{ic("valider","xs")}Vérifiée</span></div></div></div>
<div class="tags" style="padding:0 6px"><span class="tag">CDI</span><span class="tag">Hybride</span><span class="tag">Junior</span><span class="tag">Avant le 30 oct.</span></div>'''
AP = f'''<div class="verre w-ap"><div class="sc"><span class="anneau"><b>86 %</b></span><div><b>Compatible avec votre profil</b><span>6 compétences sur 8 · lieu et contrat</span></div></div>
<a class="pq">{ic("pourquoi")}Pourquoi ?</a><a class="bt a pl">{ic("envoyer","s")}Postuler</a><span class="gratuit">Postuler est toujours gratuit.</span></div>'''
PREPW = f'''<div class="verre prep">{orbi(40)}<div class="t"><b>Préparer ma candidature</b><span>Ce qui correspond, ce qui manque</span></div>{ic("suivant","s")}</div>'''
MISS = f'''<div class="verre bloc-t"><h4>Missions</h4><ul><li>Suivre les indicateurs des agences</li><li>Construire les tableaux de bord Power BI</li><li>Présenter les résultats chaque mois</li></ul></div>'''
PROFR = '''<div class="verre bloc-t"><h4>Profil recherché</h4><ul><li>Bac + 3 en statistique, économie ou informatique</li><li>Français courant, anglais lu</li></ul></div>'''
COMP = f'''<div class="verre bloc-t"><h4>Compétences demandées</h4><div class="cmp"><span>{ic_ok()}Power BI</span><span>{ic_ok()}Excel</span><span>{ic_ok()}SQL</span><span>{ic_ok()}Présentation</span><span class="m">SQL avancé</span><span class="m">Python</span></div></div>'''
MG = f'''<div class="verre mg"><span class="vign">{FORM["numerique"]}</span><div class="t"><small>Pour progresser</small><b>SQL : jointures et sous-requêtes</b><span>45 min · votre score passerait à 91 %</span></div>{ic("suivant","s")}</div>'''
VF = f'''<div class="verre vf"><span class="cases" style="width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:var(--g-accomp);flex:none">{ic("confidentialite","s")}</span><div class="t"><b>Entreprise vérifiée par Jumanly</b><span>Existence et adresse e-mail professionnelle contrôlées le 2 octobre. Jumanly ne vous demandera jamais d’argent pour postuler.</span></div></div>'''
SIG = f'<a class="sig">{ic("aide","xs")}Signaler cette offre</a>'

def detail(t=False):
    if t:
        return od_w() + f'<div class="g2e"><div class="col">{AP}{PREPW}{MG}</div><div class="col">{MISS}{COMP}{PROFR}</div></div>{VF}'
    return od_w() + f'<div class="g2r"><div class="col"><div class="w-2b">{MISS}{PROFR}</div>{COMP}{VF}{SIG}</div><div class="w-odc">{AP}{PREPW}{MG}</div></div>'

PREP_C = f'''<span class="ck-t">Ce qui correspond</span>
<div class="ck"><div class="l ok"><i>{ic_ok()}</i><div class="t"><b>Power BI, Excel, SQL</b><span>Dans votre CV « Data · octobre »</span></div></div>
<div class="l ok"><i>{ic_ok()}</i><div class="t"><b>Kinshasa, CDI, hybride</b><span>Vos préférences</span></div></div></div>
<span class="ck-t">À compléter</span>
<div class="ck"><div class="l ko"><i>{ic("plus","xs")}</i><div class="t"><b>SQL avancé</b><span>Demandé, absent de votre CV</span></div><a class="ac">Ajouter</a></div>
<div class="l ko"><i>{ic("plus","xs")}</i><div class="t"><b>Une réalisation chiffrée</b><span>Ex. « 12 agences suivies »</span></div><a class="ac">Ajouter</a></div></div>
<span class="ck-t">Pour combler l’écart</span>''' + MG + '''
'''
PANP = panneau_orbi('Préparer ma candidature', 'Analyste de données junior · Baobab Fintech', PREP_C,
    f'<div style="display:flex;flex-direction:column;gap:10px"><a class="bt p pl">{ic("cv","s")}Adapter mon CV à cette offre</a><div class="gar">{ic("cadenas","s")}Rien n’est modifié ni envoyé sans votre accord.</div></div>')
POURQ_C = f'''<h3>Pourquoi 86 % ?</h3><p class="ss">Calcul fixe, le même pour tous. Votre nom, âge, genre ou photo n’entrent jamais dans le score.</p>
<div class="crit">
<div class="c"><div class="h"><b>Compétences</b><span>6 sur 8</span></div><span class="j"><i style="width:75%"></i></span><p>Il manque SQL avancé et Python.</p></div>
<div class="c"><div class="h"><b>Expérience</b><span>Junior demandé</span></div><span class="j"><i style="width:100%"></i></span><p>1 an et 6 mois d’expérience.</p></div>
<div class="c"><div class="h"><b>Lieu et contrat</b><span>Correspondent</span></div><span class="j"><i style="width:100%"></i></span></div>
<div class="c"><div class="h"><b>Langues</b><span>Français, anglais</span></div><span class="j"><i style="width:90%"></i></span></div></div>
<div class="gar">{ic("pourquoi","s")}Le recruteur décide. Ce score ne bloque jamais votre candidature.</div>
<div class="acts"><a class="bt sec pl">Contester ce score</a><a class="bt p pl">Compris</a></div>'''

W_PM = web(pm_job(), 'accueil', url='/app')
W_PS = web(pm_skill(), 'accueil', url='/app')
T_PM = tab(pm_job(True), 'accueil')
W_OF = web(offres(), 'opportunites', url='/app/offres')
T_OF = tab(offres(True), 'opportunites')
W_OD = web(detail(), 'opportunites', url='/app/offres/analyste-donnees-junior')
T_OD = tab(detail(True), 'opportunites')
W_PREP = web(detail(), 'opportunites', url='/app/offres/analyste-donnees-junior', over=PANP)
T_PREP = tab(detail(True), 'opportunites', over=PANP)
W_PQ = web(detail(), 'opportunites', url='/app/offres/analyste-donnees-junior', over=fenetre(POURQ_C))

ECR = [
 ('w0', '0 · Le cadre', 'Ordinateur : barre latérale avec Orbi au centre de la navigation, recherche Ctrl K en haut. Tablette : rail d’icônes. Mêmes destinations que la barre mobile : Pour moi, Offres, Orbi, Apprendre, Suivi.',
  [wrow(wfig(W_PM, '<span class="wtag">Ordinateur</span>1240 px et plus', 'Barre latérale fixe, contenu en deux colonnes. Messages et connexions restent dans la barre.'))]),
 ('w1', '1 · Pour moi', 'La prochaine étape s’élargit en bandeau, les 3 offres passent côte à côte. La colonne de droite réunit profil, suggestion d’Orbi et accès rapide.',
  [wrow(wfig(W_PS, '<span class="wtag">Ordinateur</span>Objectif : développer mes compétences', 'Les formations passent devant, les offres vont à droite.')),
   wrow(wfig(T_PM, '<span class="wtag t">Tablette</span>Objectif : trouver un emploi', 'Rail à gauche, cartes sur deux colonnes.'))]),
 ('w2', '2 · Offres', 'Sur grand écran, les filtres ne sont plus une feuille : ils restent ouverts à gauche. Six offres visibles d’un coup.',
  [wrow(wfig(W_OF, '<span class="wtag">Ordinateur</span>Liste et filtres', 'Filtres permanents, grille de 3 colonnes, score et « Pourquoi ? » sur chaque carte.')),
   wrow(wfig(T_OF, '<span class="wtag t">Tablette</span>Liste', 'Filtres actifs en puces ; le bouton filtres ouvre la même feuille que sur mobile.'))]),
 ('w3', '3 · Détail d’une offre', 'Postuler quitte le bas de l’écran et devient une colonne fixe à droite, avec le score, Préparer avec Orbi et la formation pour progresser.',
  [wrow(wfig(W_OD, '<span class="wtag">Ordinateur</span>Offre', 'La colonne de droite reste visible au défilement. Postuler est toujours gratuit.')),
   wrow(wfig(T_OD, '<span class="wtag t">Tablette</span>Offre', 'Postuler en tête, détails à droite.'))]),
 ('w4', '4 · Orbi dans l’offre', 'Orbi s’ouvre en panneau à droite, l’offre reste lisible derrière. « Pourquoi 86 % ? » s’ouvre en fenêtre centrée.',
  [wrow(wfig(W_PREP, '<span class="wtag">Ordinateur</span>Préparer ma candidature', 'Panneau de 420 px. Rien n’est modifié ni envoyé sans accord.')),
   wrow(wfig(W_PQ, '<span class="wtag">Ordinateur</span>Pourquoi 86 % ?', 'Critères sans données personnelles. Contestation possible.')),
   wrow(wfig(T_PREP, '<span class="wtag t">Tablette</span>Préparer ma candidature', 'Même panneau, posé sur l’offre.'))]),
 ('w5', '5 · Mode sombre', 'Les mêmes écrans sur fond Nuit.',
  [wrow(wfig(wsombre(W_PM), '<span class="wtag">Ordinateur</span>Pour moi', '')),
   wrow(wfig(wsombre(W_PREP), '<span class="wtag">Ordinateur</span>Préparer ma candidature', '')),
   wrow(wfig(wsombre(T_OD), '<span class="wtag t">Tablette</span>Détail d’une offre', ''))]),
]
page_w('talent-1', 'Jumanly · version ordinateur et tablette', 'Talent, lot 1 : trouver et préparer une offre',
       '19 octobre 2026. Les écrans du lot 1 mobile, adaptés aux grands écrans : mêmes fonctions, même identité. Contenus fictifs.', ECR, CSS + CSS1)
