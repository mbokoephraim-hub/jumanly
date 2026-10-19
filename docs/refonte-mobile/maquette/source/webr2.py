# Version ordinateur et tablette · recruteur, lot 2 : candidats, dossier, décision, entretiens, talents (19/10/2026). python3 webr2.py && node shotw.js recruteur-2
# Calendrier réel : le 19 octobre 2026 est un lundi, le 22 un jeudi. Les jours de la semaine sont donc corrigés ici.
import os
H = os.path.dirname(os.path.abspath(__file__))
_r2 = open(H + '/recruteur2.py').read(); exec(_r2[:_r2.index('\nCHEMINS = [')])     # écrans et CSS du lot 2 recruteur (avec r2plus)
_K = (CSS2, CSS3L, CSS4, CSSR)
_s = open(H + '/web1.py').read(); exec(_s[:_s.index('\nECR = [')])
CSS2, CSS3L, CSS4, CSSR = _K
_w = open(H + '/webr1.py').read(); exec(_w[_w.index("CSSWR1 = '''"):_w.index('\n# ---------- 1. À traiter')])   # CSS commun du lot 1 web, R(), RT()

CSSWR2 = '''
.w-h .seg{flex:none;width:380px}
.tlb{display:flex;align-items:center;gap:12px}
.tlb .off-sel{flex:0 0 300px;padding:10px 16px}
.tlb .filtres-h{flex:1}
.tlb .bt{flex:none}
/* Liste + dossier */
.ats{display:grid;grid-template-columns:360px minmax(0,1fr);gap:20px;align-items:start}
.ats .lst-c{display:flex;flex-direction:column;gap:10px}
.w-c .cl{padding:12px 14px}
.cl.sel{box-shadow:inset 0 0 0 2px #0F3F37,var(--verre)!important}.sombre .cl.sel{box-shadow:inset 0 0 0 2px #A6F26B!important}
.dos-p{padding:0;display:flex;flex-direction:column;overflow:hidden;border-radius:28px}
.dos-p .in{padding:18px;display:flex;flex-direction:column;gap:12px}
.dos-p .actd{display:flex;gap:8px;padding:14px 18px;border-top:1px solid var(--trait);align-items:center}
.dos-p .actd .bt{flex:none}.dos-p .actd .sp{flex:1}
.w-c .dos-top{padding:18px}.w-c .dos-top .av{width:66px;height:66px;font-size:20px}.w-c .dos-top h2{font-size:22px}.w-c .dos-top p{font-size:13px}
.w-c .ring{width:56px;height:56px}.w-c .ring b{width:44px;height:44px;font-size:13px!important}
.w-c .parc span{font-size:11.5px}
.w-c .doc-p .d .pg{height:120px}
.w-c .pq-o{padding:16px 18px;font-size:13.5px}
.w-c .cpt-l{padding:16px 18px}.w-c .cpt-l .r b{font-size:13.5px}
/* Dossier pleine page */
.dosw{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:20px;align-items:start}
.retour-l{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--texte2)}.retour-l .ic{transform:rotate(180deg);width:14px;height:14px}
.act-c{padding:16px;display:flex;flex-direction:column;gap:10px;border-radius:26px}
.act-c .bt{width:100%;justify-content:center}
.act-c .k{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}
.nav-c{display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--texte2)}.nav-c .bi{width:36px;height:36px}.nav-c span{flex:1;text-align:center}
.nav-c .g .ic{transform:rotate(180deg)}
/* Décision */
.w-c .res3b a{padding:16px;font-size:14px;min-height:118px}.w-c .res3b a small{font-size:12px}
.w-c .msg-o{padding:16px 18px;font-size:13.5px}
.w-c .evs div{padding:12px 14px}
.dec-ok{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px;align-items:start;padding:30px;border-radius:30px;background:linear-gradient(140deg,#F2FCE6,#DDF6EE)}
.sombre .dec-ok{background:linear-gradient(140deg,rgba(166,242,107,.14),rgba(47,211,166,.06))}
.dec-ok .l{display:flex;flex-direction:column;gap:12px}.dec-ok h2{font-size:28px;font-weight:600;letter-spacing:-.02em}.dec-ok p{font-size:14px;color:var(--texte2)}
.dec-ok .r{display:flex;flex-direction:column;gap:10px}
/* Entretien */
.w-c .modes a{padding:16px 6px;font-size:13.5px}
.w-c .durees span{padding:11px 0;font-size:13.5px}
.w-c .calm .g7m span{height:46px;font-size:14px}
.w-c .jg{height:430px}.w-c .jg .zone{background:repeating-linear-gradient(to bottom,transparent 0,transparent 53px,var(--trait) 53px,var(--trait) 54px)}
.w-c .jg .blk{font-size:12.5px;padding:8px 12px}.w-c .jg .blk b{font-size:13px}
.w-c .recap-b{position:static;padding:10px 10px 10px 20px}
.w-c .inv2{max-width:440px}.w-c .inv2 .ban{height:84px}.w-c .inv2 h3{font-size:19px}
.ph-w{display:flex;justify-content:center;padding:26px;border-radius:30px;background:linear-gradient(160deg,#E9F5EC,#F4EFE6)}
.sombre .ph-w{background:rgba(255,255,255,.04)}
/* Agenda semaine */
.agw{padding:0;overflow:hidden;border-radius:28px}
.agw .hd{display:grid;grid-template-columns:56px repeat(5,minmax(0,1fr)) repeat(2,minmax(0,.55fr));border-bottom:1px solid var(--trait)}
.agw .hd span{padding:12px 0;text-align:center;font-size:11.5px;color:var(--texte2);display:flex;flex-direction:column;align-items:center;gap:2px}
.agw .hd span b{font-size:18px;color:var(--texte)}
.agw .hd span.auj b{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#0F3F37;color:#C8F59E}
.sombre .agw .hd span.auj b{background:var(--lime);color:#0F3F37}
.agw .gr{display:grid;grid-template-columns:56px repeat(5,minmax(0,1fr)) repeat(2,minmax(0,.55fr));position:relative;height:542px}
.agw .hrs{display:flex;flex-direction:column}.agw .hrs span{height:60px;font-size:11px;color:var(--texte2);text-align:right;padding:4px 8px 0 0}
.agw .cj{position:relative;border-left:1px solid var(--trait);background:repeating-linear-gradient(to bottom,transparent 0,transparent 59px,var(--trait) 59px,var(--trait) 60px)}
.agw .cj.we{background-color:var(--zone)}
.agw .ev{position:absolute;left:5px;right:5px;border-radius:12px;padding:7px 9px;font-size:11.5px;line-height:1.3;display:flex;flex-direction:column;gap:2px;border-left:4px solid #2FD3A6;background:var(--plein);box-shadow:var(--verre)}
.agw .ev b{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.agw .ev em{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.agw .ev em{font-style:normal;color:var(--texte2)}
.agw .ev.at{border-left-color:#F2B33D}.agw .ev.rp{border-left-color:#E25C4B;background:repeating-linear-gradient(135deg,var(--zone) 0 6px,var(--plein) 6px 12px)}
.agw .ev.ok{background:linear-gradient(150deg,#F2FCE6,var(--plein))}.sombre .agw .ev.ok{background:rgba(166,242,107,.1)}
.agw .now{position:absolute;left:56px;right:0;height:2px;background:var(--corail);z-index:2}
/* Talents */
.tal-g{display:grid;grid-template-columns:270px minmax(0,1fr);gap:20px;align-items:start}
.flt-p{padding:18px;display:flex;flex-direction:column;gap:14px;border-radius:26px}
.flt-p h3{font-size:16px;font-weight:600}
.flt-p .champ label{font-size:12px}
.flt-p .puces{gap:6px}.flt-p .puce{font-size:12.5px;padding:6px 12px;height:auto}
.flt-p .bts{flex-direction:row}.flt-p .bts .bt{flex:1}
.w-c .tl{padding:16px}
.w-c .sub-t{max-width:420px}
.cnt-l{font-size:13px;color:var(--texte2)}
/* Profil talent */
.tpw{padding:0;overflow:hidden;border-radius:30px}
.tpw .cov{height:150px;position:relative;background:linear-gradient(130deg,#0F3F37 0%,#14574A 55%,#2FD3A6 130%)}
.tpw .cov>svg{position:absolute;inset:0;width:100%;height:100%}
.tpw .id{display:flex;align-items:center;gap:18px;padding:0 24px 20px;margin-top:-48px;position:relative}
.tpw .id .av{align-self:flex-start;width:104px;height:104px;font-size:30px;flex:none;box-shadow:0 0 0 5px var(--plein),0 14px 28px -14px rgba(15,63,55,.6);color:#0F3F37}
.tpw .id .t{flex:1;display:flex;flex-direction:column;gap:6px;padding-top:58px}
.tpw .id h2{font-size:26px;font-weight:600;letter-spacing:-.02em}
.tpw .id p{font-size:13.5px;color:var(--texte2);display:flex;gap:6px;align-items:center}
.tpw .id .k{display:flex;gap:6px;flex-wrap:wrap}
.tpw .id .bts{gap:8px;flex:none;padding-top:58px}.tpw .id .bts .bt{flex:none}
.w-c .st4 div{padding:14px 6px;font-size:12px}.w-c .st4 div b{font-size:22px}
.w-c .prj{gap:12px}.w-c .prj .p{flex:1 1 0}.w-c .prj .p .im{height:110px}
.w-c .xp{padding:16px 18px}
/* Propositions */
.w-c .pp .r{padding:14px 18px}
.pp-h{display:grid;grid-template-columns:54px minmax(0,1fr) 240px 190px 130px;gap:12px;padding:12px 18px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2);border-bottom:1px solid var(--trait)}
.w-c .pp .r{display:grid;grid-template-columns:42px minmax(0,1fr) 240px 190px 130px;gap:12px}
.pp-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}
.w-c .vv .pile .av{width:34px;height:34px;font-size:11px}
.pp .r .o{font-size:12.5px}.pp .r .d{font-size:12.5px;color:var(--texte2)}.pp .r .a{justify-self:end}
.pp .r .t span.etq-s{margin-left:0}
/* Viviers */
.vv3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.w-c .vv2{padding:18px}
.tab .ats{grid-template-columns:1fr}.tab .tal-g{grid-template-columns:1fr}.tab .tlb{flex-wrap:wrap}.tab .tlb .off-sel{flex:1 1 100%}
'''

