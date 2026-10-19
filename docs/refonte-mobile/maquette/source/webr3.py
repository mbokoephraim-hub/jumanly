# Version ordinateur et tablette · recruteur, lot 3 : Orbi, messages, compte, organisation, équipe, abonnement, rapports, paramètres, premiers pas (19/10/2026).
# python3 webr3.py && node shotw.js recruteur-3   (calendrier réel : le 22 octobre 2026 est un jeudi)
import os
H = os.path.dirname(os.path.abspath(__file__))
_r3 = open(H + '/recruteur3.py').read(); exec(_r3[:_r3.index('\nCHEMINS = [')])     # écrans et CSS du lot 3 recruteur (avec r3plus)
_K = (CSS2, CSS3L, CSS4, CSSR)
_s = open(H + '/web1.py').read(); exec(_s[:_s.index('\nECR = [')])
CSS2, CSS3L, CSS4, CSSR = _K
_w = open(H + '/webr1.py').read(); exec(_w[_w.index("CSSWR1 = '''"):_w.index('\n# ---------- 1. À traiter')])   # CSS du lot 1 web, R(), RT()
def _blk(f, n):
    s = open(H + '/' + f).read(); a = s.index(n + " = '''") + len(n) + 6; return s[a:s.index("'''", a)]
CSSW2 = _blk('web2.py', 'CSSW2'); CSSW4 = _blk('web4.py', 'CSSW4')     # messagerie 3 colonnes, menus, abonnement, paramètres, Orbi en page
_w4 = open(H + '/web4.py').read(); exec(_w4[_w4.index('def pub('):_w4.index('\nVIT = ')])           # cadres publics pub() et tpub()

CSSWR3 = '''
.tbl.jr .r{grid-template-columns:170px minmax(0,1fr) 150px 100px}
.tbl.jr .pc b{display:block;font-size:13.5px}.tbl.jr .pc small{font-size:12px;color:var(--texte2)}
.recap .tot{flex-direction:row;justify-content:space-between;align-items:baseline;padding:12px 0 0;border-top:1px solid var(--trait)}
.tab .f3r .form .h{flex-direction:column;align-items:flex-start;gap:2px}
.ph3 span.add{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
.hchip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:7px 12px;border-radius:999px;background:var(--plein);box-shadow:var(--verre);color:var(--texte2);white-space:nowrap}.hchip .ic{width:14px;height:14px}
.msg3.r{grid-template-columns:330px minmax(0,1fr) 250px;height:780px}.msg3.r.d2c{grid-template-columns:300px minmax(0,1fr)}
.msg3 .cv .hd .t{min-width:0}.msg3 .cv .hd .t>span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stp5{display:flex;gap:4px}.stp5 i{flex:1;height:6px;border-radius:4px;background:var(--piste)}.stp5 i.on{background:#2FD3A6}
.pop .tout{display:flex;justify-content:center;align-items:center;gap:6px}

.cv-r{border-radius:18px}.cv-r.on{background:var(--zone)}
.msg3 .ls .cvs{box-shadow:none;background:none}.msg3 .ls .cvs .cv-r+.cv-r{border-top:0}
.msg3 .ls .orbi-l{padding:10px 12px;font-size:12px}
.msg3 .cv .fil .inv-mini{width:auto;max-width:360px}
.msg3 .cv .fil .b-l,.msg3 .cv .fil .b-m{max-width:62%}
.msg3 .cv .cp{display:flex;flex-direction:column;gap:8px}
.msg3 .cx .ctx3{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:20px;background:var(--zone)}
.msg3 .cx .ctx3 .h{display:flex;gap:10px;align-items:center}.msg3 .cx .ctx3 .h .t{flex:1;font-size:12px;color:var(--texte2)}.msg3 .cx .ctx3 .h b{display:block;font-size:13.5px;color:var(--texte)}
.pop.mod{right:auto;left:640px;top:auto;bottom:110px;width:400px}.pop.mod::before{display:none}
.pop .brief{border-radius:20px}
.ntf3{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:20px;align-items:start}
/* Compte et organisation */
.cpt-r{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.cpt-r a{display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:26px;min-height:140px;font-size:12.5px;color:var(--texte2)}
.cpt-r a b{font-size:15.5px;color:var(--texte)}
.cpt-r a .cases{width:44px;height:44px;border-radius:15px;display:grid;place-items:center;background:rgba(255,255,255,.7);color:#0F3F37}
.sombre .cpt-r a .cases{background:rgba(255,255,255,.12);color:var(--texte)}
.cpt-r .k1{background:var(--g-former)}.cpt-r .k2{background:var(--g-accomp)}.cpt-r .k3{background:var(--g-oppo)}.cpt-r .k4{background:linear-gradient(150deg,#E8F1FB,#B9D5F2)}
.cpt-r .k5{background:linear-gradient(150deg,#F1EEE9,#D9D3CA)}.cpt-r .k6{background:linear-gradient(150deg,#FDEAE6,#F5B3A8)}
.sombre .cpt-r a{background:rgba(255,255,255,.06)!important}
.cpt-r .verif-b{align-self:flex-start}
.idr{display:flex;align-items:center;gap:18px;padding:22px 24px;border-radius:30px}
.idr .av{width:78px;height:78px;font-size:24px;color:#0F3F37}
.idr .t{flex:1}.idr h2{font-size:24px;font-weight:600;letter-spacing:-.02em}.idr p{font-size:13.5px;color:var(--texte2)}
.idr .bts .bt{flex:none}
.orgw{padding:0;overflow:hidden;border-radius:30px}
.orgw .ban{display:block;height:150px;position:relative;overflow:hidden}.orgw .ban>svg{display:block;width:100%;height:100%}
.ph3 span>svg{display:block;width:100%;height:100%}
.orgw .id{display:flex;align-items:flex-end;gap:18px;padding:0 24px 20px;margin-top:-44px;position:relative}
.orgw .id .lg-e{width:96px;height:96px;font-size:28px;border-radius:28px;box-shadow:0 0 0 5px var(--plein);flex:none}
.orgw .id .t{flex:1;display:flex;flex-direction:column;gap:6px;padding-top:52px}
.orgw .id h2{font-size:26px;font-weight:600;letter-spacing:-.02em}.orgw .id p{font-size:13.5px;color:var(--texte2);display:flex;gap:6px;align-items:center}
.orgw .id .bts{gap:8px;flex:none}.orgw .id .bts .bt{flex:none}
.w-c .verif-b{font-size:12px;padding:4px 10px}
.ph3{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:12px}
.ph3 span{height:130px;border-radius:20px;position:relative;overflow:hidden}
.ph3 span.add{display:grid;place-items:center;background:var(--zone);color:var(--texte2);font-size:12.5px;font-weight:600;box-shadow:inset 0 0 0 2px var(--trait)}
.verw{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.verw .st{display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:24px;position:relative}
.verw .st .n{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:var(--zone)}
.verw .st.ok .n{background:var(--g-accent);color:#0F3F37}.verw .st.at .n{background:#FBE3B0;color:#7A5410}
.verw .st b{font-size:15px}.verw .st span{font-size:12.5px;color:var(--texte2)}
.w-c .up{padding:16px 18px}.w-c .up .th{width:58px;height:74px}
/* Équipe */
.mb-t{padding:4px 0}
.mb-t .r{display:grid;grid-template-columns:44px minmax(0,1fr) 200px 120px 110px;gap:12px;align-items:center;padding:12px 18px;border-top:1px solid var(--trait);font-size:13px}
.mb-t .r:first-child{border-top:0;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2);padding:10px 18px}
.mb-t .r .av{width:40px;height:40px;font-size:12px;box-shadow:none;color:#0F3F37}
.mb-t .r .t b{display:block;font-size:14px}.mb-t .r .t span{font-size:12px;color:var(--texte2)}
.mb-t .r .role{justify-self:start}.mb-t .r .bt{justify-self:end;flex:none}
.sg-c{display:flex;flex-direction:column;gap:12px;padding:18px;border-radius:26px}
.sg-c .h{display:flex;justify-content:space-between;align-items:baseline}.sg-c .h b{font-size:15px}.sg-c .h span{font-size:12.5px;color:var(--texte2)}
.sg-c .sieges i{height:12px}
.w-c .droits{font-size:13px;padding:14px 18px}.w-c .droits span{padding:10px 2px}
.w-c .act-l{padding:16px 18px;font-size:13px;gap:12px}
/* Abonnement */
.abr{display:flex;align-items:center;gap:22px;padding:26px 28px;border-radius:30px;background:linear-gradient(140deg,#0F3F37,#1C6B5A);color:#F2EDE5;position:relative;overflow:hidden}
.abr .t{flex:1;display:flex;flex-direction:column;gap:4px}.abr small{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#A6F26B;font-weight:700}
.abr b{font-size:30px;letter-spacing:-.02em}.abr span{font-size:13px;opacity:.82}
.abr .jr{width:92px;height:92px;border-radius:50%;background:conic-gradient(#A6F26B 0 68%,rgba(255,255,255,.14) 0);display:grid;place-items:center;flex:none}
.abr .jr i{width:72px;height:72px;border-radius:50%;background:#164F44;display:grid;place-items:center;font-style:normal;font-size:12px;text-align:center;line-height:1.1}.abr .jr i b{font-size:24px;display:block}
.abr .bts .bt{flex:none}.abr .bt.sec{background:rgba(255,255,255,.12);color:#fff;box-shadow:none}
.w-c .tl-p{padding:16px 18px}
.f3r{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}
.f3r .form{display:flex;flex-direction:column;gap:12px;padding:20px}.f3r .form ul{flex:1}
.f3r .form .h b{font-size:18px}
.w-c .cmp{padding:16px 20px;font-size:13.5px}.w-c .cmp td,.w-c .cmp th{padding:10px 4px}
.w-c .tot{padding:16px 18px;font-size:13.5px}
.w-c .secu3 div{padding:14px 10px;font-size:12px}
/* Rapports */
.rap4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.rap4 div{display:flex;flex-direction:column;gap:4px;padding:18px;border-radius:24px;font-size:12.5px;color:#0F3F37}
.rap4 b{font-size:30px;font-weight:600;letter-spacing:-.02em}
.rap4 .s1{background:var(--g-former)}.rap4 .s2{background:var(--g-accomp)}.rap4 .s3{background:var(--g-oppo)}.rap4 .s4{background:linear-gradient(150deg,#E6F0FB,#9CC3EE)}
.sombre .rap4 div{color:var(--texte)}
.w-c .fr-r .e span{width:140px}.w-c .fr-r .e{font-size:13.5px}.w-c .fr-r .e .br-r{height:12px}
.w-c .sem .bars{height:150px}
.w-c .src{padding:16px 18px}
/* Premiers pas */
.obr .obj-g{grid-template-columns:repeat(4,minmax(0,1fr))}
.obr .ill-o{max-width:760px;width:100%;margin:0 auto 6px}
'''

