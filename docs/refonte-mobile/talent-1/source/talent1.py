# Refonte mobile · étape 2, lot 1 : Pour moi, Offres, détail d'une offre (18/10/2026).
# python3 talent1.py && node shot.js talent1
import os
H = os.path.dirname(os.path.abspath(__file__))
exec(open(H + '/build.py').read())   # aides, icônes, bannières (régénère aussi les fondations)

CSS = '''
.phone.long{height:auto;min-height:844px}.phone.long .contenu{position:relative;inset:auto;margin-top:46px}
.voile{position:absolute;inset:0;background:rgba(11,26,31,.38);z-index:6}
.sheet{position:absolute;left:8px;right:8px;bottom:8px;z-index:7;max-height:86%;overflow:hidden;border-radius:34px;padding:10px 18px 18px;display:flex;flex-direction:column;gap:12px;background:var(--plein)}
.sheet h3{font-size:18px;font-weight:600;letter-spacing:-.01em}
.sheet .ss{font-size:12.5px;color:var(--texte2);margin-top:-8px}
.od-ban{margin:-46px -16px 0;height:168px;position:relative;overflow:hidden}
.od-ban svg{width:100%;height:100%}
.od-top{position:absolute;top:52px;left:16px;right:16px;display:flex;justify-content:space-between}
.od-top .bi{background:rgba(255,255,255,.85)}
.od-id{display:flex;flex-direction:column;gap:6px;margin-top:-40px;position:relative}
.od-id .lg-e{width:62px;height:62px;font-size:19px;border:4px solid var(--fond)}
.od-id h2{font-size:22px;font-weight:600;letter-spacing:-.02em;line-height:1.2}
.od-id .ent{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--texte2)}
.verif{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:999px;background:var(--menthe-c);color:var(--texte)}
.verif .ic{width:13px;height:13px}
.tags{display:flex;flex-wrap:wrap;gap:6px}
.sc-c{display:flex;align-items:center;gap:14px;padding:14px 16px}
.sc-c .anneau{width:58px;height:58px}.sc-c .t{flex:1}.sc-c .t b{display:block;font-size:14.5px}.sc-c .t span{font-size:12px;color:var(--texte2)}
.prep{display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--g-accomp)}
.prep .t{flex:1}.prep .t b{display:block;font-size:14.5px}.prep .t span{font-size:12px;color:var(--texte2)}
.sombre .prep .t span{color:var(--texte2)}
.bloc-t{display:flex;flex-direction:column;gap:8px;padding:16px}
.bloc-t h4{font-size:15px;font-weight:600}
.bloc-t ul{margin:0;padding-left:18px;font-size:13px;color:var(--texte2);display:flex;flex-direction:column;gap:4px}
.cmp{display:flex;flex-wrap:wrap;gap:6px}
.cmp span{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;padding:5px 10px;border-radius:999px;background:var(--lime-c)}
.cmp span.m{background:var(--ambre-c)}
.cmp .ic{width:13px;height:13px}
.mg{display:flex;gap:12px;align-items:center;padding:12px;background:var(--g-former)}
.mg .vign{width:64px;height:64px;border-radius:16px;overflow:hidden;flex:none}.mg .vign svg{width:100%;height:100%}
.mg .t{flex:1}.mg .t small{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}.mg .t b{display:block;font-size:13.5px;line-height:1.3}.mg .t span{font-size:12px;color:var(--texte2)}
.vf{display:flex;gap:12px;align-items:flex-start;padding:14px 16px}
.vf .t b{display:block;font-size:13.5px}.vf .t span{font-size:12px;color:var(--texte2)}
.sig{display:flex;align-items:center;gap:6px;justify-content:center;font-size:12.5px;color:var(--texte2);padding:2px 0 6px}
.sig .ic{width:15px;height:15px}
.barre-p{position:absolute;left:0;right:0;bottom:0;z-index:5;padding:12px 16px 30px;display:flex;gap:10px;align-items:center;border-radius:28px 28px 0 0}
.barre-p .bt.a{flex:1}
.barre-p .gratuit{position:absolute;top:-22px;left:0;right:0;text-align:center;font-size:11.5px;color:var(--texte2)}
.ck{display:flex;flex-direction:column;gap:2px}
.ck .l{display:flex;gap:10px;align-items:flex-start;padding:8px 0;font-size:13px;border-top:1px solid var(--trait)}
.ck .l:first-child{border-top:0}
.ck .l i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex:none;font-style:normal}
.ck .l.ok i{background:var(--lime-c)}.ck .l.ko i{background:var(--ambre-c)}
.ck .l i .ic{width:13px;height:13px}
.ck .l .t{flex:1}.ck .l .t b{display:block;font-weight:600}.ck .l .t span{font-size:12px;color:var(--texte2)}
.ck .l .ac{font-size:12px;font-weight:700;white-space:nowrap;align-self:center;padding:5px 10px;border-radius:999px;background:var(--zone)}
.ck-t{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}
.gar{display:flex;gap:8px;align-items:center;font-size:12px;color:var(--texte2);padding:10px 12px;border-radius:16px;background:var(--zone)}
.gar .ic{width:16px;height:16px}
.crit{display:flex;flex-direction:column;gap:10px}
.crit .c{display:flex;flex-direction:column;gap:5px}
.crit .c .h{display:flex;justify-content:space-between;font-size:13px}.crit .c .h b{font-weight:600}.crit .c .h span{color:var(--texte2);font-size:12px}
.crit .c .j{height:7px;border-radius:4px;background:var(--piste);overflow:hidden}.crit .c .j i{display:block;height:100%;border-radius:4px;background:var(--g-accent)}
.crit .c p{font-size:12px;color:var(--texte2)}
.obj{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--texte2)}
.obj b{color:var(--texte);font-weight:600}.obj a{margin-left:auto;font-weight:600;color:var(--texte)}
.cont{display:flex;gap:12px;align-items:center;padding:12px}
.cont .vign{width:70px;height:56px;border-radius:14px;overflow:hidden;flex:none}.cont .vign svg{width:100%;height:100%}
.cont .t{flex:1;min-width:0}.cont .t b{display:block;font-size:13.5px;line-height:1.3}.cont .t span{font-size:12px;color:var(--texte2)}
.raccs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.raccs a{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11.5px;font-weight:500;text-align:center;padding:12px 4px}
.raccs .cases{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:var(--zone)}
.raccs .c1{background:var(--g-former)}.raccs .c2{background:var(--g-accomp)}.raccs .c3{background:var(--g-oppo)}
.chips-f{display:flex;gap:8px;overflow:hidden}
.chips-f .puce{white-space:nowrap}
.res-l{font-size:12.5px;color:var(--texte2)}
.bt.pl{flex-direction:row;width:auto;padding:0 24px;border-radius:999px;gap:8px}.sheet>.bt.pl{width:100%;flex:none}.sombre .od-top .bi{background:rgba(255,255,255,.92);color:#0F3F37}.bt.m.pl{padding:0 20px}
'''