def RC(c, url='/hire/candidats', **k): return web(c, 'candidats', 'rh', url, **k)
SEGW_C = '<div class="seg"><span class="on">Candidatures</span><span>Rechercher des talents</span></div>'
SEGW_T = '<div class="seg"><span>Candidatures</span><span class="on">Rechercher des talents</span></div>'
ORB_AN = f'<div class="orbi-l">{orbi(26)}<div class="t"><b>9 candidatures</b> pas encore analysées. Orbi peut les classer : vous gardez la décision.</div><a class="bt p s">Analyser</a></div>'
ETP_F = '<div class="filtres-h"><span class="puce on">Toutes<small>24</small></span><span class="puce">Reçue<small>9</small></span><span class="puce">En examen<small>7</small></span><span class="puce">Présélectionnée<small>4</small></span><span class="puce">Entretien<small>2</small></span><span class="puce">Décision<small>2</small></span></div>'
TRI_B = f'<a class="bt sec s">{ic("filtres","xs")}Trier et filtrer</a>'
LISTE = (cl("AM","","Amani M.","Il y a 2 h · CV, lettre","Reçue",88,"",True).replace('class="verre cl"', 'class="verre cl sel"', 1)
         + cl("GM","b","Grâce M.","18 oct. · CV, attestation","Entretien",86) + cl("FN","a","Fatou N.","Hier · CV","Reçue",74,"m",True)
         + cl("JT","","Joël T.","15 oct. · CV, lettre","En examen",71,"m") + cl("RM","b","Ruth M.","14 oct. · CV","En examen",64,"m") + cl("PK","b","Patrick K.","12 oct. · CV","En examen",52,"f"))
DOCS = f'''<div class="doc-p"><div class="d"><div class="pg"><i class="h"></i><i></i><i style="width:80%"></i><i></i><i style="width:60%"></i><i></i><i style="width:70%"></i></div><div class="t">{ic("cv","xs")}<div><b>CV</b>2 pages · PDF</div>{ic("telecharger","xs")}</div></div><div class="d"><div class="pg"><i class="h" style="width:40%"></i><i></i><i></i><i style="width:70%"></i><i></i><i style="width:50%"></i></div><div class="t">{ic("document","xs")}<div><b>Lettre</b>1 page · PDF</div>{ic("telecharger","xs")}</div></div></div>'''
RESUME = f'''<div class="pq-o"><div class="h">{orbi(30)}<div class="t"><b>Résumé par Orbi</b><span>Tiré du dossier seulement · Orbi ne décide pas</span></div></div>
<div class="pt"><i class="v">✓</i><span>Tableaux de bord Power BI pour 3 agences, en stage.</span></div>
<div class="pt"><i class="v">✓</i><span>SQL attesté sur Jumanly.</span></div>
<div class="pt"><i class="a">!</i><span>Python déclaré, sans preuve : à vérifier.</span></div>
<a class="pq">{ic("pourquoi","xs")}Pourquoi 88 % ?</a></div>'''
CPT = f'''<div class="verre cpt-l"><div class="hh"><b>Compétences de l’offre</b><span>6 sur 7</span></div>
<div class="r"><b>SQL</b><span class="pv at">{ic("certificat","xs")}Attestation</span><span class="lv"><i class="on"></i><i class="on"></i><i class="on"></i><i></i></span></div>
<div class="r"><b>Power BI</b><span class="pv pj">{ic("realisation","xs")}Projet</span><span class="lv"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i></span></div>
<div class="r"><b>Excel</b><span class="pv dc">Déclarée</span><span class="lv"><i class="on"></i><i class="on"></i><i></i><i></i></span></div>
<div class="r"><b>Python · souhaitée</b><span class="pv mq">Non prouvée</span></div></div>'''
ACTB = f'<a class="bt p m">{ic("progression","s")}Changer d’étape</a><a class="bt sec m">{ic("entretien","s")}Entretien</a><a class="bt sec m">{ic("message","s")}Écrire</a>'

def ats(t=False):
    h = wh('Candidats', 'Analyste de données junior · 24 candidatures', SEGW_C)
    tl_ = f'<div class="tlb"><div class="verre off-sel">{ic("offre","s")}<div class="t"><small>Offre</small><b>Analyste de données junior</b></div>{ic("suivant","s")}</div><span style="flex:1"></span>{TRI_B}</div>' + ETP_F
    if t:
        return h + tl_ + ORB_AN + f'<div class="sec-w"><h2 style="font-size:14px;color:var(--texte2);font-weight:500">Triées par correspondance</h2></div><div class="g2e">{LISTE}</div>'
    dos = f'''<div class="verre dos-p">{dos_haut().replace('class="verre carte"', 'class="carte"', 1)}<div class="in">{RESUME}{DOCS}</div>
<div class="actd">{ACTB}<span class="sp"></span><a class="bi" title="Ouvrir le dossier complet">{ic("suivant","s")}</a></div></div>'''
    return h + tl_ + ORB_AN + f'<div class="ats"><div class="lst-c"><span class="cnt-l">Triées par correspondance · un filtre ne rejette personne</span>{LISTE}</div>{dos}</div>'
