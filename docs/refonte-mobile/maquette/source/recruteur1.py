# Refonte mobile · étape 3, recruteur lot 1 : À traiter, offres, création, détail (19/10/2026).
# python3 recruteur1.py && node shot.js recruteur-1
import os
H = os.path.dirname(os.path.abspath(__file__))
exec(open(H + '/talent4.py').read().split("\n# ---------- Chemins ----------")[0])   # aides + CSS des lots talent

def nav(actif='aujourdhui', role='rh'):
    items = [('aujourdhui','À traiter'),('offre','Offres'),None,('candidats','Candidats'),('message','Messages')]
    h = ''
    for it in items:
        if it is None:
            h += f'<a class="centre{" on" if actif == "orbi" else ""}"><span class="rond">{orbi(52, "reflechit" if actif == "orbi" else "repos")}</span><span>Orbi</span></a>'
        else:
            k, l = it
            b = '<b>3</b>' if k == 'message' else ''
            h += f'<a class="{"on" if k == actif else ""}"><span class="badge">{ic(k, "", k == actif)}{b}</span>{l}</a>'
    return f'<div class="nav-z"><nav class="nav">{h}</nav><span class="home"></span></div>'

def tete_r(titre, org='Baobab Fintech'):
    return (f'<div class="org-l"><span class="lg-e sap" style="width:22px;height:22px;font-size:9px">BF</span>{org}{ic("suivant","xs")}</div>'
            f'<div class="tete"><h1>{titre}</h1>{bi("recherche")}{bi("notification", "<span class=pastille></span>")}<span class="av m">NK</span></div>')