def ic_ok(): return ic("valider","xs")

ETAPE_JOB = f'''<div class="verre carte etape compacte"><div class="corps"><span class="anneau"><b>70 %</b></span><div style="flex:1"><span class="k"><i></i>Prochaine étape</span><h3>Ajoutez 2 compétences</h3></div><a class="bt p s">{ic("suivant","xs")}</a></div></div>'''
OBJ = lambda o: f'<div class="obj">{ic("cap","xs")}Objectif : <b>{o}</b><a>Modifier</a></div>'
CONT = f'''<div class="verre cont"><span class="vign">{FORM["cv"]}</span><div class="t"><b>Écrire un CV qui décroche un entretien</b><span>Module 2 sur 5 · reste 8 min</span><span class="barre" style="margin-top:6px"><i style="width:40%"></i></span></div><a class="bt p s">{ic("suivant","xs")}</a></div>'''
RACCS = f'''<div class="verre raccs"><a><span class="cases c2">{ic("cv","s")}</span>Mes CV</a><a><span class="cases c3">{ic("favori","s")}</span>Enregistrées</a><a><span class="cases c1">{ic("certificat","s")}</span>Attestations</a><a><span class="cases">{ic("profil","s")}</span>Profil</a></div>'''

# 1. Pour moi, objectif « trouver un emploi » (page entière)
PM_JOB = phone(f'''{tete("Bonjour, Grâce")}
{OBJ("Trouver un emploi")}
{ETAPE_JOB}
{groupe3()}
<div class="sec-t"><h2>Continuer à apprendre</h2><a>Apprendre</a></div>
{CONT}
<div class="sec-t"><h2>Accès rapide</h2></div>
{RACCS}''', 'accueil', 'long')