W_ATS = RC(ats())
T_ATS = RT(ats(True), 'candidats')
TRI_POP = f'''<div class="org-pop" style="left:auto;right:30px;top:268px;width:380px"><h4>Trier et filtrer</h4>
<div class="champ"><label>Trier par</label><div class="puces"><span class="puce on">Correspondance</span><span class="puce">Date</span><span class="puce">Étape</span></div></div>
<div class="champ"><label>Correspondance</label><div class="puces"><span class="puce">85 % et plus</span><span class="puce on">70 % et plus</span><span class="puce">Toutes</span></div></div>
<div class="champ"><label>Dossier</label><div class="puces"><span class="puce">Dossier complet</span><span class="puce">Avec lettre</span><span class="puce">Non lues</span></div></div>
<div class="gar">{ic("pourquoi","s")}Un filtre masque, il ne rejette personne. Chaque candidature reste consultable.</div>
<div class="bts" style="flex-direction:row"><a class="bt sec m">Effacer</a><a class="bt p m pl">Voir 18 candidatures</a></div></div>'''
W_TRI = RC(ats(), over=TRI_POP)

def vide_c():
    return wh('Candidats', 'Responsable conformité', SEGW_C) + f'''<div class="tlb"><div class="verre off-sel">{ic("offre","s")}<div class="t"><small>Offre</small><b>Responsable conformité</b></div>{ic("suivant","s")}</div><span class="sp" style="flex:1"></span></div>
<div class="g2"><div class="verre vide-r" style="padding:44px"><span class="rond-ok" style="background:var(--g-accomp)">{ic("candidats")}</span><b>Pas encore de candidature</b><span>L’offre est en validation. Les candidatures arriveront dès sa publication.</span></div>
<div class="col"><span class="ck-t">En attendant</span><div class="verre liste lignes"><div class="li"><span class="cases c2">{ic("recherche","s")}</span><div class="t"><b>Rechercher des talents</b><span>Inviter des profils visibles à postuler</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c3">{ic("favori","s")}</span><div class="t"><b>Ouvrir le vivier « Conformité »</b><span>3 talents gardés</span></div>{ic("suivant")}</div></div>
<div class="verre li" style="border-radius:22px;padding:14px 16px"><span class="cases" style="background:var(--ciel-c)">{ic("horloge","s")}</span><div class="t"><b>Vérification par Jumanly</b><span>Envoyée le 18 octobre · réponse sous 24 heures</span></div></div></div></div>'''
W_VIDE = RC(vide_c())

# ---------- Dossier ----------
REPS = sect("document","former","Réponses aux questions","1", '<div class="repq"><b>Êtes-vous disponible avant le 1er décembre ?</b><em style="font-style:normal;color:var(--texte2)">Oui, dès le 15 novembre.</em></div>')
NOTES = sect("modifier","accomp","Notes privées","2", '<div class="note-p">Très bon portfolio. À interroger sur Python.<small>Nadia K. · aujourd’hui · modifiable</small></div><div class="note-p" style="background:var(--ciel-c)">D’accord pour un entretien.<small>Olivier B. · aujourd’hui</small></div><a class="ajout s">' + ic("plus","s") + 'Ajouter une note</a>')
HISTD = sect("horloge","oppo","Historique","3", '<div class="hist-l"><span><b>Nadia K.</b> a ouvert le dossier · 10:52</span><span><b>Orbi</b> a résumé le dossier à la demande de Nadia · 10:53</span><span>Candidature reçue · 08:40</span></div>')
NAVC = f'<div class="nav-c"><a class="bi g">{ic("suivant","s")}</a><span>Candidature 1 sur 24</span><a class="bi">{ic("suivant","s")}</a></div>'
def dossier(haut=None, gauche=None, droite_extra='', notes=None, hist=None):
    hd = haut or dos_haut()
    g = gauche or (RESUME + DOCS + CPT + REPS)
    act = f'<div class="verre act-c"><span class="k">Actions</span>{ACTB}</div>'
    return (f'<a class="retour-l">{ic("suivant","s")}Candidatures · Analyste de données junior</a>' + hd
            + f'<div class="dosw"><div class="col">{g}</div><div class="col">{act}{droite_extra}{notes or NOTES}{hist or HISTD}{NAVC}</div></div>')
UD = '/hire/candidats/amani-m'
W_DOS = RC(dossier(), UD)
T_DOS = RT(dossier().replace('class="dosw"', 'class="g2e"'), 'candidats')
DLG_PQ = f'''<h3>Pourquoi 88 % ?</h3><p class="ss" style="font-size:13px;color:var(--texte2)">Calcul fixe, le même pour tous les candidats de l’offre.</p>
<div class="crit">
<div class="c"><div class="h"><b>Compétences requises</b><span>3 sur 3</span></div><span class="j"><i style="width:100%"></i></span></div>
<div class="c"><div class="h"><b>Compétences souhaitées</b><span>0 sur 1</span></div><span class="j"><i style="width:10%"></i></span><p>Python non prouvé.</p></div>
<div class="c"><div class="h"><b>Expérience</b><span>1 an pour 0 à 2</span></div><span class="j"><i style="width:100%"></i></span></div>
<div class="c"><div class="h"><b>Lieu et contrat</b><span>Correspondent</span></div><span class="j"><i style="width:100%"></i></span></div></div>
<div class="gar">{ic("confidentialite","s")}Jamais pris en compte : nom, genre, âge, photo, nationalité, origine, religion, situation familiale, santé, handicap, adresse précise.</div>
<div class="gar">{ic("pourquoi","s")}Un repère, pas une décision. Aucun candidat n’est écarté par le score.</div>'''
W_PQ = RC(dossier(), UD, over=fenetre(DLG_PQ))
ORB_A = f'''<div class="res-o"><b style="font-size:13.5px">Points forts</b><ul><li>Expérience concrète de tableaux de bord en agence</li><li>SQL attesté, Power BI prouvé par un projet</li></ul>
<b style="font-size:13.5px">À vérifier en entretien</b><ul><li>Python : déclaré dans la lettre, sans preuve</li><li>Disponibilité : 15 novembre</li></ul></div>
<div class="gar">{ic("cadenas","s")}Orbi lit le dossier comme une donnée : les consignes écrites dans un CV sont ignorées. 1 crédit Orbi utilisé, 99 restants.</div>'''
W_ORB = RC(dossier(), UD, over=panneau_orbi('Analyse du dossier', 'Amani M. · Analyste de données junior', ORB_A, '<a class="bt sec m">Signaler une erreur</a><a class="bt p m">Ajouter aux notes</a>'))
LOCK = f'''<div class="lock-r" style="background:linear-gradient(150deg,#F2FCE6,#DDF6EE);padding:18px"><b>{orbi(24)}Résumé et analyse par Orbi</b>Disponibles dès RH Pro, avec 100 crédits Orbi par mois.<a class="bt sec s" style="align-self:flex-start;margin-top:6px">Voir RH Pro</a></div>'''
CPT_F = f'''<div class="verre cpt-l"><div class="hh"><b>Compétences de l’offre</b><span>5 sur 7</span></div>
<div class="r"><b>SQL</b><span class="pv dc">Déclarée</span></div><div class="r"><b>Power BI</b><span class="pv at">{ic("certificat","xs")}Attestation</span></div><div class="r"><b>Python</b><span class="pv mq">Non indiquée</span></div>
<a class="pq">{ic("pourquoi","xs")}Pourquoi 74 % ? Toujours inclus</a></div>'''
DOC_F = f'''<div class="doc-p"><div class="d"><div class="pg"><i class="h"></i><i></i><i style="width:80%"></i><i></i><i style="width:60%"></i></div><div class="t">{ic("cv","xs")}<div><b>CV</b>1 page · PDF</div></div></div><div class="d" style="display:grid;place-items:center;color:var(--texte2);font-size:12px;text-align:center;padding:10px">Pas de lettre<br>Facultative</div></div>'''
NOTES_F = sect("modifier","accomp","Notes privées","0", '<a class="ajout s">' + ic("plus","s") + 'Ajouter une note</a>')
HIST_F = sect("horloge","oppo","Historique","2", '<div class="hist-l"><span><b>Nadia K.</b> a ouvert le dossier · 10:58</span><span>Candidature reçue · hier, 17:20</span></div>')
W_LOCK = RC(dossier(dos_haut("FN","a","Fatou N.","Chargée d’études · Kinshasa",74).replace('a postulé il y a 2 h', 'a postulé hier'), LOCK + CPT_F + DOC_F + f'<div class="gar">{ic("valider","s")}Sans Orbi, tout le dossier reste lisible : CV, réponses, score et son pourquoi.</div>', notes=NOTES_F, hist=HIST_F).replace('Candidature 1 sur 24', 'Candidature 3 sur 24'), '/hire/candidats/fatou-n')

