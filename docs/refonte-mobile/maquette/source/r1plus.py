# Recruteur lot 1, v2 du 19/10 : Orbi présent, écrans remplis. Chargé par recruteur1.py.
exec(open(H + '/r2plus.py').read().split('# ---------- Entretien : 1.')[0])
CSSR += '''
.actions-g .ag{min-height:64px;align-items:center}
.actions-g .ag .nb{font-size:24px!important;font-weight:700}
.actions-g .ag:nth-child(1){background:linear-gradient(150deg,#F2FCE6,#D9F6C4)}
.actions-g .ag:nth-child(2){background:linear-gradient(150deg,#FFF6E0,#FBE3B0)}
.actions-g .ag:nth-child(3){background:linear-gradient(150deg,#E6F8F2,#C8F0E2)}
.actions-g .ag:nth-child(4){background:linear-gradient(150deg,#EAF1FB,#D4E3F8)}
.sombre .actions-g .ag{background:rgba(255,255,255,.06)!important}
.sem{padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.sem .h{display:flex;justify-content:space-between;font-size:14px}.sem .h span{font-size:11.5px;color:var(--texte2)}
.sem .bars{display:flex;align-items:flex-end;gap:8px;height:84px}
.sem .bars div{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10.5px;color:var(--texte2);height:100%;justify-content:flex-end}
.sem .bars i{width:100%;border-radius:8px 8px 4px 4px;background:linear-gradient(180deg,#A6F26B,#2FD3A6)}
.sem .bars div.on i{background:linear-gradient(180deg,#1C6B5A,#0F3F37)}
.sombre .sem .bars div.on i{background:linear-gradient(180deg,#A6F26B,#5BE0B8)}
.tl-p{display:flex;flex-direction:column;padding:12px 16px;text-align:left}
.tl-p .e{display:flex;gap:12px;align-items:flex-start;font-size:12.5px;position:relative;padding-bottom:12px}
.tl-p .e:last-child{padding-bottom:0}
.tl-p .e:before{content:"";position:absolute;left:6px;top:14px;bottom:0;width:2px;background:var(--trait)}
.tl-p .e:last-child:before{display:none}
.tl-p .e i{width:14px;height:14px;border-radius:50%;flex:none;margin-top:2px;background:var(--trait)}
.tl-p .e.ok i{background:#2FD3A6}.tl-p .e.at i{background:#F5B83D}
.tl-p .e div{flex:1}.tl-p .e b{display:block;font-size:13px}.tl-p .e span{color:var(--texte2)}
.q3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.q3 div{padding:12px 8px;border-radius:18px;text-align:center;font-size:11px;color:var(--texte2)}
.q3 div b{display:block;font-size:20px;color:var(--texte)}
.ap-o{padding:0;overflow:hidden;text-align:left}
.ap-o .cv{height:58px;background:linear-gradient(130deg,#0F3F37,#1C6B5A);position:relative}
.ap-o .cv span{position:absolute;left:14px;bottom:-16px;width:40px;height:40px;border-radius:12px;background:#A6F26B;color:#0F3F37;display:grid;place-items:center;font-weight:700;font-size:12px;box-shadow:0 0 0 3px var(--plein)}
.ap-o .t{padding:22px 14px 12px;display:flex;flex-direction:column;gap:3px;font-size:11.5px;color:var(--texte2)}
.ap-o .t b{font-size:14px;color:var(--texte)}
.publie .contenu{justify-content:flex-start!important;padding-top:20px}
'''
ORB_AT = f'<div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> : Amani et Fatou ont toutes les compétences requises. Grâce passe en entretien mercredi.</div><a class="bt sec s">Voir</a></div>'
AT = AT.replace('<a class="bt a bt-pub">', ORB_AT + '<a class="bt a bt-pub">', 1)

AT_VIDE = AT_VIDE.replace('<span class="ck-t">Pour avancer</span>', f'''<div class="q3"><div class="verre"><b>12</b>candidatures cette semaine</div><div class="verre"><b>4</b>entretiens faits</div><div class="verre"><b>2</b>décisions prises</div></div>
<div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> a repéré 6 talents visibles proches de <b>Chargé de clientèle</b>. Vous décidez de les contacter.</div><a class="bt sec s">Voir</a></div>
<span class="ck-t">Pour avancer</span>''', 1)

CR1 = CR1.replace('<span class="stepper"><i>−</i><b>1</b><i>+</i></span></div>', f'''<span class="stepper"><i>−</i><b>1</b><i>+</i></span></div>
<div class="orbi-l">{orbi(26)}<div class="t">À l’étape 2, <b>Orbi</b> peut proposer la description à partir de l’intitulé.</div></div>''', 1)

CR3 = CR3.replace('<div class="gar">', f'''<div class="orbi-l">{orbi(26)}<div class="t">Question proposée : <b>« Avez-vous déjà utilisé Power BI ? »</b></div><a class="bt sec s">Ajouter</a></div>
<div class="gar">''', 1)

CR4 = CR4.replace('<h2 class="h2s">Vérifier et publier</h2>', f'''<h2 class="h2s">Vérifier et publier</h2>
<div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> a relu l’offre : claire, complète, aucun critère discriminant.</div></div>''', 1)

PUBLIE = PUBLIE.replace('<a class="bt txt">Retour à mes offres</a>', f'''<div class="verre ap-o"><div class="cv"><span>BF</span></div><div class="t"><b>Analyste de données junior</b>Baobab Fintech · Kinshasa · CDI · Hybride<span>Limite 31 oct. · Candidature gratuite</span></div></div>
<div class="verre tl-p"><div class="e ok"><i></i><div><b>Visible maintenant</b><span>Dans les offres et la recherche</span></div></div><div class="e at"><i></i><div><b>Premières candidatures</b><span>Dans À traiter, avec leur score</span></div></div><div class="e"><i></i><div><b>Résumé d’Orbi</b><span>Chaque matin, si vous l’activez</span></div></div></div>
<a class="bt txt">Retour à mes offres</a>''', 1)

OD_R2 = OD_R2.replace("<span style=\"font-size:11.5px;color:var(--texte2)\">Chiffres réels de l’offre, sans estimation.</span>",
 '<div class="sem" style="padding:6px 0 0"><div class="bars"><div><i style="height:30%"></i>L</div><div><i style="height:45%"></i>M</div><div><i style="height:38%"></i>M</div><div><i style="height:70%"></i>J</div><div><i style="height:55%"></i>V</div><div><i style="height:25%"></i>S</div><div class="on"><i style="height:90%"></i>D</div></div></div><span style="font-size:11.5px;color:var(--texte2)">Vues par jour. Chiffres réels de l’offre, sans estimation.</span>', 1)
_k = OD_R2.find('<div class="verre fort bas-f">')
OD_R2 = OD_R2[:_k].rsplit('</div>', 1)[0] + f'''<div class="orbi-l">{orbi(26)}<div class="t">Les offres avec un salaire reçoivent plus de candidatures. <b>Ajouter une fourchette ?</b></div><a class="bt sec s">Modifier</a></div></div>''' + OD_R2[_k:]

def _long(x): return x.replace('<div class="phone ', '<div class="phone long ', 1)
AT_VIDE, CR1, OD_R2 = _long(AT_VIDE), _long(CR1), _long(OD_R2)