# 2. Pour moi, objectif « développer mes compétences » : les formations passent devant
PM_SKILL = phone(f'''{tete("Bonjour, Grâce")}
{OBJ("Développer mes compétences")}
{formation('cv','Reprendre','Écrire un CV qui décroche un entretien','Module 2 sur 5 · Employabilité','8 min', barre=40)}
<div class="sec-t"><h2>Pour vos objectifs</h2><a>Tout voir</a></div>
<div class="defile">{formation('numerique','Numérique','Excel pour le travail','6 modules','1 h','mini')}{formation('entretien','Entretien','Réussir son entretien','5 modules','40 min','mini')}{formation('savoir','Savoir-être','Travailler en équipe','4 modules','30 min','mini')}</div>
{groupe3()}''', 'accueil', 'long')

# 3. Offres : liste « Pour vous »
OFFRES = phone(f'''{tete("Offres")}
<div class="verre rech">{ic("recherche","s")}<span>Poste, entreprise, compétence</span><a class="f">{ic("filtres","s")}<b>2</b></a></div>
<div class="seg"><span class="on">Pour vous</span><span>Récentes</span><span>Enregistrées</span></div>
<div class="res-l">Classées selon votre profil. Toutes les offres restent visibles.</div>
{offre('baobab','BF','sap','Analyste de données junior','Baobab Fintech','Kinshasa',['CDI','Hybride'],86)}
{offre('mwinda','ME','amb','Analyste énergie solaire','Mwinda Énergie','Kinshasa',['CDI'],79,True)}
{offre('fleuve','FB','mer','Chargée d’études marketing','Fleuve Banque','Kinshasa',['CDI'],72)}''', 'opportunites')