CSSR = '''
.org-l{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;font-size:12.5px;font-weight:600;padding:5px 10px 5px 5px;border-radius:999px;background:var(--plein);box-shadow:var(--verre);margin-bottom:-6px}
.org-l .ic{width:12px;height:12px;transform:rotate(90deg)}
.salut{font-size:13px;color:var(--texte2);margin-top:-8px}
.bt-pub{display:flex;align-items:center;justify-content:center;gap:8px;height:52px;border-radius:999px;font-size:14.5px;font-weight:600}
.cand{display:flex;gap:12px;align-items:center;padding:12px 14px}
.cand .av{width:42px;height:42px;font-size:13px;box-shadow:none}
.cand .t{flex:1;min-width:0}.cand .t b{display:flex;align-items:center;gap:6px;font-size:14px}.cand .t span{display:block;font-size:12px;color:var(--texte2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nv-b{font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:999px;background:var(--g-accent);color:#0F3F37}
.cand .etq{font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px;background:var(--zone);color:var(--texte);display:inline-block;margin-top:4px}
.ent{display:flex;gap:12px;align-items:center;padding:12px 14px}
.ent .jr{width:46px;height:50px;border-radius:14px;background:var(--g-accomp);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10.5px;font-weight:600;color:#0F3F37;flex:none}.ent .jr b{font-size:17px;line-height:1}
.ent .t{flex:1;min-width:0}.ent .t b{display:block;font-size:13.5px}.ent .t span{font-size:12px;color:var(--texte2)}
.ok-c{color:#2E8540;font-weight:600}.att-c{color:#B7791F;font-weight:600}
.actions-g{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ag{display:flex;align-items:center;gap:10px;padding:12px;border-radius:20px}
.ag .nb{font-size:20px;font-weight:600;min-width:26px}.ag span{font-size:12px;line-height:1.25}
.off-c{display:flex;flex-direction:column;gap:8px;padding:14px 16px}
.off-c .h{display:flex;gap:10px;align-items:flex-start}.off-c .h .t{flex:1;min-width:0}.off-c .h b{display:block;font-size:14.5px}.off-c .h span{font-size:12px;color:var(--texte2)}
.off-c .m{display:flex;flex-wrap:wrap;gap:6px}
.off-c .b{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--texte2);padding-top:8px;border-top:1px solid var(--trait)}
.off-c .b b{color:var(--texte);font-size:13px}.off-c .b .sp{flex:1}
.stp{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;white-space:nowrap}
.stp.pub{background:var(--lime-c);color:var(--texte)}.stp.br{background:var(--zone);color:var(--texte2)}.stp.pa{background:var(--ambre-c);color:var(--texte)}.stp.val{background:var(--ciel-c);color:var(--texte)}.stp.clo{background:var(--zone);color:var(--texte2)}
.filtres-h{display:flex;gap:8px;overflow:hidden}
.filtres-h .puce{height:34px;font-size:12.5px;padding:0 13px}
.filtres-h .puce small{font-size:11px;opacity:.7;margin-left:2px}
.vide-r{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:26px 18px;background:linear-gradient(150deg,#F2FCE6,#DDF6EE)}
.sombre .vide-r{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.vide-r .rond-ok{width:64px;height:64px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37}
.vide-r b{font-size:16px}.vide-r span{font-size:12.5px;color:var(--texte2);max-width:260px}
.quota-b{display:flex;align-items:center;gap:10px;padding:12px 14px;font-size:12.5px}
.quota-b .t{flex:1}.quota-b b{display:block;font-size:13.5px}
.manq{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:16px;background:var(--ambre-c);font-size:12.5px}
.ok-l{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:16px;background:var(--lime-c);font-size:12.5px}
.manq .ic,.ok-l .ic{width:16px;height:16px;flex:none}
.apercu-o{display:flex;flex-direction:column;gap:8px;padding:0;overflow:hidden}
.apercu-o .ban{height:70px}.apercu-o .ban svg{width:100%;height:100%}
.apercu-o .c{padding:0 14px 14px;display:flex;flex-direction:column;gap:6px}.apercu-o .c b{font-size:15px}.apercu-o .c span{font-size:12px;color:var(--texte2)}
.lst{display:flex;flex-direction:column;gap:8px}
.lst-i{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:16px;background:var(--plein);box-shadow:var(--verre);font-size:13px}
.lst-i .poig{margin-top:4px}
.sugg-o{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:18px;background:linear-gradient(150deg,#F2FCE6,#DDF6EE);font-size:13px}
.sombre .sugg-o{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.sugg-o .acts{display:flex;gap:8px;margin-top:4px}
.qs{display:flex;flex-direction:column;gap:8px}
.qs .q1{display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);font-size:13px}
.qs .q1 .t{flex:1}.qs .q1 small{display:block;font-size:11.5px;color:var(--texte2)}
.od-h{display:flex;flex-direction:column;gap:8px;padding:16px}
.od-h .k{display:flex;gap:8px;align-items:center}
.od-h h2{font-size:20px;font-weight:600;letter-spacing:-.02em;line-height:1.25}
.od-h .m{font-size:12.5px;color:var(--texte2)}
.chf{display:grid;grid-template-columns:repeat(3,1fr);padding:12px 6px}
.chf div{text-align:center;font-size:11.5px;color:var(--texte2)}.chf div b{display:block;font-size:17px;color:var(--texte)}.chf div+div{border-left:1px solid var(--trait)}
.etp-l{display:flex;flex-direction:column;gap:6px}
.etp-l .e{display:flex;align-items:center;gap:10px;font-size:12.5px}.etp-l .e span{flex:1}.etp-l .e b{font-size:12.5px}
.etp-l .e i{width:10px;height:10px;border-radius:50%;background:var(--piste)}
.etp-l .br-r{flex:1.4;height:6px;border-radius:9px;background:var(--piste);overflow:hidden}.etp-l .br-r i{display:block;height:100%;border-radius:9px;background:var(--g-accent)}
.hist-l{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--texte2)}.hist-l b{color:var(--texte);font-weight:600}
.conf-d{display:flex;flex-direction:column;gap:6px;padding:14px 16px;border-radius:20px;background:var(--ambre-c);font-size:12.5px;line-height:1.45}
.conf-d b{font-size:14px}
.publie .rond-ok{margin-top:50px}
.cand .t span.nv-b{display:inline;color:#0F3F37!important;font-size:10.5px}.cand .t span.etq{display:inline-block;width:auto}.ent .jr,.ent .jr b{color:#0F3F37!important}.sombre .ent .jr{background:#BDF0D9!important;opacity:1}
.stepper{display:flex;align-items:center;gap:12px}.stepper i{width:32px;height:32px;border-radius:50%;background:var(--plein);box-shadow:var(--verre);display:grid;place-items:center;font-style:normal;font-size:16px}.stepper b{font-size:15px}
'''

