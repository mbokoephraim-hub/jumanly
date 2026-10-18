# Refonte mobile · étape 2, lot 3 : Apprendre (18/10/2026).
# python3 talent3.py && node shot.js talent-3
import os
H = os.path.dirname(os.path.abspath(__file__))
exec(open(H + '/talent2.py').read().split("\n# 1. Étape 1 : le CV")[0])   # aides + CSS des lots 1 et 2

CSS3L = '''
.domaines{display:flex;gap:8px;overflow:hidden}
.dom{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:76px;padding:12px 6px;border-radius:20px;font-size:11.5px;font-weight:600;text-align:center}
.dom .cases{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:rgba(255,255,255,.7)}
.dom.d1{background:var(--g-former)}.dom.d2{background:var(--g-accomp)}.dom.d3{background:var(--g-oppo)}.dom.d4{background:linear-gradient(150deg,#E8F1FB,#B9D5F2)}
.sombre .dom.d4{background:linear-gradient(150deg,rgba(120,170,230,.24),rgba(120,170,230,.08))}.sombre .dom .cases{background:rgba(255,255,255,.1)}
.fd-ban{margin:-46px -16px 0;height:200px;position:relative;overflow:hidden}.fd-ban svg{width:100%;height:100%}
.fd-id{display:flex;flex-direction:column;gap:8px}
.fd-id .k{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}
.fd-id h2{font-size:22px;font-weight:600;letter-spacing:-.02em;line-height:1.2}
.chiffres{display:grid;grid-template-columns:repeat(3,1fr);padding:12px 6px}
.chiffres div{text-align:center;font-size:11.5px;color:var(--texte2)}.chiffres div b{display:block;font-size:15px;color:var(--texte)}
.chiffres div+div{border-left:1px solid var(--trait)}
.modl .li{min-height:58px}
.modl .num{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;background:var(--zone);flex:none}
.modl .num.ok{background:var(--sapin);color:var(--lime)}.modl .num.en{background:var(--g-accent);color:#0F3F37}
.sombre .modl .num.ok{background:var(--lime);color:#0F3F37}
.video{margin:-46px -16px 0;height:236px;position:relative;background:#0B1A1F;overflow:hidden}
.video svg{width:100%;height:100%;opacity:.9}
.video .play{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.92);display:grid;place-items:center;color:#0F3F37}
.video .bv{position:absolute;left:14px;right:14px;bottom:12px;display:flex;align-items:center;gap:10px;color:#fff;font-size:11.5px}
.video .bv .pist{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.3)}.video .bv .pist i{display:block;height:100%;width:38%;border-radius:2px;background:var(--lime)}
.video .q{position:absolute;right:12px;top:58px;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.18);color:#fff}
.video .ret{position:absolute;left:12px;top:52px}
.phone .video .ret .bi{background:rgba(11,26,31,.45);color:#fff;box-shadow:0 0 0 1px rgba(255,255,255,.25)}
.lec-t{display:flex;flex-direction:column;gap:4px}
.lec-t small{font-size:11.5px;color:var(--texte2)}.lec-t h2{font-size:18px;font-weight:600;letter-spacing:-.01em;line-height:1.25}
.texte-l{font-size:13.5px;line-height:1.55;color:var(--texte2)}
.texte-l mark{background:var(--lime-c);color:var(--texte);padding:1px 3px;border-radius:4px}
.nav-l{display:flex;gap:10px}
.nav-l .bt{flex:1}
.quiz-o{display:flex;flex-direction:column;gap:8px}
.quiz-o .o{display:flex;gap:12px;align-items:center;padding:14px 16px;border-radius:20px;background:var(--plein);box-shadow:var(--verre);font-size:13.5px}
.quiz-o .o i{width:26px;height:26px;border-radius:50%;flex:none;display:grid;place-items:center;font-style:normal;font-size:12px;font-weight:700;background:var(--zone)}
.quiz-o .o.ok{box-shadow:0 0 0 2px #3DA14F,var(--verre)}.quiz-o .o.ok i{background:#3DA14F;color:#fff}
.quiz-o .o.ko{box-shadow:0 0 0 2px var(--corail),var(--verre)}.quiz-o .o.ko i{background:var(--corail);color:#fff}
.expl{padding:14px 16px;border-radius:20px;background:var(--lime-c);font-size:13px;display:flex;flex-direction:column;gap:4px}
.expl b{font-size:13.5px}
.att{display:flex;flex-direction:column;align-items:center;gap:10px;padding:22px 18px;text-align:center;background:linear-gradient(150deg,#F7FDEE,#DDF6EE)}
.sombre .att{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.att .med{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;background:var(--g-accent);box-shadow:var(--halo);color:#0F3F37}
.att .med .ic{width:34px;height:34px}
.att h3{font-size:17px;font-weight:600}.att p{font-size:12.5px;color:var(--texte2)}
.ajoute{display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);font-size:13px}
.ajoute .ic{width:18px;height:18px;color:#3DA14F}
.dl{display:flex;gap:12px;align-items:center;padding:12px 14px}
.dl .t{flex:1}.dl .t b{display:block;font-size:13.5px}.dl .t span{font-size:12px;color:var(--texte2)}
.verrou{display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:18px;background:var(--ambre-c);font-size:12.5px}
.verrou .t{flex:1}.verrou b{display:block;font-size:13px}
.od-top .bi{box-shadow:0 6px 16px -4px rgba(15,63,55,.3)}
.res{display:flex;gap:10px;align-items:center}
.res .ic{width:18px;height:18px}
'''

