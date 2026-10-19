# Version ordinateur et tablette · recruteur, lot 1 : À traiter, offres, création, détail (19/10/2026). python3 webr1.py && node shotw.js recruteur-1
import os
H = os.path.dirname(os.path.abspath(__file__))
_r1 = open(H + '/recruteur1.py').read(); exec(_r1[:_r1.index('\nCHEMINS = [')])     # écrans et CSS du lot 1 recruteur (avec r1plus)
_K = (CSS2, CSS3L, CSS4, CSSR)
_s = open(H + '/web1.py').read(); exec(_s[:_s.index('\nECR = [')])
CSS2, CSS3L, CSS4, CSSR = _K
ORB_AT = ORB_AT.replace('entretien mercredi', 'entretien jeudi 22')   # le 22 octobre 2026 est un jeudi

CSSWR1 = '''
.w-c .col>.bt,.dlg .bts .bt,.w-h .bt{flex:none}
.web .rond-ok,.tab .rond-ok{width:88px;height:88px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;box-shadow:var(--halo);flex:none}.web .rond-ok .ic,.tab .rond-ok .ic{width:40px;height:40px;color:#0F3F37}
.w-c .actions-g{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.w-c .actions-g .ag{min-height:84px;padding:16px 18px;gap:14px}.w-c .actions-g .ag .nb{font-size:30px!important}.w-c .actions-g .ag span{font-size:13px}
.w-c .orbi-l{padding:14px 16px;font-size:13.5px}
.w-c .cand{padding:14px 16px}
.cand4{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.ent-w{display:flex;flex-direction:column;gap:10px}
.w-c .off-c{padding:16px 18px 16px 24px!important;gap:10px}
.w-c .off-c .kp b{font-size:20px}
.w-c .q3 div b{font-size:24px}
.sem-w{padding:16px 18px}
/* Organisation (menu sous le nom) */
.org-pop{position:absolute;z-index:8;left:14px;top:100px;width:340px;padding:14px;border-radius:24px;background:var(--plein);box-shadow:0 40px 80px -30px rgba(0,0,0,.5),0 0 0 1px var(--trait);display:flex;flex-direction:column;gap:10px}
.org-pop h4{font-size:15px;font-weight:600;padding:2px 4px}
.org-pop .liste{box-shadow:none;background:var(--zone)}
/* Menu d'une offre */
.mn-o{position:absolute;z-index:8;width:300px;padding:8px;border-radius:22px;background:var(--plein);box-shadow:0 40px 80px -30px rgba(0,0,0,.5),0 0 0 1px var(--trait)}
.mn-o .liste{box-shadow:none;background:none}.mn-o .li{min-height:52px}
.flt-b{display:flex;align-items:center;gap:12px}
.flt-b .rech{flex:0 1 380px;height:46px}
.flt-b .filtres-h{flex:1}
/* Création en 4 étapes */
.wz{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:20px;align-items:start}
.w-stp{grid-column:1/-1;padding:12px;display:flex;flex-direction:row;align-items:center;gap:6px;border-radius:26px}
.w-stp .of-r{display:flex;gap:12px;align-items:center;padding:0 16px 0 6px;margin-right:4px;border-right:1px solid var(--trait)}
.w-stp .of-r b{display:block;font-size:14px;white-space:nowrap}.w-stp .of-r span{font-size:12px;color:var(--texte2);white-space:nowrap}
.w-stp .s{flex:1;display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:18px;font-size:13.5px;font-weight:600;color:var(--texte2);white-space:nowrap}
.w-stp .s i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:13px;font-weight:700;background:var(--zone);flex:none}
.w-stp .s small{display:block;font-size:11px;font-weight:500}
.w-stp .s.ok{color:var(--texte)}.w-stp .s.ok i{background:var(--sapin);color:var(--lime)}.w-stp .s.ok i .ic{width:14px;height:14px}
.sombre .w-stp .s.ok i{background:var(--lime);color:#0F3F37}
.w-stp .s.on{background:var(--plein);color:var(--texte);box-shadow:var(--verre)}.w-stp .s.on i{background:var(--g-accent);color:#0F3F37}
.w-stp .gr{display:none}
.frm-w{padding:22px;display:flex;flex-direction:column;gap:14px;border-radius:28px}
.frm-w h2{font-size:22px;font-weight:600;letter-spacing:-.02em}
.frm-w .bts{flex-direction:row;justify-content:flex-end;margin-top:6px}.frm-w .comp{flex-direction:row;flex-wrap:wrap}.frm-w .pdf-f .t{min-width:0}.frm-w .bts .bt{flex:none;min-width:140px}
.duo-f{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ap-l{padding:0;overflow:hidden;display:flex;flex-direction:column}
.ap-l .k{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2);padding:14px 16px 0}
.ap-l .ban{height:92px;position:relative}.ap-l .ban svg{width:100%;height:100%}
.ap-l .ban .lg-e{position:absolute;left:16px;bottom:-20px;width:48px;height:48px;box-shadow:0 0 0 3px var(--plein)}
.ap-l .c{padding:28px 16px 16px;display:flex;flex-direction:column;gap:8px}
.ap-l .c b{font-size:16px}.ap-l .c span{font-size:12.5px;color:var(--texte2)}
.ap-l .c .tags{display:flex;gap:6px;flex-wrap:wrap}
.ap-l .c ul{margin:0;padding-left:16px;font-size:12.5px;display:flex;flex-direction:column;gap:3px}
.ap-l .vide-l{height:8px;border-radius:4px;background:var(--zone)}
.w-c .sugg-o{padding:16px 18px;font-size:13.5px;gap:8px}
.w-c .ap-all .ap-sec{padding:14px 18px;font-size:13px}
.w-c .lst-i{padding:12px 14px}
.chk4{display:flex;flex-direction:column;gap:10px}
/* Publication */
.pub-ok{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px;align-items:center;padding:30px;border-radius:30px;background:linear-gradient(140deg,#F2FCE6,#DDF6EE)}
.sombre .pub-ok{background:linear-gradient(140deg,rgba(166,242,107,.14),rgba(47,211,166,.06))}
.pub-ok .l{display:flex;flex-direction:column;gap:12px}
.pub-ok h2{font-size:30px;font-weight:600;letter-spacing:-.02em}.pub-ok p{font-size:14px;color:var(--texte2)}
.pub-ok .suite{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pub-ok .suite a{display:flex;align-items:center;gap:10px;padding:14px;border-radius:20px;font-size:13.5px;font-weight:600}
.pub-ok .suite .cases{width:38px;height:38px;border-radius:13px;display:grid;place-items:center}
/* Lecteur PDF (côté talent) */
.lect-w{display:flex;flex-direction:column;align-items:center;gap:14px;padding:26px;border-radius:28px;background:#2B3431}
.lect-w .pg{width:560px;background:#fff;border-radius:6px;box-shadow:0 18px 40px -16px rgba(0,0,0,.6);padding:34px 36px;display:flex;flex-direction:column;gap:10px;color:#1A2724;font-size:13px;line-height:1.55}
.lect-w .pg .hd{display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:2px solid #A6F26B}
.lect-w .pg .hd .lg{width:32px;height:32px;border-radius:9px;background:#0F3F37;color:#A6F26B;font-weight:800;font-size:11px;display:grid;place-items:center}
.lect-w .pg .hd b{font-size:13px}.lect-w .pg .hd span{margin-left:auto;color:#6A7470;font-size:11px}
.lect-w .pg h4{margin:6px 0 0;font-size:22px;color:#0F3F37;line-height:1.15}
.lect-w .pg .mt{color:#6A7470}
.lect-w .pg h5{margin:8px 0 0;font-size:12px;color:#0F3F37;text-transform:uppercase;letter-spacing:.06em}
.lect-w .pg ul{margin:0;padding-left:18px}
.lect-w .pg .chx{display:flex;gap:6px;flex-wrap:wrap}.lect-w .pg .chx span{padding:3px 9px;border-radius:99px;background:#EEF8E4;font-size:11.5px}.lect-w .pg .chx span.s{background:#F1EEE8}
.lect-w .nav-p{display:flex;gap:10px;align-items:center;color:#E8EFEC;font-size:13px}
.lect-w .nav-p a{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.12)}
/* Détail d'une offre */
.odw{display:flex;align-items:center;gap:18px;padding:22px 24px 22px 30px;border-radius:30px;position:relative;overflow:hidden}
.odw:before{content:"";position:absolute;left:0;top:0;bottom:0;width:8px;background:#A6F26B}
.odw .ico{width:56px;height:56px;border-radius:18px;display:grid;place-items:center;background:#A6F26B;color:#0F3F37;flex:none}
.odw .t{flex:1;display:flex;flex-direction:column;gap:6px}.odw .t h2{font-size:26px;font-weight:600;letter-spacing:-.02em}.odw .t .m{font-size:13px;color:var(--texte2)}
.odw .t .k{display:flex;gap:8px;align-items:center}
.odw .bts{gap:8px;align-items:center}.odw .t .m{white-space:nowrap}.odw .bts .bt{flex:none}
.w-c .chf{padding:18px 8px}.w-c .chf div b{font-size:26px}.w-c .chf div{font-size:12.5px}
.w-c .etp-l{gap:10px}.w-c .etp-l .e{font-size:13.5px}.w-c .etp-l .br-r{height:8px}
.w-c .sect .sc{padding:0 18px 16px}
.w-c .sem .bars{height:120px}
.tab .wz{grid-template-columns:1fr}.tab .w-stp .of-r,.tab .w-stp .s small{display:none}
.w-c .off-c .b{white-space:normal;flex-wrap:wrap;row-gap:8px}.w-c .off-c .b span{white-space:nowrap}
.cand4.l1{grid-template-columns:1fr}
.ch0{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;width:100%}
.ch0 .c{padding:16px;display:flex;flex-direction:column;gap:10px;background:#fff;border-radius:22px}
.ch0 .c b{font-size:14.5px}.ch0 .p{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.ch0 .p span{font-size:12px;font-weight:600;padding:5px 11px;border-radius:999px;background:#F2EDE5}.ch0 .p span.f{background:#A6F26B;color:#0F3F37}
.ch0 .p .ic{width:12px;height:12px;color:#5B6B68}
'''