def cand(i, cls, nom, poste, quand, etape, nv=False, tap=''):
    n = '<span class="nv-b">Nouveau</span>' if nv else ''
    return f'<div class="verre cand"><span class="av {cls}">{i}</span><div class="t"><b>{nom}{n}</b><span>{poste} · {quand}</span><span class="etq">{etape}</span></div><a class="bt p s">Examiner</a></div>'
def ent(j, m, nom, poste, h, mode, st, stc):
    return f'<div class="verre ent"><span class="jr">{m}<b>{j}</b></span><div class="t"><b>{nom}</b><span>{poste} · {h}, {mode}</span><br><span class="{stc}">{st}</span></div>{ic("suivant","s")}</div>'
def offc(t, org, lieu, tags, pub, lim, n, st, stc, nv=None):
    tg = ''.join(f'<span class="tag">{x}</span>' for x in tags)
    nn = f' · <b style="color:#2E8540">{nv} nouvelles</b>' if nv else ''
    return f'''<div class="verre off-c"><div class="h"><div class="t"><b>{t}</b><span>{org} · {lieu}</span></div><span class="stp {stc}">{st}</span><a class="bi">{ic("plus-options","s")}</a></div>
<div class="m">{tg}</div><div class="b"><span>{("Publiée " + pub) if pub != "—" else "Envoyée le 18 oct."}</span><span>{("Limite " + lim) if lim != "—" else "Réponse sous 24 h"}</span><span class="sp"></span><b>{n} candidatures</b></div>{('<div style="font-size:12px;margin-top:-2px">' + nn[3:] + '</div>') if nv else ''}</div>'''

# ---------- 1. À traiter ----------
AT = phone(f'''{tete_r("À traiter")}
<span class="salut">Bonjour Nadia · mardi 19 octobre</span>
<a class="bt a bt-pub">{ic("plus","s")}Publier une offre</a>
<div class="actions-g">
<div class="verre ag"><span class="nb">4</span><span>dossiers à examiner</span></div>
<div class="verre ag"><span class="nb">1</span><span>invitation sans réponse</span></div>
<div class="verre ag"><span class="nb">2</span><span>évaluations à compléter</span></div>
<div class="verre ag"><span class="nb">3</span><span>messages non lus</span></div></div>
<div class="sec-t"><h2>Nouvelles candidatures</h2><a>Tout voir</a></div>
{cand("AM","","Amani M.","Analyste de données junior","il y a 2 h","Reçue",True)}
{cand("FN","a","Fatou N.","Analyste de données junior","hier","Reçue",True)}
<div class="sec-t"><h2>Entretiens à venir</h2><a>Agenda</a></div>
{ent("22","OCT","Grâce M.","Analyste de données junior","10:00","visio","Confirmé","ok-c")}
{ent("23","OCT","Joël T.","Chargé de clientèle","14:30","sur site","En attente de réponse","att-c")}
<div class="sec-t"><h2>Offres actives</h2><a>Mes offres</a></div>
{offc("Analyste de données junior","Baobab Fintech","Kinshasa",["CDI","Hybride"],"le 2 oct.","31 oct.",24,"Publiée","pub",4)}''', 'aujourdhui', 'long')