# ---------- Étapes et décision ----------
DLG_ET = f'''<h3>Déplacer Amani M.</h3><div class="verre liste lignes etp-ch" style="box-shadow:none;background:var(--zone)">
<div class="li"><div class="t"><b>Reçue</b></div><span class="v">actuelle</span></div>
<div class="li"><div class="t"><b>En examen</b></div>{CHK}</div>
<div class="li"><div class="t"><b>Présélectionnée</b></div>{NOCHK}</div>
<div class="li"><div class="t"><b>Entretien</b><span>Proposer des créneaux ensuite</span></div>{NOCHK}</div>
<div class="li"><div class="t"><b>Décision finale</b><span>Retenue, non retenue ou retrait</span></div>{NOCHK}</div></div>
<div class="gar">{ic("notification","s")}Amani verra « En examen » dans son suivi. Aucun message n’est envoyé.</div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Déplacer</a></div>'''
W_ET = RC(dossier(), UD, over=fenetre(DLG_ET))
def decis():
    return wh('Décision finale', 'Chargé de clientèle · Lubumbashi') + f'''<div class="g2"><div class="col">
<div class="verre carte" style="padding:16px 18px;display:flex;flex-direction:column;gap:14px"><div class="mini-c" style="padding:0"><span class="av">MK</span><div class="t"><b>Marc K.</b><span>Chargé de clientèle · entretien le 15 oct.</span></div>{ring(71)}</div>
<div class="parc"><span><i></i>Reçue</span><span><i></i>Examen</span><span><i></i>Présél.</span><span><i></i>Entretien</span><span class="now"><i></i>Décision</span></div></div>
<span class="lab-c">Évaluations de l’équipe</span><div class="evs"><div><b>Relation client</b>Olivier B.<span class="n4"><i class="on"></i><i class="on"></i><i class="on"></i><i></i></span></div><div><b>Connaissance produit</b>Nadia K.<span class="n4"><i class="on"></i><i class="on"></i><i></i><i></i></span></div></div>
<span class="lab-c">Résultat</span>
<div class="res3b"><a class="r1"><span class="cases">{ic("valider","s")}</span>Retenue<small>Offre d’emploi</small></a><a class="r2 on"><span class="cases">{ic("fermer","s")}</span>Non retenue<small>Message respectueux</small></a><a class="r3"><span class="cases">{ic("deconnexion","s")}</span>Retrait<small>Le candidat se retire</small></a></div></div>
<div class="col"><span class="lab-c">Message au candidat</span><div class="msg-o"><span class="k">{orbi(18)}Orbi a préparé le message, à relire</span><p>Bonjour Marc, merci pour notre échange du 15 octobre. Nous avons retenu un autre profil. Nous avons apprécié <mark>votre écoute des clients</mark> et aimerions garder contact pour une prochaine offre.</p>
<div class="tons"><span class="on">Respectueux</span><span>Plus court</span><span>Modèle d’origine</span><span>{ic("modifier","xs")} Écrire moi-même</span></div></div>
<div class="verre liste lignes"><div class="li"><span class="cases c2">{ic("favori","s")}</span><div class="t"><b>Ajouter au vivier « Relation client »</b><span>Marc en est informé</span></div><span class="sw on"></span></div></div>
<div class="gar">{ic("horloge","s")}Rien n’est automatique : vous confirmez, et vous pouvez annuler pendant 10 minutes.</div>
<div class="bts" style="flex-direction:row;justify-content:flex-end"><a class="bt sec m">Plus tard</a><a class="bt p m">Confirmer et envoyer</a></div></div></div>'''
W_DEC = RC(decis(), '/hire/candidats/marc-k/decision')
def decis_ok():
    return f'''<div class="dec-ok"><div class="l"><span class="rond-ok">{ic("valider")}</span><h2>Décision enregistrée</h2><p>Marc K. passe en « Non retenue ».</p>
<div class="verre chk"><div><span class="o">{CK}</span>Message envoyé à Marc, après votre relecture</div><div><span class="o">{CK}</span>Ajouté au vivier « Relation client »</div><div><span class="o">{CK}</span>Historique de la candidature mis à jour</div><div><span class="o g">{ic("horloge","xs")}</span>Annulable encore 9 min 52 s</div></div></div>
<div class="r"><span class="ck-t">Encore à décider pour cette offre</span>
<div class="verre mini-c"><span class="av a">SM</span><div class="t"><b>Sandra M.</b><span>Entretien passé le 16 oct. · évaluée 4/4</span></div>{ring(78)}</div>
<div class="verre mini-c"><span class="av b">EK</span><div class="t"><b>Eric K.</b><span>Entretien passé ce matin · à évaluer</span></div>{ring(69)}</div>
<div class="bts" style="flex-direction:row"><a class="bt sec m">Annuler la décision</a><a class="bt p m pl">Candidature suivante</a></div><a class="bt txt" style="align-self:flex-start">Retour aux candidats</a></div></div>
<div class="g2e"><div class="col"><span class="ck-t">Ce que Marc a reçu</span><div class="msg-o"><span class="k">{ic("message","xs")}Baobab Fintech · Chargé de clientèle</span><p>Bonjour Marc, merci pour notre échange du 15 octobre. Nous avons retenu un autre profil. Nous avons apprécié votre écoute des clients et aimerions garder contact pour une prochaine offre.</p></div></div>
<div class="col"><span class="ck-t">Vivier mis à jour</span>{vv2("accomp","message","Relation client","8 talents · à l’instant",[("MK",""),("JT","b"),("NL","a")],"+5 · Marc ajouté")}</div></div>'''
W_DOK = RC(decis_ok(), '/hire/candidats/marc-k/decision')