def fo_ligne(ban, t, s_, barre=None, dr=None):
    b = f'<span class="barre" style="margin-top:6px"><i style="width:{barre}%"></i></span>' if barre is not None else ''
    d = f'<span class="v">{dr}</span>' if dr else ''
    return f'<div class="verre cont"><span class="vign">{FORM[ban]}</span><div class="t"><b>{t}</b><span>{s_}</span>{b}</div>{d}</div>'

# 1. Apprendre : accueil et catalogue
APP = phone(f'''{tete("Apprendre")}
<div class="verre rech">{ic("recherche","s")}<span>Rechercher une formation</span><a class="f">{ic("filtres","s")}</a></div>
{formation('cv','Reprendre','Écrire un CV qui décroche un entretien','Module 2 sur 5 · Employabilité','8 min', barre=40)}
<div class="sec-t"><h2>Par domaine</h2><a>Tout voir</a></div>
<div class="domaines"><span class="dom d1"><span class="cases">{ic("cv","s")}</span>Employabilité</span><span class="dom d2"><span class="cases">{ic("progression","s")}</span>Numérique</span><span class="dom d3"><span class="cases">{ic("connexion","s")}</span>Savoir-être</span><span class="dom d4"><span class="cases">{ic("entreprise","s")}</span>Métiers</span></div>
<div class="sec-t"><h2>Recommandées pour vous</h2><a>Tout voir</a></div>
<div class="defile">{formation('numerique','Numérique','Excel pour le travail','6 modules','1 h','mini')}{formation('entretien','Entretien','Réussir son entretien','5 modules','40 min','mini')}{formation('savoir','Savoir-être','Travailler en équipe','4 modules','30 min','mini')}</div>''', 'former', 'long')

# 2. Mes formations
MES = phone(f'''{tete_f("Mes formations", droite=None)}
<div class="seg"><span class="on">En cours<small>2</small></span><span>Terminées<small>3</small></span><span>Enregistrées</span></div>
{fo_ligne('cv','Écrire un CV qui décroche un entretien','Module 2 sur 5 · reste 8 min',40)}
{fo_ligne('numerique','SQL : jointures et sous-requêtes','Module 1 sur 3 · reste 30 min',15)}
<div class="sec-t"><h2>À faire</h2></div>
<div class="verre liste lignes">
<div class="li"><span class="cases c1">{ic("quiz","s")}</span><div class="t"><b>Quiz · Le bon format de CV</b><span>5 questions</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c3">{ic("realisation","s")}</span><div class="t"><b>Exercice · Mon CV en une page</b><span>À rendre quand vous voulez</span></div>{ic("suivant")}</div></div>
<div class="verre liste lignes"><div class="li"><span class="cases c2">{ic("certificat","s")}</span><div class="t"><b>Mes attestations</b><span>3 obtenues · vérifiables en ligne</span></div>{ic("suivant")}</div></div>''', avec_nav=False)