MB = lambda i, c, s=40: f'<span class="av {c}" style="width:{s}px;height:{s}px;font-size:{round(s*.3)}px;box-shadow:none;color:#0F3F37">{i}</span>'
UR = '/hire'

# ---------- 1. Orbi ----------
HIST_R = f'''<div class="hs"><h4>Historique<a class="bt sec s">{ic("plus","xs")}Nouveau</a></h4><div class="verre rech">{ic("recherche","s")}<span>Rechercher</span></div>
<div class="liste lignes hist"><div class="li on"><span class="cases c3">{ic("candidats","s")}</span><div class="t"><b>Ordre de lecture · Analyste</b><span>Aujourd’hui</span></div></div>
<div class="li"><span class="cases c2">{ic("offre","s")}</span><div class="t"><b>Rédaction · Chargé de clientèle</b><span>Appliqué en partie · hier</span></div></div>
<div class="li"><span class="cases c1">{ic("entretien","s")}</span><div class="t"><b>Questions pour Grâce M.</b><span>3 questions · hier</span></div></div>
<div class="li"><span class="cases c2">{ic("message","s")}</span><div class="t"><b>Message à Marc K.</b><span>Relu et envoyé · 16 oct.</span></div></div>
<div class="li"><span class="cases c3">{ic("progression","s")}</span><div class="t"><b>Bilan de la semaine</b><span>12 oct.</span></div></div></div>
<div class="gar" style="margin-top:auto">{ic("supprimer","s")}Effacer un échange ou tout l’historique.</div></div>'''
ORB_RC = f'''<div class="cv"><div class="tete-o">{orbi(44)}<div class="t"><b>Orbi</b><span>99 crédits · votre assistant de recrutement</span></div>{bi("horloge")}</div>
<div class="aides"><div class="ai p1"><span class="cases">{ic("offre","s")}</span><b>Rédiger une offre</b></div><div class="ai p2"><span class="cases">{ic("candidats","s")}</span><b>Résumer des candidatures</b></div><div class="ai p3"><span class="cases">{ic("entretien","s")}</span><b>Préparer un entretien</b></div><div class="ai p4"><span class="cases">{ic("message","s")}</span><b>Rédiger un message</b></div></div>
<div class="fil"><div class="bulle-u">Quelles candidatures regarder en premier pour l’offre Analyste ?</div>
<div class="bulle-o">{orbi(32)}<div class="verre corps"><span>Les 4 nouvelles ont toutes les compétences requises. Amani M. et Fatou N. ont aussi un projet Power BI. Je propose de les lire dans cet ordre : Amani, Fatou, David, Ruth.</span><div class="acts"><a class="bt p s">Ouvrir les 4</a><a class="bt sec s">Voir les 24</a><a class="pq">{ic("pourquoi")}Pourquoi ?</a></div></div></div></div>
<div class="verre fort compo"><a class="bi">{ic("plus","s")}</a><span>Écrire à Orbi</span><a class="bi">{ic("micro","s")}</a><a class="bi env">{ic("envoyer","s")}</a></div><span class="pied">Orbi propose un ordre de lecture, vous décidez. Il ne rejette personne et n’envoie rien sans vous.</span></div>'''
W_ORB = web(f'<div class="orw">{HIST_R}{ORB_RC}</div>', 'orbi', 'rh', '/hire/orbi', tb=False)
T_ORB = tab(f'<div class="orw">{ORB_RC}</div>', 'orbi', 'rh', tb=False)

# ---------- 2. Messages ----------
def cvw(i, cls, nom, off, msg, h, n=0, et=None, enl=False, on=False):
    return cvr(i, cls, nom, off, msg, h, n, et, enl).replace('class="cv-r"', f'class="cv-r{" on" if on else ""}"', 1)
