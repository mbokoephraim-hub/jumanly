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
.tap{position:relative;outline:2.5px solid #FF6B3D;outline-offset:3px}
.tap::after{content:attr(data-n);position:absolute;top:-9px;right:-9px;z-index:3;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#FF6B3D;color:#fff;font:700 12px/22px Sora,sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.seg span.tap{outline-offset:0}.liste:has(.tap){overflow:visible}
.acces{display:flex;gap:10px}.acces a{flex:1;display:flex;align-items:center;gap:8px;padding:12px 14px;border-radius:20px;font-size:13px;font-weight:600}
.acces a b{margin-left:auto;font-size:11px;padding:2px 8px;border-radius:999px;background:var(--lime-c)}
.legende{display:flex;gap:10px;align-items:center;font-size:13px;color:#5B6B68;margin-top:10px}
.legende i{width:22px;height:22px;border-radius:11px;background:#FF6B3D;color:#fff;font:700 12px/22px Sora;text-align:center;font-style:normal}
.legende,.chemins,.planche-att{width:100%}.chemins{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:12px;margin-top:20px}
.chemin{background:#fff;border-radius:22px;padding:16px 18px;display:flex;flex-direction:column;gap:10px}
.chemin h4{font-size:14px;font-weight:600}
.chemin .ch-et{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12.5px}
.chemin .ch-et span{padding:5px 10px;border-radius:999px;background:#F2EDE5}
.chemin .ch-et span.n{background:#FF6B3D;color:#fff;font-weight:700;padding:5px 9px}
.chemin .ch-et em{font-style:normal;color:#5B6B68}
.filtres-l{display:flex;gap:8px;flex-wrap:nowrap;overflow:hidden}
.acc{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:var(--lime-c)}.acc.st{background:var(--ambre-c)}
.parc-h{display:flex;flex-direction:column;gap:8px;padding:18px;background:var(--g-former)}
.parc-h .k{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.parc-h h2{font-size:21px;font-weight:600;letter-spacing:-.02em;line-height:1.2}
.parc-h p{font-size:12.5px;color:var(--texte2)}
.etapes-p{display:flex;flex-direction:column}
.etapes-p .e{display:flex;gap:12px;position:relative;padding-bottom:12px}
.etapes-p .e::before{content:"";position:absolute;left:15px;top:32px;bottom:0;width:2px;background:var(--piste)}
.etapes-p .e:last-child::before{display:none}
.etapes-p .e .num{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;background:var(--zone);flex:none;z-index:1}
.etapes-p .e .num.ok{background:var(--sapin);color:var(--lime)}.etapes-p .e .num.en{background:var(--g-accent);color:#0F3F37}
.sombre .etapes-p .e .num.ok{background:var(--lime);color:#0F3F37}
.etapes-p .e .verre{flex:1;padding:12px 14px;border-radius:20px}
.etapes-p .e b{display:block;font-size:13.5px}.etapes-p .e span{font-size:12px;color:var(--texte2)}
.consigne{padding:16px;display:flex;flex-direction:column;gap:8px}
.consigne h4{font-size:15px;font-weight:600}.consigne ol{margin:0;padding-left:18px;font-size:13px;color:var(--texte2);display:flex;flex-direction:column;gap:4px}
.depot{display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px;border-radius:22px;border:1.5px dashed rgba(15,63,55,.28);text-align:center;font-size:13px}
.sombre .depot{border-color:rgba(255,255,255,.25)}
.depot .cases{width:44px;height:44px;border-radius:15px;display:grid;place-items:center;background:var(--g-accomp)}
.depot span{font-size:12px;color:var(--texte2)}
.res-q{display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px;text-align:center}
.res-q .anneau{width:84px;height:84px}.res-q .anneau b{width:68px;height:68px;font-size:18px}
.res-q h3{font-size:18px;font-weight:600}.res-q p{font-size:12.5px;color:var(--texte2)}
.att-c{display:flex;flex-direction:column;gap:0;overflow:hidden;padding:0}
.att-c img{display:block;width:100%;height:auto}
.att-c .t{padding:12px 14px;display:flex;align-items:center;gap:10px}
.att-c .t div{flex:1}.att-c .t b{display:block;font-size:13.5px}.att-c .t span{font-size:11.5px;color:var(--texte2)}
.code{font-size:11.5px;font-weight:700;letter-spacing:.06em;padding:4px 10px;border-radius:999px;background:var(--zone)}
.partage{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.partage a{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11.5px;font-weight:500;text-align:center}
.partage .cases{width:52px;height:52px;border-radius:18px;display:grid;place-items:center;background:var(--zone)}
.lien{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:18px;background:var(--zone);font-size:12.5px}
.lien span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v-ok{display:flex;flex-direction:column;align-items:center;gap:10px;padding:22px 18px;text-align:center;background:linear-gradient(150deg,#F2FCE6,#DDF6EE)}
.sombre .v-ok{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.v-ok .rond-ok{width:64px;height:64px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37}
.v-ok .rond-ok .ic{width:30px;height:30px}
.v-ok h3{font-size:18px;font-weight:600}.v-ok p{font-size:12.5px;color:var(--texte2)}
.v-ko{display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:18px;background:var(--corail-c);font-size:12.5px}
.site-t{display:flex;align-items:center;justify-content:space-between;padding:8px 0}
.site-t .lgo{display:flex;align-items:center;gap:8px;font-weight:600;font-size:17px}
.planche-att{display:flex;flex-direction:column;gap:18px;margin-top:22px}
.planche-att img{display:block;width:100%;max-width:1260px;border-radius:14px;box-shadow:0 20px 50px -24px rgba(15,63,55,.45)}
.secu{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.secu div{background:#fff;border-radius:20px;padding:14px 16px;font-size:13px;color:#5B6B68}.secu b{display:block;color:#0F3F37;font-size:14px;margin-bottom:4px}
.zooms{display:grid;grid-template-columns:1fr 1fr;gap:14px}.zooms img{width:100%;border-radius:12px}

.res{display:flex;gap:10px;align-items:center}
.res .ic{width:18px;height:18px}
'''

def fo_ligne(ban, t, s_, barre=None, dr=None):
    b = f'<span class="barre" style="margin-top:6px"><i style="width:{barre}%"></i></span>' if barre is not None else ''
    d = f'<span class="v">{dr}</span>' if dr else ''
    return f'<div class="verre cont"><span class="vign">{FORM[ban]}</span><div class="t"><b>{t}</b><span>{s_}</span>{b}</div>{d}</div>'

# 1. Apprendre : accueil et catalogue
APP = phone(f'''{tete("Apprendre")}
<div class="verre rech tap" data-n="4">{ic("recherche","s")}<span>Rechercher une formation</span><a class="f">{ic("filtres","s")}</a></div>
<div class="acces"><a class="verre tap" data-n="2">{ic("lecon","s")}Formations<b>2</b></a><a class="verre tap" data-n="3">{ic("certificat","s")}Attestations<b>3</b></a></div>
<div class="tap" data-n="1" style="border-radius:var(--r-carte)">{formation('cv','Reprendre','Écrire un CV qui décroche un entretien','Module 2 sur 5 · Employabilité','8 min', barre=40)}</div>
<div class="sec-t"><h2>Par domaine</h2><a>Tout voir</a></div>
<div class="domaines"><span class="dom d1"><span class="cases">{ic("cv","s")}</span>Employabilité</span><span class="dom d2"><span class="cases">{ic("progression","s")}</span>Numérique</span><span class="dom d3"><span class="cases">{ic("connexion","s")}</span>Savoir-être</span><span class="dom d4"><span class="cases">{ic("entreprise","s")}</span>Métiers</span></div>
<div class="sec-t"><h2>Recommandées pour vous</h2><a>Tout voir</a></div>
<div class="defile">{formation('numerique','Numérique','Excel pour le travail','6 modules','1 h','mini tap" data-n="5')}{formation('entretien','Entretien','Réussir son entretien','5 modules','40 min','mini')}{formation('savoir','Savoir-être','Travailler en équipe','4 modules','30 min','mini')}</div>''', 'former', 'long')

# 2. Mes formations
MES = phone(f'''{tete_f("Mes formations", droite=None)}
<div class="seg"><span class="on">En cours<small>2</small></span><span>Terminées<small>3</small></span><span>Enregistrées</span></div>
{fo_ligne('cv','Écrire un CV qui décroche un entretien','Module 2 sur 5 · reste 8 min',40)}
{fo_ligne('numerique','SQL : jointures et sous-requêtes','Module 1 sur 3 · reste 30 min',15)}
<div class="sec-t"><h2>À faire</h2></div>
<div class="verre liste lignes">
<div class="li tap" data-n="6"><span class="cases c1">{ic("quiz","s")}</span><div class="t"><b>Quiz · Le bon format de CV</b><span>5 questions</span></div>{ic("suivant")}</div>
<div class="li tap" data-n="7"><span class="cases c3">{ic("realisation","s")}</span><div class="t"><b>Exercice · Mon CV en une page</b><span>À rendre quand vous voulez</span></div>{ic("suivant")}</div></div>
<div class="verre liste lignes"><div class="li"><span class="cases c2">{ic("certificat","s")}</span><div class="t"><b>Mes attestations</b><span>3 obtenues · vérifiables en ligne</span></div>{ic("suivant")}</div></div>''', avec_nav=False)

# 3. Détail d'une formation
FD = phone(f'''<div class="fd-ban">{FORM["numerique"]}</div><div class="od-top">{bi("retour")}<span style="display:flex;gap:8px">{bi("partager")}{bi("favori")}</span></div>
<div class="fd-id"><span class="k">Numérique · Débutant</span><h2>Excel pour le travail</h2></div>
<div class="verre chiffres"><div><b>1 h</b>au total</div><div><b>6</b>modules</div><div><b>Oui</b>attestation</div></div>
<div class="verre bloc-t"><h4>Vous saurez</h4><div class="cmp"><span>Tableaux croisés</span><span>Formules SI, RECHERCHEV</span><span>Graphiques</span></div></div>
<div class="verre liste modl">
<div class="li"><span class="num">1</span><div class="t"><b>Les bases d’un tableau</b><span>8 min · vidéo et exercice</span></div></div>
<div class="li"><span class="num">2</span><div class="t"><b>Les formules utiles</b><span>12 min · quiz</span></div></div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt a pl tap" data-n="8">{ic("lecon","s")}Commencer la formation</a></div>')

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
SALLE = phone(f'''<div class="video">{VID}<span class="ret">{bi("retour")}</span><span class="q tap" data-n="10">Auto · 360p</span><span class="play">{ic("suivant","l")}</span><div class="bv"><span>3:12</span><span class="pist"><i></i></span><span>8:20</span></div></div>
<div class="lec-t"><small>Module 2 · Leçon 2 sur 4</small><h2>Les formules SI et RECHERCHEV</h2></div>
<div class="seg"><span class="on">Leçon</span><span>Texte</span><span>Notes</span><span class="tap" data-n="11">Fichiers</span></div>
<p class="texte-l">La formule <mark>SI</mark> teste une condition et renvoie une valeur si elle est vraie, une autre sinon. On l’utilise pour classer une agence selon son objectif.</p>
<div class="verre prep tap" data-n="9">{orbi(40)}<div class="t"><b>Expliquer cette notion</b><span>Orbi répond avec un exemple</span></div>{ic("suivant","s")}</div>''', avec_nav=False,
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
<div class="verre att"><span class="med">{ic("certificat")}</span><h3>Excel pour le travail</h3><p>Réussie le 18 octobre · score au quiz final 9/10</p><div class="bts" style="justify-content:center"><a class="bt sec s tap" data-n="12">{ic("profil","xs")}Voir l’attestation</a></div></div>
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

import base64 as _b64
AT = '/mnt/project-files/maquettes-ui/refonte-mobile/attestation/'
def _img(n): return 'data:image/jpeg;base64,' + _b64.b64encode(open(AT + n, 'rb').read()).decode()
MINI = _img('mini-attestation.jpg')

# Recherche dans le catalogue
RECH = phone(f"""{tete_f("Rechercher", droite=None)}
<div class="verre rech focus">{ic("recherche","s")}<span style="color:var(--texte)">excel</span><a class="f">{ic("filtres","s")}<b>1</b></a></div>
<div class="filtres-l"><span class="puce on">Gratuit</span><span class="puce">Débutant</span><span class="puce">Moins d’1 h</span><span class="puce">Numérique</span></div>
<div class="res-l">4 formations</div>
{fo_ligne('numerique','Excel pour le travail','Numérique · 1 h · 6 modules')}
{fo_ligne('numerique','Tableaux croisés en 30 min','Numérique · 30 min · 3 modules')}
{fo_ligne('cv','Présenter ses chiffres','Employabilité · 45 min · 4 modules')}
<div class="verre carte sugg">{orbi(36)}<div class="t"><small>Orbi suggère</small><b>Le parcours « Premier emploi en bureau » réunit ces formations.</b><div><a class="bt sec s tap" data-n="13">Voir le parcours</a></div></div></div>""", avec_nav=False)

# Parcours de formation
PARC = phone(f"""{tete_f("Parcours", droite="partager")}
<div class="verre parc-h"><span class="k">Parcours · 4 formations</span><h2>Premier emploi en bureau</h2><p>3 h 30 au total · une attestation de parcours à la fin</p><span class="barre"><i style="width:35%"></i></span></div>
<div class="etapes-p">
<div class="e"><span class="num ok">{ic("valider","xs")}</span><div class="verre"><b>Écrire un CV qui décroche un entretien</b><span>Terminée · attestation obtenue</span></div></div>
<div class="e"><span class="num en">2</span><div class="verre"><b>Excel pour le travail</b><span>Module 3 sur 6 · reprendre</span></div></div>
<div class="e"><span class="num">3</span><div class="verre"><b>Présenter ses chiffres</b><span>45 min</span></div></div>
<div class="e"><span class="num">4</span><div class="verre"><b>Réussir son entretien</b><span>40 min</span></div></div></div>""", avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Continuer le parcours</a></div>')

# Exercice à rendre
EXO = phone(f"""{tete_f("Exercice")}
<div class="verre consigne"><h4>Mon CV en une page</h4><ol><li>Reprenez votre CV actuel.</li><li>Gardez 3 expériences et 5 compétences au plus.</li><li>Ajoutez un résultat chiffré par expérience.</li></ol></div>
<div class="depot"><span class="cases">{ic("telecharger","s")}</span><b>Déposer mon fichier</b><span>PDF ou photo, 5 Mo au plus</span></div>
<div class="verre pj"><span class="cases" style="background:var(--g-former)">{ic("cv","s")}</span><div class="t"><b>Ou choisir un de mes CV</b><span>Data · octobre</span></div>{ic("suivant","s")}</div>
<div class="verre carte sugg">{orbi(36)}<div class="t"><small>Orbi peut relire</small><b>Il vous dit ce qui manque. Il ne fait pas l’exercice à votre place.</b></div></div>""", avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Rendre l’exercice</a></div>')

# Quiz non réussi
QKO = phone(f"""{tete_f("Résultat du quiz", droite="fermer")}
<div class="verre res-q"><span class="anneau" style="background:conic-gradient(#F2B33D 60%,var(--piste) 0)"><b>3/5</b></span><h3>Presque !</h3><p>Il faut 4 bonnes réponses sur 5 pour valider ce module.</p></div>
<span class="ck-t">À revoir</span>
<div class="verre liste lignes">
<div class="li"><span class="cases c1">{ic("lecon","s")}</span><div class="t"><b>Leçon 2 · La formule SI</b><span>4 min · question 3</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("lecon","s")}</span><div class="t"><b>Leçon 3 · RECHERCHEV</b><span>5 min · question 5</span></div>{ic("suivant")}</div></div>""", avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Revoir</a><a class="bt p pl">Recommencer le quiz</a></div>')

# Mes attestations
def att_c(t, s_, code, n=None):
    tp = f' tap" data-n="{n}' if n else ''
    return f'<div class="verre att-c{tp}"><img src="{MINI}" alt=""><div class="t"><div><b>{t}</b><span>{s_}</span></div><span class="code">{code}</span></div></div>'
ATTS = phone(f"""{tete_f("Mes attestations", droite=None)}
{att_c('Excel pour le travail','Réussie le 18 oct. 2026 · 90 %','JMN-7K4P-2QX9', 14)}
{att_c('Écrire un CV qui décroche un entretien','Réussie le 4 oct. 2026 · 100 %','JMN-3HD8-W1TQ')}""", avec_nav=False)

# Détail d'une attestation
ATT_D = phone(f"""{tete_f("Attestation", droite="plus-options")}
<div class="verre att-c"><img src="{MINI}" alt=""></div>
<div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("certificat","s")}</span><div class="t"><b>N° JMN-7K4P-2QX9</b><span>Délivrée le 18 oct. 2026 · signée par Jumanly</span></div></div>
<div class="li"><span class="cases c1">{ic("profil","s")}</span><div class="t"><b>Visible sur mon profil</b><span>Les recruteurs la voient</span></div><span class="sw on"></span></div></div>
<div class="bts"><a class="bt sec m pl tap" data-n="15">{ic("telecharger","s")}PDF</a><a class="bt p m pl tap" data-n="16">{ic("partager","s")}Partager</a></div>
<div class="gar">{ic("confidentialite","s")}Chacun peut vérifier cette attestation avec son numéro ou son code QR.</div>""", avec_nav=False)

# Partager
PART = phone(f"""{tete_f("Attestation", droite="plus-options")}
<div class="verre att-c"><img src="{MINI}" alt=""></div>""", avec_nav=False,
 bas=f"""<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Partager mon attestation</h3>
<div class="partage"><a><span class="cases">{ic("connexion","s")}</span>LinkedIn</a><a><span class="cases">{ic("message","s")}</span>WhatsApp</a><a><span class="cases">{ic("message","s")}</span>E-mail</a><a><span class="cases">{ic("telecharger","s")}</span>Image</a></div>
<div class="lien">{ic("partager","s")}<span>jumanly.io/attestations/JMN-7K4P-2QX9</span><a class="bt sec s">Copier</a></div>
<div class="gar">{ic("confidentialite","s")}Le lien montre seulement votre nom, la formation et la date.</div></div>""")

# Vérification publique
VERIF = phone(f"""<div class="site-t"><span class="lgo"><svg viewBox="0 0 120 120" width="30" height="30"><rect width="120" height="120" rx="30" fill="#0F3F37"/><g transform="translate(2.25 -4.35) scale(1.1)"><path d="M70 55 V70 A19 19 0 0 1 33.15 76.50" fill="none" stroke="#fff" stroke-width="17" stroke-linecap="round"/><circle cx="70" cy="31" r="11.5" fill="#A6F26B"/></g></svg>jumanly</span><span class="code">Vérifier</span></div>
<div class="verre v-ok"><span class="rond-ok">{ic("valider")}</span><h3>Attestation authentique</h3><p>Délivrée par Jumanly. La signature numérique correspond.</p></div>
<div class="verre liste lignes">
<div class="li"><div class="t"><span>Titulaire</span><b>Grâce Mbuyi</b></div></div>
<div class="li"><div class="t"><span>Formation</span><b>Excel pour le travail · 1 h</b></div></div>
<div class="li"><div class="t"><span>Résultat et date</span><b>90 % · 18 octobre 2026</b></div></div>
<div class="li"><div class="t"><span>Numéro</span><b>JMN-7K4P-2QX9</b></div></div></div>
<div class="v-ko">{ic("aide","s")}<span>Si le nom ou la date diffèrent du document reçu, celui-ci a été modifié.</span></div>""", avec_nav=False)

CHEMINS = [
 ('Reprendre une formation', ['Onglet Apprendre', ('1','Reprendre'), 'Salle de cours']),
 ('Trouver une formation', ['Onglet Apprendre', ('4','Rechercher'), 'Résultats', ('5','une carte'), 'Détail', ('8','Commencer')]),
 ('Suivre un parcours', ['Rechercher', ('13','Voir le parcours'), 'Parcours', 'Continuer']),
 ('Faire un quiz ou un exercice', ['Apprendre', ('2','Mes formations'), ('6','Quiz') , 'ou', ('7','Exercice')]),
 ('Se faire expliquer une notion', ['Salle de cours', ('9','Expliquer cette notion'), 'Orbi en feuille']),
 ('Économiser les données', ['Salle de cours', ('10','Auto · 360p'), 'Réglages de la leçon', 'ou', ('11','Fichiers'), 'PDF']),
 ('Retrouver une attestation', ['Fin de formation', ('12','Voir l’attestation'), 'ou Apprendre', ('3','Attestations'), ('14','une attestation')]),
 ('Télécharger ou partager', ['Attestation', ('15','PDF'), 'ou', ('16','Partager'), 'LinkedIn, WhatsApp, lien']),
 ('Vérifier une attestation', ['Code QR ou lien', 'Page publique', 'Authentique ou modifiée']),
]
def chemins():
    h = ''
    for t, et in CHEMINS:
        e = ''
        for i, x in enumerate(et):
            if isinstance(x, tuple): e += f'<span class="n">{x[0]}</span><span>{x[1]}</span>'
            elif x in ('ou', 'ou Apprendre'): e += f'<em>{x}</em>'
            else: e += f'<span>{x}</span>'
            if i < len(et) - 1 and not (isinstance(x, str) and x.startswith('ou')) and not (isinstance(et[i+1], str) and et[i+1].startswith('ou')): e += '<em>→</em>'
        h += f'<div class="chemin"><h4>{t}</h4><div class="ch-et">{e}</div></div>'
    return f'<div class="legende"><i>1</i>Les pastilles orange montrent où l’on appuie. Elles ne font pas partie de l’interface.</div><div class="chemins">{h}</div>'

SECU = [
 ('Numéro unique', 'JMN-XXXX-XXXX, imprimé en haut, dans le micro-texte et dans le code QR.'),
 ('Signature numérique', 'Empreinte calculée par Jumanly sur le nom, la formation, le score et la date. Toute modification la rend fausse.'),
 ('Signature dessinée', 'Tracé généré à partir de l’empreinte : chaque attestation a le sien.'),
 ('Fond guilloché', 'Rosace et bandes de lignes fines, calculées à partir de l’empreinte. Une photocopie les brouille.'),
 ('Micro-texte', 'Une ligne de 3,6 points tout autour du cadre, illisible sans zoom, qui répète le numéro.'),
 ('Sceau d’originalité', '« Attestation validée · sceau d’originalité » autour du symbole Jumanly.'),
 ('Code QR', 'Ouvre la page publique de vérification : authentique, révoquée ou introuvable.'),
 ('PDF verrouillé', 'Texte non modifiable, métadonnées signées. La preuve reste la vérification en ligne.'),
]
SECTION_ATT = f"""<div class="planche-att"><img src="{_img('apercu-attestation.jpg')}" alt="Attestation de réussite Jumanly, A4 paysage">
<div class="zooms"><img src="{_img('zoom-securite.jpg')}" alt="Micro-texte et guilloches"><img src="{_img('zoom-signature-sceau.jpg')}" alt="Signature, sceau et code QR"></div>
<div class="secu">{''.join(f'<div><b>{t}</b>{x}</div>' for t, x in SECU)}</div></div>"""

ECR = [
 ('a0','0 · Comment on y arrive','Chaque écran porte des pastilles numérotées sur l’élément où l’on appuie. Voici les chemins.', []),
 ('a1','1 · Apprendre','Reprendre en premier, puis l’accès à mes formations et attestations, les domaines et les recommandées.',
  [ecrans((APP,'Accueil Apprendre','① Reprendre ② Mes formations ③ Attestations ④ Rechercher ⑤ Une carte.'),(MES,'Mes formations','⑥ Quiz ⑦ Exercice.'),(RECH,'Rechercher','Filtres, résultats, ⑬ parcours suggéré.'),(PARC,'Parcours','Les formations dans l’ordre, une attestation de parcours.'))]),
 ('a2','2 · Détail d’une formation','Une formule supérieure ne bloque jamais le premier module.',
  [ecrans((FD,'Formation ouverte','⑧ Commencer.'),(FD2,'Suite dans une formule','Premier module gratuit.'))]),
 ('a3','3 · Salle de cours','La vidéo, la leçon, Orbi qui explique, les exercices.',
  [ecrans((SALLE,'Leçon','⑨ Expliquer ⑩ Qualité vidéo ⑪ Fichiers.'),(ORB_L,'Orbi dans la leçon','Il répond d’après la leçon.'),(EXO,'Exercice','Déposer un fichier ou choisir un CV. Orbi relit, sans faire à votre place.'))]),
 ('a4','4 · Quiz','Une question à la fois, l’explication tout de suite, et une seconde chance ciblée.',
  [ecrans((QUIZ,'Question','Bonne réponse expliquée.'),(QKO,'Non réussi','Les leçons à revoir, puis recommencer.'))]),
 ('a5','5 · Après la formation','Attestation, compétence au profil, offre plus accessible.',
  [ecrans((FIN,'Formation terminée','⑫ Voir l’attestation.'),(DEBIT,'Faible débit','Qualité automatique, économie, PDF, reprise.'))]),
 ('a6','6 · L’attestation','Le modèle PDF, A4 paysage, généré pour chaque réussite. Tous les éléments de sécurité sont calculés à partir de son numéro et de sa signature numérique.', []),
 ('a7','7 · Attestations dans l’application','Retrouver, télécharger, partager, faire vérifier.',
  [ecrans((ATTS,'Mes attestations','⑭ Une attestation.'),(ATT_D,'Détail','⑮ PDF ⑯ Partager.'),(PART,'Partager','LinkedIn, WhatsApp, e-mail, image, lien.'),(VERIF,'Vérification publique','Ce que voit un recruteur qui scanne le code.'))]),
 ('a8','8 · Mode sombre','',
  [ecrans((sombre(APP),'Apprendre',''),(sombre(SALLE),'Leçon',''),(sombre(ATT_D),'Attestation',''))]),
]
EXTRA = {'a0': chemins(), 'a6': SECTION_ATT}
som = ''.join(f'<li><a href="#{i}">{t.split(" · ")[1]}</a></li>' for i, t, _, _ in ECR)
corps = ''.join(bloc(i, t, d, *p).replace('</div></section>', EXTRA.get(i, '') + '</div></section>') if i in EXTRA else bloc(i, t, d, *p) for i, t, d, p in ECR)
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Refonte mobile · talent, lot 3</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>{open(H + '/fondations.css').read()}{CSS}{CSS2}{CSS3L}</style></head><body>
<header class="couv"><span class="k">{orbi(22)}Jumanly · refonte mobile · étape 2</span><h1>Talent, lot 3 : apprendre</h1>
<p>18 octobre 2026. Chemins de navigation, Apprendre, recherche, parcours, détail, salle de cours avec Orbi, exercice, quiz, attestation PDF sécurisée, partage et vérification. Contenus fictifs.</p>
<ul class="som">{som}</ul></header>{corps}<p class="fin">Jumanly · Learn. Grow. Connect.</p></body></html>'''
out = os.path.join(H, '..', 'refonte-mobile-talent-3.html')
exec(open(H + '/sans_tap.py').read()); html = sans_tap(html)
open(out, 'w').write(html); print(out, len(html))