AT_VIDE = phone(f'''{tete_r("À traiter")}
<span class="salut">Bonjour Nadia · mardi 19 octobre</span>
<div class="verre vide-r"><span class="rond-ok">{ic("valider")}</span><b>Rien à traiter pour l’instant</b><span>Les nouvelles candidatures et les réponses aux invitations arriveront ici.</span></div>
<span class="ck-t">Pour avancer</span>
<div class="verre liste lignes">
<div class="li"><span class="cases c3">{ic("offre","s")}</span><div class="t"><b>Publier une offre</b><span>1 offre active sur 5</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c2">{ic("recherche","s")}</span><div class="t"><b>Rechercher des talents</b><span>Profils visibles par les recruteurs</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("entreprise","s")}</span><div class="t"><b>Faire vérifier l’organisation</b><span>Badge « Vérifiée » sur vos offres</span></div>{ic("suivant")}</div></div>''', 'aujourdhui')

ORG = phone(f'''{tete_r("À traiter")}''', 'aujourdhui',
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Organisation active</h3>
<div class="verre liste lignes">
<div class="li"><span class="lg-e sap" style="width:40px;height:40px;font-size:12px">BF</span><div class="t"><b>Baobab Fintech</b><span>Recruteuse · RH Pro</span></div><span class="radio" style="box-shadow:inset 0 0 0 7px var(--sapin)"></span></div>
<div class="li"><span class="lg-e amb" style="width:40px;height:40px;font-size:12px">KC</span><div class="t"><b>Kivu Conseil RH</b><span>Cabinet · consultante</span></div><span class="radio" style="background:none;box-shadow:inset 0 0 0 2px var(--trait)"></span></div></div>
<div class="verre liste"><div class="li"><span class="cases">{ic("profil","s")}</span><div class="t"><b>Passer à mon espace talent</b></div>{ic("suivant")}</div></div>
<div class="gar">{ic("confidentialite","s")}Chaque organisation ne voit que ses offres, ses candidats et ses messages.</div></div>''')

# ---------- 2. Mes offres ----------
OFFRES = phone(f'''{tete_r("Mes offres")}
<div class="verre rech">{ic("recherche","s")}<span>Rechercher une offre</span><a class="f">{ic("filtres","s")}</a></div>
<a class="bt a bt-pub">{ic("plus","s")}Créer une offre</a>
<div class="filtres-h"><span class="puce on">Actives<small>3</small></span><span class="puce">Brouillons<small>1</small></span><span class="puce">En pause<small>1</small></span><span class="puce">Clôturées</span><span class="puce">Expirées</span></div>
{offc("Analyste de données junior","Baobab Fintech","Kinshasa",["CDI","Hybride"],"le 2 oct.","31 oct.",24,"Publiée","pub",4)}
{offc("Chargé de clientèle","Baobab Fintech","Lubumbashi",["CDD","Sur site"],"le 9 oct.","9 nov.",11,"Publiée","pub")}
{offc("Responsable conformité","Baobab Fintech","Kinshasa",["CDI"],"—","—",0,"En validation","val")}''', 'offre', 'long')

OFF_MENU = phone(f'''{tete_r("Mes offres")}
{offc("Analyste de données junior","Baobab Fintech","Kinshasa",["CDI","Hybride"],"le 2 oct.","31 oct.",24,"Publiée","pub",4)}''', 'offre',
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Analyste de données junior</h3>
<div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("candidats","s")}</span><div class="t"><b>Voir les candidatures</b><span>24 · 4 nouvelles</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("modifier","s")}</span><div class="t"><b>Modifier</b></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("document","s")}</span><div class="t"><b>Dupliquer</b><span>Crée un brouillon</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("partager","s")}</span><div class="t"><b>Copier le lien de l’annonce</b></div></div>
<div class="li"><span class="cases" style="background:var(--ambre-c)">{ic("horloge","s")}</span><div class="t"><b>Mettre en pause</b><span>Masquée, les candidatures restent</span></div></div>
<div class="li danger"><span class="cases">{ic("fermer","s")}</span><div class="t"><b>Clôturer</b><span>Avec confirmation</span></div></div></div></div>''')