LS_R = f'''<div class="ls"><div class="rech verre">{ic("recherche","s")}<span>Candidat, offre</span></div>
<div class="filtres-h"><span class="puce on">Toutes</span><span class="puce">Non lues<small>3</small></span><span class="puce">Retenus</span><span class="puce">Propositions</span></div>
<div class="verre cvs">
{cvw("PK","b","Patrick K.","Analyste de données junior","Serait-il possible lundi ?","09:30",1,("Retenu · entretien","ret"),True,True)}
{cvw("GM","b","Grâce M.","Analyste de données junior","Merci, je confirme jeudi à 10 h.","10:12",1,("Retenue · entretien","ret"))}
{cvw("RB","","Ruth B.","Proposition · Analyste","Oui, l’offre m’intéresse.","Hier",1,("Proposition acceptée","ct"),True)}
{cvw("FN","a","Fatou N.","Analyste de données junior","Vous : Pouvez-vous envoyer votre diplôme ?","Dim.",0,("En examen","at"))}
{cvw("MK","","Marc K.","Chargé de clientèle","Vous : Merci pour notre échange…","Ven.",0,("Non retenu","nr"))}</div>
<div class="orbi-l">{orbi(24)}<div class="t"><b>3 conversations</b> terminées depuis 30 jours. Les retirer ?</div></div></div>'''
FIL_R = f'''<div class="fil"><div class="jour">Hier</div>
<div class="inv-mini"><span class="cases" style="width:36px;height:36px;border-radius:12px;background:var(--g-accomp)">{ic("agenda","s")}</span><div class="t"><b>Invitation envoyée</b>Jeu. 22 oct. · 10:00 ou 14:30</div></div>
<span class="lu"><span class="tk">✓✓</span>Lu · hier 16:20</span>
<div class="jour">Aujourd’hui</div>
<div class="b-l">Bonjour, merci pour l’invitation. Jeudi je suis en examen toute la journée. Serait-il possible lundi ?</div>
<span class="b-h">Patrick · 09:30</span>
<div class="b-m">Bonjour Patrick, pas de souci. Lundi 26 à 11:00 vous convient-il ?</div>
<span class="lu"><span class="tk">✓✓</span>Lu · 09:42</span>
<div class="ecrit"><i><b></b><b></b><b></b></i>Patrick écrit…</div></div>'''
CP_R = f'''<div class="cp"><div class="orb-ch"><span>{orbi(16)}Proposer une réponse</span><span>Résumer</span><span>Plus formel</span><span>{ic("agenda","xs")}Proposer des créneaux</span><span>{ic("document","xs")}Demander un document</span><span>Modèles</span></div>
<div class="compo"><a class="bi" style="background:none">{ic("plus","s")}</a><span>Écrire un message</span><a class="bi" style="background:none">{orbi(24)}</a><a class="bi env">{ic("envoyer","s")}</a></div></div>'''
CV_R = f'''<div class="cv"><div class="hd">{MB("PK","b enl",44)}<div class="t"><b>Patrick K.</b><span><span style="color:#1E9C78;font-weight:600">● En ligne</span> · répond en général dans l’heure</span></div><span class="etq-s ret">Retenu · entretien</span>{bi("plus-options")}</div>{FIL_R}{CP_R}</div>'''
CX_R = f'''<div class="cx"><h4>Candidature</h4><div class="ctx3"><div class="h"><span class="cases" style="width:38px;height:38px;border-radius:12px;background:var(--g-former)">{ic("offre","s")}</span><div class="t"><b>Analyste de données junior</b>Dossier à 52 %</div></div>
<div class="stp5"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i></i></div><span style="font-size:12px;color:var(--texte2)">Étape 4 sur 5 · <b style="color:var(--texte)">Entretien</b></span></div>
<h4>Documents</h4><div class="liste lignes" style="box-shadow:none;background:none;padding:0"><div class="li" style="padding:6px 0"><span class="cases c2">{ic("cv","s")}</span><div class="t"><b>CV_Patrick_K.pdf</b><span>Envoyé avec la candidature</span></div></div></div>
<h4>Entretien</h4><div class="verre carte" style="box-shadow:none;background:var(--zone);padding:12px 14px;display:flex;flex-direction:row;gap:10px;align-items:center"><span class="cal-t" style="width:40px;border-radius:10px;overflow:hidden;background:var(--plein);text-align:center"><i style="display:block;font-style:normal;font-size:9px;font-weight:700;background:#E25C4B;color:#fff;padding:2px 0">LUN</i><b style="display:block;font-size:16px;padding:2px 0 3px">26</b></span><div style="flex:1;font-size:12px;color:var(--texte2)"><b style="display:block;font-size:13px;color:var(--texte)">Proposé · 11:00</b>En attente de Patrick</div></div>
<a class="bt sec m" style="width:100%">{ic("candidats","s")}Ouvrir le dossier</a></div>'''
def msgs_r(t=False):
    if t: return wh('Messages') + f'<div class="msg3 r d2c">{LS_R}{CV_R}</div>'
    return wh('Messages', '', '<span class="hchip">' + ic("confidentialite","xs") + 'Seulement avec les candidats et les talents qui ont accepté le contact</span>') + f'<div class="msg3 r">{LS_R}{CV_R}{CX_R}</div>'
UM = '/hire/messages'
W_MSG = web(msgs_r(), 'message', 'rh', UM + '/patrick-k')
T_MSG = tab(msgs_r(True), 'message', 'rh')
MOD_POP = f'''<div class="pop mod"><div class="hd"><b>Modèles de messages</b><a>Gérer</a></div><div class="liste lignes">
<div class="li"><span class="cases c2">{ic("agenda","s")}</span><div class="t"><b>Invitation à un entretien</b><span>Avec les créneaux de l’offre</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("document","s")}</span><div class="t"><b>Demande de document</b><span>Diplôme, attestation, portfolio</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c3">{ic("valider","s")}</span><div class="t"><b>Candidature retenue</b></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("message","s")}</span><div class="t"><b>Après entretien, non retenue</b><span>Respectueux, sans détail personnel</span></div>{ic("suivant")}</div></div>
<a class="tout">{ic("plus","xs")} Créer un modèle</a><div class="gar">{ic("modifier","s")}Un modèle s’insère dans le message : vous le relisez avant l’envoi.</div></div>'''
W_MOD = web(msgs_r(), 'message', 'rh', UM + '/patrick-k', over=MOD_POP)
BRIEF = f'''<div class="brief"><div class="h">{orbi(30)}<div class="t"><b>Votre journée en bref</b><span>Orbi · ce matin à 08:00</span></div></div>
<div class="msg">Bonjour Nadia, trois choses vous attendent aujourd’hui. Je n’ai rien envoyé ni modifié.</div>
<div class="pt"><span class="n" style="background:#D9F6C4">4</span><div class="t">Nouvelles candidatures<small>Analyste de données junior</small></div><a>Voir</a></div>
<div class="pt"><span class="n" style="background:#FBE3B0">1</span><div class="t">Demande d’autre date<small>Patrick K. propose lundi</small></div><a>Répondre</a></div>
<div class="pt"><span class="n" style="background:#C8F0E2">1</span><div class="t">Entretien à évaluer<small>Eric K., ce matin</small></div><a>Évaluer</a></div></div>'''
NOTIF_POP = f'''<div class="w-voile cl"></div><div class="pop" style="width:440px">{BRIEF.replace('class="brief"','class="brief"',1)}<div class="hd"><b>Notifications</b><a>Tout marquer comme lu</a></div>
<div class="grp-t">Aujourd’hui</div><div class="liste lignes">
{nt('c3','candidature','4 nouvelles candidatures','Analyste de données junior','10:40',True)}
{nt('c2','entretien','Grâce M. a confirmé','Jeudi 22 oct. à 10:00 · visio','10:12',True)}
{nt('','horloge','Patrick K. propose lundi','Au lieu de jeudi 22','09:30',True)}</div>
<div class="grp-t">Cette semaine</div><div class="liste lignes">
{nt('c3','message','Ruth B. a accepté','Vous pouvez lui écrire','Sam.')}</div><a class="tout">Toutes les notifications</a></div>'''
W_NOTIF = web(msgs_r(), 'message', 'rh', UM + '/patrick-k', over=NOTIF_POP)

# ---------- 3. Compte et organisation ----------
if 'OK' not in dir(): OK = lambda: ic("valider", "xs")
AMENU_R = f'''<div class="amenu"><div class="hub-id"><span class="av">NK</span><div class="t"><b>Nadia Kabeya</b><span>Responsable recrutement</span></div>{ic("suivant","s")}</div><div class="sp"></div>
<a><span class="cases">{ic("entreprise","s")}</span><span>Organisation</span><small>À vérifier</small></a><a><span class="cases">{ic("candidats","s")}</span><span>Équipe</span><small>2 sur 2</small></a>
<a><span class="cases">{ic("favori","s")}</span><span>Viviers</span><small>22</small></a><a><span class="cases">{ic("progression","s")}</span><span>Rapports</span></a><div class="sp"></div>
<a><span class="cases">{ic("portefeuille","s")}</span><span>Abonnement</span><small>RH Pro</small></a><a><span class="cases">{ic("reglages","s")}</span><span>Paramètres</span></a><a><span class="cases">{ic("aide","s")}</span><span>Aide</span></a>
<a><span class="cases">{ic("profil","s")}</span><span>Passer à mon espace talent</span></a><div class="sp"></div>
<a class="dc"><span class="cases">{ic("deconnexion","s")}</span><span>Se déconnecter</span></a></div>'''
W_AMENU = web(msgs_r(), 'message', 'rh', UM, over=AMENU_R)
UC = '/hire/compte'
def compte_r(t=False):
    idc = f'<div class="verre idr"><span class="av">NK</span><div class="t"><h2>Nadia Kabeya</h2><p>Responsable recrutement · Baobab Fintech · admin</p></div><div class="bts" style="display:flex;gap:10px"><a class="bt sec m">{ic("profil","s")}Espace talent</a><a class="bt p m">Mon profil RH</a></div></div>'
    g = f'''<div class="cpt-r"{' style="grid-template-columns:repeat(2,minmax(0,1fr))"' if t else ''}>
<a class="k3"><span class="cases">{ic("entreprise","s")}</span><b>Organisation</b>Page vue par les talents<span class="verif-b">{ic("horloge","xs")}À vérifier</span></a>
<a class="k2"><span class="cases">{ic("candidats","s")}</span><b>Équipe</b>2 sièges sur 2 · 1 invitation</a>
<a class="k1"><span class="cases">{ic("favori","s")}</span><b>Viviers</b>3 viviers · 22 talents</a>
<a class="k4"><span class="cases">{ic("progression","s")}</span><b>Rapports</b>35 candidatures en 30 jours</a>
<a class="k5"><span class="cases">{ic("portefeuille","s")}</span><b>Abonnement</b>RH Pro · 99 crédits Orbi</a>
<a class="k6"><span class="cases">{ic("reglages","s")}</span><b>Paramètres</b>Notifications, sécurité, Orbi</a></div>'''
    bas = f'''<div class="g2e"><div class="verre liste lignes"><div class="li"><span class="cases">{ic("aide","s")}</span><div class="t"><b>Aide</b><span>assistant@jumanly.io · réponse par e-mail</span></div>{ic("suivant")}</div></div>
<div class="verre liste"><div class="li danger"><span class="cases">{ic("deconnexion","s")}</span><div class="t"><b>Se déconnecter</b></div></div></div></div>'''
    return wh('Compte') + idc + g + bas
