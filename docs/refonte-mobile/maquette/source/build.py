# Refonte mobile · planche des fondations. python3 build.py && node shot.js
import os
H = os.path.dirname(os.path.abspath(__file__))
exec(open(H + '/icones.py').read())

def bi(nom, extra='', cls=''):
    return f'<a class="bi {cls}" aria-label="{D[nom][0]}">{ic(nom, "s")}{extra}</a>'

def nav(actif='accueil', role='talent', cls=''):
    items = [('accueil','Accueil'),('former','Se former'),None,('opportunites','Opportunités'),('carriere','Carrière')] if role == 'talent' else \
            [('aujourdhui','Aujourd’hui'),('offre','Offres'),None,('candidats','Candidats'),('agenda','Agenda')]
    h = ''
    for it in items:
        if it is None:
            h += f'<a class="centre{" on" if actif == "orbi" else ""}">{orbi(52, "reflechit" if actif == "orbi" else "repos")}<span>Orbi</span></a>'
        else:
            k, l = it
            b = '<b>4</b>' if (role != 'talent' and k == 'candidats') else ''
            h += f'<a class="{"on" if k == actif else ""}"><span class="badge">{ic(k, "", k == actif)}{b}</span>{l}</a>'
    return f'<nav class="nav {cls}">{h}</nav>'

def tete(titre, role='talent'):
    return (f'<div class="tete"><h1>{titre}</h1>{bi("notification", "<span class=pastille></span>")}'
            f'{bi("message", "<span class=cpt>2</span>")}<span class="av s">GM</span></div>')

def phone(contenu, actif='accueil', cls='', avec_nav=True, bas=''):
    return (f'<div class="phone {cls}"><div class="statut"><span>9:41</span><span><i></i><i></i><i></i></span></div>'
            f'<div class="contenu">{contenu}</div>{bas}{nav(actif) if avec_nav else ""}</div>')

def pl(lab, html, cls='', note=''):
    n = f'<p class="note">{note}</p>' if note else ''
    return f'<div class="pl {cls}"><span class="lab">{lab}</span>{html}{n}</div>'

def bloc(id_, titre, intro, *pls):
    return f'<section class="bloc" id="{id_}"><header><h2>{titre}</h2><p>{intro}</p></header><div class="grille">{"".join(pls)}</div></section>'

def offre(lg, cls, titre, ent, lieu, tags, score, fav=False):
    t = ''.join(f'<span class="tag">{x}</span>' for x in tags)
    return (f'<div class="carte offre"><span class="lg-e {cls}">{lg}</span><div class="t"><b>{titre}</b><span>{ent} · {lieu}</span>'
            f'<div class="bas">{t}<span class="score">{score} %{ic("pourquoi","xs")}</span></div></div>{ic("favori","s", fav)}</div>')

# ---------- 1. Icônes ----------
ICONES = ''
for g, noms in GROUPES:
    ICONES += f'<p class="ic-tg">{g}</p><div class="ic-g">' + ''.join(
        f'<div class="ic-t"><span class="duo">{ic(n)}{ic(n, "", True)}</span><span>{D[n][0]}</span></div>' for n in noms) + '</div>'
TAILLES = '<div class="ic-x">' + ''.join(f'<figure>{ic("opportunites", c)}<span>{l}</span></figure>' for c, l in [('xs','16 px'),('s','20 px'),('','24 px'),('l','28 px')]) + \
    f'<figure>{ic("opportunites","",True)}<span>Actif</span></figure><figure style="color:#9FB3AE;background:var(--sapin);padding:8px;border-radius:12px">{ic("opportunites")}<span style="color:#9FB3AE">Sur Sapin</span></figure></div>'

# ---------- 2. Couleurs ----------
PAL = '<div class="pal">' + ''.join(f'<div><i style="background:{c}"></i><b>{n}</b><span>{u}</span></div>' for c, n, u in [
    ('#F2EDE5','Crème','Fond de toutes les pages'), ('#FFFFFF','Blanc','Cartes, barres, champs'), ('#0F3F37','Sapin','Texte, bouton principal'),
    ('#A6F26B','Lime','Accent rare : actif, réussite, Orbi'), ('#5B6B68','Ardoise','Texte secondaire, icônes inactives'),
    ('#EEFBDD','Lime clair','Score, fond de pilier'), ('#DDF6EE','Menthe clair','Fond de pilier'), ('#FDF1D8','Ambre clair','À compléter, attente'),
    ('#FBE4E0','Corail clair','Erreur, refus, urgent'), ('#0B1A1F','Nuit','Thème Vert, notifications')]) + '</div>'