CHK = '<span class="radio" style="box-shadow:inset 0 0 0 7px var(--sapin)"></span>'
NOCHK = '<span class="radio" style="background:none;box-shadow:inset 0 0 0 2px var(--trait)"></span>'
def R(c, a='aujourdhui', url='/hire', **k): return web(c, a, 'rh', url, **k)
def RT(c, a='aujourdhui', **k): return tab(c, a, 'rh', **k)

# ---------- 1. À traiter ----------
PUB_B = f'<a class="bt a m">{ic("plus","s")}Publier une offre</a>'
ACT4 = '''<div class="actions-g"><div class="verre ag"><span class="nb">4</span><span>dossiers à examiner</span></div><div class="verre ag"><span class="nb">1</span><span>invitation sans réponse</span></div><div class="verre ag"><span class="nb">2</span><span>évaluations à compléter</span></div><div class="verre ag"><span class="nb">3</span><span>messages non lus</span></div></div>'''
CANDS = (cand("AM","","Amani M.","Analyste de données junior","il y a 2 h","Reçue",True) + cand("FN","a","Fatou N.","Analyste de données junior","hier","Reçue",True)
         + cand("DK","","David K.","Chargé de clientèle","hier","Reçue",True) + cand("RM","a","Ruth M.","Comptable confirmé","il y a 2 j","En examen"))
