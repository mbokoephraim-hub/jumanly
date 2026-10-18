# Refonte mobile · planche des fondations v2 (18/10/2026). python3 build.py && node shot.js
import os
H = os.path.dirname(os.path.abspath(__file__))
exec(open(H + '/icones.py').read())

def bi(nom, extra='', cls=''):
    return f'<a class="bi {cls}" aria-label="{D[nom][0]}">{ic(nom, "s")}{extra}</a>'

def nav(actif='accueil', role='talent'):
    items = [('accueil','Accueil'),('former','Se former'),None,('opportunites','Opportunités'),('carriere','Carrière')] if role == 'talent' else \
            [('aujourdhui','Aujourd’hui'),('offre','Offres'),None,('candidats','Candidats'),('agenda','Agenda')]
    h = ''
    for it in items:
        if it is None:
            h += f'<a class="centre{" on" if actif == "orbi" else ""}"><span class="rond">{orbi(52, "reflechit" if actif == "orbi" else "repos")}</span><span>Orbi</span></a>'
        else:
            k, l = it
            b = '<b>4</b>' if (role != 'talent' and k == 'candidats') else ''
            h += f'<a class="{"on" if k == actif else ""}"><span class="badge">{ic(k, "", k == actif)}{b}</span>{l}</a>'
    return f'<div class="nav-z"><nav class="nav">{h}</nav><span class="home"></span></div>'

def tete(titre):
    return (f'<div class="tete"><h1>{titre}</h1>{bi("notification", "<span class=pastille></span>")}'
            f'{bi("message", "<span class=cpt>2</span>")}<span class="av">GM</span></div>')

def phone(contenu, actif='accueil', cls='', avec_nav=True, bas=''):
    return (f'<div class="phone {cls}"><div class="statut"><span>9:41</span><span><i></i><i></i><i></i></span></div>'
            f'<div class="contenu">{contenu}</div>{bas}{nav(actif) if avec_nav else ""}</div>')

def pl(lab, html, cls='', note=''):
    n = f'<p class="note">{note}</p>' if note else ''
    return f'<div class="pl {cls}"><span class="lab">{lab}</span>{html}{n}</div>'

def bloc(id_, titre, intro, *pls):
    return f'<section class="bloc" id="{id_}"><header><h2>{titre}</h2><p>{intro}</p></header><div class="grille">{"".join(pls)}</div></section>'

def ecrans(*items):
    return '<div class="ecrans">' + ''.join(f'<figure>{p}<figcaption><b>{t}</b><br><span>{n}</span></figcaption></figure>' for p, t, n in items) + '</div>'

# ---------- Bannières (illustrations fictives) ----------
def svg(contenu, vb='0 0 300 90'):
    return f'<svg viewBox="{vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">{contenu}</svg>'