CLOT = phone(f'''{tete_r("Mes offres")}''', 'offre',
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Clôturer cette offre ?</h3>
<div class="conf-d"><b>Analyste de données junior</b>L’offre ne recevra plus de candidatures. Les 24 dossiers restent consultables. Les candidats encore en cours seront prévenus seulement quand vous déciderez pour chacun.</div>
<div class="li" style="padding:0;border:0"><div class="t"><b>Envoyer un message aux candidats non retenus</b><span>Vous relisez le modèle avant l’envoi</span></div><span class="sw"></span></div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt dg m pl">Clôturer</a></div></div>''')

# ---------- 3. Créer une offre ----------
def cr_t(n): return f'{tete_f("Nouvelle offre", droite="fermer")}{pas(n,4)}<span class="pas-t">Étape {n} sur 4 · Brouillon enregistré</span>'
ORB_BT = f'<a class="verre carte sugg" style="padding:10px 14px">{orbi(30)}<div class="t"><b style="font-size:13px">Rédiger avec Orbi</b><span style="font-size:11.5px;color:var(--texte2)">À partir du titre et de quelques mots</span></div>{ic("suivant","s")}</a>'
CR1 = phone(f'''{cr_t(1)}
<h2 class="h2s">Le poste</h2>
{champ('Intitulé du poste','Analyste de données junior','focus')}
<div class="dates"><div class="champ"><label>Domaine</label><div class="verre saisie">Data</div></div><div class="champ"><label>Expérience</label><div class="verre saisie">0 à 2 ans</div></div></div>
<div class="champ"><label>Lieu</label><div class="verre saisie">{FLAG["cd"]}&nbsp;&nbsp;Kinshasa</div></div>
<div class="seg"><span>Sur site</span><span class="on">Hybride</span><span>À distance</span></div>
<div class="puces"><span class="puce on">CDI</span><span class="puce">CDD</span><span class="puce">Stage</span><span class="puce">Freelance</span></div>
<div class="li" style="padding:0;border:0;min-height:40px"><div class="t"><b>Nombre de postes</b></div><span class="stepper"><i>−</i><b>1</b><i>+</i></span></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Plus tard</a><a class="bt p pl">Continuer</a></div>')

CR2 = phone(f'''{cr_t(2)}
<h2 class="h2s">La description</h2>
{ORB_BT}
<div class="champ"><label>Présentation du poste</label><div class="verre saisie" style="height:70px;align-items:flex-start;padding-top:12px">Vous rejoignez l’équipe data pour suivre l’activité des agences…</div></div>
<span class="lab-c">Responsabilités</span>
<div class="lst"><div class="lst-i"><span class="poig"><i></i><i></i><i></i></span>Construire les tableaux de bord des agences</div><div class="lst-i"><span class="poig"><i></i><i></i><i></i></span>Préparer le rapport mensuel d’activité</div><a class="ajout s">{ic("plus","s")}Ajouter</a></div>
<span class="lab-c">Compétences</span>
<div class="comp"><span class="v">SQL · indispensable</span><span class="v">Power BI · indispensable</span><span>Python · souhaitée</span><span>{ic("plus","xs")}</span></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Retour</a><a class="bt p pl">Continuer</a></div>')

CR_ORB = phone(f'''{cr_t(2)}
<h2 class="h2s">La description</h2>''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>{orbi(24)} Orbi propose</h3>
<div class="sugg-o"><small class="ck-t">Responsabilités, reformulées</small>
<span>• Concevoir et tenir à jour les tableaux de bord des 12 agences</span><span>• Produire le rapport mensuel d’activité et le présenter</span><span>• Fiabiliser les données avec l’équipe IT</span>
<div class="acts"><a class="bt sec s">Refuser</a><a class="bt sec s">Modifier</a><a class="bt p s">{ic("valider","xs")}Appliquer</a></div></div>
<div class="gar">{ic("cadenas","s")}Orbi n’ajoute ni salaire, ni avantage, ni condition de travail. Rien n’est appliqué sans votre accord.</div>
<a class="pq">{ic("pourquoi")}Pourquoi ces changements ?</a></div>''')

CR3 = phone(f'''{cr_t(3)}
<h2 class="h2s">La candidature</h2>
<div class="champ"><label>Date limite</label><div class="verre saisie">{ic("agenda","s")}&nbsp;&nbsp;31 octobre 2026</div></div>
<span class="lab-c">Documents demandés</span>
<div class="puces"><span class="puce on">{OK()}CV</span><span class="puce">Lettre</span><span class="puce">Diplôme</span><span class="puce">Portfolio</span></div>
<span class="lab-c">Questions de présélection</span>
<div class="qs"><div class="q1"><div class="t">Êtes-vous disponible avant le 1er décembre ?<small>Oui / non · ne bloque pas la candidature</small></div>{ic("modifier","s")}</div><a class="ajout s">{ic("plus","s")}Ajouter une question</a></div>
<div class="champ"><label>Instructions pour les candidats</label><div class="verre saisie" style="color:var(--texte2)">Facultatif</div></div>
<div class="gar">{ic("valider","s")}Les candidats postulent sur Jumanly, gratuitement.</div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Retour</a><a class="bt p pl">Vérifier</a></div>')

CR4 = phone(f'''{cr_t(4)}
<h2 class="h2s">Vérifier et publier</h2>
<div class="verre apercu-o"><span class="ban">{BAN["baobab"]}</span><div class="c"><b>Analyste de données junior</b><span>Baobab Fintech · Kinshasa · CDI · Hybride</span><a class="bt sec s" style="align-self:flex-start">Voir l’annonce complète</a></div></div>
<div class="manq">{ic("aide","s")}<span><b>Salaire non indiqué.</b> Facultatif, mais les offres avec salaire reçoivent plus de candidatures.</span></div>
<div class="ok-l">{ic("valider","s")}Organisation vérifiée : publication immédiate</div>
<div class="verre quota-b">{ic("offre","s")}<div class="t"><b>Offres actives : 3 sur 5</b>Après publication : 4 sur 5</div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Brouillon</a><a class="bt a pl">{ic("envoyer","s")}Publier</a></div>')

PUBLIE = phone(f'''<span class="rond-ok">{ic("valider")}</span>
<h2 class="h2s">Offre publiée</h2><p>« Analyste de données junior » est visible des talents. Les candidatures arriveront dans À traiter.</p>
<div class="suite"><a class="verre"><span class="cases" style="background:var(--g-accomp)">{ic("partager","s")}</span>Copier le lien</a><a class="verre"><span class="cases" style="background:var(--g-oppo)">{ic("recherche","s")}</span>Chercher des talents</a></div>
<a class="bt txt">Retour à mes offres</a>''', cls='conf publie', avec_nav=False)

QUOTA = phone(f'''{cr_t(4)}
<h2 class="h2s">Vérifier et publier</h2>''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Limite d’offres actives atteinte</h3>
<div class="verre quota-b">{ic("offre","s")}<div class="t"><b>1 offre active sur 1</b>Formule RH Free</div></div>
<div class="verre liste lignes">
<div class="li"><span class="cases">{ic("fermer","s")}</span><div class="t"><b>Clôturer ou mettre en pause une offre</b><span>Puis publier celle-ci</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c2">{ic("progression","s")}</span><div class="t"><b>Passer à RH Pro</b><span>5 offres actives, 2 sièges · 19,9 $/mois</span></div>{ic("suivant")}</div></div>
<a class="bt sec pl">Garder en brouillon</a></div>''')

# ---------- 4. Détail d'une offre ----------
OD_R = phone(f'''{tete_f("Offre", droite="plus-options")}
<div class="verre od-h"><div class="k"><span class="stp pub">Publiée</span><span class="m">depuis le 2 oct. · limite 31 oct.</span></div><h2>Analyste de données junior</h2><span class="m">Baobab Fintech · Kinshasa · CDI · Hybride</span>
<div class="bts"><a class="bt sec s">{ic("modifier","xs")}Modifier</a><a class="bt sec s">{ic("partager","xs")}Lien</a><a class="bt sec s">{ic("horloge","xs")}Pause</a></div></div>
<div class="verre chf"><div><b>24</b>candidatures</div><div><b>4</b>nouvelles</div><div><b>2</b>entretiens</div></div>
<div class="verre sect"><div class="sh"><span class="cases" style="background:var(--g-accomp)">{ic("candidats","s")}</span><b>Étapes</b>{ic("suivant","s").replace('class="ic', 'class="ic chev')}</div><div class="sc"><div class="etp-l">
<div class="e"><span>Reçue</span><span class="br-r"><i style="width:40%"></i></span><b>9</b></div>
<div class="e"><span>En examen</span><span class="br-r"><i style="width:30%"></i></span><b>7</b></div>
<div class="e"><span>Présélectionnée</span><span class="br-r"><i style="width:18%"></i></span><b>4</b></div>
<div class="e"><span>Entretien</span><span class="br-r"><i style="width:9%"></i></span><b>2</b></div>
<div class="e"><span>Décision</span><span class="br-r"><i style="width:4%"></i></span><b>0</b></div></div></div></div>
{sect("document","former","Description et responsabilités","", ferme=True)}
{sect("cap","oppo","Compétences recherchées","5", ferme=True)}
{sect("horloge","accomp","Historique","6", ferme=True)}
{sect("progression","former","Performance","vues, candidatures", ferme=True)}''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">{ic("candidats","s")}Voir les 24 candidatures</a></div>')

OD_R2 = phone(f'''{tete_f("Offre", droite="plus-options")}
{sect("horloge","accomp","Historique","6",
 '<div class="hist-l"><span><b>Nadia K.</b> a prolongé la date limite au 31 oct. · 12 oct.</span><span><b>Nadia K.</b> a ajouté la compétence Python · 5 oct.</span><span>Offre publiée après vérification · 2 oct.</span></div>')}
{sect("progression","former","Performance","",
 '<div class="chf" style="padding:4px 0"><div><b>1 240</b>vues</div><div><b>1,9 %</b>ont postulé</div><div><b>3 j</b>délai moyen de réponse</div></div><span style="font-size:11.5px;color:var(--texte2)">Chiffres réels de l’offre, sans estimation.</span>')}
{sect("cap","oppo","Compétences recherchées","5",
 '<div class="comp"><span class="v">SQL</span><span class="v">Power BI</span><span class="v">Excel</span><span>Python</span><span>Présentation</span></div>')}''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">{ic("candidats","s")}Voir les 24 candidatures</a></div>')

CSSR += '.fab-p{position:absolute;right:18px;bottom:122px;z-index:6;height:50px;padding:0 20px;display:flex;align-items:center;gap:8px;border-radius:999px;font-weight:600;font-size:14px;box-shadow:0 14px 28px -12px rgba(15,63,55,.55)}\n'

exec(open(H + '/r1plus.py').read())

CHEMINS = [
 ('Voir ce qui m’attend', ['Ouverture', 'À traiter']),
 ('Changer d’organisation', ['Nom de l’organisation en haut', 'Choisir']),
 ('Examiner une candidature', ['À traiter', 'Examiner', 'Dossier (lot 2)']),
 ('Publier une offre', ['À traiter ou Offres', 'Publier une offre', '4 étapes', 'Publier']),
 ('Rédiger avec Orbi', ['Étape 2', 'Rédiger avec Orbi', 'Appliquer, modifier ou refuser']),
 ('Gérer une offre', ['Offres', '…', 'Modifier, dupliquer, pause, clôturer']),
 ('Voir une offre', ['Offres', 'une carte', 'Détail', 'Voir les candidatures']),
]

def chemins():
    h = ''
    for t, et in CHEMINS:
        e = ''
        for i, x in enumerate(et):
            if isinstance(x, tuple): e += f'<span class="nb">{x[0]}</span><span>{x[1]}</span>'
            elif x == 'ou': e += f'<em>{x}</em>'
            else: e += f'<span>{x}</span>'
            if i < len(et) - 1 and not (isinstance(x, str) and x.startswith('ou')) and not (isinstance(et[i+1], str) and et[i+1].startswith('ou')): e += '<em>→</em>'
        h += f'<div class="chemin"><h4>{t}</h4><div class="ch-et">{e}</div></div>'
    return f'<div class="legende"><i>1</i>Les pastilles orange montrent où l’on appuie. Elles ne font pas partie de l’interface.</div><div class="chemins">{h}</div>'

ECR = [
 ('r0','0 · Comment on y arrive','Pour chaque écran, le chemin depuis la barre.', []),
 ('r1','1 · À traiter','L’écran d’ouverture : ce qui demande une action, pas des statistiques. Barre : À traiter · Offres · Orbi · Candidats · Messages.',
  [ecrans((AT,'À traiter','Actions, nouvelles candidatures, entretiens, offres actives.'),(AT_VIDE,'Rien à traiter','État vide utile.'),(ORG,'Organisation active','Changer d’organisation ou d’espace.'))]),
 ('r2','2 · Mes offres','Filtres simples, une carte par offre, actions dans un menu, confirmation pour clôturer.',
  [ecrans((OFFRES,'Mes offres','Actives, brouillons, en pause, clôturées, expirées.'),(OFF_MENU,'Actions sur une offre','Candidatures, modifier, dupliquer, lien, pause, clôturer.'),(CLOT,'Clôturer','Confirmation, rien n’est envoyé sans relecture.'))]),
 ('r3','3 · Créer une offre','Quatre étapes courtes, brouillon enregistré à chaque saisie, Orbi facultatif.',
  [ecrans((CR1,'1 · Le poste','Titre, domaine, lieu, mode, contrat, postes.'),(CR2,'2 · La description','Responsabilités, compétences indispensables ou souhaitées.'),(CR_ORB,'Rédiger avec Orbi','Appliquer, modifier ou refuser.'),(CR3,'3 · La candidature','Date limite, documents, questions, fiche PDF.'),(CR4,'4 · Vérifier et publier','Toute l’offre relue avant publication.'),(QUOTA,'Limite atteinte','Clôturer une offre ou changer de formule.'),(PUBLIE,'Offre publiée','Lien, recherche de talents.'),(PDF_V,'Fiche PDF, vue talent','Lue dans Jumanly, téléchargeable.'))]),
 ('r4','4 · Détail d’une offre','L’essentiel en haut, le reste replié, « Voir les candidatures » toujours en bas.',
  [ecrans((OD_R,'Détail','Statut, chiffres, étapes.'),(OD_R2,'Sections ouvertes','Historique par type, performance, compétences.'))]),
 ('r5','5 · Mode sombre','',
  [ecrans((sombre(AT),'À traiter',''),(sombre(OFFRES),'Mes offres',''),(sombre(CR4),'Vérifier',''))]),
]
EXTRA = {'r0': chemins()}
som = ''.join(f'<li><a href="#{i}">{t.split(" · ")[1]}</a></li>' for i, t, _, _ in ECR)
corps = ''.join(bloc(i, t, d, *p).replace('</div></section>', EXTRA.get(i, '') + '</div></section>') if i in EXTRA else bloc(i, t, d, *p) for i, t, d, p in ECR)
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Refonte mobile · recruteur, lot 1</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>{open(H + '/fondations.css').read()}{CSS}{CSS2}{CSS3L}{CSS4}{CSSR}</style></head><body>
<header class="couv"><span class="k">{orbi(22)}Jumanly Hire · refonte mobile · étape 3</span><h1>Recruteur, lot 1 : traiter et publier</h1>
<p>19 octobre 2026. À traiter, organisation active, mes offres, création en 4 étapes avec Orbi, vérification et quota, détail d’une offre. Contenus fictifs.</p>
<ul class="som">{som}</ul></header>{corps}<p class="fin">Jumanly · Learn. Grow. Connect.</p></body></html>'''
exec(open(H + '/sans_tap.py').read()); html = sans_tap(html)
out = os.path.join(H, '..', 'refonte-mobile-recruteur-1.html')
open(out, 'w').write(html); print(out, len(html))