# 3. Détail d'une formation
FD = phone(f'''<div class="fd-ban">{FORM["numerique"]}</div><div class="od-top">{bi("retour")}<span style="display:flex;gap:8px">{bi("partager")}{bi("favori")}</span></div>
<div class="fd-id"><span class="k">Numérique · Débutant</span><h2>Excel pour le travail</h2></div>
<div class="verre chiffres"><div><b>1 h</b>au total</div><div><b>6</b>modules</div><div><b>Oui</b>attestation</div></div>
<div class="verre bloc-t"><h4>Vous saurez</h4><div class="cmp"><span>Tableaux croisés</span><span>Formules SI, RECHERCHEV</span><span>Graphiques</span></div></div>
<div class="verre liste modl">
<div class="li"><span class="num">1</span><div class="t"><b>Les bases d’un tableau</b><span>8 min · vidéo et exercice</span></div></div>
<div class="li"><span class="num">2</span><div class="t"><b>Les formules utiles</b><span>12 min · quiz</span></div></div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt a pl">{ic("lecon","s")}Commencer la formation</a></div>')

# 4. Détail, formation d'un niveau supérieur à la formule
FD2 = phone(f'''<div class="fd-ban">{FORM["entretien"]}</div><div class="od-top">{bi("retour")}<span style="display:flex;gap:8px">{bi("partager")}{bi("favori")}</span></div>
<div class="fd-id"><span class="k">Employabilité · Intermédiaire</span><h2>Réussir son entretien</h2></div>
<div class="verre chiffres"><div><b>40 min</b>au total</div><div><b>5</b>modules</div><div><b>Oui</b>attestation</div></div>
<div class="verre liste modl">
<div class="li"><span class="num ok">{ic("valider","xs")}</span><div class="t"><b>Se présenter en 2 minutes</b><span>Gratuit · 6 min</span></div></div>
<div class="li"><span class="num">2</span><div class="t"><b>Les questions difficiles</b><span>9 min</span></div>{ic("cadenas","s")}</div>
<div class="li"><span class="num">3</span><div class="t"><b>Négocier son salaire</b><span>8 min</span></div>{ic("cadenas","s")}</div></div>
<div class="verrou">{ic("cadenas","s")}<div class="t"><b>Suite incluse dès la formule Starter</b>Le premier module reste gratuit.</div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Module gratuit</a><a class="bt p pl">Voir les formules</a></div>')

# 5. Salle de cours
VID = svg('<rect width="390" height="236" fill="#123A33"/><circle cx="300" cy="40" r="110" fill="#1C5247"/><rect x="22" y="78" width="130" height="96" rx="10" fill="#F7FDEE"/><g fill="#3DA14F"><rect x="38" y="132" width="16" height="30" rx="3"/><rect x="60" y="116" width="16" height="46" rx="3"/><rect x="82" y="126" width="16" height="36" rx="3"/></g><rect x="104" y="100" width="16" height="62" rx="3" fill="#A6F26B"/><circle cx="300" cy="150" r="34" fill="#E9C9A8"/><path d="M262 236c4-34 22-48 38-48s34 14 38 48z" fill="#2B5B52"/><circle cx="300" cy="140" r="20" fill="#5A3A2A"/>', '0 0 390 236')
SALLE = phone(f'''<div class="video">{VID}<span class="ret">{bi("retour")}</span><span class="q">Auto · 360p</span><span class="play">{ic("suivant","l")}</span><div class="bv"><span>3:12</span><span class="pist"><i></i></span><span>8:20</span></div></div>
<div class="lec-t"><small>Module 2 · Leçon 2 sur 4</small><h2>Les formules SI et RECHERCHEV</h2></div>
<div class="seg"><span class="on">Leçon</span><span>Texte</span><span>Notes</span><span>Fichiers</span></div>
<p class="texte-l">La formule <mark>SI</mark> teste une condition et renvoie une valeur si elle est vraie, une autre sinon. On l’utilise pour classer une agence selon son objectif.</p>
<div class="verre prep">{orbi(40)}<div class="t"><b>Expliquer cette notion</b><span>Orbi répond avec un exemple</span></div>{ic("suivant","s")}</div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bi" style="width:54px;height:54px">{ic("retour","s")}</a><a class="bt p pl">Leçon suivante</a></div>')

# 6. Orbi dans la leçon
ORB_L = phone(f'''<div class="video">{VID}<span class="ret">{bi("retour")}</span><span class="q">Auto · 360p</span></div>
<div class="lec-t"><small>Module 2 · Leçon 2 sur 4</small><h2>Les formules SI et RECHERCHEV</h2></div>''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div>
<div class="or-tete">{orbi(40)}<div class="t"><b>Orbi</b><span>Dans cette leçon · Excel pour le travail</span></div></div>
<div class="bulle-u">Je ne comprends pas RECHERCHEV.</div>
<div class="bulle-o">{orbi(32)}<div class="verre corps"><span>Imaginez un annuaire : vous cherchez un nom, il vous donne le numéro de la même ligne. RECHERCHEV fait pareil dans un tableau.</span><span class="source">D’après la leçon 2 de cette formation.</span><div class="acts"><a class="bt sec s">Un autre exemple</a><a class="bt sec s">Me tester</a></div></div></div>
<div class="verre compo"><span>Poser une question</span><a class="bi">{ic("micro","s")}</a><a class="bi env">{ic("envoyer","s")}</a></div></div>''')

# 7. Quiz
QUIZ = phone(f'''{tete_f("Quiz · Module 2")}{pas(3,5)}
<div class="verre q"><small>Question 3 sur 5</small><b>Quelle formule renvoie « Atteint » si les ventes dépassent 100 ?</b></div>
<div class="quiz-o"><div class="o"><i>A</i>=RECHERCHEV(100;A2;1)</div><div class="o ok"><i>{ic("valider","xs")}</i>=SI(B2&gt;100;"Atteint";"Non")</div><div class="o"><i>C</i>=SOMME(B2;100)</div></div>
<div class="expl"><b>Bonne réponse</b>SI teste la condition B2 &gt; 100, puis renvoie le premier texte si elle est vraie.</div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Question suivante</a></div>')

# 8. Formation terminée
FIN = phone(f'''{tete_f("Formation terminée", droite="fermer")}
<div class="verre att"><span class="med">{ic("certificat")}</span><h3>Excel pour le travail</h3><p>Réussie le 18 octobre · score au quiz final 9/10</p><div class="bts" style="justify-content:center"><a class="bt sec s">{ic("telecharger","xs")}PDF</a><a class="bt sec s">{ic("partager","xs")}Partager</a></div></div>
<span class="ck-t">Ajouté à votre profil</span>
<div class="ajoute">{ic("valider","s")}<span><b>Excel · tableaux croisés</b>, compétence vérifiée</span></div>
<div class="ajoute">{ic("valider","s")}<span>Attestation visible par les recruteurs</span></div>
<span class="ck-t">Et maintenant</span>
{offre('baobab','BF','sap','Analyste de données junior','Baobab Fintech','Kinshasa',['CDI'],91)}''', avec_nav=False)

# 9. Faible débit
DEBIT = phone(f'''{tete_f("Réglages de la leçon", droite="fermer")}
<div class="verre liste">
<div class="li"><span class="cases c2">{ic("lecon","s")}</span><div class="t"><b>Qualité vidéo</b><span>Automatique selon la connexion</span></div><span class="v">Auto</span>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("progression","s")}</span><div class="t"><b>Économiser les données</b><span>Vidéo en 240p, images allégées</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c3">{ic("document","s")}</span><div class="t"><b>Lire sans vidéo</b><span>Texte et images de la leçon</span></div><span class="sw"></span></div></div>
<div class="verre dl"><span class="cases" style="width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:var(--g-former)">{ic("telecharger","s")}</span><div class="t"><b>Support en PDF</b><span>1,2 Mo · hors connexion</span></div><a class="bt sec s">Télécharger</a></div>
<div class="gar">{ic("horloge","s")}Votre position est enregistrée : vous reprenez là où vous vous êtes arrêté, même après une coupure.</div>''', avec_nav=False)

ECR = [
 ('a1','1 · Apprendre','Reprendre en premier, puis les domaines et les formations recommandées. Le catalogue complet est dans la recherche.',
  [ecrans((APP,'Accueil Apprendre','Reprendre, domaines, recommandées.'),(MES,'Mes formations','En cours, à faire, attestations.'))]),
 ('a2','2 · Détail d’une formation','Ce que l’on saura faire, la durée, les modules, l’attestation. Une formule supérieure ne bloque jamais le premier module.',
  [ecrans((FD,'Formation ouverte','Compétences visées, modules, commencer.'),(FD2,'Suite dans une formule','Premier module gratuit, suite expliquée sans pression.'))]),
 ('a3','3 · Salle de cours','La vidéo, la leçon, Orbi qui explique, le quiz. Tout au même endroit.',
  [ecrans((SALLE,'Leçon','Vidéo adaptative, texte, notes, fichiers.'),(ORB_L,'Orbi dans la leçon','Il répond d’après la leçon et propose de s’entraîner.'),(QUIZ,'Quiz','Une question à la fois, l’explication tout de suite.'))]),
 ('a4','4 · Après la formation','L’attestation, la compétence ajoutée au profil, l’offre qui devient plus accessible.',
  [ecrans((FIN,'Formation terminée','Attestation, profil enrichi, une offre à 91 %.'),(DEBIT,'Faible débit','Qualité automatique, mode économie, PDF, reprise.'))]),
 ('a5','5 · Mode sombre','',
  [ecrans((sombre(APP),'Apprendre',''),(sombre(SALLE),'Leçon',''),(sombre(FIN),'Formation terminée',''))]),
]
som = ''.join(f'<li><a href="#{i}">{t.split(" · ")[1]}</a></li>' for i, t, _, _ in ECR)
corps = ''.join(bloc(i, t, d, *p) for i, t, d, p in ECR)
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Refonte mobile · talent, lot 3</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>{open(H + '/fondations.css').read()}{CSS}{CSS2}{CSS3L}</style></head><body>
<header class="couv"><span class="k">{orbi(22)}Jumanly · refonte mobile · étape 2</span><h1>Talent, lot 3 : apprendre</h1>
<p>18 octobre 2026. Accueil Apprendre, mes formations, détail, salle de cours avec Orbi, quiz, attestation et faible débit. Contenus fictifs.</p>
<ul class="som">{som}</ul></header>{corps}<p class="fin">Jumanly · Learn. Grow. Connect.</p></body></html>'''
out = os.path.join(H, '..', 'refonte-mobile-talent-3.html')
open(out, 'w').write(html); print(out, len(html))