BAN = {
 'baobab': svg('<rect width="300" height="90" fill="#0F3F37"/><g fill="none" stroke="#A6F26B" stroke-opacity=".35"><circle cx="250" cy="10" r="28"/><circle cx="250" cy="10" r="52"/><circle cx="250" cy="10" r="78"/></g><circle cx="250" cy="10" r="10" fill="#A6F26B"/>'),
 'mwinda': svg('<rect width="300" height="90" fill="#FFE1A1"/><rect y="55" width="300" height="35" fill="#F8C35A"/><circle cx="235" cy="58" r="34" fill="#FFF4D6"/>'),
 'fleuve': svg('<rect width="300" height="90" fill="#CFE4F7"/><g fill="none" stroke="#1E4E79" stroke-opacity=".4" stroke-width="3"><path d="M0 50 Q75 25 150 50 T300 50"/><path d="M0 68 Q75 43 150 68 T300 68"/><path d="M0 32 Q75 7 150 32 T300 32"/></g>'),
 'kivu': svg('<rect width="300" height="90" fill="#C9F1E3"/><path d="M0 90 L70 30 L120 66 L190 18 L300 82 V90Z" fill="#2FD3A6" opacity=".55"/><path d="M0 90 L110 52 L170 78 L300 60 V90Z" fill="#14745F" opacity=".6"/>'),
 'oppo': svg('<rect width="300" height="90" fill="#F8CF73"/><circle cx="260" cy="90" r="70" fill="#FFE7B0"/><g fill="none" stroke="#0F3F37" stroke-opacity=".18" stroke-width="2"><circle cx="40" cy="20" r="30"/><circle cx="40" cy="20" r="50"/></g>'),
}
FORM = {
 'cv': svg('<rect width="300" height="130" fill="#D9F7B6"/><circle cx="250" cy="20" r="60" fill="#C3F38E"/><g transform="translate(108 18) rotate(-6)"><rect width="84" height="104" rx="8" fill="#fff"/><circle cx="20" cy="22" r="10" fill="#A6F26B"/><rect x="36" y="16" width="38" height="6" rx="3" fill="#0F3F37"/><rect x="36" y="26" width="26" height="4" rx="2" fill="#9AA9A5"/><g fill="#DCE5E1"><rect x="12" y="44" width="60" height="5" rx="2"/><rect x="12" y="54" width="48" height="5" rx="2"/><rect x="12" y="68" width="60" height="5" rx="2"/><rect x="12" y="78" width="40" height="5" rx="2"/></g></g>', '0 0 300 130'),
 'entretien': svg('<rect width="300" height="130" fill="#C9F1E3"/><circle cx="40" cy="120" r="70" fill="#93E8CD"/><rect x="70" y="26" width="120" height="44" rx="22" fill="#fff"/><rect x="88" y="42" width="70" height="6" rx="3" fill="#0F3F37"/><rect x="88" y="52" width="46" height="5" rx="2" fill="#9AA9A5"/><rect x="130" y="78" width="110" height="38" rx="19" fill="#0F3F37"/><rect x="148" y="92" width="64" height="6" rx="3" fill="#A6F26B"/>', '0 0 300 130'),
 'numerique': svg('<rect width="300" height="130" fill="#FFEBC2"/><circle cx="260" cy="10" r="70" fill="#F8CF73"/><rect x="60" y="22" width="180" height="92" rx="12" fill="#fff"/><g fill="#3DA14F"><rect x="82" y="70" width="18" height="30" rx="3"/><rect x="108" y="56" width="18" height="44" rx="3"/><rect x="134" y="64" width="18" height="36" rx="3"/></g><rect x="160" y="44" width="18" height="56" rx="3" fill="#A6F26B"/><path d="M190 90 L205 70 L218 78 L228 52" fill="none" stroke="#0F3F37" stroke-width="4" stroke-linecap="round"/>', '0 0 300 130'),
 'savoir': svg('<rect width="300" height="130" fill="#DCE9FA"/><circle cx="60" cy="10" r="60" fill="#AFCDF0"/><g fill="#fff"><circle cx="110" cy="70" r="26"/><circle cx="190" cy="70" r="26"/></g><circle cx="110" cy="64" r="9" fill="#6B4A3A"/><path d="M94 88 Q110 72 126 88" fill="#2B5B52"/><circle cx="190" cy="64" r="9" fill="#3B2A22"/><path d="M174 88 Q190 72 206 88" fill="#5B4A7A"/><path d="M138 70 H162" stroke="#0F3F37" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 8"/>', '0 0 300 130'),
}
REAL = {
 'tb': svg('<rect width="120" height="100" fill="#0F3F37"/><g fill="#A6F26B"><rect x="22" y="56" width="12" height="26" rx="2"/><rect x="40" y="40" width="12" height="42" rx="2"/><rect x="58" y="48" width="12" height="34" rx="2"/></g><rect x="76" y="28" width="12" height="54" rx="2" fill="#2FD3A6"/>', '0 0 120 100'),
 'poste': svg('<rect width="120" height="100" fill="#FFE1A1"/><circle cx="60" cy="44" r="22" fill="#0F3F37"/><text x="60" y="51" text-anchor="middle" font-family="Sora" font-weight="700" font-size="17" fill="#A6F26B">BF</text>', '0 0 120 100'),
 'pdf': svg('<rect width="120" height="100" fill="#C9F1E3"/><rect x="36" y="14" width="48" height="64" rx="5" fill="#fff"/><rect x="44" y="24" width="32" height="5" rx="2" fill="#0F3F37"/><g fill="#DCE5E1"><rect x="44" y="34" width="32" height="4" rx="2"/><rect x="44" y="42" width="24" height="4" rx="2"/></g>', '0 0 120 100'),
}
PF_COV = svg('<g fill="none" stroke="#0F3F37" stroke-opacity=".14" stroke-width="1.5"><circle cx="320" cy="20" r="40"/><circle cx="320" cy="20" r="80"/><circle cx="320" cy="20" r="120"/></g><circle cx="320" cy="20" r="12" fill="#fff" opacity=".7"/>', '0 0 390 150')