# 4. Offres : filtres en feuille
FILTRES = phone(f'''{tete("Offres")}
<div class="verre rech">{ic("recherche","s")}<span>Poste, entreprise, compétence</span><a class="f">{ic("filtres","s")}<b>2</b></a></div>
{offre('baobab','BF','sap','Analyste de données junior','Baobab Fintech','Kinshasa',['CDI','Hybride'],86)}''', 'opportunites',
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Filtrer les offres</h3>
<div class="champ"><label>Domaine</label><div class="puces"><span class="puce on">Data et finance</span><span class="puce">Énergie</span><span class="puce">Marketing</span><span class="puce">{ic("plus","xs")}Autre</span></div></div>
<div class="champ"><label>Lieu</label><div class="puces"><span class="puce on">Kinshasa</span><span class="puce">Lubumbashi</span><span class="puce">À distance</span></div></div>
<div class="champ"><label>Contrat</label><div class="puces"><span class="puce on">CDI</span><span class="puce">CDD</span><span class="puce">Stage</span><span class="puce">Freelance</span></div></div>
<div class="champ"><label>Expérience</label><div class="puces"><span class="puce">Sans expérience</span><span class="puce on">Junior</span><span class="puce">Confirmé</span></div></div>
<div class="li" style="border:0;padding:0;min-height:44px"><div class="t"><b>Entreprises vérifiées seulement</b></div><span class="sw"></span></div>
<div class="f-act"><a class="bt sec m">Effacer</a><a class="bt p m pl">Voir 24 offres</a></div></div>''')

# 5. Détail d'une offre, haut de page
def od_haut():
    return f'''<div class="od-ban">{BAN["baobab"]}</div><div class="od-top">{bi("retour")}<span style="display:flex;gap:8px">{bi("partager")}{bi("favori")}</span></div>
<div class="od-id"><span class="lg-e sap">BF</span><h2>Analyste de données junior</h2>
<div class="ent">Baobab Fintech · Kinshasa <span class="verif">{ic("valider","xs")}Vérifiée</span></div></div>
<div class="tags"><span class="tag">CDI</span><span class="tag">Hybride</span><span class="tag">Junior</span><span class="tag">Avant le 30 oct.</span></div>'''
BARRE_P = f'''<div class="verre fort barre-p"><span class="gratuit">Postuler est toujours gratuit.</span><a class="bi">{ic("favori","s")}</a><a class="bt a pl">{ic("envoyer","s")}Postuler</a></div>'''
OD1 = phone(f'''{od_haut()}
<div class="verre sc-c"><span class="anneau"><b>86 %</b></span><div class="t"><b>Compatible avec votre profil</b><span>6 compétences sur 8 · lieu et contrat</span></div><a class="pq">{ic("pourquoi")}Pourquoi ?</a></div>
<div class="verre prep">{orbi(40)}<div class="t"><b>Préparer ma candidature</b><span>Ce qui correspond, ce qui manque</span></div>{ic("suivant","s")}</div>
<div class="verre bloc-t"><h4>Missions</h4><ul><li>Suivre les indicateurs des agences</li><li>Construire les tableaux de bord Power BI</li><li>Présenter les résultats chaque mois</li></ul></div>''',
 'opportunites', avec_nav=False, bas=BARRE_P)

# 6. Détail d'une offre, bas de page (Match & Grow, vérification, signaler)
OD2 = phone(f'''<div class="tete sec" style="padding-top:4px">{bi("retour")}<h1 style="font-size:17px">Analyste de données junior</h1>{bi("favori")}</div>
<div class="verre bloc-t"><h4>Compétences demandées</h4><div class="cmp"><span>{ic_ok()}Power BI</span><span>{ic_ok()}Excel</span><span>{ic_ok()}SQL</span><span>{ic_ok()}Présentation</span><span class="m">SQL avancé</span><span class="m">Python</span></div></div>
<div class="verre mg"><span class="vign">{FORM["numerique"]}</span><div class="t"><small>Pour progresser</small><b>SQL : jointures et sous-requêtes</b><span>45 min · votre score passerait à 91 %</span></div>{ic("suivant","s")}</div>
<div class="verre bloc-t"><h4>Profil recherché</h4><ul><li>Bac + 3 en statistique, économie ou informatique</li><li>Français courant, anglais lu</li></ul></div>
<div class="verre vf"><span class="cases" style="width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:var(--g-accomp);flex:none">{ic("confidentialite","s")}</span><div class="t"><b>Entreprise vérifiée par Jumanly</b><span>Existence et adresse e-mail professionnelle contrôlées le 2 octobre. Jumanly ne vous demandera jamais d’argent pour postuler.</span></div></div>
<a class="sig">{ic("aide","xs")}Signaler cette offre</a>''',
 'opportunites', avec_nav=False, bas=BARRE_P)

# 7. Préparer ma candidature (Orbi, en feuille sur l'offre)
PREP = phone(f'''{od_haut()}''', 'opportunites', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div>
<div class="or-tete">{orbi(40)}<div class="t"><b>Préparer ma candidature</b><span>Analyste de données junior · Baobab Fintech</span></div></div>
<span class="ck-t">Ce qui correspond</span>
<div class="ck"><div class="l ok"><i>{ic_ok()}</i><div class="t"><b>Power BI, Excel, SQL</b><span>Dans votre CV « Data · octobre »</span></div></div>
<div class="l ok"><i>{ic_ok()}</i><div class="t"><b>Kinshasa, CDI, hybride</b><span>Vos préférences</span></div></div></div>
<span class="ck-t">À compléter</span>
<div class="ck"><div class="l ko"><i>{ic("plus","xs")}</i><div class="t"><b>SQL avancé</b><span>Demandé, absent de votre CV</span></div><a class="ac">Ajouter</a></div>
<div class="l ko"><i>{ic("plus","xs")}</i><div class="t"><b>Une réalisation chiffrée</b><span>Ex. « 12 agences suivies »</span></div><a class="ac">Ajouter</a></div></div>
<a class="bt p pl">{ic("cv","s")}Adapter mon CV à cette offre</a>
<div class="gar">{ic("cadenas","s")}Rien n’est modifié ni envoyé sans votre accord.</div></div>''')