ENTS = (ent("22","OCT","Grâce M.","Analyste de données junior","10:00","visio","Confirmé","ok-c") + ent("23","OCT","Joël T.","Chargé de clientèle","14:30","sur site","En attente de réponse","att-c")
        + ent("26","OCT","Esther R.","Comptable confirmé","9:30","visio","Confirmé","ok-c"))
SEM = '''<div class="verre sem sem-w"><div class="h"><b>Candidatures cette semaine</b><span>12 au total</span></div><div class="bars"><div><i style="height:30%"></i>L</div><div><i style="height:45%"></i>M</div><div class="on"><i style="height:80%"></i>M</div><div><i style="height:20%"></i>J</div><div><i style="height:0%"></i>V</div><div><i style="height:0%"></i>S</div><div><i style="height:0%"></i>D</div></div></div>'''
def a_traiter(t=False):
    h = wh('Bonjour Nadia', 'Lundi 19 octobre · Baobab Fintech', PUB_B) + ORB_AT + ACT4
    if t:
        return h + f'<div class="sec-w"><h2>Nouvelles candidatures</h2><a>Tout voir</a></div><div class="cand4">{CANDS}</div><div class="g2e"><div class="col"><div class="sec-w"><h2>Entretiens à venir</h2><a>Agenda</a></div>{ENTS}</div><div class="col"><div class="sec-w"><h2>Offres actives</h2><a>Mes offres</a></div>{OC_A}</div></div>'
    return h + f'''<div class="g2"><div class="col"><div class="sec-w"><h2>Nouvelles candidatures</h2><a>Tout voir</a></div><div class="cand4 l1">{CANDS}</div></div>
<div class="col"><div class="sec-w"><h2>Entretiens à venir</h2><a>Agenda</a></div><div class="ent-w">{ENTS}</div>{SEM}</div></div>
<div class="sec-w"><h2>Offres actives</h2><a>Mes offres</a></div><div class="g2e">{OC_A}{OC_B}</div>'''
W_AT = R(a_traiter())
T_AT = RT(a_traiter(True))

def vide():
    return wh('Bonjour Nadia', 'Lundi 19 octobre · Baobab Fintech', PUB_B) + f'''<div class="g2"><div class="col"><div class="verre vide-r" style="padding:40px"><span class="rond-ok">{ic("valider")}</span><b>Rien à traiter pour l’instant</b><span>Les nouvelles candidatures et les réponses aux invitations arriveront ici.</span></div>
<div class="q3"><div class="verre"><b>12</b>candidatures cette semaine</div><div class="verre"><b>4</b>entretiens faits</div><div class="verre"><b>2</b>décisions prises</div></div></div>
<div class="col"><div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> a repéré 6 talents visibles proches de <b>Chargé de clientèle</b>. Vous décidez de les contacter.</div><a class="bt sec s">Voir</a></div>
<span class="ck-t">Pour avancer</span><div class="verre liste lignes">
<div class="li"><span class="cases c3">{ic("offre","s")}</span><div class="t"><b>Publier une offre</b><span>1 offre active sur 5</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c2">{ic("recherche","s")}</span><div class="t"><b>Rechercher des talents</b><span>Profils visibles par les recruteurs</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("entreprise","s")}</span><div class="t"><b>Faire vérifier l’organisation</b><span>Badge « Vérifiée » sur vos offres</span></div>{ic("suivant")}</div></div></div></div>'''
W_VIDE = R(vide())

ORG_POP = f'''<div class="org-pop"><h4>Organisation active</h4><div class="verre liste lignes">
<div class="li"><span class="lg-e sap" style="width:40px;height:40px;font-size:12px">BF</span><div class="t"><b>Baobab Fintech</b><span>Recruteuse · RH Pro</span></div>{CHK}</div>
<div class="li"><span class="lg-e amb" style="width:40px;height:40px;font-size:12px">KC</span><div class="t"><b>Kivu Conseil RH</b><span>Cabinet · consultante</span></div>{NOCHK}</div></div>
<div class="verre liste"><div class="li"><span class="cases">{ic("profil","s")}</span><div class="t"><b>Passer à mon espace talent</b></div>{ic("suivant")}</div></div>
<div class="gar">{ic("confidentialite","s")}Chaque organisation ne voit que ses offres, ses candidats et ses messages.</div></div>'''
W_ORG = R(a_traiter(), over=ORG_POP)

