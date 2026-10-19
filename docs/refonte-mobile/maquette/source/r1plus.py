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

# ---------- v2.1 (19/10, retours d'Ephraïm) : PDF de l'offre, couleurs par offre, historique, aperçu complet ----------
CSSR += '''
.off-c{position:relative;overflow:hidden;padding-left:20px!important}
.off-c:before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--oc)}
.off-c.oc1{--oc:#A6F26B;--oct:#F1FBE6}.off-c.oc2{--oc:#2FD3A6;--oct:#E3F7F0}.off-c.oc3{--oc:#F5B83D;--oct:#FEF4DE}.off-c.oc4{--oc:#9DB8E8;--oct:#EEF3FB}
.off-c.oc1,.off-c.oc2,.off-c.oc3,.off-c.oc4{background:linear-gradient(165deg,var(--oct) 0,var(--plein) 70%)}
.sombre .off-c{background:linear-gradient(165deg,color-mix(in srgb,var(--oc) 16%,transparent) 0,rgba(255,255,255,.04) 70%)!important}
.sombre .off-c .ico svg{color:#0F3F37!important;stroke:#0F3F37!important}
.off-c .ico{width:38px;height:38px;border-radius:13px;flex:none;display:grid;place-items:center;background:var(--oc);color:#0F3F37}
.off-c .stp.pub{background:var(--oc)!important;color:#0F3F37!important}
.off-c .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.off-c .kp div{background:var(--plein);border-radius:14px;padding:8px 4px;text-align:center;font-size:10.5px;color:var(--texte2);box-shadow:inset 0 0 0 1px var(--trait)}
.sombre .off-c .kp div{background:rgba(255,255,255,.05)}
.off-c .kp b{display:block;font-size:16px;color:var(--texte)}
.off-c .kp div.nv b{color:#2E8540}.sombre .off-c .kp div.nv b{color:#A6F26B}
.off-c .b{white-space:nowrap}
.off-c .b .bt{height:34px;padding:0 14px;font-size:12.5px;background:#0F3F37;color:#fff}
.sombre .off-c .b .bt{background:#A6F26B;color:#0F3F37}
.val-b{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:var(--plein);box-shadow:inset 0 0 0 1px var(--trait);font-size:12px;color:var(--texte2)}
.sombre .val-b{background:rgba(255,255,255,.05)}
.val-b b{display:block;color:var(--texte);font-size:13px}
.hist2{display:flex;flex-direction:column}
.hist2 .h{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid var(--trait)}
.hist2 .h:first-child{border-top:0;padding-top:2px}
.hist2 .h .cases{width:32px;height:32px;border-radius:11px;flex:none;display:grid;place-items:center;color:#0F3F37}.hist2 .h .cases.k-msg{background:#DCE8FB}.hist2 .h .cases.k-cand{background:#C8F0E2}.hist2 .h .cases.k-mod{background:#FBE9C2}.hist2 .h .cases.k-pub{background:#D9F6C4}.sombre .hist2 .h .cases{color:#E8EFEC;background:rgba(255,255,255,.08)}
.od-h{position:relative;overflow:hidden;padding-left:22px!important}.od-h:before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:#A6F26B}
.hist2 .h .t{flex:1;min-width:0;font-size:12.5px;line-height:1.35}
.hist2 .h .t b{font-weight:600}
.hist2 .h .t small{display:block;color:var(--texte2);font-size:11px;margin-top:2px}
.hist2 .h .ty{font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
.ty.msg{background:#DCE8FB;color:#24467A}.ty.mod{background:#FBE9C2;color:#6B4A0C}.ty.pubh{background:#D9F6C4;color:#0F3F37}.ty.cand{background:#C8F0E2;color:#0F3F37}
.sombre .ty.msg{background:rgba(157,184,232,.22);color:#C9DAF7}.sombre .ty.mod{background:rgba(245,184,61,.2);color:#F8D58C}.sombre .ty.pubh{background:rgba(166,242,107,.18);color:#C9F5A6}.sombre .ty.cand{background:rgba(47,211,166,.18);color:#9EEBD3}
.hist2 .bul{margin-top:6px;padding:8px 10px;border-radius:12px 12px 12px 4px;background:#EAF1FB;font-size:12px;color:var(--texte)}
.sombre .hist2 .bul{background:rgba(157,184,232,.12)}
.pdf-f{display:flex;gap:12px;align-items:center;padding:12px 14px}
.pdf-f .th{width:46px;height:60px;border-radius:8px;flex:none;background:#fff;box-shadow:0 4px 12px -6px rgba(15,63,55,.4),inset 0 0 0 1px #E5E0D7;padding:6px 5px;display:flex;flex-direction:column;gap:3px;position:relative}
.pdf-f .th i{display:block;height:3px;border-radius:2px;background:#DAD4CA}.pdf-f .th i.h{height:6px;width:70%;background:#0F3F37}
.pdf-f .th em{position:absolute;right:-6px;bottom:-6px;font-style:normal;font-size:8.5px;font-weight:800;background:#D64933;color:#fff;border-radius:5px;padding:2px 4px}
.pdf-f .t{flex:1;min-width:0}.pdf-f .t b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pdf-f .t span{font-size:11.5px;color:var(--texte2)}
.pdf-f .bts{display:flex;gap:6px}
.lect{flex:1;min-height:600px;padding-bottom:16px!important;display:flex;flex-direction:column;align-items:center;gap:10px;padding:14px 0 0;margin:0 -16px;background:#2B3431;border-radius:22px 22px 0 0}
.lect .pg{width:322px;background:#fff;border-radius:4px;box-shadow:0 18px 40px -16px rgba(0,0,0,.6);padding:18px 18px 16px;display:flex;flex-direction:column;gap:7px;color:#1A2724;font-size:9.4px;line-height:1.5}
.lect .pg .hd{display:flex;align-items:center;gap:8px;padding-bottom:8px;border-bottom:2px solid #A6F26B}
.lect .pg .hd .lg{width:22px;height:22px;border-radius:6px;background:#0F3F37;color:#A6F26B;font-weight:800;font-size:8px;display:grid;place-items:center}
.lect .pg .hd b{font-size:9px}.lect .pg .hd span{margin-left:auto;color:#6A7470;font-size:7.5px}
.lect .pg h4{margin:4px 0 0;font-size:14px;color:#0F3F37;line-height:1.15}
.lect .pg .mt{color:#6A7470}
.lect .pg h5{margin:4px 0 0;font-size:9.5px;color:#0F3F37;text-transform:uppercase;letter-spacing:.06em}
.lect .pg ul{margin:0;padding-left:12px}
.lect .pg .chx{display:flex;gap:4px;flex-wrap:wrap}.lect .pg .chx span{padding:2px 6px;border-radius:99px;background:#EEF8E4;font-size:7.8px}
.lect .pg .chx span.s{background:#F1EEE8}
.lect .nav-p{display:flex;gap:8px;align-items:center;color:#E8EFEC;font-size:12px}
.lect .nav-p a{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.12)}
.ap-sec{padding:12px 14px;display:flex;flex-direction:column;gap:6px;font-size:12px}
.ap-sec h4{margin:0;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}
.ap-sec ul{margin:0;padding-left:16px;display:flex;flex-direction:column;gap:3px}
.ap-sec .chx{display:flex;gap:6px;flex-wrap:wrap}
.ap-sec .chx span{padding:4px 10px;border-radius:999px;background:var(--lime-c);font-size:11.5px;font-weight:600}
.ap-sec .chx span.s{background:var(--zone);font-weight:500}
.ap-sec + .ap-sec{border-top:1px solid var(--trait)}
.ap-all{padding:0;display:flex;flex-direction:column}
'''