REGLES = '<div class="regles">' + ''.join(f'<div><b>{t}</b>{c}</div>' for t, c in [
    ('Aucun dégradé', 'Boutons, barres et Orbi en aplats. Le relief vient d’une ombre légère, pas de la couleur.'),
    ('Le Lime est rare', 'Un point actif, un score, un succès. Jamais en grand fond, jamais de texte blanc dessus.'),
    ('Un seul bouton plein', 'Par écran, une action principale en Sapin. Le Lime plein est réservé aux moments forts : Postuler, Publier.'),
    ('Sora partout', 'Titres 28 / 18 / 15 px en 600, texte 14 px, légendes 12 px. Pas plus de trois tailles par écran.')]) + '</div>'

# ---------- 3. Barres du bas ----------
NAVS = ''.join([
    pl('Talent · Accueil actif', f'<div class="nav-pl">{nav("accueil")}</div>'),
    pl('Talent · Orbi ouvert', f'<div class="nav-pl">{nav("orbi")}</div>', note='Le point du satellite tourne pendant qu’Orbi réfléchit.'),
    pl('Recruteur · Candidats actif', f'<div class="nav-pl">{nav("candidats", "rh")}</div>', note='Même gabarit. Badge Corail : candidatures à traiter.'),
    pl('Thème Vert', f'<div class="nav-pl">{nav("opportunites", cls="vert")}</div>', note='Aplats sombres, même point Lime.'),
])

# ---------- 4. En-têtes ----------
TETES = ''.join([
    pl('Page principale', f'<div class="cadre-r">{tete("Opportunités")}</div>', note='Titre en grand ; notifications, messages, avatar (Compte).'),
    pl('Recruteur, plusieurs organisations', f'<div class="cadre-r">{tete("Aujourd’hui")}<span class="org" style="margin-top:6px"><span class="lg">BF</span>Baobab Fintech{ic("suivant","xs")}</span></div>'),
    pl('Page secondaire', f'<div class="cadre-r"><div class="tete sec">{bi("retour")}<h1>Analyste de données junior</h1>{bi("partager")}</div></div>', note='Retour, titre court, une action au plus.'),
    pl('Réduit au défilement', f'<div class="cadre-r"><div class="tete red"><h1>Opportunités</h1></div></div>'),
])

# ---------- 5. Recherche ----------
RECH = ''.join([
    pl('Au repos', f'<div class="rech">{ic("recherche","s")}<span>Rechercher une offre, une formation</span><a class="f">{ic("filtres","s")}</a></div>'),
    pl('Saisie : récentes et suggestions', f'''<div class="rech focus">{ic("recherche","s")}<span>analyste<span class="cur"></span></span><a class="x">{ic("fermer","xs")}</a></div>
<div class="panneau"><h4>Récentes</h4><div class="p-l">{ic("horloge","s")}Analyste de données Kinshasa</div><div class="p-l">{ic("horloge","s")}Power BI débutant</div>
<h4>Suggestions</h4><div class="p-l">{ic("opportunites","s")}<span><b>analyste</b> de données</span><small>24 offres</small></div><div class="p-l">{ic("former","s")}<span><b>Analyste</b> : les bases SQL</span><small>Formation</small></div></div>'''),
    pl('Filtres actifs', f'''<div class="rech">{ic("recherche","s")}<span style="color:var(--sapin)">Analyste</span><a class="f">{ic("filtres","s")}<b>2</b></a></div>
<div class="puces"><span class="puce on">Kinshasa{ic("fermer","xs")}</span><span class="puce on">CDI{ic("fermer","xs")}</span><span class="puce">Effacer</span></div><div class="res-n"><span>24 offres</span><span>Les plus adaptées d’abord</span></div>'''),
    pl('Aucun résultat', f'''<div class="rech focus">{ic("recherche","s")}<span>actuaire junior Mbuji-Mayi</span><a class="x">{ic("fermer","xs")}</a></div>
<div class="panneau"><div class="p-l" style="color:var(--ardoise)">Aucune offre pour cette recherche.</div><div class="p-l orbi-l">{orbi(28)}<span><b>Demander à Orbi</b> des métiers proches</span></div></div>''', note='La recherche cherche ; Orbi n’est proposé que si rien ne correspond.'),
    pl('Feuille de filtres', f'''<div class="feuille"><div class="poignee"></div><h3>Filtres</h3>
<div class="champ"><label>Lieu</label><div class="puces"><span class="puce on">Kinshasa</span><span class="puce">Lubumbashi</span><span class="puce">{ic("plus","xs")}Ajouter</span></div></div>
<div class="champ"><label>Contrat</label><div class="puces"><span class="puce on">CDI</span><span class="puce">CDD</span><span class="puce">Stage</span></div></div>
<div class="li" style="border:0;padding:0"><div class="t"><b>Télétravail possible</b></div><span class="sw"></span></div>
<div class="f-act"><a class="bt sec m">Effacer</a><a class="bt p m pl">Voir 24 offres</a></div></div>'''),
])