# ---------- 2. Mes offres ----------
FLT_O = '<div class="filtres-h"><span class="puce on">Actives<small>4</small></span><span class="puce">Brouillons<small>1</small></span><span class="puce">En pause<small>1</small></span><span class="puce">Clôturées</span><span class="puce">Expirées</span></div>'
def offres_r(t=False):
    h = wh('Mes offres', '4 offres actives sur 5 · formule RH Pro', f'<a class="bt a m">{ic("plus","s")}Créer une offre</a>')
    f = f'<div class="flt-b"><div class="verre rech">{ic("recherche","s")}<span>Rechercher une offre</span></div>{FLT_O}</div>'
    if t: f = f'<div class="verre rech">{ic("recherche","s")}<span>Rechercher une offre</span></div>{FLT_O}'
    return h + f + f'<div class="g2e">{OC_A}{OC_B}{OC_C}{OC_V}</div>'
UO = '/hire/offres'
W_OFF = R(offres_r(), 'offre', UO)
T_OFF = RT(offres_r(True), 'offre')
MN_O = f'''<div class="mn-o" style="left:600px;top:300px"><div class="liste lignes">
<div class="li"><span class="cases c2">{ic("candidats","s")}</span><div class="t"><b>Voir les candidatures</b><span>24 · 4 nouvelles</span></div></div>
<div class="li"><span class="cases">{ic("modifier","s")}</span><div class="t"><b>Modifier</b></div></div>
<div class="li"><span class="cases">{ic("document","s")}</span><div class="t"><b>Dupliquer</b><span>Crée un brouillon</span></div></div>
<div class="li"><span class="cases">{ic("partager","s")}</span><div class="t"><b>Copier le lien de l’annonce</b></div></div>
<div class="li"><span class="cases" style="background:var(--ambre-c)">{ic("horloge","s")}</span><div class="t"><b>Mettre en pause</b><span>Masquée, les candidatures restent</span></div></div>
<div class="li danger"><span class="cases">{ic("fermer","s")}</span><div class="t"><b>Clôturer</b><span>Avec confirmation</span></div></div></div></div>'''
W_MN = R(offres_r(), 'offre', UO, over=MN_O)
DLG_CLOT = f'''<h3>Clôturer cette offre ?</h3><div class="conf-d"><b>Analyste de données junior</b>L’offre ne recevra plus de candidatures. Les 24 dossiers restent consultables. Les candidats encore en cours seront prévenus seulement quand vous déciderez pour chacun.</div>
<div class="li" style="padding:0;border:0"><div class="t"><b>Envoyer un message aux candidats non retenus</b><span>Vous relisez le modèle avant l’envoi</span></div><span class="sw"></span></div><div class="bts"><a class="bt sec m">Annuler</a><a class="bt dg m pl">Clôturer</a></div>'''
W_CLOT = R(offres_r(), 'offre', UO, over=fenetre(DLG_CLOT))

# ---------- 3. Créer une offre ----------
def wstp(n):
    lab = [('Le poste', 'Titre, lieu, contrat'), ('La description', 'Missions, compétences'), ('La candidature', 'Date, documents, questions'), ('Vérifier', 'Et publier')]
    h = ''
    for k, (t, s_) in enumerate(lab, 1):
        cls = 'ok' if k < n else ('on' if k == n else '')
        i = ic('valider', 'xs') if k < n else str(k)
        h += f'<div class="s {cls}"><i>{i}</i><div>{t}<small>{s_}</small></div></div>'
    return f'<div class="verre w-stp"><div class="of-r"><span class="lg-e sap">BF</span><div><b>Nouvelle offre</b><span>Brouillon enregistré</span></div></div>{h}<div class="gr">{ic("valider","xs")}Enregistré à chaque saisie</div></div>'
def apl(n):
    resp = '<ul><li>Concevoir et tenir à jour les tableaux de bord des agences</li><li>Produire le rapport mensuel d’activité</li></ul>' if n >= 2 else '<span class="vide-l"></span><span class="vide-l" style="width:70%"></span>'
    crit = '<div class="tags"><span class="tag">SQL</span><span class="tag">Power BI</span><span class="tag">Python · souhaité</span></div>' if n >= 2 else '<span class="vide-l" style="width:50%"></span>'
    lim = '<span>Limite 31 octobre · CV et lettre</span>' if n >= 3 else '<span class="vide-l" style="width:60%"></span>'
    return f'''<div class="verre ap-l"><span class="k">Aperçu de l’annonce</span><div style="padding:10px 0 0"><div class="ban">{BAN["baobab"]}<span class="lg-e sap">BF</span></div></div><div class="c"><b>Analyste de données junior</b><span>Baobab Fintech · Kinshasa · CDI · Hybride</span>{resp}{crit}{lim}</div></div>
<div class="gar">{ic("valider","s")}Les candidats postulent sur Jumanly, gratuitement.</div>'''
def wz(n, form, side=None):
    s = side if side is not None else apl(n)
    return wh('Créer une offre') + f'<div class="wz">{wstp(n)}<div class="verre frm-w">{form}</div>' + (f'<div class="col">{s}</div>' if s else '') + '</div>'