_offc_old = offc
def offc(t, org, lieu, tags, pub, lim, n, st, stc, nv=None, c='oc1', vues='', ent=''):
    tg = ''.join(f'<span class="tag">{x}</span>' for x in tags)
    h = f'<div class="h"><span class="ico">{ic("offre","s")}</span><div class="t"><b>{t}</b><span>{org} · {lieu}</span></div><a class="bi">{ic("plus-options","s")}</a></div><div class="m"><span class="stp {stc}">{st}</span>{tg}</div>'
    if stc == 'val':
        return f'''<div class="verre off-c oc4">{h}<div class="val-b">{ic("horloge","s")}<div><b>Vérification par Jumanly</b>Envoyée le 18 octobre<br>Réponse sous 24 heures</div></div></div>'''
    return f'''<div class="verre off-c {c}">{h}
<div class="kp"><div><b>{n}</b>candidatures</div><div class="nv"><b>{nv or 0}</b>nouvelles</div><div><b>{vues}</b>vues</div><div><b>{ent}</b>entretiens</div></div>
<div class="b"><span>Publiée {pub}</span><span>Limite {lim}</span><span class="sp"></span><a class="bt">Candidatures</a></div></div>'''

OC_A = offc("Analyste de données junior","Baobab Fintech","Kinshasa",["CDI","Hybride"],"le 2 oct.","31 oct.",24,"Publiée","pub",4,'oc1','1 240','2')
OC_B = offc("Chargé de clientèle","Baobab Fintech","Lubumbashi",["CDD","Sur site"],"le 9 oct.","9 nov.",11,"Publiée","pub",2,'oc2','610','1')
OC_C = offc("Comptable confirmé","Baobab Fintech","Kinshasa",["CDI","Sur site"],"le 14 oct.","14 nov.",7,"Publiée","pub",3,'oc3','380','0')
OC_V = offc("Responsable conformité","Baobab Fintech","Kinshasa",["CDI"],"—","—",0,"En validation","val")