def offre(ban, lg, cls, titre, ent, lieu, tags, score, fav=False):
    t = ''.join(f'<span class="tag">{x}</span>' for x in tags)
    return (f'<div class="verre of"><div class="ban">{BAN[ban]}<a class="fav">{ic("favori","s",fav)}</a></div>'
            f'<div class="corps"><span class="lg-e {cls}">{lg}</span><div class="t"><b>{titre}</b><span>{ent} · {lieu}</span>'
            f'<div class="bas">{t}<span class="score">{score} %{ic("pourquoi","xs")}</span></div></div></div></div>')

def formation(ban, tg, titre, meta, dur, cls='', barre=None):
    b = f'<span class="barre"><i style="width:{barre}%"></i></span>' if barre is not None else ''
    return (f'<div class="verre fo {cls}"><div class="ban">{FORM[ban]}<span class="tg">{tg}</span><span class="dur">{dur}</span></div>'
            f'<div class="t"><b>{titre}</b><span>{meta}</span>{b}</div></div>')

def piliers(court=False):
    return f'''<div class="piliers">
<div class="pi p1"><span class="cases">{ic("former","s")}</span><b>Se former</b><span>2 sur 5 modules</span><span class="j"><i style="width:40%"></i></span></div>
<div class="pi p2"><span class="cases">{ic("carriere","s")}</span><b>Carrière</b><span>Profil à 70 %</span><span class="j"><i style="width:70%"></i></span></div>
<div class="pi p3"><span class="cases">{ic("opportunites","s")}</span><b>Opportunités</b><span>3 candidatures</span><span class="j"><i style="width:55%"></i></span></div></div>'''

def groupe3():
    def ln(lg, cls, t, e, s):
        return f'<div class="ln"><span class="lg-e {cls}">{lg}</span><div class="t"><b>{t}</b><span>{e}</span></div><span class="score">{s} %</span></div>'
    return (f'<div class="verre grp"><div class="ban-g">{BAN["oppo"]}<b style="color:#0F3F37">3 opportunités pour vous</b><small>Tout voir</small></div>'
            + ln('BF','sap','Analyste de données junior','Baobab Fintech · Kinshasa',86)
            + ln('ME','amb','Analyste énergie solaire','Mwinda Énergie · Kinshasa',79)
            + ln('FB','mer','Chargée d’études marketing','Fleuve Banque · Kinshasa',72) + '</div>')

# ---------- 1. Identité des surfaces ----------
SURF = ''.join([
    pl('La barre, modèle de tout le reste', f'''<div class="nav-fond">{nav("accueil")}</div>
<div class="anat"><div><b>Pilule</b>Rayon 40 px, flottante à 12 px des bords.</div><div><b>Verre</b>Blanc à 80 %, flou, filet lumineux en haut.</div>
<div><b>Ombre</b>Large et douce, jamais un trait noir.</div><div><b>Rond central</b>Orbi déborde, entouré d’un halo vert clair.</div></div>''', 'l',
       'Repris de votre image de référence pour la forme et la matière, pas pour les icônes.'),
    pl('Même matière : bandeau', f'''<div class="verre fort bandeau"><span class="ic-r">{ic("valider","s")}</span><div class="t"><b>Candidature envoyée à Baobab Fintech</b><span>11:12 · Suivez-la dans Opportunités</span></div></div>'''),
    pl('Même matière : carrés et options', f'''<div class="aides"><div class="ai p1"><span class="cases">{ic("cv","s")}</span><b>Améliorer mon CV</b></div><div class="ai p2"><span class="cases">{ic("entretien","s")}</span><b>Préparer un entretien</b></div></div>
<div class="verre liste"><div class="li"><span class="cases c1">{ic("former","s")}</span><div class="t"><b>Mes certificats</b></div>{ic("suivant")}</div><div class="li"><span class="cases c3">{ic("portefeuille","s")}</span><div class="t"><b>Paiement</b><span>Mobile Money</span></div>{ic("suivant")}</div></div>'''),
    pl('Même matière : recherche et puces', f'''<div class="verre rech">{ic("recherche","s")}<span>Rechercher une offre, une formation</span><a class="f">{ic("filtres","s")}</a></div>
<div class="puces"><span class="puce on">{ic("valider","xs")}Kinshasa</span><span class="puce">CDI</span><span class="puce">Stage</span></div>'''),
])