F1 = f'''<h2>Le poste</h2>{champ('Intitulé du poste','Analyste de données junior','focus')}
<div class="duo-f"><div class="champ"><label>Domaine</label><div class="verre saisie">Data</div></div><div class="champ"><label>Expérience</label><div class="verre saisie">0 à 2 ans</div></div></div>
<div class="duo-f"><div class="champ"><label>Lieu</label><div class="verre saisie">{FLAG["cd"]}&nbsp;&nbsp;Kinshasa</div></div><div class="champ"><label>Mode de travail</label><div class="seg"><span>Sur site</span><span class="on">Hybride</span><span>À distance</span></div></div></div>
<span class="lab-c">Contrat</span><div class="puces"><span class="puce on">CDI</span><span class="puce">CDD</span><span class="puce">Stage</span><span class="puce">Freelance</span></div>
<div class="li" style="padding:0;border:0;min-height:40px"><div class="t"><b>Nombre de postes</b></div><span class="stepper"><i>−</i><b>1</b><i>+</i></span></div>
<div class="orbi-l">{orbi(26)}<div class="t">À l’étape 2, <b>Orbi</b> peut proposer la description à partir de l’intitulé.</div></div>
<div class="bts"><a class="bt sec m">Plus tard</a><a class="bt p m">Continuer</a></div>'''
UC = '/hire/offres/nouvelle'
W_CR1 = R(wz(1, F1), 'offre', UC)
F2 = f'''<h2>La description</h2>{ORB_BT}
<div class="champ"><label>Présentation du poste</label><div class="verre saisie" style="height:70px;align-items:flex-start;padding-top:12px">Vous rejoignez l’équipe data pour suivre l’activité des agences…</div></div>
<span class="lab-c">Responsabilités</span><div class="lst"><div class="lst-i"><span class="poig"><i></i><i></i><i></i></span>Construire les tableaux de bord des agences</div><div class="lst-i"><span class="poig"><i></i><i></i><i></i></span>Préparer le rapport mensuel d’activité</div><a class="ajout s">{ic("plus","s")}Ajouter</a></div>
<span class="lab-c">Compétences</span><div class="comp"><span class="v">SQL · indispensable</span><span class="v">Power BI · indispensable</span><span>Python · souhaitée</span><span>{ic("plus","xs")}</span></div>
<div class="bts"><a class="bt sec m">Retour</a><a class="bt p m">Continuer</a></div>'''
W_CR2 = R(wz(2, F2), 'offre', UC)
ORB_C = f'''<div class="sugg-o"><small class="ck-t">Responsabilités, reformulées</small><span>• Concevoir et tenir à jour les tableaux de bord des 12 agences</span><span>• Produire le rapport mensuel d’activité et le présenter</span><span>• Fiabiliser les données avec l’équipe IT</span>
<div class="acts"><a class="bt sec s">Refuser</a><a class="bt sec s">Modifier</a><a class="bt p s">{ic("valider","xs")}Appliquer</a></div></div>
<div class="sugg-o"><small class="ck-t">Compétences proposées</small><span>SQL, Power BI : indispensables · Python : souhaité</span><div class="acts"><a class="bt sec s">Refuser</a><a class="bt p s">{ic("valider","xs")}Appliquer</a></div></div>
<div class="gar">{ic("cadenas","s")}Orbi n’ajoute ni salaire, ni avantage, ni condition de travail. Rien n’est appliqué sans votre accord.</div><a class="pq">{ic("pourquoi")}Pourquoi ces changements ?</a>'''
W_CRO = R(wz(2, F2), 'offre', UC, over=panneau_orbi('Rédiger avec Orbi', 'Analyste de données junior · 1 crédit', ORB_C))
F3 = f'''<h2>La candidature</h2><div class="duo-f"><div class="champ"><label>Date limite</label><div class="verre saisie">{ic("agenda","s")}&nbsp;&nbsp;31 octobre 2026</div></div><div class="col" style="gap:8px"><span class="lab-c">Documents demandés</span><div class="puces"><span class="puce on">{OK()}CV</span><span class="puce on">{OK()}Lettre</span><span class="puce">Diplôme</span><span class="puce">Portfolio</span></div></div></div>
<span class="lab-c">Questions de présélection</span><div class="qs"><div class="q1"><div class="t">Êtes-vous disponible avant le 1er décembre ?<small>Oui / non · ne bloque pas la candidature</small></div>{ic("modifier","s")}</div><a class="ajout s">{ic("plus","s")}Ajouter une question</a></div>
<div class="orbi-l">{orbi(26)}<div class="t">Question proposée : <b>« Avez-vous déjà utilisé Power BI ? »</b></div><a class="bt sec s">Ajouter</a></div>
<span class="lab-c">Fiche de poste en PDF (facultatif)</span>{PDF_F}
<div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> a lu la fiche et propose de compléter 3 responsabilités. Vous relisez avant d’appliquer.</div><a class="bt sec s">Voir</a></div>
<div class="champ"><label>Instructions pour les candidats</label><div class="verre saisie" style="color:var(--texte2)">Facultatif</div></div>
<div class="bts"><a class="bt sec m">Retour</a><a class="bt p m">Vérifier</a></div>'''
W_CR3 = R(wz(3, F3), 'offre', UC)
F4 = f'''<h2>Vérifier et publier</h2><div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> a relu l’offre : claire, complète, aucun critère discriminant.</div></div>
<div class="verre ap-all" style="box-shadow:none;background:var(--zone)">
<div class="ap-sec"><h4>Description</h4>Vous rejoignez l’équipe data pour suivre l’activité des 12 agences et aider les directions à décider.</div>
<div class="ap-sec"><h4>Responsabilités</h4><ul><li>Concevoir et tenir à jour les tableaux de bord des agences</li><li>Produire le rapport mensuel d’activité</li><li>Fiabiliser les données avec l’équipe IT</li></ul></div>
<div class="ap-sec"><h4>Critères</h4><div class="chx"><span>✓ SQL</span><span>✓ Power BI</span><span class="s">Python · souhaité</span><span class="s">0 à 2 ans</span></div></div>
<div class="ap-sec"><h4>Documents demandés</h4><div class="chx"><span>CV</span><span>Lettre</span></div></div>
<div class="ap-sec"><h4>Question</h4>Êtes-vous disponible avant le 1er décembre ?</div>
<div class="ap-sec"><h4>Fiche de poste</h4>{PDF_F.replace('verre pdf-f','pdf-f" style="padding:0')}</div></div>
<div class="bts"><a class="bt sec m">Enregistrer en brouillon</a><a class="bt a m">{ic("envoyer","s")}Publier</a></div>'''
SIDE4 = f'''<div class="chk4"><div class="manq">{ic("aide","s")}<span><b>Salaire non indiqué.</b> Facultatif, mais les offres avec salaire reçoivent plus de candidatures.</span></div>
<div class="ok-l">{ic("valider","s")}Organisation vérifiée : publication immédiate</div>
<div class="verre quota-b">{ic("offre","s")}<div class="t"><b>Offres actives : 4 sur 5</b>Après publication : 5 sur 5</div></div></div>''' + apl(3)
W_CR4 = R(wz(4, F4, SIDE4), 'offre', UC)
T_CR4 = RT(wz(4, F4, ''), 'offre')
DLG_Q = f'''<h3>Limite d’offres actives atteinte</h3><div class="verre quota-b">{ic("offre","s")}<div class="t"><b>1 offre active sur 1</b>Formule RH Free</div></div>
<div class="verre liste lignes" style="box-shadow:none;background:var(--zone)"><div class="li"><span class="cases">{ic("fermer","s")}</span><div class="t"><b>Clôturer ou mettre en pause une offre</b><span>Puis publier celle-ci</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c2">{ic("progression","s")}</span><div class="t"><b>Passer à RH Pro</b><span>5 offres actives, 2 sièges · 19,9 $/mois</span></div>{ic("suivant")}</div></div>
<a class="bt sec m">Garder en brouillon</a>'''
W_QUOTA = R(wz(4, F4, SIDE4), 'offre', UC, over=fenetre(DLG_Q))
def publie():
    return f'''<div class="pub-ok"><div class="l"><span class="rond-ok">{ic("valider")}</span><h2>Offre publiée</h2><p>« Analyste de données junior » est visible des talents. Les candidatures arriveront dans À traiter.</p>
<div class="suite"><a class="verre"><span class="cases" style="background:var(--g-accomp)">{ic("partager","s")}</span>Copier le lien</a><a class="verre"><span class="cases" style="background:var(--g-oppo)">{ic("recherche","s")}</span>Chercher des talents</a></div><a class="bt txt" style="align-self:flex-start">Retour à mes offres</a></div>
<div class="col"><div class="verre ap-o"><div class="cv"><span>BF</span></div><div class="t"><b>Analyste de données junior</b>Baobab Fintech · Kinshasa · CDI · Hybride<span>Limite 31 oct. · Candidature gratuite</span></div></div>
<div class="verre tl-p"><div class="e ok"><i></i><div><b>Visible maintenant</b><span>Dans les offres et la recherche</span></div></div><div class="e at"><i></i><div><b>Premières candidatures</b><span>Dans À traiter, avec leur score</span></div></div><div class="e"><i></i><div><b>Résumé d’Orbi</b><span>Chaque matin, si vous l’activez</span></div></div></div></div></div>'''
W_PUB = R(publie(), 'offre', UO + '/analyste-donnees-junior/publiee')
def pdf_v():
    return f'''<div class="g2r"><div class="lect-w"><div class="pg"><div class="hd"><span class="lg">BF</span><b>Baobab Fintech</b><span>Kinshasa · octobre 2026</span></div>
<h4>Analyste de données junior</h4><span class="mt">CDI · Hybride · 1 poste · candidatures jusqu’au 31 octobre</span>
<h5>Le poste</h5>Au sein de l’équipe data, vous suivez l’activité des 12 agences et préparez les chiffres qui aident les directions à décider.
<h5>Responsabilités</h5><ul><li>Concevoir et tenir à jour les tableaux de bord des agences</li><li>Produire le rapport mensuel d’activité</li><li>Fiabiliser les données avec l’équipe IT</li><li>Répondre aux demandes ponctuelles des directions</li></ul>
<h5>Profil recherché</h5><div class="chx"><span>SQL · indispensable</span><span>Power BI · indispensable</span><span class="s">Python · souhaité</span><span class="s">0 à 2 ans</span></div>
<h5>Pour postuler</h5>CV et lettre, sur Jumanly. La candidature est gratuite.</div><div class="nav-p"><a>{ic("retour","s")}</a>Page 1 sur 2<a>{ic("suivant","s")}</a></div></div>
<div class="col"><div class="verre pdf-f"><span class="th"><i class="h"></i><i></i><i></i><i style="width:60%"></i><i></i><i style="width:80%"></i><em>PDF</em></span><div class="t"><b>Fiche-Analyste-donnees.pdf</b><span>2 pages · 340 Ko · vérifié</span></div></div>
<a class="bt sec m">{ic("telecharger","s")}Télécharger le PDF</a><a class="bt p m">Postuler</a><div class="gar">{ic("valider","s")}Lue dans Jumanly, sans quitter l’offre. Postuler reste gratuit.</div></div></div>'''
W_PDF = web(wh('Fiche de poste', 'Analyste de données junior · Baobab Fintech') + pdf_v(), 'opportunites', 'talent', '/app/offres/analyste-donnees-junior/fiche')

