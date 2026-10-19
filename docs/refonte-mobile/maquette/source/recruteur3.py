# Refonte mobile · étape 3, recruteur lot 3 : Orbi, messages, compte RH, organisation, équipe, abonnement, réglages, premiers pas (19/10/2026).
# python3 recruteur3.py && node shot.js recruteur-3
import os
H = os.path.dirname(os.path.abspath(__file__))
exec(open(H + '/recruteur2.py').read().split("\n# ---------- 1. Candidats ----------")[0])

CSSR += '''
.chips-a{display:flex;gap:8px;overflow:hidden}
.chips-a .puce{height:34px;font-size:12.5px;white-space:nowrap}
.brouillon-o{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:20px 20px 6px 20px;background:linear-gradient(150deg,#F2FCE6,#DDF6EE);font-size:13px;line-height:1.45;margin-left:30px}
.sombre .brouillon-o{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.brouillon-o .k{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--texte2)}
.brouillon-o .acts{display:flex;gap:8px}
.ctx-c{display:flex;gap:8px;align-items:center;padding:8px 12px;border-radius:14px;background:var(--zone);font-size:12px}
.ctx-c b{font-weight:600}.ctx-c .sp{flex:1}
.mbr{display:flex;gap:12px;align-items:center}
.mbr .av{width:40px;height:40px;font-size:12px;box-shadow:none;color:#0F3F37}
.role{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:var(--zone)}
.role.ad{background:var(--lime-c)}.sombre .role.ad{background:#C8F59E;color:#0F3F37}
.sieges{display:flex;gap:6px}.sieges i{flex:1;height:8px;border-radius:9px;background:var(--piste)}.sieges i.on{background:var(--g-accent)}
.ver-et{display:flex;flex-direction:column;gap:0}
.org-c{display:flex;flex-direction:column;gap:0;padding:0;overflow:hidden}
.org-c .ban{height:74px}.org-c .ban svg{width:100%;height:100%}
.org-c .c{padding:0 16px 16px;display:flex;flex-direction:column;gap:6px;margin-top:-26px}
.org-c .lg-e{width:54px;height:54px;font-size:16px;box-shadow:0 0 0 3px var(--plein)}
.org-c b.n{font-size:17px}.org-c span.m{font-size:12px;color:var(--texte2)}
.verif-b{display:inline-flex;gap:4px;align-items:center;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--ambre-c)}
.rap-k{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rap-k div{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:20px;background:var(--plein);box-shadow:var(--verre);font-size:11.5px;color:var(--texte2)}
.rap-k b{font-size:20px;color:var(--texte);font-weight:600}
.fr-r{display:flex;flex-direction:column;gap:6px}
.fr-r .e{display:flex;align-items:center;gap:10px;font-size:12.5px}.fr-r .e span{width:108px}.fr-r .e b{width:26px;text-align:right;font-size:12.5px}
.fr-r .e .br-r{flex:1;height:8px;border-radius:9px;background:var(--piste);overflow:hidden}.fr-r .e .br-r i{display:block;height:100%;border-radius:9px;background:var(--g-accent)}
.form-r ul{margin:0}
.contenu>*{flex-shrink:0}
.contenu>.bt.pl{flex:none;height:50px;width:100%}
'''

def nt(cls, icn, t, s_, h, nv=False):
    return f'<div class="li {"nv" if nv else ""}"><span class="cases {cls}">{ic(icn,"s")}</span><div class="t"><b>{t}</b><span>{s_}</span></div><span class="v">{h}</span></div>'