# ---------- Entretiens ----------
CAL = f'''<div class="verre calm"><div class="mh"><a class="g">{ic("suivant","s")}</a><b>Octobre 2026</b><a>{ic("suivant","s")}</a></div>
<div class="g7m"><i>L</i><i>M</i><i>M</i><i>J</i><i>V</i><i>S</i><i>D</i>
<span class="d-off">12</span><span class="d-off">13</span><span class="d-off">14</span><span class="d-off">15</span><span class="d-off">16</span><span class="d-off">17</span><span class="d-off">18</span>
<span class="d-auj d-lib">19</span><span class="d-lib">20</span><span class="d-lib">21</span><span class="d-sel">22</span><span class="d-pl">23</span><span class="d-off">24</span><span class="d-off">25</span>
<span class="d-lib">26</span><span class="d-lib">27</span><span class="d-lib">28</span><span class="d-pl">29</span><span class="d-lib">30</span><span class="d-off">31</span><span class="d-off">1</span></div>
<div class="lg"><em style="--c:#2FD3A6">Équipe libre</em><em style="--c:#F2B33D">Peu de place</em><em style="--c:#0F3F37">Choisi</em></div></div>'''
JOUR = f'''<div class="verre jour-g"><div class="h"><b>Jeudi 22 octobre · équipe</b><span class="pr"><span class="av">NK</span><span class="av b">OB</span></span></div>
<div class="jg"><div class="hr"><span>09:00</span><span>10:00</span><span>11:00</span><span>12:00</span><span>13:00</span><span>14:00</span><span>15:00</span><span>16:00</span></div>
<div class="zone">
<div class="blk cr" style="top:54px;height:80px"><b>Créneau 1 · 10:00</b>45 min · visio</div>
<div class="blk occ" style="top:148px;height:70px"><b>Olivier occupé</b>Comité crédit</div>
<div class="blk occ" style="top:236px;height:52px"><b>Pause déjeuner</b></div>
<div class="blk cr2" style="top:296px;height:80px"><b>Créneau 2 · 14:30</b>45 min · visio</div>
<div class="now" style="top:26px"></div></div></div></div>'''
def prog():
    return wh('Proposer un entretien', 'Jusqu’à 3 créneaux, Grâce choisit') + f'''<div class="g2e"><div class="col">
<div class="verre mini-c"><span class="av b">GM</span><div class="t"><b>Grâce M.</b><span>Analyste de données junior · Présélectionnée</span></div>{ring(86)}</div>
<div class="modes"><a class="on"><span class="cases" style="background:var(--g-accomp)">{ic("entretien","s")}</span>Visio</a><a><span class="cases" style="background:var(--g-oppo)">{ic("localisation","s")}</span>Sur site</a><a><span class="cases" style="background:var(--g-former)">{ic("micro","s")}</span>Audio</a></div>
<div class="durees"><span>30 min</span><span class="on">45 min</span><span>1 h</span><span>1 h 30</span></div>{CAL}
<div class="verre liste lignes"><div class="li"><span class="pr" style="display:flex"><span class="av" style="width:30px;height:30px;font-size:10px;color:#0F3F37">NK</span><span class="av b" style="width:30px;height:30px;font-size:10px;margin-left:-8px;color:#0F3F37">OB</span></span><div class="t"><b>Participants</b><span>Nadia K., Olivier B.</span></div><a class="bt sec s">{ic("plus","xs")}Inviter</a></div></div></div>
<div class="col"><div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> a lu vos agendas : Nadia et Olivier sont libres jeudi 22 et lundi 26 le matin.</div></div>{JOUR}
<div class="orbi-l">{orbi(26)}<div class="t">Ajouter un 3e choix : <b>lundi 26 à 9:00</b>, toute l’équipe est libre.</div><a class="bt sec s">Ajouter</a></div>
<div class="verre chk"><div><span class="o">{CK}</span>Fuseau de Grâce : Kinshasa (UTC+1), comme vous</div><div><span class="o">{CK}</span>Lien de visio créé après sa confirmation</div></div>
<div class="verre recap-b"><div class="t"><b>2 créneaux sur 3</b>22 oct. · 10:00 et 14:30</div><a class="bt p">Aperçu</a></div></div></div>'''
W_PROG = RC(prog(), '/hire/candidats/grace-m/entretien')
def inv():
    return wh('Aperçu de l’invitation', 'Ce que Grâce reçoit, avant l’envoi') + f'''<div class="g2e"><div class="ph-w"><div class="verre inv2"><div class="ban">{BAN["baobab"]}<span class="lg-e sap">BF</span></div><div class="c">
<span class="k">Invitation à un entretien</span><h3>Analyste de données junior</h3>
<span class="ent">Baobab Fintech <span class="verif">{ic("valider","xs")}Vérifiée</span></span>
<div class="rows"><div>{ic("entretien","s")}Visio, 45 min · lien envoyé après confirmation</div><div>{ic("candidats","s")}Avec Nadia K. (RH) et Olivier B. (équipe data)</div></div>
<div class="dts"><div class="dt on"><span class="cal-t"><i>JEU</i><b>22</b></span><div class="t"><b>10:00</b>octobre</div></div><div class="dt"><span class="cal-t"><i>JEU</i><b>22</b></span><div class="t"><b>14:30</b>octobre</div></div></div>
<div class="bts"><a class="bt p m pl">Confirmer</a><a class="bt sec m">Autre date</a></div></div></div></div>
<div class="col"><div class="msg-o"><span class="k">{orbi(18)}Message préparé par Orbi, à relire</span><p>Bonjour Grâce, votre <mark>projet Power BI pour trois agences</mark> nous a convaincus. Nous aimerions en parler avec vous.</p><div class="tons"><span class="on">Chaleureux</span><span>Plus court</span><span>Formel</span><span>{ic("modifier","xs")} Écrire moi-même</span></div></div>
<div class="verre chk"><div><span class="o">{CK}</span>Notification et e-mail à Grâce</div><div><span class="o">{CK}</span>Rappel automatique la veille</div><div><span class="o">{CK}</span>Invitation agenda (.ics) après confirmation</div></div>
<div class="bts" style="flex-direction:row;justify-content:flex-end"><a class="bt sec m">Modifier</a><a class="bt p m">{ic("envoyer","s")}Envoyer l’invitation</a></div></div></div>'''
W_INV = RC(inv(), '/hire/candidats/grace-m/entretien/apercu')

def ev(j, h0, dur, cls, nom, sub):
    top = (h0 - 9) * 60 + 2; hgt = dur * 60 - 4
    return j, f'<div class="ev {cls}" style="top:{top:.0f}px;height:{hgt:.0f}px"><b>{nom}</b><em>{sub}</em></div>'
EVS = [ev(3, 10, .75, 'ok', 'Grâce M.', '10:00 · visio'), ev(3, 15.5, .75, 'ok', 'Esther R.', '15:30 · visio'), ev(4, 14.5, 1, 'at', 'Joël T.', 'Sans réponse'),
       ev(0, 9, 1, '', 'Eric K.', 'À évaluer'), ev(4, 10, 1, 'rp', 'Patrick K.', 'Autre date')]
def agw():
    days = [('L', 19), ('M', 20), ('M', 21), ('J', 22), ('V', 23), ('S', 24), ('D', 25)]
    hd = '<span></span>' + ''.join(f'<span class="{"auj" if d == 19 else ""}">{l}<b>{d}</b></span>' for l, d in days)
    hrs = '<div class="hrs">' + ''.join(f'<span>{h}:00</span>' for h in range(9, 18)) + '</div>'
    cols = ''
    for k in range(7):
        inner = ''.join(e for j, e in EVS if j == k)
        cols += f'<div class="cj{" we" if k >= 5 else ""}">{inner}</div>'
    return f'<div class="verre agw"><div class="hd">{hd}</div><div class="gr">{hrs}{cols}</div></div>'
def agenda(t=False):
    h = wh('Entretiens', 'Semaine du 19 au 25 octobre', f'<div class="seg" style="width:340px;flex:none"><span class="on">Semaine</span><span>Mois</span><span>À évaluer · 2</span></div>')
    side = f'''<div class="col"><span class="ck-t">Demande de Patrick K.</span><div class="verre carte" style="padding:14px 16px;display:flex;flex-direction:column;gap:10px"><div class="mini-c" style="padding:0"><span class="av b">PK</span><div class="t"><b>Patrick K.</b><span>Propose lundi 26 à 11:00</span></div><span class="etq-s rp">Autre date</span></div><div class="bts" style="flex-direction:row"><a class="bt sec s">Autres créneaux</a><a class="bt p s">Accepter lundi</a></div></div>@@SPLIT@@<span class="ck-t">À évaluer</span><div class="verre liste lignes"><div class="li"><span class="av a" style="width:38px;height:38px;font-size:11px;color:#0F3F37">EK</span><div class="t"><b>Eric K.</b><span>Ce matin, 9:00</span></div><a class="bt p s">Évaluer</a></div><div class="li"><span class="av" style="width:38px;height:38px;font-size:11px;color:#0F3F37">SM</span><div class="t"><b>Sandra M.</b><span>16 oct. · Olivier n’a pas noté</span></div><a class="bt sec s">Relancer</a></div></div>
<div class="orbi-l">{orbi(26)}<div class="t"><b>Préparer l’entretien de Grâce</b> : 3 questions liées à l’offre sont prêtes.</div><a class="bt p s">Ouvrir</a></div></div>'''
    if t: return h + agw() + '<div class="g2e">' + side.replace('@@SPLIT@@', '</div><div class="col">') + '</div>'
    side = side.replace('@@SPLIT@@', '')
    return h + f'<div class="dosw" style="grid-template-columns:minmax(0,1fr) 270px">{agw()}{side}</div>'