# ---------- 6. Options ----------
OPTS = ''.join([
    pl('Liste d’options', f'''<div class="liste">
<div class="li"><span class="cases">{ic("portefeuille","s")}</span><div class="t"><b>Formule et paiement</b><span>Starter · Mobile Money</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("confidentialite","s")}</span><div class="t"><b>Confidentialité</b></div><span class="v">Recruteurs</span>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("notification","s")}</span><div class="t"><b>Alertes d’offres</b></div><span class="sw on"></span></div>
<div class="li danger"><span class="cases">{ic("deconnexion","s")}</span><div class="t"><b>Se déconnecter</b></div></div></div>'''),
    pl('Choix unique', f'''<div class="choix"><div class="ch on"><span class="radio"></span><div class="t"><b>Trouver un emploi</b><span>Offres et entretiens d’abord</span></div></div>
<div class="ch"><span class="radio"></span><div class="t"><b>Me former</b><span>Parcours d’employabilité d’abord</span></div></div>
<div class="ch"><span class="radio"></span><div class="t"><b>Changer de voie</b><span>Orbi m’aide à choisir</span></div></div></div>'''),
    pl('Choix multiples et segments', f'''<div class="puces"><span class="puce on">{ic("valider","xs")}Power BI</span><span class="puce on">{ic("valider","xs")}SQL</span><span class="puce">Excel</span><span class="puce">Python</span><span class="puce">{ic("plus","xs")}Autre</span></div>
<div class="seg"><span class="on">Pour vous</span><span>Enregistrées</span><span>Candidatures<small>3</small></span></div>
<div class="seg"><span>Liste</span><span class="on">Par étape</span></div>'''),
    pl('Champs', f'''<div class="champ"><label>Titre du poste</label><div class="saisie focus">Analyste de données</div></div>
<div class="champ"><label>E-mail</label><div class="saisie err">grace.mbuyi@</div><span class="aide err">Il manque la fin de l’adresse.</span></div>'''),
    pl('Feuille d’actions', f'''<div class="feuille"><div class="poignee"></div><h3>Mettre à jour mon profil</h3>
<div class="li"><span class="cases">{ic("cv","s")}</span><div class="t"><b>Importer un CV</b><span>PDF ou photo</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("realisation","s")}</span><div class="t"><b>Ajouter une réalisation</b></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("cap","s")}</span><div class="t"><b>Changer d’objectif</b></div>{ic("suivant")}</div>
<a class="bt sec m" style="margin-top:6px">Annuler</a></div>''', note='Remplace le bouton + : chaque feuille s’ouvre depuis la page qui la concerne.'),
    pl('Menu contextuel et étapes', f'''<div class="menu-c"><a>{ic("partager","s")}Partager</a><a class="on">{ic("favori","s")}Enregistrer</a><a>{ic("pourquoi","s")}Pourquoi cette offre ?</a><a class="danger">{ic("fermer","s")}Ne plus voir</a></div>
<div class="etapes"><div class="et ok"><i>{ic("valider","xs")}</i>Envoyée</div><div class="et ok"><i>{ic("valider","xs")}</i>Vue</div><div class="et en"><i>3</i>Entretien</div><div class="et"><i>4</i>Décision</div></div>'''),
])