import re as _re
_OLD_A = _offc_old("Analyste de données junior","Baobab Fintech","Kinshasa",["CDI","Hybride"],"le 2 oct.","31 oct.",24,"Publiée","pub",4)
def _swap_off(x, new):
    assert _OLD_A in x
    return x.replace(_OLD_A, new, 1)
AT = _swap_off(AT, OC_A)
OFF_MENU = _swap_off(OFF_MENU, OC_A)

OFFRES = phone(f'''{tete_r("Mes offres")}
<div class="verre rech">{ic("recherche","s")}<span>Rechercher une offre</span><a class="f">{ic("filtres","s")}</a></div>
<a class="bt a bt-pub">{ic("plus","s")}Créer une offre</a>
<div class="filtres-h"><span class="puce on">Actives<small>4</small></span><span class="puce">Brouillons<small>1</small></span><span class="puce">En pause<small>1</small></span><span class="puce">Clôturées</span><span class="puce">Expirées</span></div>
{OC_A}
{OC_B}
{OC_C}
{OC_V}''', 'offre', 'long')

# Historique : chaque événement a son type (message, modification, publication, candidature)
def hev(icn, cls, ty, tyc, txt, quand, bul=''):
    b = f'<div class="bul">{bul}</div>' if bul else ''
    return f'<div class="h"><span class="cases {cls}">{ic(icn,"s")}</span><div class="t">{txt}<small>{quand}</small>{b}</div><span class="ty {tyc}">{ty}</span></div>'
HIST2 = ('<div class="hist2">'
 + hev("message","k-msg","Message","msg","<b>Nadia K.</b> a écrit à 4 candidats","Aujourd’hui 9:12","« Merci pour votre candidature, nous revenons vers vous vendredi. »")
 + hev("candidats","k-cand","Candidature","cand","<b>Amani M.</b> a postulé","Hier 18:40")
 + hev("modifier","k-mod","Modification","mod","<b>Nadia K.</b> a prolongé la date limite au 31 oct.","12 oct.")
 + hev("valider","k-pub","Publication","pubh","Offre publiée après vérification","2 oct.")
 + '</div>')
OD_R2 = _re.sub(r'<div class="hist-l">.*?</div>', HIST2, OD_R2, count=1, flags=_re.S)

# PDF de l'offre : joint par le recruteur, lu dans Jumanly, téléchargeable par les talents
PDF_F = f'''<div class="verre pdf-f"><span class="th"><i class="h"></i><i></i><i></i><i style="width:60%"></i><i></i><i style="width:80%"></i><em>PDF</em></span><div class="t"><b>Fiche-Analyste-donnees.pdf</b><span>2 pages · 340 Ko · vérifié</span></div><div class="bts"><a class="bt sec s">Lire</a></div></div>'''
CR3 = CR3.replace('<div class="champ"><label>Instructions pour les candidats</label>', f'''<span class="lab-c">Fiche de poste en PDF (facultatif)</span>
{PDF_F}
<div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> a lu la fiche et propose de compléter 3 responsabilités. Vous relisez avant d’appliquer.</div><a class="bt sec s">Voir</a></div>
<div class="champ"><label>Instructions pour les candidats</label>''', 1)