# ---------- 2. Icônes ----------
ICONES = ''
for g, noms in GROUPES:
    ICONES += f'<p class="ic-tg">{g}</p><div class="ic-g">' + ''.join(
        f'<div class="ic-t{" neuf" if n == "carriere" else ""}"><span class="duo">{ic(n)}{ic(n, "", True)}</span><span>{D[n][0]}</span></div>' for n in noms) + '</div>'
CARR = f'<div class="zoom-ic"><span class="z n">{ic("carriere")}</span><span class="z">{ic("carriere","",True)}</span></div>'

# ---------- 3. Couleurs et dégradés ----------
PAL = '<div class="pal">' + ''.join(f'<div><i style="background:{c}"></i><b>{n}</b><span>{u}</span></div>' for c, n, u in [
    ('#EEE8DE','Crème','Fond clair'), ('#0B1A1F','Nuit','Fond sombre'), ('#0F3F37','Sapin','Texte, bouton principal'),
    ('#A6F26B','Lime','Actif, réussite, Orbi'),
    ('linear-gradient(135deg,#D4FA9E,#A6F26B 48%,#5FE0B8)','Dégradé accent','Postuler, Orbi, interrupteur, puce active'),
    ('linear-gradient(150deg,#ECFCD8,#C3F38E)','Se former','Pilier 1'), ('linear-gradient(150deg,#E2F8F0,#93E8CD)','Carrière','Pilier 2'),
    ('linear-gradient(150deg,#FFF3D6,#F8CF73)','Opportunités','Pilier 3'), ('linear-gradient(135deg,#D4FA9E,#9BE9CF 55%,#CDE7F7)','Profil','Couverture du profil'),
    ('#E25C4B','Corail','Notification urgente, erreur')]) + '</div>'
REGLES = '<div class="regles">' + ''.join(f'<div><b>{t}</b>{c}</div>' for t, c in [
    ('Dégradés clairs seulement', 'Du Lime vers le Menthe, de l’Ambre clair vers l’Ambre. Jamais de dégradé vert sombre.'),
    ('Un pilier, une couleur', 'Se former en Lime, Carrière en Menthe, Opportunités en Ambre, partout dans l’application.'),
    ('Moins de blanc', 'Fond Crème légèrement teinté en haut, cartes en verre, bannières colorées sur les offres et les formations.'),
    ('Sombre = Nuit', 'Fond Nuit, cartes en verre sombre, bouton principal Lime avec texte Sapin.')]) + '</div>'

# ---------- 4. Barres du bas ----------
NAVS = ''.join([
    pl('Talent · clair', f'<div class="nav-fond">{nav("opportunites")}</div>'),
    pl('Talent · sombre', f'<div class="nav-fond sombre">{nav("accueil")}</div>', 'sombre'),
    pl('Recruteur · clair', f'<div class="nav-fond">{nav("candidats","rh")}</div>', note='Même barre ; badge Corail : candidatures à traiter.'),
    pl('Orbi ouvert', f'<div class="nav-fond">{nav("orbi")}</div>', note='Le point tourne pendant qu’Orbi réfléchit.'),
])

# ---------- 5. En-têtes et recherche ----------
TETES = ''.join([
    pl('Page principale', tete("Opportunités"), note='Titre en grand ; notifications, messages, avatar (Compte).'),
    pl('Page secondaire', f'<div class="tete sec">{bi("retour")}<h1>Analyste de données junior</h1>{bi("partager")}</div>'),
    pl('Recruteur', f'{tete("Aujourd’hui")}<span class="verre org"><span class="lg">BF</span>Baobab Fintech{ic("suivant","xs")}</span>'),
    pl('Recherche : saisie', f'''<div class="verre rech focus">{ic("recherche","s")}<span>analyste<span class="cur"></span></span><a class="x">{ic("fermer","xs")}</a></div>
<div class="verre panneau"><h4>Récentes</h4><div class="p-l">{ic("horloge","s")}Analyste de données Kinshasa</div>
<h4>Suggestions</h4><div class="p-l">{ic("opportunites","s")}<span><b>analyste</b> de données</span><small>24 offres</small></div><div class="p-l">{ic("former","s")}<span><b>Analyste</b> : les bases SQL</span><small>Formation</small></div>
<div class="p-l orbi-l">{orbi(28)}<span><b>Demander à Orbi</b> des métiers proches</span></div></div>'''),
    pl('Recherche : filtres', f'''<div class="verre feuille"><div class="poignee"></div><h3>Filtres</h3>
<div class="champ"><label>Lieu</label><div class="puces"><span class="puce on">Kinshasa</span><span class="puce">Lubumbashi</span><span class="puce">{ic("plus","xs")}Ajouter</span></div></div>
<div class="champ"><label>Contrat</label><div class="puces"><span class="puce on">CDI</span><span class="puce">CDD</span><span class="puce">Stage</span></div></div>
<div class="li" style="border:0;padding:0"><div class="t"><b>Télétravail possible</b></div><span class="sw on"></span></div>
<div class="f-act"><a class="bt sec m">Effacer</a><a class="bt p m pl">Voir 24 offres</a></div></div>'''),
])