# ---------- 7. Boutons ----------
BTS = ''.join([
    pl('Les boutons', f'''<div class="bts"><a class="bt p pl">Continuer</a></div><div class="bts"><a class="bt a pl">{ic("envoyer","s")}Postuler</a></div>
<div class="bts"><a class="bt sec">Plus tard</a><a class="bt txt">Voir tout{ic("suivant","xs")}</a></div>
<div class="bts"><a class="bt d m">Ne pas retenir</a><a class="bt off m">Indisponible</a></div>''', note='Principal Sapin ; Accent Lime pour un moment fort ; Secondaire ; Texte ; Danger ; Désactivé.'),
    pl('Tailles et boutons icônes', f'''<div class="bts"><a class="bt p">52 px</a><a class="bt p m">44 px</a><a class="bt p s">36 px</a></div>
<div class="bts">{bi("favori")}{bi("partager")}{bi("plus-options")}{bi("retour","","nu")}</div>
<div class="limite">{ic("cadenas","s")}<span>3 analyses Orbi sur 3 ce mois-ci</span><a>Voir les formules</a></div>''', note='Limite de forfait : une ligne, au moment où on l’atteint. Jamais d’écran flouté.'),
])

# ---------- 8. Cartes ----------
CARTES = ''.join([
    pl('Prochaine étape (Accueil)', f'''<div class="carte etape"><span class="k"><i></i>Prochaine étape</span><div class="corps"><div style="flex:1"><h3>Ajoutez 2 compétences à votre profil</h3><p>Vos offres seront plus justes.</p></div><span class="anneau"><b>70 %</b></span></div><a class="bt p m">Compléter · 2 min</a></div>''', note='Une seule à la fois, calculée.'),
    pl('Les trois piliers', f'''<div class="piliers">
<div class="pi"><span class="cases t-l">{ic("former","s")}</span><b>Se former</b><span>2 modules sur 5</span><span class="j"><i style="width:40%"></i></span></div>
<div class="pi"><span class="cases t-m">{ic("carriere","s")}</span><b>Accompagné</b><span>Profil à 70 %</span><span class="j"><i style="width:70%"></i></span></div>
<div class="pi"><span class="cases t-a">{ic("opportunites","s")}</span><b>Opportunités</b><span>3 candidatures</span><span class="j"><i style="width:55%"></i></span></div></div>'''),
    pl('Offre', offre('BF','sap','Analyste de données junior','Baobab Fintech','Kinshasa',['CDI','Hybride'],86) + offre('FB','mer','Chargée d’études marketing','Fleuve Banque','Kinshasa',['CDD'],72,True), note='Score expliqué au toucher (Pourquoi ?). Postuler est dans la fiche.'),
    pl('Formation et candidature', f'''<div class="carte form"><span class="vign t-l">{ic("lecon","l")}</span><div class="t"><b>Réussir son entretien</b><span>Module 2 sur 5 · 8 min</span><span class="barre"><i style="width:40%"></i></span></div><a class="bt p s">Reprendre</a></div>
<div class="carte cand"><div class="haut"><span class="lg-e sap">BF</span><div class="t"><b>Analyste de données junior</b><span>Baobab Fintech</span></div><span class="statut-p st-ok">Entretien</span></div>
<div class="etapes"><div class="et ok"><i>{ic("valider","xs")}</i>Envoyée</div><div class="et ok"><i>{ic("valider","xs")}</i>Vue</div><div class="et en"><i>3</i>Entretien</div><div class="et"><i>4</i>Décision</div></div></div>'''),
    pl('Personne', f'''<div class="carte pers"><span class="av m">AK</span><div class="t"><b>Amani Kasongo</b><span>Développeuse · même formation</span></div><a class="bt sec s">{ic("connexion","xs")}Se connecter</a></div>
<div class="carte pers"><span class="av c">FN</span><div class="t"><b>Fatou Ndiaye</b><span>Recruteuse · Kasaï Conseil</span></div><a class="bt sec s">{ic("message","xs")}Écrire</a></div>'''),
])

# ---------- 9. Orbi ----------
ORBI = ''.join([
    pl('La marque et ses états', f'''<div class="or-etats"><figure>{orbi(64)}<b>Repos</b>Point fixe</figure><figure>{orbi(64,"ecoute")}<b>Écoute</b>L’orbite respire</figure><figure>{orbi(64,"reflechit")}<b>Réfléchit</b>Le point tourne</figure></div>''',
       note='Disque Sapin, orbite, point Lime du logo. Aucun dégradé. Animations coupées si « réduire les animations ».'),
    pl('Une réponse d’Orbi', f'''<div class="bulle-u">Mon CV est-il prêt pour l’offre Baobab ?</div>
<div class="bulle-o">{orbi(32)}<div class="corps"><span>Presque. Il manque deux points demandés dans l’offre :</span><ul><li>SQL avancé (jointures)</li><li>Une réalisation chiffrée</li></ul>
<span class="source">D’après l’offre et votre CV du 12 octobre.</span><div class="acts"><a class="bt p s">Corriger mon CV</a><a class="bt sec s">Modifier</a><a class="pq">{ic("pourquoi")}Pourquoi ?</a></div></div></div>''',
       note='Bulle blanche, filet Lime, sources citées ; Orbi propose, la personne décide.'),
    pl('Dans une page', f'''<div class="carte sugg">{orbi(36)}<div class="t"><small>Orbi suggère</small><b>3 offres demandent Power BI. Le module de 20 min vous ajoute ce badge.</b><div class="acts" style="display:flex;gap:10px;align-items:center"><a class="bt sec s">Voir le module</a><a class="pq">{ic("pourquoi")}Pourquoi ?</a></div></div>{ic("fermer","s")}</div>
<div class="pense">{orbi(28,"reflechit")}Orbi lit l’offre…</div>
<div class="compo"><span>Écrire à Orbi</span><a class="bi">{ic("micro","s")}</a><a class="bi env">{ic("envoyer","s")}</a></div>''',
       note='Une carte Orbi au plus par écran, refusable.'),
])