# ---------- 1. Orbi (centre) ----------
ORB_R = phone(f'''<div class="tete"><div class="or-tete" style="flex:1">{orbi(44)}<div class="t"><b>Orbi</b><span>Votre assistant de recrutement</span></div></div><span class="verre credits">99 crédits</span>{bi("horloge")}</div>
<div class="aides"><div class="ai p1"><span class="cases">{ic("offre","s")}</span><b>Rédiger une offre</b></div><div class="ai p2"><span class="cases">{ic("candidats","s")}</span><b>Résumer des candidatures</b></div>
<div class="ai p3"><span class="cases">{ic("entretien","s")}</span><b>Préparer un entretien</b></div><div class="ai p4"><span class="cases">{ic("message","s")}</span><b>Rédiger un message</b></div></div>
<div class="bulle-u">Quelles candidatures regarder en premier pour l’offre Analyste ?</div>
<div class="bulle-o">{orbi(32)}<div class="verre corps"><span>Les 4 nouvelles ont toutes les compétences requises. Amani M. et Fatou N. ont aussi un projet Power BI.</span><div class="acts"><a class="bt p s">Ouvrir les 4</a><a class="pq">{ic("pourquoi")}Pourquoi ?</a></div></div></div>
<div class="gar" style="margin-top:-4px">{ic("pourquoi","s")}Orbi propose un ordre de lecture. Il ne rejette personne.</div>''',
    'orbi', bas=f'<div style="position:absolute;left:16px;right:16px;bottom:118px;z-index:4"><div class="verre fort compo"><span>Écrire à Orbi</span><a class="bi">{ic("micro","s")}</a><a class="bi env">{ic("envoyer","s")}</a></div></div>')

# ---------- 2. Messages ----------
def convr(i, cls, nom, off, msg, h, nl=False):
    n = '<span class="nl">1</span>' if nl else ''
    return f'<div class="li"><span class="av {cls}" style="width:44px;height:44px;font-size:13px;box-shadow:none;color:#0F3F37">{i}</span><div class="t"><b>{nom}</b><span>{off} · {msg}</span></div><div class="hm"><span class="v">{h}</span>{n}</div></div>'
MSG_R = phone(f'''{tete_r("Messages")}
<div class="verre rech">{ic("recherche","s")}<span>Candidat, offre</span></div>
<div class="filtres-h"><span class="puce on">Toutes</span><span class="puce">Non lues<small>3</small></span><span class="puce">Analyste de données</span></div>
<div class="verre liste lignes">
{convr("GM","b","Grâce M.","Analyste de données junior","Merci, je confirme mardi à 10 h.","10:12",True)}
{convr("PK","b","Patrick K.","Analyste de données junior","Serait-il possible jeudi ?","09:30",True)}
{convr("RB","","Ruth B.","Proposition · Analyste","Oui, l’offre m’intéresse.","Hier",True)}
{convr("JT","","Joël T.","Chargé de clientèle","Merci pour votre retour.","Lun.")}</div>
<div class="gar">{ic("confidentialite","s")}Une conversation existe seulement avec un candidat ou un talent qui a accepté le contact.</div>''', 'message')

CONV_R = phone(f'''<div class="tete-f">{bi("retour")}<span class="av b" style="width:40px;height:40px;font-size:12px;box-shadow:none;color:#0F3F37">PK</span><div style="flex:1"><b style="display:block;font-size:15px">Patrick K.</b><span style="font-size:12px;color:var(--texte2)">Analyste de données junior · Entretien</span></div>{bi("plus-options")}</div>
<div class="ctx-c">{ic("candidats","xs")}<span class="sp">Voir le dossier</span><b>52 %</b></div>
<div class="jour">Aujourd’hui</div>
<div class="bulle-u" style="margin-left:0;margin-right:auto;border-radius:20px 20px 20px 6px;background:var(--plein);color:var(--texte);box-shadow:var(--verre)">Bonjour, mardi je suis en examen. Serait-il possible jeudi ?</div>
<div class="brouillon-o"><span class="k">{orbi(18)}Brouillon d’Orbi, à relire</span>Bonjour Patrick, pas de souci. Je vous propose jeudi 24 à 11:00 ou vendredi 25 à 9:30. Bonne chance pour votre examen.<div class="acts"><a class="bt sec s">Modifier</a><a class="bt p s">Utiliser</a></div></div>''', avec_nav=False,
 bas=f'''<div style="position:absolute;left:12px;right:12px;bottom:26px;z-index:4;display:flex;flex-direction:column;gap:8px">
<div class="chips-a"><span class="puce">{ic("agenda","xs")}Proposer des créneaux</span><span class="puce">{ic("document","xs")}Demander un document</span><span class="puce">Modèles</span></div>
<div class="verre fort compo"><a class="bi" style="background:none">{orbi(24)}</a><span>Écrire un message</span><a class="bi env">{ic("envoyer","s")}</a></div></div>''')