CR4 = phone(f'''{cr_t(4)}
<h2 class="h2s">Vérifier et publier</h2>
<div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> a relu l’offre : claire, complète, aucun critère discriminant.</div></div>
<div class="verre apercu-o"><span class="ban">{BAN["baobab"]}</span><div class="c"><b>Analyste de données junior</b><span>Baobab Fintech · Kinshasa · CDI · Hybride · 1 poste</span></div></div>
<div class="verre ap-all">
<div class="ap-sec"><h4>Description</h4>Vous rejoignez l’équipe data pour suivre l’activité des 12 agences et aider les directions à décider.</div>
<div class="ap-sec"><h4>Responsabilités</h4><ul><li>Concevoir et tenir à jour les tableaux de bord des agences</li><li>Produire le rapport mensuel d’activité</li><li>Fiabiliser les données avec l’équipe IT</li></ul></div>
<div class="ap-sec"><h4>Critères</h4><div class="chx"><span>✓ SQL</span><span>✓ Power BI</span><span class="s">Python · souhaité</span><span class="s">0 à 2 ans</span></div></div>
<div class="ap-sec"><h4>Documents demandés</h4><div class="chx"><span>CV</span><span>Lettre</span></div></div>
<div class="ap-sec"><h4>Question</h4>Êtes-vous disponible avant le 1er décembre ?</div>
<div class="ap-sec"><h4>Fiche de poste</h4>{PDF_F.replace('verre pdf-f','pdf-f" style="padding:0')}</div></div>
<div class="manq">{ic("aide","s")}<span><b>Salaire non indiqué.</b> Facultatif, mais les offres avec salaire reçoivent plus de candidatures.</span></div>
<div class="ok-l">{ic("valider","s")}Organisation vérifiée : publication immédiate</div>
<div class="verre quota-b">{ic("offre","s")}<div class="t"><b>Offres actives : 4 sur 5</b>Après publication : 5 sur 5</div></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Brouillon</a><a class="bt a pl">{ic("envoyer","s")}Publier</a></div>')

PDF_V = phone(f'''{tete_f("Fiche de poste", droite="telecharger")}
<div class="lect"><div class="pg">
<div class="hd"><span class="lg">BF</span><b>Baobab Fintech</b><span>Kinshasa · octobre 2026</span></div>
<h4>Analyste de données junior</h4><span class="mt">CDI · Hybride · 1 poste · candidatures jusqu’au 31 octobre</span>
<h5>Le poste</h5>Au sein de l’équipe data, vous suivez l’activité des 12 agences et préparez les chiffres qui aident les directions à décider.
<h5>Responsabilités</h5><ul><li>Concevoir et tenir à jour les tableaux de bord des agences</li><li>Produire le rapport mensuel d’activité</li><li>Fiabiliser les données avec l’équipe IT</li><li>Répondre aux demandes ponctuelles des directions</li></ul>
<h5>Profil recherché</h5><div class="chx"><span>SQL · indispensable</span><span>Power BI · indispensable</span><span class="s">Python · souhaité</span><span class="s">0 à 2 ans</span></div>
<h5>Pour postuler</h5>CV et lettre, sur Jumanly. La candidature est gratuite.
</div><div class="nav-p"><a>{ic("retour","s")}</a>Page 1 sur 2<a>{ic("suivant","s")}</a></div></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">{ic("telecharger","s")}PDF</a><a class="bt p pl">Postuler</a></div>')

OD_R = OD_R.replace(f'{sect("cap","oppo","Compétences recherchées","5", ferme=True)}', f'{sect("cap","oppo","Compétences recherchées","5", ferme=True)}{sect("document","accomp","Fiche de poste PDF","2 pages", ferme=True)}', 1)

CSSR += ".off-c .m{align-items:center}.off-c .m .stp{font-size:11.5px;padding:4px 10px}\n"