W_AG = web(agenda(), 'agenda', 'rh', '/hire/agenda')
T_AG = RT(agenda(True), 'aujourdhui')
def prep():
    return wh('Préparer l’entretien', 'Grâce M. · jeudi 22 octobre, 10:00') + f'''<div class="g2e"><div class="col">
<div class="verre carte" style="padding:16px 18px;display:flex;flex-direction:column;gap:12px"><div class="mini-c" style="padding:0"><span class="av b">GM</span><div class="t"><b>Grâce M.</b><span>Analyste de données junior</span></div>{ring(86)}</div>
<div class="dts"><div class="dt on"><span class="cal-t"><i>JEU</i><b>22</b></span><div class="t"><b>10:00</b>visio, 45 min</div></div><div class="dt"><span class="cal-t" style="background:var(--g-accomp)"><i style="background:#0F3F37">AVEC</i><b style="font-size:11px;padding:5px 0">NK OB</b></span><div class="t"><b>2 personnes</b>Nadia, Olivier</div></div></div></div>
<div class="pq-o"><div class="h">{orbi(30)}<div class="t"><b>Ce qu’il faut vérifier</b><span>D’après l’offre et le dossier</span></div></div>
<div class="pt"><i class="v">✓</i><span>Power BI : projet pour 3 agences, demander le résultat obtenu.</span></div>
<div class="pt"><i class="a">!</i><span>Python : déclaré, sans preuve.</span></div></div>{DOCS}</div>
<div class="col"><div class="sec-w"><h2>Questions proposées</h2><a>Ajouter une question</a></div>
<div class="q-o"><b>Racontez un tableau de bord qui a changé une décision.</b><small>Power BI · indispensable</small></div>
<div class="q-o"><b>Comment vérifiez-vous la qualité d’une donnée ?</b><small>SQL · indispensable</small></div>
<div class="q-o"><b>Quel script Python avez-vous écrit récemment ?</b><small>Python · à vérifier</small></div>
<div class="gar">{ic("confidentialite","s")}Jamais de question sur l’âge, la famille, la santé, la religion ou l’origine.</div>
<div class="bts" style="flex-direction:row;justify-content:flex-end"><a class="bt sec m">{ic("partager","s")}Partager à l’équipe</a><a class="bt p m">Ouvrir l’évaluation</a></div></div></div>'''
W_PREP = web(prep(), 'agenda', 'rh', '/hire/agenda/grace-m/preparer')
def evalw():
    return wh('Évaluation', 'Grâce M. · entretien du 22 oct. · grille de l’offre') + f'''<div class="g2e"><div class="col"><div class="eval">
<div class="c"><b>Analyse de données</b><small>SQL, Power BI, qualité des données</small><div class="notes4"><span>1</span><span>2</span><span class="on">3</span><span>4</span></div></div>
<div class="c"><b>Communication des résultats</b><small>Clarté, pédagogie</small><div class="notes4"><span>1</span><span>2</span><span>3</span><span class="on">4</span></div></div>
<div class="c"><b>Python</b><small>Souhaitée</small><div class="notes4"><span>1</span><span class="on">2</span><span>3</span><span>4</span></div></div></div></div>
<div class="col"><div class="eval"><div class="c"><b>Avis</b><small>Visible par l’équipe</small><div class="verre saisie" style="box-shadow:none;background:var(--zone);height:80px;align-items:flex-start;padding-top:12px">Très claire, à former sur Python.</div></div></div>
<span class="lab-c">Suite proposée</span>
<div class="res3b"><a class="r3"><span class="cases">{ic("fermer","s")}</span>Ne pas poursuivre</a><a class="r1 on"><span class="cases">{ic("valider","s")}</span>Poursuivre</a><a class="r3" style="background:var(--g-oppo)"><span class="cases">{ic("pourquoi","s")}</span>Hésitation</a></div>
<div class="orbi-l">{orbi(26)}<div class="t">Olivier a aussi évalué : <b>3 et 4 sur 4</b>. Comparer les deux avis ?</div><a class="bt sec s">Comparer</a></div>
<div class="bts" style="flex-direction:row;justify-content:flex-end"><a class="bt sec m">Brouillon</a><a class="bt p m">Enregistrer</a></div></div></div>'''
W_EVAL = web(evalw(), 'agenda', 'rh', '/hire/agenda/grace-m/evaluation')

# ---------- Talents ----------
SUBW = '<div class="sub-t"><a class="on">Découvrir</a><a>Mes propositions<small>18</small></a></div>'
FLTP = f'''<div class="verre flt-p"><h3>Filtrer les talents</h3>
<div class="champ"><label>Comparer à l’offre</label><div class="verre off-sel" style="box-shadow:none;background:var(--zone);padding:8px 12px">{ic("offre","s")}<div class="t"><b style="font-size:12.5px">Analyste de données junior</b></div></div></div>
<div class="champ"><label>Compétences</label><div class="puces"><span class="puce on">SQL</span><span class="puce">Power BI</span><span class="puce">Python</span><span class="puce">{ic("plus","xs")}</span></div></div>
<div class="champ"><label>Lieu</label><div class="puces"><span class="puce on">{FLAG["cd"]} Kinshasa</span><span class="puce">À distance</span></div></div>
<div class="champ"><label>Expérience</label><div class="puces"><span class="puce">Sans</span><span class="puce on">Junior</span><span class="puce">Confirmé</span></div></div>
<div class="champ"><label>Disponibilité</label><div class="puces"><span class="puce">Immédiate</span><span class="puce">Sous 3 mois</span></div></div>
<div class="gar">{ic("confidentialite","s")}Pas de filtre sur l’âge, le genre, la nationalité ou la photo. Seuls les profils rendus visibles apparaissent.</div>
<div class="bts"><a class="bt sec s">Effacer</a></div></div>'''
TALS = (tl("RB","","Ruth B.","Analyste BI · Kinshasa · disponible",["SQL","Power BI"],84) + tl("DK","a","David K.","Data analyst · Kinshasa · en poste",["SQL","Python"],79,"m")
        + tl("MT","","Merveille T.","Analyste junior · Kinshasa · disponible",["Excel","Power BI"],72,"m") + tl("SL","a","Sarah L.","Diplômée statistiques · Kinshasa",["Excel","SQL"],66,"m")
        + tl("JM","","Jonas M.","Data analyst · Lubumbashi · disponible",["SQL","Tableau"],63,"m") + tl("EN","a","Esther N.","Analyste reporting · Kinshasa · en poste",["Excel","Power BI"],61,"m"))
def talents(t=False):
    h = wh('Candidats', 'Rechercher des talents · profils rendus visibles', SEGW_T)
    res = f'''<div class="col"><div class="flt-b"><div class="verre rech" style="flex:1 1 auto">{ic("recherche","s")}<span>Compétence, métier, ville</span></div><a class="bt sec s">{ic("favori","xs")}Viviers</a></div>
<div class="filtres-h"><span class="puce on">SQL ✕</span><span class="puce on">Kinshasa ✕</span><span class="puce on">Junior ✕</span></div>
<span class="cnt-l">38 profils visibles · comparés à « Analyste de données junior » · chaque consultation est enregistrée</span>
<div class="g2e">{TALS}</div><div class="suite"><span class="spin"></span>Chargement des profils suivants</div></div>'''
    if t: return h + SUBW + res.replace('<div class="col">', '<div class="col">' + '<div class="verre rech">' + ic("filtres","s") + '<span>Filtres · 3</span></div>', 1)
    return h + SUBW + f'<div class="tal-g">{FLTP}{res}</div>'