MODELES = phone(f'''<div class="tete-f">{bi("retour")}<b style="flex:1;font-size:16px">Patrick K.</b></div>''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Modèles de messages</h3>
<div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("agenda","s")}</span><div class="t"><b>Invitation à un entretien</b><span>Avec les créneaux de l’offre</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("document","s")}</span><div class="t"><b>Demande de document</b><span>Diplôme, attestation, portfolio</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c3">{ic("valider","s")}</span><div class="t"><b>Candidature retenue</b></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("message","s")}</span><div class="t"><b>Après entretien, non retenue</b><span>Respectueux, sans détail personnel</span></div>{ic("suivant")}</div></div>
<a class="ajout s">{ic("plus","s")}Créer un modèle</a>
<div class="gar">{ic("modifier","s")}Un modèle s’insère dans le message : vous le relisez avant l’envoi.</div></div>''')

NOTIF_R = phone(f'''{tete_f("Notifications", droite="reglages")}
<div class="grp-t">Aujourd’hui</div>
<div class="verre liste lignes">
{nt('c3','candidature','4 nouvelles candidatures','Analyste de données junior','10:40',True)}
{nt('c2','entretien','Grâce M. a confirmé','Mardi 22 oct. à 10:00 · visio','10:12',True)}
{nt('','horloge','Patrick K. propose jeudi','Au lieu de mardi 22','09:30',True)}</div>
<div class="grp-t">Cette semaine</div>
<div class="verre liste lignes">
{nt('c1','offre','Offre en validation','Responsable conformité','Lun.')}
{nt('c3','message','Ruth B. a accepté','Vous pouvez lui écrire','Lun.')}
{nt('','horloge','Fin d’offre dans 5 jours','Chargé de clientèle','Dim.')}</div>''', avec_nav=False)

# ---------- 3. Compte RH ----------
COMPTE_R = phone(f'''{tete_f("Compte", droite=None)}
<div class="verre hub-id"><span class="av">NK</span><div class="t"><b>Nadia Kabeya</b><span>Responsable recrutement · Baobab Fintech</span></div>{ic("suivant","s")}</div>
<div class="verre liste lignes">
<div class="li"><span class="cases c3">{ic("entreprise","s")}</span><div class="t"><b>Organisation</b><span>Page, vérification</span></div><span class="verif-b">À vérifier</span></div>
<div class="li"><span class="cases c2">{ic("candidats","s")}</span><div class="t"><b>Équipe</b><span>2 sièges sur 2</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("favori","s")}</span><div class="t"><b>Viviers</b><span>3 viviers, 22 talents</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("progression","s")}</span><div class="t"><b>Rapports</b><span>Offres et candidatures</span></div>{ic("suivant")}</div></div>
<div class="verre liste lignes">
<div class="li"><span class="cases">{ic("portefeuille","s")}</span><div class="t"><b>Abonnement</b><span>RH Pro · 99 crédits Orbi</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("reglages","s")}</span><div class="t"><b>Paramètres</b><span>Notifications, sécurité, confidentialité</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("aide","s")}</span><div class="t"><b>Aide</b><span>assistant@jumanly.io</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("profil","s")}</span><div class="t"><b>Passer à mon espace talent</b></div>{ic("suivant")}</div></div>
<div class="verre liste"><div class="li danger"><span class="cases">{ic("deconnexion","s")}</span><div class="t"><b>Se déconnecter</b></div></div></div>''', avec_nav=False)