# ---------- 6. Options ----------
OPTS = ''.join([
    pl('Liste d’options', f'''<div class="verre liste">
<div class="li"><span class="cases c3">{ic("portefeuille","s")}</span><div class="t"><b>Formule et paiement</b><span>Starter · Mobile Money</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c2">{ic("confidentialite","s")}</span><div class="t"><b>Confidentialité</b></div><span class="v">Recruteurs</span>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("notification","s")}</span><div class="t"><b>Alertes d’offres</b></div><span class="sw on"></span></div>
<div class="li danger"><span class="cases">{ic("deconnexion","s")}</span><div class="t"><b>Se déconnecter</b></div></div></div>'''),
    pl('Choix unique', f'''<div class="choix"><div class="verre ch on"><span class="radio"></span><div class="t"><b>Trouver un emploi</b><span>Offres et entretiens d’abord</span></div></div>
<div class="verre ch"><span class="radio"></span><div class="t"><b>Me former</b><span>Parcours d’employabilité d’abord</span></div></div>
<div class="verre ch"><span class="radio"></span><div class="t"><b>Changer de voie</b><span>Orbi m’aide à choisir</span></div></div></div>'''),
    pl('Choix multiples et segments', f'''<div class="puces"><span class="puce on">{ic("valider","xs")}Power BI</span><span class="puce on">{ic("valider","xs")}SQL</span><span class="puce">Excel</span><span class="puce">{ic("plus","xs")}Autre</span></div>
<div class="seg"><span class="on">Pour vous</span><span>Enregistrées</span><span>Candidatures<small>3</small></span></div>
<div class="champ"><label>E-mail</label><div class="verre saisie err">grace.mbuyi@</div><span class="aide err">Il manque la fin de l’adresse.</span></div>'''),
    pl('Feuille d’actions et menu', f'''<div class="verre fort feuille"><div class="poignee"></div><h3>Mettre à jour mon profil</h3>
<div class="li"><span class="cases c2">{ic("cv","s")}</span><div class="t"><b>Importer un CV</b><span>PDF ou photo</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c3">{ic("realisation","s")}</span><div class="t"><b>Ajouter une réalisation</b></div>{ic("suivant")}</div></div>
<div class="verre fort menu-c"><a>{ic("partager","s")}Partager</a><a class="on">{ic("favori","s")}Enregistrer</a><a class="danger">{ic("fermer","s")}Ne plus voir</a></div>
<div class="etapes"><div class="et ok"><i>{ic("valider","xs")}</i>Envoyée</div><div class="et ok"><i>{ic("valider","xs")}</i>Vue</div><div class="et en"><i>3</i>Entretien</div><div class="et"><i>4</i>Décision</div></div>'''),
])

# ---------- 7. Boutons ----------
BTS = ''.join([
    pl('Les boutons', f'''<div class="bts"><a class="bt a pl">{ic("envoyer","s")}Postuler</a></div><div class="bts"><a class="bt p pl">Continuer</a></div>
<div class="bts"><a class="bt sec">{ic("favori","s")}Enregistrer</a><a class="bt txt">Voir tout{ic("suivant","xs")}</a></div>
<div class="bts"><a class="bt d m">Ne pas retenir</a><a class="bt off m">Indisponible</a></div>''',
       note='Icône et texte sur la même ligne. Accent en dégradé clair pour un moment fort (Postuler, Publier) ; principal plein.'),
    pl('En mode sombre', f'''<div class="bts"><a class="bt a pl">{ic("envoyer","s")}Postuler</a></div><div class="bts"><a class="bt p pl">Continuer</a></div>
<div class="bts"><a class="bt sec">{ic("favori","s")}Enregistrer</a>{bi("partager")}{bi("plus-options")}</div>
<div class="verre limite">{ic("cadenas","s")}<span>3 analyses Orbi sur 3</span><a>Formules</a></div>''', 'sombre'),
])