# ---------- 10. États ----------
ETATS = ''.join([
    pl('Chargement', '<div class="sq"><i style="width:46px;height:46px;border-radius:14px"></i><div style="flex:1;display:flex;flex-direction:column;gap:8px"><i style="height:14px;width:80%"></i><i style="height:11px;width:50%"></i><i style="height:22px;width:60%"></i></div></div>' * 2),
    pl('Vide et erreur', f'''<div class="vide"><span class="rond">{ic("candidature","l")}</span><b>Aucune candidature</b><p>Les offres pour vous vous attendent.</p><a class="bt p m">Voir les offres</a></div>
<div class="vide err"><span class="rond">{ic("hors-ligne","l")}</span><b>Pas de connexion</b><p>Vos réponses sont gardées et partiront au retour du réseau.</p><a class="bt sec m">Réessayer</a></div>'''),
    pl('Bandeaux', f'''<div class="hl">{ic("hors-ligne","s")}Hors ligne · lecture des pages enregistrées</div>
<div class="toast"><span class="ok">{ic("valider","xs")}</span>Candidature envoyée<a>Suivre</a></div>'''),
])

# ---------- 11. Aperçu ----------
A1 = phone(f'''{tete("Bonjour, Grâce")}
<div class="rech">{ic("recherche","s")}<span>Rechercher une offre, une formation</span><a class="f">{ic("filtres","s")}</a></div>
<div class="carte etape"><span class="k"><i></i>Prochaine étape</span><div class="corps"><div style="flex:1"><h3>Ajoutez 2 compétences à votre profil</h3><p>Vos offres seront plus justes.</p></div><span class="anneau"><b>70 %</b></span></div><a class="bt p m">Compléter · 2 min</a></div>
<div class="piliers">
<div class="pi"><span class="cases t-l">{ic("former","s")}</span><b>Se former</b><span>2 sur 5</span><span class="j"><i style="width:40%"></i></span></div>
<div class="pi"><span class="cases t-m">{ic("carriere","s")}</span><b>Carrière</b><span>Profil 70 %</span><span class="j"><i style="width:70%"></i></span></div>
<div class="pi"><span class="cases t-a">{ic("opportunites","s")}</span><b>Offres</b><span>3 envoyées</span><span class="j"><i style="width:55%"></i></span></div></div>
<div class="sec-t"><h2>Pour vous</h2><a>Tout voir</a></div>
{offre('BF','sap','Analyste de données junior','Baobab Fintech','Kinshasa',['CDI','Hybride'],86)}''', 'accueil')

A2 = phone(f'''{tete("Opportunités")}
<div class="rech">{ic("recherche","s")}<span style="color:var(--sapin)">Analyste</span><a class="f">{ic("filtres","s")}<b>2</b></a></div>
<div class="puces"><span class="puce on">Kinshasa{ic("fermer","xs")}</span><span class="puce on">CDI{ic("fermer","xs")}</span></div>
<div class="seg"><span class="on">Pour vous</span><span>Enregistrées</span><span>Candidatures<small>3</small></span></div>
{offre('BF','sap','Analyste de données junior','Baobab Fintech','Kinshasa',['CDI','Hybride'],86)}
{offre('ME','amb','Analyste énergie solaire','Mwinda Énergie','Kinshasa',['CDI'],79,True)}
{offre('FB','mer','Chargée d’études marketing','Fleuve Banque','Kinshasa',['CDI'],72)}''', 'opportunites')