PROF_R = phone(f'''{tete_f("Mon profil RH")}
<div style="display:flex;flex-direction:column;align-items:center;gap:8px"><span class="av" style="width:76px;height:76px;font-size:22px">NK</span><a class="bt sec s">{ic("photo","xs")}Photo, facultative</a></div>
{champ('Nom affiché','Nadia Kabeya')}
{champ('Fonction','Responsable recrutement')}
{champ('E-mail professionnel','nadia.k@baobab-fintech.example','', 'cadenas', 'Utilisé pour vérifier l’organisation')}
<div class="gar">{ic("confidentialite","s")}Les candidats voient votre nom, votre fonction et votre organisation.</div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Enregistrer</a></div>')

ORG_P = phone(f'''{tete_f("Organisation", droite="modifier")}
<div class="verre org-c"><span class="ban">{BAN["baobab"]}</span><div class="c"><span class="lg-e sap">BF</span><b class="n">Baobab Fintech</b><span class="m">Services financiers · 50 à 200 personnes · Kinshasa</span><span class="verif-b" style="align-self:flex-start">{ic("horloge","xs")}Vérification en cours</span></div></div>
{sect("document","former","Présentation","", '<span style="font-size:12.5px;line-height:1.5">Solutions de paiement mobile pour les commerçants d’Afrique centrale.</span>')}
{sect("localisation","accomp","Sites","2", ferme=True)}
{sect("offre","oppo","Offres publiées","2", ferme=True)}
<a class="bt sec pl">{ic("profil","s")}Voir la page comme un talent</a>''', avec_nav=False, cls='long')

VERIF_O = phone(f'''{tete_f("Vérifier l’organisation")}
<p style="font-size:13px;color:var(--texte2);line-height:1.5">La vérification protège les talents. Une organisation vérifiée publie sans attente et affiche un badge.</p>
<div class="verre liste lignes ver-et">
<div class="li"><span class="cases c3">{ic("valider","s")}</span><div class="t"><b>E-mail sur le domaine</b><span>@baobab-fintech.example confirmé</span></div></div>
<div class="li"><span class="cases c2">{ic("document","s")}</span><div class="t"><b>Document officiel</b><span>RCCM ou numéro d’impôt · PDF ou photo</span></div><span class="v">Envoyé</span></div>
<div class="li"><span class="cases" style="background:var(--ambre-c)">{ic("horloge","s")}</span><div class="t"><b>Examen par Jumanly</b><span>Sous 2 jours ouvrés</span></div></div></div>
<div class="gar">{ic("message","s")}Une question : assistant@jumanly.io</div>
<div class="gar">{ic("offre","s")}En attendant, vos offres passent en validation avant publication.</div>''', avec_nav=False)

# ---------- 4. Équipe ----------
def mbr(i, cls, nom, s_, role, rc=''):
    return f'<div class="li mbr"><span class="av {cls}">{i}</span><div class="t"><b>{nom}</b><span>{s_}</span></div><span class="role {rc}">{role}</span></div>'
EQUIPE = phone(f'''{tete_f("Équipe", droite="plus")}
<div class="verre quota-b" style="flex-direction:column;align-items:stretch;gap:8px"><div style="display:flex;justify-content:space-between"><b>Sièges utilisés : 2 sur 2</b><span style="font-size:12px;color:var(--texte2)">RH Pro</span></div><span class="sieges"><i class="on"></i><i class="on"></i></span></div>
<div class="verre liste lignes">
{mbr("NK","","Nadia Kabeya","vous · toutes les offres","Admin","ad")}
{mbr("OB","b","Olivier B.","Analyste de données junior","Recruteur")}
<div class="li mbr"><span class="av a">ML</span><div class="t"><b>M. Lukusa</b><span>Invitation envoyée par e-mail · 2 j</span></div><span class="role">En attente</span></div></div>
<div class="gar">{ic("confidentialite","s")}Admin : équipe et abonnement. Recruteur : ses offres et leurs candidats. Lecteur : consulter et noter.</div>''', avec_nav=False)

INVITER = phone(f'''{tete_f("Équipe", droite="plus")}''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Inviter dans l’équipe</h3>
{champ('E-mail','m.lukusa@baobab-fintech.example','focus')}
<span class="lab-c">Rôle</span>
<div class="seg"><span>Admin</span><span class="on">Recruteur</span><span>Lecteur</span></div>
<div class="manq">{ic("aide","s")}<span><b>Plus de siège libre.</b> L’invitation partira quand un siège se libère, ou passez à RH Premium (3 sièges).</span></div>
<div class="bts"><a class="bt sec m">Voir RH Premium</a><a class="bt p m pl">{ic("envoyer","s")}Inviter</a></div></div>''')

# ---------- 5. Abonnement ----------
ABO_R = phone(f'''{tete_f("Abonnement", droite=None)}
<div class="verre fo-act"><div class="t"><small>Votre formule</small><b>RH Pro · 19,9 $/mois</b><span>Payée jusqu’au 9 novembre</span></div></div>
<div class="verre quotas">
<div class="quota"><div class="l"><b>Sièges</b><span>2 sur 2</span></div><span class="barre"><i style="width:100%"></i></span></div>
<div class="quota"><div class="l"><b>Offres actives</b><span>3 sur 5</span></div><span class="barre"><i style="width:60%"></i></span></div>
<div class="quota"><div class="l"><b>Crédits Orbi</b><span>99 sur 100</span></div><span class="barre"><i style="width:99%"></i></span></div>
<div class="quota"><div class="l"><b>Analyse des CV par Orbi</b><span>Incluse</span></div></div>
<div class="quota"><div class="l"><b>Grilles d’évaluation</b><span>RH Premium</span></div></div></div>
<div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("progression","s")}</span><div class="t"><b>Changer de formule</b><span>RH Free, RH Premium</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("portefeuille","s")}</span><div class="t"><b>Moyen de paiement</b><span>Orange Money · 89 ••• 07</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("document","s")}</span><div class="t"><b>Factures</b><span>Au nom de Baobab Fintech · PDF</span></div>{ic("suivant")}</div></div>
<div class="gar">{ic("horloge","s")}Prépayé. À la fin, retour à RH Free sans rien perdre : les offres en trop passent en pause.</div>''', avec_nav=False, cls='long')

FORMS_R = phone(f'''{tete_f("Formules RH")}
<div class="verre form"><div class="h"><b>RH Free</b><span class="prix">0 $</span></div><ul><li>{OK()}1 siège, 1 offre active</li><li>{OK()}Candidatures, étapes, messages</li></ul></div>
<div class="verre form"><span class="rec">Votre formule</span><div class="h"><b>RH Pro</b><span class="prix">19,9 $<small> /mois</small></span></div><ul><li>{OK()}2 sièges, 5 offres actives</li><li>{OK()}100 crédits Orbi, analyse des CV</li></ul></div>
<div class="verre form on"><div class="h"><b>RH Premium</b><span class="prix">49,9 $<small> /mois</small></span></div><ul><li>{OK()}3 sièges, 15 offres actives</li><li>{OK()}300 crédits Orbi, grilles d’évaluation</li></ul></div>
<div class="gar">{ic("entreprise","s")}Plus de sièges ou une page entreprise complète : Jumanly Companies, dès 79,9 $/mois.</div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Passer à RH Premium</a></div>')