# ---------- 8. Cartes ----------
CARTES = ''.join([
    pl('Les trois piliers', piliers() + f'<div class="verre carte etape"><span class="k"><i></i>Prochaine étape</span><div class="corps"><div style="flex:1"><h3>Ajoutez 2 compétences à votre profil</h3><p>Vos offres seront plus justes.</p></div><span class="anneau"><b>70 %</b></span></div><a class="bt p m">Compléter · 2 min</a></div>',
       note='Chaque pilier a sa couleur, reprise dans ses écrans.'),
    pl('Offre avec bannière', offre('baobab','BF','sap','Analyste de données junior','Baobab Fintech','Kinshasa',['CDI','Hybride'],86) + offre('mwinda','ME','amb','Analyste énergie solaire','Mwinda Énergie','Kinshasa',['CDI'],79,True),
       note='Bannière de l’entreprise, logo rond qui la chevauche. Trois offres tiennent dans un écran.'),
    pl('Formation avec bannière', formation('cv','Employabilité','Écrire un CV qui décroche un entretien','Module 2 sur 5','8 min', barre=40)),
    pl('Groupe de trois (Accueil)', groupe3()),
])

# ---------- 9. Orbi ----------
ORBI = ''.join([
    pl('La marque et ses états', f'''<div class="or-etats"><figure><span class="rond">{orbi(64)}</span><b>Repos</b>Point fixe</figure><figure><span class="rond">{orbi(64,"ecoute")}</span><b>Écoute</b>L’orbite respire</figure><figure><span class="rond">{orbi(64,"reflechit")}</span><b>Réfléchit</b>Le point tourne</figure></div>''',
       note='Disque Sapin, orbite, point Lime ; halo vert clair au lieu d’un dégradé sombre.'),
    pl('Une réponse', f'''<div class="bulle-u">Mon CV est-il prêt pour l’offre Baobab ?</div>
<div class="bulle-o">{orbi(32)}<div class="verre corps"><span>Presque. Il manque deux points demandés :</span><ul><li>SQL avancé (jointures)</li><li>Une réalisation chiffrée</li></ul>
<span class="source">D’après l’offre et votre CV du 12 octobre.</span><div class="acts"><a class="bt p s">Corriger mon CV</a><a class="pq">{ic("pourquoi")}Pourquoi ?</a></div></div></div>'''),
    pl('Dans une page', f'''<div class="verre carte sugg">{orbi(36)}<div class="t"><small>Orbi suggère</small><b>3 offres demandent Power BI. Un module de 20 min vous prépare.</b><div style="display:flex;gap:10px;align-items:center"><a class="bt sec s">Voir le module</a><a class="pq">{ic("pourquoi")}Pourquoi ?</a></div></div>{ic("fermer","s")}</div>
<div class="verre compo"><span>Écrire à Orbi</span><a class="bi">{ic("micro","s")}</a><a class="bi env">{ic("envoyer","s")}</a></div>'''),
])

# ---------- 10. Profil ----------
def reals():
    return (f'<div class="reals"><span class="re">{REAL["tb"]}<b>Tableau de bord des agences</b></span>'
            f'<span class="re">{REAL["poste"]}<b>Analyste chez Baobab</b></span><span class="re">{REAL["pdf"]}<b>Rapport épargne mobile</b></span></div>')