W_CPT = web(compte_r(), '', 'rh', UC)
T_CPT = tab(compte_r(True), '', 'rh')

def prof_r():
    f = f'''<div class="verre frm-w" style="padding:22px;display:flex;flex-direction:column;gap:16px"><div style="display:flex;gap:18px;align-items:center"><div class="ph-ed"><span class="av" style="width:84px;height:84px;font-size:24px;color:#0F3F37">NK</span><a class="bi">{ic("photo","s")}</a></div><div class="gar" style="flex:1">{ic("confidentialite","s")}Photo facultative. Les candidats voient votre nom, votre fonction et votre organisation.</div></div>
<div class="duo-f">{champ('Nom affiché','Nadia Kabeya')}{champ('Fonction','Responsable recrutement')}</div>
{champ('E-mail professionnel','nadia.k@baobab-fintech.example','', 'cadenas', 'Utilisé pour vérifier l’organisation')}
<div class="champ"><label>Langues d’échange</label><div class="puces"><span class="puce on">Français</span><span class="puce on">Anglais</span><span class="puce">Lingala</span><span class="puce">Swahili</span></div></div>
<div class="bts" style="display:flex;gap:10px;justify-content:flex-end"><a class="bt sec m">Annuler</a><a class="bt p m">Enregistrer</a></div></div>'''
    a = f'''<div class="col"><span class="ck-t">Ce que voient les candidats</span><div class="verre carte" style="padding:18px;display:flex;flex-direction:column;gap:12px">
<div class="apc"><span class="av" style="width:44px;height:44px;font-size:13px;box-shadow:none;color:#0F3F37">NK</span><div class="t"><b>Nadia K. · Baobab Fintech</b>Responsable recrutement · répond en 3 jours en moyenne</div></div>
<div class="b-l" style="max-width:100%">Bonjour Grâce, merci pour votre candidature. Je vous propose un entretien jeudi 22 octobre.</div></div>
<div class="gar">{ic("message","s")}Votre numéro n’est jamais demandé ni affiché. Les échanges passent par Messages.</div></div>'''
    return wh('Mon profil RH') + f'<div class="g2r">{f}{a}</div>'
W_PROF = web(prof_r(), '', 'rh', UC + '/profil')

def org_r():
    h = f'''<div class="verre orgw"><span class="ban">{BAN["baobab"]}</span><div class="id"><span class="lg-e sap">BF</span><div class="t"><h2>Baobab Fintech</h2><p>Services financiers · 50 à 200 personnes · {FLAG["cd"]} Kinshasa</p><span class="verif-b" style="align-self:flex-start">{ic("horloge","xs")}Vérification en cours</span></div>
<div class="bts" style="display:flex"><a class="bt sec m">{ic("profil","s")}Voir comme un talent</a><a class="bt p m">{ic("modifier","s")}Modifier</a></div></div></div>'''
    st = f'<div class="rap4"><div class="s1"><b>3</b>offres actives</div><div class="s2"><b>3 j</b>délai de réponse</div><div class="s3"><b>2</b>sites</div><div class="s4"><b>4</b>recrutés</div></div>'
    g = f'''<div class="g2"><div class="col">{sect("document","former","Présentation","", '<span style="font-size:13.5px;line-height:1.55">Solutions de paiement mobile pour les commerçants d’Afrique centrale.</span><div class="tons"><span>Télétravail partiel</span><span>Formation continue</span><span>Assurance santé</span></div>')}
<span class="ck-t">Photos des bureaux</span><div class="ph3"><span>{BAN["baobab"]}</span><span class="add">{ic("photo","s")}&nbsp;Ajouter</span><span class="add">{ic("photo","s")}&nbsp;Ajouter</span></div></div>
<div class="col">{sect("localisation","accomp","Sites","2", '<div class="hist-l"><span><b>Kinshasa</b> · Gombe, siège</span><span><b>Lubumbashi</b> · agence</span></div>')}
<div class="orbi-l">{orbi(26)}<div class="t">Ajoutez une photo de vos bureaux : les talents ouvrent plus souvent les pages illustrées.</div></div>
<a class="verre carte" style="padding:16px 18px;display:flex;flex-direction:row;gap:12px;align-items:center"><span class="cases" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:var(--g-former);color:#0F3F37">{ic("valider","s")}</span><span style="flex:1;font-size:12.5px;color:var(--texte2)"><b style="display:block;font-size:14px;color:var(--texte)">Faire vérifier</b>Publication sans attente et badge</span>{ic("suivant","s")}</a></div></div>'''
    return wh('Organisation', 'Votre page, vue par les talents sur chaque offre') + h + st + g
W_ORG = web(org_r(), '', 'rh', UC + '/organisation')

def verif_r():
    hd = f'''<div class="verre carte" style="padding:22px 24px;display:flex;flex-direction:row;gap:20px;align-items:center">{ring(66).replace("66 %","2/3")}<div style="flex:1"><b style="display:block;font-size:20px">Encore une étape</b><span style="font-size:13.5px;color:var(--texte2)">Une organisation vérifiée publie sans attente et affiche un badge sur ses offres.</span></div></div>'''
    st = f'''<div class="verw"><div class="verre st ok"><span class="n">{ic("valider","xs")}</span><b>E-mail sur le domaine</b><span>@baobab-fintech.example confirmé</span></div>
<div class="verre st ok"><span class="n">{ic("valider","xs")}</span><b>Document officiel</b><span>RCCM envoyé le 18 oct.</span><span class="etq-s ok" style="align-self:flex-start">Reçu</span></div>
<div class="verre st at"><span class="n">{ic("horloge","xs")}</span><b>Examen par Jumanly</b><span>Sous 2 jours ouvrés</span><span class="etq-s at" style="align-self:flex-start">En cours</span></div></div>'''
    d = f'''<div class="g2e"><div class="col"><span class="ck-t">Document envoyé</span><div class="up verre"><span class="th"><i class="h"></i><i></i><i></i><i></i><i style="width:70%"></i></span><div class="t"><b>RCCM_Baobab.pdf</b>1,2 Mo · lisible · données personnelles masquées</div><a class="bt sec s">Remplacer</a></div></div>
<div class="col"><span class="ck-t">En attendant</span><div class="gar">{ic("offre","s")}Vos offres passent en validation avant publication.</div><div class="gar">{ic("message","s")}Une question : assistant@jumanly.io</div></div></div>'''
    return wh('Vérifier l’organisation', 'Baobab Fintech') + hd + st + d
W_VERIF = web(verif_r(), '', 'rh', UC + '/organisation/verification')