# 8. Pourquoi 86 % ?
POURQUOI = phone(f'''{od_haut()}''', 'opportunites', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Pourquoi 86 % ?</h3><p class="ss">Calcul fixe, le même pour tous. Votre nom, âge, genre ou photo n’entrent jamais dans le score.</p>
<div class="crit">
<div class="c"><div class="h"><b>Compétences</b><span>6 sur 8</span></div><span class="j"><i style="width:75%"></i></span><p>Il manque SQL avancé et Python.</p></div>
<div class="c"><div class="h"><b>Expérience</b><span>Junior demandé</span></div><span class="j"><i style="width:100%"></i></span><p>1 an et 6 mois d’expérience.</p></div>
<div class="c"><div class="h"><b>Lieu et contrat</b><span>Correspondent</span></div><span class="j"><i style="width:100%"></i></span></div>
<div class="c"><div class="h"><b>Langues</b><span>Français, anglais</span></div><span class="j"><i style="width:90%"></i></span></div></div>
<div class="gar">{ic("pourquoi","s")}Le recruteur décide. Ce score ne bloque jamais votre candidature.</div>
<a class="bt sec pl">Contester ce score</a></div>''')

ECR = [
 ('t1','1 · Pour moi','La page d’accueil change selon l’objectif choisi à l’inscription. Une seule prochaine étape, puis l’essentiel.',
  [ecrans((PM_JOB,'Objectif : trouver un emploi','Prochaine étape, 3 offres, formation en cours, accès rapide.'),(PM_SKILL,'Objectif : développer mes compétences','Les formations passent devant, les offres ensuite.'))]),
 ('t2','2 · Offres','Pour vous, Récentes, Enregistrées. Les candidatures sont dans Suivi.',
  [ecrans((OFFRES,'Liste','Trois offres à l’écran, score et « Pourquoi ? ».'),(FILTRES,'Filtres','Domaine, lieu, contrat, expérience, entreprises vérifiées.'))]),
 ('t3','3 · Détail d’une offre','Tout se décide ici : le score, la préparation avec Orbi, la formation qui comble l’écart, la vérification. Postuler reste en bas, toujours visible.',
  [ecrans((OD1,'Haut de page','Score, Préparer ma candidature, missions.'),(OD2,'Bas de page','Compétences, formation pour progresser, vérification, signalement.'))]),
 ('t4','4 · Orbi dans l’offre','Orbi s’ouvre en feuille, au-dessus de l’offre, sans changer de page.',
  [ecrans((PREP,'Préparer ma candidature','Ce qui correspond, ce qui manque, adapter le CV. Rien n’est envoyé sans accord.'),(POURQUOI,'Pourquoi 86 % ?','Les critères, sans données personnelles. Contestation possible.'))]),
 ('t5','5 · Mode sombre','Les mêmes écrans sur fond Nuit.',
  [ecrans((sombre(PM_JOB),'Pour moi',''),(sombre(OD1),'Détail d’une offre',''),(sombre(PREP),'Préparer ma candidature',''))]),
]
som = ''.join(f'<li><a href="#{i}">{t.split(" · ")[1]}</a></li>' for i, t, _, _ in ECR)
corps = ''.join(bloc(i, t, d, *p) for i, t, d, p in ECR)
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Refonte mobile · talent, lot 1</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>{open(H + '/fondations.css').read()}{CSS}</style></head><body>
<header class="couv"><span class="k">{orbi(22)}Jumanly · refonte mobile · étape 2</span><h1>Talent, lot 1 : trouver et préparer une offre</h1>
<p>18 octobre 2026. Pour moi, Offres et le détail d’une offre, d’après l’audit validé : barre Pour moi · Offres · Orbi · Apprendre · Suivi. Contenus fictifs.</p>
<ul class="som">{som}</ul></header>{corps}<p class="fin">Jumanly · Learn. Grow. Connect.</p></body></html>'''
out = os.path.join(H, '..', 'refonte-mobile-talent-1.html')
open(out, 'w').write(html); print(out, len(html))