# ---------- 4. Détail d'une offre ----------
ETP5 = '''<div class="etp-l"><div class="e"><span>Reçue</span><span class="br-r"><i style="width:40%"></i></span><b>9</b></div><div class="e"><span>En examen</span><span class="br-r"><i style="width:30%"></i></span><b>7</b></div><div class="e"><span>Présélectionnée</span><span class="br-r"><i style="width:18%"></i></span><b>4</b></div><div class="e"><span>Entretien</span><span class="br-r"><i style="width:9%"></i></span><b>2</b></div><div class="e"><span>Décision</span><span class="br-r"><i style="width:4%"></i></span><b>0</b></div></div>'''
PERF = '''<div class="chf" style="padding:4px 0"><div><b>1 240</b>vues</div><div><b>1,9 %</b>ont postulé</div><div><b>3 j</b>délai moyen de réponse</div></div><div class="sem" style="padding:6px 0 0"><div class="bars"><div><i style="height:30%"></i>L</div><div><i style="height:45%"></i>M</div><div><i style="height:38%"></i>M</div><div><i style="height:70%"></i>J</div><div><i style="height:55%"></i>V</div><div><i style="height:25%"></i>S</div><div class="on"><i style="height:90%"></i>D</div></div></div><span style="font-size:11.5px;color:var(--texte2)">Vues par jour. Chiffres réels de l’offre, sans estimation.</span>'''
def detail_o(t=False):
    hd = f'''<div class="verre odw"><span class="ico">{ic("offre")}</span><div class="t"><div class="k"><span class="stp pub">Publiée</span><span class="m">depuis le 2 oct. · limite 31 oct.</span></div><h2>Analyste de données junior</h2><span class="m">Baobab Fintech · Kinshasa · CDI · Hybride</span></div>
<div class="bts"><a class="bi" title="Modifier">{ic("modifier","s")}</a><a class="bi" title="Copier le lien">{ic("partager","s")}</a><a class="bi" title="Mettre en pause">{ic("horloge","s")}</a><a class="bi" title="Autres actions">{ic("plus-options","s")}</a><a class="bt p m">{ic("candidats","s")}Voir les 24 candidatures</a></div></div>'''
    if t: hd = hd.replace('<div class="bts">', '<div class="bts" style="flex-wrap:wrap;width:100%">').replace('class="verre odw"', 'class="verre odw" style="flex-wrap:wrap"')
    chf = '<div class="verre chf" style="grid-template-columns:repeat(4,1fr)"><div><b>24</b>candidatures</div><div><b>4</b>nouvelles</div><div><b>2</b>entretiens</div><div><b>1 240</b>vues</div></div>'
    g = (f'{sect("candidats","accomp","Étapes","24", ETP5)}{sect("document","former","Description et responsabilités","", "<ul style=\'margin:0;padding-left:18px;font-size:13px;display:flex;flex-direction:column;gap:4px\'><li>Concevoir et tenir à jour les tableaux de bord des agences</li><li>Produire le rapport mensuel d’activité</li><li>Fiabiliser les données avec l’équipe IT</li></ul>")}'
         f'{sect("cap","oppo","Compétences recherchées","5", "<div class=\'comp\'><span class=\'v\'>SQL</span><span class=\'v\'>Power BI</span><span class=\'v\'>Excel</span><span>Python</span><span>Présentation</span></div>")}{sect("document","accomp","Fiche de poste PDF","2 pages", PDF_F.replace("verre pdf-f", "pdf-f\" style=\"padding:0"))}')
    d = f'''{sect("progression","former","Performance","", PERF)}{sect("horloge","accomp","Historique","6", HIST2)}
<div class="orbi-l">{orbi(26)}<div class="t">Les offres avec un salaire reçoivent plus de candidatures. <b>Ajouter une fourchette ?</b></div><a class="bt sec s">Modifier</a></div>'''
    return hd + chf + f'<div class="g2e"><div class="col">{g}</div><div class="col">{d}</div></div>'