# ---------- 4. Équipe ----------
def equipe(t=False):
    sg = f'''<div class="verre sg-c"><div class="h"><b>Sièges utilisés : 2 sur 2</b><span>RH Pro · 3 sièges en RH Premium</span></div><span class="sieges"><i class="on"></i><i class="on"></i></span></div>'''
    m = f'''<div class="verre mb-t"><div class="r"><span></span><span>Membre</span><span>Offres</span><span>Rôle</span><span></span></div>
<div class="r">{MB("NK","")}<div class="t"><b>Nadia Kabeya</b><span>nadia.k@baobab-fintech.example · vous</span></div><span>Toutes les offres</span><span class="role ad">Admin</span><span></span></div>
<div class="r">{MB("OB","b")}<div class="t"><b>Olivier B.</b><span>olivier.b@baobab-fintech.example</span></div><span>Analyste de données junior</span><span class="role">Recruteur</span><a class="bt sec s">Modifier</a></div>
<div class="r">{MB("ML","a")}<div class="t"><b>M. Lukusa</b><span>Invitation envoyée par e-mail · 2 j</span></div><span>—</span><span class="role">En attente</span><a class="bt sec s">Relancer</a></div></div>'''
    dr = f'''<div class="col"><span class="ck-t">Qui peut faire quoi</span><div class="verre droits"><span class="h l"></span><span class="h">Admin</span><span class="h">Recr.</span><span class="h">Lect.</span>
<span class="l">Publier une offre</span><span class="y">✓</span><span class="y">✓</span><span class="n">—</span>
<span class="l">Décider</span><span class="y">✓</span><span class="y">✓</span><span class="n">—</span>
<span class="l">Noter, évaluer</span><span class="y">✓</span><span class="y">✓</span><span class="y">✓</span>
<span class="l">Équipe, abonnement</span><span class="y">✓</span><span class="n">—</span><span class="n">—</span></div></div>'''
    ac = f'''<div class="col"><span class="ck-t">Activité récente</span><div class="verre act-l"><div><span class="av b">OB</span><span class="x">Olivier a évalué Eric K.</span><small>10:20</small></div><div><span class="av">NK</span><span class="x">Vous avez répondu à Patrick K.</span><small>09:42</small></div><div><span class="av">NK</span><span class="x">Vous avez publié Chargé de clientèle</span><small>Lun.</small></div></div></div>'''
    return wh('Équipe', 'Baobab Fintech', f'<a class="bt p m">{ic("plus","s")}Inviter</a>') + sg + m + (f'{dr}{ac}' if t else f'<div class="g2e">{dr}{ac}</div>')
UQ = UC + '/equipe'
W_EQ = web(equipe(), '', 'rh', UQ)
DLG_INV = f'''<h3>Inviter dans l’équipe</h3>{champ('E-mail','m.lukusa@baobab-fintech.example','focus')}
<div class="champ"><label>Rôle</label><div class="seg"><span>Admin</span><span class="on">Recruteur</span><span>Lecteur</span></div></div>
<div class="champ"><label>Offres confiées</label><div class="puces"><span class="puce on">Chargé de clientèle</span><span class="puce">Analyste de données junior</span><span class="puce">Responsable conformité</span></div></div>
<div class="manq">{ic("aide","s")}<span><b>Plus de siège libre.</b> L’invitation partira quand un siège se libère, ou passez à RH Premium (3 sièges).</span></div>
<div class="bts"><a class="bt sec m">Voir RH Premium</a><a class="bt p m pl">{ic("envoyer","s")}Inviter</a></div>'''
W_INV = web(equipe(), '', 'rh', UQ, over=fenetre(DLG_INV).replace('class="dlg"', 'class="dlg" style="width:560px"'))

# ---------- 5. Abonnement ----------
UB = UC + '/abonnement'
def abo_r():
    h = f'''<div class="abr"><span class="jr"><i><b>21</b>jours</i></span><div class="t"><small>Votre formule</small><b>RH Pro · 19,9 $ par mois</b><span>Baobab Fintech · payée jusqu’au 9 novembre · prépayé, sans renouvellement forcé</span></div><div class="bts" style="display:flex;gap:10px"><a class="bt sec m">Prolonger</a><a class="bt a m">Changer de formule</a></div></div>'''
    q = f'''<div class="q4"><div class="verre"><span class="cases" style="background:var(--g-accomp)">{ic("candidats","s")}</span><small>Sièges</small><b>2 <span>sur 2</span></b><span class="barre"><i style="width:100%"></i></span></div>
<div class="verre"><span class="cases" style="background:var(--g-former)">{ic("offre","s")}</span><small>Offres actives</small><b>3 <span>sur 5</span></b><span class="barre"><i style="width:60%"></i></span></div>
<div class="verre"><span class="cases" style="background:var(--g-accent)">{ic("orbi","s")}</span><small>Crédits Orbi</small><b>99 <span>sur 100</span></b><span class="barre"><i style="width:99%"></i></span></div>
<div class="verre"><span class="cases" style="background:var(--g-oppo)">{ic("document","s")}</span><small>Analyse des CV</small><b>Incluse</b><span style="font-size:12px;color:var(--texte2)">Grilles d’évaluation en RH Premium</span></div></div>'''
    o = f'<div class="orbi-l">{orbi(26)}<div class="t">Vos 2 sièges sont pris. Pour inviter M. Lukusa, <b>RH Premium</b> ajoute un 3e siège.</div><a class="bt sec s">Voir</a></div>'
    tl_ = f'''<div class="col"><div class="sec-w"><h2>Échéances</h2></div><div class="verre tl-p">
<div class="e ok"><i></i><div><b>Payé · 19,9 $</b><span>10 oct. · Orange Money</span></div></div>
<div class="e at"><i></i><div><b>Rappel par e-mail</b><span>2 nov., 7 jours avant la fin</span></div></div>
<div class="e"><i></i><div><b>Fin de la période</b><span>9 nov. · retour à RH Free si rien n’est payé</span></div></div></div>
<div class="gar">{ic("horloge","s")}À la fin, retour à RH Free sans rien perdre : les offres en trop passent en pause.</div></div>'''
    pf = f'''<div class="col"><div class="sec-w"><h2>Paiement et factures</h2><a>Tout voir</a></div><div class="verre liste lignes">
<div class="li"><span class="lf-m" style="background:#FF7900">O</span><div class="t"><b>Orange Money</b><span>89 ••• 07 · moyen par défaut</span></div><a class="bt sec s">Changer</a></div>
<div class="li"><span class="cases c2">{ic("document","s")}</span><div class="t"><b>RH Pro · octobre</b><span>10 oct. 2026 · au nom de Baobab Fintech</span></div><span class="v">19,9 $</span>{ic("telecharger","s")}</div>
<div class="li"><span class="cases c2">{ic("document","s")}</span><div class="t"><b>RH Pro · septembre</b><span>10 sept. 2026 · Orange Money</span></div><span class="v">19,9 $</span>{ic("telecharger","s")}</div></div></div>'''
    return wh('Abonnement') + h + q + o + f'<div class="g2e">{tl_}{pf}</div>'
W_ABO = web(abo_r(), '', 'rh', UB)

CKT = '<b style="color:#1E9C78;font-size:15px">✓</b>'
def formules_r(t=False):
    def F(n, p, items, on=False, rec=None, bt='Choisir'):
        r = f'<span class="rec">{rec}</span>' if rec else '<span class="rec" style="visibility:hidden">Formule</span>'
        return f'<div class="verre form{" on" if on else ""}">{r}<div class="h"><b>{n}</b><span class="prix">{p}<small> /mois</small></span></div><ul>' + ''.join(f'<li>{OK()}{x}</li>' for x in items) + f'</ul><a class="bt {"p" if on else "sec"} m">{bt}</a></div>'
    g = (F('RH Free', '0 $', ['1 siège, 1 offre active', 'Candidatures, étapes, messages', 'Score expliqué'], bt='Formule de base')
         + F('RH Pro', '19,9 $', ['2 sièges, 5 offres actives', '100 crédits Orbi', 'Analyse des CV par Orbi'], rec='Votre formule', bt='Formule actuelle')
         + F('RH Premium', '49,9 $', ['3 sièges, 15 offres actives', '300 crédits Orbi', 'Grilles d’évaluation'], on=True, bt='Passer à RH Premium'))
    cmp = f'''<div class="verre cmp"><table><tr><th></th><th>RH Free</th><th>RH Pro</th><th class="on">RH Premium</th></tr>
<tr><td>Sièges</td><td>1</td><td>2</td><td class="on">3</td></tr><tr><td>Offres actives</td><td>1</td><td>5</td><td class="on">15</td></tr>
<tr><td>Crédits Orbi</td><td>—</td><td>100</td><td class="on">300</td></tr><tr><td>Analyse des CV</td><td>—</td><td>{CKT}</td><td class="on">{CKT}</td></tr>
<tr><td>Grilles d’évaluation</td><td>—</td><td>—</td><td class="on">{CKT}</td></tr><tr><td>Candidatures reçues</td><td>Illimitées</td><td>Illimitées</td><td class="on">Illimitées</td></tr></table></div>'''
    st = ' style="grid-template-columns:1fr"' if t else ''
    return (wh('Formules RH', 'Prépayées, sans engagement. Postuler reste gratuit pour les candidats.', '<div class="seg" style="width:260px"><span class="on">Mensuel</span><span>Annuel</span></div>')
            + f'<div class="orbi-l">{orbi(26)}<div class="t">Avec 3 recruteurs et 4 offres en cours, <b>RH Premium</b> vous suffit.</div></div><div class="f3r"{st}>{g}</div>{cmp}'
            + f'<div class="gar">{ic("entreprise","s")}Plus de sièges ou une page entreprise complète : Jumanly Companies, dès 79,9 $/mois.</div>')