PAY_R = PAY.replace('<b>Premium · 1 mois</b><br><span>du 19 oct. au 18 nov.</span>', '<b>RH Premium · 1 mois</b><br><span>Baobab Fintech · du 19 oct. au 18 nov.</span>', 1)

# ---------- 6. Rapports et paramètres ----------
RAPPORT = phone(f'''{tete_f("Rapports", droite=None)}
<div class="filtres-h"><span class="puce on">30 jours</span><span class="puce">Trimestre</span><span class="puce">Par offre</span></div>
<div class="rap-k"><div><b>35</b>candidatures reçues</div><div><b>3 j</b>délai moyen de première réponse</div><div><b>5</b>entretiens</div><div><b>1</b>recrutement</div></div>
<div class="verre carte" style="padding:14px 16px;display:flex;flex-direction:column;gap:10px"><b style="font-size:14px">Où en sont les candidatures</b>
<div class="fr-r"><div class="e"><span>Reçues</span><span class="br-r"><i style="width:100%"></i></span><b>35</b></div><div class="e"><span>Examinées</span><span class="br-r"><i style="width:74%"></i></span><b>26</b></div><div class="e"><span>Présélectionnées</span><span class="br-r"><i style="width:23%"></i></span><b>8</b></div><div class="e"><span>Entretien</span><span class="br-r"><i style="width:14%"></i></span><b>5</b></div><div class="e"><span>Recrutées</span><span class="br-r"><i style="width:3%"></i></span><b>1</b></div></div></div>
<div class="gar">{ic("pourquoi","s")}Chiffres réels de vos offres. Aucune donnée personnelle des candidats.</div>
<a class="bt sec pl">{ic("telecharger","s")}Exporter en CSV</a>''', avec_nav=False, cls='long')