UT = '/hire/talents'
W_TAL = RC(talents(), UT)
T_TAL = RT(talents(True), 'candidats')
def tprof():
    return f'''<a class="retour-l">{ic("suivant","s")}Rechercher des talents</a><div class="verre tpw"><div class="cov">{COV}</div><div class="id"><span class="av">RB</span><div class="t"><h2>Ruth B.</h2><p>Analyste BI · 2 ans · {FLAG["cd"]} Kinshasa</p>
<div class="k"><span class="stp pub">Disponible</span><span class="stp val">CDI, CDD</span><span class="vu-chip">{ic("confidentialite","xs")}Consultation enregistrée</span></div></div>
<div class="bts"><a class="bt sec m">{ic("favori","s")}Vivier</a><a class="bt p m">{ic("message","s")}Proposer l’offre</a></div></div></div>
<div class="g2e"><div class="col"><div class="pq-o"><div class="h">{orbi(30)}<div class="t"><b>Avec « Analyste de données junior »</b><span>Calcul fixe · Orbi explique</span></div>{ring(84)}</div>
<div class="pt"><i class="v">✓</i><span>SQL et Power BI requis : prouvés par une attestation et un projet.</span></div>
<div class="pt"><i class="v">✓</i><span>Kinshasa, CDI accepté, disponible maintenant.</span></div>
<div class="pt"><i class="a">!</i><span>Python souhaité : non indiqué. À vérifier en entretien.</span></div>
<a class="pq">{ic("pourquoi","xs")}Voir le détail du score</a></div>
<div class="verre cpt-l"><div class="hh"><b>Compétences de l’offre</b><span>3 requises sur 3</span></div>
<div class="r"><b>SQL</b><span class="pv at">{ic("certificat","xs")}Attestation</span><span class="lv"><i class="on"></i><i class="on"></i><i class="on"></i><i></i></span></div>
<div class="r"><b>Power BI</b><span class="pv pj">{ic("realisation","xs")}Projet</span><span class="lv"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i></span></div>
<div class="r"><b>Excel</b><span class="pv dc">Déclarée</span><span class="lv"><i class="on"></i><i class="on"></i><i></i><i></i></span></div>
<div class="r"><b>Python</b><span class="pv mq">Non indiquée</span></div></div>
<div class="sec-w"><h2>Projets</h2><a>Tout voir</a></div>
<div class="prj"><div class="p"><div class="im" style="background:var(--g-former)">{PRJ_VZ1}</div><div class="t"><b>Tableau de bord ventes</b>Power BI · 3 agences</div></div><div class="p"><div class="im" style="background:var(--g-accomp)">{PRJ_VZ2}</div><div class="t"><b>Nettoyage de données</b>SQL · 40 000 lignes</div></div></div></div>
<div class="col"><div class="st4"><div class="s1"><b>2 ans</b>d’expérience</div><div class="s2"><b>5</b>compétences</div><div class="s3"><b>3</b>preuves</div><div class="s4"><b>2</b>projets</div></div>
<div class="xp-h"><span class="cases" style="background:var(--g-oppo)">{ic("entreprise","s")}</span><b>Expérience professionnelle</b></div>
<div class="verre xp"><div class="e"><span class="lg-e amb">KC</span><div class="t"><b>Analyste BI · Kivu Conseil</b>2024 à aujourd’hui · Kinshasa</div></div><div class="e"><span class="lg-e sap">BT</span><div class="t"><b>Stagiaire données · Banque Tujenge</b>6 mois · 2023 · Kinshasa</div></div></div>
<div class="xp-h"><span class="cases" style="background:var(--g-former)">{ic("former","s")}</span><b>Formation</b></div>
<div class="verre xp"><div class="e"><span class="lg-e sap">UK</span><div class="t"><b>Licence en statistiques</b>Université de Kinshasa · 2023</div></div><div class="e"><span class="lg-e" style="background:var(--g-accent);color:#0F3F37">J</span><div class="t"><b>Power BI avancé<span class="cert">Attestation</span></b>Jumanly Learn · 2025</div></div></div>
<div class="consult">{ic("confidentialite","s")}Ruth a rendu son profil visible. Votre consultation est enregistrée.</div></div></div>'''
UP = '/hire/talents/ruth-b'
W_TPROF = RC(tprof(), UP)
DLG_PROP = f'''<h3>Proposer l’offre à Ruth</h3>
<div class="verre mini-c" style="box-shadow:none;background:var(--zone)"><span class="av">RB</span><div class="t"><b>Ruth B.</b><span>Analyste BI · Kinshasa · disponible</span></div>{ring(84)}</div>
<div class="verre off-m" style="box-shadow:none;background:var(--zone)"><span class="im">{BAN["baobab"]}</span><div class="t"><b>Analyste de données junior</b><span>CDI · Hybride · limite 31 oct.</span></div><a class="bt sec s">Changer</a></div>
<div class="msg-o" style="box-shadow:none;background:var(--zone)"><span class="k">{orbi(18)}Personnalisé par Orbi, à relire</span><p>Bonjour Ruth, votre <mark>attestation SQL</mark> et votre <mark>tableau de bord Power BI</mark> correspondent à ce que nous cherchons pour ce poste. L’offre vous intéresse-t-elle ? Je serais heureuse d’en parler.</p>
<div class="tons"><span class="on">Chaleureux</span><span>Plus court</span><span>Formel</span><span>{ic("modifier","xs")} Modifier</span></div></div>
<div class="li" style="padding:0;border:0;min-height:40px"><div class="t"><b>Joindre l’annonce</b><span>Ruth peut postuler en un geste</span></div><span class="sw on"></span></div>
<div class="quota-g" style="padding:0"><div class="h"><b>Propositions ce mois</b><span>6 sur 10</span></div><span class="barre"><i style="width:60%"></i></span></div>
<div class="consult">{ic("confidentialite","s")}Ruth décide. Son contact n’est visible que si elle accepte.</div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">{ic("envoyer","s")}Envoyer à Ruth</a></div>'''
W_PROP = RC(tprof(), UP, over=fenetre(DLG_PROP).replace('class="dlg"', 'class="dlg" style="width:560px"'))
def props():
    rows = [("RB","","Ruth B.","ct","Acceptée","Analyste de données junior","17 oct.",f'<a class="bt p s">{ic("message","xs")}Écrire</a>'),
            ("DK","b","David K.","ct","Acceptée","Analyste de données junior","15 oct.",f'<a class="bt p s">{ic("message","xs")}Écrire</a>'),
            ("MT","","Merveille T.","at","En attente","Analyste de données junior","il y a 2 j",'<a class="bt sec s">Relancer</a>'),
            ("SL","a","Sarah L.","at","En attente","Analyste de données junior","il y a 5 j",'<a class="bt sec s">Relancer</a>'),
            ("YK","b","Yannick K.","nr","Refusée","Chargé de clientèle","3 oct.",'')]
    r = ''.join(f'<div class="r"><span class="av {c}">{i}</span><div class="t"><b>{n}</b><span>{"Relation client" if "clientèle" in o else "Data"} · Kinshasa</span></div><span class="o">{o}</span><span class="d"><span class="etq-s {ec}">{e}</span> · {d}</span><span class="a">{a}</span></div>' for i, c, n, ec, e, o, d, a in rows)
    return (wh('Candidats', 'Rechercher des talents · vos propositions d’offre', SEGW_T) + SUB_PROP
            + f'''<div class="flt-b"><div class="verre rech">{ic("recherche","s")}<span>Nom, métier, offre</span></div><div class="filtres-h"><span class="puce on">Toutes<small>18</small></span><span class="puce">Acceptées<small>12</small></span><span class="puce">En attente<small>4</small></span><span class="puce">Refusées<small>2</small></span></div></div>
<div class="pp-top"><div class="verre pp-q"><div class="h"><b>Propositions ce mois</b><span>6 sur 10</span></div><span class="bar"><i style="width:60%"></i></span></div>
<div class="verre carte" style="padding:14px 16px;font-size:12.5px;line-height:1.5;display:flex;flex-direction:row;gap:10px;align-items:center">{ic("message","s")}<span><b>Acceptée</b> : la conversation s’ouvre dans Messages. <b>Refusée</b> : sans détail, rien à faire.</span></div></div>
<div class="verre pp"><div class="pp-h"><span></span><span>Talent</span><span>Offre proposée</span><span>Réponse</span><span></span></div>{r}</div>''')
W_PROPS = RC(props(), UT + '/propositions')
def viviers():
    return wh('Viviers', 'Talents gardés pour plus tard', f'<a class="bt p m">{ic("plus","s")}Créer un vivier</a>') + f'''<div class="orbi-l">{orbi(26)}<div class="t"><b>4 talents</b> de « Data junior » correspondent à votre nouvelle offre.</div><a class="bt p s">Voir</a></div>
<div class="vv3">{vv2("former","cap","Data junior","12 talents · mis à jour hier",[("RB",""),("DK","a"),("SL","b"),("AM","")],"+8 · 3 disponibles")}
{vv2("accomp","message","Relation client","7 talents · 15 oct.",[("JT",""),("MK","b"),("NL","a")],"+4 · 1 disponible")}
{vv2("oppo","document","Conformité","3 talents · 2 oct.",[("AN","a"),("BK","")],"+1")}</div>
<div class="sec-w"><h2>Data junior · 12 talents</h2><a>Proposer l’offre à plusieurs</a></div><div class="g3">{TALS3}</div>
<div class="gar">{ic("confidentialite","s")}Un talent sort du vivier s’il masque son profil ou le demande.</div>'''
TALS3 = (tl("RB","","Ruth B.","Analyste BI · Kinshasa · disponible",["SQL","Power BI"],84) + tl("DK","a","David K.","Data analyst · Kinshasa · en poste",["SQL","Python"],79,"m")
         + tl("SL","b","Sarah L.","Diplômée statistiques · Kinshasa",["Excel","SQL"],66,"m"))