W_FORMS = web(formules_r(), '', 'rh', UB + '/formules')
T_FORMS = tab(formules_r().replace('class="f3r"', 'class="f3r" style="grid-template-columns:repeat(3,minmax(0,1fr));gap:10px"'), '', 'rh')

RECAP_R = f'''<div class="col"><div class="verre recap"><h4 style="font-size:16px">Récapitulatif</h4><div class="l"><span>Formule</span><b>RH Premium · 1 mois</b></div><div class="l"><span>Organisation</span><b>Baobab Fintech</b></div><div class="l"><span>Période</span><b>19 oct. au 18 nov.</b></div><div class="l"><span>Renouvellement</span><b>Non, prépayé</b></div>
<div class="tot"><span>Total</span><b>49,9 $</b></div><a class="bt p m">{ic("cadenas","s")}Payer 49,9 $</a><span style="font-size:12px;color:var(--texte2);text-align:center">Facture au nom de l’organisation, envoyée par e-mail.</span></div></div>'''
def paiement_r():
    mm = f'''<div class="verre liste mm"><div class="li"><span class="lf" style="background:#FF7900">O</span><div class="t"><b>Orange Money</b><span>Moyen enregistré</span></div>{CHK}</div>
<div class="li"><span class="lf" style="background:#E2231A">M</span><div class="t"><b>M-Pesa</b><span>Vodacom</span></div>{NOCHK}</div><div class="li"><span class="lf" style="background:#C8102E">A</span><div class="t"><b>Airtel Money</b></div>{NOCHK}</div></div>
<div class="verre liste"><div class="li"><span class="cases">{ic("portefeuille","s")}</span><div class="t"><b>Carte bancaire</b><span>Visa, Mastercard</span></div>{NOCHK}</div></div>'''
    num = f'''<div class="champ"><label>Numéro Mobile Money</label><div class="verre saisie focus tel"><span class="ind">{FLAG["cd"]}+243{ic("suivant","xs")}</span><span>89 410 22 07</span></div><span class="aide-c">Utilisé seulement pour ce paiement, jamais affiché.</span></div>
<div class="secu3"><div class="verre"><span class="cases c2">{ic("cadenas","s")}</span><b>Sécurisé</b>Code saisi sur votre téléphone</div><div class="verre"><span class="cases c1">{ic("document","s")}</span><b>Facture</b>Au nom de l’organisation</div><div class="verre"><span class="cases c3">{ic("horloge","s")}</span><b>Prépayé</b>Aucun prélèvement automatique</div></div>'''
    return wh('Paiement', 'RH Premium · 1 mois · Baobab Fintech') + f'<div class="g2r"><div class="col"><span class="ck-t">Mobile Money</span>{mm}{num}</div>{RECAP_R}</div>'
W_PAY = web(paiement_r(), '', 'rh', UB + '/paiement')
DLG_ATT = f'''<span class="rond-att">{ic("horloge")}</span><h2 class="h2s">Validez sur votre téléphone</h2><p>Orange Money vous envoie une demande de 49,9 $ au +243 89 ••• 07. Entrez votre code secret pour confirmer.</p>
<div class="verre attente"><span class="sp"></span>En attente de la confirmation · 1:48</div><a class="bt txt">Je n’ai rien reçu</a>'''
W_PATT = web(paiement_r(), '', 'rh', UB + '/paiement', over=fenetre(DLG_ATT).replace('class="dlg"', 'class="dlg c"'))
DLG_OK = f'''<span class="rond-ok">{ic("valider")}</span><h2 class="h2s">RH Premium est actif</h2><p>Jusqu’au 18 novembre. Vous pouvez inviter M. Lukusa : un 3e siège est libre.</p>
<div class="verre liste lignes" style="box-shadow:none;background:var(--zone)"><div class="li"><div class="t"><span>Montant</span><b>49,9 $ · Orange Money</b></div></div><div class="li"><div class="t"><span>Référence</span><b>JMN-PAY-3B7Q20</b></div></div></div><a class="bt p m">Inviter M. Lukusa</a>'''
W_POK = web(paiement_r(), '', 'rh', UB + '/paiement', over=fenetre(DLG_OK).replace('class="dlg"', 'class="dlg c"'))

# ---------- 6. Rapports ----------
def rapports(t=False):
    f = f'''<div class="flt-b"><div class="filtres-h"><span class="puce on">30 jours</span><span class="puce">Trimestre</span><span class="puce">Par offre</span><span class="puce">Toutes les offres{ic("suivant","xs")}</span></div></div>'''
    k = '<div class="rap4"><div class="s1"><b>35</b>candidatures reçues</div><div class="s2"><b>3 j</b>délai moyen de première réponse</div><div class="s3"><b>5</b>entretiens</div><div class="s4"><b>1</b>recrutement</div></div>'
    fun = f'''<div class="verre carte" style="padding:18px 20px;display:flex;flex-direction:column;gap:12px"><b style="font-size:15px">Où en sont les candidatures</b>
<div class="fr-r"><div class="e"><span>Reçues</span><span class="br-r"><i style="width:100%"></i></span><b>35</b></div><div class="e"><span>Examinées</span><span class="br-r"><i style="width:74%"></i></span><b>26</b></div><div class="e"><span>Présélectionnées</span><span class="br-r"><i style="width:23%"></i></span><b>8</b></div><div class="e"><span>Entretien</span><span class="br-r"><i style="width:14%"></i></span><b>5</b></div><div class="e"><span>Recrutées</span><span class="br-r"><i style="width:3%"></i></span><b>1</b></div></div></div>'''
    sem = f'''<div class="verre sem"><div class="h"><b>Candidatures par semaine</b><span>4 dernières semaines</span></div>
<div class="bars"><div><i style="height:40%"></i>S1</div><div><i style="height:62%"></i>S2</div><div><i style="height:48%"></i>S3</div><div class="on"><i style="height:90%"></i>S4</div></div></div>'''
    src = f'''<div class="verre src"><b style="font-size:15px">D’où viennent-elles</b><div class="stk"><i style="width:60%;background:#2FD3A6"></i><i style="width:26%;background:#A6F26B"></i><i style="width:14%;background:#F5B83D"></i></div>
<div class="s"><i style="background:#2FD3A6"></i><span>Offres Jumanly</span><b>21</b></div><div class="s"><i style="background:#A6F26B"></i><span>Lien partagé</span><b>9</b></div><div class="s"><i style="background:#F5B83D"></i><span>Offre proposée à un talent</span><b>5</b></div></div>'''
    ex = f'''<div class="col"><div class="orbi-l">{orbi(26)}<div class="t">La semaine 4 a doublé après le partage de l’offre <b>Analyste de données</b>.</div></div>
<div class="verre pdf-x"><span class="th"><i></i><em></em><u></u><u></u><u style="width:60%"></u></span><div class="t"><b>Rapport d’octobre · PDF</b>2 pages A4 · aux couleurs de Jumanly</div><a class="bt p s">{ic("telecharger","xs")}Exporter</a></div>
<div class="gar">{ic("pourquoi","s")}Chiffres réels de vos offres. Aucune donnée personnelle des candidats.</div></div>'''
    if t: return wh('Rapports', 'Baobab Fintech · 30 derniers jours') + f + k + fun + f'<div class="g2e">{sem}{src}</div>' + ex
    return wh('Rapports', 'Baobab Fintech · 30 derniers jours', f'<a class="bt sec m">{ic("telecharger","s")}Exporter en PDF</a>') + f + k + f'<div class="g2e">{fun}{sem}</div><div class="g2e">{src}{ex}</div>'