A3 = phone(f'''<div class="tete"><div class="or-tete" style="flex:1">{orbi(44)}<div class="t"><b>Orbi</b><span>Votre accompagnement</span></div></div><span class="credits">18 crédits</span></div>
<div class="aides">
<div class="ai"><span class="cases t-l">{ic("cv","s")}</span><b>Améliorer mon CV</b></div>
<div class="ai"><span class="cases t-m">{ic("entretien","s")}</span><b>Préparer un entretien</b></div>
<div class="ai"><span class="cases t-a">{ic("opportunites","s")}</span><b>Analyser une offre</b></div>
<div class="ai"><span class="cases t-c">{ic("cap","s")}</span><b>Choisir ma voie</b></div></div>
<div class="bulle-u">Mon CV est-il prêt pour l’offre Baobab ?</div>
<div class="bulle-o">{orbi(32)}<div class="corps"><span>Presque. Il manque deux points demandés :</span><ul><li>SQL avancé</li><li>Une réalisation chiffrée</li></ul><div class="acts"><a class="bt p s">Corriger mon CV</a><a class="pq">{ic("pourquoi")}Pourquoi ?</a></div></div></div>''',
    'orbi', bas=f'<div style="position:absolute;left:16px;right:16px;bottom:100px;z-index:4"><div class="compo"><span>Écrire à Orbi</span><a class="bi">{ic("micro","s")}</a><a class="bi env">{ic("envoyer","s")}</a></div></div>')

APERCU = ''.join(f'<figure style="margin:0">{p}<figcaption style="margin:14px 10px 0;font-size:13px"><b>{t}</b><br><span style="color:var(--ardoise)">{n}</span></figcaption></figure>' for p, t, n in [
    (A1, 'Accueil', 'Une prochaine étape, les trois piliers, une offre.'),
    (A2, 'Opportunités', 'Chercher, filtrer, trier ; Postuler est dans la fiche.'),
    (A3, 'Orbi', 'Quatre aides, la conversation, sources et Pourquoi ?.')])

SECTIONS = [
 ('s1','1 · Icônes','51 icônes dessinées pour Jumanly : trait 1,8 px, bouts arrondis. À gauche l’état normal, à droite l’état actif avec le point Lime du logo.', [pl('Toutes les icônes', ICONES, 'l'), pl('Tailles et usages', TAILLES)]),
 ('s2','2 · Couleurs et règles','Aplats seulement. Les dégradés verts sont retirés partout.', [pl('Palette', PAL, 'l'), pl('Règles', REGLES, 'l')]),
 ('s3','3 · Barres du bas','Quatre onglets et Orbi au centre. Même gabarit pour le talent et le recruteur.', NAVS.split('\x00')),
 ('s4','4 · En-têtes','Pas de logo ni de menu latéral. Avatar = Compte.', [TETES]),
 ('s5','5 · Recherche','Seulement là où l’on cherche : Accueil, Se former, Opportunités.', [RECH]),
 ('s6','6 · Options','Toutes les formes d’options de l’application.', [OPTS]),
 ('s7','7 · Boutons','Un seul bouton plein par écran.', [BTS]),
 ('s8','8 · Cartes','Un titre, une ligne, une action.', [CARTES]),
 ('s9','9 · Orbi','Nouvelle visualisation, sans dégradé.', [ORBI]),
 ('s10','10 · États','Réseau lent et hors ligne compris.', [ETATS]),
 ('s11','11 · Aperçu talent','Les fondations appliquées à trois écrans. Les autres viendront à l’étape 2.', [APERCU]),
]
som = ''.join(f'<li><a href="#{i}">{t.split(" · ")[1]}</a></li>' for i, t, _, _ in SECTIONS)
corps = ''.join(bloc(i, t, n, *p) for i, t, n, p in SECTIONS)
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Refonte mobile · fondations</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>{open(H + '/fondations.css').read()}</style></head><body>
<header class="couv"><span class="k">{orbi(22)}Jumanly · refonte mobile · étape 1</span><h1>Les fondations</h1>
<p>Icônes, barres, en-têtes, recherche, options, boutons, cartes, Orbi et états, avant de refaire les écrans. Version 1 du 17 octobre 2026. Contenus fictifs.</p>
<ul class="som">{som}</ul></header>{corps}<p class="fin">Jumanly · Learn. Grow. Connect.</p></body></html>'''
out = os.path.join(H, '..', 'refonte-mobile-fondations.html')
open(out, 'w').write(html); print(out, len(html))