W_OD = R(detail_o(), 'offre', UO + '/analyste-donnees-junior')
T_OD = RT(detail_o(True), 'offre')

# ---------- Chemins ----------
def chemins_w():
    def c(t, et):
        p = f' {ic("suivant","xs")} '.join(f'<span class="{"f" if i == len(et) - 1 else ""}">{e}</span>' for i, e in enumerate(et))
        return f'<div class="c"><b>{t}</b><div class="p">{p}</div></div>'
    return '<div class="ch0">' + ''.join(c(t, e) for t, e in [
        ('Voir ce qui m’attend', ['Ouverture', 'À traiter']), ('Changer d’organisation', ['Nom de l’organisation, en haut de la barre', 'Choisir']),
        ('Examiner une candidature', ['À traiter', 'Examiner', 'Dossier (lot 2)']), ('Publier une offre', ['À traiter ou Offres', 'Publier une offre', '4 étapes', 'Publier']),
        ('Rédiger avec Orbi', ['Étape 2', 'Rédiger avec Orbi', 'Panneau à droite', 'Appliquer']), ('Gérer une offre', ['Offres', '…', 'Modifier, dupliquer, pause, clôturer']),
        ('Voir une offre', ['Offres', 'Une carte', 'Détail', 'Voir les candidatures']), ('Lire la fiche PDF', ['Offre côté talent', 'Fiche de poste', 'Lecteur'])]) + '</div>'