P_MOI = phone(f'''<div class="pf-cov">{PF_COV}</div><div class="pf-top"><span></span><span style="display:flex;gap:8px">{bi("partager")}{bi("reglages")}</span></div>
<div class="pf-id"><span class="av">GM</span><h2>Grâce Mbuyi</h2><p>Analyste de données · Kinshasa</p><span class="cap"><i></i>Vise : Analyste data confirmée</span></div>
<div class="pf-act"><a class="bt p m">{ic("modifier","s")}Modifier</a><a class="bt sec m">{ic("profil","s")}Aperçu public</a></div>
<div class="verre compl"><span class="anneau" style="width:46px;height:46px"><b style="width:36px;height:36px;font-size:11px">70 %</b></span><div class="t"><b>Profil à 70 %</b><span>Ajoutez 2 compétences pour atteindre 85 %</span></div>{ic("suivant","s")}</div>
<div class="seg"><span class="on">Réalisations</span><span>Parcours</span><span>Compétences</span></div>
{reals()}''', 'carriere')
P_AUTRE = phone(f'''<div class="pf-cov">{PF_COV}</div><div class="pf-top">{bi("retour")}{bi("plus-options")}</div>
<div class="pf-id"><span class="av m">DI</span><h2>Daniel Ilunga</h2><p>Chef de projet data · Mwinda Énergie</p></div>
<div class="pf-act"><a class="bt a m pl">{ic("connexion","s")}Se connecter</a><a class="bt sec m">{ic("cadenas","s")}Message</a></div>
<div class="verre pf-stats"><div><b>12</b>en commun</div><div><b>14</b>réalisations</div><div><b>4</b>attestations</div></div>
<div class="verre commun"><span class="avs"><span class="av c">AK</span><span class="av a">FN</span><span class="av">JM</span></span><span>Amani, Fatou et 10 autres connexions en commun</span></div>
<div class="seg"><span class="on">Réalisations</span><span>Parcours</span><span>Compétences</span></div>
{reals()}''', 'carriere')
P_DETAILS = ''.join([
    pl('Compétences', '<div class="comp"><span class="v">Power BI</span><span class="v">SQL</span><span>Excel</span><span>Présentation</span><span>Python</span></div>', note='Coche : vérifiée par un certificat Jumanly.'),
    pl('Ce que voit l’autre', f'''<div class="verre liste"><div class="li"><span class="cases c2">{ic("profil","s")}</span><div class="t"><b>Tout le monde</b><span>Nom, titre, réalisations publiques</span></div></div>
<div class="li"><span class="cases c1">{ic("connexion","s")}</span><div class="t"><b>Mes connexions</b><span>+ parcours complet, messages</span></div></div>
<div class="li"><span class="cases c3">{ic("entreprise","s")}</span><div class="t"><b>Recruteurs</b><span>+ CV, si je postule ou me rends visible</span></div></div></div>''',
       note='Chaque consultation par un recruteur est enregistrée et visible du talent.'),
])

# ---------- 11. Aperçu clair ----------
A_ACC = phone(f'''{tete("Bonjour, Grâce")}
<div class="verre rech">{ic("recherche","s")}<span>Rechercher une offre, une formation</span><a class="f">{ic("filtres","s")}</a></div>
<div class="verre carte etape compacte"><div class="corps"><span class="anneau"><b>70 %</b></span><div style="flex:1"><span class="k"><i></i>Prochaine étape</span><h3>Ajoutez 2 compétences</h3></div><a class="bt p s">{ic("suivant","xs")}</a></div></div>
{piliers()}
{groupe3()}''', 'accueil')
A_OPP = phone(f'''{tete("Opportunités")}
<div class="verre rech">{ic("recherche","s")}<span style="color:var(--texte)">Analyste · Kinshasa · CDI</span><a class="f">{ic("filtres","s")}<b>2</b></a></div>
<div class="seg"><span class="on">Pour vous</span><span>Enregistrées</span><span>Candidatures<small>3</small></span></div>
{offre('baobab','BF','sap','Analyste de données junior','Baobab Fintech','Kinshasa',['CDI','Hybride'],86)}
{offre('mwinda','ME','amb','Analyste énergie solaire','Mwinda Énergie','Kinshasa',['CDI'],79,True)}
{offre('fleuve','FB','mer','Chargée d’études marketing','Fleuve Banque','Kinshasa',['CDI'],72)}''', 'opportunites')
A_FOR = phone(f'''{tete("Se former")}
<div class="verre rech">{ic("recherche","s")}<span>Rechercher une formation</span><a class="f">{ic("filtres","s")}</a></div>
{formation('cv','Reprendre','Écrire un CV qui décroche un entretien','Module 2 sur 5 · Employabilité','8 min', barre=40)}
<div class="sec-t"><h2>Parcours d’employabilité</h2><a>Tout voir</a></div>
<div class="defile">{formation('entretien','Entretien','Réussir son entretien','5 modules','40 min','mini')}{formation('numerique','Numérique','Excel pour le travail','6 modules','1 h','mini')}{formation('savoir','Savoir-être','Travailler en équipe','4 modules','30 min','mini')}</div>''', 'former')
A_ORB = phone(f'''<div class="tete"><div class="or-tete" style="flex:1">{orbi(44)}<div class="t"><b>Orbi</b><span>Votre accompagnement</span></div></div><span class="verre credits">18 crédits</span></div>
<div class="aides"><div class="ai p1"><span class="cases">{ic("cv","s")}</span><b>Améliorer mon CV</b></div><div class="ai p2"><span class="cases">{ic("entretien","s")}</span><b>Préparer un entretien</b></div>
<div class="ai p3"><span class="cases">{ic("opportunites","s")}</span><b>Analyser une offre</b></div><div class="ai p4"><span class="cases">{ic("cap","s")}</span><b>Choisir ma voie</b></div></div>
<div class="bulle-u">Mon CV est-il prêt pour l’offre Baobab ?</div>
<div class="bulle-o">{orbi(32)}<div class="verre corps"><span>Presque. Il manque SQL avancé et une réalisation chiffrée.</span><div class="acts"><a class="bt p s">Corriger mon CV</a><a class="pq">{ic("pourquoi")}Pourquoi ?</a></div></div></div>''',
    'orbi', bas=f'<div style="position:absolute;left:16px;right:16px;bottom:118px;z-index:4"><div class="verre fort compo"><span>Écrire à Orbi</span><a class="bi">{ic("micro","s")}</a><a class="bi env">{ic("envoyer","s")}</a></div></div>')