W_RAP = web(rapports(), 'progression', 'rh', '/hire/rapports')
T_RAP = tab(rapports(True), 'progression', 'rh')

# ---------- 7. Paramètres ----------
SNR = [('notification', 'Notifications'), ('orbi', 'Orbi'), ('progression', 'Apparence'), None, ('cadenas', 'Sécurité'), ('confidentialite', 'Journal des consultations'), ('horloge', 'Fuseau horaire'), ('message', 'Signature des messages')]
def prm_r(on, corps):
    h = ''.join('<div class="sp"></div>' if x is None else f'<a class="{"on" if x[1] == on else ""}"><span class="cases">{ic(x[0],"s")}</span>{x[1]}</a>' for x in SNR)
    return wh('Paramètres') + f'<div class="prm"><div class="verre snav">{h}</div><div class="col">{corps}</div></div>'
PRM_N = f'''<h3>Notifications</h3><div class="verre liste lignes">
<div class="li"><span class="cases c3">{ic("candidature","s")}</span><div class="t"><b>Nouvelle candidature</b><span>Un résumé par jour</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c2">{ic("entretien","s")}</span><div class="t"><b>Réponse à une invitation</b><span>Dès qu’elle arrive</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c2">{ic("message","s")}</span><div class="t"><b>Nouveau message</b></div><span class="sw on"></span></div>
<div class="li"><span class="cases">{ic("portefeuille","s")}</span><div class="t"><b>Abonnement</b><span>Rappel 7 jours avant la fin</span></div><span class="sw on"></span></div></div>
<span class="ck-t">Orbi</span><div class="verre liste lignes">
<div class="li"><span class="cases c3">{ic("orbi","s")}</span><div class="t"><b>Résumé du matin</b><span>Chaque jour à 8:00</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c2">{ic("document","s")}</span><div class="t"><b>Analyse des dossiers</b><span>Seulement à votre demande</span></div><span class="sw on"></span></div></div>
<span class="ck-t">Apparence</span><div class="th3"><a class="on"><span class="ph" style="background:linear-gradient(160deg,#F2EDE5,#DDF6EE)"></span>Clair</a><a><span class="ph" style="background:linear-gradient(160deg,#0B1A1F,#14574A)"></span>Sombre</a><a><span class="ph" style="background:linear-gradient(90deg,#F2EDE5 50%,#0B1A1F 50%)"></span>Auto</a></div>'''
W_PRM = web(prm_r('Notifications', PRM_N), '', 'rh', '/hire/parametres')
JRN = [("OB","b","Olivier B.","Amani M.","Analyste de données junior","Après candidature","Auj. 10:20"),("NK","","Vous","Patrick K.","Analyste de données junior","Après candidature","Auj. 09:40"),
       ("NK","","Vous","Ruth B.","Proposition · Analyste","Profil visible","Hier 15:02"),("OB","b","Olivier B.","Joël T.","Chargé de clientèle","Après candidature","Ven. 11:15")]
PRM_J = (f'''<h3>Sécurité</h3><div class="verre liste lignes"><div class="li"><span class="cases c1">{ic("cadenas","s")}</span><div class="t"><b>Validation en deux étapes</b><span>Recommandée pour les recruteurs</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases">{ic("modifier","s")}</span><div class="t"><b>Mot de passe</b><span>Modifié il y a 2 mois</span></div><a class="bt sec s">Changer</a></div></div>
<span class="ck-t">Journal des consultations</span><div class="verre tbl jr"><div class="r"><span>Membre</span><span>Profil consulté</span><span>Contexte</span><span>Quand</span></div>'''
         + ''.join(f'<div class="r"><b style="display:flex;align-items:center;gap:8px">{MB(i,c,30)}{m}</b><span class="pc"><b>{p}</b><small>{o}</small></span><span>{x}</span><span>{d}</span></div>' for i, c, m, p, o, x, d in JRN)
         + f'</div><div class="gar">{ic("confidentialite","s")}Chaque profil ouvert par l’équipe est enregistré. Le talent voit qu’une organisation l’a consulté.</div>')
W_SEC = web(prm_r('Journal des consultations', PRM_J), '', 'rh', '/hire/parametres/consultations')

# ---------- 8. Premiers pas ----------
def obr(n, corps, bas):
    return (f'<div class="obw obr"><div class="oh"><span class="lgo">{LOGO.replace("40","30")}jumanly<small style="font-size:12px;font-weight:600;color:var(--texte2);margin-left:6px">Hire</small></span><div class="prg">{pas(n,3)}<span>{n} sur 3</span></div><span style="width:110px"></span></div>'
            f'<div class="oc">{corps}</div><div class="ob">{bas}</div></div>')
OBJ_R = f'''<div class="obj-g">
<div class="o1 on"><span class="cases">{ic("entreprise","s")}</span><b>Mon entreprise</b>PME, grand groupe, ONG</div>
<div class="o2"><span class="cases">{ic("candidats","s")}</span><b>Un cabinet RH</b>Pour plusieurs clients</div>
<div class="o3"><span class="cases">{ic("profil","s")}</span><b>En indépendant</b>Consultant ou chasseur</div>
<div class="o4"><span class="cases">{ic("former","s")}</span><b>Une école</b>Stages et premiers emplois</div></div>'''
OB1_C = f'''<div class="ill-o">{orbi(56)}<div class="t"><b>Bienvenue dans Jumanly Hire</b>Publiez, triez et rencontrez les bons talents. Orbi vous aide, vous décidez.</div></div>
<div class="ob-q"><h2>Vous recrutez pour…</h2><p>Jumanly prépare votre espace en conséquence.</p></div>{OBJ_R}'''
W_OB1 = pub('/hire/bienvenue', obr(1, OB1_C, '<span></span><a class="bt p m">Continuer</a>'))
T_OB1 = tpub(obr(1, OB1_C.replace('class="obj-g"', 'class="obj-g" style="grid-template-columns:repeat(2,minmax(0,1fr))"'), '<span></span><a class="bt p m">Continuer</a>'))
OB2_C = f'''<div class="ob-q"><h2>Votre organisation</h2><p>Elle apparaîtra sur vos offres.</p></div>
<div class="g2r" style="width:100%;max-width:900px;margin:0 auto"><div class="col"><div class="logo-up"><span class="lg-e sap">BF</span><div class="t"><b>Logo</b>PNG ou SVG, carré · facultatif</div><a class="bt sec s">{ic("photo","xs")}Ajouter</a></div>
{champ('Nom','Baobab Fintech','focus')}<div class="duo-f"><div class="champ"><label>Pays</label><div class="verre saisie">{FLAG["cd"]}&nbsp;&nbsp;RD Congo</div></div>{champ('Site web','baobab-fintech.example','', None, 'Facultatif')}</div>
<div class="duo-f"><div class="champ"><label>Secteur</label><div class="verre saisie">Finance</div></div><div class="champ"><label>Taille</label><div class="verre saisie">50 à 200</div></div></div></div>
<div class="col"><span class="ck-t">Aperçu sur une offre</span><div class="verre carte" style="padding:16px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;gap:12px;align-items:center"><span class="lg-e sap">BF</span><div><b style="display:block;font-size:14px">Analyste de données junior</b><span style="font-size:12px;color:var(--texte2)">Baobab Fintech · Kinshasa</span></div></div><div class="tons"><span>CDI</span><span>Hybride</span></div></div>
<div class="gar">{ic("cadenas","s")}Votre e-mail @baobab-fintech.example servira à la vérification.</div></div></div>'''
W_OB2 = pub('/hire/bienvenue/organisation', obr(2, OB2_C, f'<a class="bt sec m">{ic("retour","s")}Retour</a><a class="bt p m">Continuer</a>'))
OB3_C = f'''<div class="pret" style="align-items:center"><span class="rond-ok" style="width:72px;height:72px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37">{ic("valider")}</span><h2>Votre espace recruteur est prêt</h2><p>Vous commencez avec RH Free : 1 siège et 1 offre active.</p></div>
<div class="q3" style="width:100%;max-width:640px;margin:0 auto"><div class="verre"><b>1</b>siège</div><div class="verre"><b>1</b>offre active</div><div class="verre"><b>5</b>étapes de suivi</div></div>
<div class="g3" style="width:100%;max-width:900px;margin:0 auto"><div class="verre carte" style="padding:16px;gap:8px;display:flex;flex-direction:column"><span class="cases" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:var(--g-former);color:#0F3F37">{ic("offre","s")}</span><b>Publier une première offre</b><span style="font-size:12.5px;color:var(--texte2)">4 étapes, Orbi peut la rédiger</span></div>
<div class="verre carte" style="padding:16px;gap:8px;display:flex;flex-direction:column"><span class="cases" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:var(--g-accomp);color:#0F3F37">{ic("entreprise","s")}</span><b>Faire vérifier l’organisation</b><span style="font-size:12.5px;color:var(--texte2)">Publication sans attente</span></div>
<div class="verre carte" style="padding:16px;gap:8px;display:flex;flex-direction:column"><span class="cases" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:var(--g-oppo);color:#0F3F37">{ic("candidats","s")}</span><b>Inviter un collègue</b><span style="font-size:12.5px;color:var(--texte2)">Dès RH Pro</span></div></div>
<div class="orbi-l" style="width:100%;max-width:900px;margin:0 auto">{orbi(26)}<div class="t"><b>Orbi</b> peut rédiger votre première offre à partir d’un intitulé. Vous relisez avant de publier.</div></div>'''
W_OB3 = pub('/hire/bienvenue/pret', obr(3, OB3_C, f'<a class="bt sec m">{ic("retour","s")}Retour</a><a class="bt a m">Commencer</a>'))