def W(e, t, n=''): return wrow(wfig(e, '<span class="wtag">Ordinateur</span>' + t, n))
def T(e, t, n=''): return wrow(wfig(e, '<span class="wtag t">Tablette</span>' + t, n))
ECR = [
 ('w0', '0 · Comment on y arrive', 'Les mêmes chemins qu’en mobile, sans pastilles. La barre latérale porte : À traiter, Offres, Orbi, Candidats, Messages, puis Agenda et Rapports.', [chemins_w()]),
 ('w1', '1 · À traiter', 'L’écran d’ouverture : ce qui demande une action. Les candidatures à gauche, les entretiens et la semaine à droite.',
  [W(W_AT, 'À traiter', 'Orbi résume, les actions en tête.'), W(W_VIDE, 'Rien à traiter', 'État vide utile.'), W(W_ORG, 'Organisation active', 'Le nom en haut de la barre ouvre le choix.'), T(T_AT, 'À traiter')]),
 ('w2', '2 · Mes offres', 'Recherche et filtres sur une ligne, les offres en deux colonnes, chaque offre avec sa couleur.',
  [W(W_OFF, 'Mes offres', 'Actives, brouillons, en pause, clôturées, expirées.'), W(W_MN, 'Actions sur une offre', 'Le menu « … » de la carte.'), W(W_CLOT, 'Clôturer', 'Confirmation, rien n’est envoyé sans relecture.'), T(T_OFF, 'Mes offres')]),
 ('w3', '3 · Créer une offre', 'Les 4 étapes en tête, le formulaire à gauche, l’aperçu de l’annonce à droite, mis à jour à chaque saisie. Orbi rédige dans un panneau.',
  [W(W_CR1, '1 · Le poste'), W(W_CR2, '2 · La description'), W(W_CRO, 'Rédiger avec Orbi', 'Appliquer, modifier ou refuser.'), W(W_CR3, '3 · La candidature', 'Date, documents, questions, fiche PDF.'),
   W(W_CR4, '4 · Vérifier et publier', 'Toute l’offre relue, contrôles à droite.'), W(W_QUOTA, 'Limite atteinte', 'Clôturer une offre ou changer de formule.'), W(W_PUB, 'Offre publiée', 'Lien, recherche de talents, suite.'),
   W(W_PDF, 'Fiche PDF, vue talent', 'Lue dans Jumanly, téléchargeable.'), T(T_CR4, 'Vérifier et publier')]),
 ('w4', '4 · Détail d’une offre', 'L’essentiel et « Voir les candidatures » en tête. Étapes et contenu à gauche, performance et historique à droite.',
  [W(W_OD, 'Détail d’une offre'), T(T_OD, 'Détail d’une offre')]),
 ('w5', '5 · Mode sombre', 'Les mêmes écrans sur fond Nuit.', [W(wsombre(W_AT), 'À traiter'), W(wsombre(W_OFF), 'Mes offres'), W(wsombre(W_CR4), 'Vérifier et publier')]),
]
page_w('recruteur-1', 'Jumanly Hire · version ordinateur et tablette', 'Recruteur, lot 1 : traiter et publier',
       '19 octobre 2026. Les écrans du lot 1 recruteur mobile adaptés aux grands écrans : À traiter, organisation active, mes offres, création en 4 étapes avec Orbi, vérification, publication, détail d’une offre. Contenus fictifs.', ECR, CSS + CSS1 + CSS2 + CSS3L + CSS4 + CSSR + CSSWR1)