def sombre(p):
    return p.replace('<div class="phone ', '<div class="phone sombre ', 1)

SECTIONS = [
 ('s1','1 · Identité des surfaces','La barre de votre référence devient la matière de toute l’application : pilule, verre clair, filet lumineux, ombre douce, rond central qui déborde.', [SURF], True),
 ('s2','2 · Icônes','51 icônes. Nouvelle icône Carrière : un sommet et son drapeau, le but qu’on atteint.', [pl('Carrière, nouvelle version', CARR), pl('Toutes les icônes', ICONES, 'l')], True),
 ('s3','3 · Couleurs et dégradés','Dégradés clairs pour les gestes forts et les piliers ; mode sombre en Nuit.', [pl('Palette', PAL, 'l'), pl('Règles', REGLES, 'l')], True),
 ('s4','4 · Barres du bas','Pilule flottante en clair et en sombre, talent et recruteur.', [NAVS], False),
 ('s5','5 · En-têtes et recherche','Mêmes surfaces en verre.', [TETES], False),
 ('s6','6 · Options','Toutes les formes d’options.', [OPTS], False),
 ('s7','7 · Boutons','Postuler : icône et texte sur la même ligne.', [BTS], True),
 ('s8','8 · Cartes','Bannières pour les offres et les formations, piliers en couleur.', [CARTES], True),
 ('s9','9 · Orbi','Sans dégradé sombre.', [ORBI], False),
 ('s10','10 · Profil','Mon profil et le profil vu par une autre personne.', [ecrans((P_MOI,'Mon profil','Couverture, objectif, complétude, réalisations.'),(P_AUTRE,'Le profil d’un autre','Se connecter ; message seulement après connexion.')), P_DETAILS], True),
 ('s11','11 · Aperçu en mode clair','Accueil, Opportunités (trois à l’écran), Se former, Orbi.', [ecrans((A_ACC,'Accueil','Prochaine étape, trois piliers, trois opportunités.'),(A_OPP,'Opportunités','Trois offres avec bannière à l’écran.'),(A_FOR,'Se former','Reprendre, puis les parcours avec bannière.'),(A_ORB,'Orbi','Quatre aides en couleur, la conversation.'))], True),
 ('s12','12 · Aperçu en mode sombre','Fond Nuit, mêmes couleurs de piliers, bouton principal Lime.', [ecrans((sombre(A_ACC),'Accueil',''),(sombre(A_OPP),'Opportunités',''),(sombre(A_FOR),'Se former',''),(sombre(P_AUTRE),'Profil d’un autre',''))], True),
]
som = ''.join(f'<li><a href="#{i}">{t.split(" · ")[1]}{"<span class=nouv>v2</span>" if n else ""}</a></li>' for i, t, _, _, n in SECTIONS)
corps = ''.join(bloc(i, t, d, *p) for i, t, d, p, _ in SECTIONS)
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Refonte mobile · fondations</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>{open(H + '/fondations.css').read()}</style></head><body>
<header class="couv"><span class="k">{orbi(22)}Jumanly · refonte mobile · étape 1</span><h1>Les fondations</h1>
<p>Version 2 du 18 octobre 2026, d’après vos retours : identité de la barre appliquée partout, icône Carrière, bannières, piliers en couleur, profil, modes clair et sombre. Contenus fictifs.</p>
<ul class="som">{som}</ul></header>{corps}<p class="fin">Jumanly · Learn. Grow. Connect.</p></body></html>'''
out = os.path.join(H, '..', 'refonte-mobile-fondations.html')
open(out, 'w').write(html); print(out, len(html))