W_VIV = RC(viviers(), UT + '/viviers')

# ---------- Chemins ----------
def chemins_w():
    def c(t, et):
        p = f' {ic("suivant","xs")} '.join(f'<span class="{"f" if i == len(et) - 1 else ""}">{e}</span>' for i, e in enumerate(et))
        return f'<div class="c"><b>{t}</b><div class="p">{p}</div></div>'
    return '<div class="ch0">' + ''.join(c(t, e) for t, e in [
        ('Voir les candidatures d’une offre', ['Candidats', 'Candidatures', 'Choisir l’offre', 'Filtrer par étape']), ('Examiner un dossier', ['Candidats ou À traiter', 'Une personne', 'Dossier à droite']),
        ('Comprendre le score', ['Dossier', 'Pourquoi 88 % ?']), ('Analyser avec Orbi', ['Dossier', 'Résumé par Orbi', 'Ajouter aux notes']),
        ('Changer d’étape', ['Dossier', 'Changer d’étape', 'Déplacer']), ('Clôturer une candidature', ['Changer d’étape', 'Décision finale', 'Relire le message', 'Confirmer']),
        ('Proposer un entretien', ['Dossier', 'Entretien', 'Jour et heures', 'Aperçu', 'Envoyer']), ('Suivre les entretiens', ['Agenda', 'Semaine', 'À évaluer']),
        ('Préparer et évaluer', ['Agenda', 'Un entretien', 'Préparer', 'Évaluation']), ('Trouver des talents', ['Candidats', 'Rechercher des talents', 'Filtres à gauche', 'Consulter']),
        ('Proposer l’offre', ['Profil d’un talent', 'Proposer l’offre', 'Envoyer']), ('Suivre ses propositions', ['Rechercher des talents', 'Mes propositions', 'Écrire ou relancer'])]) + '</div>'

def W(e, t, n=''): return wrow(wfig(e, '<span class="wtag">Ordinateur</span>' + t, n))
def T(e, t, n=''): return wrow(wfig(e, '<span class="wtag t">Tablette</span>' + t, n))
ECR = [
 ('w0', '0 · Comment on y arrive', 'Les mêmes chemins qu’en mobile. L’onglet Candidats réunit les personnes : ceux qui ont postulé, ceux qu’on découvre, ceux à qui on a proposé une offre.', [chemins_w(), CMAP]),
 ('w1', '1 · Candidats', 'Sur grand écran, la liste et le dossier côte à côte : on passe d’une personne à l’autre sans changer de page.',
  [W(W_ATS, 'Candidatures et dossier', 'Offre choisie, étapes, score, Orbi.'), W(W_TRI, 'Trier et filtrer', 'Masquer n’est pas rejeter.'), W(W_VIDE, 'Pas encore de candidature', 'État vide utile.'), T(T_ATS, 'Candidatures', 'La personne ouvre son dossier.')]),
 ('w2', '2 · Dossier d’une candidature', 'Le dossier complet sur deux colonnes : le contenu à gauche, les actions, les notes et l’historique à droite.',
  [W(W_DOS, 'Dossier', 'Résumé Orbi, documents, compétences, réponses.'), W(W_PQ, 'Pourquoi 88 % ?', 'Critères, données exclues.'), W(W_ORB, 'Analyse par Orbi', 'Points forts, à vérifier, crédits.'), W(W_LOCK, 'En RH Free', 'Le dossier reste complet sans Orbi.'), T(T_DOS, 'Dossier')]),
 ('w3', '3 · Étapes et décision', 'Toujours un geste humain, avec confirmation. Le message au candidat se relit avant l’envoi.',
  [W(W_ET, 'Changer d’étape', 'Ce que verra le candidat.'), W(W_DEC, 'Décision finale', 'Évaluations, résultat, message à relire.'), W(W_DOK, 'Décision enregistrée', 'Annulable 10 minutes, la suite à décider.')]),
 ('w4', '4 · Entretiens', 'Jour et heures sur le même écran, l’invitation vue comme le candidat, l’agenda à la semaine, la préparation et l’évaluation.',
  [W(W_PROG, 'Proposer un entretien', 'Mode, durée, calendrier, journée de l’équipe.'), W(W_INV, 'Aperçu de l’invitation', 'Ce que reçoit le candidat.'), W(W_AG, 'Agenda de la semaine', 'Statuts en couleur, demandes, à évaluer.'),
   W(W_PREP, 'Préparer', 'Questions liées à l’offre.'), W(W_EVAL, 'Évaluation', 'Grille de l’offre, avis, suite.'), T(T_AG, 'Agenda')]),
 ('w5', '5 · Rechercher des talents', 'Les filtres restent ouverts à gauche. Seuls les profils rendus visibles apparaissent, chaque consultation est enregistrée et le talent décide de répondre.',
  [W(W_TAL, 'Découvrir', 'Filtres, profils en grille, Consulter.'), W(W_TPROF, 'Profil d’un talent', 'Analyse Orbi, preuves, projets, parcours.'), W(W_PROP, 'Proposer l’offre', 'Message personnalisé, annonce jointe, quota.'),
   W(W_PROPS, 'Mes propositions', 'Acceptées, en attente, refusées.'), W(W_VIV, 'Viviers', 'Talents gardés pour plus tard.'), T(T_TAL, 'Découvrir')]),
 ('w6', '6 · Mode sombre', 'Les mêmes écrans sur fond Nuit.', [W(wsombre(W_ATS), 'Candidatures et dossier'), W(wsombre(W_AG), 'Agenda'), W(wsombre(W_TAL), 'Rechercher des talents')]),
]
page_w('recruteur-2', 'Jumanly Hire · version ordinateur et tablette', 'Recruteur, lot 2 : trier, décider, rencontrer',
       '19 octobre 2026. Les écrans du lot 2 recruteur mobile adaptés aux grands écrans : candidatures et dossier côte à côte, score expliqué, analyse Orbi, décision, entretiens, agenda, recherche de talents, propositions, viviers. Contenus fictifs.', ECR, CSS + CSS1 + CSS2 + CSS3L + CSS4 + CSSR + CSSWR1 + CSSWR2)