# ---------- Chemins ----------
def chemins_w():
    def c(t, et):
        p = f' {ic("suivant","xs")} '.join(f'<span class="{"f" if i == len(et) - 1 else ""}">{e}</span>' for i, e in enumerate(et))
        return f'<div class="c"><b>{t}</b><div class="p">{p}</div></div>'
    return '<div class="ch0">' + ''.join(c(t, e) for t, e in [
        ('Demander à Orbi', ['Orbi dans la barre de gauche ou Ctrl K', 'Conversation']), ('Répondre à un candidat', ['Messages', 'Conversation', 'Brouillon d’Orbi ou modèle', 'Envoyer']),
        ('Voir les alertes', ['Cloche en haut', 'Votre journée en bref', 'Notifications']), ('Ouvrir le compte', ['Avatar en haut', 'Menu du compte', 'Compte']),
        ('Faire vérifier l’organisation', ['Compte', 'Organisation', 'Faire vérifier']), ('Gérer l’équipe', ['Compte', 'Équipe', 'Inviter']),
        ('Changer de formule', ['Compte', 'Abonnement', 'Formules', 'Paiement']), ('Suivre les résultats', ['Rapports dans la barre de gauche', 'Exporter en PDF']),
        ('Commencer comme recruteur', ['Inscription', 'Je recrute', 'Organisation', 'Espace prêt'])]) + '</div>'

def W(e, t, n=''): return wrow(wfig(e, '<span class="wtag">Ordinateur</span>' + t, n))
def T(e, t, n=''): return wrow(wfig(e, '<span class="wtag t">Tablette</span>' + t, n))
ECR = [
 ('w0', '0 · Comment on y arrive', 'Les mêmes chemins qu’en mobile, sans pastilles. Sur grand écran, Orbi est dans la barre de gauche et le compte s’ouvre par l’avatar en haut à droite.', [chemins_w()]),
 ('w1', '1 · Orbi', 'Une page de conversation avec l’historique à gauche. Orbi propose un ordre de lecture, il ne rejette personne et n’envoie rien sans vous.',
  [W(W_ORB, 'Orbi', 'Quatre aides, réponse avec Pourquoi ?, 99 crédits.'), T(T_ORB, 'Orbi')]),
 ('w2', '2 · Messages et notifications', 'La liste, la conversation et la candidature côte à côte. Orbi propose une réponse, le recruteur relit et envoie.',
  [W(W_MSG, 'Messages', 'Étapes en badge, lu, en train d’écrire, raccourcis Orbi.'), W(W_MOD, 'Modèles de messages', 'Insérés dans le message, relus avant l’envoi.'),
   W(W_NOTIF, 'Notifications', 'Votre journée en bref par Orbi, puis les alertes.'), T(T_MSG, 'Messages')]),
 ('w3', '3 · Compte et organisation', 'Tout le compte en cartes. La page de l’organisation se voit comme un talent la verra.',
  [W(W_AMENU, 'Menu du compte', 'Depuis l’avatar.'), W(W_CPT, 'Compte', 'Organisation, équipe, viviers, rapports, abonnement.'), W(W_PROF, 'Mon profil RH', 'Ce que voient les candidats.'),
   W(W_ORG, 'Organisation', 'Bannière, chiffres, présentation, sites, photos.'), W(W_VERIF, 'Vérifier l’organisation', '2 étapes sur 3, examen sous 2 jours ouvrés.'), T(T_CPT, 'Compte')]),
 ('w4', '4 · Équipe', 'Sièges, membres, droits par rôle et activité sur une seule page.',
  [W(W_EQ, 'Équipe', 'Admin, recruteur, lecteur.'), W(W_INV, 'Inviter', 'Plus de siège libre : l’invitation attend ou RH Premium.')]),
 ('w5', '5 · Abonnement et paiement', 'Prépayé, sans renouvellement forcé. Les candidatures restent illimitées et gratuites dans toutes les formules.',
  [W(W_ABO, 'Abonnement', 'Jours restants, quotas, échéances, factures.'), W(W_FORMS, 'Formules RH', 'Free, Pro, Premium et comparaison.'), W(W_PAY, 'Paiement', 'Mobile Money, récapitulatif, facture au nom de l’organisation.'),
   W(W_PATT, 'Validation sur le téléphone'), W(W_POK, 'Paiement reçu', 'Le 3e siège est libre.'), T(T_FORMS, 'Formules RH')]),
 ('w6', '6 · Rapports', 'Des chiffres réels, sans donnée personnelle des candidats, et un export PDF aux couleurs de Jumanly.',
  [W(W_RAP, 'Rapports', 'Indicateurs, entonnoir, semaines, origines.'), T(T_RAP, 'Rapports')]),
 ('w7', '7 · Paramètres', 'Les réglages à gauche, le détail à droite. Chaque profil ouvert par l’équipe est enregistré.',
  [W(W_PRM, 'Notifications, Orbi, apparence'), W(W_SEC, 'Sécurité et journal des consultations')]),
 ('w8', '8 · Premiers pas', 'Trois étapes en plein écran, puis l’espace recruteur.',
  [W(W_OB1, 'Vous recrutez pour…'), W(W_OB2, 'Votre organisation', 'Aperçu sur une offre.'), W(W_OB3, 'Espace prêt', 'RH Free, premières actions.'), T(T_OB1, 'Vous recrutez pour…')]),
 ('w9', '9 · Mode sombre', 'Les mêmes écrans sur fond Nuit.', [W(wsombre(W_ORB), 'Orbi'), W(wsombre(W_MSG), 'Messages'), W(wsombre(W_CPT), 'Compte'), W(wsombre(W_ABO), 'Abonnement')]),
]
_st = lambda x: x.replace('<style>', '').replace('</style>', '')
page_w('recruteur-3', 'Jumanly Hire · version ordinateur et tablette', 'Recruteur, lot 3 : Orbi, messages, compte',
       '19 octobre 2026. Les écrans du lot 3 recruteur mobile adaptés aux grands écrans : Orbi, messagerie, notifications, compte, organisation, équipe, abonnement, rapports, paramètres et premiers pas. Contenus fictifs.', ECR,
       CSS + CSS1 + CSS2 + CSS3L + CSS4 + CSSR + _st(CSS_AB) + _st(CSS_RP) + CSSWR1 + CSSW2 + CSSW4 + CSSWR3)