PARAM_R = phone(f'''{tete_f("Paramètres", droite=None)}
<span class="ck-t">Notifications</span>
<div class="verre liste lignes">
<div class="li"><div class="t"><b>Nouvelle candidature</b><span>Un résumé par jour</span></div><span class="sw on"></span></div>
<div class="li"><div class="t"><b>Réponse à une invitation</b></div><span class="sw on"></span></div>
<div class="li"><div class="t"><b>Nouveau message</b></div><span class="sw on"></span></div></div>
<span class="ck-t">Sécurité et confidentialité</span>
<div class="verre liste lignes">
<div class="li"><span class="cases">{ic("cadenas","s")}</span><div class="t"><b>Validation en deux étapes</b><span>Recommandée pour les recruteurs</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases">{ic("confidentialite","s")}</span><div class="t"><b>Journal des consultations</b><span>Profils ouverts par l’équipe</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("horloge","s")}</span><div class="t"><b>Fuseau horaire</b><span>Kinshasa (UTC+1)</span></div>{ic("suivant")}</div></div>''', avec_nav=False, cls='long')

# ---------- 7. Premiers pas RH ----------
OBR1 = phone(f'''{tete_f("", droite=None)}{pas(1,3)}<span class="pas-t">1 sur 3</span>
<div class="ob-q"><h2>Vous recrutez pour…</h2><p>Jumanly prépare votre espace en conséquence.</p></div>
<div class="obj-g">
<div class="o1 on"><span class="cases">{ic("entreprise","s")}</span><b>Mon entreprise</b>PME, grand groupe, ONG</div>
<div class="o2"><span class="cases">{ic("candidats","s")}</span><b>Un cabinet RH</b>Pour plusieurs clients</div>
<div class="o3"><span class="cases">{ic("profil","s")}</span><b>En indépendant</b>Consultant ou chasseur</div>
<div class="o4"><span class="cases">{ic("former","s")}</span><b>Une école</b>Stages et premiers emplois</div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Continuer</a></div>')

OBR2 = phone(f'''{tete_f("", droite=None)}{pas(2,3)}<span class="pas-t">2 sur 3</span>
<div class="ob-q"><h2>Votre organisation</h2><p>Elle apparaîtra sur vos offres.</p></div>
{champ('Nom','Baobab Fintech','focus')}
<div class="champ"><label>Pays</label><div class="verre saisie">{FLAG["cd"]}&nbsp;&nbsp;RD Congo</div></div>
<div class="dates"><div class="champ"><label>Secteur</label><div class="verre saisie">Finance</div></div><div class="champ"><label>Taille</label><div class="verre saisie">50 à 200</div></div></div>
<div class="gar">{ic("cadenas","s")}Votre e-mail @baobab-fintech.example sera utilisé pour la vérification.</div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Retour</a><a class="bt p pl">Continuer</a></div>')

OBR3 = phone(f'''{tete_f("", droite=None)}{pas(3,3)}<span class="pas-t">3 sur 3</span>
<div class="pret"><span class="rond-ok" style="width:72px;height:72px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37">{ic("valider")}</span><h2>Votre espace recruteur est prêt</h2><p>Vous commencez avec RH Free : 1 siège et 1 offre active.</p></div>
<div class="verre liste lignes">
<div class="li"><span class="cases c3">{ic("offre","s")}</span><div class="t"><b>Publier une première offre</b><span>4 étapes, Orbi peut vous aider</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("entreprise","s")}</span><div class="t"><b>Faire vérifier l’organisation</b><span>Publication sans attente</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c2">{ic("candidats","s")}</span><div class="t"><b>Inviter un collègue</b><span>Dès RH Pro</span></div>{ic("suivant")}</div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt a pl">Commencer</a></div>')

exec(open(H + '/r3plus.py').read())

CHEMINS = [
 ('Demander à Orbi', ['Orbi au centre de la barre', 'Une aide ou une question']),
 ('Répondre à un candidat', ['Messages', 'Conversation', 'Brouillon d’Orbi ou modèle', 'Envoyer']),
 ('Voir les alertes', ['Cloche en haut', 'Notifications']),
 ('Ouvrir le compte', ['Avatar en haut', 'Compte']),
 ('Faire vérifier l’organisation', ['Compte', 'Organisation', 'Vérifier']),
 ('Gérer l’équipe', ['Compte', 'Équipe', 'Inviter']),
 ('Changer de formule', ['Compte', 'Abonnement', 'Formules', 'Paiement']),
 ('Suivre les résultats', ['Compte', 'Rapports']),
 ('Commencer comme recruteur', ['Inscription (lot talent 4)', 'Je recrute', 'Organisation', 'Espace prêt']),
]

def chemins():
    h = ''.join(f'<div class="chemin"><h4>{t}</h4><div class="ch-et">' + '<em>→</em>'.join(f'<span>{x}</span>' for x in et) + '</div></div>' for t, et in CHEMINS)
    return f'<div class="chemins">{h}</div>'

ECR = [
 ('w0','0 · Comment on y arrive','Pour chaque écran, le chemin depuis la barre.', []),
 ('w1','1 · Orbi','Au centre de la barre, comme pour le talent. Il aide à rédiger, résumer, préparer. Il ne rejette personne.',
  [ecrans((ORB_R,'Orbi','Quatre aides, crédits, historique.'),)]),
 ('w2','2 · Messages et notifications','Une conversation par candidat. Actions rapides, modèles et brouillon d’Orbi, toujours relus.',
  [ecrans((MSG_R,'Messages','Non lues, filtre par offre.'),(CONV_R,'Conversation','Lien vers le dossier, brouillon d’Orbi, actions rapides.'),(MODELES,'Modèles','Insérés, puis relus.'),(NOTIF_R,'Notifications','Candidatures, réponses, échéances.'))]),
 ('w3','3 · Compte RH et organisation','Par l’avatar, en haut de chaque onglet.',
  [ecrans((COMPTE_R,'Compte','Organisation, équipe, viviers, rapports, abonnement.'),(PROF_R,'Mon profil RH','Ce que voient les candidats.'),(ORG_P,'Organisation','Page vue par les talents.'),(VERIF_O,'Vérification','Domaine, document, examen.'))]),
 ('w4','4 · Équipe','Sièges selon la formule, trois rôles simples.',
  [ecrans((EQUIPE,'Équipe','Sièges, membres, invitations.'),(INVITER,'Inviter','Rôle, siège manquant.'))]),
 ('w5','5 · Abonnement','Prépayé, Mobile Money ou carte. Les écrans de paiement sont ceux du talent (lot 4), au nom de l’organisation.',
  [ecrans((ABO_R,'Abonnement','Sièges, offres actives, crédits, factures.'),(FORMS_R,'Formules RH','Free, Pro, Premium.'),(PAY_R,'Paiement','Mobile Money ou carte.'))]),
 ('w6','6 · Rapports et paramètres','Des chiffres simples et réels. La sécurité d’abord.',
  [ecrans((RAPPORT,'Rapports','Volumes, délais, étapes, export.'),(PARAM_R,'Paramètres','Notifications, deux étapes, journal des consultations.'))]),
 ('w7','7 · Premiers pas du recruteur','Après « Je recrute » à l’inscription. Trois écrans, RH Free par défaut.',
  [ecrans((OBR1,'Vous recrutez pour…','Entreprise, cabinet, indépendant, école.'),(OBR2,'Votre organisation','Nom, pays, secteur, taille.'),(OBR3,'Espace prêt','Trois premiers pas.'))]),
 ('w8','8 · Mode sombre','',
  [ecrans((sombre(ORB_R),'Orbi',''),(sombre(CONV_R),'Conversation',''),(sombre(COMPTE_R),'Compte',''))]),
]
EXTRA = {'w0': chemins()}
som = ''.join(f'<li><a href="#{i}">{t.split(" · ")[1]}</a></li>' for i, t, _, _ in ECR)
corps = ''.join(bloc(i, t, d, *p).replace('</div></section>', EXTRA.get(i, '') + '</div></section>') if i in EXTRA else bloc(i, t, d, *p) for i, t, d, p in ECR)
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Refonte mobile · recruteur, lot 3</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>{open(H + '/fondations.css').read()}{CSS}{CSS2}{CSS3L}{CSS4}{CSSR}</style></head><body>
<header class="couv"><span class="k">{orbi(22)}Jumanly Hire · refonte mobile · étape 3</span><h1>Recruteur, lot 3 : échanger et gérer</h1>
<p>19 octobre 2026. Orbi, messages, notifications, compte RH, organisation et vérification, équipe, abonnement, rapports, paramètres, premiers pas. Contenus fictifs.</p>
<ul class="som">{som}</ul></header>{corps}<p class="fin">Jumanly · Learn. Grow. Connect.</p></body></html>'''
exec(open(H + '/sans_tap.py').read()); html = sans_tap(html); html = epure(html)
out = os.path.join(H, '..', 'refonte-mobile-recruteur-3.html')
open(out, 'w').write(html); print(out, len(html))
